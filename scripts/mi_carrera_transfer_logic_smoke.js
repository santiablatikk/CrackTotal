/**
 * FASE 13 — transfer / market logic scenarios.
 * Run: node scripts/mi_carrera_transfer_logic_smoke.js
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
const Market = Eng.Market;

function bandRank(id) {
  const c = NS.Providers.clubs.getById(id);
  return c ? Rules.bandRank(Rules.clubBand(c)) : 0;
}

function findClub(pred) {
  return NS.Providers.clubs.getAll().find(pred);
}

function seedRng(seed) {
  return Eng.createRng(seed);
}

function baseCareer(overrides) {
  const input = Object.assign(
    {
      name: 'TL',
      country: 'AR',
      age: 24,
      position: 'ST',
      profile: 'finisher',
      seed: 130001
    },
    overrides || {}
  );
  const career = Eng.createCareer(input);
  return career;
}

function placeAt(career, clubId, extras) {
  const club = NS.Providers.clubs.getById(clubId);
  assert(!!club, 'placeAt club exists: ' + clubId);
  Eng.History.ensureClubSpell(career, clubId, 'transfer');
  career.currentClubId = clubId;
  career.currentLeagueId = club.leagueId;
  career.role = (extras && extras.role) || 'starter';
  career.marketMemory.yearsAtClub = (extras && extras.yearsAtClub) != null ? extras.yearsAtClub : 2;
  if (extras && extras.overall != null) career.player.overall = extras.overall;
  if (extras && extras.potential != null) career.player.potential = extras.potential;
  if (extras && extras.age != null) career.player.age = extras.age;
  if (extras && extras.form != null) career.player.form = extras.form;
  if (extras && extras.reputation != null) career.player.reputation = extras.reputation;
  if (extras && extras.contractYears != null) career.contractYears = extras.contractYears;
  if (extras && extras.flags) Object.assign(career.flags, extras.flags);
  if (extras && extras.season) {
    career.seasons.push(
      Object.assign(
        {
          seasonIndex: career.seasonIndex || 1,
          age: career.player.age,
          clubId: clubId,
          overallBefore: career.player.overall - 1,
          overallAfter: career.player.overall,
          rating: 7.4,
          minutes: 2400,
          appearances: 34,
          goals: 18,
          assists: 6,
          injurySeverity: 0
        },
        extras.season
      )
    );
  }
  return career;
}

function transferKinds(opts) {
  return (opts || []).filter((o) => o.type === 'transfer').map((o) => o.kind);
}

function principalTransfer(opts) {
  return (opts || []).find((o) => o.type === 'transfer' || o.type === 'loan');
}

console.log('Mi Carrera transfer logic smoke (FASE 13)\n');

// --- Caso 1: OVR 70 mid club, gran temporada → no oferta absurda inferior como principal ---
{
  const mid = findClub((c) => Rules.bandRank(Rules.clubBand(c)) === 3 && c.countryCode === 'AR');
  const career = baseCareer({ seed: 131001, age: 23 });
  placeAt(career, mid.id, {
    overall: 70,
    potential: 78,
    form: 78,
    yearsAtClub: 2,
    season: { rating: 7.5, minutes: 2500, overallBefore: 67, overallAfter: 70, injurySeverity: 0 }
  });
  const market = Market.generateMarket(career, seedRng(131001));
  const moves = (market.options || []).filter((o) => o.type === 'transfer' || o.type === 'loan');
  const fromR = bandRank(mid.id);
  const badPrincipal =
    moves[0] &&
    moves[0].type === 'transfer' &&
    bandRank(moves[0].clubId) <= fromR - 2;
  assert(!badPrincipal, 'Caso1: gran temporada no abre con oferta claramente inferior');
  const profile = Market.seasonForm(career);
  assert(profile.good || profile.great, 'Caso1: form flagged good/great');
}

// --- Caso 2: OVR 82 mid, gran temporada → STEP_UP posible ---
{
  const mid = findClub((c) => Rules.bandRank(Rules.clubBand(c)) === 3 && c.countryCode === 'BR');
  const career = baseCareer({ seed: 131002, country: 'BR', age: 24 });
  placeAt(career, mid.id, {
    overall: 82,
    potential: 86,
    form: 80,
    reputation: 70,
    yearsAtClub: 3,
    season: { rating: 7.6, minutes: 2600, overallBefore: 79, overallAfter: 82 }
  });
  let sawStep = false;
  for (let s = 0; s < 40; s++) {
    const m = Market.generateMarket(career, seedRng(131100 + s));
    if (transferKinds(m.options).some((k) => k === 'STEP_UP' || k === 'GIANT' || k === 'EUROPE')) {
      sawStep = true;
      break;
    }
  }
  assert(sawStep, 'Caso2: OVR 82 mid + gran temporada puede recibir STEP_UP/GIANT/EUROPE');
}

// --- Caso 3: OVR 82 gigante, pocos minutos → SIDEWAYS/RECOVERY/LOAN ---
{
  const giant = findClub((c) => Rules.bandRank(Rules.clubBand(c)) >= 6 && c.continent === 'EU');
  const career = baseCareer({ seed: 131003, country: 'ES', age: 24 });
  placeAt(career, giant.id, {
    overall: 82,
    potential: 85,
    form: 48,
    role: 'substitute',
    yearsAtClub: 2,
    season: {
      rating: 6.2,
      minutes: 700,
      overallBefore: 82,
      overallAfter: 81,
      injurySeverity: 0
    }
  });
  career.role = 'substitute';
  let sawRecover = false;
  for (let s = 0; s < 50; s++) {
    const m = Market.generateMarket(career, seedRng(131200 + s));
    const kinds = (m.options || []).map((o) => o.kind);
    if (
      kinds.indexOf('LOAN') !== -1 ||
      kinds.indexOf('RECOVERY') !== -1 ||
      kinds.indexOf('SIDEWAYS') !== -1 ||
      kinds.indexOf('HOME') !== -1
    ) {
      sawRecover = true;
      break;
    }
  }
  assert(sawRecover, 'Caso3: suplente en gigante puede ver LOAN/RECOVERY/SIDEWAYS');
}

// --- Caso 4: 17 años, OVR alto, pocos minutos → préstamo plausible ---
{
  const big = findClub((c) => Rules.bandRank(Rules.clubBand(c)) >= 5 && c.countryCode === 'ES');
  const career = baseCareer({ seed: 131004, country: 'ES', age: 17 });
  placeAt(career, big.id, {
    age: 17,
    overall: 72,
    potential: 88,
    form: 55,
    role: 'youth_prospect',
    yearsAtClub: 1,
    season: { rating: 6.4, minutes: 400, overallBefore: 70, overallAfter: 72 }
  });
  career.role = 'youth_prospect';
  let sawLoan = false;
  for (let s = 0; s < 60; s++) {
    const m = Market.generateMarket(career, seedRng(131300 + s));
    if ((m.options || []).some((o) => o.type === 'loan')) {
      sawLoan = true;
      break;
    }
  }
  assert(sawLoan, 'Caso4: joven con pocos minutos puede recibir LOAN');
}

// --- Caso 5: 25 años, club grande, gran temporada → gigante posible ---
{
  const big = findClub(
    (c) => Rules.bandRank(Rules.clubBand(c)) === 5 && c.continent === 'EU' && c.countryCode === 'IT'
  );
  const career = baseCareer({ seed: 131005, country: 'IT', age: 25 });
  placeAt(career, big.id, {
    overall: 86,
    potential: 88,
    form: 82,
    reputation: 80,
    yearsAtClub: 3,
    season: { rating: 7.7, minutes: 2800, overallBefore: 83, overallAfter: 86 }
  });
  let sawGiant = false;
  for (let s = 0; s < 80; s++) {
    const m = Market.generateMarket(career, seedRng(131400 + s));
    if (transferKinds(m.options).indexOf('GIANT') !== -1) {
      sawGiant = true;
      break;
    }
  }
  assert(sawGiant, 'Caso5: 25 años club grande + gran temporada puede ver GIANT');
}

// --- Caso 6: rival posible pero excepcional ---
{
  const boca = NS.Providers.clubs.getById('ar_boca-juniors');
  const career = baseCareer({ seed: 131006, country: 'AR', age: 26 });
  placeAt(career, boca.id, {
    age: 26,
    overall: 84,
    potential: 86,
    form: 80,
    reputation: 78,
    yearsAtClub: 3,
    season: { rating: 7.55, minutes: 2700, overallBefore: 81, overallAfter: 84 }
  });
  career.nationalTeam = career.nationalTeam || {};
  career.nationalTeam.caps = 20;
  let rivalHits = 0;
  const trials = 200;
  for (let s = 0; s < trials; s++) {
    const m = Market.generateMarket(career, seedRng(132000 + s));
    if (transferKinds(m.options).indexOf('RIVAL') !== -1) rivalHits += 1;
  }
  assert(rivalHits >= 1, 'Caso6: rival offer can appear (' + rivalHits + ')');
  assert(rivalHits / trials < 0.2, 'Caso6: rival remains exceptional (' + (rivalHits / trials).toFixed(3) + ')');
}

// --- Caso 7: lesionado → mercado prudente ---
{
  const mid = findClub((c) => Rules.bandRank(Rules.clubBand(c)) === 4 && c.countryCode === 'AR');
  const career = baseCareer({ seed: 131007, age: 25 });
  placeAt(career, mid.id, {
    overall: 80,
    form: 40,
    season: {
      rating: 6.0,
      minutes: 600,
      overallBefore: 80,
      overallAfter: 78,
      injurySeverity: 3
    }
  });
  let giantOrRival = 0;
  let markets = 0;
  for (let s = 0; s < 40; s++) {
    const m = Market.generateMarket(career, seedRng(131500 + s));
    markets += 1;
    const kinds = transferKinds(m.options);
    if (kinds.indexOf('GIANT') !== -1 || kinds.indexOf('RIVAL') !== -1) giantOrRival += 1;
  }
  assert(giantOrRival === 0, 'Caso7: lesionado no recibe GIANT/RIVAL');
  assert(markets === 40, 'Caso7: markets generated');
}

// --- Caso 8: comeback + gran temporada → mercado se abre ---
{
  const mid = findClub((c) => Rules.bandRank(Rules.clubBand(c)) === 4 && c.countryCode === 'BR');
  const career = baseCareer({ seed: 131008, country: 'BR', age: 26 });
  placeAt(career, mid.id, {
    overall: 83,
    form: 78,
    reputation: 72,
    season: { rating: 7.5, minutes: 2500, overallBefore: 80, overallAfter: 83, injurySeverity: 0 }
  });
  Eng.Events.pushMoment(career, 'comeback', { seasonIndex: career.seasonIndex });
  let up = 0;
  for (let s = 0; s < 40; s++) {
    const m = Market.generateMarket(career, seedRng(131600 + s));
    const moves = (m.options || []).filter((o) => o.type === 'transfer');
    const fromR = bandRank(mid.id);
    if (moves.some((o) => bandRank(o.clubId) >= fromR)) up += 1;
  }
  assert(up >= 10, 'Caso8: post-lesión + gran temporada reabre mercado superior (' + up + ')');
}

// --- Caso 9: regreso a club anterior → RETURN (clubs no rivales) ---
{
  const a = NS.Providers.clubs.getById('ar_tigre');
  const b = NS.Providers.clubs.getById('ar_lanus');
  const career = baseCareer({ seed: 131009, age: 29 });
  Eng.History.ensureClubSpell(career, a.id, 'transfer');
  Eng.History.closeCurrentSpell(career);
  Eng.History.ensureClubSpell(career, b.id, 'transfer');
  career.currentClubId = b.id;
  career.currentLeagueId = b.leagueId;
  career.player.overall = 78;
  career.player.form = 55;
  career.player.age = 29;
  career.marketMemory.yearsAtClub = 2;
  career.seasons.push({
    seasonIndex: 1,
    age: 29,
    clubId: b.id,
    rating: 6.6,
    minutes: 1800,
    overallBefore: 78,
    overallAfter: 78,
    injurySeverity: 0
  });
  let sawReturn = false;
  for (let s = 0; s < 120; s++) {
    const m = Market.generateMarket(career, seedRng(131700 + s));
    if (transferKinds(m.options).indexOf('RETURN') !== -1) {
      const ret = m.options.find((o) => o.kind === 'RETURN' && o.type === 'transfer');
      if (ret && ret.clubId === a.id) {
        Eng.applyDecision(career, ret);
        assert(
          (career.moments || []).some((mm) => mm.type === 'club_return'),
          'Caso9: aceptar RETURN genera beat club_return'
        );
        sawReturn = true;
        break;
      }
    }
  }
  assert(sawReturn, 'Caso9: puede aparecer RETURN al club anterior');
}

// --- Caso 10: rechazar oferta → carrera continúa ---
{
  const mid = findClub((c) => Rules.bandRank(Rules.clubBand(c)) === 3 && c.countryCode === 'UY');
  const career = baseCareer({ seed: 131010, country: 'UY', age: 24 });
  placeAt(career, mid.id, {
    overall: 76,
    form: 70,
    season: { rating: 7.2, minutes: 2200, overallBefore: 74, overallAfter: 76 }
  });
  const market = Market.generateMarket(career, seedRng(131010));
  const stay = market.options.find((o) => o.type === 'stay');
  const rejected = (market.options || [])
    .filter((o) => o.type === 'transfer' || o.type === 'loan')
    .map((o) => o.clubId);
  stay.rejectedClubIds = rejected;
  const beforeClub = career.currentClubId;
  Eng.applyDecision(career, stay);
  assert(career.currentClubId === beforeClub, 'Caso10: rechazar mantiene club');
  assert(career.status !== 'retired', 'Caso10: carrera sigue activa');
  if (rejected.length) {
    assert(
      (career.marketMemory.rejectedClubIds || []).length >= 1,
      'Caso10: rechazos quedan en memoria de mercado'
    );
  }
}

console.log('\nTransfer logic smoke', failed ? 'FAILED (' + failed + ')' : 'passed.');
process.exit(failed ? 1 : 0);
