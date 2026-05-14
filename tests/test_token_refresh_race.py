"""Regression test for the multi-portfolio token refresh race (Issue #6).

Before the v2 architecture switch, each portfolio was its own ConfigEntry
holding its own OAuth2Session. N coordinators detected token expiry on the
same tick and tried to refresh in parallel; Parqet rotates the refresh
token on every exchange, so only the first refresh kept a valid token —
the rest received 400 invalid_grant.

After the switch (Issue #6), one ConfigEntry per account drives N
coordinators that share a single OAuth2Session. The session's internal
`_token_lock` serialises refreshes and the second-through-Nth coroutines
observe the freshly-refreshed token and return without making another
HTTP call. This test pins that invariant.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any
from unittest.mock import patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_entry_oauth2_flow
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet.const import DOMAIN
from custom_components.parqet.oauth import create_parqet_oauth_implementation

N_PORTFOLIOS = 4


def _make_token(refresh_token: str, ttl: int = 3600) -> dict[str, Any]:
    """Build an OAuth token dict in the shape HA's OAuth2Session expects."""
    return {
        "access_token": f"access-for-{refresh_token}",
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "expires_in": ttl,
        "expires_at": time.time() + ttl,
    }


class RotatingTokenEndpoint:
    """Simulates Parqet's /oauth2/token with refresh-token rotation.

    Each successful refresh issues a new refresh_token and invalidates the
    old one. Subsequent refresh attempts with a stale token raise — modelling
    Parqet's `400 invalid_grant`.
    """

    def __init__(self, initial_refresh_token: str) -> None:
        self._current_refresh_token = initial_refresh_token
        self._refresh_count = 0
        self.presented_tokens: list[str] = []

    async def refresh(self, token: dict[str, Any]) -> dict[str, Any]:
        presented = token.get("refresh_token", "")
        self.presented_tokens.append(presented)

        if presented != self._current_refresh_token:
            raise Exception(
                f"invalid_grant: refresh token {presented!r} is no longer valid"
            )

        self._refresh_count += 1
        new_refresh = f"rt-rotation-{self._refresh_count}"
        self._current_refresh_token = new_refresh
        return _make_token(new_refresh)

    @property
    def refresh_count(self) -> int:
        return self._refresh_count


@pytest.fixture
def parqet_oauth_impl(
    hass: HomeAssistant,
) -> config_entry_oauth2_flow.LocalOAuth2Implementation:
    """Register the Parqet OAuth2 implementation for the test."""
    impl = create_parqet_oauth_implementation(hass)
    config_entry_oauth2_flow.async_register_implementation(hass, DOMAIN, impl)
    return impl


async def test_shared_session_makes_a_single_refresh_call(
    hass: HomeAssistant,
    parqet_oauth_impl: config_entry_oauth2_flow.LocalOAuth2Implementation,
) -> None:
    """v2 architecture: N coordinators per account refresh exactly once together.

    One ConfigEntry → one OAuth2Session → one `_token_lock`. The N concurrent
    `async_ensure_token_valid()` calls serialize behind the lock; the first
    refreshes and writes the new token, the rest observe `valid_token=True`
    and skip the network call entirely.
    """
    endpoint = RotatingTokenEndpoint("rt-initial")
    initial = _make_token("rt-initial")
    initial["expires_at"] = 0  # force a refresh on first ensure call

    entry = MockConfigEntry(
        domain=DOMAIN,
        data={
            "auth_implementation": DOMAIN,
            "token": dict(initial),
            "user_id": "user_account",
            "portfolio_ids": [f"p{i}" for i in range(N_PORTFOLIOS)],
        },
        unique_id="user_account",
        version=2,
    )
    entry.add_to_hass(hass)

    session = config_entry_oauth2_flow.OAuth2Session(hass, entry, parqet_oauth_impl)

    with patch.object(
        parqet_oauth_impl,
        "_async_refresh_token",
        side_effect=endpoint.refresh,
    ):
        results = await asyncio.gather(
            *(session.async_ensure_token_valid() for _ in range(N_PORTFOLIOS)),
            return_exceptions=True,
        )

    failures = [r for r in results if isinstance(r, BaseException)]
    assert not failures, (
        f"All N concurrent ensure_token_valid calls under one session must "
        f"succeed; got failures: {failures}"
    )
    assert endpoint.refresh_count == 1, (
        f"Shared session must dedupe refresh calls, got "
        f"{endpoint.refresh_count} refreshes from {endpoint.presented_tokens}"
    )


async def test_per_entry_sessions_still_race_when_misused(
    hass: HomeAssistant,
    parqet_oauth_impl: config_entry_oauth2_flow.LocalOAuth2Implementation,
) -> None:
    """Confirms HA's `_token_lock` is per-session, not per-domain.

    This is the pre-fix failure mode preserved as a regression test: if a
    future refactor ever re-introduces multiple OAuth2Sessions for the same
    account, the race resurfaces immediately. The v1 → v2 migration
    (`migration.async_migrate_entry`) is what prevents this configuration
    from ever existing at runtime.
    """
    endpoint = RotatingTokenEndpoint("rt-initial")
    initial = _make_token("rt-initial")
    initial["expires_at"] = 0

    sessions: list[config_entry_oauth2_flow.OAuth2Session] = []
    for i in range(N_PORTFOLIOS):
        entry = MockConfigEntry(
            domain=DOMAIN,
            data={
                "auth_implementation": DOMAIN,
                "token": dict(initial),
                "portfolio_id": f"portfolio_{i}",
            },
            unique_id=f"user_account_portfolio_{i}",
            version=1,
        )
        entry.add_to_hass(hass)
        sessions.append(
            config_entry_oauth2_flow.OAuth2Session(hass, entry, parqet_oauth_impl)
        )

    with patch.object(
        parqet_oauth_impl,
        "_async_refresh_token",
        side_effect=endpoint.refresh,
    ):
        results = await asyncio.gather(
            *(s.async_ensure_token_valid() for s in sessions),
            return_exceptions=True,
        )

    failures = [r for r in results if isinstance(r, BaseException)]
    assert len(failures) == N_PORTFOLIOS - 1
    assert endpoint.refresh_count == 1
