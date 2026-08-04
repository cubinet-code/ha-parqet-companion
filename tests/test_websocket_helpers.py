"""Tests for WebSocket helper aggregation paths."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet import ParqetAccountRuntime, ParqetCombinedRuntime
from custom_components.parqet.api import ParqetApiError
from custom_components.parqet.const import (
    CONF_CURRENCY,
    CONF_ENTRY_TYPE,
    CONF_PORTFOLIO_META,
    CONF_SOURCE_ENTRY_IDS,
    DOMAIN,
    ENTRY_TYPE_COMBINED,
)
from custom_components.parqet.snapshot_ws import combined_snapshot_data
from custom_components.parqet.websocket_api import (
    CombinedUnavailableError,
    _async_fetch_performance,
    _async_get_combined_performance,
    _async_get_performance,
    aggregate_performance_payloads,
)

from .conftest import MOCK_PORTFOLIO_ID


def _payload(total: float, unrealized: float, dividend: float, holding_value: float):
    return {
        "performance": {
            "kpis": {"inInterval": {"xirr": 12.3, "ttwror": 45.6}},
            "valuation": {"atIntervalStart": 0, "atIntervalEnd": total},
            "fees": {"inInterval": {"fees": 1}},
            "taxes": {"inInterval": {"taxes": 2}},
            "unrealizedGains": {
                "inInterval": {
                    "gainGross": unrealized,
                    "gainNet": unrealized - 1,
                    "returnGross": 10,
                    "returnNet": 9,
                }
            },
            "realizedGains": {
                "inInterval": {
                    "gainGross": 3,
                    "gainNet": 2,
                    "returnGross": 4,
                    "returnNet": 3,
                }
            },
            "dividends": {
                "inInterval": {
                    "gainGross": dividend,
                    "gainNet": dividend - 1,
                    "taxes": 1,
                    "fees": 0,
                }
            },
        },
        "holdings": [
            {
                "id": f"holding-{holding_value}",
                "asset": {"name": f"Stock {holding_value}", "type": "security"},
                "logo": None,
                "position": {
                    "shares": 1,
                    "currentPrice": holding_value,
                    "currentValue": holding_value,
                    "isSold": False,
                },
            }
        ],
    }


def test_aggregate_performance_payloads_sums_additive_values_only() -> None:
    """Combined performance sums money values but omits non-additive KPIs."""
    result = aggregate_performance_payloads([
        _payload(total=100, unrealized=10, dividend=5, holding_value=60),
        _payload(total=200, unrealized=20, dividend=7, holding_value=80),
    ])

    performance = result["performance"]
    assert performance["valuation"]["atIntervalEnd"] == 300
    assert performance["unrealizedGains"]["inInterval"]["gainGross"] == 30
    assert performance["dividends"]["inInterval"]["gainGross"] == 12
    assert performance["fees"]["inInterval"]["fees"] == 2
    assert performance["taxes"]["inInterval"]["taxes"] == 4
    assert "kpis" not in performance
    assert len(result["holdings"]) == 2


def test_combined_snapshot_data_uses_selected_coordinator_holdings() -> None:
    """Combined snapshot uses only its selected loaded same-currency sources."""
    entry1 = SimpleNamespace(
        entry_id="entry1",
        domain=DOMAIN,
        state=ConfigEntryState.LOADED,
        data={CONF_PORTFOLIO_META: {"p1": {"currency": "EUR"}}},
        runtime_data=SimpleNamespace(
            api=object(),
            coordinators={"p1": SimpleNamespace(data=_payload(100, 10, 5, 60))},
        ),
    )
    entry2 = SimpleNamespace(
        entry_id="entry2",
        domain=DOMAIN,
        state=ConfigEntryState.LOADED,
        data={CONF_PORTFOLIO_META: {"p2": {"currency": "EUR"}}},
        runtime_data=SimpleNamespace(
            api=object(),
            coordinators={"p2": SimpleNamespace(data=_payload(200, 20, 7, 40))},
        ),
    )
    combined = SimpleNamespace(
        entry_id="combined",
        domain=DOMAIN,
        state=ConfigEntryState.LOADED,
        data={
            CONF_ENTRY_TYPE: ENTRY_TYPE_COMBINED,
            CONF_SOURCE_ENTRY_IDS: ["entry1", "entry2"],
            CONF_CURRENCY: "EUR",
        },
    )
    entries = {entry.entry_id: entry for entry in (entry1, entry2, combined)}
    hass = SimpleNamespace(
        config_entries=SimpleNamespace(async_get_entry=entries.get)
    )

    result = combined_snapshot_data(hass, combined.entry_id)

    assert result["snapshot_date"] is None
    assert result["total_value"] == 100
    assert [row["name"] for row in result["holdings"]] == ["Stock 60", "Stock 40"]
    assert [row["weight"] for row in result["holdings"]] == [60.0, 40.0]


@pytest.mark.parametrize(
    ("second_data", "second_success"),
    [(None, True), (_payload(200, 20, 7, 40), False)],
)
def test_combined_snapshot_rejects_incomplete_source_data(
    second_data: dict | None,
    second_success: bool,
) -> None:
    """Combined snapshot must not publish missing, failed, or stale source data."""
    entry1 = SimpleNamespace(
        entry_id="entry1",
        domain=DOMAIN,
        state=ConfigEntryState.LOADED,
        data={CONF_PORTFOLIO_META: {"p1": {"currency": "EUR"}}},
        runtime_data=SimpleNamespace(
            api=object(),
            coordinators={
                "p1": SimpleNamespace(
                    data=_payload(100, 10, 5, 60),
                    last_update_success=True,
                )
            },
        ),
    )
    entry2 = SimpleNamespace(
        entry_id="entry2",
        domain=DOMAIN,
        state=ConfigEntryState.LOADED,
        data={CONF_PORTFOLIO_META: {"p2": {"currency": "EUR"}}},
        runtime_data=SimpleNamespace(
            api=object(),
            coordinators={
                "p2": SimpleNamespace(
                    data=second_data,
                    last_update_success=second_success,
                )
            },
        ),
    )
    combined = SimpleNamespace(
        entry_id="combined",
        domain=DOMAIN,
        state=ConfigEntryState.LOADED,
        data={
            CONF_ENTRY_TYPE: ENTRY_TYPE_COMBINED,
            CONF_SOURCE_ENTRY_IDS: ["entry1", "entry2"],
            CONF_CURRENCY: "EUR",
        },
    )
    entries = {entry.entry_id: entry for entry in (entry1, entry2, combined)}
    hass = SimpleNamespace(
        config_entries=SimpleNamespace(async_get_entry=entries.get)
    )

    with pytest.raises(CombinedUnavailableError) as error:
        combined_snapshot_data(hass, combined.entry_id)

    assert error.value.code == "not_available"


async def test_combined_performance_uses_only_selected_loaded_sources() -> None:
    """Unselected or unloaded entries cannot affect an explicit Combined result."""
    api1 = SimpleNamespace(
        async_get_performance=AsyncMock(
            return_value=_payload(100, 10, 5, 60)
        )
    )
    api2 = SimpleNamespace(
        async_get_performance=AsyncMock(
            return_value=_payload(200, 20, 7, 40)
        )
    )
    entry1 = SimpleNamespace(
        entry_id="entry1",
        domain=DOMAIN,
        state=ConfigEntryState.LOADED,
        data={CONF_PORTFOLIO_META: {"p1": {"currency": "EUR"}}},
        runtime_data=SimpleNamespace(
            performance_cache={},
            performance_inflight={},
            api=api1,
            coordinators={"p1": SimpleNamespace(data={})},
        ),
    )
    entry2 = SimpleNamespace(
        entry_id="entry2",
        domain=DOMAIN,
        state=ConfigEntryState.LOADED,
        data={CONF_PORTFOLIO_META: {"p2": {"currency": "EUR"}}},
        runtime_data=SimpleNamespace(
            performance_cache={},
            performance_inflight={},
            api=api2,
            coordinators={"p2": SimpleNamespace(data={})},
        ),
    )
    unrelated_unloaded = SimpleNamespace(
        entry_id="entry3",
        state=ConfigEntryState.NOT_LOADED,
        data={},
    )
    combined = SimpleNamespace(
        entry_id="combined",
        domain=DOMAIN,
        state=ConfigEntryState.LOADED,
        data={
            CONF_ENTRY_TYPE: ENTRY_TYPE_COMBINED,
            CONF_SOURCE_ENTRY_IDS: ["entry1", "entry2"],
            CONF_CURRENCY: "EUR",
        },
    )
    entries = {
        entry.entry_id: entry
        for entry in (entry1, entry2, unrelated_unloaded, combined)
    }
    hass = SimpleNamespace(
        config_entries=SimpleNamespace(async_get_entry=entries.get)
    )

    result = await _async_get_combined_performance(hass, "max", "combined")

    assert result["performance"]["valuation"]["atIntervalEnd"] == 300
    api1.async_get_performance.assert_awaited_once_with(["p1"], "max")
    api2.async_get_performance.assert_awaited_once_with(["p2"], "max")


def _unloaded_sibling(hass: HomeAssistant) -> MockConfigEntry:
    """Add an account entry that deliberately has no runtime_data."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Second account",
        data={
            "user_id": "second",
            "portfolio_ids": ["p2"],
            CONF_PORTFOLIO_META: {"p2": {"currency": "EUR"}},
        },
        unique_id="second_user",
        version=2,
        minor_version=1,
    )
    entry.add_to_hass(hass)
    return entry


def _combined_for(hass: HomeAssistant, source_ids: list[str]) -> MockConfigEntry:
    """Add a loaded explicit Combined entry for helper tests."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Parqet Combined",
        data={
            CONF_ENTRY_TYPE: ENTRY_TYPE_COMBINED,
            CONF_SOURCE_ENTRY_IDS: source_ids,
            CONF_CURRENCY: "EUR",
        },
        unique_id="combined_accounts",
        version=2,
        minor_version=1,
    )
    entry.add_to_hass(hass)
    entry.runtime_data = ParqetCombinedRuntime()
    entry.mock_state(hass, ConfigEntryState.LOADED)
    return entry


def test_combined_snapshot_rejects_unloaded_selected_source(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Combined snapshot must not publish a partial account total."""
    sibling = _unloaded_sibling(hass)
    combined = _combined_for(
        hass, [init_integration.entry_id, sibling.entry_id]
    )

    with pytest.raises(CombinedUnavailableError) as error:
        combined_snapshot_data(hass, combined.entry_id)

    assert error.value.code == "not_available"


async def test_combined_performance_rejects_unloaded_selected_source(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
) -> None:
    """Combined performance must not publish a partial account total."""
    sibling = _unloaded_sibling(hass)
    combined = _combined_for(
        hass, [init_integration.entry_id, sibling.entry_id]
    )

    with pytest.raises(CombinedUnavailableError) as error:
        await _async_get_combined_performance(
            hass, "max", combined.entry_id
        )

    assert error.value.code == "not_available"


class TestPerformanceCacheServesRepeats:
    """The handler must actually consult the cache, not just maintain it."""

    @staticmethod
    def _connection() -> MagicMock:
        connection = MagicMock()
        connection.send_result = MagicMock()
        connection.send_error = MagicMock()
        return connection

    async def test_second_identical_request_does_not_hit_the_api(
        self, hass: HomeAssistant, init_integration: MockConfigEntry
    ) -> None:
        """Interval re-clicks inside the TTL must be served from cache."""
        runtime = init_integration.runtime_data
        runtime.api.async_get_performance.reset_mock()
        runtime.api.async_get_performance.return_value = {"performance": {}}

        msg = {
            "id": 1,
            "entry_id": init_integration.entry_id,
            "portfolio_id": MOCK_PORTFOLIO_ID,
            "interval": "1y",
        }
        await _async_get_performance(hass, self._connection(), msg)
        await _async_get_performance(hass, self._connection(), {**msg, "id": 2})

        assert runtime.api.async_get_performance.call_count == 1

    async def test_a_different_interval_is_fetched_fresh(
        self, hass: HomeAssistant, init_integration: MockConfigEntry
    ) -> None:
        """The cache must not serve one interval's data for another."""
        runtime = init_integration.runtime_data
        runtime.api.async_get_performance.reset_mock()
        runtime.api.async_get_performance.return_value = {"performance": {}}

        msg = {
            "id": 1,
            "entry_id": init_integration.entry_id,
            "portfolio_id": MOCK_PORTFOLIO_ID,
            "interval": "1y",
        }
        await _async_get_performance(hass, self._connection(), msg)
        await _async_get_performance(
            hass, self._connection(), {**msg, "id": 2, "interval": "max"}
        )

        assert runtime.api.async_get_performance.call_count == 2


class TestPerformanceSingleflight:
    """Overlapping cache misses must share one upstream request."""

    async def test_identical_concurrent_requests_are_coalesced(self) -> None:
        """Two callers for one key await one API task and receive its result."""
        started = asyncio.Event()
        release = asyncio.Event()
        payload = {"performance": {"valuation": {"atIntervalEnd": 123}}}

        async def fetch(_portfolio_ids: list[str], _interval: str):
            started.set()
            await release.wait()
            return payload

        api = SimpleNamespace(async_get_performance=AsyncMock(side_effect=fetch))
        runtime = ParqetAccountRuntime(api=api)

        first = asyncio.create_task(_async_fetch_performance(runtime, ["p1"], "1y"))
        await started.wait()
        second = asyncio.create_task(
            _async_fetch_performance(runtime, ["p1"], "1y")
        )
        await asyncio.sleep(0)
        release.set()

        assert await asyncio.gather(first, second) == [payload, payload]
        api.async_get_performance.assert_awaited_once_with(["p1"], "1y")

    async def test_cancelled_caller_does_not_cancel_shared_request(self) -> None:
        """Disconnecting one card cannot cancel work another card still needs."""
        started = asyncio.Event()
        release = asyncio.Event()
        payload = {"performance": {"valuation": {"atIntervalEnd": 456}}}

        async def fetch(_portfolio_ids: list[str], _interval: str):
            started.set()
            await release.wait()
            return payload

        api = SimpleNamespace(async_get_performance=AsyncMock(side_effect=fetch))
        runtime = ParqetAccountRuntime(api=api)

        cancelled = asyncio.create_task(
            _async_fetch_performance(runtime, ["p1"], "max")
        )
        await started.wait()
        survivor = asyncio.create_task(
            _async_fetch_performance(runtime, ["p1"], "max")
        )
        await asyncio.sleep(0)

        cancelled.cancel()
        with pytest.raises(asyncio.CancelledError):
            await cancelled
        release.set()

        assert await survivor == payload
        api.async_get_performance.assert_awaited_once_with(["p1"], "max")

    async def test_failed_request_is_not_cached_and_can_be_retried(self) -> None:
        """An API failure clears singleflight state and the next call runs."""
        payload = {"performance": {"valuation": {"atIntervalEnd": 789}}}
        api = SimpleNamespace(
            async_get_performance=AsyncMock(
                side_effect=[ParqetApiError("boom"), payload]
            )
        )
        runtime = ParqetAccountRuntime(api=api)

        with pytest.raises(ParqetApiError, match="boom"):
            await _async_fetch_performance(runtime, ["p1"], "max")
        await asyncio.sleep(0)

        assert runtime.performance_cache == {}
        assert runtime.performance_inflight == {}
        assert await _async_fetch_performance(runtime, ["p1"], "max") == payload
        assert api.async_get_performance.await_count == 2
