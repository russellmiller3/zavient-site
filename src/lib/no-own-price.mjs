// No Zavient price anywhere (Russell, 26 Nov 2026: "No dont have a starting prcie", then "Take off" for the
// $10,000 sprint and the $5,000 to $10,000 a month advisory). The offer is the free 30-minute diagnostic, with no
// price or range. Market prices with a source (vendor plans, salaries, project surveys) stay. This flags any
// sentence that puts a money amount next to Zavient's own offer: Zavient, "our" sprint/advisory/fee, or the Sprint.
const MONEY = /[$€£]\s?\d|\b\d[\d,.]*\s?(k|K|USD|dollars?)\b/;
const OURS = /\b(zavient'?s? (own )?(fixed[- ]scope )?(30-day )?(ai )?(sprint|advisory|fees?|retainer|rates?)|our (own )?(fixed[- ]scope )?(30-day )?(ai )?(sprint|advisory|fees?|retainer|rates?)\b|ai sprint|the sprint|30-day sprint|ongoing advisory|advisory (is|costs|runs|from|at)\b|sprint (is|costs|runs|at)\b)/i;
// Every string in a page's JSON (reviewer notes left out), one field at a time.
export const strings = (v, k = '') => k === 'reviews' ? [] : typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.entries(v).flatMap(([kk, x]) => strings(x, kk)) : [];
export function ownPriceProblems(text) {
  const s = String(text).replace(/\[\^\d+\]/g, '').replace(/\s+/g, ' ');
  return s.split(/(?<=[.!?;])\s+/).filter((x) => MONEY.test(x) && OURS.test(x)).map((x) => `Zavient price: "${x.trim().slice(0, 120)}"`);
}
