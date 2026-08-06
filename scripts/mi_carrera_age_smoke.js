/**
 * Age / progression anti-absurd checks.
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

console.log('Mi Carrera age smoke\n');

let lateSpike = 0;
let hugeJump = 0;
for (let seed = 1; seed <= 80; seed++) {
  const c = E.simulateFullCareer({
    seed: seed * 17,
    name: 'Age',
    country: seed % 2 ? 'AR' : 'PT',
    age: 16 + (seed % 4),
    position: seed % 3 === 0 ? 'POR' : 'MC',
    profile: seed % 3 === 0 ? 'modern_gk' : 'engine'
  });
  c.seasons.forEach((s) => {
    const d = (s.overallAfter || 0) - (s.overallBefore || 0);
    if (s.age >= 33 && d >= 8) lateSpike += 1;
    if (d >= 10) hugeJump += 1;
  });
  assert(c.player.age <= 40, 'retire age <= 40');
  assert(c.player.overall <= 95, 'ovr capped');
}

assert(lateSpike === 0, 'no +8 OVR at age >= 33');
assert(hugeJump === 0, 'no +10 OVR single season');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nAge smoke passed.');
