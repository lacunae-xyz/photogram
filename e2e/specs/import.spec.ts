import { test, expect, tileSelector } from '../support/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  expectCover,
  importFolder,
  importProject,
  importRows,
  legacyKey,
  storedProject,
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
  const tiles = page.locator(tileSelector);
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
  const tiles = page.locator(tileSelector);
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

test('re-importing an exported data.json attaches images added since (B27)', async ({ page }, testInfo) => {
  const withoutImage = testInfo.outputPath('first', path.basename(importFolder));
  fs.cpSync(importFolder, withoutImage, { recursive: true });
  fs.rmSync(path.join(withoutImage, '3.jpg'));
  const card = await importProject(page, withoutImage);
  await card.click();
  const tiles = page.locator(tileSelector);
  await expect(tiles.nth(2).locator('.img')).toHaveAttribute('src', /empty\.\w+\.svg$/);
  const key = page.url().split('/').pop()!;

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export data.json' }).click();
  const folder = testInfo.outputPath('second', path.basename(importFolder));
  fs.cpSync(importFolder, folder, { recursive: true });
  fs.copyFileSync(await (await download).path(), path.join(folder, 'data.json'));

  // B28: same key, unlinked, so the import replaces the project instead of adding one.
  const reimported = await importProject(page, folder);
  await expect(page.locator('.projects-card')).toHaveCount(1);
  // The card is there from the first import: wait for the reimport to be saved before opening it.
  await expect
    .poll(async () => ((await storedProject(page, key))?.data as { url?: string }[] | undefined)?.[2]?.url)
    .toMatch(/\/images\/3\.jpg\/$/);
  await reimported.click();
  await expect(tiles.nth(2).locator('.img')).toHaveAttribute('src', /\/images\/3\.jpg\/$/);
});
