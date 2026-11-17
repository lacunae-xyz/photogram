import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-big-button.js';

/**
 * The Import project button: picks a folder through a file input.
 *
 * Event: `import`, with `detail.files`, a copy of the picked files.
 */
@customElement('photogram-import-project')
export class PhotogramImportProject extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    #import-project-file {
      display: none;
    }
  `;

  @query('input') private accessor input!: HTMLInputElement;

  #onChange() {
    // Clearing the input empties its live FileList.
    const files = [...(this.input.files ?? [])];
    this.input.value = '';
    if (files.length > 0) {
      this.dispatchEvent(new CustomEvent('import', { detail: { files } }));
    }
  }

  render() {
    return html`<input
        type="file"
        id="import-project-file"
        webkitdirectory
        directory
        multiple
        @change=${this.#onChange}
      /><pg-big-button
        id="import-project-label"
        @click=${() => this.input.click()}
        >Import project</pg-big-button
      >`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-import-project': PhotogramImportProject;
  }
}
