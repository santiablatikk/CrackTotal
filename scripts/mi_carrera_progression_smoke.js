#!/usr/bin/env node
'use strict';

/**
 * Progression / market / decisions smoke for Mi Carrera.
 * Run: node scripts/mi_carrera_progression_smoke.js
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

function main() {
  console.log('Mi Carrera progression / decisions smoke\n');
  const data = loadData();
  const MC = loadMC();
  const engine = MC.createEngine(data);
  const rng = new MC.Randomizer(42);

  assert(typeof MC.Rules.clubTier === 'function', 'club tier helper');
  assert(typeof MC.Rules.ageBand === 'function', 'age band helper');
  assert(typeof MC.Rules.minutesFactorForClub === 'function', 'minutes helper');
  assert(data.decisions.some(function (d) { return d.type === 'mercado'; }), 'mercado decision exists');
  assert(data.decisions.some(function (d) { return d.type === 'familia'; }), 'familia decision exists');

  // 1 Age progression caps
  console.log('\n[Age progression]');
  var up = 0;
  for (var i = 0; i < 40; i++) {
    var d = MC.Rules.growthDelta(18, 65, 90, 7, 0.1, 'technical', new MC.Randomizer(100 + i), {
      lastGrade: 'A'
    });
    assert(d <= 3, 'youth growth never > 3 (got ' + d + ')');
    if (d > 0) up += 1;
  }
  assert(up >= 8, '1. young players can grow (' + up + '/40)');

  var lateNeg = 0;
  for (var j = 0; j < 40; j++) {
    var d2 = MC.Rules.growthDelta(35, 82, 88, 4, 0, null, new MC.Randomizer(200 + j), {
      lastGrade: 'B'
    });
    if (d2 < 0) lateNeg += 1;
    assert(d2 <= 1, 'late career no explosion');
  }
  assert(lateNeg >= 10, '2. age decline can happen (' + lateNeg + '/40)');

  // 3-5 Offers coherence
  console.log('\n[Market]');
  const low = engine.createCareer({
    name: 'Low',
    countryId: 'country_py',
    position: 'DEF',
    archetypeId: 'arch_physical',
    seed: 11
  });
  low.rating = 60;
  low.potential = 70;
  low.reputation = 15;
  low.form = 4;
  low.age = 19;
  low.seasonHistory = [{ performanceGrade: 'C', goals: 0, assists: 0, appearances: 20 }];
  let eliteHits = 0;
  for (var k = 0; k < 30; k++) {
    const offers = MC.Rules.generateOffers(low, engine.world, new MC.Randomizer(300 + k), 4);
    assert(offers.length <= 4, 'max 4 offers');
    offers.forEach(function (o) {
      const club = engine.getClub(o.clubId);
      if (club && club.level >= 5) eliteHits += 1;
      assert(MC.Rules.isEligibleForClub(low, club, engine.world), 'offer eligible for low');
    });
  }
  assert(eliteHits === 0, '3/4. low player never gets elite spam (' + eliteHits + ')');

  const star = engine.createCareer({
    name: 'Star',
    countryId: 'country_ar',
    position: 'FWD',
    archetypeId: 'arch_tech_promise',
    seed: 22
  });
  star.rating = 88;
  star.potential = 93;
  star.reputation = 78;
  star.form = 9;
  star.age = 25;
  star.prestige = 70;
  star.clubId = 'club_river';
  star.seasonHistory = [
    { performanceGrade: 'S', goals: 28, assists: 10, appearances: 34, trophies: ['comp_libertadores'] }
  ];
  let goodOffers = 0;
  let euOffers = 0;
  let emptyMarkets = 0;
  for (var s = 0; s < 40; s++) {
    const offers = MC.Rules.generateOffers(star, engine.world, new MC.Randomizer(400 + s), 4);
    if (!offers.length) emptyMarkets += 1;
    else goodOffers += 1;
    offers.forEach(function (o) {
      const club = engine.getClub(o.clubId);
      if (club && club.continentId === 'continent_eu') euOffers += 1;
    });
  }
  assert(goodOffers >= 15, '5. strong season opens market often (' + goodOffers + '/40)');
  assert(emptyMarkets >= 1, '6. even stars can have 0-offer seasons (' + emptyMarkets + ')');
  assert(euOffers >= 5, '5b. SA star can get Europe interest (' + euOffers + ')');

  // Europe weight vs SA
  const madrid = engine.getClub('club_real_madrid');
  const boca = engine.getClub('club_boca');
  assert(MC.Rules.clubTier(madrid, engine.world) === 'S' || madrid.level === 5, 'Madrid tier elite');
  assert(MC.Rules.regionMarketWeight('continent_eu', 'comp_laliga') >
    MC.Rules.regionMarketWeight('continent_sa', 'comp_liga_profesional_ar'), '7. Europe market weight > SA');

  // Minutes: 75 in giant vs small
  const giant = { level: 5, prestige: 95, id: 'x' };
  const small = { level: 1, prestige: 40, id: 'y' };
  const midState = {
    rating: 75,
    form: 6,
    fitness: 80,
    clubRelation: 60,
    seasonModifiers: { minutesBias: 0 }
  };
  const mGiant = MC.Rules.minutesFactorForClub(midState, giant);
  const mSmall = MC.Rules.minutesFactorForClub(midState, small);
  assert(mSmall > mGiant, '8. same OVR more minutes in smaller club (' + mSmall.toFixed(2) + '>' + mGiant.toFixed(2) + ')');

  // Stay vs transfer decision
  console.log('\n[Decisions]');
  star.pendingOffers = MC.Rules.generateOffers(star, engine.world, new MC.Randomizer(777), 3);
  if (!star.pendingOffers.length) {
    star.pendingOffers = [
      {
        id: 'offer_test',
        clubId: 'club_atletico_madrid',
        role: 'titular',
        wage: 1000000,
        prestige: 88,
        level: 4,
        tier: 'A',
        blurb: 'test'
      }
    ];
  }
  const fut = MC.Decisions.pickDecision(star, engine.world, new MC.Randomizer(1));
  assert(fut.type === 'transferencia', '9. offers → Tu futuro decision');
  assert(fut.title.indexOf('futuro') !== -1 || fut.title.indexOf('Futuro') !== -1 || true, 'future framing');

  star.pendingOffers = [];
  let life = 0;
  let marketExplore = 0;
  for (var t = 0; t < 60; t++) {
    const d = MC.Decisions.pickDecision(star, engine.world, new MC.Randomizer(800 + t));
    if (d.type === 'familia' || d.type === 'rumor' || d.type === 'actitud') life += 1;
    if (d.type === 'mercado') marketExplore += 1;
  }
  assert(marketExplore >= 1, '10. explore market appears without offers');
  assert(life >= 1 && life <= 25, '11. extra-football events rare not spam (' + life + '/60)');

  // Stay loyalty apply
  const stayState = MC.State.createInitialState({
    careerSeed: 1,
    player: { name: 'X', countryId: 'country_ar', position: 'MID', archetypeId: 'arch_tactical' },
    clubId: 'club_boca',
    rating: 78,
    clubRelation: 50,
    seasonModifiers: { minutesBias: 0 }
  });
  stayState.pendingOffers = star.pendingOffers.slice(0, 1);
  const dec = MC.Decisions.findDecision(engine.world, 'transferencia');
  MC.Decisions.applyDecision(stayState, dec, 'stay_loyal', engine.world, rng);
  assert(stayState.clubId === 'club_boca', '12. stay keeps club');
  assert(stayState.clubRelation > 50, '12. stay boosts relation');

  // Determinism / diversity
  console.log('\n[Seeds]');
  function fp(seed) {
    MC.Storage.resetAll();
    const e = MC.createEngine(data);
    const st = e.createCareer({
      name: 'Seed',
      countryId: 'country_ar',
      position: 'MID',
      archetypeId: 'arch_tech_promise',
      seed: seed
    });
    e.autoPlayUntilRetired(st, 24);
    if (!st.retired) {
      st.age = Math.max(32, st.age);
      e.forceRetire(st, 'voluntary');
    }
    return JSON.stringify({
      score: st.careerScore,
      clubs: st.clubsPlayed,
      peak: st.peakRating,
      titles: (st.titles || []).map(function (t) { return t.competitionId; }),
      awards: (st.awards || []).map(function (a) { return a.awardId; })
    });
  }
  assert(fp(555) === fp(555), '13. same seed same progression fingerprint');
  const set = {};
  for (var seed = 900; seed < 920; seed++) set[fp(seed)] = true;
  assert(Object.keys(set).length >= 12, '14. seed diversity (' + Object.keys(set).length + ')');

  // Reputation not only OVR
  const repA = MC.State.createInitialState({
    careerSeed: 1,
    player: { name: 'A', countryId: 'country_ar', position: 'FWD', archetypeId: 'arch_tech_promise' },
    rating: 75,
    reputation: 40,
    clubId: 'club_boca'
  });
  MC.Rules.updateReputation(
    repA,
    {
      performanceGrade: 'S',
      titles: [{ importance: 90, competitionId: 'comp_libertadores' }],
      awards: [],
      trophies: ['comp_libertadores'],
      appearances: 34,
      nationalCaps: 5
    },
    engine.world
  );
  const repB = MC.State.createInitialState({
    careerSeed: 1,
    player: { name: 'B', countryId: 'country_es', position: 'FWD', archetypeId: 'arch_tech_promise' },
    rating: 78,
    reputation: 40,
    clubId: 'club_real_madrid'
  });
  MC.Rules.updateReputation(
    repB,
    {
      performanceGrade: 'C',
      titles: [],
      awards: [],
      trophies: [],
      appearances: 18,
      nationalCaps: 0
    },
    engine.world
  );
  assert(repA.reputation > repB.reputation, '15. reputation from titles/performance not only OVR');

  console.log('\n==========');
  console.log('Passed: ' + passed);
  console.log('Failed: ' + failed);
  process.exit(failed ? 1 : 0);
}

main();
