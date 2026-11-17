import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { iconNames } from './pg-icon';

async function renderIcon(template: ReturnType<typeof html>) {
  render(template, document.body);
  const icon = document.body.querySelector('pg-icon');
  if (!icon) throw new Error('no pg-icon');
  await icon.updateComplete;
  return icon;
}

const files = import.meta.glob<string>('../icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** The icon file's path data. */
function pathData(name: string) {
  return /\sd="([^"]*)"/.exec(files[`../icons/${name}.svg`])?.[1];
}

afterEach(() => render(null, document.body));

describe('pg-icon', () => {
  it('knows every icon file', () => {
    expect([...iconNames].sort()).toEqual([
      'arrow-back',
      'auto-fix-high',
      'brightness-4',
      'clear-day',
      'clear-night',
      'delete',
      'link',
      'link-off',
      'print',
      'wb-twilight',
    ]);
  });

  it('renders the named icon file inline, 24px', async () => {
    const icon = await renderIcon(html`<pg-icon name="clear-day"></pg-icon>`);
    const svg = icon.shadowRoot?.querySelector('svg');
    expect(svg?.querySelector('path')?.getAttribute('d')).toBe(
      pathData('clear-day'),
    );
    expect(svg?.getBoundingClientRect()).toMatchObject({
      width: 24,
      height: 24,
    });
  });

  it('scales files that only have a size to its box', async () => {
    const icon = await renderIcon(
      html`<pg-icon name="auto-fix-high"></pg-icon>`,
    );
    const svg = icon.shadowRoot?.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 48 48');
    const path = svg?.querySelector('path')?.getBoundingClientRect();
    expect(path?.width).toBeGreaterThan(16);
    expect(path?.width).toBeLessThanOrEqual(24);
  });

  it('paints in the current colour', async () => {
    const icon = await renderIcon(
      html`<div style="color: rgb(1, 2, 3)">
        <pg-icon name="print"></pg-icon>
      </div>`,
    );
    const svg = icon.shadowRoot?.querySelector('svg');
    expect(getComputedStyle(svg!).fill).toBe('rgb(1, 2, 3)');
    icon.style.color = 'rgb(4, 5, 6)';
    expect(getComputedStyle(svg!).fill).toBe('rgb(4, 5, 6)');
  });

  it('renders nothing for an unknown name', async () => {
    const icon = await renderIcon(html`<pg-icon name="nope"></pg-icon>`);
    expect(icon.shadowRoot?.querySelector('svg')).toBeNull();
  });

  it('swaps the icon when the name changes', async () => {
    const icon = await renderIcon(html`<pg-icon name="clear-day"></pg-icon>`);
    icon.name = 'auto-fix-high';
    await icon.updateComplete;
    const svgs = icon.shadowRoot?.querySelectorAll('svg');
    expect(svgs).toHaveLength(1);
    expect(svgs?.[0].querySelector('path')?.getAttribute('d')).toBe(
      pathData('auto-fix-high'),
    );
  });

  it('is an image named by its label', async () => {
    await renderIcon(
      html`<pg-icon name="auto-fix-high" label="special effects"></pg-icon>`,
    );
    await expect
      .element(page.getByRole('img', { name: 'special effects' }))
      .toBeInTheDocument();
  });

  it('names an HTML element, not the svg, so axe keeps the content around it in one region', async () => {
    const icon = await renderIcon(
      html`<pg-icon name="auto-fix-high" label="special effects"></pg-icon>`,
    );
    const image = icon.shadowRoot?.querySelector('[role="img"]');
    expect(image?.localName).toBe('span');
    expect(image?.querySelector('svg')).not.toBeNull();
  });

  it('renders nothing once the name becomes unknown', async () => {
    const icon = await renderIcon(
      html`<pg-icon name="print" label="print"></pg-icon>`,
    );
    icon.name = 'nope';
    await icon.updateComplete;
    expect(icon.shadowRoot?.querySelector('svg, [role="img"]')).toBeNull();
  });

  it('is decorative without a label', async () => {
    const icon = await renderIcon(
      html`<pg-icon name="auto-fix-high"></pg-icon>`,
    );
    await expect.element(page.getByRole('img')).not.toBeInTheDocument();
    icon.label = 'special effects';
    await icon.updateComplete;
    await expect
      .element(page.getByRole('img', { name: 'special effects' }))
      .toBeInTheDocument();
  });

  it('is sized and painted through its part', async () => {
    render(
      html`<style>
          .dot::part(icon) {
            width: 20px;
            height: 20px;
            padding: 6px;
            background-color: rgb(1, 2, 3);
          }
        </style>
        <pg-icon class="dot" name="auto-fix-high"></pg-icon>`,
      document.body,
    );
    const icon = document.body.querySelector('pg-icon');
    await icon?.updateComplete;
    const svg = icon?.shadowRoot?.querySelector('svg');
    expect(svg?.getBoundingClientRect()).toMatchObject({
      width: 32,
      height: 32,
    });
    expect(getComputedStyle(svg!).backgroundColor).toBe('rgb(1, 2, 3)');
  });
});
