"""Fixtures for Parqet integration tests."""

from __future__ import annotations

from collections.abc import Generator
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.parqet.const import DOMAIN

MOCK_PORTFOLIO_ID = "test_portfolio_123"
MOCK_PORTFOLIO_NAME = "Test Portfolio"
MOCK_USER_ID = "test_user_456"
MOCK_CURRENCY = "EUR"

MOCK_CONFIG_DATA = {
    "auth_implementation": "parqet",
    "token": {
        "access_token": "mock_access_token",
        "refresh_token": "mock_refresh_token",
        "token_type": "Bearer",
        "expires_in": 3600,
    },
    "portfolio_id": MOCK_PORTFOLIO_ID,
    "portfolio_name": MOCK_PORTFOLIO_NAME,
    "currency": MOCK_CURRENCY,
}

MOCK_USER_INFO = {
    "userId": MOCK_USER_ID,
    "installationId": "test_install_789",
    "state": "active",
    "permissions": [
        {"action": "read", "resourceType": "portfolio", "resourceId": MOCK_PORTFOLIO_ID}
    ],
}

MOCK_PORTFOLIOS = [
    {
        "id": MOCK_PORTFOLIO_ID,
        "name": MOCK_PORTFOLIO_NAME,
        "currency": MOCK_CURRENCY,
        "createdAt": "2024-01-01T00:00:00Z",
        "distinctBrokers": ["trade_republic"],
    },
]

MOCK_PERFORMANCE = {
    "performance": {
        "kpis": {
            "inInterval": {
                "xirr": 5.05,
                "ttwror": 20.40,
            }
        },
        "fees": {"inInterval": {"fees": 31118.37}},
        "taxes": {"inInterval": {"taxes": 19220.49}},
        "unrealizedGains": {
            "inInterval": {
                "gainGross": 138540.77,
                "gainNet": 130000.00,
                "returnGross": 0.12,
                "returnNet": 0.10,
            }
        },
        "realizedGains": {
            "inInterval": {
                "gainGross": 264456.98,
                "gainNet": 250000.00,
                "returnGross": 0.15,
                "returnNet": 0.13,
            }
        },
        "dividends": {
            "inInterval": {
                "gainGross": 6572.26,
                "gainNet": 5500.00,
                "taxes": 800.00,
                "fees": 50.00,
            }
        },
        "valuation": {
            "atIntervalStart": 2900000.00,
            "atIntervalEnd": 3047017.45,
        },
    },
    "holdings": [
        {
            "id": "holding_1",
            "activityCount": 5,
            "logo": None,
            "earliestActivityDate": "2024-01-15T00:00:00Z",
            "asset": {"name": "Test Stock", "type": "stock"},
            "position": {
                "shares": 100,
                "purchasePrice": 50.0,
                "purchaseValue": 5000.0,
                "currentPrice": 55.0,
                "currentValue": 5500.0,
                "isSold": False,
            },
        },
        {
            "id": "holding_2",
            "activityCount": 3,
            "logo": None,
            "earliestActivityDate": "2024-03-01T00:00:00Z",
            "asset": {"name": "Test ETF", "type": "etf"},
            "position": {
                "shares": 50,
                "purchasePrice": 100.0,
                "purchaseValue": 5000.0,
                "currentPrice": 110.0,
                "currentValue": 5500.0,
                "isSold": False,
            },
        },
    ],
    "netAllocations": {
        "net": 11000.0,
        "positive": {"total": 11000.0},
        "negative": {"total": 0.0},
    },
}

MOCK_ACTIVITIES = {
    "activities": [
        {
            "id": "act_1",
            "type": "buy",
            "holdingId": "holding_1",
            "holdingAssetType": "stock",
            "asset": {"name": "Test Stock", "type": "stock"},
            "shares": 10,
            "price": 50.0,
            "amount": 500.0,
            "currency": "EUR",
            "datetime": "2026-03-15T10:00:00Z",
            "tax": None,
            "fee": 1.50,
            "broker": "Trade Republic",
        },
        {
            "id": "act_2",
            "type": "dividend",
            "holdingId": "holding_1",
            "holdingAssetType": "stock",
            "asset": {"name": "Test Stock", "type": "stock"},
            "shares": None,
            "price": None,
            "amount": 25.0,
            "currency": "EUR",
            "datetime": "2026-03-10T10:00:00Z",
            "tax": 6.25,
            "fee": None,
            "broker": None,
        },
    ],
    "cursor": None,
}


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(
    enable_custom_integrations: None,
) -> None:
    """Enable custom integrations for all tests."""


@pytest.fixture
def mock_config_entry(hass: HomeAssistant) -> MockConfigEntry:
    """Create a mock Parqet config entry."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title=MOCK_PORTFOLIO_NAME,
        data=MOCK_CONFIG_DATA,
        unique_id=f"{MOCK_USER_ID}_{MOCK_PORTFOLIO_ID}",
        version=1,
        minor_version=1,
    )
    entry.add_to_hass(hass)
    return entry


@pytest.fixture
def mock_setup_entry() -> Generator[AsyncMock]:
    """Prevent actual setup during config flow tests."""
    with patch(
        "custom_components.parqet.async_setup_entry",
        return_value=True,
    ) as mock:
        yield mock


@pytest.fixture
def mock_parqet_api() -> Generator[AsyncMock]:
    """Create a mock ParqetApiClient with default responses."""
    with patch(
        "custom_components.parqet.ParqetApiClient", autospec=True
    ) as mock_cls:
        client = mock_cls.return_value
        client.async_get_user.return_value = MOCK_USER_INFO
        client.async_list_portfolios.return_value = MOCK_PORTFOLIOS
        client.async_get_performance.return_value = MOCK_PERFORMANCE
        client.async_get_activities.return_value = MOCK_ACTIVITIES
        yield client


@pytest.fixture
async def init_integration(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_parqet_api: AsyncMock,
) -> MockConfigEntry:
    """Set up the Parqet integration for testing."""
    with (
        patch(
            "custom_components.parqet.async_setup",
            return_value=True,
        ),
        patch(
            "custom_components.parqet.config_entry_oauth2_flow"
            ".async_get_config_entry_implementation",
        ),
        patch(
            "custom_components.parqet.config_entry_oauth2_flow.OAuth2Session",
        ),
    ):
        from homeassistant.setup import async_setup_component

        # Patch manifest dependencies at the JSON level before HA loads it,
        # to avoid frontend/http (which need hass_frontend module).
        import json
        from pathlib import Path

        manifest_path = Path("custom_components/parqet/manifest.json")
        original = manifest_path.read_text()
        manifest_data = json.loads(original)
        manifest_data["dependencies"] = []
        manifest_path.write_text(json.dumps(manifest_data))
        try:
            assert await async_setup_component(hass, DOMAIN, {})
            await hass.async_block_till_done()
        finally:
            manifest_path.write_text(original)
    return mock_config_entry
