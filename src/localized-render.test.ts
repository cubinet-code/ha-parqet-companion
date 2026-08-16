import { afterEach, describe, expect, it, vi } from 'vitest';

import { ParqetPerformanceView } from './views/performance-view';
import { ParqetHoldingsView } from './views/holdings-view';
import { ParqetSnapshotCard } from './parqet-snapshot-card';
import { ParqetActivitiesView } from './views/activities-view';
import { ParqetCompanionCard } from './parqet-card';
import { fmtDate } from './utils';
import { ParqetDonutChart } from './components/donut-chart';
import { ParqetIntervalSelector } from './components/interval-selector';
import { ParqetLoadingSpinner } from './components/loading-spinner';
import { ParqetPortfolioSelector } from './components/portfolio-selector';
import type {
  DiscoveredPortfolio,
  Hass,
  Holding,
  ParqetCardConfig,
  PortfolioPerformance,
} from './types';

const hass: Hass = {
  locale: { language: 'de-DE' },
  states: {},
  connection: { sendMessagePromise: vi.fn() },
};

const portfolio: DiscoveredPortfolio = {
  entryId: 'entry-1',
  portfolioId: 'portfolio-1',
  name: 'Depot',
  entityPrefix: null,
  sensors: {},
};

const performance: PortfolioPerformance = {
  kpis: { inInterval: { xirr: 8, ttwror: 7 } },
  fees: { inInterval: { fees: 5 } },
  taxes: { inInterval: { taxes: 3 } },
  unrealizedGains: {
    inInterval: { gainGross: 500, gainNet: 450, returnGross: 10, returnNet: 9 },
  },
  realizedGains: {
    inInterval: { gainGross: 100, gainNet: 90, returnGross: 2, returnNet: 1.8 },
  },
  dividends: {
    inInterval: { gainGross: 20, gainNet: 17, taxes: 3, fees: 0 },
  },
  valuation: { atIntervalStart: 5000, atIntervalEnd: 5500 },
};

const holding: Holding = {
  id: 'holding-1',
  nickname: null,
  logo: null,
  asset: { name: 'Beispiel AG', type: 'stock' },
  position: {
    shares: 10,
    purchasePrice: 500,
    purchaseValue: 5000,
    currentPrice: 550,
    currentValue: 5500,
    isSold: false,
  },
  performance,
  activityCount: 1,
  earliestActivityDate: '2025-01-01',
};

const config: ParqetCardConfig = {
  type: 'custom:parqet-companion-card',
  show_interval_selector: false,
  show_performance_chart: false,
  show_allocation_chart: false,
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('German dashboard rendering', () => {
  it('renders German accessibility labels for shared card components', async () => {
    const donut = new ParqetDonutChart();
    donut.hass = hass;
    donut.segments = [{ label: 'Beispiel AG', value: 100, color: '#009991' }];

    const intervals = new ParqetIntervalSelector();
    intervals.hass = hass;

    const spinner = new ParqetLoadingSpinner();
    spinner.hass = hass;

    const selector = new ParqetPortfolioSelector();
    selector.hass = hass;
    selector.portfolios = [{ id: 'portfolio-1', name: 'Depot', currency: 'EUR' }];

    document.body.append(donut, intervals, spinner, selector);
    await Promise.all([
      donut.updateComplete,
      intervals.updateComplete,
      spinner.updateComplete,
      selector.updateComplete,
    ]);

    expect(donut.shadowRoot?.querySelector('svg')?.getAttribute('aria-label'))
      .toBe('Diagramm zur Portfolioaufteilung');
    expect(intervals.shadowRoot?.querySelector('[role="group"]')?.getAttribute('aria-label'))
      .toBe('Zeitraum');
    expect(spinner.shadowRoot?.querySelector('[role="status"]')?.getAttribute('aria-label'))
      .toBe('Wird geladen');
    expect(selector.shadowRoot?.querySelector('select')?.getAttribute('aria-label'))
      .toBe('Portfolio auswählen');
  });

  it('labels the main portfolio selector in German', async () => {
    const card = new ParqetCompanionCard();
    card.hass = hass;
    card.setConfig({ type: 'custom:parqet-companion-card' });
    Object.assign(card, {
      _discoveryRan: true,
      _lastEntities: hass.entities,
      _portfolios: [
        portfolio,
        { ...portfolio, portfolioId: 'portfolio-2', name: 'Zweites Depot' },
      ],
      _selectedIndex: 0,
    });
    document.body.append(card);

    await card.updateComplete;
    const selector = card.shadowRoot?.querySelector('.portfolio-select');

    expect(selector?.getAttribute('aria-label')).toBe('Portfolio auswählen');
  });

  it('falls back to the original value for invalid dates', () => {
    expect(fmtDate('not-a-date', 'de-DE')).toBe('not-a-date');

    const card = new ParqetSnapshotCard();
    card.hass = hass;
    expect((card as unknown as { _fmtSnapshot(value: string): string })
      ._fmtSnapshot('also-not-a-date')).toBe('also-not-a-date');
  });

  it('renders German performance labels from the Home Assistant locale', async () => {
    const view = new ParqetPerformanceView();
    view.hass = hass;
    view.portfolio = portfolio;
    view.config = config;
    view.perfData = performance;
    document.body.append(view);

    await view.updateComplete;
    const text = view.shadowRoot?.textContent ?? '';

    expect(text).toContain('Gesamtwert');
    expect(text).toContain('Unrealisierter Gewinn');
    expect(text).toContain('Gebühren');
  });

  it('renders German holdings table labels', async () => {
    const view = new ParqetHoldingsView();
    view.hass = hass;
    view.portfolio = portfolio;
    view.config = config;
    view.holdingsData = [holding];
    document.body.append(view);

    await view.updateComplete;
    const text = view.shadowRoot?.textContent ?? '';

    expect(text).toContain('Wert');
    expect(text).toContain('G/V');
    expect(text).toContain('Anteil');
  });

  it('renders German snapshot labels', async () => {
    const card = new ParqetSnapshotCard();
    card.hass = hass;
    card._portfolio = portfolio;
    card._data = {
      snapshot_date: '2026-08-15',
      snapshot_taken_at: '2026-08-15T22:00:00Z',
      holdings: [{
        id: 'holding-1',
        name: 'Beispiel AG',
        logo: null,
        shares: 10,
        current_price: 550,
        current_value: 5500,
        snapshot_price: 540,
        snapshot_value: 5400,
        daily_pl: 100,
        daily_pl_pct: 1.85,
        weight: 100,
      }],
      total_value: 5500,
      total_snapshot_value: 5400,
      total_daily_pl: 100,
      total_daily_pl_pct: 1.85,
    };
    document.body.append(card);

    await card.updateComplete;
    const text = card.shadowRoot?.textContent ?? '';

    expect(text).toContain('Gesamt');
    expect(text).toContain('Tages-G/V');
    expect(text).toContain('Anteil');
  });

  it('renders German activity filters and transaction details', async () => {
    const activityHass: Hass = {
      locale: { language: 'de-DE' },
      states: {},
      connection: {
        sendMessagePromise: vi.fn().mockImplementation(
          (message: Record<string, unknown>) => message.type === 'parqet/get_holdings'
            ? Promise.resolve({ holdings: [] })
            : Promise.resolve({
              activities: [{
                id: 'activity-1',
                type: 'buy',
                holdingId: 'holding-1',
                holdingAssetType: 'stock',
                asset: { name: 'Beispiel AG', type: 'stock' },
                shares: 2,
                price: 100,
                amount: 200,
                currency: 'EUR',
                datetime: '2026-08-15T10:00:00Z',
                tax: 1,
                fee: 2,
              }, {
                id: 'activity-2',
                type: 'staking_reward',
                holdingId: 'holding-2',
                holdingAssetType: 'crypto',
                asset: { name: 'Beispiel Coin', type: 'crypto' },
                amount: 5,
                currency: 'EUR',
                datetime: '2026-08-15T11:00:00Z',
              }],
              cursor: null,
            }),
        ),
      },
    };
    const view = new ParqetActivitiesView();
    view.hass = activityHass;
    view.portfolio = portfolio;
    view.config = config;
    document.body.append(view);

    await new Promise((resolve) => setTimeout(resolve, 0));
    await view.updateComplete;
    const text = view.shadowRoot?.textContent ?? '';

    expect(text).toContain('Alle');
    expect(text).toContain('Kauf');
    expect(text).toContain('Steuer');
    expect(text).toContain('Gebühr');
    expect(text).toContain('staking reward');
  });
});
