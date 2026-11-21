// Coverage tables for the CI job summary, from one or more Istanbul coverage-summary.json files (Vitest's and
// coverage-report.mjs's). Appends to $GITHUB_STEP_SUMMARY when it's set and always prints to the log, so
// `gh run view --log` shows the same numbers. No dependencies: the Vitest job runs it with plain node.
//
// node e2e/support/coverage-summary.mjs [name=]path/to/coverage-summary.json...
// Without a name, a suite is named after the file's directory.
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.join(import.meta.dirname, '..', '..');
const metrics = ['lines', 'branches', 'functions', 'statements'];

const suites = process.argv.slice(2).map(arg => {
  const [name, file] = arg.includes('=') ? arg.split('=') : [undefined, arg];
  return { name: name ?? path.basename(path.dirname(file)), file };
});
if (suites.length === 0) {
  console.error('Usage: coverage-summary.mjs [name=]coverage-summary.json...');
  process.exit(2);
}

// Istanbul writes pct: 'Unknown' when a summary has no files.
const pct = metric =>
  typeof metric?.pct === 'number' ? `${metric.pct.toFixed(1)} %` : 'n/a';
const row = (label, entry) =>
  `| ${label} | ${metrics.map(key => pct(entry[key])).join(' | ')} |`;
const header = first => [
  `| ${first} | Lines | Branches | Functions | Statements |`,
  '|---|---:|---:|---:|---:|',
];

const lines = ['### Coverage', '', ...header('Suite')];
const details = [];
let missing = false;
for (const { name, file } of suites) {
  let report;
  try {
    report = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!report.total) throw new Error('no total');
  } catch (error) {
    const reason = error.code === 'ENOENT' ? 'no report' : 'unreadable report';
    lines.push(`| ${name} | ${reason} | | | |`);
    console.log(
      `::error::coverage-summary: ${reason} at ${file}: ${error.message}`,
    );
    missing = true;
    continue;
  }
  const { total, ...files } = report;
  lines.push(row(name, total));
  details.push(
    '',
    `<details><summary>${name}: ${Object.keys(files).length} files</summary>`,
    '',
    ...header('File'),
    ...Object.entries(files)
      .map(([source, entry]) => [relative(source), entry])
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([source, entry]) => row(source, entry)),
    '',
    '</details>',
  );
}

const markdown = [...lines, ...details, ''].join('\n');
console.log(markdown);
if (process.env.GITHUB_STEP_SUMMARY)
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
// Fail on a missing report: otherwise a wrong path in ci.yml would only ever show as a "no report" row.
if (missing) process.exit(1);

/** Vitest keys files by absolute path, coverage-report.mjs by repo-relative path. */
function relative(source) {
  if (!path.isAbsolute(source)) return source;
  const fromRoot = path.relative(repoRoot, source);
  return fromRoot.startsWith('..')
    ? source
    : fromRoot.split(path.sep).join('/');
}
