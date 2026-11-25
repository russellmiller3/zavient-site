// Turns a data story's chart spec into the SVG string, CSV text and credit line, so the page, the .svg file and the
// .csv file all show exactly the same numbers. kind 'bar' (default) draws bars; kind 'line' draws one series over time.
import { barChartSvg } from './barChart.js';
import { lineChartSvg } from './lineChart.js';

export const fmt = (unit) => (v) =>
  unit === 'usd' ? `$${Math.round(v / 1000)}K` : unit === 'percent' ? `${Number.isInteger(v) ? v : Number(v).toFixed(2)}%` : v.toLocaleString('en-US');
export const credit = (id, extra) => `Source: ${extra ? `${extra}; ` : ''}Zavient analysis · zavient.com/data/${id}.html`;
export const storySvg = (id, chart) => {
  const args = { title: chart.title, subtitle: chart.subtitle, format: fmt(chart.unit), credit: credit(id, chart.creditSource) };
  return chart.kind === 'line' ? lineChartSvg({ ...args, points: chart.bars }) : barChartSvg({ ...args, bars: chart.bars });
};
export const storyCsv = (chart) =>
  ['label,value,note', ...chart.bars.map((b) => [b.label, b.value, b.note || ''].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n') + '\n';
