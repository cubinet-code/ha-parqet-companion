"""The Parqet integration.

One ConfigEntry per Parqet account; portfolios are devices under that entry.
All portfolios share a single OAuth2Session so token refresh is atomic
(see Issue #6).
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field

import aiohttp
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import (
    ConfigEntryAuthFailed,
    ConfigEntryError,
    ConfigEntryNotReady,
)
from homeassistant.helpers import aiohttp_client, config_entry_oauth2_flow

from .api import (
    ParqetApiClient,
    ParqetApiError,
    ParqetAuthError,
    ParqetConnectionError,
    is_token_endpoint_reauth_error,
)
from .const import (
    CONF_INTERVAL,
    CONF_PORTFOLIO_META,
    CONF_SCAN_INTERVAL,
    CONF_SNAPSHOT_ENABLED,
    CONF_SNAPSHOT_HOUR,
    CONF_SNAPSHOT_MINUTE,
    CONF_SNAPSHOT_WEEKDAYS_ONLY,
    DEFAULT_INTERVAL,
    DEFAULT_SNAPSHOT_HOUR,
    DEFAULT_SNAPSHOT_MINUTE,
    DEFAULT_SNAPSHOT_WEEKDAYS_ONLY,
    DOMAIN,
)
from .coordinator import ParqetDataUpdateCoordinator
from .frontend import async_register_frontend
from .migration import async_migrate_entry as async_migrate_entry
from .oauth import create_parqet_oauth_implementation
from .portfolio_sync import async_reconcile_portfolios
from .services import async_register_services
from .snapshot import SnapshotManager
from .snapshot_ws import async_register_snapshot_ws
from .websocket_api import async_register_websocket_api

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.CALENDAR]


@dataclass
class ParqetAccountRuntime:
    """Per-account runtime state shared across every portfolio.

    The single `api` instance wraps one OAuth2Session, so all coordinators
    serialize token refresh through one `_token_lock` — that is what fixes
    the multi-portfolio token-refresh race (Issue #6).
    """

    api: ParqetApiClient
    coordinators: dict[str, ParqetDataUpdateCoordinator] = field(default_factory=dict)
    snapshot_managers: dict[str, SnapshotManager] = field(default_factory=dict)


type ParqetConfigEntry = ConfigEntry[ParqetAccountRuntime]


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

    # Register HA services (parqet.dump_diagnostics for user-driven debugging).
    async_register_services(hass)

    return True


async def async_setup_entry(
    hass: HomeAssistant, entry: ParqetConfigEntry
) -> bool:
    """Set up Parqet from an account-scoped config entry."""
    try:
        implementation = (
            await config_entry_oauth2_flow.async_get_config_entry_implementation(
                hass, entry
            )
        )
    except ValueError as err:
        raise ConfigEntryNotReady("OAuth2 implementation not available") from err

    oauth_session = config_entry_oauth2_flow.OAuth2Session(
        hass, entry, implementation
    )

    try:
        await oauth_session.async_ensure_token_valid()
    except aiohttp.ClientError as err:
        if is_token_endpoint_reauth_error(err):
            _LOGGER.info(
                "Parqet rejected token refresh during setup (status=%s); "
                "reauth required",
                err.status,
            )
            raise ConfigEntryAuthFailed(
                f"Token refresh rejected by Parqet "
                f"({err.status}); reauth required"
            ) from err
        raise ConfigEntryNotReady(f"Failed to refresh token: {err}") from err

    session = aiohttp_client.async_get_clientsession(hass)
    api = ParqetApiClient(session, oauth_session=oauth_session)

    # Must run before coordinator construction so we don't build coordinators
    # for portfolios that are about to be pruned.
    try:
        portfolio_ids = await async_reconcile_portfolios(hass, entry, api)
    except ParqetAuthError as err:
        raise ConfigEntryNotReady(f"Authentication failed: {err}") from err
    except ParqetConnectionError as err:
        raise ConfigEntryNotReady(f"Cannot reach Parqet: {err}") from err
    except ParqetApiError as err:
        raise ConfigEntryNotReady(f"Parqet API error: {err}") from err

    if not portfolio_ids:
        raise ConfigEntryError(
            "All configured portfolios have been removed from your Parqet "
            "account. Reconfigure this integration to pick new portfolios, or "
            "delete it if you no longer use Parqet."
        )

    portfolio_meta: dict[str, dict[str, str]] = entry.data.get(
        CONF_PORTFOLIO_META, {}
    )
    interval = entry.options.get(CONF_INTERVAL, DEFAULT_INTERVAL)
    scan_interval_min = entry.options.get(CONF_SCAN_INTERVAL)

    runtime = ParqetAccountRuntime(api=api)
    for portfolio_id in portfolio_ids:
        meta = portfolio_meta.get(portfolio_id, {})
        runtime.coordinators[portfolio_id] = ParqetDataUpdateCoordinator(
            hass,
            api,
            portfolio_id,
            meta.get("name", portfolio_id),
            interval,
            scan_interval_min,
            config_entry=entry,
        )

    # All coordinators share one OAuth2Session; refresh races are serialised by
    # its `_token_lock`. Parallelising first refresh cuts setup latency from
    # N x API round-trip to ~1.
    await asyncio.gather(
        *(c.async_config_entry_first_refresh() for c in runtime.coordinators.values())
    )

    entry.runtime_data = runtime

    if entry.options.get(CONF_SNAPSHOT_ENABLED, False):
        snapshot_hour = entry.options.get(
            CONF_SNAPSHOT_HOUR, DEFAULT_SNAPSHOT_HOUR
        )
        snapshot_minute = entry.options.get(
            CONF_SNAPSHOT_MINUTE, DEFAULT_SNAPSHOT_MINUTE
        )
        weekdays_only = entry.options.get(
            CONF_SNAPSHOT_WEEKDAYS_ONLY, DEFAULT_SNAPSHOT_WEEKDAYS_ONLY
        )
        _LOGGER.debug(
            "Snapshot enabled (hour=%s, minute=%s, portfolios=%s)",
            snapshot_hour, snapshot_minute, portfolio_ids,
        )
        for portfolio_id, coordinator in runtime.coordinators.items():
            try:
                snapshot_mgr = SnapshotManager(
                    hass,
                    coordinator,
                    portfolio_id,
                    snapshot_hour,
                    snapshot_minute,
                    weekdays_only=weekdays_only,
                )
                await snapshot_mgr.async_setup()
                runtime.snapshot_managers[portfolio_id] = snapshot_mgr
            except Exception:
                _LOGGER.exception(
                    "Failed to set up snapshot manager for portfolio %s",
                    portfolio_id,
                )
    else:
        _LOGGER.debug("Snapshots not enabled for %s", entry.entry_id)

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
    runtime = entry.runtime_data
    if runtime is not None:
        for snapshot_mgr in runtime.snapshot_managers.values():
            await snapshot_mgr.async_teardown()

    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        integration_data = hass.data.get(DOMAIN, {})
        integration_data.get("aggregate_coordinators", {}).pop(entry.entry_id, None)
        if integration_data.get("aggregate_owner_entry_id") == entry.entry_id:
            integration_data.pop("aggregate_owner_entry_id", None)
        for sensor in integration_data.get("aggregate_sensors", []):
            sensor.refresh_coordinators()

    return unload_ok
