"""Builds an exact-phrase keyword plan for niche industry software (software_add.json) and the 60 from taxonomy.json,
4 phrases each, grouped so each software is its own theme. Run kw_research.py on software2/plan.json afterwards."""
import json, pathlib

here = pathlib.Path(__file__).parent
add = json.load(open(here / "software_add.json"))["groups"]
base = json.load(open(here / "taxonomy.json"))["software"]
slug = lambda s: "".join(c if c.isalnum() else "_" for c in s.lower()).strip("_")[:40]
seen, themes, industry = set(), {}, {}
for grp, names in list(add.items()) + [("general business software", base)]:
    for s in names:
        k = slug(s)
        if k in seen:
            continue
        seen.add(k); industry[k] = grp
        themes[k] = {"seeds": [f"{s} ai".lower(), f"{s} ai integration".lower(), f"{s} chatgpt".lower(), f"{s} automation".lower()]}
plan = {"name": "software-ai-addons-wide", "country": "us", "language": "en", "max_cost_per_call": 0.05, "expand": False,
        "themes": themes, "facets": {}, "report": {"core_exclude_facets": []}}
(here / "software2").mkdir(exist_ok=True)
json.dump(plan, open(here / "software2" / "plan.json", "w"), indent=1)
json.dump(industry, open(here / "software2" / "industry.json", "w"), indent=1)
print("software:", len(themes), "phrases:", 4 * len(themes))
