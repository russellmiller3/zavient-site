"""Second pass over the job ads: (1) employers with job count and median posted pay, for classifying industry by employer;
(2) work types counted by their core term (e.g. 'underwriting', 'fraud detection') from the 204-type list, matched as
whole phrases in title + description; (3) the most frequent 2-3 word phrases that name a kind of work, for finding gaps."""
import json, re, glob, pathlib
from collections import Counter, defaultdict

here = pathlib.Path(__file__).parent
tax = json.load(open(here.parent / "keywords/ai-work-taxonomy-11-25-2026/taxonomy.json"))
jobs = {}
for f in sorted(glob.glob(str(here / "raw/page-*.json"))):
    for j in json.load(open(f)).get("data") or []:
        jobs[j["id"]] = j
med = lambda xs: sorted(xs)[len(xs) // 2] if xs else 0
pays = defaultdict(list)
for j in jobs.values():
    pays[j.get("company") or "?"].append(j.get("min_annual_salary_usd") or 0)
json.dump({c: [len(v), med(v)] for c, v in pays.items()}, open(here / "employers.json", "w"), indent=0)
print("EMPLOYERS (jobs, median min pay), top 70:")
print("; ".join(f"{c} {len(v)} ${med(v)//1000}k" for c, v in sorted(pays.items(), key=lambda kv: -len(kv[1]))[:70]))

generic = r"\b(ai|a\.i\.|artificial intelligence|machine learning|ml|software|automation|automated|platform|model|models|analytics|tools?|services|companies|for business|for)\b"
core = {}
for name, cat, search, _ in tax["items"]:
    terms = set()
    for s in search:
        c = re.sub(r"\s+", " ", re.sub(generic, " ", s.lower())).strip()
        if len(c) >= 5 and len(c.split()) >= 1 and c not in ("ai", "in"):
            terms.add(c)
    core[name] = (cat, terms)
cnt, cpay, ex = Counter(), defaultdict(list), {}
for j in jobs.values():
    text = ((j.get("job_title") or "") + " " + (j.get("description") or "")).lower()
    for name, (cat, terms) in core.items():
        hit = next((t for t in terms if re.search(r"(?<![a-z])" + re.escape(t) + r"(?![a-z])", text)), None)
        if hit:
            cnt[name] += 1; cpay[name].append(j.get("min_annual_salary_usd") or 0); ex.setdefault(name, hit)
print("\nWORK TYPES named in the ads (jobs, median min pay, matched term):")
for n, c in cnt.most_common(60):
    print(f"  {c:>4}  ${med(cpay[n])//1000:>4}k  {n}  [{ex[n]}]")
print("never named:", ", ".join(n for n in core if n not in cnt))

ph = json.load(open(here / "phrases.json"))
workish = re.compile(r"(detection|prediction|forecast|scoring|optimization|recommend|ranking|search|retrieval|extraction|classification|segmentation|pricing|underwriting|matching|generation|evaluation|agents?\b|agentic|reasoning|vision|speech|translation|summariz|personaliz|routing|scheduling|simulation|planning|monitoring|risk|fraud|safety|alignment|inference|training|fine-tun|post-training|reinforcement|rag\b|embedding|ads|bidding|attribution)")
print("\nFREQUENT WORK PHRASES (ads containing):")
print("; ".join(f"{p} {n}" for p, n in ph if workish.search(p) and n >= 15)[:4000])
