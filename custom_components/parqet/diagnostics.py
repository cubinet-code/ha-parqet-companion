"""Diagnostics support for Parqet."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant

from . import ParqetConfigEntry

TO_REDACT_CONFIG = {"token"}
TO_REDACT_DATA = {"userId", "installationId"}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ParqetConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for the account config entry, broken down per portfolio."""
    runtime = entry.runtime_data

    portfolios: dict[str, dict[str, Any]] = {}
    for portfolio_id, coordinator in runtime.coordinators.items():
        portfolios[portfolio_id] = {
            "data": async_redact_data(coordinator.data or {}, TO_REDACT_DATA),
            "last_update_success": coordinator.last_update_success,
            "update_interval": str(coordinator.update_interval),
        }

    return {
        "config_entry_data": async_redact_data(dict(entry.data), TO_REDACT_CONFIG),
        "config_entry_options": dict(entry.options),
        "portfolios": portfolios,
    }
