import { test, expect } from '../support/test';

const routes = [
  { path: '/', ready: '.landing-container' },
  { path: '/tutorial', ready: 'h1' },
  { path: '/projects', ready: '.projects-container' },
  { path: '/project-demo', ready: '.tiles-container .ele' },
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

// B16: no catch-all route, an unknown URL renders an empty app. Phase 6 adds a 404 page.
test('unknown route renders an empty app (B16)', async ({ page, pageErrors }) => {
  const response = await page.goto('/does-not-exist');
  expect(response?.status()).toBe(200);
  await expect(page.locator('#root .App')).toBeAttached();
  await expect(page.locator('#root .App')).toBeEmpty();
  expect(pageErrors).toEqual([]);
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
