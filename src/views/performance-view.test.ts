import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Hass, ParqetCardConfig, DiscoveredPortfolio, PortfolioPerformance } from '../types';

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

function makeSendMessage(performance = makePerformance()) {
  return vi.fn().mockResolvedValue({ performance });
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

  describe('initial load', () => {
    it('fetches via parqet/get_performance on connectedCallback', async () => {
      const send = makeSendMessage();
      const view = new PerformanceView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig();

      view.connectedCallback();

      await vi.waitFor(() => {
        expect(send).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'parqet/get_performance', entry_id: 'entry1' }),
        );
      });
    });

    it('uses default_interval from config on initial load', async () => {
      const send = makeSendMessage();
      const view = new PerformanceView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig({ default_interval: '1d' });

      view.connectedCallback();

      await vi.waitFor(() => {
        expect(send).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'parqet/get_performance',
            entry_id: 'entry1',
            interval: '1d',
          }),
        );
      });
    });

    it('defaults to 1y interval when no config interval provided', async () => {
      const send = makeSendMessage();
      const view = new PerformanceView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig();

      view.connectedCallback();

      await vi.waitFor(() => {
        expect(send).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'parqet/get_performance',
            interval: '1y',
          }),
        );
      });
    });

    it('populates _wsData after successful WS call', async () => {
      const perf = makePerformance();
      const send = makeSendMessage(perf);
      const view = new PerformanceView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig();

      view.connectedCallback();

      await vi.waitFor(() => {
        expect(view._wsData).not.toBeNull();
      });
      expect(view._wsData).toEqual(perf);
    });
  });

  describe('portfolio change', () => {
    it('reloads when portfolio property changes', async () => {
      const send = makeSendMessage();
      const view = new PerformanceView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio('entry1');
      view.config = makeConfig();

      view.connectedCallback();
      await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));

      // Simulate portfolio property change via updated()
      view.portfolio = makePortfolio('entry2');
      view.updated(new Map([['portfolio', makePortfolio('entry1')]]));

      await vi.waitFor(() => {
        expect(send).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'parqet/get_performance', entry_id: 'entry2' }),
        );
      });
    });
  });

  describe('interval change', () => {
    it('fetches with new interval when interval changes', async () => {
      const send = makeSendMessage();
      const view = new PerformanceView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig({ default_interval: '1y' });

      view.connectedCallback();
      await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));

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
  });

  describe('error handling', () => {
    it('sets _error and clears _wsData when WS call fails', async () => {
      const send = vi.fn().mockRejectedValue(new Error('WS error'));
      const view = new PerformanceView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig();

      view.connectedCallback();

      await vi.waitFor(() => {
        expect(view._error).toBeTruthy();
      });
      expect(view._wsData).toBeNull();
    });

    it('clears error on retry', async () => {
      const send = vi.fn()
        .mockRejectedValueOnce(new Error('first'))
        .mockResolvedValue({ performance: makePerformance() });
      const view = new PerformanceView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig();

      view.connectedCallback();
      await vi.waitFor(() => expect(view._error).toBeTruthy());

      await view._onIntervalChange(
        new CustomEvent('interval-change', { detail: { interval: '1y' } }),
      );

      expect(view._error).toBe('');
      expect(view._wsData).not.toBeNull();
    });
  });

  describe('race condition protection', () => {
    it('discards stale response when a newer interval is selected', async () => {
      let resolveFirst!: (v: unknown) => void;
      const slowResponse = new Promise((r) => { resolveFirst = r; });
      const fastPerf = makePerformance({ valuation: { atIntervalStart: 999, atIntervalEnd: 888 } });

      const send = vi.fn().mockImplementation((msg: Record<string, unknown>) => {
        if (msg.interval === '1d') return slowResponse;
        return Promise.resolve({ performance: fastPerf });
      });

      const view = new PerformanceView();
      view.hass = makeHass(send);
      view.portfolio = makePortfolio();
      view.config = makeConfig({ default_interval: '1d' });

      view.connectedCallback();

      // Wait for initial (slow) call to start
      await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));

      // Fire second interval change (fast) before first resolves
      const secondChange = view._onIntervalChange(
        new CustomEvent('interval-change', { detail: { interval: '1y' } }),
      );
      await secondChange;

      // Now resolve the slow first response — should be discarded
      resolveFirst({ performance: makePerformance({ valuation: { atIntervalStart: 0, atIntervalEnd: 1 } }) });
      // Flush microtasks
      await Promise.resolve();

      // _wsData should be from the second (fast) response, not the first (slow)
      expect(view._wsData?.valuation.atIntervalEnd).toBe(888);
    });
  });
});
