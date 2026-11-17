import type { Root } from 'react-dom/client';

/**
 * Fixor, a React app, in a light-DOM host: its CSS is global. Loads React and Fixor on first connect.
 * Unmounts Fixor when disconnected.
 *
 * Until Fixor moves out (07): not a Lit element, it renders nothing itself.
 */
export class PhotogramFixor extends HTMLElement {
  #root: Root | undefined;

  connectedCallback() {
    // Fixor stays light until its Lit port (07): the tokens resolve light inside, on a light page that fills the
    // window. Its text colour is resolved here, not inherited from a dark body.
    Object.assign(this.style, {
      display: 'block',
      minHeight: '100vh',
      colorScheme: 'light',
      color: 'var(--pg-color-text)',
      backgroundColor: 'var(--pg-color-surface)',
    });
    this.#mount();
  }

  disconnectedCallback() {
    this.#root?.unmount();
    this.#root = undefined;
  }

  async #mount() {
    const [{ StrictMode, createElement }, { createRoot }, { default: Fixor }] =
      await Promise.all([
        import('react'),
        import('react-dom/client'),
        import('./index.jsx'),
      ]);
    if (!this.isConnected || this.#root) {
      return;
    }
    this.#root = createRoot(this);
    this.#root.render(createElement(StrictMode, null, createElement(Fixor)));
  }
}

customElements.define('photogram-fixor', PhotogramFixor);

declare global {
  interface HTMLElementTagNameMap {
    'photogram-fixor': PhotogramFixor;
  }
}
