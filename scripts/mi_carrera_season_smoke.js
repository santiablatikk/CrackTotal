/**
 * Season → recap → age-up path uses engine playSeason only.
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

console.log('Mi Carrera season smoke\n');
const { MC, document } = loadMiCarreraUI();
const root = document.createElement('div');
const stage = document.createElement('div');
stage.setAttribute('data-mc-stage', '1');
root.appendChild(stage);
const ctrl = MC.UI.createController(root);

const career = MC.Engine.createCareer({
  name: 'Season',
  country: 'AR',
  age: 17,
  position: 'ST',
  profile: 'finisher',
  seed: 777001
});
const first = MC.Engine.generateFirstClubs(career);
MC.Engine.chooseFirstClub(career, first[1].clubId, first[1]);
ctrl.session().career = career;
ctrl.session().scene = 'SEASON';
ctrl.render();

const beforeAge = career.player.age;
const beforeOvr = career.player.overall;
ctrl.onAction('play-season');
assert(ctrl.session().scene === 'RECAP', 'play-season → RECAP');
assert(ctrl.session().pending && ctrl.session().pending.season, 'season record stored');
assert(ctrl.session().pending.market, 'market stored from engine');
assert(career.seasons.length === 1, 'engine appended season');
assert(career.player.age === beforeAge + 1, 'age advanced by engine');
assert(ctrl.session().pending.season.overallBefore === beforeOvr, 'recap uses overallBefore');

const headline = MC.UI.Narrative.recapHeadline(ctrl.session().pending.season, career);
assert(typeof headline === 'string' && headline.length > 4, 'recap headline from data');

ctrl.onAction('after-recap');
assert(
  ['TROPHY', 'AWARD', 'MOMENT', 'AGE_UP'].indexOf(ctrl.session().scene) !== -1,
  'after recap advances to event or age-up (' + ctrl.session().scene + ')'
);

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nSeason smoke passed.');
