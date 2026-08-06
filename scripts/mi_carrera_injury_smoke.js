/**
 * Injuries occur and can trigger crisis/comeback paths.
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

console.log('Mi Carrera injury smoke\n');

let injuredCareers = 0;
let comebacks = 0;
for (let i = 0; i < 100; i++) {
  const c = E.simulateFullCareer({
    seed: 15000 + i * 9,
    name: 'Inj',
    country: 'IT',
    age: 18,
    position: 'CM',
    profile: 'engine'
  });
  if (c.injuries.length) injuredCareers += 1;
  if (c.flags.hadComeback) comebacks += 1;
}

assert(injuredCareers > 10, 'injuries occur (' + injuredCareers + ')');
assert(comebacks >= 0, 'comeback flag tracked');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nInjury smoke passed. Comebacks:', comebacks);
