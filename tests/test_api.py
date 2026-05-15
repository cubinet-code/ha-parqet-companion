"""Tests for the Parqet API client."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import aiohttp
import pytest
from homeassistant.exceptions import ConfigEntryAuthFailed

from custom_components.parqet.api import (
    ParqetAccessDeniedError,
    ParqetApiClient,
    ParqetApiError,
    ParqetAuthError,
    ParqetConnectionError,
)

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

    async def test_429_response_at_token_endpoint_is_connection_error(
        self, mock_session: AsyncMock
    ) -> None:
        """429 on /oauth2/token is transient — the user can't fix a rate
        limit by re-authenticating, so it must NOT route to reauth.
        """
        mock_session.request.side_effect = token_endpoint_response_error(429)

        client = ParqetApiClient(mock_session, "token")

        with pytest.raises(ParqetConnectionError):
            await client.async_get_performance(["p1"])

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
