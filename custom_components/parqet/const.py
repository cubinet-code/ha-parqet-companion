"""Constants for the Parqet integration."""

from __future__ import annotations

from datetime import timedelta

DOMAIN = "parqet"

# Parqet Connect API (direct — no CORS proxy needed for backend calls)
API_BASE_URL = "https://connect.parqet.com"
AUTHORIZE_URL = f"{API_BASE_URL}/oauth2/authorize"
TOKEN_URL = f"{API_BASE_URL}/oauth2/token"

# OAuth
CLIENT_ID = "019cf96b-44f0-73c4-81f2-e8827d5c1e65"
SCOPES = "portfolio:read"

# Polling (minutes)
DEFAULT_SCAN_INTERVAL = timedelta(minutes=15)
DEFAULT_SCAN_INTERVAL_MIN = 15
MIN_SCAN_INTERVAL_MIN = 5

# Performance interval options
INTERVALS = [
    "1d", "1w", "mtd", "1m", "3m", "6m",
    "1y", "ytd", "3y", "5y", "10y", "max",
]
DEFAULT_INTERVAL = "max"

# Config entry data keys
CONF_PORTFOLIO_ID = "portfolio_id"
CONF_PORTFOLIO_NAME = "portfolio_name"
CONF_CURRENCY = "currency"

# Options
CONF_INTERVAL = "interval"
CONF_SCAN_INTERVAL = "scan_interval"
