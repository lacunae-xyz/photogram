import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './pg-header';

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
    const border = (name: string) =>
      getComputedStyle(link(name).element()).borderBottomColor;
    expect(border('Tutorial')).not.toBe(border('Projects'));

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
});
