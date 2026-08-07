/**
 * FASE 4 smoke: assets honesty, trophy/award/club render, age chapters,
 * timeline, archetypes labels, career card poster hierarchy.
 */
'use strict';

const fs = require('fs');
const path = require('path');
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
  var parts = [node.textContent || ''];
  (node.children || []).forEach(function (c) {
    parts.push(collectText(c));
  });
  return parts.join(' ');
}

console.log('Mi Carrera phase 4 smoke\n');
const { MC, document } = loadMiCarreraUI();
const C = MC.UI.Components;
const N = MC.UI.Narrative;

assert(typeof MC.Engine.State.analyzeTrajectory === 'function', 'analyzeTrajectory exported');
assert(typeof N.ageChapterTitle === 'function', 'age chapter titles');
assert(typeof N.archetypeLabel === 'function', 'archetype labels');
assert(typeof N.trophyPhrase === 'function', 'trophy phrases');
assert(N.ageChapterTitle(17) === 'EL COMIENZO', '17 = EL COMIENZO');
assert(N.ageChapterTitle(25) === 'EN ASCENSO' || N.ageChapterTitle(27) === 'TU PRIME', 'prime chapter exists');
assert(N.ageChapterTitle(29) === 'TU PRIME', '29 = TU PRIME');
assert(N.ageChapterTitle(33) === 'EL FINAL SE ACERCA', '33 chapter');

const clubs = MC.Providers.clubs.getAll();
assert(clubs.length >= 500, 'catalog preserved (' + clubs.length + ')');
const badge = C.Badge(clubs[0].id, 'lg');
assert(badge.getAttribute('data-badge') === 'real' || badge.getAttribute('data-badge') === 'generated' || badge.getAttribute('data-badge') === 'fallback', 'badge REAL/GENERATED/FALLBACK');
assert(
  badge.getAttribute('data-status') === 'real' || badge.getAttribute('data-status') === 'generated'
    ? !!badge.querySelector('img')
    : !!badge.querySelector('.mc-badge__fallback'),
  'badge visual matches status (generated≠official real)'
);

const clubMark = C.ClubMark(clubs[0].id, { variant: 'lg' });
assert(clubMark.className.indexOf('mc-club') !== -1, 'ClubMark component');

const trophy = C.Trophy('uefa_cl', 'xl');
assert(trophy.getAttribute('data-trophy') === 'real' || trophy.getAttribute('data-trophy') === 'fallback', 'trophy REAL/FALLBACK');
assert(trophy.getAttribute('data-competition') === 'uefa_cl', 'trophy competition id');

const award = C.Award('ballon_dor', 'lg');
assert(award.getAttribute('data-award') === 'real' || award.getAttribute('data-award') === 'fallback', 'award REAL/FALLBACK');

const career = MC.Engine.simulateFullCareer({
  name: 'Phase4',
  country: 'AR',
  age: 17,
  position: 'ST',
  profile: 'finisher',
  seed: 440011
});
assert(career.legacy && career.legacy.archetype, 'archetype derived');
const label = N.archetypeLabel(career.legacy.archetype);
assert(label && label.indexOf('_') === -1, 'visible archetype has no technical underscores (' + label + ')');
assert(N.legacyLine(career).indexOf('CAREER_') === -1, 'legacy line not technical fingerprint');

const mount = document.createElement('div');
const card = MC.UI.CareerCard.render(career, mount);
assert(card.querySelector('.mc-card__arch'), 'card shows archetype');
assert(card.querySelector('.mc-card__peak-n'), 'card shows peak');
assert(card.querySelector('.mc-timeline'), 'card timeline present');
assert((card.textContent || '').indexOf('SA_EU') === -1, 'no technical bridge code in card');
assert((card.textContent || '').indexOf('CAREER_STAGNATION') === -1, 'no stagnation code in card');

const timeline = C.ClubTimeline(career.legacy.timeline, {
  variant: 'poster',
  retireAge: career.player.age
});
assert(timeline.className.indexOf('mc-timeline--poster') !== -1, 'poster timeline');
assert(timeline.querySelector('.mc-timeline__row--retire'), 'retirement row');

const root = document.createElement('div');
const stage = document.createElement('div');
stage.setAttribute('data-mc-stage', '1');
root.appendChild(stage);
const ctrl = MC.UI.createController(root);
ctrl.session().career = career;
ctrl.session().scene = 'TROPHY';
ctrl.session().eventQueue = [
  {
    kind: 'TROPHY',
    competitionId: 'uefa_cl',
    seasonYear: 2030,
    age: 24,
    clubId: career.currentClubId,
    first: true
  }
];
ctrl.render();
assert(stage.querySelector('[data-scene="TROPHY"]'), 'trophy scene');
assert(collectText(stage).indexOf('CAMPEÓN') !== -1, 'trophy says CAMPEÓN');

ctrl.session().scene = 'AGE_UP';
ctrl.session().pending = {
  season: { age: 20, ageAfter: 21 },
  market: null,
  retirement: null
};
ctrl.session().eventQueue = [];
ctrl.render();
assert(collectText(stage).indexOf('EL SALTO') !== -1, 'age scene chapter title');

const syncPath = path.join(__dirname, 'sync_mi_carrera_assets.js');
assert(fs.existsSync(syncPath), 'asset sync pipeline script exists');

const css = fs.readFileSync(path.join(__dirname, '..', 'assets/css/mi-carrera.css'), 'utf8');
assert(css.indexOf('mc-timeline--poster') !== -1, 'poster timeline CSS');
assert(css.indexOf('mc-trophy--xl') !== -1, 'xl trophy CSS');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nPhase 4 smoke passed.');
