import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  currentTheme,
  observeColorScheme,
  setTheme,
  storedTheme,
  applyTheme,
  themeStorageKey,
  themes,
  type Theme,
} from './theme';

const labels: Record<Theme, string> = {
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
};

/**
 * Picks the colour scheme: Auto follows the OS, Light and Dark override it on this browser.
 * Draws in the text colour around it, so it reads on the header's chrome as on a page. Hidden in print.
 */
@customElement('pg-theme-switch')
export class PgThemeSwitch extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
    }

    div {
      display: flex;
      gap: 2px;
      padding: 2px;
      border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
      border-radius: var(--pg-radius-pill);
    }

    button {
      padding: var(--pg-space-1) var(--pg-space-2);
      border: none;
      border-radius: var(--pg-radius-pill);
      color: inherit;
      background-color: transparent;
      font-family: var(--pg-font-mono);
      font-size: var(--pg-font-size-1);
      cursor: pointer;
    }

    button:hover {
      background-color: color-mix(in srgb, currentColor 10%, transparent);
    }

    button[aria-pressed='true'] {
      background-color: var(--pg-color-accent);
      color: var(--pg-color-on-accent);
      font-weight: 700;
    }

    button:focus-visible {
      outline: 2px solid var(--pg-color-focus);
      outline-offset: 2px;
    }

    @media (forced-colors: active) {
      button[aria-pressed='true'] {
        text-decoration: underline;
      }
    }

    @media print {
      :host {
        display: none;
      }
    }
  `;

  @state() private accessor theme: Theme = currentTheme();

  #unobserve: (() => void) | undefined;

  /** Another tab picked a theme. */
  readonly #onStorage = (event: StorageEvent) => {
    if (event.key === themeStorageKey || event.key === null) {
      applyTheme(storedTheme());
    }
  };

  connectedCallback() {
    super.connectedCallback();
    this.theme = currentTheme();
    this.#unobserve = observeColorScheme(() => {
      this.theme = currentTheme();
    });
    window.addEventListener('storage', this.#onStorage);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#unobserve?.();
    window.removeEventListener('storage', this.#onStorage);
  }

  #pick(theme: Theme) {
    setTheme(theme);
    this.theme = theme;
  }

  render() {
    return html`<div role="group" aria-label="Theme">
      ${themes.map(
        theme =>
          html`<button
            type="button"
            aria-pressed=${theme === this.theme}
            @click=${() => this.#pick(theme)}
          >
            ${labels[theme]}
          </button>`,
      )}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pg-theme-switch': PgThemeSwitch;
  }
}
