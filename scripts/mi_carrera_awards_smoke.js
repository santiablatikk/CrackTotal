/**
 * Awards rarity, especially Ballon d'Or.
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

console.log('Mi Carrera awards smoke\n');

let ballons = 0;
let youngBallon = 0;
const N = 200;
for (let i = 0; i < N; i++) {
  const c = E.simulateFullCareer({
    seed: 9000 + i * 23,
    name: 'Award',
    country: i % 2 ? 'FR' : 'BR',
    age: 16 + (i % 4),
    position: 'ST',
    profile: 'finisher'
  });
  c.awards.forEach((a) => {
    if (a.awardId === 'ballon_dor') {
      ballons += 1;
      if (a.age < 19) youngBallon += 1;
    }
  });
}

assert(youngBallon === 0, 'no Ballon d\'Or before 19');
assert(ballons / N < 0.05, 'Ballon d\'Or rate < 5% (' + ballons + '/' + N + ')');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nAwards smoke passed. Ballons:', ballons);
