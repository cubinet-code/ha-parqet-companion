"""WebSocket API for daily snapshots."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .snapshot import SnapshotManager
from .websocket_api import _resolve_runtime, pick_by_portfolio


def _get_snapshot_manager(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> tuple[SnapshotManager, str] | None:
    """Resolve the SnapshotManager (and its portfolio_id) for a WS request.

    Returns None and sends a WS error when the entry is invalid, snapshots are
    not enabled for the account, or the requested portfolio_id is unknown.
    """
    runtime = _resolve_runtime(hass, connection, msg)
    if runtime is None:
        return None

    managers = runtime.snapshot_managers
    if not managers:
        connection.send_error(
            msg["id"],
            "not_enabled",
            "Daily snapshots are not enabled for this account",
        )
        return None

    manager = pick_by_portfolio(
        connection, msg, managers,
        not_found_label="Snapshots not enabled",
    )
    if manager is None:
        return None

    # The mapping key is the portfolio_id; recover it for the optional refresh
    # step without exposing private state on the manager itself.
    portfolio_id = next(pid for pid, m in managers.items() if m is manager)
    return manager, portfolio_id


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
    resolved = _get_snapshot_manager(hass, connection, msg)
    if resolved is None:
        return
    mgr, portfolio_id = resolved

    # Refresh the portfolio's coordinator so the snapshot uses current prices.
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is not None and entry.runtime_data is not None:
        coordinator = entry.runtime_data.coordinators.get(portfolio_id)
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
    resolved = _get_snapshot_manager(hass, connection, msg)
    if resolved is None:
        return
    mgr, _ = resolved

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
    resolved = _get_snapshot_manager(hass, connection, msg)
    if resolved is None:
        return
    mgr, _ = resolved

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
