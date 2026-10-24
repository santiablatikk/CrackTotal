'use strict';

const crypto = require('crypto');

function normalize(value) {
  return String(value == null ? '' : value).normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function secureCode(bytes = 5) {
  return crypto.randomBytes(bytes).toString('hex').toUpperCase();
}

function safePlayerName(value) {
  return String(value || 'Jugador').trim().slice(0, 24) || 'Jugador';
}

/**
 * Alias matching is deliberately exact after normalization.
 * Fuzzy edit distances are inappropriate for competitive football trivia.
 */
function compileAnswerSet(entries) {
  if (!Array.isArray(entries) || !entries.length) throw new Error('Empty verified answer set');
  const byAlias = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry.id !== 'string' || !entry.id) throw new Error('Missing canonical answer ID');
    const aliases = [entry.label].concat(entry.aliases || []);
    for (const text of aliases) {
      const key = normalize(text);
      if (!key) throw new Error('Empty answer alias: ' + entry.id);
      const previous = byAlias.get(key);
      if (previous && previous !== entry.id) throw new Error('Ambiguous answer alias: ' + text);
      byAlias.set(key, entry.id);
    }
  }
  return byAlias;
}

function validateAnswers(entries, answers) {
  if (!Array.isArray(answers) || answers.length > 100) throw new Error('Invalid submitted answer list');
  const aliases = compileAnswerSet(entries);
  const seen = new Set();
  return answers.map(raw => {
    if (typeof raw !== 'string' || raw.length > 120) return { answer: '', accepted: false, reason: 'invalid_format' };
    const id = aliases.get(normalize(raw));
    if (!id) return { answer: raw.slice(0, 120), accepted: false, reason: 'not_in_verified_set' };
    if (seen.has(id)) return { answer: raw, accepted: false, reason: 'duplicate' };
    seen.add(id);
    return { answer: raw, accepted: true, answerId: id, reason: 'verified' };
  });
}

module.exports = { normalize, secureCode, safePlayerName, compileAnswerSet, validateAnswers };
