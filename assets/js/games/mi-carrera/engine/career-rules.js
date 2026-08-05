(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  var LEVEL_MIN_RATING = {
    5: 84,
    4: 78,
    3: 72,
    2: 64,
    1: 50
  };

  var LEVEL_MAX_AGE_STAR = {
    5: 29,
    4: 32,
    3: 34,
    2: 36,
    1: 38
  };

  var TIER_RANK = { S: 5, A: 4, B: 3, C: 2, D: 1 };
  var RANK_TIER = { 5: 'S', 4: 'A', 3: 'B', 2: 'C', 1: 'D' };

  var BIG5 = {
    comp_premier: true,
    comp_laliga: true,
    comp_serie_a: true,
    comp_bundesliga: true,
    comp_ligue1: true
  };

  function indexById(list) {
    var map = Object.create(null);
    (list || []).forEach(function (item) {
      if (item && item.id) map[item.id] = item;
    });
    return map;
  }

  function getClub(world, clubId) {
    return world.clubsById[clubId] || null;
  }

  function getCountry(world, countryId) {
    return world.countriesById[countryId] || null;
  }

  function getCompetition(world, competitionId) {
    return world.competitionsById[competitionId] || null;
  }

  function getNationalTeam(world, ntId) {
    return world.nationalTeamsById[ntId] || null;
  }

  function nationalTeamForCountry(world, countryId) {
    var teams = world.nationalTeams || [];
    for (var i = 0; i < teams.length; i++) {
      if (teams[i].countryId === countryId) return teams[i];
    }
    return null;
  }

  function archetypeById(world, id) {
    return world.archetypesById[id] || null;
  }

  function hardAgeCap(position) {
    return position === 'GK' ? 42 : 40;
  }

  function canVoluntaryRetire(age) {
    return age >= 32;
  }

  function forcedRetirementChance(age, position, fitness, form) {
    if (age < 35) return 0;
    var cap = hardAgeCap(position);
    if (age >= cap) return 1;
    var base = (age - 34) * 0.12;
    if (fitness < 55) base += 0.15;
    if (form <= 3) base += 0.1;
    if (position === 'GK') base *= 0.75;
    return Math.min(0.85, base);
  }

  function clubTier(club, world) {
    if (!club) return 'D';
    var level = club.level || 1;
    var tier = RANK_TIER[level] || 'D';
    var comp = world ? getCompetition(world, club.primaryCompetitionId) : null;
    if (comp && BIG5[comp.id] && TIER_RANK[tier] < 4 && (club.prestige || 0) >= 78) {
      tier = 'A';
    }
    return tier;
  }

  function tierRank(tier) {
    return TIER_RANK[tier] || 1;
  }

  function regionMarketWeight(continentId, competitionId) {
    if (competitionId && BIG5[competitionId]) return 1.35;
    if (continentId === 'continent_eu') return 1.18;
    if (continentId === 'continent_sa') return 0.92;
    if (continentId === 'continent_na' || continentId === 'continent_ca') return 0.78;
    if (continentId === 'continent_as') return 0.82;
    if (continentId === 'continent_af') return 0.75;
    return 0.7;
  }

  function lastSeasonGrade(state) {
    var last = state.seasonHistory && state.seasonHistory[state.seasonHistory.length - 1];
    return last ? last.performanceGrade : null;
  }

  function recentGoalsAssists(state) {
    var last = state.seasonHistory && state.seasonHistory[state.seasonHistory.length - 1];
    if (!last) return { goals: 0, assists: 0, apps: 0 };
    return {
      goals: last.goals || 0,
      assists: last.assists || 0,
      apps: last.appearances || 0
    };
  }

  function ageBand(age) {
    if (age <= 19) return 'youth';
    if (age <= 23) return 'growth';
    if (age <= 27) return 'prime';
    if (age <= 30) return 'peak_stable';
    if (age <= 33) return 'early_decline';
    if (age <= 36) return 'decline';
    return 'late';
  }

  /**
   * Controlled age curve: fast early growth possible, decline probabilistic not automatic.
   */
  function growthDelta(age, rating, potential, form, minutesBias, trainingFocus, rng, ctx) {
    ctx = ctx || {};
    var band = ageBand(age);
    var gap = potential - rating;
    var formMod = (form - 5) * 0.1;
    var minutesMod = (minutesBias || 0) * 0.9;
    var trainMod = 0;
    if (trainingFocus === 'technical' || trainingFocus === 'tactical') trainMod = 0.18;
    if (trainingFocus === 'physical' && age >= 30) trainMod = 0.12;
    if (trainingFocus === 'media') trainMod = -0.05;

    var gradeBoost = 0;
    if (ctx.lastGrade === 'S') gradeBoost = 0.35;
    else if (ctx.lastGrade === 'A') gradeBoost = 0.2;
    else if (ctx.lastGrade === 'D') gradeBoost = -0.35;
    else if (ctx.lastGrade === 'C') gradeBoost = -0.15;

    var raw = 0;
    var maxUp = 1;
    var declineChance = 0;

    if (band === 'youth') {
      maxUp = 3;
      raw = (gap > 0 ? gap * 0.12 : 0) + formMod + minutesMod + trainMod + gradeBoost;
      raw += rng.range(-0.25, 0.55);
    } else if (band === 'growth') {
      maxUp = 2;
      raw = (gap > 0 ? gap * 0.1 : 0) + formMod + minutesMod + trainMod + gradeBoost;
      raw += rng.range(-0.3, 0.45);
    } else if (band === 'prime') {
      maxUp = 2;
      raw = (gap > 0 ? gap * 0.06 : rng.bool(0.2) ? -0.2 : 0) + formMod * 0.8 + minutesMod + trainMod + gradeBoost;
      raw += rng.range(-0.35, 0.35);
    } else if (band === 'peak_stable') {
      maxUp = 1;
      raw = formMod * 0.6 + minutesMod * 0.5 + trainMod + gradeBoost * 0.5;
      raw += rng.range(-0.45, 0.3);
      declineChance = 0.12;
    } else if (band === 'early_decline') {
      maxUp = 1;
      raw = -0.25 + formMod * 0.45 + minutesMod * 0.3 + gradeBoost * 0.3;
      raw += rng.range(-0.55, 0.25);
      declineChance = 0.35;
    } else if (band === 'decline') {
      maxUp = 0;
      raw = -0.55 + formMod * 0.35 + (rng.range(-0.5, 0.15));
      declineChance = 0.55;
    } else {
      maxUp = 0;
      raw = -0.85 + formMod * 0.25 + rng.range(-0.4, 0.1);
      declineChance = 0.7;
    }

    if (gap <= 0 && age < 31) {
      raw = Math.min(raw, formMod * 0.4 + (rng.bool(0.12) ? -1 : 0));
    }

    var delta = Math.round(raw);
    if (delta > maxUp) delta = maxUp;
    if (delta > 0 && band === 'youth' && gap > 8 && rng.bool(0.22)) {
      delta = Math.min(maxUp, delta + 1);
    }
    if (delta >= 0 && declineChance > 0 && rng.bool(declineChance)) {
      delta = Math.min(delta, -1);
    }
    if (delta === 0 && band === 'youth' && gap > 5 && form >= 6 && rng.bool(0.28)) delta = 1;

    if (rating + delta > potential && age < 32) delta = Math.max(0, potential - rating);
    if (rating + delta > 99) delta = 99 - rating;
    if (rating + delta < 40) delta = 40 - rating;

    // Hard anti-explosion: never +4 in one season
    if (delta > 3) delta = 3;
    return delta;
  }

  function computeMarketValue(state, club, world) {
    var ageFactor = 1;
    if (state.age <= 23) ageFactor = 1.25;
    else if (state.age <= 27) ageFactor = 1.15;
    else if (state.age <= 30) ageFactor = 1.0;
    else if (state.age <= 33) ageFactor = 0.7;
    else ageFactor = 0.4;

    var clubPrestige = club ? club.prestige : 40;
    var region =
      club && world
        ? regionMarketWeight(club.continentId, club.primaryCompetitionId)
        : 1;
    var base =
      Math.pow(Math.max(50, state.rating), 2) * 180 +
      state.potential * 12000 +
      state.reputation * 22000 +
      state.popularity * 9000 +
      clubPrestige * 25000;
    base *= ageFactor * region;
    base *= 0.85 + state.form / 20;
    return Math.max(50000, Math.round(base / 1000) * 1000);
  }

  function minutesFactorForClub(state, club) {
    if (!club) return 0.5;
    var need = LEVEL_MIN_RATING[club.level || 1] || 50;
    var gap = state.rating - need;
    var f = 0.48 + gap * 0.038;
    f += (state.clubRelation - 50) / 220;
    f += (state.form - 5) * 0.028;
    f += (state.fitness - 70) / 220;
    f += state.seasonModifiers.minutesBias || 0;
    // Giant club pressure: below threshold → clear bench risk
    if ((club.level || 1) >= 5 && gap < -2) f -= 0.18;
    if ((club.level || 1) >= 4 && gap < -4) f -= 0.12;
    // Small club star → near automatic starter
    if ((club.level || 1) <= 2 && gap >= 8) f += 0.16;
    return NS.State.clamp(f, 0.12, 0.98);
  }

  function maxTierStep(state, currentClub, world) {
    var cur = tierRank(clubTier(currentClub, world));
    var grade = lastSeasonGrade(state);
    var step = 1;
    if (grade === 'S') step = 2;
    else if (grade === 'A') step = 2;
    else if (grade === 'B') step = 1;
    else if (grade === 'C') step = 1;
    else step = 0;
    if (state.reputation >= 75) step += 1;
    else if (state.reputation >= 55) step += 0;
    if (state.age <= 21 && state.potential >= 90 && grade !== 'D') step = Math.max(step, 1);
    if (grade === 'D') step = Math.min(step, 0);
    return Math.min(5, cur + Math.min(2, step));
  }

  function isEligibleForClub(state, club, world) {
    if (!club || !state) return false;
    if (club.id === state.clubId) return false;
    world = world || null;
    var level = club.level || 1;
    var minRating = LEVEL_MIN_RATING[level] || 50;
    var maxAge = LEVEL_MAX_AGE_STAR[level] || 38;
    var current = world ? getClub(world, state.clubId) : null;

    if (state.age > maxAge + 2) return false;

    if (world) {
      var targetTier = tierRank(clubTier(club, world));
      var maxTier = maxTierStep(state, current, world);
      if (targetTier > maxTier) return false;
    }

    if (level >= 5) {
      var promiseOk =
        state.rating >= 80 && state.potential >= 90 && state.age <= 22 && state.reputation >= 40;
      var eliteOk = state.rating >= minRating && state.reputation >= 48;
      if (!eliteOk && !promiseOk) return false;
      if (state.age > 29 && state.rating < 86) return false;
      if (state.form <= 3) return false;
      if (current && (current.level || 1) <= 2 && state.reputation < 60 && !promiseOk) return false;
    } else if (level >= 4) {
      if (state.rating < minRating - 1 && !(state.potential >= 88 && state.rating >= minRating - 4)) {
        return false;
      }
      if (state.reputation < 28 && state.rating < minRating + 2) return false;
    } else if (level >= 3) {
      if (state.rating < minRating - 2) return false;
    } else if (level >= 2) {
      if (state.rating < minRating - 4) return false;
    }

    if (state.form <= 2 && level >= 4) return false;
    if (state.reputation < 18 && level >= 5) return false;

    if (world && current) {
      if (
        current.continentId === 'continent_sa' &&
        club.continentId === 'continent_eu' &&
        BIG5[club.primaryCompetitionId]
      ) {
        if (state.reputation < 50 && lastSeasonGrade(state) !== 'S' && lastSeasonGrade(state) !== 'A') {
          return false;
        }
      }
      if (
        current.continentId === 'continent_eu' &&
        club.continentId === 'continent_sa' &&
        state.age < 28 &&
        state.rating >= 78 &&
        lastSeasonGrade(state) !== 'D' &&
        lastSeasonGrade(state) !== 'C'
      ) {
        return false;
      }
    }

    return true;
  }

  function interestScore(state, club, world, lastGrade) {
    var level = club.level || 1;
    var score = 8;
    var recent = recentGoalsAssists(state);
    var current = getClub(world, state.clubId);
    var targetTier = tierRank(clubTier(club, world));
    var curTier = current ? tierRank(clubTier(current, world)) : 2;

    score += (state.rating - (LEVEL_MIN_RATING[level] || 50)) * 2.2;
    score += (state.potential - 75) * 0.7;
    score += (state.form - 5) * 3.2;
    score += (state.reputation - 40) * 0.45;
    score += (state.popularity - 40) * 0.12;
    score += Math.min(18, (state.marketValue || 0) / 6000000);
    score += Math.min(10, recent.goals * 0.35 + recent.assists * 0.25);

    var country = getCountry(world, state.player.countryId);
    if (country && club.continentId === country.continentId) score += 5;
    if (country && club.countryId === country.id) score += 4;

    if (lastGrade === 'S') score += 12;
    else if (lastGrade === 'A') score += 7;
    else if (lastGrade === 'B') score += 2;
    else if (lastGrade === 'C') score -= 4;
    else if (lastGrade === 'D') score -= 10;

    // Global weight: Europe / Big5 stronger market pull
    score *= regionMarketWeight(club.continentId, club.primaryCompetitionId);

    // Step-up preference vs lateral / downgrade
    var step = targetTier - curTier;
    if (step === 1) score += 6;
    else if (step === 2) score += 2;
    else if (step > 2) score -= 12;
    else if (step < 0) {
      if (state.age >= 30 || lastGrade === 'D' || lastGrade === 'C') score += 4;
      else score -= 8;
    }

    // SA dominance → Europe mid/top interest
    if (
      current &&
      current.continentId === 'continent_sa' &&
      club.continentId === 'continent_eu' &&
      (lastGrade === 'S' || lastGrade === 'A') &&
      state.reputation >= 55
    ) {
      score += 14;
    }

    // Late career homecoming / SA return
    if (
      current &&
      current.continentId === 'continent_eu' &&
      club.continentId === 'continent_sa' &&
      state.age >= 30
    ) {
      score += 10;
    }

    score -= Math.max(0, (club.prestige || 50) - state.prestige) * 0.12;
    score += (state.seasonModifiers.transferBias || 0) * 22;
    return score;
  }

  function roleForOffer(state, club) {
    var need = LEVEL_MIN_RATING[club.level || 1] || 50;
    var gap = state.rating - need;
    if (state.age <= 21 && state.potential >= 85) return 'promesa';
    if (gap >= 2 && state.form >= 6) return 'titular';
    if (gap < -3) return 'rotacion';
    return state.rating >= need - 1 ? 'titular' : 'rotacion';
  }

  function marketOpenChance(state, lastGrade) {
    var p = 0.38;
    if (lastGrade === 'S') p = 0.84;
    else if (lastGrade === 'A') p = 0.7;
    else if (lastGrade === 'B') p = 0.48;
    else if (lastGrade === 'C') p = 0.26;
    else if (lastGrade === 'D') p = 0.12;
    else p = 0.4;
    p += (state.reputation - 40) * 0.0035;
    p += (state.form - 5) * 0.025;
    p += (state.seasonModifiers.transferBias || 0) * 0.28;
    if (state.age >= 34) p *= 0.55;
    if (state.age <= 19) p *= 0.85;
    return NS.State.clamp(p, 0.06, 0.92);
  }

  function generateOffers(state, world, rng, maxOffers) {
    maxOffers = maxOffers == null ? 4 : Math.min(4, maxOffers);
    var clubs = world.clubs || [];
    var lastGrade = lastSeasonGrade(state);
    if (!rng.bool(marketOpenChance(state, lastGrade))) {
      return [];
    }

    var candidates = [];
    for (var i = 0; i < clubs.length; i++) {
      var club = clubs[i];
      if (!isEligibleForClub(state, club, world)) continue;
      var interest = interestScore(state, club, world, lastGrade);
      if (interest < 10) continue;
      candidates.push({ club: club, interest: interest });
    }

    if (!candidates.length) return [];

    candidates.sort(function (a, b) {
      return b.interest - a.interest;
    });

    var pool = candidates.slice(0, Math.min(16, candidates.length));
    var count = 0;
    if (lastGrade === 'S' || lastGrade === 'A') count = rng.int(1, Math.min(maxOffers, pool.length));
    else if (lastGrade === 'B') count = rng.int(0, Math.min(3, pool.length));
    else count = rng.int(0, Math.min(2, pool.length));

    if (count === 0 && state.rating >= 82 && state.reputation >= 55 && rng.bool(0.4)) count = 1;
    if (state.age >= 34) count = Math.min(count, 1);

    var picked = [];
    var used = Object.create(null);
    var shuffled = rng.shuffle(pool);
    for (var j = 0; j < shuffled.length && picked.length < count; j++) {
      var item = shuffled[j];
      if (used[item.club.id]) continue;
      if (item.interest < 14 && !rng.bool(0.22)) continue;
      // Soft rarity: tier S even when eligible
      if ((item.club.level || 1) >= 5 && !rng.bool(0.35 + Math.max(0, state.reputation - 60) / 80)) {
        continue;
      }
      used[item.club.id] = true;
      var role = roleForOffer(state, item.club);
      var region = regionMarketWeight(item.club.continentId, item.club.primaryCompetitionId);
      var wage = Math.round(
        (80000 + state.rating * 12000 + item.club.prestige * 4000) *
          (role === 'titular' ? 1.1 : 0.85) *
          region
      );
      picked.push({
        id: 'offer_' + state.seasonIndex + '_' + item.club.id,
        clubId: item.club.id,
        role: role,
        wage: wage,
        years: role === 'promesa' ? 4 : role === 'titular' ? 3 : 2,
        interest: Math.round(item.interest),
        prestige: item.club.prestige,
        level: item.club.level,
        tier: clubTier(item.club, world),
        blurb:
          role === 'titular'
            ? 'Proyecto con minutos claros.'
            : role === 'promesa'
              ? 'Te ven como apuesta de futuro.'
              : 'Rotación en un escaparate mayor.'
      });
    }
    return picked;
  }

  function updateReputation(state, stats, world) {
    var delta = 0;
    var grade = stats.performanceGrade;
    if (grade === 'S') delta += 4;
    else if (grade === 'A') delta += 2;
    else if (grade === 'B') delta += 0;
    else if (grade === 'C') delta -= 1;
    else delta -= 3;

    (stats.titles || []).forEach(function (t) {
      delta += Math.min(5, Math.round((t.importance || 50) / 28));
    });
    (stats.awards || []).forEach(function (a) {
      delta += Math.min(4, Math.round((a.importance || 50) / 35));
    });

    var club = getClub(world, state.clubId);
    if (club && BIG5[club.primaryCompetitionId] && (stats.appearances || 0) >= 25) delta += 1;
    if (club && club.continentId === 'continent_sa' && (stats.trophies || []).indexOf('comp_libertadores') !== -1) {
      delta += 3;
    }
    if ((stats.nationalCaps || 0) >= 4) delta += 1;
    if ((stats.appearances || 0) < 12) delta -= 1;

    // Reputation is not OVR: soften pure rating carry
    if (state.rating >= 85 && grade === 'D') delta -= 1;

    state.reputation = NS.State.clamp(state.reputation + delta, 0, 100);
    return delta;
  }

  function pickStartingClub(world, countryId, rng) {
    var local = (world.clubs || []).filter(function (c) {
      return c.countryId === countryId && (c.level || 1) <= 4;
    });
    if (!local.length) {
      var country = getCountry(world, countryId);
      local = (world.clubs || []).filter(function (c) {
        return country && c.continentId === country.continentId && (c.level || 1) <= 3;
      });
    }
    if (!local.length) {
      local = (world.clubs || []).filter(function (c) {
        return (c.level || 1) <= 2;
      });
    }
    if (!local.length) local = world.clubs || [];
    var youth = local.filter(function (c) {
      return (c.level || 1) <= 3;
    });
    var pool = youth.length ? youth : local;
    return rng.pick(pool);
  }

  function initialRatingPotential(archetype, rng) {
    var mod = (archetype && archetype.modifiers) || {};
    var rating = rng.int(58, 66) + (mod.ratingBias || 0);
    var potential = rng.int(76, 90) + (mod.potentialBias || 0);
    rating = NS.State.clamp(rating, 50, 72);
    potential = NS.State.clamp(Math.max(rating + 8, potential), rating + 6, 96);
    return { rating: rating, potential: potential };
  }

  function buildWorldIndexes(data) {
    return {
      continents: data.continents || [],
      countries: data.countries || [],
      competitions: data.competitions || [],
      nationalTeams: data.nationalTeams || [],
      clubs: data.clubs || [],
      archetypes: data.archetypes || [],
      decisions: data.decisions || [],
      events: data.events || [],
      retirementLines: data.retirementLines || [],
      awards: data.awards || [],
      continentsById: indexById(data.continents),
      countriesById: indexById(data.countries),
      competitionsById: indexById(data.competitions),
      nationalTeamsById: indexById(data.nationalTeams),
      clubsById: indexById(data.clubs),
      archetypesById: indexById(data.archetypes),
      decisionsById: indexById(data.decisions),
      eventsById: indexById(data.events),
      awardsById: indexById(data.awards)
    };
  }

  function performanceGrade(avgRating, appearances, injuryWeeks) {
    if (injuryWeeks >= 16 || appearances < 8) return 'D';
    if (avgRating >= 8.2 && appearances >= 25) return 'S';
    if (avgRating >= 7.5) return 'A';
    if (avgRating >= 6.8) return 'B';
    if (avgRating >= 6.2) return 'C';
    return 'D';
  }

  NS.Rules = {
    LEVEL_MIN_RATING: LEVEL_MIN_RATING,
    LEVEL_MAX_AGE_STAR: LEVEL_MAX_AGE_STAR,
    BIG5: BIG5,
    TIER_RANK: TIER_RANK,
    hardAgeCap: hardAgeCap,
    canVoluntaryRetire: canVoluntaryRetire,
    forcedRetirementChance: forcedRetirementChance,
    growthDelta: growthDelta,
    computeMarketValue: computeMarketValue,
    isEligibleForClub: isEligibleForClub,
    generateOffers: generateOffers,
    pickStartingClub: pickStartingClub,
    initialRatingPotential: initialRatingPotential,
    buildWorldIndexes: buildWorldIndexes,
    getClub: getClub,
    getCountry: getCountry,
    getCompetition: getCompetition,
    getNationalTeam: getNationalTeam,
    nationalTeamForCountry: nationalTeamForCountry,
    archetypeById: archetypeById,
    performanceGrade: performanceGrade,
    interestScore: interestScore,
    clubTier: clubTier,
    tierRank: tierRank,
    ageBand: ageBand,
    minutesFactorForClub: minutesFactorForClub,
    updateReputation: updateReputation,
    marketOpenChance: marketOpenChance,
    regionMarketWeight: regionMarketWeight,
    maxTierStep: maxTierStep
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
