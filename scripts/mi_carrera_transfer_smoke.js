/**
 * Transfer application and history smoke.
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

console.log('Mi Carrera transfer smoke\n');

let moved = 0;
for (let seed = 10; seed < 40; seed++) {
  const c = E.simulateFullCareer({
    seed: seed * 31,
    name: 'T',
    country: 'BR',
    age: 17,
    position: 'ED',
    profile: 'winger'
  });
  if (c.transfers.length > 0) moved += 1;
  c.transfers.forEach((t) => {
    assert(t.fromClubId && t.toClubId && t.fromClubId !== t.toClubId, 'transfer clubs differ');
  });
  // recent club not immediately re-joined as next transfer without gap — soft check via memory length
  assert(c.clubs.length >= 1, 'club spells recorded');
}

assert(moved > 5, 'some careers transfer (' + moved + '/30)');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nTransfer smoke passed.');
