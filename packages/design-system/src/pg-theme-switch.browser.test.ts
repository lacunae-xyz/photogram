import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './pg-theme-switch';
import { themeStorageKey } from './theme';
import '../tokens.css';

const root = document.documentElement;

afterEach(() => {
  render(null, document.body);
  delete root.dataset.theme;
  localStorage.removeItem(themeStorageKey);
  document.querySelector('meta[name="color-scheme"]')?.remove();
});

async function renderSwitch() {
  render(html`<pg-theme-switch></pg-theme-switch>`, document.body);
  const element = document.body.querySelector('pg-theme-switch')!;
  await element.updateComplete;
  return element;
}

const button = (name: string) => page.getByRole('button', { name });

describe('pg-theme-switch', () => {
  it('is a group of three buttons, Auto pressed by default', async () => {
    await renderSwitch();
    await expect
      .element(page.getByRole('group', { name: 'Theme' }))
      .toBeVisible();
    await expect
      .element(button('Auto'))
      .toHaveAttribute('aria-pressed', 'true');
    await expect
      .element(button('Light'))
      .toHaveAttribute('aria-pressed', 'false');
    await expect
      .element(button('Dark'))
      .toHaveAttribute('aria-pressed', 'false');
  });

  it('sets <html data-theme>, keeps it, and updates the meta', async () => {
    const meta = Object.assign(document.createElement('meta'), {
      name: 'color-scheme',
      content: 'light dark',
    });
    document.head.append(meta);
    await renderSwitch();

    await button('Dark').click();
    expect(root.dataset.theme).toBe('dark');
    expect(localStorage.getItem(themeStorageKey)).toBe('dark');
    expect(meta.content).toBe('dark');
    await expect
      .element(button('Dark'))
      .toHaveAttribute('aria-pressed', 'true');
    await expect
      .element(button('Auto'))
      .toHaveAttribute('aria-pressed', 'false');

    await button('Auto').click();
    expect(root.dataset.theme).toBeUndefined();
    expect(localStorage.getItem(themeStorageKey)).toBeNull();
    expect(meta.content).toBe('light dark');
  });

  it('switches the tokens', async () => {
    await renderSwitch();
    const surface = () =>
      getComputedStyle(document.body).getPropertyValue('color');
    document.body.style.color = 'var(--pg-color-surface)';
    try {
      await button('Dark').click();
      expect(surface()).toBe('rgb(34, 34, 34)');
      await button('Light').click();
      expect(surface()).toBe('rgb(255, 255, 255)');
    } finally {
      document.body.style.color = '';
    }
  });

  it('shows a theme set elsewhere, in another switch or tab', async () => {
    root.dataset.theme = 'light';
    const element = await renderSwitch();
    await expect
      .element(button('Light'))
      .toHaveAttribute('aria-pressed', 'true');
    root.dataset.theme = 'dark';
    await expect
      .element(button('Dark'))
      .toHaveAttribute('aria-pressed', 'true');

    localStorage.setItem(themeStorageKey, 'light');
    window.dispatchEvent(new StorageEvent('storage', { key: themeStorageKey }));
    expect(root.dataset.theme).toBe('light');
    await element.updateComplete;
    await expect
      .element(button('Light'))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('is reached and pressed with the keyboard', async () => {
    await renderSwitch();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(root.dataset.theme).toBe('light');
  });
});
