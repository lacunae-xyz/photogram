import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

export type PgHeaderLink = { href: string; label: string };

/**
 * An app's header: its logo, its name and tagline linking home, and its navigation.
 * The link whose `href` is `current` is marked as the current page.
 */
@customElement('pg-header')
export class PgHeader extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: var(--pg-color-on-chrome);
      /* The band spans the viewport, the content keeps its page's column. Ink overflow: no scrollbar. */
      border-image: linear-gradient(var(--pg-color-chrome) 0 0) fill 0 / 0 / 0
        100vw;
    }

    header {
      display: flex;
      font-family: var(--pg-font-mono);
      align-items: center;
      padding: var(--pg-space-4) 0;
    }

    /* A mask, not an <img>: a one-colour logo takes the text colour, on the chrome and in print. */
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

    .home {
      margin: var(--pg-space-5);
      flex-grow: 1;
    }

    h1 {
      font-size: var(--pg-font-size-4);
      margin: 0;
    }

    p {
      margin: 0;
      margin-left: 0.125rem;
      font-size: var(--pg-font-size-1);
      opacity: 0.7;
    }

    ul {
      display: flex;
      gap: var(--pg-space-2);
      list-style: none;
    }

    nav a {
      display: block;
      padding: var(--pg-space-2) var(--pg-space-3);
      border-radius: var(--pg-radius-pill);
      font-size: var(--pg-font-size-2);
    }

    nav a:hover {
      background-color: color-mix(
        in srgb,
        var(--pg-color-on-chrome) 10%,
        transparent
      );
    }

    nav a[aria-current='page'] {
      background-color: var(--pg-color-accent);
      color: var(--pg-color-on-accent);
      font-weight: 700;
    }

    @media (forced-colors: active) {
      .logo {
        forced-color-adjust: none;
        background-color: CanvasText;
      }

      nav a[aria-current='page'] {
        text-decoration: underline;
      }
    }

    @media print {
      :host {
        color: var(--pg-color-text);
        border-image: none;
      }

      nav a[aria-current='page'] {
        background-color: transparent;
        color: inherit;
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
    </header>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pg-header': PgHeader;
  }
}
