"""Sensor platform for Parqet."""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from homeassistant.components.sensor import (
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import ParqetAccountRuntime, ParqetConfigEntry
from .const import (
    COMBINED_UNIQUE_ID,
    CONF_CURRENCY,
    CONF_ENTRY_TYPE,
    CONF_PORTFOLIO_META,
    CONF_SOURCE_ENTRY_IDS,
    DOMAIN,
    ENTRY_TYPE_COMBINED,
    SIGNAL_ACCOUNTS_UPDATED,
)
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
    # Whether the native unit is the portfolio currency.
    #
    # These deliberately do NOT set device_class=MONETARY. Home Assistant only
    # permits state_class=TOTAL with that device class, and TOTAL compiles a
    # "sum" statistic only — no mean/min/max. Portfolio figures are levels
    # sampled every poll, not accumulating meter readings, so a sum is
    # meaningless and there is nothing for a history chart to draw (#8).
    # Keeping MEASUREMENT gives correct min/mean/max long-term statistics; the
    # currency still shows because it remains the unit of measurement.
    is_monetary: bool = False
    # Whether this sensor is enabled by default.
    entity_registry_enabled_default: bool = True
    # Optional callable for derived values that don't map to a data path.
    custom_value_fn: Callable[[dict[str, Any]], float | None] | None = field(
        default=None, repr=False
    )


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
        is_monetary=True,
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
        is_monetary=True,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.unrealizedGains.inInterval.gainGross",
    ),
    ParqetSensorEntityDescription(
        key="realized_gain",
        translation_key="realized_gain",
        icon="mdi:cash-check",
        is_monetary=True,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.realizedGains.inInterval.gainGross",
    ),
    ParqetSensorEntityDescription(
        key="dividends",
        translation_key="dividends",
        icon="mdi:cash-refund",
        is_monetary=True,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.dividends.inInterval.gainGross",
    ),
    ParqetSensorEntityDescription(
        key="fees",
        translation_key="fees",
        icon="mdi:credit-card-outline",
        is_monetary=True,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.fees.inInterval.fees",
    ),
    ParqetSensorEntityDescription(
        key="taxes",
        translation_key="taxes",
        icon="mdi:receipt-text",
        is_monetary=True,
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
        is_monetary=True,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.valuation.atIntervalStart",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="unrealized_gain_net",
        translation_key="unrealized_gain_net",
        icon="mdi:trending-up",
        is_monetary=True,
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
        is_monetary=True,
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
        is_monetary=True,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.dividends.inInterval.gainNet",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="dividends_taxes",
        translation_key="dividends_taxes",
        icon="mdi:receipt-text",
        is_monetary=True,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="performance.dividends.inInterval.taxes",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="dividends_fees",
        translation_key="dividends_fees",
        icon="mdi:credit-card-outline",
        is_monetary=True,
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
        custom_value_fn=lambda data: len(_active_holdings(data)),
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="net_allocation",
        translation_key="net_allocation",
        icon="mdi:scale-balance",
        is_monetary=True,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="netAllocations.net",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="positive_allocation",
        translation_key="positive_allocation",
        icon="mdi:arrow-up-bold-circle-outline",
        is_monetary=True,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_path="netAllocations.positive.total",
        entity_registry_enabled_default=False,
    ),
    ParqetSensorEntityDescription(
        key="negative_allocation",
        translation_key="negative_allocation",
        icon="mdi:arrow-down-bold-circle-outline",
        is_monetary=True,
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

AGGREGATE_DEVICE_ID = COMBINED_UNIQUE_ID


def _active_holdings(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Return non-sold holdings from one portfolio payload."""
    return [
        holding
        for holding in data.get("holdings") or []
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


def _top_holdings(holdings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return the top 5 holdings by current value, weighted against their total."""
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
    """Set up account sensors or HA-owned Combined sensors."""
    if entry.data.get(CONF_ENTRY_TYPE) == ENTRY_TYPE_COMBINED:
        async_add_entities(
            ParqetAggregateSensor(hass, entry, description)
            for description in AGGREGATE_SENSORS
        )
        return

    runtime = entry.runtime_data
    if not isinstance(runtime, ParqetAccountRuntime):
        return

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


class ParqetAggregateSensor(SensorEntity):
    """A sensor aggregating additive metrics across all loaded Parqet entries."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    entity_description: ParqetSensorEntityDescription

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ParqetConfigEntry,
        description: ParqetSensorEntityDescription,
    ) -> None:
        """Initialize the aggregate sensor owned by the Combined entry."""
        self._hass = hass
        self._combined_entry = entry
        self.entity_description = description
        self._remove_listeners: list[CALLBACK_TYPE] = []
        self._remove_source_listener: CALLBACK_TYPE | None = None
        # Set only while handling the unload notification for a source entry,
        # which HA still reports as LOADED at that point (see async_unload_entry).
        self._unloading_entry_id: str | None = None
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

    async def async_added_to_hass(self) -> None:
        """Register source lifecycle and coordinator listeners."""
        self._remove_source_listener = async_dispatcher_connect(
            self._hass,
            SIGNAL_ACCOUNTS_UPDATED,
            self.refresh_coordinators,
        )
        self.refresh_coordinators()

    async def async_will_remove_from_hass(self) -> None:
        """Remove source lifecycle and coordinator listeners."""
        self._clear_coordinator_listeners()
        if self._remove_source_listener is not None:
            self._remove_source_listener()
            self._remove_source_listener = None

    @callback
    def _clear_coordinator_listeners(self) -> None:
        """Detach coordinator listeners."""
        for remove_listener in self._remove_listeners:
            remove_listener()
        self._remove_listeners.clear()

    @callback
    def refresh_coordinators(self, unloading_entry_id: str | None = None) -> None:
        """Refresh coordinator listeners after account entries change."""
        self._unloading_entry_id = unloading_entry_id
        try:
            self._clear_coordinator_listeners()
            for coordinator in self._coordinators:
                self._remove_listeners.append(
                    coordinator.async_add_listener(self.async_write_ha_state)
                )

            if self.platform is not None:
                self.async_write_ha_state()
        finally:
            self._unloading_entry_id = None

    @property
    def _configured_source_ids(self) -> list[str]:
        """Return mutable source selection, falling back to initial entry data."""
        return list(
            self._combined_entry.options.get(
                CONF_SOURCE_ENTRY_IDS,
                self._combined_entry.data.get(CONF_SOURCE_ENTRY_IDS, []),
            )
        )

    @property
    def _configured_currency(self) -> str | None:
        """Return the stable currency saved with the source selection."""
        return self._combined_entry.options.get(
            CONF_CURRENCY,
            self._combined_entry.data.get(CONF_CURRENCY),
        )

    @property
    def _account_sources(
        self,
    ) -> dict[str, tuple[ParqetConfigEntry, ParqetAccountRuntime]]:
        """Return loaded account entries; the Combined entry is never a source."""
        sources: dict[str, tuple[ParqetConfigEntry, ParqetAccountRuntime]] = {}
        configured_source_ids = set(self._configured_source_ids)
        for entry in self._hass.config_entries.async_entries(DOMAIN):
            if entry.entry_id not in configured_source_ids:
                continue
            if entry.entry_id == self._unloading_entry_id:
                continue
            if entry.state is not ConfigEntryState.LOADED:
                continue
            runtime = getattr(entry, "runtime_data", None)
            if isinstance(runtime, ParqetAccountRuntime):
                sources[entry.entry_id] = (entry, runtime)
        return sources

    @property
    def _coordinators(self) -> list[ParqetDataUpdateCoordinator]:
        """Return coordinators only when at least two accounts are loaded."""
        sources = self._account_sources
        configured_source_ids = set(self._configured_source_ids)
        if len(configured_source_ids) < 2 or len(sources) != len(
            configured_source_ids
        ):
            return []
        return [
            coordinator
            for _entry, runtime in sources.values()
            for coordinator in runtime.coordinators.values()
        ]

    @property
    def _common_currency(self) -> str | None:
        """Return the real shared source currency, or None on missing/mixed data."""
        expected_currency = self._configured_currency
        configured_source_ids = set(self._configured_source_ids)
        sources = self._account_sources
        if (
            not expected_currency
            or len(configured_source_ids) < 2
            or len(sources) != len(configured_source_ids)
        ):
            return None

        currencies: set[str] = set()
        for entry, runtime in sources.values():
            portfolio_meta: dict[str, dict[str, str]] = entry.data.get(
                CONF_PORTFOLIO_META, {}
            )
            for portfolio_id in runtime.coordinators:
                currency = portfolio_meta.get(portfolio_id, {}).get("currency")
                if not currency:
                    return None
                currencies.add(currency)
        return expected_currency if currencies == {expected_currency} else None

    @property
    def _datasets(self) -> list[dict[str, Any]]:
        """Return data payloads from every loaded source coordinator."""
        return [
            coordinator.data
            for coordinator in self._coordinators
            if coordinator.data is not None
        ]

    @property
    def available(self) -> bool:
        """Expose combined values only for complete same-currency sources."""
        coordinators = self._coordinators
        return (
            self._common_currency is not None
            and bool(coordinators)
            and len(self._datasets) == len(coordinators)
            and all(
                getattr(coordinator, "last_update_success", True)
                for coordinator in coordinators
            )
        )

    @property
    def native_unit_of_measurement(self) -> str | None:
        """Use source portfolio metadata instead of a hardcoded currency."""
        if self.entity_description.is_monetary:
            return self._configured_currency
        return self.entity_description.native_unit_of_measurement

    @property
    def native_value(self) -> float | int | None:
        """Return the combined sensor value only when sources are compatible."""
        if not self.available:
            return None
        return _aggregate_value(self._datasets, self.entity_description)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return metadata for aggregate sensors."""
        datasets = self._datasets
        if not datasets:
            return None

        attrs: dict[str, Any] = {
            "entry_id": self._combined_entry.entry_id,
            "portfolio_id": AGGREGATE_DEVICE_ID,
            "portfolio_count": len(datasets),
            "source_entry_ids": self._configured_source_ids,
            "loaded_source_entry_ids": list(self._account_sources),
            "currency": self._common_currency,
        }
        if self.entity_description.key == "total_value":
            active = [
                holding for data in datasets for holding in _active_holdings(data)
            ]
            attrs["top_holdings"] = _top_holdings(active)
            attrs["holdings_count"] = len(active)
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

        if description.is_monetary:
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

        active = _active_holdings(self.coordinator.data)
        return {
            "entry_id": self._entry_id,
            "portfolio_id": self._portfolio_id,
            "holdings_count": len(active),
            "top_holdings": _top_holdings(active),
            "interval": self.coordinator.interval,
        }
