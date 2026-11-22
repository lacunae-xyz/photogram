// npm run test:gate. Not *.test.mjs: the perf Playwright project would pick it up.
import assert from 'node:assert/strict';
import test from 'node:test';
import { abLimit, decide, decideRemeasured, median, needsRemeasure } from './gate.mjs';

test('median of odd and even counts, unsorted input left alone', () => {
  const values = [300, 100, 200];
  assert.equal(median(values), 200);
  assert.deepEqual(values, [300, 100, 200]);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});

test('A/B limit is base median × 1.2 + 50 ms', () => {
  assert.equal(abLimit(0), 50);
  assert.equal(abLimit(500), 650);
});

test('A/B passes at the limit and fails above it', () => {
  assert.deepEqual(decide({ pr: [640, 650, 900], base: [400, 500, 600], samples: 3 }), {
    mode: 'ab',
    prMedian: 650,
    baseMedian: 500,
    limit: 650,
    ok: true,
  });
  assert.equal(decide({ pr: [651, 651, 0], base: [400, 500, 600], samples: 3 }).ok, false);
});

test('A/B ignores the absolute budget', () => {
  assert.equal(decide({ pr: [900, 900, 900], base: [800, 800, 800], budget: 100, samples: 3 }).ok, true);
  assert.equal(decide({ pr: [60, 60, 60], base: [0, 0, 0], budget: 1000, samples: 3 }).ok, false);
  assert.equal(decide({ pr: [60, 60, 60], base: [50, 50, 50], samples: 3 }).ok, true);
});

test('missing PR runs fail', () => {
  assert.equal(decide({ pr: [0, 0], base: [0, 0, 0], samples: 3 }).ok, false);
  assert.equal(decide({ pr: [], budget: 100, samples: 3 }).ok, false);
});

test('without a full base, falls back to the absolute budget', () => {
  assert.deepEqual(decide({ pr: [90, 100, 110], base: [0, 0], budget: 100, samples: 3 }), {
    mode: 'absolute',
    prMedian: 100,
    limit: 100,
    ok: true,
  });
  assert.equal(decide({ pr: [101, 101, 101], budget: 100, samples: 3 }).ok, false);
  assert.equal(decide({ pr: [0, 0, 0], samples: 3 }).ok, false);
});

test('an A/B failure is measured again, a pass is not', () => {
  assert.equal(needsRemeasure({ pr: [700, 700, 700], base: [500, 500, 500], samples: 3 }), true);
  assert.equal(needsRemeasure({ pr: [650, 650, 650], base: [500, 500, 500], samples: 3 }), false);
});

test('an absolute fallback or missing PR runs are not measured again', () => {
  assert.equal(needsRemeasure({ pr: [900, 900, 900], base: [0, 0], budget: 100, samples: 3 }), false);
  assert.equal(needsRemeasure({ pr: [900, 900, 900], budget: 100, samples: 3 }), false);
  assert.equal(needsRemeasure({ pr: [900, 900], base: [0, 0, 0], samples: 3 }), false);
});

test('fails then passes: the second measure decides, the first is kept for the log', () => {
  assert.deepEqual(
    decideRemeasured({
      first: { pr: [700, 700, 700], base: [500, 500, 500] },
      second: { pr: [600, 600, 600], base: [500, 500, 500] },
      samples: 3,
    }),
    {
      mode: 'ab',
      prMedian: 600,
      baseMedian: 500,
      limit: 650,
      ok: true,
      first: { mode: 'ab', prMedian: 700, baseMedian: 500, limit: 650, ok: false },
    },
  );
});

test('fails twice: fails', () => {
  const result = decideRemeasured({
    first: { pr: [700, 700, 700], base: [500, 500, 500] },
    second: { pr: [651, 700, 800], base: [400, 500, 600] },
    samples: 3,
  });
  assert.equal(result.ok, false);
  assert.equal(result.first.ok, false);
});

test('A/B LayoutCount: the PR median against the budget, one run over it passes', () => {
  assert.equal(decide({ pr: [161, 185, 170], budget: 180, samples: 3 }).ok, true);
  assert.equal(decide({ pr: [181, 185, 170], budget: 180, samples: 3 }).ok, false);
});
