import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-icon.js';
import { indicatorStyles } from './indicator-styles';
import { toPeriod } from './period';

// Four silhouettes: the set has no sunrise or sunset, and wb_twilight_2 is wb_twilight without its rays. Morning is the
// sun on the horizon, evening the sun turning to the moon.
const icons = {
  morning: 'wb-twilight',
  day: 'clear-day',
  evening: 'brightness-4',
  night: 'clear-night',
};

/** The period icon, in the tile's text colour, or its indicator colour on a label-coloured tile. Without a period, a hidden icon holds its place, as fx's does. */
@customElement('photogram-period')
export class PhotogramPeriod extends LitElement {
  static styles = [
    indicatorStyles,
    css`
      :host {
        display: contents;
      }

      .period {
        color: var(--photogram-indicator-color, currentColor);
      }
    `,
  ];

  @property() accessor value: string | undefined;

  render() {
    const period = toPeriod(this.value);
    return html`<pg-icon
      class="indicator period ${period ? '' : 'hide'}"
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
