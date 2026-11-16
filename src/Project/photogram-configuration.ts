import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { palette } from '../Application/colors';
import type { ColorDistribution, Colors, Template } from '../Application/types';
import '../Templates/photogram-tile-large';
import '../Templates/photogram-tile-small';
import './photogram-colors';

const previewShot = {
  sequence: '1',
  action: 'Théo est avec ses invités',
  period: 'soir',
  fx: 'fx',
  url: '/demo/1.jpg',
  color: palette[5],
};

const fonts = [
  'Arial',
  'Arial Black',
  'Book Antiqua',
  'Charcoal',
  'Comic Sans MS',
  'Courier New',
  'Courier',
  'Gadget',
  'Geneva',
  'Georgia',
  'Impact',
  'Helvetica',
  'Lucida Grande',
  'Lucida Sans Unicode',
  'Lucida Console',
  'Monaco',
  'Palatino',
  'Palatino Linotype',
  'Tahoma',
  'Times New Roman',
  'Times',
  'Trebuchet MS',
  'Verdana',
  'cursive',
  'monospace',
  'serif',
  'sans-serif',
];

const preventSubmit = (event: Event) => event.preventDefault();

/**
 * The project settings panel: print spacing, font, template, label colours.
 *
 * Events: `print-space-around-change` ({ printSpaceAround }), `font-family-change` ({ fontFamily }),
 * `template-change` ({ template }), `color-distribution-change` ({ colorDistribution }),
 * plus the colour events of `photogram-colors`, which bubble out of it.
 */
@customElement('photogram-configuration')
export class PhotogramConfiguration extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .configuration {
      background: var(--pg-color-surface);
      text-align: left;
      width: 100%;
      height: 100%;
      overflow-y: auto;
    }

    h2 {
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      font-size: 2rem;
      margin: 1.6rem;
    }

    #font-family {
      margin-left: 1.6rem;
    }

    .template input {
      display: none;
    }

    .template label {
      display: block;
      padding: 5%;
    }

    .template label i {
      display: inline-block;
      color: var(--pg-color-text-subtle);
      margin-bottom: 5%;
    }

    .template input[type='radio']:checked + label {
      /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
      background-color: #eee;
    }

    .labels {
      margin-left: 1.6rem;
      margin-right: 1.6rem;
    }

    .preview {
      overflow: hidden;
      height: 12rem;
    }

    .preview:hover {
      cursor: pointer;
      background-color: var(--pg-color-hover);
    }

    .preview photogram-tile-small,
    .preview photogram-tile-large {
      transform: scale(0.25) !important;
      transform-origin: top left;
    }
  `;

  @property() accessor template: Template | undefined;

  @property({ attribute: 'font-family' }) accessor fontFamily:
    string | undefined;

  @property({ attribute: 'print-space-around', type: Boolean })
  accessor printSpaceAround: boolean | undefined;

  @property({ attribute: 'color-distribution' })
  accessor colorDistribution: ColorDistribution | undefined;

  @property({ attribute: 'default-color' }) accessor defaultColor:
    string | undefined;

  @property({ attribute: false }) accessor colors: Colors | undefined;

  #emit(type: string, detail: object) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  #onTemplate(event: Event) {
    this.#emit('template-change', {
      template: (event.target as HTMLInputElement).value,
    });
  }

  #templateOption(template: Template, name: string) {
    const shot = { ...previewShot, colorDistribution: this.colorDistribution };
    const tile =
      template === 'small'
        ? html`<photogram-tile-small
            .sequence=${shot.sequence}
            .action=${shot.action}
            .period=${shot.period}
            .fx=${shot.fx}
            .url=${shot.url}
            .color=${shot.color}
            .colorDistribution=${shot.colorDistribution}
          ></photogram-tile-small>`
        : html`<photogram-tile-large
            .sequence=${shot.sequence}
            .action=${shot.action}
            .period=${shot.period}
            .fx=${shot.fx}
            .url=${shot.url}
            .color=${shot.color}
            .colorDistribution=${shot.colorDistribution}
          ></photogram-tile-large>`;
    return html`<input
        type="radio"
        name="layout"
        id="layout_${template}"
        value=${template}
        .checked=${this.template === template}
        @change=${this.#onTemplate}
      />
      <label for="layout_${template}" class="preview"
        ><i>${name}</i><br />${tile}</label
      >`;
  }

  render() {
    return html`<div class="configuration">
      <section>
        <h2>Print options</h2>
        <div class="labels">
          <form @submit=${preventSubmit}>
            <input
              id="print-space-around"
              type="checkbox"
              .checked=${Boolean(this.printSpaceAround)}
              @change=${(event: Event) =>
                this.#emit('print-space-around-change', {
                  printSpaceAround: (event.target as HTMLInputElement).checked,
                })}
            /><label for="print-space-around">Space around cards</label>
          </form>
        </div>
      </section>
      <section>
        <h2>Font</h2>
        <form @submit=${preventSubmit}>
          <input
            id="font-family"
            type="text"
            list="font-list"
            .value=${this.fontFamily ?? ''}
            @input=${(event: Event) =>
              this.#emit('font-family-change', {
                fontFamily: (event.target as HTMLInputElement).value,
              })}
          />
          <datalist id="font-list">
            ${fonts.map(font => html`<option value=${font}></option>`)}
          </datalist>
        </form>
      </section>
      <section>
        <h2>Template</h2>
        <form class="template">
          ${this.#templateOption('small', 'Small')}
          ${this.#templateOption('large', 'Large')}
        </form>
      </section>

      <section>
        <h2>Labels</h2>
        <div class="labels">
          <input
            id="color-distribution"
            type="checkbox"
            .checked=${this.colorDistribution === 'card'}
            @change=${(event: Event) =>
              this.#emit('color-distribution-change', {
                colorDistribution: (event.target as HTMLInputElement).checked
                  ? 'card'
                  : 'indicator',
              })}
          /><label for="color-distribution">Background color</label>
        </div>
        <photogram-colors
          class="labels"
          .defaultColor=${this.defaultColor}
          .colors=${this.colors}
        ></photogram-colors>
      </section>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-configuration': PhotogramConfiguration;
  }
}
