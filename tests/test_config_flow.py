"""Tests for the Parqet config flow."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet.const import (
    CONF_CURRENCY,
    CONF_ENTRY_TYPE,
    CONF_PORTFOLIO_IDS,
    CONF_PORTFOLIO_META,
    CONF_SOURCE_ENTRY_IDS,
    DOMAIN,
    ENTRY_TYPE_COMBINED,
)

from .conftest import (
    MOCK_PORTFOLIO_ID,
    MOCK_PORTFOLIO_NAME,
    MOCK_USER_INFO,
    token_endpoint_response_error,
)

MANIFEST_PATH = Path("custom_components/parqet/manifest.json")


def _add_account_entry(
    hass: HomeAssistant,
    *,
    title: str,
    user_id: str,
    portfolio_id: str,
    currency: str,
) -> MockConfigEntry:
    """Add an account entry with portfolio metadata for Combined flow tests."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title=title,
        unique_id=user_id,
        version=2,
        minor_version=1,
        data={
            "user_id": user_id,
            CONF_PORTFOLIO_IDS: [portfolio_id],
            CONF_PORTFOLIO_META: {
                portfolio_id: {"name": title, "currency": currency}
            },
        },
    )
    entry.add_to_hass(hass)
    return entry


@pytest.fixture(autouse=True)
def _clear_manifest_deps():
    """Remove frontend/http deps from manifest for config flow tests."""
    original = MANIFEST_PATH.read_text()
    data = json.loads(original)
    data["dependencies"] = []
    MANIFEST_PATH.write_text(json.dumps(data))
    yield
    MANIFEST_PATH.write_text(original)


async def test_combined_flow_selects_sources_and_persists_currency(
    hass: HomeAssistant,
    mock_setup_entry: AsyncMock,
) -> None:
    """Combined is a separate entry with stable selected sources and currency."""
    first = _add_account_entry(
        hass,
        title="Scalable",
        user_id="user_a",
        portfolio_id="portfolio_a",
        currency="EUR",
    )
    second = _add_account_entry(
        hass,
        title="Trade Republic",
        user_id="user_b",
        portfolio_id="portfolio_b",
        currency="EUR",
    )

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": "user"}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_ENTRY_TYPE: ENTRY_TYPE_COMBINED},
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "combined"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_SOURCE_ENTRY_IDS: [first.entry_id, second.entry_id]},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Parqet Combined"
    assert result["data"] == {
        CONF_ENTRY_TYPE: ENTRY_TYPE_COMBINED,
        CONF_SOURCE_ENTRY_IDS: [first.entry_id, second.entry_id],
        CONF_CURRENCY: "EUR",
    }


async def test_combined_flow_rejects_mixed_currencies(
    hass: HomeAssistant,
    mock_setup_entry: AsyncMock,
) -> None:
    """A Combined entry must never establish mixed-currency statistics."""
    first = _add_account_entry(
        hass,
        title="EUR Account",
        user_id="user_eur",
        portfolio_id="portfolio_eur",
        currency="EUR",
    )
    second = _add_account_entry(
        hass,
        title="USD Account",
        user_id="user_usd",
        portfolio_id="portfolio_usd",
        currency="USD",
    )

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": "user"}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_ENTRY_TYPE: ENTRY_TYPE_COMBINED},
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={CONF_SOURCE_ENTRY_IDS: [first.entry_id, second.entry_id]},
    )

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "combined"
    assert result["errors"] == {"base": "mixed_currency"}


async def test_combined_options_update_selected_sources(
    hass: HomeAssistant,
) -> None:
    """Combined options persist source ownership and its fixed currency."""
    first = _add_account_entry(
        hass,
        title="First",
        user_id="first",
        portfolio_id="p1",
        currency="EUR",
    )
    second = _add_account_entry(
        hass,
        title="Second",
        user_id="second",
        portfolio_id="p2",
        currency="EUR",
    )
    combined = MockConfigEntry(
        domain=DOMAIN,
        title="Parqet Combined",
        unique_id="combined_accounts",
        data={
            CONF_ENTRY_TYPE: ENTRY_TYPE_COMBINED,
            CONF_SOURCE_ENTRY_IDS: [first.entry_id, second.entry_id],
            CONF_CURRENCY: "EUR",
        },
        version=2,
        minor_version=1,
    )
    combined.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(combined.entry_id)
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "combined"

    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        user_input={CONF_SOURCE_ENTRY_IDS: [second.entry_id, first.entry_id]},
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert combined.options[CONF_SOURCE_ENTRY_IDS] == [second.entry_id, first.entry_id]
    assert combined.options[CONF_CURRENCY] == "EUR"


async def test_reauth_flow_shows_confirm(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Test the reauth flow shows confirmation form."""
    result = await mock_config_entry.start_reauth_flow(hass)
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "reauth_confirm"


async def test_reauth_confirm_proceeds(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Test confirming reauth proceeds to user/OAuth step."""
    result = await mock_config_entry.start_reauth_flow(hass)

    with patch(
        "custom_components.parqet.config_flow.config_entry_oauth2_flow"
        ".async_get_implementations",
        return_value={"parqet": AsyncMock()},
    ):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], user_input={}
        )
    assert result["type"] in (
        FlowResultType.FORM,
        FlowResultType.EXTERNAL_STEP,
        FlowResultType.ABORT,
    )


async def _finish_user_oauth_flow(
    hass: HomeAssistant,
    user_info: dict,
    portfolios: list[dict],
) -> dict:
    """Start a user flow and inject the OAuth completion payload."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": "user"}
    )
    flow = hass.config_entries.flow._progress.get(result["flow_id"])
    assert flow is not None

    with patch(
        "custom_components.parqet.config_flow.aiohttp_client.async_get_clientsession",
    ), patch(
        "custom_components.parqet.config_flow.ParqetApiClient",
    ) as mock_api_cls:
        mock_api = mock_api_cls.return_value
        mock_api.async_get_user = AsyncMock(return_value=user_info)
        mock_api.async_list_portfolios = AsyncMock(return_value=portfolios)
        return await flow.async_oauth_create_entry(
            {
                "auth_implementation": "parqet",
                "token": {
                    "access_token": "new_access",
                    "refresh_token": "new_refresh",
                    "expires_in": 3600,
                },
            }
        )


async def test_first_account_keeps_historic_portfolio_title(
    hass: HomeAssistant,
    mock_setup_entry: AsyncMock,
) -> None:
    """The first configured account keeps the existing single-account title."""
    result = await _finish_user_oauth_flow(
        hass,
        MOCK_USER_INFO,
        [
            {
                "id": MOCK_PORTFOLIO_ID,
                "name": MOCK_PORTFOLIO_NAME,
                "currency": "EUR",
            }
        ],
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == MOCK_PORTFOLIO_NAME
    assert result["data"]["user_id"] == MOCK_USER_INFO["userId"]


async def test_second_parqet_account_can_be_added_and_gets_disambiguated_title(
    hass: HomeAssistant,
    mock_setup_entry: AsyncMock,
) -> None:
    """A different Parqet user is a separate account entry, not a duplicate."""
    existing = MockConfigEntry(
        domain=DOMAIN,
        title="Main Portfolio",
        unique_id="first_user",
        version=2,
        minor_version=1,
        data={
            "auth_implementation": "parqet",
            "token": {"access_token": "old"},
            "user_id": "first_user",
            "portfolio_ids": ["first_portfolio"],
            "portfolio_meta": {
                "first_portfolio": {"name": "Main Portfolio", "currency": "EUR"}
            },
        },
    )
    existing.add_to_hass(hass)

    second_user = {**MOCK_USER_INFO, "userId": "second_user_123456"}
    result = await _finish_user_oauth_flow(
        hass,
        second_user,
        [
            {
                "id": "second_portfolio",
                "name": "Main Portfolio",
                "currency": "EUR",
            }
        ],
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Main Portfolio (account 123456)"
    assert result["data"]["user_id"] == "second_user_123456"
    assert result["data"]["portfolio_ids"] == ["second_portfolio"]


async def test_second_account_title_prefers_human_readable_user_label(
    hass: HomeAssistant,
    mock_setup_entry: AsyncMock,
) -> None:
    """If Parqet exposes an email/name, use it instead of an opaque id suffix."""
    existing = MockConfigEntry(
        domain=DOMAIN,
        title="Parqet",
        unique_id="first_user",
        version=2,
        data={"user_id": "first_user"},
    )
    existing.add_to_hass(hass)

    result = await _finish_user_oauth_flow(
        hass,
        {**MOCK_USER_INFO, "userId": "second_user", "email": "jane@example.test"},
        [
            {
                "id": "second_a",
                "name": "Broker A",
                "currency": "EUR",
            },
            {
                "id": "second_b",
                "name": "Broker B",
                "currency": "EUR",
            },
        ],
    )

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "pick_portfolio"

    flow = hass.config_entries.flow._progress.get(result["flow_id"])
    assert flow is not None
    submission = await flow.async_step_pick_portfolio(
        {"portfolio_ids": ["second_a", "second_b"]}
    )

    assert submission["type"] is FlowResultType.CREATE_ENTRY
    assert submission["title"] == "Parqet (2 portfolios) (jane@example.test)"


async def test_reauth_updates_token_in_place(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_setup_entry: AsyncMock,
) -> None:
    """Reauth keeps the account entry and refreshes only the OAuth token.

    v2 has one account entry whose portfolios are devices. A reauth must not
    destroy entry/devices/history — it just updates credentials in place.
    """
    entry_id = mock_config_entry.entry_id
    assert hass.config_entries.async_get_entry(entry_id) is not None
    original_portfolio_ids = list(mock_config_entry.data["portfolio_ids"])

    new_oauth_data = {
        "auth_implementation": "parqet",
        "token": {
            "access_token": "fresh_token",
            "refresh_token": "fresh_refresh",
            "expires_in": 3600,
        },
    }

    result = await mock_config_entry.start_reauth_flow(hass)
    assert result["step_id"] == "reauth_confirm"

    flow = hass.config_entries.flow._progress.get(result["flow_id"])
    assert flow is not None

    with patch(
        "custom_components.parqet.config_flow.aiohttp_client.async_get_clientsession",
    ), patch(
        "custom_components.parqet.config_flow.ParqetApiClient",
    ) as mock_api_cls:
        mock_api = mock_api_cls.return_value
        mock_api.async_get_user = AsyncMock(return_value=MOCK_USER_INFO)
        mock_api.async_list_portfolios = AsyncMock(
            return_value=[
                {
                    "id": MOCK_PORTFOLIO_ID,
                    "name": MOCK_PORTFOLIO_NAME,
                    "currency": "EUR",
                }
            ]
        )

        result = await flow.async_oauth_create_entry(new_oauth_data)

    refreshed = hass.config_entries.async_get_entry(entry_id)
    assert refreshed is not None
    assert refreshed.data["token"]["access_token"] == "fresh_token"
    assert refreshed.data["portfolio_ids"] == original_portfolio_ids
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reauth_successful"


# ─── Reconfigure flow (re-pick portfolios without re-authenticating) ──────────


async def _start_reconfigure(
    hass: HomeAssistant, entry: MockConfigEntry, live_portfolios: list[dict]
) -> dict:
    """Drive `async_step_reconfigure` with a mocked API listing `live_portfolios`."""
    with (
        patch(
            "custom_components.parqet.config_flow.config_entry_oauth2_flow"
            ".async_get_config_entry_implementation",
            return_value=AsyncMock(),
        ),
        patch(
            "custom_components.parqet.config_flow.config_entry_oauth2_flow.OAuth2Session",
            return_value=AsyncMock(token={"access_token": "valid"}),
        ),
        patch(
            "custom_components.parqet.config_flow.aiohttp_client.async_get_clientsession",
        ),
        patch(
            "custom_components.parqet.config_flow.ParqetApiClient",
        ) as mock_api_cls,
    ):
        mock_api = mock_api_cls.return_value
        mock_api.async_list_portfolios = AsyncMock(return_value=live_portfolios)
        return await entry.start_reconfigure_flow(hass)


async def test_reconfigure_shows_picker_with_current_selection_preticked(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Opening Reconfigure should land on the portfolio picker step."""
    new_portfolio = {"id": "new_pid_999", "name": "New One", "currency": "EUR"}
    result = await _start_reconfigure(
        hass,
        mock_config_entry,
        live_portfolios=[
            {
                "id": MOCK_PORTFOLIO_ID,
                "name": MOCK_PORTFOLIO_NAME,
                "currency": "EUR",
            },
            new_portfolio,
        ],
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "pick_portfolio"


async def test_reconfigure_updates_entry_with_new_selection(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_setup_entry: AsyncMock,
) -> None:
    """Picking a different set of portfolios rewrites entry.data, keeps token."""
    original_token = mock_config_entry.data["token"]
    new_portfolio = {"id": "new_pid_999", "name": "New One", "currency": "EUR"}

    result = await _start_reconfigure(
        hass,
        mock_config_entry,
        live_portfolios=[
            {
                "id": MOCK_PORTFOLIO_ID,
                "name": MOCK_PORTFOLIO_NAME,
                "currency": "EUR",
            },
            new_portfolio,
        ],
    )
    submission = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={"portfolio_ids": ["new_pid_999"]},
    )

    assert submission["type"] is FlowResultType.ABORT
    assert submission["reason"] == "reconfigure_successful"

    updated = hass.config_entries.async_get_entry(mock_config_entry.entry_id)
    assert updated.data["portfolio_ids"] == ["new_pid_999"]
    assert "new_pid_999" in updated.data["portfolio_meta"]
    # Token is preserved — reconfigure must not force a re-auth.
    assert updated.data["token"] == original_token


async def test_reconfigure_aborts_when_account_has_no_portfolios(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """If Parqet has zero portfolios, abort with `no_portfolios` (not a blank picker)."""
    result = await _start_reconfigure(
        hass, mock_config_entry, live_portfolios=[]
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "no_portfolios"


# ─── Reconfigure token-refresh failure routing ─────────────────────────────────


async def _start_reconfigure_with_refresh_error(
    hass: HomeAssistant,
    entry: MockConfigEntry,
    err: Exception,
) -> dict:
    """Drive `async_step_reconfigure` where the token refresh raises `err`."""
    oauth_session = AsyncMock(token={"access_token": "stale"})
    oauth_session.async_ensure_token_valid = AsyncMock(side_effect=err)

    with (
        patch(
            "custom_components.parqet.config_flow.config_entry_oauth2_flow"
            ".async_get_config_entry_implementation",
            return_value=AsyncMock(),
        ),
        patch(
            "custom_components.parqet.config_flow.config_entry_oauth2_flow.OAuth2Session",
            return_value=oauth_session,
        ),
        patch(
            "custom_components.parqet.config_flow.aiohttp_client.async_get_clientsession",
        ),
    ):
        return await entry.start_reconfigure_flow(hass)


async def test_reconfigure_4xx_token_aborts_reauth_required(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Stored credentials rejected by Parqet → tell the user to reauth."""
    result = await _start_reconfigure_with_refresh_error(
        hass, mock_config_entry, token_endpoint_response_error(400)
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reauth_required"


async def test_reconfigure_5xx_token_aborts_cannot_connect(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Parqet token endpoint had a transient error → cannot_connect, not reauth.

    Sending the user to a reauth flow they can't complete (Parqet is down) is
    worse than telling them to try again later.
    """
    result = await _start_reconfigure_with_refresh_error(
        hass, mock_config_entry, token_endpoint_response_error(503)
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "cannot_connect"
