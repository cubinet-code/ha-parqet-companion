import { LitElement, html, css, svg } from 'lit';
import { property } from 'lit/decorators.js';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

const SIZE = 160;
const STROKE = 28;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export class ParqetDonutChart extends LitElement {
  @property({ type: Array }) segments: DonutSegment[] = [];
  @property({ type: String }) centerLabel = '';
  @property({ type: String }) centerSub = '';

  render() {
    const total = this.segments.reduce((s, seg) => s + Math.abs(seg.value), 0);
    if (total === 0 || this.segments.length === 0) {
      return html`<div class="empty">No data</div>`;
    }

    const center = SIZE / 2;
    let offset = 0;

    return html`
      <div class="chart-container">
        <svg viewBox="0 0 ${SIZE} ${SIZE}" class="donut" role="img" aria-label="Portfolio allocation chart">
          ${this.segments.map((seg) => {
            const pct = Math.abs(seg.value) / total;
            const dash = pct * CIRCUMFERENCE;
            const gap = CIRCUMFERENCE - dash;
            const rotation = (offset / total) * 360 - 90;
            offset += Math.abs(seg.value);
            return svg`
              <circle
                cx="${center}" cy="${center}" r="${RADIUS}"
                fill="none"
                stroke="${seg.color}"
                stroke-width="${STROKE}"
                stroke-dasharray="${dash} ${gap}"
                transform="rotate(${rotation} ${center} ${center})"
                opacity="0.85"
              >
                <title>${seg.label}: ${(pct * 100).toFixed(1)}%</title>
              </circle>
            `;
          })}
          ${this.centerLabel
            ? svg`
                <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" class="center-text">
                  <tspan x="${center}" dy="-0.3em" class="center-val">${this.centerLabel}</tspan>
                  ${this.centerSub
                    ? svg`<tspan x="${center}" dy="1.3em" class="center-sub">${this.centerSub}</tspan>`
                    : ''}
                </text>
              `
            : ''}
        </svg>
        <div class="legend">
          ${this.segments.map((seg) => {
            const pct = (Math.abs(seg.value) / total) * 100;
            return html`
              <div class="legend-item">
                <span class="legend-dot" style="background:${seg.color}"></span>
                <span class="legend-label">${seg.label}</span>
                <span class="legend-pct">${pct.toFixed(1)}%</span>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; overflow: hidden; min-width: 0; }
    .chart-container {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 16px;
      max-width: 100%;
      box-sizing: border-box;
    }
    .donut {
      width: 120px;
      height: 120px;
      flex-shrink: 0;
    }
    .center-text { pointer-events: none; }
    .center-val {
      font-size: 14px;
      font-weight: 600;
      fill: var(--primary-text-color, #333);
    }
    .center-sub {
      font-size: 9px;
      fill: var(--secondary-text-color, #757575);
    }
    .legend {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      overflow: hidden;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      color: var(--primary-text-color);
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .legend-pct {
      flex-shrink: 0;
      color: var(--secondary-text-color);
      font-variant-numeric: tabular-nums;
    }
    .empty {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.82rem;
    }
  `;
}

if (!customElements.get('parqet-donut-chart')) {
  customElements.define('parqet-donut-chart', ParqetDonutChart);
}

declare global {
  interface HTMLElementTagNameMap {
    'parqet-donut-chart': ParqetDonutChart;
  }
}
