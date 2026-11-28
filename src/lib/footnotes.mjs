// Footnote placement (28 Nov 2026). The site's convention: the marker follows the punctuation, "gaps.[^1]", which 40
// of 71 pages wrote and Fn.astro has rendered since round 6. 31 pages wrote "gaps[^1].", and the hand-written pages
// (about, home) put <sup> before the full stop. Rather than edit content, every render path normalises:
// - placeFootnotes(text): page text before it renders (Fn.astro, and anything else that prints [^n]);
// - placeRenderedFootnotes(html): the built HTML, run on every page after the build (src/integrations/footnotes.mjs),
//   so a hand-written <sup class="fn"> gets the same placement;
// and tests/footnotes.test.mjs fails the build if a marker sits before punctuation or a raw [^n] reaches a reader.
const PUNCT = '[.,;:!?]';
// "gaps [^1][^4]." -> "gaps.[^1][^4]": no space before a marker, punctuation in front of it.
export function placeFootnotes(text) {
  return String(text)
    .replace(/[ \t]+((?:\[\^\d+\])+)/g, '$1')
    .replace(new RegExp(`((?:\\[\\^\\d+\\])+)(${PUNCT}+)`, 'g'), '$2$1');
}
// The same on built HTML: "gaps <sup class="fn">…</sup>." -> "gaps.<sup class="fn">…</sup>". Script and style
// bodies are left alone.
const SUP = '<sup class="fn">(?:(?!</sup>)[\\s\\S])*</sup>';
export function placeRenderedFootnotes(html) {
  return String(html).split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/i).map((part, i) => (i % 2 ? part : part
    .replace(new RegExp(`[ \\t]+(${SUP})`, 'g'), '$1')
    .replace(new RegExp(`((?:${SUP})+)(${PUNCT}+)`, 'g'), '$2$1'))).join('');
}
// What the check looks for in built HTML (outside scripts and styles): a marker before punctuation, a space before a
// marker, or a raw [^n] a reader would see.
export function renderedFootnoteProblems(html) {
  const body = String(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '');
  const out = [];
  const before = body.match(new RegExp(`.{0,40}</sup>${PUNCT}`));
  if (before && new RegExp(`${SUP}${PUNCT}`).test(body)) out.push(`footnote before punctuation: "${before[0]}"`);
  const space = body.match(new RegExp(`.{0,30}[ \\t]${SUP}`));
  if (space) out.push(`space before a footnote: "${space[0].slice(0, 60)}"`);
  const raw = body.match(/.{0,40}\[\^\d+\].{0,10}/);
  if (raw) out.push(`raw footnote marker shown to the reader: "${raw[0]}"`);
  return out;
}
