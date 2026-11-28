// Three template fixes from the launch check (28 Nov 2026), each made structural so it can't come back:
// 1. the eyebrow over the title is the page type's section plus a short topic, capped so it fits a phone;
// 2. the acronym check reads body text only (not the source list, source notes or logs), and knows "SI";
// 3. the role template's hand-off audience ("a plan you can hand your CEO") is a page field, handoffTo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { TYPES, eyebrowLabel, eyebrowTopic, eyebrowFor, EYEBROW_TOPIC_MAX, headingFor, offerFor, handoffFor, urlFor } from '../src/lib/page-types.mjs';
import { eyebrowProblems, handoffProblems } from '../src/lib/structure-rules.mjs';
import { acronymProblems, readerText } from '../src/lib/acronyms.mjs';

const root = new URL('../', import.meta.url).pathname;
const dir = join(root, 'src/content/ai-work');
const pages = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => [f.slice(0, -5), JSON.parse(readFileSync(join(dir, f), 'utf8'))]);

test('each page type names its own section in the eyebrow, matching its URL folder', () => {
  const want = { usecase: 'AI work', crossing: 'AI work', industry: 'Industries', compare: 'Compare', regulation: 'AI rules', role: 'Roles', consulting: 'AI consulting', tool: 'Free tool', guide: 'Guides' };
  for (const [type, label] of Object.entries(want)) assert.equal(eyebrowLabel({ type }), label, type);
  for (const name of Object.keys(TYPES)) assert.ok(TYPES[name].eyebrow, `${name}: needs an eyebrow label`);
});

test('the eyebrow topic is short, derived from topic, and overridable with shortTopic', () => {
  // The launch bug: compare pages printed the whole job text
  const compare = { type: 'compare', title: 'Family office software: which stack fits an office of 5 to 20?', topic: 'family office software', job: 'choose a software stack for a family office of 5 to 20 people' };
  assert.equal(eyebrowFor(compare), 'Compare · Family office software');
  assert.equal(eyebrowTopic({ type: 'industry', title: 'x', topic: 'AI for accounting and CPA firms' }), 'Accounting and CPA firms');
  assert.equal(eyebrowTopic({ type: 'regulation', title: 'x', topic: 'AI model risk management after SR 11-7 (SR 26-2)' }), 'Model risk management after SR 11-7');
  assert.equal(eyebrowTopic({ type: 'compare', title: 'x', topic: 'ChatGPT vs Claude vs Microsoft Copilot for your team' }), 'ChatGPT vs Claude vs Microsoft Copilot');
  assert.equal(eyebrowTopic({ type: 'consulting', title: 'x', topic: 'AI consulting for small businesses' }), 'Small businesses');
  assert.equal(eyebrowTopic({ type: 'tool', title: 'x', topic: 'AI ROI calculator' }), 'AI ROI calculator');
  assert.equal(eyebrowTopic({ type: 'usecase', title: 'x', topic: 'A very long topic', shortTopic: 'Short one' }), 'Short one');
});

test('the page check fails an eyebrow topic over the cap or one that repeats the section name', () => {
  assert.ok(eyebrowProblems({ type: 'usecase', title: 'x', topic: 'Hiring an AI engineer vs bringing in some help' }).some((p) => /characters/.test(p)));
  assert.ok(eyebrowProblems({ type: 'consulting', title: 'x', topic: 'AI consulting' }).some((p) => /repeats the section/.test(p)));
  assert.deepEqual(eyebrowProblems({ type: 'usecase', title: 'x', topic: 'AI account reconciliation' }), []);
});

test('every page has an eyebrow that passes, with no hand edit beyond an optional shortTopic', () => {
  const bad = [];
  for (const [s, d] of pages) {
    for (const p of eyebrowProblems(d)) bad.push(`${s}: ${p}`);
    assert.ok(eyebrowTopic(d).length <= EYEBROW_TOPIC_MAX, s);
  }
  assert.deepEqual(bad, []);
});

test('the built page shows the short eyebrow, never the job text', () => {
  const dist = join(root, 'dist');
  if (!existsSync(dist)) return;
  for (const [s, d] of pages) {
    const file = join(dist, urlFor(d, s));
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    const m = html.match(/<div class="label eyebrow"[^>]*>([^<]*)<\/div>/);
    assert.ok(m, `${s}: no eyebrow`);
    assert.equal(m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'"), eyebrowFor(d), s);
  }
});

test('the acronym check reads body text only and knows SI', () => {
  // The launch miss: "SI" used in the body, spelled out only in a source note
  const page = {
    summary: 'The OCC framework covers SI use at banks.[^1]',
    stats: [{ num: '1', label: 'framework[^1]', source: 'OCC, super intelligence (SI) framework' }],
    sources: [{ name: 'OCC', url: 'https://www.occ.gov/', what: 'Super intelligence (SI) framework for examiners.' }],
    sourceCheck: { date: '2026-11-28', by: 'x', checked: 1, fixed: ['renamed to Super Intelligence (SI)'] },
  };
  assert.ok(acronymProblems(page).some((p) => p.includes('"SI"')));
  assert.equal(acronymProblems({ ...page, summary: 'The OCC framework covers super intelligence (SI) use at banks.[^1]' }).filter((p) => p.includes('"SI"')).length, 0);
  const t = readerText(page);
  assert.doesNotMatch(t, /super intelligence/i);
  assert.match(t, /framework\[\^1\]/);
});

test('the role template hands the plan to the page\'s handoffTo, CEO by default', () => {
  const role = { type: 'role', templateVersion: 1, title: 'Where should a family office COO start with AI?', topic: 'AI for family office COOs', job: 'x' };
  assert.equal(handoffFor(role), 'CEO');
  assert.match(offerFor(role), /hand your CEO\.$/);
  assert.equal(headingFor(role, 'forward'), 'The one-page brief to hand your CEO');
  const fo = { ...role, handoffTo: 'principal' };
  assert.match(offerFor(fo), /hand your principal\.$/);
  assert.equal(headingFor(fo, 'forward'), 'The one-page brief to hand your principal');
  assert.equal(headingFor(fo, 'faq'), 'What will your principal, board or examiner ask?');
  // A page whose own copy says "hand your principal" while the template still says CEO is flagged
  const mixed = { ...role, offer: { heading: 'x', body: 'Your top 2 workflows ranked, and a one-page plan you can hand your principal.' } };
  assert.ok(handoffProblems(mixed).some((p) => /handoffTo/.test(p)));
  assert.deepEqual(handoffProblems({ ...mixed, handoffTo: 'principal' }), []);
  for (const [name, t] of Object.entries(TYPES)) if (t.offer) assert.doesNotMatch(offerFor({ type: name, job: 'x' }), /\{/, name);
});
