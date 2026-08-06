/**
 * National team status and confederation tournaments.
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

console.log('Mi Carrera national team smoke\n');

let capped = 0;
let uncapped = 0;
let euroOnArg = 0;
for (let i = 0; i < 80; i++) {
  const c = E.simulateFullCareer({
    seed: 12000 + i * 11,
    name: 'NT',
    country: 'AR',
    age: 17,
    position: 'ST',
    profile: 'finisher'
  });
  if (c.nationalTeam.status === 'uncapped') uncapped += 1;
  else capped += 1;
  c.titles.forEach((t) => {
    if (t.competitionId === 'uefa_euro') euroOnArg += 1;
  });
}

assert(capped > 0, 'some get capped');
assert(uncapped > 0, 'some remain uncapped');
assert(euroOnArg === 0, 'Argentines do not win Euro');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nNational team smoke passed.');
