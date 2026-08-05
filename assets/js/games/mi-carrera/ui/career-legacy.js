(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  function pushUnique(list, item) {
    if (!item || !item.id) return;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === item.id) return;
    }
    list.push(item);
  }

  function detectAchievements(state, world) {
    var list = [];
    (state.careerFlags || []).forEach(function (f) {
      pushUnique(list, { id: f.id, label: f.label || f.id, source: 'flag' });
    });

    var agg = NS.Scoring.aggregateHistory(state);
    var titleIds = agg.titleIds || [];
    var score = state.careerScore != null ? state.careerScore : 0;
    var category = state.careerCategory || NS.Scoring.categoryFromScore(score);

    if (category && category.id === 'leyenda_absoluta') {
      pushUnique(list, { id: 'leyenda_absoluta', label: 'Leyenda absoluta', source: 'category' });
    } else if (category && category.id === 'leyenda') {
      pushUnique(list, { id: 'leyenda', label: 'Leyenda', source: 'category' });
    } else if (category && category.id === 'idolo') {
      pushUnique(list, { id: 'idolo', label: 'Ídolo', source: 'category' });
    } else if (category && category.id === 'estrella') {
      pushUnique(list, { id: 'estrella', label: 'Estrella', source: 'category' });
    }

    if (titleIds.indexOf('comp_world_cup') !== -1) {
      pushUnique(list, { id: 'campeon_mundo', label: 'Campeón del Mundo', source: 'title' });
    }
    if (titleIds.indexOf('comp_ucl') !== -1) {
      pushUnique(list, { id: 'campeon_europa', label: 'Campeón de Europa', source: 'title' });
    }
    if (titleIds.indexOf('comp_libertadores') !== -1) {
      pushUnique(list, { id: 'campeon_america', label: 'Campeón de América', source: 'title' });
    }

    if (state.nationalCaps >= 80 || (state.nationalCaps >= 50 && state.nationalGoals >= 20)) {
      pushUnique(list, {
        id: 'leyenda_internacional',
        label: 'Leyenda internacional',
        source: 'national'
      });
    }

    if (state.age - 17 >= 18 || state.age >= 36) {
      pushUnique(list, { id: 'carrera_longeva', label: 'Carrera longeva', source: 'longevity' });
    }

    var clubs = agg.clubs || state.clubsPlayed || [];
    if (score >= 8.0 && clubs.length <= 2 && (agg.games || 0) >= 200) {
      pushUnique(list, { id: 'idolo_club', label: 'Ídolo de club', source: 'club' });
    }

    var hist = state.seasonHistory || [];
    if (hist.length >= 6) {
      var minR = Infinity;
      var maxAfter = -Infinity;
      var seenLow = false;
      for (var i = 0; i < hist.length; i++) {
        var r = hist[i].ratingAfter != null ? hist[i].ratingAfter : 0;
        if (r < minR) minR = r;
        if (r <= (state.peakRating || 99) - 8) seenLow = true;
        if (seenLow && r > maxAfter) maxAfter = r;
      }
      if (seenLow && maxAfter - minR >= 8) {
        pushUnique(list, { id: 'comeback', label: 'Comeback', source: 'form' });
      }
    }

    return list;
  }

  function buildLegacy(state, engine) {
    var fmt = UI.format;
    var hist = state.seasonHistory || [];
    var empty = function (label) {
      return { label: label, value: null, detail: 'Sin datos aún' };
    };

    if (!hist.length) {
      return {
        items: [
          empty('Mejor temporada'),
          empty('Mejor club'),
          empty('Mejor rating'),
          empty('Máximo valor'),
          empty('Más goles'),
          empty('Más títulos'),
          empty('Mejor actuación internacional'),
          empty('Temporada más memorable')
        ]
      };
    }

    var bestSeason = hist[0];
    hist.forEach(function (s) {
      if ((s.averageRating || 0) > (bestSeason.averageRating || 0)) bestSeason = s;
    });

    var clubSeasons = Object.create(null);
    hist.forEach(function (s) {
      if (!s.clubId) return;
      if (!clubSeasons[s.clubId]) {
        clubSeasons[s.clubId] = { clubId: s.clubId, seasons: 0, goals: 0, ratingSum: 0 };
      }
      clubSeasons[s.clubId].seasons += 1;
      clubSeasons[s.clubId].goals += s.goals || 0;
      clubSeasons[s.clubId].ratingSum += s.averageRating || 0;
    });
    var bestClubRow = null;
    Object.keys(clubSeasons).forEach(function (id) {
      var row = clubSeasons[id];
      row.avg = row.ratingSum / Math.max(1, row.seasons);
      if (
        !bestClubRow ||
        row.seasons > bestClubRow.seasons ||
        (row.seasons === bestClubRow.seasons && row.avg > bestClubRow.avg)
      ) {
        bestClubRow = row;
      }
    });
    var bestClub = bestClubRow ? engine.getClub(bestClubRow.clubId) : null;

    var topGoals = hist[0];
    hist.forEach(function (s) {
      if ((s.goals || 0) > (topGoals.goals || 0)) topGoals = s;
    });

    var topTitles = hist[0];
    hist.forEach(function (s) {
      if ((s.trophies || []).length > (topTitles.trophies || []).length) topTitles = s;
    });

    var topNational = null;
    hist.forEach(function (s) {
      var impact = (s.nationalCaps || 0) * 2 + (s.nationalGoals || 0) * 3;
      if (!topNational || impact > topNational.impact) {
        topNational = { season: s, impact: impact };
      }
    });

    var memorable = hist[0];
    hist.forEach(function (s) {
      var score =
        (s.averageRating || 0) * 10 +
        (s.goals || 0) +
        (s.assists || 0) * 0.7 +
        (s.trophies || []).length * 8 +
        (s.performanceGrade === 'S' ? 12 : s.performanceGrade === 'A' ? 6 : 0);
      s._mem = score;
      if (score > (memorable._mem || 0)) memorable = s;
    });

    var items = [
      {
        label: 'Mejor temporada',
        value: fmt.seasonLabel(bestSeason.seasonIndex),
        detail:
          'Rating ' +
          bestSeason.averageRating +
          ' · Grado ' +
          (bestSeason.performanceGrade || '—')
      },
      {
        label: 'Mejor club',
        value: bestClub ? bestClub.shortName || bestClub.name : null,
        detail: bestClubRow
          ? bestClubRow.seasons + ' temporadas · avg ' + bestClubRow.avg.toFixed(1)
          : 'Sin datos aún'
      },
      {
        label: 'Mejor rating',
        value: String(state.peakRating),
        detail: 'Pico de carrera'
      },
      {
        label: 'Máximo valor',
        value: fmt.formatMoney(state.peakMarketValue || state.marketValue || 0),
        detail: 'Valor de mercado pico'
      },
      {
        label: 'Mayor cantidad de goles',
        value: String(topGoals.goals || 0),
        detail: 'Temporada ' + fmt.seasonLabel(topGoals.seasonIndex)
      },
      {
        label: 'Mayor cantidad de títulos',
        value: String((topTitles.trophies || []).length),
        detail: 'Temporada ' + fmt.seasonLabel(topTitles.seasonIndex)
      },
      {
        label: 'Mejor actuación internacional',
        value:
          topNational && topNational.impact > 0
            ? topNational.season.nationalCaps +
              ' PJ / ' +
              (topNational.season.nationalGoals || 0) +
              ' G'
            : null,
        detail:
          topNational && topNational.impact > 0
            ? 'Temporada ' + fmt.seasonLabel(topNational.season.seasonIndex)
            : 'Sin convocatorias destacadas'
      },
      {
        label: 'Temporada más memorable',
        value: fmt.seasonLabel(memorable.seasonIndex),
        detail:
          (memorable.goals || 0) +
          'G · ' +
          (memorable.assists || 0) +
          'A · ' +
          (memorable.trophies || []).length +
          ' títulos'
      }
    ];

    return { items: items };
  }

  function legacyHtml(legacy) {
    var F = UI.format;
    var cards = (legacy.items || [])
      .map(function (item) {
        if (item.value == null) {
          return (
            '<div class="mc-legacy-item is-empty">' +
            '<span>' +
            F.escapeHtml(item.label) +
            '</span><strong>—</strong><em>' +
            F.escapeHtml(item.detail || 'Sin datos') +
            '</em></div>'
          );
        }
        return (
          '<div class="mc-legacy-item">' +
          '<span>' +
          F.escapeHtml(item.label) +
          '</span><strong>' +
          F.escapeHtml(String(item.value)) +
          '</strong><em>' +
          F.escapeHtml(item.detail || '') +
          '</em></div>'
        );
      })
      .join('');
    return (
      '<section class="ct-card mc-legacy mc-reveal" aria-labelledby="mc-legacy-title">' +
      '<p class="mc-kicker">Después del silbato</p>' +
      '<h2 id="mc-legacy-title">Tu legado</h2>' +
      '<div class="mc-legacy-grid">' +
      cards +
      '</div></section>'
    );
  }

  function achievementsHtml(list) {
    var F = UI.format;
    if (!list || !list.length) {
      return (
        '<section class="ct-card mc-achievements mc-reveal" aria-labelledby="mc-ach-title">' +
        '<h2 id="mc-ach-title">Logros</h2>' +
        '<p class="mc-muted">Esta carrera no desbloqueó logros especiales.</p></section>'
      );
    }
    return (
      '<section class="ct-card mc-achievements mc-reveal" aria-labelledby="mc-ach-title">' +
      '<h2 id="mc-ach-title">Logros</h2>' +
      '<div class="mc-flag-row">' +
      list
        .map(function (a) {
          return '<span class="ct-badge ct-badge--warm">' + F.escapeHtml(a.label) + '</span>';
        })
        .join('') +
      '</div></section>'
    );
  }

  UI.Legacy = {
    detectAchievements: detectAchievements,
    buildLegacy: buildLegacy,
    legacyHtml: legacyHtml,
    achievementsHtml: achievementsHtml
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
