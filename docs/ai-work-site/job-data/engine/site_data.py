"""Trims aggregate.py's output to what the trend charts show (aggregates only; raw ads stay in the private data repo).
Usage: python3 site_data.py TRENDS.json OUT.json"""
import json, sys

d = json.load(open(sys.argv[1]))
# Not a target industry for 40-500 staff operators (master plan), so left off the industry chart
SKIP = {"Software and IT", "Government", "Education", "Hospitality"}
WIN = {"w2": "28 Aug to 26 Sep", "w1": "27 Sep to 26 Oct", "w0": "27 Oct to 25 Nov 2026"}
fn = [{"name": x["function"], "uses_ai": x["uses_ai_w0"], "mentions": [x["w2"], x["w1"], x["w0"]], "ads": x["ads_w0"],
       "estimated": x["sample_n"] < 20} for x in d["by_function"] if x["uses_ai_w0"] is not None]
ind = [{"name": x["industry"], "mentions": [x["w2"], x["w1"], x["w0"]], "ads": x["ads_w0"]}
       for x in d["by_industry"] if x["industry"] not in SKIP and x["w0"] is not None and x["w2"] is not None and (x["ads_w0"] or 0) >= 500]
w0 = [s for s in d["model_share"] if s["window"] == "w0"]
tot = sum(s["ads"] for s in w0)
closed = sorted([s for s in w0 if not s["open_weight"]], key=lambda s: -s["ads"])[:4]
openw = [{"name": s["model"], "ads": s["ads"], "share": s["share"]} for s in d["open_weight_rank_w0"]]
out = {"windows": WIN, "icp_share": d["icp_all_ai_share"], "duty_share": d["duty_share_all"], "by_function": fn, "by_industry": ind,
       "models": {"total_mentions": tot, "open_share": round(sum(o["ads"] for o in openw) * 100 / tot, 1),
                  "closed_top": [{"name": s["model"], "share": s["share"]} for s in closed], "open": openw}}
json.dump(out, open(sys.argv[2], "w"), indent=1)
print(json.dumps({k: out[k] for k in ["icp_share", "duty_share"]}), out["models"]["open_share"], out["models"]["closed_top"])
