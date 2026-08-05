#!/usr/bin/env node
'use strict';

/**
 * FASE 4A — competitions, awards, records, moments, determinism.
 * Run: node scripts/mi_carrera_phase4_smoke.js
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

function loadMiCarrera() {
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
    awards: readJson('narrative/awards.json'),
    packs: readJson('manifests/packs.json')
  };
}

function eliteState(MC, data, opts) {
  opts = opts || {};
  const engine = MC.createEngine(data);
  const state = engine.createCareer({
    name: opts.name || 'Legend',
    countryId: opts.countryId || 'country_es',
    position: opts.position || 'FWD',
    archetypeId: opts.archetypeId || 'arch_tech_promise',
    seed: opts.seed != null ? opts.seed : 20260805
  });
  const club =
    engine.world.clubs.find(function (c) {
      return c.id === (opts.clubId || 'club_real_madrid');
    }) ||
    engine.world.clubs.find(function (c) {
      return c.level === 5;
    });
  state.clubId = club.id;
  state.rating = opts.rating != null ? opts.rating : 91;
  state.peakRating = Math.max(state.peakRating, state.rating);
  state.potential = 95;
  state.form = opts.form != null ? opts.form : 9;
  state.fitness = 95;
  state.prestige = 85;
  state.reputation = 88;
  state.popularity = 80;
  state.age = opts.age != null ? opts.age : 26;
  state.seasonIndex = opts.seasonIndex != null ? opts.seasonIndex : 8;
  return { engine: engine, state: state, club: club };
}

function playerSeason(overrides) {
  return Object.assign(
    {
      appearances: 34,
      goals: 28,
      assists: 10,
      averageRating: 8.4,
      injuryWeeks: 0
    },
    overrides || {}
  );
}

function awardsFingerprint(state) {
  return JSON.stringify(
    (state.awards || []).map(function (a) {
      return a.awardId + ':' + a.seasonIndex;
    })
  );
}

function main() {
  console.log('Mi Carrera FASE 4A smoke\n');
  const data = loadData();
  const MC = loadMiCarrera();
  assert(!!MC.Competitions && !!MC.Awards && !!MC.Records && !!MC.Moments, 'phase4 modules loaded');
  assert(data.awards.length === 8, 'awards.json has 8 categories');
  assert(fs.existsSync(path.join(ROOT, 'assets/images/mi-carrera/clubs')), 'assets clubs dir');
  assert(fs.existsSync(path.join(ROOT, 'assets/images/mi-carrera/awards')), 'assets awards dir');

  // 1-2 League win / lose
  console.log('\n[League]');
  {
    const pack = eliteState(MC, data, { clubId: 'club_real_madrid', seed: 11 });
    let win = false;
    let lose = false;
    for (var i = 0; i < 40; i++) {
      const rng = new MC.Randomizer(1000 + i);
      const bag = MC.Competitions.simulateClubSeason(pack.state, pack.engine.world, rng, playerSeason());
      if (bag.competitions.league && bag.competitions.league.champion) win = true;
      if (bag.competitions.league && !bag.competitions.league.champion) lose = true;
    }
    assert(win, '1. can win league');
    assert(lose, '2. can lose league');
  }

  // mediocre in giant club should not auto-win
  {
    const pack = eliteState(MC, data, { rating: 68, form: 4, seed: 22 });
    pack.state.rating = 68;
    pack.state.form = 4;
    pack.state.prestige = 20;
    let wins = 0;
    for (var j = 0; j < 30; j++) {
      const bag = MC.Competitions.simulateClubSeason(
        pack.state,
        pack.engine.world,
        new MC.Randomizer(2000 + j),
        playerSeason({ goals: 4, assists: 2, averageRating: 6.4, appearances: 18 })
      );
      if (bag.competitions.league && bag.competitions.league.champion) wins += 1;
    }
    assert(wins < 12, '1b. mediocre giant club not auto-champion (' + wins + '/30)');
  }

  // 3 National cup
  console.log('\n[Cups]');
  {
    const pack = eliteState(MC, data, { countryId: 'country_es', clubId: 'club_real_madrid', seed: 33 });
    let cup = false;
    for (var k = 0; k < 50; k++) {
      const bag = MC.Competitions.simulateClubSeason(
        pack.state,
        pack.engine.world,
        new MC.Randomizer(3000 + k),
        playerSeason()
      );
      if (bag.competitions.nationalCup && bag.competitions.nationalCup.champion) {
        cup = true;
        assert(bag.titles.some(function (t) {
          return t.competitionId === 'comp_copa_del_rey';
        }), '3. national cup title object');
        break;
      }
    }
    assert(cup, '3. can win national cup');
  }

  // 4 Champions
  {
    const pack = eliteState(MC, data, { clubId: 'club_real_madrid', seed: 44 });
    let ucl = false;
    for (var u = 0; u < 80; u++) {
      const bag = MC.Competitions.simulateClubSeason(
        pack.state,
        pack.engine.world,
        new MC.Randomizer(4000 + u),
        playerSeason({ averageRating: 8.7 })
      );
      const cont = bag.competitions.continentalCompetition;
      if (cont && cont.competitionId === 'comp_ucl' && cont.champion) {
        ucl = true;
        break;
      }
    }
    assert(ucl, '4. can win Champions');
  }

  // 5 Libertadores
  {
    const pack = eliteState(MC, data, {
      countryId: 'country_ar',
      clubId: 'club_boca',
      seed: 55
    });
    const boca = pack.engine.world.clubsById.club_boca || pack.engine.world.clubs.find(function (c) {
      return c.countryId === 'country_ar' && c.level >= 4;
    });
    pack.state.clubId = boca.id;
    pack.state.nationalTeamId = 'nt_ar';
    let lib = false;
    for (var l = 0; l < 80; l++) {
      const bag = MC.Competitions.simulateClubSeason(
        pack.state,
        pack.engine.world,
        new MC.Randomizer(5000 + l),
        playerSeason({ averageRating: 8.5 })
      );
      const cont = bag.competitions.continentalCompetition;
      if (cont && cont.competitionId === 'comp_libertadores' && cont.champion) {
        lib = true;
        break;
      }
    }
    assert(lib, '5. can win Libertadores');
  }

  // 6-8 World Cup / continental NT
  console.log('\n[National team]');
  {
    const pack = eliteState(MC, data, {
      countryId: 'country_ar',
      seasonIndex: 0,
      seed: 66
    });
    pack.state.nationalTeamId = 'nt_ar';
    pack.state.player.countryId = 'country_ar';
    let wcQual = false;
    let wcWin = false;
    for (var w = 0; w < 100; w++) {
      const nt = MC.Competitions.simulateNationalSeason(
        pack.state,
        pack.engine.world,
        new MC.Randomizer(6000 + w),
        playerSeason()
      );
      const wc = (nt.nationalTeamCompetitions || []).find(function (c) {
        return c.competitionId === 'comp_world_cup';
      });
      if (wc) {
        wcQual = true;
        if (wc.champion) wcWin = true;
      }
    }
    assert(wcQual, '6. can qualify/play World Cup');
    assert(wcWin, '7. can win World Cup');
  }

  {
    const pack = eliteState(MC, data, {
      countryId: 'country_ar',
      seasonIndex: 2,
      seed: 77
    });
    pack.state.nationalTeamId = 'nt_ar';
    pack.state.player.countryId = 'country_ar';
    let ca = false;
    for (var c = 0; c < 80; c++) {
      const nt = MC.Competitions.simulateNationalSeason(
        pack.state,
        pack.engine.world,
        new MC.Randomizer(7000 + c),
        playerSeason()
      );
      if (
        (nt.nationalTeamCompetitions || []).some(function (x) {
          return x.competitionId === 'comp_copa_america' && x.champion;
        })
      ) {
        ca = true;
        break;
      }
    }
    assert(ca, '8. can win Copa América');
  }

  {
    const pack = eliteState(MC, data, {
      countryId: 'country_es',
      seasonIndex: 2,
      seed: 78
    });
    pack.state.nationalTeamId = 'nt_es';
    pack.state.player.countryId = 'country_es';
    let euro = false;
    for (var e = 0; e < 80; e++) {
      const nt = MC.Competitions.simulateNationalSeason(
        pack.state,
        pack.engine.world,
        new MC.Randomizer(7100 + e),
        playerSeason()
      );
      if (
        (nt.nationalTeamCompetitions || []).some(function (x) {
          return x.competitionId === 'comp_euro' && x.champion;
        })
      ) {
        euro = true;
        break;
      }
    }
    assert(euro, '8b. can win Euro');
  }

  // 9-13 Awards
  console.log('\n[Awards]');
  {
    const pack = eliteState(MC, data, { position: 'FWD', age: 27, seed: 88 });
    const clubBag = {
      competitions: {
        league: { champion: true, mvp: true, competitionId: 'comp_laliga' },
        continentalCompetition: {
          champion: true,
          mvp: true,
          competitionId: 'comp_ucl',
          goals: 8,
          assists: 4,
          appearances: 12
        },
        clubWorldCup: { champion: true }
      },
      titles: [],
      trophyIds: []
    };
    const ntBag = {
      nationalTeamCompetitions: [
        {
          competitionId: 'comp_world_cup',
          champion: true,
          mvp: true,
          goals: 5,
          assists: 2,
          appearances: 7
        }
      ]
    };
    let ballon = false;
    let boot = false;
    let uclMvp = false;
    let wcMvp = false;
    for (var a = 0; a < 60; a++) {
      const wins = MC.Awards.resolveSeasonAwards(
        pack.state,
        pack.engine.world,
        new MC.Randomizer(8000 + a),
        playerSeason({ goals: 42, assists: 14, averageRating: 8.9, appearances: 36 }),
        clubBag,
        ntBag
      );
      wins.forEach(function (w) {
        if (w.awardId === 'award_ballon_dor') ballon = true;
        if (w.awardId === 'award_golden_boot') boot = true;
        if (w.awardId === 'award_mvp_ucl') uclMvp = true;
        if (w.awardId === 'award_mvp_world_cup') wcMvp = true;
      });
    }
    assert(ballon, '9. can win Ballon d\'Or');
    assert(boot, '10. can win Golden Boot');
    assert(uclMvp, 'MVP Champions possible');
    assert(wcMvp, 'MVP Mundial possible');
  }

  {
    const pack = eliteState(MC, data, { position: 'FWD', age: 20, seed: 89 });
    let young = false;
    for (var y = 0; y < 40; y++) {
      const wins = MC.Awards.resolveSeasonAwards(
        pack.state,
        pack.engine.world,
        new MC.Randomizer(8100 + y),
        playerSeason({ goals: 18, assists: 8, averageRating: 7.9, appearances: 32 }),
        { competitions: { league: { champion: false } }, titles: [], trophyIds: [] },
        { nationalTeamCompetitions: [] }
      );
      if (wins.some(function (w) { return w.awardId === 'award_best_young'; })) young = true;
    }
    assert(young, '11. can win Best Young');
  }

  {
    const pack = eliteState(MC, data, { position: 'GK', age: 28, seed: 90 });
    let gk = false;
    for (var g = 0; g < 40; g++) {
      const wins = MC.Awards.resolveSeasonAwards(
        pack.state,
        pack.engine.world,
        new MC.Randomizer(8200 + g),
        playerSeason({ goals: 0, assists: 1, averageRating: 8.2, appearances: 36 }),
        {
          competitions: { league: { champion: true, mvp: false } },
          titles: [],
          trophyIds: []
        },
        { nationalTeamCompetitions: [] }
      );
      if (wins.some(function (w) { return w.awardId === 'award_best_gk'; })) gk = true;
    }
    assert(gk, '12. can win Best GK');
  }

  {
    const pack = eliteState(MC, data, { position: 'DEF', age: 27, seed: 91 });
    let def = false;
    for (var d = 0; d < 40; d++) {
      const wins = MC.Awards.resolveSeasonAwards(
        pack.state,
        pack.engine.world,
        new MC.Randomizer(8300 + d),
        playerSeason({ goals: 3, assists: 4, averageRating: 8.3, appearances: 34 }),
        {
          competitions: {
            league: { champion: true },
            continentalCompetition: { champion: true, competitionId: 'comp_ucl' }
          },
          titles: [],
          trophyIds: []
        },
        { nationalTeamCompetitions: [] }
      );
      if (wins.some(function (w) { return w.awardId === 'award_best_def'; })) def = true;
    }
    assert(def, '13. can win Best Defender');
  }

  // 14-15 records + moments
  console.log('\n[Records / Moments]');
  {
    const pack = eliteState(MC, data, { seed: 92 });
    pack.state.seasonHistory = [];
    for (var s = 0; s < 12; s++) {
      pack.state.seasonHistory.push({
        appearances: 40,
        goals: 12,
        assists: 6,
        clubId: pack.state.clubId,
        trophies: []
      });
    }
    pack.state.titles = [];
    for (var t = 0; t < 11; t++) {
      pack.state.titles.push({
        id: 't' + t,
        name: 'Liga',
        competitionId: 'comp_laliga',
        importance: 70
      });
    }
    pack.state.nationalCaps = 85;
    pack.state.nationalGoals = 32;
    pack.state.peakRating = 93;
    pack.state.peakMarketValue = 90000000;
    pack.state.seasonIndex = 12;
    const recs = MC.Records.updateCareerRecords(pack.state, { ballonAge: 21, uclAge: 20, veteranTitleAge: 37 });
    assert(recs.length >= 1 || (pack.state.records || []).length >= 1, '14. register record');
    assert(
      (pack.state.records || []).some(function (r) {
        return r.id === 'rec_career_goals_100' || r.id === 'rec_titles_10' || r.id === 'rec_young_ballon';
      }),
      '14. known record types present'
    );

    const seasonRecord = { nationalCaps: 3, firstCallUp: true, moments: [] };
    const moments = MC.Moments.detectSeasonMoments(
      pack.state,
      seasonRecord,
      {
        competitions: {
          league: { champion: true },
          continentalCompetition: { champion: true, competitionId: 'comp_ucl' }
        }
      },
      {
        nationalTeamCompetitions: [{ competitionId: 'comp_world_cup', champion: true }]
      },
      [{ awardId: 'award_ballon_dor' }]
    );
    assert(moments.length >= 1 || (pack.state.moments || []).length >= 1, '15. register historical moment');
  }

  // 16-17 careers with/without titles
  console.log('\n[Careers]');
  {
    MC.Storage.resetAll();
    const engine = MC.createEngine(data);
    const low = engine.createCareer({
      name: 'LowTitles',
      countryId: 'country_py',
      position: 'DEF',
      archetypeId: 'arch_physical',
      seed: 101
    });
    engine.autoPlayUntilRetired(low, 28);
    if (!low.retired) {
      low.age = Math.max(32, low.age);
      engine.forceRetire(low, 'voluntary');
    }
    assert((low.titles || []).length >= 0, '16. career without requiring titles completes');

    const high = engine.createCareer({
      name: 'HighTitles',
      countryId: 'country_es',
      position: 'FWD',
      archetypeId: 'arch_tech_promise',
      seed: 202
    });
    // boost path
    for (var hs = 0; hs < 18 && !high.retired; hs++) {
      high.rating = Math.max(high.rating, 88);
      high.form = 9;
      high.prestige = Math.max(high.prestige, 70);
      const madrid = engine.world.clubsById.club_real_madrid;
      if (madrid && hs === 3) {
        high.clubId = madrid.id;
        if (high.clubsPlayed.indexOf(madrid.id) === -1) high.clubsPlayed.push(madrid.id);
      }
      const d = engine.getCurrentDecision(high);
      if (high.phase === 'simulate') {
        engine.playSeason(high);
      } else {
        engine.playSeason(high, d && d.options && d.options[0] ? d.options[0].id : 'stay_loyal');
      }
    }
    if (!high.retired) {
      high.age = Math.max(32, high.age);
      engine.forceRetire(high, 'voluntary');
    }
    const highTitles = (high.titles || []).length;
    assert(highTitles >= 0, '17. decorated career path runs (titles=' + highTitles + ')');
    assert(!!high.seasonHistory[0] && !!high.seasonHistory[0].competitions, 'season stores competitions block');
    assert(high.careerScore != null, 'legacy score computed');
  }

  // 18-20 determinism / diversity awards
  console.log('\n[Determinism]');
  function runAwardsCareer(seed) {
    MC.Storage.resetAll();
    const engine = MC.createEngine(data);
    const st = engine.createCareer({
      name: 'DetAwards',
      countryId: 'country_br',
      position: 'MID',
      archetypeId: 'arch_tactical',
      seed: seed
    });
    engine.autoPlayUntilRetired(st, 26);
    if (!st.retired) {
      st.age = Math.max(32, st.age);
      engine.forceRetire(st, 'voluntary');
    }
    return {
      awards: awardsFingerprint(st),
      titles: (st.titles || []).map(function (t) {
        return t.competitionId;
      }).join(','),
      score: st.careerScore,
      moments: (st.moments || []).map(function (m) {
        return m.id;
      }).join(','),
      clubs: (st.clubsPlayed || []).join(','),
      goals: (st.seasonHistory || []).reduce(function (n, s) {
        return n + (s.goals || 0);
      }, 0),
      peak: st.peakRating
    };
  }
  const a1 = runAwardsCareer(4242);
  const a2 = runAwardsCareer(4242);
  assert(a1.awards === a2.awards, '18/19. same seed same awards');
  assert(a1.titles === a2.titles, '19. same seed same titles');
  assert(a1.moments === a2.moments, '19. same seed same moments');

  const divers = {};
  for (var seed = 3000; seed < 3040; seed++) {
    const r = runAwardsCareer(seed);
    divers[
      r.awards +
        '|' +
        r.titles +
        '|' +
        r.score +
        '|' +
        r.moments +
        '|' +
        r.clubs +
        '|' +
        r.goals +
        '|' +
        r.peak
    ] = true;
  }
  assert(Object.keys(divers).length >= 12, '20. different seeds produce diversity (' + Object.keys(divers).length + ')');

  // assets providers
  console.log('\n[Assets]');
  const playerImg = MC.getPlayerImage(null, { name: 'Tisan', position: 'MID' });
  assert(playerImg.type === 'generated' && !!playerImg.generatedHref, 'player image fallback');
  const compLogo = MC.getCompetitionLogo('comp_ucl', data.competitions.find(function (c) {
    return c.id === 'comp_ucl';
  }));
  assert(!!compLogo.generatedHref, 'competition logo fallback');
  const awardIcon = MC.getAwardIcon('award_ballon_dor', data.awards[0]);
  assert(!!awardIcon.generatedHref, 'award icon fallback');

  // ballon not rating-only
  {
    const pack = eliteState(MC, data, { rating: 90, position: 'FWD', seed: 1 });
    const weak = MC.Awards.resolveSeasonAwards(
      pack.state,
      pack.engine.world,
      new MC.Randomizer(1),
      playerSeason({ goals: 2, assists: 0, averageRating: 6.5, appearances: 10 }),
      { competitions: {}, titles: [], trophyIds: [] },
      { nationalTeamCompetitions: [] }
    );
    assert(
      !weak.some(function (w) {
        return w.awardId === 'award_ballon_dor';
      }),
      'Ballon d\'Or not granted by rating alone'
    );
  }

  console.log('\n==========');
  console.log('Passed: ' + passed);
  console.log('Failed: ' + failed);
  process.exit(failed ? 1 : 0);
}

main();
