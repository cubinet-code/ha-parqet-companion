import { describe, it, expect } from 'vitest';
import { sensorKeyFromUniqueId } from './const';
import { discoverPortfolios } from './discovery';
import type { Hass, HassEntity } from './types';

// ─── sensorKeyFromUniqueId ────────────────────────────────────────────────────

describe('sensorKeyFromUniqueId', () => {
  it('extracts total_value key', () => {
    expect(sensorKeyFromUniqueId('abc123_total_value')).toBe('total_value');
  });

  it('extracts xirr key', () => {
    expect(sensorKeyFromUniqueId('abc123_xirr')).toBe('xirr');
  });

  it('extracts compound key like unrealized_gain_net', () => {
    expect(sensorKeyFromUniqueId('abc123_unrealized_gain_net')).toBe('unrealized_gain_net');
  });

  it('returns null for unknown suffix', () => {
    expect(sensorKeyFromUniqueId('abc123_gesamtwert')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(sensorKeyFromUniqueId('')).toBeNull();
  });
});

// ─── discoverPortfolios ───────────────────────────────────────────────────────

function makeState(overrides: Partial<HassEntity> = {}): HassEntity {
  return {
    entity_id: 'sensor.retirement_total_value',
    state: '100000',
    attributes: { entry_id: 'entry_abc', friendly_name: 'Retirement Total value' },
    last_changed: '2026-01-01T00:00:00Z',
    last_updated: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('discoverPortfolios', () => {
  it('discovers portfolio by platform parqet using unique_id', () => {
    const hass: Hass = {
      states: {
        'sensor.retirement_total_value': makeState({
          entity_id: 'sensor.retirement_total_value',
          attributes: { entry_id: 'entry_abc', friendly_name: 'Retirement Gesamtwert' },
        }),
        'sensor.retirement_xirr': makeState({
          entity_id: 'sensor.retirement_xirr',
          state: '5.2',
          attributes: { entry_id: 'entry_abc', friendly_name: 'Retirement XIRR' },
        }),
      },
      devices: {
        'device_1': { id: 'device_1', name: 'Retirement', identifiers: [['parqet', 'portfolio_123']] },
      },
      entities: {
        'sensor.retirement_total_value': {
          entity_id: 'sensor.retirement_total_value',
          device_id: 'device_1',
          platform: 'parqet',
          unique_id: 'portfolio_123_total_value',
        },
        'sensor.retirement_xirr': {
          entity_id: 'sensor.retirement_xirr',
          device_id: 'device_1',
          platform: 'parqet',
          unique_id: 'portfolio_123_xirr',
        },
      },
      connection: { sendMessagePromise: async () => ({}) },
    };

    const portfolios = discoverPortfolios(hass);
    expect(portfolios).toHaveLength(1);
    expect(portfolios[0].name).toBe('Retirement');
    expect(portfolios[0].entryId).toBe('entry_abc');
  });

  it('builds sensors dict with English keys regardless of entity ID language', () => {
    // German entity IDs — sensor names are translated
    const hass: Hass = {
      states: {
        'sensor.scalable_gesamtwert': makeState({
          entity_id: 'sensor.scalable_gesamtwert',
          state: '200000',
          attributes: { entry_id: 'entry_de', friendly_name: 'Scalable Gesamtwert' },
        }),
        'sensor.scalable_xirr': makeState({
          entity_id: 'sensor.scalable_xirr',
          state: '7.1',
          attributes: { entry_id: 'entry_de', friendly_name: 'Scalable XIRR' },
        }),
      },
      devices: {
        'device_de': { id: 'device_de', name: 'Scalable', identifiers: [['parqet', 'portfolio_de']] },
      },
      entities: {
        'sensor.scalable_gesamtwert': {
          entity_id: 'sensor.scalable_gesamtwert',
          device_id: 'device_de',
          platform: 'parqet',
          unique_id: 'portfolio_de_total_value',  // unique_id is always English
        },
        'sensor.scalable_xirr': {
          entity_id: 'sensor.scalable_xirr',
          device_id: 'device_de',
          platform: 'parqet',
          unique_id: 'portfolio_de_xirr',
        },
      },
      connection: { sendMessagePromise: async () => ({}) },
    };

    const portfolios = discoverPortfolios(hass);
    expect(portfolios).toHaveLength(1);

    // Keys must be English regardless of translated entity IDs
    expect(portfolios[0].sensors['total_value']).toBeDefined();
    expect(portfolios[0].sensors['xirr']).toBeDefined();
    // Old German-derived key must NOT exist
    expect(portfolios[0].sensors['gesamtwert']).toBeUndefined();
  });

  it('filters to configured device_id when provided', () => {
    const hass: Hass = {
      states: {
        'sensor.retirement_total_value': makeState({ entity_id: 'sensor.retirement_total_value', attributes: { entry_id: 'entry_r' } }),
        'sensor.crypto_total_value': makeState({ entity_id: 'sensor.crypto_total_value', attributes: { entry_id: 'entry_c' } }),
      },
      devices: {
        'device_r': { id: 'device_r', name: 'Retirement', identifiers: [['parqet', 'p1']] },
        'device_c': { id: 'device_c', name: 'Crypto', identifiers: [['parqet', 'p2']] },
      },
      entities: {
        'sensor.retirement_total_value': { entity_id: 'sensor.retirement_total_value', device_id: 'device_r', platform: 'parqet', unique_id: 'p1_total_value' },
        'sensor.crypto_total_value': { entity_id: 'sensor.crypto_total_value', device_id: 'device_c', platform: 'parqet', unique_id: 'p2_total_value' },
      },
      connection: { sendMessagePromise: async () => ({}) },
    };

    const portfolios = discoverPortfolios(hass, 'device_r');
    expect(portfolios).toHaveLength(1);
    expect(portfolios[0].name).toBe('Retirement');
  });

  it('returns empty array when no parqet entities found', () => {
    const hass: Hass = {
      states: {},
      entities: { 'sensor.other': { entity_id: 'sensor.other', device_id: 'd1', platform: 'other' } },
      connection: { sendMessagePromise: async () => ({}) },
    };
    expect(discoverPortfolios(hass)).toEqual([]);
  });

  it('falls back to _total_value scan when hass.entities unavailable', () => {
    // Older HA versions without entity registry
    const hass: Hass = {
      states: {
        'sensor.retirement_total_value': makeState({
          entity_id: 'sensor.retirement_total_value',
          attributes: { entry_id: 'entry_fallback' },
        }),
        'sensor.retirement_xirr': makeState({ entity_id: 'sensor.retirement_xirr', attributes: { entry_id: 'entry_fallback' } }),
        'sensor.retirement_ttwror': makeState({ entity_id: 'sensor.retirement_ttwror', attributes: { entry_id: 'entry_fallback' } }),
      },
      connection: { sendMessagePromise: async () => ({}) },
    };

    const portfolios = discoverPortfolios(hass);
    expect(portfolios).toHaveLength(1);
    expect(portfolios[0].entryId).toBe('entry_fallback');
  });
});
