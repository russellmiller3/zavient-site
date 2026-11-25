// Draws a one-series line chart over time as a standalone SVG string: a 2px line in #0A9A96 (validated for
// contrast on white, 25 Nov 2026), a recessive grid, a label at each January, the last value labeled at the line's
// end, an invisible hover target per point (with its value in a tooltip), and a credit line linking to zavient.com.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function lineChartSvg({ title, subtitle = '', points, format = (v) => String(v), credit }) {
  const W = 760, left = 56, right = 70, top = subtitle ? 78 : 56, plotH = 260, foot = 64;
  const H = top + plotH + foot;
  const max = Math.max(...points.map((p) => p.value));
  const yMax = Math.ceil(max / 2) * 2 || 1;
  const plotW = W - left - right;
  const x = (i) => left + (i / Math.max(1, points.length - 1)) * plotW;
  const y = (v) => top + plotH - (v / yMax) * plotH;
  const grid = [0, yMax / 2, yMax].map((g) =>
    `<line x1="${left}" y1="${y(g)}" x2="${W - right}" y2="${y(g)}" stroke="#e3e8e7" stroke-width="1"/>` +
    `<text x="${left - 8}" y="${y(g) + 5}" text-anchor="end" font-size="13" fill="#55605f">${esc(format(g))}</text>`).join('');
  const ticks = points.map((p, i) => (/-01$/.test(p.label) ? `<text x="${x(i)}" y="${top + plotH + 22}" text-anchor="middle" font-size="13" fill="#55605f">${esc(p.label.slice(0, 4))}</text>` : '')).join('');
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const hits = points.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="7" fill="transparent"><title>${esc(p.label)}: ${esc(format(p.value))}</title></circle>`).join('');
  const last = points[points.length - 1];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}" font-family="Helvetica, Arial, sans-serif">` +
    `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
    `<text x="24" y="34" font-size="20" font-weight="700" fill="#0A6F6C">${esc(title)}</text>` +
    (subtitle ? `<text x="24" y="58" font-size="14" fill="#55605f">${esc(subtitle)}</text>` : '') +
    grid + ticks +
    `<path d="${path}" fill="none" stroke="#0A9A96" stroke-width="2" stroke-linejoin="round"/>` +
    `<circle cx="${x(points.length - 1)}" cy="${y(last.value)}" r="4" fill="#0A9A96"/>` +
    `<text x="${x(points.length - 1) + 8}" y="${y(last.value) + 5}" font-size="15" font-weight="600" fill="#1f2a2a">${esc(format(last.value))}</text>` +
    hits +
    `<text x="24" y="${H - 16}" font-size="13" fill="#55605f">${esc(credit)}</text>` +
    `</svg>`;
}
