/**
 * FASE 13 — rivalry layer smoke.
 * Run: node scripts/mi_carrera_rivalry_smoke.js
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
const Rivalries = Eng.Rivalries;
const Market = Eng.Market;

console.log('Mi Carrera rivalry smoke (FASE 13)\n');

assert(!!Rivalries, 'Rivalries module loaded');
assert(Rivalries.PAIRS.length >= 15, 'documented rivalry pairs present (' + Rivalries.PAIRS.length + ')');

const check = Rivalries.validateAgainstCatalog();
assert(check.missing.length === 0, 'no invented/missing catalog IDs (' + JSON.stringify(check.missing) + ')');
assert(check.valid.length === check.total, 'all pairs resolve in catalog');

assert(Rivalries.isArchRival('ar_boca-juniors', 'ar_river-plate'), 'Boca–River ARCHRIVAL');
assert(Rivalries.isRival('es_fc-barcelona', 'es_real-madrid'), 'Barça–Madrid rivalry');
assert(!Rivalries.isRival('ar_boca-juniors', 'es_real-madrid'), 'no invented Boca–Madrid rivalry');
assert(Rivalries.intensityBetween('it_inter', 'it_ac-milan') === 'ARCHRIVAL', 'Inter–Milan intensity');

const rivals = Rivalries.rivalsOf('gb_manchester-united');
assert(
  rivals.some((r) => r.clubId === 'gb_manchester-city'),
  'Man Utd lists City as rival'
);

// Rival move rare + special beat
const career = Eng.createCareer({
  name: 'RV',
  country: 'AR',
  age: 26,
  position: 'ST',
  profile: 'finisher',
  seed: 140001
});
const boca = NS.Providers.clubs.getById('ar_boca-juniors');
Eng.History.ensureClubSpell(career, boca.id, 'transfer');
career.currentClubId = boca.id;
career.currentLeagueId = boca.leagueId;
career.role = 'starter';
career.player.age = 26;
career.player.overall = 84;
career.player.potential = 86;
career.player.form = 82;
career.player.reputation = 80;
career.marketMemory.yearsAtClub = 3;
career.nationalTeam = { caps: 22, callUps: 30 };
career.seasons.push({
  seasonIndex: 1,
  age: 26,
  clubId: boca.id,
  rating: 7.6,
  minutes: 2700,
  overallBefore: 81,
  overallAfter: 84,
  injurySeverity: 0,
  appearances: 35,
  goals: 20,
  assists: 7
});

let rivalOffers = 0;
const trials = 250;
for (let i = 0; i < trials; i++) {
  const m = Market.generateMarket(career, Eng.createRng(141000 + i));
  if ((m.options || []).some((o) => o.kind === 'RIVAL' && o.type === 'transfer')) rivalOffers += 1;
}
assert(rivalOffers >= 1, 'rival offer can appear when eligible (' + rivalOffers + ')');
assert(rivalOffers / trials < 0.18, 'rival offer remains rare (' + (rivalOffers / trials).toFixed(3) + ')');

// Not always available — cold / young / low OVR blocked
const cold = Eng.createCareer({
  name: 'RC',
  country: 'AR',
  age: 20,
  position: 'CM',
  profile: 'creator',
  seed: 140002
});
Eng.History.ensureClubSpell(cold, boca.id, 'transfer');
cold.currentClubId = boca.id;
cold.currentLeagueId = boca.leagueId;
cold.player.overall = 70;
cold.player.form = 45;
cold.marketMemory.yearsAtClub = 1;
cold.seasons.push({
  seasonIndex: 1,
  age: 20,
  clubId: boca.id,
  rating: 6.2,
  minutes: 900,
  overallBefore: 70,
  overallAfter: 69,
  injurySeverity: 0
});
let coldRival = 0;
for (let i = 0; i < 80; i++) {
  const m = Market.generateMarket(cold, Eng.createRng(142000 + i));
  if ((m.options || []).some((o) => o.kind === 'RIVAL')) coldRival += 1;
}
assert(coldRival === 0, 'rival not always available (cold/young blocked)');

// Accept rival → special beat + career continues
let accepted = false;
for (let i = 0; i < 400 && !accepted; i++) {
  const probe = Eng.createCareer({
    name: 'RA',
    country: 'AR',
    age: 26,
    position: 'ST',
    profile: 'finisher',
    seed: 140100 + i
  });
  Eng.History.ensureClubSpell(probe, boca.id, 'transfer');
  probe.currentClubId = boca.id;
  probe.currentLeagueId = boca.leagueId;
  probe.role = 'starter';
  probe.player.age = 26;
  probe.player.overall = 85;
  probe.player.potential = 87;
  probe.player.form = 85;
  probe.player.reputation = 82;
  probe.marketMemory.yearsAtClub = 4;
  probe.nationalTeam = { caps: 25, callUps: 40 };
  probe.seasons.push({
    seasonIndex: 1,
    age: 26,
    clubId: boca.id,
    rating: 7.7,
    minutes: 2800,
    overallBefore: 82,
    overallAfter: 85,
    injurySeverity: 0
  });
  const m = Market.generateMarket(probe, Eng.createRng(143000 + i));
  const rival = (m.options || []).find((o) => o.kind === 'RIVAL' && o.type === 'transfer');
  if (!rival) continue;
  Eng.applyDecision(probe, rival);
  assert(probe.currentClubId === 'ar_river-plate', 'accepted rival move changes club');
  assert(
    (probe.moments || []).some((mm) => mm.type === 'rival_move'),
    'rival move generates special beat'
  );
  assert(probe.status !== 'retired', 'career continues after rival move');
  accepted = true;
}
assert(accepted, 'found and accepted at least one rival offer in probe loop');

console.log('\nRivalry smoke', failed ? 'FAILED (' + failed + ')' : 'passed.');
process.exit(failed ? 1 : 0);
