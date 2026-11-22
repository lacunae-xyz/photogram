import { test, expect, tileSelector } from '../support/test';
import { CDPSession, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fixtureDemo, routeDemo } from '../support/demo';
import { waitForTitleSizing } from '../support/sizing';

type Measure = { layoutCount: number; recalcStyleCount: number; taskDurationMs: number; totalBlockingTimeMs: number };
type Budget = { layoutCount: number; totalBlockingTimeMs: number };

const budgets: Record<string, Budget> = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, 'budgets.json'), 'utf8'),
);

const labels = Array.from({ length: 16 }, (_, i) => `label${i + 1}`);
const words = 'Théo traverse le salon en silence ramasse les verres regarde la rue mouillée puis revient vers Alice'.split(' ');

function generateCsv(rows: number) {
  return Array.from({ length: rows }, (_, i) => {
    const length = [0, 3, 12, 40][i % 4];
    const action = Array.from({ length }, (_, j) => words[(i + j) % words.length]).join(' ');
    const period = ['matin', 'jour', 'soir', 'nuit', ''][i % 5];
    return `${i + 1};${action};${labels[i % labels.length]};${period};${i % 7 === 0 ? 'x' : ''}`;
  }).join('\n');
}

async function observeLongTasks(page: Page) {
  await page.addInitScript(() => {
    const tasks: number[] = [];
    (window as unknown as { __longTasks: number[] }).__longTasks = tasks;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        tasks.push(entry.duration);
      }
    }).observe({ type: 'longtask', buffered: true });
  });
}

async function snapshot(page: Page, client: CDPSession): Promise<Measure> {
  const { metrics } = await client.send('Performance.getMetrics');
  const metric = (name: string) => metrics.find(m => m.name === name)?.value ?? 0;
  const longTasks = await page.evaluate(() => (window as unknown as { __longTasks: number[] }).__longTasks);
  return {
    layoutCount: metric('LayoutCount'),
    recalcStyleCount: metric('RecalcStyleCount'),
    taskDurationMs: metric('TaskDuration') * 1000,
    totalBlockingTimeMs: longTasks.reduce((total, duration) => total + Math.max(0, duration - 50), 0),
  };
}

function delta(after: Measure, before: Measure): Measure {
  return {
    layoutCount: after.layoutCount - before.layoutCount,
    recalcStyleCount: after.recalcStyleCount - before.recalcStyleCount,
    taskDurationMs: after.taskDurationMs - before.taskDurationMs,
    totalBlockingTimeMs: after.totalBlockingTimeMs - before.totalBlockingTimeMs,
  };
}

function report(scenario: string, measure: Measure, wallClockMs: number) {
  const info = test.info();
  info.annotations.push({ type: scenario, description: JSON.stringify({ ...measure, wallClockMs: Math.round(wallClockMs) }) });
  if (process.env.PERF_RECORD) {
    // title: check-budgets.mjs re-runs a scenario that failed its A/B with --grep.
    const title = info.titlePath.slice(1).join(' ');
    fs.appendFileSync(process.env.PERF_RECORD, JSON.stringify({ scenario, title, ...measure }) + '\n');
  }
  // update-budgets.mjs and check-budgets.mjs's A/B mode record without checking: A/B gates the medians itself.
  // Its absolute mode checks LayoutCount here and the blocking time median itself.
  const recordOnly = process.env.PERF_RECORD && !process.env.PERF_CHECK;
  if (recordOnly) {
    return;
  }
  const budget = budgets[scenario];
  expect(budget, `budget for ${scenario} in perf/budgets.json`).toBeDefined();
  expect.soft(measure.layoutCount, `${scenario} LayoutCount`).toBeLessThanOrEqual(budget.layoutCount);
  if (!process.env.PERF_RECORD) {
    expect.soft(measure.totalBlockingTimeMs, `${scenario} total blocking time`).toBeLessThanOrEqual(budget.totalBlockingTimeMs);
  }
}

async function openLargeProject(page: Page, rows: number) {
  const image = fixtureDemo().image('1.jpg');
  await routeDemo(page, { csv: generateCsv(rows), image: () => image });
  await observeLongTasks(page);
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  return client;
}

for (const [rows, tag] of [[1000, ''], [3000, ' @slow']] as const) {
  test.describe(`${rows} rows${tag}`, () => {
    test.setTimeout(rows * 300);

    test('load until titles are sized', async ({ page }) => {
      const client = await openLargeProject(page, rows);
      const start = Date.now();
      await page.goto('/project-demo');
      await expect(page.locator(tileSelector)).toHaveCount(rows);
      await waitForTitleSizing(page, rows * 100);
      report(`load-${rows}`, await snapshot(page, client), Date.now() - start);
    });

    test('change font family re-sizes every tile', async ({ page }) => {
      const client = await openLargeProject(page, rows);
      await page.goto('/project-demo');
      await expect(page.locator(tileSelector)).toHaveCount(rows);
      await waitForTitleSizing(page, rows * 100);
      const before = await snapshot(page, client);
      const start = Date.now();
      await page.locator('#font-family').fill('Arial');
      await expect(page.locator('.tiles-container')).toHaveCSS('font-family', 'Arial');
      await waitForTitleSizing(page, rows * 100);
      report(`font-family-${rows}`, delta(await snapshot(page, client), before), Date.now() - start);
    });

    test('edit one action re-sizes only that tile', async ({ page }) => {
      const client = await openLargeProject(page, rows);
      await page.goto('/project-demo');
      await expect(page.locator(tileSelector)).toHaveCount(rows);
      await waitForTitleSizing(page, rows * 100);
      const tile = page.locator(tileSelector).nth(1);
      await tile.click();
      await page.locator('#form-action').fill('Une action modifiée, nettement plus longue que la précédente pour forcer un nouveau calcul de taille.');
      const before = await snapshot(page, client);
      const start = Date.now();
      await page.locator('#form button[type=submit]').click();
      await expect(tile.locator('.action')).toContainText('Une action modifiée');
      await waitForTitleSizing(page, rows * 100);
      report(`edit-one-${rows}`, delta(await snapshot(page, client), before), Date.now() - start);
    });
  });
}
