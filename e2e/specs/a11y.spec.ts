import { test } from '../support/test';
import AxeBuilder from '@axe-core/playwright';

// Report only until phase 6.
const routes = ['/', '/tutorial', '/projects', '/project-demo', '/privacy-policy', '/fixor'];

for (const route of routes) {
  test(`axe ${route}`, async ({ page }, testInfo) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    await testInfo.attach('axe', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
    testInfo.annotations.push({
      type: 'axe violations',
      description: results.violations.map(v => `${v.id} (${v.nodes.length})`).join(', ') || 'none',
    });
  });
}
