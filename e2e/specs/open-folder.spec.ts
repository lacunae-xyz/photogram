import { test, expect } from '../support/test';
import { openFolder, readDataJson } from '../support/open-folder';
import { expectCover, importRows, waitForServiceWorker } from '../support/projects';

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
    await expect(page.locator('.tiles-container .ele')).toHaveCount(importRows);
    expect(pageErrors).toEqual([]);
  });

  test('edits are written to data.json', async ({ page }) => {
    const card = await openFolder(page);
    await card.click();
    const tiles = page.locator('.tiles-container .ele');
    await tiles.first().click();
    await page.locator('#form-action').fill('Écrit dans le dossier');
    await page.locator('#form button[type=submit]').click();
    await expect(tiles.first().locator('.action')).toHaveText('Écrit dans le dossier');

    await expect.poll(async () => (await readDataJson(page)).data[0].action).toBe('Écrit dans le dossier');
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
    await expect(page.locator('.tiles-container .ele')).toHaveCount(importRows);
  });
});

// B20: the button shows everywhere and throws where showDirectoryPicker is missing. Hidden in phase 3.
test('Open project throws without showDirectoryPicker (B20)', async ({ page, browserName, pageErrors }) => {
  test.skip(browserName === 'chromium', 'Chromium has showDirectoryPicker');
  await page.goto('/projects');
  await page.locator('#open-project-label').click();
  await expect.poll(() => pageErrors.map(error => error.message).join('\n')).toMatch(/showDirectoryPicker/);
});
