import { test, expect } from '../support/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  expectCover,
  importFolder,
  importProject,
  importRows,
  legacyKey,
  storedProjectKeys,
} from '../support/projects';

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

test('export data.json, then import it back with the edits', async ({ page, browserName, pageErrors }, testInfo) => {
  const card = await importProject(page);
  await card.click();
  const tiles = page.locator('.tiles-container .ele');
  await tiles.first().click();
  await page.locator('#form-action').fill('Plan exporté');
  await page.locator('#form button[type=submit]').click();
  await expect(tiles.first().locator('.action')).toHaveText('Plan exporté');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export data.json' }).click();
  expect((await download).suggestedFilename()).toBe('data.json');
  const exported = JSON.parse(fs.readFileSync(await (await download).path(), 'utf8'));
  expect(exported.data[0].action).toBe('Plan exporté');

  await page.goto('/projects');
  await card.locator('.btn-delete').click();
  await expect(card).toHaveCount(0);

  const folder = testInfo.outputPath(path.basename(importFolder));
  fs.cpSync(importFolder, folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'data.json'), JSON.stringify(exported));
  const reimported = await importProject(page, folder);
  await expectCover(reimported, /^\/project\/[\w-]+\/images\/1\.jpg\/$/, { served: browserName === 'chromium' });
  await reimported.click();
  await expect(tiles).toHaveCount(importRows);
  await expect(tiles.first().locator('.action')).toHaveText('Plan exporté');
  expect(pageErrors).toEqual([]);
});
