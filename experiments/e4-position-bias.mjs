// E4 -- THE CONTROL THAT MATTERS: does the pick follow the CONTENT or the
// POSITION?
//
// Something is wrong. E1 scored 9/9 at P=0.904 on the orphan rule. E1b's
// "BARE" arm -- with EMPTY option descriptions, where the two options were
// indistinguishable TEXTUALLY -- ALSO scored 9/9 at P=0.808. A reader that
// cannot see a difference between two options cannot pick correctly
// between them 9 times out of 9. That is the signature of POSITION BIAS:
// the first option wins.
//
// And the research says this is real: a 2026 study of 541,000 judgements
// across 21 judges measured position bias >0.10 in two production judges.
//
// So every result so far may be an artefact of "A" being first. The test
// is trivial and decisive: run the SAME question with the options
// SWAPPED. If the pick follows the content, it flips to the other letter
// and stays with the right ANSWER. If the pick follows the position, it
// stays on "A" and is now wrong.
//
// This is the difference between a capability and a measurement artefact,
// and it is the same control the house already applies everywhere: never
// believe a number that cannot fail.

import { jevSync, choice } from '../src/jev.mjs';
import { summarise } from '../src/measure.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const SPEC = readFileSync('/tmp/SPEC.md', 'utf8');
const sec55 = SPEC.slice(SPEC.indexOf('5.5 Orphans'), SPEC.indexOf('### 5.6'));
const cases = JSON.parse(readFileSync('/tmp/family/gitpp-fold-conformance/cases.json', 'utf8')).cases;
const d12 = cases.find((c) => c.name === 'd12-orphan-descendant-not-auto-orphaned');

const prose = (r) => `state = ${JSON.stringify(r.state ?? {})}; order = ${JSON.stringify(r.order ?? [])}; conflicts = ${JSON.stringify(r.conflicts ?? [])}; orphans = ${JSON.stringify(r.orphans ?? [])}`;
const CORRECT = prose(d12.expect);
const WRONG = prose({ state: {}, order: [], conflicts: [], orphans: ['orph', 'child'] });
const state = { spec_section_5_5: sec55, records: d12.records };
const Q = 'According to spec section 5.5, which of these two results is correct for these records?';

const ARMS = [
  { label: 'CORRECT is option A', options: { A: CORRECT, B: WRONG }, right: 'A' },
  { label: 'CORRECT is option B', options: { A: WRONG, B: CORRECT }, right: 'B' },
  { label: 'BARE: A="" B=""   ', options: { A: '', B: '' }, right: 'A' },
  { label: 'BARE: A="" B=""   ', options: { A: '', B: '' }, right: 'A' },
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
  const firstCount = picks.A || 0;
  out.push({ ...arm, picks, pA: s, rightCount, firstCount });
  console.log(`  ${arm.label}  picks=${JSON.stringify(picks)}  P(A)=${s.mean.toFixed(3)}  picked-the-CORRECT-one ${rightCount}/${s.n}  picked-first ${firstCount}/${s.n}`);
}
console.log('  ---');
const a = out[0], b = out[1];
const followsContent = a.rightCount >= 7 && b.rightCount >= 7;
const followsPosition = a.firstCount >= 7 && b.firstCount >= 7;
console.log('  follows the CONTENT (picks the right answer either way):', followsContent ? 'YES' : 'NO');
console.log('  follows the POSITION (always picks A):', followsPosition ? 'YES -- the earlier results were an ARTEFACT' : 'NO');
const bare = out[2];
console.log('  BARE arm (indistinguishable options) picked A', bare.firstCount, '/', bare.n, '->', bare.firstCount >= 7 ? 'POSITION BIAS, not a reading' : 'not a position artefact');
writeFileSync(new URL('../data/e4-position-bias.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), repeats: REPEATS, arms: out, followsContent, followsPosition }, null, 2));
console.log('  -> data/e4-position-bias.json');
