"""Tests for the Parqet calendar entity."""

from __future__ import annotations

import asyncio
from datetime import UTC, date, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.parqet.api import ParqetApiError
from custom_components.parqet.calendar import (
    CALENDAR_ACTIVITY_CACHE_TTL,
    ParqetActivityCalendar,
    _activity_to_event,
    _resolve_asset_name,
)


def _calendar_with_api(api: AsyncMock) -> ParqetActivityCalendar:
    """Build a calendar entity around one mocked portfolio coordinator."""
    coordinator = MagicMock()
    coordinator.api = api
    coordinator.data = {"holdings": []}
    return ParqetActivityCalendar(
        coordinator,
        MagicMock(),
        portfolio_id="p1",
        portfolio_name="Portfolio One",
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


class TestCalendarActivityCache:
    """Calendar windows should reuse one cached raw activity response."""

    async def test_different_windows_share_cached_activities(self) -> None:
        """Range filtering stays local and does not refetch the same payload."""
        activities = [
            {
                "type": "buy",
                "asset": {"name": "March"},
                "datetime": "2026-03-10T10:00:00Z",
            },
            {
                "type": "sell",
                "asset": {"name": "April"},
                "datetime": "2026-04-10T10:00:00Z",
            },
        ]
        api = AsyncMock()
        api.async_get_activities.return_value = {"activities": activities}
        calendar = _calendar_with_api(api)

        march = await calendar.async_get_events(
            MagicMock(),
            datetime(2026, 3, 1, tzinfo=UTC),
            datetime(2026, 4, 1, tzinfo=UTC),
        )
        april = await calendar.async_get_events(
            MagicMock(),
            datetime(2026, 4, 1, tzinfo=UTC),
            datetime(2026, 5, 1, tzinfo=UTC),
        )

        assert [event.summary for event in march] == ["Buy: March"]
        assert [event.summary for event in april] == ["Sell: April"]
        api.async_get_activities.assert_awaited_once_with("p1", limit=500)

    async def test_concurrent_windows_share_one_activity_request(self) -> None:
        """Overlapping HA calendar polls await one upstream API task."""
        started = asyncio.Event()
        release = asyncio.Event()
        payload = {
            "activities": [
                {
                    "type": "dividend",
                    "asset": {"name": "Shared"},
                    "datetime": "2026-03-12T10:00:00Z",
                }
            ]
        }

        async def fetch(_portfolio_id: str, *, limit: int):
            started.set()
            await release.wait()
            return payload

        api = AsyncMock()
        api.async_get_activities.side_effect = fetch
        calendar = _calendar_with_api(api)
        start = datetime(2026, 3, 1, tzinfo=UTC)
        end = datetime(2026, 4, 1, tzinfo=UTC)

        first = asyncio.create_task(
            calendar.async_get_events(MagicMock(), start, end)
        )
        await started.wait()
        second = asyncio.create_task(
            calendar.async_get_events(MagicMock(), start, end)
        )
        await asyncio.sleep(0)
        release.set()

        first_events, second_events = await asyncio.gather(first, second)
        assert [event.summary for event in first_events] == ["Dividend: Shared"]
        assert [event.summary for event in second_events] == ["Dividend: Shared"]
        api.async_get_activities.assert_awaited_once_with("p1", limit=500)

    async def test_cancelled_window_does_not_cancel_shared_activity_request(
        self,
    ) -> None:
        """One cancelled calendar poll cannot abort another active poll."""
        started = asyncio.Event()
        release = asyncio.Event()
        payload = {
            "activities": [
                {
                    "type": "buy",
                    "asset": {"name": "Survivor"},
                    "datetime": "2026-03-20T10:00:00Z",
                }
            ]
        }

        async def fetch(_portfolio_id: str, *, limit: int):
            started.set()
            await release.wait()
            return payload

        api = AsyncMock()
        api.async_get_activities.side_effect = fetch
        calendar = _calendar_with_api(api)
        start = datetime(2026, 3, 1, tzinfo=UTC)
        end = datetime(2026, 4, 1, tzinfo=UTC)

        cancelled = asyncio.create_task(
            calendar.async_get_events(MagicMock(), start, end)
        )
        await started.wait()
        survivor = asyncio.create_task(
            calendar.async_get_events(MagicMock(), start, end)
        )
        await asyncio.sleep(0)

        cancelled.cancel()
        with pytest.raises(asyncio.CancelledError):
            await cancelled
        release.set()

        assert [event.summary for event in await survivor] == ["Buy: Survivor"]
        api.async_get_activities.assert_awaited_once_with("p1", limit=500)

    async def test_expired_cache_is_refetched(self) -> None:
        """A cache older than one hour triggers a fresh activities request."""
        api = AsyncMock()
        api.async_get_activities.return_value = {"activities": []}
        calendar = _calendar_with_api(api)
        start = datetime(2026, 3, 1, tzinfo=UTC)
        end = datetime(2026, 4, 1, tzinfo=UTC)

        await calendar.async_get_events(MagicMock(), start, end)
        assert calendar._activity_cache is not None
        stored_at, activities = calendar._activity_cache
        calendar._activity_cache = (
            stored_at - CALENDAR_ACTIVITY_CACHE_TTL - 1,
            activities,
        )
        await calendar.async_get_events(MagicMock(), start, end)

        assert api.async_get_activities.await_count == 2

    async def test_failed_request_is_not_cached(self) -> None:
        """A transient API failure leaves the next calendar poll retriable."""
        payload = {
            "activities": [
                {
                    "type": "sell",
                    "asset": {"name": "Retry"},
                    "datetime": "2026-03-22T10:00:00Z",
                }
            ]
        }
        api = AsyncMock()
        api.async_get_activities.side_effect = [ParqetApiError("boom"), payload]
        calendar = _calendar_with_api(api)
        start = datetime(2026, 3, 1, tzinfo=UTC)
        end = datetime(2026, 4, 1, tzinfo=UTC)

        assert await calendar.async_get_events(MagicMock(), start, end) == []
        await asyncio.sleep(0)
        events = await calendar.async_get_events(MagicMock(), start, end)

        assert [event.summary for event in events] == ["Sell: Retry"]
        assert api.async_get_activities.await_count == 2
