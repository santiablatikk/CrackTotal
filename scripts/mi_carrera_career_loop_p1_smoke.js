#!/usr/bin/env node
'use strict';

/**
 * P1 career loop smoke — 500 seeds, diversity + coherence checks.
 * Run: node scripts/mi_carrera_career_loop_p1_smoke.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'assets', 'data', 'mi-carrera');
const JS_ROOT = path.join(ROOT, 'assets', 'js', 'games', 'mi-carrera');
const N = 500;

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

function continentOfClub(world, clubId) {
  const club = world.clubsById[clubId];
  if (!club) return 'unknown';
  return club.continentId || 'unknown';
}

function playCareer(engine, MC, seed, countryId, position, arch) {
  const st = engine.createCareer({
    name: 'P1_' + seed,
    countryId: countryId,
    position: position,
    archetypeId: arch,
    seed: seed
  });

  const issues = [];
  let transfers = 0;
  let loans = 0;
  let stays = 0;
  let coldMarkets = 0;
  let markets = 0;
  let offerSlots = 0;
  let crisis = 0;
  let comeback = 0;
  let titles = 0;
  let awards = 0;
  let ballon = 0;
  let europeSeasons = 0;
  let saSeasons = 0;
  let eventSeasons = 0;
  let quietSeasons = 0;
  let ratingJumps = 0;
  const clubs = new Set([st.clubId]);
  const families = Object.create(null);
  const shapes = [];
  const eventIds = Object.create(null);
  let consecutiveSameFamily = 0;
  let maxSameFamilyRun = 0;
  let lastPrimaryFamily = null;

  let season = 0;
  let prevRating = st.rating;

  while (!st.retired && season < 30) {
    if (st.phase === 'simulate') {
      const result = engine.simulateCurrentSeason(st);
      season += 1;
      const last = st.seasonHistory[st.seasonHistory.length - 1];
      if (last) {
        titles += (last.titles && last.titles.length) || 0;
        awards += (last.awards && last.awards.length) || 0;
        if (last.arcFlags && last.arcFlags.crisis) crisis += 1;
        if (last.arcFlags && last.arcFlags.comeback) comeback += 1;
        if (last.awards) {
          last.awards.forEach(function (a) {
            if (a.awardId === 'award_ballon_dor') ballon += 1;
          });
        }
        const evs = last.events || (last.event ? [last.event] : []);
        const noisy = evs.filter(function (e) {
          return e && e.id && e.id !== 'ev_quiet_season';
        });
        if (noisy.length) {
          eventSeasons += 1;
          noisy.forEach(function (e) {
            if (e && e.id) eventIds[e.id] = (eventIds[e.id] || 0) + 1;
          });
        } else quietSeasons += 1;

        if (Math.abs((last.ratingAfter || st.rating) - (last.ratingBefore || prevRating)) > 4) {
          ratingJumps += 1;
          issues.push('rating_jump_' + season);
        }
        if ((last.events || []).length > 2) {
          issues.push('too_many_events_' + season);
        }
      }
      const cont = continentOfClub(engine.world, st.clubId);
      if (cont === 'continent_eu') europeSeasons += 1;
      if (cont === 'continent_sa') saSeasons += 1;
      prevRating = st.rating;

      // Impossible states
      if (st.rating < 40 || st.rating > 99) issues.push('rating_bounds');
      if (st.form < 1 || st.form > 10) issues.push('form_bounds');
      if (st.age < 16 || st.age > 45) issues.push('age_bounds');
      continue;
    }

    const offers = st.pendingOffers || [];
    markets += 1;
    offerSlots += offers.length;
    const shape = (st.recentMarketShapes && st.recentMarketShapes[0]) || (offers.length ? 'open' : 'cold');
    shapes.push(shape);
    if (!offers.length) coldMarkets += 1;

    offers.forEach(function (o) {
      const fam = o.marketFamily || (o.kind === 'loan' ? 'LOAN' : 'LATERAL');
      families[fam] = (families[fam] || 0) + 1;
      const club = engine.world.clubsById[o.clubId];
      if (!club) issues.push('missing_club_' + o.clubId);
      if (o.kind === 'transfer' && club && st.clubId === o.clubId) issues.push('self_transfer');
      // Absurd: youth decline to giant as titular without form
      if (
        o.marketFamily === 'GIANT' &&
        st.age <= 18 &&
        st.rating < 70 &&
        o.role === 'titular'
      ) {
        issues.push('absurd_giant_youth');
      }
    });

    const primaryFam =
      (offers[0] && (offers[0].marketFamily || (offers[0].kind === 'loan' ? 'LOAN' : 'LATERAL'))) ||
      'NO_OFFER';
    if (primaryFam === lastPrimaryFamily) {
      consecutiveSameFamily += 1;
      maxSameFamilyRun = Math.max(maxSameFamilyRun, consecutiveSameFamily);
    } else {
      consecutiveSameFamily = 1;
      lastPrimaryFamily = primaryFam;
    }

    const dec = st.currentDecision || MC.Decisions.buildFutureDecision(st);
    st.currentDecision = dec;
    if (dec.type === 'retiro') {
      engine.resolveDecision(st, 'retire_no', null);
      continue;
    }

    let didLoan = false;
    let didTx = false;

    // Policy mix: stay / loan / transfer for path diversity
    const policy = season % 5;
    // Rebuild decision against current offers (tests may mutate pendingOffers)
    st.currentDecision = MC.Decisions.buildFutureDecision(st);

    if (policy === 0) {
      engine.resolveDecision(st, 'stay_loyal', null);
      stays += 1;
    } else if (policy === 1 || policy === 2) {
      const loan = offers.filter(function (o) {
        return o.kind === 'loan';
      })[0];
      if (loan && MC.Rules.loanEligible(st, engine.world)) {
        engine.resolveDecision(st, 'accept_best_prestige', loan.id);
        loans += 1;
        didLoan = true;
        clubs.add(st.clubId);
      }
      if (!didLoan && offers.length) {
        const tx = offers.filter(function (o) {
          return o.kind !== 'loan';
        })[0];
        if (tx) {
          const before = st.clubId;
          engine.resolveDecision(st, 'accept_best_prestige', tx.id);
          if (st.clubId !== before) {
            transfers += 1;
            clubs.add(st.clubId);
            didTx = true;
          } else {
            engine.resolveDecision(st, 'stay_loyal', null);
            stays += 1;
          }
        } else {
          engine.resolveDecision(st, 'stay_loyal', null);
          stays += 1;
        }
      } else if (!didLoan) {
        engine.resolveDecision(st, 'stay_loyal', null);
        stays += 1;
      }
    } else {
      const tx = offers.filter(function (o) {
        return o.kind !== 'loan';
      })[0];
      if (tx) {
        const before = st.clubId;
        engine.resolveDecision(st, 'accept_best_prestige', tx.id);
        if (st.clubId !== before) {
          transfers += 1;
          clubs.add(st.clubId);
          didTx = true;
        } else {
          engine.resolveDecision(st, 'stay_loyal', null);
          stays += 1;
        }
      } else if (
        offers.some(function (o) {
          return o.kind === 'loan';
        })
      ) {
        const loan = offers.filter(function (o) {
          return o.kind === 'loan';
        })[0];
        engine.resolveDecision(st, 'accept_best_prestige', loan.id);
        loans += 1;
        didLoan = true;
        clubs.add(st.clubId);
      } else {
        engine.resolveDecision(st, 'stay_loyal', null);
        stays += 1;
      }
    }
    void didTx;
  }

  if (!st.retired) {
    st.age = Math.max(st.age, 33);
    engine.forceRetire(st, 'voluntary');
  }

  const duration = (st.seasonHistory || []).length;
  const reachedEurope = europeSeasons > 0;
  const reachedSA = saSeasons > 0;
  const peak = st.peakRating || st.rating;
  const finalBand = peak >= 88 ? 'legend' : peak >= 80 ? 'star' : peak >= 72 ? 'solid' : 'low';

  // Rich fingerprint — not just offer count
  const fingerprint = [
    transfers === 0 ? 'loyal' : transfers <= 2 ? 'mover' : 'nomad',
    loans ? 'loan' : 'noloan',
    reachedEurope && reachedSA ? 'bridge' : reachedEurope ? 'eu' : reachedSA ? 'sa' : 'other',
    titles ? 'titles' : 'notitle',
    crisis ? 'crisis' : 'stable',
    comeback ? 'comeback' : 'nocome',
    (st.nationalCaps || 0) > 0 ? 'nt' : 'nont',
    ballon ? 'ballon' : 'noballon',
    finalBand,
    clubs.size <= 2 ? 'fewclubs' : clubs.size <= 5 ? 'midclubs' : 'manyclubs',
    duration <= 12 ? 'short' : duration <= 18 ? 'mid' : 'long'
  ].join('|');

  return {
    seed: seed,
    fingerprint: fingerprint,
    duration: duration,
    clubs: clubs.size,
    transfers: transfers,
    loans: loans,
    stays: stays,
    coldMarkets: coldMarkets,
    markets: markets,
    offerSlots: offerSlots,
    crisis: crisis,
    comeback: comeback,
    titles: titles,
    awards: awards,
    ballon: ballon,
    europeSeasons: europeSeasons,
    saSeasons: saSeasons,
    eventSeasons: eventSeasons,
    quietSeasons: quietSeasons,
    ratingJumps: ratingJumps,
    maxSameFamilyRun: maxSameFamilyRun,
    families: families,
    eventIds: eventIds,
    reachedEurope: reachedEurope,
    reachedSA: reachedSA,
    peak: peak,
    retired: !!st.retired,
    issues: issues,
    nationalCaps: st.nationalCaps || 0
  };
}

function share(n, total) {
  return total ? n / total : 0;
}

function main() {
  console.log('Mi Carrera P1 career loop smoke (' + N + ' seeds)\n');
  const data = loadData();
  const MC = loadMC();
  const engine = MC.createEngine(data);

  assert(!!MC.Events.pickSeasonEvents, 'pickSeasonEvents exists');
  assert((data.events || []).length >= 20, 'event pool >=20 (' + (data.events || []).length + ')');

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

  const rows = [];
  const fingerprints = Object.create(null);
  let withTx = 0;
  let withLoan = 0;
  let withStayOnly = 0;
  let withCrisis = 0;
  let withComeback = 0;
  let withTitles = 0;
  let withNT = 0;
  let europe = 0;
  let sa = 0;
  let bridge = 0;
  let ballonCareers = 0;
  let coldTotal = 0;
  let marketTotal = 0;
  let offerTotal = 0;
  let eventSeasonTotal = 0;
  let quietSeasonTotal = 0;
  let issueCareers = 0;
  let ratingJumpCareers = 0;
  let familyHits = Object.create(null);
  let durations = [];
  let loanAcceptSeasons = 0;
  let stayCount = 0;
  let transferCount = 0;

  for (let i = 0; i < N; i++) {
    const seed = 1100000 + i * 17;
    const row = playCareer(
      engine,
      MC,
      seed,
      countries[i % countries.length],
      positions[i % positions.length],
      archs[i % archs.length]
    );
    rows.push(row);
    fingerprints[row.fingerprint] = (fingerprints[row.fingerprint] || 0) + 1;
    durations.push(row.duration);
    if (row.transfers > 0) withTx += 1;
    if (row.loans > 0) withLoan += 1;
    if (row.transfers === 0 && row.loans === 0) withStayOnly += 1;
    if (row.crisis > 0) withCrisis += 1;
    if (row.comeback > 0) withComeback += 1;
    if (row.titles > 0) withTitles += 1;
    if (row.nationalCaps > 0) withNT += 1;
    if (row.reachedEurope) europe += 1;
    if (row.reachedSA) sa += 1;
    if (row.reachedEurope && row.reachedSA) bridge += 1;
    if (row.ballon > 0) ballonCareers += 1;
    coldTotal += row.coldMarkets;
    marketTotal += row.markets;
    offerTotal += row.offerSlots;
    eventSeasonTotal += row.eventSeasons;
    quietSeasonTotal += row.quietSeasons;
    stayCount += row.stays;
    transferCount += row.transfers;
    loanAcceptSeasons += row.loans;
    if (row.issues.length) issueCareers += 1;
    if (row.ratingJumps > 0) ratingJumpCareers += 1;
    Object.keys(row.families).forEach(function (f) {
      familyHits[f] = (familyHits[f] || 0) + row.families[f];
    });
  }

  const fpKeys = Object.keys(fingerprints);
  const topFp = Math.max.apply(
    null,
    fpKeys.map(function (k) {
      return fingerprints[k];
    })
  );
  const topFpShare = share(topFp, N);
  const avgDur =
    durations.reduce(function (a, b) {
      return a + b;
    }, 0) / N;
  const avgOffers = marketTotal ? offerTotal / marketTotal : 0;
  const coldRate = marketTotal ? coldTotal / marketTotal : 0;
  const loanCareerRate = share(withLoan, N);
  const stayDecisionRate = stayCount / Math.max(1, stayCount + transferCount + loanAcceptSeasons);
  const crisisRate = share(withCrisis, N);
  const comebackRate = share(withComeback, N);
  const quietRate = (eventSeasonTotal + quietSeasonTotal)
    ? quietSeasonTotal / (eventSeasonTotal + quietSeasonTotal)
    : 0;

  console.log('\n--- P1 simulation stats ---');
  console.log('  fingerprints=' + fpKeys.length + ' topShare=' + (topFpShare * 100).toFixed(1) + '%');
  console.log(
    '  careers tx=' +
      withTx +
      ' loan=' +
      withLoan +
      ' stayOnly=' +
      withStayOnly +
      ' crisis=' +
      withCrisis +
      ' comeback=' +
      withComeback
  );
  console.log(
    '  europe=' + europe + ' sa=' + sa + ' bridge=' + bridge + ' nt=' + withNT + ' ballon=' + ballonCareers
  );
  console.log(
    '  avgDuration=' +
      avgDur.toFixed(2) +
      ' avgOffers/market=' +
      avgOffers.toFixed(2) +
      ' coldRate=' +
      (coldRate * 100).toFixed(1) +
      '%'
  );
  console.log(
    '  quietSeasonRate=' +
      (quietRate * 100).toFixed(1) +
      '% stayDecisionRate=' +
      (stayDecisionRate * 100).toFixed(1) +
      '%'
  );
  console.log('  market families: ' + JSON.stringify(familyHits));
  console.log('  issueCareers=' + issueCareers + ' ratingJumpCareers=' + ratingJumpCareers);

  // Assertions
  assert(fpKeys.length >= 40, 'unique fingerprints >=40 (' + fpKeys.length + ')');
  assert(topFpShare < 0.35, 'no fingerprint >=35% (' + (topFpShare * 100).toFixed(1) + '%)');
  assert(loanCareerRate >= 0.12, 'loan careers >=12% (' + (loanCareerRate * 100).toFixed(1) + '%)');
  assert(coldRate >= 0.05 && coldRate <= 0.55, 'cold markets in band 5–55% (' + (coldRate * 100).toFixed(1) + '%)');
  assert(avgOffers >= 0.4 && avgOffers <= 3.5, 'avg offers/market sane (' + avgOffers.toFixed(2) + ')');
  assert(stayDecisionRate >= 0.15, 'stay is a real choice (>=15%)');
  assert(europe > N * 0.15 && europe < N * 0.95, 'Europe neither rare-impossible nor universal');
  assert(sa > N * 0.2, 'South America presence (' + sa + ')');
  assert(bridge > 5, 'EU↔SA bridge careers exist (' + bridge + ')');
  assert(crisisRate >= 0.06 && crisisRate <= 0.55, 'crisis rate human (' + (crisisRate * 100).toFixed(1) + '%)');
  assert(comebackRate >= 0.04 && comebackRate <= 0.45, 'comeback rare-ish (' + (comebackRate * 100).toFixed(1) + '%)');
  assert(quietRate >= 0.2, 'quiet seasons exist (>=20%)');
  assert(share(ballonCareers, N) < 0.1, 'Ballon rare (<10%)');
  assert(share(withTitles, N) > 0.12, 'titles appear');
  assert(avgDur >= 8 && avgDur <= 22, 'avg career length sane');
  assert(issueCareers < N * 0.08, 'few impossible-state careers (' + issueCareers + ')');
  assert(ratingJumpCareers < N * 0.12, 'few absurd rating jumps (' + ratingJumpCareers + ')');
  assert((familyHits.LOAN || 0) > 20, 'LOAN family present in market');
  assert(
    Object.keys(familyHits).length >= 5,
    'market family diversity >=5 (' + Object.keys(familyHits).length + ')'
  );

  // Determinism
  const a = playCareer(engine, MC, 777001, 'country_ar', 'FWD', 'arch_tech_promise');
  const b = playCareer(engine, MC, 777001, 'country_ar', 'FWD', 'arch_tech_promise');
  assert(a.fingerprint === b.fingerprint && a.duration === b.duration, 'same seed → same fingerprint');

  // Machine-readable summary for deliverable
  const summary = {
    seeds: N,
    uniqueFingerprints: fpKeys.length,
    topFingerprintShare: topFpShare,
    loanCareerRate: loanCareerRate,
    stayDecisionRate: stayDecisionRate,
    coldRate: coldRate,
    avgOffersPerMarket: avgOffers,
    europeCareers: europe,
    saCareers: sa,
    bridgeCareers: bridge,
    crisisRate: crisisRate,
    comebackRate: comebackRate,
    avgCareerLength: avgDur,
    quietSeasonRate: quietRate,
    ballonRate: share(ballonCareers, N),
    marketFamilies: familyHits
  };
  console.log('\nSUMMARY_JSON ' + JSON.stringify(summary));

  console.log('\nResult: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
}

main();
