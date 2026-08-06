/**
 * Career state factory and fingerprint helpers.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});
  var Rules = Engine.Rules;

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function createPlayer(input, rng) {
    var age = clamp(Number(input.age) || 17, 16, 19);
    var position = Rules.normalizePosition(input.position || 'CM');
    var growth = rng.pick(Rules.GROWTH_ARCHETYPES);
    var potentialBase =
      growth === 'wonderkid'
        ? rng.int(84, 94)
        : growth === 'late_bloomer'
          ? rng.int(80, 91)
          : growth === 'long_prime'
            ? rng.int(78, 90)
            : rng.int(74, 88);
    if (growth === 'early_peak') potentialBase = Math.min(potentialBase, rng.int(78, 86));
    var startOvr =
      age <= 16 ? rng.int(54, 64) : age === 17 ? rng.int(56, 66) : age === 18 ? rng.int(58, 68) : rng.int(60, 70);
    if (growth === 'wonderkid') startOvr += rng.int(2, 6);

    return {
      id: input.id || 'p_' + rng.seed,
      name: String(input.name || 'Jugador').trim() || 'Jugador',
      country: String(input.country || 'AR').toUpperCase(),
      birthYear: (input.seasonYear || 2026) - age,
      age: age,
      position: position,
      profile: input.profile || 'normal',
      overall: clamp(startOvr, 48, 72),
      potential: clamp(potentialBase, startOvr + 8, 94),
      form: rng.int(45, 60),
      confidence: rng.int(40, 58),
      fitness: rng.int(85, 100),
      value: 0,
      reputation: rng.int(10, 25),
      managerTrust: rng.int(40, 55),
      growthArchetype: growth,
      peakOverall: startOvr,
      injury: { status: 'healthy', weeks: 0 },
      momentum: 0
    };
  }

  function createCareer(input, rng) {
    var seasonYear = input.seasonYear || 2026;
    var player = createPlayer(
      {
        id: input.id,
        name: input.name,
        country: input.country,
        age: input.age,
        position: input.position,
        profile: input.profile,
        seasonYear: seasonYear
      },
      rng
    );

    return {
      version: 2,
      seed: rng.seed,
      status: 'active',
      seasonYear: seasonYear,
      seasonIndex: 0,
      player: player,
      currentClubId: null,
      currentLeagueId: null,
      role: 'youth_prospect',
      contractYears: 0,
      onLoan: false,
      loanFromClubId: null,
      loanReturnAtSeason: null,
      seasons: [],
      clubs: [],
      transfers: [],
      loans: [],
      titles: [],
      awards: [],
      nationalTeam: {
        status: 'uncapped',
        caps: 0,
        goals: 0,
        tournaments: []
      },
      injuries: [],
      milestones: [],
      moments: [],
      crisis: { active: false, kind: null, seasons: 0 },
      comeback: { active: false, fromOverall: null, achieved: false },
      careerArc: [],
      legacy: null,
      marketMemory: {
        recentClubIds: [],
        rejectedClubIds: [],
        lastOfferFingerprints: [],
        yearsAtClub: 0
      },
      flags: {
        hadMajorInjury: false,
        hadComeback: false,
        playedEurope: false,
        playedSouthAmerica: false,
        wonBallon: false
      }
    };
  }

  function updateValue(career) {
    var p = career.player;
    var ageFactor = p.age <= 23 ? 1.25 : p.age <= 28 ? 1.1 : p.age <= 32 ? 0.85 : 0.55;
    var formFactor = 0.7 + (p.form || 50) / 200;
    p.value = Math.round(Math.pow(Math.max(1, p.overall - 45), 2.15) * ageFactor * formFactor * 10000);
  }

  function fingerprint(career) {
    var clubs = (career.clubs || []).map(function (c) {
      return c.clubId;
    });
    var regions = {};
    (career.seasons || []).forEach(function (s) {
      if (s.continent) regions[s.continent] = 1;
    });
    var titleTypes = (career.titles || []).map(function (t) {
      return t.competitionId;
    });
    var awards = (career.awards || []).map(function (a) {
      return a.awardId;
    });
    var ages = (career.seasons || []).map(function (s) {
      return s.overallAfter - s.overallBefore;
    });
    var curve = ages
      .map(function (d) {
        return d > 1 ? 'U' : d < 0 ? 'D' : 'F';
      })
      .join('');

    return [
      clubs.join('>'),
      Object.keys(regions).sort().join(','),
      'T' + titleTypes.length,
      'A' + awards.length,
      'NT' + (career.nationalTeam && career.nationalTeam.status),
      'C' + curve.slice(0, 24),
      'L' + (career.seasons || []).length,
      'P' + (career.player && career.player.peakOverall),
      career.flags && career.flags.hadComeback ? 'CB1' : 'CB0'
    ].join('|');
  }

  function deriveArchetype(career) {
    var clubs = career.clubs || [];
    var seasons = career.seasons || [];
    var titles = career.titles || [];
    var awards = career.awards || [];
    var uniqueClubs = clubs.length;
    var continents = {};
    seasons.forEach(function (s) {
      if (s.continent) continents[s.continent] = (continents[s.continent] || 0) + 1;
    });
    var eu = continents.EU || 0;
    var sa = continents.SA || 0;
    var hasBallon = awards.some(function (a) {
      return a.awardId === 'ballon_dor';
    });
    var hasWC = titles.some(function (t) {
      return t.competitionId === 'fifa_world_cup';
    });
    var hasCL = titles.some(function (t) {
      return t.competitionId === 'uefa_cl';
    });
    var hasLib = titles.some(function (t) {
      return t.competitionId === 'conmebol_libertadores';
    });
    var peak = career.player.peakOverall || 0;
    var startPot = career.player.potential || 0;

    if (hasBallon) return 'BALLON_DOR_WINNER';
    if (hasWC && (career.nationalTeam.caps || 0) >= 40) return 'WORLDCUP_HERO';
    if (uniqueClubs <= 1 && seasons.length >= 10 && titles.length >= 2) return 'ONE_CLUB_LEGEND';
    if (uniqueClubs <= 1 && seasons.length >= 12) return 'ONE_CLUB_MAN';
    if (uniqueClubs >= 6) return 'JOURNEYMAN';
    if (career.flags.hadComeback) return 'COMEBACK';
    if (eu >= 8 && (hasCL || peak >= 88)) return 'EUROPEAN_STAR';
    if (sa >= 8 && eu === 0 && (hasLib || peak >= 84)) return 'SOUTH_AMERICAN_KING';
    if (career.player.growthArchetype === 'wonderkid' && peak < 78) return 'FALLEN_PRODIGY';
    if (career.player.growthArchetype === 'late_bloomer' && peak >= 82) return 'LATE_BLOOMER';
    if (career.player.growthArchetype === 'wonderkid' && peak >= 86) return 'WONDERKID';
    if (titles.length >= 8) return 'TROPHY_HUNTER';
    if (uniqueClubs <= 2 && seasons.length >= 10) return 'CULT_HERO';
    if ((career.player.age || 0) >= 36) return 'VETERAN';
    if (peak >= 86 && startPot - peak > 4) return 'OVERACHIEVER';
    return 'CAREER_PLAYER';
  }

  Engine.State = {
    createCareer: createCareer,
    updateValue: updateValue,
    fingerprint: fingerprint,
    deriveArchetype: deriveArchetype,
    clamp: clamp
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
