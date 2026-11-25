"""Exact-match analysis of one pull of ads (default: the 25 Nov 2026 sample): drops reposts (same company + same title),
then counts ads AND distinct employers per AI job title, per AI model or platform named in the description, and median
posted pay per title (ads that post a yearly minimum between $40k and $2M). Writes stories.json for the site's data
pages. The word patterns live in terms.py, shared with mentions.py (the monthly trend store).
Usage: python3 analyze_sample.py [pull-folder]"""
import json, re, glob, pathlib, statistics, sys
from collections import defaultdict
from terms import TITLE, MODEL, PLATFORM, MAKER, dedupe

here = pathlib.Path(__file__).parent
folder = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path.home() / "Desktop/Personal/Consulting/research/jobs-ai-ml-11-25-2026/sample"
raw = {}
for f in sorted(glob.glob(str(folder / "page-*.json"))):
    for j in json.load(open(f)).get("data") or []:
        raw[j["id"]] = j
ads = dedupe(raw.values())


def tally(rx_map, field):
    out = {}
    for name, rx in rx_map.items():
        r = re.compile(rx, re.I)
        own = MAKER.get(name)
        hit = [a for a in ads if r.search((a.get(field) or "")) and not (own and (a.get("company") or "").lower().startswith(own))]
        out[name] = {"ads": len(hit), "employers": len({(a.get("company") or "").lower() for a in hit})}
    return out


titles, pay = defaultdict(list), defaultdict(list)
for a in ads:
    t = a.get("job_title") or ""
    for name, rx in TITLE.items():
        if re.search(rx, t, re.I):
            titles[name].append(a)
            s = a.get("min_annual_salary_usd")
            if s and 40_000 <= s <= 2_000_000:
                pay[name].append(s)
            break
title_out = {n: {"ads": len(v), "employers": len({(a.get('company') or '').lower() for a in v}),
                 "pay_n": len(pay[n]), "pay_median": int(statistics.median(pay[n])) if pay[n] else None} for n, v in titles.items()}
posted = sorted((a.get("date_posted") or "")[:10] for a in ads if a.get("date_posted"))
stories = {"date": "2026-11-25", "sample": {"pulled": len(raw), "after_reposts_removed": len(ads),
           "employers": len({(a.get('company') or '').lower() for a in ads}), "window": f"US ads posted {posted[0]} to {posted[-1]}"},
           "titles": title_out, "models": tally(MODEL, "description"), "platforms": tally(PLATFORM, "description"),
           "prompt_engineering": {"as_skill": tally({"skill": r"prompt engineering"}, "description")["skill"],
                                  "as_title": tally({"title": r"prompt engineer"}, "job_title")["title"]}}
(here / "stories.json").write_text(json.dumps(stories, indent=1))
print(json.dumps(stories, indent=1))
