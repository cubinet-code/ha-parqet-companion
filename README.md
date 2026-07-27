[![GitHub Release](https://img.shields.io/github/v/release/cubinet-code/ha-parqet-companion?style=flat-square)](https://github.com/cubinet-code/ha-parqet-companion/releases)
[![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg?style=flat-square)](https://hacs.xyz)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2025.3%2B-blue.svg?style=flat-square)](https://www.home-assistant.io/)
[![License: MIT](https://img.shields.io/github/license/cubinet-code/ha-parqet-companion?style=flat-square)](https://github.com/cubinet-code/ha-parqet-companion/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/cubinet-code/ha-parqet-companion/validate.yml?style=flat-square&label=CI)](https://github.com/cubinet-code/ha-parqet-companion/actions)

# <img src="https://raw.githubusercontent.com/cubinet-code/ha-parqet-companion/main/brand/logo.png" alt="Parqet Companion" width="48" valign="middle"> Parqet Companion for Home Assistant

A Home Assistant integration for [Parqet](https://www.parqet.com) — the portfolio tracking platform. Track your investment portfolios with real-time sensors, a rich Lovelace card, and calendar-based activity history.

<p align="center">
  <img src="https://raw.githubusercontent.com/cubinet-code/ha-parqet-companion/main/docs/screenshots/performance.png" alt="Performance View" width="700">
</p>

## Features

- **OAuth2 + PKCE authentication** — secure, one-click setup via Parqet Connect
- **22 sensors per portfolio** — total value, XIRR, TTWROR, unrealized/realized gains, dividends, fees, taxes, allocations, and more
- **Combined Parqet sensors** — additive totals across explicitly selected same-currency Parqet accounts/portfolios
- **Multi-portfolio support** — track multiple portfolios from a single Parqet account
- **Multi-account support** — add additional Parqet accounts as separate integration entries
- **Lovelace companion card** with three views:
  - **Performance** — KPI grid, interval selector (1D to Max), stacked breakdown chart
  - **Holdings** — donut allocation chart, sortable table with logos, expandable detail rows, interval-aware P&L
  - **Activities** — filtered transaction list with pagination
- **Daily Snapshot card** — per-holding daily P&L based on a custom snapshot time, independent of Parqet's 1D interval
- **Calendar entity** — portfolio activities (buy/sell/dividend) as calendar events
- **Visual card editor** — configure everything through the HA UI
- **On-demand data** — switch intervals and fetch fresh data via WebSocket API
- **Diagnostics** — downloadable debug data with automatic token redaction

> **Note:** The initial setup must be completed on a **desktop browser**. Mobile authorisation is not supported yet due to an API limitation in the OAuth redirect flow.

## Prerequisites

- **Home Assistant** 2025.3 or newer
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
5. The Parqet account is added as a single integration entry. Each selected portfolio becomes its own device with sensors and a calendar entity.

### Multiple Parqet accounts

You can add more than one Parqet account. Repeat the setup flow for each account:

1. Go to **Settings** > **Devices & Services** > **Add Integration**
2. Search for **Parqet Companion**
3. Sign in with the next Parqet account
4. Select the portfolios to track for that account

Each Parqet account becomes its own integration entry, and each selected portfolio becomes a device under that entry. If you add a second account with similar portfolio names, the new entry title includes a short account label so the entries are easier to tell apart.

After adding at least two account entries, add Parqet Companion once more and choose **Parqet Combined**. Select the source accounts to aggregate. The selected portfolios must use the same currency; otherwise no Combined entry is created. The Combined entry owns its own device and sensors, while account entries continue to own only their portfolio devices.

The Combined sensors aggregate additive values from the selected accounts, such as total value, gains, dividends, fees, taxes, allocations, and active holdings count. Percentage KPIs such as XIRR and TTWROR are intentionally not combined because they cannot be mathematically summed across separate OAuth accounts without full cash-flow data. If a selected account is unloaded, unavailable, or later reports a different currency, Combined fails closed instead of publishing a partial or mislabeled total.

When upgrading from an earlier multi-account test build, creating the Combined entry migrates existing `combined_accounts_*` entity-registry records and the Combined device to the new owner. Existing entity IDs are retained so dashboards, automations, and history references continue to work.

### Upgrading from v0.3.x

v0.4 changes the integration's internal layout to **one ConfigEntry per Parqet account**, with each portfolio appearing as a device under that entry. Previously every portfolio was its own ConfigEntry, which caused a token-refresh race when multiple portfolios shared a single Parqet account (see [#6](https://github.com/cubinet-code/ha-parqet-companion/issues/6)).

**Migration is automatic.** When you upgrade and restart Home Assistant the v1 entries are folded into one v2 entry per account.

| What you'll notice | Why |
|---|---|
| **N integration entries collapse into 1 per Parqet account** | Settings → Devices & Services will show one "Parqet Companion" entry with all your portfolios as devices underneath, instead of one entry per portfolio. |
| **Dashboards, automations, sensor history all keep working** | Entity unique IDs (`{portfolio_id}_{sensor}`) and device identifiers are preserved across migration — nothing needs to be rewired. |
| **Daily snapshot history is preserved** | The snapshot store is renamed from per-entry to per-portfolio keys as part of the migration; your 7-day rolling history survives. |
| **No re-authentication in most cases** | The freshest valid OAuth token across your old entries is kept. If no sibling token is still valid, a reauth flow starts automatically and you'll see a "Reconfigure required" banner. |
| **New: "Reconfigure" action on the integration entry** | Lets you change which portfolios you track without removing/re-adding the integration. Also used to recover from portfolios deleted on Parqet's side. |

If you previously installed **v0.4.0-beta.2 or v0.4.0-beta.3** before 2026-05-15, those release artifacts were broken (they contained v0.3.10 source code due to a release-pipeline bug). Redownload v0.4.0-beta.4 or later from HACS and restart HA to recover.

### Options

After setup, click the gear icon on any portfolio entry to configure:

| Option | Default | Description |
|--------|---------|-------------|
| Performance interval | `max` | Time period for performance calculations (1D, 1W, MTD, 1M, 3M, 6M, 1Y, YTD, 3Y, 5Y, 10Y, Max) |
| Update frequency | 15 min | How often to poll the Parqet API (minimum 5 minutes) |

## Sensors

Each portfolio creates **22 sensors** and **1 calendar entity**. Core sensors are enabled by default; detailed and allocation sensors are disabled by default and can be enabled in the entity settings.

### Core Sensors (enabled by default)

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

### Detailed Sensors (disabled by default)

| Sensor | Description | Unit |
|--------|-------------|------|
| Valuation at interval start | Portfolio value at start of period | Currency |
| Unrealized gain (net) | After fees and taxes | Currency |
| Unrealized return (gross) | Percentage return before costs | % |
| Unrealized return (net) | Percentage return after costs | % |
| Realized gain (net) | After fees and taxes | Currency |
| Realized return (gross) | Percentage return before costs | % |
| Realized return (net) | Percentage return after costs | % |
| Dividends (net) | After taxes and fees | Currency |
| Dividend taxes | Tax on dividends | Currency |
| Dividend fees | Fees on dividends | Currency |
| Holdings count | Number of active holdings | Count |
| Net allocation | Net total (long minus short) | Currency |
| Positive allocation | Total long positions | Currency |
| Negative allocation | Total short/debt positions | Currency |

### Calendar Entity

Each portfolio creates a calendar entity (`calendar.<portfolio>_activities`) that exposes transactions as calendar events. View them in HA's built-in Calendar view or use them in automations.

<p align="center">
  <img src="https://raw.githubusercontent.com/cubinet-code/ha-parqet-companion/main/docs/screenshots/calendar.png" alt="Calendar View" width="700">
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
currency_symbol: "€"
# Performance
show_interval_selector: true
show_performance_chart: true
# Holdings
show_allocation_chart: true
show_logo: true
holdings_limit: 50
# Activities
activities_limit: 25
# Layout
compact: false
```

### Card Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `device_id` | string | — | Lock card to a specific portfolio device (leave empty for auto-detect) |
| `default_view` | string | `performance` | Initial tab: `performance`, `holdings`, or `activities` |
| `default_interval` | string | `1y` | Default performance interval |
| `currency_symbol` | string | `€` | Currency symbol for formatting |
| `holdings_limit` | number | `50` | Maximum holdings shown in table |
| `activities_limit` | number | `25` | Activities loaded per page |
| `default_activity_type` | string | — | Pre-filter activities by type (e.g. `dividend`, `buy`) |
| `show_interval_selector` | boolean | `true` | Show interval picker (Performance & Holdings) |
| `show_performance_chart` | boolean | `true` | Show stacked breakdown chart (Performance) |
| `show_allocation_chart` | boolean | `true` | Show donut allocation chart (Holdings) |
| `show_logo` | boolean | `true` | Show holding logos (Holdings) |
| `compact` | boolean | `false` | Compact KPI grid layout |
| `hide_header` | boolean | `false` | Hide portfolio name header |

### Visual Editor

All options are configurable through the HA visual editor — no YAML required.

<p align="center">
  <img src="https://raw.githubusercontent.com/cubinet-code/ha-parqet-companion/main/docs/screenshots/editor.png" alt="Visual Editor" width="700">
</p>

### Views

**Performance** — KPI grid with all key metrics, time interval selector, and a stacked breakdown chart.

<p align="center">
  <img src="https://raw.githubusercontent.com/cubinet-code/ha-parqet-companion/main/docs/screenshots/performance.png" alt="Performance View" width="700">
</p>

**Holdings** — Donut allocation chart (top 20 + "Other" bucket) and a sortable table with logos, P&L, and weights.

<p align="center">
  <img src="https://raw.githubusercontent.com/cubinet-code/ha-parqet-companion/main/docs/screenshots/holdings.png" alt="Holdings View" width="700">
</p>

**Activities** — Filtered transaction list with type badges, asset names, and pagination.

<p align="center">
  <img src="https://raw.githubusercontent.com/cubinet-code/ha-parqet-companion/main/docs/screenshots/activities.png" alt="Activities View" width="700">
</p>

## Daily Snapshot Card

A standalone card that captures per-holding closing prices at a user-configured time and computes daily P&L independently of Parqet's built-in 1D interval.

**Why?** Parqet's 1D interval uses the XETRA close (17:00) as the reference price, even for US stocks trading until 22:00. The snapshot card lets you set your own closing time (e.g., 22:00 after US market close) for accurate daily performance.

### Setup

1. Go to **Settings > Integrations > Parqet > Configure**
2. Enable **Daily snapshots** and set your preferred snapshot time
3. Restart Home Assistant
4. Add the **Parqet Daily Snapshot** card to any dashboard

Daily P&L is shown starting the day after the first snapshot is taken.

### Snapshot Card Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `device_id` | string | — | Lock card to a specific portfolio device |
| `currency_symbol` | string | `€` | Currency symbol for formatting |
| `holdings_limit` | number | `50` | Maximum holdings shown in table |
| `show_logo` | boolean | `true` | Show holding logos |
| `compact` | boolean | `false` | Compact layout |

### Integration Options (Snapshots)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `snapshot_enabled` | boolean | `false` | Enable daily snapshots |
| `snapshot_hour` | number | `22` | Snapshot hour (0-23) |
| `snapshot_minute` | number | `0` | Snapshot minute (0-59) |

## WebSocket API

Seven WebSocket commands are available for advanced use cases and custom cards.

> Every command takes `entry_id` (the Parqet account integration entry) plus a `portfolio_id` selector. `portfolio_id` may be omitted when the account has exactly one portfolio.

### `parqet/get_performance`

Fetch performance data with a specific interval. Supports single or multi-portfolio aggregation.

```json
{
  "type": "parqet/get_performance",
  "entry_id": "<config_entry_id>",
  "portfolio_id": "<portfolio_id>",
  "interval": "ytd"
}
```

To aggregate multiple portfolios within the same account, pass `portfolio_ids`:

```json
{
  "type": "parqet/get_performance",
  "entry_id": "<config_entry_id>",
  "portfolio_ids": ["<portfolio_id_1>", "<portfolio_id_2>"],
  "interval": "ytd"
}
```

### `parqet/get_holdings`

Returns cached holdings data for a portfolio.

```json
{
  "type": "parqet/get_holdings",
  "entry_id": "<config_entry_id>",
  "portfolio_id": "<portfolio_id>"
}
```

### `parqet/get_activities`

Fetch activities with optional filtering and pagination.

```json
{
  "type": "parqet/get_activities",
  "entry_id": "<config_entry_id>",
  "portfolio_id": "<portfolio_id>",
  "activity_type": ["buy", "sell"],
  "limit": 50,
  "cursor": null
}
```

### `parqet/get_snapshot`

Returns daily P&L data computed from stored snapshots.

```json
{
  "type": "parqet/get_snapshot",
  "entry_id": "<config_entry_id>",
  "portfolio_id": "<portfolio_id>"
}
```

### `parqet/take_snapshot`

Manually trigger a snapshot capture.

```json
{
  "type": "parqet/take_snapshot",
  "entry_id": "<config_entry_id>",
  "portfolio_id": "<portfolio_id>"
}
```

### `parqet/purge_snapshots`

Clear all stored snapshot data.

```json
{
  "type": "parqet/purge_snapshots",
  "entry_id": "<config_entry_id>",
  "portfolio_id": "<portfolio_id>"
}
```

### `parqet/frontend_diagnostics`

Returns frontend registration diagnostics for debugging card loading issues.

```json
{
  "type": "parqet/frontend_diagnostics"
}
```

## Device Page

Each portfolio appears as a device with all sensors, calendar entity, diagnostics, and automation support.

<p align="center">
  <img src="https://raw.githubusercontent.com/cubinet-code/ha-parqet-companion/main/docs/screenshots/sensors.png" alt="Device Page" width="700">
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
| "Missing configuration" during setup | Ensure you've restarted HA after installing the integration — OAuth registers on first load |
| Sensors show "unavailable" | Check that your Parqet OAuth token hasn't expired; re-authenticate in integration settings |
| Card shows "No Parqet portfolios found" | Ensure the integration is set up with at least one portfolio |
| Performance/Holdings/Activities show blank on first load | Update to v0.3.5+ — all card views now load data via WebSocket on render |
| Repair issue "Portfolio X removed from Parqet" | The portfolio was deleted on Parqet's side and has been pruned from the entry. Use **Reconfigure** on the integration entry to pick a different set of portfolios. |
| Log: `Migration handler not found for entry … for parqet` | The integration code on disk is older than your stored ConfigEntry schema (typically after a downgrade). Re-install the latest release via HACS and restart HA. |
| "Reconfigure required for Parqet" banner appears repeatedly | Parqet rejected the stored refresh token (HTTP 4xx on `/oauth2/token`). Click the banner, complete the OAuth flow again, and the integration will resume normally. |

### Diagnostics

Download diagnostic data from the device page (**Download diagnostics**). All OAuth tokens are automatically redacted.

For card-loading issues ("custom element doesn't exist: parqet-companion-card", "Configuration error"), call the **Parqet: Dump diagnostics** service from **Developer Tools → Services**. It posts a snapshot of the frontend registration, Lovelace resources, and coordinator state as a persistent notification you can screenshot for support.

## Contributing

Contributions are welcome! This integration aims to become an official HA core integration.

```bash
# Clone
git clone https://github.com/cubinet-code/ha-parqet-companion.git
cd ha-parqet-companion

# Frontend
npm install && npm run build

# Python tests
pip install pytest pytest-asyncio pytest-homeassistant-custom-component
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
├── entity.py            # Shared base entity class
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

MIT License — see [LICENSE](https://github.com/cubinet-code/ha-parqet-companion/blob/main/LICENSE) for details.

## Acknowledgments

- [Parqet](https://www.parqet.com) for the Connect API
- [Home Assistant](https://www.home-assistant.io) community
