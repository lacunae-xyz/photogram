import { test, expect, tileSelector } from '../support/test';

const routes = [
  { path: '/', ready: '.landing-container' },
  { path: '/tutorial', ready: 'h1' },
  { path: '/projects', ready: '.projects-container' },
  { path: '/project-demo', ready: tileSelector },
  { path: '/privacy-policy', ready: 'h1' },
  { path: '/fixor', ready: '.fixor-empty-container' },
];

for (const { path, ready } of routes) {
  test(`${path} renders with no console errors`, async ({ page, consoleErrors, pageErrors }) => {
    await page.goto(path);
    await expect(page.locator(ready).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

test('the privacy policy is linked from /', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy policy' }).click();
  await expect(page).toHaveURL(/\/privacy-policy$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'contact@lacunae.xyz' })).toHaveAttribute('href', 'mailto:contact@lacunae.xyz');
});

test('the tutorial names the file data.csv', async ({ page }) => {
  await page.goto('/tutorial');
  await expect(page.getByText('nommé data.csv')).toBeVisible();
});

// B16: no catch-all route, an unknown URL renders an empty app. Phase 6 adds a 404 page.
test('unknown route renders an empty app (B16)', async ({ page, pageErrors }) => {
  const response = await page.goto('/does-not-exist');
  expect(response?.status()).toBe(200);
  await expect(page.locator('#root .App')).toBeAttached();
  await expect(page.locator('#root .App')).toBeEmpty();
  expect(pageErrors).toEqual([]);
});

// B16: fixed in phase 6, where photogram-app has a catch-all route. Remove test.fail with the fix.
test('unknown route shows a not found page (B16)', async ({ page }) => {
  test.fail(true, 'B16');
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: /not found|404/i })).toBeVisible({ timeout: 2_000 });
});

// Fixor iframes photogram.app/fixor until phase 7. Only meaningful against Netlify (BASE_URL), `serve` sends no such headers.
test('/fixor can be framed by fixor.photogram.app', async ({ request }) => {
  const response = await request.get('/fixor');
  expect(response.ok()).toBe(true);
  const headers = response.headers();
  expect(headers['x-frame-options']).toBeUndefined();
  const frameAncestors = headers['content-security-policy']
    ?.split(';')
    .map(directive => directive.trim())
    .find(directive => directive.startsWith('frame-ancestors'));
  if (frameAncestors !== undefined) {
    expect(frameAncestors).toContain('https://fixor.photogram.app');
  }
});
