"""Third pass: counts distinct EMPLOYERS (not ads) per kind of work, so one firm's repeated template cannot inflate a count,
and lists the 40 best-paying ads (posted minimum pay under $2M, to drop data errors)."""
import json, re, glob, pathlib
from collections import defaultdict

here = pathlib.Path(__file__).parent
jobs = {}
for f in sorted(glob.glob(str(here / "raw/page-*.json"))):
    for j in json.load(open(f)).get("data") or []:
        jobs[j["id"]] = j
work = {
    "AI agents and multi-agent systems": r"agentic|multi-?agent|ai agents?\b|agent orchestration",
    "Agent security (identity, authorization)": r"agent (identity|authori[sz]ation|authentication)",
    "Post-training and fine-tuning": r"post-?training|fine-?tun|rlhf|reinforcement learning from",
    "Pre-training foundation models": r"pre-?training|foundation models?",
    "Evaluation and benchmarks": r"\bevals?\b|evaluation frameworks?|benchmark",
    "Inference optimization": r"inference (optimi|efficien|serving|latency)|distributed inference|vllm",
    "Search, ranking and RAG": r"retrieval-?augmented|\brag\b|search ranking|ranking models?|retrieval",
    "Recommendations and personalization": r"recommend|personali[sz]",
    "Ads and bidding": r"\bads\b|ad ranking|bidding|auction",
    "Fraud and risk": r"fraud|risk model|credit risk|underwrit",
    "Trust and safety": r"trust (and|&) safety|content moderation|abuse detection",
    "AI safety and alignment": r"ai safety|alignment|red[- ]team",
    "AI governance and responsible AI": r"governance|responsible ai",
    "Forecasting and causal inference": r"forecast|causal inference|experimentation|a/b test",
    "Operations research and optimization": r"operations research|optimization models?|mixed-integer|linear programming",
    "Computer vision": r"computer vision|image (recognition|segmentation)|object detection",
    "Speech and voice": r"speech|voice agent|\basr\b|text-to-speech",
    "Robotics and autonomy": r"robot|autonomous (vehicle|driving|systems)|perception",
    "Document AI and extraction": r"document (ai|understanding|processing|extraction)|\bocr\b",
    "Anomaly detection and monitoring": r"anomaly detection|model monitoring|observability",
    "Data labeling and synthetic data": r"data annotation|data labell?ing|synthetic data",
    "Code generation and developer AI": r"code generation|coding agents?|developer productivity|copilot",
    "Healthcare and clinical AI": r"clinical|patient|medical",
    "Science and drug discovery": r"drug discovery|protein|genomic|materials (science|discovery)|molecul",
}
emp = defaultdict(set); ads = defaultdict(int)
for j in jobs.values():
    text = ((j.get("job_title") or "") + " " + (j.get("description") or "")).lower()
    for k, rx in work.items():
        if re.search(rx, text):
            emp[k].add(j.get("company") or "?"); ads[k] += 1
print("KIND OF WORK: distinct employers / ads (out of 281 employers, 1,000 ads)")
for k in sorted(work, key=lambda k: -len(emp[k])):
    print(f"  {len(emp[k]):>4} employers  {ads[k]:>4} ads  {k}")
top = sorted([j for j in jobs.values() if 0 < (j.get('min_annual_salary_usd') or 0) < 2_000_000], key=lambda j: -j["min_annual_salary_usd"])[:40]
print("\nTOP 40 ADS BY POSTED MINIMUM PAY:")
for j in top:
    print(f"  ${j['min_annual_salary_usd']/1000:>5.0f}k  {j.get('company')}: {j.get('job_title')}")
