/**
 * Trophy/award scenes queue from real season titles/awards.
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

console.log('Mi Carrera awards UI smoke\n');
const { MC, document } = loadMiCarreraUI();

let foundTrophy = false;
for (let i = 0; i < 80 && !foundTrophy; i++) {
  const career = MC.Engine.simulateFullCareer({
    name: 'A' + i,
    country: i % 2 ? 'AR' : 'ES',
    age: 16 + (i % 4),
    position: 'ST',
    profile: 'finisher',
    seed: 120000 + i * 97
  });
  const titled = career.seasons.filter(function (s) {
    return (s.titles || []).length;
  })[0];
  if (!titled) continue;
  const queue = MC.UI.buildEventQueue(career, titled);
  if (queue.some(function (e) { return e.kind === 'TROPHY'; })) {
    foundTrophy = true;
    const root = document.createElement('div');
    const stage = document.createElement('div');
    stage.setAttribute('data-mc-stage', '1');
    root.appendChild(stage);
    const ctrl = MC.UI.createController(root);
    ctrl.session().career = career;
    ctrl.session().pending = { season: titled, market: { options: [] }, retirement: { shouldRetire: false } };
    ctrl.session().eventQueue = queue;
    ctrl.setScene('TROPHY');
    assert(ctrl.session().scene === 'TROPHY', 'trophy scene set');
    assert(stage.children.length === 1, 'trophy scene rendered');
  }
}
assert(foundTrophy, 'found a season with trophy event in sample');

assert(MC.UI.Narrative.awardTitle('ballon_dor') === 'BALÓN DE ORO', 'ballon title');
assert(MC.UI.Narrative.trophyTitle('conmebol_libertadores').indexOf('AMÉRICA') !== -1, 'libertadores title');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nAwards UI smoke passed.');
