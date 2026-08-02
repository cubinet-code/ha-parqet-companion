"""Config flow for Parqet integration.

v2 schema: one ConfigEntry per Parqet account, multiple portfolios as devices
under that entry. See `migration.py` for the v1 → v2 upgrade path.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Mapping
from typing import Any

import aiohttp
import voluptuous as vol
from homeassistant.config_entries import (
    SOURCE_REAUTH,
    SOURCE_RECONFIGURE,
    ConfigEntry,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import aiohttp_client, config_entry_oauth2_flow
from homeassistant.helpers.selector import (
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
)

from .api import (
    ParqetApiClient,
    ParqetApiError,
    ParqetAuthError,
    ParqetConnectionError,
    is_token_endpoint_reauth_error,
)
from .const import (
    COMBINED_UNIQUE_ID,
    CONF_CURRENCY,
    CONF_ENTRY_TYPE,
    CONF_INTERVAL,
    CONF_PORTFOLIO_IDS,
    CONF_PORTFOLIO_META,
    CONF_SCAN_INTERVAL,
    CONF_SNAPSHOT_ENABLED,
    CONF_SNAPSHOT_HOUR,
    CONF_SNAPSHOT_MINUTE,
    CONF_SNAPSHOT_WEEKDAYS_ONLY,
    CONF_SOURCE_ENTRY_IDS,
    CONF_USER_ID,
    DEFAULT_INTERVAL,
    DEFAULT_SCAN_INTERVAL_MIN,
    DEFAULT_SNAPSHOT_HOUR,
    DEFAULT_SNAPSHOT_MINUTE,
    DEFAULT_SNAPSHOT_WEEKDAYS_ONLY,
    DOMAIN,
    ENTRY_TYPE_ACCOUNT,
    ENTRY_TYPE_COMBINED,
    INTERVALS,
    MIN_SCAN_INTERVAL_MIN,
    SCOPES,
)
from .oauth import create_parqet_oauth_implementation

_LOGGER = logging.getLogger(__name__)


def _account_entries(hass: HomeAssistant) -> list[ConfigEntry]:
    """Return configured source-account entries, excluding Combined."""
    return [
        entry
        for entry in hass.config_entries.async_entries(DOMAIN)
        if entry.data.get(CONF_ENTRY_TYPE, ENTRY_TYPE_ACCOUNT) != ENTRY_TYPE_COMBINED
    ]


def _combined_currency(
    account_entries: list[ConfigEntry], source_ids: list[str]
) -> str | None:
    """Return one shared source currency, or None for missing/mixed metadata."""
    entries = {entry.entry_id: entry for entry in account_entries}
    currencies: set[str] = set()
    for source_id in source_ids:
        entry = entries.get(source_id)
        if entry is None:
            return None
        portfolio_meta: dict[str, dict[str, str]] = entry.data.get(
            CONF_PORTFOLIO_META, {}
        )
        portfolio_ids: list[str] = entry.data.get(CONF_PORTFOLIO_IDS, [])
        for portfolio_id in portfolio_ids:
            currency = portfolio_meta.get(portfolio_id, {}).get("currency")
            if not currency:
                return None
            currencies.add(currency)
    return currencies.pop() if len(currencies) == 1 else None


def _combined_source_selector(account_entries: list[ConfigEntry]) -> SelectSelector:
    """Build the multi-select of account entries a Combined entry can own."""
    return SelectSelector(
        SelectSelectorConfig(
            options=[
                SelectOptionDict(value=entry.entry_id, label=entry.title)
                for entry in account_entries
            ],
            multiple=True,
            mode=SelectSelectorMode.DROPDOWN,
        )
    )


class ParqetOAuth2FlowHandler(
    config_entry_oauth2_flow.AbstractOAuth2FlowHandler, domain=DOMAIN
):
    """Handle the Parqet OAuth2 config flow."""

    DOMAIN = DOMAIN
    VERSION = 2
    MINOR_VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: ConfigEntry,
    ) -> ParqetOptionsFlowHandler:
        """Get the options flow handler."""
        return ParqetOptionsFlowHandler()

    def __init__(self) -> None:
        """Initialize the config flow."""
        super().__init__()
        self._oauth_data: dict[str, Any] = {}
        self._portfolios: list[dict[str, Any]] = []
        self._user_id: str | None = None
        self._account_title_suffix: str | None = None

    @property
    def logger(self) -> logging.Logger:
        """Return logger."""
        return _LOGGER

    @property
    def extra_authorize_data(self) -> dict[str, Any]:
        """Extra data to include in the authorize URL."""
        return {"scope": SCOPES, "prompt": "consent"}

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Choose an account login or an explicitly owned Combined entry."""
        if self.context.get("source") == "user" and self._can_create_combined_entry():
            if user_input is None:
                return self.async_show_form(
                    step_id="user",
                    data_schema=vol.Schema(
                        {
                            vol.Required(
                                CONF_ENTRY_TYPE, default=ENTRY_TYPE_ACCOUNT
                            ): SelectSelector(
                                SelectSelectorConfig(
                                    options=[ENTRY_TYPE_ACCOUNT, ENTRY_TYPE_COMBINED],
                                    mode=SelectSelectorMode.LIST,
                                    translation_key="entry_type",
                                )
                            )
                        }
                    ),
                )
            if user_input.get(CONF_ENTRY_TYPE) == ENTRY_TYPE_COMBINED:
                return await self.async_step_combined()

        await self._ensure_implementation()
        return await super().async_step_user(None)

    def _can_create_combined_entry(self) -> bool:
        """Return whether two accounts exist and no Combined entry exists yet."""
        entries = self.hass.config_entries.async_entries(DOMAIN)
        combined_exists = any(
            entry.data.get(CONF_ENTRY_TYPE) == ENTRY_TYPE_COMBINED
            for entry in entries
        )
        return len(_account_entries(self.hass)) >= 2 and not combined_exists

    async def async_step_combined(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Create the explicit HA-owned Combined config entry."""
        if not self._can_create_combined_entry():
            return self.async_abort(reason="combined_not_available")

        account_entries = _account_entries(self.hass)
        errors: dict[str, str] = {}
        if user_input is not None:
            source_ids = list(user_input.get(CONF_SOURCE_ENTRY_IDS, []))
            valid_ids = {entry.entry_id for entry in account_entries}
            if len(source_ids) < 2 or not set(source_ids).issubset(valid_ids):
                errors["base"] = "at_least_two_sources"
            else:
                currency = _combined_currency(account_entries, source_ids)
                if currency is None:
                    errors["base"] = "mixed_currency"
                else:
                    await self.async_set_unique_id(COMBINED_UNIQUE_ID)
                    self._abort_if_unique_id_configured()
                    return self.async_create_entry(
                        title="Parqet Combined",
                        data={
                            CONF_ENTRY_TYPE: ENTRY_TYPE_COMBINED,
                            CONF_SOURCE_ENTRY_IDS: source_ids,
                            CONF_CURRENCY: currency,
                        },
                    )

        return self.async_show_form(
            step_id="combined",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_SOURCE_ENTRY_IDS,
                        default=[entry.entry_id for entry in account_entries],
                    ): _combined_source_selector(account_entries)
                }
            ),
            errors=errors,
        )

    async def _ensure_implementation(self) -> None:
        """Register the OAuth2 implementation if not already present.

        Needed when no config entries exist yet (first setup), since
        async_setup only runs when entries are present.
        """
        implementations = await config_entry_oauth2_flow.async_get_implementations(
            self.hass, DOMAIN
        )
        if not implementations:
            config_entry_oauth2_flow.async_register_implementation(
                self.hass,
                DOMAIN,
                create_parqet_oauth_implementation(self.hass),
            )

    async def async_oauth_create_entry(self, data: dict) -> ConfigFlowResult:
        """Resolve OAuth completion: discover portfolios, then prompt selection."""
        token = data.get("token", {})
        access_token = token.get("access_token", "")

        session = aiohttp_client.async_get_clientsession(self.hass)
        api = ParqetApiClient(session, access_token)

        try:
            user_info, portfolios = await asyncio.gather(
                api.async_get_user(),
                api.async_list_portfolios(),
            )
        except ParqetAuthError:
            return self.async_abort(reason="invalid_auth")
        except ParqetConnectionError:
            _LOGGER.exception("Connection error fetching Parqet data during setup")
            return self.async_abort(reason="cannot_connect")
        except ParqetApiError:
            _LOGGER.exception("Failed to fetch Parqet data during setup")
            return self.async_abort(reason="unknown")

        user_id = user_info.get("userId")
        if not user_id:
            _LOGGER.error("OAuth response missing userId; aborting")
            return self.async_abort(reason="unknown")

        self._user_id = user_id
        self._account_title_suffix = _account_title_suffix(user_info)
        self._oauth_data = data
        self._portfolios = portfolios

        _LOGGER.debug(
            "OAuth complete: user=%s, permissions=%s, portfolios=%s",
            user_id,
            [p.get("resourceId") for p in user_info.get("permissions", [])],
            [f"{p.get('name')} ({p.get('id')})" for p in portfolios],
        )

        if not portfolios:
            return self.async_abort(reason="no_portfolios")

        await self.async_set_unique_id(user_id)

        if self.source == SOURCE_REAUTH:
            return self.async_update_reload_and_abort(
                self._get_reauth_entry(),
                data_updates=data,
            )

        self._abort_if_unique_id_configured()

        if len(portfolios) == 1:
            return await self._create_account_entry([portfolios[0]])

        return await self.async_step_pick_portfolio()

    async def async_step_pick_portfolio(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Multi-select which portfolios to track under this account.

        Shared by initial setup and the reconfigure flow — on submit the
        source decides whether to create a new entry or update the existing
        one in place.
        """
        if user_input is not None:
            selected_ids: list[str] = user_input[CONF_PORTFOLIO_IDS]
            selected = [
                p for p in self._portfolios if p["id"] in selected_ids
            ]
            if not selected:
                return self.async_abort(reason="unknown")
            if self.source == SOURCE_RECONFIGURE:
                return self._update_account_entry(
                    self._get_reconfigure_entry(), selected
                )
            return await self._create_account_entry(selected)

        if self.source == SOURCE_RECONFIGURE:
            current_ids: list[str] = self._get_reconfigure_entry().data.get(
                CONF_PORTFOLIO_IDS, []
            )
            available_ids = {p["id"] for p in self._portfolios}
            default_ids = [pid for pid in current_ids if pid in available_ids] or [
                p["id"] for p in self._portfolios
            ]
        else:
            default_ids = [p["id"] for p in self._portfolios]

        options = [
            SelectOptionDict(value=p["id"], label=p["name"])
            for p in self._portfolios
        ]

        return self.async_show_form(
            step_id="pick_portfolio",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_PORTFOLIO_IDS, default=default_ids
                    ): SelectSelector(
                        SelectSelectorConfig(
                            options=options,
                            multiple=True,
                            mode=SelectSelectorMode.LIST,
                        )
                    ),
                }
            ),
        )

    @staticmethod
    def _portfolio_meta_from_api(
        portfolios: list[dict[str, Any]],
    ) -> dict[str, dict[str, str]]:
        """Build the `portfolio_meta` shape from a Parqet `/portfolios` payload."""
        return {
            p["id"]: {
                "name": p["name"],
                "currency": p.get("currency", "EUR"),
            }
            for p in portfolios
        }

    async def _create_account_entry(
        self, portfolios: list[dict[str, Any]]
    ) -> ConfigFlowResult:
        """Create the v2 account ConfigEntry covering the selected portfolios."""
        base_title = (
            portfolios[0]["name"]
            if len(portfolios) == 1
            else f"Parqet ({len(portfolios)} portfolios)"
        )
        title = self._account_entry_title(base_title)

        return self.async_create_entry(
            title=title,
            data={
                **self._oauth_data,
                CONF_USER_ID: self._user_id,
                CONF_PORTFOLIO_IDS: [p["id"] for p in portfolios],
                CONF_PORTFOLIO_META: self._portfolio_meta_from_api(portfolios),
            },
        )

    def _account_entry_title(self, base_title: str) -> str:
        """Return a title that disambiguates additional Parqet accounts.

        The first account keeps the historic title for a non-disruptive setup
        experience. When a second (or later) account is added, include a stable
        account suffix so users can tell account entries apart on the Devices &
        Services page, even when both accounts have similarly named portfolios.
        """
        existing_accounts = [
            entry
            for entry in _account_entries(self.hass)
            if entry.unique_id != self._user_id
        ]
        if not existing_accounts or not self._account_title_suffix:
            return base_title
        return f"{base_title} ({self._account_title_suffix})"

    def _update_account_entry(
        self, entry: ConfigEntry, portfolios: list[dict[str, Any]]
    ) -> ConfigFlowResult:
        """Update an existing entry to track exactly the given portfolios.

        Keeps `auth_implementation`, `token`, and `user_id` untouched — only
        rewrites the portfolio selection. HA reloads the entry which triggers
        device/entity cleanup for any portfolio dropped here.
        """
        return self.async_update_reload_and_abort(
            entry,
            data={
                **entry.data,
                CONF_PORTFOLIO_IDS: [p["id"] for p in portfolios],
                CONF_PORTFOLIO_META: self._portfolio_meta_from_api(portfolios),
            },
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Let the user re-pick portfolios for an existing entry.

        Reuses the stored OAuth token (no re-auth needed in the common case)
        to fetch the live portfolio list, then routes into `pick_portfolio`
        which dispatches to `_update_account_entry` on submit.
        """
        entry = self._get_reconfigure_entry()
        if entry.data.get(CONF_ENTRY_TYPE) == ENTRY_TYPE_COMBINED:
            return self.async_abort(reason="combined_reconfigure_via_options")

        try:
            implementation = (
                await config_entry_oauth2_flow.async_get_config_entry_implementation(
                    self.hass, entry
                )
            )
        except ValueError:
            return self.async_abort(reason="oauth_error")

        oauth_session = config_entry_oauth2_flow.OAuth2Session(
            self.hass, entry, implementation
        )
        try:
            await oauth_session.async_ensure_token_valid()
        except aiohttp.ClientError as err:
            # 4xx at the token endpoint = stored credentials are dead, only
            # reauth recovers. 5xx/network/429 are transient — sending the
            # user into a reauth flow they can't complete (because Parqet is
            # down) is confusing, so route them to `cannot_connect` instead.
            if is_token_endpoint_reauth_error(err):
                return self.async_abort(reason="reauth_required")
            return self.async_abort(reason="cannot_connect")

        session = aiohttp_client.async_get_clientsession(self.hass)
        api = ParqetApiClient(session, oauth_session=oauth_session)

        try:
            portfolios = await api.async_list_portfolios()
        except ParqetAuthError:
            return self.async_abort(reason="reauth_required")
        except ParqetConnectionError:
            return self.async_abort(reason="cannot_connect")
        except ParqetApiError:
            _LOGGER.exception("Failed to list portfolios during reconfigure")
            return self.async_abort(reason="unknown")

        if not portfolios:
            return self.async_abort(reason="no_portfolios")

        self._portfolios = portfolios
        return await self.async_step_pick_portfolio(user_input)

    async def async_step_reauth(
        self, entry_data: Mapping[str, Any]
    ) -> ConfigFlowResult:
        """Handle re-authentication when the token expires."""
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Confirm re-authentication."""
        if user_input is None:
            return self.async_show_form(
                step_id="reauth_confirm",
                data_schema=vol.Schema({}),
            )
        return await self.async_step_user()


def _account_title_suffix(user_info: Mapping[str, Any]) -> str:
    """Build a non-secret label for account entry titles.

    Parqet currently returns a `userId` but may expose a more human-readable
    name/email later. Prefer that if present; otherwise use a short, stable
    user-id suffix. This is only used when multiple Parqet account entries are
    present, so single-account titles remain unchanged.
    """
    for key in ("email", "name", "displayName"):
        value = user_info.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    user_id = str(user_info.get("userId") or "").strip()
    return f"account {user_id[-6:]}" if user_id else "account"


class ParqetOptionsFlowHandler(OptionsFlow):
    """Handle Parqet account options (apply to every portfolio in the entry)."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage account options or Combined source selection."""
        if self.config_entry.data.get(CONF_ENTRY_TYPE) == ENTRY_TYPE_COMBINED:
            return await self.async_step_combined(user_input)
        if user_input is not None:
            return self.async_create_entry(data=user_input)

        current_interval = self.config_entry.options.get(
            CONF_INTERVAL, DEFAULT_INTERVAL
        )
        current_scan = self.config_entry.options.get(
            CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL_MIN
        )
        current_snapshot_enabled = self.config_entry.options.get(
            CONF_SNAPSHOT_ENABLED, False
        )
        current_snapshot_hour = self.config_entry.options.get(
            CONF_SNAPSHOT_HOUR, DEFAULT_SNAPSHOT_HOUR
        )
        current_snapshot_minute = self.config_entry.options.get(
            CONF_SNAPSHOT_MINUTE, DEFAULT_SNAPSHOT_MINUTE
        )
        current_snapshot_weekdays_only = self.config_entry.options.get(
            CONF_SNAPSHOT_WEEKDAYS_ONLY, DEFAULT_SNAPSHOT_WEEKDAYS_ONLY
        )

        interval_options = {v: v.upper() for v in INTERVALS}

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_INTERVAL, default=current_interval
                    ): vol.In(interval_options),
                    vol.Required(
                        CONF_SCAN_INTERVAL, default=current_scan
                    ): vol.All(vol.Coerce(int), vol.Range(min=MIN_SCAN_INTERVAL_MIN)),
                    vol.Optional(
                        CONF_SNAPSHOT_ENABLED, default=current_snapshot_enabled
                    ): bool,
                    vol.Optional(
                        CONF_SNAPSHOT_HOUR, default=current_snapshot_hour
                    ): vol.All(vol.Coerce(int), vol.Range(min=0, max=23)),
                    vol.Optional(
                        CONF_SNAPSHOT_MINUTE, default=current_snapshot_minute
                    ): vol.All(vol.Coerce(int), vol.Range(min=0, max=59)),
                    vol.Optional(
                        CONF_SNAPSHOT_WEEKDAYS_ONLY,
                        default=current_snapshot_weekdays_only,
                    ): bool,
                }
            ),
        )

    async def async_step_combined(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Update the selected account sources for a Combined entry."""
        account_entries = _account_entries(self.hass)
        valid_ids = {entry.entry_id for entry in account_entries}
        errors: dict[str, str] = {}
        if user_input is not None:
            source_ids = list(user_input.get(CONF_SOURCE_ENTRY_IDS, []))
            if len(source_ids) < 2 or not set(source_ids).issubset(valid_ids):
                errors["base"] = "at_least_two_sources"
            else:
                currency = _combined_currency(account_entries, source_ids)
                if currency is None:
                    errors["base"] = "mixed_currency"
                else:
                    return self.async_create_entry(
                        data={
                            CONF_SOURCE_ENTRY_IDS: source_ids,
                            CONF_CURRENCY: currency,
                        }
                    )

        return self.async_show_form(
            step_id="combined",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_SOURCE_ENTRY_IDS,
                        default=self.config_entry.options.get(
                            CONF_SOURCE_ENTRY_IDS,
                            self.config_entry.data.get(
                                CONF_SOURCE_ENTRY_IDS,
                                [entry.entry_id for entry in account_entries],
                            ),
                        ),
                    ): _combined_source_selector(account_entries)
                }
            ),
            errors=errors,
        )
