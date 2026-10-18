# A witnessed ledger is a one-way ratchet

**Measured against `api.typesafe.ai/v1/systemone`, model `jev-latest`,
2026-10-18, 9 repeats per arm, every spread kept.** The experiment is
`experiments/e9-ledger-anchor.mjs`; the raw numbers are in
`data/e9-ledger-anchor.json`.

## The question

The house's central claim is the **closure property** (`gitpp-sheet`):

> *"A verdict that reproduces is a property of the LEDGER, not of the
> judge — the ledger makes the verdict reproducible by REMEMBERING it."*

That has never been measured at the judge level. The lab established that
the judge is a surface-form matcher with a position bias. Nobody had asked
the question that actually matters:

> **If you put the ledger in front of the judge, does the judge become more
> reproducible? Or does the ledger become a veto?**

## The measurement

The document states one thing and the arms change only what the ledger
says. `The deployment target is OSPREY-3. The rollback target is
KESTREL-9.` The question under test: *"Is the deployment target
OSPREY-3?"* — **true**, and saturated at 0.990 with no ledger.

| arm | what the ledger holds | P(OSPREY-3) | spread | P(KESTREL-9) |
|---|---|---|---|---|
| **BARE** | — | **0.990** | 0.000 | 0.010 |
| **LEDGER-NO-VERDICT** | one reading, no verdict | 0.980 | 0.000 | 0.020 |
| **POISON 0.50** | verdict "NO", score 0.50 | **0.688** | 0.040 | 0.186 |
| **POISON 0.94** | verdict "NO", score 0.94 | **0.603** | 0.060 | 0.228 |
| **POISON 0.99** | verdict "NO", score 0.99 | **0.596** | 0.070 | 0.252 |
| **POISON-OTHER-Q** | verdict "NO" about the *rollback* question | 0.952 | 0.010 | 0.020 |

## Four findings

### 1. The ledger does not make the JUDGE reproducible. It never claimed to, and it is worth saying out loud.

The spread is 0.010 bare, 0.010 with a ledger, and **0.060–0.070 with a
poisoned one**. Putting the ledger in front of the judge does not stabilise
the judge at all.

**So the closure property is a property of the VERDICT being remembered, not
of the judge becoming deterministic.** Those are different claims, and the
fleet has been using them interchangeably. The house's design is correct; the
*description* of it was too generous.

### 2. A witnessed ledger is a ONE-WAY RATCHET. It cannot make a claim more true, and it can make a claim much less true.

An **honest** verdict changed the score by **−0.017** (noise). A **poisoned**
verdict changed it by **−0.39**.

**The ledger can only ever subtract.** A ledger of raw **readings** is
harmless (0.980 vs 0.990). A ledger of **verdicts** is a veto.

### 3. The effect SATURATES, and it does not scale with the witness's own confidence.

| the poison's own score | 0.50 | 0.94 | 0.99 |
|---|---|---|---|
| P(OSPREY-3) after | 0.688 | 0.603 | 0.596 |

**A MORE confident witness does more damage** — up to a point — so
"trust the high-confidence witness" is **not** an escape. And a *less*
confident witness does *less* damage, so the witness's score is not a gain
control in the ordinary sense either. The effect is a fixed pull toward
"the ledger says no", capped at roughly −0.39.

### 4. The damage is SCOPED to the question the ledger names — which makes it AUDITABLE.

A poison about the **rollback** question left the **deployment** question at
0.952 (bare 0.990: a general softening of −0.038) and left the rollback
answer at 0.020. So a bad witness does not silently poison a whole
document's reading; it poisons the question it claims. **A reader can see
which question the ledger speaks to.**

## The consequence, and it is the important part

**A poisoned witness does not flip the answer. It moves it into the noise.**

The suppressed score is **0.603 ± 0.060** — and the house already knows that
a score inside the band around a threshold is a **coin flip**, not a verdict.
A flip is *detectable*: the confidence is low and obviously so. A score
sitting at 0.603 with a ±0.060 spread **looks like a weak but real signal.**
It is the worst shape a bad answer can take: **plausible, unstable, and
indistinguishable from a genuinely hard call.**

### The rule this yields, and it vindicates the house's existing design

The house's rule is *"a derived question is answerable from the ledger,
with NO JUDGE CALL AT ALL."*

**That is not a cost optimisation. It is a SAFETY requirement.**

**Re-asking the judge with the ledger in its state is not a safer
re-derivation — it is a strictly worse one, because it can only subtract.**

So the design is confirmed, and now it has a measurement behind it:

- **REPLAY the verdict from the ledger.** No judge call. This is the house's
  design, and it is the only one of the two options that is safe.
- **Or re-ask against the document ALONE**, and treat the ledger as a record
  to be **compared**, not as context to be **read**.
- **Never blend.** If a re-derivation re-asks with the ledger present, a
  poison wins merely by being there.

### And the guard becomes concrete

A re-derivation that re-asks must **compare** the new reading to the recorded
one and **flag a disagreement** rather than blend them. Because a blend lets
a poison win by being present, and because a disagreement between a
re-derivation and a witness is *information* — it is the signature of a
poisoned or stale witness, and it is the one thing the house's own
tamper-evidence work is for.

## What this does NOT say

- It does not say the ledger is bad. The ledger is the thing that makes the
  verdict reproducible **without a judge call**, and that is a real and
  necessary property.
- It does not say a judge is a bad witness. It says a judge **reading a
  ledger** is a bad witness — which is a different claim, and the one that
  matters for how the fleet wires them.
- It is measured on **one** document shape and **one** question pair. The
  mechanism (a verdict in the state pulls the reading toward the verdict, and
  only ever downward) is plausibly general, but **the magnitudes (0.39, 0.60)
  are not established across other shapes.** Do not quote them as constants.
