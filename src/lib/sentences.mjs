// One sentence splitter for every check (26 Nov 2026). The readability check and the answer-first check each had their
// own split on ". " + capital letter, and both broke on initials and abbreviations: "J.D. Power", "U.S. Census",
// "St. Louis Fed", "No. 7", "vs. Business". A wrong split makes a long sentence look short and a short answer look
// cut off, so both checks now share this one. Add an abbreviation here when a page trips it.
const ABBREV = /(?:^|[\s("“.])(?:(?:[A-Z]\.)+[A-Z]|e\.g|i\.e|vs|etc|Inc|Co|Corp|Ltd|Dr|Mr|Mrs|Ms|St|Jr|Sr|approx|Rev|U\.S|U\.K|a\.m|p\.m)\.$/;

// Split text into sentences at ". ", "! " or "? " followed by a capital, a digit, a quote, "$" or "(", unless the
// word before the stop is dotted initials ("J.D.", "U.S.") or a listed abbreviation, or the stop sits inside a quote.
// A single capital ("revision C.", "Plan B.") still ends a sentence.
// "No. 7", "Vol. 3", "Fig. 2": an abbreviation only when a number follows, so the answer "No. Gartner says" still splits.
const NUMBERED = /(?:^|[\s("“])(?:No|Nos|Vol|Fig|Sec|pp?)\.$/;

export function splitSentences(text) {
  const t = String(text);
  const out = [];
  let start = 0;
  const re = /[.!?]["”')\]]*\s+(?=[A-Z0-9"“$(])/g;
  let m;
  while ((m = re.exec(t))) {
    const head = t.slice(start, m.index + 1);
    if (t[m.index] === '.' && ABBREV.test(head)) continue;
    if (t[m.index] === '.' && NUMBERED.test(head) && /\d/.test(t[m.index + m[0].length] || '')) continue;
    // Inside an open quote the quote's own sentences belong to the sentence that quotes them.
    const whole = head + m[0].slice(1).trimEnd();
    if ((whole.split('"').length - 1) % 2 === 1 || whole.split('“').length > whole.split('”').length) continue;
    out.push(whole);
    start = m.index + m[0].length;
  }
  out.push(t.slice(start));
  return out.map((s) => s.trim()).filter(Boolean);
}
