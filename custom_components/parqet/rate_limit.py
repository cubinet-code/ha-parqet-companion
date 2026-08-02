"""Installation-wide Parqet rate-limit pause.

Kept in its own module for two reasons: `api.py` stays hass-free so the client
remains library-shaped, and `config_flow.py` can reach the pause without
importing the package root (which Home Assistant loads separately and would
make circular).
"""

from __future__ import annotations

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.singleton import singleton
from homeassistant.util.hass_dict import HassKey

from .api import RateLimitState
from .const import DOMAIN

# Must outlive the API client: Home Assistant rebuilds that on every setup
# retry, which is exactly the path the pause exists to stop.
RATE_LIMIT_STATE_KEY: HassKey[RateLimitState] = HassKey(f"{DOMAIN}_rate_limit")


@singleton(RATE_LIMIT_STATE_KEY)
@callback
def async_get_rate_limit_state(hass: HomeAssistant) -> RateLimitState:
    """Return the installation-wide rate-limit pause, creating it on demand."""
    return RateLimitState()
