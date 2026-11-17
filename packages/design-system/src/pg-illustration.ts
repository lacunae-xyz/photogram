import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

const files = import.meta.glob<string>('../illustrations/*.svg', {
  query: '?raw',
  import: 'default',
});

const loaders = new Map(
  Object.entries(files).map(([path, load]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.svg'.length),
    load,
  ]),
);

export const illustrationNames = [...loaders.keys()];

/** The unDraw colour each token replaces. Colours without a token keep their value. */
const tokens = new Map([
  ['#38d39f', '--pg-color-accent'],
  ['#3f3d56', '--pg-illus-ink'],
  ['#f2f2f2', '--pg-illus-bg'],
  ['#fff', '--pg-illus-paper'],
]);

const paint = /\b(fill|stroke|stop-color)="(#[0-9a-f]{3,6})"/gi;

// pg: 6.5 dark mode. A computed custom property keeps `light-dark()` unresolved, and the image only
// changes on a render. Resolve each token to a colour (through a probe's `color`), and re-render
// when the scheme or `<html data-theme>` changes.
function recolour(svg: string, style: CSSStyleDeclaration) {
  return svg.replace(paint, (attribute, name: string, colour: string) => {
    const token = tokens.get(colour.toLowerCase());
    const value = token && style.getPropertyValue(token).trim();
    return value ? `${name}="${value}"` : attribute;
  });
}

/**
 * An unDraw illustration from `illustrations/`, its colours read from the `--pg-color-accent` and `--pg-illus-*` tokens.
 * Decorative unless it has a `label`. Size it through `::part(image)`.
 *
 * An `<img>` of the recoloured SVG, so it lays out and paints like the file did. It reads the tokens when it renders.
 */
@customElement('pg-illustration')
export class PgIllustration extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }
  `;

  @property() accessor name = '';

  @property() accessor label = '';

  @state() private accessor svg: string | undefined;

  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has('name')) {
      this.svg = undefined;
      this.#load(this.name);
    }
  }

  async #load(name: string) {
    // The import fails when the page is left mid-load (WebKit) or its chunk is gone after a deploy. The illustration is decoration.
    const svg = await loaders
      .get(name)?.()
      .catch(() => undefined);
    if (name === this.name) {
      this.svg = svg;
    }
  }

  render() {
    if (this.svg === undefined) {
      return nothing;
    }
    const svg = recolour(this.svg, getComputedStyle(this));
    return html`<img
      part="image"
      src=${`data:image/svg+xml,${encodeURIComponent(svg)}`}
      alt=${this.label}
    />`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pg-illustration': PgIllustration;
  }
}
