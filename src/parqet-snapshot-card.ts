import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import type {
  Hass,
  DiscoveredPortfolio,
} from './types';
import { fmtCurrency, fmtPct, valueClass } from './utils';
import { discoverPortfolios } from './discovery';
import './components/loading-spinner';

// ─── Card registration ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;
w['customCards'] = w['customCards'] || [];
if (!w['customCards'].some((c: { type: string }) => c.type === 'parqet-snapshot-card')) {
  w['customCards'].push({
    type: 'parqet-snapshot-card',
    name: 'Parqet Daily Snapshot',
    description: 'Per-holding daily P&L based on custom snapshot time.',
    preview: false,
  });
}

// ─── Snapshot response types ────────────────────────────────────────────────

interface SnapshotHolding {
  id: string;
  name: string;
  logo: string | null;
  shares: number;
  current_price: number;
  current_value: number;
  snapshot_price: number | null;
  snapshot_value: number | null;
  daily_pl: number | null;
  daily_pl_pct: number | null;
  weight: number;
}

interface SnapshotData {
  snapshot_date: string | null;
  snapshot_taken_at: string | null;
  holdings: SnapshotHolding[];
  total_value: number;
  total_snapshot_value: number | null;
  total_daily_pl: number | null;
  total_daily_pl_pct: number | null;
}

// ─── Card config ────────────────────────────────────────────────────────────

interface SnapshotCardConfig {
  type: string;
  device_id?: string;
  entity?: string;
  entry_id?: string;
  currency_symbol?: string;
  holdings_limit?: number;
  show_logo?: boolean;
  compact?: boolean;
}

// ─── Card ───────────────────────────────────────────────────────────────────

export class ParqetSnapshotCard extends LitElement {
  @property({ attribute: false }) hass!: Hass;

  @state() private _config: SnapshotCardConfig = { type: 'custom:parqet-snapshot-card' };
  @state() _portfolio: DiscoveredPortfolio | null = null;
  @state() _data: SnapshotData | null = null;
  @state() _loading = false;
  @state() _error = '';
  @state() _notEnabled = false;
  @state() private _sortBy: 'name' | 'value' | 'pl' | 'plPct' | 'weight' = 'pl';
  @state() private _sortAsc = false;

  setConfig(config: SnapshotCardConfig) {
    this._config = config;
  }

  getCardSize(): number {
    return 4;
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: 'device_id',
          selector: {
            device: {
              integration: 'parqet',
            },
          },
        },
        {
          name: 'currency_symbol',
          selector: { text: {} },
        },
        {
          name: 'holdings_limit',
          selector: { number: { min: 1, max: 200, mode: 'box' } },
        },
        {
          name: 'show_logo',
          selector: { boolean: {} },
        },
        {
          name: 'compact',
          selector: { boolean: {} },
        },
      ],
      computeLabel: (schema: { name: string }) => {
        const labels: Record<string, string> = {
          device_id: 'Portfolio (leave empty for auto-detect)',
          currency_symbol: 'Currency Symbol',
          holdings_limit: 'Holdings Limit',
          show_logo: 'Show Holding Logos',
          compact: 'Compact Mode',
        };
        return labels[schema.name] || schema.name;
      },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this._discoverPortfolio();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('hass') && !this._portfolio) {
      this._discoverPortfolio();
    }
  }

  private _discoverPortfolio() {
    if (!this.hass?.states) return;

    const deviceId = this._config?.device_id;
    const portfolios = discoverPortfolios(this.hass, deviceId);
    if (portfolios.length === 0) return;

    this._portfolio = portfolios[0];
    void this._load();
  }

  async _load() {
    if (!this.hass || !this._portfolio) return;
    this._loading = true;
    this._error = '';
    this._notEnabled = false;

    try {
      const result = (await this.hass.connection.sendMessagePromise({
        type: 'parqet/get_snapshot',
        entry_id: this._portfolio.entryId,
      })) as SnapshotData;
      this._data = result;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'not_enabled') {
        this._notEnabled = true;
      } else {
        this._error = 'Failed to load snapshot data';
      }
    } finally {
      this._loading = false;
    }
  }

  private _sym(): string {
    return this._config?.currency_symbol ?? '€';
  }

  private _fmtSnapshot(iso: string): string {
    try {
      const dt = new Date(iso);
      return dt.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  private _sorted(): SnapshotHolding[] {
    if (!this._data) return [];
    const sorted = [...this._data.holdings].sort((a, b) => {
      switch (this._sortBy) {
        case 'name': return (a.name ?? '').localeCompare(b.name ?? '');
        case 'value': return (b.current_value ?? 0) - (a.current_value ?? 0);
        case 'pl': return (b.daily_pl ?? 0) - (a.daily_pl ?? 0);
        case 'plPct': return (b.daily_pl_pct ?? 0) - (a.daily_pl_pct ?? 0);
        case 'weight': return (b.weight ?? 0) - (a.weight ?? 0);
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
      <ha-card>
        ${this._portfolio ? html`
          <div class="header">
            <span class="title">${this._portfolio.name}</span>
            ${this._data?.snapshot_taken_at ? html`
              <span class="subtitle">vs. ${this._fmtSnapshot(this._data.snapshot_taken_at)}</span>
            ` : ''}
          </div>
        ` : ''}

        ${this._notEnabled ? html`
          <div class="info">Enable daily snapshots in integration settings.</div>
        ` : ''}

        ${this._loading ? html`<parqet-loading-spinner></parqet-loading-spinner>` : ''}
        ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : ''}

        ${this._data && !this._loading && !this._error ? (() => {
          const d = this._data!;
          const hasSnapshot = d.snapshot_date !== null;
          const limit = this._config?.holdings_limit ?? 50;
          const sorted = this._sorted().slice(0, limit);

          return html`
            ${hasSnapshot ? html`
              <div class="summary">
                <div class="summary-item">
                  <span class="summary-label">Total</span>
                  <span class="summary-value">${fmtCurrency(d.total_value, this._sym())}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Daily P&amp;L</span>
                  <span class="summary-value ${valueClass(d.total_daily_pl)}">${fmtCurrency(d.total_daily_pl, this._sym())} (${fmtPct(d.total_daily_pl_pct)})</span>
                </div>
              </div>
            ` : ''}

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th class="sortable" @click=${() => this._toggleSort('name')}>Name</th>
                    <th class="sortable num" @click=${() => this._toggleSort('value')}>Value</th>
                    ${hasSnapshot ? html`
                      <th class="sortable num" @click=${() => this._toggleSort('pl')}>P&amp;L</th>
                      <th class="sortable num" @click=${() => this._toggleSort('plPct')}>P&amp;L%</th>
                    ` : ''}
                    <th class="sortable num" @click=${() => this._toggleSort('weight')}>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  ${sorted.map((h) => html`
                    <tr class="holding-row">
                      <td>
                        <div class="holding-name">
                          ${this._config?.show_logo !== false && h.logo ? html`<img class="logo" src=${h.logo} alt="" />` : ''}
                          <span>${h.name}</span>
                        </div>
                      </td>
                      <td class="num">${fmtCurrency(h.current_value, this._sym())}</td>
                      ${hasSnapshot ? html`
                        <td class="num ${valueClass(h.daily_pl)}">${h.daily_pl != null ? fmtCurrency(h.daily_pl, this._sym()) : '—'}</td>
                        <td class="num ${valueClass(h.daily_pl_pct)}">${h.daily_pl_pct != null ? fmtPct(h.daily_pl_pct) : '—'}</td>
                      ` : ''}
                      <td class="num">${h.weight.toFixed(1)}%</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>

            ${!hasSnapshot ? html`
              <div class="info">Waiting for first daily snapshot.</div>
            ` : ''}
          `;
        })() : ''}
      </ha-card>
    `;
  }

  static styles = css`
    :host { display: block; }
    ha-card { overflow: hidden; }
    .header { padding: 16px 16px 8px; }
    .title { font-size: 1rem; font-weight: 600; }
    .subtitle { font-size: 0.75rem; color: var(--secondary-text-color); margin-left: 8px; }
    .summary { display: flex; gap: 16px; padding: 8px 16px 12px; }
    .summary-item { display: flex; flex-direction: column; }
    .summary-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary-text-color); }
    .summary-value { font-size: 0.95rem; font-weight: 600; }
    .table-wrap { overflow-x: auto; padding: 0 8px 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    th { text-align: left; padding: 6px 8px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--secondary-text-color); border-bottom: 1px solid var(--divider-color, #e0e0e0); }
    th.num { text-align: right; }
    td { padding: 8px; border-bottom: 1px solid var(--divider-color, #e0e0e0); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .sortable { cursor: pointer; }
    .sortable:hover { color: var(--primary-color); }
    .holding-row:hover { background: var(--secondary-background-color, #f5f5f5); }
    .holding-name { display: flex; align-items: center; gap: 8px; }
    .logo { width: 20px; height: 20px; border-radius: 4px; object-fit: contain; }
    .positive { color: var(--success-color, #4caf50); }
    .negative { color: var(--error-color, #f44336); }
    .error { margin: 8px 16px; padding: 8px 12px; background: rgba(244, 67, 54, 0.1); color: var(--error-color, #f44336); border-radius: 6px; font-size: 0.82rem; }
    .info { padding: 24px 16px; text-align: center; color: var(--secondary-text-color); font-size: 0.875rem; }
  `;
}

if (!customElements.get('parqet-snapshot-card')) {
  customElements.define('parqet-snapshot-card', ParqetSnapshotCard);
}

declare global {
  interface HTMLElementTagNameMap {
    'parqet-snapshot-card': ParqetSnapshotCard;
  }
}
