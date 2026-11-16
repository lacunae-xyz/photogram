import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import empty from './empty.svg';

@customElement('photogram-image')
export class PhotogramImage extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    .img {
      width: 100%;
      object-fit: contain;
      background-color: var(--pg-color-chrome);
      aspect-ratio: 16/9;
    }
  `;

  @property() accessor url: string | null | undefined;

  render() {
    return html`<img
      part="img"
      class="img"
      src=${this.url || empty}
      alt="photogram"
    />`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-image': PhotogramImage;
  }
}
