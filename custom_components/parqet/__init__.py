"""The Parqet integration.

One ConfigEntry per Parqet account; portfolios are devices under that entry.
All portfolios share a single OAuth2Session so token refresh is atomic
(see Issue #6).
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any

import aiohttp
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import (
    ConfigEntryAuthFailed,
    ConfigEntryError,
    ConfigEntryNotReady,
)
from homeassistant.helpers import aiohttp_client, config_entry_oauth2_flow
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .api import (
    ParqetApiClient,
    ParqetApiError,
    ParqetAuthError,
    ParqetConnectionError,
    is_token_endpoint_reauth_error,
)
from .const import (
    COMBINED_UNIQUE_ID,
    CONF_ENTRY_TYPE,
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
    ENTRY_TYPE_COMBINED,
    SIGNAL_ACCOUNTS_UPDATED,
)
from .coordinator import ParqetDataUpdateCoordinator
from .frontend import async_register_frontend
from .migration import async_migrate_entry as async_migrate_entry
from .oauth import create_parqet_oauth_implementation
from .portfolio_sync import async_reconcile_portfolios
from .rate_limit import async_get_rate_limit_state
from .services import async_register_services
from .snapshot import SnapshotManager
from .snapshot_ws import async_register_snapshot_ws
from .websocket_api import async_register_websocket_api

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.CALENDAR]
COMBINED_PLATFORMS: list[Platform] = [Platform.SENSOR]


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
    # On-demand `/performance` responses keyed by (portfolio ids, interval).
    # Lives on the runtime so HA's own lifecycle invalidates it: the runtime is
    # discarded on unload and reload, and a Combined request reuses each
    # source's entry here rather than needing a second, global cache.
    performance_cache: dict[
        tuple[tuple[str, ...], str], tuple[float, dict[str, Any]]
    ] = field(default_factory=dict)
    # Cache misses for the same key share one task. Kept separate from completed
    # responses so failures are never retained as cache entries.
    performance_inflight: dict[
        tuple[tuple[str, ...], str], asyncio.Task[dict[str, Any]]
    ] = field(default_factory=dict)


@dataclass
class ParqetCombinedRuntime:
    """Runtime marker for the HA-owned Combined config entry."""


type ParqetRuntime = ParqetAccountRuntime | ParqetCombinedRuntime
type ParqetConfigEntry = ConfigEntry[ParqetRuntime]


def _migrate_combined_registry_ownership(
    hass: HomeAssistant,
    entry: ParqetConfigEntry,
) -> None:
    """Move legacy aggregate registry records to the explicit Combined entry."""
    device_registry = dr.async_get(hass)
    device = device_registry.async_get_device(
        identifiers={(DOMAIN, COMBINED_UNIQUE_ID)}
    )
    if device is None:
        # No legacy aggregate device means there is nothing to re-own; the
        # aggregate entities have always lived on it.
        return

    entity_registry = er.async_get(hass)
    unique_id_prefix = f"{COMBINED_UNIQUE_ID}_"
    for registry_entry in er.async_entries_for_device(
        entity_registry, device.id, include_disabled_entities=True
    ):
        if (
            registry_entry.platform == DOMAIN
            and registry_entry.unique_id.startswith(unique_id_prefix)
            and registry_entry.config_entry_id != entry.entry_id
        ):
            entity_registry.async_update_entity(
                registry_entry.entity_id,
                config_entry_id=entry.entry_id,
            )

    if entry.entry_id not in device.config_entries:
        device_registry.async_update_device(
            device.id,
            add_config_entry_id=entry.entry_id,
        )
    for old_entry_id in device.config_entries - {entry.entry_id}:
        device_registry.async_update_device(
            device.id,
            remove_config_entry_id=old_entry_id,
        )


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
    """Set up Parqet from an account or Combined config entry."""
    if entry.data.get(CONF_ENTRY_TYPE) == ENTRY_TYPE_COMBINED:
        _migrate_combined_registry_ownership(hass, entry)
        entry.runtime_data = ParqetCombinedRuntime()
        await hass.config_entries.async_forward_entry_setups(entry, COMBINED_PLATFORMS)
        entry.async_on_unload(entry.add_update_listener(_async_update_listener))
        return True

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
    api = ParqetApiClient(
        session,
        oauth_session=oauth_session,
        rate_limit=async_get_rate_limit_state(hass),
    )

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

    @callback
    def _notify_combined_when_loaded() -> None:
        if entry.state is ConfigEntryState.LOADED:
            async_dispatcher_send(hass, SIGNAL_ACCOUNTS_UPDATED, None)

    entry.async_on_unload(entry.async_on_state_change(_notify_combined_when_loaded))
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
    is_combined = entry.data.get(CONF_ENTRY_TYPE) == ENTRY_TYPE_COMBINED
    runtime = entry.runtime_data
    if isinstance(runtime, ParqetAccountRuntime):
        for snapshot_mgr in runtime.snapshot_managers.values():
            await snapshot_mgr.async_teardown()

    platforms = COMBINED_PLATFORMS if is_combined else PLATFORMS
    unload_ok = await hass.config_entries.async_unload_platforms(entry, platforms)
    if unload_ok and not is_combined:
        # HA only flips this entry to NOT_LOADED (and drops `runtime_data`)
        # *after* this coroutine returns, so the Combined sensors would still
        # read it as a loaded source and publish a stale total. Name the entry
        # that is going away so they can exclude it right now.
        async_dispatcher_send(hass, SIGNAL_ACCOUNTS_UPDATED, entry.entry_id)

    return unload_ok
