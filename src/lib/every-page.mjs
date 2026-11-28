// Checks that hold on every page, indexed or not (28 Nov 2026). The build's page check runs with --indexed, so a
// noindex hub (family-offices) with 11 related links passed it and only the node test that loops over every page
// caught it. That test and scripts/check-page.mjs now share this list, so a single-page check-page run, and the
// build's --indexed run (which checks these on noindex pages too), report exactly what the test would.
import { pageLeadProblems } from './lead-rules.mjs';
import { staleProblems } from './stale-rules.mjs';
import { rivalProblems } from './rival-firms.mjs';
import { acronymProblems } from './acronyms.mjs';
import { structureProblems } from './structure-rules.mjs';
import { searchResultProblems } from './source-rules.mjs';
import { paddingProblems } from './source-numbers.mjs';

export function everyPageProblems(d, slugs = null) {
  return [
    ...pageLeadProblems(d).map((p) => `lead: ${p}`),
    ...staleProblems(d).map((p) => `stale rule: ${p}`),
    ...rivalProblems(d).map((p) => `rival firm: ${p}`),
    ...acronymProblems(d).map((p) => `acronym: ${p}`),
    ...structureProblems(d, slugs).map((p) => `structure: ${p}`),
    ...searchResultProblems(d.sources),
    // Padding (28 Nov 2026): every footnote on a figure states it. A warning until the 150 padded footnotes on 58
    // pages were moved, dropped or given their own clause; now a failure on every page, so it can't come back.
    ...paddingProblems(d).map((p) => `footnote: ${p}`),
  ];
}
