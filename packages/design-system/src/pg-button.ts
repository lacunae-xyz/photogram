import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

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
      height: 1.75rem;
      padding: 0.625rem;
      line-height: 0.625rem;
      font-size: var(--pg-font-size-2);
      text-transform: uppercase;
      border: none;
      background-color: transparent;
    }

    /* :enabled keeps the browser's disabled colour. */
    button:enabled {
      color: var(--pg-color-accent-text);
    }

    button:enabled:hover,
    button:focus {
      background-color: var(--pg-color-hover);
    }

    button:focus-visible {
      outline: 2px solid var(--pg-color-focus);
      outline-offset: 2px;
    }

    :host([variant='icon']) button {
      display: flex;
      height: auto;
      padding: 0.5rem;
      line-height: 0;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      border-radius: 62.5rem;
    }

    :host([variant='icon']) button:enabled {
      color: inherit;
    }

    :host([variant='icon']) button:enabled:hover {
      color: var(--pg-color-accent-text);
    }
  `;

  @property({ reflect: true }) accessor variant: 'icon' | undefined;

  @property() accessor type: 'button' | 'submit' | 'reset' = 'button';

  /** The accessible name, for icon-only buttons. */
  @property() accessor label = '';

  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  /** Set by a disabled `<fieldset>` around it. */
  @state() private accessor formDisabled = false;

  #internals = this.attachInternals();

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

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
      ?disabled=${this.disabled || this.formDisabled}
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
