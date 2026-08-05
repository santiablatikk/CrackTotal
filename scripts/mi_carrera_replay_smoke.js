#!/usr/bin/env node
'use strict';

/**
 * Replayability / balance smoke for Mi Carrera.
 * Run: node scripts/mi_carrera_replay_smoke.js
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

function loadEngineModules() {
  const sandbox = { console: console, globalThis: null };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  const files = [
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
  ];
  files.forEach(function (rel) {
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
    awards: readJson('narrative/awards.json'),
    packs: readJson('manifests/packs.json')
  };
}

function fingerprint(state) {
  const clubs = (state.clubsPlayed || []).join(',');
  const titles = (state.titleIds || []).slice().sort().join(',');
  const awards = (state.awards || [])
    .map(function (a) {
      return a.awardId;
    })
    .sort()
    .join(',');
  return [
    state.peakRating,
    state.age,
    (state.seasonHistory || []).length,
    clubs,
    titles,
    awards,
    Math.round((state.careerScore || 0) * 10)
  ].join('|');
}

function hasTitle(state, id) {
  return (state.titleIds || []).indexOf(id) !== -1 || (state.titles || []).some(function (t) {
    return t.competitionId === id;
  });
}

function main() {
  console.log('\nMi Carrera replay smoke\n');
  const MC = loadEngineModules();
  const data = loadData();
  const engine = MC.createEngineFromData(data);
  MC.Storage.resetAll();

  assert(typeof MC.Rules.formStatus === 'function', 'formStatus exists');
  assert(typeof MC.Rules.updateArcState === 'function', 'updateArcState exists');
  assert(MC.Rules.formStatus(9).id === 'hot', 'form hot band');
  assert(MC.Rules.formStatus(2).id === 'crisis', 'form crisis band');

  const N = 100;
  const countries = ['country_ar', 'country_br', 'country_es', 'country_uy', 'country_fr', 'country_eng'];
  const positions = ['GK', 'DEF', 'MID', 'FWD'];
  const arches = (data.archetypes || []).map(function (a) {
    return a.id;
  });

  const fps = Object.create(null);
  let seasonsSum = 0;
  let peakSum = 0;
  let ballon = 0;
  let ucl = 0;
  let libertadores = 0;
  let worldCup = 0;
  let comeback = 0;
  let crisis = 0;
  let retireBefore30 = 0;
  let retireAfter35 = 0;
  let peak90 = 0;
  let emptyOfferSeasons = 0;
  let offerSeasons = 0;
  let saStayStrong = 0;
  let euCareers = 0;

  for (let i = 0; i < N; i++) {
    const seed = 1000 + i * 17;
    const st = engine.createCareer({
      name: 'Replay' + i,
      countryId: countries[i % countries.length],
      position: positions[i % positions.length],
      archetypeId: arches[i % arches.length],
      seed: seed
    });
    engine.autoPlayUntilRetired(st, 36);
    if (!st.retired) {
      st.age = Math.max(34, st.age);
      engine.forceRetire(st, 'voluntary');
    }

    const fp = fingerprint(st);
    fps[fp] = (fps[fp] || 0) + 1;
    seasonsSum += (st.seasonHistory || []).length;
    peakSum += st.peakRating || st.rating;
    if ((st.peakRating || 0) >= 90) peak90 += 1;
    if (st.age < 30) retireBefore30 += 1;
    if (st.age >= 36) retireAfter35 += 1;

    if (MC.Awards.countAwards(st, 'award_ballon_dor') >= 1) ballon += 1;
    if (hasTitle(st, 'comp_ucl')) ucl += 1;
    if (hasTitle(st, 'comp_libertadores')) libertadores += 1;
    if (hasTitle(st, 'comp_world_cup')) worldCup += 1;

    let hadCrisis = false;
    let hadComeback = false;
    let hadEu = false;
    const hist = st.seasonHistory || [];
    for (let hi = 0; hi < hist.length; hi++) {
      const s = hist[hi];
      if (s.arcFlags && s.arcFlags.crisis) hadCrisis = true;
      if (s.arcFlags && s.arcFlags.comeback) hadComeback = true;
      const club = engine.getClub(s.clubId);
      if (club && club.continentId === 'continent_eu') hadEu = true;
      if (
        hi >= 2 &&
        (hist[hi - 1].performanceGrade === 'D' || hist[hi - 2].performanceGrade === 'D') &&
        (s.performanceGrade === 'B' || s.performanceGrade === 'A' || s.performanceGrade === 'S')
      ) {
        hadComeback = true;
      }
    }
    (st.moments || []).forEach(function (m) {
      if (String(m.id).indexOf('moment_crisis_') === 0) hadCrisis = true;
      if (String(m.id).indexOf('moment_comeback_') === 0) hadComeback = true;
    });
    if (hadCrisis) crisis += 1;
    if (hadComeback) comeback += 1;
    if (hadEu) euCareers += 1;
    if (!hadEu && (st.careerScore || 0) >= 7) saStayStrong += 1;

    // Sample market emptiness mid-career if possible via history proxy: low apps seasons often precede quiet markets
    (st.seasonHistory || []).forEach(function (s) {
      if ((s.appearances || 0) < 14 || s.performanceGrade === 'D') emptyOfferSeasons += 1;
      else offerSeasons += 1;
    });
  }

  const unique = Object.keys(fps).length;
  const avgSeasons = seasonsSum / N;
  const avgPeak = peakSum / N;
  const ballonPct = (ballon / N) * 100;
  const uclPct = (ucl / N) * 100;
  const libPct = (libertadores / N) * 100;
  const comePct = (comeback / N) * 100;
  const crisisPct = (crisis / N) * 100;
  const peak90Pct = (peak90 / N) * 100;

  console.log('\n--- Replay stats (n=' + N + ') ---');
  console.log('Unique fingerprints: ' + unique);
  console.log('Avg seasons: ' + avgSeasons.toFixed(2));
  console.log('Avg peak OVR: ' + avgPeak.toFixed(2));
  console.log('Ballon d\'Or: ' + ballonPct.toFixed(1) + '%');
  console.log('Champions: ' + uclPct.toFixed(1) + '%');
  console.log('Libertadores: ' + libPct.toFixed(1) + '%');
  console.log('World Cup: ' + ((worldCup / N) * 100).toFixed(1) + '%');
  console.log('Crisis careers: ' + crisisPct.toFixed(1) + '%');
  console.log('Comeback careers: ' + comePct.toFixed(1) + '%');
  console.log('Retire <30: ' + ((retireBefore30 / N) * 100).toFixed(1) + '%');
  console.log('Retire >=36: ' + ((retireAfter35 / N) * 100).toFixed(1) + '%');
  console.log('Peak >=90: ' + peak90Pct.toFixed(1) + '%');
  console.log('EU careers: ' + ((euCareers / N) * 100).toFixed(1) + '%');
  console.log('Strong non-EU: ' + saStayStrong);

  assert(unique >= 55, '1. careers not identical (' + unique + '/100 unique)');
  assert(avgSeasons >= 8 && avgSeasons <= 28, '2. avg seasons sane (' + avgSeasons.toFixed(2) + ')');
  assert(ballonPct <= 22, '3. Ballon not common (' + ballonPct.toFixed(1) + '%)');
  assert(uclPct <= 45, '4. UCL not everyone (' + uclPct.toFixed(1) + '%)');
  assert(peak90Pct <= 35, '5. 90+ OVR not everyone (' + peak90Pct.toFixed(1) + '%)');
  assert(crisisPct >= 8, '6. adversity exists (' + crisisPct.toFixed(1) + '%)');
  assert(comePct >= 3, '7. comebacks possible (' + comePct.toFixed(1) + '%)');
  assert(retireAfter35 >= 5, '8. some long careers (' + retireAfter35 + ')');
  assert(euCareers >= 10 && euCareers <= 95, '9. Europe path mixed (' + euCareers + ')');
  assert(
    libertadores + worldCup + ucl >= 3 || saStayStrong >= 1,
    '10. glory paths exist (lib=' + libertadores + ' wc=' + worldCup + ' ucl=' + ucl + ')'
  );
  assert(avgPeak >= 70 && avgPeak <= 92, '11. avg peak band (' + avgPeak.toFixed(1) + ')');
  assert(crisisPct <= 92, '14. crisis not universal (' + crisisPct.toFixed(1) + '%)');

  // Same inputs different seeds → different outcomes
  const twins = [];
  for (let t = 0; t < 12; t++) {
    const a = engine.createCareer({
      name: 'Twin',
      countryId: 'country_ar',
      position: 'MID',
      archetypeId: arches[0],
      seed: 9000 + t
    });
    engine.autoPlayUntilRetired(a, 32);
    if (!a.retired) engine.forceRetire(a, 'voluntary');
    twins.push(fingerprint(a));
  }
  const twinSet = {};
  twins.forEach(function (x) {
    twinSet[x] = 1;
  });
  assert(Object.keys(twinSet).length >= 8, '12. same archetype/seed diversity (' + Object.keys(twinSet).length + '/12)');

  // Determinism: same seed same fingerprint
  const d1 = engine.createCareer({
    name: 'Det',
    countryId: 'country_br',
    position: 'FWD',
    archetypeId: arches[0],
    seed: 4242
  });
  engine.autoPlayUntilRetired(d1, 30);
  if (!d1.retired) engine.forceRetire(d1, 'voluntary');
  const d2 = engine.createCareer({
    name: 'Det',
    countryId: 'country_br',
    position: 'FWD',
    archetypeId: arches[0],
    seed: 4242
  });
  engine.autoPlayUntilRetired(d2, 30);
  if (!d2.retired) engine.forceRetire(d2, 'voluntary');
  assert(fingerprint(d1) === fingerprint(d2), '13. same seed deterministic');

  console.log('\nPassed: ' + passed + '\nFailed: ' + failed);
  process.exit(failed ? 1 : 0);
}

main();
