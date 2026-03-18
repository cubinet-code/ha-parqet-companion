"""Tests for Parqet diagnostics."""

from __future__ import annotations

from unittest.mock import AsyncMock

from homeassistant.components.diagnostics import REDACTED
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet.diagnostics import async_get_config_entry_diagnostics


async def test_diagnostics_structure(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Test diagnostics returns expected structure."""
    diag = await async_get_config_entry_diagnostics(hass, init_integration)

    assert "config_entry_data" in diag
    assert "config_entry_options" in diag
    assert "coordinator_data" in diag
    assert "coordinator_last_update_success" in diag
    assert "coordinator_update_interval" in diag


async def test_diagnostics_redacts_token(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Test diagnostics redacts OAuth token."""
    diag = await async_get_config_entry_diagnostics(hass, init_integration)

    assert diag["config_entry_data"]["token"] == REDACTED


async def test_diagnostics_preserves_non_sensitive_data(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Test diagnostics preserves non-sensitive config data."""
    diag = await async_get_config_entry_diagnostics(hass, init_integration)

    assert diag["config_entry_data"]["portfolio_id"] == "test_portfolio_123"
    assert diag["config_entry_data"]["portfolio_name"] == "Test Portfolio"
    assert diag["config_entry_data"]["currency"] == "EUR"


async def test_diagnostics_coordinator_success(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Test diagnostics reports coordinator success status."""
    diag = await async_get_config_entry_diagnostics(hass, init_integration)

    assert diag["coordinator_last_update_success"] is True
    assert "0:15:00" in diag["coordinator_update_interval"]
