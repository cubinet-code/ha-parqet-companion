"""Tests for snapshot WebSocket API commands."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.core import HomeAssistant

from custom_components.parqet.const import DOMAIN
from custom_components.parqet.snapshot_ws import (
    _async_get_snapshot,
    _async_purge_snapshots,
    _async_take_snapshot,
)

MOCK_SNAPSHOT_DATA = {
    "snapshot_date": "2026-04-08",
    "holdings": [
        {
            "id": "h1",
            "name": "Test Stock",
            "logo": None,
            "shares": 100,
            "current_price": 55.0,
            "current_value": 5500.0,
            "snapshot_price": 50.0,
            "snapshot_value": 5000.0,
            "daily_pl": 500.0,
            "daily_pl_pct": 10.0,
            "weight": 100.0,
        }
    ],
    "total_value": 5500.0,
    "total_snapshot_value": 5000.0,
    "total_daily_pl": 500.0,
    "total_daily_pl_pct": 10.0,
}


def _make_hass_with_snapshot_manager(
    entry_id: str = "entry1",
    snapshot_data: dict | None = None,
) -> HomeAssistant:
    """Create a mock hass with snapshot manager in hass.data."""
    hass = MagicMock(spec=HomeAssistant)

    mgr = MagicMock()
    mgr.get_snapshot_data.return_value = snapshot_data or MOCK_SNAPSHOT_DATA
    mgr.async_take_snapshot = AsyncMock(return_value={"holdings": {}, "total_value": 0})
    mgr.async_purge = AsyncMock()

    # Mock config entry
    entry = MagicMock()
    entry.domain = DOMAIN
    hass.config_entries.async_get_entry.return_value = entry

    hass.data = {DOMAIN: {entry_id: {"snapshot_manager": mgr}}}
    return hass, mgr


def _make_connection() -> MagicMock:
    return MagicMock()


class TestWsGetSnapshot:
    """Test parqet/get_snapshot WS command."""

    @pytest.mark.asyncio
    async def test_returns_snapshot_data(self) -> None:
        hass, mgr = _make_hass_with_snapshot_manager()
        connection = _make_connection()
        msg = {"id": 1, "type": "parqet/get_snapshot", "entry_id": "entry1"}

        # Mock the coordinator refresh (entry.runtime_data)
        entry = hass.config_entries.async_get_entry.return_value
        entry.runtime_data = MagicMock()
        entry.runtime_data.last_update_success_time = None
        entry.runtime_data.async_request_refresh = AsyncMock()

        await _async_get_snapshot(hass, connection, msg)

        mgr.get_snapshot_data.assert_called_once()
        connection.send_result.assert_called_once_with(1, MOCK_SNAPSHOT_DATA)

    @pytest.mark.asyncio
    async def test_error_when_snapshots_not_enabled(self) -> None:
        hass = MagicMock(spec=HomeAssistant)
        entry = MagicMock()
        entry.domain = DOMAIN
        hass.config_entries.async_get_entry.return_value = entry
        hass.data = {}  # No snapshot manager registered

        connection = _make_connection()
        msg = {"id": 1, "type": "parqet/get_snapshot", "entry_id": "entry1"}

        await _async_get_snapshot(hass, connection, msg)

        connection.send_error.assert_called_once()
        args = connection.send_error.call_args[0]
        assert args[0] == 1
        assert "not_enabled" in args[1]

    @pytest.mark.asyncio
    async def test_error_when_invalid_entry(self) -> None:
        hass = MagicMock(spec=HomeAssistant)
        hass.config_entries.async_get_entry.return_value = None
        hass.data = {}

        connection = _make_connection()
        msg = {"id": 1, "type": "parqet/get_snapshot", "entry_id": "bogus"}

        await _async_get_snapshot(hass, connection, msg)

        connection.send_error.assert_called_once()


class TestWsTakeSnapshot:
    """Test parqet/take_snapshot WS command."""

    @pytest.mark.asyncio
    async def test_triggers_snapshot(self) -> None:
        hass, mgr = _make_hass_with_snapshot_manager()
        connection = _make_connection()
        msg = {"id": 2, "type": "parqet/take_snapshot", "entry_id": "entry1"}

        await _async_take_snapshot(hass, connection, msg)

        mgr.async_take_snapshot.assert_called_once()
        connection.send_result.assert_called_once()


class TestWsPurgeSnapshots:
    """Test parqet/purge_snapshots WS command."""

    @pytest.mark.asyncio
    async def test_purges_snapshots(self) -> None:
        hass, mgr = _make_hass_with_snapshot_manager()
        connection = _make_connection()
        msg = {"id": 3, "type": "parqet/purge_snapshots", "entry_id": "entry1"}

        await _async_purge_snapshots(hass, connection, msg)

        mgr.async_purge.assert_called_once()
        connection.send_result.assert_called_once()
