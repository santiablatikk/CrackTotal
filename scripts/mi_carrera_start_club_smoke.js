#!/usr/bin/env node
'use strict';

/**
 * Starting club choice smoke for Mi Carrera.
 * Run: node scripts/mi_carrera_start_club_smoke.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'assets', 'data', 'mi-carrera');
const JS_ROOT = path.join(ROOT, 'assets', 'js', 'games', 'mi-carrera');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log('  OK  ' + msg);
  } else {
    failed += 1;
    console.error('  FAIL  ' + msg);
  }
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8'));
}

function loadMC() {
  const sandbox = { console: console, globalThis: null };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  [
    'engine/career-randomizer.js',
    'engine/career-state.js',
    'engine/career-rules.js',
    'engine/career-events.js',
    'engine/career-decisions.js',
    'engine/career-competitions.js',
    'engine/career-awards.js',
    'engine/career-records.js',
    'engine/career-moments.js',
    'engine/career-scoring.js',
    'engine/career-engine.js',
    'persistence/career-storage.js',
    'providers/flags.js',
    'providers/badges.js',
    'providers/assets.js',
    'main.js'
  ].forEach(function (rel) {
    vm.runInContext(fs.readFileSync(path.join(JS_ROOT, rel), 'utf8'), context, { filename: rel });
  });
  return context.MiCarrera;
}

function loadData() {
  return {
    continents: readJson('world/continents.json'),
    countries: readJson('world/countries.json'),
    competitions: readJson('world/competitions.json'),
    nationalTeams: readJson('world/national-teams.json'),
    clubs: readJson('clubs/clubs_seed.json'),
    archetypes: readJson('narrative/archetypes.json'),
    decisions: readJson('narrative/decisions.json'),
    events: readJson('narrative/events.json'),
    retirementLines: readJson('narrative/retirement_lines.json'),
    awards: readJson('narrative/awards.json')
  };
}

function autoplay(engine, state, maxSeasons) {
  let guard = 0;
  while (!state.retired && state.seasonIndex < maxSeasons && guard < 80) {
    guard += 1;
    if (state.phase === 'decision') {
      const dec = state.currentDecision;
      let optionId = 'train_balanced';
      if (dec && dec.options && dec.options.length) {
        optionId = dec.options[0].id;
        if (dec.type === 'transferencia') optionId = 'stay_loyal';
      }
      engine.resolveDecision(state, optionId, null);
    }
    if (state.retired) break;
    if (state.phase === 'simulate') {
      engine.simulateCurrentSeason(state);
    }
  }
  return state;
}

function main() {
  console.log('Mi Carrera start club smoke\n');
  const data = loadData();
  const MC = loadMC();
  const engine = MC.createEngine(data);
  MC._lastEngine = engine;

  assert(typeof MC.Rules.generateStartingClubOptions === 'function', 'generateStartingClubOptions exists');
  assert(typeof engine.previewStartingClubs === 'function', 'previewStartingClubs exists');

  const clubs = data.clubs;
  assert(clubs.length >= 100, 'club dataset size (' + clubs.length + ')');
  const withBadgeId = clubs.filter((c) => c.badgeId).length;
  const incomplete = clubs.filter((c) => c.incomplete).length;
  console.log('  INFO clubs=' + clubs.length + ' badgeId=' + withBadgeId + ' incomplete=' + incomplete);

  const preview = engine.previewStartingClubs({
    name: 'StartQA',
    countryId: 'country_ar',
    position: 'MID',
    archetypeId: 'arch_tech_promise',
    seed: 4242
  });
  assert(preview.options.length === 3, 'exactly 3 start options');
  assert(preview.seed === 4242, 'preview respects seed');

  const ids = preview.options.map((o) => o.clubId);
  assert(new Set(ids).size === 3, 'three distinct clubs');
  preview.options.forEach(function (opt, i) {
    assert(!!engine.getClub(opt.clubId), 'option ' + i + ' valid club');
    assert(!!opt.competitionName || !!opt.competitionId, 'option ' + i + ' competition');
    assert(opt.minutes && opt.minutes.label, 'option ' + i + ' minutes label');
    assert(opt.role, 'option ' + i + ' role');
    const badge = MC.getClubBadge(opt.clubId, opt.club);
    const src = MC.Badges.resolveBadgeSrc(badge, function () {
      return false;
    });
    assert(!!src, 'option ' + i + ' badge fallback src');
  });

  const levels = preview.options.map((o) => o.level);
  assert(Math.max.apply(null, levels) !== Math.min.apply(null, levels), 'distinct levels when possible');

  const preview2 = engine.previewStartingClubs({
    name: 'StartQA',
    countryId: 'country_ar',
    position: 'MID',
    archetypeId: 'arch_tech_promise',
    seed: 4242
  });
  assert(
    preview2.options.map((o) => o.clubId).join(',') === ids.join(','),
    'start options deterministic by seed'
  );

  // Context sanity: AR options should prefer SA / AR
  const arish = preview.options.filter(function (o) {
    const c = engine.getClub(o.clubId);
    return c && (c.countryId === 'country_ar' || c.continentId === 'continent_sa');
  });
  assert(arish.length >= 2, 'options respect country/region context');

  // Giant ≠ automatically better minutes
  const sortedByLevel = preview.options.slice().sort((a, b) => b.level - a.level);
  const giant = sortedByLevel[0];
  const small = sortedByLevel[sortedByLevel.length - 1];
  const giantApps = Number(String(giant.minutes.appsHint).split('–')[0]);
  const smallApps = Number(String(small.minutes.appsHint).split('–')[0]);
  assert(smallApps >= giantApps, 'smaller club expected minutes >= giant');

  // Path simulation: same seed family, different start clubs
  const paths = [
    { clubId: giant.clubId, label: 'giant' },
    { clubId: preview.options[1].clubId, label: 'mid' },
    { clubId: small.clubId, label: 'small' }
  ];
  const pathStats = paths.map(function (p, idx) {
    const st = engine.createCareer({
      name: 'Path' + p.label,
      countryId: 'country_ar',
      position: 'MID',
      archetypeId: 'arch_tech_promise',
      seed: 5000 + idx,
      clubId: p.clubId
    });
    assert(st.clubId === p.clubId, 'createCareer honors clubId ' + p.label);
    // One season minutes probe (career starts in simulate)
    if (st.phase === 'decision' && st.currentDecision) {
      engine.resolveDecision(st, (st.currentDecision.options || [{ id: 'stay_loyal' }])[0].id);
    }
    const before = st.seasonIndex;
    const res = engine.simulateCurrentSeason(st);
    const apps = res.season.appearances;
    return { label: p.label, clubId: p.clubId, apps: apps, rating: st.rating, level: engine.getClub(p.clubId).level };
  });

  console.log(
    '  INFO S1 apps giant/mid/small=',
    pathStats.map((p) => p.label + ':' + p.apps).join(' ')
  );
  assert(
    pathStats[2].apps >= pathStats[0].apps - 2,
    'small club first season minutes not worse than giant (soft)'
  );

  // Broader path divergence (33/33/34 style sample, compressed)
  const n = 12;
  const buckets = { giant: [], mid: [], small: [] };
  for (let i = 0; i < n; i++) {
    const pr = engine.previewStartingClubs({
      name: 'Div' + i,
      countryId: 'country_ar',
      position: 'FWD',
      archetypeId: 'arch_physical',
      seed: 9000 + i
    });
    const g = pr.options.slice().sort((a, b) => b.level - a.level)[0];
    const s = pr.options.slice().sort((a, b) => a.level - b.level)[0];
    const m = pr.options.find((o) => o.clubId !== g.clubId && o.clubId !== s.clubId) || pr.options[1];
    [
      ['giant', g.clubId],
      ['mid', m.clubId],
      ['small', s.clubId]
    ].forEach(function (pair) {
      let st = engine.createCareer({
        name: 'Div' + pair[0] + i,
        countryId: 'country_ar',
        position: 'FWD',
        archetypeId: 'arch_physical',
        seed: 9100 + i,
        clubId: pair[1]
      });
      st = autoplay(engine, st, 8);
      buckets[pair[0]].push({
        peak: st.peakRating || st.rating,
        apps:
          (st.seasonHistory || []).reduce(function (a, s) {
            return a + (s.appearances || 0);
          }, 0) / Math.max(1, (st.seasonHistory || []).length),
        eu: (st.clubsPlayed || []).some(function (id) {
          const c = engine.getClub(id);
          return c && c.continentId === 'continent_eu';
        })
      });
    });
  }

  function avg(arr, key) {
    return arr.reduce((a, x) => a + x[key], 0) / arr.length;
  }
  const avgAppsGiant = avg(buckets.giant, 'apps');
  const avgAppsSmall = avg(buckets.small, 'apps');
  console.log(
    '  INFO avg apps/season giant=' +
      avgAppsGiant.toFixed(1) +
      ' mid=' +
      avg(buckets.mid, 'apps').toFixed(1) +
      ' small=' +
      avgAppsSmall.toFixed(1)
  );
  assert(avgAppsSmall > avgAppsGiant, 'small starts yield more avg minutes than giant starts');

  const fingerprints = {};
  ['giant', 'mid', 'small'].forEach(function (k) {
    fingerprints[k] = buckets[k]
      .map(function (x) {
        return Math.round(x.peak) + ':' + Math.round(x.apps);
      })
      .join('|');
  });
  assert(
    fingerprints.giant !== fingerprints.small,
    'giant vs small start paths diverge'
  );

  console.log('\nPassed: ' + passed + '  Failed: ' + failed);
  process.exit(failed ? 1 : 0);
}

main();
