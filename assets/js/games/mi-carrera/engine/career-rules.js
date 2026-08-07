/**
 * Constants and hard gates for Mi Carrera engine.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});

  var POSITION_MAP = {
    POR: 'GK',
    GK: 'GK',
    DFC: 'CB',
    CB: 'CB',
    LD: 'RB',
    RB: 'RB',
    LI: 'LB',
    LB: 'LB',
    MCD: 'DM',
    DM: 'DM',
    MC: 'CM',
    CM: 'CM',
    MCO: 'AM',
    AM: 'AM',
    EI: 'LW',
    LW: 'LW',
    ED: 'RW',
    RW: 'RW',
    DC: 'ST',
    ST: 'ST'
  };

  var OUTFIELD = { CB: 1, LB: 1, RB: 1, DM: 1, CM: 1, AM: 1, LW: 1, RW: 1, ST: 1 };

  var GROWTH_ARCHETYPES = [
    'wonderkid',
    'normal',
    'late_bloomer',
    'early_peak',
    'long_prime',
    'early_decline',
    'volatile'
  ];

  var ROLE_ORDER = [
    'youth_prospect',
    'rotation',
    'substitute',
    'regular',
    'starter',
    'key_player',
    'star',
    'captain',
    'veteran_leader'
  ];

  function normalizePosition(pos) {
    return POSITION_MAP[String(pos || '').toUpperCase()] || 'CM';
  }

  function isGoalkeeper(pos) {
    return normalizePosition(pos) === 'GK';
  }

  function isOutfield(pos) {
    return !!OUTFIELD[normalizePosition(pos)];
  }

  function clubBand(club) {
    var p = (club && club.prestige) || 50;
    var t = (club && club.tier) || 3;
    if (t >= 7 || p >= 95) return 'WORLD_GIANT';
    if (t >= 6 || p >= 86) return 'CONTINENTAL_GIANT';
    if (t >= 5 || p >= 78) return 'BIG';
    if (t >= 4 || p >= 68) return 'STRONG';
    if (t >= 3 || p >= 58) return 'MID';
    if ((club.tags || []).indexOf('youth_factory') !== -1) return 'DEVELOPMENT';
    return 'SMALL';
  }

  function footballTier(club) {
    if (Engine.Eligibility && Engine.Eligibility.footballTier) {
      return Engine.Eligibility.footballTier(club);
    }
    var band = clubBand(club);
    if (band === 'WORLD_GIANT') return 'S';
    if (band === 'CONTINENTAL_GIANT') return 'A';
    if (band === 'BIG') return 'B';
    if (band === 'STRONG' || band === 'MID') return 'C';
    return 'D';
  }

  function bandRank(band) {
    return (
      {
        WORLD_GIANT: 7,
        CONTINENTAL_GIANT: 6,
        BIG: 5,
        STRONG: 4,
        MID: 3,
        DEVELOPMENT: 2,
        SMALL: 1
      }[band] || 1
    );
  }

  function agePhase(age) {
    if (age <= 18) return 'youth';
    if (age <= 21) return 'development';
    if (age <= 25) return 'growth';
    if (age <= 29) return 'prime';
    if (age <= 32) return 'late_prime';
    if (age <= 35) return 'decline';
    return 'veteran';
  }

  function maxClubBandForPlayer(player) {
    var ovr = player.overall;
    var age = player.age;
    var rep = player.reputation || 0;
    if (ovr < 62) return 'MID';
    if (ovr < 70) return 'STRONG';
    if (ovr < 76) return age <= 20 ? 'BIG' : 'STRONG';
    if (ovr < 80) return age <= 21 ? 'BIG' : 'CONTINENTAL_GIANT';
    if (ovr < 84) return 'CONTINENTAL_GIANT';
    if (ovr < 88 || rep < 70) return age >= 33 ? 'CONTINENTAL_GIANT' : 'WORLD_GIANT';
    return 'WORLD_GIANT';
  }

  function canJoinClub(player, club) {
    if (!player || !club) return false;
    var need = bandRank(clubBand(club));
    var max = bandRank(maxClubBandForPlayer(player));
    if (need > max) return false;
    // Giants demand compatible level — no constant incompatible signings
    var gap = (club.squadStrength || club.prestige || 70) - player.overall;
    if (need >= 7 && gap > 10) return false;
    if (need >= 6 && gap > 14) return false;
    if (player.overall < 58 && need >= 5) return false;
    if (player.age <= 17 && need >= 7 && player.overall < 78) return false;
    if (player.age >= 34 && need >= 7 && player.overall < 86) return false;
    // Mid players cannot leap D→S without already being near the bar
    if (need >= 7 && player.overall < 84) return false;
    if (need >= 6 && player.overall < 78 && player.age > 22) return false;
    return true;
  }

  function expectedMinutes(role) {
    return (
      {
        youth_prospect: 8,
        rotation: 14,
        substitute: 18,
        regular: 26,
        starter: 32,
        key_player: 34,
        star: 35,
        captain: 33,
        veteran_leader: 28
      }[role] || 20
    );
  }

  function roleFromContext(player, club, rng) {
    var gap = ((club && club.squadStrength) || 70) - player.overall;
    var age = player.age;
    var form = player.form || 50;
    var trust = player.managerTrust || 50;

    if (age <= 18 && gap > 12) return 'youth_prospect';
    if (gap > 16) return rng.chance(0.55) ? 'youth_prospect' : 'substitute';
    if (gap > 10) return form > 60 ? 'rotation' : 'substitute';
    if (gap > 5) return form > 55 ? 'regular' : 'rotation';
    if (gap > 0) return form > 65 && trust > 55 ? 'starter' : 'regular';
    if (player.overall >= 86 && form >= 70) return age >= 30 ? 'captain' : 'star';
    if (player.overall >= 82) return 'key_player';
    if (age >= 33 && player.overall >= 74) return 'veteran_leader';
    return 'starter';
  }

  Engine.Rules = {
    POSITION_MAP: POSITION_MAP,
    GROWTH_ARCHETYPES: GROWTH_ARCHETYPES,
    ROLE_ORDER: ROLE_ORDER,
    normalizePosition: normalizePosition,
    isGoalkeeper: isGoalkeeper,
    isOutfield: isOutfield,
    clubBand: clubBand,
    footballTier: footballTier,
    bandRank: bandRank,
    agePhase: agePhase,
    maxClubBandForPlayer: maxClubBandForPlayer,
    canJoinClub: canJoinClub,
    expectedMinutes: expectedMinutes,
    roleFromContext: roleFromContext,
    SEASON_MATCHES: 38,
    RETIRE_SOFT_AGE: 34,
    RETIRE_HARD_AGE: 40,
    BALLON_MIN_OVR: 89,
    BALLON_MIN_REP: 88
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
