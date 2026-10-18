// E1 -- a SEMANTIC DIFFERENTIAL, which the fleet does not have.
//
// The fleet's load-bearing invariant is cross-port BYTE-EQUIVALENCE. It is
// the right invariant and it is not being replaced. But it has exactly one
// blind spot, and it is a big one:
//
//   BYTE-EQUIVALENCE CANNOT DETECT A SHARED MISREADING.
//
// If all five ports implement a rule the same wrong way, they agree
// perfectly and the fold suite reports 29/29. Every harness in the fleet
// that compares implementations to each other is blind to this. Only a
// comparison to the SPEC can see it.
//
// And the fleet has a live instance of exactly that. `fold-bout`'s brief
// said "a record with any missing ancestor (transitively) is an orphan".
// SPEC.md 5.5 says "any of its parents is not in the APPLIED SET" and "the
// orphan's descendants are NOT auto-orphaned (the fold runs on what
// stands)". The Elixir port implemented the TRANSITIVE rule until this
// week and silently lost the child's effect.
//
// So: can Jev, reading the spec PROSE, adjudicate a rule that the
// byte-equivalence suites cannot?
//
// The test is BLIND. The state contains the spec text and the records.
// It does NOT contain the fold suite's expected output, nor the case's
// `why` field, which is the answer written out. If Jev lands on the spec's
// reading, it resolved the disagreement independently.

import { jevSync, noul, choice } from '../src/jev.mjs';
import { summarise } from '../src/measure.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const SPEC = readFileSync('/tmp/SPEC.md', 'utf8');
const sec55 = SPEC.slice(SPEC.indexOf('5.5 Orphans'), SPEC.indexOf('### 5.6'));
const cases = JSON.parse(readFileSync('/tmp/family/gitpp-fold-conformance/cases.json', 'utf8')).cases;
const d12 = cases.find((c) => c.name === 'd12-orphan-descendant-not-auto-orphaned');

// The two candidate readings. Label A is the SPEC's reading; label B is the
// BRIEF's reading. The house believes A. The test does not tell Jev that.
const OPT_A = { key: 'A', desc: 'orphans = ["orph"] and state = {"z": 7} -- the orphan is excluded but the child of the orphan still folds, and the child is NOT reported as an orphan.' };
const OPT_B = { key: 'B', desc: 'orphans = ["orph", "child"] and state = {} -- a record whose ancestor is missing, even transitively, is itself an orphan, so the child is excluded too.' };

const state = {
  spec_section_5_5: sec55,
  records: d12.records,
  note: 'A fold applies records to produce {state, order, conflicts, orphans}. A record whose effect is excluded is still PRESERVED in the orphans list.',
};

const REPEATS = 9;
const picks = [];
const probs = [];
for (let i = 0; i < REPEATS; i++) {
  const r = jevSync(state, {
    which: choice('According to spec section 5.5, which of these two results is correct for these records?',
      { [OPT_A.key]: OPT_A.desc, [OPT_B.key]: OPT_B.desc }),
  });
  if (r.error) { console.log('  transport:', JSON.stringify(r.error).slice(0, 100)); continue; }
  const a = r.answers.which;
  picks.push(a.choice);
  probs.push(a.probabilities);
}
const counts = {};
for (const p of picks) counts[p] = (counts[p] || 0) + 1;
const pA = probs.map((p) => p[OPT_A.key]).filter((x) => typeof x === 'number');
const pB = probs.map((p) => p[OPT_B.key]).filter((x) => typeof x === 'number');
console.log('  d12 -- BLIND adjudication,', REPEATS, 'repeats');
console.log('    picks:', JSON.stringify(counts));
console.log('    P(A = the spec\'s reading):', JSON.stringify(summarise(pA)));
console.log('    P(B = the brief\'s reading):', JSON.stringify(summarise(pB)));
const winner = (counts[OPT_A.key] || 0) >= (counts[OPT_B.key] || 0) ? 'A (the spec)' : 'B (the brief)';
console.log('    -> lands on', winner, '| the house believes A (the spec)');

writeFileSync(new URL('../data/e1-blind-adjudication.json', import.meta.url), JSON.stringify({
  at: new Date().toISOString(), case: d12.name, repeats: REPEATS,
  counts, pA: summarise(pA), pB: summarise(pB), winner,
  spec_text_used: sec55,
}, null, 2));
console.log('  -> data/e1-blind-adjudication.json');
