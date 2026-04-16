"""WebSocket API for Parqet."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .api import ParqetApiError, ParqetRateLimitError
from .const import DEFAULT_INTERVAL, DOMAIN
from .coordinator import ParqetDataUpdateCoordinator

_LOGGER = logging.getLogger(__name__)


def _get_coordinator(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> ParqetDataUpdateCoordinator | None:
    """Validate config entry and return its coordinator, or send error."""
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN:
        connection.send_error(msg["id"], "invalid_entry", "Invalid config entry")
        return None
    return entry.runtime_data


def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register the WebSocket API commands."""
    websocket_api.async_register_command(hass, ws_get_holdings)
    websocket_api.async_register_command(hass, ws_get_activities)
    websocket_api.async_register_command(hass, ws_get_performance)
    websocket_api.async_register_command(hass, ws_get_frontend_diagnostics)


@websocket_api.require_admin
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
    coordinator = _get_coordinator(hass, connection, msg)
    if coordinator is None:
        return

    holdings = (coordinator.data or {}).get("holdings", [])

    connection.send_result(msg["id"], {"holdings": holdings})


@websocket_api.require_admin
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
    coordinator = _get_coordinator(hass, connection, msg)
    if coordinator is None:
        return

    try:
        data = await coordinator.api.async_get_activities(
            coordinator.portfolio_id,
            activity_type=msg.get("activity_type"),
            limit=msg["limit"],
            cursor=msg.get("cursor"),
        )
    except ParqetRateLimitError as err:
        connection.send_error(
            msg["id"],
            "rate_limited",
            f"Rate limit exceeded. Retry in {err.retry_after}s.",
        )
        return
    except ParqetApiError:
        connection.send_error(msg["id"], "api_error", "Failed to fetch activities")
        return

    connection.send_result(msg["id"], data)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/get_performance",
        vol.Optional("entry_id"): str,
        vol.Optional("entry_ids"): [str],
        vol.Optional("interval", default=DEFAULT_INTERVAL): str,
    }
)
@websocket_api.async_response
async def ws_get_performance(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Fetch performance data on demand with a specific interval.

    Accepts either entry_id (single portfolio) or entry_ids (aggregated).
    """
    entry_ids = msg.get("entry_ids") or (
        [msg["entry_id"]] if "entry_id" in msg else []
    )
    if not entry_ids:
        connection.send_error(
            msg["id"], "invalid_entry", "entry_id or entry_ids required"
        )
        return

    # Validate all entries and collect portfolio IDs.
    portfolio_ids: list[str] = []
    api = None
    for eid in entry_ids:
        entry = hass.config_entries.async_get_entry(eid)
        if entry is None or entry.domain != DOMAIN:
            connection.send_error(
                msg["id"], "invalid_entry", f"Invalid config entry: {eid}"
            )
            return
        coordinator = entry.runtime_data
        portfolio_ids.append(coordinator.portfolio_id)
        if api is None:
            api = coordinator.api

    try:
        data = await api.async_get_performance(portfolio_ids, msg["interval"])
    except ParqetRateLimitError as err:
        connection.send_error(
            msg["id"],
            "rate_limited",
            f"Rate limit exceeded. Retry in {err.retry_after}s.",
        )
        return
    except ParqetApiError:
        connection.send_error(
            msg["id"], "api_error", "Failed to fetch performance data"
        )
        return

    connection.send_result(msg["id"], data)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "parqet/frontend_diagnostics",
    }
)
@websocket_api.async_response
async def ws_get_frontend_diagnostics(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return frontend registration diagnostics for debugging card loading."""
    from .frontend import CARD_JS_PATH, CARD_JS_URL, _read_manifest_version

    version = await hass.async_add_executor_job(_read_manifest_version)
    js_exists = await hass.async_add_executor_job(CARD_JS_PATH.exists)

    # Check Lovelace resource registration.
    # hass.data["lovelace"] may be a dict or a dataclass depending on HA version.
    lovelace_info: dict[str, Any] = {"available": False}
    lovelace = hass.data.get("lovelace")
    if lovelace:
        lovelace_info["available"] = True
        if isinstance(lovelace, dict):
            lovelace_info["mode"] = lovelace.get("mode")
        else:
            lovelace_info["mode"] = getattr(lovelace, "resource_mode", None) or getattr(lovelace, "mode", None)
        resources = lovelace.get("resources") if isinstance(lovelace, dict) else getattr(lovelace, "resources", None)
        if resources and hasattr(resources, "async_items"):
            try:
                all_items = list(resources.async_items())
                parqet_resources = [
                    {
                        "id": i.get("id"),
                        "url": i.get("url"),
                        "type": i.get("res_type"),
                    }
                    for i in all_items
                    if CARD_JS_URL in i.get("url", "")
                ]
                lovelace_info["total_resources"] = len(all_items)
                lovelace_info["parqet_resources"] = parqet_resources
            except Exception as exc:
                lovelace_info["error"] = str(exc)

    # Config entries.
    entries = [
        {
            "entry_id": e.entry_id,
            "title": e.title,
            "state": str(e.state),
        }
        for e in hass.config_entries.async_entries(DOMAIN)
    ]

    result = {
        "version": version,
        "js_path": str(CARD_JS_PATH),
        "js_exists": js_exists,
        "js_url": CARD_JS_URL,
        "lovelace": lovelace_info,
        "config_entries": entries,
    }

    _LOGGER.debug("Frontend diagnostics: %s", result)
    connection.send_result(msg["id"], result)
