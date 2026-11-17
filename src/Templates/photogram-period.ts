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
        background-color: color-mix(
          in srgb,
          var(--pg-grey-400) 73.3%,
          transparent
        );
      }

      .dot-dark::part(icon) {
        background-color: color-mix(
          in srgb,
          var(--pg-grey-600) 73.3%,
          transparent
        );
      }

      .dot-lighter::part(icon) {
        background-color: color-mix(
          in srgb,
          var(--pg-grey-200) 73.3%,
          transparent
        );
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
