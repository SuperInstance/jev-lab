#!/usr/bin/env python3
"""Recompute E7's result from the COMMITTED DATA.

An audit found that the README claimed "9/9 in every arrangement" for BOTH
the prose form and the result form. The data says:

  * E7 ran the PROSE form. Six of its seven arms are 9/9 -- the judge
    followed the CONTENT every time. The SEVENTH arm ("X at A, insertion
    B,A") splits 5/4, so the honest figure is **6 of 7 arrangements**, not
    "every arrangement".
  * The RESULT form was a SEPARATE sweep (E3c), and it scored d12 at
    **4/5 for the WRONG option** -- not 9/9.
  * The "P = 0.86" belongs to E7's CONTROL arm (pTop 0.859), which is the
    right number for "the judge prefers the first slot" -- but it is E7's
    control, not E4's (0.813 / 0.807).

The core finding SURVIVES and is in fact clearer for being recomputed:

    the judge follows the CONTENT, consistently, in both surface forms --
    and in the result form it follows it to the OTHER content, which is
    the whole point.

This script exists so the README cannot drift from the data again.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, "data", "e7-position-decisive.json")
if not os.path.exists(P):
    print("no committed E7 data")
    sys.exit(0)
d = json.load(open(P, encoding="utf-8"))
arms = d.get("arms", [])
unanimous = [a for a in arms if len(a.get("picks", {})) == 1]
split = [a for a in arms if len(a.get("picks", {})) > 1]
ctrl = next((a for a in arms if "CONTROL" in a.get("label", "")), None)
print(f"  E7 arms: {len(arms)}")
for a in arms:
    n = sum(a['picks'].values())
    kinds = len(a['picks'])
    print(f"    {a['label']:32s} {json.dumps(a['picks']):16s} pTop={a['pTop']:.3f} "
          f"{'UNANIMOUS' if kinds == 1 else '*** SPLIT ***'}")
print()
print(f"  unanimous: {len(unanimous)}/{len(arms)} arrangements")
if split:
    print(f"  the split arm: {split[0]['label']} -> {json.dumps(split[0]['picks'])}")
if ctrl:
    print(f"  the control's pTop (the first-slot preference): {ctrl['pTop']:.3f}")
print()
print('  The README must say "6 of 7", not "9/9 in every arrangement",')
print('  and must attribute the result-form figure to E3c (4/5), not to E7.')
