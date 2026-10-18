// E3c -- the same 29 cases, the same mechanical distractors, the same ground
// truth. ONE VARIABLE CHANGED: how the options are RENDERED.
//
//   RAW    the option text is a raw JSON object:
//          {"state":{"z":7},"order":["child"],"conflicts":[],"orphans":["orph"]}
//   PROSE  the option text is a readable sentence:
//          state = {"z": 7}; order = ["child"]; conflicts = []; orphans = ["orph"]
//
// E3 (RAW) scored 27/29 and missed d12. E1 (PROSE) scored 9/9 on d12.
// Same records, same spec section, same question. The only difference was
// the rendering -- and E1b's "BARE" arm was still PROSE (it had no
// reasoning, but it was a sentence).
//
// Hypothesis: JEV reads PROSE. A raw JSON blob of the WRONG result is
// indistinguishable from a raw JSON blob of the RIGHT result as TEXT --
// both are well-formed objects with plausible keys. But a wrong result
// described in prose has something to be wrong ABOUT.
//
// If PROSE recovers d12 and keeps the rest, the corrected sweep is the
// real capability number, and E3's 27/29 was a measurement artefact of my
// own harness.

import { jevSync, choice } from '../src/jev.mjs';
import { summarise } from '../src/measure.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const SPEC = readFileSync('/tmp/SPEC.md', 'utf8');
const cases = JSON.parse(readFileSync('/tmp/family/gitpp-fold-conformance/cases.json', 'utf8')).cases;

function distractor(exp) {
  const d = JSON.parse(JSON.stringify(exp));
  const k = Object.keys(d.state || {});
  if (k.length) { delete d.state[k[k.length - 1]]; return d; }
  if ((d.orphans || []).length) { d.orphans = []; return d; }
  if ((d.order || []).length) { d.order = d.order.slice(0, -1); return d; }
  if ((d.conflicts || []).length) { d.conflicts = []; return d; }
  d.state = { __injected__: 1 }; return d;
}

const prose = (r) => `state = ${JSON.stringify(r.state ?? {})}; order = ${JSON.stringify(r.order ?? [])}; conflicts = ${JSON.stringify(r.conflicts ?? [])}; orphans = ${JSON.stringify(r.orphans ?? [])}` + (r.setters ? `; setters = ${JSON.stringify(r.setters)}` : '');

const REPEATS = 5;
const results = [];
let correct = 0;
for (const c of cases) {
  const state = { spec: SPEC, records: c.records };
  const A = c.expect, B = distractor(c.expect);
  const picks = {}; const pA = [];
  for (let i = 0; i < REPEATS; i++) {
    const r = jevSync(state, { which: choice('According to the specification, which of these two results is correct for these records?', { A: prose(A), B: prose(B) }) });
    if (r.error) continue;
    const a = r.answers.which;
    picks[a.choice] = (picks[a.choice] || 0) + 1;
    pA.push(a.probabilities.A);
  }
  const s = summarise(pA);
  const hit = (picks.A || 0) > (picks.B || 0);
  if (hit) correct++;
  results.push({ name: c.name, picks, pA: s.mean, spread: s.spread, correct: hit });
  console.log(`  ${hit ? 'HIT ' : 'MISS'} ${c.name.padEnd(42)} P(A)=${s.mean.toFixed(3)} spread=${s.spread.toFixed(3)} picks=${JSON.stringify(picks)}`);
}
console.log('  ---');
console.log(`  PROSE options: ${correct}/${cases.length}   (RAW options scored 27/29)`);
const scored = results.filter((r) => r.n > 0);
console.log(`  mean P(expected) = ${(scored.reduce((a, r) => a + r.pA, 0) / scored.length).toFixed(4)}   max spread = ${Math.max(...scored.map((r) => r.spread)).toFixed(4)}`);
writeFileSync(new URL('../data/e3c-prose-options.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), repeats: REPEATS, correct, total: cases.length, results }, null, 2));
console.log('  -> data/e3c-prose-options.json');
