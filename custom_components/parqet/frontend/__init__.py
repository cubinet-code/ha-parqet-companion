"""Frontend registration for the Parqet Lovelace card."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.start import async_at_started

_LOGGER = logging.getLogger(__name__)

FRONTEND_DIR = Path(__file__).parent
CARD_JS_PATH = FRONTEND_DIR / "parqet-card.js"
CARD_JS_URL = "/parqet/parqet-card.js"
_MANIFEST = FRONTEND_DIR.parent / "manifest.json"


def _read_manifest_version() -> str:
    """Read the integration version from manifest.json."""
    try:
        return json.loads(_MANIFEST.read_text()).get("version", "0")
    except Exception:
        return "0"


async def _async_register_lovelace_resource(hass: HomeAssistant, url: str) -> None:
    """Register the card as a Lovelace resource (storage mode only).

    Lovelace resources are loaded by the Lovelace JS before rendering cards,
    making them timing-safe regardless of service worker HTML caching. This
    complements add_extra_js_url which covers YAML mode and acts as a fallback.
    """
    try:
        lovelace: dict[str, Any] | None = hass.data.get("lovelace")
        if not lovelace:
            _LOGGER.debug("Lovelace not initialised — skipping resource registration")
            return

        if lovelace.get("mode") != "storage":
            _LOGGER.debug("Lovelace YAML mode — resource registration not needed")
            return

        resources = lovelace.get("resources")
        if resources is None:
            _LOGGER.debug("Lovelace resources collection unavailable")
            return

        # async_load() MUST be called before any read/write to prevent the
        # lazy-load bug that would overwrite existing resources with only ours.
        await resources.async_load()

        # Compare by base URL (without ?v= query param) to detect version updates.
        existing = next(
            (i for i in resources.async_items()
             if i.get("url", "").split("?")[0] == CARD_JS_URL),
            None,
        )

        if existing is None:
            await resources.async_create_item({"res_type": "module", "url": url})
            _LOGGER.debug("Registered Parqet Lovelace resource: %s", url)
        elif existing.get("url") != url:
            await resources.async_update_item(existing["id"], {"url": url})
            _LOGGER.debug("Updated Parqet Lovelace resource: %s → %s", existing.get("url"), url)
        else:
            _LOGGER.debug("Parqet Lovelace resource already current: %s", url)

    except Exception:
        _LOGGER.exception("Failed to register Parqet Lovelace resource")


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Register the Parqet card frontend static assets."""
    if not CARD_JS_PATH.exists():
        _LOGGER.warning("Parqet card JS not found at %s", CARD_JS_PATH)
        return

    version = await hass.async_add_executor_job(_read_manifest_version)
    versioned_url = f"{CARD_JS_URL}?v={version}"

    # Serve the JS file at /parqet/parqet-card.js (clean path, no query params).
    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_JS_URL, str(CARD_JS_PATH), cache_headers=True)]
    )

    # Fallback: inject script tag on every HA page (covers YAML mode).
    add_extra_js_url(hass, versioned_url)

    # Primary: register as a proper Lovelace resource once HA has fully started.
    # This ensures the card JS is loaded synchronously by Lovelace before any
    # dashboard renders, bypassing service-worker HTML caching issues.
    # async_at_started expects a sync callback — use async_create_task to
    # schedule the coroutine rather than returning it unawaited.
    @callback
    def _schedule_lovelace_registration(hass_instance: HomeAssistant) -> None:
        hass_instance.async_create_task(
            _async_register_lovelace_resource(hass_instance, versioned_url),
            eager_start=True,
        )

    async_at_started(hass, _schedule_lovelace_registration)

    _LOGGER.debug("Registered Parqet card frontend at %s", versioned_url)
