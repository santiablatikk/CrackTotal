#!/usr/bin/env node
'use strict';

/**
 * Goalkeeper stats smoke — GC / VI instead of goals / assists.
 * Run: node scripts/mi_carrera_gk_smoke.js
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
  sandbox.navigator = { clipboard: null };
  sandbox.document = {
    createElement: function () {
      return {
        value: '',
        style: {},
        setAttribute: function () {},
        select: function () {}
      };
    },
    body: { appendChild: function () {}, removeChild: function () {} },
    execCommand: function () {
      return true;
    }
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
    'ui/career-card.js',
    'ui/career-share.js',
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

console.log('Mi Carrera GK smoke\n');

const MC = loadMC();
const data = loadData();
const engine = MC.createEngine(data);

assert(typeof MC.UI.format.isGoalkeeper === 'function', 'format.isGoalkeeper');
assert(MC.UI.format.isGoalkeeper('GK') === true, 'GK is goalkeeper');
assert(MC.UI.format.isGoalkeeper('FWD') === false, 'FWD is not goalkeeper');

const gk = engine.createCareer({
  name: 'ArqueroQA',
  countryId: 'country_ar',
  position: 'GK',
  archetypeId: 'arch_tactical',
  age: 17,
  seed: 4242
});
assert(gk.player.position === 'GK', 'created as GK');

engine.simulateCurrentSeason(gk);
const s0 = gk.seasonHistory[gk.seasonHistory.length - 1];
assert(s0 && typeof s0.goalsAgainst === 'number', 'season has goalsAgainst');
assert(s0 && typeof s0.cleanSheets === 'number', 'season has cleanSheets');
assert(s0.goalsAgainst >= 0, 'goalsAgainst >= 0');
assert(s0.cleanSheets >= 0 && s0.cleanSheets <= s0.appearances, 'cleanSheets within apps');
if (s0.appearances > 0 && s0.cleanSheets < s0.appearances) {
  assert(s0.goalsAgainst >= s0.appearances - s0.cleanSheets, 'GA covers conceded apps');
}

const sit = MC.Rules.seasonSituation(gk, engine.world);
assert(
  /arco|porter|valla|arquero/i.test(sit.line + ' ' + sit.objective),
  'preseason GK copy mentions arco/portería'
);

const recap = MC.UI.screens.seasonRecap({
  season: s0,
  state: gk,
  engine: engine
});
assert(recap.indexOf('>GC<') !== -1 || recap.indexOf('>GC</') !== -1 || recap.indexOf('GC</span>') !== -1, 'recap shows GC');
assert(recap.indexOf('>VI<') !== -1 || recap.indexOf('VI</span>') !== -1, 'recap shows VI');
assert(recap.indexOf('Goles</span>') === -1, 'recap GK hides Goles label');
assert(recap.indexOf('Asist.</span>') === -1, 'recap GK hides Asist label');

const a = engine.createCareer({
  name: 'DetA',
  countryId: 'country_uy',
  position: 'GK',
  archetypeId: 'arch_tactical',
  age: 18,
  seed: 777
});
const b = engine.createCareer({
  name: 'DetB',
  countryId: 'country_uy',
  position: 'GK',
  archetypeId: 'arch_tactical',
  age: 18,
  seed: 777
});
engine.simulateCurrentSeason(a);
engine.simulateCurrentSeason(b);
const sa = a.seasonHistory[0];
const sb = b.seasonHistory[0];
assert(
  sa.appearances === sb.appearances &&
    sa.goalsAgainst === sb.goalsAgainst &&
    sa.cleanSheets === sb.cleanSheets &&
    sa.averageRating === sb.averageRating,
  'determinism same seed same GK season'
);

engine.autoPlayUntilRetired(gk, 28);
if (!gk.retired) {
  gk.age = Math.max(32, gk.age);
  engine.forceRetire(gk, 'age_decline');
}

const agg = MC.Scoring.aggregateHistory(gk);
assert(typeof agg.goalsAgainst === 'number', 'agg goalsAgainst');
assert(typeof agg.cleanSheets === 'number', 'agg cleanSheets');
assert(agg.cleanSheets >= 0, 'career cleanSheets >= 0');

const card = MC.UI.CareerCardRenderer.render(gk, engine);
assert(card.viewModel.position === 'GK', 'card position GK');
assert(card.viewModel.cleanSheets === agg.cleanSheets, 'card cleanSheets');
assert(card.viewModel.goalsAgainst === agg.goalsAgainst, 'card goalsAgainst');
assert(card.html.indexOf('>VI</') !== -1 || card.html.indexOf('VI</span>') !== -1, 'card HTML shows VI');
assert(card.html.indexOf('Goles</span>') === -1, 'card HTML hides Goles for GK');

const share = MC.UI.Share.buildShareText(card.viewModel);
assert(share.indexOf('vallas invictas') !== -1 || share.indexOf('goles en contra') !== -1, 'share GK metrics');
assert(share.indexOf(' goles\n') === -1 && !/^\d+ goles$/m.test(share), 'share avoids field goals line');

let awardHit = false;
for (let n = 0; n < 50; n++) {
  const wins = MC.Awards.resolveSeasonAwards(
    Object.assign({}, gk, { rating: 88, form: 9, reputation: 80, age: 27 }),
    engine.world,
    new MC.Randomizer(9100 + n),
    {
      appearances: 34,
      goals: 0,
      assists: 0,
      goalsAgainst: 28,
      cleanSheets: 14,
      averageRating: 8.1
    },
    {
      competitions: { league: { champion: true } },
      titles: [],
      trophyIds: []
    },
    { nationalTeamCompetitions: [] }
  );
  if (wins.some(function (w) { return w.awardId === 'award_best_gk'; })) {
    awardHit = true;
    break;
  }
}
assert(awardHit, 'best GK award uses cleanSheets path');

const fwd = engine.createCareer({
  name: 'DelanteroQA',
  countryId: 'country_ar',
  position: 'FWD',
  archetypeId: 'arch_physical',
  age: 17,
  seed: 99
});
engine.simulateCurrentSeason(fwd);
const fwdSeason = fwd.seasonHistory[0];
assert((fwdSeason.goalsAgainst || 0) === 0 && (fwdSeason.cleanSheets || 0) === 0, 'outfield season GC/VI stay 0');
const fwdRecap = MC.UI.screens.seasonRecap({ season: fwdSeason, state: fwd, engine: engine });
assert(fwdRecap.indexOf('Goles</span>') !== -1, 'FWD recap still shows Goles');
assert(fwdRecap.indexOf('GC</span>') === -1, 'FWD recap hides GC');

console.log('\nPassed: ' + passed + '  Failed: ' + failed);
if (failed) process.exit(1);
