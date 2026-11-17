import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { observeColorScheme } from './theme';

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
  ['#e6e6e6', '--pg-illus-shape'],
  ['#ccc', '--pg-illus-line'],
  ['#fff', '--pg-illus-paper'],
]);

const paint = /\b(fill|stroke|stop-color)="(#[0-9a-f]{3,6})"/gi;

/**
 * Each defined token's colour, read through a probe's `color`: a computed custom property keeps `light-dark()`
 * unresolved.
 */
function resolve(probe: HTMLElement) {
  const style = getComputedStyle(probe);
  const colours = new Map<string, string>();
  for (const [colour, token] of tokens) {
    if (style.getPropertyValue(token).trim()) {
      probe.style.color = `var(${token})`;
      colours.set(colour, style.color);
    }
  }
  return colours;
}

function recolour(svg: string, colours: Map<string, string>) {
  return svg.replace(paint, (attribute, name: string, colour: string) => {
    const value = colours.get(colour.toLowerCase());
    return value ? `${name}="${value}"` : attribute;
  });
}

/**
 * An unDraw illustration from `illustrations/`, its colours read from the `--pg-color-accent` and `--pg-illus-*` tokens.
 * Decorative unless it has a `label`. Size it through `::part(image)`.
 *
 * An `<img>` of the recoloured SVG, so it lays out and paints like the file did. It reads the tokens when it renders,
 * and renders again when the colour scheme changes: OS setting, `<html data-theme>`, print.
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

  /** Where the tokens resolve as they would on the image: in this element's colour scheme. */
  readonly #probe = Object.assign(document.createElement('span'), {
    hidden: true,
  });

  #unobserve: (() => void) | undefined;

  connectedCallback() {
    super.connectedCallback();
    this.renderRoot.append(this.#probe);
    this.#unobserve = observeColorScheme(() => this.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#unobserve?.();
  }

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
    const svg = recolour(this.svg, resolve(this.#probe));
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
