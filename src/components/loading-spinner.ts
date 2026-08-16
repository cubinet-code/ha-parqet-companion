import { registerElement } from '../diagnostics-frontend';
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import type { Hass } from '../types';
import { t } from '../localize';

export class ParqetLoadingSpinner extends LitElement {
  @property({ attribute: false }) hass?: Hass;

  render() {
    return html`
      <div class="container" role="status" aria-label=${t('common.loading', this.hass)}>
        <div class="spinner"></div>
      </div>
    `;
  }

  static styles = css`
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 32px;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid var(--divider-color, #e0e0e0);
      border-top-color: var(--primary-color, #03a9f4);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;
}

registerElement('parqet-loading-spinner', ParqetLoadingSpinner);

declare global {
  interface HTMLElementTagNameMap {
    'parqet-loading-spinner': ParqetLoadingSpinner;
  }
}
