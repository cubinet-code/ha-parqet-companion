"""Tests for the Parqet config flow."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from .conftest import (
    MOCK_PORTFOLIO_ID,
    MOCK_PORTFOLIO_NAME,
    MOCK_USER_INFO,
)

MANIFEST_PATH = Path("custom_components/parqet/manifest.json")


@pytest.fixture(autouse=True)
def _clear_manifest_deps():
    """Remove frontend/http deps from manifest for config flow tests."""
    original = MANIFEST_PATH.read_text()
    data = json.loads(original)
    data["dependencies"] = []
    MANIFEST_PATH.write_text(json.dumps(data))
    yield
    MANIFEST_PATH.write_text(original)


async def test_reauth_flow_shows_confirm(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Test the reauth flow shows confirmation form."""
    result = await mock_config_entry.start_reauth_flow(hass)
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "reauth_confirm"


async def test_reauth_confirm_proceeds(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Test confirming reauth proceeds to user/OAuth step."""
    result = await mock_config_entry.start_reauth_flow(hass)

    with patch(
        "custom_components.parqet.config_flow.config_entry_oauth2_flow"
        ".async_get_implementations",
        return_value={"parqet": AsyncMock()},
    ):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], user_input={}
        )
    assert result["type"] in (
        FlowResultType.FORM,
        FlowResultType.EXTERNAL_STEP,
        FlowResultType.ABORT,
    )


async def test_reauth_updates_token_in_place(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_setup_entry: AsyncMock,
) -> None:
    """Reauth keeps the account entry and refreshes only the OAuth token.

    v2 has one account entry whose portfolios are devices. A reauth must not
    destroy entry/devices/history — it just updates credentials in place.
    """
    entry_id = mock_config_entry.entry_id
    assert hass.config_entries.async_get_entry(entry_id) is not None
    original_portfolio_ids = list(mock_config_entry.data["portfolio_ids"])

    new_oauth_data = {
        "auth_implementation": "parqet",
        "token": {
            "access_token": "fresh_token",
            "refresh_token": "fresh_refresh",
            "expires_in": 3600,
        },
    }

    result = await mock_config_entry.start_reauth_flow(hass)
    assert result["step_id"] == "reauth_confirm"

    flow = hass.config_entries.flow._progress.get(result["flow_id"])
    assert flow is not None

    with patch(
        "custom_components.parqet.config_flow.aiohttp_client.async_get_clientsession",
    ), patch(
        "custom_components.parqet.config_flow.ParqetApiClient",
    ) as mock_api_cls:
        mock_api = mock_api_cls.return_value
        mock_api.async_get_user = AsyncMock(return_value=MOCK_USER_INFO)
        mock_api.async_list_portfolios = AsyncMock(
            return_value=[
                {
                    "id": MOCK_PORTFOLIO_ID,
                    "name": MOCK_PORTFOLIO_NAME,
                    "currency": "EUR",
                }
            ]
        )

        result = await flow.async_oauth_create_entry(new_oauth_data)

    refreshed = hass.config_entries.async_get_entry(entry_id)
    assert refreshed is not None
    assert refreshed.data["token"]["access_token"] == "fresh_token"
    assert refreshed.data["portfolio_ids"] == original_portfolio_ids
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reauth_successful"


# ─── Reconfigure flow (re-pick portfolios without re-authenticating) ──────────


async def _start_reconfigure(
    hass: HomeAssistant, entry: MockConfigEntry, live_portfolios: list[dict]
) -> dict:
    """Drive `async_step_reconfigure` with a mocked API listing `live_portfolios`."""
    with (
        patch(
            "custom_components.parqet.config_flow.config_entry_oauth2_flow"
            ".async_get_config_entry_implementation",
            return_value=AsyncMock(),
        ),
        patch(
            "custom_components.parqet.config_flow.config_entry_oauth2_flow.OAuth2Session",
            return_value=AsyncMock(token={"access_token": "valid"}),
        ),
        patch(
            "custom_components.parqet.config_flow.aiohttp_client.async_get_clientsession",
        ),
        patch(
            "custom_components.parqet.config_flow.ParqetApiClient",
        ) as mock_api_cls,
    ):
        mock_api = mock_api_cls.return_value
        mock_api.async_list_portfolios = AsyncMock(return_value=live_portfolios)
        return await entry.start_reconfigure_flow(hass)


async def test_reconfigure_shows_picker_with_current_selection_preticked(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Opening Reconfigure should land on the portfolio picker step."""
    new_portfolio = {"id": "new_pid_999", "name": "New One", "currency": "EUR"}
    result = await _start_reconfigure(
        hass,
        mock_config_entry,
        live_portfolios=[
            {
                "id": MOCK_PORTFOLIO_ID,
                "name": MOCK_PORTFOLIO_NAME,
                "currency": "EUR",
            },
            new_portfolio,
        ],
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "pick_portfolio"


async def test_reconfigure_updates_entry_with_new_selection(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_setup_entry: AsyncMock,
) -> None:
    """Picking a different set of portfolios rewrites entry.data, keeps token."""
    original_token = mock_config_entry.data["token"]
    new_portfolio = {"id": "new_pid_999", "name": "New One", "currency": "EUR"}

    result = await _start_reconfigure(
        hass,
        mock_config_entry,
        live_portfolios=[
            {
                "id": MOCK_PORTFOLIO_ID,
                "name": MOCK_PORTFOLIO_NAME,
                "currency": "EUR",
            },
            new_portfolio,
        ],
    )
    submission = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={"portfolio_ids": ["new_pid_999"]},
    )

    assert submission["type"] is FlowResultType.ABORT
    assert submission["reason"] == "reconfigure_successful"

    updated = hass.config_entries.async_get_entry(mock_config_entry.entry_id)
    assert updated.data["portfolio_ids"] == ["new_pid_999"]
    assert "new_pid_999" in updated.data["portfolio_meta"]
    # Token is preserved — reconfigure must not force a re-auth.
    assert updated.data["token"] == original_token


async def test_reconfigure_aborts_when_account_has_no_portfolios(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """If Parqet has zero portfolios, abort with `no_portfolios` (not a blank picker)."""
    result = await _start_reconfigure(
        hass, mock_config_entry, live_portfolios=[]
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "no_portfolios"


# ─── Reconfigure token-refresh failure routing ─────────────────────────────────


async def _start_reconfigure_with_refresh_error(
    hass: HomeAssistant,
    entry: MockConfigEntry,
    err: Exception,
) -> dict:
    """Drive `async_step_reconfigure` where the token refresh raises `err`."""
    oauth_session = AsyncMock(token={"access_token": "stale"})
    oauth_session.async_ensure_token_valid = AsyncMock(side_effect=err)

    with (
        patch(
            "custom_components.parqet.config_flow.config_entry_oauth2_flow"
            ".async_get_config_entry_implementation",
            return_value=AsyncMock(),
        ),
        patch(
            "custom_components.parqet.config_flow.config_entry_oauth2_flow.OAuth2Session",
            return_value=oauth_session,
        ),
        patch(
            "custom_components.parqet.config_flow.aiohttp_client.async_get_clientsession",
        ),
    ):
        return await entry.start_reconfigure_flow(hass)


def _token_endpoint_response_error(status: int):
    """Build a real ClientResponseError as if it came from /oauth2/token."""
    import aiohttp
    from unittest.mock import MagicMock

    from yarl import URL

    request_info = MagicMock()
    request_info.url = URL("https://connect.parqet.com/oauth2/token")
    return aiohttp.ClientResponseError(
        request_info=request_info,
        history=(),
        status=status,
        message=f"HTTP {status}",
    )


async def test_reconfigure_4xx_token_aborts_reauth_required(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Stored credentials rejected by Parqet → tell the user to reauth."""
    result = await _start_reconfigure_with_refresh_error(
        hass, mock_config_entry, _token_endpoint_response_error(400)
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reauth_required"


async def test_reconfigure_5xx_token_aborts_cannot_connect(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Parqet token endpoint had a transient error → cannot_connect, not reauth.

    Sending the user to a reauth flow they can't complete (Parqet is down) is
    worse than telling them to try again later.
    """
    result = await _start_reconfigure_with_refresh_error(
        hass, mock_config_entry, _token_endpoint_response_error(503)
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "cannot_connect"
