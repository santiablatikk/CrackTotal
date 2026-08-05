#!/usr/bin/env node
'use strict';

/**
 * Season recap + celebration integrity smoke.
 * Run: node scripts/mi_carrera_season_recap_smoke.js
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
  const sandbox = { console: console, globalThis: null, document: { createElement: function () { return { style: {}, setAttribute: function () {} }; }, body: { appendChild: function () {}, removeChild: function () {} } }, navigator: {} };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.localStorage = { _s: {}, getItem: function (k) { return this._s[k] || null; }, setItem: function (k, v) { this._s[k] = String(v); }, removeItem: function (k) { delete this._s[k]; } };
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
    'main.js',
    'ui/format.js',
    'ui/components.js',
    'ui/career-legacy.js',
    'ui/career-card.js',
    'ui/career-share.js',
    'ui/career-rewards.js',
    'ui/career-narrative.js',
    'ui/screens.js',
    'ui/app.js'
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

function main() {
  console.log('Mi Carrera season recap smoke\n');
  const data = loadData();
  const MC = loadMC();
  const engine = MC.createEngine(data);
  MC._lastEngine = engine;

  assert(typeof MC.UI.Narrative.seasonNarrative === 'function', 'narrative helper exists');
  assert(typeof MC.UI.screens.ballonTease === 'function', 'ballon tease scene exists');

  // Play one season and validate recap mirrors CareerState
  let st = engine.createCareer({
    name: 'RecapQA',
    countryId: 'country_ar',
    position: 'MID',
    archetypeId: 'arch_tech_promise',
    seed: 2026
  });
  engine.resolveDecision(st, (st.currentDecision.options || [{ id: 'x' }])[0].id);
  const res = engine.simulateCurrentSeason(st);
  assert(!!res.season, 'season record produced');
  assert(res.season.ratingBefore != null, 'ratingBefore stored');
  assert(res.season.ratingAfter != null, 'ratingAfter stored');
  assert(res.season.appearances >= 0, 'appearances present');

  const html = MC.UI.screens.seasonRecap({
    season: res.season,
    state: st,
    engine: engine
  });
  assert(html.indexOf(String(res.season.appearances)) !== -1, 'recap shows appearances');
  assert(html.indexOf(String(res.season.goals)) !== -1, 'recap shows goals');
  assert(html.indexOf(String(res.season.assists)) !== -1, 'recap shows assists');
  assert(html.indexOf('Momento de la temporada') !== -1, 'recap moment label');
  assert(html.indexOf('after-recap') !== -1, 'recap continues to beat/market loop');
  assert(html.indexOf(res.season.seasonLabel) !== -1, 'recap season label');

  // Fake historical season
  const historic = {
    seasonIndex: 4,
    seasonLabel: '2030/31',
    clubId: st.clubId,
    appearances: 34,
    goals: 22,
    assists: 11,
    performanceGrade: 'S',
    ratingBefore: 84,
    ratingAfter: 89,
    growth: 5,
    formAfter: 9,
    titles: [
      {
        name: 'Liga',
        shortName: 'Liga',
        competitionId: 'comp_liga_profesional_ar',
        importance: 60,
        seasonLabel: '2030/31',
        clubId: st.clubId
      }
    ],
    awards: [
      {
        awardId: 'award_ballon_dor',
        name: 'Balón de Oro',
        importance: 100,
        seasonLabel: '2030/31'
      }
    ],
    arcFlags: { breakout: true },
    moments: []
  };
  const histHtml = MC.UI.screens.seasonRecap({ season: historic, state: st, engine: engine });
  assert(histHtml.indexOf('34') !== -1 && histHtml.indexOf('22') !== -1, 'historic stats rendered');
  assert(histHtml.indexOf('84') !== -1 && histHtml.indexOf('89') !== -1, 'ovr before/after rendered');

  const titleHtml = MC.UI.screens.titleScene(historic.titles[0], engine.getClub(st.clubId), null);
  assert(titleHtml.indexOf('Campeón') !== -1, 'title celebration scene');
  assert(titleHtml.indexOf('fake_title_xyz') === -1, 'no invented title ids');

  const ballonTease = MC.UI.screens.ballonTease(historic.awards[0], 'RecapQA');
  assert(ballonTease.indexOf('nominados') !== -1 || ballonTease.indexOf('Nominados') !== -1, 'ballon tease');
  const ballon = MC.UI.screens.awardScene(historic.awards[0], 'RecapQA');
  assert(ballon.indexOf('Balón de Oro') !== -1, 'ballon award scene');
  assert(ballon.indexOf('cambiar') !== -1, 'ballon career-changing copy');

  // Bad season / empty trophies
  const bad = {
    seasonIndex: 1,
    seasonLabel: '2027/28',
    clubId: st.clubId,
    appearances: 9,
    goals: 0,
    assists: 1,
    performanceGrade: 'D',
    ratingBefore: 68,
    ratingAfter: 66,
    growth: -2,
    formAfter: 2,
    titles: [],
    awards: [],
    arcFlags: { crisis: true },
    moments: []
  };
  const badHtml = MC.UI.screens.seasonRecap({ season: bad, state: st, engine: engine });
  assert(badHtml.indexOf('9') !== -1, 'bad season apps');
  assert(badHtml.indexOf('Campeón de Europa') === -1, 'no invented UCL on bad season');

  // Narrative variants differ by grade
  const nS = MC.UI.Narrative.seasonNarrative({ performanceGrade: 'S', seasonIndex: 1 }, st);
  const nD = MC.UI.Narrative.seasonNarrative({ performanceGrade: 'D', seasonIndex: 1 }, st);
  assert(nS && nD && nS !== nD, 'narrative differs by grade');

  // Queue integrity via App helper
  const app = new MC.UI.App();
  app.engine = engine;
  app.state = st;
  st.moments = [
    {
      id: 'moment_ballon',
      label: 'Balón de Oro',
      seasonIndex: historic.seasonIndex,
      seasonLabel: '2030/31'
    },
    {
      id: 'moment_breakout_x',
      label: 'Breakout',
      seasonIndex: historic.seasonIndex,
      seasonLabel: '2030/31'
    }
  ];
  const queue = app.buildCelebrationQueue(historic);
  assert(queue.some((q) => q.type === 'title'), 'queue includes title');
  assert(queue.some((q) => q.type === 'ballon-tease'), 'queue includes ballon tease');
  assert(queue.filter((q) => q.type === 'award').length >= 1, 'queue includes ballon award');
  assert(queue.filter((q) => q.type === 'moment').length <= 4, 'moments capped at 4');

  // Only real titles from season object appear
  queue
    .filter((q) => q.type === 'title')
    .forEach(function (q) {
      assert(
        historic.titles.some((t) => t.name === q.titleObj.name),
        'queued title exists in season'
      );
    });

  console.log('\nPassed: ' + passed + '  Failed: ' + failed);
  process.exit(failed ? 1 : 0);
}

main();
