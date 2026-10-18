// E8 -- SEMANTIC TRIAGE, with a ground truth you can check with grep.
//
// The fleet has 5,289 repositories. The reading-room's atlas needs to know
// WHICH REPOSITORIES ARE ABOUT A GIVEN TOPIC, and it has two tools:
//
//   grep      exact, cheap, and LEXICAL -- it finds the words, not the
//             meaning, so it misses every document that discusses the topic
//             without using the words
//   a reader  semantic, but it is not trustworthy enough to decide
//             anything on its own (E1-E7 in this repo)
//
// So the useful combination is NOT "let the reader decide". It is:
//
//   grep produces the shortlist. The reader RANKS it. The two DISAGREE
//   about a few documents. THOSE are the ones a human should read.
//
// The output of this experiment is therefore not a ranking. It is the
// DISAGREEMENT SET.
//
// Ground truth: a document is about calling a paid model API if it names
// one. That is checkable with grep, which is the house's own evidence
// method. Lexical truth, crisp, verifiable.

import { jevSync, noul } from '../src/jev.mjs';
import { summarise } from '../src/measure.mjs';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = new URL('../data/corpus/', import.meta.url).pathname;
const files = readdirSync(DIR).filter((f) => f.endsWith('.md'));
const PATTERN = /deepseek|jev|typesafe|openai|anthropic|worker[s -]?ai|minimax|z\.ai|qwen|glm|kimi|llm|language model|paid model|judge/i;

const truth = {};
for (const f of files) {
  const txt = readFileSync(join(DIR, f), 'utf8');
  truth[f] = PATTERN.test(txt);
}
const positives = files.filter((f) => truth[f]);
const negatives = files.filter((f) => !truth[f]);
console.log(`  corpus: ${files.length} documents | grep-positive (about calling a model API): ${positives.length} | negative: ${negatives.length}`);

const REPEATS = 3;
const rows = [];
for (const f of files) {
  const txt = readFileSync(join(DIR, f), 'utf8');
  const state = { readme: txt };
  const samples = [];
  for (let i = 0; i < REPEATS; i++) {
    const r = jevSync(state, {
      calls_model: noul('Does this document describe a system that sends prompts to an external language-model service and uses the answer to make a decision?',
        { true: 'The document describes sending prompts to an external model service and using the answer.',
          false: 'The document does not describe sending prompts to an external model service.' }),
    });
    if (r.error) continue;
    samples.push(r.answers.calls_model.noul);
  }
  const s = summarise(samples);
  rows.push({ file: f, score: s.mean, spread: s.spread, truth: truth[f] });
  console.log(`  ${(truth[f] ? 'POS' : 'neg')} ${f.padEnd(28)} score=${s.mean.toFixed(3)} spread=${s.spread.toFixed(3)}`);
}
const pos = rows.filter((r) => r.truth), neg = rows.filter((r) => !r.truth);
const minPos = Math.min(...pos.map((r) => r.score));
const maxNeg = Math.max(...neg.map((r) => r.score));
const separated = minPos > maxNeg;
console.log('  ---');
console.log(`  lowest POSITIVE: ${minPos.toFixed(3)}   highest NEGATIVE: ${maxNeg.toFixed(3)}   perfectly separated: ${separated ? 'YES' : 'NO'}`);
// top-10 by score; how many are true positives?
const ranked = [...rows].sort((a, b) => b.score - a.score);
const topN = Math.max(1, positives.length);
const topK = ranked.slice(0, topN);
const tp = topK.filter((r) => r.truth).length;
console.log(`  top-${topN} by score: ${tp} true positives (of ${positives.length}) -> precision ${(tp / topK.length).toFixed(3)}, recall ${(tp / positives.length).toFixed(3)}`);
const disagree = rows.filter((r) => (r.score >= 0.5) !== r.truth);
console.log(`  DISAGREEMENTS with grep (these are the ones a human should read): ${disagree.length}`);
for (const d of disagree) console.log(`      ${d.file}  score=${d.score.toFixed(3)}  grep-says=${d.truth}`);

writeFileSync(new URL('../data/e8-semantic-triage.json', import.meta.url),
  JSON.stringify({ at: new Date().toISOString(), repeats: REPEATS, pattern: String(PATTERN),
    corpus: files.length, positives: positives.length, minPositive: minPos, maxNegative: maxNeg,
    separated, topK: { k: topK.length, truePositives: tp }, disagreements: disagree, rows }, null, 2));
console.log('  -> data/e8-semantic-triage.json');
