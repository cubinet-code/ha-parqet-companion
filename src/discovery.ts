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

import type { Hass, DiscoveredPortfolio, HassEntity, HassDeviceRegistryEntry } from './types';
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

function isCombinedDevice(device?: HassDeviceRegistryEntry): boolean {
  return !!device?.identifiers?.some(
    ([domain, value]) => domain === 'parqet' && value === 'combined_accounts',
  );
}

function _discoverViaRegistry(hass: Hass, deviceId?: string): DiscoveredPortfolio[] {
  const configuredDevice = deviceId ? hass.devices?.[deviceId] : undefined;
  const configuredDeviceIsCombined = isCombinedDevice(configuredDevice);

  // Group parqet entities by device_id. If the card was explicitly configured
  // for the virtual "Parqet Combined" device, keep that device and route card
  // requests through the integration's combined WebSocket handlers. The
  // combined sensors expose source_entry_ids instead of a single entry_id.
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
    const device = hass.devices?.[devId];
    if (!configuredDeviceIsCombined && isCombinedDevice(device)) continue;
    const name = device?.name ?? devId;

    // Device identifier is (parqet, portfolio_id) — this is the v2 mapping
    // from device → portfolio. Falls back to state attributes if the device
    // registry isn't available or the identifiers are atypical.
    let portfolioId: string | null = null;
    for (const [domain, value] of device?.identifiers ?? []) {
      if (domain === 'parqet' && value) {
        portfolioId = value;
        break;
      }
    }

    // Build sensors dict using English keys derived from unique_id
    const sensors: Record<string, HassEntity> = {};
    let entryId: string | null = null;

    for (const { entity_id, unique_id } of entries) {
      const state = hass.states[entity_id];
      if (!state) continue;

      // Get entry_id from state attributes. Combined sensors expose the source
      // entry IDs as an array; any loaded entry can authorize the combined WS
      // request because the backend aggregates across loaded Parqet entries.
      if (!entryId && state.attributes?.['entry_id']) {
        entryId = state.attributes['entry_id'] as string;
      }
      if (!entryId && Array.isArray(state.attributes?.['source_entry_ids'])) {
        entryId = state.attributes['source_entry_ids'][0] as string;
      }
      if (!portfolioId && state.attributes?.['portfolio_id']) {
        portfolioId = state.attributes['portfolio_id'] as string;
      }

      // Derive the English sensor key from unique_id (never translated)
      if (unique_id) {
        const key = sensorKeyFromUniqueId(unique_id);
        if (key) {
          sensors[key] = state;
        }
      }
    }

    if (!entryId || !portfolioId) continue; // Need both to route WS calls

    portfolios.push({
      entryId,
      portfolioId,
      name,
      entityPrefix: null,
      sensors,
    });
  }

  return portfolios;
}

// deviceId filtering is not supported in the fallback path — no entity registry
// means no device information is available. All portfolios are returned.
function _discoverViaStateScan(hass: Hass, _deviceId?: string): DiscoveredPortfolio[] {
  const portfolioMap = new Map<string, DiscoveredPortfolio>();
  const prefixLen = '_total_value'.length;

  for (const [entityId, entity] of Object.entries(hass.states)) {
    if (!entityId.startsWith('sensor.') || !entityId.includes('_total_value')) continue;

    const attrs = entity.attributes as Record<string, unknown>;
    const prefix = entityId.slice(0, entityId.length - prefixLen);

    // Build sensors dict (keys from entity ID suffix — may be translated, but
    // this is the best we can do without the entity registry)
    const prefixUnderscore = prefix + '_';
    const sensors: Record<string, HassEntity> = {};
    for (const [sid, sentity] of Object.entries(hass.states)) {
      if (sid.startsWith(prefixUnderscore)) {
        sensors[sid.slice(prefixUnderscore.length)] = sentity;
      }
    }

    if (Object.keys(sensors).length < 3) continue;

    const entryId = (attrs['entry_id'] as string) || prefix;
    const portfolioId = (attrs['portfolio_id'] as string) || prefix;
    const name = (prefix.replace('sensor.', '') || 'Portfolio')
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    portfolioMap.set(prefix, {
      entryId,
      portfolioId,
      name,
      entityPrefix: prefix,
      sensors,
    });
  }

  return Array.from(portfolioMap.values());
}
