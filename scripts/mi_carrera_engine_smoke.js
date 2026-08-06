/**
 * Core engine smoke: create -> first club -> seasons -> retire.
 * Run: node scripts/mi_carrera_engine_smoke.js
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

console.log('Mi Carrera engine smoke\n');

const career = E.simulateFullCareer({
  seed: 42,
  name: 'Test Player',
  country: 'AR',
  age: 17,
  position: 'MCO',
  profile: 'creator'
});

assert(career.status === 'retired', 'career retires');
assert(career.seasons.length >= 10, 'at least 10 seasons (' + career.seasons.length + ')');
assert(career.player.age >= 30, 'retires as adult (' + career.player.age + ')');
assert(!!career.currentClubId || career.clubs.length > 0, 'had clubs');
assert(career.clubs.length >= 1, 'club history exists');
assert(!!career.legacy, 'legacy built');
assert(!!career.legacy.archetype, 'archetype derived');
assert(!!career.legacy.fingerprint, 'fingerprint exists');
assert(career.player.peakOverall >= career.seasons[0].overallBefore, 'peak tracked');

const first = E.createCareer({ seed: 7, name: 'A', country: 'BR', age: 18, position: 'ST', profile: 'finisher' });
const opts = E.generateFirstClubs(first);
assert(opts.length === 3, 'exactly 3 first clubs');
assert(new Set(opts.map((o) => o.clubId)).size === 3, 'first clubs distinct');
assert(new Set(opts.map((o) => o.path)).size >= 2, 'diverse first-club paths');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nEngine smoke passed.');
