import { expect, Page } from '@playwright/test';
import { routeDemo } from './demo';
import { waitForImages, waitForTitleSizing } from './sizing';

export const demoRows = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11 bis'];

export async function openDemo(page: Page) {
  await routeDemo(page);
  await page.goto('/project-demo');
  await expect(page.locator('.tiles-container .ele')).toHaveCount(demoRows.length);
}

async function pickColor(page: Page, button: ReturnType<Page['locator']>, hex: string) {
  await button.click();
  const picker = page.locator('.sketch-picker');
  await picker.locator('input').first().fill(hex.replace('#', ''));
  await page.keyboard.press('Escape');
  await expect(picker).toHaveCount(0);
}

export async function setLabelColor(page: Page, label: string, hex: string) {
  const row = page.locator('.configuration tr', { has: page.locator('td', { hasText: new RegExp(`^${label}$`) }) });
  await pickColor(page, row.locator('button').first(), hex);
  await expect(row.locator('button span').first()).toHaveCSS('background-color', rgb(hex));
}

export async function setDefaultColor(page: Page, hex: string) {
  const row = page.locator('.configuration tr', { has: page.locator('td', { hasText: /^Default$/ }) });
  await pickColor(page, row.locator('button').first(), hex);
  await expect(row.locator('button span').first()).toHaveCSS('background-color', rgb(hex));
}

export async function setTemplate(page: Page, template: 'small' | 'large') {
  await page.locator(`label[for="layout_${template}"]`).click();
  await expect(page.locator(`.tiles-container .tpl-${template}`)).toHaveCount(demoRows.length);
}

export async function setColorDistribution(page: Page, distribution: 'indicator' | 'card') {
  if (distribution === 'card') {
    await page.locator('#color-distribution').check();
  }
}

export async function setPrintSpaceAround(page: Page, on: boolean) {
  await page.locator('#print-space-around').setChecked(on);
  await expect(page.locator('.tiles-container')).toHaveClass(on ? /print-space-around/ : /print-no-space/);
}

/** Row 5 gets the light palette colour, so it renders dark text. */
export async function prepareDemo(page: Page) {
  await openDemo(page);
  await setLabelColor(page, 'soleil', '#FFEB3B');
}

/** Moves the mouse to a viewport corner with no tile or preview under it: both scale up on hover. */
async function parkMouse(page: Page) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('no viewport');
  const { width, height } = viewport;
  for (const [x, y] of [[width - 1, 0], [width - 1, height - 1], [0, height - 1], [0, 0]]) {
    const hoversNothing = await page.evaluate(
      ([x, y]) => !document.elementFromPoint(x, y)?.closest('.ele, .preview'),
      [x, y],
    );
    if (hoversNothing) {
      await page.mouse.move(x, y);
      return;
    }
  }
  throw new Error('every viewport corner is over a tile');
}

export async function settle(page: Page) {
  await parkMouse(page);
  await waitForTitleSizing(page);
  await waitForImages(page);
}

function rgb(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.substring(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
