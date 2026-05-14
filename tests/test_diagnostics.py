"""Tests for Parqet diagnostics."""

from __future__ import annotations

from homeassistant.components.diagnostics import REDACTED
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet.diagnostics import async_get_config_entry_diagnostics

from .conftest import MOCK_PORTFOLIO_ID, MOCK_PORTFOLIO_NAME


async def test_diagnostics_structure(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Diagnostics has account-level metadata plus per-portfolio breakdown."""
    diag = await async_get_config_entry_diagnostics(hass, init_integration)

    assert "config_entry_data" in diag
    assert "config_entry_options" in diag
    assert "portfolios" in diag

    portfolios = diag["portfolios"]
    assert MOCK_PORTFOLIO_ID in portfolios
    portfolio = portfolios[MOCK_PORTFOLIO_ID]
    assert "data" in portfolio
    assert "last_update_success" in portfolio
    assert "update_interval" in portfolio


async def test_diagnostics_redacts_token(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Diagnostics redacts the OAuth token from the account-level data."""
    diag = await async_get_config_entry_diagnostics(hass, init_integration)

    assert diag["config_entry_data"]["token"] == REDACTED


async def test_diagnostics_preserves_non_sensitive_data(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Diagnostics keeps the v2 account-level fields visible."""
    diag = await async_get_config_entry_diagnostics(hass, init_integration)

    assert diag["config_entry_data"]["portfolio_ids"] == [MOCK_PORTFOLIO_ID]
    meta = diag["config_entry_data"]["portfolio_meta"]
    assert meta[MOCK_PORTFOLIO_ID]["name"] == MOCK_PORTFOLIO_NAME


async def test_diagnostics_coordinator_success(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Diagnostics reports each portfolio's coordinator update interval/success."""
    diag = await async_get_config_entry_diagnostics(hass, init_integration)

    portfolio = diag["portfolios"][MOCK_PORTFOLIO_ID]
    assert portfolio["last_update_success"] is True
    assert "0:15:00" in portfolio["update_interval"]
