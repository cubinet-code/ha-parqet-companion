"""Async API client for Parqet Connect."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import TYPE_CHECKING, Any

import aiohttp
from homeassistant.exceptions import ConfigEntryAuthFailed

from .const import API_BASE_URL

if TYPE_CHECKING:
    from homeassistant.helpers.config_entry_oauth2_flow import OAuth2Session

_LOGGER = logging.getLogger(__name__)


class ParqetApiError(Exception):
    """Base exception for Parqet API errors."""


class ParqetAuthError(ParqetApiError):
    """Authentication or authorization error (401/403)."""


class ParqetConnectionError(ParqetApiError):
    """Connection or server error."""


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
    ) -> None:
        """Initialize the API client."""
        self._session = session
        self._access_token = access_token
        self._oauth_session = oauth_session

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
        except ParqetApiError:
            raise
        except aiohttp.ClientError as err:
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


def _handle_response(resp: aiohttp.ClientResponse, body: bytes) -> Any:
    """Check response status and return parsed JSON."""
    if resp.status == 401:
        raise ParqetAuthError(
            f"Authentication failed ({resp.status})"
        )
    if resp.status == 403:
        raise ParqetApiError(
            f"Insufficient permissions ({resp.status})"
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
