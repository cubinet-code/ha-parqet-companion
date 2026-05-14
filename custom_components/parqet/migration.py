"""Helpers for migrating Parqet ConfigEntry schema v1 → v2.

v1 schema: one ConfigEntry per portfolio.
  unique_id = f"{user_id}_{portfolio_id}"
  data      = {auth_implementation, token, portfolio_id, portfolio_name, currency}

v2 schema: one ConfigEntry per Parqet account.
  unique_id = user_id
  data      = {auth_implementation, token, user_id, portfolio_ids, portfolio_meta}

The merge picks the freshest valid token across siblings so the user does
not need to re-authenticate when at least one sibling still has a usable
token. Per-portfolio devices keep their identifiers and are re-associated
with the surviving primary entry. Per-entry snapshot stores are renamed to
per-portfolio so 7-day rolling history survives.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.storage import Store

from .const import (
    CONF_CURRENCY,
    CONF_PORTFOLIO_ID,
    CONF_PORTFOLIO_NAME,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)

# Mirrors HA's OAuth2Session CLOCK_OUT_OF_SYNC_MAX_SEC grace window.
_TOKEN_VALIDITY_GRACE_SEC = 20

# Mirrors snapshot.STORAGE_VERSION — kept literal here to avoid pulling
# snapshot.py (which imports coordinator) into migration scope.
_SNAPSHOT_STORAGE_VERSION = 1


def extract_user_id(unique_id: str | None) -> str:
    """Parse user_id from a v1 unique_id of the form `{user_id}_{portfolio_id}`.

    Returns the empty string if the unique_id is missing or malformed.
    """
    if not unique_id:
        return ""
    user_id, sep, _portfolio_id = unique_id.partition("_")
    return user_id if sep else ""


def find_v1_siblings(
    hass: HomeAssistant, user_id: str
) -> list[ConfigEntry]:
    """Return all v1 ConfigEntrys for the same Parqet account.

    Matches when `unique_id` starts with `{user_id}_` and `version < 2`.
    Sorted by `entry_id` for deterministic primary selection.
    """
    prefix = f"{user_id}_"
    siblings = [
        e
        for e in hass.config_entries.async_entries(DOMAIN)
        if e.version < 2 and e.unique_id and e.unique_id.startswith(prefix)
    ]
    siblings.sort(key=lambda e: e.entry_id)
    return siblings


def pick_primary(siblings: list[ConfigEntry]) -> ConfigEntry:
    """Pick the deterministic primary entry from a sibling group.

    Lowest `entry_id` lexicographically — every migrate call agrees on the
    same primary regardless of HA's iteration order.
    """
    if not siblings:
        raise ValueError("No sibling entries supplied")
    return min(siblings, key=lambda e: e.entry_id)


def pick_freshest_token(
    tokens: list[dict[str, Any]],
    *,
    now: float | None = None,
) -> tuple[dict[str, Any] | None, bool]:
    """Return (token_with_latest_expires_at, is_still_valid).

    `is_still_valid` is True iff the picked token's `expires_at` is more
    than the grace window into the future. With no tokens, returns
    `(None, False)`.
    """
    if not tokens:
        return None, False
    current = now if now is not None else time.time()
    fresh = max(tokens, key=lambda t: t.get("expires_at", 0))
    is_valid = fresh.get("expires_at", 0) > current + _TOKEN_VALIDITY_GRACE_SEC
    return fresh, is_valid


def build_v2_data(
    siblings: list[ConfigEntry],
    user_id: str,
    *,
    auth_implementation: str,
    token: dict[str, Any],
) -> dict[str, Any]:
    """Compose the new v2 data dict from a group of v1 siblings.

    Order of `portfolio_ids` matches the order of `siblings`, which is
    `entry_id` order from `find_v1_siblings` — giving stable migration output.
    """
    portfolio_ids: list[str] = []
    portfolio_meta: dict[str, dict[str, str]] = {}
    for s in siblings:
        pid = s.data.get(CONF_PORTFOLIO_ID)
        if not pid:
            continue
        portfolio_ids.append(pid)
        portfolio_meta[pid] = {
            "name": s.data.get(CONF_PORTFOLIO_NAME, pid),
            "currency": s.data.get(CONF_CURRENCY, "EUR"),
        }
    return {
        "auth_implementation": auth_implementation,
        "token": token,
        "user_id": user_id,
        "portfolio_ids": portfolio_ids,
        "portfolio_meta": portfolio_meta,
    }


async def rename_snapshot_store(
    hass: HomeAssistant, old_key: str, new_key: str
) -> bool:
    """Move snapshot data from `old_key` to `new_key`, preserving content.

    No-op when keys are equal or when `old_key` has no stored data.
    Returns True if a rename happened, False otherwise.
    """
    if old_key == new_key:
        return False
    old_store: Store[dict[str, Any]] = Store(
        hass, _SNAPSHOT_STORAGE_VERSION, old_key
    )
    data = await old_store.async_load()
    if data is None:
        return False
    new_store: Store[dict[str, Any]] = Store(
        hass, _SNAPSHOT_STORAGE_VERSION, new_key
    )
    await new_store.async_save(data)
    await old_store.async_remove()
    _LOGGER.debug("Renamed snapshot store: %s → %s", old_key, new_key)
    return True


def reassociate_devices(
    hass: HomeAssistant,
    *,
    from_entry_id: str,
    to_entry_id: str,
) -> int:
    """Re-link every Parqet device pointing at `from_entry_id` to `to_entry_id`.

    Returns the number of devices moved. No-op when source equals target.
    """
    if from_entry_id == to_entry_id:
        return 0
    registry = dr.async_get(hass)
    moved = 0
    for device in list(registry.devices.values()):
        if from_entry_id not in device.config_entries:
            continue
        if not any(ident[0] == DOMAIN for ident in device.identifiers):
            continue
        registry.async_update_device(
            device.id,
            add_config_entry_id=to_entry_id,
            remove_config_entry_id=from_entry_id,
        )
        moved += 1
    return moved


async def async_migrate_entry(
    hass: HomeAssistant, entry: ConfigEntry
) -> bool:
    """Migrate a v1 per-portfolio ConfigEntry to the v2 per-account schema.

    The first call for a sibling group performs the full merge: builds the
    v2 data on the deterministic primary, renames per-entry snapshot stores
    to per-portfolio, re-associates devices to the primary, then removes
    the now-empty sibling entries. Subsequent calls — on entries that
    happen to still be queued for migration — short-circuit because the
    primary's removal already deleted them or this is already the primary
    on a re-run.

    Returns True when the entry is now v2 (either freshly migrated or
    already absorbed), False on unrecoverable errors.
    """
    if entry.version >= 2:
        return True

    user_id = extract_user_id(entry.unique_id)
    if not user_id:
        _LOGGER.error(
            "Cannot migrate Parqet entry %s: malformed unique_id %r",
            entry.entry_id,
            entry.unique_id,
        )
        return False

    # Stale-sibling cleanup: if migration already produced a v2 entry for this
    # user, this v1 entry was missed by the previous removal pass. Remove it.
    for existing in hass.config_entries.async_entries(DOMAIN):
        if existing.version >= 2 and existing.unique_id == user_id:
            _LOGGER.debug(
                "v2 entry already exists for user %s; removing stale v1 %s",
                user_id, entry.entry_id,
            )
            hass.async_create_task(
                hass.config_entries.async_remove(entry.entry_id)
            )
            return False

    siblings = find_v1_siblings(hass, user_id)
    if not siblings:
        _LOGGER.warning(
            "Migration called on entry %s but no v1 siblings present",
            entry.entry_id,
        )
        return False

    primary = pick_primary(siblings)

    # Only the primary's call performs the merge. If a non-primary lands here
    # first (concurrent migrate calls), let it succeed — the primary's call
    # will remove this entry shortly. If the primary ran first, this entry is
    # already gone before HA reaches it.
    if entry.entry_id != primary.entry_id:
        return True

    tokens = [
        s.data["token"] for s in siblings if isinstance(s.data.get("token"), dict)
    ]
    best_token, is_valid = pick_freshest_token(tokens)
    if best_token is None:
        _LOGGER.error(
            "Cannot migrate user %s: no OAuth token across %d siblings",
            user_id, len(siblings),
        )
        return False

    new_data = build_v2_data(
        siblings,
        user_id,
        auth_implementation=entry.data.get("auth_implementation", DOMAIN),
        token=best_token,
    )

    for s in siblings:
        portfolio_id = s.data.get(CONF_PORTFOLIO_ID)
        if not portfolio_id:
            continue
        await rename_snapshot_store(
            hass,
            old_key=f"parqet_snapshots_{s.entry_id}",
            new_key=f"parqet_snapshots_{portfolio_id}",
        )

    for s in siblings:
        if s.entry_id == primary.entry_id:
            continue
        reassociate_devices(
            hass,
            from_entry_id=s.entry_id,
            to_entry_id=primary.entry_id,
        )

    hass.config_entries.async_update_entry(
        primary,
        unique_id=user_id,
        data=new_data,
        version=2,
        minor_version=1,
    )

    for s in siblings:
        if s.entry_id == primary.entry_id:
            continue
        await hass.config_entries.async_remove(s.entry_id)

    if not is_valid:
        _LOGGER.info(
            "Migrated Parqet entry %s to v2 but no sibling token was still "
            "valid — starting reauth flow",
            primary.entry_id,
        )
        primary.async_start_reauth(hass)
    else:
        _LOGGER.info(
            "Migrated Parqet entry %s to v2 (merged %d sibling(s); "
            "freshest token reused)",
            primary.entry_id,
            len(siblings) - 1,
        )

    return True
