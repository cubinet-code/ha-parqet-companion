"""Frontend registration for the Parqet Lovelace card."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

FRONTEND_DIR = Path(__file__).parent
CARD_JS_PATH = FRONTEND_DIR / "parqet-card.js"

# Read version from manifest for cache-busting.
_MANIFEST = FRONTEND_DIR.parent / "manifest.json"
try:
    import json as _json

    _VERSION = _json.loads(_MANIFEST.read_text()).get("version", "0")
except Exception:
    _VERSION = "0"

CARD_JS_URL = "/parqet/parqet-card.js"
CARD_JS_URL_VERSIONED = f"{CARD_JS_URL}?v={_VERSION}"


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Register the Parqet card frontend static assets."""
    if not CARD_JS_PATH.exists():
        _LOGGER.warning("Parqet card JS not found at %s", CARD_JS_PATH)
        return

    # Serve the JS file at /parqet/parqet-card.js (clean path, no query params).
    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_JS_URL, str(CARD_JS_PATH), cache_headers=True)]
    )

    # Tell HA to load the JS on every frontend page (versioned URL for cache-busting).
    add_extra_js_url(hass, CARD_JS_URL_VERSIONED)

    _LOGGER.debug("Registered Parqet card frontend at %s", CARD_JS_URL_VERSIONED)
