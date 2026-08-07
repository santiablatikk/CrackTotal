/**
 * Market progression: good form → better opportunities (FASE 12).
 * Run: node scripts/mi_carrera_market_progression_smoke.js
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
const Rules = Eng.Rules;

function bandOf(id) {
  const c = NS.Providers.clubs.getById(id);
  return c ? Rules.bandRank(Rules.clubBand(c)) : 0;
}

let goodN = 0;
let goodUp = 0;
let poorN = 0;
let poorRecover = 0;
let stayOnly = 0;
let withTransfer = 0;
let withLoan = 0;
let markets = 0;

for (let seed = 9000; seed < 9120; seed++) {
  const career = Eng.createCareer({
    name: 'P',
    country: seed % 3 === 0 ? 'BR' : seed % 3 === 1 ? 'ES' : 'AR',
    age: 17,
    position: 'CM',
    profile: 'finisher',
    seed
  });
  const first = Eng.generateFirstClubs(career)[0];
  Eng.chooseFirstClub(career, first.clubId, first);
  for (let y = 0; y < 10; y++) {
    const turned = Eng.playSeason(career);
    const opts = (turned.market && turned.market.options) || [];
    markets += 1;
    const fromRank = bandOf(career.currentClubId);
    const moves = opts.filter((o) => o.type === 'transfer' || o.type === 'loan');
    if (!moves.length) stayOnly += 1;
    if (moves.some((o) => o.type === 'transfer')) withTransfer += 1;
    if (moves.some((o) => o.type === 'loan')) withLoan += 1;

    const form = Eng.Market.seasonForm(career);
    if (form.good && moves.length) {
      goodN += 1;
      const best = Math.max.apply(
        null,
        moves.map((o) => bandOf(o.clubId))
      );
      if (best >= fromRank) goodUp += 1;
    }
    if (form.poor && moves.length) {
      poorN += 1;
      if (moves.some((o) => bandOf(o.clubId) <= fromRank || o.type === 'loan')) poorRecover += 1;
    }

    Eng.applyDecision(career, opts.find((o) => o.type === 'stay' || o.type === 'loan_return') || opts[0]);
    if (turned.retirement && turned.retirement.shouldRetire) break;
  }
}

assert(markets > 200, 'markets sampled');
assert(stayOnly < markets, 'not every market is stay-only');
assert(withTransfer > 20, 'transfers appear (' + withTransfer + ')');
assert(goodN > 5, 'good-form markets with offers (' + goodN + ')');
assert(goodUp / goodN >= 0.55, 'good form mostly equal/superior offers (' + (goodUp / goodN).toFixed(2) + ')');
if (poorN >= 5) {
  assert(poorRecover / poorN >= 0.5, 'poor form recovery-ish offers (' + (poorRecover / poorN).toFixed(2) + ')');
}

console.log({
  markets,
  stayOnlyRate: +(stayOnly / markets).toFixed(3),
  transferRate: +(withTransfer / markets).toFixed(3),
  loanRate: +(withLoan / markets).toFixed(3),
  goodUpRate: goodN ? +(goodUp / goodN).toFixed(3) : null,
  poorRecoverRate: poorN ? +(poorRecover / poorN).toFixed(3) : null
});

console.log('\nMarket progression smoke', failed ? 'FAILED' : 'passed.');
process.exit(failed ? 1 : 0);
