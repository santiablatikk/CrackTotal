/**
 * Simulate 1000 careers and report balance metrics + absurdity guards.
 * Run: node scripts/mi_carrera_balance_1000.js
 */
'use strict';

const { loadMiCarrera } = require('./_load_mi_carrera_engine');

const MC = loadMiCarrera();
const E = MC.Engine;

const N = 1000;
const countries = ['AR', 'BR', 'UY', 'ES', 'GB', 'IT', 'DE', 'FR', 'PT', 'MX', 'JP', 'CO'];
const positions = ['ST', 'AM', 'CM', 'CB', 'GK', 'LW', 'RW', 'DM', 'LB', 'RB'];
const profiles = ['finisher', 'creator', 'engine', 'wall', 'modern_gk', 'winger', 'brain', 'fullback', 'specialist'];

const fps = new Map();
const metrics = {
  careers: 0,
  seasons: 0,
  retireAges: [],
  clubs: [],
  transfers: 0,
  loans: 0,
  titles: 0,
  champions: 0,
  libertadores: 0,
  worldCups: 0,
  copaAmerica: 0,
  euros: 0,
  ballons: 0,
  crisis: 0,
  comeback: 0,
  capped: 0,
  oneClub: 0,
  journeyman: 0,
  europeOnly: 0,
  saOnly: 0,
  saToEu: 0,
  euToSa: 0,
  untitled: 0,
  legendary: 0,
  absurdOvrJump: 0,
  absurdLateSpike: 0,
  absurdGiantJoin: 0,
  youngBallon: 0
};

function continentOfClub(id) {
  const c = MC.Providers.clubs.getById(id);
  return c ? c.continent : null;
}

console.log('Simulating', N, 'careers...\n');
const t0 = Date.now();

for (let i = 0; i < N; i++) {
  const country = countries[i % countries.length];
  const position = positions[i % positions.length];
  const profile = position === 'GK' ? 'modern_gk' : profiles[i % profiles.length];
  const career = E.simulateFullCareer({
    seed: 300000 + i * 7919,
    name: 'B' + i,
    country: country,
    age: 16 + (i % 4),
    position: position,
    profile: profile
  });

  metrics.careers += 1;
  metrics.seasons += career.seasons.length;
  metrics.retireAges.push(career.player.age);
  metrics.clubs.push(career.clubs.length);
  metrics.transfers += career.transfers.length;
  metrics.loans += career.loans.length;
  metrics.titles += career.titles.length;
  if (!career.titles.length) metrics.untitled += 1;
  if (career.flags.hadComeback) metrics.comeback += 1;
  if (career.careerArc.indexOf('crisis') !== -1) metrics.crisis += 1;
  if (career.nationalTeam.status !== 'uncapped') metrics.capped += 1;
  if (career.clubs.length <= 1) metrics.oneClub += 1;
  if (career.clubs.length >= 6) metrics.journeyman += 1;

  const continents = new Set(career.seasons.map((s) => s.continent).filter(Boolean));
  if (continents.size === 1 && continents.has('EU')) metrics.europeOnly += 1;
  if (continents.size === 1 && continents.has('SA')) metrics.saOnly += 1;

  let sawSA = false;
  let sawEU = false;
  let saThenEu = false;
  let euThenSa = false;
  career.seasons.forEach((s) => {
    if (s.continent === 'SA') {
      if (sawEU) euThenSa = true;
      sawSA = true;
    }
    if (s.continent === 'EU') {
      if (sawSA) saThenEu = true;
      sawEU = true;
    }
  });
  if (saThenEu) metrics.saToEu += 1;
  if (euThenSa) metrics.euToSa += 1;

  career.titles.forEach((t) => {
    if (t.competitionId === 'uefa_cl') metrics.champions += 1;
    if (t.competitionId === 'conmebol_libertadores') metrics.libertadores += 1;
    if (t.competitionId === 'fifa_world_cup') metrics.worldCups += 1;
    if (t.competitionId === 'conmebol_copa_america') metrics.copaAmerica += 1;
    if (t.competitionId === 'uefa_euro') metrics.euros += 1;
  });
  career.awards.forEach((a) => {
    if (a.awardId === 'ballon_dor') {
      metrics.ballons += 1;
      if (a.age < 19) metrics.youngBallon += 1;
    }
  });

  const arch = career.legacy && career.legacy.archetype;
  if (
    arch === 'EUROPEAN_STAR' ||
    arch === 'BALLON_DOR_WINNER' ||
    arch === 'WORLD_CHAMPION' ||
    arch === 'WORLDCUP_HERO' ||
    arch === 'SOUTH_AMERICAN_LEGEND' ||
    arch === 'SOUTH_AMERICAN_KING' ||
    arch === 'GIANT_SUCCESS'
  ) {
    metrics.legendary += 1;
  }

  career.seasons.forEach((s) => {
    const d = (s.overallAfter || 0) - (s.overallBefore || 0);
    if (d >= 10) metrics.absurdOvrJump += 1;
    if (s.age >= 33 && d >= 8) metrics.absurdLateSpike += 1;
  });

  // Detect absurd first club / early giant with low ovr via transfer history
  career.transfers.forEach((t) => {
    const to = MC.Providers.clubs.getById(t.toClubId);
    if (!to) return;
    const band = E.Rules.clubBand(to);
    // Approximate player ovr at transfer by nearest season
    const season = career.seasons[t.seasonIndex] || career.seasons[career.seasons.length - 1];
    const ovr = season ? season.overallBefore : 60;
    if (ovr < 60 && (band === 'WORLD_GIANT' || band === 'CONTINENTAL_GIANT')) metrics.absurdGiantJoin += 1;
  });

  const fp = career.legacy.fingerprint;
  fps.set(fp, (fps.get(fp) || 0) + 1);
}

const elapsed = Date.now() - t0;
const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const sortedFp = [...fps.entries()].sort((a, b) => b[1] - a[1]);

const report = {
  careers: metrics.careers,
  elapsedMs: elapsed,
  uniqueFingerprints: fps.size,
  topFingerprintCount: sortedFp[0] ? sortedFp[0][1] : 0,
  avgRetireAge: Number(avg(metrics.retireAges).toFixed(2)),
  minRetireAge: Math.min.apply(null, metrics.retireAges),
  maxRetireAge: Math.max.apply(null, metrics.retireAges),
  avgClubs: Number(avg(metrics.clubs).toFixed(2)),
  avgSeasons: Number((metrics.seasons / N).toFixed(2)),
  transfersPerCareer: Number((metrics.transfers / N).toFixed(2)),
  loansPerCareer: Number((metrics.loans / N).toFixed(2)),
  titlesPerCareer: Number((metrics.titles / N).toFixed(2)),
  careersWithChampions: metrics.champions, // count of titles, also rate below
  championsTitles: metrics.champions,
  libertadoresTitles: metrics.libertadores,
  worldCupTitles: metrics.worldCups,
  copaAmericaTitles: metrics.copaAmerica,
  euroTitles: metrics.euros,
  ballonDorAwards: metrics.ballons,
  ballonRate: Number((metrics.ballons / N).toFixed(4)),
  crisisCareers: metrics.crisis,
  comebackCareers: metrics.comeback,
  cappedCareers: metrics.capped,
  oneClubCareers: metrics.oneClub,
  journeymanCareers: metrics.journeyman,
  europeOnly: metrics.europeOnly,
  saOnly: metrics.saOnly,
  saToEu: metrics.saToEu,
  euToSa: metrics.euToSa,
  untitledCareers: metrics.untitled,
  legendaryArchetypes: metrics.legendary,
  absurdOvrJump: metrics.absurdOvrJump,
  absurdLateSpike: metrics.absurdLateSpike,
  absurdGiantJoin: metrics.absurdGiantJoin,
  youngBallon: metrics.youngBallon
};

console.log(JSON.stringify(report, null, 2));

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

assert(report.uniqueFingerprints >= 850, 'unique fingerprints >= 850 (' + report.uniqueFingerprints + ')');
assert(report.topFingerprintCount <= 8, 'no fingerprint dominates (' + report.topFingerprintCount + ')');
assert(report.avgRetireAge >= 33 && report.avgRetireAge <= 38, 'avg retire age sane');
assert(report.avgClubs >= 1.5 && report.avgClubs <= 8, 'avg clubs sane');
assert(report.ballonRate < 0.03, 'Ballon rate < 3%');
assert(report.youngBallon === 0, 'no young Ballon');
assert(report.absurdOvrJump === 0, 'no +10 OVR jumps');
assert(report.absurdLateSpike === 0, 'no late +8 spikes');
assert(report.absurdGiantJoin === 0, 'no weak->giant transfers');
assert(report.untitledCareers > 50, 'enough untitled careers');
assert(report.saToEu > 10, 'SA→EU paths exist');
assert(report.euToSa < report.saToEu * 1.15, 'EU→SA not higher than SA→EU (got ' + report.euToSa + ' vs ' + report.saToEu + ')');
assert(report.euToSa / N < 0.32, 'EU→SA rate moderated (' + (report.euToSa / N).toFixed(3) + ')');
assert(report.oneClubCareers > 5, 'one-club careers exist');
assert(report.journeymanCareers > 5, 'journeymen exist');
assert(report.loansPerCareer > 0.02, 'loans happen');
assert(report.championsTitles > 5, 'some Champions titles exist (' + report.championsTitles + ')');
assert(report.cappedCareers > 80, 'meaningful national team access (' + report.cappedCareers + ')');
assert(report.crisisCareers < 900, 'crisis is not universal (' + report.crisisCareers + ')');
assert(report.comebackCareers > 5, 'comebacks occur (' + report.comebackCareers + ')');
assert(report.ballonDorAwards < 50, 'Ballon not flooded (' + report.ballonDorAwards + ')');
let ballonPossible = report.ballonDorAwards;
if (!ballonPossible) {
  // Probe with diversified seeds (same family as variety matrix) before declaring impossible
  const probes = [];
  for (let i = 0; i < 1200; i++) probes.push(600000 + i * 7919);
  for (let i = 0; i < 800; i++) probes.push(777000 + i * 17);
  for (let i = 0; i < probes.length && !ballonPossible; i++) {
    const c = E.simulateFullCareer({
      seed: probes[i],
      name: 'BallonProbe' + i,
      country: ['AR', 'BR', 'ES', 'GB', 'FR', 'IT', 'UY', 'DE'][i % 8],
      age: 16 + (i % 3),
      position: i % 7 === 0 ? 'ST' : ['ST', 'AM', 'CM', 'LW', 'RW'][i % 5],
      profile: 'finisher'
    });
    if ((c.awards || []).some(function (a) {
      return a.awardId === 'ballon_dor';
    })) {
      ballonPossible = 1;
    }
  }
}
assert(ballonPossible >= 1, 'Ballon rare but possible');

if (failed) {
  console.error('\nBALANCE FAILED:', failed);
  process.exit(1);
}
console.log('\nBalance 1000 passed.');
