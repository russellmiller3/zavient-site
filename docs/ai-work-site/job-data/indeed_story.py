"""Writes the data story 'AI in US job postings' (src/content/data-stories/ai-in-us-job-postings.json) from
indeed/monthly.json, so every number on the page comes from Indeed Hiring Lab's data (CC BY 4.0), not from typing.
Run indeed_monthly.py first. Usage: python3 indeed_story.py"""
import json, pathlib

here = pathlib.Path(__file__).parent
repo = here.parents[2]
d = json.loads((here / "indeed/monthly.json").read_text())
us = d["us_monthly"]
v = dict(us)
names = {"CA": "Canada", "IE": "Ireland", "GB": "the UK", "US": "the US", "AU": "Australia", "DE": "Germany",
         "IT": "Italy", "FR": "France", "NL": "the Netherlands", "ES": "Spain", "JP": "Japan"}
mon = lambda m: f"{['January','February','March','April','May','June','July','August','September','October','November','December'][int(m[5:]) - 1]} {m[:4]}"
pct = lambda x: f"{x:.2f}%"

first, last = us[0], us[-1]
since25 = [m for m in us if m[0] >= "2025-01"]
rises = sum(1 for a, b in zip(since25, since25[1:]) if b[1] > a[1])
old_peak = max((m for m in us if m[0] < "2023-01"), key=lambda m: m[1])
trough = min((m for m in us if old_peak[0] < m[0] < "2024-01"), key=lambda m: m[1])
rank = [c for c, _ in d["latest_by_country"]]
latest = dict(d["latest_by_country"])
ahead = [c for c in rank[: rank.index("US")] if c != "CA"]
ahead_txt = " and ".join(f"{names[c]} ({pct(latest[c])})" for c in ahead)

story = {
    "title": "The share of US job ads that mention AI has nearly tripled since 2025",
    "description": f"Share of US job postings mentioning AI, monthly {first[0][:4]} to {last[0][:4]}, from Indeed Hiring Lab data: {pct(v['2025-01'])} in January 2025, {pct(last[1])} now.",
    "dek": f"In {mon(last[0])}, {pct(last[1])} of US job postings on Indeed mentioned AI, up from {pct(v['2025-01'])} in January 2025 and the highest share since the series began in 2019.",
    "findings": [
        f"The share rose from {pct(v['2025-01'])} in January 2025 to {pct(last[1])} in {mon(last[0])}, about {last[1] / v['2025-01']:.1f} times as high in 21 months. It went up in {rises} of those {len(since25) - 1} month-to-month steps.",
        f"This is not the first AI hiring wave. The share hit {pct(old_peak[1])} in {mon(old_peak[0])}, then fell to {pct(trough[1])} by {mon(trough[0])}. The fall ran straight through ChatGPT's launch in November 2022, so the launch did not stop a fall already under way in tech hiring.",
        f"In {mon(last[0])} the US ({pct(latest['US'])}) trailed {ahead_txt}. Canada showed {pct(latest['CA'])}, but much of that comes from an Ontario law, in force since January 2026, that makes employers say when AI screens applicants.",
        "On Hacker News's monthly 'Who is hiring?' thread, where startups post, the AI share is far higher: 51.6% of postings in November 2026. The two counts use different word lists, so compare their direction, not their levels: both climb.",
    ],
    "chart": {
        "title": "Share of US job postings that mention AI",
        "subtitle": f"Monthly average of Indeed's daily share (7-day trailing average), {mon(first[0])} to {mon(last[0])}",
        "unit": "percent",
        "kind": "line",
        "creditSource": "Indeed Hiring Lab AI Tracker (CC BY 4.0)",
        "bars": [{"label": m, "value": x} for m, x in us],
    },
    "method": [
        "Indeed Hiring Lab publishes, for each day, the share of job postings on Indeed whose text includes AI terms such as 'machine learning', 'data science', 'artificial intelligence', 'generative AI' and 'large language models'. Each daily figure is a 7-day trailing average.",
        f"I averaged the daily US figures into calendar months, {mon(first[0])} to {mon(last[0])}. The newest month in the data is {mon(last[0])}.",
        "The data counts postings that mention AI anywhere, including company descriptions. It is not a count of AI jobs. One posting can say 'we use AI to screen applicants' and still count.",
        "The data and Hiring Lab's method are free to reuse under the Creative Commons Attribution 4.0 licence, with credit to Indeed Hiring Lab. The chart and monthly averages here are my own calculation from it.",
    ],
    "sources": [
        {"name": "Indeed Hiring Lab, AI Tracker data (GitHub)", "url": "https://github.com/hiring-lab/ai-tracker",
         "what": "Daily share of job postings mentioning AI, 2019 to 2026, for the US and other countries; CC BY 4.0."},
        {"name": "Post Labor Economics, 'AI in job ads: what the count measures' (13 Nov 2026)", "url": "https://postlaboreconomics.com/posts/ai-in-job-ads-what-the-count-measures",
         "what": "Ontario's AI-disclosure rule took Ontario's AI-mention share from 9% in October 2025 to 28% in May 2026, per Indeed Hiring Lab."},
        {"name": "Hacker News Hiring Trends, November 2026", "url": "https://www.hntrends.com/2026/november.html",
         "what": "AI is mentioned in 51.6% of November 2026 'Who is hiring?' postings, up from 30% two years earlier."},
    ],
    "updated": "2026-11-25",
}
assert len(story["description"]) <= 160, len(story["description"])
out = repo / "src/content/data-stories/ai-in-us-job-postings.json"
out.write_text(json.dumps(story, indent=1, ensure_ascii=False) + "\n")
print(out, len(us), "months")
for f in story["findings"]: print("-", f)
