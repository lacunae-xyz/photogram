import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './photogram-privacy';

afterEach(() => render(null, document.body));

describe('photogram-privacy', () => {
  it('shows the policy under the header', async () => {
    render(
      html`<photogram-privacy
        ><header slot="header">Photogram</header></photogram-privacy
      >`,
      document.body,
    );
    const heading = page.getByRole('heading', {
      level: 1,
      name: 'Privacy policy',
    });
    await expect.element(heading).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'contact@lacunae.xyz' }))
      .toHaveAttribute('href', 'mailto:contact@lacunae.xyz');
    const header = page.getByText('Photogram', { exact: true }).element();
    expect(header.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      heading.element().getBoundingClientRect().top,
    );
  });
});
