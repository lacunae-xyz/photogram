import { LitElement, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';

const files = import.meta.glob<string>('../icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** The file's `viewBox` (older files only have a size) and the markup inside its `<svg>`. */
function parse(file: string) {
  const open = file.slice(0, file.indexOf('>'));
  const attribute = (name: string) =>
    new RegExp(`\\s${name}="([^"]*)"`).exec(open)?.[1];
  const viewBox =
    attribute('viewBox') ?? `0 0 ${attribute('width')} ${attribute('height')}`;
  const body = file.slice(open.length + 1, file.lastIndexOf('</svg>'));
  return { viewBox: unsafeStatic(viewBox), body: unsafeStatic(body) };
}

const icons = new Map(
  Object.entries(files).map(([path, file]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.svg'.length),
    parse(file),
  ]),
);

export const iconNames = [...icons.keys()];

/**
 * An icon from `icons/`, decorative unless it has a `label`. Inline SVG painted in `currentColor`: set `color` on it, or
 * let it inherit. 24px by default, sized through `::part(icon)`.
 */
@customElement('pg-icon')
export class PgIcon extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    svg {
      width: 1.5rem;
      height: 1.5rem;
      fill: currentColor;
    }
  `;

  @property() accessor name = '';

  @property() accessor label = '';

  render() {
    const icon = icons.get(this.name);
    if (!icon) {
      return nothing;
    }
    // Static parts, so each icon is one template however many tiles show it.
    return staticHtml`<svg
      part="icon"
      viewBox="${icon.viewBox}"
      role=${this.label ? 'img' : nothing}
      aria-label=${this.label || nothing}
      aria-hidden=${this.label ? nothing : 'true'}
    >${icon.body}</svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pg-icon': PgIcon;
  }
}
