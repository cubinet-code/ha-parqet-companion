"""Tests for the v1 → v2 ConfigEntry schema migration (Issue #6)."""

from __future__ import annotations

import time
from typing import Any
from unittest.mock import patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet.const import (
    CONF_CURRENCY,
    CONF_PORTFOLIO_ID,
    CONF_PORTFOLIO_NAME,
    DOMAIN,
)
from custom_components.parqet.migration import (
    _SNAPSHOT_STORAGE_VERSION,
    async_migrate_entry,
    build_v2_data,
    extract_user_id,
    find_v1_siblings,
    pick_freshest_token,
    pick_primary,
    reassociate_devices,
    rename_snapshot_store,
)

# ───── extract_user_id ─────────────────────────────────────────────────────


def test_extract_user_id_parses_unique_id() -> None:
    assert extract_user_id("user_abc_portfolio_xyz") == "user"


def test_extract_user_id_empty_returns_empty() -> None:
    assert extract_user_id("") == ""
    assert extract_user_id(None) == ""


def test_extract_user_id_no_separator_returns_empty() -> None:
    assert extract_user_id("nounderscore") == ""


# ───── pick_freshest_token ─────────────────────────────────────────────────


def test_pick_freshest_token_picks_latest_expires_at() -> None:
    now = 1000.0
    tokens = [
        {"refresh_token": "old", "expires_at": now - 100},
        {"refresh_token": "freshest", "expires_at": now + 3600},
        {"refresh_token": "middle", "expires_at": now + 100},
    ]
    token, is_valid = pick_freshest_token(tokens, now=now)
    assert token is not None
    assert token["refresh_token"] == "freshest"
    assert is_valid is True


def test_pick_freshest_token_marks_invalid_when_all_expired() -> None:
    now = 1000.0
    tokens = [
        {"refresh_token": "a", "expires_at": now - 100},
        {"refresh_token": "b", "expires_at": now - 50},
    ]
    token, is_valid = pick_freshest_token(tokens, now=now)
    assert token is not None
    assert token["refresh_token"] == "b"
    assert is_valid is False


def test_pick_freshest_token_empty_returns_none() -> None:
    token, is_valid = pick_freshest_token([])
    assert token is None
    assert is_valid is False


def test_pick_freshest_token_respects_grace_window() -> None:
    """A token expiring within the grace window counts as invalid."""
    now = 1000.0
    tokens = [{"refresh_token": "a", "expires_at": now + 5}]
    _, is_valid = pick_freshest_token(tokens, now=now)
    assert is_valid is False


# ───── pick_primary ────────────────────────────────────────────────────────


def test_pick_primary_picks_lowest_entry_id(
    hass: HomeAssistant,
) -> None:
    entries = [
        MockConfigEntry(domain=DOMAIN, entry_id="zzz", unique_id="u_p1"),
        MockConfigEntry(domain=DOMAIN, entry_id="aaa", unique_id="u_p2"),
        MockConfigEntry(domain=DOMAIN, entry_id="mmm", unique_id="u_p3"),
    ]
    assert pick_primary(entries).entry_id == "aaa"


def test_pick_primary_empty_raises() -> None:
    with pytest.raises(ValueError):
        pick_primary([])


# ───── find_v1_siblings ────────────────────────────────────────────────────


def test_find_v1_siblings_matches_user_prefix(hass: HomeAssistant) -> None:
    alice_a = MockConfigEntry(
        domain=DOMAIN, unique_id="alice_p1", entry_id="01", version=1
    )
    alice_b = MockConfigEntry(
        domain=DOMAIN, unique_id="alice_p2", entry_id="02", version=1
    )
    bob = MockConfigEntry(
        domain=DOMAIN, unique_id="bob_p1", entry_id="03", version=1
    )
    for e in (alice_a, alice_b, bob):
        e.add_to_hass(hass)

    siblings = find_v1_siblings(hass, "alice")
    assert [e.entry_id for e in siblings] == ["01", "02"]


def test_find_v1_siblings_ignores_v2_entries(hass: HomeAssistant) -> None:
    v1 = MockConfigEntry(
        domain=DOMAIN, unique_id="u_p1", entry_id="v1", version=1
    )
    v2 = MockConfigEntry(
        domain=DOMAIN, unique_id="u_p2", entry_id="v2", version=2
    )
    for e in (v1, v2):
        e.add_to_hass(hass)
    assert [e.entry_id for e in find_v1_siblings(hass, "u")] == ["v1"]


# ───── build_v2_data ───────────────────────────────────────────────────────


def test_build_v2_data_merges_all_portfolios() -> None:
    siblings = [
        MockConfigEntry(
            domain=DOMAIN,
            entry_id="e1",
            unique_id="u_p1",
            data={
                CONF_PORTFOLIO_ID: "p1",
                CONF_PORTFOLIO_NAME: "Aktien",
                CONF_CURRENCY: "EUR",
            },
        ),
        MockConfigEntry(
            domain=DOMAIN,
            entry_id="e2",
            unique_id="u_p2",
            data={
                CONF_PORTFOLIO_ID: "p2",
                CONF_PORTFOLIO_NAME: "Crypto",
                CONF_CURRENCY: "USD",
            },
        ),
    ]
    token = {"refresh_token": "rt", "expires_at": time.time() + 3600}
    data = build_v2_data(
        siblings, "user_x", auth_implementation=DOMAIN, token=token
    )
    assert data["user_id"] == "user_x"
    assert data["portfolio_ids"] == ["p1", "p2"]
    assert data["portfolio_meta"] == {
        "p1": {"name": "Aktien", "currency": "EUR"},
        "p2": {"name": "Crypto", "currency": "USD"},
    }
    assert data["token"] is token
    assert data["auth_implementation"] == DOMAIN


def test_build_v2_data_skips_entries_without_portfolio_id() -> None:
    siblings = [
        MockConfigEntry(
            domain=DOMAIN,
            entry_id="e1",
            unique_id="u_p1",
            data={CONF_PORTFOLIO_ID: "p1", CONF_PORTFOLIO_NAME: "n1"},
        ),
        MockConfigEntry(
            domain=DOMAIN, entry_id="e2", unique_id="u_p2", data={}
        ),
    ]
    data = build_v2_data(
        siblings, "u", auth_implementation=DOMAIN, token={}
    )
    assert data["portfolio_ids"] == ["p1"]


# ───── rename_snapshot_store ───────────────────────────────────────────────


async def test_rename_snapshot_store_preserves_data(
    hass: HomeAssistant,
) -> None:
    """The 7-day rolling snapshot history survives the key rename."""
    from homeassistant.helpers.storage import Store

    old_key = "parqet_snapshots_old"
    new_key = "parqet_snapshots_new"
    payload: dict[str, Any] = {
        "snapshots": {"2026-05-10": {"total_value": 1234.5}}
    }

    src = Store[dict[str, Any]](hass, _SNAPSHOT_STORAGE_VERSION, old_key)
    await src.async_save(payload)

    renamed = await rename_snapshot_store(hass, old_key, new_key)
    assert renamed is True

    dst = Store[dict[str, Any]](hass, _SNAPSHOT_STORAGE_VERSION, new_key)
    assert await dst.async_load() == payload
    assert await src.async_load() is None


async def test_rename_snapshot_store_no_old_data_is_noop(
    hass: HomeAssistant,
) -> None:
    renamed = await rename_snapshot_store(
        hass, "parqet_snapshots_missing", "parqet_snapshots_target"
    )
    assert renamed is False


async def test_rename_snapshot_store_same_key_is_noop(
    hass: HomeAssistant,
) -> None:
    assert (
        await rename_snapshot_store(hass, "same_key", "same_key") is False
    )


# ───── reassociate_devices ─────────────────────────────────────────────────


def test_reassociate_devices_moves_parqet_devices(
    hass: HomeAssistant,
) -> None:
    """Devices linked to the source entry get re-linked to the target entry."""
    source = MockConfigEntry(
        domain=DOMAIN, entry_id="src", unique_id="u_p1", version=1
    )
    target = MockConfigEntry(
        domain=DOMAIN, entry_id="tgt", unique_id="u_p2", version=1
    )
    source.add_to_hass(hass)
    target.add_to_hass(hass)

    registry = dr.async_get(hass)
    parqet_device = registry.async_get_or_create(
        config_entry_id=source.entry_id,
        identifiers={(DOMAIN, "p1")},
        name="Portfolio 1",
    )
    # Foreign device on the same source entry should NOT be touched
    foreign_device = registry.async_get_or_create(
        config_entry_id=source.entry_id,
        identifiers={("other_domain", "x")},
        name="Foreign",
    )

    moved = reassociate_devices(
        hass, from_entry_id=source.entry_id, to_entry_id=target.entry_id
    )
    assert moved == 1

    parqet_after = registry.async_get(parqet_device.id)
    assert parqet_after is not None
    assert target.entry_id in parqet_after.config_entries
    assert source.entry_id not in parqet_after.config_entries

    foreign_after = registry.async_get(foreign_device.id)
    assert foreign_after is not None
    assert source.entry_id in foreign_after.config_entries


def test_reassociate_devices_same_entry_is_noop(
    hass: HomeAssistant,
) -> None:
    assert (
        reassociate_devices(
            hass, from_entry_id="same", to_entry_id="same"
        )
        == 0
    )


# ───── async_migrate_entry — full orchestrator ─────────────────────────────


def _make_v1_entry(
    entry_id: str,
    user_id: str,
    portfolio_id: str,
    *,
    token_expires_at: float | None = None,
    portfolio_name: str | None = None,
    currency: str = "EUR",
) -> MockConfigEntry:
    token = {
        "access_token": f"at-{entry_id}",
        "refresh_token": f"rt-{entry_id}",
        "expires_at": token_expires_at if token_expires_at is not None else 0,
    }
    return MockConfigEntry(
        domain=DOMAIN,
        entry_id=entry_id,
        unique_id=f"{user_id}_{portfolio_id}",
        version=1,
        data={
            "auth_implementation": DOMAIN,
            "token": token,
            CONF_PORTFOLIO_ID: portfolio_id,
            CONF_PORTFOLIO_NAME: portfolio_name or f"Portfolio {portfolio_id}",
            CONF_CURRENCY: currency,
        },
    )


async def test_async_migrate_entry_already_v2_is_noop(
    hass: HomeAssistant,
) -> None:
    entry = MockConfigEntry(
        domain=DOMAIN, entry_id="e1", unique_id="u", version=2, data={}
    )
    entry.add_to_hass(hass)
    assert await async_migrate_entry(hass, entry) is True
    assert entry.version == 2


async def test_async_migrate_entry_malformed_unique_id_fails(
    hass: HomeAssistant,
) -> None:
    entry = MockConfigEntry(
        domain=DOMAIN, entry_id="bad", unique_id="nounderscore", version=1, data={}
    )
    entry.add_to_hass(hass)
    assert await async_migrate_entry(hass, entry) is False


async def test_async_migrate_entry_primary_merges_siblings(
    hass: HomeAssistant,
) -> None:
    now = time.time()
    a = _make_v1_entry("a01", "user", "p1", token_expires_at=now + 3600)
    b = _make_v1_entry("a02", "user", "p2", token_expires_at=now + 100)
    c = _make_v1_entry("a03", "user", "p3", token_expires_at=now + 7200)
    for e in (a, b, c):
        e.add_to_hass(hass)

    with patch(
        "custom_components.parqet.migration.ConfigEntry.async_start_reauth"
    ) as start_reauth:
        ok = await async_migrate_entry(hass, a)

    assert ok is True

    # Primary survives, upgraded to v2
    survivors = hass.config_entries.async_entries(DOMAIN)
    assert len(survivors) == 1
    primary = survivors[0]
    assert primary.entry_id == "a01"
    assert primary.version == 2
    assert primary.unique_id == "user"
    assert primary.data["user_id"] == "user"
    assert sorted(primary.data["portfolio_ids"]) == ["p1", "p2", "p3"]
    assert primary.data["portfolio_meta"]["p1"]["name"] == "Portfolio p1"
    # Freshest token (c, expires_at=now+7200) wins
    assert primary.data["token"]["refresh_token"] == "rt-a03"

    # No reauth triggered when at least one token is valid
    start_reauth.assert_not_called()


async def test_async_migrate_entry_non_primary_short_circuits(
    hass: HomeAssistant,
) -> None:
    """A non-primary call returns True without changing entries."""
    now = time.time()
    a = _make_v1_entry("a01", "user", "p1", token_expires_at=now + 3600)
    b = _make_v1_entry("a02", "user", "p2", token_expires_at=now + 3600)
    a.add_to_hass(hass)
    b.add_to_hass(hass)

    assert await async_migrate_entry(hass, b) is True

    # Nothing should have changed — both still v1, both still present
    entries = hass.config_entries.async_entries(DOMAIN)
    assert {e.entry_id for e in entries} == {"a01", "a02"}
    assert all(e.version == 1 for e in entries)


async def test_async_migrate_entry_all_expired_triggers_reauth(
    hass: HomeAssistant,
) -> None:
    """If every sibling token is expired, the migrated entry enters reauth."""
    now = time.time()
    a = _make_v1_entry("a01", "user", "p1", token_expires_at=now - 100)
    b = _make_v1_entry("a02", "user", "p2", token_expires_at=now - 50)
    a.add_to_hass(hass)
    b.add_to_hass(hass)

    with patch(
        "custom_components.parqet.migration.ConfigEntry.async_start_reauth"
    ) as start_reauth:
        ok = await async_migrate_entry(hass, a)

    assert ok is True
    start_reauth.assert_called_once()


async def test_async_migrate_entry_renames_snapshot_stores(
    hass: HomeAssistant,
) -> None:
    """Snapshot history under the per-entry key migrates to the per-portfolio key."""
    from homeassistant.helpers.storage import Store

    now = time.time()
    a = _make_v1_entry("a01", "user", "p1", token_expires_at=now + 3600)
    b = _make_v1_entry("a02", "user", "p2", token_expires_at=now + 3600)
    a.add_to_hass(hass)
    b.add_to_hass(hass)

    payload_a = {"snapshots": {"2026-05-12": {"total_value": 1000.0}}}
    payload_b = {"snapshots": {"2026-05-12": {"total_value": 2000.0}}}
    await Store(hass, _SNAPSHOT_STORAGE_VERSION, "parqet_snapshots_a01").async_save(
        payload_a
    )
    await Store(hass, _SNAPSHOT_STORAGE_VERSION, "parqet_snapshots_a02").async_save(
        payload_b
    )

    assert await async_migrate_entry(hass, a) is True

    assert (
        await Store(
            hass, _SNAPSHOT_STORAGE_VERSION, "parqet_snapshots_p1"
        ).async_load()
        == payload_a
    )
    assert (
        await Store(
            hass, _SNAPSHOT_STORAGE_VERSION, "parqet_snapshots_p2"
        ).async_load()
        == payload_b
    )
    # Old per-entry stores are gone
    assert (
        await Store(
            hass, _SNAPSHOT_STORAGE_VERSION, "parqet_snapshots_a01"
        ).async_load()
        is None
    )
    assert (
        await Store(
            hass, _SNAPSHOT_STORAGE_VERSION, "parqet_snapshots_a02"
        ).async_load()
        is None
    )


async def test_async_migrate_entry_reassociates_devices(
    hass: HomeAssistant,
) -> None:
    """Per-portfolio devices stay alive and point at the surviving primary."""
    now = time.time()
    a = _make_v1_entry("a01", "user", "p1", token_expires_at=now + 3600)
    b = _make_v1_entry("a02", "user", "p2", token_expires_at=now + 3600)
    a.add_to_hass(hass)
    b.add_to_hass(hass)

    registry = dr.async_get(hass)
    registry.async_get_or_create(
        config_entry_id=a.entry_id,
        identifiers={(DOMAIN, "p1")},
        name="Portfolio 1",
    )
    sibling_device = registry.async_get_or_create(
        config_entry_id=b.entry_id,
        identifiers={(DOMAIN, "p2")},
        name="Portfolio 2",
    )

    assert await async_migrate_entry(hass, a) is True

    # Sibling's device is re-linked to the primary, identifier intact
    after = registry.async_get(sibling_device.id)
    assert after is not None
    assert (DOMAIN, "p2") in after.identifiers
    assert "a01" in after.config_entries
    assert "a02" not in after.config_entries
