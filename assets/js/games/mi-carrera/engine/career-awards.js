/**
 * Individual awards resolution (including ultra-rare Ballon d'Or).
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});
  var Rules = Engine.Rules;

  function resolveAwards(career, seasonStats, titles, rng) {
    var p = career.player;
    var out = [];
    if (Rules.isGoalkeeper(p.position)) {
      if ((seasonStats.cleanSheets || 0) >= 12 && (seasonStats.rating || 0) >= 7.1 && rng.chance(0.18)) {
        out.push('goalkeeper_season');
      }
    } else {
      if ((seasonStats.goals || 0) >= 18 && rng.chance(0.16)) out.push('league_top_scorer');
      if ((seasonStats.assists || 0) >= 12 && rng.chance(0.14)) out.push('league_top_assist');
    }

    if ((seasonStats.rating || 0) >= 7.35 && (seasonStats.minutes || 0) >= 2200 && rng.chance(0.12)) {
      out.push('league_mvp');
    }
    if (p.age <= 21 && (seasonStats.rating || 0) >= 7.0 && (seasonStats.minutes || 0) >= 1500 && rng.chance(0.1)) {
      out.push('young_player');
    }
    if (
      titles.some(function (t) {
        return t.rarity === 'legendary' || t.rarity === 'major';
      }) &&
      (seasonStats.rating || 0) >= 7.4 &&
      rng.chance(0.12)
    ) {
      out.push('competition_mvp');
    }
    if ((seasonStats.rating || 0) >= 7.1 && rng.chance(0.12)) out.push('team_of_season');
    if ((seasonStats.rating || 0) >= 7.15 && (seasonStats.minutes || 0) >= 1800 && rng.chance(0.1)) {
      out.push('club_player_of_year');
    }

    // Continental player awards
    var club = NS.Providers.clubs.getById(career.currentClubId);
    if (club && club.continent === 'EU' && p.overall >= 86 && (seasonStats.rating || 0) >= 7.5 && rng.chance(0.04)) {
      out.push('continental_player_eu');
    }
    if (club && club.continent === 'SA' && p.overall >= 84 && (seasonStats.rating || 0) >= 7.45 && rng.chance(0.05)) {
      out.push('continental_player_sa');
    }

    // Golden boot Europe (very hard)
    if (
      club &&
      club.continent === 'EU' &&
      (seasonStats.goals || 0) >= 28 &&
      p.overall >= 86 &&
      rng.chance(0.015)
    ) {
      out.push('golden_boot_europe');
    }

    // Ballon d'Or — exceptional (post-season OVR/rep already applied)
    var seasonAge = Math.max(16, (p.age || 20) - 1);
    var legendaryTitle = titles.some(function (t) {
      return (
        t.competitionId === 'uefa_cl' ||
        t.competitionId === 'fifa_world_cup' ||
        t.competitionId === 'conmebol_libertadores'
      );
    });
    var majorContinental = titles.some(function (t) {
      return t.competitionId === 'uefa_euro' || t.competitionId === 'conmebol_copa_america';
    });
    var ga = (seasonStats.goals || 0) + (seasonStats.assists || 0);
    var eliteOutput =
      (seasonStats.goals || 0) >= 24 ||
      ga >= 32 ||
      (Rules.isGoalkeeper(p.position) && (seasonStats.cleanSheets || 0) >= 16 && legendaryTitle);
    var ballonEligible =
      p.overall >= 88 &&
      p.reputation >= 82 &&
      seasonAge >= 22 &&
      seasonAge <= 34 &&
      (seasonStats.rating || 0) >= 7.45 &&
      (seasonStats.minutes || 0) >= 2200 &&
      (legendaryTitle || (eliteOutput && p.overall >= 90) || (majorContinental && p.overall >= 91 && eliteOutput)) &&
      club &&
      (club.continent === 'EU' || (club.continent === 'SA' && p.reputation >= 88));

    var ballonChance = 0.055;
    if (p.overall >= 91) ballonChance += 0.05;
    if (legendaryTitle) ballonChance += 0.035;
    if ((seasonStats.rating || 0) >= 7.75) ballonChance += 0.025;

    if (ballonEligible && !career.flags.wonBallon && rng.chance(ballonChance)) {
      out.push('ballon_dor');
      career.flags.wonBallon = true;
      Engine.Events.pushMoment(career, 'ballon_dor', { overall: p.overall, clubId: career.currentClubId });
    }

    // World Cup individual awards only if tournament played that year — handled in national module via seasonStats.flags
    if (seasonStats.worldCupPlayed && (seasonStats.nationalGoals || 0) >= 4 && rng.chance(0.08)) {
      out.push('world_cup_golden_boot');
    }
    if (seasonStats.worldCupPlayed && seasonStats.worldCupWon && (seasonStats.rating || 0) >= 7.5 && rng.chance(0.05)) {
      out.push('world_cup_golden_ball');
    }

    // Deduplicate
    var uniq = [];
    out.forEach(function (id) {
      if (uniq.indexOf(id) === -1) uniq.push(id);
    });

    return uniq.map(function (id) {
      return {
        awardId: id,
        seasonIndex: career.seasonIndex,
        seasonYear: career.seasonYear,
        age: p.age,
        clubId: career.currentClubId
      };
    });
  }

  Engine.Awards = {
    resolveAwards: resolveAwards
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
