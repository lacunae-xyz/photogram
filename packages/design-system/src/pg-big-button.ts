import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { PgButton } from './pg-button';

/** The raised button for the main action of a screen. Same API as `pg-button`. */
@customElement('pg-big-button')
export class PgBigButton extends PgButton {
  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      min-width: 88px;
      margin: var(--pg-space-1) var(--pg-space-2);
      padding: var(--pg-space-3) var(--pg-space-4);
      border: none;
      border-radius: var(--pg-radius-s);
      box-shadow: var(--pg-shadow-1);
      color: var(--pg-color-on-action);
      background-color: var(--pg-color-action);
      font-family: var(--pg-font-mono);
      font-size: var(--pg-font-size-2);
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      cursor: pointer;
    }

    button:hover {
      box-shadow: var(--pg-shadow-2);
    }

    button:focus-visible {
      outline: 2px solid var(--pg-color-focus);
      outline-offset: 2px;
    }

    button:disabled {
      box-shadow: none;
      cursor: default;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'pg-big-button': PgBigButton;
  }
}
