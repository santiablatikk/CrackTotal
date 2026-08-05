(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  function clamp01(n) {
    return Math.max(0, Math.min(1, n));
  }

  function normalize(value, min, max) {
    if (max <= min) return 0;
    return clamp01((value - min) / (max - min));
  }

  function categoryFromScore(score) {
    if (score >= 9.5) return { id: 'leyenda_absoluta', label: 'Leyenda absoluta' };
    if (score >= 9.0) return { id: 'leyenda', label: 'Leyenda' };
    if (score >= 8.0) return { id: 'idolo', label: 'Ídolo' };
    if (score >= 7.0) return { id: 'estrella', label: 'Estrella' };
    if (score >= 6.0) return { id: 'titular_elite', label: 'Titular de elite' };
    if (score >= 5.0) return { id: 'profesional', label: 'Profesional sólido' };
    if (score >= 3.5) return { id: 'irregular', label: 'Carrera irregular' };
    return { id: 'fracaso', label: 'Fracaso / promesa incumplida' };
  }

  function retirementLine(score, lines) {
    var sorted = (lines || []).slice().sort(function (a, b) {
      return (b.minScore || 0) - (a.minScore || 0);
    });
    for (var i = 0; i < sorted.length; i++) {
      if (score >= (sorted[i].minScore || 0)) return sorted[i].text;
    }
    return 'Carrera cerrada.';
  }

  function aggregateHistory(state) {
    var hist = state.seasonHistory || [];
    var games = 0;
    var goals = 0;
    var assists = 0;
    var titles = 0;
    var titleIds = [];
    var clubSet = {};
    hist.forEach(function (s) {
      games += s.appearances || 0;
      goals += s.goals || 0;
      assists += s.assists || 0;
      (s.trophies || []).forEach(function (t) {
        titles += 1;
        titleIds.push(t);
      });
      if (s.clubId) clubSet[s.clubId] = true;
    });
    return {
      games: games,
      goals: goals,
      assists: assists,
      titles: titles,
      titleIds: titleIds,
      clubs: Object.keys(clubSet)
    };
  }

  function positionContribution(position, goals, assists, games) {
    var perGameG = games > 0 ? goals / games : 0;
    var perGameA = games > 0 ? assists / games : 0;
    if (position === 'FWD') {
      return normalize(perGameG * 0.7 + perGameA * 0.3, 0, 0.55);
    }
    if (position === 'MID') {
      return normalize(perGameG * 0.35 + perGameA * 0.65, 0, 0.45);
    }
    if (position === 'DEF') {
      return normalize(perGameG * 0.25 + perGameA * 0.35 + Math.min(1, games / 450) * 0.4, 0, 0.55);
    }
    // GK: longevity + reliability proxy via games and low "attack" is fine
    return normalize(Math.min(1, games / 500) * 0.75 + (1 - Math.min(1, perGameG)) * 0.1, 0, 1);
  }

  function titlesWeight(titleIds, world) {
    var weight = 0;
    (titleIds || []).forEach(function (id) {
      var comp = world.competitionsById[id];
      if (!comp) {
        weight += 1;
        return;
      }
      if (comp.type === 'international') weight += 5 + (comp.prestige || 50) / 25;
      else if (comp.type === 'continental') weight += 3.5 + (comp.prestige || 50) / 30;
      else weight += 1.2 + (comp.prestige || 40) / 50;
    });
    return weight;
  }

  function prestigePathScore(state, world, agg) {
    var bestClubPrestige = 0;
    var topClubSeasons = 0;
    (state.seasonHistory || []).forEach(function (s) {
      var club = NS.Rules.getClub(world, s.clubId);
      if (!club) return;
      bestClubPrestige = Math.max(bestClubPrestige, club.prestige || 0);
      if ((club.level || 1) >= 4) topClubSeasons += 1;
    });
    var continentalTitles = 0;
    (agg.titleIds || []).forEach(function (id) {
      var c = world.competitionsById[id];
      if (c && (c.type === 'continental' || c.type === 'international')) continentalTitles += 1;
    });
    return clamp01(
      normalize(bestClubPrestige, 40, 98) * 0.45 +
        normalize(topClubSeasons, 0, 10) * 0.3 +
        normalize(continentalTitles, 0, 4) * 0.25
    );
  }

  function specialFlags(state, world, agg, score) {
    var flags = [];
    var clubs = agg.clubs || state.clubsPlayed || [];
    if (clubs.length <= 1 && (agg.games || 0) >= 250) {
      flags.push({ id: 'one_club_man', label: 'One Club Man' });
    }
    if (clubs.length >= 5) {
      flags.push({ id: 'trotamundos', label: 'Trotamundos' });
    }
    if (state.player.position === 'FWD' && agg.goals >= 200) {
      flags.push({ id: 'goleador_historico', label: 'Goleador histórico' });
    }
    if (state.player.position === 'MID' && agg.goals + agg.assists >= 220) {
      flags.push({ id: 'goleador_historico', label: 'Goleador histórico' });
    }
    if (state.nationalCaps >= 60 || (state.nationalCaps >= 40 && state.nationalGoals >= 15)) {
      flags.push({ id: 'especialista_internacional', label: 'Especialista internacional' });
    }
    var cult =
      score >= 7.2 &&
      ((clubs.length <= 2 && state.popularity >= 70) ||
        (state.prestige >= 75 && state.reputation >= 70 && score < 9.0));
    if (cult) {
      flags.push({ id: 'jugador_culto', label: 'Jugador de culto' });
    }
    return flags;
  }

  function evaluate(state, world) {
    var agg = aggregateHistory(state);
    var peak = state.peakRating != null ? state.peakRating : state.rating;
    var posScore = positionContribution(
      state.player.position,
      agg.goals,
      agg.assists,
      agg.games
    );
    var titlesNorm = normalize(titlesWeight(agg.titleIds, world), 0, 28);
    var gamesNorm = normalize(agg.games, 80, 650);
    var nationalNorm = clamp01(
      normalize(state.nationalCaps, 0, 100) * 0.65 +
        normalize(state.nationalGoals, 0, 40) * 0.35
    );
    var prestigeNorm = prestigePathScore(state, world, agg);
    var longevity = normalize(state.age - 17, 8, 22);

    var score =
      0.25 * normalize(peak, 70, 96) +
      0.2 * titlesNorm +
      0.15 * gamesNorm +
      0.15 * posScore +
      0.1 * nationalNorm +
      0.1 * prestigeNorm +
      0.05 * longevity;

    var seasons = (state.seasonHistory || []).length;
    if (seasons < 6) score -= 0.6;
    if (seasons < 4) score -= 0.8;
    if (peak < 68 && seasons >= 8) score -= 0.4;
    if (state.retirementReason === 'hard_cap' && state.age >= 40) score += 0.05;

    score = Math.round(Math.max(0, Math.min(10, score)) * 10) / 10;

    var category = categoryFromScore(score);
    var flags = specialFlags(state, world, agg, score);
    return {
      score: score,
      category: category,
      flags: flags,
      breakdown: {
        peakRating: peak,
        titles: agg.titles,
        careerGames: agg.games,
        goals: agg.goals,
        assists: agg.assists,
        nationalCaps: state.nationalCaps,
        nationalGoals: state.nationalGoals,
        clubs: clubsCount(agg, state),
        positionContribution: Math.round(posScore * 100) / 100
      },
      retirementLine: retirementLine(score, world.retirementLines)
    };
  }

  function clubsCount(agg, state) {
    var set = {};
    (agg.clubs || []).forEach(function (c) {
      set[c] = true;
    });
    (state.clubsPlayed || []).forEach(function (c) {
      set[c] = true;
    });
    return Object.keys(set).length;
  }

  NS.Scoring = {
    evaluate: evaluate,
    categoryFromScore: categoryFromScore,
    aggregateHistory: aggregateHistory,
    specialFlags: specialFlags,
    retirementLine: retirementLine
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
