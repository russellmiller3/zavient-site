"""Pulls one monthly snapshot of US AI/ML job ads: the newest MAX ads (default 3,000), newest first, 100 per page,
following the cursor. The search allows ads up to 30 days old, but 3,000 ads reach back only about 5 days (25 Nov 2026
pull: posted 21-25 Nov), so each snapshot is a few days of ads; mentions.py records the exact posted range.
Costs about $0.002-$0.004 per ad (about $6-$12 a snapshot) through treg. Keeps every page in OUT (private, not git).
Usage: python3 fetch_sample.py OUT [MAX]      then: python3 mentions.py --add <today> OUT"""
import json, subprocess, pathlib, sys

if len(sys.argv) < 2:
    sys.exit(__doc__)
out_dir = pathlib.Path(sys.argv[1]).expanduser()
out_dir.mkdir(parents=True, exist_ok=True)
MAX = int(sys.argv[2]) if len(sys.argv) > 2 else 3000
body = {"job_title_or": ["ai engineer", "machine learning", "ml engineer", "llm", "generative ai", "applied scientist", "ai architect",
                         "forward deployed", "data scientist", "ai product", "ai research", "deep learning", "mlops", "artificial intelligence"],
        "job_country_code_or": ["US"], "posted_at_max_age_days": 30, "limit": 100}
got, page, cursor, credits = 0, 0, None, 0
while got < MAX:
    b = dict(body)
    if cursor:
        b["cursor"] = cursor
    out = subprocess.run(["treg", "call", "jobspipe.jobs.search", "--method", "POST", "--data", json.dumps(b)],
                         capture_output=True, text=True, timeout=300).stdout
    d = json.loads(out[out.index("{"):])
    rows = d.get("data") or []
    (out_dir / f"page-{page:03d}.json").write_text(json.dumps(d))
    got += len(rows); page += 1
    credits += (d.get("metadata") or {}).get("credits_charged") or 0
    cursor = (d.get("metadata") or {}).get("next_cursor")
    if not rows or not cursor:
        break
print(f"pages {page}, ads {got}, credits charged {credits}")
