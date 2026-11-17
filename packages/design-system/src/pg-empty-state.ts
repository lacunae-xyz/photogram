import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './pg-illustration';

/**
 * What a screen shows when it has nothing yet: an illustration above its content, centred in a column.
 * Size the illustration through `::part(illustration)`. Its `label` names it, else it's decorative.
 *
 * Slot: default, the text and actions under the illustration.
 */
@customElement('pg-empty-state')
export class PgEmptyState extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  `;

  @property() accessor illustration = '';

  @property() accessor label = '';

  render() {
    return html`<pg-illustration
        exportparts="image: illustration"
        name=${this.illustration}
        label=${this.label}
      ></pg-illustration
      ><slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pg-empty-state': PgEmptyState;
  }
}
