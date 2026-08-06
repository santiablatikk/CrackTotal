#!/usr/bin/env node
'use strict';

/**
 * Pacing modes smoke — intense / normal / express block sizes.
 * Run: node scripts/mi_carrera_pacing_modes_smoke.js
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

console.log('Mi Carrera pacing modes smoke\n');

const MC = loadMC();
const data = loadData();
const engine = MC.createEngine(data);

assert(MC.Beats && MC.Beats.PACING, 'Beats module loaded');
assert(MC.Beats.blockSize({ pacingMode: 'intense' }) === 1, 'intense = 1');
assert(MC.Beats.blockSize({ pacingMode: 'normal' }) === 2, 'normal = 2');
assert(MC.Beats.blockSize({ pacingMode: 'express' }) === 3, 'express = 3');

function playOneBlock(mode, seed) {
  const st = engine.createCareer({
    name: 'Pace' + mode,
    countryId: 'country_ar',
    position: 'MID',
    archetypeId: 'arch_tech_promise',
    age: 17,
    seed: seed,
    pacingMode: mode
  });
  assert(st.pacingMode === mode, mode + ' pacing stored');
  assert(st.phase === 'simulate', mode + ' create ready to play');
  engine.prepareCareerBeat(st);
  assert(st.phase === 'beat', mode + ' prepare → beat');
  const beforeSeasons = (st.seasonHistory || []).length;
  const beforeAge = st.age;
  engine.resolveCareerBeat(st, MC.Beats.defaultOptionId(st.currentBeat));
  assert(st.phase === 'simulate', mode + ' after beat → simulate');
  const result = engine.simulateBlock(st);
  const n = MC.Beats.blockSize({ pacingMode: mode });
  const gained = (st.seasonHistory || []).length - beforeSeasons;
  assert(gained === n || st.retired, mode + ' block sims ' + n + ' seasons (got ' + gained + ')');
  assert(result.block && result.block.seasonCount === gained, mode + ' block aggregate count');
  if (!st.retired) {
    assert(st.age === beforeAge + gained, mode + ' age advances by block');
    assert(st.phase === 'decision', mode + ' ends in market decision');
  }
  return st;
}

playOneBlock('intense', 101);
playOneBlock('normal', 202);
playOneBlock('express', 303);

const full = engine.createCareer({
  name: 'ExpressFull',
  countryId: 'country_br',
  position: 'FWD',
  archetypeId: 'arch_physical',
  age: 16,
  seed: 909,
  pacingMode: 'express'
});
engine.autoPlayUntilRetired(full, 40);
assert(full.retired, 'express autoplay retires');
assert((full.seasonHistory || []).length >= 8, 'express career has seasons');

console.log('\nPassed: ' + passed + '  Failed: ' + failed);
if (failed) process.exit(1);
