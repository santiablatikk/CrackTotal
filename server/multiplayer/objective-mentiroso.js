'use strict';

const { compileAnswerSet, validateAnswers } = require('./core');
const catalog = require('../../assets/data/mentiroso_objective_pilot.json');
const MIN_VERIFIED_ANSWERS = 20;

// Matchmaking may only select closed historical datasets with >=20 *distinct* entities.
function checkCatalog() {
  const categories = new Set();
  const ids = new Set();
  let answerCount = 0;
  for (const challenge of catalog.challenges) {
    if (!challenge || typeof challenge.id !== 'string' || ids.has(challenge.id)) {
      throw new Error('Missing or duplicate challenge ID');
    }
    if (challenge.audit_status !== 'verified_official_collection') {
      throw new Error('Unverified competitive challenge: ' + challenge.id);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(challenge.cutoff || '') ||
        !/^\d{4}-\d{2}-\d{2}$/.test(challenge.verified_at || '')) {
      throw new Error('Missing or invalid historical cutoff / verification date: ' + challenge.id);
    }
    if (!Array.isArray(challenge.source_urls) || !challenge.source_urls.length ||
        challenge.source_urls.some(url => !/^https:\/\//.test(url))) {
      throw new Error('Missing official source: ' + challenge.id);
    }
    if (typeof challenge.template !== 'string' || !challenge.template.includes('X')) {
      throw new Error('Invalid challenge template: ' + challenge.id);
    }
    if (!Array.isArray(challenge.answers) || challenge.answers.length < MIN_VERIFIED_ANSWERS) {
      throw new Error('Competitive challenge has fewer than 20 answers: ' + challenge.id);
    }
    const entityIds = new Set(challenge.answers.map(answer => answer && answer.id));
    if (entityIds.size !== challenge.answers.length || entityIds.has(undefined) || entityIds.has('')) {
      throw new Error('Duplicate or missing canonical answer ID: ' + challenge.id);
    }
    compileAnswerSet(challenge.answers);
    if (!challenge.category) throw new Error('Missing category: ' + challenge.id);
    ids.add(challenge.id);
    categories.add(challenge.category);
    answerCount += challenge.answers.length;
  }
  if (categories.size !== 6) throw new Error('Competitive pilot must cover all six categories');
  return { count: ids.size, answerCount, minAnswers: MIN_VERIFIED_ANSWERS,
    minObserved: Math.min(...catalog.challenges.map(c => c.answers.length)),
    maxObserved: Math.max(...catalog.challenges.map(c => c.answers.length)) };
}

function byCategory(category) {
  return catalog.challenges.filter(challenge => challenge.category === category &&
    challenge.audit_status === 'verified_official_collection' &&
    challenge.answers.length >= MIN_VERIFIED_ANSWERS);
}

function adjudicate(challenge, answers, bid) {
  if (!challenge || !catalog.challenges.some(c => c.id === challenge.id)) {
    throw new Error('Unknown verified challenge');
  }
  if (!Number.isSafeInteger(bid) || bid < 1 || bid > challenge.answers.length) {
    throw new Error('Invalid bid');
  }
  const details = validateAnswers(challenge.answers, answers);
  const validCount = details.filter(entry => entry.accepted).length;
  return { validCount, requiredCount: bid, wasMentiroso: validCount < bid, details };
}

checkCatalog();
module.exports = { catalog, byCategory, adjudicate, checkCatalog, MIN_VERIFIED_ANSWERS };
