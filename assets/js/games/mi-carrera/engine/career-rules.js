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

  function growthDelta(age, rating, potential, form, minutesBias, trainingFocus, rng) {
    var gap = potential - rating;
    if (gap <= 0 && age < 32) {
      return rng.bool(0.15) ? -1 : 0;
    }
    var rate;
    if (age <= 21) rate = 0.55;
    else if (age <= 27) rate = 0.35;
    else if (age <= 31) rate = 0.12;
    else if (age <= 34) rate = -0.35;
    else rate = -0.7;

    var formMod = (form - 5) * 0.08;
    var minutesMod = (minutesBias || 0) * 0.8;
    var trainMod = 0;
    if (trainingFocus === 'technical' || trainingFocus === 'tactical') trainMod = 0.15;
    if (trainingFocus === 'physical' && age >= 30) trainMod = 0.1;
    if (trainingFocus === 'media') trainMod = -0.05;

    var raw = gap * rate * 0.15 + formMod + minutesMod + trainMod;
    if (age >= 32) {
      raw = rate + formMod * 0.5 + (rng.range(-0.4, 0.2));
    } else {
      raw += rng.range(-0.35, 0.45);
    }

    var delta = Math.round(raw);
    if (delta === 0 && age <= 21 && gap > 4 && rng.bool(0.35)) delta = 1;
    if (rating + delta > potential && age < 32) delta = Math.max(0, potential - rating);
    if (rating + delta > 99) delta = 99 - rating;
    if (rating + delta < 40) delta = 40 - rating;
    return delta;
  }

  function computeMarketValue(state, club) {
    var ageFactor = 1;
    if (state.age <= 23) ageFactor = 1.25;
    else if (state.age <= 27) ageFactor = 1.15;
    else if (state.age <= 30) ageFactor = 1.0;
    else if (state.age <= 33) ageFactor = 0.7;
    else ageFactor = 0.4;

    var clubPrestige = club ? club.prestige : 40;
    var base =
      Math.pow(Math.max(50, state.rating), 2) * 180 +
      state.potential * 12000 +
      state.reputation * 18000 +
      state.popularity * 9000 +
      clubPrestige * 25000;
    base *= ageFactor;
    base *= 0.85 + state.form / 20;
    return Math.max(50000, Math.round(base / 1000) * 1000);
  }

  function isEligibleForClub(state, club) {
    if (!club || !state) return false;
    if (club.id === state.clubId) return false;
    var level = club.level || 1;
    var minRating = LEVEL_MIN_RATING[level] || 50;
    var maxAge = LEVEL_MAX_AGE_STAR[level] || 38;

    if (state.age > maxAge + 2) return false;

    if (level >= 5) {
      var promiseOk = state.rating >= 78 && state.potential >= 90 && state.age <= 23;
      if (state.rating < minRating && !promiseOk) return false;
      if (state.age > 29 && state.rating < 86) return false;
    } else if (level >= 4) {
      if (state.rating < minRating && !(state.potential >= 88 && state.rating >= minRating - 4)) {
        return false;
      }
    } else if (level >= 3) {
      if (state.rating < minRating - 2) return false;
    } else if (level >= 2) {
      if (state.rating < minRating - 4) return false;
    }

    if (state.form <= 2 && level >= 4) return false;
    if (state.reputation < 15 && level >= 5) return false;
    return true;
  }

  function interestScore(state, club, world, lastGrade) {
    var level = club.level || 1;
    var score = 10;
    score += (state.rating - (LEVEL_MIN_RATING[level] || 50)) * 2;
    score += (state.potential - 75) * 0.8;
    score += (state.form - 5) * 3;
    score += (state.reputation - 40) * 0.3;
    score += (state.popularity - 40) * 0.15;
    score += Math.min(20, (state.marketValue || 0) / 5000000);

    var country = getCountry(world, state.player.countryId);
    if (country && club.continentId === country.continentId) score += 6;
    if (country && club.countryId === country.id) score += 4;

    if (lastGrade === 'S') score += 10;
    else if (lastGrade === 'A') score += 6;
    else if (lastGrade === 'B') score += 2;
    else if (lastGrade === 'D') score -= 8;

    score -= Math.max(0, club.prestige - state.prestige) * 0.15;
    score += (state.seasonModifiers.transferBias || 0) * 20;
    return score;
  }

  function roleForOffer(state, club) {
    var gap = (club.prestige || 50) - state.rating;
    if (state.age <= 21 && state.potential >= 85) return 'promesa';
    if (state.rating + 4 >= (LEVEL_MIN_RATING[club.level] || 50) && state.form >= 6) return 'titular';
    if (gap > 15) return 'rotacion';
    return state.rating >= 75 ? 'titular' : 'rotacion';
  }

  function generateOffers(state, world, rng, maxOffers) {
    maxOffers = maxOffers == null ? 3 : maxOffers;
    var clubs = world.clubs || [];
    var last = state.seasonHistory[state.seasonHistory.length - 1];
    var lastGrade = last ? last.performanceGrade : null;
    var candidates = [];

    for (var i = 0; i < clubs.length; i++) {
      var club = clubs[i];
      if (!isEligibleForClub(state, club)) continue;
      var interest = interestScore(state, club, world, lastGrade);
      if (interest < 8) continue;
      candidates.push({ club: club, interest: interest });
    }

    if (!candidates.length) return [];

    candidates.sort(function (a, b) {
      return b.interest - a.interest;
    });

    var pool = candidates.slice(0, Math.min(18, candidates.length));
    var count = rng.int(0, Math.min(maxOffers, pool.length));
    if (state.rating >= 80 && count === 0 && rng.bool(0.55)) count = 1;
    if (state.age >= 34) count = Math.min(count, 1);

    var picked = [];
    var used = Object.create(null);
    var shuffled = rng.shuffle(pool);
    for (var j = 0; j < shuffled.length && picked.length < count; j++) {
      var item = shuffled[j];
      if (used[item.club.id]) continue;
      if (item.interest < 12 && !rng.bool(0.25)) continue;
      used[item.club.id] = true;
      var role = roleForOffer(state, item.club);
      var wage =
        Math.round(
          (80000 + state.rating * 12000 + item.club.prestige * 4000) * (role === 'titular' ? 1.1 : 0.85)
        );
      picked.push({
        id: 'offer_' + state.seasonIndex + '_' + item.club.id,
        clubId: item.club.id,
        role: role,
        wage: wage,
        years: role === 'promesa' ? 4 : role === 'titular' ? 3 : 2,
        interest: Math.round(item.interest),
        prestige: item.club.prestige,
        level: item.club.level
      });
    }
    return picked;
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
      continentsById: indexById(data.continents),
      countriesById: indexById(data.countries),
      competitionsById: indexById(data.competitions),
      nationalTeamsById: indexById(data.nationalTeams),
      clubsById: indexById(data.clubs),
      archetypesById: indexById(data.archetypes),
      decisionsById: indexById(data.decisions),
      eventsById: indexById(data.events)
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
    interestScore: interestScore
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
