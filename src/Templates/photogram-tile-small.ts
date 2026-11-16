import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Tile } from './tile';
import { tileStyles } from './tile-styles';

@customElement('photogram-tile-small')
export class PhotogramTileSmall extends Tile {
  static styles = [
    tileStyles,
    css`
      :host {
        width: 31.4rem;
        margin: 0.8rem;
        padding: 0.8rem;
      }

      photogram-action::part(container) {
        flex: 1;
      }

      .indicators {
        flex: 0;
      }

      .legend {
        height: 9.6rem;
        overflow: hidden;
        padding-top: 0.8rem;
        display: flex;
      }

      photogram-sequence::part(sequence) {
        margin-bottom: 0.8rem;
      }
    `,
  ];

  // No whitespace between the indicators: they're inline here, so it would add spaces.
  render() {
    return html`<photogram-image .url=${this.url}></photogram-image>
      <div class="legend">
        <div class="indicators">
          <photogram-sequence
            .color=${this.color}
            .value=${this.sequence}
          ></photogram-sequence
          ><photogram-period .value=${this.period}></photogram-period
          ><photogram-fx .value=${this.fx}></photogram-fx>
        </div>
        <photogram-action .value=${this.action}></photogram-action>
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-tile-small': PhotogramTileSmall;
  }
}
