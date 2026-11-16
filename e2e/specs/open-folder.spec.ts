import { test, expect, tileSelector } from '../support/test';
import { addToOpenedFolder, openFolder, openedName, readDataJson, stubDirectoryPicker } from '../support/open-folder';
import { expectCover, importRows, storedProject, waitForServiceWorker } from '../support/projects';

test.describe('Chromium', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'showDirectoryPicker is Chromium only');

  test('open a folder: linked card with cover, data.json written', async ({ page, pageErrors }) => {
    const card = await openFolder(page);
    await waitForServiceWorker(page);
    await expect(card.locator('.img-project-link')).toHaveAttribute('title', 'Linked project with file system');
    await expectCover(card, /^\/project\/[\w-]+\/images\/1\.jpg\/$/);

    const json = await readDataJson(page);
    expect(json.name).toBe('Projet ouvert');
    expect(json.data).toHaveLength(importRows);

    await card.click();
    await expect(page.locator(tileSelector)).toHaveCount(importRows);
    expect(pageErrors).toEqual([]);
  });

  test('open a folder from the landing page', async ({ page }) => {
    await stubDirectoryPicker(page);
    await page.goto('/');
    await page.getByRole('button', { name: /Open/ }).click();
    await expect(page.locator('.projects-card', { hasText: openedName })).toBeVisible();
  });

  test('cancelling the picker is not an error (B21)', async ({ page, pageErrors }) => {
    await page.addInitScript(() => {
      const target = window as unknown as { showDirectoryPicker: () => Promise<never>; pickerCalls: number };
      target.pickerCalls = 0;
      target.showDirectoryPicker = async () => {
        target.pickerCalls++;
        throw new DOMException('The user aborted a request.', 'AbortError');
      };
    });
    const pickerCalls = () => page.evaluate(() => (window as unknown as { pickerCalls: number }).pickerCalls);
    const settle = () => page.evaluate(() => new Promise(resolve => setTimeout(resolve)));

    await page.goto('/projects');
    await page.locator('#open-project-label').click();
    await expect.poll(pickerCalls).toBe(1);
    await settle();
    await page.goto('/');
    await page.getByRole('button', { name: /Open/ }).click();
    await expect.poll(pickerCalls).toBe(1);
    await settle();
    expect(pageErrors).toEqual([]);
    await expect(page.locator('.projects-card')).toHaveCount(0);
  });

  test('edits are written to data.json', async ({ page }) => {
    const card = await openFolder(page);
    await card.click();
    const tiles = page.locator(tileSelector);
    await tiles.first().click();
    await page.locator('#form-action').fill('Écrit dans le dossier');
    await page.locator('#form button[type=submit]').click();
    await expect(tiles.first().locator('.action')).toHaveText('Écrit dans le dossier');

    await expect.poll(async () => (await readDataJson(page)).data[0].action).toBe('Écrit dans le dossier');
  });

  test('reopening attaches images added to the folder since (B27)', async ({ page }) => {
    const card = await openFolder(page, { without: ['3.jpg'] });
    await card.click();
    const image = page.locator(tileSelector).nth(2).locator('.img');
    await expect(image).toHaveAttribute('src', /empty\.\w+\.svg$/);

    const key = page.url().split('/').pop()!;

    await addToOpenedFolder(page, '3.jpg');
    await page.goto('/projects');
    await page.locator('#open-project-label').click();
    await expect(page.locator('.projects-card', { hasText: openedName })).toHaveCount(1);
    // The card is there from the first open: wait for the reopen to be saved before opening it.
    await expect
      .poll(async () => ((await storedProject(page, key))?.data as { url?: string }[] | undefined)?.[2]?.url)
      .toMatch(/\/images\/3\.jpg\/$/);
    await page.locator('.projects-card', { hasText: openedName }).click();
    await expect(image).toHaveAttribute('src', /\/images\/3\.jpg\/$/);
    await expect.poll(async () => (await readDataJson(page)).data[2].url).toMatch(/\/images\/3\.jpg\/$/);
  });

  test('permission is asked again after reload when it is back to prompt', async ({ page }) => {
    const card = await openFolder(page);
    await card.click();
    await expect(page).toHaveURL(/\/project\/[\w-]+$/);

    // The handle is read back from IndexedDB, so patch the prototype rather than an instance.
    await page.addInitScript(() => {
      // Chromium-only methods, missing from lib.dom.
      type PermissionMode = { mode?: 'read' | 'readwrite' };
      const prototype = FileSystemHandle.prototype as FileSystemHandle & {
        queryPermission(options?: PermissionMode): Promise<PermissionState>;
        requestPermission(options?: PermissionMode): Promise<PermissionState>;
      };
      let state: PermissionState = 'prompt';
      const requestPermission = prototype.requestPermission;
      prototype.queryPermission = async () => state;
      prototype.requestPermission = async function (options) {
        state = await requestPermission.call(this, options);
        return state;
      };
    });
    await page.reload();
    const button = page.getByRole('button', { name: 'Grant permission' });
    await expect(button).toBeVisible();
    await expect(page.locator('.tiles-container')).toHaveCount(0);

    await button.click();
    await expect(page.locator(tileSelector)).toHaveCount(importRows);
  });
});

test('Open is hidden without showDirectoryPicker (B20)', async ({ page, pageErrors }) => {
  await page.addInitScript(() => {
    delete (window as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    delete (Window.prototype as { showDirectoryPicker?: unknown }).showDirectoryPicker;
  });
  await page.goto('/projects');
  await expect(page.locator('#import-project-label')).toBeVisible();
  await expect(page.locator('#open-project-label')).toHaveCount(0);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Create' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Open' })).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
