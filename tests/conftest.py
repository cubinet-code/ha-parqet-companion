"""Fixtures for Parqet integration tests."""

from __future__ import annotations

from collections.abc import Generator
from unittest.mock import AsyncMock, patch

import pytest

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
        }
    ],
}
