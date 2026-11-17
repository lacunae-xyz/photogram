import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-icon.js';
import { indicatorStyles } from './indicator-styles';

/** The fx icon, in `--pg-color-accent-icon`, or the tile's text colour on a label-coloured tile. Hidden without fx. */
@customElement('photogram-fx')
export class PhotogramFx extends LitElement {
  static styles = [
    indicatorStyles,
    css`
      :host {
        display: contents;
      }

      .fx {
        color: var(--photogram-fx-color, var(--pg-color-accent-icon));
      }
    `,
  ];

  @property() accessor value: string | undefined;

  render() {
    return html`<pg-icon
      class="indicator fx ${this.value ? '' : 'hide'}"
      name="auto-fix-high"
      label="special effects indicator"
    ></pg-icon>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-fx': PhotogramFx;
  }
}
