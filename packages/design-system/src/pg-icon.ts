import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const files = import.meta.glob<string>('../icons/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
});

const icons = new Map(
  Object.entries(files).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.svg'.length),
    url,
  ]),
);

export const iconNames = [...icons.keys()];

/**
 * An icon from `icons/`, decorative unless it has a `label`. Size and paint it through `::part(icon)`.
 *
 * An `<img>` until 06 §6.5 inlines the SVG for `currentColor`: inline SVG rasterises a few pixels differently.
 */
@customElement('pg-icon')
export class PgIcon extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }
  `;

  @property() accessor name = '';

  @property() accessor label = '';

  render() {
    const url = icons.get(this.name);
    return url
      ? html`<img part="icon" src=${url} alt=${this.label} />`
      : nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pg-icon': PgIcon;
  }
}
