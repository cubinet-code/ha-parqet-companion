"""HA services for the Parqet integration.

Only one service today: `parqet.dump_diagnostics`. It writes a snapshot of
frontend registration state + per-entry coordinator state to a persistent
notification. Users who hit "custom element doesn't exist: parqet-companion-card"
or similar loading issues can call this from Developer Tools → Services and
screenshot the notification for support, without needing to enable debug
logging or call the WebSocket API by hand.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from homeassistant.components import persistent_notification
from homeassistant.core import HomeAssistant, ServiceCall, callback

from .const import DOMAIN
from .frontend import CARD_JS_PATH, CARD_JS_URL, _read_manifest_version

_LOGGER = logging.getLogger(__name__)

SERVICE_DUMP_DIAGNOSTICS = "dump_diagnostics"


def _collect_js_info(js_path: Path) -> dict[str, Any]:
    info: dict[str, Any] = {"path": str(js_path), "exists": js_path.exists()}
    if info["exists"]:
        stat = js_path.stat()
        info["size_bytes"] = stat.st_size
        info["mtime"] = stat.st_mtime
    return info


def _collect_lovelace_info(hass: HomeAssistant) -> dict[str, Any]:
    lovelace = hass.data.get("lovelace")
    if not lovelace:
        return {"available": False}

    if isinstance(lovelace, dict):
        mode = lovelace.get("mode")
        resources = lovelace.get("resources")
    else:
        mode = getattr(lovelace, "resource_mode", None) or getattr(lovelace, "mode", None)
        resources = getattr(lovelace, "resources", None)

    info: dict[str, Any] = {"available": True, "mode": mode}
    if resources is None or not hasattr(resources, "async_items"):
        info["resources_available"] = False
        return info

    try:
        items = list(resources.async_items())
    except Exception as exc:  # pragma: no cover - defensive
        info["resources_error"] = str(exc)
        return info

    info["total_resources"] = len(items)
    info["parqet_resources"] = [
        {"id": i.get("id"), "url": i.get("url"), "type": i.get("res_type")}
        for i in items
        if CARD_JS_URL in i.get("url", "")
    ]
    return info


def _collect_entries(hass: HomeAssistant) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for entry in hass.config_entries.async_entries(DOMAIN):
        row: dict[str, Any] = {
            "entry_id": entry.entry_id,
            "title": entry.title,
            "state": str(entry.state),
        }
        runtime = getattr(entry, "runtime_data", None)
        coordinators = getattr(runtime, "coordinators", None) if runtime else None
        if coordinators:
            row["coordinators"] = [
                {
                    "portfolio_id": pid,
                    "last_update_success": c.last_update_success,
                    "last_exception": (
                        type(c.last_exception).__name__
                        if c.last_exception is not None
                        else None
                    ),
                }
                for pid, c in coordinators.items()
            ]
        entries.append(row)
    return entries


async def _async_dump_diagnostics(hass: HomeAssistant, _call: ServiceCall) -> None:
    """Build a diagnostics snapshot and post it as a persistent notification."""
    version = await hass.async_add_executor_job(_read_manifest_version)
    js_info = await hass.async_add_executor_job(_collect_js_info, CARD_JS_PATH)

    payload = {
        "version": version,
        "js_url": CARD_JS_URL,
        "js": js_info,
        "lovelace": _collect_lovelace_info(hass),
        "config_entries": _collect_entries(hass),
    }

    _LOGGER.info("parqet.dump_diagnostics: %s", payload)

    persistent_notification.async_create(
        hass,
        message=f"```json\n{json.dumps(payload, indent=2, default=str)}\n```",
        title="Parqet diagnostics",
        notification_id=f"{DOMAIN}_diagnostics",
    )


@callback
def async_register_services(hass: HomeAssistant) -> None:
    """Register Parqet services. Safe to call multiple times."""
    if hass.services.has_service(DOMAIN, SERVICE_DUMP_DIAGNOSTICS):
        return

    async def _handler(call: ServiceCall) -> None:
        await _async_dump_diagnostics(hass, call)

    hass.services.async_register(DOMAIN, SERVICE_DUMP_DIAGNOSTICS, _handler)
