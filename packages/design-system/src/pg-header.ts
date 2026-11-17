import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

export type PgHeaderLink = { href: string; label: string };

/**
 * An app's header: its logo, its name and tagline linking home, its navigation, and its children after them
 * (Photogram's theme switch). The link whose `href` is `current` is marked as the current page.
 */
@customElement('pg-header')
export class PgHeader extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: var(--pg-color-text);
    }

    /* Wraps what doesn't fit, the children first: they go to their own row, at the end, and the logo, name and
       navigation keep theirs. */
    header {
      display: flex;
      flex-wrap: wrap;
      row-gap: var(--pg-space-2);
      font-family: var(--pg-font-mono);
      align-items: center;
      padding: var(--pg-space-4) 0;
    }

    /* A mask, not an <img>: a one-colour logo takes the text colour, in both schemes and in print. */
    .logo {
      height: 3.125rem;
      width: 3.125rem;
      flex-shrink: 0;
      background-color: currentColor;
      mask: var(--logo) center / contain no-repeat;
      print-color-adjust: exact;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    a:focus-visible {
      outline: 2px solid var(--pg-color-focus);
      outline-offset: 2px;
    }

    /* Grows from its narrowest, the tagline wrapped, so the line breaks after the navigation. */
    .home {
      margin: var(--pg-space-5);
      flex: 1 1 0;
    }

    h1 {
      font-size: var(--pg-font-size-4);
      margin: 0;
    }

    p {
      margin: 0;
      margin-left: 0.125rem;
      font-size: var(--pg-font-size-1);
    }

    ul {
      display: flex;
      list-style: none;
    }

    ::slotted(*) {
      margin-left: auto;
      padding-left: var(--pg-space-4);
    }

    nav a {
      display: block;
      padding: var(--pg-space-4);
      border-bottom: 0.1875rem solid var(--pg-color-border);
      margin-left: var(--pg-space-2);
      font-size: var(--pg-font-size-2);
    }

    /* accent-icon, not accent: the underline is the current page's only mark, 3:1 on the surface. */
    nav a[aria-current='page'] {
      border-bottom-color: var(--pg-color-accent-icon);
    }

    nav a:hover,
    nav a:focus {
      background-color: var(--pg-color-fill);
    }

    nav a:active {
      background-color: var(--pg-color-hover);
    }

    @media (forced-colors: active) {
      .logo {
        forced-color-adjust: none;
        background-color: CanvasText;
      }

      /* Forced colours paint every underline in CanvasText. */
      nav a[aria-current='page'] {
        text-decoration: underline;
      }
    }
  `;

  @property() accessor heading = '';

  @property() accessor tagline = '';

  /** Where the name and tagline link to. */
  @property() accessor href = '/';

  /** The logo's URL. */
  @property() accessor logo: string | undefined;

  @property({ attribute: 'logo-label' }) accessor logoLabel = '';

  @property({ attribute: false }) accessor links: PgHeaderLink[] = [];

  /** The `href` of the current page's link, if it has one. */
  @property() accessor current: string | undefined;

  render() {
    return html`<header>
      ${
        this.logo === undefined
          ? nothing
          : html`<span
              class="logo"
              role="img"
              aria-label=${this.logoLabel}
              style=${styleMap({
                '--logo': `url("${this.logo.replaceAll('"', '%22')}")`,
              })}
            ></span>`
      }
      <a class="home" href=${this.href}>
        <h1>${this.heading}</h1>
        <p>${this.tagline}</p>
      </a>
      ${
        this.links.length === 0
          ? nothing
          : html`<nav>
              <ul>
                ${this.links.map(
                  ({ href, label }) =>
                    html`<li>
                      <a
                        href=${href}
                        aria-current=${href === this.current ? 'page' : nothing}
                        >${label}</a
                      >
                    </li>`,
                )}
              </ul>
            </nav>`
      }
      <slot></slot>
    </header>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pg-header': PgHeader;
  }
}
