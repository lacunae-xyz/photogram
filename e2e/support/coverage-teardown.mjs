// PW_COVERAGE: one report per project that collected coverage, in ../coverage/e2e/<project>/.
// PW_COVERAGE_ARGS: extra coverage-report.mjs arguments, e.g. "--dist ../dist-gallery".
export default async function globalTeardown() {
  if (!process.env.PW_COVERAGE) return;
  const started = Date.now();
  // Loaded only here: a run without coverage doesn't need monocart.
  const { report } = await import('./coverage-report.mjs');
  const results = await report(
    process.env.PW_COVERAGE_ARGS?.split(' ').filter(Boolean) ?? [],
  );
  for (const [name, { tests, summary }] of Object.entries(results)) {
    const pct = key => (summary?.[key]?.pct ?? 0).toFixed(1);
    console.log(
      `coverage ${name}: ${tests} tests, lines ${pct('lines')}%, branches ${pct('branches')}%, functions ${pct('functions')}%`,
    );
  }
  console.log(`coverage reports: ${Date.now() - started} ms`);
}
