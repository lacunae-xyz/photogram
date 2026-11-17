import { LitElement, css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-big-button.js';
import { canOpenFolder, pickFolder } from './folder-picker';

/**
 * The Open project button: picks a folder to link. Renders nothing where the browser has no folder picker.
 *
 * Event: `open`, with `detail.dirHandle`. Cancelling the picker sends nothing.
 */
@customElement('photogram-open-project')
export class PhotogramOpenProject extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  async #onClick() {
    const dirHandle = await pickFolder();
    if (dirHandle) {
      this.dispatchEvent(new CustomEvent('open', { detail: { dirHandle } }));
    }
  }

  render() {
    return canOpenFolder()
      ? html`<pg-big-button id="open-project-label" @click=${this.#onClick}
          >Open project</pg-big-button
        >`
      : nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-open-project': PhotogramOpenProject;
  }
}
