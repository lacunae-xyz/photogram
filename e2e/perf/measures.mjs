// Shared by check-budgets.mjs and update-budgets.mjs: run the perf project with PERF_RECORD and read back one measure per run.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const budgetsFile = path.join(import.meta.dirname, 'budgets.json');

/** Runs per scenario behind one total blocking time value: the CI gate takes their median. */
export const samples = 3;

/** Runs every scenario `repeat` times. Returns the measures by scenario, in run order, and Playwright's exit status. */
export function measure(repeat, args, env = {}) {
  const record = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'perf-')), 'measures.jsonl');
  const { status } = spawnSync(
    'npx',
    ['playwright', 'test', '--project=perf', '--workers=1', `--repeat-each=${repeat}`, ...args],
    { stdio: 'inherit', env: { ...process.env, ...env, PERF_RECORD: record } },
  );
  const byScenario = {};
  const lines = fs.existsSync(record) ? fs.readFileSync(record, 'utf8').trim().split('\n').filter(Boolean) : [];
  for (const line of lines) {
    const { scenario, ...values } = JSON.parse(line);
    (byScenario[scenario] ??= []).push(values);
  }
  return { byScenario, status };
}

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
