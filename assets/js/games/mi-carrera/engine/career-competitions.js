(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  var NATIONAL_CUP_BY_COUNTRY = {
    country_ar: 'comp_copa_argentina',
    country_br: 'comp_copa_do_brasil',
    country_es: 'comp_copa_del_rey',
    country_eng: 'comp_fa_cup',
    country_it: 'comp_coppa_italia',
    country_de: 'comp_dfb_pokal',
    country_fr: 'comp_coupe_de_france'
  };

  var CONTINENTAL_BY_CONTINENT = {
    continent_eu: { top: 'comp_ucl', mid: 'comp_uel', low: 'comp_uecl' },
    continent_sa: { top: 'comp_libertadores', mid: 'comp_sudamericana', low: 'comp_sudamericana' },
    continent_na: { top: 'comp_concacaf_cl', mid: 'comp_concacaf_cl', low: null },
    continent_ca: { top: 'comp_concacaf_cl', mid: 'comp_concacaf_cl', low: null },
    continent_af: { top: 'comp_caf_cl', mid: 'comp_caf_cl', low: null },
    continent_as: { top: 'comp_afc_cl', mid: 'comp_afc_cl', low: null }
  };

  var NT_CONTINENTAL = {
    continent_sa: 'comp_copa_america',
    continent_eu: 'comp_euro',
    continent_af: 'comp_afcon',
    continent_as: 'comp_asian_cup',
    continent_na: 'comp_gold_cup',
    continent_ca: 'comp_gold_cup'
  };

  function seasonLabel(seasonIndex) {
    var y = 2026 + (Number(seasonIndex) || 0);
    return y + '/' + String(y + 1).slice(-2);
  }

  function makeTitle(comp, state, opts) {
    opts = opts || {};
    if (!comp) return null;
    return {
      id: 'title_' + state.seasonIndex + '_' + comp.id + (opts.scope || ''),
      name: comp.name,
      shortName: comp.shortName || comp.name,
      type: comp.type,
      seasonIndex: state.seasonIndex,
      seasonLabel: seasonLabel(state.seasonIndex),
      clubId: opts.clubId || null,
      nationalTeamId: opts.nationalTeamId || null,
      competitionId: comp.id,
      importance: comp.prestige || 50
    };
  }

  function pushTitle(bag, title) {
    if (!title) return;
    bag.titles.push(title);
    bag.trophyIds.push(title.competitionId);
  }

  function clubStrength(club, state) {
    var level = club ? club.level || 1 : 1;
    var prestige = club ? club.prestige || 40 : 40;
    return level * 14 + prestige * 0.35 + (state.rating - 70) * 0.4 + (state.form - 5) * 2;
  }

  function simulateKnockout(state, club, comp, rng, entryBias) {
    var rounds = ['R32', 'R16', 'QF', 'SF', 'Final'];
    if ((comp.level || 1) <= 3) rounds = ['R16', 'QF', 'SF', 'Final'];
    var strength = clubStrength(club, state) + (entryBias || 0);
    var reached = 'Group';
    var played = rng.int(2, 4);
    var goals = 0;
    var assists = 0;
    var won = false;
    var mvp = false;

    for (var i = 0; i < rounds.length; i++) {
      var opp = 55 + i * 6 + rng.range(-4, 8);
      var edge = strength - opp + (state.form - 5) * 1.5 + rng.range(-8, 8);
      var winP = NS.State.clamp(0.35 + edge / 80, 0.08, 0.82);
      played += rng.int(1, 2);
      if (state.player.position === 'FWD') goals += rng.int(0, 2);
      else if (state.player.position === 'MID') {
        goals += rng.bool(0.35) ? 1 : 0;
        assists += rng.int(0, 1);
      } else if (state.player.position === 'DEF') {
        assists += rng.bool(0.2) ? 1 : 0;
      }
      if (!rng.bool(winP)) {
        reached = rounds[i];
        break;
      }
      reached = rounds[i];
      if (i === rounds.length - 1) {
        won = true;
        reached = 'Champion';
        if (state.averageRatingProxy >= 7.6 || state.rating >= 84) mvp = rng.bool(0.28);
      }
    }

    return {
      competitionId: comp.id,
      name: comp.shortName || comp.name,
      type: comp.type,
      participated: true,
      round: reached,
      appearances: played,
      goals: goals,
      assists: assists,
      champion: won,
      eliminated: !won,
      mvp: mvp,
      final: reached === 'Final' || reached === 'Champion'
    };
  }

  function simulateLeague(state, world, club, rng, playerSeason) {
    var comp = NS.Rules.getCompetition(world, club.primaryCompetitionId);
    if (!comp) return null;
    var strength = clubStrength(club, state);
    var squad = (club.prestige || 50) * 0.5 + (club.level || 1) * 8;
    var minutes = Math.min(1, (playerSeason.appearances || 0) / Math.max(20, comp.seasonMatchesTypical || 34));
    var titleDrive =
      strength * 0.45 +
      squad * 0.35 +
      (state.rating - 70) * 0.5 * minutes +
      (state.form - 5) * 2 +
      rng.range(-12, 12);

    var position;
    if (titleDrive >= 92) position = rng.int(1, 2);
    else if (titleDrive >= 80) position = rng.int(1, 4);
    else if (titleDrive >= 68) position = rng.int(3, 8);
    else if (titleDrive >= 55) position = rng.int(6, 12);
    else position = rng.int(10, 18);

    var matches = comp.seasonMatchesTypical || 34;
    if (matches < 20) matches = 34;
    var winRate = NS.State.clamp(0.22 + titleDrive / 220 + minutes * 0.08, 0.12, 0.72);
    var drawRate = 0.22;
    var wins = Math.round(matches * winRate * rng.range(0.9, 1.08));
    var draws = Math.round(matches * drawRate * rng.range(0.85, 1.1));
    wins = NS.State.clamp(wins, 0, matches);
    draws = NS.State.clamp(draws, 0, matches - wins);
    var losses = matches - wins - draws;
    var points = wins * 3 + draws;
    var champion = position === 1;

    return {
      competitionId: comp.id,
      name: comp.shortName || comp.name,
      type: 'league',
      participated: true,
      position: position,
      appearances: playerSeason.appearances || 0,
      goals: playerSeason.goals || 0,
      assists: playerSeason.assists || 0,
      wins: wins,
      draws: draws,
      losses: losses,
      points: points,
      champion: champion,
      mvp: champion && (playerSeason.averageRating || 0) >= 7.8 && rng.bool(0.35)
    };
  }

  function pickContinental(club, state, rng) {
    var map = CONTINENTAL_BY_CONTINENT[club.continentId];
    if (!map) return null;
    var level = club.level || 1;
    if (level >= 5 || (level >= 4 && state.rating >= 78 && rng.bool(0.7))) return map.top;
    if (level >= 3 || state.rating >= 72) return map.mid;
    return map.low;
  }

  function simulateClubSeason(state, world, rng, playerSeason) {
    var club = NS.Rules.getClub(world, state.clubId);
    var bag = { titles: [], trophyIds: [], competitions: {} };
    if (!club) return bag;

    state.averageRatingProxy = playerSeason.averageRating || 6.5;

    var league = simulateLeague(state, world, club, rng, playerSeason);
    bag.competitions.league = league;
    if (league && league.champion) {
      pushTitle(
        bag,
        makeTitle(NS.Rules.getCompetition(world, league.competitionId), state, { clubId: club.id })
      );
    }

    var cupId = NATIONAL_CUP_BY_COUNTRY[club.countryId];
    if (cupId && world.competitionsById[cupId]) {
      var cupComp = world.competitionsById[cupId];
      var cup = simulateKnockout(state, club, cupComp, rng, -4);
      bag.competitions.nationalCup = cup;
      if (cup.champion) pushTitle(bag, makeTitle(cupComp, state, { clubId: club.id }));
    }

    var contId = pickContinental(club, state, rng);
    if (contId && world.competitionsById[contId] && (club.level || 1) >= 2) {
      var cont = world.competitionsById[contId];
      var entryBias = contId === 'comp_ucl' || contId === 'comp_libertadores' ? 0 : 4;
      var continental = simulateKnockout(state, club, cont, rng, entryBias);
      bag.competitions.continentalCompetition = continental;
      if (continental.champion) {
        pushTitle(bag, makeTitle(cont, state, { clubId: club.id }));
      }
    }

    var wonContinental =
      bag.competitions.continentalCompetition && bag.competitions.continentalCompetition.champion;
    var wonLeagueTop = league && league.champion && (club.level || 1) >= 4;
    if ((wonContinental || wonLeagueTop) && world.competitionsById.comp_club_world_cup) {
      var cwc = world.competitionsById.comp_club_world_cup;
      var cwcRes = simulateKnockout(state, club, cwc, rng, 2);
      bag.competitions.clubWorldCup = cwcRes;
      if (cwcRes.champion) pushTitle(bag, makeTitle(cwc, state, { clubId: club.id }));
    }

    return bag;
  }

  function isWorldCupSeason(seasonIndex) {
    return seasonIndex % 4 === 0;
  }

  function isContinentalNTSeason(seasonIndex) {
    return seasonIndex % 4 === 2;
  }

  function simulateNationalSeason(state, world, rng, playerSeason) {
    var bag = {
      titles: [],
      trophyIds: [],
      nationalTeamCompetitions: [],
      nationalCaps: 0,
      nationalGoals: 0,
      nationalAssists: 0,
      role: 'none'
    };
    var nt = NS.Rules.getNationalTeam(world, state.nationalTeamId);
    var country = NS.Rules.getCountry(world, state.player.countryId);
    if (!nt || !country) return bag;

    var callScore =
      state.rating - (nt.rating - 12) + (state.form - 5) * 1.5 + (state.nationalCaps > 0 ? 4 : 0);
    if (state.fitness < 55 || playerSeason.injuryWeeks >= 10) callScore -= 12;
    var called = callScore >= 0 && rng.bool(NS.State.clamp(0.2 + callScore / 40, 0.05, 0.85));
    if (!called) {
      bag.role = 'not_called';
      return bag;
    }

    bag.role = state.rating + 5 >= nt.rating ? 'starter' : state.rating + 12 >= nt.rating ? 'rotation' : 'bench';
    var friendlies = rng.int(1, 3);
    var quals = isWorldCupSeason(state.seasonIndex) ? 0 : rng.int(2, 6);
    bag.nationalCaps = friendlies + quals;
    if (bag.role === 'bench') bag.nationalCaps = Math.max(1, Math.round(bag.nationalCaps * 0.45));
    if (bag.role === 'rotation') bag.nationalCaps = Math.max(2, Math.round(bag.nationalCaps * 0.75));

    if (state.player.position === 'FWD') {
      bag.nationalGoals = Math.round(bag.nationalCaps * 0.28 * rng.range(0.4, 1.3));
      bag.nationalAssists = Math.round(bag.nationalCaps * 0.12 * rng.range(0.3, 1.2));
    } else if (state.player.position === 'MID') {
      bag.nationalGoals = Math.round(bag.nationalCaps * 0.12 * rng.range(0.3, 1.2));
      bag.nationalAssists = Math.round(bag.nationalCaps * 0.2 * rng.range(0.4, 1.3));
    } else if (state.player.position === 'DEF') {
      bag.nationalGoals = rng.bool(0.15) ? 1 : 0;
      bag.nationalAssists = rng.bool(0.25) ? rng.int(0, 2) : 0;
    }

    if (isContinentalNTSeason(state.seasonIndex)) {
      var contId = NT_CONTINENTAL[country.continentId];
      if (contId && world.competitionsById[contId] && state.rating >= 70) {
        var cont = world.competitionsById[contId];
        var fakeClub = {
          level: Math.ceil(nt.rating / 20),
          prestige: nt.prestige,
          continentId: country.continentId
        };
        var res = simulateKnockout(state, fakeClub, cont, rng, (nt.rating - 75) * 0.4);
        res.scope = 'national';
        bag.nationalTeamCompetitions.push(res);
        bag.nationalCaps += res.appearances || 0;
        bag.nationalGoals += res.goals || 0;
        bag.nationalAssists += res.assists || 0;
        if (res.champion) {
          pushTitle(bag, makeTitle(cont, state, { nationalTeamId: nt.id, scope: '_nt' }));
        }
      }
    }

    if (isWorldCupSeason(state.seasonIndex) && world.competitionsById.comp_world_cup) {
      var eligible = state.rating >= 74 && state.form >= 4 && state.fitness >= 55;
      var wcChance = 0.55 + Math.max(0, state.rating - 80) / 40;
      if (
        eligible &&
        (bag.role === 'starter' || bag.role === 'rotation') &&
        rng.bool(NS.State.clamp(wcChance, 0.2, 0.85))
      ) {
        var wc = world.competitionsById.comp_world_cup;
        var fake = {
          level: Math.ceil(nt.rating / 18),
          prestige: nt.prestige,
          continentId: country.continentId
        };
        var wcRes = simulateKnockout(state, fake, wc, rng, (nt.rating - 78) * 0.5);
        wcRes.scope = 'world_cup';
        bag.nationalTeamCompetitions.push(wcRes);
        bag.nationalCaps += wcRes.appearances || 0;
        bag.nationalGoals += wcRes.goals || 0;
        bag.nationalAssists += wcRes.assists || 0;
        if (wcRes.champion) {
          pushTitle(bag, makeTitle(wc, state, { nationalTeamId: nt.id, scope: '_wc' }));
          state.prestige = NS.State.clamp(state.prestige + 12, 0, 100);
          state.reputation = NS.State.clamp(state.reputation + 10, 0, 100);
          state.popularity = NS.State.clamp(state.popularity + 14, 0, 100);
        }
      }
    }

    return bag;
  }

  NS.Competitions = {
    seasonLabel: seasonLabel,
    makeTitle: makeTitle,
    simulateClubSeason: simulateClubSeason,
    simulateNationalSeason: simulateNationalSeason,
    isWorldCupSeason: isWorldCupSeason,
    isContinentalNTSeason: isContinentalNTSeason,
    NATIONAL_CUP_BY_COUNTRY: NATIONAL_CUP_BY_COUNTRY,
    NT_CONTINENTAL: NT_CONTINENTAL
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
