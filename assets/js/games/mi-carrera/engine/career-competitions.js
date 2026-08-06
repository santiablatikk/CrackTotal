/**
 * Title resolution for domestic / continental competitions.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});
  var Rules = Engine.Rules;

  function domesticLeagueId(countryCode) {
    var map = {
      AR: 'ar_league',
      BR: 'br_league',
      GB: 'gb_league',
      ES: 'es_league',
      IT: 'it_league',
      DE: 'de_league',
      FR: 'fr_league',
      PT: 'pt_league',
      NL: 'nl_league',
      MX: 'mx_league',
      US: 'us_league'
    };
    return map[countryCode] || null;
  }

  function domesticCupId(countryCode) {
    var map = {
      AR: 'ar_copa',
      BR: 'br_copa',
      GB: 'gb_fa_cup',
      ES: 'es_copa',
      IT: 'it_copa',
      DE: 'de_copa',
      FR: 'fr_copa',
      PT: 'pt_copa'
    };
    return map[countryCode] || null;
  }

  function continentalClubIds(continent) {
    if (continent === 'EU') return ['uefa_cl', 'uefa_el', 'uefa_uecl'];
    if (continent === 'SA') return ['conmebol_libertadores', 'conmebol_sudamericana'];
    return [];
  }

  function winChance(base, playerImpact, clubPrestige, prestigeComp, rng) {
    var p = base * (0.55 + clubPrestige / 200) * (0.7 + playerImpact) * (1.15 - prestigeComp / 180);
    p = Math.max(0.002, Math.min(0.42, p));
    return rng.chance(p);
  }

  function resolveTitles(career, seasonStats, rng) {
    var club = NS.Providers.clubs.getById(career.currentClubId);
    if (!club) return [];
    var won = [];
    var roleBoost =
      career.role === 'star' || career.role === 'key_player' ? 0.35 : career.role === 'starter' ? 0.22 : 0.08;
    var playerImpact = roleBoost * Math.max(0.2, (seasonStats.minutes || 0) / 3000) * ((seasonStats.rating || 6.5) / 7.2);
    var band = Rules.clubBand(club);

    var leagueBase =
      band === 'WORLD_GIANT' || band === 'CONTINENTAL_GIANT' ? 0.22 : band === 'BIG' ? 0.14 : band === 'STRONG' ? 0.08 : 0.03;
    var leagueId = domesticLeagueId(club.countryCode);
    if (leagueId) {
      if (winChance(leagueBase, playerImpact, club.prestige, 72, rng)) {
        won.push({ competitionId: leagueId, rarity: 'notable' });
      }
    }

    var cupId = domesticCupId(club.countryCode);
    if (cupId && winChance(leagueBase * 0.85, playerImpact, club.prestige, 70, rng)) {
      won.push({ competitionId: cupId, rarity: 'normal' });
    }

    // Continental access roughly by band
    var cont = continentalClubIds(club.continent);
    if (cont.length) {
      var inCL = band === 'WORLD_GIANT' || band === 'CONTINENTAL_GIANT' || (band === 'BIG' && rng.chance(0.55));
      var inEL = !inCL && (band === 'BIG' || band === 'STRONG' || (band === 'MID' && rng.chance(0.25)));
      if (club.continent === 'EU') {
        var clBase = band === 'WORLD_GIANT' ? 0.09 : band === 'CONTINENTAL_GIANT' ? 0.055 : 0.02;
        if (inCL && winChance(clBase, playerImpact, club.prestige, 98, rng)) won.push({ competitionId: 'uefa_cl', rarity: 'legendary' });
        else if ((inCL || inEL) && winChance(0.1, playerImpact, club.prestige, 86, rng)) won.push({ competitionId: 'uefa_el', rarity: 'major' });
        else if (!inCL && winChance(0.07, playerImpact, club.prestige, 74, rng)) won.push({ competitionId: 'uefa_uecl', rarity: 'notable' });
      } else if (club.continent === 'SA') {
        var inLib = band === 'CONTINENTAL_GIANT' || band === 'BIG' || (band === 'STRONG' && rng.chance(0.45));
        var libBase = band === 'CONTINENTAL_GIANT' || band === 'BIG' ? 0.09 : 0.04;
        if (inLib && winChance(libBase, playerImpact, club.prestige, 94, rng)) won.push({ competitionId: 'conmebol_libertadores', rarity: 'legendary' });
        else if (winChance(0.09, playerImpact, club.prestige, 80, rng)) won.push({ competitionId: 'conmebol_sudamericana', rarity: 'major' });
      }
    }

    // Club World Cup only after major continental
    if (
      won.some(function (w) {
        return w.competitionId === 'uefa_cl' || w.competitionId === 'conmebol_libertadores';
      }) &&
      rng.chance(0.28)
    ) {
      if (winChance(0.2, playerImpact, club.prestige, 90, rng)) won.push({ competitionId: 'fifa_club_world_cup', rarity: 'legendary' });
    }

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
    domesticLeagueId: domesticLeagueId
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
