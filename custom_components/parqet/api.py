"""Async API client for Parqet Connect."""

from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from dataclasses import dataclass
from math import ceil
from typing import TYPE_CHECKING, Any, TypeGuard

import aiohttp
from homeassistant.exceptions import ConfigEntryAuthFailed

from .const import API_BASE_URL

if TYPE_CHECKING:
    from homeassistant.helpers.config_entry_oauth2_flow import OAuth2Session

_LOGGER = logging.getLogger(__name__)

# Used when Parqet returns 429 without saying how long to wait. Long enough to
# break a retry loop, short enough that recovery is not needlessly delayed when
# the real penalty was brief.
DEFAULT_RATE_LIMIT_COOLDOWN = 60

# Ceiling on a self-imposed pause. Protects against a malformed or hostile
# Retry-After (e.g. 999999999) permanently bricking the client.
MAX_RATE_LIMIT_COOLDOWN = 900


@dataclass
class RateLimitState:
    """A 429 penalty deadline shared by every client for an installation.

    Deliberately *not* per-client. Home Assistant builds a fresh
    ParqetApiClient on each `async_setup_entry`, and retries setup on
    ConfigEntryNotReady, so instance state is discarded on exactly the retry
    path the pause exists to stop.
    """

    until: float = 0.0

    def remaining(self) -> int:
        """Seconds left on the pause, 0 if none."""
        return max(0, ceil(self.until - time.monotonic()))

    def arm(self, retry_after: int) -> int:
        """Start or extend the pause; returns the seconds now remaining.

        Returns the *effective* remaining time, not the requested delay — a
        later, shorter 429 must not make the log claim the pause got shorter.
        """
        seconds = min(
            retry_after or DEFAULT_RATE_LIMIT_COOLDOWN, MAX_RATE_LIMIT_COOLDOWN
        )
        self.until = max(self.until, time.monotonic() + seconds)
        return self.remaining()


class ParqetApiError(Exception):
    """Base exception for Parqet API errors."""


class ParqetAuthError(ParqetApiError):
    """Authentication failure (401). The token is invalid — reauth required."""


class ParqetAccessDeniedError(ParqetApiError):
    """Access denied (403). The token is valid but the resource is gone or not granted.

    Typically raised when a portfolio has been deleted on Parqet's side or when
    the OAuth installation no longer has permission for it. Reauth alone won't
    fix this — the user needs to reconfigure which portfolios are tracked.
    """


class ParqetConnectionError(ParqetApiError):
    """Connection or server error."""


class ParqetRateLimitError(ParqetApiError):
    """Rate limit exceeded (429)."""

    def __init__(self, retry_after: int = 0) -> None:
        super().__init__(f"Rate limit exceeded (retry in {retry_after}s)")
        self.retry_after = retry_after


class ParqetApiClient:
    """Async client for the Parqet Connect REST API.

    Supports two modes:
    - Config flow: raw aiohttp session + static access_token
    - Coordinator: HA OAuth2Session with automatic token refresh
    """

    def __init__(
        self,
        session: aiohttp.ClientSession,
        access_token: str | None = None,
        oauth_session: OAuth2Session | None = None,
        rate_limit: RateLimitState | None = None,
    ) -> None:
        """Initialize the API client.

        `rate_limit` should be the installation-wide state so a 429 pauses
        every client, including ones built by later setup retries. A private
        state is used when none is supplied, which suits one-shot use.
        """
        self._session = session
        self._access_token = access_token
        self._oauth_session = oauth_session
        self._rate_limit = rate_limit or RateLimitState()

    def _pause(self, retry_after: int, source: str) -> None:
        """Arm the shared pause and say so once, from either 429 path."""
        _LOGGER.warning(
            "Parqet rate limit hit (%s); pausing all requests for %ss",
            source,
            self._rate_limit.arm(retry_after),
        )

    async def _get_access_token(self) -> str:
        """Get a valid access token, refreshing if needed."""
        if self._oauth_session is not None:
            await self._oauth_session.async_ensure_token_valid()
            return self._oauth_session.token["access_token"]
        return self._access_token or ""

    async def _request(
        self,
        method: str,
        path: str,
        *,
        data: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> Any:
        """Make an authenticated request to the Parqet API."""
        # Refuse locally while a 429 penalty is outstanding. Without this a
        # rate-limited setup is retried by HA at 5, 10, 20, 40, 80, 80... s,
        # spending `1 + portfolios` requests per attempt and never recovering
        # inside the window. Every caller already handles ParqetRateLimitError.
        if (remaining := self._rate_limit.remaining()) > 0:
            _LOGGER.debug(
                "Skipping %s %s — rate limited for another %ss", method, path, remaining
            )
            raise ParqetRateLimitError(remaining)

        url = f"{API_BASE_URL}{path}"
        try:
            async with asyncio.timeout(30):
                token = await self._get_access_token()
                headers: dict[str, str] = {
                    "Authorization": f"Bearer {token}",
                }
                kwargs: dict[str, Any] = {"headers": headers}
                if data is not None:
                    headers["Content-Type"] = "application/json"
                    kwargs["json"] = data
                if params is not None:
                    kwargs["params"] = params
                async with self._session.request(
                    method, url, **kwargs
                ) as resp:
                    body = await resp.read()
                    return _handle_response(resp, body)
        except TimeoutError as err:
            raise ParqetConnectionError(
                f"Timeout {method} {path}"
            ) from err
        except ConfigEntryAuthFailed as err:
            raise ParqetAuthError(
                f"Token refresh failed: {err}"
            ) from err
        except ParqetRateLimitError as err:
            # Remember the penalty so sibling coordinators, later setup
            # retries and the config flow all stop spending requests until it
            # expires.
            self._pause(err.retry_after, "API")
            raise
        except ParqetApiError:
            raise
        except aiohttp.ClientError as err:
            # Token refresh is itself a request to Parqet, so a 429 from it has
            # to arm the pause too — otherwise it keeps hammering
            # /oauth2/token throughout the penalty. Confirm the origin via
            # `_failing_url` rather than the status alone, so a 429 from
            # anywhere else cannot pause the whole installation.
            failing_url = _failing_url(err)
            if (
                getattr(err, "status", None) == 429
                and failing_url
                and failing_url.endswith("/oauth2/token")
            ):
                # Token refresh is itself a request to Parqet, so surface it as
                # the same rate-limit error a resource call would raise. That
                # keeps `retry_after` and the card's rate-limit banner working
                # for this path, and it still never routes to reauth — a rate
                # limit is not something re-authenticating fixes.
                retry_after = _retry_after_seconds(
                    (getattr(err, "headers", None) or {}).get("Retry-After")
                )
                self._pause(retry_after, "token refresh")
                raise ParqetRateLimitError(retry_after) from err
            # `aiohttp.ClientError` may originate from the OAuth token endpoint
            # via `OAuth2Session.async_ensure_token_valid()` rather than the
            # resource call this method is making. When it does, the failing
            # URL is /oauth2/token, NOT `path`. Distinguish two failure modes:
            # a 4xx response from the token endpoint means Parqet has rejected
            # the stored credentials — reauth is the only recovery, so surface
            # it as ParqetAuthError. Everything else (5xx, 429, socket errors)
            # stays transient.
            if is_token_endpoint_reauth_error(err):
                _LOGGER.info(
                    "Parqet rejected token refresh (status=%s); reauth required",
                    err.status,
                )
                raise ParqetAuthError(
                    f"Token refresh rejected by Parqet "
                    f"({err.status}); reauth required"
                ) from err
            if failing_url and failing_url.endswith("/oauth2/token"):
                raise ParqetConnectionError(
                    f"Token refresh failed before {method} {path}: {err}"
                ) from err
            raise ParqetConnectionError(
                f"Connection error {method} {path}: {err}"
            ) from err

    async def _get(
        self, path: str, *, params: dict[str, Any] | None = None
    ) -> Any:
        """Make a GET request to the Parqet API."""
        return await self._request("GET", path, params=params)

    async def _post(self, path: str, data: dict[str, Any]) -> Any:
        """Make a POST request to the Parqet API."""
        return await self._request("POST", path, data=data)

    # ─── Endpoints ────────────────────────────────────────────────────────────

    async def async_get_user(self) -> dict[str, Any]:
        """GET /user — fetch authenticated user info."""
        return await self._get("/user")

    async def async_list_portfolios(self) -> list[dict[str, Any]]:
        """GET /portfolios — list all portfolios."""
        data = await self._get("/portfolios")
        return data.get("items", [])

    async def async_get_performance(
        self,
        portfolio_ids: list[str],
        interval: str = "max",
    ) -> dict[str, Any]:
        """POST /performance — fetch portfolio performance data."""
        return await self._post(
            "/performance",
            {
                "portfolioIds": portfolio_ids,
                "interval": {"type": "relative", "value": interval},
            },
        )

    async def async_get_activities(
        self,
        portfolio_id: str,
        *,
        activity_type: list[str] | None = None,
        limit: int = 25,  # API default is 100; lower for card UI responsiveness
        cursor: str | None = None,
    ) -> dict[str, Any]:
        """GET /portfolios/{id}/activities — fetch transaction history."""
        params: dict[str, Any] = {}
        if activity_type:
            params["activityType"] = activity_type
        if limit:
            params["limit"] = str(limit)
        if cursor:
            params["cursor"] = cursor

        return await self._get(
            f"/portfolios/{portfolio_id}/activities", params=params or None
        )


def _failing_url(err: aiohttp.ClientError) -> str | None:
    """Best-effort extraction of the URL path that produced an aiohttp error.

    aiohttp attaches `request_info` on most ClientResponseError-derived
    exceptions but not on every ClientError; return None when unavailable.
    """
    request_info = getattr(err, "request_info", None)
    url = getattr(request_info, "url", None)
    path = getattr(url, "path", None)
    return path if isinstance(path, str) else None


def is_token_endpoint_reauth_error(
    err: aiohttp.ClientError,
) -> TypeGuard[aiohttp.ClientResponseError]:
    """True iff `err` is a 4xx (excluding 429) from /oauth2/token.

    4xx at the token endpoint means the stored credentials are no longer
    accepted — only reauth fixes it. 429 is excluded because rate-limiting
    a refresh is not user-actionable; the coordinator's backoff handles it.
    5xx and non-response ClientErrors stay transient.

    Newer HA wraps this case in `OAuth2TokenRequestReauthError`, a subclass
    of `aiohttp.ClientResponseError` — the structural check catches both
    that and the raw `ClientResponseError` raised by older HA versions.

    Returns a `TypeGuard` so callers can read `err.status` without casts.
    """
    if not isinstance(err, aiohttp.ClientResponseError):
        return False
    if err.status == 429 or not 400 <= err.status < 500:
        return False
    failing_url = _failing_url(err)
    return bool(failing_url and failing_url.endswith("/oauth2/token"))


def _retry_after_seconds(value: str | None) -> int:
    """Parse a Retry-After header into whole seconds, 0 if unusable.

    Only the delta-seconds form is understood. The HTTP-date form is legal but
    Parqet has never been seen to send it, and guessing a clock skew is worse
    than falling back to the default cooldown.
    """
    if not value:
        return 0
    try:
        return max(0, int(value.strip()))
    except ValueError:
        return 0


def _retry_after_from_body(body: bytes) -> int:
    """Parse "Try again in 438 seconds." out of a 429 body, 0 if absent."""
    try:
        message = json.loads(body).get("message")
    except (ValueError, AttributeError):
        return 0
    if not isinstance(message, str):
        return 0
    match = re.search(r"(\d+)\s*seconds", message)
    return int(match.group(1)) if match else 0


def _handle_response(resp: aiohttp.ClientResponse, body: bytes) -> Any:
    """Check response status and return parsed JSON."""
    if resp.status == 401:
        raise ParqetAuthError(
            f"Authentication failed ({resp.status})"
        )
    if resp.status == 403:
        raise ParqetAccessDeniedError(
            f"Access denied ({resp.status}) — portfolio may have been deleted or "
            f"access revoked on Parqet"
        )
    if resp.status == 429:
        # Parqet states the delay in the JSON body; the header is the documented
        # convention and costs nothing to honour. Take the longer of the two so
        # neither source under-reports and we resume early.
        raise ParqetRateLimitError(
            max(
                _retry_after_seconds(resp.headers.get("Retry-After")),
                _retry_after_from_body(body),
            )
        )
    if resp.status >= 500:
        raise ParqetConnectionError(
            f"Server error ({resp.status})"
        )
    if resp.status >= 400:
        raise ParqetApiError(
            f"API error ({resp.status}): {body.decode('utf-8', errors='replace')}"
        )
    try:
        return json.loads(body)
    except json.JSONDecodeError as err:
        raise ParqetApiError(
            f"Invalid JSON response ({resp.status})"
        ) from err
