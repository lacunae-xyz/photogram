import { LitElement, css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { canOpenFolder, pickFolder } from './folder-picker';
import { raisedButtonStyles } from './raised-button-styles';

/**
 * The Open project button: picks a folder to link. Renders nothing where the browser has no folder picker.
 *
 * Event: `open`, with `detail.dirHandle`. Cancelling the picker sends nothing.
 */
@customElement('photogram-open-project')
export class PhotogramOpenProject extends LitElement {
  static styles = [
    raisedButtonStyles,
    css`
      :host {
        display: block;
      }
    `,
  ];

  async #onClick() {
    const dirHandle = await pickFolder();
    if (dirHandle) {
      this.dispatchEvent(new CustomEvent('open', { detail: { dirHandle } }));
    }
  }

  render() {
    return canOpenFolder()
      ? html`<button
          type="button"
          class="raised"
          id="open-project-label"
          @click=${this.#onClick}
        >
          Open project
        </button>`
      : nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-open-project': PhotogramOpenProject;
  }
}
