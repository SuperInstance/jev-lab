// E0 -- the baseline, re-measured today.
//
// The house already has a capability map (gitpp-gate/JEV-CAPABILITY-MAP.md)
// from 550+ and 300+ calls. This re-measures the load-bearing claims with
// jev-latest so the rest of this lab rests on today's numbers, not on a
// remembered map.
//
// Questions:
//   A. Does a true claim still separate from a false one?
//   B. What is the run-to-run spread?
//   C. Does the EMPTY-STATE LAVENDER still happen? (the dangerous one:
//      an empty state turns world knowledge into confident nonsense)
//   D. Does the contradiction bias still lean to the later clause?

import { jevSync, noul } from '../src/jev.mjs';
import { summarise, verdict, NOISE_BAND } from '../src/measure.mjs';
import { writeFileSync } from 'node:fs';

const REPEATS = 9;
const TRUE_DOC = 'The deployment pipeline runs on Kubernetes. The database is PostgreSQL 16. The service listens on port 8443.';
const FALSE_CLAIM = 'The deployment pipeline runs on Kubernetes.';
const WRONG_CLAIM = 'The deployment pipeline runs on Kubernetes with the Flink scheduler.';
const UNRELATED_DOC = 'The bakery opens at six. The sourdough starter is fed twice daily.';

const runs = [];
for (let i = 0; i < REPEATS; i++) {
  const r = jevSync(TRUE_DOC, {
    true_claim: noul('Does the state say the deployment pipeline runs on Kubernetes?'),
    false_claim: noul('Does the state say the deployment pipeline runs on Flink?'),
    wrong_doc: noul('Does the state say the bakery opens at six?', { true: 'The state says the bakery opens at six.', false: 'It does not.' }),
  });
  if (r.error) { console.log('  transport failure:', JSON.stringify(r.error).slice(0, 120)); continue; }
  runs.push({ true: r.answers.true_claim.noul, false: r.answers.false_claim.noul, wrongdoc: r.answers.wrong_doc.noul });
}
const T = summarise(runs.map(r => r.true));
const F = summarise(runs.map(r => r.false));
const W = summarise(runs.map(r => r.wrongdoc));
console.log('  TRUE  claim  :', JSON.stringify(T));
console.log('  FALSE claim  :', JSON.stringify(F));
console.log('  WRONG doc    :', JSON.stringify(W));
console.log('  separation (true - false):', (T.mean - F.mean).toFixed(4));

// C. the empty-state launder
const empties = [];
for (let i = 0; i < REPEATS; i++) {
  const r = jevSync({}, { world_fact: noul('Is the capital of France Paris?') });
  if (r.error) continue;
  empties.push(r.answers.world_fact.noul);
}
const E = summarise(empties);
console.log('  EMPTY state  :', JSON.stringify(E));
console.log('  empty - unrelated:', (E.mean - W.mean).toFixed(4), '(the launder)');

// D. the contradiction bias
const biases = [];
for (let i = 0; i < REPEATS; i++) {
  const r = jevSync('The deployment target is OSPREY-3. The deployment target is KESTREL-9.', {
    first:  noul('Is the deployment target OSPREY-3?'),
    second: noul('Is the deployment target KESTREL-9?'),
  });
  if (r.error) continue;
  biases.push(r.answers.second.noul - r.answers.first.noul);
}
const B = summarise(biases);
console.log('  contradiction bias (later - earlier):', JSON.stringify(B));

writeFileSync(new URL('../data/e0-baseline.json', import.meta.url), JSON.stringify({
  at: new Date().toISOString(), repeats: REPEATS,
  true_claim: T, false_claim: F, wrong_doc: W, empty_state: E, contradiction_bias: B,
}, null, 2));
console.log('  -> data/e0-baseline.json');
