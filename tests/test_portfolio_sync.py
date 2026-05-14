"""Tests for the portfolio reconciliation helper."""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import issue_registry as ir
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet.const import (
    CONF_PORTFOLIO_IDS,
    CONF_PORTFOLIO_META,
    DOMAIN,
)
from custom_components.parqet.portfolio_sync import (
    _missing_issue_id,
    async_reconcile_portfolios,
)


def _make_entry(
    hass: HomeAssistant,
    *,
    portfolio_ids: list[str],
    portfolio_meta: dict[str, dict[str, str]],
) -> MockConfigEntry:
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Test Account",
        data={
            "auth_implementation": "parqet",
            "token": {"access_token": "x", "expires_at": 99999999999},
            "user_id": "user_x",
            CONF_PORTFOLIO_IDS: portfolio_ids,
            CONF_PORTFOLIO_META: portfolio_meta,
        },
        unique_id="user_x",
        version=2,
        minor_version=1,
    )
    entry.add_to_hass(hass)
    return entry


async def test_reconcile_no_changes_when_all_portfolios_live(
    hass: HomeAssistant,
) -> None:
    """All stored portfolios still exist on Parqet — no entry mutation, no issues."""
    entry = _make_entry(
        hass,
        portfolio_ids=["p1", "p2"],
        portfolio_meta={
            "p1": {"name": "Alpha", "currency": "EUR"},
            "p2": {"name": "Beta", "currency": "EUR"},
        },
    )
    api = AsyncMock()
    api.async_list_portfolios.return_value = [
        {"id": "p1", "name": "Alpha", "currency": "EUR"},
        {"id": "p2", "name": "Beta", "currency": "EUR"},
    ]

    remaining = await async_reconcile_portfolios(hass, entry, api)

    assert remaining == ["p1", "p2"]
    assert entry.data[CONF_PORTFOLIO_IDS] == ["p1", "p2"]
    # No repair issues raised.
    registry = ir.async_get(hass)
    assert not any(
        issue.domain == DOMAIN for issue in registry.issues.values()
    )


async def test_reconcile_prunes_deleted_portfolio_and_creates_issue(
    hass: HomeAssistant,
) -> None:
    """A portfolio missing from Parqet's response is removed from the entry."""
    entry = _make_entry(
        hass,
        portfolio_ids=["alive", "dead"],
        portfolio_meta={
            "alive": {"name": "Alive", "currency": "EUR"},
            "dead": {"name": "Retirement", "currency": "EUR"},
        },
    )
    api = AsyncMock()
    api.async_list_portfolios.return_value = [
        {"id": "alive", "name": "Alive", "currency": "EUR"},
    ]

    remaining = await async_reconcile_portfolios(hass, entry, api)

    assert remaining == ["alive"]
    assert entry.data[CONF_PORTFOLIO_IDS] == ["alive"]
    assert "dead" not in entry.data[CONF_PORTFOLIO_META]

    issue = ir.async_get(hass).async_get_issue(
        DOMAIN, _missing_issue_id(entry.entry_id, "dead")
    )
    assert issue is not None
    assert issue.translation_key == "portfolio_deleted"
    assert issue.translation_placeholders == {
        "portfolio_name": "Retirement",
        "entry_title": "Test Account",
    }
    assert issue.severity == ir.IssueSeverity.WARNING
    assert issue.is_fixable is False


async def test_reconcile_removes_orphan_device(hass: HomeAssistant) -> None:
    """When a portfolio is pruned, its device gets removed from the registry."""
    entry = _make_entry(
        hass,
        portfolio_ids=["dead"],
        portfolio_meta={"dead": {"name": "Retirement", "currency": "EUR"}},
    )
    device_registry = dr.async_get(hass)
    device = device_registry.async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(DOMAIN, "dead")},
        name="Retirement",
    )

    api = AsyncMock()
    api.async_list_portfolios.return_value = []

    await async_reconcile_portfolios(hass, entry, api)

    assert device_registry.async_get(device.id) is None


async def test_reconcile_returns_empty_when_all_portfolios_gone(
    hass: HomeAssistant,
) -> None:
    """Caller can detect the 'nothing left' case and raise ConfigEntryError."""
    entry = _make_entry(
        hass,
        portfolio_ids=["p1"],
        portfolio_meta={"p1": {"name": "Only One", "currency": "EUR"}},
    )
    api = AsyncMock()
    api.async_list_portfolios.return_value = []

    remaining = await async_reconcile_portfolios(hass, entry, api)

    assert remaining == []
    assert entry.data[CONF_PORTFOLIO_IDS] == []


async def test_reconcile_clears_resolved_issue_when_portfolio_returns(
    hass: HomeAssistant,
) -> None:
    """If a previously-missing portfolio reappears, its repair issue is cleared.

    Covers the case where the user restored a portfolio from Parqet's trash
    between two HA restarts.
    """
    entry = _make_entry(
        hass,
        portfolio_ids=["p1"],
        portfolio_meta={"p1": {"name": "Restored", "currency": "EUR"}},
    )
    # Simulate a stale issue from a previous reconciliation cycle.
    ir.async_create_issue(
        hass,
        DOMAIN,
        _missing_issue_id(entry.entry_id, "p1"),
        is_fixable=False,
        severity=ir.IssueSeverity.WARNING,
        translation_key="portfolio_deleted",
    )

    api = AsyncMock()
    api.async_list_portfolios.return_value = [
        {"id": "p1", "name": "Restored", "currency": "EUR"},
    ]

    await async_reconcile_portfolios(hass, entry, api)

    assert (
        ir.async_get(hass).async_get_issue(
            DOMAIN, _missing_issue_id(entry.entry_id, "p1")
        )
        is None
    )


async def test_reconcile_propagates_api_errors(hass: HomeAssistant) -> None:
    """A failed /portfolios call must bubble up so the caller can map to NotReady."""
    entry = _make_entry(
        hass,
        portfolio_ids=["p1"],
        portfolio_meta={"p1": {"name": "X", "currency": "EUR"}},
    )
    api = AsyncMock()
    api.async_list_portfolios.side_effect = RuntimeError("boom")

    with pytest.raises(RuntimeError, match="boom"):
        await async_reconcile_portfolios(hass, entry, api)
