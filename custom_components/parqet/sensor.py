"""Sensor platform for Parqet."""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import ParqetConfigEntry
from .const import CONF_CURRENCY
from .coordinator import ParqetDataUpdateCoordinator
from .entity import ParqetEntity

_LOGGER = logging.getLogger(__name__)

PARALLEL_UPDATES = 0


@dataclass(frozen=True, kw_only=True)
class ParqetSensorEntityDescription(SensorEntityDescription):
    """Describe a Parqet sensor with an extraction path."""

    # Dot-separated path into the coordinator data, e.g.
    # "performance.valuation.atIntervalEnd"
    value_path: str
    # Whether this is a percentage (already in %) or monetary value.
    is_percentage: bool = False
    # Whether this sensor is enabled by default.
    entity_registry_enabled_default: bool = True
    # Optional callable for derived values that don't map to a data path.
    custom_value_fn: Callable[[dict[str, Any]], float | None] | None = field(
        default=None, repr=False
    )

    def __post_init__(self) -> None:
        """Set state_class based on device_class if not explicitly provided."""
        # HA requires MONETARY sensors to use TOTAL, not MEASUREMENT.
        if (
            self.device_class == SensorDeviceClass.MONETARY
            and self.state_class == SensorStateClass.MEASUREMENT
        ):
            object.__setattr__(self, "state_class", SensorStateClass.TOTAL)


def _resolve_path(data: dict[str, Any], path: str) -> Any:
    """Resolve a dot-separated path into a nested dict, returning None on miss."""
    current: Any = data
    for key in path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(key)
        if current is None:
            return None
    return current


# ─── Core KPIs (enabled by default) ──────────────────────────────────────────

CORE_SENSORS: list[ParqetSensorEntityDescription] = [
    ParqetSensorEntityDescription(
        key="total_value",
        translation_key="total_value",
        icon="mdi:cash-multiple",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.valuation.atIntervalEnd",
    ),
    ParqetSensorEntityDescription(
        key="xirr",
        translation_key="xirr",
        icon="mdi:chart-line",
        native_unit_of_measurement="%",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.kpis.inInterval.xirr",
        is_percentage=True,
    ),
    ParqetSensorEntityDescription(
        key="ttwror",
        translation_key="ttwror",
        icon="mdi:chart-timeline-variant",
        native_unit_of_measurement="%",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.kpis.inInterval.ttwror",
        is_percentage=True,
    ),
    ParqetSensorEntityDescription(
        key="unrealized_gain",
        translation_key="unrealized_gain",
        icon="mdi:trending-up",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.unrealizedGains.inInterval.gainGross",
    ),
    ParqetSensorEntityDescription(
        key="realized_gain",
        translation_key="realized_gain",
        icon="mdi:cash-check",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.realizedGains.inInterval.gainGross",
    ),
    ParqetSensorEntityDescription(
        key="dividends",
        translation_key="dividends",
        icon="mdi:cash-refund",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.dividends.inInterval.gainGross",
    ),
    ParqetSensorEntityDescription(
        key="fees",
        translation_key="fees",
        icon="mdi:credit-card-outline",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.fees.inInterval.fees",
    ),
    ParqetSensorEntityDescription(
        key="taxes",
        translation_key="taxes",
        icon="mdi:receipt-text",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.taxes.inInterval.taxes",
    ),
]

# ─── Detailed metrics ─────────────────────────────────────────────────────────

DETAILED_SENSORS: list[ParqetSensorEntityDescription] = [
    ParqetSensorEntityDescription(
        key="valuation_start",
        translation_key="valuation_start",
        icon="mdi:cash-clock",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.valuation.atIntervalStart",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="unrealized_gain_net",
        translation_key="unrealized_gain_net",
        icon="mdi:trending-up",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.unrealizedGains.inInterval.gainNet",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="unrealized_return_gross",
        translation_key="unrealized_return_gross",
        icon="mdi:percent-outline",
        native_unit_of_measurement="%",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.unrealizedGains.inInterval.returnGross",
        is_percentage=True,
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="unrealized_return_net",
        translation_key="unrealized_return_net",
        icon="mdi:percent-outline",
        native_unit_of_measurement="%",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.unrealizedGains.inInterval.returnNet",
        is_percentage=True,
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="realized_gain_net",
        translation_key="realized_gain_net",
        icon="mdi:cash-check",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.realizedGains.inInterval.gainNet",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="realized_return_gross",
        translation_key="realized_return_gross",
        icon="mdi:percent-outline",
        native_unit_of_measurement="%",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.realizedGains.inInterval.returnGross",
        is_percentage=True,
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="realized_return_net",
        translation_key="realized_return_net",
        icon="mdi:percent-outline",
        native_unit_of_measurement="%",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.realizedGains.inInterval.returnNet",
        is_percentage=True,
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="dividends_net",
        translation_key="dividends_net",
        icon="mdi:cash-refund",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.dividends.inInterval.gainNet",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="dividends_taxes",
        translation_key="dividends_taxes",
        icon="mdi:receipt-text",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.dividends.inInterval.taxes",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="dividends_fees",
        translation_key="dividends_fees",
        icon="mdi:credit-card-outline",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.dividends.inInterval.fees",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="holdings_count",
        translation_key="holdings_count",
        icon="mdi:format-list-numbered",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_path="",
        custom_value_fn=lambda data: len(data.get("holdings") or []),
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="net_allocation",
        translation_key="net_allocation",
        icon="mdi:scale-balance",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="netAllocations.net",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="positive_allocation",
        translation_key="positive_allocation",
        icon="mdi:arrow-up-bold-circle-outline",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="netAllocations.positive.total",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="negative_allocation",
        translation_key="negative_allocation",
        icon="mdi:arrow-down-bold-circle-outline",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="netAllocations.negative.total",
        entity_registry_enabled_default=False,
    ),
]

ALL_SENSORS = CORE_SENSORS + DETAILED_SENSORS


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ParqetConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Parqet sensor entities from a config entry."""
    coordinator = entry.runtime_data

    async_add_entities(
        ParqetSensor(coordinator, entry, description)
        for description in ALL_SENSORS
    )


class ParqetSensor(ParqetEntity, SensorEntity):
    """A Parqet portfolio sensor."""

    entity_description: ParqetSensorEntityDescription

    def __init__(
        self,
        coordinator: ParqetDataUpdateCoordinator,
        entry: ParqetConfigEntry,
        description: ParqetSensorEntityDescription,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry)
        self.entity_description = description

        currency = entry.data.get(CONF_CURRENCY, "EUR")

        self._entry_id = entry.entry_id
        self._attr_unique_id = f"{self._portfolio_id}_{description.key}"
        self._attr_entity_registry_enabled_default = (
            description.entity_registry_enabled_default
        )

        # Set dynamic currency for monetary sensors.
        if description.device_class == SensorDeviceClass.MONETARY:
            self._attr_native_unit_of_measurement = currency

    @property
    def native_value(self) -> float | None:
        """Return the sensor value."""
        if self.coordinator.data is None:
            return None

        desc = self.entity_description

        if desc.custom_value_fn is not None:
            return desc.custom_value_fn(self.coordinator.data)

        return _resolve_path(self.coordinator.data, desc.value_path)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return extra attributes for the total_value sensor."""
        if self.entity_description.key != "total_value":
            return None
        if self.coordinator.data is None:
            return None

        holdings = self.coordinator.data.get("holdings", [])
        # Top 5 holdings by current value.
        sorted_holdings = sorted(
            (h for h in holdings if not h.get("position", {}).get("isSold", False)),
            key=lambda h: h.get("position", {}).get("currentValue", 0),
            reverse=True,
        )
        total = sum(
            h.get("position", {}).get("currentValue", 0) for h in sorted_holdings
        )
        top = [
            {
                "name": h.get("asset", {}).get("name", h.get("nickname", "Unknown")),
                "value": round(h.get("position", {}).get("currentValue", 0), 2),
                "weight": round(
                    h.get("position", {}).get("currentValue", 0) / total * 100, 1
                )
                if total > 0
                else 0,
            }
            for h in sorted_holdings[:5]
        ]

        return {
            "entry_id": self._entry_id,
            "portfolio_id": self._portfolio_id,
            "holdings_count": len(sorted_holdings),
            "top_holdings": top,
            "interval": self.coordinator.interval,
        }
