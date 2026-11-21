import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// The theme switch in every engine: the stored theme from the first paint, theme-color included, the switch over the
// system and on the next visit, garbage in storage, the OS setting live on Auto, print light under a forced dark, the
// keyboard. pages.spec has the screenshots.

const dark = 'rgb(34, 34, 34)';
const light = 'rgb(255, 255, 255)';

const bodyBackground = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

/** The colour the page paints at (x, y), read back from a screenshot. */
async function paintedAt(page: Page, x: number, y: number) {
  const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 } });
  const decoder = await page.context().newPage();
  try {
    return await decoder.evaluate(async src => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const context = new OffscreenCanvas(1, 1).getContext('2d')!;
      context.drawImage(image, 0, 0);
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
      return `rgb(${r}, ${g}, ${b})`;
    }, `data:image/png;base64,${png.toString('base64')}`);
  } finally {
    await decoder.close();
  }
}

test.use({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });

test('a stored theme paints before the app script runs: no light flash', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pg-theme', 'dark'));
  // The HTML and the CSS only: what a slow app script leaves on screen. A stalled script would also stall the
  // screenshot, which waits for the page's fonts.
  await page.route('**/assets/*.js', route => route.abort());
  await page.goto('/');
  expect(await page.evaluate(() => customElements.get('photogram-app'))).toBeUndefined();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  expect(await bodyBackground(page)).toBe(dark);
  expect(await paintedAt(page, 640, 800)).toBe(dark);
  // The browser's UI around the page follows the stored theme too.
  const themeColors = page.locator('meta[name="theme-color"]');
  await expect(themeColors).toHaveCount(2);
  expect(await themeColors.evaluateAll(metas => metas.map(meta => [meta.getAttribute('content'), meta.getAttribute('media')]))).toEqual([
    ['#ffffff', 'not all'],
    ['#222222', 'all'],
  ]);
});

test('the switch overrides the system, and the next visit keeps it', async ({ page }) => {
  await page.goto('/');
  expect(await bodyBackground(page)).toBe(light);
  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  expect(await bodyBackground(page)).toBe(dark);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  expect(await bodyBackground(page)).toBe(dark);

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByRole('button', { name: 'Light' }).click();
  expect(await bodyBackground(page)).toBe(light);
  await page.getByRole('button', { name: 'Auto' }).click();
  expect(await bodyBackground(page)).toBe(dark);
  expect(await page.evaluate(() => localStorage.getItem('pg-theme'))).toBeNull();
});

test('garbage in storage is Auto', async ({ page, pageErrors }) => {
  await page.addInitScript(() => localStorage.setItem('pg-theme', '"dark"; color: red'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Auto' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined();
  expect(await bodyBackground(page)).toBe(light);
  expect(pageErrors).toEqual([]);
});

test('Auto follows the OS setting as it changes, illustrations included', async ({ page }) => {
  await page.goto('/projects');
  const illustration = page.locator('pg-illustration').first().locator('img');
  await expect(illustration).toBeVisible();
  const lightSrc = await illustration.getAttribute('src');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => bodyBackground(page)).toBe(dark);
  await expect(illustration).not.toHaveAttribute('src', lightSrc!);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => bodyBackground(page)).toBe(light);
  await expect(illustration).toHaveAttribute('src', lightSrc!);
});

test('a forced dark theme prints light', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dark' }).click();
  expect(await bodyBackground(page)).toBe(dark);
  await page.emulateMedia({ media: 'print' });
  expect(await bodyBackground(page)).toBe(light);
});

test('the buttons are tab stops, pressed with Enter and Space', async ({ page }) => {
  await page.goto('/');
  const buttons = page.getByRole('group', { name: 'Theme' }).getByRole('button');
  await buttons.nth(0).focus();
  await page.keyboard.press('Tab');
  await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await page.keyboard.press(' ');
  await expect(buttons.nth(2)).toHaveAttribute('aria-pressed', 'true');
  await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'false');
  expect(await bodyBackground(page)).toBe(dark);
});
