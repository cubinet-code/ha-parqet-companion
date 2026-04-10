"""Tests for the SnapshotManager."""

from __future__ import annotations

from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.parqet.snapshot import SnapshotManager

MOCK_HOLDINGS = [
    {
        "id": "holding_1",
        "asset": {"name": "Test Stock", "type": "security"},
        "position": {
            "shares": 100,
            "currentPrice": 55.0,
            "currentValue": 5500.0,
            "isSold": False,
        },
        "logo": None,
        "nickname": None,
    },
    {
        "id": "holding_2",
        "asset": {"name": "Test ETF", "type": "security"},
        "position": {
            "shares": 50,
            "currentPrice": 110.0,
            "currentValue": 5500.0,
            "isSold": False,
        },
        "logo": None,
        "nickname": None,
    },
]

MOCK_COORDINATOR_DATA = {
    "holdings": MOCK_HOLDINGS,
}


def _make_coordinator(data: dict | None = None) -> MagicMock:
    coordinator = MagicMock()
    coordinator.data = data if data is not None else MOCK_COORDINATOR_DATA
    return coordinator


def _make_hass() -> MagicMock:
    hass = MagicMock()
    hass.config.time_zone = "Europe/Berlin"
    return hass


class TestTakeSnapshot:
    """Test async_take_snapshot captures and persists holdings data."""

    @pytest.mark.asyncio
    async def test_captures_holdings_from_coordinator(self) -> None:
        hass = _make_hass()
        coordinator = _make_coordinator()
        mgr = SnapshotManager(hass, coordinator, "entry1", 22, 0)
        mgr._store = AsyncMock()
        mgr._data = {"snapshots": {}}

        snapshot = await mgr.async_take_snapshot()

        assert "holding_1" in snapshot["holdings"]
        assert snapshot["holdings"]["holding_1"]["price"] == 55.0
        assert snapshot["holdings"]["holding_1"]["value"] == 5500.0
        assert snapshot["holdings"]["holding_1"]["shares"] == 100
        assert snapshot["holdings"]["holding_1"]["name"] == "Test Stock"

    @pytest.mark.asyncio
    async def test_persists_to_store(self) -> None:
        hass = _make_hass()
        coordinator = _make_coordinator()
        mgr = SnapshotManager(hass, coordinator, "entry1", 22, 0)
        mgr._store = AsyncMock()
        mgr._data = {"snapshots": {}}

        await mgr.async_take_snapshot()

        mgr._store.async_save.assert_called_once()
        saved_data = mgr._store.async_save.call_args[0][0]
        today = date.today().isoformat()
        assert today in saved_data["snapshots"]

    @pytest.mark.asyncio
    async def test_records_total_value(self) -> None:
        hass = _make_hass()
        coordinator = _make_coordinator()
        mgr = SnapshotManager(hass, coordinator, "entry1", 22, 0)
        mgr._store = AsyncMock()
        mgr._data = {"snapshots": {}}

        snapshot = await mgr.async_take_snapshot()

        assert snapshot["total_value"] == 11000.0  # 5500 + 5500

    @pytest.mark.asyncio
    async def test_skips_sold_holdings(self) -> None:
        holdings = [
            {
                "id": "h1",
                "asset": {"name": "Active", "type": "security"},
                "position": {"shares": 10, "currentPrice": 50.0, "currentValue": 500.0, "isSold": False},
                "logo": None, "nickname": None,
            },
            {
                "id": "h2",
                "asset": {"name": "Sold", "type": "security"},
                "position": {"shares": 0, "currentPrice": 0, "currentValue": 0, "isSold": True},
                "logo": None, "nickname": None,
            },
        ]
        coordinator = _make_coordinator({"holdings": holdings})
        mgr = SnapshotManager(_make_hass(), coordinator, "entry1", 22, 0)
        mgr._store = AsyncMock()
        mgr._data = {"snapshots": {}}

        snapshot = await mgr.async_take_snapshot()

        assert "h1" in snapshot["holdings"]
        assert "h2" not in snapshot["holdings"]

    @pytest.mark.asyncio
    async def test_skips_when_no_coordinator_data(self) -> None:
        coordinator = MagicMock()
        coordinator.data = None
        mgr = SnapshotManager(_make_hass(), coordinator, "entry1", 22, 0)
        mgr._store = AsyncMock()
        mgr._data = {"snapshots": {}}

        snapshot = await mgr.async_take_snapshot()

        assert snapshot is None
        mgr._store.async_save.assert_not_called()


class TestPruning:
    """Test that old snapshots are pruned."""

    @pytest.mark.asyncio
    async def test_prunes_old_snapshots(self) -> None:
        hass = _make_hass()
        coordinator = _make_coordinator()
        mgr = SnapshotManager(hass, coordinator, "entry1", 22, 0)
        mgr._store = AsyncMock()

        # Pre-populate with 10 days of snapshots
        mgr._data = {
            "snapshots": {
                f"2026-03-{i:02d}": {
                    "taken_at": f"2026-03-{i:02d}T22:00:00+02:00",
                    "holdings": {},
                    "total_value": 1000.0,
                }
                for i in range(1, 11)  # March 1-10
            }
        }

        with patch("custom_components.parqet.snapshot.date") as mock_date:
            mock_date.today.return_value = date(2026, 3, 10)
            mock_date.fromisoformat = date.fromisoformat
            await mgr.async_take_snapshot()

        # 7-day retention: only March 4-10 + today should remain
        remaining = set(mgr._data["snapshots"].keys())
        assert "2026-03-01" not in remaining
        assert "2026-03-02" not in remaining
        assert "2026-03-03" not in remaining
        assert "2026-03-10" in remaining


class TestGetSnapshotData:
    """Test get_snapshot_data computes daily P&L correctly."""

    def test_computes_daily_pl(self) -> None:
        yesterday = (date.today().isoformat()
                     if False else "2026-04-08")
        today_str = "2026-04-09"
        coordinator = _make_coordinator()
        mgr = SnapshotManager(_make_hass(), coordinator, "entry1", 22, 0)
        mgr._data = {
            "snapshots": {
                yesterday: {
                    "taken_at": f"{yesterday}T22:00:00+02:00",
                    "holdings": {
                        "holding_1": {"price": 50.0, "value": 5000.0, "shares": 100, "name": "Test Stock"},
                        "holding_2": {"price": 100.0, "value": 5000.0, "shares": 50, "name": "Test ETF"},
                    },
                    "total_value": 10000.0,
                }
            }
        }

        with patch("custom_components.parqet.snapshot.date") as mock_date:
            mock_date.today.return_value = date(2026, 4, 9)
            mock_date.fromisoformat = date.fromisoformat
            result = mgr.get_snapshot_data()

        assert result["snapshot_date"] == yesterday
        assert result["total_value"] == 11000.0
        assert result["total_snapshot_value"] == 10000.0
        assert result["total_daily_pl"] == 1000.0

        h1 = next(h for h in result["holdings"] if h["id"] == "holding_1")
        assert h1["current_value"] == 5500.0
        assert h1["snapshot_value"] == 5000.0
        assert h1["daily_pl"] == 500.0
        assert h1["daily_pl_pct"] == pytest.approx(10.0)

    def test_returns_null_when_no_previous_snapshot(self) -> None:
        coordinator = _make_coordinator()
        mgr = SnapshotManager(_make_hass(), coordinator, "entry1", 22, 0)
        mgr._data = {"snapshots": {}}

        result = mgr.get_snapshot_data()

        assert result["snapshot_date"] is None
        assert result["total_daily_pl"] is None
        for h in result["holdings"]:
            assert h["daily_pl"] is None

    def test_excludes_holdings_not_in_snapshot(self) -> None:
        """New holdings (not in previous snapshot) should have null P&L."""
        coordinator = _make_coordinator()
        mgr = SnapshotManager(_make_hass(), coordinator, "entry1", 22, 0)
        mgr._data = {
            "snapshots": {
                "2026-04-08": {
                    "taken_at": "2026-04-08T22:00:00+02:00",
                    "holdings": {
                        "holding_1": {"price": 50.0, "value": 5000.0, "shares": 100, "name": "Test Stock"},
                        # holding_2 not present — new addition
                    },
                    "total_value": 5000.0,
                }
            }
        }

        with patch("custom_components.parqet.snapshot.date") as mock_date:
            mock_date.today.return_value = date(2026, 4, 9)
            mock_date.fromisoformat = date.fromisoformat
            result = mgr.get_snapshot_data()

        h1 = next(h for h in result["holdings"] if h["id"] == "holding_1")
        h2 = next(h for h in result["holdings"] if h["id"] == "holding_2")
        assert h1["daily_pl"] == 500.0
        assert h2["daily_pl"] is None

    def test_new_holdings_dont_inflate_total_pl(self) -> None:
        """Total daily P&L should only count holdings with a snapshot baseline."""
        coordinator = _make_coordinator()
        mgr = SnapshotManager(_make_hass(), coordinator, "entry1", 22, 0)
        mgr._data = {
            "snapshots": {
                "2026-04-08": {
                    "taken_at": "2026-04-08T22:00:00+02:00",
                    "holdings": {
                        # Only holding_1 existed yesterday at 5000
                        "holding_1": {"price": 50.0, "value": 5000.0, "shares": 100, "name": "Test Stock"},
                    },
                    "total_value": 5000.0,
                }
            }
        }

        with patch("custom_components.parqet.snapshot.date") as mock_date:
            mock_date.today.return_value = date(2026, 4, 9)
            mock_date.fromisoformat = date.fromisoformat
            result = mgr.get_snapshot_data()

        # holding_1: 5500 - 5000 = 500 P&L
        # holding_2: new, no baseline — excluded from total P&L
        assert result["total_daily_pl"] == 500.0
        # total_value includes both holdings
        assert result["total_value"] == 11000.0


class TestPurge:
    """Test purging all snapshots."""

    @pytest.mark.asyncio
    async def test_purge_clears_all_snapshots(self) -> None:
        mgr = SnapshotManager(_make_hass(), _make_coordinator(), "entry1", 22, 0)
        mgr._store = AsyncMock()
        mgr._data = {
            "snapshots": {
                "2026-04-08": {"holdings": {}, "total_value": 0},
                "2026-04-09": {"holdings": {}, "total_value": 0},
            }
        }

        await mgr.async_purge()

        assert mgr._data["snapshots"] == {}
        mgr._store.async_save.assert_called_once()
