(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  function F() {
    return UI.format;
  }

  function topClubs(state, engine, limit) {
    limit = limit || 3;
    var counts = Object.create(null);
    (state.seasonHistory || []).forEach(function (s) {
      if (!s.clubId) return;
      counts[s.clubId] = (counts[s.clubId] || 0) + 1;
    });
    (state.clubsPlayed || []).forEach(function (id) {
      if (!counts[id]) counts[id] = 1;
    });
    return Object.keys(counts)
      .sort(function (a, b) {
        return counts[b] - counts[a];
      })
      .slice(0, limit)
      .map(function (id) {
        return engine.getClub(id);
      })
      .filter(Boolean);
  }

  function buildViewModel(state, engine) {
    var agg = NS.Scoring.aggregateHistory(state);
    var country = engine.world.countriesById[state.player.countryId];
    var arch = engine.world.archetypesById[state.player.archetypeId];
    var initialId =
      (state.seasonHistory[0] && state.seasonHistory[0].clubId) ||
      (state.clubsPlayed && state.clubsPlayed[0]) ||
      state.clubId;
    var finalId =
      (state.seasonHistory.length &&
        state.seasonHistory[state.seasonHistory.length - 1].clubId) ||
      state.clubId;
    var initialClub = engine.getClub(initialId);
    var finalClub = engine.getClub(finalId);
    var clubs = topClubs(state, engine, 3);
    var category = state.careerCategory || NS.Scoring.categoryFromScore(state.careerScore || 0);
    var achievements = UI.Legacy
      ? UI.Legacy.detectAchievements(state, engine.world)
      : state.careerFlags || [];
    var titleSummary = NS.Scoring.summarizeTitles
      ? NS.Scoring.summarizeTitles(state)
      : [];
    var awardSummary = NS.Awards && NS.Awards.summarizeAwards ? NS.Awards.summarizeAwards(state) : [];
    var highlightTitles = titleSummary.slice(0, 6);
    var highlightAwards = awardSummary.slice(0, 6);

    return {
      playerName: state.player.name,
      position: state.player.position,
      positionLabel: F().POSITION_LABELS[state.player.position] || state.player.position,
      archetypeName: arch ? arch.name : '',
      country: country,
      ageStart: state.ageStart != null ? state.ageStart : 17,
      ageEnd: state.age,
      birthYear: state.birthYear || null,
      clubTimeline:
        NS.Rules && NS.Rules.clubTimelineSummary
          ? NS.Rules.clubTimelineSummary(state, engine.world)
          : [],
      initialClub: initialClub,
      finalClub: finalClub,
      topClubs: clubs,
      appearances: agg.games,
      goals: agg.goals,
      assists: agg.assists,
      titles: agg.titles,
      titleSummary: titleSummary,
      highlightTitles: highlightTitles,
      awards: (state.awards || []).length,
      awardSummary: awardSummary,
      highlightAwards: highlightAwards,
      records: (state.records || []).length,
      moments: (state.moments || []).length,
      nationalCaps: state.nationalCaps || 0,
      nationalGoals: state.nationalGoals || 0,
      peakRating: state.peakRating,
      peakMarketValue: state.peakMarketValue || state.marketValue || 0,
      score: state.careerScore,
      category: category,
      achievements: achievements,
      retirementLine: state.retirementLine || '',
      careerSeed: state.careerSeed,
      createdAt: state.createdAt,
      clubsPlayedCount: (state.clubsPlayed || []).length
    };
  }

  function renderHighlights(vm) {
    var bits = [];
    (vm.highlightAwards || []).forEach(function (a) {
      bits.push(
        '<span class="mc-career-card__chip mc-career-card__chip--award">' +
          F().escapeHtml((a.shortName || a.name) + ' ×' + a.count) +
          '</span>'
      );
    });
    (vm.highlightTitles || []).forEach(function (t) {
      bits.push(
        '<span class="mc-career-card__chip mc-career-card__chip--title">' +
          F().escapeHtml((t.name || t.competitionId) + ' ×' + t.count) +
          '</span>'
      );
    });
    if (vm.nationalCaps) {
      bits.push(
        '<span class="mc-career-card__chip mc-career-card__chip--nt">' +
          F().escapeHtml('Selección ' + vm.nationalCaps + ' caps') +
          '</span>'
      );
    }
    if (vm.records) {
      bits.push(
        '<span class="mc-career-card__chip mc-career-card__chip--record">' +
          F().escapeHtml('Récords ×' + vm.records) +
          '</span>'
      );
    }
    if (!bits.length) return '';
    return '<div class="mc-career-card__highlights">' + bits.join('') + '</div>';
  }

  function renderHtml(vm) {
    var flag = UI.components.countryFlagHtml(vm.country, 'lg');
    var badges = (vm.topClubs || [])
      .map(function (c) {
        return (
          '<span class="mc-card-club">' +
          UI.components.clubBadgeHtml(c, 'sm') +
          '<em>' +
          F().escapeHtml(c.shortName || c.name) +
          '</em></span>'
        );
      })
      .join('');

    var ach = (vm.achievements || [])
      .slice(0, 6)
      .map(function (a) {
        return '<span class="ct-badge ct-badge--primary">' + F().escapeHtml(a.label || a.id) + '</span>';
      })
      .join('');

    return (
      '<article class="mc-career-card" aria-label="Career Card de ' +
      F().escapeHtml(vm.playerName) +
      '">' +
      '<div class="mc-career-card__glow" aria-hidden="true"></div>' +
      '<header class="mc-career-card__header">' +
      '<div class="mc-career-card__identity">' +
      flag +
      '<div>' +
      '<p class="mc-kicker">' +
      F().escapeHtml(vm.position) +
      ' · ' +
      F().escapeHtml(vm.archetypeName) +
      '</p>' +
      '<h2 class="mc-career-card__name">' +
      F().escapeHtml(vm.playerName) +
      '</h2>' +
      '<p class="mc-career-card__ages">' +
      vm.ageStart +
      ' → ' +
      vm.ageEnd +
      ' años</p></div></div>' +
      '<div class="mc-career-card__scoreblock">' +
      '<span class="mc-career-card__score">' +
      (vm.score != null ? Number(vm.score).toFixed(1) : '—') +
      '</span>' +
      '<strong>' +
      F().escapeHtml((vm.category && vm.category.label) || 'Carrera') +
      '</strong></div></header>' +
      '<div class="mc-career-card__clubs">' +
      '<div><span>Debut</span><strong>' +
      F().escapeHtml(
        vm.initialClub ? vm.initialClub.shortName || vm.initialClub.name : '—'
      ) +
      '</strong></div>' +
      '<div><span>Retiro</span><strong>' +
      F().escapeHtml(vm.finalClub ? vm.finalClub.shortName || vm.finalClub.name : '—') +
      '</strong></div></div>' +
      (badges ? '<div class="mc-career-card__badge-row">' + badges + '</div>' : '') +
      renderHighlights(vm) +
      '<div class="mc-career-card__stats">' +
      '<div><span>PJ</span><strong>' +
      vm.appearances +
      '</strong></div>' +
      '<div><span>Goles</span><strong>' +
      vm.goals +
      '</strong></div>' +
      '<div><span>Asist.</span><strong>' +
      vm.assists +
      '</strong></div>' +
      '<div><span>Títulos</span><strong>' +
      vm.titles +
      '</strong></div>' +
      '<div><span>Premios</span><strong>' +
      vm.awards +
      '</strong></div>' +
      '<div><span>Sel.</span><strong>' +
      vm.nationalCaps +
      '</strong></div>' +
      '<div><span>Peak OVR</span><strong class="is-accent">' +
      vm.peakRating +
      '</strong></div>' +
      '<div><span>Valor máx.</span><strong>' +
      F().escapeHtml(F().formatMoney(vm.peakMarketValue)) +
      '</strong></div></div>' +
      (ach ? '<div class="mc-career-card__ach">' + ach + '</div>' : '') +
      '<footer class="mc-career-card__footer">Crack Total · Mi Carrera</footer>' +
      '</article>'
    );
  }

  function escapeXml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderSvg(vm) {
    var score = vm.score != null ? Number(vm.score).toFixed(1) : '—';
    var category = (vm.category && vm.category.label) || 'Carrera';
    var flag = vm.country ? String(vm.country.iso2 || '').toUpperCase() : '';
    var clubLine =
      (vm.initialClub ? vm.initialClub.shortName : '?') +
      ' → ' +
      (vm.finalClub ? vm.finalClub.shortName : '?');

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="694" viewBox="0 0 390 694" role="img" aria-label="Career Card">' +
      '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#0b1524"/><stop offset="100%" stop-color="#050b14"/></linearGradient>' +
      '<linearGradient id="line" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#79f2a6"/><stop offset="50%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#fbbf24"/>' +
      '</linearGradient></defs>' +
      '<rect width="390" height="694" rx="28" fill="url(#bg)"/>' +
      '<rect x="0" y="0" width="390" height="6" fill="url(#line)"/>' +
      '<text x="28" y="48" fill="#79f2a6" font-family="Montserrat, Arial" font-size="12" font-weight="800" letter-spacing="2">CRACK TOTAL</text>' +
      '<text x="28" y="92" fill="#f7f9fc" font-family="Oswald, Arial" font-size="42" font-weight="700">' +
      escapeXml(vm.playerName) +
      '</text>' +
      '<text x="28" y="122" fill="#aebbd0" font-family="Montserrat, Arial" font-size="14">' +
      escapeXml(flag + ' · ' + vm.position + ' · ' + (vm.archetypeName || '')) +
      '</text>' +
      '<text x="28" y="148" fill="#8493aa" font-family="Montserrat, Arial" font-size="13">' +
      escapeXml(vm.ageStart + ' → ' + vm.ageEnd + ' · ' + clubLine) +
      '</text>' +
      '<text x="300" y="100" text-anchor="middle" fill="#79f2a6" font-family="Oswald, Arial" font-size="48" font-weight="700">' +
      escapeXml(score) +
      '</text>' +
      '<text x="300" y="124" text-anchor="middle" fill="#aebbd0" font-family="Montserrat, Arial" font-size="11" font-weight="700">' +
      escapeXml(category.toUpperCase()) +
      '</text>' +
      '<text x="28" y="210" fill="#f7f9fc" font-family="Montserrat, Arial" font-size="16">' +
      escapeXml(
        vm.appearances +
          ' PJ · ' +
          vm.goals +
          ' G · ' +
          vm.assists +
          ' A · ' +
          vm.titles +
          ' títulos · ' +
          vm.awards +
          ' premios'
      ) +
      '</text>' +
      '<text x="28" y="242" fill="#aebbd0" font-family="Montserrat, Arial" font-size="14">' +
      escapeXml(
        'Peak ' +
          vm.peakRating +
          ' · ' +
          F().formatMoney(vm.peakMarketValue) +
          ' · Sel ' +
          vm.nationalCaps +
          '/' +
          vm.nationalGoals +
          (vm.records ? ' · Récords ' + vm.records : '')
      ) +
      '</text>' +
      '<text x="28" y="660" fill="#8493aa" font-family="Montserrat, Arial" font-size="12">Mi Carrera · cracktotal.com</text>' +
      '</svg>'
    );
  }

  function toDataUrl(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  var CareerCardRenderer = {
    buildViewModel: buildViewModel,
    renderHtml: renderHtml,
    renderSvg: renderSvg,
    toDataUrl: toDataUrl,
    render: function (state, engine) {
      var vm = buildViewModel(state, engine);
      return {
        viewModel: vm,
        html: renderHtml(vm),
        svg: renderSvg(vm),
        dataUrl: toDataUrl(renderSvg(vm))
      };
    }
  };

  UI.CareerCardRenderer = CareerCardRenderer;
  NS.CareerCardRenderer = CareerCardRenderer;
})(typeof globalThis !== 'undefined' ? globalThis : window);
