import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { observeTitle, unobserveTitle } from './titleSizing';

// Fits `.action` to `.action-container` with an inline font-size, which e2e's waitForTitleSizing reads. titleSizing
// re-sizes it when its text changes, so `updated()` has nothing to do.
@customElement('photogram-action')
export class PhotogramAction extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    .action {
      line-height: initial;
      margin: 0;
    }
  `;

  @property() accessor value: string | undefined;

  // Not a `ref()`: Lit clears those on disconnect, before `disconnectedCallback` could unobserve the title.
  #title: HTMLElement | null = null;

  connectedCallback() {
    super.connectedCallback();
    if (this.#title) {
      observeTitle(this.#title);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#title) {
      unobserveTitle(this.#title);
    }
  }

  protected firstUpdated() {
    this.#title = this.renderRoot.querySelector<HTMLElement>('.action');
    // Lit still renders an element removed before its first update: it is observed once connected.
    if (this.isConnected && this.#title) {
      observeTitle(this.#title);
    }
  }

  render() {
    return html`<div part="container" class="action-container">
      <p class="action">${this.value}</p>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-action': PhotogramAction;
  }
}
