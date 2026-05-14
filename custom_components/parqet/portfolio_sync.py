"""Keep a ConfigEntry's portfolio list in sync with the live Parqet account.

A portfolio deleted on Parqet still lives on in the entry's `portfolio_ids` until
something prunes it; without pruning, every refresh hits a 403 forever (see Issue
log for v0.4.0-beta.1). This module is the single place that reconciles entry
state with Parqet, removes stale devices, and surfaces a user-actionable repair
issue per removed portfolio.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import issue_registry as ir

from .const import CONF_PORTFOLIO_IDS, CONF_PORTFOLIO_META, DOMAIN

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry

    from .api import ParqetApiClient

_LOGGER = logging.getLogger(__name__)

# One repair issue per (entry, portfolio) pair so the user can dismiss them
# independently and Home Assistant deduplicates across reloads.
_MISSING_ISSUE_PREFIX = "missing_portfolio"


def _missing_issue_id(entry_id: str, portfolio_id: str) -> str:
    return f"{_MISSING_ISSUE_PREFIX}_{entry_id}_{portfolio_id}"


async def async_reconcile_portfolios(
    hass: HomeAssistant,
    entry: ConfigEntry,
    api: ParqetApiClient,
) -> list[str]:
    """Drop portfolios that have been deleted on Parqet's side.

    Returns the remaining `portfolio_ids` (already persisted on the entry). The
    caller decides what to do with an empty result. The `/portfolios` call may
    raise — let it propagate so the caller can map it onto ConfigEntryNotReady.
    """
    live = await api.async_list_portfolios()
    live_ids = {p["id"] for p in live if p.get("id")}

    stored_ids: list[str] = list(entry.data.get(CONF_PORTFOLIO_IDS, []))
    stored_meta: dict[str, dict[str, str]] = dict(
        entry.data.get(CONF_PORTFOLIO_META, {})
    )

    missing_ids = [pid for pid in stored_ids if pid not in live_ids]
    remaining_ids = [pid for pid in stored_ids if pid in live_ids]

    # Clear any stale "missing portfolio" issues for IDs that are now live again
    # (the user re-created a portfolio with the same ID, or restored from trash).
    _async_clear_resolved_issues(hass, entry.entry_id, remaining_ids)

    if not missing_ids:
        return remaining_ids

    # Remove orphan devices so the UI doesn't show "unavailable" tiles for
    # portfolios that no longer exist. The entity registry cleans itself up
    # when the device is removed.
    registry = dr.async_get(hass)
    for pid in missing_ids:
        device = registry.async_get_device(identifiers={(DOMAIN, pid)})
        if device is not None:
            registry.async_remove_device(device.id)

    remaining_meta = {
        pid: stored_meta[pid] for pid in remaining_ids if pid in stored_meta
    }
    hass.config_entries.async_update_entry(
        entry,
        data={
            **entry.data,
            CONF_PORTFOLIO_IDS: remaining_ids,
            CONF_PORTFOLIO_META: remaining_meta,
        },
    )

    for pid in missing_ids:
        name = stored_meta.get(pid, {}).get("name", pid)
        ir.async_create_issue(
            hass,
            DOMAIN,
            _missing_issue_id(entry.entry_id, pid),
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key="portfolio_deleted",
            translation_placeholders={
                "portfolio_name": name,
                "entry_title": entry.title,
            },
        )
        _LOGGER.warning(
            "Portfolio %r (%s) is no longer on your Parqet account — removed "
            "from entry %s",
            name,
            pid,
            entry.entry_id,
        )

    return remaining_ids


def _async_clear_resolved_issues(
    hass: HomeAssistant, entry_id: str, portfolio_ids: list[str]
) -> None:
    """Delete repair issues for portfolios that are accessible again."""
    for pid in portfolio_ids:
        ir.async_delete_issue(hass, DOMAIN, _missing_issue_id(entry_id, pid))
