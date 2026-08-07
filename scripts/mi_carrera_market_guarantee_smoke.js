/**
 * Market guarantee: always STAY, never fake offers (FASE 12).
 * Run: node scripts/mi_carrera_market_guarantee_smoke.js
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

const NS = loadMiCarrera();
const Eng = NS.Engine;
let stayAlways = 0;
let markets = 0;
let impossible = 0;

for (let seed = 7000; seed < 7060; seed++) {
  const career = Eng.createCareer({
    name: 'G',
    country: seed % 2 ? 'AR' : 'ES',
    age: 17,
    position: 'ST',
    profile: 'finisher',
    seed
  });
  const first = Eng.generateFirstClubs(career)[0];
  Eng.chooseFirstClub(career, first.clubId, first);
  for (let y = 0; y < 8; y++) {
    const turned = Eng.playSeason(career);
    const opts = (turned.market && turned.market.options) || [];
    markets += 1;
    const stay = opts.filter((o) => o.type === 'stay' || o.type === 'loan_return');
    if (stay.length >= 1) stayAlways += 1;
    opts.forEach((o) => {
      if (o.type === 'transfer' || o.type === 'loan') {
        const club = NS.Providers.clubs.getById(o.clubId);
        if (!club || !Eng.Rules.canJoinClub(career.player, club)) impossible += 1;
      }
    });
    Eng.applyDecision(career, stay[0] || opts[0]);
    if (turned.retirement && turned.retirement.shouldRetire) break;
  }
}

assert(markets > 100, 'enough markets sampled (' + markets + ')');
assert(stayAlways === markets, 'every market has QUEDARME/return (' + stayAlways + '/' + markets + ')');
assert(impossible === 0, 'no impossible offers (' + impossible + ')');

console.log('\nMarket guarantee smoke', failed ? 'FAILED' : 'passed.');
process.exit(failed ? 1 : 0);
