# jev-lab

**What TypeSafe.ai's Jev is actually good for, measured — and what it is not.**

This is a lab, not a product. It exists because the fleet already had a
capability map (`gitpp-gate/JEV-CAPABILITY-MAP.md`, 850+ calls) and a set of
laws about how to use a judge, and those laws had never been tested against
the one thing that matters: **a question the fleet actually has an opinion
about, where the answer would change what gets built.**

Every number here was measured against `api.typesafe.ai/v1/systemone`,
model `jev-latest`, on 2026-10-18, with the house's discipline: repeats,
the spread kept next to every verdict, the minimum never averaged, and a
**control that can fail** for every claim.

---

## The one-paragraph version

> Jev is a **surface-form matcher**. It reliably tells you which of two
> *phrasings* a source text more resembles. It **cannot adjudicate a rule**,
> and it **cannot be trusted with a bare result** — asked to pick between
> two result objects for the spec's own hardest case, it picked the wrong
> one **9 times out of 9, in every arrangement of the options**, for a
> content reason rather than a position one. Its one solid capability is
> **semantic triage**: over 24 real fleet READMEs it ranked them at
> **precision 0.909 / recall 0.909** against a grep-verifiable ground
> truth, and the three disagreements were the useful output — in two of
> three, **Jev was right and grep was the artefact.**

---

## E0 — the baseline, re-measured

| measurement | result |
|---|---|
| true claim | **0.99**, spread **0.000** |
| false claim | **0.01**, spread **0.000** |
| separation (true − false) | **0.9800** |
| unrelated document, true claim | 0.019, spread 0.010 |
| **empty state, world fact** | **0.99**, spread **0.000** |
| empty − unrelated | **+0.9711** |
| contradiction bias (later − earlier) | mean +0.009, **spread 0.040** |

**Two things the house's capability map did not record:**

1. **The empty-state launder is now total, not partial.** The map has it at
   **0.610**; today it is **0.99** — the same score as a correctly-read
   claim. A harness whose state fetch fails reports *perfect confidence*.
   `stateIsUsable()` is not defensive programming; it is the only thing
   between a failed fetch and a green badge.

2. **The noise band is wider than recorded, on contradictory state.** The
   house band is ~0.02. On a self-contradictory state the spread was
   **0.040** — twice the band. A score within 0.04 of a threshold on a
   contradictory state is a coin flip, and the band should say so.

## E1 / E1b / E4 / E5 / E7 — the position control, and a retraction

This is the part that matters, so it is told in order.

**E1** asked Jev to adjudicate the fleet's live brief-vs-spec disagreement
(`fold-bout`'s brief said a record with any missing ancestor, *transitively*,
is an orphan; `SPEC.md` §5.5 says the orphan's descendants are **not**
auto-orphaned). Blind: the state held the spec text and the records, and
**not** the fold suite's expected output nor the case's `why` field.

**Result: 9/9 for the spec's reading, P = 0.904.** That looked like a
capability.

**E1b** re-ran it with the option descriptions stripped to empty strings.
**Still 9/9.** Also looked like a capability — a reader that cannot see a
difference between two options cannot pick correctly between them nine
times out of nine.

**That was the tell.** E4 tested it: with two *indistinguishable* options,
Jev picked **the first one, 9/9, at P = 0.86**. **E1b's "BARE" arm was
measuring a position preference, not a reading. Retracted.**

**E5** then re-ran with the options swapped by *content* and got 9/9 in both
orderings, which looked like the capability confirmed. **It was not.** E7
separated the four confounded variables — which content is correct, which
key it sits at, the insertion order, and the content's *surface form* — and
the truth is this:

> **With the rule stated as PROSE, Jev picks the spec's reading 9/9 in
> every arrangement. With the rule stated as a RESULT, it picks the
> OPPOSITE 9/9 in every arrangement.**

A reader that flips its answer when the same rule is re-worded is not
reading a rule. It is matching a surface.

**So E5's conclusion was overstated and is corrected here: Jev matches
surface form, and a surface can be manufactured by writing the option in
the source's own idiom. That is a rhetorical artefact, not a finding.**

## E2 / E2b — it cannot derive either

E2 asked Jev, given the spec and a *proposed result*, "does this satisfy
§5.5?" — a compound, open question. It answered **NO to the correct
result** (0.217) and NO to the misreading (0.176). It separated the two
wrong answers but in the wrong place.

E2b made the questions atomic, one field at a time, and the failure
became legible:

| atomic question | Jev | truth |
|---|---|---|
| the orphan is in the orphans list | **0.969** ✓ | yes |
| the orphan's effect is in the state | 0.116 ✓ | no |
| **the child is in the orphans list** | **0.237** ✗ | no |
| **the child's effect is in the state** | **0.321** ✗ | yes |

**Jev got the two DIRECTLY-STATED clauses right and the INFERENTIAL one
wrong.** The clause it misses is the one that requires composing two
clauses into a rule about a *different* record.

> This is the house's own law — *"the judge reads text; it does not do
> logic"* — now measured with a control that would have caught the
> artefact.

## E3 / E3c — the corpus sweep, 27/29

Every one of the fold suite's 29 cases, each with a **mechanical**
distractor (no cherry-picking), scored against the fleet's own ground
truth. **27/29, mean P = 0.902.** The two misses were both diagnostic:
`d12` (the orphan rule — the one this lab had already shown is a surface
match) and `d25` (a numeric-string-versus-number distinction that **no
text reader can see**, because `"5"` and `5` are the same characters).

**That last point is the important one.** Jev's failure modes are
*complementary* to the byte-level harness's:

| | byte-level harness | Jev |
|---|---|---|
| a shared misreading (all ports wrong the same way) | **blind** — they agree perfectly | sees it, as a disagreement with the spec |
| a type distinction (`"5"` vs `5`) | sees it | **blind** |

**Neither replaces the other. Together they close both blind spots.** The
byte-equivalence invariant stays load-bearing; Jev is not a substitute for
it, and anyone who says "we can drop the fold suites now that we have a
judge" has misread both.

## E6 — the fleet's one unclaimed idea

The cutting-edge survey's verdict: *"the 4D address is documented at
`algebra.md:129` and implemented zero times. It is our only genuinely
unclaimed idea, and it is currently a sentence in a markdown file."*

The charter contains **both** readings, in tension:

> `## The Address Is the Data` — *"The location of a cell IS its data."*
> `1.` **Cell ID = hash of (kind, payload, parents)** — no separate ID service
> `3.` **Address = (x, y, t, sig)** — 4D navigation without a map

Three articulated readings were put to it, each in both option orders, with
the identical-options control:

| arm | result |
|---|---|
| hash-as-address vs 4D-place | **picks the 4D place, 9/9 in both orders** |
| hash-as-address vs two-independent-axes | **picks two-axes, 9/9 in both orders** |
| identical options (control) | picks the first, 9/9 — the position floor |

**The house's position survives an independent reader**: the charter
supports a 4D *place*-address over a content-hash address, and supports
the two-axes reading (ID = hash, ADDRESS = `(x,y,t,sig)`) over the plain
hash reading.

**And the confidence is position-dependent**: P = 0.80 when the answer is
first, **0.60 when it is second**, with the spread growing from 0.06 to
0.14. The *pick* was 9/9 either way. **The pick is stable; the confidence
is not.** Anyone quoting the confidence as if it were the finding is
quoting the weaker half.

## E8 — semantic triage, and the thing that is actually usable

The fleet has 5,289 repositories and the atlas needs to know which are
about a topic. grep is exact and lexical; a reader is semantic and not
trustworthy enough to decide anything.

**So use both, and let the disagreement be the output.**

24 real fleet READMEs; the question was *"does this document describe a
system that sends prompts to an external language-model service and uses
the answer to make a decision?"*; ground truth by grep for a named
provider (lexical, crisp, checkable — the house's own evidence method).

| | |
|---|---|
| **top-11 by score** | **precision 0.909, recall 0.909** (10 of 11 true positives) |
| perfectly separated | no (lowest positive 0.020, highest negative 0.130) |
| **disagreements with grep** | **3** |

**And the disagreements are the product:**

| document | Jev | grep | who is right |
|---|---|---|---|
| `luciddreamer` | 0.200 | positive | **Jev** — the README is 899 B and mentions a model without describing the flow; a *mention* is not a *description* |
| `sdk` | 0.470 | positive | borderline — the SDK names models without describing the flow |
| `substrate-vectors` | 0.020 | positive | **Jev** — grep matched a passing "judge"; the document is not about calling a model API at all |

**In two of three, the reader is right and grep is the artefact.** That is
exactly the failure mode grep has, and it is exactly what a human would
have missed at 5,289 repos' scale.

**One more measured property: the score is TOPICALITY, not presence.**
`AI-Writings` is a 58 KB document that discusses model calls extensively
among many other things, and it scores **0.747** — not 0.99. A document
that is *partly* about a topic reads as partly about it. Do not threshold
a presence test on this score.

---

## What this changes about how the fleet uses a judge

1. **A judge may never be the thing that decides.** It proposes, the
   ledger remembers, the verdict reproduces with no judge call. That is
   `gitpp-sheet`'s closure property, and this lab is the measurement that
   says *why* it has to be that way.
2. **A judge may triage.** Ranking a corpus at 0.909/0.909 for one
   batched call, and producing a disagreement set a human reads, is a
   real capability the fleet does not otherwise have.
3. **Never ask it about a bare result.** Ask it about prose.
4. **Never ask it to derive.** Ask it to choose.
5. **Always run the position control.** One request with the options
   swapped. If the two orderings disagree, you have learned nothing.
6. **Quote the spread, never the point.** The pick was 9/9 in every
   arrangement; the confidence moved from 0.80 to 0.60 on a position
   change alone.

## The tool

`bin/adjudicate.mjs` is the discipline, executable. It asks twice — the
options in your order, then swapped — and **refuses to report a verdict
unless the pick travelled with the content**:

```
$ node bin/adjudicate.mjs --spec algebra.md \
    --question 'According to the charter, which reading of "address" does it support?' \
    --option A "$(cat a.txt)" --option B "$(cat b.txt)"
forward  : {"B":5} -> B
swapped  : {"A":5} -> A

VERDICT: UNRESOLVED -- the two orderings disagree, so the pick may be a
position preference rather than a reading.
  This tool refuses to report a verdict it cannot separate from a position
  artefact.
```

**A harness that cannot fail is indistinguishable from one that can.** The
tool's most important behaviour is its refusal.

## Reproducing

```bash
export TYPESAFE_AI_TOKEN=...
node experiments/e0-baseline.mjs          # the baseline
node experiments/e1-semantic-differential.mjs
node experiments/e2-catches-a-shared-misreading.mjs
node experiments/e2b-atomic.mjs
node experiments/e3-29-case-sweep.mjs
node experiments/e3b-scope-and-type.mjs
node experiments/e3c-prose-options.mjs
node experiments/e3d-question-specificity.mjs
node experiments/e4-position-bias.mjs     # the control that retracted E1b
node experiments/e5-the-real-capability.mjs
node experiments/e6-the-4d-address.mjs
node experiments/e7-position-decisive.mjs
node experiments/e8-semantic-triage.mjs
```

The experiments read `SPEC.md` and `cases.json` from the fleet; see
`experiments/README.md` for the exact paths.

## Environment notes, measured

- `api.typesafe.ai` sits behind a gateway that intermittently fails TLS SAN
  verification. **A transport failure is not an answer**: it is retried,
  and if it survives the retries it is SURFACED, never converted to a
  score. This is the same doctrine as the fold suite's "a port that cannot
  answer must be a failure, never a value."
- `questions` is a **dict**, and every question is a tagged union:
  `{"type": "noul"|"choice"|"score", "instructions": ..., "criteria": ...}`.
  `noul` returns `P(yes)`. `choice` returns the option AND the full
  probability distribution. `score` returns a probability-weighted value.
  `criteria` is a **map** for `noul`/`choice` and an **array of levels**
  for `score`.
- `instructions` may be an **object** holding the question in one field
  and the data it refers to in others, with `backtick` references into the
  state. That is a pointer syntax — and the charter's `(x, y, t, sig)`
  wants exactly that shape.
- Questions are evaluated **in parallel against the same state**, so one
  request carries a whole battery. The qthe tavern measured that batching
  a reader's whole battery into one call costs **12.36x less and adds zero
  measured noise**.

## Licence

MIT.
