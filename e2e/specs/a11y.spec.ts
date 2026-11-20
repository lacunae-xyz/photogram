import { test, expect } from '../support/test';
import AxeBuilder from '@axe-core/playwright';

// Gating since phase 6: any axe violation fails, in both colour schemes.
/** Out of scope, each with its reason. Matched by rule and target, so any other node still fails the run. */
const known = [
  {
    id: 'color-contrast',
    target: /photogram-sequence,\.sequence\.sequence-colored-/,
    // The sequence number on its label colour: user data, the same in both schemes. Black or white is picked by YIQ
    // (src/Templates/contrast.js), which puts white on the light blues (#03A9F4: 2.7:1). Changing the pick changes
    // printed tiles: its own change, not dark mode's.
  },
];

const isKnown = (id: string, target: string) => known.some(entry => entry.id === id && entry.target.test(target));

const routes = ['/', '/tutorial', '/projects', '/project-demo', '/privacy-policy'];

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme });

    for (const route of routes) {
      test(`axe ${route}`, async ({ page }, testInfo) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        // One main landmark, and the header's banner outside it (Playwright's locators pierce shadow roots).
        await expect(page.locator('main')).toHaveCount(1);
        await expect(page.locator('main header')).toHaveCount(0);
        const results = await new AxeBuilder({ page }).analyze();
        await testInfo.attach('axe', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
        const violations = results.violations
          .map(violation => ({
            id: violation.id,
            targets: violation.nodes
              .map(node => node.target.join(','))
              .filter(target => !isKnown(violation.id, target)),
          }))
          .filter(violation => violation.targets.length > 0);
        expect(violations).toEqual([]);
      });
    }
  });
}
