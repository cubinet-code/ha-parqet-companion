import { registerElement } from '../diagnostics-frontend';
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { Hass, ParqetCardConfig, DiscoveredPortfolio, Activity, ActivityType, Holding } from '../types';
import { fmtCurrency, fmtDate, getEntryIds } from '../utils';
import '../components/loading-spinner';

const ACTIVITY_TYPES: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'interest', label: 'Interest' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
  { value: 'fees_taxes', label: 'Fees/Taxes' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
];

const BADGE_COLORS: Record<string, string> = {
  buy: '#4caf50',
  sell: '#f44336',
  dividend: '#46bdc6',
  interest: '#9c27b0',
  transfer_in: '#4285f4',
  transfer_out: '#ff6d01',
  fees_taxes: '#ff9800',
  deposit: '#4caf50',
  withdrawal: '#f44336',
};

export class ParqetActivitiesView extends LitElement {
  @property({ attribute: false }) hass!: Hass;
  @property({ attribute: false }) portfolio!: DiscoveredPortfolio;
  @property({ attribute: false }) config!: ParqetCardConfig;

  @state() private _activities: Activity[] = [];
  @state() private _holdingsMap: Map<string, string> = new Map();
  @state() private _loading = false;
  @state() private _error = '';
  @state() private _filter: string = 'all';
  @state() private _cursor: string | null = null;
  @state() private _hasMore = false;

  connectedCallback() {
    super.connectedCallback();
    this._filter = this.config?.default_activity_type ?? 'all';
    void this._load();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('portfolio')) void this._load();
  }

  private _isAggregated(): boolean {
    return (getEntryIds(this.portfolio).length > 1);
  }

  private async _loadHoldingsMap() {
    if (this._holdingsMap.size > 0) return;
    try {
      const map = new Map<string, string>();
      const results = await Promise.all(
        getEntryIds(this.portfolio).map((eid) =>
          this.hass.connection.sendMessagePromise({
            type: 'parqet/get_holdings',
            entry_id: eid,
          }) as Promise<{ holdings: Holding[] }>,
        ),
      );
      for (const result of results) {
        for (const h of result.holdings || []) {
          if (h.id) map.set(h.id, h.nickname ?? h.asset?.name ?? 'Unknown');
        }
      }
      this._holdingsMap = map;
    } catch { /* ignore — names will fall back */ }
  }

  private async _load(append = false) {
    if (!this.hass || !this.portfolio) return;
    this._loading = true;
    this._error = '';

    // Load holdings map for name resolution.
    await this._loadHoldingsMap();

    try {
      const limit = this.config?.activities_limit ?? 25;
      const eids = getEntryIds(this.portfolio);

      // Fetch all portfolios in parallel.
      const results = await Promise.all(
        eids.map((eid) => {
          const params: Record<string, unknown> = {
            type: 'parqet/get_activities',
            entry_id: eid,
            limit,
          };
          if (this._filter !== 'all') {
            params['activity_type'] = [this._filter];
          }
          // Pagination only works for single-portfolio; aggregated mode
          // fetches everything without cursor to avoid cross-portfolio issues.
          if (!this._isAggregated() && append && this._cursor) {
            params['cursor'] = this._cursor;
          }
          return this.hass.connection.sendMessagePromise(params) as Promise<{
            activities: Activity[];
            cursor: string | null;
          }>;
        }),
      );

      const allActivities: Activity[] = [];
      let singleCursor: string | null = null;
      for (const result of results) {
        allActivities.push(...result.activities);
        if (result.cursor) singleCursor = result.cursor;
      }

      // Sort merged activities by date descending.
      allActivities.sort(
        (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
      );

      if (append) {
        this._activities = [...this._activities, ...allActivities];
      } else {
        this._activities = allActivities;
      }
      // Pagination only for single-portfolio mode.
      this._cursor = this._isAggregated() ? null : singleCursor;
      this._hasMore = !this._isAggregated() && !!singleCursor;
    } catch {
      this._error = 'Failed to load activities';
    } finally {
      this._loading = false;
    }
  }

  private _sym(): string {
    return this.config?.currency_symbol ?? '€';
  }

  private _onFilterChange(type: string) {
    this._filter = type;
    this._cursor = null;
    void this._load();
  }

  render() {
    return html`
      <div class="filters">
        ${ACTIVITY_TYPES.map((t) => html`
          <button
            class="chip ${this._filter === t.value ? 'active' : ''}"
            @click=${() => this._onFilterChange(t.value)}
          >${t.label}</button>
        `)}
      </div>

      ${this._error ? html`<div class="error">${this._error}</div>` : ''}

      ${this._activities.length === 0 && !this._loading
        ? html`<div class="empty">No activities found.</div>`
        : html`
          <div class="activity-list">
            ${this._activities.map((a) => this._renderActivity(a))}
          </div>
        `}

      ${this._loading ? html`<parqet-loading-spinner></parqet-loading-spinner>` : ''}

      ${this._hasMore && !this._loading ? html`
        <button class="load-more" @click=${() => this._load(true)}>Load more</button>
      ` : ''}
    `;
  }

  private _resolveAssetName(a: Activity): string {
    // Try holdings map first (has the full name).
    if (a.holdingId && this._holdingsMap.has(a.holdingId)) {
      return this._holdingsMap.get(a.holdingId)!;
    }
    // Fall back to asset identifier.
    const asset = a.asset as Record<string, unknown> | undefined;
    if (!asset) return 'Unknown';
    return (asset.name ?? asset.symbol ?? asset.isin ?? 'Unknown') as string;
  }

  private _renderActivity(a: Activity) {
    const badgeColor = BADGE_COLORS[a.type] ?? 'var(--secondary-text-color)';
    const label = a.type.replace('_', ' ');
    const assetName = this._resolveAssetName(a);

    return html`
      <div class="activity">
        <div class="activity-left">
          <span class="badge" style="background: ${badgeColor}">${label}</span>
          <div class="activity-info">
            <span class="asset-name">${assetName}</span>
            <span class="activity-meta">
              ${fmtDate(a.datetime)}${a.broker ? ` · ${a.broker}` : ''}
            </span>
          </div>
        </div>
        <div class="activity-right">
          <span class="amount">${fmtCurrency(a.amount, this._sym())}</span>
          ${a.shares ? html`<span class="shares">${a.shares} @ ${fmtCurrency(a.price, this._sym())}</span>` : ''}
          ${a.tax ? html`<span class="tax-fee">Tax: ${fmtCurrency(a.tax, this._sym())}</span>` : ''}
          ${a.fee ? html`<span class="tax-fee">Fee: ${fmtCurrency(a.fee, this._sym())}</span>` : ''}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; overflow: hidden; }
    .filters { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 16px; }
    .chip {
      padding: 4px 10px; border-radius: 16px; border: 1px solid var(--divider-color, #e0e0e0);
      background: none; cursor: pointer; font-size: 0.72rem; color: var(--secondary-text-color);
      transition: all 0.15s;
    }
    .chip.active { background: var(--primary-color, #03a9f4); color: white; border-color: transparent; }
    .chip:hover:not(.active) { border-color: var(--primary-color); color: var(--primary-color); }
    .activity-list { padding: 0 16px 16px; }
    .activity {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 10px 0; border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .activity:last-child { border-bottom: none; }
    .activity-left { display: flex; align-items: flex-start; gap: 10px; }
    .badge {
      padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 600;
      color: white; text-transform: uppercase; white-space: nowrap; margin-top: 2px;
    }
    .activity-info { display: flex; flex-direction: column; gap: 2px; }
    .asset-name { font-size: 0.82rem; font-weight: 500; color: var(--primary-text-color); }
    .activity-meta { font-size: 0.7rem; color: var(--secondary-text-color); }
    .activity-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .amount { font-size: 0.82rem; font-weight: 600; font-variant-numeric: tabular-nums; }
    .shares { font-size: 0.7rem; color: var(--secondary-text-color); }
    .tax-fee { font-size: 0.65rem; color: var(--secondary-text-color); }
    .load-more {
      display: block; width: calc(100% - 32px); margin: 0 16px 16px; padding: 8px;
      border: 1px solid var(--divider-color); border-radius: 6px; background: none;
      cursor: pointer; color: var(--primary-color); font-size: 0.82rem;
    }
    .load-more:hover { background: var(--secondary-background-color); }
    .error { margin: 8px 16px; padding: 8px 12px; background: rgba(244, 67, 54, 0.1); color: var(--error-color, #f44336); border-radius: 6px; font-size: 0.82rem; }
    .empty { padding: 24px; text-align: center; color: var(--secondary-text-color); font-size: 0.875rem; }
  `;
}

registerElement('parqet-activities-view', ParqetActivitiesView);
