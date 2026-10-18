// E5 -- which result actually survives the control?
//
// E4 established: with two options that are RESULTS (no explanation),
// Jev picked the WRONG one for d12 in BOTH orderings -- 0/9 either way.
// And with two INDISTINGUISHABLE options it picked the FIRST, 9/9.
//
// That last fact retro-actively kills E1b's "BARE" arm, which scored 9/9
// with empty option descriptions. Empty options cannot be read; picking
// one of them correctly is not a reading, it is a position preference.
// E1b was a measurement artefact and I am retracting it.
//
// What is left is E1, whose options each carried an EXPLANATION:
//
//   A: "orphans = ["orph"] and state = {"z": 7} -- the orphan is excluded
//       but the child of the orphan still folds, and the child is NOT
//       reported as an orphan."
//   B: "orphans = ["orph", "child"] and state = {} -- a record whose
//       ancestor is missing, even transitively, is itself an orphan, so
//       the child is excluded too."
//
// Those two differ in CONTENT, so the position control applies directly:
//// swap them. If Jev picks the CORRECT one in both orderings, the
// capability is real and its shape is precise:
//
//   JEV MATCHES PROSE TO PROSE.
//
// It does not adjudicate a rule. It decides which SENTENCE the spec
// supports. Give it two articulated readings and it will tell you which
// one the spec's own language supports -- which is a genuinely useful
// second reader for an ARTICULATED disagreement, and useless for a bare
// result.
//
// This experiment settles it: three arms, the two orderings of the
// explanatory options, plus the indistinguishable control.

import { jevSync, choice } from '../src/jev.mjs';
import { summarise } from '../src/measure.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const SPEC = readFileSync('/tmp/SPEC.md', 'utf8');
const sec55 = SPEC.slice(SPEC.indexOf('5.5 Orphans'), SPEC.indexOf('### 5.6'));
const cases = JSON.parse(readFileSync('/tmp/family/gitpp-fold-conformance/cases.json', 'utf8')).cases;
const d12 = cases.find((c) => c.name === 'd12-orphan-descendant-not-auto-orphaned');

const EXPLAIN_A = 'orphans = ["orph"] and state = {"z": 7} -- the orphan is excluded but the child of the orphan still folds, and the child is NOT reported as an orphan.';
const EXPLAIN_B = 'orphans = ["orph", "child"] and state = {} -- a record whose ancestor is missing, even transitively, is itself an orphan, so the child is excluded too.';
const state = { spec_section_5_5: sec55, records: d12.records };
const Q = 'According to spec section 5.5, which of these two results is correct for these records?';

const ARMS = [
  { label: 'explanatory, CORRECT at A', options: { A: EXPLAIN_A, B: EXPLAIN_B }, right: 'A' },
  { label: 'explanatory, CORRECT at B', options: { A: EXPLAIN_B, B: EXPLAIN_A }, right: 'B' },
  { label: 'CONTROL: indistinguishable', options: { A: 'x', B: 'x' }, right: 'A' },
];

const REPEATS = 9;
const out = [];
for (const arm of ARMS) {
  const picks = {}; const pFirst = [];
  for (let i = 0; i < REPEATS; i++) {
    const r = jevSync(state, { which: choice(Q, arm.options) });
    if (r.error) continue;
    const a = r.answers.which;
    picks[a.choice] = (picks[a.choice] || 0) + 1;
    pFirst.push(a.probabilities.A);
  }
  const s = summarise(pFirst);
  const rightCount = picks[arm.right] || 0;
  out.push({ label: arm.label, picks, pA: s, rightCount, n: s.n });
  console.log(`  ${arm.label.padEnd(30)} picks=${JSON.stringify(picks).padEnd(16)} P(A)=${s.mean.toFixed(3)} spread=${s.spread.toFixed(3)}  CORRECT picked ${rightCount}/${s.n}`);
}
console.log('  ---');
const [a, b, c] = out;
const both = a.rightCount >= 8 && b.rightCount >= 8;
console.log('  explanatory options: correct in BOTH orderings:', both ? 'YES -- the capability is real' : 'NO');
console.log('  indistinguishable control picked A', c.rightCount, '/', c.n, '-> the position floor is real');
writeFileSync(new URL('../data/e5-the-real-capability.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), repeats: REPEATS, arms: out, capabilitySurvives: both }, null, 2));
console.log('  -> data/e5-the-real-capability.json');
