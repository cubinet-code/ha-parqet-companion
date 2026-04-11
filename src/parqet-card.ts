/**
 * Parqet Companion Card for Home Assistant
 * Reads portfolio data from HA sensor entities and WebSocket API.
 */

import { LitElement, html, css, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { Hass, ParqetCardConfig, ViewType, DiscoveredPortfolio, HassEntity } from './types';
import { DOMAIN } from './const';

import './components/loading-spinner';
import './views/performance-view';
import './views/holdings-view';
import './views/activities-view';
import './parqet-snapshot-card';

// ─── Card registration ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;
w['customCards'] = w['customCards'] || [];
if (!w['customCards'].some((c: { type: string }) => c.type === 'parqet-companion-card')) {
  w['customCards'].push({
    type: 'parqet-companion-card',
    name: 'Parqet Companion',
    description: 'Display your Parqet portfolio data — performance, holdings and activities.',
    preview: true,
    documentationURL: 'https://github.com/cubinet-code/ha-parqet-companion',
  });
}

// ─── Card element ─────────────────────────────────────────────────────────────

export class ParqetCompanionCard extends LitElement {
  @property({ attribute: false }) hass!: Hass;
  @state() private _config!: ParqetCardConfig;
  @state() private _portfolios: DiscoveredPortfolio[] = [];
  @state() private _selectedIndex = 0;
  @state() private _activeView: ViewType = 'performance';

  // ─── HA card API ──────────────────────────────────────────────────────────

  setConfig(config: ParqetCardConfig): void {
    this._config = {
      default_view: 'performance',
      default_interval: '1y',
      show_interval_selector: true,
      show_performance_chart: true,
      show_allocation_chart: true,
      show_logo: true,
      compact: false,
      currency_symbol: '€',
      activities_limit: 25,
      ...config,
    };
    this._activeView = this._config.default_view!;
  }

  getCardSize(): number {
    return 6;
  }

  static getConfigForm() {
    return {
      schema: [
        // ── General ──
        {
          name: 'device_id',
          selector: {
            device: {
              integration: 'parqet',
            },
          },
        },
        {
          name: 'default_view',
          selector: {
            select: {
              options: [
                { value: 'performance', label: 'Performance' },
                { value: 'holdings', label: 'Holdings' },
                { value: 'activities', label: 'Activities' },
              ],
            },
          },
        },
        {
          name: 'currency_symbol',
          selector: { text: {} },
        },
        // ── Performance ──
        {
          name: '',
          type: 'expandable' as const,
          title: 'Performance',
          icon: 'mdi:chart-line',
          schema: [
            {
              name: 'default_interval',
              selector: {
                select: {
                  options: [
                    { value: '1d', label: '1 Day' },
                    { value: '1w', label: '1 Week' },
                    { value: 'mtd', label: 'Month to Date' },
                    { value: '1m', label: '1 Month' },
                    { value: '3m', label: '3 Months' },
                    { value: '6m', label: '6 Months' },
                    { value: '1y', label: '1 Year' },
                    { value: 'ytd', label: 'Year to Date' },
                    { value: '3y', label: '3 Years' },
                    { value: '5y', label: '5 Years' },
                    { value: '10y', label: '10 Years' },
                    { value: 'max', label: 'Maximum' },
                  ],
                },
              },
            },
            {
              name: 'show_interval_selector',
              selector: { boolean: {} },
            },
            {
              name: 'show_performance_chart',
              selector: { boolean: {} },
            },
          ],
        },
        // ── Holdings ──
        {
          name: '',
          type: 'expandable' as const,
          title: 'Holdings',
          icon: 'mdi:chart-donut',
          schema: [
            {
              name: 'holdings_limit',
              selector: { number: { min: 1, max: 200, mode: 'box' } },
            },
            {
              name: 'show_allocation_chart',
              selector: { boolean: {} },
            },
            {
              name: 'show_logo',
              selector: { boolean: {} },
            },
          ],
        },
        // ── Activities ──
        {
          name: '',
          type: 'expandable' as const,
          title: 'Activities',
          icon: 'mdi:format-list-bulleted',
          schema: [
            {
              name: 'activities_limit',
              selector: { number: { min: 1, max: 500, mode: 'box' } },
            },
          ],
        },
        // ── Layout ──
        {
          name: '',
          type: 'expandable' as const,
          title: 'Layout',
          icon: 'mdi:page-layout-body',
          schema: [
            {
              name: 'compact',
              selector: { boolean: {} },
            },
            {
              name: 'hide_header',
              selector: { boolean: {} },
            },
          ],
        },
      ],
      computeLabel: (schema: { name: string }) => {
        const labels: Record<string, string> = {
          device_id: 'Portfolio (leave empty for auto-detect)',
          default_view: 'Default View',
          default_interval: 'Default Interval',
          currency_symbol: 'Currency Symbol',
          holdings_limit: 'Holdings Limit',
          activities_limit: 'Activities Limit',
          show_interval_selector: 'Show Interval Selector',
          show_performance_chart: 'Show Performance Chart',
          show_allocation_chart: 'Show Allocation Chart',
          show_logo: 'Show Holding Logos',
          compact: 'Compact Mode',
          hide_header: 'Hide Header',
        };
        return labels[schema.name] ?? schema.name;
      },
    };
  }

  static getStubConfig(): Partial<ParqetCardConfig> {
    return {
      default_view: 'performance',
      default_interval: '1y',
      show_performance_chart: true,
      show_allocation_chart: true,
      show_interval_selector: true,
      show_logo: true,
      compact: false,
      hide_header: false,
      currency_symbol: '€',
      activities_limit: 25,
    };
  }

  // ─── Entity discovery ─────────────────────────────────────────────────────

  updated(changed: PropertyValues) {
    if (changed.has('hass')) {
      this._discoverPortfolios();
    }
  }

  private _discoverPortfolios() {
    if (!this.hass?.states) return;

    // Index entity registry by entity_id for O(1) lookups below.
    const entityRegistry = this.hass.entities
      ? new Map(Object.values(this.hass.entities).map((e) => [e.entity_id, e]))
      : null;

    let deviceEntityIds: Set<string> | null = null;
    const configuredDeviceId = this._config?.device_id;
    if (configuredDeviceId && entityRegistry) {
      deviceEntityIds = new Set<string>();
      for (const entry of entityRegistry.values()) {
        if (entry.device_id === configuredDeviceId) {
          deviceEntityIds.add(entry.entity_id);
        }
      }
    }

    // Legacy: support old configs that used an entity selector.
    let legacyPrefix: string | null = null;
    if (!configuredDeviceId && this._config?.entity) {
      const parts = this._config.entity.replace('sensor.', '').split('_');
      for (let i = parts.length; i > 0; i--) {
        const candidate = 'sensor.' + parts.slice(0, i).join('_');
        if (this.hass.states[candidate + '_total_value']) {
          legacyPrefix = candidate;
          break;
        }
      }
    }

    const portfolioMap = new Map<string, DiscoveredPortfolio>();

    for (const [entityId, entity] of Object.entries(this.hass.states)) {
      if (!entityId.startsWith('sensor.') || !entityId.includes('_total_value')) continue;

      const attrs = entity.attributes as Record<string, unknown>;
      const prefix = entityId.replace('_total_value', '');

      if (deviceEntityIds && !deviceEntityIds.has(entityId)) continue;
      if (legacyPrefix && prefix !== legacyPrefix) continue;

      // Prefer the device name from the registry over deriving from entity ID.
      let name: string | null = null;
      const regEntry = entityRegistry?.get(entityId);
      if (regEntry?.device_id && this.hass.devices) {
        name = this.hass.devices[regEntry.device_id]?.name ?? null;
      }
      if (!name) {
        name = (prefix.replace('sensor.', '') || 'Portfolio')
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }

      const sensors: Record<string, HassEntity> = {};
      for (const [sid, sentity] of Object.entries(this.hass.states)) {
        if (sid.startsWith(prefix + '_')) {
          const key = sid.replace(prefix + '_', '');
          sensors[key] = sentity;
        }
      }

      if (Object.keys(sensors).length >= 3) {
        const entryId = (attrs['entry_id'] as string) || prefix;
        portfolioMap.set(prefix, {
          entryId,
          name,
          entityPrefix: prefix,
          sensors,
        });
      }
    }

    const discovered = Array.from(portfolioMap.values());
    if (JSON.stringify(discovered.map((p) => p.entityPrefix)) !==
        JSON.stringify(this._portfolios.map((p) => p.entityPrefix))) {
      this._portfolios = discovered;
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  render() {
    if (!this._portfolios.length) {
      return html`
        <ha-card>
          <div class="empty">
            <span>No Parqet portfolios found</span>
            <span class="hint">Add the Parqet Companion integration first</span>
          </div>
        </ha-card>
      `;
    }

    const portfolio = this._portfolios[this._selectedIndex] || this._portfolios[0];
    const showTabs = true;
    const views: ViewType[] = ['performance', 'holdings', 'activities'];

    return html`
      <ha-card>
        ${!this._config?.hide_header ? html`
          <div class="card-header">
            ${this._portfolios.length > 1 ? html`
              <select class="portfolio-select" @change=${this._onPortfolioChange}>
                ${this._portfolios.map((p, i) => html`
                  <option value=${i} ?selected=${i === this._selectedIndex}>${p.name}</option>
                `)}
              </select>
            ` : html`<span class="portfolio-name">${portfolio.name}</span>`}
          </div>
        ` : ''}

        ${showTabs ? html`
          <div class="tabs" role="tablist">
            ${views.map((v) => html`
              <button
                class="tab ${this._activeView === v ? 'active' : ''}"
                role="tab"
                aria-selected=${this._activeView === v}
                @click=${() => (this._activeView = v)}
              >
                ${v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            `)}
          </div>
        ` : ''}

        <div class="view-content" role="tabpanel">
          ${this._renderView(portfolio)}
        </div>
      </ha-card>
    `;
  }

  private _renderView(portfolio: DiscoveredPortfolio) {
    if (this._activeView === 'performance') {
      return html`
        <parqet-performance-view
          .hass=${this.hass}
          .portfolio=${portfolio}
          .config=${this._config}
        ></parqet-performance-view>
      `;
    }
    if (this._activeView === 'holdings') {
      return html`
        <parqet-holdings-view
          .hass=${this.hass}
          .portfolio=${portfolio}
          .config=${this._config}
        ></parqet-holdings-view>
      `;
    }
    return html`
      <parqet-activities-view
        .hass=${this.hass}
        .portfolio=${portfolio}
        .config=${this._config}
      ></parqet-activities-view>
    `;
  }

  private _onPortfolioChange(e: Event) {
    this._selectedIndex = parseInt((e.target as HTMLSelectElement).value, 10);
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  static styles = css`
    :host { display: block; overflow: hidden; min-width: 0; height: 100%; }
    ha-card { display: flex; flex-direction: column; overflow: hidden; height: 100%; }
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--divider-color, #e0e0e0); min-height: 48px;
    }
    .portfolio-name { font-weight: 600; font-size: 1rem; color: var(--primary-text-color); }
    .portfolio-select {
      width: 100%; padding: 6px 10px; border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px; background: var(--card-background-color, #fff);
      color: var(--primary-text-color); font-size: 0.875rem; cursor: pointer;
    }
    .tabs { display: flex; border-bottom: 1px solid var(--divider-color, #e0e0e0); }
    .tab {
      flex: 1; padding: 10px 4px; background: none; border: none;
      border-bottom: 2px solid transparent; cursor: pointer;
      color: var(--secondary-text-color); font-size: 0.875rem; font-weight: 500;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab.active { color: var(--primary-color, #03a9f4); border-bottom-color: var(--primary-color, #03a9f4); }
    .tab:hover:not(.active) { color: var(--primary-text-color); }
    .view-content { flex: 1; min-height: 0; overflow-y: auto; }
    .empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; padding: 32px; font-size: 0.875rem; color: var(--secondary-text-color);
    }
    .hint { font-size: 0.75rem; opacity: 0.7; }
  `;
}

if (!customElements.get('parqet-companion-card')) {
  customElements.define('parqet-companion-card', ParqetCompanionCard);
}
