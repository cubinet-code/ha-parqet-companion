"""Daily snapshot manager for per-holding P&L."""

from __future__ import annotations

import logging
from datetime import UTC, date, datetime
from typing import Any

from homeassistant.core import CALLBACK_TYPE, HomeAssistant
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import SNAPSHOT_RETENTION_DAYS
from .coordinator import ParqetDataUpdateCoordinator

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1


class SnapshotManager:
    """Manages daily price snapshots for per-holding P&L computation."""

    def __init__(
        self,
        hass: HomeAssistant,
        coordinator: ParqetDataUpdateCoordinator,
        entry_id: str,
        snapshot_hour: int,
        snapshot_minute: int,
    ) -> None:
        self._hass = hass
        self._coordinator = coordinator
        self._entry_id = entry_id
        self._hour = snapshot_hour
        self._minute = snapshot_minute
        self._store = Store[dict[str, Any]](
            hass, STORAGE_VERSION, f"parqet_snapshots_{entry_id}"
        )
        self._data: dict[str, Any] = {"snapshots": {}}
        self._unsub: CALLBACK_TYPE | None = None

    async def async_setup(self) -> None:
        """Load stored snapshots and register the daily time listener."""
        _LOGGER.debug(
            "Setting up snapshot manager for %s (time=%02d:%02d)",
            self._entry_id, self._hour, self._minute,
        )
        stored = await self._store.async_load()
        if stored:
            self._data = stored
            _LOGGER.debug(
                "Loaded %d stored snapshots: %s",
                len(self._data["snapshots"]),
                list(self._data["snapshots"].keys()),
            )
        else:
            _LOGGER.debug("No stored snapshots found, starting fresh")

        # Only take snapshots when the daily timer fires — not on setup.
        # This ensures consistent point-in-time captures at the configured time.
        self._unsub = async_track_time_change(
            self._hass,
            self._on_time,
            hour=self._hour,
            minute=self._minute,
            second=0,
        )
        _LOGGER.debug("Daily snapshot timer registered for %02d:%02d", self._hour, self._minute)

    async def async_teardown(self) -> None:
        """Unsubscribe the time listener."""
        if self._unsub:
            self._unsub()
            self._unsub = None

    async def _on_time(self, _now: datetime) -> None:
        """Callback fired daily at the configured time."""
        _LOGGER.debug("Daily snapshot timer fired at %s", _now.isoformat())
        try:
            await self.async_take_snapshot()
        except Exception:
            _LOGGER.exception("Failed to take daily snapshot")

    async def async_take_snapshot(self) -> dict[str, Any] | None:
        """Fetch fresh data from the API and persist a snapshot."""
        # Use "1d" interval — position fields (currentPrice, currentValue, shares)
        # are interval-independent, so any interval works. "1d" is the lightest.
        _LOGGER.debug("Fetching fresh data for snapshot")
        try:
            data = await self._coordinator.api.async_get_performance(
                [self._coordinator.portfolio_id],
                "1d",
            )
        except Exception:
            _LOGGER.exception("Failed to fetch data for snapshot")
            return None

        if not data or "holdings" not in data:
            _LOGGER.warning("No holdings in API response for snapshot")
            return None

        today = dt_util.now().date()
        today_str = today.isoformat()

        holdings_snapshot: dict[str, dict[str, Any]] = {}
        for h in data["holdings"]:
            pos = h.get("position", {})
            if pos.get("isSold", False):
                continue
            holdings_snapshot[h["id"]] = {
                "price": pos.get("currentPrice", 0),
                "value": pos.get("currentValue", 0),
                "shares": pos.get("shares", 0),
                "name": h.get("asset", {}).get("name", "Unknown"),
            }

        total_value = sum(h["value"] for h in holdings_snapshot.values())

        snapshot = {
            "taken_at": datetime.now(tz=UTC).isoformat(),
            "holdings": holdings_snapshot,
            "total_value": total_value,
        }

        self._data["snapshots"][today_str] = snapshot

        self._prune_old_snapshots(today)
        await self._store.async_save(self._data)

        _LOGGER.debug("Snapshot taken for %s: %d holdings", today_str, len(holdings_snapshot))
        return snapshot

    def _prune_old_snapshots(self, today: date) -> None:
        """Remove snapshots older than the retention period."""
        cutoff = today.toordinal() - SNAPSHOT_RETENTION_DAYS
        to_remove = []
        for k in self._data["snapshots"]:
            try:
                if date.fromisoformat(k).toordinal() <= cutoff:
                    to_remove.append(k)
            except ValueError:
                to_remove.append(k)
        for k in to_remove:
            del self._data["snapshots"][k]

    def get_snapshot_data(self) -> dict[str, Any]:
        """Return current holdings with daily P&L computed from the most recent previous snapshot."""
        data = self._coordinator.data or {}
        current_holdings = data.get("holdings", [])

        today = dt_util.now().date().isoformat()
        prev_dates = sorted(
            (k for k in self._data["snapshots"] if k < today),
            reverse=True,
        )
        prev_snapshot = (
            self._data["snapshots"][prev_dates[0]] if prev_dates else None
        )
        prev_holdings = prev_snapshot["holdings"] if prev_snapshot else {}

        total_value_with_baseline = 0.0
        total_value = 0.0
        total_snapshot_value = 0.0
        has_previous = bool(prev_snapshot)
        result_holdings: list[dict[str, Any]] = []

        for h in current_holdings:
            pos = h.get("position", {})
            if pos.get("isSold", False):
                continue

            hid = h["id"]
            current_value = pos.get("currentValue", 0)
            current_price = pos.get("currentPrice", 0)
            shares = pos.get("shares", 0)
            total_value += current_value

            prev = prev_holdings.get(hid) if has_previous else None

            if prev is not None:
                snapshot_value = prev["value"]
                snapshot_price = prev["price"]
                daily_pl = current_value - snapshot_value
                daily_pl_pct = (
                    (daily_pl / snapshot_value * 100) if snapshot_value else 0
                )
                total_value_with_baseline += current_value
                total_snapshot_value += snapshot_value
            else:
                snapshot_value = None
                snapshot_price = None
                daily_pl = None
                daily_pl_pct = None

            result_holdings.append(
                {
                    "id": hid,
                    "name": h.get("nickname") or h.get("asset", {}).get("name", "Unknown"),
                    "logo": h.get("logo"),
                    "shares": shares,
                    "current_price": current_price,
                    "current_value": current_value,
                    "snapshot_price": snapshot_price,
                    "snapshot_value": snapshot_value,
                    "daily_pl": daily_pl,
                    "daily_pl_pct": daily_pl_pct,
                    "weight": 0,  # computed below
                }
            )

        # Compute weights based on total portfolio value (all holdings).
        for h in result_holdings:
            h["weight"] = (
                round(h["current_value"] / total_value * 100, 1)
                if total_value > 0
                else 0
            )

        # Total P&L only includes holdings that have a snapshot baseline.
        total_daily_pl = (
            (total_value_with_baseline - total_snapshot_value)
            if has_previous
            else None
        )
        total_daily_pl_pct = (
            (total_daily_pl / total_snapshot_value * 100)
            if has_previous and total_snapshot_value
            else None
        )

        return {
            "snapshot_date": prev_dates[0] if prev_dates else None,
            "snapshot_taken_at": prev_snapshot["taken_at"] if prev_snapshot else None,
            "holdings": result_holdings,
            "total_value": total_value,
            "total_snapshot_value": total_snapshot_value if has_previous else None,
            "total_daily_pl": total_daily_pl,
            "total_daily_pl_pct": total_daily_pl_pct,
        }

    async def async_purge(self) -> None:
        """Clear all stored snapshots."""
        self._data["snapshots"] = {}
        await self._store.async_save(self._data)
