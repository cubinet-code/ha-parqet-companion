/**
 * Parqet Companion Card for Home Assistant
 * Reads portfolio data from HA sensor entities and WebSocket API.
 */

import { registerElement } from './diagnostics-frontend';

import { LitElement, html, css, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { Hass, ParqetCardConfig, ViewType, DiscoveredPortfolio, PortfolioPerformance, Holding } from './types';
import type { IntervalValue } from './const';
import { discoverCombinedPortfolio, discoverPortfoliosForCard } from './discovery';
import { buildPerformanceMsg, isRateLimitError } from './utils';
import { languageFromHass, t } from './localize';
import type { TranslationKey } from './localize';

import './components/loading-spinner';
import './views/performance-view';
import './views/holdings-view';
import './views/activities-view';
import './parqet-snapshot-card';

const VIEW_TRANSLATION_KEYS: Record<ViewType, TranslationKey> = {
  performance: 'views.performance',
  holdings: 'views.holdings',
  activities: 'views.activities',
};

// ─── Card registration ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;
w['customCards'] = w['customCards'] || [];
if (!w['customCards'].some((c: { type: string }) => c.type === 'parqet-companion-card')) {
  w['customCards'].push({
    type: 'parqet-companion-card',
    name: 'Parqet Companion',
    description: t('card.description'),
    preview: true,
    documentationURL: 'https://github.com/cubinet-code/ha-parqet-companion',
  });
}

// ─── Card element ─────────────────────────────────────────────────────────────

export class ParqetCompanionCard extends LitElement {
  @property({ attribute: false }) hass!: Hass;
  @state() private _config!: ParqetCardConfig;
  @state() private _portfolios: DiscoveredPortfolio[] = [];
  @state() private _selectedIndex = -1;
  @state() private _activeView: ViewType = 'performance';
  @state() private _interval: IntervalValue = '1y';
  @state() private _perfData: PortfolioPerformance | null = null;
  @state() private _holdingsData: Holding[] = [];
  @state() private _dataLoading = false;
  @state() private _dataError = '';
  @state() private _rateLimited = false;
  private _lastEntities: Hass['entities'] | undefined;
  private _discoveryRan = false;
  private _fetchGen = 0;
  private _cachedProxy: DiscoveredPortfolio | null = null;
  private _cachedProxySource: DiscoveredPortfolio[] | null = null;
  private _cachedProxyKey: string | null = null;

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
    this._interval = (this._config.default_interval as IntervalValue) ?? '1y';
  }

  getCardSize(): number {
    return 6;
  }

  static getConfigForm() {
    const language = languageFromHass();
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
                { value: 'performance', label: t('views.performance', language) },
                { value: 'holdings', label: t('views.holdings', language) },
                { value: 'activities', label: t('views.activities', language) },
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
          title: t('views.performance', language),
          icon: 'mdi:chart-line',
          schema: [
            {
              name: 'default_interval',
              selector: {
                select: {
                  options: [
                    { value: '1d', label: t('interval.1d', language) },
                    { value: '1w', label: t('interval.1w', language) },
                    { value: 'mtd', label: t('interval.mtd', language) },
                    { value: '1m', label: t('interval.1m', language) },
                    { value: '3m', label: t('interval.3m', language) },
                    { value: '6m', label: t('interval.6m', language) },
                    { value: '1y', label: t('interval.1y', language) },
                    { value: 'ytd', label: t('interval.ytd', language) },
                    { value: '3y', label: t('interval.3y', language) },
                    { value: '5y', label: t('interval.5y', language) },
                    { value: '10y', label: t('interval.10y', language) },
                    { value: 'max', label: t('interval.max', language) },
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
          title: t('views.holdings', language),
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
          title: t('views.activities', language),
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
          title: t('views.layout', language),
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
          device_id: t('editor.device', language),
          default_view: t('editor.defaultView', language),
          default_interval: t('editor.defaultInterval', language),
          currency_symbol: t('editor.currencySymbol', language),
          holdings_limit: t('editor.holdingsLimit', language),
          activities_limit: t('editor.activitiesLimit', language),
          show_interval_selector: t('editor.showIntervalSelector', language),
          show_performance_chart: t('editor.showPerformanceChart', language),
          show_allocation_chart: t('editor.showAllocationChart', language),
          show_logo: t('editor.showLogo', language),
          compact: t('editor.compact', language),
          hide_header: t('editor.hideHeader', language),
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
    // Skip only on subsequent calls with unchanged entities. The first call
    // must always run, even when hass.entities is undefined (HA app case).
    if (this._discoveryRan && this.hass.entities === this._lastEntities) return;
    this._discoveryRan = true;
    this._lastEntities = this.hass.entities;

    const deviceId = this._config?.device_id;
    const discovery = discoverPortfoliosForCard(this.hass, deviceId);
    const discovered = discovery.portfolios;

    // Sort before comparing to avoid false positives from iteration order changes
    const key = (ps: DiscoveredPortfolio[]) => [...ps.map((p) => `${p.entryId}:${p.portfolioId}`)].sort().join(',');
    if (key(discovered) !== key(this._portfolios)) {
      this._portfolios = discovered;
      // Default: "All" (-1) when multiple portfolios with no active device filter;
      // first portfolio (0) when single or a valid device-specific card.
      if (
        discovered.length <= 1
        || discovery.matchedConfiguredDevice
        || !this._canAggregateAll(discovered)
      ) {
        this._selectedIndex = 0;
      } else {
        this._selectedIndex = -1;
      }
      void this._loadData();
    }
  }

  private _canAggregateAll(portfolios = this._portfolios): boolean {
    if (portfolios.length < 2) return false;
    if (new Set(portfolios.map((portfolio) => portfolio.entryId)).size === 1) {
      return true;
    }
    return discoverCombinedPortfolio(this.hass) !== null;
  }

  private _aggregateOptionLabel(portfolios = this._portfolios): string {
    if (new Set(portfolios.map((portfolio) => portfolio.entryId)).size > 1) {
      return discoverCombinedPortfolio(this.hass)?.name ?? 'Parqet Combined';
    }
    return t('card.allPortfolios', this.hass);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  render() {
    if (!this._portfolios.length) {
      return html`
        <ha-card>
          <div class="empty">
            <span>${t('card.noPortfolios', this.hass)}</span>
            <span class="hint">${t('card.addIntegration', this.hass)}</span>
          </div>
        </ha-card>
      `;
    }

    const portfolio = this._getActivePortfolio()!;
    const views: ViewType[] = portfolio.portfolioId === 'combined_accounts'
      ? ['performance', 'holdings']
      : ['performance', 'holdings', 'activities'];

    return html`
      <ha-card>
        ${!this._config?.hide_header ? html`
          <div class="card-header">
            ${this._portfolios.length > 1 ? html`
              <select
                class="portfolio-select"
                aria-label=${t('common.selectPortfolio', this.hass)}
                @change=${this._onPortfolioChange}
              >
                ${this._canAggregateAll() ? html`
                  <option value="-1" ?selected=${this._selectedIndex === -1}>${this._aggregateOptionLabel()}</option>
                ` : ''}
                ${this._portfolios.map((p, i) => html`
                  <option value=${i} ?selected=${i === this._selectedIndex}>${p.name}</option>
                `)}
              </select>
            ` : html`<span class="portfolio-name">${portfolio.name}</span>`}
          </div>
        ` : ''}

        ${this._rateLimited ? html`
          <div class="rate-limit" role="alert">${t('card.rateLimitWarning', this.hass)}</div>
        ` : ''}

        <div class="tabs" role="tablist">
          ${views.map((v) => html`
            <button
              class="tab ${this._activeView === v ? 'active' : ''}"
              role="tab"
              aria-selected=${this._activeView === v}
              @click=${() => (this._activeView = v)}
            >
              ${t(VIEW_TRANSLATION_KEYS[v], this.hass)}
            </button>
          `)}
        </div>

        <div class="view-content" role="tabpanel">
          ${this._renderView(portfolio)}
        </div>
      </ha-card>
    `;
  }

  private _renderView(portfolio: DiscoveredPortfolio) {
    if (
      this._activeView === 'performance'
      || (portfolio.portfolioId === 'combined_accounts' && this._activeView === 'activities')
    ) {
      return html`
        <parqet-performance-view
          .hass=${this.hass}
          .portfolio=${portfolio}
          .config=${this._config}
          .perfData=${this._perfData}
          .loading=${this._dataLoading}
          .error=${this._dataError}
          .interval=${this._interval}
          @interval-change=${this._onIntervalChange}
        ></parqet-performance-view>
      `;
    }
    if (this._activeView === 'holdings') {
      return html`
        <parqet-holdings-view
          .hass=${this.hass}
          .portfolio=${portfolio}
          .config=${this._config}
          .holdingsData=${this._holdingsData}
          .loading=${this._dataLoading}
          .error=${this._dataError}
          .interval=${this._interval}
          @interval-change=${this._onIntervalChange}
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

  private _getActivePortfolio(): DiscoveredPortfolio | null {
    if (!this._portfolios.length) return null;
    const isAggregated = this._portfolios.length > 1 && this._selectedIndex === -1;
    return isAggregated
      ? this._allPortfoliosProxy()
      : this._portfolios[this._selectedIndex] || this._portfolios[0];
  }

  private async _loadData() {
    const portfolio = this._getActivePortfolio();
    if (!this.hass || !portfolio) return;
    const gen = ++this._fetchGen;
    this._dataLoading = true;
    this._dataError = '';
    this._rateLimited = false;

    try {
      const result = await this._fetchPerformanceAndHoldings(portfolio);
      if (gen !== this._fetchGen) return;
      this._perfData = result.performance;
      this._holdingsData = (result.holdings || []).filter(
        (h: Holding) => !h.position?.isSold,
      );
    } catch (err: unknown) {
      if (gen !== this._fetchGen) return;
      if (isRateLimitError(err)) {
        this._rateLimited = true;
        this._dataError = t('card.rateLimitError', this.hass);
      } else {
        this._dataError = t('card.loadError', this.hass);
      }
      this._perfData = null;
      this._holdingsData = [];
    } finally {
      if (gen === this._fetchGen) this._dataLoading = false;
    }
  }

  private async _fetchPerformanceAndHoldings(
    portfolio: DiscoveredPortfolio,
  ): Promise<{ performance: PortfolioPerformance; holdings: Holding[] }> {
    if (!portfolio._portfolios?.length) {
      return (await this.hass.connection.sendMessagePromise(
        buildPerformanceMsg(portfolio, this._interval),
      )) as { performance: PortfolioPerformance; holdings: Holding[] };
    }

    const routes = portfolio._portfolios;
    const entryIds = new Set(routes.map((route) => route.entryId));
    let requestPortfolio = portfolio;
    if (entryIds.size > 1) {
      const combined = discoverCombinedPortfolio(this.hass);
      if (!combined) {
        throw new Error('Parqet Combined entry is required for multi-account totals');
      }
      requestPortfolio = combined;
    }

    return (await this.hass.connection.sendMessagePromise(
      buildPerformanceMsg(requestPortfolio, this._interval),
    )) as { performance: PortfolioPerformance; holdings: Holding[] };
  }

  _onIntervalChange(e: CustomEvent) {
    this._interval = e.detail.interval as IntervalValue;
    void this._loadData();
  }

  private _allPortfoliosProxy(): DiscoveredPortfolio {
    const entryIds = new Set(this._portfolios.map((portfolio) => portfolio.entryId));
    // The Combined device is filtered out of `_portfolios`, so its appearance
    // or removal never changes that array — it has to be part of the cache key
    // or a deleted Combined entry would keep being used as the request route.
    const combined = entryIds.size > 1 ? discoverCombinedPortfolio(this.hass) : null;
    const proxyKey = combined?.entryId ?? null;
    if (
      this._cachedProxySource === this._portfolios
      && this._cachedProxy
      && this._cachedProxyKey === proxyKey
    ) {
      return this._cachedProxy;
    }
    this._cachedProxyKey = proxyKey;
    if (combined) {
      this._cachedProxy = combined;
      this._cachedProxySource = this._portfolios;
      return this._cachedProxy;
    }

    this._cachedProxy = {
      entryId: this._portfolios[0]?.entryId ?? '__all__',
      portfolioId: '__all__',
      name: t('card.allPortfolios', this.hass),
      entityPrefix: null,
      sensors: {},
      _portfolios: this._portfolios.map((p) => ({
        entryId: p.entryId,
        portfolioId: p.portfolioId,
      })),
    };
    this._cachedProxySource = this._portfolios;
    return this._cachedProxy;
  }

  private _onPortfolioChange(e: Event) {
    this._selectedIndex = parseInt((e.target as HTMLSelectElement).value, 10);
    void this._loadData();
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
    .rate-limit {
      margin: 8px 16px; padding: 8px 12px;
      background: rgba(255, 152, 0, 0.12); color: var(--warning-color, #ff9800);
      border-radius: 6px; font-size: 0.82rem;
    }
  `;
}

registerElement('parqet-companion-card', ParqetCompanionCard);
