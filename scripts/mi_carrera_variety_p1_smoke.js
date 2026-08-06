#!/usr/bin/env node
'use strict';

/**
 * P1.1 variety + balance smoke — 1000 careers.
 * Measures fingerprints, loan_offer_rate vs loan_acceptance_rate, region paths.
 * Run: node scripts/mi_carrera_variety_p1_smoke.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'assets', 'data', 'mi-carrera');
const JS_ROOT = path.join(ROOT, 'assets', 'js', 'games', 'mi-carrera');
const N = 1000;

// P1 baseline (500-seed report) for BEFORE vs AFTER
const BEFORE = {
  fingerprints: 99,
  topShare: 0.216,
  cold: 0.248,
  stay: 0.372,
  crisis: 0.312,
  comeback: 0.084,
  avgLength: 20.1,
  loanCareerInflated: 0.972
};

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

function share(n, total) {
  return total ? n / total : 0;
}

function median(arr) {
  if (!arr.length) return 0;
  const s = arr.slice().sort(function (a, b) {
    return a - b;
  });
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Natural market policy: stay often when attached / few offers;
 * accept transfer/loan probabilistically — does NOT force loans.
 */
function playCareer(engine, MC, seed, countryId, position, arch) {
  const st = engine.createCareer({
    name: 'P11_' + seed,
    countryId: countryId,
    position: position,
    archetypeId: arch,
    seed: seed
  });

  const rng = new MC.Randomizer(seed ^ 0x9e3779b9);
  let transfers = 0;
  let loansAccepted = 0;
  let stays = 0;
  let markets = 0;
  let coldMarkets = 0;
  let marketsWithLoanOffer = 0;
  let marketsWithTxOffer = 0;
  let returnOffers = 0;
  let offerSlots = 0;
  let crisisSeasons = 0;
  let comebackSeasons = 0;
  let consecutiveCrisisMax = 0;
  let consecutiveCrisis = 0;
  let absurdJumps = 0;
  const clubs = new Set([st.clubId]);
  let season = 0;

  while (!st.retired && season < 30) {
    if (st.phase === 'simulate') {
      engine.simulateCurrentSeason(st);
      season += 1;
      const last = st.seasonHistory[st.seasonHistory.length - 1];
      if (last) {
        if (last.arcFlags && last.arcFlags.crisis) {
          crisisSeasons += 1;
          consecutiveCrisis += 1;
          consecutiveCrisisMax = Math.max(consecutiveCrisisMax, consecutiveCrisis);
        } else {
          consecutiveCrisis = 0;
        }
        if (last.arcFlags && last.arcFlags.comeback) comebackSeasons += 1;
        if (Math.abs((last.ratingAfter || 0) - (last.ratingBefore || 0)) > 4) absurdJumps += 1;
      }
      continue;
    }

    const offers = (st.pendingOffers || []).slice();
    markets += 1;
    offerSlots += offers.length;
    if (!offers.length) coldMarkets += 1;
    const hasLoan = offers.some(function (o) {
      return o.kind === 'loan';
    });
    const hasTx = offers.some(function (o) {
      return o.kind !== 'loan';
    });
    if (hasLoan) marketsWithLoanOffer += 1;
    if (hasTx) marketsWithTxOffer += 1;
    offers.forEach(function (o) {
      if (o.marketFamily === 'RETURN') returnOffers += 1;
      const club = engine.world.clubsById[o.clubId];
      const cur = engine.world.clubsById[st.clubId];
      if (club && cur && (club.level || 1) - (cur.level || 1) >= 3 && st.rating < 70 && st.age <= 19) {
        absurdJumps += 1;
      }
    });

    st.currentDecision = MC.Decisions.buildFutureDecision(st);
    if (st.currentDecision.type === 'retiro') {
      engine.resolveDecision(st, 'retire_no', null);
      continue;
    }

    const attach = st.clubAttachment != null ? st.clubAttachment : 22;
    // Natural mix: stay is viable, not automatic
    const stayBias = 0.2 + Math.min(0.32, attach / 220) + Math.min(0.12, (st.stayedStreak || 0) * 0.03);
    const roll = rng.float ? rng.float() : rng.range(0, 1);

    if (!offers.length || roll < stayBias) {
      engine.resolveDecision(st, 'stay_loyal', null);
      stays += 1;
    } else {
      const loans = offers.filter(function (o) {
        return o.kind === 'loan';
      });
      const txs = offers.filter(function (o) {
        return o.kind !== 'loan';
      });
      // Prefer transfer over loan unless young + low minutes situation
      let pick = null;
      if (loans.length && st.age <= 21 && rng.bool(0.35)) pick = loans[0];
      else if (txs.length) pick = rng.pick(txs);
      else if (loans.length && rng.bool(0.4)) pick = loans[0];

      if (pick) {
        const before = st.clubId;
        engine.resolveDecision(st, 'accept_best_prestige', pick.id);
        if (pick.kind === 'loan') {
          loansAccepted += 1;
          clubs.add(st.clubId);
        } else if (st.clubId !== before) {
          transfers += 1;
          clubs.add(st.clubId);
        } else {
          stays += 1;
        }
      } else {
        engine.resolveDecision(st, 'stay_loyal', null);
        stays += 1;
      }
    }
  }

  if (!st.retired) {
    st.age = Math.max(st.age, 33);
    engine.forceRetire(st, 'voluntary');
  }

  const analysis = MC.Rules.analyzeCareer(st, engine.world);
  analysis.transfers = transfers;
  analysis.loansAccepted = loansAccepted;
  analysis.stays = stays;
  analysis.markets = markets;
  analysis.coldMarkets = coldMarkets;
  analysis.marketsWithLoanOffer = marketsWithLoanOffer;
  analysis.marketsWithTxOffer = marketsWithTxOffer;
  analysis.returnOffers = returnOffers;
  analysis.offerSlots = offerSlots;
  analysis.crisisSeasons = crisisSeasons;
  analysis.comebackSeasons = comebackSeasons;
  analysis.consecutiveCrisisMax = consecutiveCrisisMax;
  analysis.absurdJumps = absurdJumps;
  analysis.clubs = clubs.size;
  analysis.seed = seed;
  analysis.nationalCaps = st.nationalCaps || 0;
  analysis.ballon = (st.awards || []).some(function (a) {
    return a.awardId === 'award_ballon_dor';
  });
  return analysis;
}

function main() {
  console.log('Mi Carrera variety P1.1 smoke (' + N + ' seeds)\n');
  const data = loadData();
  const MC = loadMC();
  const engine = MC.createEngine(data);

  assert(typeof MC.Rules.analyzeCareer === 'function', 'analyzeCareer exists');
  assert(typeof MC.Rules.isSignificantBond === 'function', 'isSignificantBond exists');
  assert(typeof MC.Rules.updateClubAttachment === 'function', 'clubAttachment hooks exist');

  const countries = [
    'country_ar',
    'country_br',
    'country_uy',
    'country_es',
    'country_mx',
    'country_co',
    'country_pt',
    'country_fr'
  ];
  const positions = ['FWD', 'MID', 'DEF', 'GK'];
  const archs = ['arch_tech_promise', 'arch_physical', 'arch_tactical', 'arch_media_star'];

  const fingerprints = Object.create(null);
  const archetypes = Object.create(null);
  const regionPaths = Object.create(null);
  const durations = [];
  let withCrisis = 0;
  let withComeback = 0;
  let withLoanAccept = 0;
  let withTransfer = 0;
  let oneClub = 0;
  let journeyman = 0;
  let giantSuccess = 0;
  let giantFail = 0;
  let lateBloom = 0;
  let earlyStar = 0;
  let saOnly = 0;
  let euOnly = 0;
  let saEu = 0;
  let euSa = 0;
  let returnOfferTotal = 0;
  let marketsTotal = 0;
  let loanOfferMarkets = 0;
  let stayDecisions = 0;
  let transferDecisions = 0;
  let loanAcceptDecisions = 0;
  let crisisLoopCareers = 0;
  let absurdCareers = 0;
  let clubsSum = 0;
  let transfersSum = 0;
  let loansSum = 0;

  for (let i = 0; i < N; i++) {
    const seed = 2200000 + i * 31;
    const row = playCareer(
      engine,
      MC,
      seed,
      countries[i % countries.length],
      positions[i % positions.length],
      archs[i % archs.length]
    );
    fingerprints[row.fingerprint] = (fingerprints[row.fingerprint] || 0) + 1;
    archetypes[row.archetype] = (archetypes[row.archetype] || 0) + 1;
    regionPaths[row.regionPath] = (regionPaths[row.regionPath] || 0) + 1;
    durations.push(row.duration);
    clubsSum += row.clubs;
    transfersSum += row.transfers;
    loansSum += row.loansAccepted;
    marketsTotal += row.markets;
    loanOfferMarkets += row.marketsWithLoanOffer;
    returnOfferTotal += row.returnOffers;
    stayDecisions += row.stays;
    transferDecisions += row.transfers;
    loanAcceptDecisions += row.loansAccepted;
    if (row.crisisSeasons > 0) withCrisis += 1;
    if (row.comebackSeasons > 0) withComeback += 1;
    if (row.loansAccepted > 0) withLoanAccept += 1;
    if (row.transfers > 0) withTransfer += 1;
    if (row.uniqueClubs <= 1) oneClub += 1;
    if (row.archetype === 'EUROPEAN_JOURNEYMAN') journeyman += 1;
    if (row.giantOutcome === 'giantSuccess') giantSuccess += 1;
    if (row.giantOutcome === 'giantFail') giantFail += 1;
    if (row.archetype === 'LATE_BLOOMER') lateBloom += 1;
    if (row.archetype === 'WUNDERKIND' || (row.peakAge <= 22 && row.peakRating >= 82)) earlyStar += 1;
    if (row.regionPath === 'SA_ONLY' || row.regionPath === 'SA_MULTIPLE_COUNTRIES') saOnly += 1;
    if (row.regionPath === 'EUROPE_ONLY' || row.regionPath === 'EUROPE_MULTIPLE_COUNTRIES') euOnly += 1;
    if (row.regionPath === 'SA_EUROPE' || row.regionPath === 'SA_EUROPE_RETURN_SA') saEu += 1;
    if (row.regionPath === 'EUROPE_RETURN_SA') euSa += 1;
    if (row.consecutiveCrisisMax >= 3) crisisLoopCareers += 1;
    if (row.absurdJumps > 2) absurdCareers += 1;
  }

  const fpKeys = Object.keys(fingerprints);
  const topFp = Math.max.apply(
    null,
    fpKeys.map(function (k) {
      return fingerprints[k];
    })
  );
  const topFpShare = share(topFp, N);
  const archKeys = Object.keys(archetypes);
  const topArch = Math.max.apply(
    null,
    archKeys.map(function (k) {
      return archetypes[k];
    })
  );
  const topArchShare = share(topArch, N);
  const avgDur =
    durations.reduce(function (a, b) {
      return a + b;
    }, 0) / N;
  const medDur = median(durations);
  const loanOfferRate = share(loanOfferMarkets, marketsTotal);
  const loanAcceptRate = share(loanAcceptDecisions, marketsTotal);
  const stayRate = share(stayDecisions, stayDecisions + transferDecisions + loanAcceptDecisions);
  const transferRate = share(transferDecisions, stayDecisions + transferDecisions + loanAcceptDecisions);
  const crisisRate = share(withCrisis, N);
  const comebackRate = share(withComeback, N);
  const returnPerMarket = marketsTotal ? returnOfferTotal / marketsTotal : 0;

  console.log('\n--- BEFORE (P1 / 500) vs AFTER (P1.1 / 1000) ---');
  console.log(
    '  fingerprints: ' + BEFORE.fingerprints + ' (500) → ' + fpKeys.length + ' (1000) | topShare ' +
      (BEFORE.topShare * 100).toFixed(1) +
      '% → ' +
      (topFpShare * 100).toFixed(1) +
      '%'
  );
  console.log(
    '  stay: ' +
      (BEFORE.stay * 100).toFixed(1) +
      '% → ' +
      (stayRate * 100).toFixed(1) +
      '% | crisis ' +
      (BEFORE.crisis * 100).toFixed(1) +
      '% → ' +
      (crisisRate * 100).toFixed(1) +
      '% | comeback ' +
      (BEFORE.comeback * 100).toFixed(1) +
      '% → ' +
      (comebackRate * 100).toFixed(1) +
      '%'
  );
  console.log(
    '  avgLength: ' +
      BEFORE.avgLength +
      ' → ' +
      avgDur.toFixed(2) +
      ' (median ' +
      medDur.toFixed(1) +
      ')'
  );
  console.log(
    '  loan: inflatedAccept ' +
      (BEFORE.loanCareerInflated * 100).toFixed(0) +
      '% → offerRate ' +
      (loanOfferRate * 100).toFixed(1) +
      '% / acceptRate ' +
      (loanAcceptRate * 100).toFixed(1) +
      '% / careersWithLoan ' +
      (share(withLoanAccept, N) * 100).toFixed(1) +
      '%'
  );

  console.log('\n--- Distribution ---');
  console.log('  regionPaths:', JSON.stringify(regionPaths));
  console.log('  top archetypes:');
  archKeys
    .sort(function (a, b) {
      return archetypes[b] - archetypes[a];
    })
    .slice(0, 8)
    .forEach(function (k) {
      console.log('    ' + k + ': ' + archetypes[k] + ' (' + (share(archetypes[k], N) * 100).toFixed(1) + '%)');
    });
  console.log(
    '  oneClub=' +
      oneClub +
      ' journeyman=' +
      journeyman +
      ' giantOK=' +
      giantSuccess +
      ' giantFail=' +
      giantFail +
      ' lateBloom=' +
      lateBloom +
      ' early=' +
      earlyStar
  );
  console.log(
    '  SA_only=' +
      saOnly +
      ' EU_only=' +
      euOnly +
      ' SA→EU=' +
      saEu +
      ' EU→SA=' +
      euSa +
      ' avgClubs=' +
      (clubsSum / N).toFixed(2) +
      ' avgTx=' +
      (transfersSum / N).toFixed(2) +
      ' avgLoans=' +
      (loansSum / N).toFixed(2)
  );
  console.log(
    '  returnOffers/market=' +
      returnPerMarket.toFixed(3) +
      ' crisisLoops=' +
      crisisLoopCareers +
      ' absurd=' +
      absurdCareers
  );

  const summary = {
    seeds: N,
    uniqueFingerprints: fpKeys.length,
    topFingerprintShare: topFpShare,
    topArchetypeShare: topArchShare,
    avgCareerLength: avgDur,
    medianCareerLength: medDur,
    stayRate: stayRate,
    transferRate: transferRate,
    loanOfferRate: loanOfferRate,
    loanAcceptanceRate: loanAcceptRate,
    loanCareerRate: share(withLoanAccept, N),
    crisisRate: crisisRate,
    comebackRate: comebackRate,
    saOnly: saOnly,
    europeOnly: euOnly,
    saToEurope: saEu,
    europeToSa: euSa,
    oneClub: oneClub,
    journeyman: journeyman,
    giantSuccess: giantSuccess,
    giantFailure: giantFail,
    lateBloomers: lateBloom,
    earlyStars: earlyStar,
    avgTransfers: transfersSum / N,
    avgLoans: loansSum / N,
    avgClubs: clubsSum / N,
    returnPerMarket: returnPerMarket,
    regionPaths: regionPaths,
    archetypes: archetypes
  };
  console.log('\nSUMMARY_JSON ' + JSON.stringify(summary));

  // Targets
  assert(fpKeys.length >= 300, 'unique fingerprints >=300 (' + fpKeys.length + ')');
  assert(topFpShare <= 0.07, 'top fingerprint <=7% (' + (topFpShare * 100).toFixed(1) + '%)');
  assert(topArchShare <= 0.25, 'no archetype >25% (' + (topArchShare * 100).toFixed(1) + '%)');
  assert(oneClub > 20 && oneClub < N * 0.4, 'one-club exists but not dominant (' + oneClub + ')');
  assert(journeyman > 5 && journeyman < N * 0.4, 'journeyman exists but not dominant (' + journeyman + ')');
  assert(loanOfferRate >= 0.025 && loanOfferRate <= 0.35, 'loan offer rate natural (' + (loanOfferRate * 100).toFixed(1) + '%)');
  assert(share(withLoanAccept, N) < 0.55, 'loan careers not dominant (' + (share(withLoanAccept, N) * 100).toFixed(1) + '%)');
  assert(stayRate >= 0.25 && stayRate <= 0.82, 'stay is real but not automatic (' + (stayRate * 100).toFixed(1) + '%)');
  assert(saOnly > 40, 'SA-only careers exist (' + saOnly + ')');
  assert(euOnly > 20 && euOnly < N * 0.7, 'Europe not universal');
  assert(saEu > 20, 'SA→Europe paths exist');
  assert(crisisRate >= 0.05 && crisisRate <= 0.45, 'crisis human (' + (crisisRate * 100).toFixed(1) + '%)');
  assert(comebackRate >= 0.03 && comebackRate <= 0.25, 'comeback rare (' + (comebackRate * 100).toFixed(1) + '%)');
  assert(crisisLoopCareers < N * 0.08, 'few crisis loops (' + crisisLoopCareers + ')');
  assert(returnPerMarket < 0.25, 'RETURN not saturated (' + returnPerMarket.toFixed(3) + ')');
  assert(absurdCareers < N * 0.1, 'few absurd jump careers');
  assert(giantFail + giantSuccess > 8, 'giant outcomes exist (' + giantSuccess + '/' + giantFail + ')');

  // Determinism
  const a = playCareer(engine, MC, 880011, 'country_ar', 'MID', 'arch_tech_promise');
  const b = playCareer(engine, MC, 880011, 'country_ar', 'MID', 'arch_tech_promise');
  assert(a.fingerprint === b.fingerprint, 'same seed → same fingerprint');

  console.log('\nResult: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
}

main();
