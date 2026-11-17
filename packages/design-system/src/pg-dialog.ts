import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';

/**
 * A modal native `<dialog>` around its content: focus trap, Escape and backdrop come from the browser.
 * Opens with `open`. Escape, a backdrop click or `open = false` close it and dispatch `close`.
 * Size it through `::part(dialog)`.
 */
@customElement('pg-dialog')
export class PgDialog extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    dialog {
      box-sizing: border-box;
      width: 100%;
      margin: 4% auto auto;
      padding: 0;
      border: 1px solid var(--pg-grey-500);
      background-color: var(--pg-color-surface-raised);
      color: inherit;
    }

    dialog::backdrop {
      background-color: var(--pg-color-backdrop);
    }

    .content {
      padding: 20px;
    }
  `;

  @property({ type: Boolean, reflect: true }) accessor open = false;

  /** The accessible name, when the content has no heading. */
  @property() accessor label = '';

  #dialog = createRef<HTMLDialogElement>();

  protected updated(changed: PropertyValues<this>) {
    const dialog = this.#dialog.value;
    if (!changed.has('open') || !dialog) {
      return;
    }
    if (this.open && !dialog.open) {
      dialog.showModal();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  #onClose() {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  }

  // The content box fills the dialog, so a click on the dialog itself is a click on the backdrop.
  #onClick(event: MouseEvent) {
    if (event.target === this.#dialog.value) {
      this.#dialog.value.close();
    }
  }

  render() {
    return html`<dialog
      part="dialog"
      aria-label=${this.label || nothing}
      @close=${this.#onClose}
      @click=${this.#onClick}
      ${ref(this.#dialog)}
    >
      <div class="content"><slot></slot></div>
    </dialog>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pg-dialog': PgDialog;
  }
}
