"""Config flow for Parqet integration."""

from __future__ import annotations

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

from .api import ParqetApiClient, ParqetApiError
from .const import (
    CONF_CURRENCY,
    CONF_INTERVAL,
    CONF_PORTFOLIO_ID,
    CONF_PORTFOLIO_NAME,
    CONF_SCAN_INTERVAL,
    DEFAULT_INTERVAL,
    DEFAULT_SCAN_INTERVAL_MIN,
    DOMAIN,
    INTERVALS,
    MIN_SCAN_INTERVAL_MIN,
    SCOPES,
)

_LOGGER = logging.getLogger(__name__)


class ParqetOAuth2FlowHandler(
    config_entry_oauth2_flow.AbstractOAuth2FlowHandler, domain=DOMAIN
):
    """Handle the Parqet OAuth2 config flow."""

    DOMAIN = DOMAIN
    VERSION = 1
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
        return {"scope": SCOPES}

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the user step."""
        return await super().async_step_user(user_input)

    async def async_oauth_create_entry(self, data: dict) -> ConfigFlowResult:
        """Create an entry after OAuth2 authorization.

        Fetches portfolios and either auto-selects (if only one) or shows
        a selection step.
        """
        token = data.get("token", {})
        access_token = token.get("access_token", "")

        session = aiohttp_client.async_get_clientsession(self.hass)
        api = ParqetApiClient(session, access_token)

        try:
            user_info = await api.async_get_user()
            portfolios = await api.async_list_portfolios()
        except ParqetApiError:
            _LOGGER.exception("Failed to fetch Parqet data during setup")
            return self.async_abort(reason="cannot_connect")

        self._user_id = user_info.get("userId")

        if not portfolios:
            return self.async_abort(reason="no_portfolios")

        self._oauth_data = data
        self._portfolios = portfolios

        if len(portfolios) == 1:
            return await self._create_portfolio_entry(portfolios[0])

        return await self.async_step_pick_portfolio()

    async def async_step_pick_portfolio(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Let the user pick which portfolios to track."""
        if user_input is not None:
            selected_ids: list[str] = user_input[CONF_PORTFOLIO_ID]
            selected = [
                p for p in self._portfolios if p["id"] in selected_ids
            ]

            if not selected:
                return self.async_abort(reason="unknown")

            # Create additional entries for all but the last.
            existing = {
                entry.unique_id for entry in self._async_current_entries()
            }
            for portfolio in selected[:-1]:
                portfolio_id = portfolio["id"]
                unique_id = f"{self._user_id}_{portfolio_id}"
                if unique_id in existing:
                    continue
                await self.hass.config_entries.flow.async_init(
                    DOMAIN,
                    context={"source": "batch_create"},
                    data={
                        "oauth_data": self._oauth_data,
                        "user_id": self._user_id,
                        CONF_PORTFOLIO_ID: portfolio_id,
                        CONF_PORTFOLIO_NAME: portfolio["name"],
                        CONF_CURRENCY: portfolio.get("currency", "EUR"),
                    },
                )

            # The last entry is created normally to finish this flow.
            return await self._create_portfolio_entry(selected[-1])

        # Filter out already-configured portfolios.
        configured_ids = {
            entry.data.get(CONF_PORTFOLIO_ID)
            for entry in self._async_current_entries()
        }
        available = [p for p in self._portfolios if p["id"] not in configured_ids]

        if not available:
            return self.async_abort(reason="already_configured")

        if len(available) == 1:
            return await self._create_portfolio_entry(available[0])

        options = [
            SelectOptionDict(value=p["id"], label=p["name"])
            for p in available
        ]
        # Pre-select all by default.
        default_ids = [p["id"] for p in available]

        return self.async_show_form(
            step_id="pick_portfolio",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_PORTFOLIO_ID, default=default_ids
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

    async def _create_portfolio_entry(
        self, portfolio: dict[str, Any]
    ) -> ConfigFlowResult:
        """Create a config entry for the selected portfolio."""
        portfolio_id = portfolio["id"]
        portfolio_name = portfolio["name"]
        currency = portfolio.get("currency", "EUR")

        unique_id = f"{self._user_id}_{portfolio_id}"
        await self.async_set_unique_id(unique_id)

        if self.source == SOURCE_REAUTH:
            self._abort_if_unique_id_mismatch()
            return self.async_update_reload_and_abort(
                self._get_reauth_entry(),
                data_updates={
                    **self._oauth_data,
                    CONF_PORTFOLIO_ID: portfolio_id,
                    CONF_PORTFOLIO_NAME: portfolio_name,
                    CONF_CURRENCY: currency,
                },
            )

        self._abort_if_unique_id_configured()

        return self.async_create_entry(
            title=portfolio_name,
            data={
                **self._oauth_data,
                CONF_PORTFOLIO_ID: portfolio_id,
                CONF_PORTFOLIO_NAME: portfolio_name,
                CONF_CURRENCY: currency,
            },
        )

    async def async_step_batch_create(
        self, data: dict[str, Any]
    ) -> ConfigFlowResult:
        """Handle batch portfolio creation from multi-select flow."""
        user_id = data["user_id"]
        portfolio_id = data[CONF_PORTFOLIO_ID]
        oauth_data = data["oauth_data"]

        unique_id = f"{user_id}_{portfolio_id}"
        await self.async_set_unique_id(unique_id)
        self._abort_if_unique_id_configured()

        return self.async_create_entry(
            title=data[CONF_PORTFOLIO_NAME],
            data={
                **oauth_data,
                CONF_PORTFOLIO_ID: portfolio_id,
                CONF_PORTFOLIO_NAME: data[CONF_PORTFOLIO_NAME],
                CONF_CURRENCY: data.get(CONF_CURRENCY, "EUR"),
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
    """Handle Parqet options."""

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
                }
            ),
        )
