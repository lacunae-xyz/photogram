// Runs the perf project 5 times and writes worst × 1.3 to budgets.json, with a floor on total blocking time. Run it in the Playwright Docker image (../docker.sh).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const runs = 5;
const margin = 1.3;
// One stray long task on a CI runner shouldn't fail a scenario that measured ~0 ms. LayoutCount stays the strict gate.
const totalBlockingTimeFloorMs = 100;
const record = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'perf-')), 'measures.jsonl');
const args = ['playwright', 'test', '--project=perf', '--workers=1', `--repeat-each=${runs}`, ...process.argv.slice(2)];
execFileSync('npx', args, { stdio: 'inherit', env: { ...process.env, PERF_RECORD: record } });

const worst = {};
for (const line of fs.readFileSync(record, 'utf8').trim().split('\n')) {
  const { scenario, layoutCount, totalBlockingTimeMs } = JSON.parse(line);
  const current = worst[scenario] ?? { layoutCount: 0, totalBlockingTimeMs: 0, runs: 0 };
  worst[scenario] = {
    layoutCount: Math.max(current.layoutCount, layoutCount),
    totalBlockingTimeMs: Math.max(current.totalBlockingTimeMs, totalBlockingTimeMs),
    runs: current.runs + 1,
  };
}

const file = path.join(import.meta.dirname, 'budgets.json');
const budgets = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const [scenario, { layoutCount, totalBlockingTimeMs, runs: count }] of Object.entries(worst)) {
  if (count < runs) {
    throw new Error(`${scenario}: ${count} runs, expected ${runs}`);
  }
  budgets[scenario] = {
    layoutCount: Math.ceil(layoutCount * margin),
    totalBlockingTimeMs: Math.max(Math.ceil(totalBlockingTimeMs * margin), totalBlockingTimeFloorMs),
  };
}
fs.writeFileSync(file, JSON.stringify(budgets, null, 2) + '\n');
console.log(budgets);
