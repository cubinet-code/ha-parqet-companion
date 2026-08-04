"""Tests for Parqet sensor entities."""

from __future__ import annotations

from copy import deepcopy
from unittest.mock import MagicMock

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet import ParqetAccountRuntime
from custom_components.parqet.const import (
    CONF_CURRENCY,
    CONF_ENTRY_TYPE,
    CONF_PORTFOLIO_META,
    CONF_SOURCE_ENTRY_IDS,
    DOMAIN,
    ENTRY_TYPE_COMBINED,
)
from custom_components.parqet.sensor import (
    AGGREGATE_SENSORS,
    ALL_SENSORS,
    ParqetAggregateSensor,
    _active_holdings,
    _aggregate_value,
    _resolve_path,
    _top_holdings,
)

from .conftest import MOCK_CURRENCY, MOCK_PERFORMANCE


def _account_source(
    hass: HomeAssistant,
    *,
    title: str,
    portfolio_id: str,
    currency: str,
    total_value: float,
) -> MockConfigEntry:
    """Add an account source with a real account runtime and coordinator data."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title=title,
        unique_id=f"user_{portfolio_id}",
        data={
            CONF_PORTFOLIO_META: {
                portfolio_id: {"name": title, "currency": currency}
            }
        },
        version=2,
        minor_version=1,
    )
    entry.add_to_hass(hass)
    payload = deepcopy(MOCK_PERFORMANCE)
    payload["performance"]["valuation"]["atIntervalEnd"] = total_value
    coordinator = MagicMock()
    coordinator.data = payload
    coordinator.last_update_success = True
    coordinator.portfolio_id = portfolio_id
    entry.runtime_data = ParqetAccountRuntime(
        api=MagicMock(), coordinators={portfolio_id: coordinator}
    )
    return entry


def _combined_entry(
    hass: HomeAssistant,
    source_ids: list[str],
    currency: str,
) -> MockConfigEntry:
    """Add a Combined config entry selecting explicit account sources."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Parqet Combined",
        unique_id="combined_accounts",
        data={
            CONF_ENTRY_TYPE: ENTRY_TYPE_COMBINED,
            CONF_SOURCE_ENTRY_IDS: source_ids,
            CONF_CURRENCY: currency,
        },
        version=2,
        minor_version=1,
    )
    entry.add_to_hass(hass)
    return entry


class TestResolvePath:
    """Test the dot-path resolver used by all sensors."""

    def test_total_value(self) -> None:
        """Test extracting total portfolio value."""
        value = _resolve_path(MOCK_PERFORMANCE, "performance.valuation.atIntervalEnd")
        assert value == 3047017.45

    def test_xirr_not_multiplied(self) -> None:
        """Test XIRR is returned as-is (API already returns percentage)."""
        value = _resolve_path(MOCK_PERFORMANCE, "performance.kpis.inInterval.xirr")
        assert value == 5.05

    def test_ttwror(self) -> None:
        """Test TTWROR extraction."""
        value = _resolve_path(MOCK_PERFORMANCE, "performance.kpis.inInterval.ttwror")
        assert value == 20.40

    def test_unrealized_gain(self) -> None:
        """Test extracting unrealized gain."""
        value = _resolve_path(
            MOCK_PERFORMANCE, "performance.unrealizedGains.inInterval.gainGross"
        )
        assert value == 138540.77

    def test_unrealized_gain_net(self) -> None:
        """Test extracting unrealized gain (net)."""
        value = _resolve_path(
            MOCK_PERFORMANCE, "performance.unrealizedGains.inInterval.gainNet"
        )
        assert value == 130000.00

    def test_realized_gain(self) -> None:
        """Test extracting realized gain."""
        value = _resolve_path(
            MOCK_PERFORMANCE, "performance.realizedGains.inInterval.gainGross"
        )
        assert value == 264456.98

    def test_dividends(self) -> None:
        """Test extracting dividends."""
        value = _resolve_path(
            MOCK_PERFORMANCE, "performance.dividends.inInterval.gainGross"
        )
        assert value == 6572.26

    def test_fees(self) -> None:
        """Test extracting fees."""
        value = _resolve_path(MOCK_PERFORMANCE, "performance.fees.inInterval.fees")
        assert value == 31118.37

    def test_taxes(self) -> None:
        """Test extracting taxes."""
        value = _resolve_path(MOCK_PERFORMANCE, "performance.taxes.inInterval.taxes")
        assert value == 19220.49

    def test_valuation_start(self) -> None:
        """Test extracting valuation at interval start."""
        value = _resolve_path(
            MOCK_PERFORMANCE, "performance.valuation.atIntervalStart"
        )
        assert value == 2900000.00

    def test_null_kpis(self) -> None:
        """Test that null kpis returns None."""
        data = {"performance": {"kpis": None}}
        assert _resolve_path(data, "performance.kpis.inInterval.xirr") is None

    def test_null_dividends(self) -> None:
        """Test that null dividends returns None."""
        data = {"performance": {"dividends": None}}
        assert (
            _resolve_path(data, "performance.dividends.inInterval.gainGross") is None
        )

    def test_missing_performance(self) -> None:
        """Test that missing performance key returns None."""
        assert _resolve_path({}, "performance.valuation.atIntervalEnd") is None

    def test_empty_path(self) -> None:
        """Test direct key access."""
        data = {"foo": 42}
        assert _resolve_path(data, "foo") == 42


class TestAggregateSensors:
    """Test additive aggregate sensor helpers."""

    def _description(self, key: str):
        return next(description for description in AGGREGATE_SENSORS if description.key == key)

    def test_total_value_sums_all_payloads(self) -> None:
        """Test total value aggregation across loaded portfolios."""
        assert _aggregate_value(
            [MOCK_PERFORMANCE, MOCK_PERFORMANCE], self._description("total_value")
        ) == 6094034.9

    def test_percentages_are_not_aggregate_sensors(self) -> None:
        """Test non-additive percentage KPIs are excluded from combined sensors."""
        keys = {description.key for description in AGGREGATE_SENSORS}
        assert "xirr" not in keys
        assert "ttwror" not in keys
        assert "unrealized_return_gross" not in keys

    def test_holdings_count_sums_active_holdings(self) -> None:
        """Test holdings count aggregation uses each payload's active holdings."""
        assert _aggregate_value(
            [MOCK_PERFORMANCE, MOCK_PERFORMANCE], self._description("holdings_count")
        ) == 4

    def test_holdings_count_excludes_sold_holdings(self) -> None:
        """Sold positions must not inflate the active holdings count."""
        payload = deepcopy(MOCK_PERFORMANCE)
        sold = deepcopy(payload["holdings"][0])
        sold["id"] = "sold_holding"
        sold["position"]["isSold"] = True
        payload["holdings"].append(sold)

        assert _aggregate_value(
            [payload], self._description("holdings_count")
        ) == 2

    def test_combined_top_holdings_recomputes_weights(self) -> None:
        """Test combined top holdings are sorted and weighted against combined total."""
        top = _top_holdings(
            [
                holding
                for data in (MOCK_PERFORMANCE, MOCK_PERFORMANCE)
                for holding in _active_holdings(data)
            ]
        )
        assert top[0] == {"name": "Test Stock", "value": 5500.0, "weight": 25.0}
        assert len(top) == 4

    def test_aggregate_sensor_does_not_poll(
        self,
        hass: HomeAssistant,
    ) -> None:
        """Coordinator listeners are the only aggregate update mechanism."""
        combined = _combined_entry(hass, [], "EUR")
        sensor = ParqetAggregateSensor(
            hass, combined, self._description("total_value")
        )

        assert sensor.should_poll is False

    def test_combined_uses_only_selected_sources_and_fixed_currency(
        self,
        hass: HomeAssistant,
    ) -> None:
        """An unrelated later account must not silently change Combined totals."""
        first = _account_source(
            hass,
            title="First",
            portfolio_id="p1",
            currency="USD",
            total_value=100,
        )
        second = _account_source(
            hass,
            title="Second",
            portfolio_id="p2",
            currency="USD",
            total_value=200,
        )
        unrelated = _account_source(
            hass,
            title="Unrelated",
            portfolio_id="p3",
            currency="USD",
            total_value=999,
        )
        combined = _combined_entry(
            hass, [first.entry_id, second.entry_id], "USD"
        )
        sensor = ParqetAggregateSensor(
            hass, combined, self._description("total_value")
        )

        first.mock_state(hass, ConfigEntryState.LOADED)
        second.mock_state(hass, ConfigEntryState.LOADED)
        unrelated.mock_state(hass, ConfigEntryState.LOADED)
        combined.mock_state(hass, ConfigEntryState.LOADED)
        assert sensor.available
        assert sensor.native_unit_of_measurement == "USD"
        assert sensor.native_value == 300
        assert sensor.extra_state_attributes["source_entry_ids"] == [
            first.entry_id,
            second.entry_id,
        ]

    def test_combined_is_unavailable_when_selected_source_is_unloaded(
        self,
        hass: HomeAssistant,
    ) -> None:
        """Combined must fail closed instead of publishing a partial total."""
        first = _account_source(
            hass,
            title="First",
            portfolio_id="p1",
            currency="EUR",
            total_value=100,
        )
        second = _account_source(
            hass,
            title="Second",
            portfolio_id="p2",
            currency="EUR",
            total_value=200,
        )
        combined = _combined_entry(
            hass, [first.entry_id, second.entry_id], "EUR"
        )
        sensor = ParqetAggregateSensor(
            hass, combined, self._description("total_value")
        )

        first.mock_state(hass, ConfigEntryState.LOADED)
        assert not sensor.available
        assert sensor.native_value is None

    def test_combined_excludes_the_entry_that_is_unloading(
        self,
        hass: HomeAssistant,
    ) -> None:
        """HA still reports a source as LOADED while its unload runs."""
        first = _account_source(
            hass, title="First", portfolio_id="p1", currency="EUR", total_value=100
        )
        second = _account_source(
            hass, title="Second", portfolio_id="p2", currency="EUR", total_value=200
        )
        combined = _combined_entry(
            hass, [first.entry_id, second.entry_id], "EUR"
        )
        sensor = ParqetAggregateSensor(
            hass, combined, self._description("total_value")
        )
        first.mock_state(hass, ConfigEntryState.LOADED)
        second.mock_state(hass, ConfigEntryState.LOADED)
        assert sensor.available

        written: list[bool] = []
        sensor.platform = MagicMock()
        sensor.async_write_ha_state = lambda: written.append(sensor.available)

        sensor.refresh_coordinators(second.entry_id)

        # The state written during the unload must already be unavailable, even
        # though HA has not flipped the source entry to NOT_LOADED yet.
        assert written == [False]
        assert second.state is ConfigEntryState.LOADED

    def test_combined_is_unavailable_after_source_currency_changes(
        self,
        hass: HomeAssistant,
    ) -> None:
        """A source currency mismatch must not contaminate long-term statistics."""
        first = _account_source(
            hass,
            title="First",
            portfolio_id="p1",
            currency="EUR",
            total_value=100,
        )
        second = _account_source(
            hass,
            title="Second",
            portfolio_id="p2",
            currency="CHF",
            total_value=200,
        )
        combined = _combined_entry(
            hass, [first.entry_id, second.entry_id], "EUR"
        )
        sensor = ParqetAggregateSensor(
            hass, combined, self._description("total_value")
        )

        first.mock_state(hass, ConfigEntryState.LOADED)
        second.mock_state(hass, ConfigEntryState.LOADED)
        assert sensor.native_unit_of_measurement == "EUR"
        assert not sensor.available
        assert sensor.native_value is None


class TestHistoryStatistics:
    """Guard the state classes that long-term statistics depend on (#8)."""

    def test_monetary_sensors_produce_min_mean_max_statistics(self) -> None:
        """Money sensors must stay MEASUREMENT so history has something to plot.

        device_class=MONETARY is deliberately not set: Home Assistant only
        allows state_class=TOTAL with it, and TOTAL compiles a "sum" statistic
        only. Portfolio figures are levels, not accumulating meter readings, so
        a sum is meaningless and no history chart can be drawn.
        """
        from homeassistant.components.sensor import SensorStateClass
        from homeassistant.components.sensor.recorder import DEFAULT_STATISTICS

        monetary = [d for d in ALL_SENSORS if d.is_monetary]
        assert monetary, "expected monetary sensor descriptions"

        for description in monetary:
            assert description.device_class is None, description.key
            assert description.state_class is SensorStateClass.MEASUREMENT, (
                description.key
            )
            statistics = DEFAULT_STATISTICS[description.state_class]
            statistic_types = getattr(statistics, "types", statistics)
            assert statistic_types == {"mean", "min", "max"}, description.key

    async def test_monetary_sensors_carry_portfolio_currency(
        self, hass: HomeAssistant, init_integration: MockConfigEntry
    ) -> None:
        """Dropping the device class must not lose the currency unit."""
        state = hass.states.get("sensor.test_portfolio_total_value")
        assert state is not None
        assert state.attributes["unit_of_measurement"] == MOCK_CURRENCY
        assert state.attributes["state_class"] == "measurement"
        assert "device_class" not in state.attributes
