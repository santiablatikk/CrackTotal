#!/usr/bin/env node
'use strict';

/**
 * Career beat decisions must mutate real state (minutes/form/etc).
 * Run: node scripts/mi_carrera_decision_consequence_smoke.js
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
  sandbox.document = {
    createElement: function () {
      return { style: {}, setAttribute: function () {}, select: function () {} };
    },
    body: { appendChild: function () {}, removeChild: function () {} }
  };
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
    'ui/format.js',
    'ui/components.js',
    'ui/career-narrative.js',
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

console.log('Mi Carrera decision consequence smoke\n');

const MC = loadMC();
const data = loadData();
const engine = MC.createEngine(data);

const st = engine.createCareer({
  name: 'BeatQA',
  countryId: 'country_ar',
  position: 'MID',
  archetypeId: 'arch_tech_promise',
  age: 18,
  seed: 1212,
  pacingMode: 'intense'
});
engine.prepareCareerBeat(st);
assert(st.phase === 'beat', 'starts in beat');
assert(st.currentBeat && st.currentBeat.options.length >= 2, 'beat has 2+ options');

const train = st.currentBeat.options.find(function (o) {
  return o.id === 'train_hard';
});
const recover = st.currentBeat.options.find(function (o) {
  return o.id === 'recover';
});
assert(train || recover || st.currentBeat.options[0], 'has actionable option');

const opt = train || st.currentBeat.options[0];
assert(opt.ups && opt.ups.length, 'option shows ups');
assert(opt.downs && opt.downs.length, 'option shows downs');
assert(opt.effects && Object.keys(opt.effects).length > 0, 'option has real effects');

const formBefore = st.form;
const fitnessBefore = st.fitness;
const result = engine.resolveCareerBeat(st, opt.id);
assert(st.phase === 'simulate', 'beat resolves to simulate');
assert(st.blockModifiers, 'block modifiers set');
assert(st.lastBeatConsequence && st.lastBeatConsequence.length > 8, 'consequence line stored');
assert(
  st.form !== formBefore ||
    st.fitness !== fitnessBefore ||
    (st.blockModifiers.minutesBias || 0) !== 0 ||
    (st.blockModifiers.injuryRiskBias || 0) !== 0,
  'beat mutated form/fitness/modifiers'
);
assert(result.beat && result.beat.consequence, 'resolve returns consequence');

const a = engine.createCareer({
  name: 'DetBeatA',
  countryId: 'country_uy',
  position: 'FWD',
  archetypeId: 'arch_physical',
  age: 17,
  seed: 555,
  pacingMode: 'normal'
});
const b = engine.createCareer({
  name: 'DetBeatB',
  countryId: 'country_uy',
  position: 'FWD',
  archetypeId: 'arch_physical',
  age: 17,
  seed: 555,
  pacingMode: 'normal'
});
engine.prepareCareerBeat(a);
engine.prepareCareerBeat(b);
assert(a.currentBeat.options.map(function (o) { return o.id; }).join(',') ===
  b.currentBeat.options.map(function (o) { return o.id; }).join(','), 'same seed same beat options');

const fight = a.currentBeat.options.find(function (o) {
  return o.id === 'fight_start' || o.id === 'train_hard';
}) || a.currentBeat.options[0];
engine.resolveCareerBeat(a, fight.id);
engine.resolveCareerBeat(b, fight.id);
const ra = engine.simulateBlock(a);
const rb = engine.simulateBlock(b);
assert(ra.block.appearances === rb.block.appearances, 'determinism block appearances');
assert(a.rating === b.rating, 'determinism rating after same beat');

const modeHtml = MC.UI.screens.modeSelect();
assert(modeHtml.indexOf('Exprés') !== -1 || modeHtml.indexOf('Express') !== -1 || modeHtml.indexOf('pick-mode') !== -1, 'mode screen');
assert(modeHtml.indexOf('data-mode="intense"') !== -1, 'intense mode card');

const beatHtml = MC.UI.screens.careerBeat({
  state: st,
  engine: engine,
  beat: (function () {
    const tmp = engine.createCareer({
      name: 'UIBeat',
      countryId: 'country_ar',
      position: 'GK',
      archetypeId: 'arch_tactical',
      seed: 7,
      pacingMode: 'express'
    });
    engine.prepareCareerBeat(tmp);
    return tmp.currentBeat;
  })()
});
assert(beatHtml.indexOf('mc-beat-option') !== -1, 'beat UI options');
assert(beatHtml.indexOf('mc-path-up') !== -1 || beatHtml.indexOf('+') !== -1, 'beat UI ups');

console.log('\nPassed: ' + passed + '  Failed: ' + failed);
if (failed) process.exit(1);
