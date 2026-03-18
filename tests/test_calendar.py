"""Tests for the Parqet calendar entity."""

from __future__ import annotations

from datetime import date, timedelta

from custom_components.parqet.calendar import (
    _activity_to_event,
    _resolve_asset_name,
)


class TestResolveAssetName:
    """Test the asset name resolution helper."""

    def test_holdings_map_priority(self) -> None:
        """Test holdings map takes priority over asset dict."""
        result = _resolve_asset_name(
            {"name": "From Asset"}, {"h1": "From Holdings"}, "h1"
        )
        assert result == "From Holdings"

    def test_fallback_to_asset_name(self) -> None:
        """Test fallback to asset name field."""
        result = _resolve_asset_name({"name": "AAPL"}, {}, None)
        assert result == "AAPL"

    def test_empty_asset_returns_unknown(self) -> None:
        """Test empty asset dict returns Unknown."""
        result = _resolve_asset_name({}, {}, None)
        assert result == "Unknown"

    def test_no_asset_returns_unknown(self) -> None:
        """Test None-like asset returns Unknown."""
        result = _resolve_asset_name(None, {}, None)
        assert result == "Unknown"

    def test_isin_identifier(self) -> None:
        """Test ISIN identifier type."""
        asset = {"assetIdentifierType": "isin", "isin": "US0378331005"}
        result = _resolve_asset_name(asset, {}, None)
        assert result == "US0378331005"

    def test_crypto_symbol(self) -> None:
        """Test crypto symbol identifier type."""
        asset = {"assetIdentifierType": "crypto_symbol", "symbol": "BTC"}
        result = _resolve_asset_name(asset, {}, None)
        assert result == "BTC"

    def test_custom_asset(self) -> None:
        """Test custom asset identifier type."""
        asset = {"assetIdentifierType": "custom_asset", "name": "My Gold"}
        result = _resolve_asset_name(asset, {}, None)
        assert result == "My Gold"

    def test_holding_id_not_in_map(self) -> None:
        """Test holding ID present but not in map falls through."""
        result = _resolve_asset_name({"name": "Fallback"}, {}, "unknown_id")
        assert result == "Fallback"


class TestActivityToEvent:
    """Test activity-to-CalendarEvent conversion."""

    def test_buy_event(self) -> None:
        """Test buy activity creates correct event."""
        activity = {
            "type": "buy",
            "asset": {"name": "Test Stock"},
            "amount": 500.0,
            "currency": "EUR",
            "shares": 10,
            "price": 50.0,
            "datetime": "2026-03-15T10:00:00Z",
            "tax": None,
            "fee": 1.50,
            "broker": "TR",
            "holdingId": None,
        }
        event = _activity_to_event(activity, {})

        assert event.summary == "Buy: Test Stock"
        assert event.start == date(2026, 3, 15)
        assert event.end == date(2026, 3, 16)
        assert "Amount: 500.00 EUR" in event.description
        assert "Shares: 10 @ 50.00 EUR" in event.description
        assert "Fee: 1.50 EUR" in event.description
        assert "Broker: TR" in event.description

    def test_dividend_event(self) -> None:
        """Test dividend activity creates correct event."""
        activity = {
            "type": "dividend",
            "asset": {"name": "Dividend Stock"},
            "amount": 25.0,
            "currency": "EUR",
            "shares": None,
            "price": None,
            "datetime": "2026-03-10T10:00:00Z",
            "tax": 6.25,
            "fee": None,
            "broker": None,
            "holdingId": None,
        }
        event = _activity_to_event(activity, {})

        assert event.summary == "Dividend: Dividend Stock"
        assert "Amount: 25.00 EUR" in event.description
        assert "Tax: 6.25 EUR" in event.description

    def test_invalid_datetime_uses_now(self) -> None:
        """Test invalid datetime falls back to current date."""
        activity = {
            "type": "buy",
            "asset": {"name": "Bad Date"},
            "amount": 100.0,
            "currency": "EUR",
            "shares": None,
            "price": None,
            "datetime": "invalid-date",
            "tax": None,
            "fee": None,
            "broker": None,
            "holdingId": None,
        }
        event = _activity_to_event(activity, {})
        # Should not raise, uses current date as fallback
        assert event.start is not None

    def test_all_day_event_end_is_exclusive(self) -> None:
        """Test end date is start + 1 day (iCalendar spec)."""
        activity = {
            "type": "sell",
            "asset": {"name": "Test"},
            "amount": 100.0,
            "currency": "EUR",
            "shares": None,
            "price": None,
            "datetime": "2026-06-15T14:30:00Z",
            "tax": None,
            "fee": None,
            "broker": None,
            "holdingId": None,
        }
        event = _activity_to_event(activity, {})
        assert event.end - event.start == timedelta(days=1)

    def test_unknown_activity_type(self) -> None:
        """Test unknown activity type is title-cased."""
        activity = {
            "type": "some_new_type",
            "asset": {"name": "Test"},
            "amount": 100.0,
            "currency": "EUR",
            "shares": None,
            "price": None,
            "datetime": "2026-03-15T10:00:00Z",
            "tax": None,
            "fee": None,
            "broker": None,
            "holdingId": None,
        }
        event = _activity_to_event(activity, {})
        assert event.summary == "Some New Type: Test"
