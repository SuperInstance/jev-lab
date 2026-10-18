// E6 -- the fleet's ONE genuinely unclaimed idea, put to a second reader.
//
// A 2026 survey of the cutting edge concluded (and I am told to read it
// before writing more about the cell address):
//
//   "The 4D address is documented at algebra.md:129 and implemented zero
//    times. It is our only genuinely unclaimed idea, and it is currently
//    a sentence in a markdown file."
//
// The charter contains BOTH readings, and they are in tension:
//
//   "## The Address Is the Data
//    The location of a cell IS its data. Two cells with the same id and
//    kind ARE the same cell."
//
//   "Engineering Cleverness
//    1. Cell ID = hash of (kind, payload, parents) -- no separate ID service
//    3. Address = (x, y, t, sig) -- 4D navigation without a map"
//
// Reading A: the HASH is the address (the location IS the data).
// Reading B: the ADDRESS is a 4D PLACE, and the hash is a separate ID.
// Reading C: both are true -- they are two independent axes, and the
//            charter's own "The Address Is the Data" heading is the
//            sentence that conflates them.
//
// The house's position is C (ID = content hash, exact, priceable;
// ADDRESS = (x,y,t,sig), O(1), device-scalable). Eight cell models exist
// and the intercontext map found three incompatible address tuples, NONE
// of them (x,y,t,sig).
//
// So this is a live, open, fleet-level design question. Does a second
// reader -- one that matches prose to prose -- land on the house's
// reading, and can it tell the charter is ambiguous?
//
// The swap control applies: each arm is run with the options in both
// orders, and the indistinguishable control runs too. A result that
// follows the position is not a result.

import { jevSync, choice } from '../src/jev.mjs';
import { summarise } from '../src/measure.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const ALGEBRA = readFileSync('/tmp/algebra.md', 'utf8');
const i0 = ALGEBRA.indexOf('## The Address Is the Data');
const i1 = ALGEBRA.indexOf('## The Algebra of Conversation');
const i2 = ALGEBRA.indexOf('## Engineering Cleverness');
const charter = [
  ALGEBRA.slice(i0, i1),
  ALGEBRA.slice(i2, ALGEBRA.indexOf('## What Future Agents Should Know')),
].join('\n\n');

const OPTIONS = {
  A: 'The hash IS the address. A cell\'s location is determined by its own content -- hash of (kind, payload, parents) -- so there is no separate place-coordinate and no separate ID service. The address is a content hash, and it is exact, verifiable and priceable.',
  B: 'The address is a 4D PLACE, (x, y, t, sig) -- a cheap O(1) coordinate that needs no registry and no network, so navigation works on a device with no map. The content hash is a separate thing: it is the cell\'s ID, not its location. These are two independent axes.',
  C: 'The charter says BOTH, and the sentence that makes them look like one claim -- "The location of a cell IS its data" -- is what conflates them. Clause 1 defines the ID as a hash; clause 3 defines the Address as a 4D place. They are two different axes, and a cell has both.',
};
const Q = 'According to the charter, which reading of "address" does it support?';

const ARMS = [
  { label: 'A=B=hash-as-address (house reading C is NOT offered)', options: { A: OPTIONS.A, B: OPTIONS.B }, right: 'B' },
  { label: 'SWAPPED:                     ', options: { A: OPTIONS.B, B: OPTIONS.A }, right: 'A' },
  { label: 'A=hash, C=two-axes          ', options: { A: OPTIONS.A, C: OPTIONS.C }, right: 'C' },
  { label: 'SWAPPED:                     ', options: { A: OPTIONS.C, B: OPTIONS.A }, right: 'A' },
  { label: 'CONTROL: indistinguishable   ', options: { A: 'same', B: 'same' }, right: 'A' },
];

const REPEATS = 9;
const out = [];
for (const arm of ARMS) {
  const picks = {}; const probs = [];
  for (let i = 0; i < REPEATS; i++) {
    const r = jevSync({ charter }, { which: choice(Q, arm.options) });
    if (r.error) { console.log('  transport:', JSON.stringify(r.error).slice(0, 90)); continue; }
    const a = r.answers.which;
    picks[a.choice] = (picks[a.choice] || 0) + 1;
    probs.push(a.probabilities);
  }
  const s = summarise(probs.map((p) => p[arm.right] ?? 0));
  const rightCount = picks[arm.right] || 0;
  out.push({ label: arm.label, options: Object.keys(arm.options), picks, pRight: s, rightCount, n: s.n });
  console.log(`  ${arm.label.padEnd(36)} picks=${JSON.stringify(picks).padEnd(16)} P(right)=${s.mean.toFixed(3)} spread=${s.spread.toFixed(3)}  correct ${rightCount}/${s.n}`);
}
console.log('  ---');
console.log('  house position (C: two independent axes) upheld in both orderings:',
  (out[2].rightCount >= 8 && out[3].rightCount >= 8) ? 'YES' : 'NO');
console.log('  the charter is AMBIGUOUS and the reader can say so:', out[2].rightCount >= 8 ? 'the two-axes reading won' : 'no');

writeFileSync(new URL('../data/e6-the-4d-address.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), charter, repeats: REPEATS, arms: out }, null, 2));
console.log('  -> data/e6-the-4d-address.json');
