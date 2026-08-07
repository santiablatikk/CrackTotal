/**
 * Retirement legacy + career card + persistence.
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

console.log('Mi Carrera legacy smoke\n');
const { MC, document, localStorage } = loadMiCarreraUI();

const career = MC.Engine.simulateFullCareer({
  name: 'Legacy',
  country: 'ES',
  age: 18,
  position: 'ST',
  profile: 'finisher',
  seed: 880022
});
assert(career.status === 'retired', 'career retired');
assert(career.legacy && career.legacy.archetype, 'archetype derived');
assert(career.legacy.fingerprint, 'fingerprint present');

const line = MC.UI.Narrative.legacyLine(career);
assert(typeof line === 'string' && line.length > 5, 'legacy line from archetype');

const mount = document.createElement('div');
const card = MC.UI.CareerCard.render(career, mount);
assert(card.getAttribute('data-career-card') === '1', 'career card rendered');
assert(mount.children.length === 1, 'card mounted');

const root = document.createElement('div');
const stage = document.createElement('div');
stage.setAttribute('data-mc-stage', '1');
root.appendChild(stage);
const ctrl = MC.UI.createController(root);
ctrl.session().career = career;
ctrl.session().scene = 'LEGACY';
ctrl.session().pending = null;
ctrl.render();
assert(stage.querySelector('[data-scene="LEGACY"]') || stage.children[0], 'legacy scene renders');

MC.Persistence.clear();
ctrl.session().scene = 'PRESEASON';
ctrl.session().career = MC.Engine.createCareer({
  name: 'Save',
  country: 'AR',
  age: 17,
  position: 'CM',
  profile: 'engine',
  seed: 12
});
const first = MC.Engine.generateFirstClubs(ctrl.session().career);
MC.Engine.chooseFirstClub(ctrl.session().career, first[0].clubId, first[0]);
MC.Persistence.save(ctrl.session());
assert(MC.Persistence.hasSave(), 'save written');
const loaded = MC.Persistence.load();
assert(loaded && loaded.career && loaded.career.currentClubId, 'save/load career');
assert(loaded.career.__rng, 'rng restored');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nLegacy smoke passed.');
