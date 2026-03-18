"""Tests for Parqet integration setup and unload."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet.coordinator import ParqetDataUpdateCoordinator


async def test_setup_entry_creates_coordinator(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Test successful config entry setup creates a coordinator."""
    coordinator = init_integration.runtime_data
    assert isinstance(coordinator, ParqetDataUpdateCoordinator)
    assert coordinator.portfolio_id == "test_portfolio_123"


async def test_setup_entry_coordinator_has_data(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Test coordinator has data after setup."""
    coordinator = init_integration.runtime_data
    assert coordinator.data is not None
    assert "performance" in coordinator.data


async def test_unload_entry(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Test config entry unload cleans up platforms."""
    from custom_components.parqet import async_unload_entry

    result = await async_unload_entry(hass, init_integration)
    assert result is True
