import { test, expect } from '../support/test';
import { importProject } from '../support/projects';

test('imported images are served by image-worker.js after reload', async ({ page }) => {
  const card = await importProject(page);
  await card.click();
  const images = page.locator('.tiles-container .img');
  await expect(images).toHaveCount(3);

  await page.reload();
  await expect(images).toHaveCount(3);
  for (const image of await images.all()) {
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
  }
  const src = await images.first().getAttribute('src');
  const response = await page.evaluate(async url => {
    const response = await fetch(url!);
    return { status: response.status, type: response.headers.get('Content-Type') };
  }, src);
  expect(response).toEqual({ status: 200, type: 'image/jpeg' });
});

// B5: a cache miss answers with a network error. After the fix it is a 404.
test('unknown /images/ URL is a network error (B5)', async ({ page }) => {
  await page.goto('/projects');
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller !== null;
  });
  const result = await page.evaluate(() =>
    fetch('/project/unknown/images/nope.jpg/').then(response => response.status, error => error.name),
  );
  expect(result).toBe('TypeError');
});
