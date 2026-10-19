'use strict';
const assert = require('node:assert/strict');
const bank = require('../assets/data/pasalache_2025.json');
const top10 = require('../assets/data/top10_pool.json');
const oldTop10 = require('../assets/data/top10_pool_extended.json');
const wordle = require('../assets/data/wordle_pool.json');
const verified = require('../docs/football-facts-2026-10-19.json');

const normalize = text => String(text || '').toLowerCase()
  .replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/œ/g, 'oe')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

assert.equal(bank.length, 26, 'Pasala: alphabet must have 26 entries');
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
for (const letter of letters) {
  const matches = bank.filter(group => group.letra === letter);
  assert.equal(matches.length, 1, 'Pasala: unique letter ' + letter);
  assert.ok(matches[0].preguntas.length >= 1, 'Pasala: populated letter ' + letter);
}
const all = bank.flatMap(group => group.preguntas.map(q => ({...q, letter:group.letra})));
const questions = new Set();
for (const q of all) {
  assert.ok(typeof q.pregunta === 'string' && q.pregunta.length >= 12);
  assert.ok(typeof q.respuesta === 'string' && q.respuesta.trim());
  assert.ok(!questions.has(q.pregunta), 'Duplicate Pasala prompt: ' + q.pregunta);
  questions.add(q.pregunta);
}
assert.equal(verified.questions.length, verified.newQuestionCount);
assert.equal(verified.newQuestionCount, 29);
for (const fact of verified.questions) {
  const q = all.find(row => row.letter === fact.letter && row.pregunta === fact.pregunta);
  assert.ok(q, 'Missing sourced Pasala fact: ' + fact.pregunta);
  assert.equal(q.respuesta, fact.respuesta);
  assert.deepEqual(q.respuestasAlternativas || [], fact.acceptedAlternatives);
  assert.ok(normalize(q.respuesta).toUpperCase().includes(fact.letter),
    'Pasala answer must match its letter: ' + fact.pregunta);
  assert.equal(fact.verifiedAt, verified.cutoff);
  assert.ok(fact.sourceUrls.every(url => /^https:\/\/(www\.fifa\.com|inside\.fifa\.com|www\.uefa\.com|gol\.conmebol\.com|www\.conmebol\.com|www\.afa\.com\.ar)\//.test(url)));
  const acceptable = [q.respuesta, ...(q.respuestasAlternativas || [])].map(normalize);
  assert.equal(new Set(acceptable).size, acceptable.length, 'Redundant alias: ' + fact.pregunta);
}
const official = top10.filter(x => x.source_url && x.verified_at);
assert.equal(official.length, 7, 'Seven official UEFA challenges must be available');
for (const topic of official) {
  assert.equal(topic.verified_at, verified.cutoff);
  assert.match(topic.source_url, /^https:\/\/www\.uefa\.com\//);
  assert.equal(topic.answers.length, 10);
  assert.equal(new Set(topic.answers.map(normalize)).size, 10,
    'Every Top10 slot must be independently guessable: ' + topic.id);
  assert.equal(topic.hints.length, 10);
}
assert.ok(oldTop10.every(item => !item.source_url), 'Unverified legacy topics must not enter audited rotation');
assert.ok(wordle.length > 0);
assert.equal(new Set(wordle.map(item => normalize(item.answer))).size, wordle.length,
  'Wordle words must remain unique');
assert.ok(wordle.every(item => item.answer && normalize(item.answer).length >= 3 &&
  normalize(item.answer).length <= 11), 'Wordle entries must fit responsive board');

const qsmLevel1 = require('../assets/data/level_1.json').preguntas;
const qsmFacts = require('../docs/football-facts-qsm-2026-10-19.json');
assert.equal(qsmFacts.cutoff, verified.cutoff, 'QSM source registry dated with review cutoff');
assert.equal(qsmLevel1.length, qsmFacts.reviewedQuestions + qsmFacts.newQuestions,
  'QSM bank must preserve existing questions and include verified additions');
assert.equal(qsmFacts.questions.filter(fact => fact.kind === 'new').length, qsmFacts.newQuestions);
assert.equal(qsmFacts.questions.filter(fact => fact.kind === 'recovered').length, qsmFacts.recoveredQuestions);
assert.equal(qsmFacts.questions.filter(fact => fact.kind === 'corrected').length, qsmFacts.correctedQuestions);
const qsmSeen = new Set();
for (const question of qsmLevel1) {
  assert.ok(typeof question.pregunta === 'string' && question.pregunta.trim());
  assert.ok(!qsmSeen.has(normalize(question.pregunta)), 'Duplicate QSM question: ' + question.pregunta);
  qsmSeen.add(normalize(question.pregunta));
  assert.ok(question.opciones && typeof question.opciones === 'object',
    'QSM answer options missing: ' + question.pregunta);
  const choices = ['A', 'B', 'C', 'D'];
  assert.ok(choices.every(key => typeof question.opciones[key] === 'string' && question.opciones[key].trim()),
    'QSM must have four text options: ' + question.pregunta);
  assert.ok(choices.includes(question.respuesta_correcta), 'QSM answer key invalid: ' + question.pregunta);
  assert.equal(new Set(choices.map(key => normalize(question.opciones[key]))).size, 4,
    'QSM choices must be distinct: ' + question.pregunta);
}
for (const fact of qsmFacts.questions) {
  const matches = qsmLevel1.filter(item => item.pregunta === fact.pregunta);
  assert.equal(matches.length, 1, 'One source-backed QSM question: ' + fact.pregunta);
  const question = matches[0];
  assert.equal(question.respuesta_correcta, fact.respuesta_correcta);
  assert.equal(question.opciones[fact.respuesta_correcta], fact.respuesta);
  assert.equal(fact.verifiedAt, qsmFacts.cutoff);
  assert.ok(fact.sourceUrls.length > 0);
  assert.ok(fact.sourceUrls.every(url => {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' &&
      ['www.fifa.com', 'www.conmebol.com', 'es.uefa.com', 'ballondor.com', 'www.santosfc.com'].includes(parsed.hostname);
  }), 'QSM provenance must link to official sources');
}

console.log('Verified content smoke OK: ' + all.length + ' Pasala prompts (' +
  verified.questions.length + ' newly sourced), ' + qsmFacts.newQuestions + ' new QSM, ' + official.length +
  ' UEFA Top10s, ' + wordle.length + ' Wordle entries structurally checked');
