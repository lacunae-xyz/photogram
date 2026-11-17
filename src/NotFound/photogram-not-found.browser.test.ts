import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './photogram-not-found';
import '@lacunae-xyz/photogram-design-system/tokens.css';

afterEach(() => render(null, document.body));

/** The computed colour of a token, as the browser resolves it. */
function token(name: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

describe('photogram-not-found', () => {
  it('says the page is not found, under the header, and links home', async () => {
    render(
      html`<photogram-not-found
        ><header slot="header">Photogram</header></photogram-not-found
      >`,
      document.body,
    );
    const heading = page.getByRole('heading', {
      level: 1,
      name: 'Page not found',
    });
    await expect.element(heading).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Go to the home page' }))
      .toHaveAttribute('href', '/');
    const header = page.getByText('Photogram', { exact: true }).element();
    expect(header.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      heading.element().getBoundingClientRect().top,
    );
  });

  it('draws its link in the accent text colour', async () => {
    render(html`<photogram-not-found></photogram-not-found>`, document.body);
    const home = page.getByRole('link', { name: 'Go to the home page' });
    await expect.element(home).toBeVisible();
    expect(getComputedStyle(home.element()).color).toBe(
      token('--pg-color-accent-text'),
    );
  });
});
