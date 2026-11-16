import { expect, Page } from '@playwright/test';
import { routeDemo } from './demo';
import { tileSelector } from './test';
import { waitForImages, waitForTitleSizing } from './sizing';

export const demoRows = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11 bis'];

export async function openDemo(page: Page) {
  await routeDemo(page);
  await page.goto('/project-demo');
  await expect(page.locator(tileSelector)).toHaveCount(demoRows.length);
}

/** Waits for the save: the panel shows the stored colours once the project reloads. */
async function pickColor(page: Page, row: string, hex: string, stored: (colors: StoredColors) => string | undefined) {
  const input = page.locator('.configuration tr', { has: page.locator('td', { hasText: new RegExp(`^${row}$`) }) }).locator('input[type=color]');
  await input.fill(hex.toLowerCase());
  const configuration = page.locator('photogram-configuration');
  const storedColor = () =>
    configuration.evaluate(element => {
      const { colors, defaultColor } = element as unknown as StoredColors;
      return { colors, defaultColor };
    });
  await expect.poll(async () => stored(await storedColor())?.toLowerCase()).toBe(hex.toLowerCase());
}

type StoredColors = { colors?: Record<string, string | undefined>; defaultColor?: string };

export async function setLabelColor(page: Page, label: string, hex: string) {
  await pickColor(page, label, hex, ({ colors }) => colors?.[label]);
}

export async function setDefaultColor(page: Page, hex: string) {
  await pickColor(page, 'Default', hex, ({ defaultColor }) => defaultColor);
}

export async function setTemplate(page: Page, template: 'small' | 'large') {
  await page.locator(`label[for="layout_${template}"]`).click();
  await expect(page.locator(`.tiles-container > photogram-tile-${template}`)).toHaveCount(demoRows.length);
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
      ([x, y]) => !document.elementFromPoint(x, y)?.closest('photogram-tile-small, photogram-tile-large, .preview'),
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
