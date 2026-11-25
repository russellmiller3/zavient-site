// Writes /data/<slug>.svg for each data story: the embeddable chart image, credited and linked to zavient.com.
import { getCollection } from 'astro:content';
import { storySvg } from '../../lib/storyChart.js';

export async function getStaticPaths() {
  return (await getCollection('datastory')).map((s) => ({ params: { slug: s.id }, props: { story: s } }));
}
export function GET({ props }) {
  return new Response(storySvg(props.story.id, props.story.data.chart), { headers: { 'Content-Type': 'image/svg+xml' } });
}
