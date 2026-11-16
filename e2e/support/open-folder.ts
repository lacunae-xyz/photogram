import { expect, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { importFolder } from './projects';

export const openedName = 'Projet ouvert';

/** Stubs the folder picker with an OPFS directory holding the import fixture. */
export async function stubDirectoryPicker(page: Page) {
  const files = fs.readdirSync(importFolder).map(name => ({
    name,
    bytes: Array.from(fs.readFileSync(path.join(importFolder, name))),
  }));
  await page.addInitScript(
    ({ name, files }) => {
      (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker =
        async () => {
          const root = await navigator.storage.getDirectory();
          const dir = await root.getDirectoryHandle(name, { create: true });
          for (const file of files) {
            const handle = await dir.getFileHandle(file.name, { create: true });
            const writable = await handle.createWritable();
            await writable.write(new Uint8Array(file.bytes));
            await writable.close();
          }
          return dir;
        };
    },
    { name: openedName, files },
  );
}

export async function openFolder(page: Page) {
  await stubDirectoryPicker(page);
  await page.goto('/projects');
  await page.locator('#open-project-label').click();
  const card = page.locator('.projects-card', { hasText: openedName });
  await expect(card).toBeVisible();
  return card;
}

export async function readDataJson(page: Page) {
  return page.evaluate(async name => {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle(name);
    const file = await (await dir.getFileHandle('data.json')).getFile();
    return JSON.parse(await file.text());
  }, openedName);
}
