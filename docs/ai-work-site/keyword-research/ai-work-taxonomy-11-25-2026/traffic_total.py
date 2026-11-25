"""Adds up every measured phrase (all runs, duplicates and look-alike software names removed) and estimates monthly visits
at three click-through rates from AWR's 2026 US desktop study: position 1 = 20.02%, position 2 = 10.36%, position 3 = 3.89%."""
import csv, pathlib

root = pathlib.Path(__file__).parent.parent
files = [root / "ai-work-by-industry-11-25-2026/keywords.csv", root / "ai-work-types-11-25-2026/keywords.csv",
         root / "ai-work-taxonomy-11-25-2026/work/keywords.csv", root / "ai-work-taxonomy-11-25-2026/software2/keywords.csv",
         root / "open-models-and-custom-evals-11-25-2026/keywords.csv", root / "ai-work-taxonomy-11-25-2026/missing/keywords.csv", root / "ai-work-taxonomy-11-25-2026/aisw/keywords.csv"]
lookalike = ("ada ", "upstart ", "character ai", "apollo ", "alloy ", "gem ", "pitch ", "ultimate ", "dust ", "grain ", "read ai", "canvas ", "descartes ", "plex ", "blend ", "sapiens ", "lofty ", "ramp ", "weave ", "gong ")
junk = ("ollama", "what is", "meaning", "definition", " free", "course", " jobs", "salary", "propensity score", "vet claims", "chat bot online")
pool = {}
for f in files:
    if not f.exists():
        continue
    for r in csv.DictReader(open(f)):
        k = r["keyword"].lower().strip()
        if k.startswith(lookalike) or any(j in k for j in junk):
            continue
        v = float(r["volume"] or 0)
        d = r.get("difficulty") or ""
        if v > pool.get(k, (0, ""))[0]:
            pool[k] = (v, d)
from collections import defaultdict
byv = defaultdict(list)
for k, (v, d) in pool.items():
    if v >= 1000: byv[v].append(k)
for v, ks in byv.items():
    ks.sort(key=lambda s: len(s.split()))
    for i, k in enumerate(ks):
        if any(set(s.split()) <= set(k.split()) for s in ks[:i]): pool[k] = (0, pool[k][1])
tot = sum(v for v, d in pool.values())
def diff(d):
    try: return float(d)
    except: return None
easy = sum(v for v, d in pool.values() if diff(d) is not None and diff(d) <= 30)
nodiff = sum(v for v, d in pool.values() if diff(d) is None)
big = sorted(pool.items(), key=lambda kv: -kv[1][0])[:6]
print(f"unique phrases: {len(pool):,}; searches/mo: {int(tot):,}")
print(f"  difficulty 0-30: {int(easy):,}; no difficulty score (small phrases): {int(nodiff):,}")
print("  biggest:", "; ".join(f"{k} {int(v):,} (d{d})" for k, (v, d) in big))
for label, ctr in [("rank #1 on everything (ceiling)", 0.2002), ("average rank #2", 0.1036), ("average rank #3", 0.0389)]:
    print(f"{label:34} {int(tot*ctr):>8,} visits/mo")
print(f"{'realistic yr 1: easy + small at #3':34} {int((easy+nodiff)*0.0389):>8,} visits/mo")
top3 = sum(v for k, (v, d) in big[:3])
print(f"ceiling without the 3 biggest phrases: {int((tot-top3)*0.2002):,} visits/mo")
