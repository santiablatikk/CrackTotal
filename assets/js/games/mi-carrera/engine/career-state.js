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

  function analyzeTrajectory(career) {
    var clubs = career.clubs || [];
    var seasons = career.seasons || [];
    var titles = career.titles || [];
    var awards = career.awards || [];
    var continents = {};
    var sawSA = false;
    var sawEU = false;
    var saToEu = false;
    var euToSa = false;
    seasons.forEach(function (s) {
      if (s.continent) continents[s.continent] = (continents[s.continent] || 0) + 1;
      if (s.continent === 'SA') {
        if (sawEU) euToSa = true;
        sawSA = true;
      }
      if (s.continent === 'EU') {
        if (sawSA) saToEu = true;
        sawEU = true;
      }
    });

    var peak = career.player.peakOverall || 0;
    var peakAge = null;
    seasons.forEach(function (s) {
      if ((s.overallAfter || 0) >= peak && peakAge == null) peakAge = s.ageAfter || s.age;
    });

    var giantSeasons = seasons.filter(function (s) {
      var club = NS.Providers && NS.Providers.clubs ? NS.Providers.clubs.getById(s.clubId) : null;
      if (!club) return false;
      var band = Engine.Rules.clubBand(club);
      return band === 'WORLD_GIANT' || band === 'CONTINENTAL_GIANT';
    });
    var giantFail =
      giantSeasons.length >= 2 &&
      giantSeasons.filter(function (s) {
        return (s.minutes || 0) < 900 || (s.rating || 0) < 6.5;
      }).length >=
        Math.ceil(giantSeasons.length * 0.6) &&
      peak < 84;
    var giantSuccess =
      giantSeasons.length >= 3 &&
      giantSeasons.filter(function (s) {
        return (s.minutes || 0) >= 1800 && (s.rating || 0) >= 7.0;
      }).length >= 2 &&
      peak >= 84;

    var shortSpells = clubs.filter(function (c) {
      return (c.seasons || 0) <= 1;
    }).length;
    var injurySeasons = (career.injuries || []).filter(function (i) {
      return (i.severity || 0) >= 2;
    }).length;
    var firstClubId = clubs[0] && clubs[0].clubId;
    var lastClubId = clubs.length ? clubs[clubs.length - 1].clubId : null;
    var homecoming =
      clubs.length >= 3 &&
      firstClubId &&
      lastClubId === firstClubId &&
      clubs.slice(1, -1).some(function (c) {
        return c.clubId !== firstClubId;
      });

    var midClubTitles = titles.filter(function (t) {
      var club = NS.Providers && NS.Providers.clubs ? NS.Providers.clubs.getById(t.clubId) : null;
      if (!club) return false;
      var rank = Engine.Rules.bandRank(Engine.Rules.clubBand(club));
      return rank <= 3;
    }).length;

    return {
      uniqueClubs: clubs.length,
      seasons: seasons.length,
      eu: continents.EU || 0,
      sa: continents.SA || 0,
      saToEu: saToEu,
      euToSa: euToSa,
      europeOnly: sawEU && !sawSA,
      saOnly: sawSA && !sawEU,
      peak: peak,
      peakAge: peakAge,
      retireAge: career.player.age,
      debutAge: seasons[0] ? seasons[0].age : career.careerStartAge || career.player.age,
      hasBallon: awards.some(function (a) {
        return a.awardId === 'ballon_dor';
      }),
      hasWC: titles.some(function (t) {
        return t.competitionId === 'fifa_world_cup';
      }),
      hasCL: titles.some(function (t) {
        return t.competitionId === 'uefa_cl';
      }),
      hasLib: titles.some(function (t) {
        return t.competitionId === 'conmebol_libertadores';
      }),
      hasCopaAmerica: titles.some(function (t) {
        return t.competitionId === 'conmebol_copa_america';
      }),
      hasEuro: titles.some(function (t) {
        return t.competitionId === 'uefa_euro';
      }),
      titles: titles.length,
      awards: awards.length,
      caps: (career.nationalTeam && career.nationalTeam.caps) || 0,
      growth: career.player.growthArchetype,
      hadComeback: !!(career.flags && career.flags.hadComeback),
      hadMajorInjury: !!(career.flags && career.flags.hadMajorInjury),
      injurySeasons: injurySeasons,
      giantFail: giantFail,
      giantSuccess: giantSuccess,
      giantSeasons: giantSeasons.length,
      homecoming: homecoming,
      shortSpells: shortSpells,
      midClubTitles: midClubTitles,
      transfers: (career.transfers || []).length,
      loans: (career.loans || []).length
    };
  }

  function deriveArchetype(career) {
    var t = analyzeTrajectory(career);
    var oneClub = t.uniqueClubs <= 1;
    var domesticHeavy =
      t.titles >= 4 &&
      !(t.hasCL || t.hasLib || t.hasWC) &&
      t.midClubTitles >= 2;

    if (t.hasBallon) return 'BALLON_DOR_WINNER';
    if (t.hasWC && t.caps >= 30) return 'WORLD_CHAMPION';
    if (oneClub && t.seasons >= 10 && t.titles >= 2) return 'ONE_CLUB_LEGEND';
    if (oneClub && t.seasons >= 8) return 'ONE_CLUB_MAN';
    if (oneClub && t.seasons >= 12) return 'CLUB_ICON';
    if (t.growth === 'wonderkid' && t.peak >= 86 && (t.peakAge == null || t.peakAge <= 24)) return 'WONDERKID';
    if (t.growth === 'wonderkid' && t.peak < 78) return 'FALLEN_WONDERKID';
    if (t.growth === 'late_bloomer' && t.peak >= 82) return 'LATE_BLOOMER';
    if (t.homecoming && t.peak >= 78) return 'HOMECOMING';
    if (t.saToEu && t.eu >= 5 && t.peak >= 84) return 'CONTINENTAL_BRIDGE';
    if (t.giantFail) return 'GIANT_FAILURE';
    if (t.giantSuccess && (t.hasCL || t.hasLib || t.peak >= 88)) return 'GIANT_SUCCESS';
    if (t.hadComeback && t.hadMajorInjury) return 'INJURY_COMEBACK';
    if (t.hadComeback) return 'COMEBACK';
    if (t.injurySeasons >= 5 || (t.hadMajorInjury && t.peak < 76 && t.seasons >= 12)) return 'INJURY_CAREER';
    if ((t.hasWC || t.hasCopaAmerica || t.hasEuro) && t.caps >= 40) return 'NATIONAL_HERO';
    if (t.saOnly && (t.hasLib || t.peak >= 84)) return 'SOUTH_AMERICAN_LEGEND';
    if (t.saOnly && t.seasons >= 12) return 'SOUTH_AMERICAN_CAREER';
    if (t.eu >= 8 && (t.hasCL || t.peak >= 88)) return 'EUROPEAN_STAR';
    if (domesticHeavy) return 'DOMESTIC_LEGEND';
    if (t.caps >= 50 || ((t.hasCopaAmerica || t.hasEuro) && t.caps >= 25)) return 'INTERNATIONAL_STAR';
    if (t.midClubTitles >= 2 && t.titles >= 3 && t.peak < 86) return 'UNDERDOG_CHAMPION';
    if (t.uniqueClubs <= 2 && t.seasons >= 10) return 'CLUB_ICON';
    if (t.titles >= 8) return 'TROPHY_HUNTER';
    // Mercenary / journeyman before the broad EUROPEAN_CAREER catch-all
    if (t.uniqueClubs >= 8 || (t.uniqueClubs >= 7 && t.shortSpells >= 4)) return 'MERCENARY';
    if (t.uniqueClubs >= 6) return 'JOURNEYMAN';
    if (t.europeOnly && t.seasons >= 12 && t.uniqueClubs <= 4) return 'EUROPEAN_CAREER';
    if (t.retireAge <= 32 && t.seasons <= 12) return 'SHORT_CAREER';
    if (t.retireAge <= 34 && t.seasons >= 8) return 'EARLY_RETIREMENT';
    if (t.retireAge >= 38 && t.seasons >= 18) return 'LONG_CAREER';
    if (t.peak >= 86 && (career.player.potential || 0) - t.peak > 3) return 'OVERACHIEVER';
    if (t.retireAge >= 36) return 'VETERAN';
    if (t.europeOnly && t.seasons >= 12) return 'EUROPEAN_CAREER';
    return 'CAREER_PLAYER';
  }

  Engine.State = {
    createCareer: createCareer,
    updateValue: updateValue,
    fingerprint: fingerprint,
    analyzeTrajectory: analyzeTrajectory,
    deriveArchetype: deriveArchetype,
    clamp: clamp
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
