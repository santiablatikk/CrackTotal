(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function createEmptySeasonHistory() {
    return [];
  }

  function createPlayer(input) {
    return {
      name: String(input.name || 'Jugador').slice(0, 40),
      countryId: input.countryId,
      position: input.position,
      archetypeId: input.archetypeId
    };
  }

  function createInitialState(opts) {
    var o = opts || {};
    var player = createPlayer(o.player || o);
    return {
      version: 1,
      careerSeed: o.careerSeed >>> 0 || 1,
      player: player,
      age: o.age != null ? o.age : 17,
      clubId: o.clubId || null,
      nationalTeamId: o.nationalTeamId || null,
      rating: clamp(Math.round(o.rating != null ? o.rating : 62), 40, 99),
      potential: clamp(Math.round(o.potential != null ? o.potential : 80), 50, 99),
      form: clamp(o.form != null ? o.form : 5, 1, 10),
      confidence: clamp(o.confidence != null ? o.confidence : 55, 0, 100),
      streakGood: o.streakGood != null ? o.streakGood : 0,
      streakBad: o.streakBad != null ? o.streakBad : 0,
      arcFlags: o.arcFlags ? Object.assign({}, o.arcFlags) : {},
      narrativeTag: o.narrativeTag || null,
      reputation: clamp(o.reputation != null ? o.reputation : 20, 0, 100),
      popularity: clamp(o.popularity != null ? o.popularity : 15, 0, 100),
      prestige: clamp(o.prestige != null ? o.prestige : 15, 0, 100),
      marketValue: Math.max(0, Math.round(o.marketValue != null ? o.marketValue : 500000)),
      money: Math.max(0, Math.round(o.money != null ? o.money : 50000)),
      morale: clamp(o.morale != null ? o.morale : 70, 0, 100),
      fitness: clamp(o.fitness != null ? o.fitness : 90, 0, 100),
      clubRelation: clamp(o.clubRelation != null ? o.clubRelation : 60, 0, 100),
      nationalCaps: o.nationalCaps != null ? o.nationalCaps : 0,
      nationalGoals: o.nationalGoals != null ? o.nationalGoals : 0,
      nationalAssists: o.nationalAssists != null ? o.nationalAssists : 0,
      seasonIndex: o.seasonIndex != null ? o.seasonIndex : 0,
      seasonHistory: o.seasonHistory ? o.seasonHistory.slice() : createEmptySeasonHistory(),
      careerHistory: o.careerHistory ? o.careerHistory.slice() : [],
      recentEvents: o.recentEvents ? o.recentEvents.slice() : [],
      recentDecisions: o.recentDecisions ? o.recentDecisions.slice() : [],
      eventCooldowns: o.eventCooldowns ? Object.assign({}, o.eventCooldowns) : {},
      pendingOffers: o.pendingOffers ? o.pendingOffers.slice() : [],
      seasonModifiers: o.seasonModifiers
        ? Object.assign({}, o.seasonModifiers)
        : {
            minutesBias: 0,
            goalBias: 0,
            assistBias: 0,
            injuryRiskBias: 0,
            transferBias: 0,
            trainingFocus: null
          },
      clubsPlayed: o.clubsPlayed ? o.clubsPlayed.slice() : o.clubId ? [o.clubId] : [],
      peakRating: o.peakRating != null ? o.peakRating : o.rating != null ? o.rating : 62,
      peakMarketValue:
        o.peakMarketValue != null
          ? o.peakMarketValue
          : o.marketValue != null
            ? o.marketValue
            : 500000,
      totalTitles: o.totalTitles != null ? o.totalTitles : 0,
      titleIds: o.titleIds ? o.titleIds.slice() : [],
      titles: o.titles ? o.titles.slice() : [],
      awards: o.awards ? o.awards.slice() : [],
      records: o.records ? o.records.slice() : [],
      moments: o.moments ? o.moments.slice() : [],
      retired: !!o.retired,
      retirementReason: o.retirementReason || null,
      careerScore: o.careerScore != null ? o.careerScore : null,
      careerCategory: o.careerCategory || null,
      careerFlags: o.careerFlags ? o.careerFlags.slice() : [],
      createdAt: o.createdAt || new Date().toISOString(),
      updatedAt: o.updatedAt || new Date().toISOString()
    };
  }

  function serialize(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function deserialize(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('CareerState inválido');
    }
    return createInitialState(raw);
  }

  function touch(state) {
    state.updatedAt = new Date().toISOString();
    return state;
  }

  function applyDelta(state, key, delta, min, max) {
    if (delta == null || !delta) return state;
    var next = (state[key] || 0) + delta;
    if (min != null || max != null) {
      next = clamp(next, min == null ? -Infinity : min, max == null ? Infinity : max);
    }
    state[key] = key === 'marketValue' || key === 'money' ? Math.round(next) : next;
    return state;
  }

  function applyEffects(state, effects) {
    if (!effects) return state;
    var map = {
      ratingDelta: ['rating', 40, 99],
      potentialDelta: ['potential', 50, 99],
      formDelta: ['form', 1, 10],
      reputationDelta: ['reputation', 0, 100],
      popularityDelta: ['popularity', 0, 100],
      prestigeDelta: ['prestige', 0, 100],
      moneyDelta: ['money', 0, null],
      moraleDelta: ['morale', 0, 100],
      fitnessDelta: ['fitness', 0, 100],
      clubRelationDelta: ['clubRelation', 0, 100],
      nationalCapsDelta: ['nationalCaps', 0, null],
      nationalGoalsDelta: ['nationalGoals', 0, null],
      marketValueDelta: ['marketValue', 0, null]
    };
    Object.keys(map).forEach(function (effectKey) {
      if (effects[effectKey] != null) {
        var conf = map[effectKey];
        applyDelta(state, conf[0], effects[effectKey], conf[1], conf[2]);
      }
    });
    if (effects.minutesBias) {
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) + effects.minutesBias;
    }
    if (effects.goalBias) {
      state.seasonModifiers.goalBias = (state.seasonModifiers.goalBias || 0) + effects.goalBias;
    }
    if (effects.assistBias) {
      state.seasonModifiers.assistBias = (state.seasonModifiers.assistBias || 0) + effects.assistBias;
    }
    if (effects.injuryRiskBias) {
      state.seasonModifiers.injuryRiskBias =
        (state.seasonModifiers.injuryRiskBias || 0) + effects.injuryRiskBias;
    }
    if (effects.transferBias) {
      state.seasonModifiers.transferBias =
        (state.seasonModifiers.transferBias || 0) + effects.transferBias;
    }
    if (effects.trainingFocus) {
      state.seasonModifiers.trainingFocus = effects.trainingFocus;
    }
    if (state.rating > state.peakRating) {
      state.peakRating = state.rating;
    }
    return touch(state);
  }

  function resetSeasonModifiers(state) {
    state.seasonModifiers = {
      minutesBias: 0,
      goalBias: 0,
      assistBias: 0,
      injuryRiskBias: 0,
      transferBias: state.seasonModifiers && state.seasonModifiers.transferBias
        ? state.seasonModifiers.transferBias * 0.5
        : 0,
      trainingFocus: null
    };
    return state;
  }

  function pushRecent(list, item, max) {
    var next = (list || []).slice();
    next.unshift(item);
    return next.slice(0, max || 8);
  }

  NS.State = {
    clamp: clamp,
    round1: round1,
    createInitialState: createInitialState,
    serialize: serialize,
    deserialize: deserialize,
    touch: touch,
    applyDelta: applyDelta,
    applyEffects: applyEffects,
    resetSeasonModifiers: resetSeasonModifiers,
    pushRecent: pushRecent
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
