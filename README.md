[![GitHub Release](https://img.shields.io/github/v/release/cubinet-code/ha-parqet-companion?style=flat-square)](https://github.com/cubinet-code/ha-parqet-companion/releases)
[![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg?style=flat-square)](https://hacs.xyz)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.8%2B-blue.svg?style=flat-square)](https://www.home-assistant.io/)
[![License: MIT](https://img.shields.io/github/license/cubinet-code/ha-parqet-companion?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/cubinet-code/ha-parqet-companion/validate.yml?style=flat-square&label=CI)](https://github.com/cubinet-code/ha-parqet-companion/actions)

<p align="center">
  <img src="brand/logo.png" alt="Parqet Companion" width="200">
</p>

# Parqet Companion for Home Assistant

A Home Assistant integration for [Parqet](https://www.parqet.com) — the portfolio tracking platform. Track your investment portfolios with real-time sensors, a rich Lovelace card, and calendar-based activity history.

<p align="center">
  <img src="docs/screenshots/performance.png" alt="Performance View" width="700">
</p>

## Features

- **OAuth2 + PKCE authentication** — secure, one-click setup via Parqet Connect
- **22 sensors per portfolio** — total value, XIRR, TTWROR, unrealized/realized gains, dividends, fees, taxes, allocations, and more
- **Multi-portfolio support** — track multiple portfolios from a single Parqet account
- **Lovelace companion card** with three views:
  - **Performance** — KPI grid, interval selector (1D to Max), stacked breakdown chart
  - **Holdings** — donut allocation chart, sortable table with logos, expandable detail rows
  - **Activities** — filtered transaction list with pagination
- **Calendar entity** — portfolio activities (buy/sell/dividend) as calendar events
- **Visual card editor** — configure everything through the HA UI
- **On-demand data** — switch intervals and fetch fresh data via WebSocket API
- **Diagnostics** — downloadable debug data with automatic token redaction

## Prerequisites

- **Home Assistant** 2024.8 or newer
- A **[Parqet](https://www.parqet.com) account** with at least one portfolio
- Parqet Connect OAuth access (included with all Parqet accounts)

## Installation

### HACS (Recommended)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=cubinet-code&repository=ha-parqet-companion&category=integration)

Or manually:

<details>
<summary>Manual HACS steps</summary>

1. Open HACS in your Home Assistant instance
2. Click the three dots in the top right corner
3. Select **Custom repositories**
4. Add `cubinet-code/ha-parqet-companion` with category **Integration**
5. Click **Download**
6. Restart Home Assistant

</details>

### Manual Installation

<details>
<summary>Manual installation steps</summary>

1. Download the latest release from [GitHub Releases](https://github.com/cubinet-code/ha-parqet-companion/releases)
2. Extract and copy the `custom_components/parqet` directory to your Home Assistant `config/custom_components/` directory
3. Restart Home Assistant

</details>

### Configuration

[![Open your Home Assistant instance and start setting up a new integration.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=parqet)

Or manually:

1. Go to **Settings** > **Devices & Services** > **Add Integration**
2. Search for **Parqet Companion**
3. Sign in with your Parqet account (OAuth2 — no credentials stored in HA)
4. Select which portfolios to track (all are selected by default)
5. Each portfolio creates a device with sensors and a calendar entity

### Options

After setup, click the gear icon on any portfolio entry to configure:

| Option | Default | Description |
|--------|---------|-------------|
| Performance interval | `max` | Time period for performance calculations (1D, 1W, MTD, 1M, 3M, 6M, 1Y, YTD, 3Y, 5Y, 10Y, Max) |
| Update frequency | 15 min | How often to poll the Parqet API (minimum 5 minutes) |

## Sensors

Each portfolio creates **22 sensors** and **1 calendar entity**.

### Core Sensors

| Sensor | Description | Unit | Icon |
|--------|-------------|------|------|
| Total value | Portfolio valuation at interval end | Currency | `mdi:cash-multiple` |
| XIRR | Extended Internal Rate of Return | % | `mdi:chart-line` |
| TTWROR | Time-Weighted Rate of Return | % | `mdi:chart-timeline-variant` |
| Unrealized gain | Unrealized gains (gross) | Currency | `mdi:trending-up` |
| Realized gain | Realized gains (gross) | Currency | `mdi:cash-check` |
| Dividends | Dividend income (gross) | Currency | `mdi:cash-refund` |
| Fees | Trading fees | Currency | `mdi:credit-card-outline` |
| Taxes | Taxes paid | Currency | `mdi:receipt-text` |

### Detailed Sensors

| Sensor | Description | Unit |
|--------|-------------|------|
| Valuation at interval start | Portfolio value at start of period | Currency |
| Unrealized gain (net) | After fees and taxes | Currency |
| Unrealized return (gross/net) | Percentage return | % |
| Realized gain (net) | After fees and taxes | Currency |
| Realized return (gross/net) | Percentage return | % |
| Dividends (net) | After taxes and fees | Currency |
| Dividend taxes / fees | Breakdown of dividend costs | Currency |
| Holdings count | Number of active holdings | Count |

### Allocation Sensors

| Sensor | Description | Unit |
|--------|-------------|------|
| Net allocation | Net total (long minus short) | Currency |
| Positive allocation | Total long positions | Currency |
| Negative allocation | Total short/debt positions | Currency |

### Calendar Entity

Each portfolio creates a calendar entity (`calendar.<portfolio>_activities`) that exposes transactions as calendar events. View them in HA's built-in Calendar view or use them in automations.

<p align="center">
  <img src="docs/screenshots/calendar.png" alt="Calendar View" width="700">
</p>

### Extra Attributes

The `total_value` sensor includes additional attributes:

| Attribute | Description |
|-----------|-------------|
| `entry_id` | Config entry ID (used by the Lovelace card for WebSocket calls) |
| `portfolio_id` | Parqet portfolio identifier |
| `holdings_count` | Number of active holdings |
| `top_holdings` | Top 5 holdings by value (name, value, weight%) |
| `interval` | Current performance interval |

## Lovelace Card

The integration bundles a Lovelace companion card that is automatically registered.

### Adding the Card

1. Edit any dashboard
2. Click **Add Card** and search for **Parqet Companion**
3. Configure via the visual editor or YAML:

```yaml
type: custom:parqet-companion-card
default_view: performance
default_interval: 1y
show_chart: true
show_interval_selector: true
show_logo: true
compact: false
currency_symbol: "€"
holdings_limit: 50
activities_limit: 25
```

### Card Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | — | Lock card to a specific portfolio (pick any Parqet sensor) |
| `default_view` | string | `performance` | Initial tab: `performance`, `holdings`, or `activities` |
| `default_interval` | string | `1y` | Default performance interval |
| `currency_symbol` | string | `€` | Currency symbol for formatting |
| `holdings_limit` | number | `50` | Maximum holdings shown in table |
| `activities_limit` | number | `25` | Activities loaded per page |
| `show_interval_selector` | boolean | `true` | Show interval picker |
| `show_chart` | boolean | `true` | Show charts (stacked bar / donut) |
| `show_logo` | boolean | `true` | Show holding logos |
| `compact` | boolean | `false` | Compact KPI grid layout |
| `hide_header` | boolean | `false` | Hide portfolio name header |

### Visual Editor

All options are configurable through the HA visual editor — no YAML required.

<p align="center">
  <img src="docs/screenshots/editor.png" alt="Visual Editor" width="700">
</p>

### Views

**Performance** — KPI grid with all key metrics, time interval selector, and a stacked breakdown chart.

<p align="center">
  <img src="docs/screenshots/performance.png" alt="Performance View" width="700">
</p>

**Holdings** — Donut allocation chart (top 20 + "Other" bucket) and a sortable table with logos, P&L, and weights.

<p align="center">
  <img src="docs/screenshots/holdings.png" alt="Holdings View" width="700">
</p>

**Activities** — Filtered transaction list with type badges, asset names, and pagination.

<p align="center">
  <img src="docs/screenshots/activities.png" alt="Activities View" width="700">
</p>

## WebSocket API

Three WebSocket commands are available for advanced use cases and custom cards.

### `parqet/get_performance`

Fetch performance data with a specific interval.

```json
{
  "type": "parqet/get_performance",
  "entry_id": "<config_entry_id>",
  "interval": "ytd"
}
```

### `parqet/get_holdings`

Returns cached holdings data for a portfolio.

```json
{
  "type": "parqet/get_holdings",
  "entry_id": "<config_entry_id>"
}
```

### `parqet/get_activities`

Fetch activities with optional filtering and pagination.

```json
{
  "type": "parqet/get_activities",
  "entry_id": "<config_entry_id>",
  "activity_type": ["buy", "sell"],
  "limit": 50,
  "cursor": null
}
```

## Device Page

Each portfolio appears as a device with all sensors, calendar entity, diagnostics, and automation support.

<p align="center">
  <img src="docs/screenshots/sensors.png" alt="Device Page" width="700">
</p>

## Troubleshooting

### Enable Debug Logging

```yaml
logger:
  default: warning
  logs:
    custom_components.parqet: debug
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Missing configuration" during setup | Restart HA and try again — the OAuth implementation registers on startup |
| Sensors show "unavailable" | Check that your Parqet OAuth token hasn't expired; re-authenticate in integration settings |
| Card shows "No Parqet portfolios found" | Ensure the integration is set up with at least one portfolio |
| Holdings/Activities fail to load | Delete and re-add the integration to refresh entity attributes |

### Diagnostics

Download diagnostic data from the device page (**Download diagnostics**). All OAuth tokens are automatically redacted.

## Contributing

Contributions are welcome! This integration aims to become an official HA core integration.

```bash
# Clone
git clone https://github.com/cubinet-code/ha-parqet-companion.git
cd ha-parqet-companion

# Frontend
npm install && npm run build

# Python tests
pip install -r requirements_test.txt
pytest tests/

# Lint
ruff check custom_components/parqet/
```

### Architecture

```
custom_components/parqet/
├── __init__.py          # Entry point, OAuth, platform setup
├── api.py               # Async Parqet Connect API client
├── calendar.py          # Calendar entity (activities as events)
├── config_flow.py       # OAuth2 + PKCE + portfolio selection
├── coordinator.py       # DataUpdateCoordinator (polls every 15 min)
├── sensor.py            # 22 sensor entities per portfolio
├── diagnostics.py       # Debug data export with token redaction
├── websocket_api.py     # WebSocket commands for frontend card
└── frontend/
    └── parqet-card.js   # Built Lovelace card bundle

src/                     # TypeScript source for Lovelace card
├── parqet-card.ts       # Main card (entity discovery, tabs, editor)
├── views/               # Performance, Holdings, Activities
└── components/          # Donut chart, stacked bar, interval selector
```

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Parqet](https://www.parqet.com) for the Connect API
- [Home Assistant](https://www.home-assistant.io) community
