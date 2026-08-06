/**
 * Determinism: same seed + same auto decisions => same fingerprint.
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

console.log('Mi Carrera replay smoke\n');

function run(seed) {
  return E.simulateFullCareer({
    seed: seed,
    name: 'Replay',
    country: 'ES',
    age: 17,
    position: 'DC',
    profile: 'finisher'
  });
}

const a = run(123456);
const b = run(123456);
const c = run(999001);

assert(a.legacy.fingerprint === b.legacy.fingerprint, 'same seed same fingerprint');
assert(a.seasons.length === b.seasons.length, 'same season count');
assert(a.player.peakOverall === b.player.peakOverall, 'same peak');
assert(JSON.stringify(a.clubs.map((x) => x.clubId)) === JSON.stringify(b.clubs.map((x) => x.clubId)), 'same club path');
assert(a.legacy.fingerprint !== c.legacy.fingerprint, 'different seed different fingerprint');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nReplay smoke passed.');
