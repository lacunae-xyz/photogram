import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-button.js';
import '@lacunae-xyz/photogram-design-system/pg-icon.js';

/**
 * The project page bar: back, the project name, export, print.
 *
 * Events: `back`, `export` (only offered with `exportable`), `print`.
 */
@customElement('photogram-toolbar')
export class PhotogramToolbar extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .toolbar {
      display: flex;
      background-color: var(--pg-color-surface);
      box-shadow: var(--pg-shadow-1);
      height: 100%;
      align-items: center;
    }

    h1 {
      flex-grow: 1;
      margin: 0;
      text-align: left;
      font-size: var(--pg-font-size-4);
    }

    pg-button {
      margin: 0 0.5rem;
    }

    .button-export::part(button) {
      height: auto;
      padding: 0.5rem 0.75rem;
      border-radius: var(--pg-radius-s);
      font: inherit;
      font-weight: bold;
      text-transform: none;
      cursor: pointer;
    }
  `;

  @property() accessor heading: string | undefined;

  @property({ type: Boolean }) accessor exportable = false;

  #emit(type: string) {
    this.dispatchEvent(new Event(type));
  }

  render() {
    return html`<div class="toolbar">
      <pg-button
        variant="icon"
        label="Close"
        class="button button-close"
        @click=${() => this.#emit('back')}
        ><pg-icon name="arrow-back"></pg-icon
      ></pg-button>
      <h1>${this.heading}</h1>
      ${
        this.exportable
          ? html`<pg-button
              class="button-export"
              @click=${() => this.#emit('export')}
              >Export data.json</pg-button
            >`
          : nothing
      }
      <pg-button
        variant="icon"
        label="Print"
        class="button button-print"
        @click=${() => this.#emit('print')}
        ><pg-icon name="print"></pg-icon
      ></pg-button>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-toolbar': PhotogramToolbar;
  }
}
