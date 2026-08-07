/**
 * FASE 10 — Career Card poster content without technical fingerprints.
 * Run: node scripts/mi_carrera_career_card_smoke.js
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

console.log('Mi Carrera career card smoke (FASE 10)\n');

const { MC, document } = loadMiCarreraUI();
const Eng = MC.Engine;
const UI = MC.UI;

const career = Eng.simulateFullCareer({
  seed: 777123,
  name: 'Poster',
  country: 'AR',
  age: 17,
  position: 'ST',
  profile: 'finisher'
});
const legacy = career.legacy || Eng.History.buildLegacy(career);

const mount = document.createElement('div');
UI.CareerCard.render(career, mount);
const text = collectText(mount);
const card = mount.querySelector('[data-career-card]');

assert(!!card, 'career card mounts');
assert(/Poster/i.test(text), 'player name present');
assert(/PEAK|OVR|AÑOS/i.test(text), 'peak / years present');
assert(!!mount.querySelector('.mc-badge') || /CLUBES/.test(text), 'club crests or clubs section');
assert(!/fingerprint|sha256|uuid|seed:/i.test(text), 'no technical fingerprint');
assert(!/\b[0-9a-f]{20,}\b/i.test(text), 'no long hex ids');
assert(!!UI.Narrative.archetypeLabel(legacy.archetype), 'archetype labelable');
assert(/OTRA CARRERA|NUEVA CARRERA/.test(collectText(UI.Screens.CAREER_CARD({ career: career }))), 'replay CTA present');

console.log('\n' + (failed ? failed + ' failure(s)' : 'Career card smoke passed.'));
process.exit(failed ? 1 : 0);
