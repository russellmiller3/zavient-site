// Draws a horizontal bar chart as a standalone SVG string: one series, one color (#0A9A96, validated for contrast
// on white with the dataviz validator, 25 Nov 2026), value labels at the bar ends, 4px rounded far ends, a 2px gap
// between bars, and a source credit line that links readers back to zavient.com. Used by the data-story pages and
// by the /data/<slug>.svg files people embed.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function barChartSvg({ title, subtitle = '', bars, format = (v) => v.toLocaleString('en-US'), credit }) {
  const W = 760, left = 250, right = 90, top = subtitle ? 78 : 56, barH = 26, gap = 10, foot = 44;
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
      `<text x="${left - 10}" y="${y + barH / 2 + 5}" text-anchor="end" font-size="15" fill="#1f2a2a">${esc(b.label)}</text>` +
      `<path d="${d}" fill="#0A9A96"/>` +
      `<text x="${left + w + 8}" y="${y + barH / 2 + 5}" font-size="15" font-weight="600" fill="#1f2a2a">${esc(format(b.value))}</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}" font-family="Helvetica, Arial, sans-serif">` +
    `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
    `<text x="24" y="34" font-size="20" font-weight="700" fill="#0A6F6C">${esc(title)}</text>` +
    (subtitle ? `<text x="24" y="58" font-size="14" fill="#55605f">${esc(subtitle)}</text>` : '') +
    `<line x1="${left}" y1="${top - 6}" x2="${left}" y2="${H - foot + 2}" stroke="#c9d1d0" stroke-width="1"/>` +
    rows +
    `<text x="24" y="${H - 16}" font-size="13" fill="#55605f">${esc(credit)}</text>` +
    `</svg>`;
}
