'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { normalize, compileAnswerSet, validateAnswers, secureCode } = require('../server/multiplayer/core');
const { catalog, checkCatalog, adjudicate, byCategory, MIN_VERIFIED_ANSWERS } = require('../server/multiplayer/objective-mentiroso');

const summary = checkCatalog();
assert.strictEqual(summary.count, 6);
assert.strictEqual(summary.answerCount, 170);
assert.strictEqual(summary.minAnswers, 20);
assert.strictEqual(summary.minObserved, 20);
assert.strictEqual(summary.maxObserved, 32);
assert.strictEqual(normalize('  Bayern  MÚNICH! '), 'bayern munich');
assert.match(secureCode(), /^[0-9A-F]{10}$/);
assert.strictEqual(new Set(catalog.challenges.map(c => c.category)).size, 6);
for (const challenge of catalog.challenges) {
  assert.strictEqual(challenge.audit_status, 'verified_official_collection');
  assert.ok(challenge.source_urls.every(src => /^https:\/\//.test(src)));
  assert.strictEqual(byCategory(challenge.category).length, 1);
  assert.ok(challenge.answers.length >= MIN_VERIFIED_ANSWERS);
  assert.ok(compileAnswerSet(challenge.answers).size >= challenge.answers.length);
  assert.strictEqual(new Set(challenge.answers.map(a => a.id)).size, challenge.answers.length);
  const answers = challenge.answers.map(item => item.label);
  const exact = adjudicate(challenge, answers, answers.length);
  assert.strictEqual(exact.wasMentiroso, false);
  assert.strictEqual(exact.validCount, answers.length);
  assert.ok(exact.details.every(d => d.accepted));
  const incomplete = adjudicate(challenge, answers.slice(0, 1), answers.length);
  assert.strictEqual(incomplete.wasMentiroso, true);
  for (const bid of [1, 5, 10, 15, 20].filter(n => n <= answers.length)) {
    assert.strictEqual(adjudicate(challenge, answers.slice(0, bid), bid).wasMentiroso, false);
  }
  if (answers.length > 20) assert.strictEqual(adjudicate(challenge, answers.slice(0, 21), 21).wasMentiroso, false);
  assert.throws(() => adjudicate(challenge, answers, answers.length + 1), /Invalid bid/);
}

const ucl = byCategory('Champions League')[0];
const dupes = adjudicate(ucl, ['Bayern München', 'Bayern Múnich', 'PSG', 'Real Madrid'], 4);
assert.strictEqual(dupes.validCount, 3);
assert.strictEqual(dupes.details[1].reason, 'duplicate');
const fake = adjudicate(ucl, ['Dinamo Zagreb', 'Bayern Munich'], 2);
assert.strictEqual(fake.validCount, 1);
assert.strictEqual(fake.details[0].accepted, false);
assert.throws(() => adjudicate(ucl, ['Bayern Munich'], 1.5), /Invalid bid/);
assert.throws(() => validateAnswers(ucl.answers, Array(101).fill('PSG')), /Invalid/);
assert.throws(() => compileAnswerSet([{ id: 'a', label: 'Boca' }, { id: 'b', label: 'BÓCA' }]), /Ambiguous/);

// Regression: no subset with 4-7 players may ever enter competitive rotation.
const fixture = JSON.parse(JSON.stringify(catalog));
fixture.challenges[0].answers = fixture.challenges[0].answers.slice(0, 7);
assert.throws(() => checkCatalog(fixture), /fewer than 20/);
const duplicate = JSON.parse(JSON.stringify(catalog));
duplicate.challenges[0].answers[1].id = duplicate.challenges[0].answers[0].id;
assert.throws(() => checkCatalog(duplicate), /Duplicate or missing/);
const unverified = JSON.parse(JSON.stringify(catalog));
unverified.challenges[0].audit_status = 'pending';
assert.throws(() => checkCatalog(unverified), /Unverified/);

const serverSource = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
assert.match(serverSource,/const CT_ARENA_RUNTIME = process\.env\.CT_STAGING === 'true' \|\| CT_ARENA_PRODUCTION/);
assert.match(serverSource,/const OBJECTIVE_MENTIROSO = CT_ARENA_RUNTIME && process\.env\.CT_OBJECTIVE_MENTIROSO === 'true'/);
assert.match(serverSource,/const CT_ARENA_PRODUCTION = process\.env\.CT_ARENA_PRODUCTION === 'true'/);
assert.ok(serverSource.includes('objectiveMentiroso.adjudicate('));
assert.ok(serverSource.includes('gameType: targetGameType'));
console.log('OBJECTIVE MENTIROSO: PASS (' + summary.count + ' sourced categories; ' + summary.answerCount + ' canonical entries; min=' + summary.minObserved + ', max=' + summary.maxObserved + '; no subjective validation).');
