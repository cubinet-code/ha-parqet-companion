"""Base entity for the Parqet integration."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import ParqetDataUpdateCoordinator

if TYPE_CHECKING:
    from . import ParqetConfigEntry


class ParqetEntity(CoordinatorEntity[ParqetDataUpdateCoordinator]):
    """Base class for Parqet entities (one device per portfolio)."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: ParqetDataUpdateCoordinator,
        entry: ParqetConfigEntry,
        portfolio_id: str,
        portfolio_name: str,
    ) -> None:
        """Initialize the entity for a specific portfolio under the account entry."""
        super().__init__(coordinator)
        self._portfolio_id = portfolio_id
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, portfolio_id)},
            name=portfolio_name,
            manufacturer="Parqet",
            entry_type=DeviceEntryType.SERVICE,
        )
