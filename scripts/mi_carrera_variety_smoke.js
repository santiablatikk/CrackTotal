/**
 * Variety across seeds.
 */
'use strict';

const { loadMiCarrera } = require('./_load_mi_carrera_engine');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

const MC = loadMiCarrera();
const E = MC.Engine;

console.log('Mi Carrera variety smoke\n');

const fps = new Set();
const firstClubs = new Set();
const archetypes = new Set();
for (let i = 0; i < 60; i++) {
  const c = E.simulateFullCareer({
    seed: 20000 + i * 97,
    name: 'Var',
    country: ['AR', 'BR', 'ES', 'GB', 'FR', 'JP'][i % 6],
    age: 16 + (i % 4),
    position: ['ST', 'AM', 'CM', 'CB', 'GK', 'LW'][i % 6],
    profile: ['finisher', 'creator', 'engine', 'wall', 'modern_gk', 'winger'][i % 6]
  });
  fps.add(c.legacy.fingerprint);
  firstClubs.add(c.clubs[0] && c.clubs[0].clubId);
  archetypes.add(c.legacy.archetype);
}

assert(fps.size >= 50, 'fingerprints mostly unique (' + fps.size + '/60)');
assert(firstClubs.size >= 15, 'varied first clubs (' + firstClubs.size + ')');
assert(archetypes.size >= 4, 'multiple archetypes (' + archetypes.size + ')');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nVariety smoke passed.');
