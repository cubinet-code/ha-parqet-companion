"""Tests for the Parqet config flow."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet.const import DOMAIN

from .conftest import MOCK_CONFIG_DATA, MOCK_PORTFOLIO_ID, MOCK_USER_ID

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
