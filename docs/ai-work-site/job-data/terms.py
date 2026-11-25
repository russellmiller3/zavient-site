"""The word patterns that decide what a job ad mentions, shared by analyze_sample.py (one-off counts) and mentions.py
(the monthly trend store). Change a pattern here, bump TERMS_VERSION, and rerun mentions.py: it recounts every saved
month with the new patterns, so the trend never mixes two definitions.

Why hand-kept patterns and not a skills taxonomy: the open taxonomies (ESCO, Lightcast Open Skills, used by Nesta's
ojd_daps_skills extractor) lag new product names such as Claude Code or MCP by months. Named AI models and tools are
therefore matched here; general skills can come from the extractor (see research-notes/extraction-tools-sweep.md)."""

TERMS_VERSION = 1  # 25 Nov 2026: the patterns behind the first four data stories

TITLE = {  # first match wins, checked against the job title only
    "Forward deployed engineer": r"forward[- ]deployed",
    "AI product manager": r"\b(ai|ml|machine learning|genai|generative ai)\b.*\bproduct manager|\bproduct manager\b.*\b(ai|ml|machine learning)\b",
    "Head or director of AI": r"\b(head|director|vp|vice president|chief)\b.*\b(ai|artificial intelligence|machine learning|ml)\b",
    "AI research scientist": r"research (scientist|engineer)|\bresearcher\b",
    "Applied scientist": r"applied scientist",
    "Data scientist": r"data scientist",
    "Machine learning engineer": r"machine learning engineer|\bml engineer|mlops",
    "AI engineer": r"\b(ai|genai|generative ai|llm)\b.*\bengineer|\bengineer\b.*\b(ai|llm)\b",
    "AI architect or consultant": r"\b(ai|ml)\b.*\b(architect|consultant|strategist)",
    "AI trainer or data annotator": r"\b(ai )?trainer\b|annotat|rater",
}
MODEL = {
    "Anthropic / Claude": r"\b(anthropic|claude)\b",
    "OpenAI / GPT": r"\b(openai|chatgpt|gpt-?[345o])",
    "Google Gemini": r"\bgemini\b",
    "Meta Llama": r"\bllama\b(?!index)",
    "Mistral": r"\bmistral\b",
    "DeepSeek": r"\bdeepseek\b",
    "Microsoft Copilot": r"\bcopilot\b",
}
PLATFORM = {
    "AWS Bedrock": r"\bbedrock\b", "Azure OpenAI / AI Foundry": r"azure (openai|ai foundry|ai studio)", "Google Vertex AI": r"vertex ai",
    "Databricks": r"\bdatabricks\b", "Snowflake": r"\bsnowflake\b", "LangChain / LangGraph": r"\blang(chain|graph)\b",
    "LlamaIndex": r"llama ?index", "Hugging Face": r"hugging ?face", "PyTorch": r"\bpytorch\b",
    "MCP (Model Context Protocol)": r"model context protocol|(?<!professional \()\bmcp\b(?! ?\))",
}
WORK = {  # kinds of AI work named in the description
    "AI agents": r"agentic|multi-?agent|ai agents?\b|agent orchestration",
    "RAG and retrieval": r"retrieval-?augmented|\brag\b",
    "Fine-tuning and post-training": r"post-?training|fine-?tun|rlhf",
    "Evaluation (evals)": r"\bevals?\b|evaluation frameworks?",
    "Prompt engineering": r"prompt engineering",
    "Claude Code / coding agents": r"claude code|coding agents?|\bcursor\b",
}
# A maker's own job ads name the maker in every ad, so they are left out of that maker's count (hand check, 25 Nov 2026).
MAKER = {"Anthropic / Claude": "anthropic", "OpenAI / GPT": "openai", "Google Gemini": "google", "Meta Llama": "meta",
         "Mistral": "mistral", "DeepSeek": "deepseek", "Microsoft Copilot": "microsoft"}
GROUPS = {"model": MODEL, "platform": PLATFORM, "work": WORK}


def dedupe(jobs):
    """Drops reposts: the same company posting the same title again counts once."""
    seen, out = set(), []
    for j in jobs:
        key = ((j.get("company") or "").lower().strip(), (j.get("job_title") or "").lower().strip())
        if key not in seen:
            seen.add(key); out.append(j)
    return out
