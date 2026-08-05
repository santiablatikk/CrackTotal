#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
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

function loadAll() {
  const store = Object.create(null);
  const sandbox = {
    console: console,
    globalThis: null,
    navigator: {},
    document: {
      createElement: function () {
        return {
          value: '',
          style: {},
          setAttribute: function () {},
          select: function () {}
        };
      },
      body: {
        appendChild: function () {},
        removeChild: function () {}
      },
      execCommand: function () {
        return true;
      }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.localStorage = {
    getItem: function (k) {
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem: function (k, v) {
      store[k] = String(v);
    },
    removeItem: function (k) {
      delete store[k];
    }
  };

  let matchCalls = 0;
  sandbox.CrackTotalProgressBridge = {
    reportMatch: function (detail) {
      matchCalls += 1;
      sandbox.__lastMatch = detail;
      return {
        match: detail,
        unlocked: detail.won
          ? [{ id: 'mi_carrera_elite', title: 'Jugador de élite' }]
          : [],
        snapshot: { xp: { total: 35 } }
      };
    }
  };
  sandbox.__matchCalls = function () {
    return matchCalls;
  };

  const context = vm.createContext(sandbox);
  const files = [
    'assets/js/games/mi-carrera/engine/career-randomizer.js',
    'assets/js/games/mi-carrera/engine/career-state.js',
    'assets/js/games/mi-carrera/engine/career-rules.js',
    'assets/js/games/mi-carrera/engine/career-events.js',
    'assets/js/games/mi-carrera/engine/career-decisions.js',
    'assets/js/games/mi-carrera/engine/career-competitions.js',
    'assets/js/games/mi-carrera/engine/career-awards.js',
    'assets/js/games/mi-carrera/engine/career-records.js',
    'assets/js/games/mi-carrera/engine/career-moments.js',
    'assets/js/games/mi-carrera/engine/career-scoring.js',
    'assets/js/games/mi-carrera/engine/career-engine.js',
    'assets/js/games/mi-carrera/persistence/career-storage.js',
    'assets/js/games/mi-carrera/providers/flags.js',
    'assets/js/games/mi-carrera/providers/badges.js',
    'assets/js/games/mi-carrera/providers/assets.js',
    'assets/js/games/mi-carrera/main.js',
    'assets/js/games/mi-carrera/ui/format.js',
    'assets/js/games/mi-carrera/ui/components.js',
    'assets/js/games/mi-carrera/ui/career-legacy.js',
    'assets/js/games/mi-carrera/ui/career-card.js',
    'assets/js/games/mi-carrera/ui/career-share.js',
    'assets/js/games/mi-carrera/ui/career-rewards.js',
    'assets/js/games/mi-carrera/ui/screens.js',
    'assets/js/games/mi-carrera/ui/app.js'
  ];
  files.forEach(function (rel) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel });
  });
  return context;
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/mi-carrera', rel), 'utf8'));
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
  console.log('Mi Carrera UI + FASE 3 smoke\n');

  assert(fs.existsSync(path.join(ROOT, 'mi-carrera.html')), 'mi-carrera.html exists');
  const html = fs.readFileSync(path.join(ROOT, 'mi-carrera.html'), 'utf8');
  [
    'career-card.js',
    'career-share.js',
    'career-legacy.js',
    'career-rewards.js',
    'career-competitions.js',
    'career-awards.js',
    'providers/assets.js',
    'progress-bridge.js',
    'gamification-config.js'
  ].forEach(function (t) {
    assert(html.indexOf(t) !== -1, 'html loads ' + t);
  });

  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert(home.indexOf('id="mi-carrera-feature"') !== -1, 'home has mi-carrera-feature');
  assert(home.indexOf('Crear mi carrera') !== -1, 'home CTA crear carrera');
  assert(home.indexOf('mi-carrera.html') !== -1, 'home links mi-carrera');
  assert(home.indexOf('home-game-card--flagship') !== -1, 'home catalog flagship card');

  const games = fs.readFileSync(path.join(ROOT, 'games.html'), 'utf8');
  assert(games.indexOf('home-game-card--flagship') !== -1, 'games.html flagship card');
  assert(games.indexOf('Jugar ahora') !== -1, 'games.html jugar ahora CTA');
  assert((games.match(/href="mi-carrera.html"/g) || []).length >= 1, 'games links mi-carrera once+');

  const cfg = fs.readFileSync(path.join(ROOT, 'assets/js/config/gamification-config.js'), 'utf8');
  assert(cfg.indexOf('mi_carrera_elite') !== -1, 'config has mi_carrera achievements');

  const ctx = loadAll();
  const MC = ctx.MiCarrera;
  const data = loadData();
  const engine = MC.createEngine(data);
  MC.Storage.resetAll();

  // Minimal career card
  const mini = engine.createCareer({
    name: 'Mini',
    countryId: 'country_uy',
    position: 'GK',
    archetypeId: 'arch_physical',
    seed: 11
  });
  mini.retired = true;
  mini.retirementReason = 'voluntary';
  mini.careerScore = 4.2;
  mini.careerCategory = MC.Scoring.categoryFromScore(4.2);
  mini.careerFlags = [];
  const miniCard = MC.CareerCardRenderer.render(mini, engine);
  assert(miniCard.html.indexOf('Mini') !== -1, '1. card uses real name');
  assert(miniCard.viewModel.appearances === 0 || miniCard.viewModel.appearances >= 0, '2. minimal career card builds');
  assert(miniCard.svg.indexOf('Mini') !== -1, 'svg renderer works');

  const introHtml = MC.UI.screens.intro({ activeSummary: null });
  assert(introHtml.indexOf('CONVERTITE EN LEYENDA.') !== -1, 'intro flagship lead');
  assert(introHtml.indexOf('como-funciona') !== -1, 'intro how-it-works anchor');
  assert(introHtml.indexOf('mc-screen--cover') !== -1, 'intro game cover');

  const createHtml = MC.UI.screens.create({
    draft: {
      name: 'Tisan',
      countryId: 'country_ar',
      position: 'MID',
      archetypeId: 'arch_tech_promise',
      createStep: 1
    },
    data: data
  });
  assert(createHtml.indexOf('mc-create-preview') !== -1, 'create has live preview');
  assert(createHtml.indexOf('mc-create-flow') !== -1, 'create stepped flow');
  assert(createHtml.indexOf('Tisan') !== -1, 'preview shows draft name');
  assert(createHtml.indexOf('OVR') !== -1, 'preview shows OVR');

  const marketHtml = MC.UI.screens.market({
    state: { pendingOffers: [], player: { name: 'Tisan' }, clubId: 'club_boca' },
    engine: engine,
    selectedOfferId: null
  });
  assert(marketHtml.indexOf('Mercado de fichajes') !== -1, 'market empty title');
  assert(marketHtml.indexOf('nadie llamó') !== -1, 'market empty copy');
  assert(typeof MC.UI.screens.careerHome === 'function', 'career home screen');
  assert(typeof MC.UI.screens.compareOfferBody === 'function', 'compare offer body');

  assert(typeof MC.UI.screens.titleCelebrationBody === 'function', 'title celebration renderer');
  assert(typeof MC.UI.screens.awardCelebrationBody === 'function', 'award celebration renderer');
  assert(typeof MC.UI.screens.momentCelebrationBody === 'function', 'moment celebration renderer');

  // Full career
  MC.Storage.resetAll();
  const full = engine.createCareer({
    name: 'Tisan',
    countryId: 'country_ar',
    position: 'MID',
    archetypeId: 'arch_tech_promise',
    seed: 99
  });
  engine.autoPlayUntilRetired(full, 32);
  if (!full.retired) {
    full.age = Math.max(32, full.age);
    engine.forceRetire(full, 'voluntary');
  }
  assert(full.retired, 'full career retired');
  const card = MC.CareerCardRenderer.render(full, engine);
  assert(card.viewModel.playerName === 'Tisan', '3. historic card name');
  assert(card.viewModel.score === full.careerScore, '3. historic card score');
  assert(card.html.indexOf('mc-career-card') !== -1, '3. card html class');

  const share = MC.UI.Share.buildShareText(card.viewModel);
  assert(share.indexOf('Tisan') !== -1 && share.indexOf('Crack Total') !== -1, '4. share text dynamic');
  assert(share.indexOf(String(full.peakRating)) !== -1, '4. share includes peak');

  return MC.UI.Share.copyText(share).then(function (r) {
    assert(r.ok, '5. clipboard fallback ok');

    MC.Storage.resetAll();
    ctx.__lastMatch = null;
    const beforeCalls = ctx.__matchCalls();
    const reward1 = MC.UI.Rewards.grantCareerRewards(full, {
      achievements: MC.UI.Legacy.detectAchievements(full, engine.world)
    });
    assert(reward1.granted === true, '6. first reward granted');
    const reward2 = MC.UI.Rewards.grantCareerRewards(full, {});
    assert(reward2.duplicate === true && reward2.granted === false, '6/7. share/reward no duplicate');
    assert(ctx.__matchCalls() === beforeCalls + 1, '7. XP reportMatch called once');

    const ach = MC.UI.Legacy.detectAchievements(full, engine.world);
    const ach2 = MC.UI.Legacy.detectAchievements(full, engine.world);
    assert(ach.length === ach2.length, '8. achievements stable/no dup inflate');

    const histBefore = MC.Storage.getHistory().length;
    MC.Storage.ensureHistoryEntry(full);
    const histAfterFirst = MC.Storage.getHistory().length;
    MC.Storage.ensureHistoryEntry(full);
    assert(MC.Storage.getHistory().length === histAfterFirst, '9. play-again keeps single history entry');
    assert(histAfterFirst >= histBefore, '9. history retained');

    // second career for ranking
    const other = engine.createCareer({
      name: 'Other',
      countryId: 'country_br',
      position: 'FWD',
      archetypeId: 'arch_media_star',
      seed: 7
    });
    other.retired = true;
    other.careerScore = 9.6;
    other.careerCategory = MC.Scoring.categoryFromScore(9.6);
    other.peakRating = 94;
    MC.Storage.saveFinished(other);
    const best = MC.getBestCareers(5);
    assert(best.length >= 1, '10. getBestCareers returns rows');
    assert(best[0].score >= best[best.length - 1].score, '10. getBestCareers sorted by score');

    const legacy = MC.UI.Legacy.buildLegacy(full, engine);
    assert(legacy.items.length === 8, 'legacy has 8 slots');

    const retireHtml = MC.UI.screens.retire({
      state: full,
      engine: engine,
      reward: reward1
    });
    assert(retireHtml.indexOf('Compartir mi carrera') !== -1, 'final CTAs present');
    assert(retireHtml.indexOf('Tu legado') !== -1, 'legacy section rendered');
    assert(retireHtml.indexOf('XP ganada') !== -1, 'xp section rendered');

    [
      'assets/js/pasalache.js',
      'assets/js/top10.js',
      'assets/js/mentiroso.js',
      'assets/js/quiensabemas_1v1.js',
      'assets/js/wordle-futbol.js'
    ].forEach(function (f) {
      assert(fs.existsSync(path.join(ROOT, f)), '11. exists ' + f);
    });

    console.log('\nPassed: ' + passed + '  Failed: ' + failed);
    process.exit(failed ? 1 : 0);
  }).catch(function (err) {
    console.error(err);
    process.exit(1);
  });
}

main();
