import { LitElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import backgroundColor from './background';
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
      // A label colour is the same in both schemes: the text and border on it stay light-scheme.
      this.style.colorScheme = background ? 'light' : '';
    }
  }
}
