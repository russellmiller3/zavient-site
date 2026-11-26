# Job-ad engine

Counts how US job ads mention AI, by model, tool, type of work, job function and industry, focused on firms with 40 to 500 staff.

- `build_queries.py`: builds `queries.json`, about 820 searches from the model list, the AI software list, the 216-item work taxonomy, hand lists of augmentation phrases and roles, and the 26 Nov 2026 keyword expansion. Each search carries `count_kind`: `exact` (one rare word), `co-mention` (ads using all the words somewhere: an upper bound), `unreliable` (common words only: never charted) or `title`.
- `plan_counts.py`: turns queries into free JobsPipe count jobs over three 30-day windows.
- `classify.py`: labels how a full ad mentions AI: the hire uses it (duty), the employer screens applicants with it (hiring), or it is only the employer's pitch (company). Hand check: 37 of 40 right.
- `aggregate.py`: turns counts plus the full-ad database into chart data. Shares are taken inside one window, because JobsPipe's coverage grows month to month.

Full ads are kept in a separate private data store, not in this repo.

Known traps, found by checking counts: JobsPipe matches every word of a phrase in any order, so "ai agents" matches any ad with both words. Short model names collide: "phi-3" matched PHI (health data), "falcon llm" matched CrowdStrike Falcon, "glm-4" matched generalized linear models.
