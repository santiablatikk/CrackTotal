(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  function findDecision(world, typeOrId) {
    var list = world.decisions || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === typeOrId || list[i].type === typeOrId) return list[i];
    }
    return null;
  }

  function optionById(decision, optionId) {
    if (!decision || !decision.options) return null;
    for (var i = 0; i < decision.options.length; i++) {
      if (decision.options[i].id === optionId) return decision.options[i];
    }
    return null;
  }

  function availableDecisionTypes(state) {
    var types = [];
    if (state.pendingOffers && state.pendingOffers.length) types.push('transferencia');
    types.push('renovacion');
    types.push('mercado');
    types.push('entrenamiento');
    types.push('rol');
    if (state.rating >= 68 || state.nationalCaps > 0) types.push('seleccion');
    types.push('prensa');
    if (state.popularity >= 35 || state.rating >= 75) types.push('patrocinio');
    if (state.fitness < 75 || state.age >= 30) types.push('lesion');
    // Extra-football (rare): only if not flooded by recent life tags
    var recent = state.recentDecisions || [];
    var recentLife = recent.some(function (d) {
      return d.type === 'familia' || d.type === 'rumor' || d.type === 'actitud';
    });
    if (!recentLife) {
      if (state.age >= 22) types.push('familia');
      if (state.popularity >= 40 || state.reputation >= 45) types.push('rumor');
      if (state.clubRelation <= 55 || state.form <= 4) types.push('actitud');
    }
    if (NS.Rules.canVoluntaryRetire(state.age)) types.push('retiro');
    return types;
  }

  function pickDecision(state, world, rng) {
    var types = availableDecisionTypes(state);
    var recent = state.recentDecisions || [];
    var recentTypes = recent.slice(0, 3).map(function (d) {
      return d.type;
    });

    // Primary cycle: if market moved, the decision IS your future
    if (state.pendingOffers && state.pendingOffers.length) {
      var transfer = findDecision(world, 'transferencia');
      if (transfer) {
        var copy = JSON.parse(JSON.stringify(transfer));
        copy.title = 'Tu futuro';
        copy.prompt = 'El mercado habló. ¿Qué hacés ahora?';
        return copy;
      }
    }

    var weighted = types
      .map(function (type) {
        var w = 1;
        if (type === 'transferencia') w = 0;
        if (type === 'renovacion') w = 2.2;
        if (type === 'mercado') w = 1.8;
        if (type === 'entrenamiento') w = 1.5;
        if (type === 'rol') w = 1.2;
        if (type === 'seleccion') w = state.rating >= 78 ? 1.6 : 1.0;
        if (type === 'prensa') w = state.popularity >= 50 ? 1.1 : 0.7;
        if (type === 'patrocinio') w = 0.9;
        if (type === 'lesion') w = state.fitness < 60 ? 1.8 : 0.5;
        if (type === 'familia') w = 0.35;
        if (type === 'rumor') w = 0.4;
        if (type === 'actitud') w = state.clubRelation < 45 ? 0.7 : 0.25;
        if (type === 'retiro') w = state.age >= 36 ? 2.4 : 0.6;
        if (recentTypes.indexOf(type) === 0) w *= 0.2;
        else if (recentTypes.indexOf(type) !== -1) w *= 0.5;
        return { type: type, weight: w };
      })
      .filter(function (x) {
        return x.weight > 0;
      });

    var chosen = rng.weightedPick(weighted, function (x) {
      return x.weight;
    });
    var type = chosen ? chosen.type : 'entrenamiento';

    if (type === 'retiro') {
      return {
        id: 'dec_retire',
        type: 'retiro',
        title: '¿Colgar los botines?',
        prompt: 'El cuerpo y la cabeza pesan. ¿Es momento?',
        tags: ['retire'],
        options: [
          {
            id: 'retire_yes',
            label: 'Retirarme ahora',
            summary: 'Cerrar el ciclo',
            effects: { retire: true }
          },
          {
            id: 'retire_no',
            label: 'Seguir una temporada más',
            summary: 'Aún hay fútbol',
            effects: { moraleDelta: 3, fitnessDelta: -4 }
          }
        ]
      };
    }

    var decision = findDecision(world, type);
    if (!decision) decision = findDecision(world, 'entrenamiento');
    return JSON.parse(JSON.stringify(decision));
  }

  function selectOfferByPreference(offers, preference, rng) {
    if (!offers || !offers.length) return null;
    if (preference === 'stay') return null;
    var sorted = offers.slice();
    if (preference === 'prestige') {
      sorted.sort(function (a, b) {
        return (b.prestige || 0) - (a.prestige || 0);
      });
      return sorted[0];
    }
    if (preference === 'minutes') {
      sorted.sort(function (a, b) {
        var ra = a.role === 'titular' ? 3 : a.role === 'promesa' ? 2 : 1;
        var rb = b.role === 'titular' ? 3 : b.role === 'promesa' ? 2 : 1;
        if (rb !== ra) return rb - ra;
        return (a.level || 1) - (b.level || 1);
      });
      return sorted[0];
    }
    return rng.pick(offers);
  }

  function applyTransfer(state, offer, world) {
    if (!offer) return state;
    var club = NS.Rules.getClub(world, offer.clubId);
    if (!club) return state;
    var prev = NS.Rules.getClub(world, state.clubId);
    var prevTier = prev ? NS.Rules.tierRank(NS.Rules.clubTier(prev, world)) : 2;
    var nextTier = NS.Rules.tierRank(NS.Rules.clubTier(club, world));

    state.clubId = club.id;
    if (state.clubsPlayed.indexOf(club.id) === -1) state.clubsPlayed.push(club.id);
    state.clubRelation = offer.role === 'titular' ? 65 : offer.role === 'promesa' ? 70 : 52;
    state.prestige = Math.round(state.prestige * 0.65 + club.prestige * 0.35);

    // Big step-up → minutes risk / pressure (can fail at giants)
    if (nextTier - prevTier >= 2) {
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) - 0.16;
      state.morale = NS.State.clamp(state.morale - 4, 10, 100);
    } else if (offer.role === 'rotacion') {
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) - 0.14;
    } else if (offer.role === 'titular') {
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) + 0.08;
    }

    if (nextTier < prevTier) {
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) + 0.1;
      state.clubRelation = NS.State.clamp(state.clubRelation + 8, 0, 100);
    }

    state.money += Math.round((offer.wage || 0) * 0.5);
    state.pendingOffers = [];
    return state;
  }

  function applyDecision(state, decision, optionId, world, rng, explicitOfferId) {
    if (!decision) throw new Error('Decisión requerida');
    var option = optionById(decision, optionId);
    if (!option) throw new Error('Opción inválida: ' + optionId);

    var effects = option.effects || {};
    var transferOffer = null;

    if (decision.type === 'transferencia') {
      if (explicitOfferId) {
        transferOffer =
          (state.pendingOffers || []).filter(function (o) {
            return o.id === explicitOfferId;
          })[0] || null;
      } else {
        transferOffer = selectOfferByPreference(
          state.pendingOffers,
          effects.transferPreference,
          rng
        );
      }
      if (effects.transferPreference === 'stay') {
        transferOffer = null;
        // Loyalty path: real value
        state.clubRelation = NS.State.clamp(state.clubRelation + 6, 0, 100);
        state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) + 0.06;
      }
    }

    NS.State.applyEffects(state, effects);

    if (transferOffer) {
      applyTransfer(state, transferOffer, world);
    }

    if (effects.retire) {
      state.retired = true;
      state.retirementReason = 'voluntary';
    }

    state.recentDecisions = NS.State.pushRecent(
      state.recentDecisions,
      {
        id: decision.id,
        type: decision.type,
        optionId: optionId,
        seasonIndex: state.seasonIndex,
        transferredTo: transferOffer ? transferOffer.clubId : null
      },
      10
    );

    return {
      state: state,
      option: option,
      transferOffer: transferOffer,
      retired: !!state.retired
    };
  }

  NS.Decisions = {
    findDecision: findDecision,
    optionById: optionById,
    availableDecisionTypes: availableDecisionTypes,
    pickDecision: pickDecision,
    applyDecision: applyDecision,
    selectOfferByPreference: selectOfferByPreference,
    applyTransfer: applyTransfer
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
