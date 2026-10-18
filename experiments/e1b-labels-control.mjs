// E1b -- the DECISIVE CONTROL for E1.
//
// E1 got 9/9 at P=0.904 on the blind adjudication of the orphan rule. But
// the two choice LABELS carried the reasoning:
//
//   A: "the orphan is excluded but the child of the orphan still folds,
//       and the child is NOT reported as an orphan"
//   B: "a record whose ancestor is missing, even transitively, is itself
//       an orphan, so the child is excluded too"
//
// Those labels are not names. They are two articulated rules. So E1 may
// have measured "does Jev match a DESCRIBED rule" rather than "can Jev
// DERIVE a rule from the spec".
//
// E2b says the second thing is false: asked which single record belongs
// in the orphans list, Jev got it wrong (0.237) -- it adopted the
// transitive reading.
//
// If the labels are what made E1 work, then STRIPPING the reasoning from
// the labels (bare "A" / "B", and a version where the labels are
// symmetric) must collapse E1's accuracy.
//
// Three arms:
//   FULL      the labels as they were
//   BARE      "A" and "B" with no description at all
//   SYMMETRIC the reasoning present but the two options described so that
//              neither is more detailed than the other
//
// This is the difference between a capability and a measurement artefact.

import { jevSync, choice } from '../src/jev.mjs';
import { summarise } from '../src/measure.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const SPEC = readFileSync('/tmp/SPEC.md', 'utf8');
const sec55 = SPEC.slice(SPEC.indexOf('5.5 Orphans'), SPEC.indexOf('### 5.6'));
const cases = JSON.parse(readFileSync('/tmp/family/gitpp-fold-conformance/cases.json', 'utf8')).cases;
const d12 = cases.find((c) => c.name === 'd12-orphan-descendant-not-auto-orphaned');
const state = { spec_section_5_5: sec55, records: d12.records };

const ARMS = {
  FULL: {
    A: 'orphans = ["orph"] and state = {"z": 7} -- the orphan is excluded but the child of the orphan still folds, and the child is NOT reported as an orphan.',
    B: 'orphans = ["orph", "child"] and state = {} -- a record whose ancestor is missing, even transitively, is itself an orphan, so the child is excluded too.',
  },
  BARE: { A: '', B: '' },
  SYMMETRIC: {
    A: 'orphans = ["orph"] and state = {"z": 7}. The record named "child" is not in the orphans list and its effect z=7 is in the state.',
    B: 'orphans = ["orph", "child"] and state = {}. The record named "child" is in the orphans list and its effect z=7 is not in the state.',
  },
};

const REPEATS = 9;
const out = {};
for (const [arm, criteria] of Object.entries(ARMS)) {
  const picks = {}; const pA = [];
  for (let i = 0; i < REPEATS; i++) {
    const r = jevSync(state, { which: choice('According to spec section 5.5, which of these two results is correct for these records?', criteria) });
    if (r.error) { console.log('  transport:', JSON.stringify(r.error).slice(0, 90)); continue; }
    const a = r.answers.which;
    picks[a.choice] = (picks[a.choice] || 0) + 1;
    pA.push(a.probabilities.A);
  }
  const s = summarise(pA);
  out[arm] = { picks, pA: s, onSpec: (picks.A || 0) > (picks.B || 0) };
  console.log(`  ${arm.padEnd(10)} picks=${JSON.stringify(picks)}  P(A)=${s.mean.toFixed(4)} +/- ${s.spread.toFixed(4)}  -> ${out[arm].onSpec ? 'the SPEC' : 'THE BRIEF'}`);
}
console.log('  ---');
console.log('  FULL wins but BARE does not  => the labels did the work (E1 measured a DESCRIBED rule):',
  out.FULL.onSpec && !out.BARE.onSpec ? 'CONFIRMED' : 'not confirmed');
console.log('  SYMMETRIC result:', out.SYMMETRIC.onSpec ? 'the SPEC' : 'THE BRIEF');

writeFileSync(new URL('../data/e1b-labels-control.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), case: d12.name, repeats: REPEATS, arms: out }, null, 2));
console.log('  -> data/e1b-labels-control.json');
