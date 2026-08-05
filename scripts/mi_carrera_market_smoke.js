#!/usr/bin/env node
'use strict';

/**
 * Transfer market + loan smoke for Mi Carrera.
 * Run: node scripts/mi_carrera_market_smoke.js
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
  console.log('Mi Carrera market smoke\n');
  const data = loadData();
  const MC = loadMC();
  const engine = MC.createEngine(data);
  MC._lastEngine = engine;

  assert(typeof MC.Rules.buildMarketPacket === 'function', 'buildMarketPacket exists');
  assert(typeof MC.Rules.loanEligible === 'function', 'loanEligible exists');
  assert(typeof MC.Rules.generateLoanOffers === 'function', 'generateLoanOffers exists');

  // Low OVR should not get absurd S-tier flood
  const low = engine.createCareer({
    name: 'LowMkt',
    countryId: 'country_uy',
    position: 'MID',
    archetypeId: 'arch_tech_promise',
    seed: 11
  });
  low.rating = 62;
  low.reputation = 15;
  low.form = 3;
  low.seasonHistory = [
    {
      seasonIndex: 0,
      appearances: 8,
      goals: 0,
      assists: 0,
      performanceGrade: 'D',
      averageRating: 5.8
    }
  ];
  let absurd = 0;
  for (let k = 0; k < 20; k++) {
    const offers = MC.Rules.generateOffers(low, engine.world, new MC.Randomizer(300 + k), 4);
    offers.forEach(function (o) {
      const club = engine.getClub(o.clubId);
      if (club && (club.level || 1) >= 5) absurd += 1;
    });
  }
  assert(absurd === 0, 'low form/OVR never gets level-5 spam (' + absurd + ')');

  // Stay always conceptually available in packet
  const packetCold = MC.Rules.buildMarketPacket(low, engine.world, new MC.Randomizer(99));
  assert(packetCold.canStay === true, 'stay always available');

  // Star season → more market heat
  const star = engine.createCareer({
    name: 'StarMkt',
    countryId: 'country_ar',
    position: 'FWD',
    archetypeId: 'arch_physical',
    seed: 22
  });
  star.rating = 86;
  star.potential = 92;
  star.reputation = 70;
  star.form = 9;
  star.age = 23;
  star.seasonHistory = [
    {
      seasonIndex: 0,
      appearances: 32,
      goals: 18,
      assists: 9,
      performanceGrade: 'S',
      averageRating: 8.4
    }
  ];
  let hotCounts = [];
  for (let s = 0; s < 15; s++) {
    const offers = MC.Rules.generateOffers(star, engine.world, new MC.Randomizer(400 + s), 4);
    hotCounts.push(offers.length);
    offers.forEach(function (o) {
      assert(MC.Rules.isEligibleForClub(star, engine.getClub(o.clubId), engine.world), 'hot offer eligible');
    });
  }
  const avgHot = hotCounts.reduce((a, b) => a + b, 0) / hotCounts.length;
  assert(avgHot >= 1, 'excellent season yields offers on average (' + avgHot.toFixed(2) + ')');

  // Loan eligibility: young + big club + few minutes
  const big = data.clubs
    .filter((c) => (c.level || 1) >= 5)
    .sort((a, b) => b.prestige - a.prestige)[0];
  const loanee = engine.createCareer({
    name: 'LoanKid',
    countryId: 'country_es',
    position: 'MID',
    archetypeId: 'arch_tech_promise',
    seed: 33,
    clubId: big ? big.id : undefined
  });
  loanee.age = 19;
  loanee.rating = 70;
  loanee.potential = 90;
  loanee.seasonHistory = [
    {
      seasonIndex: 0,
      appearances: 9,
      goals: 0,
      assists: 1,
      performanceGrade: 'C',
      averageRating: 6.4
    }
  ];
  assert(MC.Rules.loanEligible(loanee, engine.world), 'young big-club low-minutes is loan eligible');
  const loans = MC.Rules.generateLoanOffers(loanee, engine.world, new MC.Randomizer(55), 2);
  assert(loans.length >= 1, 'loan offers generated when eligible');
  loans.forEach(function (loan) {
    assert(loan.kind === 'loan', 'loan kind flag');
    const c = engine.getClub(loan.clubId);
    assert(c && (c.level || 1) < (big.level || 5), 'loan club lower level than parent');
    assert(loan.role === 'titular', 'loan targets minutes');
  });

  // Veteran starter less loan-prone
  const vet = engine.createCareer({
    name: 'Vet',
    countryId: 'country_ar',
    position: 'DEF',
    archetypeId: 'arch_physical',
    seed: 44
  });
  vet.age = 31;
  vet.rating = 78;
  vet.seasonHistory = [
    {
      seasonIndex: 0,
      appearances: 30,
      goals: 2,
      assists: 1,
      performanceGrade: 'B',
      averageRating: 7.0
    }
  ];
  assert(!MC.Rules.loanEligible(vet, engine.world), 'veteran starter not loan eligible');

  // Apply loan transfer then return
  const loanState = engine.createCareer({
    name: 'LoanFlow',
    countryId: 'country_es',
    position: 'FWD',
    archetypeId: 'arch_physical',
    seed: 66,
    clubId: big.id
  });
  loanState.age = 20;
  loanState.rating = 72;
  loanState.potential = 88;
  loanState.phase = 'decision';
  loanState.seasonHistory = [
    {
      seasonIndex: 0,
      appearances: 7,
      goals: 0,
      assists: 0,
      performanceGrade: 'D',
      averageRating: 6.0
    }
  ];
  const loanOffer = MC.Rules.generateLoanOffers(loanState, engine.world, new MC.Randomizer(77), 1)[0];
  assert(!!loanOffer, 'loan offer for flow');
  loanState.pendingOffers = [loanOffer];
  loanState.currentDecision = {
    id: 'dec_transfer',
    type: 'transferencia',
    options: [
      { id: 'accept_best_prestige', effects: { transferPreference: 'prestige' } },
      { id: 'stay_loyal', effects: { transferPreference: 'stay' } }
    ]
  };
  const parentId = loanState.clubId;
  engine.resolveDecision(loanState, 'accept_best_prestige', loanOffer.id);
  assert(loanState.onLoan === true, 'onLoan after accepting cesión');
  assert(loanState.loanParentClubId === parentId, 'loan parent stored');
  assert(loanState.clubId === loanOffer.clubId, 'moved to loan club');
  assert(loanState.phase === 'simulate', 'ready to simulate loan season');

  const sim = engine.simulateCurrentSeason(loanState);
  assert(!!sim.season, 'loan season simulated');
  assert(loanState.onLoan === false, 'returned from loan after season');
  assert(loanState.clubId === parentId, 'back at parent club');
  assert(Array.isArray(loanState.pendingOffers), 'market packet after loan return');

  // Stay decision has consequences
  const stay = engine.createCareer({
    name: 'Stay',
    countryId: 'country_br',
    position: 'MID',
    archetypeId: 'arch_tech_promise',
    seed: 88
  });
  stay.phase = 'decision';
  stay.pendingOffers = MC.Rules.generateOffers(stay, engine.world, new MC.Randomizer(12), 2);
  stay.currentDecision = {
    id: 'dec_transfer',
    type: 'transferencia',
    options: [
      { id: 'accept_best_prestige', effects: { transferPreference: 'prestige' } },
      { id: 'stay_loyal', effects: { transferPreference: 'stay' } }
    ]
  };
  const relBefore = stay.clubRelation;
  const minsBefore = stay.seasonModifiers.minutesBias || 0;
  engine.resolveDecision(stay, 'stay_loyal', null);
  assert(stay.clubRelation >= relBefore, 'stay improves club relation');
  assert((stay.seasonModifiers.minutesBias || 0) >= minsBefore, 'stay can improve minutes bias');
  assert(stay.phase === 'simulate', 'stay advances to simulate');

  // --- Variety across 100 market packets ---
  const shapes = Object.create(null);
  let withLoan = 0;
  let cold = 0;
  let withTx = 0;
  let blurbs = Object.create(null);
  let clubHits = Object.create(null);
  for (let i = 0; i < 100; i++) {
    const st = engine.createCareer({
      name: 'Var' + i,
      countryId: i % 2 === 0 ? 'country_ar' : 'country_es',
      position: i % 3 === 0 ? 'FWD' : 'MID',
      archetypeId: 'arch_tech_promise',
      seed: 12000 + i
    });
    // Simulate a few seasons to build history
    for (let s = 0; s < 3 && !st.retired; s++) {
      if (st.phase === 'decision') {
        const opt =
          st.currentDecision && st.currentDecision.options && st.currentDecision.options[0]
            ? st.currentDecision.options[0].id
            : 'stay_loyal';
        const useStay =
          st.currentDecision && st.currentDecision.type === 'transferencia'
            ? 'stay_loyal'
            : opt;
        try {
          engine.resolveDecision(st, useStay, null);
        } catch (e) {
          break;
        }
      }
      if (st.phase === 'simulate') {
        try {
          engine.simulateCurrentSeason(st);
        } catch (e) {
          break;
        }
      }
      const pkt = {
        transfers: (st.pendingOffers || []).filter((o) => o.kind !== 'loan'),
        loans: (st.pendingOffers || []).filter((o) => o.kind === 'loan'),
        shape: (st.recentMarketShapes && st.recentMarketShapes[0]) || 'unknown'
      };
      shapes[pkt.shape] = (shapes[pkt.shape] || 0) + 1;
      if (!pkt.transfers.length) cold += 1;
      else withTx += 1;
      if (pkt.loans.length) withLoan += 1;
      (st.pendingOffers || []).forEach(function (o) {
        if (o.blurb) blurbs[o.blurb] = (blurbs[o.blurb] || 0) + 1;
        clubHits[o.clubId] = (clubHits[o.clubId] || 0) + 1;
      });
    }
  }
  const shapeKeys = Object.keys(shapes);
  console.log('  INFO market shapes:', shapeKeys.map((k) => k + '=' + shapes[k]).join(' | '));
  console.log('  INFO cold=' + cold + ' withTx=' + withTx + ' withLoan=' + withLoan);
  assert(shapeKeys.length >= 3, 'market produces >=3 distinct shapes (' + shapeKeys.length + ')');
  assert(cold > 0, 'some cold markets exist');
  assert(withTx > 0, 'some transfer markets exist');
  assert(withLoan > 0, 'some loan markets exist');
  assert(Object.keys(blurbs).length >= 4, 'offer blurbs have variety (' + Object.keys(blurbs).length + ')');
  const topClubShare = Math.max.apply(null, Object.keys(clubHits).map((k) => clubHits[k])) / Math.max(1, Object.keys(clubHits).reduce((a, k) => a + clubHits[k], 0));
  assert(topClubShare < 0.5, 'no single club dominates offers (' + (topClubShare * 100).toFixed(1) + '%)');

  // Same career consecutive seasons should not always share identical shape
  let sameStreak = 0;
  let checked = 0;
  for (let i = 0; i < 20; i++) {
    const st = engine.createCareer({
      name: 'Seq' + i,
      countryId: 'country_br',
      position: 'FWD',
      archetypeId: 'arch_physical',
      seed: 22000 + i
    });
    const seen = [];
    for (let s = 0; s < 4 && !st.retired; s++) {
      if (st.phase === 'decision') {
        try {
          engine.resolveDecision(
            st,
            st.currentDecision && st.currentDecision.type === 'transferencia'
              ? 'stay_loyal'
              : (st.currentDecision.options || [{ id: 'train_balanced' }])[0].id,
            null
          );
        } catch (e) {
          break;
        }
      }
      if (st.phase === 'simulate') {
        try {
          engine.simulateCurrentSeason(st);
        } catch (e) {
          break;
        }
      }
      seen.push((st.recentMarketShapes && st.recentMarketShapes[0]) || 'x');
    }
    for (let j = 1; j < seen.length; j++) {
      checked += 1;
      if (seen[j] === seen[j - 1]) sameStreak += 1;
    }
  }
  const sameRate = checked ? sameStreak / checked : 1;
  console.log('  INFO consecutive identical shape rate=' + (sameRate * 100).toFixed(1) + '%');
  assert(sameRate < 0.72, 'consecutive seasons rarely clone market shape');

  console.log('\nPassed: ' + passed + '  Failed: ' + failed);
  process.exit(failed ? 1 : 0);
}

main();
