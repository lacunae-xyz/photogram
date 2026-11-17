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
      margin: 6px 8px;
      padding: 12px 16px;
      border: none;
      border-radius: var(--pg-radius-s);
      box-shadow: var(--pg-shadow-1);
      color: var(--pg-color-on-action);
      background-color: var(--pg-color-action);
      font-family: inherit;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      font-size: 16px;
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
