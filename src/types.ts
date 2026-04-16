import type { IntervalValue } from './const';

// ─── HA integration types ────────────────────────────────────────────────────

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HassDeviceRegistryEntry {
  id: string;
  name: string | null;
  identifiers: [string, string][];
}

export interface HassEntityRegistryDisplayEntry {
  entity_id: string;
  device_id?: string;
  platform: string;
  unique_id?: string;
}

export interface Hass {
  states: Record<string, HassEntity>;
  devices?: Record<string, HassDeviceRegistryEntry>;
  entities?: Record<string, HassEntityRegistryDisplayEntry>;
  connection: {
    sendMessagePromise(msg: Record<string, unknown>): Promise<unknown>;
  };
}

// ─── Portfolio data (from WebSocket responses) ───────────────────────────────

export interface PortfolioPerformance {
  kpis: { inInterval: { xirr: number | null; ttwror: number | null } } | null;
  fees: { inInterval: { fees: number } };
  taxes: { inInterval: { taxes: number } };
  unrealizedGains: {
    inInterval: {
      gainGross: number;
      gainNet: number;
      returnGross: number;
      returnNet: number;
    };
  };
  realizedGains: {
    inInterval: {
      gainGross: number;
      gainNet: number;
      returnGross: number;
      returnNet: number;
    };
  };
  dividends: {
    inInterval: {
      gainGross: number;
      gainNet: number;
      taxes: number;
      fees: number;
    };
  } | null;
  valuation: {
    atIntervalStart: number;
    atIntervalEnd: number;
  };
}

export interface Holding {
  id: string;
  nickname: string | null;
  logo: string | null;
  asset: { name: string; type: string; isin?: string; symbol?: string; identifier?: string };
  position: {
    shares: number;
    purchasePrice: number;
    purchaseValue: number;
    currentPrice: number;
    currentValue: number;
    isSold: boolean;
  };
  performance: PortfolioPerformance;
  activityCount: number;
  earliestActivityDate: string;
}

export type ActivityType =
  | 'buy'
  | 'sell'
  | 'dividend'
  | 'interest'
  | 'transfer_in'
  | 'transfer_out'
  | 'fees_taxes'
  | 'deposit'
  | 'withdrawal';

export interface Activity {
  id: string;
  type: ActivityType;
  holdingId: string;
  holdingAssetType: string;
  asset: { name: string; type: string };
  shares?: number;
  price?: number;
  amount: number;
  currency: string;
  datetime: string;
  tax?: number;
  fee?: number;
  broker?: string;
}

// ─── Portfolio (for components) ───────────────────────────────────────────────

export interface Portfolio {
  id: string;
  name: string;
  currency: string;
}

// ─── Card config ─────────────────────────────────────────────────────────────

export type ViewType = 'performance' | 'holdings' | 'activities';

export interface ParqetCardConfig {
  type: string;
  device_id?: string;
  entity?: string; // legacy — kept for backward compat
  entry_id?: string;
  default_view?: ViewType;
  default_interval?: IntervalValue;
  show_interval_selector?: boolean;
  show_chart?: boolean; // legacy — falls back for both charts
  show_performance_chart?: boolean;
  show_allocation_chart?: boolean;
  show_logo?: boolean;
  compact?: boolean;
  hide_header?: boolean;
  currency_symbol?: string;
  holdings_limit?: number;
  activities_limit?: number;
  default_activity_type?: ActivityType | null;
}

// ─── Discovered portfolio from HA entities ───────────────────────────────────

export interface DiscoveredPortfolio {
  entryId: string;
  name: string;
  entityPrefix: string | null; // null when discovered via entity registry
  sensors: Record<string, HassEntity>;
  /** Present on the "All Portfolios" aggregate proxy. */
  _entryIds?: string[];
}
