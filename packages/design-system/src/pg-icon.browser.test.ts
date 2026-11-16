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

afterEach(() => render(null, document.body));

describe('pg-icon', () => {
  it('knows every icon file', () => {
    expect([...iconNames].sort()).toEqual([
      'auto-fix',
      'weather-night',
      'weather-none',
      'weather-sunny',
      'weather-sunset-down',
      'weather-sunset-up',
    ]);
  });

  it('renders the named icon file', async () => {
    const icon = await renderIcon(
      html`<pg-icon name="weather-sunny"></pg-icon>`,
    );
    const image = icon.shadowRoot?.querySelector('img');
    expect(image?.getAttribute('src')).toMatch(/weather-sunny.*\.svg$/);
    await expect.poll(() => image?.complete && image.naturalWidth).toBe(24);
  });

  it('renders nothing for an unknown name', async () => {
    const icon = await renderIcon(html`<pg-icon name="nope"></pg-icon>`);
    expect(icon.shadowRoot?.querySelector('img')).toBeNull();
  });

  it('swaps the icon when the name changes', async () => {
    const icon = await renderIcon(
      html`<pg-icon name="weather-sunny"></pg-icon>`,
    );
    icon.name = 'auto-fix';
    await icon.updateComplete;
    const images = icon.shadowRoot?.querySelectorAll('img');
    expect(images).toHaveLength(1);
    expect(images?.[0].getAttribute('src')).toMatch(/auto-fix.*\.svg$/);
  });

  it('is an image named by its label', async () => {
    await renderIcon(
      html`<pg-icon name="auto-fix" label="special effects"></pg-icon>`,
    );
    await expect
      .element(page.getByRole('img', { name: 'special effects' }))
      .toBeInTheDocument();
  });

  it('is decorative without a label', async () => {
    const icon = await renderIcon(html`<pg-icon name="auto-fix"></pg-icon>`);
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
        <pg-icon class="dot" name="auto-fix"></pg-icon>`,
      document.body,
    );
    const icon = document.body.querySelector('pg-icon');
    await icon?.updateComplete;
    const image = icon?.shadowRoot?.querySelector('img');
    expect(image?.getBoundingClientRect()).toMatchObject({
      width: 32,
      height: 32,
    });
    expect(getComputedStyle(image!).backgroundColor).toBe('rgb(1, 2, 3)');
  });
});
