// The perf gate's decision, kept apart from the Playwright runs so it can be unit-tested (gate-test.mjs).

/** A/B mode: the PR's median total blocking time may exceed the base's by 20 %, plus 50 ms for a stray long task. */
export const abRatio = 1.2;
export const abSlackMs = 50;

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function abLimit(baseMedian) {
  return baseMedian * abRatio + abSlackMs;
}

/**
 * Decides one scenario from its total blocking time runs.
 * With base runs: A/B against the base median. Without (absolute mode, or the base didn't record the scenario):
 * the absolute budget from budgets.json. Fails if the PR side has fewer runs than expected or no limit applies.
 */
export function decide({ pr, base, budget, samples }) {
  const prMedian = pr.length ? median(pr) : NaN;
  if (base?.length === samples) {
    const baseMedian = median(base);
    const limit = abLimit(baseMedian);
    return { mode: 'ab', prMedian, baseMedian, limit, ok: pr.length === samples && prMedian <= limit };
  }
  return { mode: 'absolute', prMedian, limit: budget, ok: pr.length === samples && budget !== undefined && prMedian <= budget };
}
