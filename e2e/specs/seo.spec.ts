import { test, expect } from '../support/test';

test('robots.txt points at the sitemap and keeps crawlers out of projects and Fixor', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.ok()).toBe(true);
  const robots = await response.text();
  expect(robots).toContain('Sitemap: https://photogram.app/sitemap.xml');
  expect(robots).toContain('Disallow: /project/*');
  expect(robots).toContain('Disallow: /fixor');
});

test('every sitemap URL renders with a title', async ({ page, request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.ok()).toBe(true);
  const urls = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]));
  expect(urls.map(url => url.pathname).sort()).toEqual(
    ['/', '/privacy-policy', '/project-demo', '/projects', '/tutorial'].sort(),
  );
  for (const url of urls) {
    expect(url.origin).toBe('https://photogram.app');
    const document = await page.goto(url.pathname);
    expect(document?.status(), url.pathname).toBe(200);
    await expect.poll(() => page.title(), { message: url.pathname }).not.toBe('');
  }
});
