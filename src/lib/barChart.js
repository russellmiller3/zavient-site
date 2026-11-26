// Draws a horizontal bar chart as a standalone SVG string: one series, one color (#1F5FBF, the site's --blue token in
// public/ai-work/ai-work.css; an embedded SVG can't read CSS variables, so the value is written out), value labels at the bar ends, 4px rounded far ends, a 2px gap
// between bars, and a source credit line that links readers back to zavient.com. Used by the data-story pages and
// by the /data/<slug>.svg files people embed.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function barChartSvg({ title, subtitle = '', bars, format = (v) => v.toLocaleString('en-US'), credit, showNotes = false }) {
  // With showNotes, each bar's note (e.g. "28 ads, small sample") follows its value, so the bars leave room on the
  // right for the longest value and note (about 9px a value character at 15px bold, 6.6px a note character at 13px).
  const textW = (b) => format(b.value).length * 9 + (showNotes && b.note ? (b.note.length + 3) * 6.6 : 0);
  const W = 760, left = 250, right = Math.max(showNotes ? 150 : 90, Math.ceil(16 + Math.max(...bars.map(textW)))), top = subtitle ? 78 : 56, barH = 26, gap = 10, foot = 44;
  const H = top + bars.length * (barH + gap) + foot;
  const max = Math.max(...bars.map((b) => b.value));
  const plotW = W - left - right;
  const rows = bars.map((b, i) => {
    const y = top + i * (barH + gap);
    const w = Math.max(2, (b.value / max) * plotW);
    const r = Math.min(4, w / 2);
    // Path rounds only the far (data) end; the bar stays square on the baseline.
    const d = `M${left},${y} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${barH - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(w - r)} z`;
    return `<g><title>${esc(b.label)}: ${esc(format(b.value))}${b.note ? ` (${esc(b.note)})` : ''}</title>` +
      `<text x="${left - 10}" y="${y + barH / 2 + 5}" text-anchor="end" font-size="15" fill="#15202E">${esc(b.label)}</text>` +
      `<path d="${d}" fill="#1F5FBF"/>` +
      `<text x="${left + w + 8}" y="${y + barH / 2 + 5}" font-size="15" font-weight="600" fill="#15202E">${esc(format(b.value))}` +
      (showNotes && b.note ? `<tspan font-size="13" font-weight="400" fill="#5F6B7A"> · ${esc(b.note)}</tspan>` : '') + `</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}" font-family="Helvetica, Arial, sans-serif">` +
    `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
    `<text x="24" y="34" font-size="20" font-weight="700" fill="#174A96">${esc(title)}</text>` +
    (subtitle ? `<text x="24" y="58" font-size="14" fill="#5F6B7A">${esc(subtitle)}</text>` : '') +
    `<line x1="${left}" y1="${top - 6}" x2="${left}" y2="${H - foot + 2}" stroke="#D8E0EA" stroke-width="1"/>` +
    rows +
    `<text x="24" y="${H - 16}" font-size="13" fill="#5F6B7A">${esc(credit)}</text>` +
    `</svg>`;
}
