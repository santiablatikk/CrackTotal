/**
 * Market memory / option bounds smoke.
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

console.log('Mi Carrera market smoke\n');

const career = E.createCareer({ seed: 55, name: 'M', country: 'AR', age: 17, position: 'ST', profile: 'finisher' });
const first = E.generateFirstClubs(career);
E.chooseFirstClub(career, first[0].clubId, first[0]);

let absurdGiant = 0;
for (let i = 0; i < 8; i++) {
  const turn = E.playSeason(career);
  assert(turn.market.options.length >= 1 && turn.market.options.length <= 3, '1-3 market options');
  assert(turn.market.options.some((o) => o.type === 'stay' || o.type === 'loan_return'), 'stay/return present when applicable');
  const decision = E.autoPickDecision(career, turn.market, career.__rng);
  // Check no offer to world giant if ovr low
  turn.market.options.forEach((o) => {
    if (o.type === 'transfer') {
      const club = MC.Providers.clubs.getById(o.clubId);
      const band = E.Rules.clubBand(club);
      if (career.player.overall < 62 && (band === 'WORLD_GIANT' || band === 'CONTINENTAL_GIANT')) absurdGiant += 1;
    }
  });
  E.applyDecision(career, decision);
  if (career.player.age >= 36) break;
}

assert(absurdGiant === 0, 'no giant offers for weak OVR');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nMarket smoke passed.');
