#!/usr/bin/env node
// adjudicate -- ask a second reader to settle an ARTICULATED disagreement.
//
//   node bin/adjudicate.mjs --spec <file> --question <text> \
//        --option A <text> --option B <text> [--option C <text>] \
//        [--repeats 9] [--json]
//
// WHAT IT DOES. It asks the question twice -- once with the options in the
// order you gave them, once SWAPPED -- and reports which answer the reader
// picks in each.
//
// WHY THE SWAP. A reader that cannot tell two options apart will pick the
// FIRST one, and it will do so confidently. That was measured: with two
// indistinguishable options the reader picked the first 9 times out of 9,
// at P=0.86. So a single-arm result is uninterpretable. This tool refuses
// to report a verdict unless the two orderings AGREE ON THE CONTENT, and
// it says so when they do not.
//
// WHAT IT WILL NOT DO. It will not adjudicate two raw RESULTS. Measured:
// given two result objects with no explanation, the reader picked the
// WRONG one for the spec's own hardest case, 0 out of 9, in BOTH
// orderings. A reader matches PROSE to prose. So the options must each
// STATE THEIR RULE, and this tool exists to make that a habit.
//
// THIS IS NOT A JUDGE OF TRUTH. It is a reader that tells you which of two
// ARTICULATED readings the source text supports. The reader writes the
// options; this tool asks which one the text backs.

import { readFileSync, existsSync } from 'node:fs';
import { jevSync, choice } from '../src/jev.mjs';
import { summarise } from '../src/measure.mjs';

const argv = process.argv.slice(2);
const arg = (n, d) => { const k = argv.indexOf(n); return k >= 0 ? argv[k + 1] : d; };
const has = (n) => argv.includes(n);

const specPath = arg('--spec');
const question = arg('--question');
const repeats = parseInt(arg('--repeats', '9'), 10);
const options = {};
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--option') { options[argv[i + 1]] = argv[i + 2]; i += 2; }
}
if (!specPath || !question || Object.keys(options).length < 2) {
  console.error('usage: adjudicate --spec <file> --question <text> --option <KEY> <text> [--option <KEY> <text>] [--repeats N]');
  process.exit(2);
}
if (!existsSync(specPath)) { console.error(`no such file: ${specPath}`); process.exit(2); }

const spec = readFileSync(specPath, 'utf8');
const keys = Object.keys(options);
const state = { source: spec };

function run(order) {
  const picks = {}; const probs = [];
  for (let i = 0; i < repeats; i++) {
    const r = jevSync(state, { which: choice(question, Object.fromEntries(order.map((k) => [k, options[k]]))) });
    if (r.error) { console.error('transport failure:', JSON.stringify(r.error).slice(0, 160)); continue; }
    const a = r.answers.which;
    picks[a.choice] = (picks[a.choice] || 0) + 1;
    probs.push(a.probabilities);
  }
  return { picks, probs };
}

const fwd = run(keys);
const rev = run([...keys].reverse());
const topOf = (p) => Object.entries(p.picks).sort((a, b) => b[1] - a[1])[0]?.[0];
const fwdPick = topOf(fwd), revPick = topOf(rev);
const followsContent = !!(fwdPick && revPick && fwdPick === revPick);
const unanimous = (p) => Object.keys(p.picks).length === 1 && Object.values(p.picks)[0] >= repeats - 1;

const report = { at: new Date().toISOString(), question, options: keys, repeats,
  forward: { picks: fwd.picks, pick: fwdPick, unanimous: unanimous(fwd) },
  swapped: { picks: rev.picks, pick: revPick, unanimous: unanimous(rev) },
  followsContent, verdict: followsContent ? fwdPick : 'UNRESOLVED' };

if (has('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`question : ${question}`);
  console.log(`options  : ${keys.join(', ')}`);
  console.log(`forward  : ${JSON.stringify(fwd.picks)} -> ${fwdPick}`);
  console.log(`swapped  : ${JSON.stringify(rev.picks)} -> ${revPick}`);
  if (followsContent) {
    console.log(`\nVERDICT: ${fwdPick}  (the pick travelled with the CONTENT in both orderings)`);
    const pf = summarise(fwd.probs.map((p) => p[fwdPick] ?? 0));
    const pr = summarise(rev.probs.map((p) => p[fwdPick] ?? 0));
    console.log(`  confidence: forward P=${pf.mean.toFixed(3)} (spread ${pf.spread.toFixed(3)}) | swapped P=${pr.mean.toFixed(3)} (spread ${pr.spread.toFixed(3)})`);
    if (pf.spread > 0.15 || pr.spread > 0.15) console.log('  NOTE: a wide spread means the confidence is not stable; treat this as a weak reading.');
  } else {
    console.log('\nVERDICT: UNRESOLVED -- the two orderings disagree, so the pick may be a position preference rather than a reading.');
    console.log('  This tool refuses to report a verdict it cannot separate from a position artefact.');
  }
}
process.exit(followsContent ? 0 : 1);
