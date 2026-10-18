// E3d -- is it the QUESTION, not the state?
//
// Four arms for d12. Same records, same spec text, same options, same
// ground truth. Two variables: the SCOPE of the state, and whether the
// QUESTION names the governing section.
//
//   E1      state = 5.5 only,  question says "spec section 5.5"   -> 9/9, P=0.904
//   E1b     state = 5.5 only,  question says "spec section 5.5"   -> 9/9, P=0.808
//            (BARE arm: empty option descriptions)
//   E3b     state = 5.5 only,  question says "the specification" -> 0/9, P=0.202
//   E3      state = whole spec, question says "the specification" -> 1/5, P=0.436
//
// The two arms that failed (E3b, E3) differ from the two that worked
// (E1, E1b) in ONE thing: the question says "the specification" instead
// of "section 5.5". The state scope alone did not explain it -- E3b had
// the scoped state and still failed.
//
// Hypothesis: naming the governing section in the QUESTION is what makes
// the reader apply the right rule. "The specification" is a 29,861-byte
// haystack; "section 5.5" is a rule.
//
// This matters beyond d12: it is the difference between asking a reader
// "is this right?" and asking "is this right BY SECTION 5.5?", and it is
// cheap.

import { jevSync, choice } from '../src/jev.mjs';
import { summarise } from '../src/measure.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const SPEC = readFileSync('/tmp/SPEC.md', 'utf8');
const sec55 = SPEC.slice(SPEC.indexOf('5.5 Orphans'), SPEC.indexOf('### 5.6'));
const cases = JSON.parse(readFileSync('/tmp/family/gitpp-fold-conformance/cases.json', 'utf8')).cases;
const d12 = cases.find((c) => c.name === 'd12-orphan-descendant-not-auto-orphaned');

const prose = (r) => `state = ${JSON.stringify(r.state ?? {})}; order = ${JSON.stringify(r.order ?? [])}; conflicts = ${JSON.stringify(r.conflicts ?? [])}; orphans = ${JSON.stringify(r.orphans ?? [])}`;
const A = d12.expect, B = { state: {}, order: [], conflicts: [], orphans: ['orph', 'child'] };

const ARMS = [
  { label: 'scoped state + section-named question', state: { spec_section_5_5: sec55, records: d12.records }, q: 'According to spec section 5.5, which of these two results is correct for these records?' },
  { label: 'WHOLE state  + section-named question', state: { spec: SPEC, records: d12.records }, q: 'According to spec section 5.5, which of these two results is correct for these records?' },
  { label: 'scoped state + generic question      ', state: { spec_section_5_5: sec55, records: d12.records }, q: 'According to the specification, which of these two results is correct for these records?' },
  { label: 'WHOLE state  + generic question      ', state: { spec: SPEC, records: d12.records }, q: 'According to the specification, which of these two results is correct for these records?' },
];

const REPEATS = 9;
const out = {};
for (const arm of ARMS) {
  const picks = {}; const pA = [];
  for (let i = 0; i < REPEATS; i++) {
    const r = jevSync(arm.state, { which: choice(arm.q, { A: prose(A), B: prose(B) }) });
    if (r.error) continue;
    const a = r.answers.which;
    picks[a.choice] = (picks[a.choice] || 0) + 1;
    pA.push(a.probabilities.A);
  }
  const s = summarise(pA);
  const hit = (picks.A || 0) > (picks.B || 0);
  out[arm.label] = { picks, pA: s, correct: hit };
  console.log(`  ${arm.label}  ${hit ? 'HIT ' : 'MISS'} P(A)=${s.mean.toFixed(3)} spread=${s.spread.toFixed(3)} picks=${JSON.stringify(picks)}`);
}
writeFileSync(new URL('../data/e3d-question-specificity.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), repeats: REPEATS, arms: out }, null, 2));
console.log('  -> data/e3d-question-specificity.json');
