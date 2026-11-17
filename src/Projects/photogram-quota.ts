import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

function humanFileSize(size: number) {
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return `${Number((size / Math.pow(1024, i)).toFixed(2))} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`;
}

/** The storage used out of the quota, as a bar fixed to the bottom of the window. Sizes in bytes. */
@customElement('photogram-quota')
export class PhotogramQuota extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      background-color: var(--pg-color-surface);
      margin: auto;
      min-height: 2rem;
      align-items: center;
      justify-content: center;
      padding: var(--pg-space-2) var(--pg-space-4);
      position: fixed;
      bottom: 0;
      max-width: 560px;
      left: 0;
      right: 0;
    }

    progress {
      margin: 0 var(--pg-space-2);
    }
  `;

  @property({ type: Number }) accessor value = 0;

  @property({ type: Number }) accessor max = 0;

  render() {
    return html`<span>Disk space usage:</span
      ><progress max=${this.max} value=${this.value}></progress
      ><em>${humanFileSize(this.value)} / ${humanFileSize(this.max)}</em>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-quota': PhotogramQuota;
  }
}
