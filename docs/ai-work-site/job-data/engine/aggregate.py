"""Turns the free count sweep (results-*.jsonl) plus the paid sample database into chart data.
Shares are computed inside one 30-day window, never across windows, because JobsPipe's coverage grows month to month.
Usage: python3 aggregate.py RUN_DIR DB_PATH OUT.json"""
import json, glob, sys, pathlib, sqlite3, statistics, collections

HERE = pathlib.Path(__file__).parent
WIN = {"w2": "28 Aug to 26 Sep 2026", "w1": "27 Sep to 26 Oct 2026", "w0": "27 Oct to 25 Nov 2026"}
MIN_VOL = 150   # a term needs this many ads in the latest window to be charted


def load(run):
    r = {}
    for f in glob.glob(str(pathlib.Path(run) / "results-*.jsonl")):
        for l in open(f):
            x = json.loads(l)
            if x.get("error") is None and x.get("rows") is not None and not x.get("capped_window") and not x.get("capped"):
                r[x["id"]] = x
    return r


def duty_share(db):
    """Of ICP-band ads that mention AI, the share where the hire must use AI (not hiring disclosure or the employer's pitch).
    Direct employers only. From the hand-checked labels (37 of 40 right)."""
    con = sqlite3.connect(db)
    out = {}
    for fn, lab, n in con.execute("SELECT job_function, ai_label, count(*) FROM ads WHERE employer_type='employer' GROUP BY 1,2"):
        out.setdefault(fn, collections.Counter())[lab] = n
    tot = sum(sum(c.values()) for c in out.values()); duty = sum(c["duty"] for c in out.values())
    return {fn: (c["duty"] / sum(c.values()), sum(c.values())) for fn, c in out.items()}, duty / tot


def main(run, db, out):
    r = load(run)
    q = {o["label"]: o for o in json.loads((HERE / "queries.json").read_text())["queries"]}
    g = lambda i: r.get(i, {}).get("rows")
    duty, duty_all = duty_share(db)

    # 1. ICP band: share of ads that mention AI, by job function, three windows; and the duty-adjusted share
    fns = sorted({i.split("|")[1].split(":", 1)[1] for i in r if i.startswith("icp|fn_total:")})
    by_fn = []
    for fn in fns:
        row = {"function": fn}
        for w in WIN:
            a, t = g(f"icp|fn_ai:{fn}|{w}"), g(f"icp|fn_total:{fn}|{w}")
            row[w] = round(100 * a / t, 1) if a and t else None
        d, n = duty.get(fn, (duty_all, 0))
        row["duty_share_sample"] = round(d, 2); row["sample_n"] = n
        row["uses_ai_w0"] = round(row["w0"] * (d if n >= 20 else duty_all), 1) if row["w0"] else None
        row["ads_w0"] = g(f"icp|fn_total:{fn}|w0")
        by_fn.append(row)
    by_fn.sort(key=lambda x: -(x["uses_ai_w0"] or 0))

    # 1b. Overall ICP share = sum of AI ads / sum of all ads, over functions counted in every window (so the mix is the same)
    full = [f for f in fns if all(g(f"icp|fn_ai:{f}|{w}") and g(f"icp|fn_total:{f}|{w}") for w in WIN)]
    icp_share = {w: round(100 * sum(g(f"icp|fn_ai:{f}|{w}") for f in full) / sum(g(f"icp|fn_total:{f}|{w}") for f in full), 1) for w in WIN}
    icp_share["functions_used"] = len(full)
    # 1c. Same by industry
    inds = sorted({i.split("|")[1].split(":", 1)[1] for i in r if i.startswith("icp|ind_total:")})
    by_ind = []
    for ind in inds:
        row = {"industry": ind}
        for w in WIN:
            a, t = g(f"icp|ind_ai:{ind}|{w}"), g(f"icp|ind_total:{ind}|{w}")
            row[w] = round(100 * a / t, 1) if a and t else None
        row["ads_w0"] = g(f"icp|ind_total:{ind}|w0")
        by_ind.append(row)
    by_ind.sort(key=lambda x: -(x["w0"] or 0))

    # 2. Models: share of voice among model mentions in builder jobs (engineering, data, IT, science), each window.
    #    Builder jobs only, because short names collide elsewhere (PHI in health ads, CrowdStrike Falcon in security ads).
    # Phi and Falcon are left out: their short names match PHI (health data) and CrowdStrike Falcon far more often than the models
    models = [l for l, o in q.items() if o["group"] == "model" and not o["source"].startswith("keyword") and l not in {"Microsoft Phi", "Falcon"}]
    pre = "builder" if any(i.startswith("builder|model:") for i in r) else "us"
    sov = []
    for w in WIN:
        tot = sum(g(f"{pre}|model:{m}|{w}") or 0 for m in models)
        for m in models:
            v = g(f"{pre}|model:{m}|{w}")
            if v and tot:
                sov.append({"model": m, "window": w, "ads": v, "share": round(100 * v / tot, 2), "open_weight": q[m].get("open_weight"),
                            "count_kind": q[m].get("count_kind")})
    open_rank = sorted([s for s in sov if s["window"] == "w0" and s["open_weight"]], key=lambda s: -s["ads"])

    # 3. Rising AI work: growth from w1 to w0, divided by the median growth of every term, so coverage growth cancels out
    grow = {}
    for l, o in q.items():
        if o["group"] not in {"work", "augmentation"} or o.get("count_kind") == "unreliable":
            continue
        a, b = g(f"us|{o['group']}:{l}|w0"), g(f"us|{o['group']}:{l}|w1")
        if a and b and a >= MIN_VOL:
            grow[l] = (a / b, a, b, o.get("category"), o.get("count_kind"), o["group"])
    med = statistics.median(v[0] for v in grow.values()) if grow else None
    rising = sorted([{"term": l, "relative_growth": round(v[0] / med, 2), "ads_w0": v[1], "ads_w1": v[2], "category": v[3],
                      "count_kind": v[4], "group": v[5]} for l, v in grow.items()], key=lambda x: -x["relative_growth"])

    # 4. Pay from the paid database: median posted midpoint by industry and by work type (direct employers, AI-duty ads)
    con = sqlite3.connect(db)
    def med_pay(sql):
        rows = collections.defaultdict(list)
        for k, lo, hi in con.execute(sql):
            if lo and lo > 20000:
                rows[k].append((lo + (hi or lo)) / 2)
        return sorted([{"group": k, "n": len(v), "median_pay": int(statistics.median(v))} for k, v in rows.items() if len(v) >= 5],
                      key=lambda x: -x["median_pay"])
    base = "FROM ads WHERE salary_posted=1 AND employer_type='employer' AND ai_label='duty'"
    pay_ind = med_pay(f"SELECT industry, salary_min_usd, salary_max_usd {base}")
    pay_fn = med_pay(f"SELECT job_function, salary_min_usd, salary_max_usd {base}")
    pay_wt = med_pay(f"SELECT w.work_type, salary_min_usd, salary_max_usd FROM ads a JOIN ad_work_types w USING(ad_key) "
                     f"WHERE salary_posted=1 AND employer_type='employer' AND ai_label='duty'")

    doc = {"built": "2026-11-26", "windows": WIN, "source": "JobsPipe job-ad counts and full ads, via treg; US; ICP band = 40 to 500 staff",
           "icp_all_ai_share": icp_share, "by_industry": by_ind,
           "duty_share_all": round(duty_all, 2), "by_function": by_fn, "model_share": sov, "open_weight_rank_w0": open_rank,
           "rising_work": rising, "median_growth": med, "pay_by_industry": pay_ind, "pay_by_function": pay_fn, "pay_by_work_type": pay_wt,
           "coverage": {"count_jobs_done": len(r)}}
    pathlib.Path(out).write_text(json.dumps(doc, indent=1))
    print(json.dumps({k: doc[k] for k in ["icp_all_ai_share", "duty_share_all", "coverage"]}))
    for x in by_fn: print(x)
    for x in by_ind: print(x)
    print("open", [(s["model"], s["ads"], s["share"]) for s in open_rank])
    print("rising", [(x["term"], x["relative_growth"], x["ads_w0"]) for x in rising[:15]])
    print("pay ind", pay_ind[:12]); print("pay fn", pay_fn); print("pay wt", pay_wt)


if __name__ == "__main__":
    main(*sys.argv[1:4])
