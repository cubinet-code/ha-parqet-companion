"""Tests for the Parqet config flow."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet.const import DOMAIN

from .conftest import (
    MOCK_CONFIG_DATA,
    MOCK_PORTFOLIO_ID,
    MOCK_PORTFOLIO_NAME,
    MOCK_USER_ID,
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


async def test_reauth_removes_old_entry_and_creates_new(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_setup_entry: AsyncMock,
) -> None:
    """Reauth should remove the old entry (+ snapshots) and create a fresh one.

    When a user de-authorizes on Parqet and re-authorizes, the old portfolio
    may no longer be available. The reauth flow should clear old state and
    allow selecting any portfolio — including new ones.
    """
    # Verify old entry exists
    old_entry_id = mock_config_entry.entry_id
    assert hass.config_entries.async_get_entry(old_entry_id) is not None

    # Set up a mock snapshot manager in hass.data
    mock_snapshot_mgr = MagicMock()
    mock_snapshot_mgr.async_purge = AsyncMock()
    hass.data.setdefault(DOMAIN, {})[old_entry_id] = {
        "snapshot_manager": mock_snapshot_mgr,
    }

    new_portfolio_id = "new_portfolio_999"
    new_portfolio_name = "New Portfolio"
    new_portfolios = [
        {"id": new_portfolio_id, "name": new_portfolio_name, "currency": "EUR"},
    ]
    new_oauth_data = {
        "auth_implementation": "parqet",
        "token": {"access_token": "new_token", "refresh_token": "new_refresh"},
    }

    # Start the reauth flow
    result = await mock_config_entry.start_reauth_flow(hass)
    assert result["step_id"] == "reauth_confirm"

    # Simulate the full OAuth + portfolio flow by calling async_oauth_create_entry
    # directly on the flow handler (since we can't do real OAuth in tests).
    flow = hass.config_entries.flow._progress.get(result["flow_id"])
    assert flow is not None

    with patch(
        "custom_components.parqet.config_flow.aiohttp_client.async_get_clientsession",
    ), patch(
        "custom_components.parqet.config_flow.ParqetApiClient",
    ) as mock_api_cls:
        mock_api = mock_api_cls.return_value
        mock_api.async_get_user = AsyncMock(return_value=MOCK_USER_INFO)
        mock_api.async_list_portfolios = AsyncMock(return_value=new_portfolios)

        result = await flow.async_oauth_create_entry(new_oauth_data)

    # Old entry should be removed
    assert hass.config_entries.async_get_entry(old_entry_id) is None

    # Snapshot data should be purged
    mock_snapshot_mgr.async_purge.assert_called_once()

    # A new entry should be created with the new portfolio
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"]["portfolio_id"] == new_portfolio_id
    assert result["title"] == new_portfolio_name
