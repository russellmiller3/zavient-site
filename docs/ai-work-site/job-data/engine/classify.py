"""Reads paid sample pages of full job ads and labels HOW each ad mentions AI, because a count cannot tell:
  duty   - the hire will use, run or build AI (the augmentation signal we chart)
  hiring - the employer says it uses AI to screen applicants (Ontario/Illinois-style disclosure; Indeed found 14% of
           AI mentions were about recruiting: see research note)
  company- only the employer's own product or pitch is AI ("our AI-powered platform"); says nothing about the job
Then tags each ad with the engine's models, tools and work phrases (queries.json), so a hand check can measure precision.
Usage: python3 classify.py SAMPLE_DIR OUT.json"""
import json, re, sys, glob, pathlib, collections

AI = re.compile(r"(?<![.@\w])(artificial intelligence|generative ai|gen ?ai|machine learning|ai|a\.i\.|llms?|chatgpt|copilot|claude|gemini|"
                r"prompt engineering|ai-powered|ai-assisted|ai-enabled|ai-driven|ai-native|agentic)\b", re.I)
HIRING = re.compile(r"\b(hiring process|recruitment process|application review|job application|reviewing applications|"
                    r"applicants?|candidate evaluation|employment decisions?|selection process|interview process|"
                    r"screen(ing)? (of )?(candidates|applicants|resumes)|resumes?|resume matching|by applying|ai-generated calls|"
                    r"candidate'?s? qualifications|equal opportunity|employment)\b", re.I)
EMPLOYER_VOICE = re.compile(r"\b(we|our|us|notice of ai|may use|may be used|uses|does not use|by applying|you agree)\b", re.I)
IMPERATIVE = re.compile(r"^[-*\s]*(use|utilize|leverage|apply|build|drive|own|partner|develop|automate|identify|create|design|implement|"
                        r"integrate|champion|evaluate|deploy|explore|train|manage|lead|support|help|run|write|test|research|draft|stay|keep|ensure|"
                        r"maintain|monitor|streamline|optimi[sz]e|improve|collaborate|work|(prior |previous |demonstrated )?experience|"
                        r"exposure|bonus|nice to have|preferred|plus)\b", re.I)
COMPANY_PITCH = re.compile(r"\b(join (our|a|the) team|our client|ai era|age of ai|frontier ai|ai-first (company|agency|firm)|"
                           r"shows you|our (mission|customers|platform|product)|we are an?)\b", re.I)
THIRD_PERSON = re.compile(r"^[-*\s]*([A-Z][\w.&'-]*( [A-Z][\w.&'-]*)*|The company|This company) (leverages|uses|is|builds|helps|has|"
                          r"provides|offers|combines|delivers|was|believes|applies|develops)\b")
OUR_AI = re.compile(r"\b(our|its|the company'?s?) (\w+ )?(ai|artificial intelligence)\b|\b(is|are) (building|pioneering|leading|bringing)\b|"
                    r"\bpowered by\b|\bai (infrastructure|company|startup|platform company)\b", re.I)
YOU = re.compile(r"\b(you|you'll|you're|your|candidates? (should|will|must)|ideal candidate|successful candidate|experience (with|in|using)|"
                 r"proficien\w+|familiar\w*|comfort\w*|fluen\w+|literacy|abilit\w+|knowledge of|leverag\w+|"
                 r"adopt\w*|curious|interest in|hands-on|expected to|this role|the role|responsib\w+|who already use)\b", re.I)
def sentences(t):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+|•|•", t or "") if s.strip()]


def label(desc):
    kinds = set(); hits = []
    for s in sentences(desc):
        if not AI.search(s):
            continue
        if re.search(r"\buse of (ai|artificial intelligence) in (applications|hiring|recruit\w*)", s, re.I):
            k = "hiring"
        elif HIRING.search(s) and EMPLOYER_VOICE.search(s) and not IMPERATIVE.search(s) and not re.search(r"\b(you will|you'll)\b", s, re.I):
            k = "hiring"
        elif COMPANY_PITCH.search(s) or THIRD_PERSON.search(s):
            k = "company"
        elif OUR_AI.search(s) and not re.search(r"\b(you|you'll|your)\b", s, re.I):
            k = "company"
        elif IMPERATIVE.search(s) or YOU.search(s):
            k = "duty"
        else:
            k = "company"
        kinds.add(k); hits.append((k, s[:220]))
    top = "duty" if "duty" in kinds else ("hiring" if "hiring" in kinds else ("company" if kinds else "none"))
    return top, hits


def main(src, out):
    rows = {}
    for f in sorted(glob.glob(str(pathlib.Path(src) / "page-*.json"))):
        for r in json.load(open(f))["body"]["data"]:
            rows[r["id"]] = r
    q = json.loads((pathlib.Path(__file__).parent / "queries.json").read_text())["queries"]
    res = []
    for r in rows.values():
        top, hits = label(r.get("description"))
        d = (r.get("description") or "").lower()
        tags = [o["label"] for o in q if "query" in o and any(re.search(r"\b" + re.escape(p) + r"\b", d) for p in o["query"])]
        res.append({"id": r["id"], "title": r.get("job_title"), "company": r.get("company"), "function": r.get("job_function"),
                    "industry": r.get("isic_division_label"), "employees": (r.get("company_object") or {}).get("employee_count"),
                    "employer_type": r.get("employer_type"), "label": top, "hits": hits[:6], "tags": tags})
    json.dump(res, open(out, "w"), indent=1)
    c = collections.Counter(x["label"] for x in res)
    print(len(res), "ads", dict(c))
    print("by function", {f: dict(collections.Counter(x["label"] for x in res if x["function"] == f)) for f in sorted({x["function"] for x in res})})
    print("top tags", collections.Counter(t for x in res for t in x["tags"]).most_common(25))


if __name__ == "__main__":
    main(*sys.argv[1:3])
