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
    if (age <= 18) return 'youth';
    if (age <= 21) return 'growth';
    if (age <= 25) return 'rising';
    if (age <= 29) return 'prime';
    if (age <= 32) return 'peak_stable';
    if (age <= 35) return 'early_decline';
    if (age <= 37) return 'decline';
    return 'late';
  }

  function ageChapter(age, state) {
    var band = ageBand(age);
    var rating = state && state.rating != null ? state.rating : 0;
    var peak = state && state.peakRating != null ? state.peakRating : rating;
    if (band === 'youth') return 'DESARROLLO';
    if (band === 'growth') {
      if (rating >= 78 || (state && state.arcFlags && state.arcFlags.breakout)) return 'PRIMER GRAN SALTO';
      return 'CONSOLIDACIÓN';
    }
    if (band === 'rising') return rating >= 84 ? 'HACIA EL PRIME' : 'CRECIMIENTO';
    if (band === 'prime') {
      if (rating >= peak - 1 && rating >= 86) return 'TU MEJOR MOMENTO';
      return 'PRIME';
    }
    if (band === 'peak_stable') return 'EXPERIENCIA';
    if (band === 'early_decline') {
      if (state && state.arcFlags && state.arcFlags.comeback) return 'ÚLTIMA GRAN EMPUJADA';
      return 'EL FINAL SE ACERCA';
    }
    if (band === 'decline' || band === 'late') return 'LEGADO';
    return 'TEMPORADA';
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
      maxUp = 3;
      raw = (gap > 0 ? gap * 0.11 : 0) + formMod + minutesMod + trainMod + gradeBoost + confMod;
      raw += rng.range(-0.35, 0.55);
    } else if (band === 'rising') {
      maxUp = 2;
      raw =
        (gap > 0 ? gap * 0.08 : rng.bool(0.15) ? -0.15 : 0) +
        formMod * 0.9 +
        minutesMod +
        trainMod +
        gradeBoost +
        confMod * 0.8;
      raw += rng.range(-0.4, 0.45);
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
    if (level >= 5 && gap < 0) f -= 0.18;
    else if (level >= 5 && gap < 4) f -= 0.1;
    if (level >= 4 && gap < -2) f -= 0.12;
    if (level >= 4 && gap < 2 && state.age <= 20) f -= 0.06;
    if (level <= 2 && gap >= -2) f += 0.18;
    if (level <= 2 && gap >= 6) f += 0.1;
    if (level === 3 && gap >= 0) f += 0.08;
    if (state.onLoan) f += 0.16;
    if (state.age <= 18 && level >= 4) f -= 0.05;
    if (state.age >= 30 && gap >= 4) f += 0.04;
    return NS.State.clamp(f, 0.18, 0.98);
  }

  function seasonSituation(state, world) {
    var club = getClub(world, state.clubId);
    var level = (club && club.level) || 1;
    var role = state.clubRole || expectedRoleForClub(state, club);
    var mins = minutesFactorForClub(state, club);
    var band = ageBand(state.age);
    var chapter = ageChapter(state.age, state);
    var form = formStatus(state.form);
    var value = computeMarketValue(state, club, world);
    var line = 'El entrenador te ve como una apuesta.';
    var tone = 'project';
    var objective = 'Ganar minutos y crecer.';

    if (state.onLoan) {
      line = 'Estás cedido. Cada minuto cuenta.';
      tone = 'loan';
      objective = 'Jugar 25+ partidos y volver más fuerte.';
    } else if (state.arcFlags && state.arcFlags.crisis) {
      line = 'El vestuario está tenso. Hay que responder.';
      tone = 'crisis';
      objective = 'Recuperar la confianza del entrenador.';
    } else if (state.arcFlags && state.arcFlags.comeback) {
      line = 'Volviste. Ahora hay que sostenerlo.';
      tone = 'comeback';
      objective = 'Confirmar el comeback con consistencia.';
    } else if (state.arcFlags && state.arcFlags.breakout) {
      line = 'El club necesita que confirmes el salto.';
      tone = 'breakout';
      objective = 'Convertirte en referencia del equipo.';
    } else if (mins < 0.4 || role === 'rotacion' || role === 'promesa') {
      if (level >= 4 && state.age <= 20) {
        line = 'Empezás como suplente en un grande.';
        tone = 'bench';
        objective = 'Robar minutos y demostrar potencial.';
      } else if (role === 'promesa') {
        line = 'El entrenador te ve como una apuesta.';
        tone = 'project';
        objective = 'Crecer sin quemarte.';
      } else {
        line = 'Vas a pelear minutos desde el banco.';
        tone = 'bench';
        objective = 'Ganarte un lugar en el once.';
      }
    } else if (mins >= 0.72 || role === 'titular') {
      if (level <= 2) {
        line = 'El club necesita que seas titular.';
        tone = 'starter';
        objective = 'Liderar y llamar la atención.';
      } else if (level >= 4 && club && club.continentId === 'continent_eu') {
        line = 'Después de convertirte en pieza importante, el club espera más.';
        tone = 'starter';
        objective = 'Consolidarte en Europa.';
      } else {
        line = 'Te ganaste un rol de peso en el once.';
        tone = 'starter';
        objective = 'Ser decisivo toda la temporada.';
      }
    } else if (band === 'early_decline' || band === 'decline' || band === 'late') {
      line = 'La experiencia pesa. Hay que elegir bien los partidos.';
      tone = 'veteran';
      objective = 'Cerrar el capítulo con dignidad.';
    } else if ((state.stayedStreak || 0) >= 3) {
      line = 'Sos un referente. El club espera liderazgo.';
      tone = 'leader';
      objective = 'Sostener el legado en el club.';
    } else if (band === 'prime' || band === 'rising') {
      line = 'Estás en años clave. Cada decisión pesa.';
      tone = 'prime';
      objective = 'Maximizar tu mejor versión.';
    } else {
      line = 'Hay lugar para crecer si respondés.';
      tone = 'rotation';
      objective = 'Dar un salto de nivel.';
    }

    var roleLabels = { titular: 'Titular', rotacion: 'Rotación', promesa: 'Promesa' };
    return {
      age: state.age,
      chapter: chapter,
      band: band,
      role: role,
      roleLabel: roleLabels[role] || role || '—',
      minutesFactor: mins,
      formId: form.id,
      formLabel: form.label,
      marketValue: value,
      valueLabel: formatMarketValue(value),
      objective: objective,
      line: line,
      tone: tone,
      clubId: state.clubId,
      seasonIndex: state.seasonIndex || 0
    };
  }

  function formatMarketValue(n) {
    var v = Math.max(0, Math.round(Number(n) || 0));
    if (v >= 1000000) return '€' + (v / 1000000).toFixed(v >= 10000000 ? 0 : 1) + 'M';
    if (v >= 1000) return '€' + Math.round(v / 1000) + 'K';
    return '€' + v;
  }

  function transferConsequence(state, offer, world) {
    if (!offer) return 'Nuevo escenario para tu carrera.';
    var current = getClub(world, state.clubId);
    var next = getClub(world, offer.clubId);
    if (offer.kind === 'loan') {
      return 'Más minutos. Menos presión. Volvés al club dueño.';
    }
    var curL = (current && current.level) || 1;
    var nextL = (next && next.level) || offer.level || 1;
    if (offer.role === 'titular' && nextL < curL) {
      return 'Pasás a ser titular, con menos escaparate.';
    }
    if (offer.role === 'titular') return 'Llegás para ser titular.';
    if (nextL >= curL + 2) return 'Pasás a competir por minutos en un escenario mucho más grande.';
    if (nextL > curL) return 'Más prestigio. Hay que pelear el puesto.';
    if (
      current &&
      next &&
      current.continentId === 'continent_sa' &&
      next.continentId === 'continent_eu'
    ) {
      return 'Este fichaje te pone en un escenario europeo.';
    }
    if (
      current &&
      next &&
      current.continentId === 'continent_eu' &&
      next.continentId === 'continent_sa'
    ) {
      return 'Regreso a Sudamérica: protagonismo y otra historia.';
    }
    return 'Nuevo club. Nueva presión. Nueva oportunidad.';
  }

  function stayConsequence(state, world) {
    var club = getClub(world, state.clubId);
    var years = yearsAtClubApprox(state);
    var attach = state.clubAttachment != null ? state.clubAttachment : 0;
    if (attach >= 80 || years >= 5) {
      return {
        headline: 'Quedarte construye legado',
        ups: ['Continuidad', 'Estatus', 'Minutos'],
        downs: ['Menos salto', 'Menos exposición']
      };
    }
    if (state.marketCold) {
      return {
        headline: 'Nadie llamó. Quedarte también es una decisión',
        ups: ['Estabilidad', 'Proyecto'],
        downs: ['Sin salto de club']
      };
    }
    var level = (club && club.level) || 1;
    if (level >= 4) {
      return {
        headline: 'Renunciás a una oportunidad de cambio',
        ups: ['Minutos posibles', 'Continuidad'],
        downs: ['Menor exploración', 'Menos mercado']
      };
    }
    return {
      headline: 'Seguís el proyecto del club',
      ups: ['Protagonismo', 'Crecimiento'],
      downs: ['Menor prestigio inmediato']
    };
  }

  var ARCHETYPE_LABELS = {
    ONE_CLUB_LEGEND: 'EL ÍDOLO',
    COMEBACK: 'EL REGRESO IMPOSIBLE',
    SOUTH_AMERICAN_KING: 'EL REY DE SUDAMÉRICA',
    GIANT_SUCCESS: 'EL HOMBRE DE LAS GRANDES NOCHES',
    GIANT_FAILURE: 'EL ETERNO SUPLENTE',
    WUNDERKIND: 'EL PRODIGIO',
    EARLY_EUROPE: 'EL SALTO TEMPRANO',
    LATE_EUROPEAN_MOVE: 'EL SALTO A EUROPA',
    LOAN_SPECIALIST: 'EL CEDIDO QUE EXPLOTÓ',
    EUROPEAN_JOURNEYMAN: 'EL VIAJERO',
    NATIONAL_HERO: 'EL HÉROE DE SELECCIÓN',
    HOME_RETURN: 'EL REGRESO A CASA',
    LATE_BLOOMER: 'EL FLORECER TARDÍO',
    CAREER_STAGNATION: 'LA CARRERA INCONCLUSA',
    FALLEN_STAR: 'LA ESTRELLA CAÍDA',
    RISING_STAR: 'LA ESTRELLA EN ASCENSO'
  };

  function archetypeLabel(id) {
    return ARCHETYPE_LABELS[id] || 'TU HISTORIA';
  }

  function careerStoryPhrase(state, world) {
    if (!state) return 'Una carrera para contar.';
    var analysis = analyzeCareer(state, world);
    var hist = state.seasonHistory || [];
    var first = hist[0] && getClub(world, hist[0].clubId);
    var last = hist.length
      ? getClub(world, hist[hist.length - 1].clubId)
      : getClub(world, state.clubId);
    var firstName = first ? first.shortName || first.name : '';
    var lastName = last ? last.shortName || last.name : '';
    var seasons = hist.length;
    var clubs = (state.clubsPlayed || []).length;
    var titles = state.totalTitles || 0;
    var ballons =
      NS.Awards && NS.Awards.countAwards ? NS.Awards.countAwards(state, 'award_ballon_dor') : 0;
    var city = first && first.city ? first.city : firstName;

    if (ballons >= 1 && firstName && lastName && firstName !== lastName) {
      return 'De ' + firstName + ' al Balón de Oro.';
    }
    if (analysis.archetype === 'ONE_CLUB_LEGEND' && firstName) {
      return 'Nunca dejó ' + firstName + '. Se convirtió en leyenda.';
    }
    if (analysis.archetype === 'SOUTH_AMERICAN_KING') {
      return 'Jamás necesitó Europa para ser leyenda.';
    }
    if (analysis.regionPath === 'SA_EUROPE' && city && lastName) {
      return 'Una carrera que empezó en ' + city + ' y terminó en ' + lastName + '.';
    }
    if (analysis.archetype === 'HOME_RETURN' && lastName) {
      return 'Volvió a ' + lastName + ' para cerrar el círculo.';
    }
    if (analysis.archetype === 'COMEBACK') {
      return 'Cayó. Volvió. La historia no terminó ahí.';
    }
    if (analysis.archetype === 'GIANT_FAILURE') {
      return 'El escaparate grande no le dio minutos. La carrera se reescribió.';
    }
    if (seasons && clubs) {
      return (
        seasons +
        ' temporadas. ' +
        clubs +
        ' clubes.' +
        (titles ? ' ' + titles + ' títulos.' : '')
      );
    }
    return state.retirementLine || 'Una carrera para contar.';
  }

  function appendClubTimeline(state, seasonRecord) {
    if (!state || !seasonRecord) return;
    if (!state.clubTimeline) state.clubTimeline = [];
    state.clubTimeline.push({
      type: 'club_season',
      age: seasonRecord.age,
      seasonIndex: seasonRecord.seasonIndex,
      seasonLabel: seasonRecord.seasonLabel,
      clubId: seasonRecord.clubId,
      onLoan: !!state.onLoan,
      appearances: seasonRecord.appearances || 0,
      goals: seasonRecord.goals || 0,
      assists: seasonRecord.assists || 0,
      grade: seasonRecord.performanceGrade || null,
      ratingAfter: seasonRecord.ratingAfter != null ? seasonRecord.ratingAfter : state.rating
    });
  }

  function clubTimelineSummary(state, world) {
    var rows = [];
    var timeline = (state && state.clubTimeline) || [];
    var i;
    for (i = 0; i < timeline.length; i++) {
      var row = timeline[i];
      var club = getClub(world, row.clubId);
      var name = club ? club.shortName || club.name : 'Club';
      var prev = rows[rows.length - 1];
      if (prev && prev.clubId === row.clubId && !row.onLoan && !prev.onLoan) {
        prev.ageEnd = row.age;
        prev.seasons += 1;
        prev.appearances += row.appearances || 0;
        prev.goals += row.goals || 0;
        continue;
      }
      rows.push({
        clubId: row.clubId,
        name: name,
        ageStart: row.age,
        ageEnd: row.age,
        seasons: 1,
        onLoan: !!row.onLoan,
        appearances: row.appearances || 0,
        goals: row.goals || 0
      });
    }
    return rows;
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
      if (state.age <= 18 && state.rating < 78 && !promiseOk) return false;
      if (state.age > 29 && state.rating < 86) return false;
      if (state.form <= 3) return false;
      if (current && (current.level || 1) <= 2 && state.reputation < 60 && !promiseOk) return false;
    } else if (level >= 4) {
      if (state.age <= 17 && state.rating < 70) return false;
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

    // Attachment: current club pull reduces outbound interest (anti-nomad)
    var attach = state.clubAttachment != null ? state.clubAttachment : 22;
    if (current && club.id !== current.id && attach >= 45) {
      score -= (attach - 40) * 0.35;
    }
    if (current && club.id !== current.id && attach >= 70 && (club.level || 1) <= (current.level || 1)) {
      score -= 8;
    }

    // Meaningful return only — otherwise suppress
    if (current && club.id !== current.id && (state.clubsPlayed || []).indexOf(club.id) !== -1) {
      if (!isSignificantBond(state, club.id)) score -= 25;
      else score += 6;
    }

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
    // Club attachment cools the market without freezing it
    var attach = state.clubAttachment != null ? state.clubAttachment : 22;
    if (attach >= 60) p *= 1 - Math.min(0.28, (attach - 55) / 160);
    if (state.stayedStreak >= 4) p *= 0.88;
    if (state.legacyClubId && state.legacyClubId === state.clubId && lastGrade !== 'S' && lastGrade !== 'A') {
      p *= 0.85;
    }
    return NS.State.clamp(p, 0.06, 0.9);
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

  function getClubBond(state, clubId) {
    if (!state.clubBonds || !clubId) return null;
    return state.clubBonds[clubId] || null;
  }

  /** RETURN only with a real history — not a one-season cameo. */
  function isSignificantBond(state, clubId) {
    if (!clubId) return false;
    var bond = getClubBond(state, clubId);
    if (!bond) {
      // formative start club before bonds mature
      if ((state.clubsPlayed || [])[0] === clubId && (state.seasonHistory || []).length >= 2) {
        var seasonsThere = 0;
        (state.seasonHistory || []).forEach(function (s) {
          if (s.clubId === clubId) seasonsThere += 1;
        });
        return seasonsThere >= 3;
      }
      return false;
    }
    if (bond.formative && bond.seasons >= 2) return true;
    if (bond.seasons >= 3) return true;
    if ((bond.titles || 0) >= 1) return true;
    if ((bond.apps || 0) >= 55) return true;
    if (bond.peak && bond.seasons >= 2) return true;
    return false;
  }

  function canOfferReturn(state, clubId) {
    if (!isSignificantBond(state, clubId)) return false;
    if ((state.returnCooldownUntil || 0) > (state.seasonIndex || 0)) return false;
    var recent = state.recentMarketFamilies || [];
    var returnHits = 0;
    for (var i = 0; i < Math.min(4, recent.length); i++) {
      if (recent[i] === 'RETURN') returnHits += 1;
    }
    if (returnHits >= 1) return false;
    return true;
  }

  function updateClubBond(state, seasonRecord) {
    if (!seasonRecord || !seasonRecord.clubId) return;
    state.clubBonds = state.clubBonds || {};
    var id = seasonRecord.clubId;
    var b = state.clubBonds[id] || {
      seasons: 0,
      titles: 0,
      apps: 0,
      formative: false,
      peak: false
    };
    b.seasons += 1;
    b.apps += seasonRecord.appearances || 0;
    b.titles += (seasonRecord.titles || seasonRecord.trophies || []).length;
    if ((state.clubsPlayed || [])[0] === id) b.formative = true;
    if (seasonRecord.performanceGrade === 'S' || seasonRecord.performanceGrade === 'A') {
      b.peak = true;
    }
    state.clubBonds[id] = b;
  }

  function updateClubAttachment(state, stats) {
    var attach = state.clubAttachment != null ? state.clubAttachment : 22;
    var delta = 1;
    if ((stats.appearances || 0) >= 28) delta += 5;
    else if ((stats.appearances || 0) >= 22) delta += 3;
    else if ((stats.appearances || 0) < 12) delta -= 5;
    if (stats.performanceGrade === 'S') delta += 6;
    else if (stats.performanceGrade === 'A') delta += 4;
    else if (stats.performanceGrade === 'D') delta -= 4;
    if ((stats.titles || stats.trophies || []).length) delta += 7;
    if (state.onLoan) delta -= 4;
    if (stats.arcFlags && stats.arcFlags.crisis) delta -= 6;
    if (stats.arcFlags && stats.arcFlags.comeback) delta += 3;
    state.clubAttachment = NS.State.clamp(attach + delta, 0, 100);
    var years = yearsAtClubApprox(state);
    if (
      years >= 4 &&
      (stats.performanceGrade === 'S' || stats.performanceGrade === 'A' || state.clubAttachment >= 65)
    ) {
      state.legacyClubId = state.clubId;
    }
  }

  function classifyMarketFamily(state, club, kind, world) {
    if (kind === 'loan') return 'LOAN';
    if (!club) return 'LATERAL';
    var current = getClub(world, state.clubId);
    var country = getCountry(world, state.player.countryId);
    var curLevel = current ? current.level || 1 : 2;
    var lv = club.level || 1;

    if (club.id !== state.clubId && (state.clubsPlayed || []).indexOf(club.id) !== -1) {
      if (canOfferReturn(state, club.id)) return 'RETURN';
      // Weak bond → treat as lateral/home, never fake RETURN
    }
    if (country && club.countryId === country.id && (!current || current.countryId !== country.id)) {
      return 'HOME';
    }
    if (current && yearsAtClubApprox(state) >= 4 && club.id === state.clubId) {
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

  function craftOfferBlurb(state, club, role, world, rng, family) {
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
      // Block weak RETURN spam at eligibility
      if (
        club.id !== state.clubId &&
        (state.clubsPlayed || []).indexOf(club.id) !== -1 &&
        !canOfferReturn(state, club.id)
      ) {
        continue;
      }
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
    var attach = state.clubAttachment != null ? state.clubAttachment : 22;
    if (forceOpen) {
      count = Math.min(maxOffers, pool.length);
      if (attach >= 70) count = Math.min(count, 2);
      if (attach >= 85) count = Math.min(count, 1);
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
      if (fam === 'RETURN' && lastFamily === 'RETURN') return false;
      if (fam === lastFamily && rng.bool(0.72)) return false;
      if (recentFamilies[0] === fam && recentFamilies[1] === fam) return false;
      return true;
    }

    function takePred(pred, preferredFamily) {
      var matches = [];
      for (var pi = 0; pi < pool.length; pi++) {
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
        matches.push(it);
      }
      if (!matches.length) return false;
      var choice = rng.pick(matches.slice(0, Math.min(6, matches.length)));
      used[choice.club.id] = true;
      picked.push(choice);
      return true;
    }

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
    // RETURN rarely forced into the packet
    if (rng.bool(0.18)) {
      takePred(function (it) {
        return canOfferReturn(state, it.club.id);
      }, 'RETURN');
    }
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
    if (state.age > 25) return false;
    var club = getClub(world, state.clubId);
    if (!club) return false;
    var last = state.seasonHistory && state.seasonHistory.length
      ? state.seasonHistory[state.seasonHistory.length - 1]
      : null;
    var apps = last ? last.appearances || 0 : 0;
    var level = club.level || 1;
    var grade = last ? last.performanceGrade : null;
    if (state.age <= 19 && level >= 3 && apps < 20) return true;
    if (state.age <= 21 && level >= 4 && apps < 18) return true;
    if (state.age <= 22 && level >= 4 && apps < 15) return true;
    if (state.age <= 23 && level >= 5 && apps < 14) return true;
    if (state.arcFlags && state.arcFlags.crisis && state.age <= 24 && apps < 18) return true;
    if (state.potential >= 88 && level >= 4 && apps < 14 && state.age <= 22) return true;
    if (grade === 'D' && apps < 12 && state.age <= 23 && level >= 4) return true;
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
    var attach = state.clubAttachment != null ? state.clubAttachment : 22;
    var years = yearsAtClubApprox(state);

    // 0–4 transfer offers by context + attachment
    var wantTx = 0;
    if (lastGrade === 'S') wantTx = rng.int(1, 3);
    else if (lastGrade === 'A') wantTx = rng.int(1, 2);
    else if (lastGrade === 'B') wantTx = rng.bool(0.55) ? rng.int(1, 2) : 0;
    else if (lastGrade === 'C') wantTx = rng.bool(0.38) ? 1 : 0;
    else wantTx = rng.bool(0.14) ? 1 : 0;

    if (attach >= 70) wantTx = Math.max(0, wantTx - (rng.bool(0.55) ? 1 : 0));
    if (attach >= 88) wantTx = Math.min(wantTx, 1);
    if (years >= 5 && (lastGrade === 'A' || lastGrade === 'B') && rng.bool(0.4)) {
      wantTx = Math.min(wantTx, 1);
    }
    // Strong seasons still open doors even for club idols
    if ((lastGrade === 'S' || lastGrade === 'A') && wantTx === 0 && attach < 90 && rng.bool(0.55)) {
      wantTx = 1;
    }

    if (lastShape === 'tx:' + wantTx && rng.bool(0.65)) {
      wantTx = Math.max(0, Math.min(4, wantTx + (rng.bool(0.5) ? 1 : -1)));
    }
    if (lastShape === 'cold' && lastGrade !== 'D' && attach < 70 && rng.bool(0.4)) {
      wantTx = Math.max(wantTx, 1);
    }
    if (state.age >= 34) wantTx = Math.min(wantTx, 1);
    if (state.age <= 18) wantTx = Math.min(wantTx, lastGrade === 'S' || lastGrade === 'A' ? 1 : 0);
    if (state.age >= 26 && state.age <= 29 && (lastGrade === 'S' || lastGrade === 'A')) {
      wantTx = Math.max(wantTx, rng.int(1, 3));
    }
    if (state.age >= 33 && lastGrade !== 'S') wantTx = Math.min(wantTx, 1);

    var transfers =
      wantTx > 0
        ? generateOffers(state, world, rng.fork('tx'), wantTx, true)
        : [];

    // Natural loans — not almost every career
    var loans = [];
    var eligible = loanEligible(state, world);
    var forceLoan =
      eligible &&
      ((state.age <= 21 && apps < 14 && (getClub(world, state.clubId) || {}).level >= 4) ||
        (state.arcFlags && state.arcFlags.crisis && apps < 16 && state.age <= 24));
    var wantLoan = false;
    if (eligible) {
      if (forceLoan) wantLoan = rng.bool(0.85);
      else if (!transfers.length && state.age <= 22 && apps < 18 && rng.bool(0.48)) wantLoan = true;
      else if (transfers.length && state.age <= 21 && apps < 15 && rng.bool(0.26)) wantLoan = true;
      else if (state.age <= 20 && (getClub(world, state.clubId) || {}).level >= 4 && rng.bool(0.22)) {
        wantLoan = true;
      }
    }
    if (wantLoan && lastShape && String(lastShape).indexOf('loan') === 0) wantLoan = false;
    if (wantLoan && recentFamilies[0] === 'LOAN') wantLoan = false;
    if (wantLoan && (state.stayedStreak || 0) >= 3 && !forceLoan) wantLoan = false;
    if (wantLoan) {
      loans = generateLoanOffers(state, world, rng.fork('loan'), 1);
    }

    if (!transfers.length && !loans.length && lastGrade !== 'D' && attach < 75 && rng.bool(0.28)) {
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

    // Legacy beat metadata for UI/narrative (no dashboard)
    var legacyPressure =
      years >= 4 &&
      state.legacyClubId === state.clubId &&
      (lastGrade === 'A' || lastGrade === 'S' || lastGrade === 'B');

    return {
      transfers: transfers,
      loans: loans,
      offers: transfers.concat(loans),
      canStay: true,
      canLoan: eligible,
      cold: !transfers.length && !loans.length,
      shape: shape,
      families: families,
      legacyPressure: !!legacyPressure
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
    if (state.streakBad >= 3 && grade === 'D') crisisChance = 0.12;
    else if (state.streakBad >= 2 && grade === 'D' && (state.confidence || 55) <= 35) crisisChance = 0.07;
    else if (grade === 'D' && apps < 8 && (state.confidence || 55) <= 28) crisisChance = 0.05;
    if ((state.consecutiveCrisis || 0) >= 1) crisisChance *= 0.35;
    if ((state.consecutiveCrisis || 0) >= 2) crisisChance *= 0.25;
    if (crisisChance > 0 && rng.bool(crisisChance)) flags.crisis = true;

    // Comeback after adversity — rare and satisfying; multiple paths
    if (prevBad >= 1 && (good || grade === 'B') && apps >= 14) {
      var comeP = prevBad >= 2 ? (good ? 0.38 : 0.22) : good ? 0.18 : 0.08;
      if ((state.confidence || 55) <= 40) comeP += 0.06;
      if (state.onLoan && good) comeP += 0.08;
      if ((state.consecutiveCrisis || 0) >= 1 && good) comeP += 0.1;
      if (rng.bool(NS.State.clamp(comeP, 0.06, 0.55))) flags.comeback = true;
    }

    // Explicit recovery: leave crisis orbit after a solid season
    if ((state.consecutiveCrisis || 0) > 0 && (good || (grade === 'B' && apps >= 18))) {
      var recoverP =
        0.35 +
        (good ? 0.25 : 0) +
        (apps >= 24 ? 0.1 : 0) +
        (state.age <= 24 ? 0.08 : 0) -
        (state.age >= 32 ? 0.12 : 0);
      if (rng.bool(NS.State.clamp(recoverP, 0.2, 0.85))) {
        state.consecutiveCrisis = 0;
        state.streakBad = Math.max(0, (state.streakBad || 0) - 1);
        state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) + 0.05;
        if (!flags.comeback && prevBad >= 1 && good) flags.comeback = true;
      }
    }

    if (flags.breakout) {
      state.form = NS.State.clamp(state.form + 1, 1, 10);
      state.confidence = NS.State.clamp(state.confidence + 8, 5, 100);
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) + 0.05;
    }
    if (flags.crisis) {
      if (state.form > 3) state.form = NS.State.clamp(state.form - 1, 1, 10);
      state.confidence = NS.State.clamp(state.confidence - 5, 5, 100);
      state.consecutiveCrisis = (state.consecutiveCrisis || 0) + 1;
      state.crisisSeasons = (state.crisisSeasons || 0) + 1;
    } else if ((state.consecutiveCrisis || 0) > 0 && good) {
      state.consecutiveCrisis = Math.max(0, state.consecutiveCrisis - 1);
    }
    if (flags.comeback) {
      state.form = NS.State.clamp(state.form + 1, 1, 10);
      state.confidence = NS.State.clamp(state.confidence + 12, 5, 100);
      state.morale = NS.State.clamp((state.morale || 70) + 8, 10, 100);
      state.seasonModifiers.minutesBias = (state.seasonModifiers.minutesBias || 0) + 0.04;
      state.consecutiveCrisis = 0;
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

  /**
   * Coarse trajectory fingerprint for variety analysis — real paths, not micro-diffs.
   */
  function analyzeCareer(state, world) {
    var hist = state.seasonHistory || [];
    var continents = [];
    var countries = Object.create(null);
    var clubCounts = Object.create(null);
    var transfers = 0;
    var loans = 0;
    var crisis = 0;
    var comeback = 0;
    var titles = 0;
    var maxLevel = 1;
    var giantSeasons = 0;
    var giantApps = 0;
    var peakRating = 0;
    var peakAge = 17;
    var prevClub = null;

    hist.forEach(function (s) {
      var club = getClub(world, s.clubId);
      if (club) {
        continents.push(club.continentId || 'unknown');
        countries[club.countryId] = true;
        clubCounts[s.clubId] = (clubCounts[s.clubId] || 0) + 1;
        maxLevel = Math.max(maxLevel, club.level || 1);
        if ((club.level || 1) >= 4) {
          giantSeasons += 1;
          giantApps += s.appearances || 0;
        }
      }
      if (prevClub && s.clubId !== prevClub) {
        if (s.transferThisSeason !== false) transfers += 1;
      }
      prevClub = s.clubId;
      if (s.arcFlags && s.arcFlags.crisis) crisis += 1;
      if (s.arcFlags && s.arcFlags.comeback) comeback += 1;
      titles += (s.titles || s.trophies || []).length;
      var r = s.ratingAfter != null ? s.ratingAfter : 0;
      if (r > peakRating) {
        peakRating = r;
        peakAge = s.age || peakAge;
      }
    });
    if (!peakRating) peakRating = state.peakRating || state.rating || 60;

    var hasEU = continents.indexOf('continent_eu') !== -1;
    var hasSA = continents.indexOf('continent_sa') !== -1;
    var firstCont = continents[0] || 'unknown';
    var lastCont = continents.length ? continents[continents.length - 1] : 'unknown';
    var regionPath = 'OTHER';
    if (hasSA && !hasEU) regionPath = 'SA_ONLY';
    else if (hasEU && !hasSA) regionPath = 'EUROPE_ONLY';
    else if (hasSA && hasEU) {
      if (firstCont === 'continent_sa' && lastCont === 'continent_eu') regionPath = 'SA_EUROPE';
      else if (firstCont === 'continent_eu' && lastCont === 'continent_sa') regionPath = 'EUROPE_RETURN_SA';
      else if (firstCont === 'continent_sa' && lastCont === 'continent_sa') regionPath = 'SA_EUROPE_RETURN_SA';
      else regionPath = 'BRIDGE';
    }
    var countryN = Object.keys(countries).length;
    if (regionPath === 'SA_ONLY' && countryN >= 3) regionPath = 'SA_MULTIPLE_COUNTRIES';
    if (regionPath === 'EUROPE_ONLY' && countryN >= 3) regionPath = 'EUROPE_MULTIPLE_COUNTRIES';

    var uniqueClubs = Object.keys(clubCounts).length;
    var mobility = uniqueClubs <= 1 ? 'loyal' : uniqueClubs <= 4 ? 'mover' : 'nomad';
    var maxStay = 0;
    Object.keys(clubCounts).forEach(function (id) {
      if (clubCounts[id] > maxStay) maxStay = clubCounts[id];
    });

    var peakBand = peakRating >= 88 ? 'legend' : peakRating >= 80 ? 'star' : peakRating >= 72 ? 'solid' : 'low';
    var titleBand = titles >= 5 ? 'many' : titles >= 1 ? 'some' : 'none';
    var ntBand = (state.nationalCaps || 0) >= 20 ? 'ntCore' : (state.nationalCaps || 0) > 0 ? 'nt' : 'nont';
    var crisisBand = crisis >= 3 ? 'multiCrisis' : crisis >= 1 ? 'crisis' : 'stable';
    var comeBand = comeback >= 1 ? 'comeback' : 'nocome';
    var longevity = hist.length <= 12 ? 'short' : hist.length <= 18 ? 'mid' : 'long';
    var peakAgeBand = peakAge <= 22 ? 'earlyPeak' : peakAge <= 29 ? 'primePeak' : 'latePeak';

    var giantOutcome = 'noGiant';
    if (giantSeasons >= 2) {
      var avgGiantApps = giantApps / giantSeasons;
      if (avgGiantApps >= 22 && peakRating >= 82) giantOutcome = 'giantSuccess';
      else if (avgGiantApps < 14 || peakRating < 74) giantOutcome = 'giantFail';
      else giantOutcome = 'giantMixed';
    } else if (giantSeasons === 1) {
      if (giantApps < 12) giantOutcome = 'giantFail';
      else if (giantApps >= 26 && peakRating >= 84) giantOutcome = 'giantSuccess';
      else giantOutcome = 'giantMixed';
    }

    var loanBand = 'noloan';
    if ((state._loanCount || 0) >= 2) loanBand = 'loans';
    else if ((state._loanCount || 0) === 1) loanBand = 'loan';

    var returnedHome = hist.some(function (s) {
      return s.returnHome;
    });
    var returnBand = returnedHome ? 'homeReturn' : 'noReturn';

    var fingerprint = [
      regionPath,
      mobility,
      loanBand,
      peakBand,
      titleBand,
      ntBand,
      crisisBand,
      comeBand,
      giantOutcome,
      longevity,
      peakAgeBand,
      maxStay >= 6 ? 'clubLegacy' : maxStay >= 4 ? 'clubLong' : 'clubShort',
      returnBand
    ].join('|');

    // Emergent labels for analysis — order matters; avoid one bucket eating all
    var archetype = 'RISING_STAR';
    if (uniqueClubs <= 1 && hist.length >= 10 && peakRating >= 78) archetype = 'ONE_CLUB_LEGEND';
    else if (comeBand === 'comeback' && crisis >= 1) archetype = 'COMEBACK';
    else if (regionPath === 'SA_ONLY' && titles >= 2 && peakRating >= 80) archetype = 'SOUTH_AMERICAN_KING';
    else if (giantOutcome === 'giantSuccess') archetype = 'GIANT_SUCCESS';
    else if (giantOutcome === 'giantFail' && peakBand === 'low') archetype = 'GIANT_FAILURE';
    else if (peakAgeBand === 'earlyPeak' && peakRating >= 82) archetype = 'WUNDERKIND';
    else if (
      regionPath.indexOf('SA_EUROPE') === 0 &&
      hist[0] &&
      (getClub(world, hist[0].clubId) || {}).continentId === 'continent_sa'
    ) {
      archetype = peakAge <= 22 ? 'EARLY_EUROPE' : 'LATE_EUROPEAN_MOVE';
    } else if (loanBand !== 'noloan' && uniqueClubs >= 3) archetype = 'LOAN_SPECIALIST';
    else if (uniqueClubs >= 8) archetype = 'EUROPEAN_JOURNEYMAN';
    else if (ntBand !== 'nont' && titles >= 1 && peakRating >= 76) archetype = 'NATIONAL_HERO';
    else if (returnBand === 'homeReturn' && peakAge >= 28) archetype = 'HOME_RETURN';
    else if (peakAgeBand === 'latePeak' && peakRating >= 82 && peakAge >= 30) archetype = 'LATE_BLOOMER';
    else if (
      peakBand === 'low' &&
      titles === 0 &&
      ntBand === 'nont' &&
      uniqueClubs <= 3 &&
      peakRating < 74
    ) {
      archetype = 'CAREER_STAGNATION';
    } else if (mobility === 'nomad' && peakBand === 'low') archetype = 'FALLEN_STAR';
    else if (peakBand === 'legend' || peakBand === 'star') archetype = 'RISING_STAR';
    else archetype = 'RISING_STAR';

    return {
      fingerprint: fingerprint,
      regionPath: regionPath,
      archetype: archetype,
      uniqueClubs: uniqueClubs,
      transfers: Math.max(0, uniqueClubs - 1),
      maxStay: maxStay,
      crisis: crisis,
      comeback: comeback,
      titles: titles,
      peakRating: peakRating,
      peakAge: peakAge,
      duration: hist.length,
      giantOutcome: giantOutcome,
      hasEU: hasEU,
      hasSA: hasSA
    };
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
    ageChapter: ageChapter,
    seasonSituation: seasonSituation,
    appendClubTimeline: appendClubTimeline,
    clubTimelineSummary: clubTimelineSummary,
    transferConsequence: transferConsequence,
    stayConsequence: stayConsequence,
    careerStoryPhrase: careerStoryPhrase,
    archetypeLabel: archetypeLabel,
    formatMarketValue: formatMarketValue,
    formStatus: formStatus,
    updateArcState: updateArcState,
    minutesFactorForClub: minutesFactorForClub,
    updateReputation: updateReputation,
    marketOpenChance: marketOpenChance,
    regionMarketWeight: regionMarketWeight,
    maxTierStep: maxTierStep,
    classifyMarketFamily: classifyMarketFamily,
    craftOfferBlurb: craftOfferBlurb,
    isSignificantBond: isSignificantBond,
    canOfferReturn: canOfferReturn,
    updateClubBond: updateClubBond,
    updateClubAttachment: updateClubAttachment,
    yearsAtClubApprox: yearsAtClubApprox,
    analyzeCareer: analyzeCareer
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
