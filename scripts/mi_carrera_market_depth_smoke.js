/**
 * FASE 6 market depth: offer payload, stay vs change, eligibility gates, consequences.
 * Run: node scripts/mi_carrera_market_depth_smoke.js
 */
'use strict';

const { loadMiCarrera } = require('./_load_mi_carrera_engine');

const MC = loadMiCarrera();
const E = MC.Engine;

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

console.log('Mi Carrera market depth smoke (FASE 6)\n');

const career = E.createCareer({
  seed: 620001,
  name: 'MD',
  country: 'AR',
  age: 17,
  position: 'ST',
  profile: 'finisher'
});
const first = E.generateFirstClubs(career);
E.chooseFirstClub(career, first[0].clubId, first[0]);

let transferOffers = 0;
let withMeta = 0;
let impossible = 0;
const destClubs = new Set();

for (let i = 0; i < 14; i++) {
  const turn = E.playSeason(career);
  const opts = (turn.market && turn.market.options) || [];
  assert(opts.length >= 1 && opts.length <= 3, 'market stays decision-sized (' + opts.length + ')');
  assert(
    opts.some(function (o) {
      return o.type === 'stay' || o.type === 'loan_return';
    }),
    'QUEDARME / return option present'
  );

  opts.forEach(function (o) {
    if (o.type === 'transfer' || o.type === 'loan') {
      transferOffers += 1;
      destClubs.add(o.clubId);
      if (o.leagueName || o.leagueId) withMeta += 1;
      if (o.role && o.expectedMinutes != null && (o.gains || []).length && (o.risks || []).length) {
        withMeta += 1;
      }
      const from = MC.Providers.clubs.getById(career.currentClubId);
      const to = MC.Providers.clubs.getById(o.clubId);
      if (from && to && from.continent !== to.continent) {
        if (!E.Eligibility.isCredibleInternationalMove(career, from, to)) impossible += 1;
      }
      if (to && !E.Rules.canJoinClub(career.player, to)) impossible += 1;
    }
  });

  const decision = E.autoPickDecision(career, turn.market, career.__rng);
  E.applyDecision(career, decision);
  if (career.status === 'retired' || career.player.age >= 37) break;
}

assert(transferOffers >= 1, 'at least one change offer appeared (' + transferOffers + ')');
assert(withMeta >= 1, 'offers carry league/role/minutes/gains/risks');
assert(impossible === 0, 'no impossible intercontinental / join offers (' + impossible + ')');
assert(destClubs.size >= 1, 'destination clubs present (' + destClubs.size + ')');

// Catalog reach: market scoring can surface clubs outside top 50 starts
const visited = new Set((career.clubs || []).map(function (c) {
  return c.clubId;
}));
assert(visited.size >= 1, 'career visits clubs via market decisions (' + visited.size + ')');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nMarket depth smoke passed.');
