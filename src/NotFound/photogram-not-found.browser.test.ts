import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './photogram-not-found';

afterEach(() => render(null, document.body));

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
});
