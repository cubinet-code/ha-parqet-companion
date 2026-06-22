"""Tests for WebSocket helper aggregation paths."""

from __future__ import annotations

from types import SimpleNamespace

from custom_components.parqet.snapshot_ws import combined_snapshot_data
from custom_components.parqet.websocket_api import aggregate_performance_payloads


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


def test_combined_snapshot_data_uses_loaded_coordinator_holdings() -> None:
    """Combined snapshot falls back to current holdings across loaded entries."""
    entry1 = SimpleNamespace(
        runtime_data=SimpleNamespace(
            coordinators={"p1": SimpleNamespace(data=_payload(100, 10, 5, 60))}
        )
    )
    entry2 = SimpleNamespace(
        runtime_data=SimpleNamespace(
            coordinators={"p2": SimpleNamespace(data=_payload(200, 20, 7, 40))}
        )
    )
    hass = SimpleNamespace(
        config_entries=SimpleNamespace(async_entries=lambda domain: [entry1, entry2])
    )

    result = combined_snapshot_data(hass)

    assert result["snapshot_date"] is None
    assert result["total_value"] == 100
    assert [row["name"] for row in result["holdings"]] == ["Stock 60", "Stock 40"]
    assert [row["weight"] for row in result["holdings"]] == [60.0, 40.0]
