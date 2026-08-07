/**
 * Club history / timeline from engine spells.
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

console.log('Mi Carrera history smoke\n');
const { MC } = loadMiCarreraUI();

const career = MC.Engine.simulateFullCareer({
  name: 'Hist',
  country: 'BR',
  age: 17,
  position: 'AM',
  profile: 'creator',
  seed: 550011
});

assert(career.clubs.length >= 1, 'club spells exist');
assert(career.legacy && career.legacy.timeline, 'legacy timeline built');
assert(career.legacy.timeline.length === career.clubs.length, 'timeline matches spells');

const node = MC.UI.Components.ClubTimeline(career.legacy.timeline);
assert(node.children.length === career.legacy.timeline.length, 'timeline renders rows');

career.legacy.timeline.forEach(function (spell) {
  assert(spell.clubId && spell.ageStart != null, 'spell fields present');
});

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nHistory smoke passed.');
