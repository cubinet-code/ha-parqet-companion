"""Tests for the Parqet DataUpdateCoordinator."""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import AsyncMock

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import UpdateFailed

from custom_components.parqet.api import (
    ParqetApiError,
    ParqetAuthError,
    ParqetConnectionError,
)
from custom_components.parqet.coordinator import ParqetDataUpdateCoordinator

from .conftest import MOCK_PERFORMANCE


async def test_successful_update(hass: HomeAssistant) -> None:
    """Test successful data fetch returns performance data."""
    api = AsyncMock()
    api.async_get_performance.return_value = MOCK_PERFORMANCE

    coordinator = ParqetDataUpdateCoordinator(
        hass, api, "p1", "Test Portfolio"
    )
    data = await coordinator._async_update_data()

    assert data == MOCK_PERFORMANCE
    api.async_get_performance.assert_called_once_with(["p1"], "max")


async def test_custom_interval(hass: HomeAssistant) -> None:
    """Test coordinator uses custom performance interval."""
    api = AsyncMock()
    api.async_get_performance.return_value = MOCK_PERFORMANCE

    coordinator = ParqetDataUpdateCoordinator(
        hass, api, "p1", "Test", interval="ytd"
    )
    await coordinator._async_update_data()

    api.async_get_performance.assert_called_once_with(["p1"], "ytd")


async def test_custom_scan_interval(hass: HomeAssistant) -> None:
    """Test coordinator uses custom scan interval."""
    api = AsyncMock()
    coordinator = ParqetDataUpdateCoordinator(
        hass, api, "p1", "Test", scan_interval_min=30
    )
    assert coordinator.update_interval == timedelta(minutes=30)


async def test_default_scan_interval(hass: HomeAssistant) -> None:
    """Test coordinator uses default scan interval."""
    api = AsyncMock()
    coordinator = ParqetDataUpdateCoordinator(
        hass, api, "p1", "Test"
    )
    assert coordinator.update_interval == timedelta(minutes=15)


async def test_auth_error_raises_config_entry_auth_failed(
    hass: HomeAssistant,
) -> None:
    """Test ParqetAuthError is mapped to ConfigEntryAuthFailed."""
    api = AsyncMock()
    api.async_get_performance.side_effect = ParqetAuthError("expired")

    coordinator = ParqetDataUpdateCoordinator(
        hass, api, "p1", "Test"
    )
    with pytest.raises(ConfigEntryAuthFailed):
        await coordinator._async_update_data()


async def test_connection_error_raises_update_failed(
    hass: HomeAssistant,
) -> None:
    """Test ParqetConnectionError is mapped to UpdateFailed."""
    api = AsyncMock()
    api.async_get_performance.side_effect = ParqetConnectionError("timeout")

    coordinator = ParqetDataUpdateCoordinator(
        hass, api, "p1", "Test"
    )
    with pytest.raises(UpdateFailed):
        await coordinator._async_update_data()


async def test_generic_api_error_raises_update_failed(
    hass: HomeAssistant,
) -> None:
    """Test generic ParqetApiError is mapped to UpdateFailed."""
    api = AsyncMock()
    api.async_get_performance.side_effect = ParqetApiError("bad request")

    coordinator = ParqetDataUpdateCoordinator(
        hass, api, "p1", "Test"
    )
    with pytest.raises(UpdateFailed):
        await coordinator._async_update_data()
