"""Config flow for Parqet integration.

v2 schema: one ConfigEntry per Parqet account, multiple portfolios as devices
under that entry. See `migration.py` for the v1 → v2 upgrade path.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Mapping
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import (
    SOURCE_REAUTH,
    ConfigEntry,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
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
)
from .const import (
    CONF_INTERVAL,
    CONF_PORTFOLIO_IDS,
    CONF_PORTFOLIO_META,
    CONF_SCAN_INTERVAL,
    CONF_SNAPSHOT_ENABLED,
    CONF_SNAPSHOT_HOUR,
    CONF_SNAPSHOT_MINUTE,
    CONF_SNAPSHOT_WEEKDAYS_ONLY,
    CONF_USER_ID,
    DEFAULT_INTERVAL,
    DEFAULT_SCAN_INTERVAL_MIN,
    DEFAULT_SNAPSHOT_HOUR,
    DEFAULT_SNAPSHOT_MINUTE,
    DEFAULT_SNAPSHOT_WEEKDAYS_ONLY,
    DOMAIN,
    INTERVALS,
    MIN_SCAN_INTERVAL_MIN,
    SCOPES,
)
from .oauth import create_parqet_oauth_implementation

_LOGGER = logging.getLogger(__name__)


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
        """Handle the user step, ensuring OAuth implementation is registered."""
        await self._ensure_implementation()
        return await super().async_step_user(user_input)

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
            # Reauth path: update the existing entry in place with the new
            # token. Portfolio selection is not changed — that's a reconfigure
            # concern, not a reauth concern.
            reauth_entry = self._get_reauth_entry()
            return self.async_update_reload_and_abort(
                reauth_entry,
                data_updates=data,
            )

        self._abort_if_unique_id_configured()

        if len(portfolios) == 1:
            return await self._create_account_entry([portfolios[0]])

        return await self.async_step_pick_portfolio()

    async def async_step_pick_portfolio(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Multi-select which portfolios to track under this account."""
        if user_input is not None:
            selected_ids: list[str] = user_input[CONF_PORTFOLIO_IDS]
            selected = [
                p for p in self._portfolios if p["id"] in selected_ids
            ]
            if not selected:
                return self.async_abort(reason="unknown")
            return await self._create_account_entry(selected)

        options = [
            SelectOptionDict(value=p["id"], label=p["name"])
            for p in self._portfolios
        ]
        default_ids = [p["id"] for p in self._portfolios]

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

    async def _create_account_entry(
        self, portfolios: list[dict[str, Any]]
    ) -> ConfigFlowResult:
        """Create the v2 account ConfigEntry covering the selected portfolios."""
        portfolio_ids = [p["id"] for p in portfolios]
        portfolio_meta = {
            p["id"]: {
                "name": p["name"],
                "currency": p.get("currency", "EUR"),
            }
            for p in portfolios
        }

        title = (
            portfolios[0]["name"]
            if len(portfolios) == 1
            else f"Parqet ({len(portfolios)} portfolios)"
        )

        return self.async_create_entry(
            title=title,
            data={
                **self._oauth_data,
                CONF_USER_ID: self._user_id,
                CONF_PORTFOLIO_IDS: portfolio_ids,
                CONF_PORTFOLIO_META: portfolio_meta,
            },
        )

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


class ParqetOptionsFlowHandler(OptionsFlow):
    """Handle Parqet account options (apply to every portfolio in the entry)."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage the options."""
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
