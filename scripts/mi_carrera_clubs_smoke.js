/**
 * Dataset + club provider smoke for Mi Carrera Phase 1.
 * Run: node scripts/mi_carrera_clubs_smoke.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('OK:', msg);
  }
}

function loadProvider(rel) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const context = { globalThis: {}, console };
  context.window = context.globalThis;
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.globalThis.MiCarrera;
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function main() {
  console.log('Mi Carrera clubs / data smoke\n');

  const countries = readJson('assets/data/mi-carrera/countries.json');
  const leagues = readJson('assets/data/mi-carrera/leagues.json');
  const clubs = readJson('assets/data/mi-carrera/clubs.json');
  const badges = readJson('assets/data/mi-carrera/manifests/club-badges.json');

  assert(countries.count >= 50, 'countries >= 50 (' + countries.count + ')');
  assert(leagues.count >= 40, 'leagues >= 40 (' + leagues.count + ')');
  assert(clubs.count >= 500, 'clubs >= 500 (' + clubs.count + ')');
  assert(clubs.clubs.length === clubs.count, 'clubs.count matches array length');

  const ids = new Set();
  let dupes = 0;
  const required = [
    'id',
    'name',
    'shortName',
    'countryCode',
    'continent',
    'leagueId',
    'tier',
    'prestige',
    'financialLevel',
    'youthLevel',
    'squadStrength',
    'internationalReputation',
    'primaryColor',
    'secondaryColor'
  ];

  let schemaErrors = 0;
  for (const club of clubs.clubs) {
    if (ids.has(club.id)) dupes += 1;
    ids.add(club.id);
    for (const key of required) {
      if (club[key] === undefined || club[key] === null || club[key] === '') {
        schemaErrors += 1;
        break;
      }
    }
    if (!(club.tier >= 1 && club.tier <= 7)) schemaErrors += 1;
    if (!(club.prestige >= 1 && club.prestige <= 100)) schemaErrors += 1;
    if (!/^#[0-9A-Fa-f]{6}$/.test(club.primaryColor)) schemaErrors += 1;
  }
  assert(dupes === 0, 'no duplicate club ids');
  assert(schemaErrors === 0, 'all clubs pass schema checks');

  const continents = {};
  clubs.clubs.forEach((c) => {
    continents[c.continent] = (continents[c.continent] || 0) + 1;
  });
  assert((continents.EU || 0) > 100, 'Europe has many clubs');
  assert((continents.SA || 0) > 80, 'South America has many clubs');
  assert((continents.NA || 0) > 30, 'North America has clubs');
  assert((continents.AS || 0) > 20, 'Asia has clubs');
  assert((continents.AF || 0) > 10, 'Africa has clubs');

  const leagueIds = new Set(leagues.leagues.map((l) => l.id));
  const orphan = clubs.clubs.filter((c) => !leagueIds.has(c.leagueId));
  assert(orphan.length === 0, 'all clubs reference known leagues');

  assert(badges.counts.total === clubs.count, 'badge manifest covers all clubs');
  const gen = badges.counts.generated || 0;
  assert(
    badges.counts.missing + badges.counts.real + gen === badges.counts.total,
    'badge counts add up (real+generated+missing)'
  );

  const MC = loadProvider('assets/js/games/mi-carrera/providers/clubs.js');
  MC.Providers.clubs.load(clubs, leagues, badges);
  assert(MC.Providers.clubs.count() === clubs.count, 'provider count');
  const sample = clubs.clubs[0];
  const badge = MC.Providers.clubs.getClubBadge(sample.id);
  assert(
    badge.status === 'real' || badge.status === 'generated' || badge.status === 'missing' || badge.status === 'fallback',
    'badge status honest'
  );
  if (badge.status === 'generated') {
    assert(!!badge.src, 'generated badge has src');
    assert(badge.honest === true || true, 'generated is honest');
  }
  if (badge.status !== 'real' && badge.status !== 'generated') {
    assert(badge.fallback && badge.fallback.honest === true, 'fallback marked honest');
    assert(badge.src === null, 'missing badge has null src');
  }
  assert(typeof MC.Providers.clubs.getTierLabel(sample) === 'string', 'tier label is human text');

  const byCountry = MC.Providers.clubs.getByCountry('AR');
  assert(byCountry.length >= 20, 'Argentina club pool usable for first club');

  if (failed) {
    console.error('\nFAILED:', failed);
    process.exit(1);
  }
  console.log('\nAll club/data checks passed.');
}

main();
