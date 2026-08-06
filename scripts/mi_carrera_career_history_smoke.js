#!/usr/bin/env node
'use strict';

/**
 * Career club timeline / history smoke.
 * Run: node scripts/mi_carrera_career_history_smoke.js
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
  const sandbox = { console: console, globalThis: null, document: { createElement: function () { return { style: {}, setAttribute: function () {} }; }, body: { appendChild: function () {} } }, navigator: {} };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.localStorage = {
    _s: {},
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; },
    setItem: function (k, v) { this._s[k] = String(v); },
    removeItem: function (k) { delete this._s[k]; }
  };
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
    'ui/format.js',
    'ui/components.js',
    'ui/career-narrative.js',
    'ui/career-card.js',
    'ui/career-share.js',
    'ui/career-rewards.js',
    'ui/career-legacy.js',
    'ui/screens.js',
    'main.js'
  ].forEach(function (rel) {
    const full = path.join(JS_ROOT, rel);
    if (!fs.existsSync(full)) return;
    vm.runInContext(fs.readFileSync(full, 'utf8'), context, { filename: rel });
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
  engine.autoPlayUntilRetired(state, maxSeasons);
  if (!state.retired) engine.forceRetire(state, 'voluntary');
}

console.log('Mi Carrera career history smoke\n');
const MC = loadMC();
const data = loadData();
const engine = MC.createEngine(data);
MC._lastEngine = engine;

const state = engine.createCareer({
  name: 'HistQA',
  countryId: 'country_ar',
  position: 'FWD',
  archetypeId: 'arch_physical',
  age: 17,
  seed: 2026
});
assert(Array.isArray(state.clubTimeline), 'clubTimeline initialized');

autoplay(engine, state, 18);
assert(state.retired, 'career retired');
assert(state.clubTimeline.length === state.seasonHistory.length, 'timeline rows match seasons');
assert(state.clubTimeline[0].age === state.ageStart, 'first timeline age = ageStart');

const summary = MC.Rules.clubTimelineSummary(state, engine.world);
assert(summary.length >= 1, 'timeline summary has clubs');
assert(summary[0].name && summary[0].ageStart != null, 'summary row has name+age');

const card = MC.UI.CareerCardRenderer.render(state, engine);
assert(card.viewModel.ageStart === state.ageStart, 'card ageStart');
assert(card.viewModel.ageEnd === state.age, 'card ageEnd');
assert(Array.isArray(card.viewModel.clubTimeline), 'card includes clubTimeline');

const retireHtml = MC.UI.screens.retire({ state: state, engine: engine, reward: null });
assert(retireHtml.indexOf(String(state.ageStart)) !== -1, 'retire shows ageStart');
assert(retireHtml.indexOf('mc-career-timeline') !== -1, 'retire shows timeline');

const pre = MC.UI.screens.preSeason({ state: state, engine: engine });
assert(pre.indexOf('AÑOS') !== -1, 'preseason shows age');

console.log('\nPassed: ' + passed + '  Failed: ' + failed);
if (failed) process.exit(1);
