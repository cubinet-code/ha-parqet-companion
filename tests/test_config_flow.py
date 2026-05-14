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
