import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import type {
  ColorDistribution,
  Colors,
  Shot,
  Template,
} from '../Application/types';
import '../Templates/photogram-tile-large';
import '../Templates/photogram-tile-small';

/**
 * The project's shots as small or large tiles, coloured by label.
 *
 * Events: `tile-select` ({ shot }) on a tile click.
 */
@customElement('photogram-tiles')
export class PhotogramTiles extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .tiles-container {
      font-family: var(--pg-font-mono);
      background-color: var(--pg-color-fill);
    }

    @media print {
      .print-space-around > photogram-tile-small {
        margin: 1.375rem;
      }
      .print-no-space > photogram-tile-small {
        margin: 0rem;
      }
      .print-space-around > photogram-tile-large {
        margin: 1.25rem;
      }
      .print-no-space > photogram-tile-large {
        margin: 0rem;
      }
    }
  `;

  @property({ attribute: false }) accessor shots: Shot[] | undefined;

  @property() accessor template: Template | undefined;

  @property({ attribute: false }) accessor colors: Colors | undefined;

  @property({ attribute: 'default-color' }) accessor defaultColor:
    string | undefined;

  @property({ attribute: 'color-distribution' })
  accessor colorDistribution: ColorDistribution | undefined;

  @property({ attribute: 'font-family' }) accessor fontFamily:
    string | undefined;

  @property({ attribute: 'print-space-around', type: Boolean })
  accessor printSpaceAround: boolean | undefined;

  #select(shot: Shot) {
    this.dispatchEvent(
      new CustomEvent('tile-select', { detail: { shot: { ...shot } } }),
    );
  }

  #tile(shot: Shot) {
    const color = shot.label ? this.colors?.[shot.label] : this.defaultColor;
    if (this.template === 'small') {
      return html`<photogram-tile-small
        .sequence=${shot.sequence}
        .action=${shot.action}
        .period=${shot.periode}
        .fx=${shot.fx}
        .url=${shot.url}
        .color=${color}
        .colorDistribution=${this.colorDistribution}
        @click=${() => this.#select(shot)}
      ></photogram-tile-small>`;
    }
    if (this.template === 'large') {
      return html`<photogram-tile-large
        .sequence=${shot.sequence}
        .action=${shot.action}
        .period=${shot.periode}
        .fx=${shot.fx}
        .url=${shot.url}
        .color=${color}
        .colorDistribution=${this.colorDistribution}
        @click=${() => this.#select(shot)}
      ></photogram-tile-large>`;
    }
    return nothing;
  }

  render() {
    if (!this.shots) {
      return nothing;
    }
    // A new font re-creates every tile, so each one sizes its title again in that font.
    return keyed(
      this.fontFamily,
      html`<div
        class=${
          this.printSpaceAround
            ? 'tiles-container print-space-around'
            : 'tiles-container print-no-space'
        }
        style=${styleMap({ fontFamily: this.fontFamily })}
      >
        ${repeat(
          this.shots,
          shot => shot.id,
          shot => this.#tile(shot),
        )}
      </div>`,
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-tiles': PhotogramTiles;
  }
}
