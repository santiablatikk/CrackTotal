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
    var analysis =
      NS.Rules && NS.Rules.analyzeCareer ? NS.Rules.analyzeCareer(state, engine.world) : null;
    var category = state.careerCategory || NS.Scoring.categoryFromScore(state.careerScore || 0);
    var achievements = UI.Legacy
      ? UI.Legacy.detectAchievements(state, engine.world)
      : state.careerFlags || [];

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
      initialClub: engine.getClub(initialId),
      finalClub: engine.getClub(finalId),
      topClubs: topClubs(state, engine, 3),
      appearances: agg.games,
      goals: agg.goals,
      assists: agg.assists,
      goalsAgainst: agg.goalsAgainst || 0,
      cleanSheets: agg.cleanSheets || 0,
      titles: agg.titles,
      awards: (state.awards || []).length,
      nationalCaps: state.nationalCaps || 0,
      peakRating: state.peakRating,
      peakMarketValue: state.peakMarketValue || state.marketValue || 0,
      score: state.careerScore,
      category: category,
      achievements: achievements,
      retirementLine: state.retirementLine || '',
      storyPhrase:
        NS.Rules && NS.Rules.careerStoryPhrase
          ? NS.Rules.careerStoryPhrase(state, engine.world)
          : state.retirementLine || '',
      emergentArchetype: analysis ? analysis.archetype : null,
      emergentLabel:
        analysis && NS.Rules.archetypeLabel
          ? NS.Rules.archetypeLabel(analysis.archetype)
          : '',
      careerSeed: state.careerSeed,
      createdAt: state.createdAt,
      clubsPlayedCount: (state.clubsPlayed || []).length
    };
  }

  function renderHtml(vm) {
    var flag = UI.components.countryFlagHtml(vm.country, 'md');
    var badges = (vm.topClubs || [])
      .map(function (c) {
        return UI.components.clubBadgeHtml(c, 'sm');
      })
      .join('');

    return (
      '<article class="mc-card mc-career-card" aria-label="Career Card de ' +
      F().escapeHtml(vm.playerName) +
      '">' +
      '<header class="mc-card__head">' +
      flag +
      '<div>' +
      '<p class="mc-card__kicker">' +
      F().escapeHtml(vm.emergentLabel || vm.positionLabel || vm.position) +
      '</p>' +
      '<h2 class="mc-card__name">' +
      F().escapeHtml(vm.playerName) +
      '</h2>' +
      '<p class="mc-card__ages">' +
      vm.ageStart +
      ' → ' +
      vm.ageEnd +
      ' años</p>' +
      '</div>' +
      '<div class="mc-card__score"><strong>' +
      (vm.score != null ? Number(vm.score).toFixed(1) : '—') +
      '</strong><span>' +
      F().escapeHtml((vm.category && vm.category.label) || 'Carrera') +
      '</span></div></header>' +
      (vm.storyPhrase
        ? '<p class="mc-card__story mc-career-card__story">' + F().escapeHtml(vm.storyPhrase) + '</p>'
        : '') +
      '<div class="mc-card__clubs">' +
      '<div><span>Debut</span><strong>' +
      F().escapeHtml(
        vm.initialClub ? vm.initialClub.shortName || vm.initialClub.name : '—'
      ) +
      '</strong></div>' +
      '<div><span>Retiro</span><strong>' +
      F().escapeHtml(vm.finalClub ? vm.finalClub.shortName || vm.finalClub.name : '—') +
      '</strong></div></div>' +
      (badges ? '<div class="mc-card__badges">' + badges + '</div>' : '') +
      '<div class="mc-card__stats mc-career-card__stats">' +
      '<div><span>PJ</span><strong>' +
      vm.appearances +
      '</strong></div>' +
      (F().isGoalkeeper(vm.position)
        ? '<div><span>GC</span><strong>' +
          vm.goalsAgainst +
          '</strong></div>' +
          '<div><span>VI</span><strong>' +
          vm.cleanSheets +
          '</strong></div>'
        : '<div><span>Goles</span><strong>' +
          vm.goals +
          '</strong></div>' +
          '<div><span>Asist.</span><strong>' +
          vm.assists +
          '</strong></div>') +
      '<div><span>Títulos</span><strong>' +
      vm.titles +
      '</strong></div>' +
      '<div><span>Pico</span><strong class="is-accent">' +
      vm.peakRating +
      '</strong></div></div>' +
      '<footer class="mc-card__foot">Crack Total · Mi Carrera</footer>' +
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
    var clubLine =
      (vm.initialClub ? vm.initialClub.shortName : '?') +
      ' → ' +
      (vm.finalClub ? vm.finalClub.shortName : '?');
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">' +
      '<rect width="1080" height="1350" fill="#070b10"/>' +
      '<text x="80" y="160" fill="#79f2a6" font-size="36" font-family="Arial">' +
      escapeXml(vm.emergentLabel || vm.position) +
      '</text>' +
      '<text x="80" y="280" fill="#fff" font-size="72" font-family="Arial" font-weight="700">' +
      escapeXml(vm.playerName) +
      '</text>' +
      '<text x="80" y="360" fill="#aebbd0" font-size="36" font-family="Arial">' +
      vm.ageStart +
      ' → ' +
      vm.ageEnd +
      ' · ' +
      escapeXml(clubLine) +
      '</text>' +
      '<text x="80" y="480" fill="#fff" font-size="40" font-family="Arial">' +
      escapeXml(vm.storyPhrase || '') +
      '</text>' +
      '<text x="80" y="640" fill="#79f2a6" font-size="96" font-family="Arial" font-weight="700">' +
      score +
      '</text>' +
      '<text x="80" y="720" fill="#aebbd0" font-size="32" font-family="Arial">' +
      escapeXml(category) +
      ' · Pico ' +
      vm.peakRating +
      '</text>' +
      '<text x="80" y="1280" fill="#667" font-size="28" font-family="Arial">Crack Total · Mi Carrera</text>' +
      '</svg>'
    );
  }

  function render(state, engine) {
    var vm = buildViewModel(state, engine);
    return { html: renderHtml(vm), svg: renderSvg(vm), viewModel: vm };
  }

  UI.CareerCardRenderer = {
    buildViewModel: buildViewModel,
    renderHtml: renderHtml,
    renderSvg: renderSvg,
    render: render
  };
  NS.CareerCardRenderer = UI.CareerCardRenderer;
})(typeof globalThis !== 'undefined' ? globalThis : window);
