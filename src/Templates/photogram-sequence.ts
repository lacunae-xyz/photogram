import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import getContrastYIQ from './contrast';

@customElement('photogram-sequence')
export class PhotogramSequence extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    .sequence {
      display: inline-flex;
      min-width: 6rem;
      min-height: 4rem;
      padding: 0.6rem;
      justify-content: center;
      align-items: center;
      text-align: center;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      border-radius: 0.4rem;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      font-size: 2.6rem;
      font-weight: bold;
      margin-right: 0.8rem;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .sequence-colored-dark {
      /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
      color: #000000;
    }

    .sequence-colored-light {
      /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
      color: #ffffff;
    }
  `;

  @property() accessor value: string | undefined;

  @property() accessor color: string | undefined;

  render() {
    const colored = this.color
      ? `sequence-colored-${getContrastYIQ(this.color)}`
      : '';
    return html`<span
      part="sequence"
      class="sequence ${colored}"
      style=${styleMap({ background: this.color })}
      >${this.value}</span
    >`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-sequence': PhotogramSequence;
  }
}
