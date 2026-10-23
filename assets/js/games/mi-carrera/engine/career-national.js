/**
 * National team progression and major tournaments.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});

  var CONFED_TOURNAMENT = {
    CONMEBOL: 'conmebol_copa_america',
    UEFA: 'uefa_euro',
    CAF: 'caf_afcon',
    AFC: 'afc_asian_cup',
    CONCACAF: 'concacaf_gold_cup'
  };

  function countryMeta(code) {
    var list = (NS.data && NS.data.countries && NS.data.countries.countries) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].code === code) return list[i];
    }
    return null;
  }

  function countryStrength(code) {
    var elites = { AR: 92, BR: 93, FR: 91, ES: 90, DE: 89, GB: 88, PT: 86, NL: 85, UY: 84, HR: 83, IT: 87, BE: 84 };
    return elites[code] || 72;
  }

  function advanceStatus(nt, p, seasonStats, rng) {
    var str = countryStrength(p.country);
    var gap = str - p.overall;
    var minutes = seasonStats.minutes || 0;
    var rating = seasonStats.rating || 0;
    var formOk = rating >= 6.75 && minutes >= 900;
    var solid = rating >= 7.0 && minutes >= 1500;

    if (nt.status === 'uncapped') {
      if (p.age <= 21 && p.overall >= 66 && formOk && rng.chance(0.4)) nt.status = 'youth_prospect';
      else if (p.overall >= 72 && formOk && gap <= 22 && rng.chance(0.32)) nt.status = 'called_up';
      else if (p.overall >= 78 && solid && rng.chance(0.45)) nt.status = 'called_up';
      else if (p.overall >= 82 && minutes >= 1800 && rng.chance(0.5)) nt.status = 'called_up';
      return;
    }
    if (nt.status === 'youth_prospect') {
      if (p.overall >= 72 && formOk && rng.chance(0.42)) nt.status = 'called_up';
      else if (!formOk && rng.chance(0.15)) nt.status = 'uncapped';
      return;
    }
    if (nt.status === 'called_up') {
      if (formOk && p.overall >= 76 && rng.chance(0.45)) nt.status = 'rotation';
      else if (!formOk && rng.chance(0.2)) nt.status = 'uncapped';
      return;
    }
    if (nt.status === 'rotation') {
      if (solid && p.overall >= 80 && rng.chance(0.38)) nt.status = 'starter';
      else if (!formOk && rng.chance(0.18)) nt.status = 'called_up';
      return;
    }
    if (nt.status === 'starter') {
      if (p.overall >= 85 && rating >= 7.2 && nt.caps >= 20 && rng.chance(0.28)) nt.status = 'star';
      else if (!formOk && rng.chance(0.16)) nt.status = 'rotation';
      return;
    }
    if (nt.status === 'star') {
      if (nt.caps >= 55 && p.age >= 29) nt.status = 'legend';
      else if (rating < 6.5 && rng.chance(0.15)) nt.status = 'starter';
    }
  }

  function resolveNationalSeason(career, seasonStats, rng) {
    var p = career.player;
    var nt = career.nationalTeam;
    var meta = countryMeta(p.country);
    var confed = (meta && meta.confederation) || 'UEFA';
    var result = {
      caps: 0,
      goals: 0,
      worldCupPlayed: false,
      worldCupWon: false,
      continentalPlayed: false,
      continentalWon: false,
      titles: []
    };

    advanceStatus(nt, p, seasonStats, rng);

    if (nt.status === 'uncapped' || nt.status === 'youth_prospect') return result;

    var baseCaps =
      nt.status === 'legend' || nt.status === 'star' ? rng.int(6, 12) : nt.status === 'starter' ? rng.int(4, 9) : nt.status === 'rotation' ? rng.int(2, 6) : rng.int(1, 3);
    if ((seasonStats.injurySeverity || 0) >= 2) baseCaps = Math.max(0, baseCaps - rng.int(2, 5));
    result.caps = baseCaps;
    nt.caps += baseCaps;

    if (!Engine.Rules.isGoalkeeper(p.position) && baseCaps > 0) {
      result.goals = Math.max(0, Math.round(baseCaps * (p.position === 'ST' ? 0.35 : p.position === 'AM' || p.position === 'RW' || p.position === 'LW' ? 0.2 : 0.08) * ((seasonStats.rating || 6.5) / 7)));
      nt.goals += result.goals;
    }

    if (nt.status === 'called_up' && nt.caps <= baseCaps) {
      Engine.Events.pushMoment(career, 'debut_national_team', { caps: nt.caps });
    }

    // Major tournaments every 2/4 years by calendar
    var year = career.seasonYear;
    var worldCupYear = year % 4 === 2;
    var continentalYear = year % 4 === 0 || year % 4 === 1;

    var tournamentEligible = ['called_up', 'rotation', 'starter', 'star', 'legend'].indexOf(nt.status) !== -1;

    if (worldCupYear && tournamentEligible && rng.chance(nt.status === 'called_up' ? 0.35 : 0.8)) {
      result.worldCupPlayed = true;
      var wcWinChance = countryStrength(p.country) >= 90 ? 0.2 : countryStrength(p.country) >= 85 ? 0.1 : 0.03;
      if (nt.status === 'star' || nt.status === 'legend') wcWinChance += 0.05;
      if (rng.chance(wcWinChance)) {
        result.worldCupWon = true;
        result.titles.push({
          competitionId: 'fifa_world_cup',
          rarity: 'mythic',
          seasonIndex: career.seasonIndex,
          seasonYear: year,
          age: p.age,
          clubId: career.currentClubId
        });
        Engine.Events.pushMoment(career, 'world_cup', { won: true });
      } else {
        Engine.Events.pushMoment(career, 'world_cup', { won: false });
      }
      nt.tournaments.push({ id: 'fifa_world_cup', year: year, won: result.worldCupWon });
    }

    var contId = CONFED_TOURNAMENT[confed];
    if (continentalYear && contId && tournamentEligible && rng.chance(nt.status === 'called_up' ? 0.4 : 0.75)) {
      result.continentalPlayed = true;
      var cChance = countryStrength(p.country) >= 88 ? 0.28 : countryStrength(p.country) >= 82 ? 0.14 : 0.06;
      if (nt.status === 'star' || nt.status === 'legend') cChance += 0.06;
      if (rng.chance(cChance)) {
        result.continentalWon = true;
        result.titles.push({
          competitionId: contId,
          rarity: 'legendary',
          seasonIndex: career.seasonIndex,
          seasonYear: year,
          age: p.age,
          clubId: career.currentClubId
        });
        Engine.Events.pushMoment(career, 'continental_title', { competitionId: contId });
      }
      nt.tournaments.push({ id: contId, year: year, won: result.continentalWon });
    }

    return result;
  }

  Engine.National = {
    resolveNationalSeason: resolveNationalSeason,
    countryStrength: countryStrength
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
