'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { normalize, compileAnswerSet, validateAnswers, secureCode } = require('../server/multiplayer/core');
const { catalog, checkCatalog, adjudicate, byCategory } = require('../server/multiplayer/objective-mentiroso');

const summary = checkCatalog();
assert.strictEqual(summary.count, 6);
assert.strictEqual(summary.answerCount, 29);
assert.strictEqual(normalize('  Bayern  MÚNICH! '), 'bayern munich');
assert.match(secureCode(), /^[0-9A-F]{10}$/);
assert.strictEqual(new Set(catalog.challenges.map(c => c.category)).size, 6);

for (const challenge of catalog.challenges) {
  assert.ok(challenge.source_urls.every(src => /^https:\/\//.test(src)));
  assert.strictEqual(byCategory(challenge.category).length, 1);
  assert.strictEqual(compileAnswerSet(challenge.answers).size >= challenge.answers.length, true);
  const answers = challenge.answers.map(item => item.label);
  const exact = adjudicate(challenge, answers, answers.length);
  assert.strictEqual(exact.wasMentiroso, false);
  assert.strictEqual(exact.validCount, answers.length);
  assert.strictEqual(exact.details.every(d => d.accepted), true);
  const incomplete = adjudicate(challenge, answers.slice(0, 1), answers.length);
  assert.strictEqual(incomplete.wasMentiroso, true);
}

const ucl = byCategory('Champions League')[0];
const dupes = adjudicate(ucl, ['Bayern München', 'Bayern Múnich', 'PSG', 'Real Madrid'], 4);
assert.strictEqual(dupes.validCount, 3);
assert.strictEqual(dupes.details[1].reason, 'duplicate');
const fake = adjudicate(ucl, ['Dinamo Zagreb', 'Bayern Munich'], 2);
assert.strictEqual(fake.validCount, 1);
assert.strictEqual(fake.details[0].accepted, false);
assert.throws(() => adjudicate(ucl, ['Bayern Munich'], 5), /Invalid bid/);
assert.throws(() => adjudicate(ucl, ['Bayern Munich'], 1.5), /Invalid bid/);
assert.throws(() => validateAnswers(ucl.answers, Array(101).fill('PSG')), /Invalid/);
assert.throws(() => compileAnswerSet([{ id: 'a', label: 'Boca' }, { id: 'b', label: 'BÓCA' }]), /Ambiguous/);

const serverSource = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
assert.ok(serverSource.includes("const OBJECTIVE_MENTIROSO = process.env.CT_STAGING === 'true' && process.env.CT_OBJECTIVE_MENTIROSO === 'true'"));
assert.ok(serverSource.includes('objectiveMentiroso.adjudicate('));
assert.ok(serverSource.includes('gameType: targetGameType'));
console.log('OBJECTIVE MENTIROSO: PASS (' + summary.count + ' sourced categories; ' + summary.answerCount + ' canonical entries; no fuzzy acceptance).');
