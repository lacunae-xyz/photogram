import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-icon.js';
import { dotStyles } from './dot-styles';
import { periodToClassName, periodToIcon } from './period';

@customElement('photogram-period')
export class PhotogramPeriod extends LitElement {
  static styles = [
    dotStyles,
    css`
      :host {
        display: contents;
      }

      .dot-light::part(icon) {
        /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
        background-color: #aaaaaabb;
      }

      .dot-dark::part(icon) {
        /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
        background-color: #666666bb;
      }

      .dot-lighter::part(icon) {
        /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
        background-color: #eeeeeebb;
      }

      .dot-darker::part(icon) {
        background-color: var(--pg-color-backdrop);
      }
    `,
  ];

  @property() accessor value: string | undefined;

  render() {
    return html`<pg-icon
      class="dot period ${periodToClassName(this.value)}"
      name=${periodToIcon(this.value)}
      label="period"
    ></pg-icon>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-period': PhotogramPeriod;
  }
}
