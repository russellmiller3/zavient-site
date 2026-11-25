"""The trend store for what AI job ads mention. Each pull of ads (fetch_sample.py: the newest US AI/ML ads, up to
3,000) is one window; monthly pulls build the timeline. For every window this recounts, with the current patterns in
terms.py, how many distinct employers name each AI model, platform and kind of work, and which general skills (the
ESCO skills list) and technologies the job-data provider tagged on the ads.

Records go through the shared Logger (~/Desktop/code/Logger, loaded via ~/Desktop/code/runner): one 'ad_mentions'
event per ad, in mentions/ads/<pull date>/ (ignored by git: per-ad data stays on this Mac).
The summary per window goes to mentions/windows.json (committed; it feeds the site's data stories).

Usage: python3 mentions.py            (reads mentions/pulls.json: [{"date": "YYYY-MM-DD", "folder": "~/..."}])
       python3 mentions.py --add 2026-12-25 ~/path/to/pull-folder   (registers a new pull, then recounts all)"""
import json, re, glob, pathlib, shutil, sys
from collections import defaultdict
from terms import GROUPS, MAKER, TERMS_VERSION, dedupe

COMPILED = {g: {n: re.compile(rx, re.I) for n, rx in m.items()} for g, m in GROUPS.items()}


def matches(ad):
    """The model, platform and work names an ad's description mentions; a maker's own ads never count for itself."""
    text, company = ad.get("description") or "", (ad.get("company") or "").lower()
    return {g: [n for n, r in m.items() if r.search(text) and not (MAKER.get(n) and company.startswith(MAKER[n]))]
            for g, m in COMPILED.items()}


def count_window(raw_ads, pulled, log=None):
    """One window's summary from the raw ads of one pull, counted by distinct employer after reposts are removed."""
    ads = dedupe(raw_ads)
    by_term, skill_emp, tech_emp, posted = defaultdict(set), defaultdict(set), defaultdict(set), []
    for a in ads:
        co = (a.get("company") or "").lower()
        hit = matches(a)
        skills = sorted({s["label"] for s in (a.get("esco_skills") or []) if isinstance(s, dict) and s.get("label")})
        tech = sorted(set(a.get("technology_slugs") or []))
        day = (a.get("date_posted") or "")[:10]
        posted += [day] if day else []
        if log:
            log.info("ad_mentions", {"pull": pulled, "id": a.get("id"), "posted": day, "company": a.get("company"),
                                     "title": a.get("job_title"), "models": hit["model"], "platforms": hit["platform"],
                                     "work": hit["work"], "skills": skills, "tech": tech})
        for g, names in hit.items():
            for n in names:
                by_term[(g, n)].add(co)
        for s in skills:
            skill_emp[s].add(co)
        for t in tech:
            tech_emp[t].add(co)
    employers = len({(a.get("company") or "").lower() for a in ads})
    share = lambda n: round(100 * n / employers, 1) if employers else 0.0
    posted.sort()
    top = lambda d, key: [{key: k, "employers": len(e), "share_of_employers": share(len(e))}
                          for k, e in sorted(d.items(), key=lambda x: (-len(x[1]), x[0]))[:40]]
    return {"pulled": pulled, "posted_from": posted[0] if posted else None, "posted_to": posted[-1] if posted else None,
            "ads_pulled": len(list(raw_ads)) if not isinstance(raw_ads, list) else len(raw_ads), "ads": len(ads),
            "employers": employers,
            "terms": {g: {n: {"employers": len(by_term[(g, n)]), "share_of_employers": share(len(by_term[(g, n)]))}
                          for n in m} for g, m in GROUPS.items()},
            "top_skills": top(skill_emp, "skill"), "top_tech": top(tech_emp, "tech")}


def main(argv):
    sys.path.insert(0, str(pathlib.Path.home() / "Desktop/code/runner"))
    from experiment_telemetry import load_shared_logger
    create_logger, create_run_file_sink = load_shared_logger()
    store = pathlib.Path(__file__).parent / "mentions"
    store.mkdir(exist_ok=True)
    reg_path = store / "pulls.json"
    pulls = json.loads(reg_path.read_text()) if reg_path.exists() else []
    if len(argv) == 3 and argv[0] == "--add":
        home = str(pathlib.Path.home())
        folder = str(pathlib.Path(argv[2]).expanduser().resolve()).replace(home, "~", 1)
        pulls = sorted([p for p in pulls if p["date"] != argv[1]] + [{"date": argv[1], "folder": folder}], key=lambda p: p["date"])
        reg_path.write_text(json.dumps(pulls, indent=1) + "\n")
    windows = []
    for p in pulls:
        files = sorted(glob.glob(str(pathlib.Path(p["folder"]).expanduser() / "page-*.json")))
        if not files:
            sys.exit(f"pull {p['date']}: no page-*.json files in {p['folder']}")
        raw = list({j["id"]: j for f in files for j in (json.load(open(f)).get("data") or [])}.values())
        log_dir = store / "ads" / p["date"]
        shutil.rmtree(log_dir, ignore_errors=True)  # a recount replaces this pull's old records
        log = create_logger("zavient-job-mentions", write=create_run_file_sink(log_dir, f"terms-v{TERMS_VERSION}").write)
        windows.append(count_window(raw, p["date"], log))
    summary = {"terms_version": TERMS_VERSION, "unit": "distinct employers; makers' own ads left out of their own model's count",
               "windows": windows}
    (store / "windows.json").write_text(json.dumps(summary, indent=1) + "\n")
    for w in windows:
        m = w["terms"]["model"]
        print(w["pulled"], f"posted {w['posted_from']} to {w['posted_to']};", w["ads"], "ads,", w["employers"], "employers;",
              "Claude", m["Anthropic / Claude"]["employers"], "OpenAI", m["OpenAI / GPT"]["employers"])


if __name__ == "__main__":
    main(sys.argv[1:])
