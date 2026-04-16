import { registerElement } from '../diagnostics-frontend';
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import type { Hass, ParqetCardConfig, DiscoveredPortfolio, PortfolioPerformance } from '../types';
import type { IntervalValue } from '../const';
import type { StackedSegment } from '../components/stacked-bar';
import { fmtCurrency, fmtPct, valueClass } from '../utils';
import '../components/interval-selector';
import '../components/loading-spinner';
import '../components/stacked-bar';

export class ParqetPerformanceView extends LitElement {
  @property({ attribute: false }) hass!: Hass;
  @property({ attribute: false }) portfolio!: DiscoveredPortfolio;
  @property({ attribute: false }) config!: ParqetCardConfig;
  @property({ attribute: false }) perfData: PortfolioPerformance | null = null;
  @property({ attribute: false }) loading = false;
  @property({ attribute: false }) error = '';
  @property() interval: IntervalValue = '1y';

  private _sym(): string {
    return this.config?.currency_symbol ?? '€';
  }

  render() {
    const d = this.perfData;

    return html`
      ${this.config?.show_interval_selector !== false ? html`
        <parqet-interval-selector
          .selected=${this.interval}
          @interval-change=${(e: CustomEvent) =>
            this.dispatchEvent(new CustomEvent('interval-change', { detail: e.detail, bubbles: true, composed: true }))}
        ></parqet-interval-selector>
      ` : ''}

      ${this.error ? html`<div class="error" role="alert">${this.error}</div>` : ''}
      ${this.loading ? html`<parqet-loading-spinner></parqet-loading-spinner>` : ''}

      ${d ? html`
        <div class="kpi-grid ${this.config?.compact ? 'compact' : ''}">
          ${this._kpi('Total Value', fmtCurrency(d.valuation?.atIntervalEnd, this._sym()))}
          ${this._kpi('XIRR', fmtPct(d.kpis?.inInterval?.xirr), d.kpis?.inInterval?.xirr)}
          ${this._kpi('TTWROR', fmtPct(d.kpis?.inInterval?.ttwror), d.kpis?.inInterval?.ttwror)}
          ${this._kpi('Unrealized Gain', fmtCurrency(d.unrealizedGains?.inInterval?.gainGross, this._sym()), d.unrealizedGains?.inInterval?.gainGross)}
          ${this._kpi('Realized Gain', fmtCurrency(d.realizedGains?.inInterval?.gainGross, this._sym()), d.realizedGains?.inInterval?.gainGross)}
          ${this._kpi('Dividends', fmtCurrency(d.dividends?.inInterval?.gainGross, this._sym()))}
          ${this._kpi('Fees', fmtCurrency(d.fees?.inInterval?.fees, this._sym()))}
          ${this._kpi('Taxes', fmtCurrency(d.taxes?.inInterval?.taxes, this._sym()))}
        </div>
        ${(this.config?.show_performance_chart ?? this.config?.show_chart) !== false ? this._renderChart(d) : ''}
      ` : !this.loading ? html`<div class="empty">No data available.</div>` : ''}
    `;
  }

  private _kpi(label: string, value: string, raw?: number | null) {
    return html`
      <div class="kpi-tile">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value ${valueClass(raw)}">${value}</div>
      </div>
    `;
  }

  private _renderChart(d: PortfolioPerformance) {
    const segments: StackedSegment[] = [
      { label: 'Unrealized', value: d.unrealizedGains?.inInterval?.gainGross ?? 0, color: 'var(--success-color, #4caf50)' },
      { label: 'Realized', value: d.realizedGains?.inInterval?.gainGross ?? 0, color: '#4285f4' },
      { label: 'Dividends', value: d.dividends?.inInterval?.gainGross ?? 0, color: '#46bdc6' },
      { label: 'Fees', value: -(d.fees?.inInterval?.fees ?? 0), color: '#ff6d01' },
      { label: 'Taxes', value: -(d.taxes?.inInterval?.taxes ?? 0), color: 'var(--error-color, #f44336)' },
    ].filter((s) => s.value !== 0);

    if (segments.length === 0) return '';
    return html`<parqet-stacked-bar .segments=${segments} .currencySymbol=${this._sym()}></parqet-stacked-bar>`;
  }

  static styles = css`
    :host { display: block; overflow: hidden; min-width: 0; }
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 8px; padding: 8px 16px 16px;
    }
    .kpi-grid.compact { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 4px; padding: 6px 10px 10px; }
    .kpi-tile { background: var(--secondary-background-color, #f5f5f5); border-radius: 8px; padding: 10px 12px; }
    .kpi-grid.compact .kpi-tile { padding: 6px 8px; border-radius: 6px; }
    .kpi-label { font-size: 0.68rem; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .kpi-grid.compact .kpi-label { font-size: 0.6rem; margin-bottom: 2px; }
    .kpi-value { font-size: 0.95rem; font-weight: 600; color: var(--primary-text-color); }
    .kpi-grid.compact .kpi-value { font-size: 0.8rem; }
    .kpi-value.positive { color: var(--success-color, #4caf50); }
    .kpi-value.negative { color: var(--error-color, #f44336); }
    .error { margin: 8px 16px; padding: 8px 12px; background: rgba(244, 67, 54, 0.1); color: var(--error-color, #f44336); border-radius: 6px; font-size: 0.82rem; }
    .empty { padding: 24px; text-align: center; color: var(--secondary-text-color); font-size: 0.875rem; }
  `;
}

registerElement('parqet-performance-view', ParqetPerformanceView);
