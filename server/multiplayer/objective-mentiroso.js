'use strict';

const { compileAnswerSet, validateAnswers } = require('./core');
const catalog = require('../../assets/data/mentiroso_objective_pilot.json');

// Only this explicitly source-reviewed subset can be selected in objective staging.
// The historical 256 free-form challenges are intentionally excluded.
function checkCatalog() {
  const categories = new Set();
  const ids = new Set();
  for (const challenge of catalog.challenges) {
    if (!challenge.id || ids.has(challenge.id)) throw new Error('Duplicate challenge ID');
    if (!challenge.cutoff || !Array.isArray(challenge.source_urls) || !challenge.source_urls.length) {
      throw new Error('Missing primary source or time boundary: ' + challenge.id);
    }
    if (!challenge.template || !challenge.template.includes('X')) throw new Error('Invalid template: ' + challenge.id);
    if (challenge.answers.length < 2) throw new Error('Too few verified options: ' + challenge.id);
    compileAnswerSet(challenge.answers);
    ids.add(challenge.id);
    categories.add(challenge.category);
  }
  if (categories.size !== 6) throw new Error('Pilot must cover all six game categories');
  return { count: catalog.challenges.length, answerCount: catalog.challenges.reduce((n, c) => n + c.answers.length, 0) };
}

function byCategory(category) {
  return catalog.challenges.filter(challenge => challenge.category === category);
}

function adjudicate(challenge, answers, bid) {
  if (!challenge || !catalog.challenges.some(c => c.id === challenge.id)) throw new Error('Unknown verified challenge');
  if (!Number.isSafeInteger(bid) || bid < 1 || bid > challenge.answers.length) throw new Error('Invalid bid');
  const details = validateAnswers(challenge.answers, answers);
  const validCount = details.filter(entry => entry.accepted).length;
  return { validCount, requiredCount: bid, wasMentiroso: validCount < bid, details };
}
checkCatalog();
module.exports = { catalog, byCategory, adjudicate, checkCatalog };
