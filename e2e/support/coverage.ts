import { test as base } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Chromium JS coverage per test, on when PW_COVERAGE is set. Raw V8 entries go to coverage-raw/<project>/, and
// support/coverage-report.mjs (the global teardown) turns them into one report per project, mapped to src through the build's
// source maps. Firefox and WebKit have no coverage API: their tests run unchanged.
export const rawDir = path.join(import.meta.dirname, '..', 'coverage-raw');

// Off: Playwright's own test, so a run without coverage gets no extra fixture (and no page in tests that take none).
export const test = !process.env.PW_COVERAGE
  ? base
  : base.extend<{ jsCoverage: void }>({
      jsCoverage: [
        async ({ page, browserName, baseURL }, use, testInfo) => {
          if (browserName !== 'chromium') {
            await use();
            return;
          }
          const origin = new URL(baseURL ?? 'http://localhost:5000').origin;
          const context = page.context();
          const pages = [page];
          // Pages the test opens itself. One closed before the test ends loses its coverage.
          const onPage = (other: typeof page) => {
            pages.push(other);
            other.coverage
              .startJSCoverage({ resetOnNavigation: false })
              .catch(() => {});
          };
          await page.coverage.startJSCoverage({ resetOnNavigation: false });
          context.on('page', onPage);
          await use();
          context.off('page', onPage);
          const entries = [];
          for (const each of pages) {
            if (each.isClosed()) continue;
            try {
              entries.push(...(await each.coverage.stopJSCoverage()));
            } catch {
              // Page or context already gone.
            }
          }
          const own = entries.filter(entry => entry.url.startsWith(origin));
          if (own.length === 0) return;
          const dir = path.join(rawDir, testInfo.project.name);
          fs.mkdirSync(dir, { recursive: true });
          const spec = path.relative(testInfo.project.testDir, testInfo.file);
          const name = `${spec.replace(/[\\/]/g, '__')}--${testInfo.testId}-r${testInfo.repeatEachIndex}-${testInfo.retry}.json`;
          fs.writeFileSync(
            path.join(dir, name),
            JSON.stringify({
              spec,
              title: testInfo.titlePath.join(' › '),
              entries: own,
            }),
          );
        },
        { auto: true },
      ],
    });
