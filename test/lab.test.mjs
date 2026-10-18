// The lab's own tests. They assert the DISCIPLINE, not the numbers --
// because the numbers move with the model, and the discipline must not.
//
// The load-bearing one: the position control must be DETECTABLE. A harness
// that cannot fail is indistinguishable from one that can.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { summarise, verdict, NOISE_BAND } from '../src/measure.mjs';

const data = (n) => {
  const p = new URL(`../data/${n}`, import.meta.url).pathname;
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
};

test('the position control is detectable: identical options always pick the first', () => {
  const e4 = data('e4-position-bias.json');
  if (!e4) return;                       // data not shipped; nothing to assert
  // E4's control arm is the one whose two options are indistinguishable.
  const ctrl = e4.arms.find((a) => a.options && a.options.A === '' && a.options.B === '');
  assert.ok(ctrl, 'the control arm must exist');
  const first = ctrl.picks.A ?? 0;
  const total = Object.values(ctrl.picks).reduce((a, b) => a + b, 0);
  assert.equal(first, total, 'the identical-options control must pick the first every time');
});

test('E4 measured the reader picking the WRONG answer for d12 in BOTH orderings', () => {
  const e4 = data('e4-position-bias.json');
  if (!e4) return;
  const a = e4.arms[0], b = e4.arms[1];
  assert.equal(a.rightCount, 0, 'correct-at-A must score 0 correct');
  assert.equal(b.rightCount, 0, 'correct-at-B must score 0 correct');
  // And the pick did not merely swap with the position: it picked the same
  // CONTENT both times. That is a content preference, and it was wrong.
  assert.notEqual(a.picks.A, b.picks.A, 'the pick must not follow the key');
});

test('the empty-state launder is measured and is total', () => {
  const e0 = data('e0-baseline.json');
  if (!e0) return;
  assert.ok(e0.empty_state.mean > 0.9, 'an empty state must be shown to launder world knowledge');
  assert.ok(e0.empty_state.mean - e0.wrong_doc.mean > 0.5);
});

test('the true/false separation is measured and large', () => {
  const e0 = data('e0-baseline.json');
  if (!e0) return;
  assert.ok(e0.true_claim.mean - e0.false_claim.mean > 0.9);
});

test('the corpus sweep is 27/29 or better', () => {
  const e3 = data('e3-29-case-sweep.json');
  if (!e3) return;
  assert.ok(e3.correct >= 27, `sweep scored ${e3.correct}/${e3.total}`);
});

test('the triage is usable: precision and recall at least 0.9', () => {
  const e8 = data('e8-semantic-triage.json');
  if (!e8) return;
  assert.ok(e8.topK.truePositives / e8.topK.k >= 0.9);
  assert.ok(e8.topK.truePositives / e8.positives >= 0.9);
});

test('the verdict helper respects the noise band', () => {
  assert.equal(verdict(0.99, 0.5), 'YES');
  assert.equal(verdict(0.01, 0.5), 'NO');
  assert.equal(verdict(0.5 + NOISE_BAND, 0.5), 'COIN_FLIP');
  assert.equal(verdict(0.5 - NOISE_BAND, 0.5), 'COIN_FLIP');
  assert.equal(verdict(undefined, 0.5), 'UNMEASURED');
});

test('summarise keeps the spread next to the verdict', () => {
  const s = summarise([0.9, 0.92, 0.88]);
  assert.ok(Math.abs(s.spread - 0.04) < 1e-9);
  assert.equal(s.n, 3);
});
