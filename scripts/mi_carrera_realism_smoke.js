/**
 * FASE 5D realism smoke: eligibility, market context, giant jumps, loans, NT.
 * Run: node scripts/mi_carrera_realism_smoke.js
 */
'use strict';

const { loadMiCarrera } = require('./_load_mi_carrera_engine');

const MC = loadMiCarrera();
const E = MC.Engine;
const Elig = E.Eligibility;

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

console.log('Mi Carrera realism smoke (5D)\n');

assert(!!Elig, 'Eligibility layer exported');

// --- Second division cannot win top continental / top domestic ---
const l2 = MC.Providers.clubs.getAll().filter(function (c) {
  return Elig.leagueLevel(c) >= 2;
});
assert(l2.length > 50, 'second-division pool exists (' + l2.length + ')');

let l2TopDomestic = 0;
let l2Continental = 0;
for (let i = 0; i < 200; i++) {
  const club = l2[i % l2.length];
  const career = {
    currentClubId: club.id,
    seasonIndex: 0,
    seasonYear: 2030,
    player: { age: 28, overall: 84, reputation: 80 },
    role: 'star'
  };
  const rng = E.createRng(9000 + i);
  const titles = E.Competitions.resolveTitles(
    career,
    { minutes: 3000, rating: 8.0, goals: 25, assists: 10 },
    rng
  );
  titles.forEach(function (t) {
    if (Elig.TOP_DOMESTIC_LEAGUE[club.countryCode] === t.competitionId) l2TopDomestic += 1;
    if (
      t.competitionId === 'uefa_cl' ||
      t.competitionId === 'uefa_el' ||
      t.competitionId === 'uefa_uecl' ||
      t.competitionId === 'conmebol_libertadores' ||
      t.competitionId === 'conmebol_sudamericana'
    ) {
      l2Continental += 1;
    }
  });
}
assert(l2TopDomestic === 0, 'L2 never wins top domestic league title (' + l2TopDomestic + ')');
assert(l2Continental === 0, 'L2 never wins continental titles (' + l2Continental + ')');

// High-prestige L2 still blocked from continental
const prestigiousL2 = l2
  .slice()
  .sort(function (a, b) {
    return b.prestige - a.prestige;
  })
  .slice(0, 20);
let prestigeLeak = 0;
prestigiousL2.forEach(function (club) {
  if (Elig.canCompeteIn(club, 'uefa_cl')) prestigeLeak += 1;
  if (Elig.canCompeteIn(club, 'conmebol_libertadores')) prestigeLeak += 1;
});
assert(prestigeLeak === 0, 'high prestige L2 cannot enter top continental');

// Top division giants can compete
const giant = MC.Providers.clubs.getAll().find(function (c) {
  return Elig.isTopDivision(c) && E.Rules.clubBand(c) === 'WORLD_GIANT';
});
assert(!!giant, 'world giant in top division exists');
if (giant) {
  const ok =
    Elig.canCompeteIn(giant, Elig.TOP_DOMESTIC_LEAGUE[giant.countryCode]) ||
    Elig.canCompeteIn(giant, 'uefa_cl') ||
    Elig.canCompeteIn(giant, 'conmebol_libertadores');
  assert(ok, 'top giant has domestic or continental access');
}

// Football tiers present
const tiers = {};
MC.Providers.clubs.getAll().forEach(function (c) {
  const t = Elig.footballTier(c);
  tiers[t] = (tiers[t] || 0) + 1;
});
assert(tiers.S > 0 && tiers.D > 0, 'tiers S..D populated ' + JSON.stringify(tiers));

// --- Absurd young EU→SA blocked ---
const euClub = MC.Providers.clubs.getAll().find(function (c) {
  return c.continent === 'EU' && E.Rules.bandRank(E.Rules.clubBand(c)) >= 5;
});
const saClub = MC.Providers.clubs.getAll().find(function (c) {
  return c.continent === 'SA' && c.countryCode === 'AR' && E.Rules.bandRank(E.Rules.clubBand(c)) <= 4;
});
assert(!!euClub && !!saClub, 'EU competitive + SA clubs exist');

const youngPeak = {
  player: { age: 23, overall: 82, form: 70, country: 'ES', peakOverall: 82, reputation: 70 },
  currentClubId: euClub.id,
  seasons: [{ minutes: 2800, rating: 7.3 }],
  role: 'starter',
  careerArc: [],
  flags: { playedEurope: true, playedSouthAmerica: false }
};
assert(
  !Elig.isCredibleInternationalMove(youngPeak, euClub, saClub),
  '23yo good EU player cannot randomly drop to weaker SA'
);

const veteranHome = {
  player: { age: 32, overall: 76, form: 48, country: 'AR', peakOverall: 84, reputation: 75 },
  currentClubId: euClub.id,
  seasons: [{ minutes: 1200, rating: 6.4 }],
  role: 'rotation',
  careerArc: ['crisis'],
  flags: { playedEurope: true, playedSouthAmerica: true }
};
const homeSa = MC.Providers.clubs.getAll().find(function (c) {
  return c.countryCode === 'AR' && Elig.isTopDivision(c) && E.Rules.bandRank(E.Rules.clubBand(c)) >= 4;
});
assert(
  !!homeSa && Elig.isCredibleInternationalMove(veteranHome, euClub, homeSa),
  'veteran AR abroad can return home with context'
);

// --- Giant jump gate ---
const midPlayer = { overall: 70, age: 24, reputation: 50, form: 60 };
const worldGiant = MC.Providers.clubs.getAll().find(function (c) {
  return E.Rules.clubBand(c) === 'WORLD_GIANT' && Elig.isTopDivision(c);
});
assert(!!worldGiant, 'world giant club exists');
assert(!E.Rules.canJoinClub(midPlayer, worldGiant), 'OVR 70 cannot join world giant');

const elite = { overall: 88, age: 26, reputation: 85, form: 75 };
assert(E.Rules.canJoinClub(elite, worldGiant), 'elite can join world giant');

// --- Loan still happens ---
let loans = 0;
for (let i = 0; i < 80; i++) {
  const c = E.simulateFullCareer({
    seed: 12000 + i,
    name: 'L' + i,
    country: 'AR',
    age: 17,
    position: 'ST',
    profile: 'finisher'
  });
  if (c.loans && c.loans.length) loans += 1;
}
assert(loans > 0, 'loans still occur in sample (' + loans + '/80)');

// --- One-club still possible ---
let oneClub = 0;
for (let i = 0; i < 120; i++) {
  const c = E.simulateFullCareer({
    seed: 22000 + i * 3,
    name: 'O' + i,
    country: 'AR',
    age: 17,
    position: 'CM',
    profile: 'engine'
  });
  if ((c.clubs || []).length <= 1) oneClub += 1;
}
assert(oneClub > 0, 'one-club careers still emerge (' + oneClub + '/120)');

// --- National team caps in legacy ---
const ntCareer = E.simulateFullCareer({
  seed: 42,
  name: 'NT',
  country: 'AR',
  age: 17,
  position: 'ST',
  profile: 'finisher'
});
assert(ntCareer.legacy && ntCareer.legacy.totals, 'legacy totals present');
assert(typeof ntCareer.legacy.totals.nationalCaps === 'number', 'legacy tracks national caps');

// --- Timeline ages consistent ---
let timelineOk = true;
(ntCareer.clubs || []).forEach(function (spell, idx) {
  if (spell.ageStart == null) timelineOk = false;
  if (idx > 0 && spell.ageStart < ntCareer.clubs[idx - 1].ageStart) timelineOk = false;
});
assert(timelineOk, 'club timeline ages are consistent');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nRealism smoke passed.');
