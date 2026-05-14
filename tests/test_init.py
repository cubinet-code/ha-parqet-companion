"""Tests for Parqet integration setup and unload."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet import ParqetAccountRuntime
from custom_components.parqet.coordinator import ParqetDataUpdateCoordinator

from .conftest import MOCK_PORTFOLIO_ID


async def test_setup_entry_creates_account_runtime(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Setup yields a per-account runtime with one coordinator per portfolio."""
    runtime = init_integration.runtime_data
    assert isinstance(runtime, ParqetAccountRuntime)
    assert set(runtime.coordinators.keys()) == {MOCK_PORTFOLIO_ID}
    assert isinstance(
        runtime.coordinators[MOCK_PORTFOLIO_ID], ParqetDataUpdateCoordinator
    )


async def test_setup_entry_coordinator_has_data(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """The coordinator under the account runtime has fetched data."""
    runtime = init_integration.runtime_data
    coordinator = runtime.coordinators[MOCK_PORTFOLIO_ID]
    assert coordinator.data is not None
    assert "performance" in coordinator.data


async def test_setup_entry_shares_one_api_client(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Every coordinator under the account uses the same ParqetApiClient."""
    runtime = init_integration.runtime_data
    apis = {id(c.api) for c in runtime.coordinators.values()}
    assert len(apis) == 1
    assert id(runtime.api) in apis


async def test_unload_entry(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Test config entry unload cleans up platforms."""
    from custom_components.parqet import async_unload_entry

    result = await async_unload_entry(hass, init_integration)
    assert result is True
