"""Builds an exact-phrase plan for popular AI software (ai_software_list.json): pricing, alternatives and review per product.
Run kw_research.py on aisw/plan.json afterwards, then this script with --summary to count pages and searches by group."""
import json, csv, sys, pathlib
from collections import defaultdict

here = pathlib.Path(__file__).parent
groups = json.load(open(here / "ai_software_list.json"))["groups"]
slug = lambda s: "".join(c if c.isalnum() else "_" for c in s.lower()).strip("_")[:40]
if "--summary" not in sys.argv:
    themes, grp = {}, {}
    for g, names in groups.items():
        for n in names:
            k = slug(n)
            if k in themes:
                continue
            grp[k] = g
            themes[k] = {"seeds": [f"{n} pricing".lower(), f"{n} alternatives".lower(), f"{n} review".lower()]}
    (here / "aisw").mkdir(exist_ok=True)
    json.dump({"name": "ai-software", "country": "us", "language": "en", "max_cost_per_call": 0.05, "expand": False,
               "themes": themes, "facets": {}, "report": {"core_exclude_facets": []}}, open(here / "aisw/plan.json", "w"), indent=1)
    json.dump(grp, open(here / "aisw/group.json", "w"), indent=1)
    print("products:", len(themes), "phrases:", 3 * len(themes))
else:
    grp = json.load(open(here / "aisw/group.json"))
    prod = defaultdict(lambda: [0.0, 0.0])
    for r in csv.DictReader(open(here / "aisw/keywords.csv")):
        v, c = float(r["volume"] or 0), float(r["cpc"] or 0)
        prod[r["theme"]][0] += v; prod[r["theme"]][1] += v * c
    g = defaultdict(lambda: [0, 0, 0.0])
    for p, (v, val) in prod.items():
        x = g[grp.get(p, "?")]; x[0] += v; x[1] += 1 if (v >= 100 or (v >= 30 and val / v >= 20)) else 0; x[2] += val
    tot = sum(v for v, _ in prod.values())
    print(f"products: {len(prod)}; searches/mo: {int(tot):,}; page-worthy products: {sum(x[1] for x in g.values())}")
    for k, (v, n, val) in sorted(g.items(), key=lambda kv: -kv[1][0]):
        print(f"  {int(v):>8,}/mo  {n:>3} worth a page  avg ${val / v if v else 0:5.2f}  {k}")
    print("top 15:", "; ".join(f"{p} {int(v):,}" for p, (v, _) in sorted(prod.items(), key=lambda kv: -kv[1][0])[:15]))
