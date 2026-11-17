import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-icon.js';
import { dotStyles } from './dot-styles';

@customElement('photogram-fx')
export class PhotogramFx extends LitElement {
  static styles = [
    dotStyles,
    css`
      :host {
        display: contents;
      }

      .dot-green::part(icon) {
        background-color: var(--pg-color-accent);
      }
    `,
  ];

  @property() accessor value: string | undefined;

  render() {
    return html`<pg-icon
      class="dot dot-green fx ${this.value ? '' : 'hide'}"
      name="auto-fix"
      label="special effects indicator"
    ></pg-icon>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-fx': PhotogramFx;
  }
}
