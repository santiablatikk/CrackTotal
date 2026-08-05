(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  function yearsAtCurrentClub(state) {
    var hist = state.seasonHistory || [];
    var n = 0;
    for (var i = hist.length - 1; i >= 0; i--) {
      if (hist[i].clubId === state.clubId) n += 1;
      else break;
    }
    return n;
  }

  function lastApps(state) {
    var hist = state.seasonHistory || [];
    if (!hist.length) return 22;
    return hist[hist.length - 1].appearances || 0;
  }

  function eventMatchesConditions(ev, state, world) {
    var c = ev.conditions || {};
    if (c.minAge != null && state.age < c.minAge) return false;
    if (c.maxAge != null && state.age > c.maxAge) return false;
    if (c.minRating != null && state.rating < c.minRating) return false;
    if (c.maxRating != null && state.rating > c.maxRating) return false;
    if (c.minForm != null && state.form < c.minForm) return false;
    if (c.maxForm != null && state.form > c.maxForm) return false;
    if (c.minPopularity != null && state.popularity < c.minPopularity) return false;
    if (c.minReputation != null && state.reputation < c.minReputation) return false;
    if (c.minClubRelation != null && state.clubRelation < c.minClubRelation) return false;
    if (c.maxClubRelation != null && state.clubRelation > c.maxClubRelation) return false;
    if (c.minNationalCaps != null && state.nationalCaps < c.minNationalCaps) return false;
    if (c.positions && c.positions.indexOf(state.player.position) === -1) return false;
    if (c.minYearsAtClub != null && yearsAtCurrentClub(state) < c.minYearsAtClub) return false;
    if (c.maxYearsAtClub != null && yearsAtCurrentClub(state) > c.maxYearsAtClub) return false;
    if (c.minLastApps != null && lastApps(state) < c.minLastApps) return false;
    if (c.maxLastApps != null && lastApps(state) > c.maxLastApps) return false;
    if (c.requireCrisis && !(state.arcFlags && state.arcFlags.crisis)) return false;
    if (c.requireComeback && !(state.arcFlags && state.arcFlags.comeback)) return false;
    if (c.minClubLevel != null || c.maxClubLevel != null) {
      var club = NS.Rules.getClub(world, state.clubId);
      var level = club ? club.level || 1 : 1;
      if (c.minClubLevel != null && level < c.minClubLevel) return false;
      if (c.maxClubLevel != null && level > c.maxClubLevel) return false;
    }
    if (c.minMinutesBias != null) {
      var mb = (state.seasonModifiers && state.seasonModifiers.minutesBias) || 0;
      if (mb < c.minMinutesBias) return false;
    }
    return true;
  }

  function isOnCooldown(ev, state) {
    var until = state.eventCooldowns && state.eventCooldowns[ev.id];
    return until != null && state.seasonIndex < until;
  }

  function categoryOnCooldown(ev, state) {
    var cat = ev.category || '';
    if (!cat || !state.eventCategoryCooldowns) return false;
    var until = state.eventCategoryCooldowns[cat];
    return until != null && state.seasonIndex < until;
  }

  function recentTagPenalty(ev, state) {
    var tags = ev.tags || [];
    if (!tags.length) return 1;
    var recent = state.recentEvents || [];
    var penalty = 1;
    for (var i = 0; i < Math.min(5, recent.length); i++) {
      var prev = recent[i];
      var prevTags = (prev && prev.tags) || [];
      for (var t = 0; t < tags.length; t++) {
        if (prevTags.indexOf(tags[t]) !== -1) {
          penalty *= i === 0 ? 0.12 : i < 3 ? 0.35 : 0.65;
        }
      }
      if (prev && prev.id === ev.id) penalty *= 0.04;
      if (prev && prev.category === ev.category) penalty *= i === 0 ? 0.25 : 0.6;
    }
    return penalty;
  }

  function weightFor(ev, state, world) {
    if (!eventMatchesConditions(ev, state, world)) return 0;
    if (isOnCooldown(ev, state)) return 0;
    if (categoryOnCooldown(ev, state)) return 0;
    var w = ev.weightBase != null ? ev.weightBase : 1;
    if (ev.rarity === 'legendary') w *= 0.55;
    if (ev.rarity === 'rare') w *= 0.75;
    w *= recentTagPenalty(ev, state);
    if (ev.category === 'lesion' || (ev.tags && ev.tags.indexOf('injury') !== -1)) {
      w *= 1 + (state.seasonModifiers.injuryRiskBias || 0) * 2;
      w *= state.fitness < 60 ? 1.4 : 1;
    }
    if (ev.category === 'mala_forma' && state.form <= 4) w *= 1.55;
    if (ev.category === 'temporada_historica' && state.form >= 8 && state.rating >= 82) w *= 1.8;
    if (ev.id === 'ev_lost_place' && lastApps(state) < 14) w *= 1.4;
    if (ev.id === 'ev_breakout_run' && state.potential - state.rating >= 10) w *= 1.35;
    if (ev.id === 'ev_became_idol' && yearsAtCurrentClub(state) >= 6) w *= 1.5;
    if (ev.category === 'quiet' || ev.id === 'ev_quiet_season') w *= state.form >= 5 && state.form <= 7 ? 1.2 : 0.7;
    return Math.max(0, w);
  }

  function resolveCoachChangeEffects(rng) {
    if (rng.bool(0.5)) {
      return { minutesBias: 0.14, clubRelationDelta: 6, moraleDelta: 4, confidenceDelta: 4 };
    }
    return { minutesBias: -0.14, clubRelationDelta: -6, moraleDelta: -5, confidenceDelta: -4 };
  }

  /**
   * 0–2 contextual in-season events. Quiet seasons are valid.
   */
  function pickSeasonEvents(state, world, rng) {
    var count = 0;
    var roll = rng.float ? rng.float() : rng.range(0, 1);
    // Real chance of a quiet season (no disruptive beat)
    if (roll < 0.46) count = 0;
    else if (roll < 0.86) count = 1;
    else count = 2;

    var events = world.events || [];
    var picked = [];
    var usedIds = Object.create(null);
    var usedCats = Object.create(null);

    for (var n = 0; n < count; n++) {
      var eligible = [];
      for (var i = 0; i < events.length; i++) {
        var ev = events[i];
        if (usedIds[ev.id] || usedCats[ev.category]) continue;
        var w = weightFor(ev, state, world);
        if (w > 0) eligible.push({ event: ev, weight: w });
      }
      if (!eligible.length) break;
      var chosen = rng.weightedPick(eligible, function (x) {
        return x.weight;
      });
      if (!chosen) break;
      picked.push(chosen.event);
      usedIds[chosen.event.id] = true;
      if (chosen.event.category) usedCats[chosen.event.category] = true;
    }
    return picked;
  }

  /** Back-compat: single event or null. */
  function pickEvent(state, world, rng) {
    var list = pickSeasonEvents(state, world, rng);
    return list.length ? list[0] : null;
  }

  function applyEvent(state, ev, rng) {
    if (!ev) return { state: state, event: null };
    var effects = Object.assign({}, ev.effects || {});
    if (ev.id === 'ev_coach_change' && rng) {
      effects = Object.assign(effects, resolveCoachChangeEffects(rng));
    }
    NS.State.applyEffects(state, effects);
    if (effects.injuryWeeks) {
      state._pendingInjuryWeeks = (state._pendingInjuryWeeks || 0) + effects.injuryWeeks;
    }
    var title = ev.title;
    var body = ev.body;
    if (ev.id === 'ev_coach_change' && effects.minutesBias) {
      if (effects.minutesBias > 0) {
        body = 'Nuevo DT. Te elige. Tus minutos crecen.';
      } else {
        body = 'Nuevo DT. Te saca del plan. Hay que pelear el puesto.';
      }
    }
    var cooldown = ev.cooldownSeasons != null ? ev.cooldownSeasons : 2;
    state.eventCooldowns = state.eventCooldowns || {};
    state.eventCooldowns[ev.id] = state.seasonIndex + cooldown;
    state.eventCategoryCooldowns = state.eventCategoryCooldowns || {};
    if (ev.category) {
      state.eventCategoryCooldowns[ev.category] = state.seasonIndex + Math.max(1, Math.min(3, cooldown - 1));
    }
    state.recentEvents = NS.State.pushRecent(
      state.recentEvents,
      {
        id: ev.id,
        category: ev.category,
        tags: (ev.tags || []).slice(),
        seasonIndex: state.seasonIndex,
        title: ev.title
      },
      10
    );
    return {
      state: state,
      event: {
        id: ev.id,
        category: ev.category,
        title: title,
        body: body,
        tags: (ev.tags || []).slice(),
        effects: effects,
        rarity: ev.rarity || 'common'
      }
    };
  }

  function applySeasonEvents(state, list, rng) {
    var applied = [];
    (list || []).forEach(function (ev) {
      var res = applyEvent(state, ev, rng);
      if (res.event) applied.push(res.event);
    });
    return applied;
  }

  NS.Events = {
    eventMatchesConditions: eventMatchesConditions,
    pickEvent: pickEvent,
    pickSeasonEvents: pickSeasonEvents,
    applyEvent: applyEvent,
    applySeasonEvents: applySeasonEvents,
    weightFor: weightFor,
    yearsAtCurrentClub: yearsAtCurrentClub
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
