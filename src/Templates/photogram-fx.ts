import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-icon.js';
import { indicatorStyles } from './indicator-styles';

/** The fx dot: the icon on the accent fill. Hidden without fx. */
@customElement('photogram-fx')
export class PhotogramFx extends LitElement {
  static styles = [
    indicatorStyles,
    css`
      :host {
        display: contents;
      }

      /* 9.9:1 */
      .fx::part(icon) {
        background-color: var(--pg-color-accent);
        color: var(--pg-color-on-accent);
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
