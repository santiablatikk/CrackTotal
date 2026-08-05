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
      if (s.titles && s.titles.length) {
        s.titles.forEach(function (t) {
          titles += 1;
          if (t.competitionId) titleIds.push(t.competitionId);
        });
      } else {
        (s.trophies || []).forEach(function (t) {
          titles += 1;
          titleIds.push(t);
        });
      }
      if (s.clubId) clubSet[s.clubId] = true;
    });
    if ((state.titles || []).length && !titleIds.length) {
      state.titles.forEach(function (t) {
        titles += 1;
        if (t.competitionId) titleIds.push(t.competitionId);
      });
    }
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

  function awardsWeight(state) {
    var weight = 0;
    var byId = Object.create(null);
    (state.awards || []).forEach(function (a) {
      byId[a.awardId] = (byId[a.awardId] || 0) + 1;
      var n = byId[a.awardId];
      var base = (a.importance || 50) / 100;
      // diminishing returns so one Ballon d'Or cannot dominate
      weight += base * (n === 1 ? 1 : n === 2 ? 0.55 : 0.3);
    });
    return weight;
  }

  function recordsWeight(state) {
    return normalize((state.records || []).length, 0, 8);
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
    if (NS.Awards && NS.Awards.countAwards(state, 'award_ballon_dor') >= 1) {
      flags.push({ id: 'ballon_winner', label: 'Balón de Oro' });
    }
    var cult =
      score >= 7.2 &&
      ((clubs.length <= 2 && state.popularity >= 70) ||
        (state.prestige >= 75 && state.reputation >= 70 && score < 9.0));
    if (cult) {
      flags.push({ id: 'jugador_culto', label: 'Jugador de culto' });
    }

    var hist = state.seasonHistory || [];
    var peakAge = 17;
    var peak = state.peakRating || state.rating;
    hist.forEach(function (s) {
      if ((s.ratingAfter || 0) >= peak - 1) peakAge = s.age || peakAge;
    });
    if (peak >= 88 && peakAge <= 22) {
      flags.push({ id: 'wonderkid', label: 'Wonderkid' });
    }
    if (peakAge >= 28 && peak >= 84) {
      flags.push({ id: 'late_bloomer', label: 'Late bloomer' });
    }

    var hadCrisis = false;
    var hadComeback = false;
    var euSeasons = 0;
    var saTitles = 0;
    var worldChamp = false;
    hist.forEach(function (s) {
      if (s.arcFlags && s.arcFlags.crisis) hadCrisis = true;
      if (s.arcFlags && s.arcFlags.comeback) hadComeback = true;
      var club = NS.Rules.getClub(world, s.clubId);
      if (club && club.continentId === 'continent_eu') euSeasons += 1;
      (s.titles || []).forEach(function (t) {
        if (t.competitionId === 'comp_libertadores') saTitles += 1;
        if (t.competitionId === 'comp_world_cup') worldChamp = true;
      });
    });
    (state.moments || []).forEach(function (m) {
      if (String(m.id).indexOf('moment_crisis_') === 0) hadCrisis = true;
      if (String(m.id).indexOf('moment_comeback_') === 0) hadComeback = true;
      if (m.id === 'moment_world_cup') worldChamp = true;
    });
    if (worldChamp) flags.push({ id: 'world_champion', label: 'Campeón del mundo' });
    if (hadCrisis && hadComeback) {
      flags.push({ id: 'comeback_king', label: 'Comeback' });
    }
    if (hadCrisis && peak >= 86 && (state.rating || 0) <= peak - 8) {
      flags.push({ id: 'fallen_star', label: 'Fallen star' });
    }
    if (euSeasons >= 5 && score >= 7) {
      flags.push({ id: 'european_star', label: 'Estrella europea' });
    }
    if (saTitles >= 2 || (saTitles >= 1 && clubs.length <= 3 && euSeasons <= 2 && score >= 7)) {
      flags.push({ id: 'sa_king', label: 'Rey de Sudamérica' });
    }

    return flags;
  }

  function narrativeArcLine(state, world, agg, score, flags) {
    var ids = {};
    (flags || []).forEach(function (f) {
      ids[f.id] = true;
    });
    if (ids.ballon_winner && ids.world_champion) {
      return 'Una carrera de leyenda absoluta: el mundo a tus pies.';
    }
    if (ids.ballon_winner) {
      return 'Una carrera de Balón de Oro: el pico del fútbol mundial.';
    }
    if (ids.world_champion) {
      return 'Una carrera de campeón del mundo.';
    }
    if (ids.one_club_man) {
      return 'El ídolo que nunca abandonó su club.';
    }
    if (ids.comeback_king) {
      return 'El prodigio que volvió después de caer.';
    }
    if (ids.sa_king) {
      return 'El rey de Sudamérica.';
    }
    if (ids.european_star) {
      return 'El trotamundos que conquistó Europa.';
    }
    if (ids.late_bloomer) {
      return 'Una carrera de madurez tardía y gloria demorada.';
    }
    if (ids.fallen_star) {
      return 'Una estrella que brilló… y tuvo que reinventarse.';
    }
    if (ids.trotamundos) {
      return 'Una carrera de maletas, ligas y nuevos comienzos.';
    }
    if (score >= 8.5) return 'Una carrera de gloria sostenida.';
    if (score >= 7) return 'Una carrera que dejó huella.';
    if (score >= 5) return 'Una carrera profesional, con altibajos reales.';
    if (score >= 3.5) return 'Una carrera irregular, pero con momentos.';
    return 'Una promesa que el fútbol no terminó de cumplir.';
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
    var titlesNorm = normalize(titlesWeight(agg.titleIds, world), 0, 32);
    var awardsNorm = normalize(awardsWeight(state), 0, 4.5);
    var gamesNorm = normalize(agg.games, 80, 650);
    var nationalNorm = clamp01(
      normalize(state.nationalCaps, 0, 100) * 0.55 +
        normalize(state.nationalGoals, 0, 40) * 0.3 +
        normalize(state.nationalAssists || 0, 0, 25) * 0.15
    );
    var prestigeNorm = prestigePathScore(state, world, agg);
    var longevity = normalize(state.age - 17, 8, 22);
    var recordsNorm = recordsWeight(state);

    var score =
      0.2 * normalize(peak, 70, 96) +
      0.18 * titlesNorm +
      0.1 * awardsNorm +
      0.12 * gamesNorm +
      0.12 * posScore +
      0.1 * nationalNorm +
      0.08 * prestigeNorm +
      0.05 * longevity +
      0.05 * recordsNorm;

    var seasons = (state.seasonHistory || []).length;
    if (seasons < 6) score -= 0.6;
    if (seasons < 4) score -= 0.8;
    if (peak < 68 && seasons >= 8) score -= 0.4;
    if (state.retirementReason === 'hard_cap' && state.age >= 40) score += 0.05;

    score = Math.round(Math.max(0, Math.min(10, score)) * 10) / 10;

    var category = categoryFromScore(score);
    var flags = specialFlags(state, world, agg, score);
    var arcLine = narrativeArcLine(state, world, agg, score, flags);
    var baseLine = retirementLine(score, world.retirementLines);
    return {
      score: score,
      category: category,
      flags: flags,
      breakdown: {
        peakRating: peak,
        titles: agg.titles,
        awards: (state.awards || []).length,
        records: (state.records || []).length,
        careerGames: agg.games,
        goals: agg.goals,
        assists: agg.assists,
        nationalCaps: state.nationalCaps,
        nationalGoals: state.nationalGoals,
        clubs: clubsCount(agg, state),
        positionContribution: Math.round(posScore * 100) / 100
      },
      retirementLine: arcLine || baseLine,
      narrativeTag: (flags[0] && flags[0].id) || category.id
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

  function summarizeTitles(state) {
    var map = Object.create(null);
    (state.titles || []).forEach(function (t) {
      var key = t.competitionId || t.name;
      if (!map[key]) {
        map[key] = {
          competitionId: t.competitionId,
          name: t.shortName || t.name,
          count: 0,
          importance: t.importance || 50
        };
      }
      map[key].count += 1;
    });
    return Object.keys(map)
      .map(function (k) {
        return map[k];
      })
      .sort(function (a, b) {
        return b.importance - a.importance || b.count - a.count;
      });
  }

  NS.Scoring = {
    evaluate: evaluate,
    categoryFromScore: categoryFromScore,
    aggregateHistory: aggregateHistory,
    specialFlags: specialFlags,
    retirementLine: retirementLine,
    summarizeTitles: summarizeTitles,
    awardsWeight: awardsWeight
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
