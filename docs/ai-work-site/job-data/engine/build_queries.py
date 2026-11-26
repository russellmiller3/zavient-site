"""Builds the job-ad engine's query set (queries.json) from every term list we keep, so the monthly counts and the
trend charts share one definition. Sources, each recorded on every query:
  - models: hand list of AI model families (open-weight flagged), 26 Nov 2026
  - tools: keyword-research/ai-work-taxonomy-11-25-2026/ai_software_list.json (popular AI products by group)
  - platforms: job-data/terms.py PLATFORM (the existing monthly store's patterns)
  - work: keyword-research/ai-work-taxonomy-11-25-2026/taxonomy.json (216 AI work types, their job-ad phrases)
  - augmentation: phrases an ad uses when it wants a non-tech hire to work with AI (hand list + expansion)
  - roles: AI-augmented operator titles (title queries)
  - expansion: terms found by the 26 Nov keyword expansion (expansion-terms.json, if present)
Query syntax is JobsPipe's description_or: every word of one phrase, in any order. A name that is also an ordinary
word (Gemini, Llama, Copilot, Claude...) is paired with 'ai' so the ad must also say AI, which removes hiking-guide
'llama' and astrology 'gemini' (hand check, 26 Nov 2026).
Usage: python3 build_queries.py [expansion-terms.json]"""
import json, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
KW = HERE.parent.parent / "keyword-research" / "ai-work-taxonomy-11-25-2026"

MODELS = [  # (label, query words, open_weight)
    ("OpenAI GPT / ChatGPT", ["chatgpt", "openai", "gpt-4", "gpt-5", "gpt-4o"], False),
    ("Anthropic Claude", ["anthropic", "claude ai", "claude llm", "claude code"], False),
    ("Google Gemini", ["gemini ai", "gemini llm", "google gemini"], False),
    ("xAI Grok", ["grok ai", "grok llm"], False),
    ("Cohere Command", ["cohere llm", "cohere ai"], False),
    ("Perplexity", ["perplexity ai"], False),
    ("Microsoft Copilot", ["microsoft copilot", "copilot ai", "m365 copilot", "copilot studio"], False),
    ("Meta Llama", ["llama llm", "llama ai", "llama model"], True),
    ("Mistral / Mixtral", ["mistral llm", "mistral ai", "mixtral"], True),
    ("Qwen", ["qwen"], True),
    ("DeepSeek", ["deepseek"], True),
    ("Google Gemma", ["gemma llm", "gemma model"], True),
    ("Microsoft Phi", ["phi3", "phi4", "microsoft phi"], True),   # "phi-3" splits to phi + 3 and matches PHI (health data): 2,315 healthcare ads
    ("OpenAI gpt-oss", ["gpt-oss"], True),
    ("Falcon", ["falcon 180b", "falcon 40b", "tii falcon"], True),   # "falcon llm" matched CrowdStrike Falcon: 99 of 116 in IT security
    ("Moonshot Kimi", ["kimi k2", "kimi llm"], True),
    ("Zhipu GLM", ["zhipu", "chatglm", "glm-4.5", "glm-4.6"], True),   # "glm-4" matches generalized linear model + any 4
    ("NVIDIA Nemotron", ["nemotron"], True),
    ("IBM Granite", ["ibm granite", "granite llm"], True),   # "granite model" matched countertops: 21 of 118 in tech jobs
    ("AI2 OLMo", ["olmo"], True),
    ("Stable Diffusion", ["stable diffusion"], True),
    ("OpenAI Whisper", ["whisper ai", "whisper speech"], True),
]
AUGMENTATION = [  # how an ad asks a non-tech hire to work with AI
    "ai tools", "ai-powered tools", "generative ai tools", "ai fluency", "ai literacy", "ai proficiency",
    "ai-assisted", "ai assisted", "ai-enabled", "ai-first", "ai adoption", "ai champion", "ai enablement",
    "leverage ai", "use ai", "familiarity with ai", "experience with ai tools", "comfortable using ai",
    "prompt engineering", "prompting", "chatgpt", "copilot", "human-in-the-loop", "automation tools",
    "workflow automation", "intelligent automation", "process automation", "rpa", "ai agents", "agentic",
]
ROLES = [  # AI-augmented operator titles (job_title_or)
    "head of ai", "director of ai", "vp of ai", "chief ai officer", "ai transformation", "ai strategy",
    "ai program manager", "ai product manager", "ai enablement", "ai adoption", "ai operations", "ai ops",
    "automation lead", "automation manager", "director of automation", "intelligent automation", "rpa developer",
    "process automation", "ai governance", "ai risk", "ai consultant", "ai solutions", "forward deployed",
    "prompt engineer", "ai trainer", "ai analyst", "ai specialist", "ai coordinator",
]
# ICP functions and industries: JobsPipe's own enums (job_function_or) and ISIC divisions (isic_division_or).
FUNCTIONS = ["Operations", "Finance & Accounting", "Customer Support", "Sales", "Marketing", "Human Resources",
             "Legal", "Logistics & Supply Chain", "Manufacturing", "Administration", "Executive", "Healthcare",
             "Construction & Trades", "Retail", "Data & Analytics", "Engineering", "IT & Security", "Product"]
INDUSTRIES = {  # label: ISIC rev.4 divisions
    "Banking and lending": ["64"], "Insurance": ["65"], "Financial services (other)": ["66"],
    "Legal and accounting": ["69"], "Healthcare": ["86", "87", "88"], "Manufacturing": [str(d) for d in range(10, 34)],
    "Construction": ["41", "42", "43"], "Wholesale": ["46"], "Retail": ["47"], "Transport and logistics": ["49", "50", "51", "52", "53"],
    "Real estate": ["68"], "Professional services": ["70", "71", "73", "74"], "Software and IT": ["62", "63"],
    "Energy and utilities": ["35", "36"], "Hospitality": ["55", "56"], "Telecom": ["61"], "Education": ["85"], "Government": ["84"],
}
AMBIGUOUS = re.compile(r"^(gemini|llama|copilot|claude|grok|gemma|falcon|phi|granite|whisper|gem|pitch|ada|sierra|writer|apollo|outreach|"
                       r"clay|gong|granola|grain|guru|dust|chorus|unify|basis|digits|numeric|notable|modal|replicate|cursor|v0|codex|devin|"
                       r"cline|tome|gamma|lindy|make\.com|harvey|kira|disco|ultimate|forethought|alloy|sardine|ambience|suki|freed ai|"
                       r"heidi health|abridge|paradox|fetcher|ashby|juicebox|common room|super\.ai|extend ai|reducto|pigment|rillet)$", re.I)


def q(term):
    t = term.strip().lower()
    return f"{t} ai" if AMBIGUOUS.match(t) else t


AI_WORDS = re.compile(r"\b(ai|ml|machine learning|llm|genai|generative|model|models|automation|automated|nlp|neural|agentic|rag)\b", re.I)


def ai_context(phrase):
    """A work phrase that does not itself say AI must appear with 'ai' or 'machine learning' in the same ad."""
    return [phrase] if AI_WORDS.search(phrase) else [f"{phrase} ai", f"{phrase} machine learning"]


COMMON = set("""a an and the of for to in on with at by from as or is are be your you our we it its this that new
ai ml machine learning artificial intelligence generative gen model models tool tools agent agents assistant assistants data analytics
automation automated automate platform software cloud system systems solution solutions service services business work workflow workflows
process processing management manager engineer engineering developer development design content customer sales marketing finance
use using used build building scale together cursor notion cohere mistral perplexity grok jasper writer runway pi character replit
open source copilot gemini llama claude bard bing search chat chatbot bot bots voice speech vision image images video text document
documents review analysis analyst research report reporting forecast forecasting prediction predictive planning optimization scheduling
risk fraud detection recommendation recommendations personalization lead leads scoring pricing quality inspection maintenance support
help desk team teams literacy fluency prompt prompts engineering skills digital transformation strategy adoption enablement""".split())
STRONG = {"ai"}
def countable(phrase):
    """True when the free count for this phrase can be trusted: it has at least one word that is rare in job ads,
    so JobsPipe's any-order word match cannot be met by chance. 'ai agents' fails; 'langchain' and 'claude code' pass."""
    words = re.findall(r"[a-z0-9][a-z0-9.+#-]*", phrase.lower())
    return any(w not in COMMON and len(w) > 2 for w in words)


def main(argv):
    out = []
    for label, words, open_w in MODELS:
        out.append({"group": "model", "label": label, "open_weight": open_w, "query": words, "source": "hand list 26 Nov 2026"})
    sw = json.loads((KW / "ai_software_list.json").read_text())
    for g, names in sw["groups"].items():
        for n in names:
            out.append({"group": "tool", "category": g, "label": n, "query": [q(n)], "source": "ai_software_list.json"})
    sys.path.insert(0, str(HERE.parent))
    from terms import PLATFORM
    for n in PLATFORM:
        out.append({"group": "platform", "label": n, "query": [w.strip().lower() for w in re.split(r"/", n)], "source": "terms.py"})
    tax = json.loads((KW / "taxonomy.json").read_text())
    for name, cat, search_phr, ad_phr in tax["items"]:
        phr = sorted({p.lower() for p in ad_phr} or {name.lower()})
        out.append({"group": "work", "category": cat, "label": name, "query": [v for p in phr for v in ai_context(p)],
                    "source": "taxonomy.json"})
    for a in AUGMENTATION:
        out.append({"group": "augmentation", "label": a, "query": [a], "source": "hand list 26 Nov 2026"})
    for r in ROLES:
        out.append({"group": "role", "label": r, "title_query": [r], "source": "hand list 26 Nov 2026"})
    if len(argv) > 0 and pathlib.Path(argv[0]).exists():
        exp = json.loads(pathlib.Path(argv[0]).read_text()).get("terms", [])
        have = {w for o in out for w in (o.get("query") or o.get("title_query") or [])}
        for t in exp:
            term = (t.get("term") or "").strip().lower()
            if not term or q(term) in have or term in have:
                continue
            grp = t.get("group") or "work"
            if grp in {"function", "industry"}:   # those are chart dimensions (job_function, ISIC filters), not AI terms
                continue
            row = {"group": grp if grp in {"model", "tool", "work", "augmentation", "role"} else "work", "label": term,
                   "source": "keyword expansion 26 Nov 2026", "evidence": t.get("sources", [])[:3]}
            row["title_query" if grp == "role" else "query"] = [q(term)] if grp in {"role", "tool", "model"} else ai_context(term)
            out.append(row); have.add(q(term))
    for o in out:   # JobsPipe matches every word of a phrase anywhere in the ad, so a phrase of only common words over-counts
        ph = o.get("query") or []
        if "query" not in o:
            o["count_kind"] = "title"          # title search: exact
        elif any(countable(w) and len(w.split()) == 1 for w in ph):
            o["count_kind"] = "exact"          # one rare word: the count means what it says
        elif any(countable(w) for w in ph):
            o["count_kind"] = "co-mention"     # ads that use all the words somewhere, e.g. AI and underwriting: an upper bound
        else:
            o["count_kind"] = "unreliable"     # only common words: chance matches swamp it; never chart
    # dedupe on identical query lists
    seen, final = set(), []
    for o in out:
        k = (o["group"], tuple(o.get("query") or o.get("title_query")))
        if k not in seen:
            seen.add(k); final.append(o)
    doc = {"built": "2026-11-26", "query_syntax": "JobsPipe description_or / job_title_or", "functions": FUNCTIONS,
           "industries": INDUSTRIES, "queries": final}
    (HERE / "queries.json").write_text(json.dumps(doc, indent=1) + "\n")
    from collections import Counter
    print(len(final), Counter(o["group"] for o in final), sum(len(o.get("query") or o.get("title_query")) for o in final), "phrases")


if __name__ == "__main__":
    main(sys.argv[1:])
