#!/usr/bin/env node
'use strict';

/**
 * Age axis smoke for Mi Carrera.
 * Run: node scripts/mi_carrera_age_smoke.js
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
    if (state.phase === 'decision' && state.currentDecision) {
      const opts = state.currentDecision.options || [{ id: 'stay_loyal' }];
      engine.resolveDecision(state, opts[0].id, state.pendingOffers && state.pendingOffers[0]);
      continue;
    }
    if (state.phase === 'simulate' || !state.phase) {
      engine.simulateCurrentSeason(state);
      if (state.retired) break;
      if (state.pendingOffers && state.pendingOffers.length) {
        engine.resolveDecision(state, 'stay_loyal');
      } else if (state.phase === 'decision') {
        engine.resolveDecision(state, 'stay_loyal');
      }
    } else {
      break;
    }
  }
}

console.log('Mi Carrera age smoke\n');
const MC = loadMC();
const data = loadData();
const engine = MC.createEngine(data);

assert(MC.Rules.ageBand(17) === 'youth', '16-18 youth band');
assert(MC.Rules.ageBand(20) === 'growth', '19-21 growth band');
assert(MC.Rules.ageBand(24) === 'rising', '22-25 rising band');
assert(MC.Rules.ageBand(27) === 'prime', '26-29 prime band');
assert(MC.Rules.ageBand(31) === 'peak_stable', '30-32 peak_stable');
assert(MC.Rules.ageBand(34) === 'early_decline', '33-35 early_decline');
assert(MC.Rules.ageBand(38) === 'late' || MC.Rules.ageBand(38) === 'decline', '36+ late/decline');

const st16 = engine.createCareer({
  name: 'Age16',
  countryId: 'country_ar',
  position: 'FWD',
  archetypeId: 'arch_physical',
  age: 16,
  seed: 1616
});
assert(st16.age === 16, 'create age 16');
assert(st16.ageStart === 16, 'ageStart 16');
assert(st16.birthYear === 2010, 'birthYear for age 16');

const st19 = engine.createCareer({
  name: 'Age19',
  countryId: 'country_br',
  position: 'MID',
  archetypeId: 'arch_tech_promise',
  age: 19,
  seed: 1919
});
assert(st19.age === 19 && st19.birthYear === 2007, 'create age 19 + birthYear');

const preview = engine.previewStartingClubs({
  name: 'P',
  countryId: 'country_ar',
  position: 'MID',
  archetypeId: 'arch_tech_promise',
  age: 18,
  seed: 88
});
assert(preview.age === 18, 'preview respects age');
assert(preview.options.length === 3, 'preview still 3 clubs');

const career = engine.createCareer({
  name: 'AgeTrack',
  countryId: 'country_ar',
  position: 'MID',
  archetypeId: 'arch_tech_promise',
  age: 17,
  seed: 777
});
const startAge = career.age;
engine.simulateCurrentSeason(career);
assert(career.seasonHistory[0].age === startAge, 'season record stores age during season');
assert(career.age === startAge + 1, 'age increments after season');
assert(career.seasonHistory[0].ageChapter, 'season stores age chapter');

autoplay(engine, career, 12);
const ages = career.seasonHistory.map(function (s) {
  return s.age;
});
let sequential = true;
for (let i = 1; i < ages.length; i++) {
  if (ages[i] !== ages[i - 1] + 1) sequential = false;
}
assert(sequential && ages.length > 3, 'ages advance +1 each season in history');

const chapYoung = MC.Rules.ageChapter(17, { rating: 64 });
const chapPrime = MC.Rules.ageChapter(27, { rating: 88, peakRating: 88 });
const chapLate = MC.Rules.ageChapter(34, { rating: 80, arcFlags: {} });
assert(chapYoung && chapYoung.length > 2, 'age chapter youth');
assert(chapPrime && chapPrime.indexOf('MEJOR') !== -1 || chapPrime === 'PRIME', 'age chapter prime');
assert(chapLate && chapLate.length > 2, 'age chapter late');

const rng = new MC.Randomizer(99);
let veteranSurge = false;
for (let i = 0; i < 40; i++) {
  const d = MC.Rules.growthDelta(34, 84, 88, 8, 0.1, null, rng.fork('v' + i), {
    lastGrade: 'A',
    comeback: true,
    confidence: 70
  });
  if (d >= 0) veteranSurge = true;
}
assert(veteranSurge, 'veteran can avoid automatic decline with form/comeback');

console.log('\nPassed: ' + passed + '  Failed: ' + failed);
if (failed) process.exit(1);
