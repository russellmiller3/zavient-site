"""Turns queries.json into the list of free JobsPipe count calls for one run (count_jobs.jsonl), sharded for parallel
runners. Each job is one jobspipe.jobs.search.count body. A count of exactly 10,000 is the provider's cap: the runner
halves the date window until each part is under it, then sums.
Windows are 30 days ending on RUN_END. Shares inside one window are robust to JobsPipe's growing coverage (its index
roughly doubled between Sep and Nov 2026, measured with a fixed term), so trends compare shares, never raw counts.
Usage: python3 plan_counts.py 2026-11-25 OUTDIR SHARDS"""
import json, pathlib, sys, datetime as dt

end = dt.date.fromisoformat(sys.argv[1]); out = pathlib.Path(sys.argv[2]); shards = int(sys.argv[3])
out.mkdir(parents=True, exist_ok=True)
W = [(end - dt.timedelta(days=29 + 30 * i), end - dt.timedelta(days=30 * i)) for i in range(3)]
doc = json.loads((pathlib.Path(__file__).parent / "queries.json").read_text())
US = {"job_country_code_or": ["US"], "status": "any"}
ICP = {"min_employee_count": 40, "max_employee_count": 500}
ANY_AI = ["artificial intelligence", "generative ai", "machine learning", "ai tools", "ai-powered", "chatgpt", "llm",
          "copilot ai", "ai agents", "ai-assisted", "ai-enabled", "ai literacy", "ai fluency", "prompt engineering"]
jobs = []


def add(jid, body, wi):
    a, b = W[wi]
    jobs.append({"id": f"{jid}|w{wi}", "window": [a.isoformat(), b.isoformat()],
                 "body": {**US, **body, "posted_at_gte": a.isoformat(), "posted_at_lte": b.isoformat()}})


for i, q in enumerate(doc["queries"]):
    key = f"{q['group']}:{q['label']}"
    body = {"job_title_or": q["title_query"]} if "title_query" in q else {"description_or": q["query"]}
    wins = {"model": [0, 1, 2], "work": [0, 1], "augmentation": [0, 1, 2], "role": [0, 1]}.get(q["group"], [0])
    for wi in wins:
        add(f"us|{key}", body, wi)
        if q["group"] in ("model", "augmentation", "role"):
            add(f"icp|{key}", {**body, **ICP}, wi)
for f in doc["functions"]:
    for wi in range(3):
        add(f"icp|fn_total:{f}", {"job_function_or": [f], **ICP}, wi)
        add(f"icp|fn_ai:{f}", {"job_function_or": [f], "description_or": ANY_AI, **ICP}, wi)
for name, divs in doc["industries"].items():
    for wi in range(3):
        add(f"icp|ind_total:{name}", {"isic_division_or": divs, **ICP}, wi)
        add(f"icp|ind_ai:{name}", {"isic_division_or": divs, "description_or": ANY_AI, **ICP}, wi)
for wi in range(3):
    add("icp|all_ai", {"description_or": ANY_AI, **ICP}, wi)
for n in range(shards):
    (out / f"jobs-{n}.jsonl").write_text("".join(json.dumps(j) + "\n" for j in jobs[n::shards]))
json.dump({"any_ai": ANY_AI, "windows": [[a.isoformat(), b.isoformat()] for a, b in W], "jobs": len(jobs)},
          open(out / "plan.json", "w"), indent=1)
print(len(jobs), "jobs in", shards, "shards")
