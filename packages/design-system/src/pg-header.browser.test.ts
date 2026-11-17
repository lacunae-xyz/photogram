import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './pg-header';
import '../tokens.css';

afterEach(() => render(null, document.body));

const links = [
  { href: '/projects', label: 'Projects' },
  { href: '/tutorial', label: 'Tutorial' },
];

async function renderHeader(template: ReturnType<typeof html>) {
  render(template, document.body);
  const header = document.body.querySelector('pg-header');
  if (!header) throw new Error('no pg-header');
  await header.updateComplete;
  return header;
}

describe('pg-header', () => {
  it('links its name and tagline home', async () => {
    await renderHeader(
      html`<pg-header
        heading="Photogram"
        tagline="A tool for editor assistants"
      ></pg-header>`,
    );
    const home = page.getByRole('link', { name: /Photogram/ });
    await expect.element(home).toHaveAttribute('href', '/');
    await expect
      .element(home.getByRole('heading', { level: 1, name: 'Photogram' }))
      .toBeVisible();
    await expect
      .element(home.getByText('A tool for editor assistants'))
      .toBeVisible();
    await expect.element(page.getByRole('navigation')).not.toBeInTheDocument();
    await expect.element(page.getByRole('img')).not.toBeInTheDocument();
  });

  it('links home to its href', async () => {
    await renderHeader(
      html`<pg-header heading="Fixor" href="/fixor"></pg-header>`,
    );
    await expect
      .element(page.getByRole('link', { name: 'Fixor' }))
      .toHaveAttribute('href', '/fixor');
  });

  it('shows its logo, named by its label', async () => {
    await renderHeader(
      html`<pg-header
        heading="Photogram"
        logo="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'/>"
        logo-label="logo of Photogram"
      ></pg-header>`,
    );
    await expect
      .element(page.getByRole('img', { name: 'logo of Photogram' }))
      .toBeVisible();
  });

  it('lists its links in a navigation, in order', async () => {
    await renderHeader(
      html`<pg-header heading="Photogram" .links=${links}></pg-header>`,
    );
    const nav = page.getByRole('navigation');
    await expect.element(nav).toBeVisible();
    expect(
      nav
        .getByRole('link')
        .elements()
        .map(link => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Projects', '/projects'],
      ['Tutorial', '/tutorial'],
    ]);
  });

  it('marks the current link, and only that one', async () => {
    const header = await renderHeader(
      html`<pg-header
        heading="Photogram"
        .links=${links}
        current="/tutorial"
      ></pg-header>`,
    );
    const link = (name: string) =>
      page.getByRole('navigation').getByRole('link', { name });
    await expect
      .element(link('Tutorial'))
      .toHaveAttribute('aria-current', 'page');
    await expect.element(link('Projects')).not.toHaveAttribute('aria-current');
    const underline = (name: string) =>
      getComputedStyle(link(name).element()).borderBottomColor;
    expect(underline('Tutorial')).not.toBe(underline('Projects'));

    header.current = undefined;
    await header.updateComplete;
    await expect.element(link('Tutorial')).not.toHaveAttribute('aria-current');
  });

  it('reaches its links with the keyboard', async () => {
    const header = await renderHeader(
      html`<pg-header heading="Photogram" .links=${links}></pg-header>`,
    );
    const focused = () => header.shadowRoot!.activeElement;
    await userEvent.tab();
    expect(focused()).toBe(
      page.getByRole('link', { name: /Photogram/ }).element(),
    );
    await userEvent.tab();
    expect(focused()).toBe(
      page.getByRole('link', { name: 'Projects' }).element(),
    );
  });

  for (const scheme of ['light', 'dark'] as const) {
    it(`reads on the surface in ${scheme}: text 4.5:1, logo, current underline and focus ring 3:1`, async () => {
      document.documentElement.dataset.theme = scheme;
      try {
        const header = await renderHeader(
          html`<pg-header
            heading="Photogram"
            tagline="A tool for editor assistants"
            logo="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'/>"
            logo-label="logo of Photogram"
            .links=${links}
            current="/tutorial"
          ></pg-header>`,
        );
        const surface = rgba(probe('var(--pg-color-surface)'));
        const style = (element: Element) => getComputedStyle(element);
        const on = (color: string, background = surface) =>
          contrast(over(rgba(color), background), background);
        const link = (name: string) =>
          page.getByRole('link', { name }).element() as HTMLElement;
        const current = link('Tutorial');

        expect(on(style(header).color)).toBeGreaterThanOrEqual(4.5);
        expect(
          on(style(header.shadowRoot!.querySelector('p')!).color),
        ).toBeGreaterThanOrEqual(4.5);
        for (const name of ['Projects', 'Tutorial']) {
          expect(on(style(link(name)).color)).toBeGreaterThanOrEqual(4.5);
        }
        const logo = page
          .getByRole('img', { name: 'logo of Photogram' })
          .element();
        expect(on(style(logo).backgroundColor)).toBeGreaterThanOrEqual(3);
        expect(on(style(current).borderBottomColor)).toBeGreaterThanOrEqual(3);

        link('Projects').focus();
        expect(link('Projects').matches(':focus-visible')).toBe(true);
        expect(style(link('Projects')).outlineStyle).toBe('solid');
        expect(on(style(link('Projects')).outlineColor)).toBeGreaterThanOrEqual(
          3,
        );
        const hover = over(
          rgba(style(link('Projects')).backgroundColor),
          surface,
        );
        expect(on(style(link('Projects')).color, hover)).toBeGreaterThanOrEqual(
          4.5,
        );
      } finally {
        delete document.documentElement.dataset.theme;
      }
    });
  }
});

type Rgba = [number, number, number, number];

/** The computed colour of a background. */
function probe(background: string) {
  const element = document.createElement('div');
  element.style.background = background;
  document.body.append(element);
  const color = getComputedStyle(element).backgroundColor;
  element.remove();
  return color;
}

/** An `rgb()`/`rgba()` colour, or the `color(srgb …)` a `color-mix()` computes to. */
function rgba(color: string): Rgba {
  const [r = 0, g = 0, b = 0, a = 1] = (color.match(/[\d.]+/g) ?? []).map(
    Number,
  );
  const scale = color.startsWith('color(srgb') ? 255 : 1;
  return [r * scale, g * scale, b * scale, a];
}

function over([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1];
}

function luminance([r, g, b]: Rgba) {
  const [lr = 0, lg = 0, lb = 0] = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrast(a: Rgba, b: Rgba) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}
