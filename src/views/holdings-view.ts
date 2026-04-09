import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Hass, ParqetCardConfig, DiscoveredPortfolio, Holding } from '../types';
import type { IntervalValue } from '../const';
import { fmtCurrency, fmtPct, valueClass } from '../utils';
import '../components/interval-selector';
import '../components/loading-spinner';
import '../components/donut-chart';

const CHART_COLORS = [
  '#4285f4', '#ea4335', '#fbbc04', '#34a853', '#ff6d01',
  '#46bdc6', '#9c27b0', '#795548', '#607d8b', '#e91e63',
  '#00bcd4', '#8bc34a', '#ff5722', '#3f51b5', '#cddc39',
  '#009688', '#ffc107', '#673ab7', '#03a9f4', '#ff9800',
];

@customElement('parqet-holdings-view')
export class ParqetHoldingsView extends LitElement {
  @property({ attribute: false }) hass!: Hass;
  @property({ attribute: false }) portfolio!: DiscoveredPortfolio;
  @property({ attribute: false }) config!: ParqetCardConfig;

  @state() _holdings: Holding[] = [];
  @state() _loading = false;
  @state() _error = '';
  @state() _interval: IntervalValue = 'max';
  @state() private _sortBy: 'name' | 'value' | 'pl' | 'plPct' | 'weight' = 'value';
  @state() private _sortAsc = false;
  @state() private _expandedId: string | null = null;

  _fetchGen = 0;

  connectedCallback() {
    super.connectedCallback();
    this._interval = (this.config?.default_interval as IntervalValue) ?? 'max';
    void this._load();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('portfolio')) void this._load();
  }

  private async _load() {
    if (!this.hass || !this.portfolio) return;
    const gen = ++this._fetchGen;
    this._loading = true;
    this._error = '';

    try {
      const result = (await this.hass.connection.sendMessagePromise({
        type: 'parqet/get_performance',
        entry_id: this.portfolio.entryId,
        interval: this._interval,
      })) as { holdings: Holding[] };
      if (gen !== this._fetchGen) return;
      this._holdings = (result.holdings || []).filter((h) => !h.position?.isSold);
    } catch {
      if (gen !== this._fetchGen) return;
      this._error = 'Failed to load holdings';
    } finally {
      if (gen === this._fetchGen) this._loading = false;
    }
  }

  async _onIntervalChange(e: CustomEvent) {
    this._interval = e.detail.interval as IntervalValue;
    return this._load();
  }

  private _sym(): string {
    return this.config?.currency_symbol ?? '€';
  }

  private _totalValue(): number {
    return this._holdings.reduce((sum, h) => sum + (h.position?.currentValue ?? 0), 0);
  }

  private _sorted(total: number): Holding[] {
    const sorted = [...this._holdings].sort((a, b) => {
      switch (this._sortBy) {
        case 'name': return (a.asset?.name ?? '').localeCompare(b.asset?.name ?? '');
        case 'value': return (b.position?.currentValue ?? 0) - (a.position?.currentValue ?? 0);
        case 'pl': return (b.performance?.unrealizedGains?.inInterval?.gainGross ?? 0) - (a.performance?.unrealizedGains?.inInterval?.gainGross ?? 0);
        case 'plPct': return (b.performance?.unrealizedGains?.inInterval?.returnGross ?? 0) - (a.performance?.unrealizedGains?.inInterval?.returnGross ?? 0);
        case 'weight': {
          const wa = total > 0 ? (a.position?.currentValue ?? 0) / total : 0;
          const wb = total > 0 ? (b.position?.currentValue ?? 0) / total : 0;
          return wb - wa;
        }
        default: return 0;
      }
    });
    return this._sortAsc ? sorted.reverse() : sorted;
  }

  private _toggleSort(col: typeof this._sortBy) {
    if (this._sortBy === col) this._sortAsc = !this._sortAsc;
    else { this._sortBy = col; this._sortAsc = false; }
  }

  render() {
    return html`
      ${this.config?.show_interval_selector !== false ? html`
        <parqet-interval-selector
          .selected=${this._interval}
          @interval-change=${this._onIntervalChange}
        ></parqet-interval-selector>
      ` : ''}

      ${this._loading ? html`<parqet-loading-spinner></parqet-loading-spinner>` : ''}
      ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : ''}
      ${!this._loading && !this._error && !this._holdings.length ? html`<div class="empty">No holdings found.</div>` : ''}

      ${!this._loading && !this._error && this._holdings.length ? (() => {
        const total = this._totalValue();
        const limit = this.config?.holdings_limit ?? 50;
        const sorted = this._sorted(total).slice(0, limit);

        return html`
      ${(this.config?.show_allocation_chart ?? this.config?.show_chart) !== false ? html`
        <parqet-donut-chart
          .segments=${(() => {
            const top = sorted.slice(0, 20).map((h, i) => ({
              label: h.nickname ?? h.asset?.name ?? 'Unknown',
              value: h.position?.currentValue ?? 0,
              color: CHART_COLORS[i % CHART_COLORS.length],
            }));
            if (sorted.length > 20) {
              const otherValue = sorted.slice(20).reduce(
                (sum, h) => sum + (h.position?.currentValue ?? 0), 0
              );
              if (otherValue > 0) {
                top.push({ label: 'Other', value: otherValue, color: '#9e9e9e' });
              }
            }
            return top;
          })()}
        ></parqet-donut-chart>
      ` : ''}

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="sortable" @click=${() => this._toggleSort('name')}>Name</th>
              <th class="sortable num" @click=${() => this._toggleSort('value')}>Value</th>
              <th class="sortable num" @click=${() => this._toggleSort('pl')}>P&amp;L</th>
              <th class="sortable num" @click=${() => this._toggleSort('plPct')}>P&amp;L%</th>
              <th class="sortable num" @click=${() => this._toggleSort('weight')}>Weight</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map((h) => {
              const pl = h.performance?.unrealizedGains?.inInterval?.gainGross ?? 0;
              const plPct = h.performance?.unrealizedGains?.inInterval?.returnGross;
              const weight = total > 0 ? ((h.position?.currentValue ?? 0) / total) * 100 : 0;
              const expanded = this._expandedId === h.id;

              return html`
                <tr class="holding-row ${expanded ? 'expanded' : ''}" @click=${() => (this._expandedId = expanded ? null : h.id)}>
                  <td>
                    <div class="holding-name">
                      ${this.config?.show_logo !== false && h.logo ? html`<img class="logo" src=${h.logo} alt="" />` : ''}
                      <span>${h.nickname ?? h.asset?.name ?? 'Unknown'}</span>
                    </div>
                  </td>
                  <td class="num">${fmtCurrency(h.position?.currentValue, this._sym())}</td>
                  <td class="num ${valueClass(pl)}">${fmtCurrency(pl, this._sym())}</td>
                  <td class="num ${valueClass(plPct)}">${fmtPct(plPct)}</td>
                  <td class="num">${weight.toFixed(1)}%</td>
                </tr>
                ${expanded ? html`
                  <tr class="detail-row">
                    <td colspan="5">
                      <div class="detail-grid">
                        <span>Shares: ${h.position?.shares?.toFixed(4)}</span>
                        <span>Avg Price: ${fmtCurrency(h.position?.purchasePrice, this._sym())}</span>
                        <span>Current: ${fmtCurrency(h.position?.currentPrice, this._sym())}</span>
                        <span>XIRR: ${fmtPct(h.performance?.kpis?.inInterval?.xirr)}</span>
                        <span>Dividends: ${fmtCurrency(h.performance?.dividends?.inInterval?.gainGross, this._sym())}</span>
                        <span>Fees: ${fmtCurrency(h.performance?.fees?.inInterval?.fees, this._sym())}</span>
                      </div>
                    </td>
                  </tr>
                ` : ''}
              `;
            })}
          </tbody>
        </table>
      </div>
        `;
      })() : ''}
    `;
  }

  static styles = css`
    :host { display: block; overflow: hidden; }
    .table-wrap { overflow-x: auto; padding: 0 8px 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    th { text-align: left; padding: 6px 8px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--secondary-text-color); border-bottom: 1px solid var(--divider-color, #e0e0e0); }
    th.num { text-align: right; }
    td { padding: 8px; border-bottom: 1px solid var(--divider-color, #e0e0e0); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .sortable { cursor: pointer; }
    .sortable:hover { color: var(--primary-color); }
    .holding-row { cursor: pointer; }
    .holding-row:hover { background: var(--secondary-background-color, #f5f5f5); }
    .holding-name { display: flex; align-items: center; gap: 8px; }
    .logo { width: 20px; height: 20px; border-radius: 4px; object-fit: contain; }
    .detail-row td { padding: 8px 12px; background: var(--secondary-background-color, #f5f5f5); }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 4px; font-size: 0.75rem; color: var(--secondary-text-color); }
    .positive { color: var(--success-color, #4caf50); }
    .negative { color: var(--error-color, #f44336); }
    .error { margin: 8px 16px; padding: 8px 12px; background: rgba(244, 67, 54, 0.1); color: var(--error-color, #f44336); border-radius: 6px; font-size: 0.82rem; }
    .empty { padding: 24px; text-align: center; color: var(--secondary-text-color); font-size: 0.875rem; }
  `;
}
