"""Failing reproduction for the multi-portfolio token refresh race (Issue #6).

Each portfolio is a separate ConfigEntry that holds its own copy of the OAuth
token. Each ConfigEntry instantiates its own OAuth2Session whose `_token_lock`
is instance-local (HA helper `config_entry_oauth2_flow.OAuth2Session.__init__`).
After the ~1h access-token TTL elapses, every coordinator detects expiry on the
same 15-minute tick and calls `async_ensure_token_valid()` in parallel.

Parqet rotates the refresh token on every successful exchange (verified in
issue reports). The first refresh wins and rotates the token; the remaining
N-1 still present the now-invalidated refresh token and receive
`400 invalid_grant` from `https://connect.parqet.com/oauth2/token`.

This test stages that exact scenario against a rotating mock endpoint and
asserts that all N concurrent refreshes succeed. It fails today (3 of 4) and
must pass once the fix migrates to "1 ConfigEntry per account, portfolios as
Devices" — one shared OAuth2Session, one `_token_lock`, atomic refresh.

When the fix lands, remove the `xfail` marker in the same commit.
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
    old. Subsequent refresh attempts with a stale token raise — modelling
    Parqet's `400 invalid_grant` response.
    """

    def __init__(self, initial_refresh_token: str) -> None:
        self._current_refresh_token = initial_refresh_token
        self._refresh_count = 0
        self.presented_tokens: list[str] = []

    async def refresh(self, token: dict[str, Any]) -> dict[str, Any]:
        presented = token.get("refresh_token", "")
        self.presented_tokens.append(presented)

        if presented != self._current_refresh_token:
            # Parqet returns 400 invalid_grant for stale refresh tokens.
            # The exact exception class doesn't matter here — any failure
            # propagates through OAuth2Session.async_ensure_token_valid.
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


@pytest.mark.xfail(
    strict=True,
    reason=(
        "Known bug, Issue #6 — pre-fix architecture has per-portfolio "
        "ConfigEntrys each owning a separate OAuth2Session. Parallel refresh "
        "against Parqet's rotating refresh-token endpoint loses N-1 of N. "
        "Remove this marker in the same commit that migrates to one "
        "ConfigEntry per account with a shared OAuth2Session."
    ),
)
async def test_concurrent_refresh_across_portfolios_succeeds(
    hass: HomeAssistant,
    parqet_oauth_impl: config_entry_oauth2_flow.LocalOAuth2Implementation,
) -> None:
    """All N coordinators must successfully refresh through one token cycle.

    Pre-fix: N ConfigEntrys → N OAuth2Sessions → N independent _token_locks.
    Concurrent `async_ensure_token_valid` produces N parallel POSTs to
    `/oauth2/token`; only the first one's refresh_token is current, the rest
    receive `invalid_grant`. Expected: 3 failures / 1 success with N=4.

    Post-fix: 1 ConfigEntry per account → 1 shared OAuth2Session → 1 shared
    `_token_lock` → refresh dedup. Expected: 0 failures, 1 underlying refresh.
    """
    endpoint = RotatingTokenEndpoint("rt-initial")
    # Force initial expiry to require a refresh.
    initial = _make_token("rt-initial")
    initial["expires_at"] = 0

    sessions: list[config_entry_oauth2_flow.OAuth2Session] = []
    for i in range(N_PORTFOLIOS):
        entry = MockConfigEntry(
            domain=DOMAIN,
            data={
                "auth_implementation": DOMAIN,
                # Each entry holds its OWN copy of the token — the bug.
                "token": dict(initial),
                "portfolio_id": f"portfolio_{i}",
                "portfolio_name": f"Portfolio {i}",
            },
            unique_id=f"user_account_portfolio_{i}",
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
    assert not failures, (
        f"{len(failures)}/{N_PORTFOLIOS} refreshes failed — token-refresh "
        f"race confirmed.\n"
        f"Endpoint received refresh tokens: {endpoint.presented_tokens}\n"
        f"Successful refresh count: {endpoint.refresh_count}\n"
        f"Failures: {failures}"
    )
