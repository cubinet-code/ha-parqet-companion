/**
 * Translation-independent portfolio discovery.
 *
 * Uses hass.entities (entity registry) filtered by platform=parqet and
 * unique_id-derived sensor keys, so entity IDs translated by HA don't
 * break discovery or the sensors dict.
 *
 * Falls back to _total_value suffix scan for older HA versions without
 * entity registry access.
 */

import type { Hass, DiscoveredPortfolio, HassEntity } from './types';
import { sensorKeyFromUniqueId } from './const';

/**
 * Discover all Parqet portfolios from HA state, language-independently.
 *
 * @param hass  - The HA object
 * @param deviceId - Optional: limit to one specific device
 */
export function discoverPortfolios(
  hass: Hass,
  deviceId?: string,
): DiscoveredPortfolio[] {
  // Primary path: use entity registry (platform-based, translation-safe)
  if (hass.entities) {
    return _discoverViaRegistry(hass, deviceId);
  }

  // Fallback: older HA without entity registry — scan for _total_value suffix
  return _discoverViaStateScan(hass, deviceId);
}

function _discoverViaRegistry(hass: Hass, deviceId?: string): DiscoveredPortfolio[] {
  // Group parqet entities by device_id
  const deviceGroups = new Map<string, Array<{ entity_id: string; unique_id?: string }>>();

  for (const entry of Object.values(hass.entities!)) {
    if (entry.platform !== 'parqet') continue;
    if (!entry.device_id) continue;
    if (deviceId && entry.device_id !== deviceId) continue;

    if (!deviceGroups.has(entry.device_id)) {
      deviceGroups.set(entry.device_id, []);
    }
    deviceGroups.get(entry.device_id)!.push({
      entity_id: entry.entity_id,
      unique_id: entry.unique_id,
    });
  }

  const portfolios: DiscoveredPortfolio[] = [];

  for (const [devId, entries] of deviceGroups) {
    // Get device name
    const name = hass.devices?.[devId]?.name
      ?? devId;

    // Build sensors dict using English keys derived from unique_id
    const sensors: Record<string, HassEntity> = {};
    let entryId: string | null = null;

    for (const { entity_id, unique_id } of entries) {
      const state = hass.states[entity_id];
      if (!state) continue;

      // Get entry_id from state attributes (set by our integration)
      if (!entryId && state.attributes?.['entry_id']) {
        entryId = state.attributes['entry_id'] as string;
      }

      // Derive the English sensor key from unique_id (never translated)
      if (unique_id) {
        const key = sensorKeyFromUniqueId(unique_id);
        if (key) {
          sensors[key] = state;
        }
      }
    }

    if (!entryId) continue; // Skip devices with no resolvable entry_id

    portfolios.push({
      entryId,
      name,
      entityPrefix: '', // not meaningful with registry-based discovery
      sensors,
    });
  }

  return portfolios;
}

function _discoverViaStateScan(hass: Hass, deviceId?: string): DiscoveredPortfolio[] {
  const portfolioMap = new Map<string, DiscoveredPortfolio>();

  for (const [entityId, entity] of Object.entries(hass.states)) {
    if (!entityId.startsWith('sensor.') || !entityId.includes('_total_value')) continue;

    const attrs = entity.attributes as Record<string, unknown>;
    const prefix = entityId.replace('_total_value', '');

    // Build sensors dict (keys from entity ID suffix — may be translated, but
    // this is the best we can do without the entity registry)
    const sensors: Record<string, HassEntity> = {};
    for (const [sid, sentity] of Object.entries(hass.states)) {
      if (sid.startsWith(prefix + '_')) {
        const key = sid.replace(prefix + '_', '');
        sensors[key] = sentity;
      }
    }

    if (Object.keys(sensors).length < 3) continue;

    const entryId = (attrs['entry_id'] as string) || prefix;
    const name = (prefix.replace('sensor.', '') || 'Portfolio')
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    portfolioMap.set(prefix, { entryId, name, entityPrefix: prefix, sensors });
  }

  return Array.from(portfolioMap.values());
}
