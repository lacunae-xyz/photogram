import { LitElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import backgroundColor from './background';
import { blackOrWhite } from './contrast';
import './photogram-action';
import './photogram-fx';
import './photogram-image';
import './photogram-period';
import './photogram-sequence';

/** A shot's fields, shared by the small and large tiles. */
export abstract class Tile extends LitElement {
  @property() accessor sequence: string | undefined;

  @property() accessor action: string | undefined;

  @property() accessor period: string | undefined;

  @property() accessor fx: string | undefined;

  @property() accessor url: string | null | undefined;

  @property() accessor color: string | undefined;

  @property({ attribute: 'color-distribution' })
  accessor colorDistribution: string | undefined;

  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has('color') || changed.has('colorDistribution')) {
      const background = backgroundColor(this.colorDistribution, this.color);
      this.style.backgroundColor = background ?? '';
      // The accent can't be read on every label colour, nor the text on the darkest: period and fx take the text
      // colour, or white where it is the one that reads.
      this.style.setProperty(
        '--photogram-indicator-color',
        background
          ? blackOrWhite(background) === '#ffffff'
            ? '#ffffff'
            : 'currentColor'
          : null,
      );
    }
  }
}
