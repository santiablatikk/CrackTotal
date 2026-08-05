(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  function lastSeasonWasGood(state) {
    var hist = state.seasonHistory || [];
    if (!hist.length) return false;
    var g = hist[hist.length - 1].performanceGrade;
    return g === 'S' || g === 'A' || g === 'B';
  }

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

  /**
   * Between seasons the only primary decision is football future:
   * stay / transfer / loan (via market UI). Life choices live as rare in-season events.
   */
  function availableDecisionTypes(state) {
    var types = ['transferencia'];
    if (NS.Rules.canVoluntaryRetire(state.age)) types.push('retiro');
    return types;
  }

  function buildFutureDecision(state) {
    var cold = !(state.pendingOffers && state.pendingOffers.length);
    if (cold) state.marketCold = true;
    else state.marketCold = false;
    var options = [
      {
        id: 'stay_loyal',
        label: 'Quedarme',
        summary: 'Seguir en mi club',
        effects: { transferPreference: 'stay' }
      }
    ];
    if (cold) {
      options.push({
        id: 'renew_project',
        label: 'Apostar al proyecto',
        summary: 'Más compromiso con el club actual',
        effects: {
          transferPreference: 'stay',
          moraleDelta: 3,
          clubRelationDelta: 5,
          minutesBias: 0.05,
          confidenceDelta: 2
        }
      });
    } else {
      options.push({
        id: 'accept_best_prestige',
        label: 'Escuchar ofertas',
        summary: 'Evaluar el mercado',
        effects: { transferPreference: 'prestige' }
      });
      options.push({
        id: 'accept_best_minutes',
        label: 'Buscar minutos',
        summary: 'Priorizar protagonismo',
        effects: { transferPreference: 'minutes' }
      });
    }
    if (NS.Rules.canVoluntaryRetire(state.age)) {
      options.push({
        id: 'retire_yes',
        label: 'Retirarme',
        summary: 'Cerrar el ciclo',
        effects: { retire: true }
      });
    }
    return {
      id: 'dec_future',
      type: 'transferencia',
      title: 'Tu futuro',
      prompt: cold
        ? 'El mercado pasó de largo. ¿Qué hacés con tu carrera?'
        : 'El mercado habló. ¿Dónde jugás el año que viene?',
      tags: ['market', 'future'],
      options: options
    };
  }

  function pickDecision(state, world, rng) {
    // Cold market / no offers: occasional retirement prompt late career
    if (
      rng &&
      typeof rng.bool === 'function' &&
      NS.Rules.canVoluntaryRetire(state.age) &&
      !(state.pendingOffers && state.pendingOffers.length) &&
      rng.bool(0.12)
    ) {
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

    // Always build from live market state (offers / cold), not static JSON options.
    return buildFutureDecision(state);
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
    var isLoan = offer.kind === 'loan';

    if (isLoan) {
      state.loanParentClubId = state.clubId;
      state.onLoan = true;
      state._loanCount = (state._loanCount || 0) + 1;
    } else {
      state.onLoan = false;
      state.loanParentClubId = null;
      // Permanent move: reset attachment, start new bond chapter
      state.clubAttachment = NS.State.clamp(12 + Math.round((offer.role === 'titular' ? 8 : 0)), 8, 35);
      state.stayedStreak = 0;
      if (state.legacyClubId && state.legacyClubId !== club.id) {
        // leaving legacy club
      }
      if ((state.clubsPlayed || []).indexOf(club.id) !== -1) {
        state.returnCooldownUntil = (state.seasonIndex || 0) + 4;
      }
    }

    state.clubId = club.id;
    if (state.clubsPlayed.indexOf(club.id) === -1) state.clubsPlayed.push(club.id);
    state.clubRole = offer.role || 'rotacion';
    state.clubRelation = offer.role === 'titular' ? 65 : offer.role === 'promesa' ? 70 : 52;
    if (!isLoan) {
      state.prestige = Math.round(state.prestige * 0.65 + club.prestige * 0.35);
    }

    if (!isLoan && nextTier - prevTier >= 2) {
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) - 0.16;
      state.morale = NS.State.clamp(state.morale - 4, 10, 100);
    } else if (isLoan) {
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) + 0.2;
      state.clubRelation = NS.State.clamp(state.clubRelation + 10, 0, 100);
    } else if (offer.role === 'rotacion') {
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) - 0.14;
    } else if (offer.role === 'titular') {
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) + 0.08;
    }

    if (!isLoan && nextTier < prevTier) {
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) + 0.1;
      state.clubRelation = NS.State.clamp(state.clubRelation + 8, 0, 100);
    }

    state.money += Math.round((offer.wage || 0) * (isLoan ? 0.25 : 0.5));
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
        var years = NS.Rules.yearsAtClubApprox ? NS.Rules.yearsAtClubApprox(state) : 1;
        var attach = state.clubAttachment != null ? state.clubAttachment : 22;
        state.stayedStreak = (state.stayedStreak || 0) + 1;
        state.clubRelation = NS.State.clamp(state.clubRelation + 6 + (years >= 3 ? 4 : 0), 0, 100);
        state.seasonModifiers.minutesBias =
          (state.seasonModifiers.minutesBias || 0) + 0.06 + (years >= 4 ? 0.04 : 0);
        state.confidence = NS.State.clamp((state.confidence || 55) + 2 + (attach >= 60 ? 2 : 0), 0, 100);
        state.clubAttachment = NS.State.clamp(attach + 5 + (years >= 3 ? 3 : 0), 0, 100);

        // Legacy / referente stay
        if (years >= 4 && (lastSeasonWasGood(state) || attach >= 60)) {
          state.legacyClubId = state.clubId;
          state.popularity = NS.State.clamp((state.popularity || 40) + 5, 0, 100);
          state.reputation = NS.State.clamp((state.reputation || 40) + 3, 0, 100);
          state.morale = NS.State.clamp((state.morale || 70) + 4, 10, 100);
          state.seasonModifiers.transferBias = (state.seasonModifiers.transferBias || 0) - 0.08;
        }

        // Missed opportunity: turned down a big step-up
        var big = (state.pendingOffers || []).some(function (o) {
          return o.kind !== 'loan' && (o.marketFamily === 'STEP_UP' || o.marketFamily === 'GIANT' || o.marketFamily === 'EUROPE');
        });
        if (big) state.missedBigMove = true;

        state.pendingOffers = [];
      } else {
        state.stayedStreak = 0;
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
    buildFutureDecision: buildFutureDecision,
    applyDecision: applyDecision,
    selectOfferByPreference: selectOfferByPreference,
    applyTransfer: applyTransfer
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
