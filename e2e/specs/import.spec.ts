import { test, expect } from '../support/test';
import { expectCover, importProject, importRows, legacyKey, storedProjectKeys } from '../support/projects';

test('import a folder: card with cover, open, reload', async ({ page, pageErrors }) => {
  const card = await importProject(page);
  await expectCover(card, /^\/project\/[\w-]+\/images\/1\.jpg\/$/);

  await card.click();
  await expect(page).toHaveURL(/\/project\/[\w-]+$/);
  const key = page.url().split('/').pop();
  expect(await storedProjectKeys(page)).toEqual([key]);
  expect(await legacyKey(page)).toBeNull();
  const tiles = page.locator('.tiles-container .ele');
  await expect(tiles).toHaveCount(importRows);
  await expect(page.locator('.toolbar h1')).toHaveText('Projet import');

  await page.reload();
  await expect(tiles).toHaveCount(importRows);
  await expect(tiles.first().locator('.action')).toHaveText('Premier plan');
  expect(pageErrors).toEqual([]);
});
