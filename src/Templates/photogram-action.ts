import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
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

  #title = createRef<HTMLElement>();

  connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated && this.#title.value) {
      observeTitle(this.#title.value);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#title.value) {
      unobserveTitle(this.#title.value);
    }
  }

  protected firstUpdated() {
    if (this.#title.value) {
      observeTitle(this.#title.value);
    }
  }

  render() {
    return html`<div part="container" class="action-container">
      <p class="action" ${ref(this.#title)}>${this.value}</p>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-action': PhotogramAction;
  }
}
