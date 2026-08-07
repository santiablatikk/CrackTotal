/**
 * FASE 10 — gameplay depth: loop decisions, progression feel, season beats.
 * Run: node scripts/mi_carrera_gameplay_depth_smoke.js
 */
'use strict';

const { loadMiCarreraUI } = require('./_load_mi_carrera_ui');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

function collectText(node) {
  if (!node) return '';
  var parts = [];
  if (node.textContent) parts.push(String(node.textContent));
  (node.children || []).forEach(function (c) {
    parts.push(collectText(c));
  });
  return parts.join(' ');
}

console.log('Mi Carrera gameplay depth smoke (FASE 10)\n');

const { MC } = loadMiCarreraUI();
const UI = MC.UI;
const Eng = MC.Engine;

assert(typeof Eng.simulateFullCareer === 'function', 'engine simulate present');
assert(typeof UI.Narrative.progressionFeel === 'function', 'progressionFeel present');
assert(typeof UI.Narrative.marketMoveLabel === 'function', 'marketMoveLabel present');
assert(typeof UI.Narrative.seasonBeatLine === 'function', 'seasonBeatLine present');

const career = Eng.simulateFullCareer({
  seed: 101010,
  name: 'Depth',
  country: 'AR',
  age: 17,
  position: 'ST',
  profile: 'finisher'
});

assert((career.seasons || []).length > 5, 'career has multiple seasons');
const withBeat = (career.seasons || []).filter(function (s) {
  return !!s.beat;
}).length;
assert(withBeat >= 3, 'several seasons carry a beat (' + withBeat + ')');

const feels = {};
(career.seasons || []).forEach(function (s) {
  const f = UI.Narrative.progressionFeel(s, career);
  feels[f] = (feels[f] || 0) + 1;
});
assert(Object.keys(feels).length >= 2, 'progression feel varies across seasons');

const season = career.seasons[Math.min(3, career.seasons.length - 1)];
const recap = UI.Screens.RECAP({ career: career, pending: { season: season } });
const recapText = collectText(recap);
assert(/ASÍ FUE TU AÑO/.test(recapText), 'recap year framing');
assert(/VER CÓMO SIGUE|SEGUIR/.test(recapText), 'recap CTA contextual');

const intro = UI.Screens.INTRO({ draft: {} });
assert(/EMPEZAR MI HISTORIA/.test(collectText(intro)), 'intro CTA is game-like');

const seasonScene = UI.Screens.SEASON({ career: career });
assert(/JUGAR LA TEMPORADA/.test(collectText(seasonScene)), 'season CTA contextual');

const card = UI.Screens.CAREER_CARD({ career: career });
assert(/OTRA CARRERA/.test(collectText(card)), 'career card invites replay');

assert(!/fingerprint|sha256/i.test(collectText(card)), 'no technical fingerprint in card scene');

console.log('\n' + (failed ? failed + ' failure(s)' : 'Gameplay depth smoke passed.'));
process.exit(failed ? 1 : 0);
