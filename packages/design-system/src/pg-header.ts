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
      align-items: center;
      padding: 20px 0;
    }

    .logo {
      height: 5rem;
      width: 5rem;
    }

    .home {
      margin: 2.4rem;
      flex-grow: 1;
      text-decoration: none;
      color: var(--pg-grey-950);
    }

    h1 {
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      font-size: 3.2rem;
      margin: 0;
    }

    p {
      margin: 0;
      margin-left: 0.2rem;
    }

    ul {
      display: flex;
      list-style: none;
    }

    nav a {
      display: block;
      padding: 1.6rem 1.6rem;
      text-decoration: none;
      color: var(--pg-grey-950);
      border-bottom: 0.3rem solid var(--pg-color-border);
      margin-left: 0.8rem;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      font-size: 1.8rem;
    }

    nav a[aria-current='page'] {
      /* stylelint-disable-next-line function-disallowed-list -- pg: 6.5 */
      border-bottom-color: rgba(180, 220, 220, 1);
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
