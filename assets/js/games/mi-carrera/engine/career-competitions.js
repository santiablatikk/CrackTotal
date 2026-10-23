/**
 * Title resolution for domestic / continental competitions.
 * Uses Eligibility layer: division + confederation + band — not prestige alone.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});
  var Rules = Engine.Rules;

  function winChance(base, playerImpact, clubPrestige, prestigeComp, rng) {
    var p = base * (0.55 + clubPrestige / 200) * (0.7 + playerImpact) * (1.15 - prestigeComp / 180);
    p = Math.max(0.002, Math.min(0.42, p));
    return rng.chance(p);
  }

  function resolveTitles(career, seasonStats, rng) {
    var club = NS.Providers.clubs.getById(career.currentClubId);
    if (!club) return [];
    var Elig = Engine.Eligibility;
    var profile = Elig.describeClub(club);
    var won = [];
    var roleBoost =
      career.role === 'star' || career.role === 'key_player' ? 0.35 : career.role === 'starter' ? 0.22 : 0.08;
    var playerImpact = roleBoost * Math.max(0.2, (seasonStats.minutes || 0) / 3000) * ((seasonStats.rating || 6.5) / 7.2);
    var band = profile.band;
    var tier = profile.footballTier;

    var leagueBase =
      tier === 'S' ? 0.22 : tier === 'A' ? 0.16 : tier === 'B' ? 0.12 : tier === 'C' ? 0.07 : 0.03;

    // Top domestic league — only if club is in top division
    if (profile.canWinTopDomesticLeague && profile.topDomesticCompetitionId) {
      if (winChance(leagueBase, playerImpact, club.prestige, 72, rng)) {
        won.push({ competitionId: profile.topDomesticCompetitionId, rarity: 'notable' });
      }
    }

    // Domestic cup — open to top and second division, but L2 wins less often
    if (profile.canWinDomesticCup && profile.domesticCupCompetitionId) {
      var cupBase = leagueBase * (profile.leagueLevel >= 2 ? 0.45 : 0.85);
      if (winChance(cupBase, playerImpact, club.prestige, 70, rng)) {
        won.push({ competitionId: profile.domesticCupCompetitionId, rarity: 'normal' });
      }
    }

    // Continental — top division only; competition pick by access gates
    if (profile.canPlayContinental) {
      if (club.continent === 'EU') {
        var clBase = tier === 'S' ? 0.09 : tier === 'A' ? 0.055 : 0.02;
        if (profile.canPlayContinentalTop && Elig.canCompeteIn(club, 'uefa_cl')) {
          if (winChance(clBase, playerImpact, club.prestige, 98, rng)) {
            won.push({ competitionId: 'uefa_cl', rarity: 'legendary' });
          } else if (profile.canPlayContinentalSecondary && winChance(0.1, playerImpact, club.prestige, 86, rng)) {
            won.push({ competitionId: 'uefa_el', rarity: 'major' });
          }
        } else if (profile.canPlayContinentalSecondary && Elig.canCompeteIn(club, 'uefa_el')) {
          if (winChance(0.1, playerImpact, club.prestige, 86, rng)) {
            won.push({ competitionId: 'uefa_el', rarity: 'major' });
          } else if (profile.canPlayContinentalTertiary && winChance(0.08, playerImpact, club.prestige, 74, rng)) {
            won.push({ competitionId: 'uefa_uecl', rarity: 'notable' });
          }
        } else if (profile.canPlayContinentalTertiary && Elig.canCompeteIn(club, 'uefa_uecl')) {
          if (winChance(0.07, playerImpact, club.prestige, 74, rng)) {
            won.push({ competitionId: 'uefa_uecl', rarity: 'notable' });
          }
        }
      } else if (club.continent === 'SA') {
        var libBase = tier === 'S' || tier === 'A' || tier === 'B' ? 0.09 : 0.04;
        if (profile.canPlayContinentalTop && Elig.canCompeteIn(club, 'conmebol_libertadores')) {
          if (winChance(libBase, playerImpact, club.prestige, 94, rng)) {
            won.push({ competitionId: 'conmebol_libertadores', rarity: 'legendary' });
          } else if (profile.canPlayContinentalSecondary && winChance(0.09, playerImpact, club.prestige, 80, rng)) {
            won.push({ competitionId: 'conmebol_sudamericana', rarity: 'major' });
          }
        } else if (profile.canPlayContinentalSecondary && Elig.canCompeteIn(club, 'conmebol_sudamericana')) {
          if (winChance(0.09, playerImpact, club.prestige, 80, rng)) {
            won.push({ competitionId: 'conmebol_sudamericana', rarity: 'major' });
          }
        }
      }
    }

    // Club World Cup only after top continental that season
    if (
      won.some(function (w) {
        return w.competitionId === 'uefa_cl' || w.competitionId === 'conmebol_libertadores';
      }) &&
      rng.chance(0.28)
    ) {
      if (winChance(0.2, playerImpact, club.prestige, 90, rng)) {
        won.push({ competitionId: 'fifa_club_world_cup', rarity: 'legendary' });
      }
    }

    // Final guard: drop anything the club cannot compete in
    won = won.filter(function (w) {
      if (w.competitionId === 'fifa_club_world_cup') return true;
      return Elig.canCompeteIn(club, w.competitionId);
    });

    return won.map(function (w) {
      return {
        competitionId: w.competitionId,
        rarity: w.rarity,
        seasonIndex: career.seasonIndex,
        seasonYear: career.seasonYear,
        age: career.player.age,
        clubId: club.id
      };
    });
  }

  Engine.Competitions = {
    resolveTitles: resolveTitles,
    domesticLeagueId: function (countryCode) {
      return (Engine.Eligibility && Engine.Eligibility.TOP_DOMESTIC_LEAGUE[countryCode]) || null;
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
