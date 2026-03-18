"""Tests for Parqet sensor entities."""

from __future__ import annotations

from custom_components.parqet.sensor import _resolve_path

from .conftest import MOCK_PERFORMANCE


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
