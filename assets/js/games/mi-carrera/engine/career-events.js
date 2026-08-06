/**
 * Injuries, crisis, comeback and moment logging.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});
  var clamp = Engine.State.clamp;

  function pushMoment(career, type, payload) {
    var key = type + ':' + (payload && payload.key ? payload.key : career.seasonIndex);
    var exists = (career.moments || []).some(function (m) {
      return m.key === key;
    });
    if (exists) return;
    career.moments.push({
      key: key,
      type: type,
      seasonIndex: career.seasonIndex,
      age: career.player.age,
      seasonYear: career.seasonYear,
      payload: payload || {}
    });
    if (career.moments.length > 80) career.moments = career.moments.slice(-80);
  }

  function rollInjury(career, rng) {
    var p = career.player;
    var risk = 0.06;
    if (p.fitness < 70) risk += 0.05;
    if (p.age >= 32) risk += 0.04;
    if (p.age <= 20) risk += 0.01;
    if ((career.role === 'star' || career.role === 'key_player') && rng.chance(0.02)) risk += 0.02;

    if (!rng.chance(risk)) {
      p.injury = { status: 'healthy', weeks: 0 };
      return { severity: 0, status: 'healthy' };
    }

    var roll = rng.next();
    var severity = 1;
    var status = 'minor';
    var weeks = rng.int(2, 6);
    if (roll > 0.82) {
      severity = 3;
      status = 'long';
      weeks = rng.int(16, 36);
      career.flags.hadMajorInjury = true;
    } else if (roll > 0.5) {
      severity = 2;
      status = 'injury';
      weeks = rng.int(6, 14);
    }

    p.injury = { status: status, weeks: weeks };
    career.injuries.push({
      seasonIndex: career.seasonIndex,
      age: p.age,
      status: status,
      weeks: weeks,
      severity: severity
    });
    pushMoment(career, severity >= 3 ? 'major_injury' : 'injury', { severity: severity, weeks: weeks });
    return { severity: severity, status: status, weeks: weeks };
  }

  function updateCrisisAndComeback(career, seasonStats) {
    var p = career.player;
    var rating = seasonStats.rating || 0;
    var minutes = seasonStats.minutes || 0;
    var bad =
      (seasonStats.injurySeverity || 0) >= 2 ||
      (rating < 6.35 && minutes < 1500) ||
      (minutes < 500 && rating < 6.7);
    // Age-related OVR dips alone are not a "crisis"

    if (bad) {
      if (!career.crisis.active) {
        career.crisis = {
          active: true,
          kind: (seasonStats.injurySeverity || 0) >= 2 ? 'injury' : 'form',
          seasons: 1,
          troughOverall: p.overall
        };
      } else {
        career.crisis.seasons += 1;
        career.crisis.troughOverall = Math.min(career.crisis.troughOverall || p.overall, p.overall);
      }
      // Only a multi-season slump counts as a career crisis arc
      if (career.crisis.seasons === 2 && career.careerArc.indexOf('crisis') === -1) {
        career.careerArc.push('crisis');
      }
      if (career.crisis.seasons >= 2 && !career.comeback.active && !career.flags.hadComeback) {
        career.comeback = {
          active: true,
          fromOverall: career.crisis.troughOverall || p.overall,
          achieved: false
        };
      }
    } else if (career.crisis.active) {
      career.crisis.seasons = Math.max(0, career.crisis.seasons - 1);
      if (career.crisis.seasons === 0) career.crisis.active = false;
    }

    if (career.comeback.active && !career.comeback.achieved) {
      var from = career.comeback.fromOverall || p.overall;
      var rebound =
        (p.overall >= from + 2 && rating >= 7.15 && minutes >= 1800) ||
        (rating >= 7.35 && minutes >= 2200 && !bad && career.careerArc.indexOf('crisis') !== -1);
      if (rebound) {
        career.comeback.achieved = true;
        career.comeback.active = false;
        career.flags.hadComeback = true;
        career.careerArc.push('comeback');
        pushMoment(career, 'comeback', { fromOverall: from, toOverall: p.overall });
      }
    }
  }

  function maybeExtraEvent(career, rng) {
    // Rare secondary football-adjacent event (not life-sim).
    if (!rng.chance(0.12)) return null;
    var kinds = ['media_pressure', 'adaptation', 'trust_boost', 'rumor'];
    var kind = rng.pick(kinds);
    if (kind === 'media_pressure') {
      career.player.confidence = clamp(career.player.confidence - rng.int(2, 6), 15, 98);
    } else if (kind === 'trust_boost') {
      career.player.managerTrust = clamp(career.player.managerTrust + rng.int(3, 8), 10, 95);
    } else if (kind === 'adaptation') {
      career.player.form = clamp(career.player.form + rng.int(-6, 8), 20, 98);
    }
    return kind;
  }

  Engine.Events = {
    pushMoment: pushMoment,
    rollInjury: rollInjury,
    updateCrisisAndComeback: updateCrisisAndComeback,
    maybeExtraEvent: maybeExtraEvent
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
