"""Totals searches and average click price per category in missing/keywords.csv, and lists the 14 biggest phrases."""
import csv, pathlib
from collections import defaultdict

rows = list(csv.DictReader(open(pathlib.Path(__file__).parent / "keywords.csv")))
a = defaultdict(lambda: [0.0, 0.0])
for r in rows:
    v, c = float(r["volume"] or 0), float(r["cpc"] or 0)
    a[r["theme"]][0] += v; a[r["theme"]][1] += v * c
for k, (v, val) in sorted(a.items(), key=lambda kv: -kv[1][0]):
    print(f"{int(v):>9,}/mo  avg ${val / v if v else 0:6.2f}  {k}")
print("biggest:")
for r in sorted(rows, key=lambda r: -float(r["volume"] or 0))[:14]:
    print(f"  {int(float(r['volume'] or 0)):>8,}  ${r['cpc'] or 0}  d{r['difficulty']}  {r['keyword']}")
