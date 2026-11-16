import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Tile } from './tile';
import { tileStyles } from './tile-styles';

@customElement('photogram-tile-large')
export class PhotogramTileLarge extends Tile {
  static styles = [
    tileStyles,
    css`
      :host {
        width: 80rem;
        height: 23.6rem;
        margin: 0.8rem;
        padding: 0.8rem;
        display: inline-grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 3fr 7fr;
        grid-template-areas: 'img indicators' 'img action';
        grid-column-gap: 0.8rem;
      }

      photogram-image::part(img) {
        grid-area: img;
        height: 100%;
      }

      photogram-action::part(container) {
        overflow: hidden;
        grid-area: action;
      }

      .indicators {
        grid-area: indicators;
        display: flex;
        align-items: center;
        align-content: flex-start;
        margin-bottom: 0.8rem;
      }
    `,
  ];

  render() {
    return html`<photogram-image .url=${this.url}></photogram-image>
      <div class="indicators">
        <photogram-sequence
          .color=${this.color}
          .value=${this.sequence}
        ></photogram-sequence>
        <photogram-period .value=${this.period}></photogram-period>
        <photogram-fx .value=${this.fx}></photogram-fx>
      </div>
      <photogram-action .value=${this.action}></photogram-action>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-tile-large': PhotogramTileLarge;
  }
}
