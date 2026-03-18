"""DataUpdateCoordinator for Parqet."""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import ParqetApiClient, ParqetApiError, ParqetAuthError, ParqetConnectionError
from .const import DEFAULT_INTERVAL, DEFAULT_SCAN_INTERVAL

_LOGGER = logging.getLogger(__name__)


class ParqetDataUpdateCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Coordinator to fetch Parqet portfolio data."""

    def __init__(
        self,
        hass: HomeAssistant,
        api: ParqetApiClient,
        portfolio_id: str,
        portfolio_name: str,
        interval: str = DEFAULT_INTERVAL,
        scan_interval_min: int | None = None,
        config_entry: ConfigEntry | None = None,
    ) -> None:
        """Initialize the coordinator."""
        update_interval = (
            timedelta(minutes=scan_interval_min)
            if scan_interval_min
            else DEFAULT_SCAN_INTERVAL
        )
        super().__init__(
            hass,
            _LOGGER,
            config_entry=config_entry,
            name=f"Parqet {portfolio_name}",
            update_interval=update_interval,
            always_update=False,
        )
        self.api = api
        self.portfolio_id = portfolio_id
        self.interval = interval

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch performance data from Parqet API."""
        try:
            return await self.api.async_get_performance(
                [self.portfolio_id], self.interval
            )
        except ParqetAuthError as err:
            raise ConfigEntryAuthFailed(
                f"Authentication failed for Parqet: {err}"
            ) from err
        except ParqetConnectionError as err:
            raise UpdateFailed(
                f"Error communicating with Parqet API: {err}"
            ) from err
        except ParqetApiError as err:
            raise UpdateFailed(
                f"Parqet API error: {err}"
            ) from err
