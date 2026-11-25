"""Mines the pulled AI/ML job ads: pay, employers, industries, types of work, software named, and frequent phrases
(to spot work types missing from our list). Work-type and industry rules come from the keyword grid (matrix.json);
software names from the 330-product list. Writes jobs.csv and prints the summaries."""
import json, re, csv, glob, pathlib
from collections import Counter, defaultdict

here = pathlib.Path(__file__).parent
kw = here.parent / "keywords"
grid = json.load(open(kw / "ai-work-by-industry-11-25-2026/matrix.json"))
rows_rx = [(k, re.compile(v, re.I)) for k, v in grid["rows"].items()]
cols_rx = [(k, re.compile(v, re.I)) for k, v in grid["cols"].items()]
extra_ind = {"defense and government": r"defen[cs]e|clearance|DoD|federal|government|intelligence community",
             "big tech and AI labs": r"frontier (model|lab)|foundation model|pre-?training|post-?training|RLHF|large-scale training",
             "trading and hedge funds": r"hedge fund|quant(itative)? (trading|research)|market making|alpha|systematic trading",
             "autonomy and robotics": r"autonomous (vehicle|driving|systems)|robot|perception stack|lidar",
             "advertising and marketplaces": r"ads ranking|ad tech|advertis|marketplace|search ranking|recommend"}
cols_rx += [(k, re.compile(v, re.I)) for k, v in extra_ind.items()]
sw_groups = json.load(open(kw / "ai-work-taxonomy-11-25-2026/software_add.json"))["groups"]
sw_names = sorted({s for g in sw_groups.values() for s in g} | set(json.load(open(kw / "ai-work-taxonomy-11-25-2026/taxonomy.json"))["software"]), key=len, reverse=True)
sw_rx = [(s, re.compile(r"(?<![A-Za-z])" + re.escape(s) + r"(?![A-Za-z])")) for s in sw_names if len(s) > 3]

jobs = {}
for f in sorted(glob.glob(str(here / "raw/page-*.json"))):
    for j in json.load(open(f)).get("data") or []:
        jobs[j["id"]] = j
stop = set("the a an and or of to in for with on at by from as is are be we you our your will this that it its their they who have has can all any into across through within about more most new other such using use including team teams work working role roles experience years strong ability skills".split())

def phrases(text):
    w = [x for x in re.findall(r"[a-z][a-z\-]+", text.lower())]
    for n in (2, 3):
        for i in range(len(w) - n + 1):
            g = w[i:i + n]
            if g[0] in stop or g[-1] in stop:
                continue
            yield " ".join(g)

pay, emp, ind_n, ind_pay, work_n, work_pay, sw_n, tech_n, ph = [], Counter(), Counter(), defaultdict(list), Counter(), defaultdict(list), Counter(), Counter(), Counter()
out = []
for j in jobs.values():
    d = (j.get("description") or "")
    t = j.get("job_title") or ""
    s = j.get("min_annual_salary_usd") or 0
    pay.append(s); emp[j.get("company") or "?"] += 1
    text = t + "\n" + d
    inds = [k for k, rx in cols_rx if rx.search(text)] or ["not stated"]
    works = [k for k, rx in rows_rx if rx.search(text)]
    sws = [n for n, rx in sw_rx if rx.search(d)]
    for k in set(inds): ind_n[k] += 1; ind_pay[k].append(s)
    for k in set(works): work_n[k] += 1; work_pay[k].append(s)
    for n in set(sws): sw_n[n] += 1
    for tch in j.get("technology_slugs") or []: tech_n[tch] += 1
    for p in set(phrases(d)): ph[p] += 1
    out.append([t, j.get("company"), s, "; ".join(sorted(set(inds))), "; ".join(sorted(set(works))), "; ".join(sws), j.get("url")])
with open(here / "jobs.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["title", "company", "min_pay_usd", "industries", "work_types", "software", "url"]); w.writerows(sorted(out, key=lambda r: -(r[2] or 0)))
med = lambda xs: sorted(xs)[len(xs) // 2] if xs else 0
print(f"jobs: {len(jobs)}; median min pay ${med(pay):,.0f}; top pay ${max(pay):,.0f}; companies {len(emp)}")
print("top employers:", "; ".join(f"{c} {n}" for c, n in emp.most_common(15)))
print("\nINDUSTRIES (jobs, median min pay):")
for k, n in ind_n.most_common(): print(f"  {n:>4}  ${med(ind_pay[k]):>9,.0f}  {k}")
print("\nTYPES OF WORK (jobs, median min pay):")
for k, n in work_n.most_common(): print(f"  {n:>4}  ${med(work_pay[k]):>9,.0f}  {k}")
print("\nSOFTWARE NAMED (from our list):", "; ".join(f"{n} {c}" for n, c in sw_n.most_common(30)))
print("\nTECH TAGS:", "; ".join(f"{n} {c}" for n, c in tech_n.most_common(40)))
json.dump(ph.most_common(1500), open(here / "phrases.json", "w"))
