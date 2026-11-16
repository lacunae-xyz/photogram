import { test, expect } from '../support/test';
import { Page } from '@playwright/test';
import { importProject, storedProject } from '../support/projects';

async function openImported(page: Page) {
  const card = await importProject(page);
  await card.click();
  await expect(page).toHaveURL(/\/project\/[\w-]+$/);
  const tiles = page.locator('.tiles-container .ele');
  await expect(tiles).toHaveCount(3);
  return tiles;
}

async function save(page: Page) {
  await page.locator('#form button[type=submit]').click();
  await expect(page.locator('#form')).toHaveCount(0);
}

test('new label gets a colour that survives reload', async ({ page }) => {
  const tiles = await openImported(page);
  await tiles.nth(2).click();
  await page.locator('#label').fill('nouveau');
  await save(page);

  const sequence = tiles.nth(2).locator('.sequence');
  await expect(sequence).toHaveCSS('background-color', 'rgb(156, 39, 176)');
  await expect(page.locator('.configuration td', { hasText: /^nouveau$/ })).toBeVisible();

  await page.reload();
  await expect(sequence).toHaveCSS('background-color', 'rgb(156, 39, 176)');
});

test('period and fx survive reload', async ({ page }) => {
  const tiles = await openImported(page);
  await tiles.nth(1).click();
  await page.locator('#periode').selectOption('nuit');
  await page.locator('#fx').check();
  await save(page);

  const tile = tiles.nth(1);
  await expect(tile.locator('.period')).toHaveClass(/dot-darker/);
  await expect(tile.locator('.fx')).not.toHaveClass(/hide/);

  await page.reload();
  await expect(tile.locator('.period')).toHaveClass(/dot-darker/);
  await expect(tile.locator('.fx')).not.toHaveClass(/hide/);
});

test('set as main changes the cover', async ({ page }) => {
  const tiles = await openImported(page);
  await tiles.nth(1).click();
  await page.getByRole('button', { name: 'Set as main' }).click();
  await expect(page.locator('#form')).toHaveCount(0);

  await page.goto('/projects');
  await expect(page.locator('.projects-card .img-project-cover')).toHaveAttribute('src', /\/images\/2\.jpg\/$/);
});

test('deleted image shows empty.svg and survives reload', async ({ page }) => {
  const tiles = await openImported(page);
  await tiles.first().click();
  await page.locator('#form').getByRole('button', { name: 'Delete' }).click();
  await save(page);

  const image = tiles.first().locator('.img');
  await expect(image).toHaveAttribute('src', /empty\.\w+\.svg$/);
  await page.reload();
  await expect(image).toHaveAttribute('src', /empty\.\w+\.svg$/);
});

test('background colour checkbox shows the saved setting after reload (B3)', async ({ page }) => {
  const tiles = await openImported(page);
  const checkbox = page.locator('#color-distribution');
  await expect(checkbox).not.toBeChecked();
  // Row 1 has the label salon: in card mode the whole tile takes its colour.
  await checkbox.check();
  await expect(tiles.first()).toHaveCSS('background-color', 'rgb(244, 67, 54)');
  const key = page.url().split('/').pop()!;
  await expect.poll(async () => (await storedProject(page, key))?.colorDistribution).toBe('card');

  await page.reload();
  await expect(tiles.first()).toHaveCSS('background-color', 'rgb(244, 67, 54)');
  await expect(checkbox).toBeChecked();

  await checkbox.uncheck();
  await expect(tiles.first()).not.toHaveCSS('background-color', 'rgb(244, 67, 54)');
  await expect(checkbox).not.toBeChecked();
});
