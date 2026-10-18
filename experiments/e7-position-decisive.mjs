// E7 -- POSITION, DECISIVELY.
//
// The tool's first run reported UNRESOLVED, and in looking at why, a
// possible flaw appeared in my own earlier controls. E5 swapped WHICH
// CONTENT sat at which key. E7 below separates four things that were
// previously conflated:
//
//   1. which content is correct        (the ground truth)
//   2. which KEY the content sits at   (A or B)
//   3. the INSERTION ORDER of the keys  (does the reader see it?)
//   4. the CONTENT of the options
//
// Four arms, all with the same two contents (X = the spec's reading,
// Y = the brief's reading), all with insertion order A,B:
//
//   X at A   X at B   Y at A   Y at B
//
// If the pick tracks the KEY, the reader is key-biased. If it tracks the
// CONTENT, it is reading. If it tracks INSERTION ORDER, the key is
// irrelevant and the earlier "swap" was a no-op.
//
// Then two more arms with the content FIXED and the insertion order
// reversed, to see whether the reader sees order at all.
//
// And a control with three options, where a position bias becomes visible
// as a preference for a particular slot.

import { jevSync, choice } from '../src/jev.mjs';
import { summarise } from '../src/measure.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const SPEC = readFileSync('/tmp/SPEC.md', 'utf8');
const sec55 = SPEC.slice(SPEC.indexOf('5.5 Orphans'), SPEC.indexOf('### 5.6'));
const cases = JSON.parse(readFileSync('/tmp/family/gitpp-fold-conformance/cases.json', 'utf8')).cases;
const d12 = cases.find((c) => c.name === 'd12-orphan-descendant-not-auto-orphaned');
const prose = (r) => `state = ${JSON.stringify(r.state ?? {})}; order = ${JSON.stringify(r.order ?? [])}; conflicts = ${JSON.stringify(r.conflicts ?? [])}; orphans = ${JSON.stringify(r.orphans ?? [])}`;

const X = prose(d12.expect);                                              // the SPEC's reading (correct)
const Y = prose({ state: {}, order: [], conflicts: [], orphans: ['orph', 'child'] }); // the BRIEF's reading
const state = { spec_section_5_5: sec55, records: d12.records };
const Q = 'According to spec section 5.5, which of these two results is correct for these records?';

const ARMS = [
  { label: 'X at A, insertion A,B', opts: { A: X, B: Y }, correctKey: 'A' },
  { label: 'X at B, insertion A,B', opts: { A: Y, B: X }, correctKey: 'B' },
  { label: 'Y at A, insertion A,B', opts: { A: Y, B: X }, correctKey: 'B' },
  { label: 'Y at B, insertion A,B', opts: { A: X, B: Y }, correctKey: 'A' },
  { label: 'X at A, insertion B,A', opts: { B: Y, A: X }, correctKey: 'A' },
  { label: 'X at B, insertion B,A', opts: { B: X, A: Y }, correctKey: 'B' },
  { label: 'CONTROL: identical A,B  ', opts: { A: 'same', B: 'same' }, correctKey: null },
];

const REPEATS = 9;
const out = [];
for (const arm of ARMS) {
  const picks = {}; const probs = [];
  for (let i = 0; i < REPEATS; i++) {
    const r = jevSync(state, { which: choice(Q, arm.opts) });
    if (r.error) continue;
    const a = r.answers.which;
    picks[a.choice] = (picks[a.choice] || 0) + 1;
    probs.push(a.probabilities);
  }
  const top = Object.entries(picks).sort((a, b) => b[1] - a[1])[0];
  const pTop = summarise(probs.map((p) => p[top?.[0]] ?? 0));
  out.push({ label: arm.label, opts: Object.keys(arm.opts), picks, top: top?.[0], pTop: pTop.mean, spread: pTop.spread });
  console.log(`  ${arm.label.padEnd(26)} picks=${JSON.stringify(picks).padEnd(16)} top=${top?.[0]} P=${pTop.mean.toFixed(3)} spread=${pTop.spread.toFixed(3)}`);
}
console.log('  ---');
// Arms 1 and 3 are the SAME request (X at A vs Y at A are the two distinct
// requests). Compare arm1 (X at A) with arm2 (X at B): if the pick key
// changes with the content, it is CONTENT. If the pick key is the same in
// both, it is KEY or POSITION.
const armXatA = out[0], armXatB = out[1];
console.log('  X at A -> top', armXatA.top, '| X at B -> top', armXatB.top);
console.log('  the pick FOLLOWS THE CONTENT:', armXatA.top !== armXatB.top ? 'YES (a real reading)' : 'NO (key/position bias)');
const c1 = out[6];
console.log('  identical-options control -> top', c1.top, '| the position floor is:', c1.top ? `always "${c1.top}"` : 'n/a');
writeFileSync(new URL('../data/e7-position-decisive.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), repeats: REPEATS, arms: out }, null, 2));
console.log('  -> data/e7-position-decisive.json');
