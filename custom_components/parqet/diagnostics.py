"""Diagnostics support for Parqet."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant

from . import ParqetConfigEntry

TO_REDACT_CONFIG = {"access_token", "refresh_token", "token"}
TO_REDACT_DATA = {"id", "userId", "installationId"}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ParqetConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    coordinator = entry.runtime_data

    return {
        "config_entry_data": async_redact_data(dict(entry.data), TO_REDACT_CONFIG),
        "config_entry_options": dict(entry.options),
        "coordinator_data": async_redact_data(
            coordinator.data or {}, TO_REDACT_DATA
        ),
        "coordinator_last_update_success": coordinator.last_update_success,
        "coordinator_update_interval": str(coordinator.update_interval),
    }
