"""Calendar platform for Parqet — exposes portfolio activities as events."""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from . import ParqetConfigEntry
from .api import ParqetApiError
from .coordinator import ParqetDataUpdateCoordinator
from .entity import ParqetEntity

_LOGGER = logging.getLogger(__name__)

PARALLEL_UPDATES = 0

ACTIVITY_LABELS: dict[str, str] = {
    "buy": "Buy",
    "sell": "Sell",
    "dividend": "Dividend",
    "interest": "Interest",
    "transfer_in": "Transfer In",
    "transfer_out": "Transfer Out",
    "fees_taxes": "Fees/Taxes",
    "deposit": "Deposit",
    "withdrawal": "Withdrawal",
}


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ParqetConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Parqet calendar entity from a config entry."""
    coordinator = entry.runtime_data
    async_add_entities([ParqetActivityCalendar(coordinator, entry)])


def _resolve_asset_name(
    asset: dict[str, Any], holdings_map: dict[str, str], holding_id: str | None
) -> str:
    """Resolve the best display name for an activity's asset."""
    # Try holdings lookup first (has the full name).
    if holding_id and holding_id in holdings_map:
        return holdings_map[holding_id]

    if not asset:
        return "Unknown"

    # Fall back to identifier from the asset discriminated union.
    id_type = asset.get("assetIdentifierType", "")
    if id_type == "isin":
        return asset.get("isin", "Unknown")
    if id_type == "crypto_symbol":
        return asset.get("symbol", "Unknown")
    if id_type == "custom_asset":
        return asset.get("name", "Custom Asset")
    if id_type == "real_estate":
        return asset.get("name", "Real Estate")
    if id_type == "commodity":
        return asset.get("name", "Commodity")
    if id_type == "cash":
        return asset.get("name", "Cash")

    # Last resort: any name-like field.
    return asset.get("name", asset.get("symbol", asset.get("isin", "Unknown")))


def _activity_to_event(
    activity: dict[str, Any], holdings_map: dict[str, str]
) -> CalendarEvent:
    """Convert a Parqet activity dict to a CalendarEvent."""
    act_type = activity.get("type", "unknown")
    label = ACTIVITY_LABELS.get(act_type, act_type.replace("_", " ").title())
    asset_name = _resolve_asset_name(
        activity.get("asset", {}), holdings_map, activity.get("holdingId")
    )
    amount = activity.get("amount")
    currency = activity.get("currency", "EUR")
    shares = activity.get("shares")
    price = activity.get("price")
    tax = activity.get("tax")
    fee = activity.get("fee")
    broker = activity.get("broker")

    summary = f"{label}: {asset_name}"

    # Build description with details.
    lines: list[str] = []
    if amount is not None:
        lines.append(f"Amount: {amount:.2f} {currency}")
    if shares is not None and price is not None:
        lines.append(f"Shares: {shares} @ {price:.2f} {currency}")
    if tax:
        lines.append(f"Tax: {tax:.2f} {currency}")
    if fee:
        lines.append(f"Fee: {fee:.2f} {currency}")
    if broker:
        lines.append(f"Broker: {broker}")
    description = "\n".join(lines)

    # Parse activity datetime.
    dt_str = activity.get("datetime", "")
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        dt = datetime.now(tz=UTC)

    # Calendar all-day events: end date is exclusive per iCalendar spec.
    event_date = dt.date()

    return CalendarEvent(
        summary=summary,
        start=event_date,
        end=event_date + timedelta(days=1),
        description=description,
    )


class ParqetActivityCalendar(ParqetEntity, CalendarEntity):
    """Calendar entity that exposes Parqet portfolio activities as events."""

    _attr_translation_key = "activities"

    def __init__(
        self,
        coordinator: ParqetDataUpdateCoordinator,
        entry: ParqetConfigEntry,
    ) -> None:
        """Initialize the calendar entity."""
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{self._portfolio_id}_activities"
        self._cached_events: list[CalendarEvent] = []

    @property
    def event(self) -> CalendarEvent | None:
        """Return the next upcoming or most recent activity as the current event."""
        if not self._cached_events:
            return None

        today = dt_util.now().date()
        # Find the next upcoming event (on or after today).
        for evt in self._cached_events:
            if evt.start >= today:
                return evt

        # No upcoming event — return the most recent past event.
        return self._cached_events[-1]

    def _build_holdings_map(self) -> dict[str, str]:
        """Build a holding_id → display_name map from coordinator data."""
        holdings = (self.coordinator.data or {}).get("holdings", [])
        result: dict[str, str] = {}
        for h in holdings:
            hid = h.get("id")
            if hid:
                name = h.get("nickname") or h.get("asset", {}).get("name", "Unknown")
                result[hid] = name
        return result

    async def async_get_events(
        self,
        hass: HomeAssistant,
        start_date: datetime,
        end_date: datetime,
    ) -> list[CalendarEvent]:
        """Fetch activities from the API for a date range."""
        try:
            data = await self.coordinator.api.async_get_activities(
                self._portfolio_id,
                limit=500,
            )
        except ParqetApiError:
            _LOGGER.exception("Failed to fetch activities for calendar")
            return []

        holdings_map = self._build_holdings_map()
        activities = data.get("activities", [])
        events: list[CalendarEvent] = []

        for activity in activities:
            dt_str = activity.get("datetime", "")
            try:
                dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                continue

            # Filter to requested date range (start inclusive, end exclusive).
            if dt.date() < start_date.date() or dt.date() >= end_date.date():
                continue

            events.append(_activity_to_event(activity, holdings_map))

        # Cache for the event property.
        self._cached_events = events

        return events
