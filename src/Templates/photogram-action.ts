import { LitElement, css, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import FontSizeAdjuster from './FontSizeAdjuster';

const fontSizeAdjuster = new FontSizeAdjuster(0.2, 2);

// Fits `.action` to `.action-container` with an inline font-size, which e2e's waitForTitleSizing reads.
function sizeTitle(title: HTMLElement) {
  fontSizeAdjuster.apply(title);
}

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

  #scheduled = false;

  protected updated(changed: PropertyValues<this>) {
    if (!this.#scheduled) {
      this.#scheduled = true;
      setTimeout(() => this.#sizeTitle(), 200);
    } else if (changed.has('value')) {
      this.#sizeTitle();
    }
  }

  #sizeTitle() {
    if (this.#title.value) {
      sizeTitle(this.#title.value);
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
