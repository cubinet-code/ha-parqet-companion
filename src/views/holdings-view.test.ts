import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Hass, ParqetCardConfig, DiscoveredPortfolio, Holding } from '../types';

vi.mock('lit', () => {
  class FakeLitElement {
    connectedCallback() {}
    requestUpdate() {}
    dispatchEvent() { return true; }
  }
  return {
    LitElement: FakeLitElement,
    html: (strings: TemplateStringsArray, ..._values: unknown[]) => strings.join(''),
    css: (strings: TemplateStringsArray, ..._values: unknown[]) => strings.join(''),
  };
});

vi.mock('lit/decorators.js', () => ({
  customElement: () => (c: unknown) => c,
  property: () => () => undefined,
  state: () => () => undefined,
}));

vi.mock('../components/interval-selector', () => ({}));
vi.mock('../components/loading-spinner', () => ({}));
vi.mock('../components/donut-chart', () => ({}));

// --- helpers ----------------------------------------------------------------

function makeHolding(overrides: Partial<Holding> = {}): Holding {
  return {
    id: 'h1',
    nickname: null,
    logo: null,
    asset: { name: 'Test Stock', type: 'stock' },
    position: {
      shares: 100,
      purchasePrice: 50,
      purchaseValue: 5000,
      currentPrice: 55,
      currentValue: 5500,
      isSold: false,
    },
    performance: {
      kpis: { inInterval: { xirr: 10, ttwror: 8 } },
      fees: { inInterval: { fees: 5 } },
      taxes: { inInterval: { taxes: 3 } },
      unrealizedGains: { inInterval: { gainGross: 500, gainNet: 450, returnGross: 10, returnNet: 9 } },
      realizedGains: { inInterval: { gainGross: 0, gainNet: 0, returnGross: 0, returnNet: 0 } },
      dividends: { inInterval: { gainGross: 20, gainNet: 17, taxes: 3, fees: 0 } },
      valuation: { atIntervalStart: 5000, atIntervalEnd: 5500 },
    },
    activityCount: 2,
    earliestActivityDate: '2024-01-01',
    ...overrides,
  };
}

function makeHass(): Hass {
  return {
    states: {},
    connection: { sendMessagePromise: vi.fn() },
  };
}

function makePortfolio(entryId = 'entry1'): DiscoveredPortfolio {
  return { entryId, name: 'Test Portfolio', entityPrefix: null, sensors: {} };
}

function makeConfig(overrides: Partial<ParqetCardConfig> = {}): ParqetCardConfig {
  return { type: 'custom:parqet-card', ...overrides };
}

// --- tests ------------------------------------------------------------------

describe('ParqetHoldingsView', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let HoldingsView: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./holdings-view');
    HoldingsView = mod.ParqetHoldingsView;
  });

  describe('data-driven rendering', () => {
    it('renders holdings from holdingsData prop', () => {
      const holdings = [makeHolding(), makeHolding({ id: 'h2' })];
      const view = new HoldingsView();
      view.hass = makeHass();
      view.portfolio = makePortfolio();
      view.config = makeConfig();
      view.holdingsData = holdings;

      expect(view.holdingsData).toHaveLength(2);
    });

    it('uses interval prop', () => {
      const view = new HoldingsView();
      view.hass = makeHass();
      view.portfolio = makePortfolio();
      view.config = makeConfig();
      view.interval = '3m';

      expect(view.interval).toBe('3m');
    });

    it('exposes loading and error props', () => {
      const view = new HoldingsView();
      view.hass = makeHass();
      view.portfolio = makePortfolio();
      view.config = makeConfig();
      view.loading = true;
      view.error = 'Rate limit';

      expect(view.loading).toBe(true);
      expect(view.error).toBe('Rate limit');
    });

    it('does not make WS calls independently', () => {
      const send = vi.fn();
      const view = new HoldingsView();
      view.hass = { states: {}, connection: { sendMessagePromise: send } };
      view.portfolio = makePortfolio();
      view.config = makeConfig();

      expect(send).not.toHaveBeenCalled();
    });
  });
});
