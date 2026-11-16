import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { normalizeHex } from '../Application/colors';
import type { Colors } from '../Application/types';

const defaultColorFallback = '#ffffff';

/**
 * The default colour and the label colours, each with a native colour input.
 * Saves on `change` (the picker closed), not on every `input`.
 *
 * Events, bubbling and composed: `default-color-change` ({ color }), `color-change` ({ label, color }),
 * `color-delete` ({ label }).
 */
@customElement('photogram-colors')
export class PhotogramColors extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    input[type='color'] {
      width: 3.2rem;
      height: 3.2rem;
      padding: 2px;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      border-radius: 4px;
      cursor: pointer;
    }

    input[type='color']::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    input[type='color']::-webkit-color-swatch {
      border: none;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      border-radius: 2px;
    }

    input[type='color']::-moz-color-swatch {
      border: none;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      border-radius: 2px;
    }

    .btn-color {
      display: inline-block;
      opacity: 0;
      /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
      background: #fff;
      color: var(--pg-color-text-muted);
      font-weight: bold;
      /* stylelint-disable-next-line color-named -- pg: 6.5 */
      border: 1px solid silver;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      border-radius: 100px;
      transition: opacity 0.4s;
    }

    .btn-color:active {
      /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
      background: #ddd;
      color: var(--pg-color-text);
    }

    tr:hover .btn-color,
    .btn-color:focus-visible {
      opacity: 1;
    }
  `;

  @property({ attribute: 'default-color' }) accessor defaultColor:
    string | undefined;

  @property({ attribute: false }) accessor colors: Colors | undefined;

  #emit(type: string, detail: object) {
    this.dispatchEvent(
      new CustomEvent(type, { detail, bubbles: true, composed: true }),
    );
  }

  #colorInput(
    label: string,
    color: string | undefined,
    onChange: (color: string) => void,
  ) {
    return html`<input
      type="color"
      aria-label="${label} colour"
      .value=${normalizeHex(color) ?? '#000000'}
      @change=${(event: Event) =>
        onChange((event.target as HTMLInputElement).value)}
    />`;
  }

  render() {
    return html`<table>
        <tbody>
          <tr>
            <td>
              ${this.#colorInput(
                'Default',
                this.defaultColor ?? defaultColorFallback,
                color => this.#emit('default-color-change', { color }),
              )}
            </td>
            <td>Default</td>
          </tr>
        </tbody>
      </table>
      ${
        this.colors
          ? html`<table>
              <tbody>
                ${repeat(
                  Object.entries(this.colors),
                  ([label]) => label,
                  ([label, color]) =>
                    html`<tr>
                      <td>
                        ${this.#colorInput(label, color, color =>
                          this.#emit('color-change', { label, color }),
                        )}
                      </td>
                      <td>${label}</td>
                      <td>
                        <button
                          type="button"
                          class="btn-color"
                          aria-label="Delete label ${label}"
                          @click=${() => this.#emit('color-delete', { label })}
                        >
                          &#x2715;
                        </button>
                      </td>
                    </tr>`,
                )}
              </tbody>
            </table>`
          : null
      }`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-colors': PhotogramColors;
  }
}
