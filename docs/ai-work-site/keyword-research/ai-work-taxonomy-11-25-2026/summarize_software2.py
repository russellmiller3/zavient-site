"""Counts software AI add-on pages worth building from software2/keywords.csv, by industry group.
Two bars: standard (100+ searches/mo, or 30+ at $20+/click) and niche (20+ searches/mo, or 10+ at $20+/click).
AI-only totals leave out the '<name> automation' phrase, which also catches non-AI demand."""
import csv, json, pathlib
from collections import defaultdict

here = pathlib.Path(__file__).parent
ind = json.load(open(here / "software2" / "industry.json"))
agg = defaultdict(lambda: {"vol": 0, "val": 0.0, "ai_vol": 0, "ai_val": 0.0, "top": ("", 0)})
for r in csv.DictReader(open(here / "software2" / "keywords.csv")):
    v, c = float(r["volume"] or 0), float(r["cpc"] or 0)
    a = agg[r["theme"]]; a["vol"] += v; a["val"] += v * c
    if not r["keyword"].endswith(" automation"):
        a["ai_vol"] += v; a["ai_val"] += v * c
        if v > a["top"][1]: a["top"] = (r["keyword"], v)

def ok(vol, val, lo, cpc_lo_vol):
    cpc = val / vol if vol else 0
    return vol >= lo or (vol >= cpc_lo_vol and cpc >= 20)

rows = []
for k, a in agg.items():
    rows.append([k, ind.get(k, ""), int(a["ai_vol"]), round(a["ai_val"] / a["ai_vol"], 2) if a["ai_vol"] else 0, int(a["vol"]),
                 ok(a["ai_vol"], a["ai_val"], 100, 30), ok(a["ai_vol"], a["ai_val"], 20, 10), a["top"][0]])
rows.sort(key=lambda r: -r[2])
with open(here / "software2_ranked.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["software", "industry", "ai_searches_mo", "avg_cpc", "searches_incl_automation", "standard_bar", "niche_bar", "top_ai_phrase"]); w.writerows(rows)
print(f"software measured: {len(rows)}; standard bar: {sum(r[5] for r in rows)}; niche bar: {sum(r[6] for r in rows)}; any AI search at all: {sum(1 for r in rows if r[2] > 0)}")
g = defaultdict(lambda: [0, 0, 0])
for r in rows:
    g[r[1]][0] += 1; g[r[1]][1] += r[5]; g[r[1]][2] += r[6]
for k, (n, s, nn) in sorted(g.items(), key=lambda kv: -kv[1][2]):
    print(f"  {k:34} {s:>3} std  {nn:>3} niche  of {n}")
print("top 25 by AI searches:")
for r in rows[:25]:
    print(f"  {r[2]:>6,}/mo ${r[3]:>6}  {r[0]}  [{r[7]}]")
