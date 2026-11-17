import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * A card: media with an optional badge, in a light circle in its bottom-right corner, a heading, and actions shown on hover or focus.
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
      padding: 0.5rem;
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
      /* Light, for the dark icons: --pg-color-backdrop once pg-icon paints in currentColor. */
      background-color: color-mix(
        in srgb,
        var(--pg-color-surface-raised) 60%,
        transparent
      );
    }

    .badge[hidden] {
      display: none;
    }

    .heading {
      padding: 1rem;
      display: block;
      color: var(--pg-color-text-muted);
      text-decoration: none;
    }

    .actions {
      position: absolute;
      top: -0.8125rem;
      left: -0.8125rem;
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
