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
    """Validate entry/portfolio and return its SnapshotManager, or send error.

    Falls back to the only-portfolio manager when `portfolio_id` is omitted
    and the account has exactly one portfolio.
    """
    entry_id = msg["entry_id"]
    entry = hass.config_entries.async_get_entry(entry_id)
    if entry is None or entry.domain != DOMAIN:
        connection.send_error(msg["id"], "invalid_entry", "Invalid config entry")
        return None

    mgr_data = hass.data.get(DOMAIN, {}).get(entry_id) or {}
    managers: dict[str, SnapshotManager] = mgr_data.get("snapshot_managers", {})
    if not managers:
        connection.send_error(
            msg["id"],
            "not_enabled",
            "Daily snapshots are not enabled for this account",
        )
        return None

    requested = msg.get("portfolio_id")
    if requested is not None:
        manager = managers.get(requested)
        if manager is None:
            connection.send_error(
                msg["id"],
                "invalid_portfolio",
                f"Snapshots not enabled for portfolio {requested!r}",
            )
            return None
        return manager

    if len(managers) == 1:
        return next(iter(managers.values()))

    connection.send_error(
        msg["id"],
        "invalid_portfolio",
        "portfolio_id is required when the account has more than one portfolio",
    )
    return None


def async_register_snapshot_ws(hass: HomeAssistant) -> None:
    """Register snapshot WebSocket commands."""
    websocket_api.async_register_command(hass, ws_get_snapshot)
    websocket_api.async_register_command(hass, ws_take_snapshot)
    websocket_api.async_register_command(hass, ws_purge_snapshots)


def _resolve_coordinator(
    hass: HomeAssistant, msg: dict[str, Any], manager: SnapshotManager
):
    """Find the coordinator that backs `manager` so we can request a refresh.

    Returns None when the entry has been removed mid-flight.
    """
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.runtime_data is None:
        return None
    return entry.runtime_data.coordinators.get(manager.portfolio_id)


async def _async_get_snapshot(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return snapshot-based daily P&L data (inner logic)."""
    mgr = _get_snapshot_manager(hass, connection, msg)
    if mgr is None:
        return

    # Refresh the matching coordinator so the snapshot uses current prices.
    coordinator = _resolve_coordinator(hass, msg, mgr)
    if coordinator is not None:
        await coordinator.async_request_refresh()

    connection.send_result(msg["id"], mgr.get_snapshot_data())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/get_snapshot",
        vol.Required("entry_id"): str,
        vol.Optional("portfolio_id"): str,
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
        vol.Optional("portfolio_id"): str,
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
        vol.Optional("portfolio_id"): str,
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
