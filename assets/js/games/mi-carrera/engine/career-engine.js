(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  var POS_GOAL_RATE = { GK: 0.002, DEF: 0.04, MID: 0.12, FWD: 0.38 };
  var POS_ASSIST_RATE = { GK: 0.01, DEF: 0.06, MID: 0.22, FWD: 0.14 };

  function seasonMatchesForClub(club, world) {
    var comp = club ? NS.Rules.getCompetition(world, club.primaryCompetitionId) : null;
    var base = comp && comp.seasonMatchesTypical ? comp.seasonMatchesTypical : 34;
    if (base < 20) base = 30;
    return base;
  }

  function simulateSeasonStats(state, world, rng) {
    var club = NS.Rules.getClub(world, state.clubId);
    var comp = club ? NS.Rules.getCompetition(world, club.primaryCompetitionId) : null;
    var matches = seasonMatchesForClub(club, world);
    var pos = state.player.position;
    var arch = NS.Rules.archetypeById(world, state.player.archetypeId);
    var archMod = (arch && arch.modifiers) || {};

    var minutesFactor = NS.Rules.minutesFactorForClub
      ? NS.Rules.minutesFactorForClub(state, club)
      : 0.55;
    minutesFactor = NS.State.clamp(minutesFactor, 0.12, 0.98);

    var injuryWeeks = state._pendingInjuryWeeks || 0;
    state._pendingInjuryWeeks = 0;
    var injuryRisk =
      0.08 +
      (archMod.injuryRiskBias || 0) +
      (state.seasonModifiers.injuryRiskBias || 0) +
      (state.age >= 32 ? 0.05 : 0) +
      (state.fitness < 60 ? 0.08 : 0);
    if (rng.bool(NS.State.clamp(injuryRisk, 0.02, 0.45))) {
      injuryWeeks += rng.int(2, state.age >= 33 ? 14 : 8);
    }
    var injuryFactor = Math.max(0.2, 1 - injuryWeeks / 40);

    var appearances = Math.round(matches * minutesFactor * injuryFactor * rng.range(0.9, 1.08));
    appearances = NS.State.clamp(appearances, 0, matches);

    var ratingFactor = Math.pow(state.rating / 80, 1.15);
    var formFactor = 0.7 + state.form / 16;
    var confFactor = 0.92 + ((state.confidence != null ? state.confidence : 55) / 100) * 0.16;
    var clubFactor = club ? 0.85 + (club.prestige || 50) / 400 : 1;

    var goalRate =
      (POS_GOAL_RATE[pos] || 0.1) *
      (1 + (archMod.goalBias || 0) + (state.seasonModifiers.goalBias || 0));
    var assistRate =
      (POS_ASSIST_RATE[pos] || 0.1) *
      (1 + (archMod.assistBias || 0) + (state.seasonModifiers.assistBias || 0));

    var goals = Math.round(
      appearances *
        goalRate *
        ratingFactor *
        formFactor *
        confFactor *
        clubFactor *
        rng.range(0.75, 1.25)
    );
    var assists = Math.round(
      appearances * assistRate * ratingFactor * formFactor * confFactor * rng.range(0.75, 1.25)
    );
    if (pos === 'GK') {
      goals = rng.bool(0.02) ? 1 : 0;
      assists = rng.bool(0.15) ? rng.int(0, 2) : 0;
    }

    var avgRating =
      6.15 +
      (state.rating - 60) * 0.048 +
      (state.form - 5) * 0.14 +
      ((state.confidence != null ? state.confidence : 55) - 55) * 0.008 +
      (minutesFactor - 0.5) * 0.5 +
      rng.range(-0.28, 0.38);
    if (injuryWeeks >= 10) avgRating -= 0.3;
    if (state.streakBad >= 3) avgRating -= 0.1;
    if (state.streakGood >= 3) avgRating += 0.12;
    avgRating = NS.State.round1(NS.State.clamp(avgRating, 5.4, 9.8));

    var grade = NS.Rules.performanceGrade(avgRating, appearances, injuryWeeks);

    return {
      appearances: appearances,
      goals: goals,
      assists: assists,
      averageRating: avgRating,
      trophies: [],
      injuryWeeks: injuryWeeks,
      nationalCaps: 0,
      nationalGoals: 0,
      nationalAssists: 0,
      performanceGrade: grade,
      competitionId: club ? club.primaryCompetitionId : null
    };
  }

  function applySeasonAftermath(state, stats, world, rng) {
    state.nationalCaps += stats.nationalCaps || 0;
    state.nationalGoals += stats.nationalGoals || 0;
    state.nationalAssists = (state.nationalAssists || 0) + (stats.nationalAssists || 0);
    state.totalTitles += (stats.trophies || []).length;
    (stats.trophies || []).forEach(function (t) {
      if (state.titleIds.indexOf(t) === -1) state.titleIds.push(t);
    });
    (stats.titles || []).forEach(function (title) {
      if (!state.titles) state.titles = [];
      state.titles.push(title);
    });
    (stats.awards || []).forEach(function (award) {
      if (!state.awards) state.awards = [];
      state.awards.push(award);
      state.prestige = NS.State.clamp(state.prestige + Math.round((award.importance || 50) / 25), 0, 100);
      state.reputation = NS.State.clamp(state.reputation + Math.round((award.importance || 50) / 30), 0, 100);
      state.popularity = NS.State.clamp(state.popularity + Math.round((award.importance || 50) / 28), 0, 100);
    });

    var formDelta = 0;
    if (stats.performanceGrade === 'S') formDelta = rng.int(1, 2);
    else if (stats.performanceGrade === 'A') formDelta = 1;
    else if (stats.performanceGrade === 'B') formDelta = rng.bool(0.55) ? 1 : 0;
    else if (stats.performanceGrade === 'C') formDelta = rng.bool(0.35) ? 0 : -1;
    else formDelta = -1;
    if (stats.injuryWeeks >= 8) formDelta -= 1;
    // Soft floor: form can crash, but not stay frozen forever
    if (state.form <= 2 && stats.performanceGrade !== 'D' && formDelta < 1) {
      formDelta = rng.bool(0.55) ? 1 : 0;
    } else if (state.form <= 2 && stats.performanceGrade === 'D' && rng.bool(0.25)) {
      formDelta = 0;
    }
    state.form = NS.State.clamp(state.form + formDelta, 1, 10);

    var arcRng = rng.fork ? rng.fork('arc') : rng;
    var arc =
      NS.Rules.updateArcState
        ? NS.Rules.updateArcState(state, stats, arcRng)
        : { breakout: false, crisis: false, comeback: false };
    stats.arcFlags = arc;

    state.fitness = NS.State.clamp(
      state.fitness + (stats.injuryWeeks >= 6 ? -8 : 4) + rng.int(-3, 3),
      35,
      100
    );
    state.morale = NS.State.clamp(
      state.morale +
        (stats.performanceGrade === 'S' || stats.performanceGrade === 'A' ? 6 : 0) +
        (stats.performanceGrade === 'D' ? -8 : 0) +
        ((stats.trophies || []).length ? 3 : 0),
      10,
      100
    );
    state.clubRelation = NS.State.clamp(
      state.clubRelation +
        (stats.appearances >= 25 ? 4 : -2) +
        (stats.performanceGrade === 'D' ? -6 : 2),
      0,
      100
    );
    state.reputation = NS.State.clamp(
      state.reputation +
        (stats.performanceGrade === 'S' ? 5 : stats.performanceGrade === 'A' ? 3 : 1) +
        (stats.trophies.length ? 2 : 0),
      0,
      100
    );
    state.popularity = NS.State.clamp(
      state.popularity +
        Math.min(6, Math.floor((stats.goals + stats.assists) / 8)) +
        (stats.trophies.length ? 2 : 0),
      0,
      100
    );

    var growth = NS.Rules.growthDelta(
      state.age,
      state.rating,
      state.potential,
      state.form,
      state.seasonModifiers.minutesBias,
      state.seasonModifiers.trainingFocus,
      rng,
      {
        lastGrade: stats.performanceGrade,
        confidence: state.confidence,
        streakGood: state.streakGood,
        streakBad: state.streakBad,
        breakout: !!(arc && arc.breakout),
        crisis: !!(arc && arc.crisis),
        comeback: !!(arc && arc.comeback)
      }
    );
    if (arc && arc.breakout && growth < 2 && state.age <= 26 && (state.potential - state.rating) >= 6) {
      growth = Math.min(3, growth + 1);
    }
    state.rating = NS.State.clamp(state.rating + growth, 40, 99);
    if (state.rating > state.peakRating) state.peakRating = state.rating;

    if (NS.Rules.updateReputation) {
      NS.Rules.updateReputation(state, stats, world);
    }

    var club = NS.Rules.getClub(world, state.clubId);
    state.marketValue = NS.Rules.computeMarketValue(state, club, world);
    if (state.marketValue > (state.peakMarketValue || 0)) {
      state.peakMarketValue = state.marketValue;
    }
    state.prestige = NS.State.clamp(
      Math.round(
        state.prestige * 0.85 + (club ? club.prestige * 0.15 : 10) + (stats.trophies.length ? 2 : 0)
      ),
      0,
      100
    );

    return growth;
  }

  function CareerEngine(data) {
    this.world = NS.Rules.buildWorldIndexes(data || {});
  }

  CareerEngine.prototype.createCareer = function (input) {
    var opts = input || {};
    if (!opts.name) throw new Error('Nombre requerido');
    if (!opts.countryId || !this.world.countriesById[opts.countryId]) {
      throw new Error('countryId inválido');
    }
    if (['GK', 'DEF', 'MID', 'FWD'].indexOf(opts.position) === -1) {
      throw new Error('Posición inválida');
    }
    if (!opts.archetypeId || !this.world.archetypesById[opts.archetypeId]) {
      throw new Error('Arquetipo inválido');
    }

    var seed =
      opts.seed != null
        ? typeof opts.seed === 'number'
          ? opts.seed >>> 0
          : NS.Randomizer.hashSeed(opts.seed)
        : NS.Randomizer.hashSeed(opts.name + '|' + opts.countryId + '|' + Date.now());

    var rng = new NS.Randomizer(seed);
    var arch = this.world.archetypesById[opts.archetypeId];
    var rp = NS.Rules.initialRatingPotential(arch, rng);
    var club = null;
    if (opts.clubId) {
      club = this.world.clubsById[opts.clubId];
      if (!club) throw new Error('clubId inválido');
    } else {
      club = NS.Rules.pickStartingClub(this.world, opts.countryId, rng.fork('startClub'));
    }
    var nt = NS.Rules.nationalTeamForCountry(this.world, opts.countryId);
    var mod = arch.modifiers || {};
    var startBias = NS.Rules.startingMinutesBias
      ? NS.Rules.startingMinutesBias(
          { rating: rp.rating, potential: rp.potential, age: 17 },
          club
        )
      : 0;
    var startRole = NS.Rules.expectedRoleForClub
      ? NS.Rules.expectedRoleForClub(
          { rating: rp.rating, potential: rp.potential, age: 17 },
          club
        )
      : 'promesa';

    var state = NS.State.createInitialState({
      careerSeed: seed,
      player: {
        name: opts.name,
        countryId: opts.countryId,
        position: opts.position,
        archetypeId: opts.archetypeId
      },
      age: 17,
      clubId: club.id,
      nationalTeamId: nt ? nt.id : null,
      rating: rp.rating,
      potential: rp.potential,
      peakRating: rp.rating,
      form: rng.int(4, 7),
      confidence: rng.int(48, 62),
      reputation: NS.State.clamp(18 + (mod.reputationBias || 0), 0, 100),
      popularity: NS.State.clamp(12 + (mod.popularityBias || 0), 0, 100),
      prestige: Math.round((club.prestige || 40) * 0.25),
      money: 40000 + rng.int(0, 40000),
      clubsPlayed: [club.id],
      clubRole: startRole,
      seasonModifiers: {
        minutesBias: startBias,
        goalBias: 0,
        assistBias: 0,
        injuryRiskBias: 0,
        transferBias: 0,
        trainingFocus: null
      }
    });

    state.marketValue = NS.Rules.computeMarketValue(state, club, this.world);
    state.peakMarketValue = state.marketValue;
    // First season: play football first. Market/future decisions come after recap.
    state.phase = 'simulate';
    state.currentDecision = null;
    state.pendingOffers = [];
    state.marketCold = false;
    if (NS.Storage && NS.Storage.saveActive) NS.Storage.saveActive(state);
    return state;
  };

  CareerEngine.prototype.previewStartingClubs = function (input) {
    var opts = input || {};
    if (!opts.countryId || !this.world.countriesById[opts.countryId]) {
      throw new Error('countryId inválido');
    }
    if (!opts.archetypeId || !this.world.archetypesById[opts.archetypeId]) {
      throw new Error('Arquetipo inválido');
    }
    var seed =
      opts.seed != null
        ? typeof opts.seed === 'number'
          ? opts.seed >>> 0
          : NS.Randomizer.hashSeed(opts.seed)
        : NS.Randomizer.hashSeed(
            (opts.name || 'x') + '|' + opts.countryId + '|' + opts.archetypeId + '|preview'
          );
    var rng = new NS.Randomizer(seed);
    var arch = this.world.archetypesById[opts.archetypeId];
    var rp = NS.Rules.initialRatingPotential(arch, rng);
    return {
      seed: seed,
      rating: rp.rating,
      potential: rp.potential,
      options: NS.Rules.generateStartingClubOptions(
        this.world,
        {
          countryId: opts.countryId,
          position: opts.position,
          archetypeId: opts.archetypeId,
          rating: rp.rating,
          potential: rp.potential,
          age: 17
        },
        rng.fork('startClub')
      )
    };
  };

  CareerEngine.prototype.getRng = function (state, salt) {
    return new NS.Randomizer(state.careerSeed).fork(
      's' + state.seasonIndex + ':' + (salt || 'main') + ':a' + state.age
    );
  };

  CareerEngine.prototype.getCurrentDecision = function (state) {
    return state.currentDecision || null;
  };

  CareerEngine.prototype.resolveDecision = function (state, optionId, explicitOfferId) {
    if (state.retired) throw new Error('Carrera ya retirada');
    if (state.phase !== 'decision') throw new Error('No hay decisión pendiente');
    var rng = this.getRng(state, 'decision');
    var decision = state.currentDecision;
    var result = NS.Decisions.applyDecision(
      state,
      decision,
      optionId,
      this.world,
      rng,
      explicitOfferId
    );
    state.currentDecision = null;
    if (state.retired) {
      this._finalize(state);
      return { state: state, retired: true, transferOffer: result.transferOffer };
    }
    state.phase = 'simulate';
    if (NS.Storage && NS.Storage.saveActive) NS.Storage.saveActive(state);
    return { state: state, retired: false, transferOffer: result.transferOffer };
  };

  CareerEngine.prototype.simulateCurrentSeason = function (state) {
    if (state.retired) throw new Error('Carrera ya retirada');
    if (state.phase !== 'simulate') throw new Error('Fase inválida para simular');

    var rng = this.getRng(state, 'sim');
    var eventRng = this.getRng(state, 'event');
    var offerRng = this.getRng(state, 'offers');
    var compRng = this.getRng(state, 'comps');
    var awardRng = this.getRng(state, 'awards');

    var prevClubId =
      (state.seasonHistory.length && state.seasonHistory[state.seasonHistory.length - 1].clubId) ||
      null;
    var originClubId =
      (state.clubsPlayed && state.clubsPlayed[0]) ||
      (state.seasonHistory[0] && state.seasonHistory[0].clubId) ||
      state.clubId;
    var capsBefore = state.nationalCaps || 0;

    // In-season events first so minutes/form/injury bias this season (cause → effect)
    var pickedEvents = NS.Events.pickSeasonEvents
      ? NS.Events.pickSeasonEvents(state, this.world, eventRng)
      : [];
    if (!pickedEvents.length && NS.Events.pickEvent) {
      var legacyEv = NS.Events.pickEvent(state, this.world, eventRng);
      if (legacyEv) pickedEvents = [legacyEv];
    }
    var appliedEvents = NS.Events.applySeasonEvents
      ? NS.Events.applySeasonEvents(state, pickedEvents, eventRng)
      : [];
    var primaryEvent = appliedEvents[0] || null;

    var stats = simulateSeasonStats(state, this.world, rng);

    var clubBag = NS.Competitions.simulateClubSeason(state, this.world, compRng, stats);
    var ntBag = NS.Competitions.simulateNationalSeason(
      state,
      this.world,
      compRng.fork('nt'),
      stats
    );

    stats.trophies = (clubBag.trophyIds || []).concat(ntBag.trophyIds || []);
    stats.titles = (clubBag.titles || []).concat(ntBag.titles || []);
    stats.nationalCaps = ntBag.nationalCaps || 0;
    stats.nationalGoals = ntBag.nationalGoals || 0;
    stats.nationalAssists = ntBag.nationalAssists || 0;
    stats.competitions = {
      league: clubBag.competitions.league || null,
      nationalCup: clubBag.competitions.nationalCup || null,
      continentalCompetition: clubBag.competitions.continentalCompetition || null,
      superCup: clubBag.competitions.superCup || null,
      clubWorldCup: clubBag.competitions.clubWorldCup || null,
      nationalTeamCompetitions: ntBag.nationalTeamCompetitions || []
    };

    var seasonAwards = NS.Awards.resolveSeasonAwards(
      state,
      this.world,
      awardRng,
      stats,
      clubBag,
      ntBag
    );
    stats.awards = seasonAwards;

    var ratingBefore = state.rating;
    var growth = applySeasonAftermath(state, stats, this.world, rng);

    var seasonRecord = {
      seasonIndex: Math.max(0, state.seasonIndex),
      seasonLabel: NS.Competitions.seasonLabel(state.seasonIndex),
      age: state.age,
      clubId: state.clubId,
      competitionId: stats.competitionId,
      appearances: stats.appearances,
      goals: stats.goals,
      assists: stats.assists,
      averageRating: stats.averageRating,
      trophies: stats.trophies.slice(),
      titles: (stats.titles || []).slice(),
      awards: (stats.awards || []).slice(),
      competitions: stats.competitions,
      injuryWeeks: stats.injuryWeeks,
      nationalCaps: stats.nationalCaps,
      nationalGoals: stats.nationalGoals,
      nationalAssists: stats.nationalAssists,
      nationalRole: ntBag.role || 'none',
      performanceGrade: stats.performanceGrade,
      event: primaryEvent,
      events: appliedEvents.slice(),
      decisionId: (state.recentDecisions[0] && state.recentDecisions[0].id) || null,
      ratingBefore: ratingBefore,
      ratingAfter: state.rating,
      growth: growth,
      formAfter: state.form,
      transferThisSeason: !!(prevClubId && prevClubId !== state.clubId),
      arcFlags: stats.arcFlags ? Object.assign({}, stats.arcFlags) : null,
      returnHome: !!(
        prevClubId &&
        prevClubId !== state.clubId &&
        state.clubId === originClubId &&
        (state.clubsPlayed || []).length > 1
      ),
      moments: []
    };
    state.seasonHistory.push(seasonRecord);

    if (NS.Rules.updateClubBond) NS.Rules.updateClubBond(state, seasonRecord);
    if (NS.Rules.updateClubAttachment) NS.Rules.updateClubAttachment(state, stats);

    if (capsBefore === 0 && (stats.nationalCaps || 0) > 0) {
      seasonRecord.firstCallUp = true;
    }

    NS.Moments.detectSeasonMoments(state, seasonRecord, clubBag, ntBag, seasonAwards);

    var recordExtras = {};
    seasonAwards.forEach(function (a) {
      if (a.awardId === 'award_ballon_dor') recordExtras.ballonAge = a.age;
    });
    (stats.titles || []).forEach(function (t) {
      if (t.competitionId === 'comp_ucl') recordExtras.uclAge = state.age - 1;
      if ((t.importance || 0) >= 70) recordExtras.veteranTitleAge = state.age - 1;
    });
    NS.Records.updateCareerRecords(state, recordExtras);

    // End of loan season → return to parent club
    if (state.onLoan && state.loanParentClubId) {
      var parent = this.world.clubsById[state.loanParentClubId];
      if (parent) {
        state.clubId = parent.id;
        state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) - 0.06;
        state.clubRelation = NS.State.clamp((state.clubRelation || 50) - 2, 0, 100);
      }
      state.onLoan = false;
      state.loanParentClubId = null;
    }

    var market = NS.Rules.buildMarketPacket
      ? NS.Rules.buildMarketPacket(state, this.world, offerRng)
      : { offers: NS.Rules.generateOffers(state, this.world, offerRng, 3) };
    state.pendingOffers = market.offers || [];
    state.marketCold = !!market.cold;
    state.canLoan = !!market.canLoan;
    NS.State.resetSeasonModifiers(state);

    state.age += 1;
    state.seasonIndex += 1;

    var forced = NS.Rules.forcedRetirementChance(
      state.age,
      state.player.position,
      state.fitness,
      state.form
    );
    var retireRng = this.getRng(state, 'retire');
    if (state.age >= NS.Rules.hardAgeCap(state.player.position)) {
      state.retired = true;
      state.retirementReason = 'hard_cap';
    } else if (retireRng.bool(forced)) {
      state.retired = true;
      state.retirementReason = 'age_decline';
    }

    if (state.retired) {
      NS.Moments.detectSeasonMoments(state, seasonRecord, clubBag, ntBag, []);
      this._finalize(state);
      return {
        state: state,
        season: seasonRecord,
        event: primaryEvent,
        events: appliedEvents.slice(),
        offers: [],
        retired: true
      };
    }

    state.phase = 'decision';
    state.currentDecision = NS.Decisions.pickDecision(
      state,
      this.world,
      this.getRng(state, 'nextDec')
    );
    NS.State.touch(state);
    if (NS.Storage && NS.Storage.autosave) NS.Storage.autosave(state);
    return {
      state: state,
      season: seasonRecord,
      event: primaryEvent,
      events: appliedEvents.slice(),
      offers: state.pendingOffers.slice(),
      retired: false
    };
  };

  CareerEngine.prototype.playSeason = function (state, optionId, explicitOfferId) {
    if (state.phase === 'decision') {
      var dec = this.resolveDecision(state, optionId, explicitOfferId);
      if (dec.retired) return { state: state, retired: true, transferOffer: dec.transferOffer };
    }
    return this.simulateCurrentSeason(state);
  };

  CareerEngine.prototype.forceRetire = function (state, reason) {
    if (state.retired) return state;
    if (!NS.Rules.canVoluntaryRetire(state.age) && reason === 'voluntary') {
      throw new Error('Retiro voluntario disponible desde los 32');
    }
    state.retired = true;
    state.retirementReason = reason || 'voluntary';
    if (NS.Moments && NS.Moments.pushMoment) {
      NS.Moments.pushMoment(state, {
        id: 'moment_retire',
        label: 'Retiro',
        seasonIndex: Math.max(0, state.seasonIndex - 1),
        seasonLabel: NS.Competitions
          ? NS.Competitions.seasonLabel(Math.max(0, state.seasonIndex - 1))
          : String(state.seasonIndex),
        age: state.age,
        clubId: state.clubId,
        unique: true
      });
    }
    this._finalize(state);
    return state;
  };

  CareerEngine.prototype._finalize = function (state) {
    var result = NS.Scoring.evaluate(state, this.world);
    state.careerScore = result.score;
    state.careerCategory = result.category;
    state.careerFlags = result.flags;
    state.retirementLine = result.retirementLine;
    state.narrativeTag = result.narrativeTag || null;
    state.phase = 'retired';
    state.currentDecision = null;
    state.pendingOffers = [];
    NS.State.touch(state);
    if (NS.Storage && NS.Storage.autosave) NS.Storage.autosave(state);
    return result;
  };

  CareerEngine.prototype.evaluate = function (state) {
    return NS.Scoring.evaluate(state, this.world);
  };

  CareerEngine.prototype.getClub = function (clubId) {
    return NS.Rules.getClub(this.world, clubId);
  };

  CareerEngine.prototype.cloneState = function (state) {
    return NS.State.serialize(state);
  };

  /**
   * Auto-play helper for tests: always picks a deterministic middle option.
   */
  CareerEngine.prototype.autoPlayUntilRetired = function (state, maxSeasons) {
    var guard = maxSeasons != null ? maxSeasons : 40;
    var results = [];
    while (!state.retired && guard-- > 0) {
      if (state.phase === 'simulate') {
        results.push(this.simulateCurrentSeason(state));
        continue;
      }
      var decision = state.currentDecision;
      if ((!decision || !decision.options || !decision.options.length) && NS.Decisions.buildFutureDecision) {
        state.currentDecision = NS.Decisions.buildFutureDecision(state);
        decision = state.currentDecision;
      }
      if (!decision || !decision.options || !decision.options.length) break;
      var option = null;
      for (var i = 0; i < decision.options.length; i++) {
        var oid = decision.options[i].id;
        if (oid === 'retire_no' || oid === 'stay_loyal' || oid === 'renew_project' || oid === 'balanced') {
          option = decision.options[i];
          break;
        }
      }
      if (!option) option = decision.options[Math.min(1, decision.options.length - 1)];
      results.push(this.playSeason(state, option.id));
    }
    return results;
  };

  NS.Engine = CareerEngine;
  NS.createEngine = function (data) {
    return new CareerEngine(data);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
