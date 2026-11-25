"""Merges an add-on list (argv[1]) into taxonomy.json and rewrites work/plan.json (exact phrases, no expansion)."""
import json, sys, pathlib

here = pathlib.Path(__file__).parent
t = json.load(open(here / "taxonomy.json"))
add = json.load(open(here / sys.argv[1]))
names = {i[0] for i in t["items"]}
t["items"] += [x for x in add if x[0] not in names]
json.dump(t, open(here / "taxonomy.json", "w"), indent=1)
slug = lambda s: "".join(c if c.isalnum() else "_" for c in s.lower()).strip("_")[:40]
plan = {"name": "ai-work-types-exact", "country": "us", "language": "en", "max_cost_per_call": 0.05, "expand": False,
        "themes": {slug(n): {"seeds": search} for n, cat, search, jobs in t["items"]}, "facets": {}, "report": {"core_exclude_facets": []}}
json.dump(plan, open(here / "work" / "plan.json", "w"), indent=1)
print("work types:", len(t["items"]))
