import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

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
    }

    header {
      display: flex;
      font-family: var(--pg-font-mono);
      align-items: center;
      padding: 20px 0;
    }

    .logo {
      height: 3.125rem;
      width: 3.125rem;
    }

    .home {
      margin: 1.5rem;
      flex-grow: 1;
      text-decoration: none;
      color: var(--pg-grey-950);
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

    nav a {
      display: block;
      padding: 1rem 1rem;
      text-decoration: none;
      color: var(--pg-grey-950);
      border-bottom: 0.1875rem solid var(--pg-color-border);
      margin-left: 0.5rem;
      font-size: var(--pg-font-size-2);
    }

    nav a[aria-current='page'] {
      border-bottom-color: var(--pg-color-accent);
    }

    nav a:hover,
    nav a:focus {
      background-color: var(--pg-grey-200);
    }

    nav a:active {
      background-color: var(--pg-color-hover);
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
          : html`<img class="logo" src=${this.logo} alt=${this.logoLabel} />`
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
