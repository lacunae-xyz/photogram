import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-icon.js';
import { indicatorStyles } from './indicator-styles';
import { toPeriod } from './period';

// Master's MDI glyphs: the arrows tell sunrise from sunset, which no Material Symbol does.
const icons = {
  morning: 'weather-sunset-up',
  day: 'weather-sunny',
  evening: 'weather-sunset-down',
  night: 'weather-night',
};

/** The period dot: lighter by day, darker by night. Without a period, a hidden dot holds its place, as fx's does. */
@customElement('photogram-period')
export class PhotogramPeriod extends LitElement {
  static styles = [
    indicatorStyles,
    css`
      :host {
        display: contents;
      }

      /* Translucent, as they always were: the contrasts are the lowest over white, black or any palette colour. */
      .morning::part(icon) {
        background-color: color-mix(
          in srgb,
          var(--pg-grey-400) 73.3%,
          transparent
        );
        color: var(--pg-grey-950); /* 4.6:1 */
      }

      .day::part(icon) {
        background-color: color-mix(
          in srgb,
          var(--pg-grey-200) 73.3%,
          transparent
        );
        color: var(--pg-grey-950); /* 8.5:1 */
      }

      .evening::part(icon) {
        background-color: color-mix(
          in srgb,
          var(--pg-grey-600) 73.3%,
          transparent
        );
        color: var(--pg-color-on-chrome); /* 3.0:1 */
      }

      .night::part(icon) {
        background-color: var(--pg-color-backdrop);
        color: var(--pg-color-on-chrome); /* 7.2:1 */
      }
    `,
  ];

  @property() accessor value: string | undefined;

  render() {
    const period = toPeriod(this.value);
    return html`<pg-icon
      class="indicator period ${period ?? 'hide'}"
      name=${icons[period ?? 'day']}
      label=${period ? `period: ${period}` : 'period'}
    ></pg-icon>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-period': PhotogramPeriod;
  }
}
