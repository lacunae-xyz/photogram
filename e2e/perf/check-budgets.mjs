// The CI perf gate. A single total blocking time measure on a shared runner varies by more than the budget margin,
// so each scenario runs 3 times and the median is gated. LayoutCount is deterministic: the spec checks it on every
// run against budgets.json.
//
// Absolute mode (push to master, nightly): node perf/check-budgets.mjs [playwright args]
//   The median is compared with budgets.json.
// A/B mode (pull requests): node perf/check-budgets.mjs --baseline <base dist> [playwright args]
//   Runner speed moves the median from one job to the next by more than any budget margin, so the PR's dist and the
//   base commit's dist are served side by side and measured interleaved (PR, base, PR, base…) in the same job. A
//   scenario fails if the PR median exceeds base median × 1.2 + 50 ms. A scenario the base didn't record falls back
//   to the absolute budget.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { decide } from './gate.mjs';
import { budgetsFile, measure, samples } from './measures.mjs';

const e2eDir = path.join(import.meta.dirname, '..');
const budgets = JSON.parse(fs.readFileSync(budgetsFile, 'utf8'));

const args = process.argv.slice(2);
const baseline = takeOption('--baseline');
if (baseline !== undefined && !fs.existsSync(path.join(baseline, 'index.html'))) {
  console.error(`✘ --baseline ${baseline}: no index.html`);
  process.exit(1);
}

const { byScenario, baseByScenario, status } = baseline ? await measureAB(baseline) : measureAbsolute();

let failed = status !== 0;
const rows = [];
for (const [scenario, runs] of Object.entries(byScenario)) {
  const pr = runs.map(run => run.totalBlockingTimeMs);
  const base = baseByScenario?.[scenario]?.map(run => run.totalBlockingTimeMs);
  const result = decide({ pr, base, budget: budgets[scenario]?.totalBlockingTimeMs, samples });
  failed ||= !result.ok;
  rows.push([
    result.ok ? '✓' : '✘',
    scenario,
    result.mode === 'ab' ? 'A/B' : 'budget',
    ms(result.prMedian),
    result.mode === 'ab' ? ms(result.baseMedian) : '',
    ms(result.limit),
    pr.map(ms).join(', '),
    base?.map(ms).join(', ') ?? '',
  ]);
}
if (rows.length === 0) {
  console.log('✘ no perf measures recorded');
  failed = true;
} else {
  console.log(`\nTotal blocking time (ms), median of ${samples} runs${baseline ? ' per side' : ''}`);
  const table = [['', 'scenario', 'gate', 'median', 'base median', 'limit', 'runs', 'base runs'], ...rows];
  printTable(baseline ? table : table.map(row => row.filter((_, column) => column !== 4 && column !== 7)));
}
process.exit(failed ? 1 : 0);

function measureAbsolute() {
  return measure(samples, args, { PERF_CHECK: '1' });
}

async function measureAB(baseDir) {
  const output = takeOption('--output') ?? 'test-results';
  const sides = [
    { name: 'pr', dir: path.join(e2eDir, '..', 'dist'), port: 5000, check: true },
    // The base only records: the PR's budgets.json may have lowered a LayoutCount budget the base doesn't meet.
    { name: 'base', dir: path.resolve(baseDir), port: 5001, check: false },
  ];
  // One record per side, next to the runs' output so CI uploads it with them.
  fs.mkdirSync(output, { recursive: true });
  for (const side of sides) {
    side.record = path.resolve(output, `measures-${side.name}.jsonl`);
    fs.writeFileSync(side.record, '');
  }
  const servers = sides.map(side => serve(side.dir, side.port));
  try {
    await Promise.all(sides.map(side => waitForServer(side.port)));
    const htmlOutput = process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ?? 'playwright-report';
    const measures = { pr: {}, base: {} };
    let status = 0;
    for (let run = 1; run <= samples; run++) {
      for (const side of sides) {
        console.log(`\n=== perf ${side.name} ${run}/${samples}: ${side.dir} ===`);
        // Own output and report dirs per run: each Playwright run wipes them.
        const result = measure(
          1,
          [...args, `--output=${output}/${side.name}-${run}`],
          {
            BASE_URL: `http://localhost:${side.port}`,
            PERF_CHECK: side.check ? '1' : '',
            PLAYWRIGHT_HTML_OUTPUT_DIR: `${htmlOutput}/${side.name}-${run}`,
          },
          side.record,
        );
        if (side.check && result.status !== 0) {
          status = result.status ?? 1;
        }
        for (const [scenario, runs] of Object.entries(result.byScenario)) {
          (measures[side.name][scenario] ??= []).push(...runs);
        }
      }
    }
    for (const side of sides) {
      console.log(`${side.name} measures: ${side.record}`);
    }
    return { byScenario: measures.pr, baseByScenario: measures.base, status };
  } finally {
    for (const server of servers) {
      server.kill();
    }
  }
}

/** Removes `--name=value` or `--name value` from args and returns the value. */
function takeOption(name) {
  const index = args.findIndex(arg => arg === name || arg.startsWith(`${name}=`));
  if (index === -1) {
    return undefined;
  }
  const [arg] = args.splice(index, 1);
  return arg.includes('=') ? arg.slice(arg.indexOf('=') + 1) : args.splice(index, 1)[0];
}

/** Like the Playwright config's webServer: serve -s, so /project-demo falls back to index.html. */
function serve(dir, port) {
  const server = spawn(path.join(e2eDir, 'node_modules', '.bin', 'serve'), ['-s', dir, '-l', String(port), '--no-request-logging'], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  server.on('exit', code => {
    if (code) {
      console.error(`✘ serve ${dir} on port ${port} exited with ${code}`);
    }
  });
  return server;
}

async function waitForServer(port) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`http://localhost:${port}/project-demo`)).ok) {
        return;
      }
    } catch {
      // Not listening yet.
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`nothing served on port ${port}`);
}

function ms(value) {
  return value === undefined || Number.isNaN(value) ? '–' : String(Math.round(value));
}

function printTable(table) {
  const widths = table[0].map((_, column) => Math.max(...table.map(row => row[column].length)));
  for (const row of table) {
    console.log(row.map((cell, column) => cell.padEnd(widths[column])).join('  ').trimEnd());
  }
}
