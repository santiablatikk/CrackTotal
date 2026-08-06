/**
 * Age, overall, role, form and confidence progression.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});
  var Rules = Engine.Rules;
  var clamp = Engine.State.clamp;

  function growthBias(archetype, age) {
    switch (archetype) {
      case 'wonderkid':
        return age <= 22 ? 1.35 : age <= 27 ? 1.05 : 0.75;
      case 'late_bloomer':
        return age <= 22 ? 0.7 : age <= 28 ? 1.35 : 1.0;
      case 'early_peak':
        return age <= 24 ? 1.25 : age <= 28 ? 0.7 : 0.55;
      case 'long_prime':
        return age <= 25 ? 1.0 : age <= 32 ? 1.15 : 0.8;
      case 'early_decline':
        return age <= 26 ? 1.05 : 0.55;
      case 'volatile':
        return 0.85 + Math.random() * 0; // replaced by rng in caller
      default:
        return 1;
    }
  }

  function computeOverallDelta(career, seasonStats, rng) {
    var p = career.player;
    var age = p.age;
    var minutes = seasonStats.minutes || 0;
    var matches = seasonStats.matches || 0;
    var rating = seasonStats.rating || 6.5;
    var injured = seasonStats.injurySeverity || 0;
    var phase = Rules.agePhase(age);
    var arch = p.growthArchetype;
    var bias = growthBias(arch, age);
    if (arch === 'volatile') bias = rng.float(0.6, 1.4);

    var minutesFactor = minutes >= 2500 ? 1.25 : minutes >= 1600 ? 1.1 : minutes >= 900 ? 0.85 : minutes >= 400 ? 0.45 : 0.2;
    var ratingFactor = rating >= 7.4 ? 1.3 : rating >= 7.0 ? 1.15 : rating >= 6.6 ? 1.0 : 0.65;
    var room = Math.max(0, p.potential - p.overall);
    var formFactor = 0.85 + (p.form || 50) / 250;
    var confFactor = 0.9 + (p.confidence || 50) / 300;

    var base = 0;
    if (phase === 'youth') base = rng.float(1.4, 3.4);
    else if (phase === 'development') base = rng.float(1.2, 3.0);
    else if (phase === 'growth') base = rng.float(0.7, 2.2);
    else if (phase === 'prime') base = rng.float(-0.1, 1.3);
    else if (phase === 'late_prime') base = rng.float(-0.7, 0.7);
    else if (phase === 'decline') base = rng.float(-2.0, 0.25);
    else base = rng.float(-2.6, 0.15);

    // Keep climbing while far from potential
    if (room >= 12 && base > 0) base *= 1.25;
    else if (room >= 6 && base > 0) base *= 1.1;
    if (room < 2 && base > 0) base *= 0.45;
    if (room <= 0 && base > 0) base = rng.float(-0.3, 0.2);

    var delta = base * bias * minutesFactor * ratingFactor * formFactor * confFactor;

    if (injured >= 2) delta -= rng.float(0.8, 2.2);
    else if (injured === 1) delta -= rng.float(0.15, 0.8);

    if (matches < 8 && age <= 24) delta *= 0.55;
    if (age >= 33 && delta > 0.5) delta = rng.float(-0.2, 0.5);
    if (age >= 35 && delta > 0) delta = Math.min(delta, 0.3);

    // Hard anti-absurd: no huge late spikes
    if (age >= 33 && delta > 1.5) delta = 1.5;
    if (age >= 35 && delta > 0.5) delta = 0.5;
    // Youth can jump, but not absurdly
    if (age <= 21 && delta > 5) delta = 5;
    if (age <= 25 && delta > 4) delta = 4;

    var rounded = Math.round(delta);
    if (rounded === 0 && delta > 0.25 && room > 2 && minutesFactor >= 0.85) rounded = 1;
    if (rounded === 0 && delta < -0.45) rounded = -1;

    var next = clamp(p.overall + rounded, 45, Math.max(p.overall, Math.min(94, p.potential + 1)));
    // Soft potential ceiling breach only via exceptional seasons
    if (rating >= 7.6 && minutes >= 2600 && room <= 2 && age <= 29 && rng.chance(0.12)) {
      p.potential = Math.min(94, p.potential + 1);
      next = Math.min(94, next + 1);
      rounded = next - p.overall;
    }

    return { delta: next - p.overall, nextOverall: next };
  }

  function applyAgeUp(career, seasonStats, rng) {
    var p = career.player;
    var before = p.overall;
    var prog = computeOverallDelta(career, seasonStats, rng);
    p.overall = prog.nextOverall;
    if (p.overall > p.peakOverall) p.peakOverall = p.overall;

    // Form drift toward performance
    var targetForm = clamp(Math.round((seasonStats.rating - 6.0) * 28 + 40), 25, 95);
    p.form = clamp(Math.round(p.form * 0.45 + targetForm * 0.55 + rng.int(-4, 4)), 20, 98);
    p.confidence = clamp(
      Math.round(p.confidence * 0.55 + (seasonStats.rating >= 7 ? 12 : seasonStats.rating < 6.5 ? -10 : 0) + rng.int(-3, 3)),
      15,
      98
    );
    p.fitness = clamp(100 - (seasonStats.injurySeverity || 0) * 18 + rng.int(-5, 5), 40, 100);
    p.managerTrust = clamp(
      p.managerTrust + (seasonStats.rating >= 7.1 ? rng.int(2, 8) : seasonStats.rating < 6.5 ? -rng.int(3, 9) : rng.int(-2, 3)),
      10,
      95
    );
    p.reputation = clamp(
      p.reputation +
        Math.round((p.overall - 60) / 8) +
        (seasonStats.titlesWon || 0) * 3 +
        (seasonStats.nationalCaps || 0) +
        (seasonStats.rating >= 7.5 ? 2 : 0),
      5,
      99
    );

    p.age += 1;
    Engine.State.updateValue(career);

    return {
      overallBefore: before,
      overallAfter: p.overall,
      delta: p.overall - before,
      ageBefore: p.age - 1,
      ageAfter: p.age
    };
  }

  function refreshRole(career, rng) {
    var club = NS.Providers.clubs.getById(career.currentClubId);
    career.role = Rules.roleFromContext(career.player, club, rng);
    return career.role;
  }

  Engine.Progression = {
    computeOverallDelta: computeOverallDelta,
    applyAgeUp: applyAgeUp,
    refreshRole: refreshRole
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
