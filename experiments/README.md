# The experiments, and what they need

Each experiment is standalone (`node experiments/<name>.mjs`) and writes its
result to `../data/<name>.json`. Results are committed, so the numbers in
the README can be re-derived without spending API calls — and the tests in
`../test` assert against the committed data.

## Inputs these read

| path | what | where it comes from |
|---|---|---|
| `/tmp/SPEC.md` | the git.pp specification, verbatim | `SuperInstance/git.pp-spec` → `SPEC.md` (29,861 B) |
| `/tmp/family/gitpp-fold-conformance/cases.json` | the fold suite's 29 cases, each with a prose `why` | `SuperInstance/gitpp-fold-conformance` |
| `/tmp/algebra.md` | the charter, `algebra.md` (5,987 B) | `SuperInstance/AI-Writings` |
| `../data/corpus/*.md` | 24 real fleet READMEs, fetched from raw.githubusercontent | the fleet's own repositories |

To rebuild the inputs:

```bash
mkdir -p /tmp/family && cd /tmp/family
for pair in "git.pp-spec ." "gitpp-fold-conformance gitpp-fold-conformance" "AI-Writings AI-Writings"; do
  set -- $pair
  git clone --depth 1 "https://github.com/SuperInstance/$1.git" "$2"
done
cp AI-Writings/algebra.md /tmp/algebra.md
cp gitpp-fold-conformance/cases.json /tmp/family/gitpp-fold-conformance/cases.json
curl -sL "https://raw.githubusercontent.com/SuperInstance/git.pp-spec/main/SPEC.md" -o /tmp/SPEC.md
```

## The order, and why it is that order

| # | file | what it establishes |
|---|---|---|
| E0 | `e0-baseline.mjs` | the baseline, re-measured: separation, spread, the empty-state launder, the contradiction bias |
| E1 | `e1-semantic-differential.mjs` | the first (apparently successful) blind adjudication of the orphan rule |
| E2 | `e2-catches-a-shared-misreading.mjs` | **fails**: a compound open question gets the CORRECT answer wrong |
| E2b | `e2b-atomic.mjs` | atomic questions: the two DIRECTLY-STATED clauses are right, the INFERENTIAL one is wrong |
| E3 | `e3-29-case-sweep.mjs` | the corpus sweep: 27/29 against the fleet's own ground truth |
| E3b | `e3b-scope-and-type.mjs` | tests scope vs type as the cause of the two misses |
| E3c | `e3c-prose-options.mjs` | the same sweep with prose options — **rules out rendering** |
| E3d | `e3d-question-specificity.mjs` | tests the question's specificity as the cause |
| **E4** | **`e4-position-bias.mjs`** | **the control that retracts E1b**: identical options always pick the first |
| E5 | `e5-the-real-capability.mjs` | the swap control, first version — and it is E7 that shows it was still confounded |
| **E6** | **`e6-the-4d-address.mjs`** | the 4D address: the house's position survives an independent reader |
| **E7** | **`e7-position-decisive.mjs`** | **separates key, insertion order, content and surface form** — and shows the pick follows surface form |
| **E8** | **`e8-semantic-triage.mjs`** | **the usable capability**: triage at 0.909/0.909, with the disagreement set as the output |

**E4 and E7 are the two that matter most**, and both of them *reduce* what
the earlier experiments claimed. A lab that only ever confirms its first
hypothesis is not a lab.
