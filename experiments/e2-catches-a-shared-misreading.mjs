// E2 -- can Jev CATCH A SHARED MISREADING?
//
// This is the headline experiment. Every harness in the fleet that compares
// implementations to each other is blind to a shared misreading: if all
// five ports get the rule wrong the same way, they agree perfectly and the
// fold suite reports 29/29.
//
// A judge that reads the SPEC can see it. So:
//
//   Given the spec text, the records, and a PROPOSED result, does the
//   proposed result satisfy the spec?
//
// Three proposals for d12, each with a known truth:
//
//   CORRECT   orphans=["orph"], state={"z":7}         the spec's reading
//   MISREAD   orphans=["orph","child"], state={}      the BRIEF's reading
//   DROPPED   orphans=[], state={"z":7}               a third wrong way:
//                                                       the orphan VANISHED
//
// The DROPPED case is the control. A judge that says "no" to anything
// unfamiliar is not a judge, and the DROPPED proposal is wrong in a
// DIFFERENT direction, so it separates "detects the misreading" from
// "detects any unfamiliar shape".

import { jevSync, noul } from '../src/jev.mjs';
import { summarise, verdict, NOISE_BAND } from '../src/measure.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const SPEC = readFileSync('/tmp/SPEC.md', 'utf8');
const sec55 = SPEC.slice(SPEC.indexOf('5.5 Orphans'), SPEC.indexOf('### 5.6'));
const cases = JSON.parse(readFileSync('/tmp/family/gitpp-fold-conformance/cases.json', 'utf8')).cases;
const d12 = cases.find((c) => c.name === 'd12-orphan-descendant-not-auto-orphaned');

const proposals = [
  { name: 'CORRECT', truth: 'YES', result: { state: { z: 7 }, order: ['child'], conflicts: [], orphans: ['orph'] } },
  { name: 'MISREAD', truth: 'NO',  result: { state: {}, order: [], conflicts: [], orphans: ['orph', 'child'] } },
  { name: 'DROPPED', truth: 'NO',  result: { state: { z: 7 }, order: ['child'], conflicts: [], orphans: [] } },
];

const REPEATS = 7;
const out = {};
for (const p of proposals) {
  const state = {
    spec_section_5_5: sec55,
    records: d12.records,
    proposed_result: p.result,
  };
  const samples = [];
  for (let i = 0; i < REPEATS; i++) {
    const r = jevSync(state, {
      ok: noul('Does the proposed result satisfy spec section 5.5 exactly?',
        { true: 'The proposed result is what section 5.5 requires for these records.',
          false: 'The proposed result violates section 5.5 for these records.' }),
    });
    if (r.error) continue;
    samples.push(r.answers.ok.noul);
  }
  const s = summarise(samples);
  const v = verdict(s.last, 0.5);
  out[p.name] = { truth: p.truth, ...s, verdict: v };
  console.log(`  ${p.name.padEnd(8)} truth=${p.truth.padEnd(3)} mean=${s.mean.toFixed(4)} spread=${s.spread.toFixed(4)} verdict=${v}`);
}
const correct = out.CORRECT, mis = out.MISREAD, drop = out.DROPPED;
console.log('  ---');
console.log('  detects the MISREADING (CORRECT high, MISREAD low):', (correct.mean > 0.7 && mis.mean < 0.3) ? 'YES' : 'NO');
console.log('  detects a DIFFERENT wrongness too (DROPPED low):', drop.mean < 0.3 ? 'YES' : 'NO');
console.log('  separation CORRECT - MISREAD:', (correct.mean - mis.mean).toFixed(4));

writeFileSync(new URL('../data/e2-catches-a-shared-misreading.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), case: d12.name, repeats: REPEATS, results: out }, null, 2));
console.log('  -> data/e2-catches-a-shared-misreading.json');
