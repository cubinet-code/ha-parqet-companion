"""Base entity for the Parqet integration."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import CONF_PORTFOLIO_ID, CONF_PORTFOLIO_NAME, DOMAIN
from .coordinator import ParqetDataUpdateCoordinator

if TYPE_CHECKING:
    from . import ParqetConfigEntry


class ParqetEntity(CoordinatorEntity[ParqetDataUpdateCoordinator]):
    """Base class for Parqet entities."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: ParqetDataUpdateCoordinator,
        entry: ParqetConfigEntry,
    ) -> None:
        """Initialize the entity."""
        super().__init__(coordinator)
        portfolio_id = entry.data[CONF_PORTFOLIO_ID]
        self._portfolio_id = portfolio_id
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, portfolio_id)},
            name=entry.data.get(CONF_PORTFOLIO_NAME, "Parqet Portfolio"),
            manufacturer="Parqet",
            entry_type=DeviceEntryType.SERVICE,
        )
