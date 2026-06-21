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
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.device_registry import (
    DeviceEntryType,
    DeviceInfo,
)
from homeassistant.helpers.device_registry import (
    async_get as async_get_device_registry,
)
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import ParqetConfigEntry
from .const import CONF_PORTFOLIO_META, DOMAIN
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

# Aggregate sensors intentionally include only additive metrics. Percentages such
# as XIRR/TTWROR cannot be summed across OAuth accounts without account-level
# cash-flow data, so exposing them as "combined" would be misleading.
AGGREGATE_SENSORS = [
    description
    for description in ALL_SENSORS
    if not description.is_percentage
]

AGGREGATE_SENSOR_KEY = "aggregate_sensors"
AGGREGATE_COORDINATORS_KEY = "aggregate_coordinators"
AGGREGATE_OWNER_ENTRY_ID_KEY = "aggregate_owner_entry_id"
AGGREGATE_DEVICE_ID = "combined_accounts"


def _active_holdings(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Return non-sold holdings from one portfolio payload."""
    return [
        holding
        for holding in data.get("holdings", [])
        if not holding.get("position", {}).get("isSold", False)
    ]


def _aggregate_value(
    datasets: list[dict[str, Any]], description: ParqetSensorEntityDescription
) -> float | int | None:
    """Aggregate one additive sensor description across portfolio payloads."""
    values: list[float | int] = []
    for data in datasets:
        if description.custom_value_fn is not None:
            value = description.custom_value_fn(data)
        else:
            value = _resolve_path(data, description.value_path)
        if isinstance(value, int | float):
            values.append(value)

    if not values:
        return None
    return sum(values)


def _has_multiple_account_sources(
    coordinators_by_entry: dict[str, list[ParqetDataUpdateCoordinator]],
) -> bool:
    """Return whether aggregate sensors can calculate a combined state."""
    return len(coordinators_by_entry) >= 2


def _aggregate_owner_entry_id(hass: HomeAssistant) -> str | None:
    """Return the deterministic config entry that owns aggregate entities."""
    entry_ids = sorted(entry.entry_id for entry in hass.config_entries.async_entries(DOMAIN))
    if len(entry_ids) < 2:
        return None
    return entry_ids[0]


def _cleanup_aggregate_device_entries(
    hass: HomeAssistant, aggregate_owner_entry_id: str
) -> None:
    """Ensure the aggregate device is linked to only its owner entry."""
    registry = async_get_device_registry(hass)
    device = registry.async_get_device(identifiers={(DOMAIN, AGGREGATE_DEVICE_ID)})
    if device is None:
        return

    for config_entry_id in device.config_entries - {aggregate_owner_entry_id}:
        registry.async_update_device(
            device.id,
            remove_config_entry_id=config_entry_id,
        )


def _combined_top_holdings(datasets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return the top 5 active holdings by current value across all payloads."""
    holdings = [holding for data in datasets for holding in _active_holdings(data)]
    sorted_holdings = sorted(
        holdings,
        key=lambda h: h.get("position", {}).get("currentValue", 0),
        reverse=True,
    )
    total = sum(
        h.get("position", {}).get("currentValue", 0) for h in sorted_holdings
    )
    return [
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


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ParqetConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Parqet sensor entities for every portfolio under the account."""
    runtime = entry.runtime_data
    portfolio_meta: dict[str, dict[str, str]] = entry.data.get(
        CONF_PORTFOLIO_META, {}
    )

    entities: list[ParqetSensor] = []
    for portfolio_id, coordinator in runtime.coordinators.items():
        meta = portfolio_meta.get(portfolio_id, {})
        portfolio_name = meta.get("name", portfolio_id)
        currency = meta.get("currency", "EUR")
        entities.extend(
            ParqetSensor(
                coordinator,
                entry,
                description,
                portfolio_id=portfolio_id,
                portfolio_name=portfolio_name,
                currency=currency,
            )
            for description in ALL_SENSORS
        )

    async_add_entities(entities)

    integration_data = hass.data.setdefault(DOMAIN, {})
    aggregate_coordinators = integration_data.setdefault(
        AGGREGATE_COORDINATORS_KEY, {}
    )
    aggregate_coordinators[entry.entry_id] = list(runtime.coordinators.values())

    aggregate_sensors: list[ParqetAggregateSensor] | None = integration_data.get(
        AGGREGATE_SENSOR_KEY
    )
    if _aggregate_owner_entry_id(hass) is None:
        if aggregate_sensors is not None:
            for sensor in aggregate_sensors:
                sensor.refresh_coordinators()
        return

    # Aggregate entities need to be owned by exactly one config entry. If they
    # are offered from multiple entry platforms, Home Assistant links the
    # virtual "Parqet Combined" device to multiple account entries and shows it
    # under each one. The first loaded entry that sees at least two configured
    # Parqet accounts becomes the aggregate owner; other entries only feed
    # coordinator data/listeners.
    aggregate_owner_entry_id = integration_data.setdefault(
        AGGREGATE_OWNER_ENTRY_ID_KEY, entry.entry_id
    )
    _cleanup_aggregate_device_entries(hass, aggregate_owner_entry_id)
    if aggregate_sensors is None:
        aggregate_sensors = [
            ParqetAggregateSensor(hass, description)
            for description in AGGREGATE_SENSORS
        ]
        integration_data[AGGREGATE_SENSOR_KEY] = aggregate_sensors
        async_add_entities(aggregate_sensors)
    elif entry.entry_id != aggregate_owner_entry_id:
        for sensor in aggregate_sensors:
            sensor.refresh_coordinators()
        return
    else:
        # Entities that were disabled by default are only created once the user
        # enables them and reloads the integration. Re-offer cached aggregate
        # entities that have not been added to a platform yet, while only
        # refreshing listeners for already-active entities.
        not_added = [sensor for sensor in aggregate_sensors if sensor.platform is None]
        if not_added:
            async_add_entities(not_added)
        for sensor in aggregate_sensors:
            sensor.refresh_coordinators()


class ParqetAggregateSensor(SensorEntity):
    """A sensor aggregating additive metrics across all loaded Parqet entries."""

    _attr_has_entity_name = True

    entity_description: ParqetSensorEntityDescription

    def __init__(
        self,
        hass: HomeAssistant,
        description: ParqetSensorEntityDescription,
    ) -> None:
        """Initialize the aggregate sensor."""
        self._hass = hass
        self.entity_description = description
        self._remove_listeners: list[CALLBACK_TYPE] = []
        self._attr_unique_id = f"{AGGREGATE_DEVICE_ID}_{description.key}"
        self._attr_entity_registry_enabled_default = (
            description.entity_registry_enabled_default
        )
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, AGGREGATE_DEVICE_ID)},
            name="Parqet Combined",
            manufacturer="Parqet",
            entry_type=DeviceEntryType.SERVICE,
        )
        if description.device_class == SensorDeviceClass.MONETARY:
            self._attr_native_unit_of_measurement = "EUR"

    async def async_added_to_hass(self) -> None:
        """Register listeners for every loaded portfolio coordinator."""
        aggregate_owner_entry_id = self._hass.data.get(DOMAIN, {}).get(
            AGGREGATE_OWNER_ENTRY_ID_KEY
        )
        if aggregate_owner_entry_id is not None:
            _cleanup_aggregate_device_entries(self._hass, aggregate_owner_entry_id)
        self.refresh_coordinators()

    async def async_will_remove_from_hass(self) -> None:
        """Remove coordinator listeners."""
        self._clear_listeners()

    @callback
    def _clear_listeners(self) -> None:
        """Detach all coordinator listeners."""
        for remove_listener in self._remove_listeners:
            remove_listener()
        self._remove_listeners.clear()

    @callback
    def refresh_coordinators(self) -> None:
        """Refresh coordinator listeners after entries are loaded or unloaded."""
        self._clear_listeners()
        for coordinator in self._coordinators:
            self._remove_listeners.append(
                coordinator.async_add_listener(self.async_write_ha_state)
            )

        if self.platform is not None:
            self.async_write_ha_state()

    @property
    def _coordinators(self) -> list[ParqetDataUpdateCoordinator]:
        """Return all currently loaded Parqet portfolio coordinators."""
        integration_data = self._hass.data.get(DOMAIN, {})
        coordinators_by_entry = integration_data.get(AGGREGATE_COORDINATORS_KEY, {})
        if not _has_multiple_account_sources(coordinators_by_entry):
            return []

        return [
            coordinator
            for coordinators in coordinators_by_entry.values()
            for coordinator in coordinators
        ]

    @property
    def _datasets(self) -> list[dict[str, Any]]:
        """Return data payloads from loaded coordinators."""
        return [
            coordinator.data
            for coordinator in self._coordinators
            if coordinator.data is not None
        ]

    @property
    def native_value(self) -> float | int | None:
        """Return the combined sensor value."""
        return _aggregate_value(self._datasets, self.entity_description)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return metadata for aggregate sensors."""
        datasets = self._datasets
        if not datasets:
            return None

        attrs: dict[str, Any] = {
            "portfolio_count": len(datasets),
            "source_entry_ids": list(
                self._hass.data.get(DOMAIN, {})
                .get(AGGREGATE_COORDINATORS_KEY, {})
                .keys()
            ),
        }
        if self.entity_description.key == "total_value":
            attrs["top_holdings"] = _combined_top_holdings(datasets)
            attrs["holdings_count"] = _aggregate_value(
                datasets,
                next(
                    description
                    for description in AGGREGATE_SENSORS
                    if description.key == "holdings_count"
                ),
            )
        return attrs


class ParqetSensor(ParqetEntity, SensorEntity):
    """A Parqet portfolio sensor."""

    entity_description: ParqetSensorEntityDescription

    def __init__(
        self,
        coordinator: ParqetDataUpdateCoordinator,
        entry: ParqetConfigEntry,
        description: ParqetSensorEntityDescription,
        *,
        portfolio_id: str,
        portfolio_name: str,
        currency: str,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry, portfolio_id, portfolio_name)
        self.entity_description = description

        self._entry_id = entry.entry_id
        self._attr_unique_id = f"{portfolio_id}_{description.key}"
        self._attr_entity_registry_enabled_default = (
            description.entity_registry_enabled_default
        )

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
