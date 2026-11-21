// Turns the raw Chromium coverage that support/coverage.ts writes (coverage-raw/<project>/*.json) into one report per
// suite, mapped to src through the build's hidden source maps (vite build --sourcemap hidden).
// Sources a dependency ships with its own map (the design system's dist/*.js) are mapped one level further, to that
// package's src, when node_modules has the map: on CI that needs the root `npm ci`.
//
// node support/coverage-report.mjs [--raw coverage-raw] [--dist ../dist] [--out ../coverage/e2e] [--all ../src]
//                          [--suite name=project[:specRegex]]...
// Without --suite: one suite per project directory in --raw.
import fs from 'node:fs';
import path from 'node:path';
import remapping from '@jridgewell/remapping';
import { CoverageReport } from 'monocart-coverage-reports';

const e2eDir = path.join(import.meta.dirname, '..');
const repoRoot = path.join(e2eDir, '..');

export async function report(argv = []) {
  const option = (name, fallback) => {
    const i = argv.indexOf(name);
    return i === -1 ? fallback : argv[i + 1];
  };
  const rawDir = path.resolve(e2eDir, option('--raw', 'coverage-raw'));
  const distDir = path.resolve(e2eDir, option('--dist', '../dist'));
  const outDir = path.resolve(e2eDir, option('--out', '../coverage/e2e'));
  const allDir = path.resolve(e2eDir, option('--all', '../src'));
  const suites = argv
    .flatMap((arg, i) => (arg === '--suite' ? [argv[i + 1]] : []))
    .map(value => {
      const [name, rest] = value.split('=');
      const [project, spec] = rest.split(':');
      return { name, project, spec: spec ? new RegExp(spec) : undefined };
    });
  if (suites.length === 0 && fs.existsSync(rawDir)) {
    for (const project of fs.readdirSync(rawDir))
      suites.push({ name: project, project });
  }

  const results = {};
  for (const suite of suites) {
    // Per suite: monocart changes the source map objects it's given, a second suite sharing them gets nothing.
    const maps = new Map();
    const dir = path.join(rawDir, suite.project);
    if (!fs.existsSync(dir)) continue;
    const mcr = new CoverageReport({
      name: `${path.basename(repoRoot)} ${suite.name}`,
      outputDir: path.join(outDir, suite.name),
      baseDir: repoRoot,
      logging: 'error',
      cleanCache: true,
      reports: [['v8'], ['json-summary'], ['lcovonly']],
      // Map sources are absolute paths (loadMap): report them relative to the repo, then keep only our own.
      sourcePath: (filePath, info) =>
        info?.url?.startsWith('/') ? relativeSource(info.url) : filePath,
      outputFilter: entry => isOwn(entry.sourcePath),
      all: {
        dir: [allDir],
        filter: {
          '**/*.test.*': false,
          '**/setupTests.*': false,
          '**/*.d.ts': false,
          '**/*.{ts,js}': true,
        },
      },
    });
    let tests = 0;
    for (const file of fs.readdirSync(dir).sort()) {
      const { spec, entries } = JSON.parse(
        fs.readFileSync(path.join(dir, file), 'utf8'),
      );
      if (suite.spec && !suite.spec.test(spec)) continue;
      tests++;
      // One add per page: the same script twice in one batch wouldn't merge.
      const batches = [];
      for (const entry of entries) {
        const sourceMap = loadMap(maps, distDir, entry.url);
        if (sourceMap) entry.sourceMap = sourceMap;
        const batch = batches.find(
          each => !each.some(other => other.url === entry.url),
        );
        if (batch) batch.push(entry);
        else batches.push([entry]);
      }
      for (const batch of batches) await mcr.add(batch);
    }
    await mcr.generate();
    // Istanbul's line/branch/function counts, as Vitest's coverage-summary.json has them.
    const summary = JSON.parse(
      fs.readFileSync(
        path.join(outDir, suite.name, 'coverage-summary.json'),
        'utf8',
      ),
    ).total;
    results[suite.name] = { tests, summary };
  }
  return results;
}

/** src/… of this repo, and the design system's src/ (or dist/ when its map isn't there). */
function isOwn(sourcePath) {
  return /^(src|design-system)\/.+\.[jt]s$/.test(sourcePath);
}

function loadMap(maps, distDir, url) {
  if (maps.has(url)) return maps.get(url);
  const file = path.join(distDir, new URL(url).pathname);
  let map = null;
  if (fs.existsSync(`${file}.map`)) {
    const raw = absoluteSources(
      JSON.parse(fs.readFileSync(`${file}.map`, 'utf8')),
      path.dirname(file),
    );
    map = remapping(raw, source => {
      if (
        !/\/node_modules\/.+\.js$/.test(source) ||
        !fs.existsSync(`${source}.map`)
      )
        return null;
      return absoluteSources(
        JSON.parse(fs.readFileSync(`${source}.map`, 'utf8')),
        path.dirname(source),
      );
    });
  }
  maps.set(url, map);
  return map;
}

function absoluteSources(map, dir) {
  return {
    ...map,
    sourceRoot: undefined,
    sources: map.sources.map(source =>
      path.resolve(dir, map.sourceRoot ?? '', source),
    ),
  };
}

function relativeSource(source) {
  const relative = path.relative(repoRoot, source).split(path.sep).join('/');
  return relative.replace(
    /^node_modules\/@lacunae-xyz\/photogram-design-system\//,
    'design-system/',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const results = await report(process.argv.slice(2));
  for (const [name, { tests, summary }] of Object.entries(results)) {
    const pct = key => (summary?.[key]?.pct ?? 0).toFixed(1);
    console.log(
      `${name}: ${tests} tests, lines ${pct('lines')}%, branches ${pct('branches')}%, functions ${pct('functions')}%`,
    );
  }
}
