// Golden templates (26 Nov 2026): every page type keeps the Site rules in its block order, and the publish gate
// refuses a page that breaks them. These run without a build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TYPES, BLOCKS, REVIEWERS } from '../src/lib/page-types.mjs';
import { gate } from '../scripts/check-page.mjs';

test('every page type keeps the rule order: teach first, alternatives after buy-or-build, people stay in charge', () => {
  for (const [name, t] of Object.entries(TYPES)) {
    for (const id of t.order) assert.ok(BLOCKS[id], `${name}: unknown block ${id}`);
    assert.ok(t.order.includes('human-role'), `${name}: no "where your team stays in charge" block (augmentation rule)`);
    assert.ok(t.order.includes('faq'), `${name}: no FAQ block`);
    const at = (id) => t.order.indexOf(id);
    if (at('buy-or-build') > -1 && at('something-else') > -1) assert.ok(at('something-else') > at('buy-or-build'), `${name}: alternatives before buy-or-build`);
    if (at('something-else') > -1) for (const teach of ['what-it-is', 'example', 'recipes', 'ranked', 'decisions', 'rules', 'benchmark']) {
      if (at(teach) > -1) assert.ok(at(teach) < at('something-else'), `${name}: ${teach} comes after the alternatives`);
    }
    assert.equal(t.order.at(-2), 'sources', `${name}: sources must sit just before related links`);
  }
});

test('the ICP review order is operator first, owner-CEO last, no CFO', () => {
  assert.deepEqual(REVIEWERS, ['COO', 'Head of operations', 'GM', 'Division head', 'Owner-CEO']);
  assert.ok(!REVIEWERS.some((r) => /cfo/i.test(r)));
});

const good = () => ({
  title: 'AI account reconciliation: what can it match on its own?', type: 'usecase', templateVersion: 1,
  verdict: ['Software matches most lines first, and people review the rest [^1][^2].', 'Measure close days before and after on your own accounts [^2][^3].', 'Keep the controller signing off every reconciliation [^3][^4].'],
  summary: 'It compares your books with the bank and explains the differences [^1]. People decide the hard ones [^2].',
  humanRole: ['The controller signs off each reconciliation [^3].'],
  ownData: { title: 'What we checked?', intro: 'We checked pricing pages [^5].', headers: ['Tool'], rows: [['A [^5]']], note: 'Pulled 26 Nov 2026.' },
  example: { input: 'A month of bank lines.', output: 'Matched lines and a short exceptions list.' },
  recipes: [{ name: 'Small team', when: 'Few accounts [^6].', flow: ['Staff accountant: export', 'Controller: approve'], cost: 'Included in many ERPs [^6].' }],
  tables: [{ title: 'Tools', intro: 'Vendors [^7].', headers: ['Name', 'Price'], rows: [{ name: 'X', cells: ['Not published [^7]'] }] }],
  howToTest: ['Record today\'s close days.', 'Hold out a month.', 'Compare match rates.'],
  watchOuts: ['Wrong auto-matches slip through [^8].', 'Audit trail gaps [^9].', 'Made-up explanations [^10].'],
  faq: [{ q: 'Can AI reconcile accounts?', a: 'It can match most lines [^1].' }, { q: 'Is it allowed by auditors?', a: 'Yes, with controls [^4].' }, { q: 'What does it cost?', a: 'Most vendors quote [^7].' }],
  buyVsBuild: { buy: 'Buy when your ERP lacks it [^6].', build: 'Build rarely [^9].' },
  pickElse: ['Few accounts: use your ERP\'s built-in matching [^6].'],
  stats: [{ num: '1', label: 'a [^1]', source: 'x' }, { num: '2', label: 'b [^2]', source: 'y' }, { num: '3', label: 'c [^3]', source: 'z' }],
  offer: { heading: 'Get a free diagnostic', body: 'Thirty minutes on your close.' },
  sources: Array.from({ length: 10 }, (_, i) => ({ name: `S${i + 1}`, url: `https://site${i % 5}.example/${i}`, what: 'says something' })),
  reviews: REVIEWERS.map((reader) => ({ reader, notes: 'ok' })),
});

test('the publish gate passes a complete page and names each broken rule', () => {
  assert.deepEqual(gate(good()).fail, []);
  const fails = (patch) => gate({ ...good(), ...patch }).fail.join(' | ');
  assert.match(fails({ title: 'AI account reconciliation explained' }), /end with "\?"/);
  assert.match(fails({ title: '9 ways AI reconciles accounts?' }), /clickbait/);
  assert.match(fails({ verdict: ['Only one source here, which is not enough [^1].', ...good().verdict.slice(1)] }), /2\+ different sources/);
  assert.match(fails({ humanRole: [] }), /humanRole/);
  assert.match(fails({ summary: 'AI can replace your accountants on month-end close [^1].' }), /augmentation/);
  assert.match(fails({ pickElse: ['Hire on Upwork for cheap [^6].'] }), /Upwork/);
  assert.match(fails({ ownData: undefined }), /own-data/);
  assert.match(fails({ reviews: [...good().reviews].reverse() }), /ICP reviews/);
  assert.match(fails({ summary: 'TODO: write this' }), /TODO/);
  assert.match(fails({ watchOuts: ['No footnote on this one.', 'b [^8]', 'c [^9]'] }), /watchOut 1 has no footnote/);
});

test('a crossing page must differ from its parent on 4 of 6 dimensions', () => {
  const base = { ...good(), type: 'crossing', rules: [{ name: 'r', url: 'https://x.example', status: 'In force', what: 'w [^4]' }] };
  assert.match(gate({ ...base, differs: [{ what: 'problem', how: 'x' }] }).fail.join(' '), /differs from its parent on 1 of 6/);
  const four = ['problem', 'jobs', 'workflow', 'evidence'].map((what) => ({ what, how: 'x' }));
  assert.ok(!gate({ ...base, differs: four }).fail.some((f) => /differs/.test(f)));
});
