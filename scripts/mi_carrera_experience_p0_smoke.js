#!/usr/bin/env node
'use strict';

/**
 * P0 experience smoke: one-offer market, start-club promises, compare metrics, retire hook.
 * Run: node scripts/mi_carrera_experience_p0_smoke.js
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
      return {
        style: {},
        setAttribute: function () {},
        appendChild: function () {},
        remove: function () {}
      };
    },
    body: { appendChild: function () {} }
  };
  sandbox.navigator = { clipboard: null };
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

console.log('Mi Carrera experience P0 smoke');
const MC = loadMC();
const data = loadData();
const engine = MC.createEngine(data);

const preview = engine.previewStartingClubs({
  name: 'P0',
  countryId: 'country_ar',
  position: 'FWD',
  archetypeId: 'arch_physical',
  seed: 42
});
const paths = preview.options || [];

assert(Array.isArray(paths) && paths.length === 3, 'three start club paths');
const pathIds = paths.map(function (p) {
  return p.pathId;
}).sort();
assert(pathIds.join(',') === 'balance,giant,minutes', 'paths are giant/balance/minutes');

const startHtml = MC.UI.screens.startClub({ options: paths, engine: engine });
assert(startHtml.indexOf('mc-path-promise') !== -1, 'start club shows career promise');
assert(startHtml.indexOf('Más prestigio') !== -1, 'giant path consequence visible');
assert(startHtml.indexOf('Ser figura ya') !== -1, 'minutes path consequence visible');
assert(startHtml.indexOf('Crecer sin ahogarte') !== -1, 'balance path consequence visible');

const state = engine.createCareer({
  name: 'P0Market',
  countryId: 'country_ar',
  position: 'MID',
  archetypeId: 'arch_tech_promise',
  seed: 11
});
const clubIds = Object.keys(engine.world.clubsById || {});
const clubA = state.clubId;
const clubB = clubIds.filter(function (id) {
  return id !== clubA;
})[0];
state.pendingOffers = [
  {
    id: 'p0_1',
    clubId: clubB,
    role: 'titular',
    kind: 'transfer',
    level: 3,
    prestige: 70,
    blurb: 'Te ofrecen el once.'
  },
  {
    id: 'p0_2',
    clubId: clubA,
    role: 'rotacion',
    kind: 'transfer',
    level: 4,
    prestige: 80,
    blurb: 'Rotación en un escaparate.'
  }
];

const m0 = MC.UI.screens.market({ state: state, engine: engine, offerIndex: 0 });
assert(m0.indexOf('mc-offer-focus') !== -1, 'market focuses one offer');
assert(m0.indexOf('Oferta 1 de 2') !== -1, 'market counter');
assert(m0.indexOf('Otra oferta') !== -1, 'market next CTA');
assert(m0.indexOf('Quedarme') !== -1, 'stay always available');

const m1 = MC.UI.screens.market({ state: state, engine: engine, offerIndex: 1 });
assert(m1.indexOf('Oferta 2 de 2') !== -1, 'second offer scene');
assert(m1.indexOf('Otra oferta') === -1, 'no next on last offer');

const compare = MC.UI.screens.compareScene({
  state: state,
  engine: engine,
  offer: state.pendingOffers[0]
});
assert(compare.indexOf('mc-trade-metrics') !== -1, 'compare shows trade metrics');
assert(compare.indexOf('Fichar') !== -1, 'compare primary CTA');
assert(compare.indexOf('Quedarme') !== -1, 'compare stay CTA');

state.marketCold = true;
state.marketLegacy = true;
state.pendingOffers = [];
const cold = MC.UI.screens.market({ state: state, engine: engine });
assert(cold.indexOf('referente') !== -1 || cold.indexOf('legado') !== -1, 'legacy cold market copy');

state.retired = true;
state.retirementLine = 'Una carrera para contar.';
state.seasonHistory = state.seasonHistory || [{ seasonIndex: 0 }];
state.peakRating = state.rating;
if (MC.Scoring && MC.Scoring.scoreCareer) {
  const scored = MC.Scoring.scoreCareer(state, engine.world);
  state.careerScore = scored.score;
  state.careerCategory = scored.category;
}
const retire = MC.UI.screens.retire({ state: state, engine: engine, reward: null });
assert(retire.indexOf('¿Y si hubieras elegido distinto?') !== -1, 'retire replay hook');
assert(retire.indexOf('Nueva carrera') !== -1, 'retire new career CTA');

console.log('\nPassed: ' + passed + '  Failed: ' + failed);
if (failed) process.exit(1);
