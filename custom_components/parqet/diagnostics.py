"""Diagnostics support for Parqet."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant

from . import ParqetAccountRuntime, ParqetConfigEntry

TO_REDACT_CONFIG = {"token"}
TO_REDACT_DATA = {"userId", "installationId"}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ParqetConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for the config entry, broken down per portfolio.

    The Combined entry owns no coordinators of its own, so it only contributes
    its config entry data here. Diagnostics can also be downloaded for an entry
    that failed to set up or was unloaded — HA drops `runtime_data` in that
    case, so it must not be accessed directly.
    """
    runtime = getattr(entry, "runtime_data", None)

    portfolios: dict[str, dict[str, Any]] = {}
    if isinstance(runtime, ParqetAccountRuntime):
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
