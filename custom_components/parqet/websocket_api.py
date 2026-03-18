"""WebSocket API for Parqet."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .api import ParqetApiError
from .const import DOMAIN
from .coordinator import ParqetDataUpdateCoordinator


def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register the WebSocket API commands."""
    websocket_api.async_register_command(hass, ws_get_holdings)
    websocket_api.async_register_command(hass, ws_get_activities)
    websocket_api.async_register_command(hass, ws_get_performance)


def _require_admin(
    connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> bool:
    """Check that the user is an admin, sending an error if not."""
    if not connection.user.is_admin:
        connection.send_error(
            msg["id"], "unauthorized", "Admin access required"
        )
        return False
    return True


@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/get_holdings",
        vol.Required("entry_id"): str,
    }
)
@callback
def ws_get_holdings(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return holdings from coordinator cached data."""
    if not _require_admin(connection, msg):
        return

    entry_id = msg["entry_id"]
    entry = hass.config_entries.async_get_entry(entry_id)

    if entry is None or entry.domain != DOMAIN:
        connection.send_error(msg["id"], "invalid_entry", "Invalid config entry")
        return

    coordinator: ParqetDataUpdateCoordinator = entry.runtime_data
    holdings = (coordinator.data or {}).get("holdings", [])

    connection.send_result(msg["id"], {"holdings": holdings})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/get_activities",
        vol.Required("entry_id"): str,
        vol.Optional("activity_type"): [str],
        vol.Optional("limit", default=25): vol.All(
            vol.Coerce(int), vol.Range(min=1, max=500)
        ),
        vol.Optional("cursor"): str,
    }
)
@websocket_api.async_response
async def ws_get_activities(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Fetch activities on demand from the Parqet API."""
    if not _require_admin(connection, msg):
        return

    entry_id = msg["entry_id"]
    entry = hass.config_entries.async_get_entry(entry_id)

    if entry is None or entry.domain != DOMAIN:
        connection.send_error(msg["id"], "invalid_entry", "Invalid config entry")
        return

    coordinator: ParqetDataUpdateCoordinator = entry.runtime_data

    try:
        data = await coordinator.api.async_get_activities(
            coordinator.portfolio_id,
            activity_type=msg.get("activity_type"),
            limit=msg["limit"],
            cursor=msg.get("cursor"),
        )
    except ParqetApiError:
        connection.send_error(msg["id"], "api_error", "Failed to fetch activities")
        return

    connection.send_result(msg["id"], data)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/get_performance",
        vol.Required("entry_id"): str,
        vol.Optional("interval", default="max"): str,
    }
)
@websocket_api.async_response
async def ws_get_performance(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Fetch performance data on demand with a specific interval."""
    if not _require_admin(connection, msg):
        return

    entry_id = msg["entry_id"]
    entry = hass.config_entries.async_get_entry(entry_id)

    if entry is None or entry.domain != DOMAIN:
        connection.send_error(msg["id"], "invalid_entry", "Invalid config entry")
        return

    coordinator: ParqetDataUpdateCoordinator = entry.runtime_data

    try:
        data = await coordinator.api.async_get_performance(
            [coordinator.portfolio_id],
            msg["interval"],
        )
    except ParqetApiError:
        connection.send_error(
            msg["id"], "api_error", "Failed to fetch performance data"
        )
        return

    connection.send_result(msg["id"], data)
