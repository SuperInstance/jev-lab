# gitpp-decision-parent

> Make a gate decision the **parent** of the action it authorises, so the closure root proves the action was licensed. Includes the shape that looks right and measurably does not work.

## Where this came from

The scout proposed an "intent shadow": a record with `effects: {}` carrying
the gate's verdict in `reason`, reasoning that §5.2 makes it state-inert while
§4's closure root makes it provenance-visible.

**I built it and measured it, and the reasoning was backwards.**

## The shape that does not work

Receipt AFTER the action, parented on the record being nudged:

```js
const receipt = decisionRecord({ id: "n1", parent: "t1", reason: "gate:block should_apply=0.07" });
closureRoot([t1], "t1") === closureRoot([t1, receipt], "t1")   // true — IDENTICAL
```

§4's closure root covers `{at} ∪ **ancestors**`. A *child* of `t1` is not in
`t1`'s closure, so a checkpoint on `t1` or any ancestor cannot see the decision
at all. It is decoration. The scout's inference — "a new ancestor moves it" —
is true, and the receipt is not an ancestor.

## The shape that works

Receipt BEFORE the action, as the action's **parent**:

```
     t1  task, status=wip
      |
     n1  witness, effects:{}, reason="gate:act should_apply=0.93"   <- receipt
      |
     n2  task, status=done                                          <- action
```

Now:

| | with the receipt | without it |
|---|---|---|
| state | `{status: done}` | `{status: wip}` |
| orphans | `[]` | `["n2"]` |
| closure of `n2` | `[n1, t1, n2]` | incomplete, missing `n1` |
| closure root of `n2` | a hash | **`null`** |

That last row is the whole point. **Remove the receipt and the action becomes
an orphan.** You cannot hold an action without the decision that licensed it,
and the closure root says so — `null`, not a hash of a partial closure.

## Why the receipt is `witness`

`kind: "witness"` is the lowest class in §5.1 (`override > task > witness`). A
receipt can never outrank anything, so it cannot perturb state even if the
enum widens. Combined with `effects: {}`, the receipt is state-inert by
construction rather than by convention — measured: state, setters and the
conflict ledger are all byte-identical with and without it.

## The verdict is tamper-evident

`reason` is part of the leaf (§2), so editing the verdict changes the
receipt's leaf — and therefore changes the **action's** closure root:

```
honest  "gate:block should_apply=0.07"  -> root 6c1f...
forged  "gate:act   should_apply=0.99"  -> root a94b...   (different)
```

You cannot rewrite history to claim a nudge was authorised when it was
blocked. The action's own hash commits to the decision.

## A receipt with no verdict is not a licence

```js
audit(action, records)
// { licensed: true, verdictMissing: true }
```

`licensed` is a structural fact; `verdictMissing` is reported, never
defaulted. An action carrying a receipt whose reason does not parse is
**worse** than one with no receipt at all, because it looks licensed. That
distinction is why `audit` returns both fields rather than a single boolean.

## Depends on

| this | needs |
|------|-------|
| [`gitpp-gate`](https://github.com/SuperInstance/gitpp-gate) | the `act`/`review`/`block` decision this receipt records |
| [`gitpp-nudge`](https://github.com/SuperInstance/gitpp-nudge) | authoring the action |
| [`git.pp-spec`](https://github.com/SuperInstance/git.pp-spec) §2, §4, §5.1, §5.5 | `reason` in the leaf, closure = `{at} ∪ ancestors`, class precedence, orphan rules |
| [`gitpp-doctor`](https://github.com/SuperInstance/gitpp-doctor) | the reference fold the tests measure against |

## Run

```bash
GITPP_DOCTOR_DIR=../gitpp-doctor node test/dp.test.mjs
```

Live calls into the Python reference. 15 assertions, including the
counter-example above — a suite that only proved the working shape would
pass just as well against a design with no downside, and this one has a
downside worth naming.

## Open

- The receipt is `witness`, so it appears in every conflict ledger for a key
  it never sets — except it sets none, so it does not. Unverified across all
  five ports; the tests run against the Python reference only.
- `record-schema.json` sets `kind.enum = [task, witness, override, null]`
  with `additionalProperties: false`, while SPEC §1.1 says other values are
  accepted. Two normative artifacts disagree. `witness` sidesteps it; a
  dedicated intent kind would not.
- Nothing here is wired into a hub's write path yet.
