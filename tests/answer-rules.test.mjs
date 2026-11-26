// Rules 8-10 of the answer-first check (src/lib/answer-first.mjs), added 26 Nov 2026 after a semantic audit found
// answers that passed the shape checks while dodging the question. Pure unit tests: no build needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answerProblems, sentencesOf } from '../src/lib/answer-first.mjs';

const has = (q, a, word) => answerProblems(q, a).some((p) => p.includes(word));

test('rule 8: a two-part heading joined by ", and" needs at least 2 sentences', () => {
  const q = 'What is AI for wealth management, and what does it change?';
  assert.ok(has(q, 'AI for wealth management drafts advisor work: meeting notes and follow-up emails.[^2]', 'two-part'));
  assert.ok(!has(q, 'AI for wealth management drafts advisor work.[^2] What changes is time: advisers save 4 hours a week.[^10]', 'two-part'));
  assert.ok(!has('How many advisers use AI, and who was asked?', 'Between half and nine in ten use AI: 52% of 2,906 respondents. Each survey asked a different group.', 'two-part'));
  // One question, even with "and" inside it, needs no second sentence.
  assert.ok(!has('What do bots and agents cost?', 'A bot is $150 a month.', 'two-part'));
  // Footnotes after the period still split into sentences.
  assert.equal(sentencesOf('One.[^1][^2] Two.[^3]').length, 2);
});

test('rule 9: a difference heading needs a contrast word in the first sentence', () => {
  const q = 'What is the real difference?';
  assert.ok(has(q, 'All three connect your business apps and run multi-step workflows.', 'difference'));
  assert.ok(has('What is the difference between an AI agent and an RPA bot?', 'A bot follows a fixed script, so the same input gives the same output. An agent can vary.', 'difference'));
  assert.ok(!has(q, 'An RPA bot repeats a fixed script, while an AI agent picks its next step from the input.', 'difference'));
  assert.ok(!has(q, 'Zapier is easier than Make, and Workato adds test stages.', 'difference'));
  // Only these headings are held to it.
  assert.ok(!has('Which tool should we pick?', 'Pick Zapier for non-technical staff.', 'difference'));
});

test('rule 10: a cost heading needs a figure in the first two sentences, and dates do not count', () => {
  const q = 'What does portfolio monitoring software cost?';
  assert.ok(has(q, 'The platforms we checked publish no price, so expect a quote. Read on 26 Nov 2026.', 'first two sentences'));
  assert.ok(has('How much does an AI agent cost to run?', 'Agents are metered per call. Prices were read in 2026. A run is $0.05.', 'first two sentences'));
  assert.ok(!has(q, 'Expect a yearly quote. Buyers report a median contract of $201,144 a year.', 'first two sentences'));
  assert.ok(!has('How much does an AI agent cost to run compared with a bot?', 'A bot is a flat fee, while an agent costs about 5 credits an action.', 'first two sentences'));
  // Other cost-shaped headings keep only the older first-sentence check.
  assert.ok(!has('Which platform is cheapest?', 'Make is cheapest at volume.', 'first two sentences'));
});
