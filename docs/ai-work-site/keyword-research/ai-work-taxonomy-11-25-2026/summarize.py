"""Totals search demand per AI work type and per software AI add-on, and counts how many pages clear the bar.
Bar for a page: 100+ US searches a month across its phrases, or 30+ searches at $20+ average per click."""
import csv, json, pathlib
from collections import defaultdict

here = pathlib.Path(__file__).parent
tax = json.load(open(here / "taxonomy.json"))
slug = lambda s: "".join(c if c.isalnum() else "_" for c in s.lower()).strip("_")[:40]
names = {slug(n): (n, cat) for n, cat, _, _ in tax["items"]}
jobs = {r["work_type"]: r["us_job_ads_7d"] for r in csv.DictReader(open(here / "job_counts.csv"))}

def totals(path):
    agg = defaultdict(lambda: {"vol": 0, "val": 0.0, "top": ("", 0)})
    for r in csv.DictReader(open(path)):
        v = float(r["volume"] or 0); c = float(r["cpc"] or 0); a = agg[r["theme"]]
        a["vol"] += v; a["val"] += v * c
        if v > a["top"][1]: a["top"] = (r["keyword"], v)
    return agg

def clears(a):
    cpc = a["val"] / a["vol"] if a["vol"] else 0
    return a["vol"] >= 100 or (a["vol"] >= 30 and cpc >= 20)

work = totals(here / "work" / "keywords.csv")
rows = []
for t, a in work.items():
    n, cat = names.get(t, (t, ""))
    rows.append([n, cat, int(a["vol"]), round(a["val"] / a["vol"], 2) if a["vol"] else 0, jobs.get(n, ""), a["top"][0], clears(a)])
rows.sort(key=lambda r: -(r[2] * r[3]))
with open(here / "work_types_ranked.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["work_type", "category", "searches_mo", "avg_cpc", "job_ads_7d_rough", "top_phrase", "page_worthy"]); w.writerows(rows)

sw = totals(here / "software" / "keywords.csv")
srows = sorted([[t, int(a["vol"]), round(a["val"] / a["vol"], 2) if a["vol"] else 0, a["top"][0], clears(a)] for t, a in sw.items()], key=lambda r: -r[1])
with open(here / "software_ranked.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["software", "searches_mo", "avg_cpc", "top_phrase", "page_worthy"]); w.writerows(srows)

cats = defaultdict(lambda: [0, 0])
for r in rows:
    cats[r[1]][0] += 1; cats[r[1]][1] += r[6]
print(f"WORK TYPES: {len(rows)} measured, {sum(r[6] for r in rows)} page-worthy")
for c, (n, ok) in sorted(cats.items(), key=lambda kv: -kv[1][1]):
    print(f"  {c:26} {ok}/{n}")
print("TOP 20 by searches x $/click:")
for r in rows[:20]:
    print(f"  {r[2]:>7,}/mo  ${r[3]:>6}  jobs~{r[4]!s:>5}  {r[0]}  [{r[5]}]")
print("NOT page-worthy:", ", ".join(r[0] for r in rows if not r[6]))
print(f"\nSOFTWARE: {len(srows)} measured, {sum(r[4] for r in srows)} page-worthy")
for r in srows[:25]:
    print(f"  {r[1]:>7,}/mo  ${r[2]:>6}  {r[0]}  [{r[3]}]")
print("NOT page-worthy:", ", ".join(r[0] for r in srows if not r[4]))
