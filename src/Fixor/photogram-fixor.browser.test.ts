import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './photogram-fixor';

afterEach(() => document.body.replaceChildren());

describe('photogram-fixor', () => {
  it('mounts Fixor in its light DOM, in the light colour scheme', async () => {
    const fixor = document.createElement('photogram-fixor');
    document.body.append(fixor);
    await expect
      .element(page.getByRole('heading', { name: 'Fixor' }))
      .toBeVisible();
    expect(fixor.shadowRoot).toBeNull();
    expect(fixor.querySelector('.fixor-empty-container')).not.toBeNull();
    expect(getComputedStyle(fixor).colorScheme).toBe('light');
  });

  it('unmounts Fixor when removed', async () => {
    const fixor = document.createElement('photogram-fixor');
    document.body.append(fixor);
    await expect
      .element(page.getByRole('heading', { name: 'Fixor' }))
      .toBeVisible();
    fixor.remove();
    expect(fixor.childElementCount).toBe(0);
  });

  it('mounts nothing when removed before Fixor loads', async () => {
    const fixor = document.createElement('photogram-fixor');
    document.body.append(fixor);
    fixor.remove();
    await import('./index.jsx');
    await new Promise(resolve => setTimeout(resolve));
    expect(fixor.childElementCount).toBe(0);
  });
});
