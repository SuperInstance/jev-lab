// E2b -- the ATOMIC version, after E2 failed.
//
// E2 asked Jev a compound, open question: "does the proposed result
// satisfy 5.5 exactly?" (a result object with four fields). It answered
// NO to the CORRECT result (0.217) and NO to the misreading (0.176) -- it
// separated the two but in the WRONG PLACE, and the absolute level was
// useless.
//
// E1, which asked a FORCED CHOICE between two named readings, got 9/9 at
// P=0.904.
//
// Hypothesis: the difference is ATOMICITY, not the subject. The house's
// own rule is "the judge reads text; it does not do logic" -- and "does
// this four-field object satisfy the spec" is logic. "Is this one record
// in the orphans list" is a reading.
//
// So: derive the spec's requirement for ONE FIELD AT A TIME, forced yes/no,
// with NO candidate result in the state (leaking the answer would make the
// question trivial). Then compare the derived requirement to the candidate.
//
// This is also the shape a real spec-conformance judge would need: a
// per-field requirement, each independently witnessed.

import { jevSync, noul } from '../src/jev.mjs';
import { summarise, verdict } from '../src/measure.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const SPEC = readFileSync('/tmp/SPEC.md', 'utf8');
const sec55 = SPEC.slice(SPEC.indexOf('5.5 Orphans'), SPEC.indexOf('### 5.6'));
const cases = JSON.parse(readFileSync('/tmp/family/gitpp-fold-conformance/cases.json', 'utf8')).cases;
const d12 = cases.find((c) => c.name === 'd12-orphan-descendant-not-auto-orphaned');

const state = { spec_section_5_5: sec55, records: d12.records };
const REPEATS = 7;

const questions = {
  // ATOMIC. One record, one list, one yes/no.
  child_is_orphan: noul('According to spec section 5.5, does the record with id "child" belong in the orphans list?',
    { true: 'Section 5.5 puts "child" in the orphans list.',
      false: 'Section 5.5 does not put "child" in the orphans list.' }),
  // ATOMIC. One key, one yes/no.
  child_effect_applies: noul('According to spec section 5.5, does the effect z=7 of the record with id "child" belong in the resulting state?',
    { true: 'Section 5.5 puts z=7 in the state.',
      false: 'Section 5.5 does not put z=7 in the state.' }),
  // ATOMIC. Control: the orphan's OWN effect, which the spec excludes.
  orphan_effect_applies: noul('According to spec section 5.5, does the effect y=99 of the record with id "orph" belong in the resulting state?',
    { true: 'Section 5.5 puts y=99 in the state.',
      false: 'Section 5.5 does not put y=99 in the state.' }),
  // ATOMIC. Control: the orphan IS reported, which the spec requires.
  orphan_is_reported: noul('According to spec section 5.5, does the record with id "orph" belong in the orphans list?',
    { true: 'Section 5.5 puts "orph" in the orphans list.',
      false: 'Section 5.5 does not put "orph" in the orphans list.' }),
};

const runs = [];
for (let i = 0; i < REPEATS; i++) {
  const r = jevSync(state, questions);
  if (r.error) { console.log('  transport:', JSON.stringify(r.error).slice(0, 100)); continue; }
  runs.push(r.answers);
}
const S = {};
for (const k of Object.keys(questions)) S[k] = summarise(runs.map(r => r[k]?.noul));
for (const [k, s] of Object.entries(S)) console.log(`  ${k.padEnd(22)} mean=${s.mean.toFixed(4)} spread=${s.spread.toFixed(4)} verdict=${verdict(s.last, 0.5)}`);

console.log('  ---');
// The spec's reading: child NOT an orphan, child's effect DOES apply,
// the orphan's effect does NOT apply, the orphan IS reported.
const derived = {
  child_is_orphan: S.child_is_orphan.last < 0.5,
  child_effect_applies: S.child_effect_applies.last > 0.5,
  orphan_effect_applies: S.orphan_effect_applies.last < 0.5,
  orphan_is_reported: S.orphan_is_reported.last > 0.5,
};
console.log('  JEV-derived requirements:', JSON.stringify(derived));
const houseExpectation = { child_is_orphan: false, child_effect_applies: true, orphan_effect_applies: false, orphan_is_reported: true };
const agree = Object.keys(derived).every((k) => derived[k] === houseExpectation[k]);
console.log('  agrees with the spec on all four fields:', agree ? 'YES' : 'NO');
// And the brief's reading, which is what a shared misreading would produce:
const brief = { child_is_orphan: true, child_effect_applies: false, orphan_effect_applies: false, orphan_is_reported: true };
const wouldMisread = Object.keys(derived).every((k) => derived[k] === brief[k]);
console.log('  would have adopted the BRIEF\'s misreading:', wouldMisread ? 'YES (BAD)' : 'NO (good)');

writeFileSync(new URL('../data/e2b-atomic.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), case: d12.name, repeats: REPEATS, scores: S, derived, houseExpectation, agree, wouldMisread }, null, 2));
console.log('  -> data/e2b-atomic.json');
