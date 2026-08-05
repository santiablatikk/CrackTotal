(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  function awardDefs(world) {
    return world.awards || [];
  }

  function findAward(world, id) {
    var list = awardDefs(world);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function posOk(def, position) {
    return !def.positions || def.positions.indexOf(position) !== -1;
  }

  function ageOk(def, age) {
    if (def.minAge != null && age < def.minAge) return false;
    if (def.maxAge != null && age > def.maxAge) return false;
    return true;
  }

  function titleFlags(clubBag, ntBag) {
    var flags = {
      leagueTitle: false,
      continentalTitle: false,
      clubWorldCup: false,
      worldCup: false,
      continentalNational: false,
      uclChamp: false,
      uclMvp: false,
      wcMvp: false,
      leagueMvp: false
    };
    var league = clubBag.competitions && clubBag.competitions.league;
    if (league && league.champion) flags.leagueTitle = true;
    if (league && league.mvp) flags.leagueMvp = true;
    var cont = clubBag.competitions && clubBag.competitions.continentalCompetition;
    if (cont && cont.champion) {
      flags.continentalTitle = true;
      if (cont.competitionId === 'comp_ucl') flags.uclChamp = true;
    }
    if (cont && cont.mvp && cont.competitionId === 'comp_ucl') flags.uclMvp = true;
    var cwc = clubBag.competitions && clubBag.competitions.clubWorldCup;
    if (cwc && cwc.champion) flags.clubWorldCup = true;
    (ntBag.nationalTeamCompetitions || []).forEach(function (c) {
      if (c.competitionId === 'comp_world_cup') {
        if (c.champion) flags.worldCup = true;
        if (c.mvp) flags.wcMvp = true;
      }
      if (
        c.champion &&
        (c.competitionId === 'comp_copa_america' ||
          c.competitionId === 'comp_euro' ||
          c.competitionId === 'comp_afcon' ||
          c.competitionId === 'comp_asian_cup' ||
          c.competitionId === 'comp_gold_cup')
      ) {
        flags.continentalNational = true;
      }
    });
    return flags;
  }

  function ballonScore(state, playerSeason, flags) {
    var pos = state.player.position;
    var goals = playerSeason.goals || 0;
    var assists = playerSeason.assists || 0;
    var apps = playerSeason.appearances || 0;
    var avg = playerSeason.averageRating || 6.5;
    var posFactor = pos === 'FWD' ? 1 : pos === 'MID' ? 1.05 : pos === 'DEF' ? 1.08 : 1.1;
    var scoring =
      pos === 'FWD'
        ? goals * 1.1 + assists * 0.55
        : pos === 'MID'
          ? goals * 0.85 + assists * 1.15
          : pos === 'DEF'
            ? goals * 0.6 + assists * 0.7 + avg * 4
            : avg * 5 + (flags.leagueTitle ? 8 : 0);

    return (
      (state.rating - 78) * 2.2 +
      (state.peakRating - 80) * 0.8 +
      scoring * posFactor +
      apps * 0.15 +
      (avg - 7) * 18 +
      (flags.leagueTitle ? 14 : 0) +
      (flags.continentalTitle ? 22 : 0) +
      (flags.clubWorldCup ? 10 : 0) +
      (flags.worldCup ? 28 : 0) +
      (flags.continentalNational ? 16 : 0) +
      state.prestige * 0.18 +
      state.reputation * 0.12 +
      (state.form - 5) * 3 -
      Math.max(0, state.age - 32) * 2.5 -
      Math.max(0, 21 - state.age) * 1.5
    );
  }

  function rivalGoals(leagueStrength, rng) {
    var base = 18 + leagueStrength * 2.2;
    return Math.max(8, Math.round(base + rng.range(-6, 8)));
  }

  function makeAwardWin(def, state, meta) {
    return {
      id: def.id + '_' + state.seasonIndex,
      awardId: def.id,
      name: def.name,
      shortName: def.shortName || def.name,
      seasonIndex: state.seasonIndex,
      seasonLabel: NS.Competitions ? NS.Competitions.seasonLabel(state.seasonIndex) : String(state.seasonIndex),
      age: state.age,
      clubId: state.clubId,
      importance: def.importance || 50,
      meta: meta || {}
    };
  }

  function resolveSeasonAwards(state, world, rng, playerSeason, clubBag, ntBag) {
    var wins = [];
    var flags = titleFlags(clubBag || {}, ntBag || {});
    var pos = state.player.position;
    var club = NS.Rules.getClub(world, state.clubId);
    var leagueComp = club ? NS.Rules.getCompetition(world, club.primaryCompetitionId) : null;
    var leagueLevel = leagueComp ? leagueComp.level || 3 : 3;

    function tryWin(defId, score, threshold, chance, meta) {
      var def = findAward(world, defId);
      if (!def || !posOk(def, pos) || !ageOk(def, state.age)) return;
      if (score < threshold) return;
      var p = NS.State.clamp(chance + (score - threshold) / 80, 0.02, 0.55);
      if (!rng.bool(p)) return;
      wins.push(makeAwardWin(def, state, meta));
    }

    var bd = ballonScore(state, playerSeason, flags);
    tryWin('award_ballon_dor', bd, 78, 0.08, { score: Math.round(bd) });

    if (pos === 'FWD' || pos === 'MID') {
      var myGoals = playerSeason.goals || 0;
      var bestRival = 0;
      for (var i = 0; i < 5; i++) {
        bestRival = Math.max(bestRival, rivalGoals(leagueLevel, rng));
      }
      var bootScore = myGoals * (1 + leagueLevel * 0.12) - bestRival * 0.85;
      tryWin('award_golden_boot', bootScore, 4, 0.12, {
        goals: myGoals,
        rivalBest: bestRival
      });
    }

    if (flags.leagueMvp || ((playerSeason.averageRating || 0) >= 8.0 && (playerSeason.appearances || 0) >= 28)) {
      tryWin(
        'award_league_best',
        (playerSeason.averageRating || 0) * 10 + (flags.leagueTitle ? 12 : 0),
        78,
        0.2,
        {}
      );
    }

    if (state.age <= 23) {
      var young =
        (state.rating - 70) * 2 +
        (playerSeason.appearances || 0) * 0.4 +
        (playerSeason.goals || 0) +
        (playerSeason.assists || 0) * 0.8 +
        (state.potential - state.rating) * 0.5;
      tryWin('award_best_young', young, 35, 0.15, {});
    }

    if (pos === 'GK') {
      var cleanProxy =
        Math.max(0, (playerSeason.appearances || 0) * 0.35 - (playerSeason.goals || 0)) +
        (playerSeason.averageRating || 0) * 4 +
        (flags.leagueTitle ? 10 : 0);
      tryWin('award_best_gk', cleanProxy, 55, 0.18, {});
    }

    if (pos === 'DEF') {
      var defImpact =
        (playerSeason.averageRating || 0) * 8 +
        (playerSeason.appearances || 0) * 0.35 +
        (playerSeason.assists || 0) * 2 +
        (flags.leagueTitle ? 10 : 0) +
        (flags.continentalTitle ? 12 : 0);
      tryWin('award_best_def', defImpact, 70, 0.16, {});
    }

    if (flags.uclChamp || flags.uclMvp) {
      var ucl = clubBag.competitions && clubBag.competitions.continentalCompetition;
      var uclScore =
        ((ucl && ucl.goals) || 0) * 4 +
        ((ucl && ucl.assists) || 0) * 3 +
        ((ucl && ucl.appearances) || 0) * 1.5 +
        (flags.uclChamp ? 20 : 0) +
        (playerSeason.averageRating || 0) * 3;
      tryWin('award_mvp_ucl', uclScore, 40, 0.22, {});
    }

    if (flags.worldCup || flags.wcMvp) {
      var wcComp = null;
      (ntBag.nationalTeamCompetitions || []).forEach(function (c) {
        if (c.competitionId === 'comp_world_cup') wcComp = c;
      });
      var wcScore =
        ((wcComp && wcComp.goals) || 0) * 5 +
        ((wcComp && wcComp.assists) || 0) * 3 +
        ((wcComp && wcComp.appearances) || 0) * 2 +
        (flags.worldCup ? 25 : 0) +
        (playerSeason.averageRating || 0) * 2;
      tryWin('award_mvp_world_cup', wcScore, 35, 0.2, {});
    }

    return wins;
  }

  function countAwards(state, awardId) {
    var n = 0;
    (state.awards || []).forEach(function (a) {
      if (a.awardId === awardId) n += 1;
    });
    return n;
  }

  function summarizeAwards(state) {
    var map = Object.create(null);
    (state.awards || []).forEach(function (a) {
      if (!map[a.awardId]) {
        map[a.awardId] = { awardId: a.awardId, name: a.name, shortName: a.shortName, count: 0 };
      }
      map[a.awardId].count += 1;
    });
    return Object.keys(map).map(function (k) {
      return map[k];
    });
  }

  NS.Awards = {
    resolveSeasonAwards: resolveSeasonAwards,
    countAwards: countAwards,
    summarizeAwards: summarizeAwards,
    ballonScore: ballonScore,
    findAward: findAward
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
