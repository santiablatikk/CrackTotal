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
    // Prestige bias without making Europe the only “correct” path
    if (competitionId && BIG5[competitionId]) return 1.26;
    if (continentId === 'continent_eu') return 1.1;
    if (continentId === 'continent_sa') return 1.04;
    if (continentId === 'continent_na' || continentId === 'continent_ca') return 0.82;
    if (continentId === 'continent_as') return 0.84;
    if (continentId === 'continent_af') return 0.78;
    return 0.72;
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

    var confidence = ctx.confidence != null ? ctx.confidence : 55;
    var confMod = (confidence - 55) * 0.008;
    if (ctx.breakout) gradeBoost += 0.55;
    if (ctx.crisis) gradeBoost -= 0.4;
    if (ctx.comeback) gradeBoost += 0.45;
    if ((ctx.streakBad || 0) >= 3) gradeBoost -= 0.2;
    if ((ctx.streakGood || 0) >= 3) gradeBoost += 0.15;

    var raw = 0;
    var maxUp = 1;
    var declineChance = 0;

    if (band === 'youth') {
      maxUp = 3;
      raw = (gap > 0 ? gap * 0.12 : 0) + formMod + minutesMod + trainMod + gradeBoost + confMod;
      raw += rng.range(-0.35, 0.65);
    } else if (band === 'growth') {
      maxUp = 2;
      raw = (gap > 0 ? gap * 0.1 : 0) + formMod + minutesMod + trainMod + gradeBoost + confMod;
      raw += rng.range(-0.4, 0.5);
    } else if (band === 'prime') {
      maxUp = 2;
      raw = (gap > 0 ? gap * 0.06 : rng.bool(0.2) ? -0.2 : 0) + formMod * 0.8 + minutesMod + trainMod + gradeBoost + confMod * 0.7;
      raw += rng.range(-0.4, 0.4);
    } else if (band === 'peak_stable') {
      maxUp = 1;
      raw = formMod * 0.6 + minutesMod * 0.5 + trainMod + gradeBoost * 0.5 + confMod * 0.5;
      raw += rng.range(-0.5, 0.3);
      declineChance = 0.12;
    } else if (band === 'early_decline') {
      maxUp = 1;
      raw = -0.25 + formMod * 0.45 + minutesMod * 0.3 + gradeBoost * 0.3 + confMod * 0.35;
      raw += rng.range(-0.55, 0.25);
      declineChance = 0.35;
      // Veterans can still surge after a comeback season
      if (ctx.comeback && rng.bool(0.4)) {
        maxUp = 1;
        declineChance *= 0.4;
      }
    } else if (band === 'decline') {
      maxUp = 0;
      raw = -0.55 + formMod * 0.35 + (rng.range(-0.5, 0.15)) + confMod * 0.2;
      declineChance = 0.55;
      if (ctx.comeback && rng.bool(0.25)) {
        maxUp = 1;
        raw += 0.4;
        declineChance = 0.25;
      }
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

  function expectedRoleForClub(stateLike, club) {
    var rating = stateLike.rating != null ? stateLike.rating : 62;
    var age = stateLike.age != null ? stateLike.age : 17;
    var potential = stateLike.potential != null ? stateLike.potential : 80;
    var need = LEVEL_MIN_RATING[club.level || 1] || 50;
    var gap = rating - need;
    if (age <= 20 && potential >= 84 && (club.level || 1) >= 4 && gap < 0) return 'promesa';
    if (gap >= 2) return 'titular';
    if (gap >= -2 && (club.level || 1) <= 3) return 'titular';
    if (gap < -6 || (club.level || 1) >= 5) return 'rotacion';
    if (gap < -2) return 'rotacion';
    return age <= 19 ? 'promesa' : 'rotacion';
  }

  function expectedMinutesBand(stateLike, club) {
    var role = expectedRoleForClub(stateLike, club);
    var level = club.level || 1;
    var rating = stateLike.rating != null ? stateLike.rating : 62;
    var need = LEVEL_MIN_RATING[level] || 50;
    var gap = rating - need;
    if (level >= 5 && gap < 0) return { id: 'bench', label: 'Pocos minutos', appsHint: '8–16' };
    if (level >= 4 && gap < -2) return { id: 'bench', label: 'Pocos minutos', appsHint: '10–18' };
    if (role === 'titular' && level <= 2) return { id: 'starter', label: 'Titular', appsHint: '28–34' };
    if (role === 'titular') return { id: 'rotation_high', label: 'Minutos altos', appsHint: '24–32' };
    if (role === 'promesa') return { id: 'promise', label: 'Entradas y copas', appsHint: '12–22' };
    return { id: 'rotation', label: 'Rotación', appsHint: '16–26' };
  }

  function startingMinutesBias(stateLike, club) {
    var level = club.level || 1;
    var need = LEVEL_MIN_RATING[level] || 50;
    var gap = (stateLike.rating || 62) - need;
    var bias = 0;
    if (level >= 5) bias -= 0.18;
    else if (level >= 4) bias -= 0.12;
    else if (level <= 2) bias += 0.16;
    else if (level === 3) bias += 0.04;
    if (gap < -8) bias -= 0.08;
    else if (gap >= 6) bias += 0.08;
    if (stateLike.onLoan) bias += 0.18;
    return bias;
  }

  function minutesFactorForClub(state, club) {
    if (!club) return 0.5;
    var need = LEVEL_MIN_RATING[club.level || 1] || 50;
    var gap = state.rating - need;
    var level = club.level || 1;
    var f = 0.46 + gap * 0.038;
    f += (state.clubRelation - 50) / 220;
    f += (state.form - 5) * 0.028;
    f += (state.fitness - 70) / 220;
    f += state.seasonModifiers.minutesBias || 0;
    // Giant club pressure: below threshold → clear bench risk
    if (level >= 5 && gap < 0) f -= 0.18;
    else if (level >= 5 && gap < 4) f -= 0.1;
    if (level >= 4 && gap < -2) f -= 0.12;
    if (level >= 4 && gap < 2 && state.age <= 20) f -= 0.06;
    // Development clubs → minutes for growth
    if (level <= 2 && gap >= -2) f += 0.18;
    if (level <= 2 && gap >= 6) f += 0.1;
    if (level === 3 && gap >= 0) f += 0.08;
    if (state.onLoan) f += 0.16;
    return NS.State.clamp(f, 0.18, 0.98);
  }

  function pathMetaForLevel(level) {
    if (level >= 5 || level >= 4) {
      return {
        pathId: 'giant',
        pathLabel: 'El escaparate',
        tagline: 'Competí desde arriba.',
        stars: level >= 5 ? 5 : 4
      };
    }
    if (level >= 3) {
      return {
        pathId: 'balance',
        pathLabel: 'El equilibrio',
        tagline: 'Minutos y crecimiento.',
        stars: 3
      };
    }
    return {
      pathId: 'minutes',
      pathLabel: 'El protagonismo',
      tagline: 'Jugar para crecer.',
      stars: Math.max(1, level)
    };
  }

  function pickBestFromPool(pool, preferHigh) {
    if (!pool.length) return null;
    var sorted = pool.slice().sort(function (a, b) {
      var d = (b.prestige || 0) - (a.prestige || 0);
      if (d) return preferHigh ? d : -d;
      return preferHigh ? (b.level || 1) - (a.level || 1) : (a.level || 1) - (b.level || 1);
    });
    return sorted[0];
  }

  function generateStartingClubOptions(world, ctx, rng) {
    ctx = ctx || {};
    var countryId = ctx.countryId;
    var country = getCountry(world, countryId);
    var age = ctx.age != null ? ctx.age : 17;
    var stateLike = {
      rating: ctx.rating != null ? ctx.rating : 62,
      potential: ctx.potential != null ? ctx.potential : 82,
      age: age
    };

    function usable(c) {
      return c && !c.incomplete && c.countryId;
    }

    var local = (world.clubs || []).filter(function (c) {
      return usable(c) && c.countryId === countryId;
    });
    if (local.length < 3 && country) {
      var continental = (world.clubs || []).filter(function (c) {
        return usable(c) && c.continentId === country.continentId;
      });
      local = local.concat(
        continental.filter(function (c) {
          return c.countryId !== countryId;
        })
      );
    }
    if (local.length < 3) {
      local = (world.clubs || []).filter(usable);
    }

    var byLevel = { 5: [], 4: [], 3: [], 2: [], 1: [] };
    local.forEach(function (c) {
      var lv = c.level || 1;
      if (!byLevel[lv]) byLevel[lv] = [];
      byLevel[lv].push(c);
    });

    var giantPool = byLevel[5].concat(byLevel[4]);
    var midPool = byLevel[3].length ? byLevel[3] : byLevel[4];
    var smallPool = byLevel[2].concat(byLevel[1]);
    if (!smallPool.length) smallPool = byLevel[3];
    if (!giantPool.length) giantPool = midPool.slice();
    if (!midPool.length) midPool = giantPool.concat(smallPool);

    var giant = pickBestFromPool(rng.shuffle(giantPool).slice(0, Math.min(6, giantPool.length)), true);
    var small = pickBestFromPool(rng.shuffle(smallPool).slice(0, Math.min(8, smallPool.length)), false);
    var midCandidates = midPool.filter(function (c) {
      return c && giant && small && c.id !== giant.id && c.id !== small.id;
    });
    if (!midCandidates.length) {
      midCandidates = local.filter(function (c) {
        return c && (!giant || c.id !== giant.id) && (!small || c.id !== small.id);
      });
    }
    var mid = pickBestFromPool(rng.shuffle(midCandidates).slice(0, Math.min(8, midCandidates.length)), true);

    // Soft surprise: occasionally swap mid with another continental club
    if (rng.bool(0.18) && country) {
      var surprise = (world.clubs || []).filter(function (c) {
        return (
          usable(c) &&
          c.continentId === country.continentId &&
          (c.level || 1) === 3 &&
          (!giant || c.id !== giant.id) &&
          (!small || c.id !== small.id)
        );
      });
      if (surprise.length) mid = rng.pick(surprise);
    }

    var picked = [giant, mid, small].filter(Boolean);
    var used = Object.create(null);
    var unique = [];
    picked.forEach(function (c) {
      if (!c || used[c.id]) return;
      used[c.id] = true;
      unique.push(c);
    });
    // Fill to exactly 3
    var filler = rng.shuffle(local.slice());
    for (var i = 0; unique.length < 3 && i < filler.length; i++) {
      if (used[filler[i].id]) continue;
      used[filler[i].id] = true;
      unique.push(filler[i]);
    }

    // Order: giant, balance, minutes — by level desc then prestige
    unique.sort(function (a, b) {
      var ld = (b.level || 1) - (a.level || 1);
      if (ld) return ld;
      return (b.prestige || 0) - (a.prestige || 0);
    });
    unique = unique.slice(0, 3);

    // Ensure level spread when possible
    var levels = unique.map(function (c) {
      return c.level || 1;
    });
    var distinctLevels = levels.filter(function (v, idx, arr) {
      return arr.indexOf(v) === idx;
    });
    if (distinctLevels.length < 2 && local.length >= 3) {
      var low = pickBestFromPool(
        local.filter(function (c) {
          return (c.level || 1) <= 2 && !used[c.id];
        }),
        false
      );
      if (low) unique[2] = low;
    }

    return unique.map(function (club, idx) {
      var meta = pathMetaForLevel(club.level || 1);
      if (idx === 0 && (club.level || 1) >= 4) meta = pathMetaForLevel(5);
      if (idx === 2 && (club.level || 1) <= 3) {
        meta = pathMetaForLevel(2);
        meta.stars = Math.min(meta.stars, club.level || 2);
      }
      if (idx === 1) {
        meta.pathId = 'balance';
        meta.pathLabel = 'El equilibrio';
        meta.tagline = 'Minutos y crecimiento.';
        meta.stars = Math.min(4, Math.max(2, club.level || 3));
      }
      var mins = expectedMinutesBand(stateLike, club);
      var role = expectedRoleForClub(stateLike, club);
      var comp = getCompetition(world, club.primaryCompetitionId);
      return {
        clubId: club.id,
        club: club,
        pathId: meta.pathId,
        pathLabel: meta.pathLabel,
        tagline: meta.tagline,
        stars: meta.stars,
        role: role,
        minutes: mins,
        competitionId: club.primaryCompetitionId,
        competitionName: comp ? comp.shortName || comp.name : '',
        prestige: club.prestige || 0,
        level: club.level || 1,
        tier: clubTier(club, world)
      };
    });
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
        // SA → Big5 requires a real peak, not just good OVR
        if (
          state.reputation < 42 &&
          lastSeasonGrade(state) !== 'S' &&
          lastSeasonGrade(state) !== 'A'
        ) {
          return false;
        }
      }
      if (
        current.continentId === 'continent_eu' &&
        club.continentId === 'continent_sa' &&
        state.age < 26 &&
        state.rating >= 82 &&
        lastSeasonGrade(state) === 'S'
      ) {
        // Only block mid-prime EU stars from dumping to SA after a historic year
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
      state.reputation >= 48
    ) {
      score += 10;
    }

    // SA clubs remain attractive: minutes, idol path, continental glory
    if (club.continentId === 'continent_sa') {
      score += 5;
      if (recent.apps >= 24) score += 4;
      if ((state.nationalCaps || 0) >= 8) score += 3;
      if (state.age >= 28) score += 3;
    }

    // Late career homecoming / SA return
    if (
      current &&
      current.continentId === 'continent_eu' &&
      club.continentId === 'continent_sa' &&
      (state.age >= 28 || lastGrade === 'D' || lastGrade === 'C')
    ) {
      score += 12;
    }

    // Mexico / NA as bridge path
    if (
      club.continentId === 'continent_na' &&
      current &&
      (current.continentId === 'continent_sa' || current.continentId === 'continent_eu')
    ) {
      score += state.age >= 24 && state.age <= 31 ? 4 : 1;
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
    p += ((state.confidence || 55) - 55) * 0.002;
    p += (state.streakGood || 0) * 0.035;
    p -= (state.streakBad || 0) * 0.04;
    p += (state.seasonModifiers.transferBias || 0) * 0.28;
    if (state.age >= 34) p *= 0.55;
    if (state.age <= 19) p *= 0.85;
    if ((state.arcFlags && state.arcFlags.crisis) || state.form <= 2) p *= 0.55;
    if (state.arcFlags && state.arcFlags.breakout) p = Math.min(0.95, p + 0.12);
    return NS.State.clamp(p, 0.06, 0.92);
  }

  function classifyMarketFamily(state, club, kind, world) {
    if (kind === 'loan') return 'LOAN';
    if (!club) return 'LATERAL';
    var current = getClub(world, state.clubId);
    var country = getCountry(world, state.player.countryId);
    var curLevel = current ? current.level || 1 : 2;
    var lv = club.level || 1;
    var played = state.clubsPlayed || [];

    if (played.indexOf(club.id) !== -1 && club.id !== state.clubId) return 'RETURN';
    if (country && club.countryId === country.id && (!current || current.countryId !== country.id)) {
      return 'HOME';
    }
    if (
      current &&
      yearsAtClubApprox(state) >= 4 &&
      club.id === state.clubId
    ) {
      return 'LEGACY';
    }
    if (lv >= 5 && curLevel <= 3) return 'GIANT';
    if (lv > curLevel + 1) return 'STEP_UP';
    if (lv > curLevel) return 'STEP_UP';
    if (lv < curLevel && (state.age >= 30 || lastSeasonGrade(state) === 'D' || lastSeasonGrade(state) === 'C')) {
      return 'DECLINE';
    }
    if (lv < curLevel) return 'MINUTES';
    if (
      current &&
      current.continentId === 'continent_sa' &&
      club.continentId === 'continent_eu'
    ) {
      return 'EUROPE';
    }
    if (
      current &&
      current.continentId === 'continent_eu' &&
      club.continentId === 'continent_sa'
    ) {
      return 'SOUTH_AMERICA';
    }
    if (club.continentId === 'continent_sa' && (!current || current.continentId !== 'continent_sa')) {
      return 'SOUTH_AMERICA';
    }
    if (club.continentId === 'continent_eu' && (!current || current.continentId !== 'continent_eu')) {
      return 'EUROPE';
    }
    return 'LATERAL';
  }

  function yearsAtClubApprox(state) {
    var hist = state.seasonHistory || [];
    var n = 0;
    for (var i = hist.length - 1; i >= 0; i--) {
      if (hist[i].clubId === state.clubId) n += 1;
      else break;
    }
    return n;
  }

  function craftOfferBlurb(state, club, role, world, rng, family) {
    var current = getClub(world, state.clubId);
    var pool = [];
    var pos = state.player ? state.player.position : 'MID';
    var posWord =
      pos === 'FWD' ? 'delantero' : pos === 'DEF' ? 'defensor' : pos === 'GK' ? 'arquero' : 'mediocampista';
    var fam = family || classifyMarketFamily(state, club, 'transfer', world);

    if (fam === 'LOAN') {
      pool.push('Cesión para sumar minutos y volver más fuerte.');
      pool.push('El club te manda a jugar. Es una apuesta temporal.');
      pool.push('Minutos afuera. Regreso con otra cara.');
    } else if (fam === 'STEP_UP') {
      pool.push('Es un salto de nivel. La presión sube.');
      pool.push('Te llaman desde más arriba. El riesgo también.');
      pool.push('Más escaparate. Menos garantía de titularidad.');
    } else if (fam === 'GIANT') {
      pool.push('Un gigante te abre la puerta. El banquillo es real.');
      pool.push('Escaparate máximo. Minutos a conquistar.');
    } else if (fam === 'MINUTES') {
      pool.push('Menos escaparate. Más protagonismo.');
      pool.push('Te ofrecen ser el dueño del puesto.');
    } else if (fam === 'HOME') {
      pool.push('Desde casa te quieren de vuelta.');
      pool.push('Un club de tu país pone la oferta sobre la mesa.');
    } else if (fam === 'RETURN') {
      pool.push('El club donde ya estuviste quiere recuperarte.');
      pool.push('Vuelven a llamar. Conocen tu versión.');
    } else if (fam === 'EUROPE') {
      pool.push('Europa te está mirando.');
      pool.push('Tu temporada en Sudamérica llamó su atención.');
    } else if (fam === 'SOUTH_AMERICA') {
      pool.push('Sudamérica ofrece protagonismo y otra historia.');
      pool.push('Libertadores, hinchada y minutos de verdad.');
    } else if (fam === 'DECLINE') {
      pool.push('El mercado se enfría. Aparece una salida realista.');
      pool.push('Un club inferior te garantiza continuidad.');
    } else if (fam === 'LEGACY') {
      pool.push('El club quiere construir alrededor tuyo.');
      pool.push('Renovación de ídolo. Quedarte también es un movimiento.');
    } else if (role === 'titular') {
      pool.push('Necesitan un ' + posWord + ' titular.');
      pool.push('Te ofrecen minutos claros.');
      pool.push('Buscan alguien que arranque de entrada.');
    } else if (role === 'promesa') {
      pool.push('Quieren apostar por tu potencial.');
      pool.push('Te ven como proyecto a mediano plazo.');
    } else {
      pool.push('El entrenador te ve como pieza de rotación.');
      pool.push('Escaparate grande, minutos a pelear.');
    }

    if (state.age <= 21) pool.push('Ven en vos una apuesta de futuro.');
    if (state.age >= 30) pool.push('Buscan experiencia inmediata.');
    if (state.arcFlags && state.arcFlags.breakout) pool.push('Tu explosión no pasó desapercibida.');
    if (state.arcFlags && state.arcFlags.comeback) pool.push('Vieron tu comeback. Quieren apostar de nuevo.');
    if (state.arcFlags && state.arcFlags.crisis) pool.push('Una puerta para resetear la carrera.');

    // Anti-repeat blurbs across seasons
    var recent = state.recentOfferBlurbs || [];
    var filtered = pool.filter(function (line) {
      return recent.indexOf(line) === -1;
    });
    if (!filtered.length) filtered = pool;
    var pick = rng.pick(filtered);
    state.recentOfferBlurbs = [pick].concat(recent).slice(0, 8);
    return pick;
  }

  function generateOffers(state, world, rng, maxOffers, forceOpen) {
    maxOffers = maxOffers == null ? 4 : Math.min(4, maxOffers);
    var clubs = world.clubs || [];
    var lastGrade = lastSeasonGrade(state);
    var last = state.seasonHistory && state.seasonHistory.length
      ? state.seasonHistory[state.seasonHistory.length - 1]
      : null;
    var lastApps = last ? last.appearances || 0 : 20;
    if (!forceOpen && !rng.bool(marketOpenChance(state, lastGrade))) {
      return [];
    }

    var candidates = [];
    for (var i = 0; i < clubs.length; i++) {
      var club = clubs[i];
      if (!isEligibleForClub(state, club, world)) continue;
      var interest = interestScore(state, club, world, lastGrade);
      if (lastApps >= 28) interest += 5;
      else if (lastApps >= 20) interest += 2;
      else if (lastApps < 12) interest -= 6;
      if (last && (last.goals || 0) + (last.assists || 0) >= 15) interest += 4;
      if (interest < 10) continue;
      candidates.push({ club: club, interest: interest });
    }

    if (!candidates.length) return [];

    candidates.sort(function (a, b) {
      return b.interest - a.interest;
    });

    var pool = candidates.slice(0, Math.min(18, candidates.length));
    var count = 0;
    if (forceOpen) {
      count = Math.min(maxOffers, pool.length);
    } else if (lastGrade === 'S') count = rng.int(2, Math.min(maxOffers, pool.length));
    else if (lastGrade === 'A') count = rng.int(1, Math.min(maxOffers, pool.length));
    else if (lastGrade === 'B') count = rng.int(0, Math.min(3, pool.length));
    else if (lastGrade === 'C') count = rng.int(0, Math.min(2, pool.length));
    else count = rng.int(0, Math.min(1, pool.length));

    if (!forceOpen && count === 0 && state.rating >= 82 && state.reputation >= 55 && rng.bool(0.4)) count = 1;
    if (state.age >= 34) count = Math.min(count, 1);
    if (!forceOpen && lastApps < 10 && lastGrade !== 'S') count = Math.min(count, 1);

    var picked = [];
    var used = Object.create(null);
    var current = getClub(world, state.clubId);
    var curLevel = current ? current.level || 1 : 2;
    var country = getCountry(world, state.player.countryId);
    var recentFamilies = state.recentMarketFamilies || [];
    var lastFamily = recentFamilies[0] || null;

    function familyOk(fam) {
      if (!fam || !lastFamily) return true;
      if (fam === lastFamily && rng.bool(0.72)) return false;
      if (recentFamilies[0] === fam && recentFamilies[1] === fam) return false;
      return true;
    }

    function takePred(pred, preferredFamily) {
      for (var pi = 0; pi < pool.length && picked.length < count; pi++) {
        var it = pool[pi];
        if (used[it.club.id]) continue;
        if (pred && !pred(it)) continue;
        var fam = classifyMarketFamily(state, it.club, 'transfer', world);
        if (preferredFamily && fam !== preferredFamily) continue;
        if (!familyOk(fam) && picked.length > 0) continue;
        if (it.interest < 12 && !rng.bool(0.18)) continue;
        if ((it.club.level || 1) >= 5 && !rng.bool(0.32 + Math.max(0, state.reputation - 60) / 80)) {
          continue;
        }
        used[it.club.id] = true;
        picked.push(it);
        return true;
      }
      return false;
    }

    // Diverse scenario slots
    takePred(function (it) {
      return (it.club.level || 1) > curLevel;
    }, 'STEP_UP');
    takePred(function (it) {
      return (it.club.level || 1) === curLevel;
    }, 'LATERAL');
    takePred(function (it) {
      return (it.club.level || 1) < curLevel;
    }, 'MINUTES');
    takePred(function (it) {
      return country && it.club.countryId === country.id;
    }, 'HOME');
    takePred(function (it) {
      return (state.clubsPlayed || []).indexOf(it.club.id) !== -1;
    }, 'RETURN');
    takePred(function (it) {
      return current && current.continentId === 'continent_sa' && it.club.continentId === 'continent_eu';
    }, 'EUROPE');
    takePred(function (it) {
      return current && current.continentId === 'continent_eu' && it.club.continentId === 'continent_sa';
    }, 'SOUTH_AMERICA');
    takePred(function (it) {
      return current && it.club.countryId !== current.countryId;
    }, null);
    while (picked.length < count) {
      if (!takePred(null, null)) break;
    }

    picked = rng.shuffle(picked);

    return picked.map(function (item) {
      var role = roleForOffer(state, item.club);
      var region = regionMarketWeight(item.club.continentId, item.club.primaryCompetitionId);
      var wage = Math.round(
        (80000 + state.rating * 12000 + item.club.prestige * 4000) *
          (role === 'titular' ? 1.1 : 0.85) *
          region
      );
      var mins = expectedMinutesBand(state, item.club);
      var family = classifyMarketFamily(state, item.club, 'transfer', world);
      var blurb = craftOfferBlurb(state, item.club, role, world, rng, family);
      return {
        id: 'offer_' + state.seasonIndex + '_' + item.club.id,
        kind: 'transfer',
        clubId: item.club.id,
        role: role,
        wage: wage,
        years: role === 'promesa' ? 4 : role === 'titular' ? 3 : 2,
        interest: Math.round(item.interest),
        prestige: item.club.prestige,
        level: item.club.level,
        tier: clubTier(item.club, world),
        minutesLabel: mins.label,
        marketFamily: family,
        blurb: blurb
      };
    });
  }

  function loanEligible(state, world) {
    if (!state || state.onLoan) return false;
    if (state.age > 28) return false;
    var club = getClub(world, state.clubId);
    if (!club) return false;
    var last = state.seasonHistory && state.seasonHistory.length
      ? state.seasonHistory[state.seasonHistory.length - 1]
      : null;
    var apps = last ? last.appearances || 0 : 0;
    var level = club.level || 1;
    var grade = last ? last.performanceGrade : null;
    if (state.age <= 19 && level >= 3) return true;
    if (state.age <= 21 && level >= 4) return true;
    if (state.age <= 22 && level >= 3 && apps < 20) return true;
    if (state.age <= 23 && level >= 4 && apps < 18) return true;
    if (state.age <= 24 && level >= 5 && apps < 20) return true;
    if (state.age <= 25 && level >= 3 && apps < 14) return true;
    if (state.age <= 26 && state.form <= 3 && level >= 3) return true;
    if (state.arcFlags && state.arcFlags.crisis && state.age <= 27 && level >= 3) return true;
    if (state.potential >= 86 && level >= 4 && apps < 16 && state.age <= 24) return true;
    if (grade === 'D' && apps < 16 && state.age <= 25 && level >= 3) return true;
    return false;
  }

  function generateLoanOffers(state, world, rng, maxOffers) {
    maxOffers = maxOffers == null ? 2 : Math.min(2, maxOffers);
    if (!loanEligible(state, world)) return [];
    var current = getClub(world, state.clubId);
    if (!current) return [];
    var country = getCountry(world, state.player.countryId);
    var candidates = (world.clubs || []).filter(function (c) {
      if (!c || c.incomplete || c.id === state.clubId) return false;
      var lv = c.level || 1;
      if (lv >= (current.level || 1)) return false;
      if (lv > 3) return false;
      if (lv < 2) return false;
      if (c.countryId === current.countryId) return true;
      if (country && c.continentId === country.continentId) return true;
      return false;
    });
    if (!candidates.length) {
      candidates = (world.clubs || []).filter(function (c) {
        return c && !c.incomplete && c.id !== state.clubId && (c.level || 1) <= 3 && (c.level || 1) >= 2;
      });
    }
    if (!candidates.length) return [];

    candidates.sort(function (a, b) {
      var scoreA =
        (a.countryId === current.countryId ? 10 : 0) +
        (a.prestige || 0) * 0.05 +
        ((a.level || 1) === 3 ? 3 : 5);
      var scoreB =
        (b.countryId === current.countryId ? 10 : 0) +
        (b.prestige || 0) * 0.05 +
        ((b.level || 1) === 3 ? 3 : 5);
      return scoreB - scoreA;
    });

    var pool = rng.shuffle(candidates.slice(0, Math.min(12, candidates.length)));
    var count = rng.int(1, Math.min(maxOffers, pool.length));
    var out = [];
    for (var i = 0; i < pool.length && out.length < count; i++) {
      var club = pool[i];
      var mins = expectedMinutesBand(
        { rating: state.rating, potential: state.potential, age: state.age, onLoan: true },
        club
      );
      var blurb = craftOfferBlurb(state, club, 'titular', world, rng, 'LOAN');
      out.push({
        id: 'loan_' + state.seasonIndex + '_' + club.id,
        kind: 'loan',
        clubId: club.id,
        role: 'titular',
        wage: Math.round(40000 + state.rating * 4000),
        years: 1,
        interest: 20,
        prestige: club.prestige,
        level: club.level,
        tier: clubTier(club, world),
        minutesLabel: mins.label,
        marketFamily: 'LOAN',
        blurb: blurb
      });
    }
    return out;
  }

  function buildMarketPacket(state, world, rng) {
    var lastGrade = lastSeasonGrade(state);
    var last = state.seasonHistory && state.seasonHistory.length
      ? state.seasonHistory[state.seasonHistory.length - 1]
      : null;
    var apps = last ? last.appearances || 0 : 22;
    var recentShapes = state.recentMarketShapes || [];
    var lastShape = recentShapes[0] || null;
    var recentFamilies = state.recentMarketFamilies || [];

    // 0–4 transfer offers by context
    var wantTx = 0;
    if (lastGrade === 'S') wantTx = rng.int(2, 4);
    else if (lastGrade === 'A') wantTx = rng.int(1, 3);
    else if (lastGrade === 'B') wantTx = rng.bool(0.72) ? rng.int(1, 2) : 0;
    else if (lastGrade === 'C') wantTx = rng.bool(0.48) ? 1 : 0;
    else wantTx = rng.bool(0.18) ? 1 : 0;

    if (lastShape === 'tx:' + wantTx && rng.bool(0.65)) {
      wantTx = Math.max(0, Math.min(4, wantTx + (rng.bool(0.5) ? 1 : -1)));
    }
    if (lastShape === 'cold' && lastGrade !== 'D' && rng.bool(0.5)) wantTx = Math.max(wantTx, 1);
    if (state.age >= 34) wantTx = Math.min(wantTx, 1);

    var transfers =
      wantTx > 0
        ? generateOffers(state, world, rng.fork('tx'), wantTx, true)
        : [];

    var loans = [];
    var eligible = loanEligible(state, world);
    var forceLoan =
      eligible &&
      (apps < 16 ||
        (state.arcFlags && state.arcFlags.crisis) ||
        (lastGrade === 'D' && apps < 20) ||
        (state.age <= 20 && (getClub(world, state.clubId) || {}).level >= 4));
    var wantLoan = false;
    if (eligible) {
      if (forceLoan) wantLoan = true;
      else if (!transfers.length && rng.bool(0.72)) wantLoan = true;
      else if (transfers.length && rng.bool(0.42)) wantLoan = true;
      else if (lastShape && String(lastShape).indexOf('loan') === -1 && rng.bool(0.48)) wantLoan = true;
      else if (state.age <= 22 && rng.bool(0.35)) wantLoan = true;
    }
    if (wantLoan && lastShape && String(lastShape).indexOf('loan') === 0 && transfers.length && rng.bool(0.45)) {
      wantLoan = false;
    }
    if (wantLoan && recentFamilies[0] === 'LOAN' && transfers.length && rng.bool(0.55)) {
      wantLoan = false;
    }
    if (wantLoan) {
      loans = generateLoanOffers(state, world, rng.fork('loan'), forceLoan && !transfers.length ? 2 : 1);
    }

    if (!transfers.length && !loans.length && lastGrade !== 'D' && rng.bool(0.38)) {
      transfers = generateOffers(state, world, rng.fork('txRetry'), 1, lastGrade === 'A' || lastGrade === 'S');
    }

    var shape =
      !transfers.length && !loans.length
        ? 'cold'
        : !transfers.length
          ? 'loan:' + loans.length
          : !loans.length
            ? 'tx:' + transfers.length
            : 'tx:' + transfers.length + '+loan:' + loans.length;

    state.recentMarketShapes = [shape].concat(recentShapes).slice(0, 6);

    var families = transfers
      .concat(loans)
      .map(function (o) {
        return o.marketFamily || (o.kind === 'loan' ? 'LOAN' : 'LATERAL');
      })
      .filter(Boolean);
    if (!families.length) families = ['NO_OFFER'];
    state.recentMarketFamilies = families.concat(recentFamilies).slice(0, 10);

    return {
      transfers: transfers,
      loans: loans,
      offers: transfers.concat(loans),
      canStay: true,
      canLoan: eligible,
      cold: !transfers.length && !loans.length,
      shape: shape,
      families: families
    };
  }

  function pickStartingClub(world, countryId, rng) {
    var options = generateStartingClubOptions(
      world,
      { countryId: countryId, rating: 62, potential: 82, age: 17 },
      rng
    );
    if (options.length) {
      // Auto careers: prefer balance / minutes path, not always giant
      var pick = options[1] || options[2] || options[0];
      return getClub(world, pick.clubId) || rng.pick(world.clubs || []);
    }
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
    return rng.pick(local);
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

  function formStatus(form) {
    var f = Number(form) || 5;
    if (f >= 9) return { id: 'hot', label: 'En racha', emoji: '🔥' };
    if (f >= 7) return { id: 'good', label: 'Buena forma', emoji: '🙂' };
    if (f >= 5) return { id: 'normal', label: 'Normal', emoji: '😐' };
    if (f >= 3) return { id: 'low', label: 'Bajo rendimiento', emoji: '📉' };
    return { id: 'crisis', label: 'En crisis', emoji: '❄️' };
  }

  /**
   * Update streaks/confidence and detect breakout / crisis / comeback for this season.
   * Context + probability + state + seeded RNG — not pure random.
   */
  function updateArcState(state, stats, rng) {
    var grade = stats.performanceGrade || 'B';
    var apps = stats.appearances || 0;
    var good = grade === 'S' || grade === 'A';
    var bad = grade === 'D' || apps < 10;
    var prevBad = state.streakBad || 0;
    var prevGood = state.streakGood || 0;

    if (good) {
      state.streakGood = prevGood + 1;
      state.streakBad = 0;
    } else if (bad) {
      state.streakBad = prevBad + 1;
      state.streakGood = 0;
    } else if (grade === 'C') {
      // Irregular: don't inflate endless crisis, but don't erase it either
      state.streakGood = 0;
      state.streakBad = prevBad > 0 ? prevBad : 0;
    } else {
      // B: gradual recovery of bad streak
      state.streakGood = Math.max(0, prevGood);
      state.streakBad = Math.max(0, prevBad - 1);
    }

    var confDelta = 0;
    if (grade === 'S') confDelta = rng.int(5, 10);
    else if (grade === 'A') confDelta = rng.int(2, 6);
    else if (grade === 'B') confDelta = rng.int(-1, 3);
    else if (grade === 'C') confDelta = -rng.int(2, 5);
    else confDelta = -rng.int(3, 6);
    if (apps < 12) confDelta -= 2;
    if ((stats.titles || stats.trophies || []).length) confDelta += 5;
    if (stats.injuryWeeks >= 8) confDelta -= 3;
    // Confidence recovers slowly from the floor
    if ((state.confidence || 55) <= 25 && grade !== 'D') confDelta = Math.max(confDelta, rng.int(3, 7));
    state.confidence = NS.State.clamp((state.confidence != null ? state.confidence : 55) + confDelta, 12, 100);

    var flags = {
      breakout: false,
      crisis: false,
      comeback: false
    };

    var band = ageBand(state.age);
    var gap = (state.potential || 80) - (state.rating || 70);
    var breakoutChance =
      0.03 +
      (grade === 'S' ? 0.1 : 0) +
      (state.streakGood >= 2 ? 0.05 : 0) +
      (gap >= 10 ? 0.04 : 0) +
      (band === 'youth' || band === 'growth' ? 0.04 : 0) +
      ((state.confidence || 55) >= 72 ? 0.03 : 0);
    if (band === 'late' || band === 'decline') breakoutChance *= 0.2;
    if (grade === 'S' && apps >= 26 && rng.bool(NS.State.clamp(breakoutChance, 0.02, 0.22))) {
      flags.breakout = true;
    }

    // Crisis is rare and meaningful — not a permanent death spiral
    var crisisChance = 0;
    if (state.streakBad >= 3 && grade === 'D') crisisChance = 0.32;
    else if (state.streakBad >= 2 && grade === 'D' && (state.confidence || 55) <= 40) crisisChance = 0.22;
    else if (grade === 'D' && apps < 12 && (state.confidence || 55) <= 35) crisisChance = 0.18;
    if (crisisChance > 0 && rng.bool(crisisChance)) flags.crisis = true;

    // Comeback after adversity — rare and satisfying
    if (prevBad >= 1 && (good || grade === 'B') && apps >= 14) {
      var comeP = prevBad >= 2 ? (good ? 0.38 : 0.22) : good ? 0.18 : 0.08;
      if ((state.confidence || 55) <= 40) comeP += 0.06;
      if (rng.bool(NS.State.clamp(comeP, 0.06, 0.55))) flags.comeback = true;
    }

    if (flags.breakout) {
      state.form = NS.State.clamp(state.form + 1, 1, 10);
      state.confidence = NS.State.clamp(state.confidence + 8, 5, 100);
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) + 0.05;
    }
    if (flags.crisis) {
      if (state.form > 3) state.form = NS.State.clamp(state.form - 1, 1, 10);
      state.confidence = NS.State.clamp(state.confidence - 5, 5, 100);
    }
    if (flags.comeback) {
      state.form = NS.State.clamp(state.form + 1, 1, 10);
      state.confidence = NS.State.clamp(state.confidence + 12, 5, 100);
      state.morale = NS.State.clamp((state.morale || 70) + 8, 10, 100);
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) + 0.04;
    }

    state.arcFlags = flags;
    return flags;
  }

  function performanceGrade(avgRating, appearances, injuryWeeks) {
    if (injuryWeeks >= 16 || appearances < 6) return 'D';
    if (avgRating >= 8.15 && appearances >= 24) return 'S';
    if (avgRating >= 7.4) return 'A';
    if (avgRating >= 6.7) return 'B';
    if (avgRating >= 6.15) return 'C';
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
    generateLoanOffers: generateLoanOffers,
    buildMarketPacket: buildMarketPacket,
    loanEligible: loanEligible,
    generateStartingClubOptions: generateStartingClubOptions,
    expectedMinutesBand: expectedMinutesBand,
    expectedRoleForClub: expectedRoleForClub,
    startingMinutesBias: startingMinutesBias,
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
    formStatus: formStatus,
    updateArcState: updateArcState,
    minutesFactorForClub: minutesFactorForClub,
    updateReputation: updateReputation,
    marketOpenChance: marketOpenChance,
    regionMarketWeight: regionMarketWeight,
    maxTierStep: maxTierStep,
    classifyMarketFamily: classifyMarketFamily,
    craftOfferBlurb: craftOfferBlurb
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
