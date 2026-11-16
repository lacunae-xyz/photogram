// The CI perf gate. A single total blocking time measure on a shared runner varies by more than the budget margin,
// so each scenario runs 3 times and the median is compared with the budget. LayoutCount is deterministic: the spec
// checks it on every run.
import fs from 'node:fs';
import { budgetsFile, measure, median, samples } from './measures.mjs';

const budgets = JSON.parse(fs.readFileSync(budgetsFile, 'utf8'));
const { byScenario, status } = measure(samples, process.argv.slice(2), { PERF_CHECK: '1' });

let failed = status !== 0;
for (const [scenario, runs] of Object.entries(byScenario)) {
  const tbt = runs.map(run => run.totalBlockingTimeMs);
  const budget = budgets[scenario]?.totalBlockingTimeMs;
  const value = median(tbt);
  const ok = runs.length === samples && budget !== undefined && value <= budget;
  failed ||= !ok;
  console.log(
    `${ok ? '✓' : '✘'} ${scenario} total blocking time median ${Math.round(value)} ms (budget ${budget}, runs ${tbt.map(Math.round).join(', ')})`,
  );
}
if (Object.keys(byScenario).length === 0) {
  console.log('✘ no perf measures recorded');
  failed = true;
}
process.exit(failed ? 1 : 0);
