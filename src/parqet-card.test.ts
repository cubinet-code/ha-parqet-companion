import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiscoveredPortfolio, Hass } from './types';

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
  property: () => () => undefined,
  state: () => () => undefined,
}));
vi.mock('./diagnostics-frontend', () => ({ registerElement: vi.fn() }));
vi.mock('./components/loading-spinner', () => ({}));
vi.mock('./views/performance-view', () => ({}));
vi.mock('./views/holdings-view', () => ({}));
vi.mock('./views/activities-view', () => ({}));
vi.mock('./parqet-snapshot-card', () => ({}));

const BACKEND_COMBINED_RESPONSE = {
  performance: {
    fees: { inInterval: { fees: 2 } },
    taxes: { inInterval: { taxes: 4 } },
    unrealizedGains: { inInterval: { gainGross: 30, gainNet: 28 } },
    realizedGains: { inInterval: { gainGross: 6, gainNet: 4 } },
    dividends: { inInterval: { gainGross: 12, gainNet: 10, taxes: 2, fees: 0 } },
    valuation: { atIntervalStart: 0, atIntervalEnd: 300 },
  },
  holdings: [],
};

describe('ParqetCompanionCard combined routing', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Card: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./parqet-card');
    Card = mod.ParqetCompanionCard;
  });

  it('routes multi-account aggregation through the backend without inventing returns', async () => {
    const sendMessagePromise = vi.fn().mockResolvedValue(BACKEND_COMBINED_RESPONSE);
    const hass: Hass = {
      states: {
        'sensor.parqet_combined_total_value': {
          entity_id: 'sensor.parqet_combined_total_value',
          state: '300',
          attributes: {
            entry_id: 'entry_combined',
            portfolio_id: 'combined_accounts',
            source_entry_ids: ['entry_a', 'entry_b'],
          },
          last_changed: '2026-01-01T00:00:00Z',
          last_updated: '2026-01-01T00:00:00Z',
        },
      },
      devices: {
        device_combined: {
          id: 'device_combined',
          name: 'Parqet Combined',
          identifiers: [['parqet', 'combined_accounts']],
        },
      },
      entities: {
        'sensor.parqet_combined_total_value': {
          entity_id: 'sensor.parqet_combined_total_value',
          device_id: 'device_combined',
          platform: 'parqet',
          unique_id: 'combined_accounts_total_value',
        },
      },
      connection: { sendMessagePromise },
    };
    const portfolios: DiscoveredPortfolio[] = [
      {
        entryId: 'entry_a',
        portfolioId: 'p1',
        name: 'First',
        entityPrefix: null,
        sensors: {},
      },
      {
        entryId: 'entry_b',
        portfolioId: 'p2',
        name: 'Second',
        entityPrefix: null,
        sensors: {},
      },
      {
        entryId: 'entry_c',
        portfolioId: 'p3',
        name: 'Unselected third account',
        entityPrefix: null,
        sensors: {},
      },
    ];
    const card = new Card();
    card.hass = hass;
    card._portfolios = portfolios;
    card._interval = '1y';
    const portfolio = card._allPortfoliosProxy();
    expect(portfolio.name).toBe('Parqet Combined');

    const result = await card._fetchPerformanceAndHoldings(portfolio);

    expect(sendMessagePromise).toHaveBeenCalledTimes(1);
    expect(sendMessagePromise).toHaveBeenCalledWith(expect.objectContaining({
      type: 'parqet/get_performance',
      entry_id: 'entry_combined',
      portfolio_id: 'combined_accounts',
    }));
    expect(result.performance.unrealizedGains.inInterval).not.toHaveProperty('returnGross');
    expect(result.performance.realizedGains.inInterval).not.toHaveProperty('returnNet');

    // Deleting the Combined entry does not change `_portfolios` (the Combined
    // device is never part of it), so the cached proxy must not keep routing
    // requests to the now-dead Combined entry.
    delete hass.devices!['device_combined'];
    delete hass.entities!['sensor.parqet_combined_total_value'];
    delete hass.states['sensor.parqet_combined_total_value'];

    const afterRemoval = card._allPortfoliosProxy();
    expect(afterRemoval.portfolioId).toBe('__all__');
    expect(afterRemoval.entryId).not.toBe('entry_combined');
  });
});
