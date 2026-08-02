"""Tests for the Parqet API client."""

from __future__ import annotations

import time
from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed

from custom_components.parqet.api import (
    DEFAULT_RATE_LIMIT_COOLDOWN,
    MAX_RATE_LIMIT_COOLDOWN,
    ParqetAccessDeniedError,
    ParqetApiClient,
    ParqetApiError,
    ParqetAuthError,
    ParqetConnectionError,
    ParqetRateLimitError,
    RateLimitState,
    _handle_response,
)
from custom_components.parqet.rate_limit import async_get_rate_limit_state

from .conftest import token_endpoint_response_error


@pytest.fixture
def mock_session() -> AsyncMock:
    """Create a mock aiohttp session."""
    return AsyncMock(spec=aiohttp.ClientSession)


def _make_response(status: int, body: bytes = b"{}") -> MagicMock:
    """Create a mock aiohttp response."""
    resp = MagicMock(spec=aiohttp.ClientResponse)
    resp.status = status
    resp.read = AsyncMock(return_value=body)
    return resp


class TestParqetApiClient:
    """Test the Parqet API client."""

    async def test_get_user(self, mock_session: AsyncMock) -> None:
        """Test fetching user info."""
        resp = _make_response(200, b'{"userId": "abc", "state": "active"}')
        mock_session.request.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "test_token")
        result = await client.async_get_user()

        assert result["userId"] == "abc"

    async def test_list_portfolios(self, mock_session: AsyncMock) -> None:
        """Test listing portfolios."""
        resp = _make_response(200, b'{"items": [{"id": "p1", "name": "Test"}]}')
        mock_session.request.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "test_token")
        result = await client.async_list_portfolios()

        assert len(result) == 1
        assert result[0]["id"] == "p1"

    async def test_get_performance(self, mock_session: AsyncMock) -> None:
        """Test fetching performance data."""
        resp = _make_response(200, b'{"performance": {}, "holdings": []}')
        mock_session.request.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "test_token")
        result = await client.async_get_performance(["p1"], "max")

        assert "performance" in result

    async def test_auth_error_on_401(self, mock_session: AsyncMock) -> None:
        """Test that 401 raises ParqetAuthError."""
        resp = _make_response(401, b"Unauthorized")
        mock_session.request.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "bad_token")

        with pytest.raises(ParqetAuthError):
            await client.async_get_user()

    async def test_permission_error_on_403(self, mock_session: AsyncMock) -> None:
        """Test that 403 raises ParqetAccessDeniedError (subclass of ParqetApiError).

        Distinct from 401 because the token is valid — the user must reconfigure
        which portfolios are tracked, not re-authenticate.
        """
        resp = _make_response(403, b"Forbidden")
        mock_session.request.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "bad_token")

        with pytest.raises(ParqetAccessDeniedError, match="Access denied"):
            await client.async_get_user()

        # Subclass relationship preserves any existing `except ParqetApiError`
        # handlers — they keep catching this, just with more specific typing
        # available when needed.
        assert issubclass(ParqetAccessDeniedError, ParqetApiError)

    async def test_server_error_on_500(self, mock_session: AsyncMock) -> None:
        """Test that 500 raises ParqetConnectionError."""
        resp = _make_response(500, b"Internal Server Error")
        mock_session.request.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "token")

        with pytest.raises(ParqetConnectionError):
            await client.async_get_user()

    async def test_client_error_raises_connection_error(
        self, mock_session: AsyncMock
    ) -> None:
        """Test that aiohttp client errors raise ParqetConnectionError."""
        mock_session.request.side_effect = aiohttp.ClientError("Connection failed")

        client = ParqetApiClient(mock_session, "token")

        with pytest.raises(ParqetConnectionError):
            await client.async_get_user()

    async def test_non_response_client_error_at_token_endpoint_is_connection_error(
        self, mock_session: AsyncMock
    ) -> None:
        """A non-response ClientError (e.g. socket disconnect mid-refresh) at
        /oauth2/token stays transient: ParqetConnectionError with a label that
        explains the failure happened before the resource call (Issue #6).
        """
        from yarl import URL

        request_info = MagicMock()
        request_info.url = URL("https://connect.parqet.com/oauth2/token")
        err = aiohttp.ClientError("invalid_grant")
        err.request_info = request_info  # type: ignore[attr-defined]
        mock_session.request.side_effect = err

        client = ParqetApiClient(mock_session, "token")

        with pytest.raises(ParqetConnectionError) as exc_info:
            await client.async_get_performance(["p1"])

        assert "Token refresh failed" in str(exc_info.value)
        assert "/performance" in str(exc_info.value)

    @pytest.mark.parametrize("status", [400, 401, 403])
    async def test_4xx_response_at_token_endpoint_is_auth_error(
        self, mock_session: AsyncMock, status: int
    ) -> None:
        """4xx (excl. 429) from /oauth2/token must raise ParqetAuthError so
        the coordinator can drive HA into the reauth flow. Today Parqet
        rejects expired refresh tokens with 400 — this is the path that
        ensures the user sees a reauth banner instead of looping errors.
        """
        mock_session.request.side_effect = token_endpoint_response_error(status)

        client = ParqetApiClient(mock_session, "token")

        with pytest.raises(ParqetAuthError, match=f"{status}"):
            await client.async_get_performance(["p1"])

    async def test_429_response_at_token_endpoint_is_rate_limit_error(
        self, mock_session: AsyncMock
    ) -> None:
        """429 on /oauth2/token is a rate limit, not a credential problem.

        It must NOT route to reauth — re-authenticating cannot clear a rate
        limit — and it must surface as ParqetRateLimitError so `retry_after`
        and the card's rate-limit banner work for the token path too.
        """
        mock_session.request.side_effect = token_endpoint_response_error(429)

        state = RateLimitState()
        client = ParqetApiClient(mock_session, "token", rate_limit=state)

        with pytest.raises(ParqetRateLimitError):
            await client.async_get_performance(["p1"])

        assert not issubclass(ParqetRateLimitError, ParqetAuthError)
        assert state.remaining() > 0

    async def test_5xx_response_at_token_endpoint_is_connection_error(
        self, mock_session: AsyncMock
    ) -> None:
        """5xx on /oauth2/token is transient — coordinator backoff handles it."""
        mock_session.request.side_effect = token_endpoint_response_error(503)

        client = ParqetApiClient(mock_session, "token")

        with pytest.raises(ParqetConnectionError):
            await client.async_get_performance(["p1"])

    async def test_4xx_response_at_resource_endpoint_is_not_misrouted(
        self, mock_session: AsyncMock
    ) -> None:
        """A 4xx ClientResponseError from a resource endpoint must NOT be
        treated as a token-refresh-reauth condition — the URL check is the
        invariant that prevents misrouting. Guards against future refactors.
        """
        from yarl import URL

        request_info = MagicMock()
        request_info.url = URL("https://connect.parqet.com/portfolios/abc/activities")
        err = aiohttp.ClientResponseError(
            request_info=request_info,
            history=(),
            status=400,
            message="Bad Request",
        )
        mock_session.request.side_effect = err

        client = ParqetApiClient(mock_session, "token")

        with pytest.raises(ParqetConnectionError):
            await client.async_get_activities("abc")

    async def test_api_error_on_400(self, mock_session: AsyncMock) -> None:
        """Test that 400 raises ParqetApiError."""
        resp = _make_response(400, b'{"error": "bad request"}')
        mock_session.request.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "token")

        with pytest.raises(ParqetApiError):
            await client.async_get_performance(["p1"])

    async def test_oauth_session_token_refresh(self) -> None:
        """Test that OAuth2Session token is refreshed before requests."""
        mock_oauth = AsyncMock()
        mock_oauth.token = {"access_token": "refreshed_token"}
        mock_oauth.async_ensure_token_valid = AsyncMock()

        mock_session = AsyncMock(spec=aiohttp.ClientSession)
        resp = _make_response(200, b'{"userId": "abc"}')
        mock_session.request.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, oauth_session=mock_oauth)
        await client.async_get_user()

        mock_oauth.async_ensure_token_valid.assert_called_once()

    async def test_token_refresh_failure_raises_auth_error(self) -> None:
        """Test that a failed token refresh raises ParqetAuthError."""
        mock_oauth = AsyncMock()
        mock_oauth.async_ensure_token_valid = AsyncMock(
            side_effect=ConfigEntryAuthFailed("Refresh token expired")
        )

        mock_session = AsyncMock(spec=aiohttp.ClientSession)
        client = ParqetApiClient(mock_session, oauth_session=mock_oauth)

        with pytest.raises(ParqetAuthError, match="Token refresh failed"):
            await client.async_get_user()

    async def test_token_refresh_network_error_raises_connection_error(self) -> None:
        """Test that a network error during token refresh raises ParqetConnectionError."""
        mock_oauth = AsyncMock()
        mock_oauth.async_ensure_token_valid = AsyncMock(
            side_effect=aiohttp.ClientError("Connection refused")
        )

        mock_session = AsyncMock(spec=aiohttp.ClientSession)
        client = ParqetApiClient(mock_session, oauth_session=mock_oauth)

        with pytest.raises(ParqetConnectionError):
            await client.async_get_user()

    async def test_activities_query_params(self, mock_session: AsyncMock) -> None:
        """Test that activities endpoint builds query params correctly."""
        resp = _make_response(200, b'{"activities": [], "cursor": null}')
        mock_session.request.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "token")
        await client.async_get_activities(
            "p1", activity_type=["buy", "sell"], limit=50, cursor="abc123"
        )

        call_args = mock_session.request.call_args
        params = call_args[1]["params"]
        assert params["activityType"] == ["buy", "sell"]
        assert params["limit"] == "50"
        assert params["cursor"] == "abc123"


class TestRateLimitGate:
    """The client must stop sending while a 429 penalty is outstanding."""

    async def test_a_real_429_arms_the_shared_pause(self) -> None:
        """A live 429 must arm the pause, not merely be logged and re-raised."""
        resp = MagicMock(status=429, headers={})
        resp.read = AsyncMock(
            return_value=b'{"message": "Try again in 300 seconds."}'
        )
        ctx = MagicMock()
        ctx.__aenter__ = AsyncMock(return_value=resp)
        ctx.__aexit__ = AsyncMock(return_value=False)
        session = MagicMock()
        session.request.return_value = ctx

        state = RateLimitState()
        client = ParqetApiClient(session, access_token="tok", rate_limit=state)
        assert state.remaining() == 0

        with pytest.raises(ParqetRateLimitError):
            await client.async_get_performance(["p1"])

        assert 290 < state.remaining() <= 300

        # A replacement client, as HA builds on the next setup retry, is paused
        # before it reaches the network.
        session.request.reset_mock()
        replacement = ParqetApiClient(session, access_token="tok", rate_limit=state)
        with pytest.raises(ParqetRateLimitError):
            await replacement.async_get_performance(["p1"])
        session.request.assert_not_called()

    async def test_paused_client_makes_no_network_call(self) -> None:
        """While paused, requests must fail locally with no socket traffic."""
        session = MagicMock()
        session.request.side_effect = AssertionError("must not reach the network")
        state = RateLimitState()
        state.arm(120)
        client = ParqetApiClient(session, access_token="tok", rate_limit=state)

        with (
            patch.object(client, "_get_access_token", AsyncMock(return_value="t")),
            pytest.raises(ParqetRateLimitError) as err,
        ):
            await client.async_get_performance(["p1"])

        session.request.assert_not_called()
        assert 0 < err.value.retry_after <= 120

    def test_pause_expires(self) -> None:
        """Once the window passes, requests are allowed through again."""
        state = RateLimitState(until=time.monotonic() - 1)
        assert state.remaining() == 0

    def test_missing_duration_falls_back_to_cooldown(self) -> None:
        """A 429 with no stated delay must still pause, not resume at once."""
        state = RateLimitState()
        assert state.arm(0) == DEFAULT_RATE_LIMIT_COOLDOWN
        assert state.remaining() > 0

    def test_absurd_duration_is_capped(self) -> None:
        """A hostile Retry-After must not brick the client indefinitely."""
        state = RateLimitState()
        assert state.arm(999999999) == MAX_RATE_LIMIT_COOLDOWN

    def test_arm_never_shortens_an_existing_pause(self) -> None:
        """A later, shorter 429 must not let us resume early."""
        state = RateLimitState()
        state.arm(600)
        before = state.remaining()
        state.arm(5)
        assert state.remaining() >= before - 1

    def test_shared_state_is_per_installation(self, hass: HomeAssistant) -> None:
        """Every client for the installation observes the same pause."""
        first = async_get_rate_limit_state(hass)
        first.arm(300)
        assert async_get_rate_limit_state(hass) is first
        assert async_get_rate_limit_state(hass).remaining() > 0


class TestRetryAfterParsing:
    """Retry-After must be read from either source without exploding."""

    @pytest.mark.parametrize(
        ("header", "body", "expected"),
        [
            ("30", b'{"message": "Try again in 438 seconds."}', 438),
            ("600", b'{"message": "Try again in 438 seconds."}', 600),
            (None, b'{"message": "Try again in 438 seconds."}', 438),
            ("\u00b2", b"{}", 0),
            ("Wed, 21 Oct 2026 07:28:00 GMT", b"{}", 0),
            (None, b"not json", 0),
            (None, b'{"message": 438}', 0),
            (None, b"{}", 0),
        ],
    )
    def test_parsing(self, header, body, expected) -> None:
        """Malformed values degrade to 0 rather than raising."""
        headers = {"Retry-After": header} if header is not None else {}
        resp = MagicMock(status=429, headers=headers)
        with pytest.raises(ParqetRateLimitError) as err:
            _handle_response(resp, body)
        assert err.value.retry_after == expected
