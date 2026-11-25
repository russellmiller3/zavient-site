"""Monthly snapshot of the US AI job market from jobspipe's free count endpoint (via treg), last 30 days only:
the job database keeps about 4 months (actuary control: 2,146 ads at 120 days, 2,182 at 365), so longer windows are not trends.
(1) ads per AI job title; (2) among AI-titled ads, how many name each AI model maker or model in the description.
Writes snapshot-<date>.json. Counts are the provider's approximate counts, capped at 10,000."""
import json, subprocess, datetime, pathlib
from concurrent.futures import ThreadPoolExecutor

here = pathlib.Path(__file__).parent
TITLES = ["ai engineer", "machine learning engineer", "data scientist", "forward deployed engineer", "prompt engineer",
          "ai product manager", "ai architect", "llm engineer", "ai research scientist", "applied scientist", "mlops engineer",
          "head of ai", "chief ai officer", "ai trainer", "ai solutions engineer", "ai consultant", "ai governance",
          "ai safety", "computer vision engineer", "nlp engineer", "data engineer", "analytics engineer"]
AI_TITLES = ["ai engineer", "machine learning", "ml engineer", "llm", "generative ai", "applied scientist", "ai architect",
             "forward deployed", "data scientist", "ai product", "ai research", "deep learning", "mlops"]
MODELS = {"Anthropic / Claude": ["anthropic", "claude"], "OpenAI / GPT": ["openai", "chatgpt"], "Google Gemini": ["gemini"],
          "Meta Llama": ["llama"], "Mistral": ["mistral"], "DeepSeek": ["deepseek"], "Microsoft Copilot": ["copilot"],
          "Hugging Face": ["hugging face"], "LangChain": ["langchain"], "AWS Bedrock": ["bedrock"], "Azure OpenAI": ["azure openai"]}

def count(body):
    body = {"job_country_code_or": ["US"], "posted_at_max_age_days": 30, "status": "any", **body}
    out = subprocess.run(["treg", "call", "jobspipe.jobs.search.count", "--method", "POST", "--data", json.dumps(body)],
                         capture_output=True, text=True, timeout=180).stdout
    try:
        return json.loads(out[out.index("{"):]).get("rows")
    except Exception:
        return None

jobs = [("title", t, {"job_title_or": [t]}) for t in TITLES]
jobs.append(("all_ai", "all AI-titled ads", {"job_title_or": AI_TITLES}))
jobs += [("model", m, {"job_title_or": AI_TITLES, "description_or": words}) for m, words in MODELS.items()]
with ThreadPoolExecutor(max_workers=len(jobs)) as ex:
    res = list(ex.map(lambda j: (j[0], j[1], count(j[2])), jobs))
snap = {"date": datetime.date.today().isoformat(), "window_days": 30, "country": "US", "source": "jobspipe via treg (approximate counts, cap 10,000)",
        "titles": {n: c for k, n, c in res if k == "title"}, "all_ai": next(c for k, n, c in res if k == "all_ai"),
        "models": {n: c for k, n, c in res if k == "model"}}
p = here / f"snapshot-{snap['date']}.json"
p.write_text(json.dumps(snap, indent=1))
print(json.dumps(snap, indent=1))
