/**
 * Club spell history and retirement legacy packaging.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});

  function ensureClubSpell(career, clubId, transferType) {
    var last = career.clubs[career.clubs.length - 1];
    if (last && last.clubId === clubId && !last.closed) return last;
    var spell = {
      clubId: clubId,
      ageStart: career.player.age,
      ageEnd: null,
      seasons: 0,
      appearances: 0,
      goals: 0,
      assists: 0,
      titles: 0,
      rolePeak: career.role,
      transferType: transferType || 'start',
      closed: false
    };
    career.clubs.push(spell);
    return spell;
  }

  function closeCurrentSpell(career) {
    var last = career.clubs[career.clubs.length - 1];
    if (last && !last.closed) {
      last.ageEnd = career.player.age;
      last.closed = true;
    }
  }

  function applySeasonToSpell(career, season) {
    var spell = ensureClubSpell(career, career.currentClubId, 'continue');
    spell.seasons += 1;
    spell.appearances += season.matches || 0;
    spell.goals += season.goals || 0;
    spell.assists += season.assists || 0;
    spell.titles += (season.titles || []).length;
    var order = Engine.Rules.ROLE_ORDER;
    if (order.indexOf(career.role) > order.indexOf(spell.rolePeak || 'youth_prospect')) {
      spell.rolePeak = career.role;
    }
  }

  function buildLegacy(career) {
    closeCurrentSpell(career);
    var archetype = Engine.State.deriveArchetype(career);
    var traj = Engine.State.analyzeTrajectory(career);
    var totals = {
      seasons: career.seasons.length,
      appearances: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      titles: career.titles.length,
      awards: career.awards.length,
      clubs: career.clubs.length,
      peakOverall: career.player.peakOverall,
      peakAge: traj.peakAge,
      debutAge: traj.debutAge,
      retireAge: career.player.age,
      nationalCaps: career.nationalTeam.caps,
      nationalGoals: career.nationalTeam.goals
    };
    career.seasons.forEach(function (s) {
      totals.appearances += s.matches || 0;
      totals.goals += s.goals || 0;
      totals.assists += s.assists || 0;
      totals.cleanSheets += s.cleanSheets || 0;
    });

    var bestSeason = null;
    career.seasons.forEach(function (s) {
      var score = (s.rating || 0) * 10 + (s.goals || 0) + (s.assists || 0) * 0.8 + (s.titles || []).length * 5;
      if (!bestSeason || score > bestSeason._score) {
        bestSeason = Object.assign({ _score: score }, s);
      }
    });

    career.legacy = {
      archetype: archetype,
      fingerprint: Engine.State.fingerprint(career),
      totals: totals,
      timeline: career.clubs.map(function (c) {
        return {
          clubId: c.clubId,
          ageStart: c.ageStart,
          ageEnd: c.ageEnd,
          seasons: c.seasons,
          transferType: c.transferType
        };
      }),
      bestSeason: bestSeason
        ? {
            seasonYear: bestSeason.seasonYear,
            clubId: bestSeason.clubId,
            rating: bestSeason.rating,
            goals: bestSeason.goals,
            assists: bestSeason.assists
          }
        : null,
      titles: career.titles.slice(),
      awards: career.awards.slice(),
      moments: career.moments.slice()
    };
    return career.legacy;
  }

  Engine.History = {
    ensureClubSpell: ensureClubSpell,
    closeCurrentSpell: closeCurrentSpell,
    applySeasonToSpell: applySeasonToSpell,
    buildLegacy: buildLegacy
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
