// E3 -- does the SELECTION ability generalise across the whole corpus?
//
// E1/E1b measured it on ONE rule (the orphan rule) and got 9/9 three ways,
// including with bare labels. E2b measured DERIVATION on the same rule and
// got 2 of 4 fields wrong.
//
// The candidate capability is therefore:
//
//   JEV can SELECT between articulated alternatives. It cannot DERIVE a
//   property from a spec.
//
// If that is the capability, it must hold across the corpus, not on one
// cherry-picked case. So: every one of the fold suite's 29 cases, each
// with a MECHANICAL distractor (no hand-picked cases, no cherry-picking),
// scored against the fold suite's own expected output.
//
// The denominator is 29 and the ground truth is the fleet's own. If JEV
// selects the expected result 29/29, it is a usable second reader of an
// ARTICULATED disagreement. If it is near chance, E1 was a fluke of one
// rule.

import { jevSync, choice } from '../src/jev.mjs';
import { summarise } from '../src/measure.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const SPEC = readFileSync('/tmp/SPEC.md', 'utf8');
const cases = JSON.parse(readFileSync('/tmp/family/gitpp-fold-conformance/cases.json', 'utf8')).cases;

// Mechanical distractor, applied uniformly. No case is cherry-picked.
function distractor(exp) {
  const d = JSON.parse(JSON.stringify(exp));
  const stateKeys = Object.keys(d.state || {});
  if (stateKeys.length) { delete d.state[stateKeys[stateKeys.length - 1]]; return d; }
  if ((d.orphans || []).length) { d.orphans = []; return d; }
  if ((d.order || []).length) { d.order = d.order.slice(0, -1); return d; }
  if ((d.conflicts || []).length) { d.conflicts = []; return d; }
  d.state = { __injected__: 1 }; return d;
}

const REPEATS = 5;
const results = [];
let correct = 0, transportFail = 0;

for (const c of cases) {
  // The state carries the SPEC and the RECORDS. It does NOT carry the
  // expected output -- that would make the question trivial.
  const state = { spec: SPEC, records: c.records };
  const A = c.expect, B = distractor(c.expect);
  const picks = {}; const pA = [];
  for (let i = 0; i < REPEATS; i++) {
    const r = jevSync(state, {
      which: choice('According to the specification, which of these two results is correct for these records?',
        { A: JSON.stringify(A), B: JSON.stringify(B) }),
    });
    if (r.error) { transportFail++; continue; }
    const a = r.answers.which;
    picks[a.choice] = (picks[a.choice] || 0) + 1;
    pA.push(a.probabilities.A);
  }
  const s = summarise(pA);
  const hit = (picks.A || 0) > (picks.B || 0);
  if (hit) correct++;
  results.push({ name: c.name, picks, pA: s.mean, spread: s.spread, correct: hit, n: s.n });
  console.log(`  ${hit ? 'HIT ' : 'MISS'} ${c.name.padEnd(42)} P(A)=${s.mean.toFixed(3)} spread=${s.spread.toFixed(3)} picks=${JSON.stringify(picks)}`);
}

console.log('  ---');
console.log(`  ${correct}/${cases.length} cases selected the expected result  (transport failures: ${transportFail})`);
const scored = results.filter((r) => r.n > 0);
const meanP = scored.reduce((a, r) => a + r.pA, 0) / (scored.length || 1);
const maxSpread = Math.max(...scored.map((r) => r.spread));
console.log(`  mean P(expected) = ${meanP.toFixed(4)}   max spread = ${maxSpread.toFixed(4)}`);

writeFileSync(new URL('../data/e3-29-case-sweep.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), repeats: REPEATS, correct, total: cases.length, meanP, maxSpread, results }, null, 2));
console.log('  -> data/e3-29-case-sweep.json');
