"""Tests for Parqet integration setup and unload."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet import ParqetAccountRuntime
from custom_components.parqet.const import (
    CONF_CURRENCY,
    CONF_ENTRY_TYPE,
    CONF_PORTFOLIO_IDS,
    CONF_PORTFOLIO_META,
    CONF_SOURCE_ENTRY_IDS,
    DOMAIN,
    ENTRY_TYPE_COMBINED,
    SIGNAL_ACCOUNTS_UPDATED,
)
from custom_components.parqet.coordinator import ParqetDataUpdateCoordinator
from custom_components.parqet.portfolio_sync import _missing_issue_id

from .conftest import (
    MOCK_PORTFOLIO_ID,
    MOCK_USER_ID,
    token_endpoint_response_error,
)


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


async def test_account_notifies_combined_only_after_loaded_state(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """A replacement account runtime is announced after HA marks it loaded."""
    with patch("custom_components.parqet.async_dispatcher_send") as send:
        init_integration._async_set_state(
            hass,
            ConfigEntryState.SETUP_IN_PROGRESS,
            None,
        )
        send.assert_not_called()

        init_integration._async_set_state(
            hass,
            ConfigEntryState.LOADED,
            None,
        )

    send.assert_called_once_with(hass, SIGNAL_ACCOUNTS_UPDATED, None)


async def test_combined_entry_owns_device_and_survives_reload(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Combined entities use normal config-entry ownership and registry reuse."""
    first_runtime = init_integration.runtime_data
    first_coordinator = first_runtime.coordinators[MOCK_PORTFOLIO_ID]
    second_portfolio_id = "second_portfolio"
    second_coordinator = MagicMock()
    second_coordinator.data = first_coordinator.data
    second_coordinator.last_update_success = True
    second_coordinator.async_add_listener.return_value = MagicMock()
    second = MockConfigEntry(
        domain=DOMAIN,
        title="Second account",
        unique_id="second_user",
        data={
            CONF_PORTFOLIO_IDS: [second_portfolio_id],
            CONF_PORTFOLIO_META: {
                second_portfolio_id: {
                    "name": "Second portfolio",
                    "currency": "EUR",
                }
            },
        },
        version=2,
        minor_version=1,
    )
    second.add_to_hass(hass)
    second.runtime_data = ParqetAccountRuntime(
        api=MagicMock(),
        coordinators={second_portfolio_id: second_coordinator},
    )
    second.mock_state(hass, ConfigEntryState.LOADED)

    combined = MockConfigEntry(
        domain=DOMAIN,
        title="Parqet Combined",
        unique_id="combined_accounts",
        data={
            CONF_ENTRY_TYPE: ENTRY_TYPE_COMBINED,
            CONF_SOURCE_ENTRY_IDS: [init_integration.entry_id, second.entry_id],
            CONF_CURRENCY: "EUR",
        },
        version=2,
        minor_version=1,
    )
    combined.add_to_hass(hass)

    device_registry = dr.async_get(hass)
    stale_device = device_registry.async_get_or_create(
        config_entry_id=init_integration.entry_id,
        identifiers={(DOMAIN, "combined_accounts")},
        name="Parqet Combined",
    )
    entity_registry = er.async_get(hass)
    stale_entity = entity_registry.async_get_or_create(
        "sensor",
        DOMAIN,
        "combined_accounts_total_value",
        config_entry=init_integration,
        device_id=stale_device.id,
        suggested_object_id="parqet_combined_total_value",
    )
    enabled_detail_entity = entity_registry.async_get_or_create(
        "sensor",
        DOMAIN,
        "combined_accounts_holdings_count",
        config_entry=init_integration,
        device_id=stale_device.id,
        suggested_object_id="parqet_combined_holdings_count",
    )

    assert await hass.config_entries.async_setup(combined.entry_id)
    await hass.async_block_till_done()

    entity_id = entity_registry.async_get_entity_id(
        "sensor", DOMAIN, "combined_accounts_total_value"
    )
    assert entity_id is not None
    assert entity_id == stale_entity.entity_id
    registry_entry = entity_registry.async_get(entity_id)
    assert registry_entry is not None
    assert registry_entry.config_entry_id == combined.entry_id
    detail_registry_entry = entity_registry.async_get(enabled_detail_entity.entity_id)
    assert detail_registry_entry is not None
    assert detail_registry_entry.config_entry_id == combined.entry_id
    assert hass.states.get(enabled_detail_entity.entity_id) is not None

    device_registry = dr.async_get(hass)
    device = device_registry.async_get_device(
        identifiers={(DOMAIN, "combined_accounts")}
    )
    assert device is not None
    assert device.config_entries == {combined.entry_id}
    original_entity_id = entity_id

    assert await hass.config_entries.async_reload(combined.entry_id)
    await hass.async_block_till_done()

    assert entity_registry.async_get_entity_id(
        "sensor", DOMAIN, "combined_accounts_total_value"
    ) == original_entity_id
    assert hass.states.get(original_entity_id) is not None
    assert hass.states.get(enabled_detail_entity.entity_id) is not None


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


# ─── Setup-time token-refresh failure routing ──────────────────────────────────


async def _setup_entry_with_token_refresh_error(
    hass: HomeAssistant,
    err: aiohttp.ClientError,
) -> None:
    """Run async_setup_entry where the OAuth refresh raises `err`."""
    from homeassistant.setup import async_setup_component

    oauth_session = AsyncMock(token={"access_token": "stale"})
    oauth_session.async_ensure_token_valid = AsyncMock(side_effect=err)

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
                return_value=oauth_session,
            ),
            patch(
                "homeassistant.components.http.async_setup",
                return_value=True,
            ),
            patch(
                "custom_components.parqet.aiohttp_client.async_get_clientsession",
            ),
        ):
            hass.http = MagicMock()
            assert await async_setup_component(hass, DOMAIN, {})
            await hass.async_block_till_done()
    finally:
        manifest_path.write_text(manifest_original)


async def test_setup_4xx_at_token_endpoint_raises_auth_failed(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """400 from /oauth2/token at setup → ConfigEntryAuthFailed → reauth UX.

    This is the fix for the user-reported "1h later, 400 invalid_grant loop"
    symptom. Without this routing, HA would treat it as transient and retry
    every 15 minutes with no banner.
    """
    await _setup_entry_with_token_refresh_error(
        hass, token_endpoint_response_error(400)
    )

    refreshed = hass.config_entries.async_get_entry(mock_config_entry.entry_id)
    assert refreshed.state is ConfigEntryState.SETUP_ERROR
    reauth_flows = [
        flow
        for flow in hass.config_entries.flow.async_progress_by_handler(DOMAIN)
        if flow["context"].get("source") == "reauth"
        and flow["context"].get("entry_id") == mock_config_entry.entry_id
    ]
    assert reauth_flows, "ConfigEntryAuthFailed should start a reauth flow"


async def test_setup_5xx_at_token_endpoint_raises_not_ready(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """5xx at /oauth2/token is transient — entry must stay in retry, not reauth."""
    await _setup_entry_with_token_refresh_error(
        hass, token_endpoint_response_error(503)
    )

    refreshed = hass.config_entries.async_get_entry(mock_config_entry.entry_id)
    assert refreshed.state is ConfigEntryState.SETUP_RETRY


async def test_setup_generic_client_error_raises_not_ready(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Non-response ClientError (e.g. socket disconnect) stays transient."""
    await _setup_entry_with_token_refresh_error(
        hass, aiohttp.ClientError("connection refused")
    )

    refreshed = hass.config_entries.async_get_entry(mock_config_entry.entry_id)
    assert refreshed.state is ConfigEntryState.SETUP_RETRY
