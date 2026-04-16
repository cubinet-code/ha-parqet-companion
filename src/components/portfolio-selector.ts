import { registerElement } from '../diagnostics-frontend';
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import type { Portfolio } from '../types';

export class ParqetPortfolioSelector extends LitElement {
  @property({ type: Array }) portfolios: Portfolio[] = [];
  @property() selected: string | null = null;

  private _handleChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.dispatchEvent(
      new CustomEvent('portfolio-change', {
        detail: { portfolioId: select.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    if (this.portfolios.length === 0) return html``;
    return html`
      <select
        class="selector"
        aria-label="Select portfolio"
        @change=${this._handleChange}
      >
        ${this.portfolios.map(
          (p) => html`
            <option value=${p.id} ?selected=${p.id === this.selected}>${p.name}</option>
          `,
        )}
      </select>
    `;
  }

  static styles = css`
    .selector {
      background: var(--secondary-background-color, #f5f5f5);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      outline: none;
    }
    .selector:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 1px;
    }
  `;
}

registerElement('parqet-portfolio-selector', ParqetPortfolioSelector);

declare global {
  interface HTMLElementTagNameMap {
    'parqet-portfolio-selector': ParqetPortfolioSelector;
  }
}
