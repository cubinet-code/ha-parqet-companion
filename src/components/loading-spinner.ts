import { LitElement, html, css } from 'lit';

export class ParqetLoadingSpinner extends LitElement {
  render() {
    return html`
      <div class="container" role="status" aria-label="Loading">
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

if (!customElements.get('parqet-loading-spinner')) {
  customElements.define('parqet-loading-spinner', ParqetLoadingSpinner);
}

declare global {
  interface HTMLElementTagNameMap {
    'parqet-loading-spinner': ParqetLoadingSpinner;
  }
}
