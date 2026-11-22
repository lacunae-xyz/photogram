// The CI perf gate. A single total blocking time measure on a shared runner varies by more than the budget margin,
// so each scenario runs 3 times and the median is gated. LayoutCount varies less but isn't deterministic either
// (load-1000 has spiked 20 % over its usual count in CI).
//
// Absolute mode (push to master): node perf/check-budgets.mjs [playwright args]
//   The median is compared with budgets.json. The spec checks LayoutCount on every run against budgets.json.
// A/B mode (pull requests): node perf/check-budgets.mjs --baseline <base dist> [playwright args]
//   Runner speed moves the median from one job to the next by more than any budget margin, so the PR's dist and the
//   base commit's dist are served side by side and measured interleaved (PR, base, PR, base…) in the same job. A
//   scenario fails if the PR median exceeds base median × 1.2 + 50 ms. Only the PR side fails the gate: a base that
//   isn't served, or base runs that fail (the PR changed the spec's flow, say), are logged and the scenarios without
//   all their base runs fall back to the absolute budget. A scenario that fails its A/B is measured again, once (3 more
//   interleaved rounds of that test alone), and the new runs decide: runner noise fails a good PR now and then, a
//   regression fails both measures. The spec only records here: LayoutCount is gated on the median of the deciding PR
//   runs against budgets.json, so one spiking run doesn't fail a PR whose A/B passed.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { abRatio, abSlackMs, decide, decideRemeasured, needsRemeasure } from './gate.mjs';
import { budgetsFile, measure, samples } from './measures.mjs';

const e2eDir = path.join(import.meta.dirname, '..');
const budgets = JSON.parse(fs.readFileSync(budgetsFile, 'utf8'));

const args = process.argv.slice(2);
const baseline = takeOption('--baseline');
if (baseline !== undefined && !fs.existsSync(path.join(baseline, 'index.html'))) {
  console.error(`✘ --baseline ${baseline}: no index.html`);
  process.exit(1);
}

const { passes, status } = baseline ? await measureAB(baseline) : measureAbsolute();
const [first, second] = passes;

let failed = status !== 0;
const decisions = {};
const tables = passes.map(pass =>
  Object.entries(pass.pr).map(([scenario, runs]) => {
    const pr = runs.map(run => run.totalBlockingTimeMs);
    const base = pass.base?.[scenario]?.map(run => run.totalBlockingTimeMs);
    const result = decide({ pr, base, budget: budgets[scenario]?.totalBlockingTimeMs, samples });
    decisions[scenario] =
      pass === second
        ? decideRemeasured({ first: blockingTimes(first, scenario), second: { pr, base }, budget: budgets[scenario]?.totalBlockingTimeMs, samples })
        : result;
    return [
      result.ok ? '✓' : '✘',
      scenario,
      result.mode === 'ab' ? 'A/B' : 'budget',
      ms(result.prMedian),
      result.mode === 'ab' ? ms(result.baseMedian) : '',
      ms(result.limit),
      pr.map(ms).join(', '),
      base?.map(ms).join(', ') ?? '',
      note(result, pr, base, pass === first && second?.pr[scenario] !== undefined),
    ];
  }),
);
for (const result of Object.values(decisions)) {
  failed ||= !result.ok;
}
if (tables[0].length === 0) {
  console.log('✘ no perf measures recorded');
  failed = true;
} else {
  tables.forEach((rows, index) => {
    const title = passes.length > 1 ? (index === 0 ? ', first measure' : ', measured again: these runs decide') : '';
    console.log(`\nTotal blocking time (ms), median of ${samples} runs${baseline ? ' per side' : ''}${title}`);
    if (baseline) {
      printTable([['', 'scenario', 'gate', 'PR median', 'base median', 'limit', 'PR runs', 'base runs', ''], ...rows]);
    } else {
      printTable([['', 'scenario', 'median', 'budget', 'runs', ''], ...rows.map(row => [0, 1, 3, 5, 6, 8].map(column => row[column]))]);
    }
  });
  if (baseline) {
    console.log(`A/B limit: base median × ${abRatio} + ${abSlackMs} ms. budget: perf/budgets.json.`);
    // The deciding runs: the re-measure's for a scenario measured again.
    const layoutRows = Object.keys(first.pr).map(scenario => {
      const runs = (second?.pr[scenario] ?? first.pr[scenario]).map(run => run.layoutCount);
      const result = decide({ pr: runs, budget: budgets[scenario]?.layoutCount, samples });
      failed ||= !result.ok;
      const remark =
        runs.length !== samples
          ? `${runs.length}/${samples} PR runs`
          : result.limit === undefined
            ? 'no budget in budgets.json'
            : second?.pr[scenario]
              ? 'runs of the re-measure'
              : '';
      return [result.ok ? '✓' : '✘', scenario, ms(result.prMedian), ms(result.limit), runs.map(ms).join(', '), remark];
    });
    console.log(`\nPR LayoutCount, median of ${samples} runs`);
    printTable([['', 'scenario', 'median', 'budget', 'runs', ''], ...layoutRows]);
  }
  if (second) {
    const remeasured = Object.keys(second.pr);
    const passed = remeasured.filter(scenario => decisions[scenario].ok);
    console.log(`Measured again: ${remeasured.join(', ')}. Passed the second measure: ${passed.join(', ') || 'none'}.`);
  }
}
process.exit(failed ? 1 : 0);

function measureAbsolute() {
  const { byScenario, status } = measure(samples, args, { PERF_CHECK: '1' });
  return { passes: [{ pr: byScenario }], status };
}

function blockingTimes(pass, scenario) {
  return {
    pr: pass.pr[scenario].map(run => run.totalBlockingTimeMs),
    base: pass.base?.[scenario]?.map(run => run.totalBlockingTimeMs),
  };
}

/**
 * One A/B measure: `samples` rounds, each running the PR side then the base side. PR runs that fail set the status;
 * base runs that fail are logged and leave their scenarios without a full base.
 */
async function rounds(sides, suffix, args, output, htmlOutput) {
  // One record per side and measure, next to the runs' output so CI uploads it with them.
  for (const side of sides) {
    side.record = path.resolve(output, `measures-${side.name}${suffix}.jsonl`);
    fs.writeFileSync(side.record, '');
  }
  const measures = { pr: {}, base: sides.length > 1 ? {} : undefined, status: 0 };
  for (let run = 1; run <= samples; run++) {
    for (const side of sides) {
      console.log(`\n=== perf ${side.name}${suffix} ${run}/${samples}: ${side.dir} ===`);
      // Own output and report dirs per run: each Playwright run wipes them.
      const result = measure(
        1,
        [...args, `--output=${output}/${side.name}${suffix}-${run}`],
        {
          BASE_URL: `http://localhost:${side.port}`,
          // Record only: the median is gated here, not each run in the spec.
          PERF_CHECK: '',
          PLAYWRIGHT_HTML_OUTPUT_DIR: `${htmlOutput}/${side.name}${suffix}-${run}`,
        },
        side.record,
      );
      if (result.status !== 0) {
        if (side.gates) {
          measures.status = result.status ?? 1;
        } else {
          const recorded = Object.keys(result.byScenario).join(', ') || 'none';
          // stdout, like the run headers: stderr would print out of order.
          console.log(
            `⚠ base run ${run} failed (exit ${result.status}), recorded: ${recorded}. Scenarios without ${samples} base runs fall back to the absolute budget.`,
          );
        }
      }
      for (const [scenario, runs] of Object.entries(result.byScenario)) {
        (measures[side.name][scenario] ??= []).push(...runs);
      }
      // spawnSync blocks the event loop: let a signal received meanwhile reach stop before the next run.
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  for (const side of sides) {
    console.log(`${side.name}${suffix} measures: ${side.record}`);
  }
  return measures;
}

async function measureAB(baseDir) {
  const output = takeOption('--output') ?? 'test-results';
  const sides = [
    { name: 'pr', dir: path.join(e2eDir, '..', 'dist'), port: 5000, gates: true },
    // Base runs that fail don't fail the gate: the PR may have changed the spec's flow.
    { name: 'base', dir: path.resolve(baseDir), port: 5001, gates: false },
  ];
  fs.mkdirSync(output, { recursive: true });
  const servers = sides.map(side => serve(side.dir, side.port));
  // A cancelled run (CI cancel, ^C) mustn't leave the servers behind or start the next run.
  const stop = signal => {
    servers.forEach(server => server.kill());
    process.exit(128 + os.constants.signals[signal]);
  };
  process.once('SIGINT', stop).once('SIGTERM', stop);
  try {
    await waitForServer(sides[0].port);
    try {
      await waitForServer(sides[1].port);
    } catch (error) {
      console.log(`⚠ base not served (${error.message}): every scenario falls back to the absolute budget`);
      sides.pop();
    }
    const htmlOutput = process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ?? 'playwright-report';
    const first = await rounds(sides, '', args, output, htmlOutput);
    const again = Object.entries(first.pr)
      .filter(([scenario]) => needsRemeasure({ ...blockingTimes(first, scenario), budget: budgets[scenario]?.totalBlockingTimeMs, samples }))
      .map(([scenario]) => scenario);
    const passes = [first];
    let status = first.status;
    if (again.length) {
      console.log(`\n⚠ A/B failed on the first measure: ${again.join(', ')}. Measuring again, the new runs decide.`);
      // The spec records each scenario's test title: --grep runs only those tests.
      const titles = again.map(scenario => first.pr[scenario][0].title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const second = await rounds(sides, '-again', [...args, `--grep=${titles.join('|')}`], output, htmlOutput);
      passes.push(second);
      status ||= second.status;
    }
    return { passes, status };
  } finally {
    process.off('SIGINT', stop).off('SIGTERM', stop);
    for (const server of servers) {
      server.kill();
    }
  }
}

function note(result, pr, base, measuredAgain) {
  if (measuredAgain) {
    return 'measured again';
  }
  if (pr.length !== samples) {
    return `${pr.length}/${samples} PR runs`;
  }
  if (result.limit === undefined) {
    return 'no budget in budgets.json';
  }
  if (baseline && result.mode === 'absolute') {
    return `fallback: ${base?.length ?? 0}/${samples} base runs`;
  }
  return '';
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
  server.on('error', error => console.error(`✘ serve ${dir} on port ${port}: ${error.message}`));
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
