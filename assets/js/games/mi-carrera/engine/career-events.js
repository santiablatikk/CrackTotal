(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

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
    if (c.minClubLevel != null || c.maxClubLevel != null) {
      var club = NS.Rules.getClub(world, state.clubId);
      var level = club ? club.level || 1 : 1;
      if (c.minClubLevel != null && level < c.minClubLevel) return false;
      if (c.maxClubLevel != null && level > c.maxClubLevel) return false;
    }
    return true;
  }

  function isOnCooldown(ev, state) {
    var until = state.eventCooldowns && state.eventCooldowns[ev.id];
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
          penalty *= i === 0 ? 0.15 : i < 3 ? 0.4 : 0.7;
        }
      }
      if (prev && prev.id === ev.id) penalty *= 0.05;
    }
    return penalty;
  }

  function weightFor(ev, state, world) {
    if (!eventMatchesConditions(ev, state, world)) return 0;
    if (isOnCooldown(ev, state)) return 0;
    var w = ev.weightBase != null ? ev.weightBase : 1;
    w *= recentTagPenalty(ev, state);
    if (ev.category === 'lesion') {
      w *= 1 + (state.seasonModifiers.injuryRiskBias || 0) * 2;
      w *= state.fitness < 60 ? 1.4 : 1;
    }
    if (ev.category === 'mala_forma' && state.form <= 4) w *= 1.5;
    if (ev.category === 'temporada_historica' && state.form >= 8 && state.rating >= 82) w *= 1.8;
    return Math.max(0, w);
  }

  function pickEvent(state, world, rng) {
    var events = world.events || [];
    var eligible = [];
    for (var i = 0; i < events.length; i++) {
      var w = weightFor(events[i], state, world);
      if (w > 0) eligible.push({ event: events[i], weight: w });
    }
    if (!eligible.length) return null;
    var chosen = rng.weightedPick(eligible, function (x) {
      return x.weight;
    });
    return chosen ? chosen.event : null;
  }

  function applyEvent(state, ev) {
    if (!ev) return { state: state, event: null };
    NS.State.applyEffects(state, ev.effects || {});
    if (ev.effects && ev.effects.injuryWeeks) {
      state._pendingInjuryWeeks = (state._pendingInjuryWeeks || 0) + ev.effects.injuryWeeks;
    }
    var cooldown = ev.cooldownSeasons != null ? ev.cooldownSeasons : 2;
    state.eventCooldowns[ev.id] = state.seasonIndex + cooldown;
    state.recentEvents = NS.State.pushRecent(
      state.recentEvents,
      { id: ev.id, category: ev.category, tags: (ev.tags || []).slice(), seasonIndex: state.seasonIndex },
      8
    );
    return {
      state: state,
      event: {
        id: ev.id,
        category: ev.category,
        title: ev.title,
        body: ev.body,
        tags: (ev.tags || []).slice(),
        effects: ev.effects || {}
      }
    };
  }

  NS.Events = {
    eventMatchesConditions: eventMatchesConditions,
    pickEvent: pickEvent,
    applyEvent: applyEvent,
    weightFor: weightFor
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
