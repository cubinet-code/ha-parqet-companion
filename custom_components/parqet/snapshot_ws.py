"""WebSocket API for daily snapshots."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .snapshot import SnapshotManager


def _get_snapshot_manager(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> SnapshotManager | None:
    """Validate entry and return its SnapshotManager, or send error."""
    entry_id = msg["entry_id"]
    entry = hass.config_entries.async_get_entry(entry_id)
    if entry is None or entry.domain != DOMAIN:
        connection.send_error(msg["id"], "invalid_entry", "Invalid config entry")
        return None

    mgr_data = hass.data.get(DOMAIN, {}).get(entry_id)
    if not mgr_data or "snapshot_manager" not in mgr_data:
        connection.send_error(
            msg["id"],
            "not_enabled",
            "Daily snapshots are not enabled for this portfolio",
        )
        return None

    return mgr_data["snapshot_manager"]


def async_register_snapshot_ws(hass: HomeAssistant) -> None:
    """Register snapshot WebSocket commands."""
    websocket_api.async_register_command(hass, ws_get_snapshot)
    websocket_api.async_register_command(hass, ws_take_snapshot)
    websocket_api.async_register_command(hass, ws_purge_snapshots)


async def _async_get_snapshot(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return snapshot-based daily P&L data (inner logic)."""
    mgr = _get_snapshot_manager(hass, connection, msg)
    if mgr is None:
        return

    # Refresh coordinator so the snapshot uses current prices.
    # async_request_refresh handles its own debouncing internally.
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry and entry.runtime_data:
        await entry.runtime_data.async_request_refresh()

    connection.send_result(msg["id"], mgr.get_snapshot_data())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/get_snapshot",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_get_snapshot(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return snapshot-based daily P&L data."""
    await _async_get_snapshot(hass, connection, msg)


async def _async_take_snapshot(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Manually trigger a snapshot (inner logic)."""
    mgr = _get_snapshot_manager(hass, connection, msg)
    if mgr is None:
        return

    snapshot = await mgr.async_take_snapshot()
    connection.send_result(
        msg["id"], {"status": "ok" if snapshot else "no_data"}
    )


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/take_snapshot",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_take_snapshot(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Manually trigger a snapshot."""
    await _async_take_snapshot(hass, connection, msg)


async def _async_purge_snapshots(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Clear all stored snapshots (inner logic)."""
    mgr = _get_snapshot_manager(hass, connection, msg)
    if mgr is None:
        return

    await mgr.async_purge()
    connection.send_result(msg["id"], {"status": "ok"})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/purge_snapshots",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_purge_snapshots(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Clear all stored snapshots."""
    await _async_purge_snapshots(hass, connection, msg)
