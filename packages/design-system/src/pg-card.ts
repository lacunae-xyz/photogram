import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * A card: media with an optional badge, in a light circle in its bottom-right corner, a centred heading, and actions beside it, shown on hover or focus (always without hover).
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
      flex-direction: column;
      padding: var(--pg-space-2);
      padding-bottom: 0;
      text-align: center;
      border: 1px solid var(--pg-grey-400);
      background-color: var(--pg-color-surface-raised);
    }

    :host(:hover) {
      outline: 0.1875rem solid var(--pg-grey-300);
      cursor: pointer;
    }

    .media {
      min-height: 10rem;
      display: flex;
      position: relative;
      align-items: center;
      justify-content: center;
      flex-grow: 1;
      background-color: var(--pg-color-chrome);
    }

    .badge {
      position: absolute;
      bottom: 0;
      right: 0;
      display: flex;
      margin: var(--pg-space-2);
      padding: var(--pg-space-1);
      border-radius: var(--pg-radius-pill);
      color: var(--pg-color-on-chrome);
      background-color: var(--pg-color-backdrop);
    }

    .badge[hidden] {
      display: none;
    }

    /* The heading in the middle column, so the actions beside it don't push it off centre. */
    .body {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
    }

    .heading {
      grid-column: 2;
      padding: var(--pg-space-4);
      display: block;
      color: var(--pg-color-text-muted);
      text-decoration: none;
    }

    .actions {
      grid-column: 3;
      justify-self: end;
      display: flex;
      opacity: 0;
      transition: opacity 0.4s;
    }

    :host(:hover) .actions,
    :host(:focus-within) .actions {
      opacity: 1;
    }

    /* No hover to reveal them on touch screens. */
    @media (hover: none) {
      .actions {
        opacity: 1;
      }
    }
  `;

  @property() accessor heading = '';

  @property() accessor href: string | undefined;

  @state() private accessor hasBadge = false;

  #onBadgeChange(event: Event) {
    this.hasBadge =
      (event.target as HTMLSlotElement).assignedElements().length > 0;
  }

  render() {
    return html`<div class="media" part="media">
        <slot name="media"></slot>
        <div class="badge" ?hidden=${!this.hasBadge}>
          <slot name="badge" @slotchange=${this.#onBadgeChange}></slot>
        </div>
      </div>
      <div class="body">
        ${
          this.href === undefined
            ? html`<span class="heading" part="heading">${this.heading}</span>`
            : html`<a class="heading" part="heading" href=${this.href}
                >${this.heading}</a
              >`
        }
        <div class="actions"><slot name="actions"></slot></div>
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pg-card': PgCard;
  }
}
