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
      /* stylelint-disable-next-line color-no-hex, declaration-property-value-disallowed-list -- pg: 6.5 */
      box-shadow: 0px 0px 4px #4444;
      height: 100%;
      align-items: center;
    }

    h1 {
      flex-grow: 1;
      margin: 0;
      text-align: left;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      font-size: 2rem;
    }

    pg-button {
      margin: 0 0.8rem;
    }

    .button-export::part(button) {
      height: auto;
      padding: 0.8rem 1.2rem;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      border-radius: 0.4rem;
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
