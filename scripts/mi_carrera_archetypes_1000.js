/**
 * 1000-career emergent archetype + trajectory report.
 * Does not tune balance — only measures what the engine produces.
 * Run: node scripts/mi_carrera_archetypes_1000.js
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
const archCounts = Object.create(null);
const metrics = {
  careers: 0,
  debutAges: [],
  peakAges: [],
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
  oneClub: 0,
  journeyman: 0,
  crisis: 0,
  comeback: 0,
  saToEu: 0,
  euToSa: 0,
  europeOnly: 0,
  saOnly: 0,
  noEurope: 0,
  untitled: 0,
  withGiant: 0,
  giantThenFail: 0
};

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function peakAgeOf(career) {
  const peak = career.player.peakOverall || 0;
  for (let i = 0; i < career.seasons.length; i++) {
    const s = career.seasons[i];
    if ((s.overallAfter || 0) >= peak) return s.ageAfter != null ? s.ageAfter : s.age;
  }
  return career.player.age;
}

function playedGiant(career) {
  return career.seasons.some((s) => {
    const club = MC.Providers.clubs.getById(s.clubId);
    if (!club) return false;
    const band = E.Rules.clubBand(club);
    return band === 'WORLD_GIANT' || band === 'CONTINENTAL_GIANT';
  });
}

console.log('Simulating', N, 'careers for archetype report...\n');
const t0 = Date.now();

for (let i = 0; i < N; i++) {
  const country = countries[i % countries.length];
  const position = positions[i % positions.length];
  const profile = position === 'GK' ? 'modern_gk' : profiles[i % profiles.length];
  const career = E.simulateFullCareer({
    seed: 410000 + i * 7919,
    name: 'A' + i,
    country: country,
    age: 16 + (i % 4),
    position: position,
    profile: profile
  });

  metrics.careers += 1;
  const traj = E.State.analyzeTrajectory(career);
  const arch = career.legacy && career.legacy.archetype;
  archCounts[arch] = (archCounts[arch] || 0) + 1;

  metrics.debutAges.push(traj.debutAge);
  metrics.peakAges.push(peakAgeOf(career));
  metrics.retireAges.push(career.player.age);
  metrics.clubs.push(career.clubs.length);
  metrics.transfers += career.transfers.length;
  metrics.loans += career.loans.length;
  metrics.titles += career.titles.length;
  if (!career.titles.length) metrics.untitled += 1;
  if (career.clubs.length <= 1) metrics.oneClub += 1;
  if (career.clubs.length >= 6) metrics.journeyman += 1;
  if (career.careerArc && career.careerArc.indexOf('crisis') !== -1) metrics.crisis += 1;
  if (career.flags && career.flags.hadComeback) metrics.comeback += 1;
  if (traj.saToEu) metrics.saToEu += 1;
  if (traj.euToSa) metrics.euToSa += 1;
  if (traj.europeOnly) metrics.europeOnly += 1;
  if (traj.saOnly) metrics.saOnly += 1;
  if (traj.eu === 0) metrics.noEurope += 1;

  career.titles.forEach((t) => {
    if (t.competitionId === 'uefa_cl') metrics.champions += 1;
    if (t.competitionId === 'conmebol_libertadores') metrics.libertadores += 1;
    if (t.competitionId === 'fifa_world_cup') metrics.worldCups += 1;
    if (t.competitionId === 'conmebol_copa_america') metrics.copaAmerica += 1;
    if (t.competitionId === 'uefa_euro') metrics.euros += 1;
  });
  career.awards.forEach((a) => {
    if (a.awardId === 'ballon_dor') metrics.ballons += 1;
  });

  const giant = playedGiant(career);
  if (giant) metrics.withGiant += 1;
  if (traj.giantFail) metrics.giantThenFail += 1;

  const fp = career.legacy.fingerprint;
  fps.set(fp, (fps.get(fp) || 0) + 1);
}

const elapsed = Date.now() - t0;
const archSorted = Object.keys(archCounts)
  .map((k) => ({ archetype: k, count: archCounts[k], rate: Number((archCounts[k] / N).toFixed(4)) }))
  .sort((a, b) => b.count - a.count);

const report = {
  careers: metrics.careers,
  elapsedMs: elapsed,
  uniqueFingerprints: fps.size,
  topFingerprintCount: Math.max.apply(null, [...fps.values()]),
  archetypeDistribution: archSorted,
  distinctArchetypes: archSorted.length,
  avgClubs: Number(avg(metrics.clubs).toFixed(2)),
  transfersPerCareer: Number((metrics.transfers / N).toFixed(2)),
  loansPerCareer: Number((metrics.loans / N).toFixed(2)),
  avgDebutAge: Number(avg(metrics.debutAges).toFixed(2)),
  avgPeakAge: Number(avg(metrics.peakAges).toFixed(2)),
  avgRetireAge: Number(avg(metrics.retireAges).toFixed(2)),
  titlesPerCareer: Number((metrics.titles / N).toFixed(2)),
  championsTitles: metrics.champions,
  libertadoresTitles: metrics.libertadores,
  worldCupTitles: metrics.worldCups,
  copaAmericaTitles: metrics.copaAmerica,
  euroTitles: metrics.euros,
  ballonDorAwards: metrics.ballons,
  oneClubCareers: metrics.oneClub,
  journeymanCareers: metrics.journeyman,
  crisisCareers: metrics.crisis,
  comebackCareers: metrics.comeback,
  saToEu: metrics.saToEu,
  euToSa: metrics.euToSa,
  europeOnly: metrics.europeOnly,
  saOnly: metrics.saOnly,
  careersWithoutEurope: metrics.noEurope,
  untitledCareers: metrics.untitled,
  careersWithGiant: metrics.withGiant,
  giantFailureCareers: metrics.giantThenFail
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
assert(report.distinctArchetypes >= 6, 'at least 6 emergent archetypes (' + report.distinctArchetypes + ')');
assert(report.avgDebutAge >= 16 && report.avgDebutAge <= 20, 'debut age sane');
assert(report.avgPeakAge >= 22 && report.avgPeakAge <= 32, 'peak age sane');
assert(report.avgRetireAge >= 33 && report.avgRetireAge <= 38, 'retire age sane');
assert(report.oneClubCareers > 0, 'one-club careers emerge');
assert(report.journeymanCareers > 0, 'journeymen emerge');
assert(report.untitledCareers > 50, 'untitled careers exist');
assert(report.careersWithoutEurope > 10, 'careers without Europe exist');

if (failed) {
  console.error('\nARCHETYPES FAILED:', failed);
  process.exit(1);
}
console.log('\nArchetypes 1000 passed.');
