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

/**
 * A/B mode: a scenario that fails on all its PR runs is measured again, once, and the new runs alone decide it.
 * Runner noise fails a good PR now and then; a regression fails both measures. An absolute fallback isn't measured
 * again (its budget is a ceiling with margin), nor a scenario missing PR runs (the run failed, not the measure).
 */
export function needsRemeasure({ pr, base, budget, samples }) {
  const result = decide({ pr, base, budget, samples });
  return result.mode === 'ab' && pr.length === samples && !result.ok;
}

/** The decision for a measured-again scenario: the second measure's, with the first kept for the log. */
export function decideRemeasured({ first, second, budget, samples }) {
  return { ...decide({ ...second, budget, samples }), first: decide({ ...first, budget, samples }) };
}
