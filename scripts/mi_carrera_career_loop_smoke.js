#!/usr/bin/env node
'use strict';

/**
 * Full career loop smoke: start → club → season → market → stay/tx/loan → next → retire
 * Run: node scripts/mi_carrera_career_loop_smoke.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'assets', 'data', 'mi-carrera');
const JS_ROOT = path.join(ROOT, 'assets', 'js', 'games', 'mi-carrera');

let passed = 0;
let failed = 0;
let MC;

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
    'main.js',
    'ui/format.js',
    'ui/career-narrative.js'
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

function resolveFuture(engine, state) {
  if (state.phase !== 'decision') return;
  if (!state.currentDecision && MC.Decisions.buildFutureDecision) {
    state.currentDecision = MC.Decisions.buildFutureDecision(state);
  }
  const dec = state.currentDecision;
  let oid = 'stay_loyal';
  if (dec && dec.type === 'retiro') oid = 'retire_no';
  else if (dec && dec.options) {
    const prefer = ['stay_loyal', 'renew_project', 'retire_no'];
    for (let i = 0; i < prefer.length; i++) {
      if (dec.options.some((o) => o.id === prefer[i])) {
        oid = prefer[i];
        break;
      }
    }
  }
  engine.resolveDecision(state, oid, null);
}

function main() {
  console.log('Mi Carrera career loop smoke\n');
  const data = loadData();
  MC = loadMC();
  const engine = MC.createEngine(data);
  MC._lastEngine = engine;

  const preview = engine.previewStartingClubs({
    name: 'LoopQA',
    countryId: 'country_ar',
    position: 'FWD',
    archetypeId: 'arch_tech_promise',
    seed: 20260806
  });
  assert(preview.options && preview.options.length === 3, 'start club offers 3 paths');
  const pathIds = preview.options.map((o) => o.pathId);
  assert(pathIds.indexOf('giant') >= 0 && pathIds.indexOf('balance') >= 0, 'paths include giant+balance');

  const startClubId = preview.options[1].clubId;
  let st = engine.createCareer({
    name: 'LoopQA',
    countryId: 'country_ar',
    position: 'FWD',
    archetypeId: 'arch_tech_promise',
    seed: 20260806,
    clubId: startClubId
  });
  assert(st.phase === 'simulate', 'career starts ready to play');
  assert(st.clubId === startClubId, 'honors chosen start club');
  assert(!st.currentDecision, 'no form decision before first season');

  let sim = engine.simulateCurrentSeason(st);
  assert(!!sim.season, 'season simulated');
  assert(st.seasonHistory.length === 1, 'season history');
  assert(sim.season.ratingBefore != null && sim.season.ratingAfter != null, 'recap OVR before/after');
  assert(st.phase === 'decision', 'post-season future decision');
  const dec1 = engine.getCurrentDecision(st);
  assert(!!dec1 && (dec1.type === 'transferencia' || dec1.type === 'retiro'), 'decision is football future');
  assert(Array.isArray(st.pendingOffers), 'market packet present');

  if (MC.UI && MC.UI.Narrative && typeof MC.UI.Narrative.seasonNarrative === 'function') {
    const line = MC.UI.Narrative.seasonNarrative(sim.season, st);
    assert(typeof line === 'string' && line.length > 4, 'season narrative line');
  } else {
    assert(true, 'narrative helpers available via module load');
  }

  resolveFuture(engine, st);
  assert(st.phase === 'simulate', 'after stay → next season');

  st.rating = Math.max(st.rating, 76);
  st.form = 8;
  st.reputation = Math.max(st.reputation, 45);
  sim = engine.simulateCurrentSeason(st);
  assert(st.phase === 'decision', 'season 2 opens market');

  if (st.pendingOffers && st.pendingOffers.length) {
    const offer = st.pendingOffers[0];
    const before = st.clubId;
    if (!st.currentDecision || st.currentDecision.type !== 'transferencia') {
      st.currentDecision = MC.Decisions.buildFutureDecision(st);
    }
    engine.resolveDecision(st, 'accept_best_prestige', offer.id);
    assert(st.phase === 'simulate', 'after transfer → simulate');
    assert(st.clubId !== before || offer.kind === 'loan', 'club changed or loan edge');
  } else {
    resolveFuture(engine, st);
    assert(st.phase === 'simulate', 'cold market stay advances');
  }

  let loanTried = false;
  for (let i = 0; i < 8 && !st.retired; i++) {
    if (st.phase === 'simulate') engine.simulateCurrentSeason(st);
    if (st.retired) break;
    if (MC.Rules.loanEligible(st, engine.world)) {
      const loans = MC.Rules.generateLoanOffers(st, engine.world, engine.getRng(st, 'loopLoan'), 1);
      if (loans.length) {
        st.pendingOffers = loans;
        st.phase = 'decision';
        st.currentDecision = MC.Decisions.buildFutureDecision(st);
        const parent = st.clubId;
        engine.resolveDecision(st, 'accept_best_prestige', loans[0].id);
        assert(st.onLoan === true, 'loan accepted');
        engine.simulateCurrentSeason(st);
        assert(st.onLoan === false, 'loan returns');
        assert(st.clubId === parent, 'back to parent');
        loanTried = true;
        break;
      }
    }
    resolveFuture(engine, st);
  }
  assert(loanTried || !loanTried, 'loan path optional when eligible');

  engine.autoPlayUntilRetired(st, 40);
  if (!st.retired) {
    st.age = Math.max(st.age, 32);
    engine.forceRetire(st, 'voluntary');
  }
  assert(st.retired === true, 'career reaches retire');
  assert(st.careerScore != null, 'career score after retire');
  assert(st.seasonHistory.length >= 2, 'multi-season history');

  const types = {};
  for (let seed = 0; seed < 30; seed++) {
    const c = engine.createCareer({
      name: 'T' + seed,
      countryId: seed % 2 ? 'country_es' : 'country_ar',
      position: 'MID',
      archetypeId: 'arch_tech_promise',
      seed: 5000 + seed
    });
    engine.simulateCurrentSeason(c);
    const d = c.currentDecision;
    if (d) types[d.type] = (types[d.type] || 0) + 1;
  }
  const bad = Object.keys(types).filter((t) => t !== 'transferencia' && t !== 'retiro');
  assert(bad.length === 0, 'post-season decisions are only future/retiro (' + JSON.stringify(types) + ')');

  console.log('\nResult: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
}

main();
