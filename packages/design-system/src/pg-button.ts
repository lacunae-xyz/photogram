import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A flat button: a real `<button>` in its shadow root, so it takes focus and the keyboard.
 * `variant="icon"` is round and icon-only: give it a `label`. `type="submit"` and `"reset"` act on the enclosing form.
 */
@customElement('pg-button')
export class PgButton extends LitElement {
  static formAssociated = true;

  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      height: 2.8rem;
      padding: 1rem;
      line-height: 1rem;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      font-size: 1.4rem;
      text-transform: uppercase;
      border: none;
      background-color: transparent;
    }

    button:hover,
    button:focus {
      background-color: var(--pg-color-hover);
    }

    :host([variant='icon']) button {
      display: flex;
      height: auto;
      padding: 0.8rem;
      line-height: 0;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      border-radius: 100rem;
    }
  `;

  @property({ reflect: true }) accessor variant: 'icon' | undefined;

  @property() accessor type: 'button' | 'submit' | 'reset' = 'button';

  /** The accessible name, for icon-only buttons. */
  @property() accessor label = '';

  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  #internals = this.attachInternals();

  #onClick() {
    const form = this.#internals.form;
    if (this.type === 'submit') {
      form?.requestSubmit();
    } else if (this.type === 'reset') {
      form?.reset();
    }
  }

  render() {
    return html`<button
      part="button"
      type=${this.type}
      aria-label=${this.label || nothing}
      ?disabled=${this.disabled}
      @click=${this.#onClick}
    >
      <slot></slot>
    </button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pg-button': PgButton;
  }
}
