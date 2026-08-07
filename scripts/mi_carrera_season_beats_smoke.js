/**
 * FASE 10 — season beats derived from real season state.
 * Run: node scripts/mi_carrera_season_beats_smoke.js
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

console.log('Mi Carrera season beats smoke (FASE 10)\n');

const { MC } = loadMiCarreraUI();
const Eng = MC.Engine;
const UI = MC.UI;

const beatSet = {};
let seasons = 0;
let withBeat = 0;

for (let i = 0; i < 30; i++) {
  const c = Eng.simulateFullCareer({
    seed: 520000 + i,
    name: 'Beat' + i,
    country: ['AR', 'BR', 'ES', 'GB'][i % 4],
    age: 17,
    position: ['ST', 'CM', 'CB'][i % 3],
    profile: 'finisher'
  });
  (c.seasons || []).forEach(function (s) {
    seasons += 1;
    if (s.beat) {
      withBeat += 1;
      beatSet[s.beat] = (beatSet[s.beat] || 0) + 1;
    }
  });
}

assert(seasons > 200, 'enough seasons sampled');
assert(withBeat / seasons >= 0.35, 'beat coverage >= 35% (' + (withBeat / seasons).toFixed(2) + ')');
assert(Object.keys(beatSet).length >= 4, 'multiple beat types (' + Object.keys(beatSet).join(', ') + ')');
assert(beatSet.debut >= 1 || beatSet.injury >= 1 || beatSet.explosion >= 1 || beatSet.title >= 1, 'meaningful beats present');

const career = Eng.simulateFullCareer({
  seed: 520999,
  name: 'RecapBeat',
  country: 'AR',
  age: 17,
  position: 'ST',
  profile: 'finisher'
});
const seasonWithBeat = (career.seasons || []).find(function (s) {
  return !!s.beat;
});
assert(!!seasonWithBeat, 'found season with beat for UI');
const scene = UI.Screens.RECAP({ career: career, pending: { season: seasonWithBeat } });
const text = collectText(scene);
assert(!!scene.querySelector('.mc-season-beat') || !!scene.querySelector('.mc-progress-feel'), 'recap shows beat or progression');
assert(!/\[INFO\]|\[WARNING\]/.test(text), 'no alert labels');

console.log('beats', beatSet);
console.log('\n' + (failed ? failed + ' failure(s)' : 'Season beats smoke passed.'));
process.exit(failed ? 1 : 0);
