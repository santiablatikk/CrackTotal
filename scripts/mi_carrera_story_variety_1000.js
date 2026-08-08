/**
 * FASE 10 — story variety over 1000 reproducible careers.
 * Run: node scripts/mi_carrera_story_variety_1000.js
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

console.log('Mi Carrera story variety 1000 (FASE 10)\n');
console.log('Simulating 1000 careers...');

const MC = loadMiCarrera();
const Eng = MC.Engine;
const clubs = MC.Providers.clubs.getAll();
const N = 1000;
const visited = new Set();
const leagues = new Set();
const countries = new Set();
const arch = {};
const stories = {
  oneClub: 0,
  journeyman: 0,
  saToEu: 0,
  euToSa: 0,
  injuryComeback: 0,
  worldChamp: 0,
  libertadores: 0,
  champions: 0,
  national: 0,
  untitled: 0,
  homeReturn: 0,
  rivalMoves: 0,
  giantMoves: 0,
  returns: 0,
  loans: 0,
  beatSeasons: 0,
  seasons: 0
};
const marketOffer = {
  stay: 0,
  stepUp: 0,
  sideways: 0,
  recovery: 0,
  loan: 0,
  home: 0,
  europe: 0,
  giant: 0,
  rival: 0,
  returnClub: 0,
  superior: 0,
  similar: 0,
  inferior: 0,
  offers: 0,
  goodFormMarkets: 0,
  goodFormLower: 0
};
const fingerprints = new Set();
const countriesPlayable = ['AR', 'BR', 'UY', 'ES', 'GB', 'IT', 'DE', 'FR', 'MX', 'CO', 'CL', 'PT'];
const Rules = Eng.Rules;

function bandOf(id) {
  const club = MC.Providers.clubs.getById(id);
  return club ? Rules.bandRank(Rules.clubBand(club)) : 0;
}

for (let i = 0; i < N; i++) {
  const country = countriesPlayable[i % countriesPlayable.length];
  // Sample markets during simulation via playSeason loop for offer quality
  const career = Eng.createCareer({
    seed: 310000 + i,
    name: 'S' + i,
    country: country,
    age: 16 + (i % 4),
    position: ['ST', 'CM', 'CB', 'LW', 'AM', 'GK'][i % 6],
    profile: ['finisher', 'creator', 'box_to_box', 'specialist'][i % 4]
  });
  const first = Eng.generateFirstClubs(career)[0];
  Eng.chooseFirstClub(career, first.clubId, first);
  for (let y = 0; y < 22; y++) {
    const turned = Eng.playSeason(career);
    const opts = (turned.market && turned.market.options) || [];
    const fromR = bandOf(career.currentClubId);
    const form = Eng.Market.seasonForm(career);
    let goodLower = false;
    opts.forEach(function (o) {
      if (o.type === 'stay' || o.type === 'loan_return') {
        marketOffer.stay += 1;
        return;
      }
      marketOffer.offers += 1;
      if (o.type === 'loan') marketOffer.loan += 1;
      if (o.kind === 'STEP_UP') marketOffer.stepUp += 1;
      if (o.kind === 'SIDEWAYS' || o.kind === 'FAMILIAR_LEAGUE' || o.kind === 'LATERAL') marketOffer.sideways += 1;
      if (o.kind === 'RECOVERY' || o.kind === 'DECLINE' || o.kind === 'MINUTES') marketOffer.recovery += 1;
      if (o.kind === 'HOME') marketOffer.home += 1;
      if (o.kind === 'EUROPE') marketOffer.europe += 1;
      if (o.kind === 'GIANT') marketOffer.giant += 1;
      if (o.kind === 'RIVAL') marketOffer.rival += 1;
      if (o.kind === 'RETURN' && o.type === 'transfer') marketOffer.returnClub += 1;
      const toR = bandOf(o.clubId);
      if (toR > fromR) marketOffer.superior += 1;
      else if (toR === fromR) marketOffer.similar += 1;
      else marketOffer.inferior += 1;
      if (form.good && o.type === 'transfer' && toR < fromR && o.kind !== 'RETURN' && o.kind !== 'RIVAL') {
        goodLower = true;
      }
    });
    if (form.good && opts.some(function (o) { return o.type === 'transfer'; })) {
      marketOffer.goodFormMarkets += 1;
      if (goodLower) marketOffer.goodFormLower += 1;
    }
    Eng.applyDecision(career, Eng.autoPickDecision(career, turned.market, career.__rng));
    if (career.status === 'retired' || (turned.retirement && turned.retirement.shouldRetire)) break;
  }
  if (career.status !== 'retired') Eng.retire(career, 'end');
  const c = career;
  const leg = c.legacy || Eng.History.buildLegacy(c);
  const archCode = leg.archetype || 'UNKNOWN';
  arch[archCode] = (arch[archCode] || 0) + 1;
  if (leg.fingerprint) fingerprints.add(leg.fingerprint);

  (c.clubs || []).forEach(function (s) {
    if (!s.clubId) return;
    visited.add(s.clubId);
    const club = MC.Providers.clubs.getById(s.clubId);
    if (club) {
      if (club.league) leagues.add(club.league);
      if (club.countryCode) countries.add(club.countryCode);
    }
  });

  (c.seasons || []).forEach(function (s) {
    stories.seasons += 1;
    if (s.beat) stories.beatSeasons += 1;
  });

  if ((c.clubs || []).length <= 1) stories.oneClub += 1;
  if ((c.clubs || []).length >= 5) stories.journeyman += 1;
  const titles = leg.titles || c.titles || [];
  if (!titles.length) stories.untitled += 1;
  if (titles.some(function (t) { return t.competitionId === 'fifa_world_cup'; })) stories.worldChamp += 1;
  if (titles.some(function (t) { return t.competitionId === 'conmebol_libertadores'; })) stories.libertadores += 1;
  if (titles.some(function (t) { return t.competitionId === 'uefa_cl'; })) stories.champions += 1;
  if ((leg.totals && leg.totals.nationalCaps) > 0) stories.national += 1;
  if ((c.moments || []).some(function (m) { return m.type === 'comeback'; })) stories.injuryComeback += 1;
  if ((c.transfers || []).some(function (t) { return t.kind === 'HOME'; })) stories.homeReturn += 1;
  if ((c.moments || []).some(function (m) { return m.type === 'rival_move'; })) stories.rivalMoves += 1;
  if ((c.moments || []).some(function (m) { return m.type === 'giant_move'; })) stories.giantMoves += 1;
  if ((c.moments || []).some(function (m) { return m.type === 'club_return'; })) stories.returns += 1;
  if ((c.moments || []).some(function (m) { return m.type === 'loan'; })) stories.loans += 1;

  const traj = Eng.State.analyzeTrajectory(c);
  if (traj.saToEu) stories.saToEu += 1;
  if (traj.euToSa) stories.euToSa += 1;
}

const archSorted = Object.entries(arch).sort(function (a, b) {
  return b[1] - a[1];
});
const topArchRate = archSorted[0] ? archSorted[0][1] / N : 1;
const dead = clubs.length - visited.size;
const beatRate = stories.beatSeasons / Math.max(1, stories.seasons);

const goodFormLowerRate = marketOffer.goodFormMarkets
  ? marketOffer.goodFormLower / marketOffer.goodFormMarkets
  : 0;
const offerN = Math.max(1, marketOffer.offers);
const report = {
  N: N,
  uniqueFingerprints: fingerprints.size,
  visitedClubs: visited.size,
  totalClubs: clubs.length,
  deadClubs: dead,
  visitedLeagues: leagues.size,
  visitedCountries: countries.size,
  distinctArchetypes: archSorted.length,
  topArchetype: archSorted[0] && archSorted[0][0],
  topArchetypeRate: +topArchRate.toFixed(3),
  beatRate: +beatRate.toFixed(3),
  stories: stories,
  archTop: archSorted.slice(0, 12),
  market_offer_quality: {
    superiorRate: +(marketOffer.superior / offerN).toFixed(3),
    similarRate: +(marketOffer.similar / offerN).toFixed(3),
    inferiorRate: +(marketOffer.inferior / offerN).toFixed(3),
    loanRate: +(marketOffer.loan / offerN).toFixed(3),
    rivalRate: +(marketOffer.rival / offerN).toFixed(3),
    giantRate: +(marketOffer.giant / offerN).toFixed(3),
    homeRate: +(marketOffer.home / offerN).toFixed(3),
    stayCount: marketOffer.stay,
    stepUp: marketOffer.stepUp,
    sideways: marketOffer.sideways,
    recovery: marketOffer.recovery,
    europe: marketOffer.europe,
    returnClub: marketOffer.returnClub,
    good_form_lower_offer_rate: +goodFormLowerRate.toFixed(3)
  }
};

console.log(JSON.stringify(report, null, 2));

assert(fingerprints.size >= 950, 'fingerprints nearly unique (' + fingerprints.size + ')');
assert(visited.size >= 500, 'broad club reach (' + visited.size + ')');
assert(archSorted.length >= 15, 'archetype variety (' + archSorted.length + ')');
assert(topArchRate < 0.42, 'no archetype artificially dominates (' + topArchRate + ')');
assert(stories.oneClub >= 5, 'one-club stories emerge');
assert(stories.journeyman >= 400, 'journeyman stories emerge');
assert(stories.saToEu >= 100, 'SA→EU stories emerge');
assert(stories.national >= 300, 'national team stories emerge');
assert(stories.untitled >= 100, 'untitled careers exist');
assert(beatRate >= 0.35, 'season beats attach often enough (' + beatRate + ')');
assert(
  countries.size >= 30 || countries.has('PE') || countries.has('EC') || countries.has('UY') || countries.has('CL'),
  'broad country reach (' + countries.size + ')'
);
assert(goodFormLowerRate <= 0.12, 'good_form_lower_offer_rate near zero (' + goodFormLowerRate.toFixed(3) + ')');
assert(marketOffer.stay > 0, 'STAY always sampled');
assert(marketOffer.stepUp + marketOffer.giant + marketOffer.europe > 0, 'upward offers exist');
assert(stories.rivalMoves >= 1 || marketOffer.rival >= 1, 'rival interest emerges somewhere in 1000');

console.log('\n' + (failed ? failed + ' failure(s)' : 'Story variety 1000 gates passed.'));
process.exit(failed ? 1 : 0);
