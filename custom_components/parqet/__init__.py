"""The Parqet integration."""

from __future__ import annotations

import logging

import aiohttp
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers import aiohttp_client, config_entry_oauth2_flow

from .api import ParqetApiClient
from .const import (
    CONF_INTERVAL,
    CONF_PORTFOLIO_ID,
    CONF_PORTFOLIO_NAME,
    CONF_SCAN_INTERVAL,
    CONF_SNAPSHOT_ENABLED,
    CONF_SNAPSHOT_HOUR,
    CONF_SNAPSHOT_MINUTE,
    DEFAULT_INTERVAL,
    DEFAULT_SNAPSHOT_HOUR,
    DEFAULT_SNAPSHOT_MINUTE,
    DOMAIN,
)
from .coordinator import ParqetDataUpdateCoordinator
from .frontend import async_register_frontend
from .oauth import create_parqet_oauth_implementation
from .snapshot import SnapshotManager
from .snapshot_ws import async_register_snapshot_ws
from .websocket_api import async_register_websocket_api

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.CALENDAR]

type ParqetConfigEntry = ConfigEntry[ParqetDataUpdateCoordinator]


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Parqet integration."""
    config_entry_oauth2_flow.async_register_implementation(
        hass,
        DOMAIN,
        create_parqet_oauth_implementation(hass),
    )

    # Register the frontend card static path + Lovelace resource.
    await async_register_frontend(hass)

    # Register WebSocket API commands (once, not per entry).
    async_register_websocket_api(hass)
    async_register_snapshot_ws(hass)

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ParqetConfigEntry) -> bool:
    """Set up Parqet from a config entry."""
    try:
        implementation = (
            await config_entry_oauth2_flow.async_get_config_entry_implementation(
                hass, entry
            )
        )
    except ValueError as err:
        raise ConfigEntryNotReady(
            "OAuth2 implementation not available"
        ) from err

    oauth_session = config_entry_oauth2_flow.OAuth2Session(
        hass, entry, implementation
    )

    try:
        await oauth_session.async_ensure_token_valid()
    except aiohttp.ClientError as err:
        raise ConfigEntryNotReady(
            f"Failed to refresh token: {err}"
        ) from err

    session = aiohttp_client.async_get_clientsession(hass)
    api = ParqetApiClient(session, oauth_session=oauth_session)

    portfolio_id = entry.data[CONF_PORTFOLIO_ID]
    portfolio_name = entry.data[CONF_PORTFOLIO_NAME]
    interval = entry.options.get(CONF_INTERVAL, DEFAULT_INTERVAL)
    scan_interval_min = entry.options.get(CONF_SCAN_INTERVAL)

    coordinator = ParqetDataUpdateCoordinator(
        hass, api, portfolio_id, portfolio_name, interval, scan_interval_min,
        config_entry=entry,
    )

    await coordinator.async_config_entry_first_refresh()

    entry.runtime_data = coordinator

    # Set up daily snapshot manager if enabled.
    if entry.options.get(CONF_SNAPSHOT_ENABLED, False):
        snapshot_mgr = SnapshotManager(
            hass,
            coordinator,
            entry.entry_id,
            entry.options.get(CONF_SNAPSHOT_HOUR, DEFAULT_SNAPSHOT_HOUR),
            entry.options.get(CONF_SNAPSHOT_MINUTE, DEFAULT_SNAPSHOT_MINUTE),
        )
        await snapshot_mgr.async_setup()
        hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {
            "snapshot_manager": snapshot_mgr,
        }

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
    # Tear down snapshot manager if active.
    if mgr_data := hass.data.get(DOMAIN, {}).pop(entry.entry_id, None):
        await mgr_data["snapshot_manager"].async_teardown()

    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
