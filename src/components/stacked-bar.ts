import { LitElement, html, css, svg } from 'lit';
import { property } from 'lit/decorators.js';

export interface StackedSegment {
  label: string;
  value: number;
  color: string;
}

const BAR_H = 18;
const BAR_RX = 4;

export class ParqetStackedBar extends LitElement {
  @property({ type: Array }) segments: StackedSegment[] = [];
  @property({ type: String }) currencySymbol = '€';

  private _fmt(v: number): string {
    const s = this.currencySymbol;
    const abs = Math.abs(v);
    const formatted = abs.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${v < 0 ? '−' : ''}${s}${formatted}`;
  }

  render() {
    const items = this.segments.filter((s) => s.value !== 0);
    if (items.length === 0) return html`<div class="empty">No data</div>`;

    const total = items.reduce((sum, s) => sum + Math.abs(s.value), 0);
    if (total === 0) return html`<div class="empty">No data</div>`;

    // Build segments with percentage widths
    const segs = items.map((s) => ({
      ...s,
      pct: (Math.abs(s.value) / total) * 100,
    }));

    return html`
      <div class="chart-container">
        <div class="bar-track">
          ${segs.map(
            (s, i) => html`
              <div
                class="bar-seg"
                style="width:${s.pct}%;background:${s.color};
                  ${i === 0 ? `border-radius:${BAR_RX}px 0 0 ${BAR_RX}px;` : ''}
                  ${i === segs.length - 1 ? `border-radius:0 ${BAR_RX}px ${BAR_RX}px 0;` : ''}
                  ${segs.length === 1 ? `border-radius:${BAR_RX}px;` : ''}"
                title="${s.label}: ${this._fmt(s.value)} (${s.pct.toFixed(1)}%)"
              ></div>
            `,
          )}
        </div>
        <div class="legend">
          ${segs.map(
            (s) => html`
              <div class="legend-item">
                <span class="dot" style="background:${s.color}"></span>
                <span class="legend-label">${s.label}</span>
                <span class="legend-value">${this._fmt(s.value)}</span>
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      overflow: hidden;
      min-width: 0;
    }
    .chart-container {
      padding: 8px 16px 16px;
    }
    .bar-track {
      display: flex;
      height: ${BAR_H}px;
      border-radius: ${BAR_RX}px;
      overflow: hidden;
    }
    .bar-seg {
      min-width: 2px;
      opacity: 0.85;
      transition: opacity 0.15s;
    }
    .bar-seg:hover {
      opacity: 1;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      margin-top: 8px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-label {
      color: var(--secondary-text-color, #757575);
    }
    .legend-value {
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      color: var(--primary-text-color, #212121);
    }
    .empty {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.82rem;
    }
  `;
}

if (!customElements.get('parqet-stacked-bar')) {
  customElements.define('parqet-stacked-bar', ParqetStackedBar);
}

declare global {
  interface HTMLElementTagNameMap {
    'parqet-stacked-bar': ParqetStackedBar;
  }
}
