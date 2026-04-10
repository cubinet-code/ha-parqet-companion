import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Hass, ParqetCardConfig, DiscoveredPortfolio } from './types';

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

vi.mock('./components/loading-spinner', () => ({}));

const MOCK_SNAPSHOT_RESPONSE = {
  snapshot_date: '2026-04-08',
  holdings: [
    {
      id: 'h1',
      name: 'Test Stock',
      logo: null,
      shares: 100,
      current_price: 55.0,
      current_value: 5500.0,
      snapshot_price: 50.0,
      snapshot_value: 5000.0,
      daily_pl: 500.0,
      daily_pl_pct: 10.0,
      weight: 100.0,
    },
  ],
  total_value: 5500.0,
  total_snapshot_value: 5000.0,
  total_daily_pl: 500.0,
  total_daily_pl_pct: 10.0,
};

const NO_SNAPSHOT_RESPONSE = {
  snapshot_date: null,
  holdings: [
    {
      id: 'h1',
      name: 'Test Stock',
      logo: null,
      shares: 100,
      current_price: 55.0,
      current_value: 5500.0,
      snapshot_price: null,
      snapshot_value: null,
      daily_pl: null,
      daily_pl_pct: null,
      weight: 100.0,
    },
  ],
  total_value: 5500.0,
  total_snapshot_value: null,
  total_daily_pl: null,
  total_daily_pl_pct: null,
};

function makeHass(response: unknown = MOCK_SNAPSHOT_RESPONSE): Hass {
  return {
    states: {},
    connection: {
      sendMessagePromise: vi.fn().mockResolvedValue(response),
    },
  };
}

function makePortfolio(): DiscoveredPortfolio {
  return {
    entryId: 'entry1',
    name: 'Test Portfolio',
    entityPrefix: 'sensor.test',
    sensors: {},
  };
}

describe('ParqetSnapshotCard', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let SnapshotCard: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./parqet-snapshot-card');
    SnapshotCard = mod.ParqetSnapshotCard;
  });

  it('fetches snapshot data via parqet/get_snapshot on load', async () => {
    const hass = makeHass();
    const card = new SnapshotCard();
    card.hass = hass;
    card._portfolio = makePortfolio();

    await card._load();

    expect(hass.connection.sendMessagePromise).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'parqet/get_snapshot',
        entry_id: 'entry1',
      }),
    );
  });

  it('stores snapshot data after successful fetch', async () => {
    const hass = makeHass();
    const card = new SnapshotCard();
    card.hass = hass;
    card._portfolio = makePortfolio();

    await card._load();

    expect(card._data).toBeDefined();
    expect(card._data.snapshot_date).toBe('2026-04-08');
    expect(card._data.holdings).toHaveLength(1);
    expect(card._data.total_daily_pl).toBe(500.0);
  });

  it('handles missing snapshot gracefully', async () => {
    const hass = makeHass(NO_SNAPSHOT_RESPONSE);
    const card = new SnapshotCard();
    card.hass = hass;
    card._portfolio = makePortfolio();

    await card._load();

    expect(card._data.snapshot_date).toBeNull();
    expect(card._data.total_daily_pl).toBeNull();
  });

  it('sets error state on WS failure', async () => {
    const hass = makeHass();
    hass.connection.sendMessagePromise = vi.fn().mockRejectedValue(new Error('fail'));
    const card = new SnapshotCard();
    card.hass = hass;
    card._portfolio = makePortfolio();

    await card._load();

    expect(card._error).toBeTruthy();
  });

  it('sets not_enabled state when snapshots are not configured', async () => {
    const hass = makeHass();
    hass.connection.sendMessagePromise = vi.fn().mockRejectedValue({ code: 'not_enabled' });
    const card = new SnapshotCard();
    card.hass = hass;
    card._portfolio = makePortfolio();

    await card._load();

    expect(card._notEnabled).toBe(true);
  });
});
