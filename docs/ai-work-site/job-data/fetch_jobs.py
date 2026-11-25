"""Pulls the highest-paying US AI/ML job ads (posted pay >= $250k, last 30 days) from jobspipe via treg, 100 per page,
following the cursor, and saves each page in raw/. Stops at MAX jobs. About $0.002-$0.004 per job."""
import json, subprocess, pathlib, sys

here = pathlib.Path(__file__).parent
MAX = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
body = {"job_title_or": ["machine learning", "artificial intelligence", "ai engineer", "data scientist", "ml engineer",
                         "applied scientist", "ai architect", "head of ai", "ai research", "llm", "generative ai", "mlops", "deep learning",
                         "computer vision", "nlp", "quantitative researcher"],
        "job_country_code_or": ["US"], "min_salary_usd": 250000, "posted_at_max_age_days": 30, "limit": 100}
got, page, cursor = 0, 0, None
while got < MAX:
    b = dict(body)
    if cursor:
        b["cursor"] = cursor
    out = subprocess.run(["treg", "call", "jobspipe.jobs.search", "--method", "POST", "--data", json.dumps(b)],
                         capture_output=True, text=True, timeout=300).stdout
    d = json.loads(out[out.index("{"):])
    rows = d.get("data") or []
    (here / "raw" / f"page-{page:03d}.json").write_text(json.dumps(d))
    got += len(rows); page += 1
    cursor = (d.get("metadata") or {}).get("next_cursor")
    print(f"page {page}: {len(rows)} jobs, total {got}, credits charged {(d.get('metadata') or {}).get('credits_charged')}")
    if not rows or not cursor:
        break
