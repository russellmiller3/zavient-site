"""Hand-check helper: prints the words around each match of a pattern in the sample's descriptions, so a person can
judge false matches (e.g. 'MCP' as a Microsoft certification, 'Claude' as a person's name). Usage: spot_check.py <regex> [n]"""
import json, re, glob, sys, pathlib, random

here = pathlib.Path(__file__).parent
rx = re.compile(sys.argv[1], re.I)
n = int(sys.argv[2]) if len(sys.argv) > 2 else 15
hits = []
for f in sorted(glob.glob(str(here / "sample/page-*.json"))):
    for j in json.load(open(f)).get("data") or []:
        d = j.get("description") or ""
        m = rx.search(d)
        if m:
            hits.append(f"{j.get('company')}: ...{d[max(0, m.start()-70):m.end()+70].replace(chr(10), ' ')}...")
random.seed(1)
for h in random.sample(hits, min(n, len(hits))):
    print("-", h)
print(f"({len(hits)} ads matched)")
