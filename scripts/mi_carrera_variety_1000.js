/**
 * FASE 6 diagnosis: 1000-career diversity matrix (read-only metrics).
 * Run: node scripts/mi_carrera_variety_1000.js
 */
'use strict';

const { loadMiCarrera } = require('./_load_mi_carrera_engine');

const MC = loadMiCarrera();
const E = MC.Engine;
const N = 1000;

const countries = ['AR', 'BR', 'UY', 'ES', 'GB', 'IT', 'DE', 'FR', 'PT', 'MX', 'JP', 'CO', 'CL', 'NL'];
const positions = ['ST', 'AM', 'CM', 'CB', 'GK', 'LW', 'RW', 'DM', 'LB', 'RB'];
const profiles = ['finisher', 'creator', 'engine', 'wall', 'modern_gk', 'winger', 'brain', 'fullback', 'specialist'];

const fps = new Map();
const arch = new Map();
const visitedClubs = new Set();
const visitedLeagues = new Set();
const visitedCountries = new Set();
const visitedContinents = new Set();
const startClubs = new Map();

const m = {
  careers: N,
  clubsSum: 0,
  transfers: 0,
  loans: 0,
  oneClub: 0,
  journeyman: 0,
  saOnly: 0,
  euOnly: 0,
  saToEu: 0,
  euToSa: 0,
  homeReturn: 0,
  euroBornToSa: 0,
  youngPeakEuToSa: 0,
  withGiant: 0,
  giantFail: 0,
  giantSuccess: 0,
  untitled: 0,
  champions: 0,
  libertadores: 0,
  worldCup: 0,
  copaAmerica: 0,
  euro: 0,
  awardsCareers: 0,
  ballon: 0,
  capped: 0,
  injuryCareers: 0,
  crisis: 0,
  comeback: 0,
  peakSum: 0,
  debutSum: 0,
  peakAgeSum: 0,
  retireSum: 0,
  titlesSum: 0,
  l2ContinentalLeak: 0,
  moments: Object.create(null)
};

function continentOf(id) {
  const c = MC.Providers.clubs.getById(id);
  return c ? c.continent : null;
}

function isGiant(id) {
  const c = MC.Providers.clubs.getById(id);
  if (!c) return false;
  const b = E.Rules.clubBand(c);
  return b === 'WORLD_GIANT' || b === 'CONTINENTAL_GIANT';
}

console.log('Simulating', N, 'careers for FASE 6 variety matrix...\n');
const t0 = Date.now();

for (let i = 0; i < N; i++) {
  const country = countries[i % countries.length];
  const position = positions[i % positions.length];
  const profile = position === 'GK' ? 'modern_gk' : profiles[i % profiles.length];
  const career = E.simulateFullCareer({
    seed: 600000 + i * 7919,
    name: 'V' + i,
    country: country,
    age: 16 + (i % 4),
    position: position,
    profile: profile
  });

  const traj = E.State.analyzeTrajectory(career);
  const archetype = career.legacy && career.legacy.archetype;
  const fp = career.legacy && career.legacy.fingerprint;
  if (fp) fps.set(fp, (fps.get(fp) || 0) + 1);
  if (archetype) arch.set(archetype, (arch.get(archetype) || 0) + 1);

  m.clubsSum += (career.clubs || []).length;
  m.transfers += (career.transfers || []).length;
  m.loans += (career.loans || []).length;
  if ((career.clubs || []).length <= 1) m.oneClub += 1;
  if ((career.clubs || []).length >= 6) m.journeyman += 1;
  if (traj.saOnly) m.saOnly += 1;
  if (traj.europeOnly) m.euOnly += 1;
  if (traj.saToEu) m.saToEu += 1;
  if (traj.euToSa) m.euToSa += 1;
  if (traj.giantFail) m.giantFail += 1;
  if (traj.giantSuccess) m.giantSuccess += 1;
  if (traj.homecoming) m.homeReturn += 1;
  if (!career.titles.length) m.untitled += 1;
  if (traj.hasCL) m.champions += 1;
  if (traj.hasLib) m.libertadores += 1;
  if (traj.hasWC) m.worldCup += 1;
  if (traj.hasCopaAmerica) m.copaAmerica += 1;
  if (traj.hasEuro) m.euro += 1;
  if ((career.awards || []).length) m.awardsCareers += 1;
  if (traj.hasBallon) m.ballon += 1;
  if (career.nationalTeam && career.nationalTeam.status !== 'uncapped') m.capped += 1;
  if ((career.injuries || []).some((x) => (x.severity || 0) >= 2)) m.injuryCareers += 1;
  if ((career.careerArc || []).indexOf('crisis') !== -1) m.crisis += 1;
  if (career.flags && career.flags.hadComeback) m.comeback += 1;
  m.peakSum += career.player.peakOverall || 0;
  m.debutSum += traj.debutAge || 0;
  m.peakAgeSum += traj.peakAge || 0;
  m.retireSum += career.player.age || 0;
  m.titlesSum += (career.titles || []).length;

  let sawGiant = false;
  (career.seasons || []).forEach((s) => {
    if (s.clubId) {
      visitedClubs.add(s.clubId);
      const club = MC.Providers.clubs.getById(s.clubId);
      if (club) {
        if (club.leagueId) visitedLeagues.add(club.leagueId);
        if (club.countryCode) visitedCountries.add(club.countryCode);
        if (club.continent) visitedContinents.add(club.continent);
        if (isGiant(s.clubId)) sawGiant = true;
      }
    }
  });
  if (sawGiant) m.withGiant += 1;

  if (career.seasons[0] && career.seasons[0].clubId) {
    const id = career.seasons[0].clubId;
    startClubs.set(id, (startClubs.get(id) || 0) + 1);
  }

  // EU→SA composition + L2 continental leak
  const seasons = career.seasons || [];
  for (let s = 1; s < seasons.length; s++) {
    const a = MC.Providers.clubs.getById(seasons[s - 1].clubId);
    const b = MC.Providers.clubs.getById(seasons[s].clubId);
    if (a && b && a.continent === 'EU' && b.continent === 'SA') {
      const homeCont = (MC.Providers.flags.getCountry(career.player.country) || {}).continent;
      if (homeCont === 'EU' || homeCont === 'NA') m.euroBornToSa += 1;
      if (seasons[s].age < 26 && (career.player.peakOverall || 0) >= 78) m.youngPeakEuToSa += 1;
    }
  }
  (career.titles || []).forEach((t) => {
    const club = MC.Providers.clubs.getById(t.clubId);
    if (!club || !E.Eligibility) return;
    if (E.Eligibility.leagueLevel(club) >= 2) {
      if (
        t.competitionId === 'uefa_cl' ||
        t.competitionId === 'uefa_el' ||
        t.competitionId === 'conmebol_libertadores' ||
        t.competitionId === 'conmebol_sudamericana' ||
        t.competitionId === E.Eligibility.TOP_DOMESTIC_LEAGUE[club.countryCode]
      ) {
        m.l2ContinentalLeak += 1;
      }
    }
  });

  (career.moments || []).forEach((mom) => {
    const type = mom.type || mom.kind || 'unknown';
    m.moments[type] = (m.moments[type] || 0) + 1;
  });
}

const topFp = [...fps.entries()].sort((a, b) => b[1] - a[1])[0];
const archDist = [...arch.entries()]
  .map(([k, v]) => ({ archetype: k, count: v }))
  .sort((a, b) => b.count - a.count);
const topStarts = [...startClubs.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .map(([id, n]) => ({ id, n, name: (MC.Providers.clubs.getById(id) || {}).name }));

const report = {
  elapsedMs: Date.now() - t0,
  careers: N,
  uniqueFingerprints: fps.size,
  topFingerprintCount: topFp ? topFp[1] : 0,
  avgClubs: +(m.clubsSum / N).toFixed(2),
  avgTransfers: +(m.transfers / N).toFixed(2),
  avgLoans: +(m.loans / N).toFixed(2),
  avgTitles: +(m.titlesSum / N).toFixed(2),
  avgPeakOvr: +(m.peakSum / N).toFixed(1),
  avgDebutAge: +(m.debutSum / N).toFixed(2),
  avgPeakAge: +(m.peakAgeSum / N).toFixed(2),
  avgRetireAge: +(m.retireSum / N).toFixed(2),
  visitedClubs: visitedClubs.size,
  visitedLeagues: visitedLeagues.size,
  visitedCountries: visitedCountries.size,
  visitedContinents: [...visitedContinents],
  catalogCoveragePct: +((100 * visitedClubs.size) / MC.Providers.clubs.count()).toFixed(1),
  oneClub: m.oneClub,
  journeyman: m.journeyman,
  saOnly: m.saOnly,
  euOnly: m.euOnly,
  saToEu: m.saToEu,
  euToSa: m.euToSa,
  homeReturn: m.homeReturn,
  euroBornToSa: m.euroBornToSa,
  youngPeakEuToSa: m.youngPeakEuToSa,
  withGiant: m.withGiant,
  giantFail: m.giantFail,
  giantSuccess: m.giantSuccess,
  untitled: m.untitled,
  champions: m.champions,
  libertadores: m.libertadores,
  worldCup: m.worldCup,
  copaAmerica: m.copaAmerica,
  euro: m.euro,
  awardsCareers: m.awardsCareers,
  ballon: m.ballon,
  capped: m.capped,
  injuryCareers: m.injuryCareers,
  crisis: m.crisis,
  comeback: m.comeback,
  l2ContinentalLeak: m.l2ContinentalLeak,
  archetypeDistribution: archDist,
  topStartClubs: topStarts,
  momentCounts: Object.keys(m.moments)
    .sort((a, b) => m.moments[b] - m.moments[a])
    .reduce((acc, k) => {
      acc[k] = m.moments[k];
      return acc;
    }, {})
};

console.log(JSON.stringify(report, null, 2));

// Soft gates — FASE 6: careers must feel distinct and football-plausible
let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

assert(report.uniqueFingerprints >= 980, 'fingerprints nearly unique (' + report.uniqueFingerprints + ')');
assert(report.l2ContinentalLeak === 0, 'no L2 continental leak');
assert(report.libertadores >= 8, 'Libertadores reachable (' + report.libertadores + ')');
assert(report.champions >= 15, 'Champions still rare-but-real (' + report.champions + ')');
assert(report.visitedClubs >= 550, 'broad club reach (' + report.visitedClubs + ')');
assert(report.avgClubs >= 4 && report.avgClubs <= 10, 'avg clubs plausible (' + report.avgClubs + ')');
assert(report.saToEu >= 200 && report.euToSa >= 150, 'continental bridges both ways');
assert(report.youngPeakEuToSa === 0, 'no young peak EU→SA soft landings');
assert(report.archetypeDistribution.length >= 12, 'archetype variety (' + report.archetypeDistribution.length + ')');
const merc = (report.archetypeDistribution.find((x) => x.archetype === 'MERCENARY') || {}).count || 0;
assert(merc < 320, 'mercenary not artificially dominant (' + merc + ')');

if (failed) {
  console.error('\nVariety 1000 FAILED', failed);
  process.exit(1);
}
console.log('\nVariety 1000 gates passed.');
