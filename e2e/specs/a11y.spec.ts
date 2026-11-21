import type { Page, TestInfo } from '@playwright/test';
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

const dark = 'rgb(34, 34, 34)';

const routes = ['/', '/tutorial', '/projects', '/project-demo', '/privacy-policy'];

/** Each illustration's image source: they recolour, so the source changes with the scheme. */
const illustrationSources = (page: Page) =>
  page.locator('pg-illustration').evaluateAll(elements =>
    elements.map(element => element.shadowRoot?.querySelector('img')?.getAttribute('src') ?? null),
  );

/** Waits for the CSS transitions running anywhere on the page, shadow roots included: the landing cards fade their
 * colours over 0.5 s on a scheme change, and axe would read a mid-fade contrast. */
function transitionsEnded(page: Page) {
  return page.evaluate(async () => {
    const transitions: Animation[] = [];
    const collect = (root: Document | ShadowRoot) => {
      transitions.push(...root.getAnimations().filter(animation => animation instanceof CSSTransition));
      root.querySelectorAll('*').forEach(element => element.shadowRoot && collect(element.shadowRoot));
    };
    collect(document);
    await Promise.allSettled(transitions.map(transition => transition.finished));
  });
}

async function expectNoViolations(page: Page, testInfo: TestInfo, colorScheme: 'light' | 'dark') {
  const results = await new AxeBuilder({ page }).analyze();
  await testInfo.attach(`axe ${colorScheme}`, { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
  const violations = results.violations
    .map(violation => ({
      id: violation.id,
      targets: violation.nodes
        .map(node => node.target.join(','))
        .filter(target => !isKnown(violation.id, target)),
    }))
    .filter(violation => violation.targets.length > 0);
  expect(violations, colorScheme).toEqual([]);
}

test.use({ colorScheme: 'light' });

for (const route of routes) {
  test(`axe ${route}, light then dark`, async ({ page }, testInfo) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    // One main landmark, and the header's banner outside it (Playwright's locators pierce shadow roots).
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('main header')).toHaveCount(0);
    await expect.poll(() => illustrationSources(page)).not.toContain(null);
    const lightSources = await illustrationSources(page);
    await expectNoViolations(page, testInfo, 'light');

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(dark);
    // Axe on a half-switched page reads light illustrations on a dark surface.
    await expect
      .poll(async () => {
        const sources = await illustrationSources(page);
        return sources.length === lightSources.length && sources.every((src, i) => src !== null && src !== lightSources[i]);
      })
      .toBe(true);
    await transitionsEnded(page);
    await expectNoViolations(page, testInfo, 'dark');
  });
}
