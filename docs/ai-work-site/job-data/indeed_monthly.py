"""Turns Indeed Hiring Lab's daily AI-posting share (indeed/AI_posting.csv, CC BY 4.0, github.com/hiring-lab/ai-tracker)
into monthly averages: the US series for a trend chart, and the latest month for every country. Prints both as JSON."""
import csv, json, pathlib
from collections import defaultdict

here = pathlib.Path(__file__).parent
sums = defaultdict(lambda: [0.0, 0])
for r in csv.DictReader(open(here / "indeed/AI_posting.csv")):
    k = (r["jobcountry"], r["date"][:7])
    sums[k][0] += float(r["AI_share_postings"]); sums[k][1] += 1
monthly = {k: round(s / n, 2) for k, (s, n) in sums.items()}
us = sorted((m, v) for (c, m), v in monthly.items() if c == "US")
last = max(m for _, m in monthly)
latest = sorted(((c, v) for (c, m), v in monthly.items() if m == last), key=lambda x: -x[1])
print(json.dumps({"us_monthly": us, "latest_month": last, "latest_by_country": latest,
                  "us_first": us[0], "us_last": us[-1], "us_peak": max(us, key=lambda x: x[1])}, indent=1))
