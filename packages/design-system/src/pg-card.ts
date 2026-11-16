import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A card: media with an optional badge in its bottom-right corner, a heading, and actions shown on hover or focus.
 * With an `href`, the heading is a link. Size it from outside (`width`, `margin`).
 *
 * Slots: `media`, `badge`, `actions`.
 */
@customElement('pg-card')
export class PgCard extends LitElement {
  static styles = css`
    :host {
      position: relative;
      display: flex;
      align-content: flex-end;
      flex-direction: column;
      padding: 0.8rem;
      padding-bottom: 0;
      text-align: center;
      /* stylelint-disable-next-line color-named -- pg: 6.5 */
      border: 1px solid silver;
      background-color: var(--pg-color-surface-raised);
    }

    :host(:hover) {
      /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
      outline: 0.3rem solid #ccc;
      cursor: pointer;
    }

    .media {
      min-height: 16rem;
      display: flex;
      position: relative;
      align-items: center;
      justify-content: center;
      flex-grow: 1;
      /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
      background-color: #000;
    }

    .badge {
      position: absolute;
      bottom: 0;
      right: 0;
      display: flex;
      margin: 6px;
    }

    .heading {
      padding: 1.6rem;
      display: block;
      /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
      color: #000000bb;
      text-decoration: none;
    }

    .actions {
      position: absolute;
      top: -1.3rem;
      left: -1.3rem;
      display: flex;
      opacity: 0;
      transition: opacity 0.4s;
    }

    :host(:hover) .actions,
    :host(:focus-within) .actions {
      opacity: 1;
    }
  `;

  @property() accessor heading = '';

  @property() accessor href: string | undefined;

  render() {
    return html`<div class="media" part="media">
        <slot name="media"></slot>
        <div class="badge"><slot name="badge"></slot></div>
      </div>
      ${
        this.href === undefined
          ? html`<span class="heading" part="heading">${this.heading}</span>`
          : html`<a class="heading" part="heading" href=${this.href}
              >${this.heading}</a
            >`
      }
      <div class="actions"><slot name="actions"></slot></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pg-card': PgCard;
  }
}
