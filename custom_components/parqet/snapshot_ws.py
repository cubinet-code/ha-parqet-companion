"""WebSocket API for daily snapshots."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .snapshot import SnapshotManager
from .websocket_api import (
    CombinedUnavailableError,
    _combined_source_runtimes,
    _resolve_runtime,
    pick_by_portfolio,
)


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


def _holding_to_snapshot_row(holding: dict[str, Any], total_value: float) -> dict[str, Any]:
    """Convert a coordinator holding into the snapshot card row shape."""
    position = holding.get("position") or {}
    asset = holding.get("asset") or {}
    current_value = position.get("currentValue") or 0
    return {
        "id": holding.get("id"),
        "name": asset.get("name") or holding.get("nickname") or "Unknown",
        "logo": holding.get("logo"),
        "shares": position.get("shares"),
        "current_price": position.get("currentPrice"),
        "current_value": current_value,
        "snapshot_price": None,
        "snapshot_value": None,
        "daily_pl": None,
        "daily_pl_pct": None,
        "weight": round(current_value / total_value * 100, 1) if total_value else 0,
    }


def combined_snapshot_data(
    hass: HomeAssistant,
    combined_entry_id: str,
) -> dict[str, Any]:
    """Return current holdings for the explicitly selected Combined sources."""
    holdings: list[dict[str, Any]] = []
    for runtime in _combined_source_runtimes(hass, combined_entry_id):
        for coordinator in runtime.coordinators.values():
            holdings.extend(
                holding
                for holding in ((coordinator.data or {}).get("holdings") or [])
                if not (holding.get("position") or {}).get("isSold", False)
            )
    total_value = sum((h.get("position") or {}).get("currentValue") or 0 for h in holdings)
    rows = [_holding_to_snapshot_row(holding, total_value) for holding in holdings]
    rows.sort(key=lambda row: row.get("current_value") or 0, reverse=True)
    return {
        "snapshot_date": None,
        "snapshot_taken_at": None,
        "holdings": rows,
        "total_value": total_value,
        "total_snapshot_value": None,
        "total_daily_pl": None,
        "total_daily_pl_pct": None,
    }


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
    if msg.get("portfolio_id") == "combined_accounts":
        try:
            data = combined_snapshot_data(hass, msg["entry_id"])
        except CombinedUnavailableError as err:
            connection.send_error(msg["id"], err.code, str(err))
            return
        connection.send_result(msg["id"], data)
        return

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
