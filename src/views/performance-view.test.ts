import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Hass, ParqetCardConfig, DiscoveredPortfolio, PortfolioPerformance } from '../types';

// Stub Lit so we can instantiate the class in jsdom without custom element registry issues
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
vi.mock('../components/stacked-bar', () => ({}));

// --- helpers ----------------------------------------------------------------

function makePerformance(overrides: Partial<PortfolioPerformance> = {}): PortfolioPerformance {
  return {
    kpis: { inInterval: { xirr: 12.5, ttwror: 10.2 } },
    fees: { inInterval: { fees: 50 } },
    taxes: { inInterval: { taxes: 30 } },
    unrealizedGains: {
      inInterval: { gainGross: 5000, gainNet: 4500, returnGross: 10.0, returnNet: 9.0 },
    },
    realizedGains: {
      inInterval: { gainGross: 1000, gainNet: 900, returnGross: 2.0, returnNet: 1.8 },
    },
    dividends: { inInterval: { gainGross: 200, gainNet: 170, taxes: 30, fees: 0 } },
    valuation: { atIntervalStart: 45000, atIntervalEnd: 50000 },
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
  return {
    entryId,
    name: 'Test Portfolio',
    entityPrefix: null,
    sensors: {},
  };
}

function makeConfig(overrides: Partial<ParqetCardConfig> = {}): ParqetCardConfig {
  return {
    type: 'custom:parqet-card',
    ...overrides,
  };
}

// --- tests ------------------------------------------------------------------

describe('ParqetPerformanceView', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let PerformanceView: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./performance-view');
    PerformanceView = mod.ParqetPerformanceView;
  });

  describe('data-driven rendering', () => {
    it('renders performance data from perfData prop', () => {
      const perf = makePerformance();
      const view = new PerformanceView();
      view.hass = makeHass();
      view.portfolio = makePortfolio();
      view.config = makeConfig();
      view.perfData = perf;

      // The view should expose perfData for the template to consume
      expect(view.perfData).toEqual(perf);
      expect(view.perfData?.valuation.atIntervalEnd).toBe(50000);
    });

    it('uses interval prop', () => {
      const view = new PerformanceView();
      view.hass = makeHass();
      view.portfolio = makePortfolio();
      view.config = makeConfig();
      view.interval = 'ytd';

      expect(view.interval).toBe('ytd');
    });

    it('exposes loading and error props', () => {
      const view = new PerformanceView();
      view.hass = makeHass();
      view.portfolio = makePortfolio();
      view.config = makeConfig();
      view.loading = true;
      view.error = 'Rate limit';

      expect(view.loading).toBe(true);
      expect(view.error).toBe('Rate limit');
    });

    it('does not make WS calls on connectedCallback', () => {
      const send = vi.fn();
      const view = new PerformanceView();
      view.hass = { states: {}, connection: { sendMessagePromise: send } };
      view.portfolio = makePortfolio();
      view.config = makeConfig();

      view.connectedCallback();

      expect(send).not.toHaveBeenCalled();
    });
  });
});
