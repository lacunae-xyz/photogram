// Runs each perf scenario 9 times, as 3 groups of 3 (what check-budgets.mjs gates on), and writes budgets.json:
// LayoutCount worst × 1.3, total blocking time worst group median × 1.3 with a floor.
// Run it on the CI runner (update-budgets label) or in the Playwright Docker image (../docker.sh --budgets).
import fs from 'node:fs';
import { budgetsFile, measure, median, samples } from './measures.mjs';

const groups = 3;
const margin = 1.3;
// One stray long task on a CI runner shouldn't fail a scenario that measured ~0 ms. LayoutCount stays the strict gate.
const totalBlockingTimeFloorMs = 100;

const { byScenario, status } = measure(groups * samples, process.argv.slice(2));
if (status !== 0) {
  process.exit(status ?? 1);
}

const budgets = JSON.parse(fs.readFileSync(budgetsFile, 'utf8'));
for (const [scenario, runs] of Object.entries(byScenario)) {
  if (runs.length < groups * samples) {
    throw new Error(`${scenario}: ${runs.length} runs, expected ${groups * samples}`);
  }
  const groupMedians = Array.from({ length: groups }, (_, i) =>
    median(runs.slice(i * samples, (i + 1) * samples).map(run => run.totalBlockingTimeMs)),
  );
  budgets[scenario] = {
    layoutCount: Math.ceil(Math.max(...runs.map(run => run.layoutCount)) * margin),
    totalBlockingTimeMs: Math.max(Math.ceil(Math.max(...groupMedians) * margin), totalBlockingTimeFloorMs),
  };
}
fs.writeFileSync(budgetsFile, JSON.stringify(budgets, null, 2) + '\n');
console.log(budgets);
