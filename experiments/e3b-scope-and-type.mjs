// E3b -- WHY did d12 and d25 miss, and are the causes the same?
//
// d12 (the orphan-descendant rule): scored 9/9 in E1/E1b, where the
//   state was SPEC 5.5 ALONE. Scored 1/5 here, where the state was the
//   WHOLE 29,861-byte spec. Same records, same options, same question.
//   The only thing that changed is the SCOPE of the state.
//   Hypothesis: the whole spec DILUTES the relevant section -- there is
//   other prose in there that a text reader has to reconcile, and the
//   section that actually governs d12 stops dominating.
//
// d25 (numeric-string-vs-number): the distractor is a TYPE difference --
//   "5" versus 5. No text-reading judge can see that; both are the
//   characters 5. Hypothesis: this is not a scoping failure at all, it is
//   a CATEGORY error -- the question is unanswerable in prose, and it
//   belongs to the byte-level harness, not to a reader.
//
// If the two causes are different, the actionable rule is precise:
//   * scope the state to the governing section
//   * and never send a type question to a text reader
//
// If they are the SAME cause, the rule is blunt and I should say so.

import { jevSync, choice } from '../src/jev.mjs';
import { summarise } from '../src/measure.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const SPEC = readFileSync('/tmp/SPEC.md', 'utf8');
const sec55 = SPEC.slice(SPEC.indexOf('5.5 Orphans'), SPEC.indexOf('### 5.6'));
const cases = JSON.parse(readFileSync('/tmp/family/gitpp-fold-conformance/cases.json', 'utf8')).cases;
const byName = Object.fromEntries(cases.map((c) => [c.name, c]));

function distractor(exp) {
  const d = JSON.parse(JSON.stringify(exp));
  const k = Object.keys(d.state || {});
  if (k.length) { delete d.state[k[k.length - 1]]; return d; }
  if ((d.orphans || []).length) { d.orphans = []; return d; }
  if ((d.order || []).length) { d.order = d.order.slice(0, -1); return d; }
  if ((d.conflicts || []).length) { d.conflicts = []; return d; }
  d.state = { __injected__: 1 }; return d;
}

const REPEATS = 9;
const d12 = byName['d12-orphan-descendant-not-auto-orphaned'];
const d25 = byName['d25-numeric-string-vs-number'];
console.log('  d25 expected:', JSON.stringify(d25.expect), '| distractor:', JSON.stringify(distractor(d25.expect)));

const arms = [
  { case: d12, state: { spec: SPEC, records: d12.records }, label: 'd12  WHOLE spec' },
  { case: d12, state: { spec_section_5_5: sec55, records: d12.records }, label: 'd12  scoped 5.5' },
  { case: d25, state: { spec: SPEC, records: d25.records }, label: 'd25  WHOLE spec' },
  { case: d25, state: { spec_section_5_5: sec55, records: d25.records }, label: 'd25  scoped 5.5' },
  { case: d25, state: { records: d25.records, note: 'The record model is JSON. A value is either a JSON number or a JSON string; the two are different values and the specification distinguishes them.' }, label: 'd25  type rule stated' },
];

const out = {};
for (const arm of arms) {
  const A = arm.case.expect, B = distractor(arm.case.expect);
  const picks = {}; const pA = [];
  for (let i = 0; i < REPEATS; i++) {
    const r = jevSync(arm.state, { which: choice('According to the specification, which of these two results is correct for these records?', { A: JSON.stringify(A), B: JSON.stringify(B) }) });
    if (r.error) continue;
    const a = r.answers.which;
    picks[a.choice] = (picks[a.choice] || 0) + 1;
    pA.push(a.probabilities.A);
  }
  const s = summarise(pA);
  const hit = (picks.A || 0) > (picks.B || 0);
  out[arm.label] = { picks, pA: s, correct: hit };
  console.log(`  ${arm.label.padEnd(22)} ${hit ? 'HIT ' : 'MISS'} P(A)=${s.mean.toFixed(3)} spread=${s.spread.toFixed(3)} picks=${JSON.stringify(picks)}`);
}
writeFileSync(new URL('../data/e3b-scope-and-type.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), repeats: REPEATS, arms: out }, null, 2));
console.log('  -> data/e3b-scope-and-type.json');
