#!/usr/bin/env node
'use strict';

/**
 * Career variety smoke — 200 seeds, distribution analysis.
 * Fails if trajectories cluster too hard (~70% same shape).
 * Run: node scripts/mi_carrera_variety_smoke.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'assets', 'data', 'mi-carrera');
const JS_ROOT = path.join(ROOT, 'assets', 'js', 'games', 'mi-carrera');
const N = 200;

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

function continentOfClub(world, clubId) {
  const club = world.clubsById[clubId];
  if (!club) return 'unknown';
  const country = world.countriesById[club.countryId];
  return (country && country.continentId) || 'unknown';
}

function isEurope(cont) {
  return cont === 'continent_eu';
}

function isSouthAmerica(cont) {
  return cont === 'continent_sa';
}

function playCareer(engine, MC, seed, countryId, position, arch) {
  const st = engine.createCareer({
    name: 'V' + seed,
    countryId: countryId,
    position: position,
    archetypeId: arch,
    seed: seed
  });
  const startClub = st.clubId;
  const startCont = continentOfClub(engine.world, startClub);
  let transfers = 0;
  let loans = 0;
  let stays = 0;
  let coldMarkets = 0;
  let hotMarkets = 0;
  let titles = 0;
  let awards = 0;
  let crisis = 0;
  let comeback = 0;
  let ntCaps = 0;
  let europeSeasons = 0;
  let saSeasons = 0;
  let ballon = 0;
  const clubs = new Set([startClub]);
  const shapes = [];

  // Mix accept transfer every few seasons for path diversity in analysis
  let season = 0;
  while (!st.retired && season < 28) {
    if (st.phase === 'simulate') {
      engine.simulateCurrentSeason(st);
      season += 1;
      const last = st.seasonHistory[st.seasonHistory.length - 1];
      if (last) {
        titles += (last.titles && last.titles.length) || 0;
        awards += (last.awards && last.awards.length) || 0;
        if (last.arcFlags && last.arcFlags.crisis) crisis += 1;
        if (last.arcFlags && last.arcFlags.comeback) comeback += 1;
      }
      const cont = continentOfClub(engine.world, st.clubId);
      if (isEurope(cont)) europeSeasons += 1;
      if (isSouthAmerica(cont)) saSeasons += 1;
      continue;
    }

    const offers = st.pendingOffers || [];
    const shape = (st.recentMarketShapes && st.recentMarketShapes[0]) || (offers.length ? 'open' : 'cold');
    shapes.push(shape);
    if (!offers.length) coldMarkets += 1;
    else hotMarkets += 1;

    const dec = st.currentDecision || MC.Decisions.buildFutureDecision(st);
    st.currentDecision = dec;
    if (dec.type === 'retiro') {
      engine.resolveDecision(st, 'retire_no', null);
      continue;
    }

    let didLoan = false;
    let didTx = false;
    if (MC.Rules.loanEligible(st, engine.world) && season % 3 === 1) {
      const forcedLoans = MC.Rules.generateLoanOffers(st, engine.world, engine.getRng(st, 'varLoan'), 1);
      if (forcedLoans.length) {
        st.pendingOffers = forcedLoans.concat(offers.filter((o) => o.kind !== 'loan'));
        st.currentDecision = MC.Decisions.buildFutureDecision(st);
        engine.resolveDecision(st, 'accept_best_prestige', forcedLoans[0].id);
        loans += 1;
        didLoan = true;
      }
    }
    if (!didLoan && offers.length && season % 4 === 2) {
      st.currentDecision = MC.Decisions.buildFutureDecision(st);
      const loan = offers.filter((o) => o.kind === 'loan')[0];
      const tx = offers.filter((o) => o.kind !== 'loan')[0] || offers[0];
      if (loan && season % 8 === 2) {
        engine.resolveDecision(st, 'accept_best_prestige', loan.id);
        loans += 1;
        didLoan = true;
      } else if (tx) {
        const before = st.clubId;
        engine.resolveDecision(st, 'accept_best_prestige', tx.id);
        if (st.clubId !== before) {
          transfers += 1;
          clubs.add(st.clubId);
          didTx = true;
        }
      }
    }
    if (!didLoan && !didTx) {
      st.currentDecision = MC.Decisions.buildFutureDecision(st);
      engine.resolveDecision(st, 'stay_loyal', null);
      stays += 1;
    }
  }

  if (!st.retired) {
    st.age = Math.max(st.age, 32);
    engine.forceRetire(st, 'voluntary');
  }

  ntCaps = st.nationalCaps || 0;
  ballon = MC.Awards && MC.Awards.countAwards
    ? MC.Awards.countAwards(st, 'award_ballon_dor') > 0
      ? 1
      : 0
    : 0;

  const reachedEurope = europeSeasons > 0 || [...clubs].some(function (id) {
    return isEurope(continentOfClub(engine.world, id));
  });
  const stayedSA =
    !reachedEurope &&
    (isSouthAmerica(startCont) ||
      countryId === 'country_ar' ||
      countryId === 'country_br' ||
      countryId === 'country_uy');

  // Trajectory fingerprint (coarse story shape)
  const story =
    (transfers === 0 ? 'loyal' : transfers <= 2 ? 'mover' : 'nomad') +
    '|' +
    (loans ? 'loan' : 'noloan') +
    '|' +
    (reachedEurope ? 'eu' : 'sa') +
    '|' +
    (titles ? 'titles' : 'notitle') +
    '|' +
    (crisis ? 'crisis' : 'stable') +
    '|' +
    (comeback ? 'comeback' : 'nocome') +
    '|' +
    (ntCaps ? 'nt' : 'nont');

  return {
    seed: seed,
    startClub: startClub,
    clubs: clubs.size,
    transfers: transfers,
    loans: loans,
    stays: stays,
    coldMarkets: coldMarkets,
    hotMarkets: hotMarkets,
    titles: titles,
    awards: awards,
    crisis: crisis,
    comeback: comeback,
    ntCaps: ntCaps,
    reachedEurope: reachedEurope,
    stayedSA: !!stayedSA,
    duration: (st.seasonHistory || []).length,
    ballon: ballon,
    story: story,
    retired: !!st.retired,
    peak: st.peakRating || st.rating
  };
}

function share(n, total) {
  return total ? n / total : 0;
}

function main() {
  console.log('Mi Carrera variety smoke (' + N + ' seeds)\n');
  const data = loadData();
  const MC = loadMC();
  const engine = MC.createEngine(data);

  const countries = ['country_ar', 'country_br', 'country_uy', 'country_es', 'country_mx', 'country_co'];
  const positions = ['FWD', 'MID', 'DEF', 'GK'];
  const archs = ['arch_tech_promise', 'arch_physical', 'arch_tactical', 'arch_media_star'];

  const rows = [];
  const stories = Object.create(null);
  const startClubs = Object.create(null);
  let withTx = 0;
  let withLoan = 0;
  let withCrisis = 0;
  let withComeback = 0;
  let withTitles = 0;
  let withNT = 0;
  let europe = 0;
  let saPath = 0;
  let ballon = 0;
  let durations = [];

  for (let i = 0; i < N; i++) {
    const seed = 900000 + i;
    const row = playCareer(
      engine,
      MC,
      seed,
      countries[i % countries.length],
      positions[i % positions.length],
      archs[i % archs.length]
    );
    rows.push(row);
    stories[row.story] = (stories[row.story] || 0) + 1;
    startClubs[row.startClub] = (startClubs[row.startClub] || 0) + 1;
    if (row.transfers > 0) withTx += 1;
    if (row.loans > 0) withLoan += 1;
    if (row.crisis > 0) withCrisis += 1;
    if (row.comeback > 0) withComeback += 1;
    if (row.titles > 0) withTitles += 1;
    if (row.ntCaps > 0) withNT += 1;
    if (row.reachedEurope) europe += 1;
    if (row.stayedSA) saPath += 1;
    if (row.ballon > 0) ballon += 1;
    durations.push(row.duration);
  }

  const storyKeys = Object.keys(stories);
  const topStoryCount = Math.max.apply(
    null,
    storyKeys.map(function (k) {
      return stories[k];
    })
  );
  const topStoryShare = share(topStoryCount, N);
  const startClubKeys = Object.keys(startClubs);
  const topStart = Math.max.apply(
    null,
    startClubKeys.map(function (k) {
      return startClubs[k];
    })
  );

  console.log('  INFO stories=' + storyKeys.length + ' topShare=' + (topStoryShare * 100).toFixed(1) + '%');
  console.log(
    '  INFO tx=' +
      withTx +
      ' loan=' +
      withLoan +
      ' crisis=' +
      withCrisis +
      ' comeback=' +
      withComeback +
      ' titles=' +
      withTitles +
      ' nt=' +
      withNT
  );
  console.log('  INFO europe=' + europe + ' saPath=' + saPath + ' ballon=' + ballon);
  console.log('  INFO startClubs=' + startClubKeys.length + ' topStart=' + topStart);
  console.log(
    '  INFO duration avg=' +
      (durations.reduce(function (a, b) {
        return a + b;
      }, 0) / N).toFixed(1)
  );

  assert(storyKeys.length >= 12, '>=12 distinct story shapes (' + storyKeys.length + ')');
  assert(topStoryShare < 0.7, 'no story shape >=70% (' + (topStoryShare * 100).toFixed(1) + '%)');
  assert(share(withTx, N) > 0.25, 'transfers in >25% careers (' + (share(withTx, N) * 100).toFixed(1) + '%)');
  assert(share(withLoan, N) > 0.03, 'loans in >3% careers (' + (share(withLoan, N) * 100).toFixed(1) + '%)');
  assert(share(withCrisis, N) > 0.08, 'crisis appears in >8% (' + (share(withCrisis, N) * 100).toFixed(1) + '%)');
  assert(share(withComeback, N) > 0.03 || withCrisis < 20, 'comeback exists when crisis does');
  assert(share(withTitles, N) > 0.15, 'titles in >15% (' + (share(withTitles, N) * 100).toFixed(1) + '%)');
  assert(europe > 10 && europe < N * 0.95, 'Europe neither impossible nor universal (' + europe + '/' + N + ')');
  assert(saPath > 5, 'valid SA-centered paths exist (' + saPath + ')');
  assert(share(ballon, N) < 0.12, 'Ballon dOr rare (<12%) (' + (share(ballon, N) * 100).toFixed(1) + '%)');
  assert(startClubKeys.length >= 20, 'varied starting clubs (' + startClubKeys.length + ')');
  assert(topStart < N * 0.25, 'no single start club >25%');

  // Determinism spot-check
  const a = playCareer(engine, MC, 424242, 'country_ar', 'MID', 'arch_tech_promise');
  const b = playCareer(engine, MC, 424242, 'country_ar', 'MID', 'arch_tech_promise');
  assert(a.story === b.story && a.duration === b.duration, 'same seed → same story fingerprint');

  console.log('\nResult: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
}

main();
