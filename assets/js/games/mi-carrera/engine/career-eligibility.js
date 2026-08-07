/**
 * Centralized football eligibility: club → league → country → competitions.
 * Does not rewrite the engine; competitions/market call into this layer.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});
  var Rules = Engine.Rules;

  var TOP_DOMESTIC_LEAGUE = {
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

  var DOMESTIC_CUP = {
    AR: 'ar_copa',
    BR: 'br_copa',
    GB: 'gb_fa_cup',
    ES: 'es_copa',
    IT: 'it_copa',
    DE: 'de_copa',
    FR: 'fr_copa',
    PT: 'pt_copa'
  };

  var CONTINENTAL = {
    EU: {
      top: 'uefa_cl',
      secondary: 'uefa_el',
      tertiary: 'uefa_uecl',
      all: ['uefa_cl', 'uefa_el', 'uefa_uecl']
    },
    SA: {
      top: 'conmebol_libertadores',
      secondary: 'conmebol_sudamericana',
      tertiary: null,
      all: ['conmebol_libertadores', 'conmebol_sudamericana']
    }
  };

  function getLeague(club) {
    if (!club) return null;
    return NS.Providers.clubs.getLeague(club.leagueId);
  }

  function leagueLevel(club) {
    var league = getLeague(club);
    var level = league && league.level != null ? Number(league.level) : 1;
    return level >= 1 ? level : 1;
  }

  function isTopDivision(club) {
    return leagueLevel(club) === 1;
  }

  function footballTier(club) {
    var band = Rules.clubBand(club);
    var level = leagueLevel(club);
    // Second division never reads as world elite while not in top flight
    if (level >= 2) {
      if (band === 'WORLD_GIANT' || band === 'CONTINENTAL_GIANT') return 'B';
      if (band === 'BIG' || band === 'STRONG') return 'C';
      return 'D';
    }
    if (band === 'WORLD_GIANT') return 'S';
    if (band === 'CONTINENTAL_GIANT') return 'A';
    if (band === 'BIG') return 'B';
    if (band === 'STRONG' || band === 'MID') return 'C';
    return 'D';
  }

  function tierRank(tier) {
    return { S: 5, A: 4, B: 3, C: 2, D: 1 }[tier] || 1;
  }

  function describeClub(club) {
    if (!club) return null;
    var league = getLeague(club);
    var level = leagueLevel(club);
    var band = Rules.clubBand(club);
    var tier = footballTier(club);
    var cont = CONTINENTAL[club.continent] || null;
    var topDiv = level === 1;
    var bandR = Rules.bandRank(band);

    var canTopDomestic = topDiv && !!TOP_DOMESTIC_LEAGUE[club.countryCode];
    var canCup = !!DOMESTIC_CUP[club.countryCode];
    // Continental: only top division. Access by sporting band, not raw prestige alone.
    var canContinentalTop = topDiv && (bandR >= 6 || (bandR >= 5 && (club.prestige || 0) >= 80));
    var canContinentalSecondary = topDiv && bandR >= 4;
    var canContinentalTertiary = topDiv && club.continent === 'EU' && bandR >= 3 && bandR <= 5;

    return {
      clubId: club.id,
      name: club.name,
      countryCode: club.countryCode,
      continent: club.continent,
      leagueId: club.leagueId,
      leagueName: league ? league.name : club.league || '',
      leagueLevel: level,
      prestige: club.prestige,
      band: band,
      footballTier: tier,
      canWinTopDomesticLeague: canTopDomestic,
      canCompeteSecondDivision: level >= 2,
      canWinDomesticCup: canCup,
      canPlayContinental: topDiv && !!cont,
      canPlayContinentalTop: canContinentalTop,
      canPlayContinentalSecondary: canContinentalSecondary,
      canPlayContinentalTertiary: canContinentalTertiary,
      continentalIds: cont ? cont.all.slice() : [],
      topDomesticCompetitionId: TOP_DOMESTIC_LEAGUE[club.countryCode] || null,
      domesticCupCompetitionId: DOMESTIC_CUP[club.countryCode] || null
    };
  }

  function canCompeteIn(club, competitionId) {
    if (!club || !competitionId) return false;
    var e = describeClub(club);
    var id = competitionId;

    if (id === e.topDomesticCompetitionId) return e.canWinTopDomesticLeague;
    if (id === e.domesticCupCompetitionId) return e.canWinDomesticCup;

    if (id === 'fifa_club_world_cup') {
      // Only reachable after winning top continental that season (checked in competitions)
      return e.canPlayContinentalTop;
    }

    if (e.continent === 'EU') {
      if (id === 'uefa_cl') return e.canPlayContinentalTop;
      if (id === 'uefa_el') return e.canPlayContinentalSecondary;
      if (id === 'uefa_uecl') return e.canPlayContinentalTertiary || e.canPlayContinentalSecondary;
      if (id === 'uefa_super_cup') return e.canPlayContinentalTop;
    }
    if (e.continent === 'SA') {
      if (id === 'conmebol_libertadores') return e.canPlayContinentalTop;
      if (id === 'conmebol_sudamericana') return e.canPlayContinentalSecondary;
      if (id === 'conmebol_recopa') return e.canPlayContinentalTop;
    }

    // National team tournaments are not club competitions
    if (
      id === 'fifa_world_cup' ||
      id === 'uefa_euro' ||
      id === 'conmebol_copa_america' ||
      id === 'caf_afcon' ||
      id === 'afc_asian_cup' ||
      id === 'concacaf_gold_cup'
    ) {
      return false;
    }

    return false;
  }

  function playerHomeContinent(career) {
    var code = career && career.player && career.player.country;
    var meta = null;
    if (NS.Providers.flags && NS.Providers.flags.getCountry) {
      meta = NS.Providers.flags.getCountry(code);
    }
    if (!meta && NS.data && NS.data.countries && NS.data.countries.countries) {
      var list = NS.data.countries.countries;
      for (var i = 0; i < list.length; i++) {
        if (list[i].code === code) {
          meta = list[i];
          break;
        }
      }
    }
    return meta ? meta.continent : null;
  }

  /**
   * Whether a move from current club to target is football-credible.
   */
  function isCredibleInternationalMove(career, fromClub, toClub) {
    if (!career || !fromClub || !toClub) return false;
    if (fromClub.continent === toClub.continent) return true;

    var p = career.player;
    var home = playerHomeContinent(career);
    var last = (career.seasons && career.seasons[career.seasons.length - 1]) || {};
    var lowMinutes = (last.minutes || 0) < 1500;
    var cold = (last.rating || 6.5) < 6.6 || (p.form || 50) < 48;
    var declining = (p.peakOverall || p.overall) - p.overall >= 4;
    var crisis = career.careerArc && career.careerArc.indexOf('crisis') !== -1;
    var fromRank = Rules.bandRank(Rules.clubBand(fromClub));
    var toRank = Rules.bandRank(Rules.clubBand(toClub));

    // SA → EU: classic pathway
    if (fromClub.continent === 'SA' && toClub.continent === 'EU') {
      if (p.overall < 72 && p.age > 24) return false;
      if (p.overall < 68) return false;
      return true;
    }

    // EU → SA
    if (fromClub.continent === 'EU' && toClub.continent === 'SA') {
      var goingHome = home === 'SA' && toClub.countryCode === p.country;
      var regionalHome = home === 'SA' && toClub.continent === 'SA';

      // European-origin player: only late-career / soft landing
      if (home === 'EU' || home === 'NA' || home === 'AS' || home === 'AF' || home === 'OC') {
        if (p.age < 32) return false;
        if (!(declining || cold || lowMinutes || crisis)) return false;
        if (toRank > fromRank) return false;
        return true;
      }

      // South American abroad returning
      if (regionalHome || goingHome) {
        // Block young peak returns: 23yo + good OVR + competitive EU club → weak SA
        if (p.age < 26 && p.overall >= 76 && fromRank >= 4 && !lowMinutes && !cold) return false;
        if (p.age < 28 && p.overall >= 80 && fromRank >= 5 && (p.form || 50) >= 60 && !lowMinutes) return false;

        // Valid contexts
        if (p.age >= 29) return true;
        if (goingHome && p.age >= 27) return true;
        if (lowMinutes && (cold || career.role === 'substitute' || career.role === 'rotation')) return true;
        if (declining || crisis) return true;
        if (p.age >= 27 && toClub.countryCode === p.country && toRank >= 4) return true;
        return false;
      }

      return false;
    }

    // Other intercontinental: rare, only veterans / soft landings
    if (p.age < 30 && p.overall >= 75) return false;
    return p.age >= 31 || declining || cold;
  }

  Engine.Eligibility = {
    TOP_DOMESTIC_LEAGUE: TOP_DOMESTIC_LEAGUE,
    DOMESTIC_CUP: DOMESTIC_CUP,
    CONTINENTAL: CONTINENTAL,
    getLeague: getLeague,
    leagueLevel: leagueLevel,
    isTopDivision: isTopDivision,
    footballTier: footballTier,
    tierRank: tierRank,
    describeClub: describeClub,
    canCompeteIn: canCompeteIn,
    playerHomeContinent: playerHomeContinent,
    isCredibleInternationalMove: isCredibleInternationalMove
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
