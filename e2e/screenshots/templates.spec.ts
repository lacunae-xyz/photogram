import { test, expect } from '../support/test';
import {
  demoRows,
  prepareDemo,
  setColorDistribution,
  setDefaultColor,
  setPrintSpaceAround,
  setTemplate,
  settle,
} from '../support/demo-page';

const viewports = {
  small: { width: 1280, height: 1400 },
  large: { width: 1280, height: 3000 },
};

for (const template of ['small', 'large'] as const) {
  for (const distribution of ['indicator', 'card'] as const) {
    test.describe(`${template} / ${distribution}`, () => {
      test.use({ viewport: viewports[template] });

      test.beforeEach(async ({ page }) => {
        await prepareDemo(page);
        await setTemplate(page, template);
        await setColorDistribution(page, distribution);
        await settle(page);
      });

      test('screen', async ({ page }) => {
        const tiles = page.locator('.tiles-container .ele');
        await expect(page.locator('.tiles-container')).toHaveScreenshot(`${template}-${distribution}-grid.png`);
        for (const [i, row] of demoRows.entries()) {
          await expect(tiles.nth(i)).toHaveScreenshot(`${template}-${distribution}-tile-${row.replace(' ', '-')}.png`);
        }
      });

      for (const spaceAround of [true, false]) {
        test(`print, space around ${spaceAround ? 'on' : 'off'}`, async ({ page }) => {
          await setPrintSpaceAround(page, spaceAround);
          await page.emulateMedia({ media: 'print' });
          await settle(page);
          await expect(page).toHaveScreenshot(
            `${template}-${distribution}-print-${spaceAround ? 'space' : 'no-space'}.png`,
            { fullPage: true },
          );
        });
      }
    });
  }
}

// Configuration shows printSpaceAround unset as checked while Tiles treats it as off, and the checkbox
// calls preventDefault in onChange, so what it shows lags the saved value. Not in 04 yet.
test('print space around checkbox is out of sync with the tiles', async ({ page }) => {
  await prepareDemo(page);
  const checkbox = page.locator('#print-space-around');
  const tiles = page.locator('.tiles-container');
  const states = [];
  for (let clicks = 0; clicks < 4; clicks++) {
    await page.waitForTimeout(300);
    states.push([await checkbox.isChecked(), (await tiles.getAttribute('class'))?.replace('tiles-container ', '')]);
    await checkbox.click();
  }
  expect(states).toEqual([
    [true, 'print-no-space'],
    [true, 'print-no-space'],
    [false, 'print-no-space'],
    [false, 'print-space-around'],
  ]);
});

for (const template of ['small', 'large'] as const) {
  test.describe(`${template} / default colour`, () => {
    test.use({ viewport: viewports[template] });

    test('rows without label use it', async ({ page }) => {
      await prepareDemo(page);
      await setTemplate(page, template);
      await setDefaultColor(page, '#3F51B5');
      await settle(page);
      const tiles = page.locator('.tiles-container .ele');
      for (const row of ['6', '7']) {
        await expect(tiles.nth(demoRows.indexOf(row))).toHaveScreenshot(`${template}-default-colour-tile-${row}.png`);
      }
    });
  });
}
