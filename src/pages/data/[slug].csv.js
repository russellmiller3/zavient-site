// Writes /data/<slug>.csv for each data story: the chart's numbers, for anyone who wants to cite or re-chart them.
import { getCollection } from 'astro:content';
import { storyCsv } from '../../lib/storyChart.js';

export async function getStaticPaths() {
  return (await getCollection('datastory')).map((s) => ({ params: { slug: s.id }, props: { story: s } }));
}
export function GET({ props }) {
  return new Response(storyCsv(props.story.data.chart), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
}
