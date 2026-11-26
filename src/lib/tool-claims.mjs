// Tool-embed figure check (round 6, 26 Nov 2026). The build thread found the ROI calculator's reality check saying
// "measured results run from about 2% to 40%" with no source: the page check reads page JSON only, and the tools in
// public/tools/embed/*.html are hand-written HTML and script. Russell: "Make it so every fix is structual to templates
// so it doesnt reoccur". So every line of a tool that shows a figure (a % or a money amount) in a sentence must carry
// a source marker, on the line or the lines around it, or where the text is shown:
// - a link (href=, L(...)), a footnote (fn(...), fns(...), [^N], [key]), a source list (src: [...]),
// - or a Zavient-judgment marker (ZM(...), EST(...), est: true, "Zavient estimate", "by our math", "illustrative").
// A figure set in a data object or function and shown elsewhere counts as sourced when the line that shows it
// (`${...name...}` or esc(...name...)) carries a marker. Comments and source entries (lines with a URL) are skipped.
export const SOURCED = /href=|\bL\(|\bfns?\(|\bZM\(|zavient (?:judgment|estimate|method)|\[\^|\bEST\(|\bSRC\(|\bsrc\(|\bsrc:\s*\[\s*["']|\[[a-z_]{2,}\d*\]|\best:\s*true|class="(?:src|tag|note src)[^"]*"|our math|by our|illustrative/i;
const FIG = /(?:\b\d[\d,]*(?:\.\d+)?\s?%|[$€£]\s?\d[\d,.]*\s?[kKmMbB]?\b)/g;
const OPENER = /(?:const|let|var)\s+(\w+)\s*=\s*[{[(]|^\s*["']?(\w+)["']?\s*:\s*[{[]|function\s+(\w+)\s*\(/;

export function toolClaims(html) {
  const out = [];
  const lines = html.replace(/<style[\s\S]*?<\/style>/gi, (m) => m.replace(/[^\n]/g, '')).split('\n');
  const shown = (name) => {
    const at = new RegExp(`\\$\\{[^}]*\\b${name}\\b|esc\\([^)]*\\b${name}\\b`);
    return lines.some((l) => at.test(l) && SOURCED.test(l));
  };
  lines.forEach((l, i) => {
    if (/^\s*(?:\/\/|\/\*|\*)/.test(l) || /https?:\/\/|\burl\s*:/.test(l)) return;
    const t = l.replace(/<[^>]+>/g, ' ').replace(/\$\{[^}]*\}/g, 'X').replace(/(['"`])[$€£−-]?\d[\d,.]*%?\1/g, 'X');
    const figs = t.match(FIG);
    if (!figs || (t.match(/\b[a-z]{3,}\b/gi) || []).length < 6) return;
    if (SOURCED.test([lines[i - 1], l, lines[i + 1], lines[i + 2]].join(' '))) return;
    // The name this figure is set under: its own line, or the nearest object or function it sits in.
    for (let j = i; j >= Math.max(0, i - 12); j--) {
      const m = lines[j].match(OPENER);
      if (m) { if (shown(m[1] || m[2] || m[3])) return; break; }
    }
    out.push(`line ${i + 1}: ${figs.join(', ')}: "${t.trim().slice(0, 110)}"`);
  });
  return out;
}
