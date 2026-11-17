import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-empty-state.js';

/**
 * The page for an address no route matches.
 *
 * Slot: `header`.
 */
@customElement('photogram-not-found')
export class PhotogramNotFound extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .not-found-container {
      max-width: 80rem;
      margin: auto;
      padding: 0 6.4rem;
    }

    pg-empty-state {
      margin: 6.4rem 0;
      align-items: safe center;
    }

    pg-empty-state::part(illustration) {
      width: 38.4rem;
    }

    a {
      color: var(--pg-color-accent-text);
    }
  `;

  render() {
    return html`<div class="not-found-container">
      <slot name="header"></slot>
      <pg-empty-state illustration="empty-street">
        <h1>Page not found</h1>
        <p>There is nothing at this address.</p>
        <a href="/">Go to the home page</a>
      </pg-empty-state>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-not-found': PhotogramNotFound;
  }
}
