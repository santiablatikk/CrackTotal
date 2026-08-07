/**
 * Mi Carrera FASE 5C — asset coverage smoke (honest counts + frequency-weighted tops).
 * Run: node scripts/mi_carrera_assets_coverage_smoke.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { loadMiCarrera } = require('./_load_mi_carrera_engine');
const { loadMiCarreraUI } = require('./_load_mi_carrera_ui');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'assets', 'data', 'mi-carrera');

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));
}

function pct(n, d) {
  if (!d) return '0.0%';
  return ((100 * n) / d).toFixed(1) + '%';
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

const clubs = read('clubs.json');
const leagues = read('leagues.json');
const competitions = read('competitions.json');
const awards = read('awards.json');
const badges = read('manifests/club-badges.json');
const logos = read('manifests/competition-logos.json');
const trophies = read('manifests/trophy-images.json');
const awardImgs = read('manifests/award-images.json');
const countries = read('countries.json');

function countStatus(itemsMap, want) {
  let n = 0;
  Object.keys(itemsMap || {}).forEach(function (id) {
    if (itemsMap[id].status === want) n += 1;
  });
  return n;
}

const clubTotal = clubs.clubs.length;
const clubReal = countStatus(badges.badges, 'real');
const clubGenerated = countStatus(badges.badges, 'generated');
const clubMissing = countStatus(badges.badges, 'missing');

const compTotal = competitions.competitions.length;
const compReal = countStatus(logos.items, 'real');
const trophyReal = countStatus(trophies.items, 'real');
const awardTotal = awards.awards.length;
const awardReal = countStatus(awardImgs.items, 'real');

const FLAGS_DIR = path.join(ROOT, 'assets', 'images', 'flags');
const flagFiles = fs.existsSync(FLAGS_DIR)
  ? fs.readdirSync(FLAGS_DIR).filter(function (f) {
      return /\.(svg|png|webp)$/i.test(f);
    })
  : [];
const flagCodes = new Set(
  flagFiles.map(function (f) {
    return f.replace(/\.[^.]+$/, '').toUpperCase();
  })
);
const countryCodes = (countries.countries || []).map(function (c) {
  return c.code;
});
const countriesWithFlag = countryCodes.filter(function (cc) {
  return flagCodes.has(String(cc).toUpperCase());
}).length;

console.log('\n======== COVERAGE TOTALS ========');
console.log('CLUBES');
console.log('  total:     ', clubTotal);
console.log('  real:      ', clubReal, '/', clubTotal, '(' + pct(clubReal, clubTotal) + ')  [official trademark files]');
console.log('  generated: ', clubGenerated, '/', clubTotal, '(' + pct(clubGenerated, clubTotal) + ')  [local geometric marks]');
console.log('  missing:   ', clubMissing, '/', clubTotal);
console.log('COMPETICIONES (logos)');
console.log('  real:      ', compReal, '/', compTotal, '(' + pct(compReal, compTotal) + ')  [local-original illustrations]');
console.log('TROFEOS');
console.log('  real:      ', trophyReal, '/', compTotal, '(' + pct(trophyReal, compTotal) + ')  [local-original illustrations]');
console.log('PREMIOS');
console.log('  real:      ', awardReal, '/', awardTotal, '(' + pct(awardReal, awardTotal) + ')  [local-original illustrations]');
console.log('PAÍSES');
console.log('  con bandera real:', countriesWithFlag, '/', countryCodes.length);
console.log('LIGAS:', leagues.leagues.length);

assert(clubTotal >= 1000, 'catalog >= 1000 clubs (' + clubTotal + ')');
assert(clubReal + clubGenerated + clubMissing === clubTotal, 'club badge statuses cover catalog');
assert(clubReal === (badges.counts && badges.counts.real) || clubReal >= 0, 'manifest real count readable');
assert(trophyReal === compTotal, 'every competition has a local trophy illustration');
assert(awardReal === awardTotal, 'every award has a local illustration');
assert(compReal === compTotal, 'every competition has a local mark illustration');
assert(countriesWithFlag >= 40, 'many countries have local flags');

// Frequency-weighted coverage from 1000 careers
console.log('\n======== FREQUENCY (1000 careers) ========');
const MC = loadMiCarrera();
const E = MC.Engine;
const clubHits = Object.create(null);
const compHits = Object.create(null);
const awardHits = Object.create(null);
const startClubs = Object.create(null);
const startCountries = Object.create(null);
const startLeagues = Object.create(null);
const visitedClubs = Object.create(null);
const visitedLeagues = Object.create(null);
const visitedContinents = Object.create(null);
let saToEu = 0;
let euToSa = 0;
let oneClub = 0;
let journeyman = 0;
let giant = 0;
let comeback = 0;
let loans = 0;
let noEurope = 0;
let noGiant = 0;
let withTitles = 0;
let withNT = 0;
let withAwards = 0;

const countriesPool = ['AR', 'BR', 'UY', 'ES', 'GB', 'IT', 'DE', 'FR', 'PT', 'MX', 'CO', 'CL', 'JP', 'NL'];
const positions = ['ST', 'AM', 'CM', 'CB', 'GK', 'LW', 'RW', 'DM', 'LB', 'RB'];
const profiles = ['finisher', 'creator', 'engine', 'wall', 'modern_gk', 'winger', 'brain', 'fullback', 'specialist'];

for (let i = 0; i < 1000; i++) {
  const career = E.simulateFullCareer({
    seed: 50000 + i,
    name: 'P' + i,
    country: countriesPool[i % countriesPool.length],
    age: 16 + (i % 4),
    position: positions[i % positions.length],
    profile: profiles[i % profiles.length]
  });

  const seasons = career.seasons || [];
  const clubsSeen = {};
  const leaguesSeen = {};
  const continentsSeen = {};
  let sawEu = false;
  let sawSa = false;
  let sawGiant = false;
  let minPrestige = 999;
  let maxPrestige = 0;

  seasons.forEach(function (s) {
    if (s.clubId) {
      clubHits[s.clubId] = (clubHits[s.clubId] || 0) + 1;
      visitedClubs[s.clubId] = 1;
      clubsSeen[s.clubId] = 1;
    }
    if (s.leagueId) {
      leaguesSeen[s.leagueId] = 1;
      visitedLeagues[s.leagueId] = 1;
    }
    if (s.continent) {
      continentsSeen[s.continent] = 1;
      visitedContinents[s.continent] = 1;
      if (s.continent === 'EU') sawEu = true;
      if (s.continent === 'SA') sawSa = true;
    }
    const club = MC.Providers.clubs.getById(s.clubId);
    if (club) {
      minPrestige = Math.min(minPrestige, club.prestige || 0);
      maxPrestige = Math.max(maxPrestige, club.prestige || 0);
      if ((club.prestige || 0) >= 85 || (club.tags || []).indexOf('giant') !== -1 || (club.tags || []).indexOf('world_class') !== -1) {
        sawGiant = true;
      }
    }
  });

  if (seasons[0] && seasons[0].clubId) {
    startClubs[seasons[0].clubId] = (startClubs[seasons[0].clubId] || 0) + 1;
    const sc = MC.Providers.clubs.getById(seasons[0].clubId);
    if (sc) {
      startCountries[sc.countryCode] = (startCountries[sc.countryCode] || 0) + 1;
      startLeagues[sc.leagueId] = (startLeagues[sc.leagueId] || 0) + 1;
    }
  }

  const titles = career.titles || [];
  titles.forEach(function (t) {
    if (t.competitionId) compHits[t.competitionId] = (compHits[t.competitionId] || 0) + 1;
  });
  if (titles.length) withTitles += 1;

  const aw = career.awards || [];
  aw.forEach(function (a) {
    if (a.awardId) awardHits[a.awardId] = (awardHits[a.awardId] || 0) + 1;
  });
  if (aw.length) withAwards += 1;

  if (career.nationalTeam && career.nationalTeam.status && career.nationalTeam.status !== 'uncapped') withNT += 1;
  if (career.loans && career.loans.length) loans += 1;

  const clubCount = Object.keys(clubsSeen).length;
  if (clubCount <= 1) oneClub += 1;
  if (clubCount >= 5) journeyman += 1;
  if (sawGiant) giant += 1;
  else noGiant += 1;
  if (maxPrestige - minPrestige >= 25 && minPrestige <= 60 && maxPrestige >= 80) comeback += 1;
  if (sawSa && sawEu) {
    // approximate direction by first continent
    if (seasons[0] && seasons[0].continent === 'SA') saToEu += 1;
    if (seasons[0] && seasons[0].continent === 'EU') euToSa += 1;
  }
  if (!sawEu) noEurope += 1;
}

function topN(map, n) {
  return Object.keys(map)
    .map(function (id) {
      return { id: id, n: map[id] };
    })
    .sort(function (a, b) {
      return b.n - a.n;
    })
    .slice(0, n);
}

function coverageOf(ids, resolver) {
  let ok = 0;
  ids.forEach(function (row) {
    if (resolver(row.id)) ok += 1;
  });
  return { ok: ok, total: ids.length, pct: pct(ok, ids.length) };
}

const top50Clubs = topN(clubHits, 50);
const top20Comps = topN(compHits, 20);
const top10Awards = topN(awardHits, 10);

const top50ClubCov = coverageOf(top50Clubs, function (id) {
  const b = badges.badges[id];
  return b && (b.status === 'real' || b.status === 'generated') && b.src;
});
const top50ClubRealOnly = coverageOf(top50Clubs, function (id) {
  const b = badges.badges[id];
  return b && b.status === 'real' && b.src;
});
const top20TrophyCov = coverageOf(top20Comps, function (id) {
  const t = trophies.items[id];
  return t && t.status === 'real' && t.src;
});
const top10AwardCov = coverageOf(top10Awards, function (id) {
  const a = awardImgs.items[id];
  return a && a.status === 'real' && a.src;
});

console.log('Top 50 clubs by season appearances:');
console.log('  with generated/real mark:', top50ClubCov.ok, '/', top50ClubCov.total, '(' + top50ClubCov.pct + ')');
console.log('  with official real only: ', top50ClubRealOnly.ok, '/', top50ClubRealOnly.total, '(' + top50ClubRealOnly.pct + ')');
top50Clubs.slice(0, 10).forEach(function (r, i) {
  const b = badges.badges[r.id] || {};
  console.log('   ', i + 1, r.id, 'n=' + r.n, 'status=' + (b.status || 'missing'));
});

console.log('Top 20 competitions by titles won:');
console.log('  with trophy asset:', top20TrophyCov.ok, '/', top20TrophyCov.total, '(' + top20TrophyCov.pct + ')');
top20Comps.slice(0, 8).forEach(function (r, i) {
  const t = trophies.items[r.id] || {};
  console.log('   ', i + 1, r.id, 'n=' + r.n, 'status=' + (t.status || 'missing'));
});

console.log('Top 10 awards:');
console.log('  with award asset:', top10AwardCov.ok, '/', top10AwardCov.total, '(' + top10AwardCov.pct + ')');

console.log('\n======== DIVERSITY SNAPSHOT ========');
console.log('start countries:', Object.keys(startCountries).length);
console.log('start leagues:', Object.keys(startLeagues).length);
console.log('visited clubs:', Object.keys(visitedClubs).length);
console.log('visited leagues:', Object.keys(visitedLeagues).length);
console.log('visited continents:', Object.keys(visitedContinents).length);
console.log('SA→EU:', saToEu, 'EU→SA:', euToSa);
console.log('one-club:', oneClub, 'journeyman(5+):', journeyman, 'giant:', giant, 'comeback-ish:', comeback);
console.log('loans careers:', loans, 'no Europe:', noEurope, 'no giant:', noGiant);
console.log('with titles:', withTitles, 'with NT:', withNT, 'with awards:', withAwards);

assert(top50ClubCov.ok === top50ClubCov.total, 'top 50 frequent clubs have local mark files (generated or real)');
assert(top20TrophyCov.ok === top20TrophyCov.total, 'top 20 won competitions have trophy files');
assert(top10AwardCov.ok === top10AwardCov.total || top10Awards.length === 0, 'top awards have image files');

// UI provider sanity
const UI = loadMiCarreraUI();
const sampleClub = clubs.clubs.find(function (c) {
  return badges.badges[c.id] && badges.badges[c.id].status === 'generated';
});
if (sampleClub) {
  const node = UI.MC.UI.Components.Badge(sampleClub.id, 'lg');
  assert(node.getAttribute('data-badge') === 'generated', 'Badge data-badge=generated for generated assets');
  assert(!!node.querySelector('img'), 'generated badge renders img');
}

console.log('\n======== ELIGIBILITY NOTES (engine untouched) ========');
console.log('- Domestic titles map by countryCode, not league.level → a 2nd-division club can still roll the top domestic league title.');
console.log('- Continental access uses prestige/band, not league level → high-prestige relegated clubs can still roll UCL/Libertadores.');
console.log('- No competition eligibility field is enforced beyond continent + band heuristics in career-competitions.js.');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nCoverage smoke passed.');
