import { registerElement } from '../diagnostics-frontend';
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { INTERVALS } from '../const';
import type { IntervalValue } from '../const';

export class ParqetIntervalSelector extends LitElement {
  @property() selected: IntervalValue = '1y';

  private _select(value: IntervalValue) {
    this.selected = value;
    this.dispatchEvent(
      new CustomEvent('interval-change', {
        detail: { interval: value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="intervals" role="group" aria-label="Time interval">
        ${INTERVALS.map(
          ({ value, label }) => html`
            <button
              class="btn ${this.selected === value ? 'active' : ''}"
              @click=${() => this._select(value)}
              aria-pressed=${this.selected === value}
            >
              ${label}
            </button>
          `,
        )}
      </div>
    `;
  }

  static styles = css`
    .intervals {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 8px 16px;
    }
    .btn {
      padding: 3px 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      background: none;
      color: var(--secondary-text-color);
      font-size: 0.72rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn.active {
      background: var(--primary-color, #03a9f4);
      color: white;
      border-color: var(--primary-color, #03a9f4);
    }
    .btn:hover:not(.active) {
      color: var(--primary-text-color);
      border-color: var(--primary-text-color);
    }
    .btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 1px;
    }
  `;
}

registerElement('parqet-interval-selector', ParqetIntervalSelector);

declare global {
  interface HTMLElementTagNameMap {
    'parqet-interval-selector': ParqetIntervalSelector;
  }
}
