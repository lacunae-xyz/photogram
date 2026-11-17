import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './photogram-privacy';
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

  it('draws its links in the accent text colour', async () => {
    render(html`<photogram-privacy></photogram-privacy>`, document.body);
    const links = page.getByRole('link');
    await expect.element(links.first()).toBeVisible();
    expect(links.elements()).toHaveLength(3);
    for (const link of links.elements()) {
      expect(getComputedStyle(link).color).toBe(
        token('--pg-color-accent-text'),
      );
    }
  });
});
