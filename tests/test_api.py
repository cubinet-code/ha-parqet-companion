"""Tests for the Parqet API client."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest

from homeassistant.exceptions import ConfigEntryAuthFailed

from custom_components.parqet.api import (
    ParqetApiClient,
    ParqetApiError,
    ParqetAuthError,
    ParqetConnectionError,
)


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
        mock_session.get.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "test_token")
        result = await client.async_get_user()

        assert result["userId"] == "abc"

    async def test_list_portfolios(self, mock_session: AsyncMock) -> None:
        """Test listing portfolios."""
        resp = _make_response(200, b'{"items": [{"id": "p1", "name": "Test"}]}')
        mock_session.get.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "test_token")
        result = await client.async_list_portfolios()

        assert len(result) == 1
        assert result[0]["id"] == "p1"

    async def test_get_performance(self, mock_session: AsyncMock) -> None:
        """Test fetching performance data."""
        resp = _make_response(200, b'{"performance": {}, "holdings": []}')
        mock_session.post.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "test_token")
        result = await client.async_get_performance(["p1"], "max")

        assert "performance" in result

    async def test_auth_error_on_401(self, mock_session: AsyncMock) -> None:
        """Test that 401 raises ParqetAuthError."""
        resp = _make_response(401, b"Unauthorized")
        mock_session.get.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "bad_token")

        with pytest.raises(ParqetAuthError):
            await client.async_get_user()

    async def test_permission_error_on_403(self, mock_session: AsyncMock) -> None:
        """Test that 403 raises ParqetApiError (not auth — reauth won't help)."""
        resp = _make_response(403, b"Forbidden")
        mock_session.get.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "bad_token")

        with pytest.raises(ParqetApiError, match="Insufficient permissions"):
            await client.async_get_user()

    async def test_server_error_on_500(self, mock_session: AsyncMock) -> None:
        """Test that 500 raises ParqetConnectionError."""
        resp = _make_response(500, b"Internal Server Error")
        mock_session.get.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "token")

        with pytest.raises(ParqetConnectionError):
            await client.async_get_user()

    async def test_client_error_raises_connection_error(
        self, mock_session: AsyncMock
    ) -> None:
        """Test that aiohttp client errors raise ParqetConnectionError."""
        mock_session.get.side_effect = aiohttp.ClientError("Connection failed")

        client = ParqetApiClient(mock_session, "token")

        with pytest.raises(ParqetConnectionError):
            await client.async_get_user()

    async def test_api_error_on_400(self, mock_session: AsyncMock) -> None:
        """Test that 400 raises ParqetApiError."""
        resp = _make_response(400, b'{"error": "bad request"}')
        mock_session.post.return_value.__aenter__.return_value = resp

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
        mock_session.get.return_value.__aenter__.return_value = resp

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
        mock_session.get.return_value.__aenter__.return_value = resp

        client = ParqetApiClient(mock_session, "token")
        await client.async_get_activities(
            "p1", activity_type=["buy", "sell"], limit=50, cursor="abc123"
        )

        call_args = mock_session.get.call_args
        url = call_args[0][0]
        assert "activityType=buy" in url
        assert "activityType=sell" in url
        assert "limit=50" in url
        assert "cursor=abc123" in url
