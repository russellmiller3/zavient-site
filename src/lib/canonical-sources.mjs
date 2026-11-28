// Canonical sources (round 6, 26 Nov 2026). Russell: "Make it so every fix is structual to templates so it doesnt reoccur".
// One report, MIT NANDA's The GenAI Divide, was cited 56 times across the site from 11 URLs (MIT's own link, which
// now opens the NANDA project page, and ten third-party copies), with 56 hand-written notes that disagreed: some said
// partnered tools succeed twice as often, some three times (Fortune's "one-third as often"). The report itself says
// ~67% vs ~33%, "2x as likely". So a report many pages cite is checked once, here: its one URL and its one note,
// copied from the report by the person who read it, with the read date. The page check fails a source that names
// the report's publisher (a source named "MIT NANDA, ...") at any other URL, or whose note lacks the canonical note.
// A news write-up of the report is its own source, named for the outlet ("Fortune, on the MIT NANDA report"); it
// backs only what the outlet wrote. To add a report: read it, write its entry, run
// `node scripts/apply-canonical-sources.mjs` to set every page's copy, and rerun the build.
export const CANONICAL_SOURCES = [
  {
    id: 'mit-nanda-genai-divide',
    // A source is this report when its name starts with the publisher and names the report.
    match: /^MIT(?: Project)? NANDA\b/i,
    name: 'MIT NANDA, The GenAI Divide: State of AI in Business 2025 (Jul 2025)',
    url: 'https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf',
    what: 'MIT no longer hosts the report (its link now opens the NANDA project page, checked 26 Nov 2026); copy hosted by MLQ.ai. ' +
      'Sample: 52 organizations interviewed, survey of 153 leaders, and 300+ public AI initiatives reviewed. ' +
      '$30-40 billion of enterprise GenAI investment; 95% of organizations are getting zero return; just 5% of integrated AI pilots extract millions in value. ' +
      'Task-specific tools: 60% of organizations evaluated them, 20% piloted, 5% reached production. ' +
      'Over 80% of organizations explored or piloted ChatGPT or Copilot, and nearly 40% report deployment. ' +
      'External partnerships with customized tools reached deployment about 67% of the time vs about 33% for internal builds: 2x as likely, twice the success rate. ' +
      'Only 40% of companies purchased an official LLM subscription; workers at over 90% of companies surveyed use personal AI tools for work. ' +
      'For mission-critical work, 90% of users prefer humans. ' +
      'Enterprises, defined as firms with over $100 million in annual revenue, lead in pilot count but report the lowest pilot-to-scale conversion. Read 26 Nov 2026.',
  },
  {
    // Fortune's write-up of the same report (28 Nov 2026). 22 pages cited it with hand-written notes, 13 of which
    // copied its line that internal builds succeed "only one-third as often" (about 22%), which contradicts the
    // report's ~67% vs ~33%, "2x as likely". So it gets one note too: it backs its headline, method and the 67%;
    // the ratio is MIT's. The method (interviews, a staff survey) stays in MIT's note, so a sentence citing Fortune alone isn't
    // held to the survey-group rule for figures Fortune reports from interviews. Matched by URL as well as name, since pages named it a dozen ways.
    id: 'fortune-mit-nanda',
    match: /^Fortune\b.*\b(?:MIT|NANDA|GenAI Divide)\b/i,
    matchUrl: /^https?:\/\/(?:www\.)?fortune\.com\/2025\/08\/18\/mit-report-95-percent-generative-ai-pilots/i,
    name: 'Fortune, MIT report: 95% of generative AI pilots at companies are failing (18 Aug 2025)',
    url: 'https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo/',
    what: "Fortune's write-up of MIT NANDA's The GenAI Divide report. Headline: 95% of generative AI pilots at companies are failing; " +
      'about 5% of AI pilot programs achieve rapid revenue acceleration, while the vast majority stall with little to no measurable P&L impact. ' +
      'Purchasing AI tools from specialized vendors and building partnerships succeed about 67% of the time. ' +
      "Its comparison for internal builds misstates the report, where internal builds reach deployment about a third of the time: " +
      'cite this write-up for the 67% and its headline figures only; MIT\'s report carries the internal-build rate and the "twice" comparison. Read 28 Nov 2026.',
  },
];

// Fortune's misreading, in any source note or page text: "internal builds succeed one-third as often" puts them at
// about 22% when bought tools are at 67%, but the report says about 33%, half as often. A page that repeats it
// contradicts every page that says "twice". Logs (sourceCheck) may quote it.
export const THIRD_AS_OFTEN = /\b(?:one|a)[- ]third as (?:often|likely|frequently)\b/i;
export function thirdAsOftenProblems(d) {
  const out = [];
  const walk = (o, path) => {
    if (typeof o === 'string') { if (THIRD_AS_OFTEN.test(o)) out.push(`${path}: says internal builds succeed "a third as often"; MIT's report has about 67% vs 33%, so they succeed half as often: cite MIT for the ratio`); return; }
    if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (!(path === '' && k === 'sourceCheck')) walk(v, path ? `${path}.${k}` : k);
  };
  walk(d, '');
  return out;
}

export function canonicalFor(source) {
  return CANONICAL_SOURCES.find((c) => c.match.test(String(source?.name || '')) || (c.matchUrl && c.matchUrl.test(String(source?.url || ''))));
}

export function canonicalProblems(sources = []) {
  const out = [];
  sources.forEach((s, i) => {
    const c = canonicalFor(s);
    if (!c) return;
    if (s.url !== c.url) out.push(`source ${i + 1} is ${c.name.split(':')[0]}: cite its one copy (${c.url}); run node scripts/apply-canonical-sources.mjs`);
    else if (!String(s.what || '').startsWith(c.what)) out.push(`source ${i + 1}'s note is not the report's canonical note (src/lib/canonical-sources.mjs): run node scripts/apply-canonical-sources.mjs`);
  });
  return out;
}
