"""Measures demand for each AI work type and each software AI add-on in taxonomy.json.
1) writes kw plans (exact phrases, no expansion) for work types and for software, 2) counts US job ads per work type
(last 90 days, free jobspipe counter, all in parallel). Run the kw plans with kw_research.py afterwards."""
import json, subprocess, csv, pathlib
from concurrent.futures import ThreadPoolExecutor

here = pathlib.Path(__file__).parent
tax = json.load(open(here / "taxonomy.json"))

def slug(s):
    return "".join(c if c.isalnum() else "_" for c in s.lower()).strip("_")[:40]

work_plan = {"name": "ai-work-types-exact", "country": "us", "language": "en", "max_cost_per_call": 0.05, "expand": False,
             "themes": {slug(n): {"seeds": search} for n, cat, search, jobs in tax["items"]},
             "facets": {}, "report": {"core_exclude_facets": []}}
(here / "work").mkdir(exist_ok=True)
json.dump(work_plan, open(here / "work" / "plan.json", "w"), indent=1)

sw_plan = {"name": "software-ai-addons", "country": "us", "language": "en", "max_cost_per_call": 0.05, "expand": False,
           "themes": {slug(s): {"seeds": [f"{s} ai".lower(), f"{s} ai integration".lower(), f"ai for {s}".lower(), f"{s} chatgpt".lower()]} for s in tax["software"]},
           "facets": {}, "report": {"core_exclude_facets": []}}
(here / "software").mkdir(exist_ok=True)
json.dump(sw_plan, open(here / "software" / "plan.json", "w"), indent=1)

def count(item):
    name, cat, search, jobs = item
    body = {"description_or": jobs, "job_country_code_or": ["US"], "posted_at_max_age_days": 7}
    try:
        out = subprocess.run(["treg", "call", "jobspipe.jobs.search.count", "--method", "POST", "--data", json.dumps(body)],
                             capture_output=True, text=True, timeout=120).stdout
        return name, cat, json.loads(out[out.index("{"):]).get("rows")
    except Exception as e:
        return name, cat, None

with ThreadPoolExecutor(max_workers=len([i for i in tax["items"] if i[3]])) as ex:
    rows = list(ex.map(count, [i for i in tax["items"] if i[3]]))
with open(here / "job_counts.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["work_type", "category", "us_job_ads_7d"])
    for r in rows:
        w.writerow(r)
print("work types:", len(rows), "with job count:", sum(1 for r in rows if r[2] is not None))
for r in sorted(rows, key=lambda r: -(r[2] or 0))[:15]:
    print(f"  {r[2]!s:>6}  {r[0]}")
