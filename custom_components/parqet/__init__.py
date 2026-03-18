"""The Parqet integration."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import aiohttp_client, config_entry_oauth2_flow

from .api import ParqetApiClient
from .const import (
    AUTHORIZE_URL,
    CLIENT_ID,
    CONF_INTERVAL,
    CONF_PORTFOLIO_ID,
    CONF_PORTFOLIO_NAME,
    CONF_SCAN_INTERVAL,
    DEFAULT_INTERVAL,
    DOMAIN,
    TOKEN_URL,
)
from .coordinator import ParqetDataUpdateCoordinator
from .frontend import async_register_frontend
from .websocket_api import async_register_websocket_api

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.CALENDAR]

type ParqetConfigEntry = ConfigEntry[ParqetDataUpdateCoordinator]


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Parqet integration."""
    from homeassistant.helpers.config_entry_oauth2_flow import (
        LocalOAuth2ImplementationWithPkce,
    )

    config_entry_oauth2_flow.async_register_implementation(
        hass,
        DOMAIN,
        LocalOAuth2ImplementationWithPkce(
            hass,
            DOMAIN,
            CLIENT_ID,
            authorize_url=AUTHORIZE_URL,
            token_url=TOKEN_URL,
            client_secret="",
        ),
    )

    # Register the frontend card static path + Lovelace resource.
    await async_register_frontend(hass)

    # Register WebSocket API commands (once, not per entry).
    async_register_websocket_api(hass)

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ParqetConfigEntry) -> bool:
    """Set up Parqet from a config entry."""
    implementation = (
        await config_entry_oauth2_flow.async_get_config_entry_implementation(
            hass, entry
        )
    )
    oauth_session = config_entry_oauth2_flow.OAuth2Session(
        hass, entry, implementation
    )

    session = aiohttp_client.async_get_clientsession(hass)
    api = ParqetApiClient(session, oauth_session=oauth_session)

    portfolio_id = entry.data[CONF_PORTFOLIO_ID]
    portfolio_name = entry.data[CONF_PORTFOLIO_NAME]
    interval = entry.options.get(CONF_INTERVAL, DEFAULT_INTERVAL)
    scan_interval_min = entry.options.get(CONF_SCAN_INTERVAL)

    coordinator = ParqetDataUpdateCoordinator(
        hass, api, portfolio_id, portfolio_name, interval, scan_interval_min
    )

    await coordinator.async_config_entry_first_refresh()

    entry.runtime_data = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    entry.async_on_unload(entry.add_update_listener(_async_update_listener))

    return True


async def _async_update_listener(
    hass: HomeAssistant, entry: ParqetConfigEntry
) -> None:
    """Handle options update by reloading the entry."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(
    hass: HomeAssistant, entry: ParqetConfigEntry
) -> bool:
    """Unload a Parqet config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
