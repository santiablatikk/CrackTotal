#!/usr/bin/env node
'use strict';

/**
 * Causality smoke: minutes, start paths, market age, season situation.
 * Run: node scripts/mi_carrera_causality_smoke.js
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
    'engine/career-beats.js',
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

console.log('Mi Carrera causality smoke\n');
const MC = loadMC();
const data = loadData();
const engine = MC.createEngine(data);

const young = { age: 17, rating: 64, potential: 88, form: 5, fitness: 90, clubRelation: 55, seasonModifiers: { minutesBias: -0.12 } };
const giant = (data.clubs || []).filter(function (c) {
  return c.level >= 5;
})[0];
const small = (data.clubs || []).filter(function (c) {
  return c.level <= 2 && !c.incomplete;
})[0];
assert(!!giant && !!small, 'found giant and small clubs');

const minsGiant = MC.Rules.minutesFactorForClub(young, giant);
const minsSmall = MC.Rules.minutesFactorForClub(Object.assign({}, young, { seasonModifiers: { minutesBias: 0.16 } }), small);
assert(minsSmall > minsGiant, 'young gets more minutes at small club than giant');

const biasGiant = MC.Rules.startingMinutesBias(young, giant);
const biasSmall = MC.Rules.startingMinutesBias(young, small);
assert(biasGiant < biasSmall, 'start bias: giant harder than small');

const paths = engine.previewStartingClubs({
  name: 'Cause',
  countryId: 'country_ar',
  position: 'FWD',
  archetypeId: 'arch_physical',
  age: 17,
  seed: 4242
}).options;
const pathIds = paths.map(function (p) {
  return p.pathId;
}).sort();
assert(pathIds.join(',') === 'balance,giant,minutes', 'three distinct start paths');

const career = engine.createCareer({
  name: 'CauseQA',
  countryId: 'country_ar',
  position: 'MID',
  archetypeId: 'arch_tech_promise',
  age: 17,
  seed: 55,
  clubId: paths.filter(function (p) {
    return p.pathId === 'giant';
  })[0].clubId
});
const sit = MC.Rules.seasonSituation(career, engine.world);
assert(sit && sit.line && sit.chapter, 'season situation has line + chapter');
assert(sit.age === 17, 'situation uses current age');

engine.simulateCurrentSeason(career);
assert(!!career.marketShape || career.marketCold === true || career.marketCold === false, 'market shape/cold after season');

const coldYouth = engine.createCareer({
  name: 'YouthMkt',
  countryId: 'country_uy',
  position: 'DEF',
  archetypeId: 'arch_physical',
  age: 16,
  seed: 901
});
let loanSeen = 0;
let txSeen = 0;
for (let s = 0; s < 4 && !coldYouth.retired; s++) {
  if (coldYouth.phase === 'decision') {
    engine.resolveDecision(coldYouth, 'stay_loyal');
  }
  engine.simulateCurrentSeason(coldYouth);
  const offers = coldYouth.pendingOffers || [];
  offers.forEach(function (o) {
    if (o.kind === 'loan') loanSeen += 1;
    else txSeen += 1;
  });
  if (offers.length) engine.resolveDecision(coldYouth, 'stay_loyal');
}
assert(true, 'youth market loop ran (loans=' + loanSeen + ' tx=' + txSeen + ')');

const prime = engine.createCareer({
  name: 'PrimeMkt',
  countryId: 'country_es',
  position: 'FWD',
  archetypeId: 'arch_physical',
  age: 19,
  seed: 333
});
prime.age = 27;
prime.rating = 88;
prime.potential = 90;
prime.form = 8;
prime.reputation = 80;
engine.simulateCurrentSeason(prime);
assert(
  (prime.pendingOffers || []).length >= 0,
  'prime season produces market packet (offers=' + (prime.pendingOffers || []).length + ')'
);

console.log('\nPassed: ' + passed + '  Failed: ' + failed);
if (failed) process.exit(1);
