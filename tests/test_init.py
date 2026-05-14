"""Tests for Parqet integration setup and unload."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet import ParqetAccountRuntime
from custom_components.parqet.const import (
    CONF_PORTFOLIO_IDS,
    CONF_PORTFOLIO_META,
    DOMAIN,
)
from custom_components.parqet.coordinator import ParqetDataUpdateCoordinator
from custom_components.parqet.portfolio_sync import _missing_issue_id

from .conftest import MOCK_PORTFOLIO_ID, MOCK_USER_ID


async def test_setup_entry_creates_account_runtime(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Setup yields a per-account runtime with one coordinator per portfolio."""
    runtime = init_integration.runtime_data
    assert isinstance(runtime, ParqetAccountRuntime)
    assert set(runtime.coordinators.keys()) == {MOCK_PORTFOLIO_ID}
    assert isinstance(
        runtime.coordinators[MOCK_PORTFOLIO_ID], ParqetDataUpdateCoordinator
    )


async def test_setup_entry_coordinator_has_data(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """The coordinator under the account runtime has fetched data."""
    runtime = init_integration.runtime_data
    coordinator = runtime.coordinators[MOCK_PORTFOLIO_ID]
    assert coordinator.data is not None
    assert "performance" in coordinator.data


async def test_setup_entry_shares_one_api_client(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Every coordinator under the account uses the same ParqetApiClient."""
    runtime = init_integration.runtime_data
    apis = {id(c.api) for c in runtime.coordinators.values()}
    assert len(apis) == 1
    assert id(runtime.api) in apis


async def test_unload_entry(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Test config entry unload cleans up platforms."""
    from custom_components.parqet import async_unload_entry

    result = await async_unload_entry(hass, init_integration)
    assert result is True


# ─── Setup-time reconciliation ─────────────────────────────────────────────────


def _strip_manifest_deps() -> tuple[Path, str]:
    """Patch the manifest's HA-frontend deps so async_setup_component succeeds.

    Returns (path, original_content) so the caller can restore on teardown.
    """
    path = Path("custom_components/parqet/manifest.json")
    original = path.read_text()
    data = json.loads(original)
    data["dependencies"] = []
    path.write_text(json.dumps(data))
    return path, original


async def _setup_entry_with_portfolios(
    hass: HomeAssistant,
    entry: MockConfigEntry,
    live_portfolios: list[dict],
) -> None:
    """Run async_setup_entry against a mocked API returning `live_portfolios`."""
    from homeassistant.setup import async_setup_component

    manifest_path, manifest_original = _strip_manifest_deps()
    try:
        with (
            patch(
                "custom_components.parqet.async_setup",
                return_value=True,
            ),
            patch(
                "custom_components.parqet.config_entry_oauth2_flow"
                ".async_get_config_entry_implementation",
            ),
            patch(
                "custom_components.parqet.config_entry_oauth2_flow.OAuth2Session",
                return_value=AsyncMock(token={"access_token": "mock_token"}),
            ),
            patch(
                "homeassistant.components.http.async_setup",
                return_value=True,
            ),
            patch(
                "custom_components.parqet.aiohttp_client.async_get_clientsession",
            ),
            patch(
                "custom_components.parqet.ParqetApiClient", autospec=True
            ) as mock_cls,
        ):
            hass.http = MagicMock()
            client = mock_cls.return_value
            client.async_list_portfolios.return_value = live_portfolios
            # First-refresh path needs performance to succeed for any live portfolio.
            client.async_get_performance.return_value = {"performance": {}}

            assert await async_setup_component(hass, DOMAIN, {})
            await hass.async_block_till_done()
    finally:
        manifest_path.write_text(manifest_original)


async def test_setup_prunes_deleted_portfolio_and_keeps_entry_loaded(
    hass: HomeAssistant,
) -> None:
    """Half-dead entry: one portfolio gone, one still live → entry loads with the survivor."""
    dead_id = "dead_portfolio_xyz"
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Mixed Account",
        data={
            "auth_implementation": "parqet",
            "token": {"access_token": "x", "expires_at": 99999999999},
            "user_id": MOCK_USER_ID,
            CONF_PORTFOLIO_IDS: [MOCK_PORTFOLIO_ID, dead_id],
            CONF_PORTFOLIO_META: {
                MOCK_PORTFOLIO_ID: {"name": "Alive", "currency": "EUR"},
                dead_id: {"name": "Retirement", "currency": "EUR"},
            },
        },
        unique_id=MOCK_USER_ID,
        version=2,
        minor_version=1,
    )
    entry.add_to_hass(hass)

    await _setup_entry_with_portfolios(
        hass,
        entry,
        live_portfolios=[
            {"id": MOCK_PORTFOLIO_ID, "name": "Alive", "currency": "EUR"}
        ],
    )

    refreshed = hass.config_entries.async_get_entry(entry.entry_id)
    assert refreshed.state is ConfigEntryState.LOADED
    assert refreshed.data[CONF_PORTFOLIO_IDS] == [MOCK_PORTFOLIO_ID]
    assert dead_id not in refreshed.data[CONF_PORTFOLIO_META]

    # The user gets a repair issue naming the deleted portfolio.
    issue = ir.async_get(hass).async_get_issue(
        DOMAIN, _missing_issue_id(entry.entry_id, dead_id)
    )
    assert issue is not None
    assert issue.translation_placeholders["portfolio_name"] == "Retirement"


async def test_setup_fails_cleanly_when_all_portfolios_gone(
    hass: HomeAssistant,
) -> None:
    """Empty Parqet account: entry goes to ERROR (not infinite retry)."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Dead Account",
        data={
            "auth_implementation": "parqet",
            "token": {"access_token": "x", "expires_at": 99999999999},
            "user_id": MOCK_USER_ID,
            CONF_PORTFOLIO_IDS: [MOCK_PORTFOLIO_ID],
            CONF_PORTFOLIO_META: {
                MOCK_PORTFOLIO_ID: {"name": "Gone", "currency": "EUR"}
            },
        },
        unique_id=MOCK_USER_ID,
        version=2,
        minor_version=1,
    )
    entry.add_to_hass(hass)

    await _setup_entry_with_portfolios(hass, entry, live_portfolios=[])

    refreshed = hass.config_entries.async_get_entry(entry.entry_id)
    # ConfigEntryError → SETUP_ERROR (not NotReady's SETUP_RETRY). The whole
    # point of this branch is to stop the 403-loop the user reported.
    assert refreshed.state is ConfigEntryState.SETUP_ERROR
    # And the data is now empty so a subsequent reconfigure starts from scratch.
    assert refreshed.data[CONF_PORTFOLIO_IDS] == []


@pytest.mark.usefixtures("init_integration")
async def test_setup_is_noop_when_portfolios_unchanged(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """The reconciliation step doesn't mutate entries that are already in sync."""
    assert init_integration.state is ConfigEntryState.LOADED
    assert init_integration.data[CONF_PORTFOLIO_IDS] == [MOCK_PORTFOLIO_ID]
    # No spurious repair issues.
    issues = [i for i in ir.async_get(hass).issues.values() if i.domain == DOMAIN]
    assert issues == []
