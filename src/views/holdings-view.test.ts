import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Hass, ParqetCardConfig, DiscoveredPortfolio, Holding } from '../types';

// Stub Lit so we can instantiate the class in jsdom without custom element registry issues
vi.mock('lit', () => {
  class FakeLitElement {
    connectedCallback() {}
    requestUpdate() {}
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

function makeHolding(overrides: Partial<Holding> & { id: string }): Holding {
  return {
    nickname: null,
    logo: null,
    asset: { name: 'Test Stock', type: 'security' },
    position: {
      shares: 10,
      purchasePrice: 100,
      purchaseValue: 1000,
      currentPrice: 120,
      currentValue: 1200,
      isSold: false,
    },
    performance: {
      kpis: { inInterval: { xirr: 5, ttwror: 4 } },
      fees: { inInterval: { fees: 0 } },
      taxes: { inInterval: { taxes: 0 } },
      unrealizedGains: {
        inInterval: { gainGross: 200, gainNet: 180, returnGross: 20, returnNet: 18 },
      },
      realizedGains: {
        inInterval: { gainGross: 0, gainNet: 0, returnGross: 0, returnNet: 0 },
      },
      dividends: {
        inInterval: { gainGross: 10, gainNet: 8, taxes: 2, fees: 0 },
      },
      valuation: { atIntervalStart: 1000, atIntervalEnd: 1200 },
    },
    activityCount: 1,
    earliestActivityDate: '2024-01-01',
    ...overrides,
  };
}

const DEFAULT_HOLDINGS = [
  makeHolding({ id: 'h1', asset: { name: 'VERBIO', type: 'security' } }),
  makeHolding({ id: 'h2', asset: { name: 'Nokia', type: 'security' } }),
];

const DAILY_HOLDINGS = [
  makeHolding({
    id: 'h1',
    asset: { name: 'VERBIO', type: 'security' },
    performance: {
      kpis: { inInterval: { xirr: null, ttwror: null } },
      fees: { inInterval: { fees: 0 } },
      taxes: { inInterval: { taxes: 0 } },
      unrealizedGains: {
        inInterval: { gainGross: 15, gainNet: 15, returnGross: 1.2, returnNet: 1.2 },
      },
      realizedGains: {
        inInterval: { gainGross: 0, gainNet: 0, returnGross: 0, returnNet: 0 },
      },
      dividends: null,
      valuation: { atIntervalStart: 1185, atIntervalEnd: 1200 },
    },
  }),
];

function makeSendMessage(
  holdingsResponse: { holdings: Holding[] },
  performanceResponse?: { holdings: Holding[]; performance: unknown },
) {
  return vi.fn().mockImplementation((msg: Record<string, unknown>) => {
    if (msg.type === 'parqet/get_holdings') {
      return Promise.resolve(holdingsResponse);
    }
    if (msg.type === 'parqet/get_performance') {
      return Promise.resolve(performanceResponse ?? holdingsResponse);
    }
    return Promise.reject(new Error(`unexpected WS type: ${msg.type}`));
  });
}

function makeHass(sendMessage: ReturnType<typeof vi.fn>): Hass {
  return {
    states: {},
    connection: { sendMessagePromise: sendMessage },
  };
}

function makePortfolio(entryId = 'entry1'): DiscoveredPortfolio {
  return {
    entryId,
    name: 'Test Portfolio',
    entityPrefix: 'sensor.test',
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

describe('ParqetHoldingsView', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let HoldingsView: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./holdings-view');
    HoldingsView = mod.ParqetHoldingsView;
  });

  describe('initial load (default interval)', () => {
    it('fetches holdings via parqet/get_holdings on initial load', async () => {
      const send = makeSendMessage({ holdings: DEFAULT_HOLDINGS });
      const view = new HoldingsView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig();

      view.connectedCallback();

      await vi.waitFor(() => {
        expect(send).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'parqet/get_holdings', entry_id: 'entry1' }),
        );
      });
    });
  });

  describe('interval-aware fetching', () => {
    it('fetches via parqet/get_performance when interval changes', async () => {
      const send = makeSendMessage(
        { holdings: DEFAULT_HOLDINGS },
        { holdings: DAILY_HOLDINGS, performance: {} },
      );
      const view = new HoldingsView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig({ show_interval_selector: true });

      view.connectedCallback();
      await vi.waitFor(() => {
        expect(send).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'parqet/get_holdings' }),
        );
      });

      // Simulate interval change — the view must expose _onIntervalChange
      await view._onIntervalChange(
        new CustomEvent('interval-change', { detail: { interval: '1d' } }),
      );

      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'parqet/get_performance',
          entry_id: 'entry1',
          interval: '1d',
        }),
      );
    });

    it('uses holdings from parqet/get_performance response after interval change', async () => {
      const send = makeSendMessage(
        { holdings: DEFAULT_HOLDINGS },
        { holdings: DAILY_HOLDINGS, performance: {} },
      );
      const view = new HoldingsView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig({ show_interval_selector: true });

      view.connectedCallback();
      await vi.waitFor(() => {
        expect(send).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'parqet/get_holdings' }),
        );
      });

      await view._onIntervalChange(
        new CustomEvent('interval-change', { detail: { interval: '1d' } }),
      );

      // After switching to 1d, _holdings should reflect the daily data
      const holdings = view._holdings;
      expect(holdings).toHaveLength(1); // DAILY_HOLDINGS only has 1 item
      expect(holdings[0].performance.unrealizedGains.inInterval.gainGross).toBe(15);
    });

    it('tracks the currently selected interval', async () => {
      const send = makeSendMessage({ holdings: DEFAULT_HOLDINGS });
      const view = new HoldingsView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig({ default_interval: 'ytd', show_interval_selector: true });

      view.connectedCallback();

      // Should initialise _interval from config
      expect(view._interval).toBe('ytd');
    });
  });

  describe('interval selector visibility', () => {
    it('has interval state when show_interval_selector is true', () => {
      const view = new HoldingsView();
      view.config = makeConfig({ show_interval_selector: true });
      view.hass = makeHass(vi.fn().mockResolvedValue({ holdings: [] }));
      view.portfolio = makePortfolio();
      view.connectedCallback();

      expect(view._interval).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('sets error state when performance WS call fails', async () => {
      const send = vi.fn().mockImplementation((msg: Record<string, unknown>) => {
        if (msg.type === 'parqet/get_holdings') {
          return Promise.resolve({ holdings: DEFAULT_HOLDINGS });
        }
        if (msg.type === 'parqet/get_performance') {
          return Promise.reject(new Error('API error'));
        }
        return Promise.reject(new Error('unexpected'));
      });

      const view = new HoldingsView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig({ show_interval_selector: true });

      view.connectedCallback();
      await vi.waitFor(() => {
        expect(send).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'parqet/get_holdings' }),
        );
      });

      await view._onIntervalChange(
        new CustomEvent('interval-change', { detail: { interval: '1d' } }),
      );

      expect(view._error).toBeTruthy();
    });
  });
});
