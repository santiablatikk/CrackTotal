(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  function F() {
    return UI.format;
  }
  function C() {
    return UI.components;
  }

  function introScreen(ctx) {
    var active = ctx.activeSummary;
    var resume = '';
    if (active) {
      resume =
        '<section class="ct-card mc-resume" aria-labelledby="mc-resume-title">' +
        '<p class="mc-kicker">Carrera en curso</p>' +
        '<h2 id="mc-resume-title">Continuar carrera</h2>' +
        '<div class="mc-resume__row">' +
        '<div><strong>' +
        F().escapeHtml(active.playerName) +
        '</strong><span>' +
        active.age +
        ' años · ' +
        F().escapeHtml(active.clubName) +
        '</span></div>' +
        '<div class="mc-resume__rating" aria-label="Rating ' +
        active.rating +
        '"><span>OVR</span><strong>' +
        active.rating +
        '</strong></div></div>' +
        '<div class="mc-actions">' +
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="continue-career">Continuar</button>' +
        '<button type="button" class="ct-button ct-button--secondary" data-mc-action="new-career-confirm">Nueva carrera</button>' +
        '</div></section>';
    }

    return (
      '<section class="mc-screen mc-screen--intro">' +
      '<div class="mc-hero">' +
      '<p class="mc-kicker">Crack Total</p>' +
      '<h1 class="mc-hero__title">Mi Carrera</h1>' +
      '<p class="mc-hero__lead">Tu carrera. Tus decisiones. Tu legado.</p>' +
      '<div class="mc-actions">' +
      (active
        ? ''
        : '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="start-create">Comenzar mi carrera</button>') +
      '<a class="ct-button ct-button--ghost" href="games.html">Volver a juegos</a>' +
      '</div></div>' +
      resume +
      '</section>'
    );
  }

  function createScreen(ctx) {
    var draft = ctx.draft || {};
    var continents = ctx.data.continents || [];
    var continentOptions = continents
      .map(function (c) {
        var selected = draft.continentId === c.id ? ' aria-pressed="true" class="mc-chip is-active"' : ' aria-pressed="false" class="mc-chip"';
        return (
          '<button type="button"' +
          selected +
          ' data-mc-action="filter-continent" data-id="' +
          F().escapeHtml(c.id) +
          '">' +
          F().escapeHtml(c.shortName || c.name) +
          '</button>'
        );
      })
      .join('');

    var positions = ['GK', 'DEF', 'MID', 'FWD']
      .map(function (pos) {
        var active = draft.position === pos ? ' is-selected' : '';
        return (
          '<button type="button" class="mc-choice-card mc-choice-card--pos' +
          active +
          '" data-mc-action="pick-position" data-id="' +
          pos +
          '" aria-pressed="' +
          (draft.position === pos) +
          '">' +
          '<span class="mc-choice-card__code">' +
          pos +
          '</span>' +
          '<strong>' +
          F().escapeHtml(F().POSITION_LABELS[pos]) +
          '</strong></button>'
        );
      })
      .join('');

    var archetypes = (ctx.data.archetypes || [])
      .map(function (arch) {
        var active = draft.archetypeId === arch.id ? ' is-selected' : '';
        return (
          '<button type="button" class="mc-choice-card mc-choice-card--arch' +
          active +
          '" data-mc-action="pick-archetype" data-id="' +
          F().escapeHtml(arch.id) +
          '" aria-pressed="' +
          (draft.archetypeId === arch.id) +
          '">' +
          '<strong>' +
          F().escapeHtml(arch.name) +
          '</strong>' +
          '<span>' +
          F().escapeHtml(arch.description) +
          '</span></button>'
        );
      })
      .join('');

    var country = draft.countryId
      ? (ctx.data.countries || []).filter(function (c) {
          return c.id === draft.countryId;
        })[0]
      : null;

    return (
      '<section class="mc-screen mc-screen--create">' +
      '<header class="mc-screen__header">' +
      '<p class="mc-kicker">Paso 1 de 2</p>' +
      '<h1>Creá tu jugador</h1>' +
      '<p>Elegí identidad, origen y estilo. El resto lo escribe el fútbol.</p>' +
      '</header>' +
      '<form class="mc-create" id="mc-create-form" novalidate>' +
      '<div class="ct-card mc-panel">' +
      '<label class="ct-label" for="mc-player-name">Nombre</label>' +
      '<input class="ct-input" id="mc-player-name" name="name" maxlength="24" autocomplete="nickname" required placeholder="Ej: Tisan" value="' +
      F().escapeHtml(draft.name || '') +
      '" />' +
      '<p class="ct-field-error" id="mc-name-error" hidden></p>' +
      '</div>' +
      '<div class="ct-card mc-panel">' +
      '<div class="mc-panel__title-row"><h2>País</h2>' +
      (country
        ? '<span class="mc-selected-pill">' +
          C().countryFlagHtml(country, 'sm') +
          ' ' +
          F().escapeHtml(country.name) +
          '</span>'
        : '') +
      '</div>' +
      '<label class="ct-label" for="mc-country-search">Buscar país</label>' +
      '<input class="ct-input" id="mc-country-search" type="search" placeholder="Argentina, Brasil, Japón…" value="' +
      F().escapeHtml(draft.countryQuery || '') +
      '" autocomplete="off" />' +
      '<div class="mc-chip-row" role="group" aria-label="Filtrar por continente">' +
      '<button type="button" class="mc-chip' +
      (!draft.continentId ? ' is-active' : '') +
      '" data-mc-action="filter-continent" data-id="" aria-pressed="' +
      (!draft.continentId) +
      '">Todos</button>' +
      continentOptions +
      '</div>' +
      '<div class="mc-country-list" id="mc-country-list" role="listbox" aria-label="Resultados de países"></div>' +
      '<p class="ct-field-error" id="mc-country-error" hidden></p>' +
      '</div>' +
      '<div class="ct-card mc-panel">' +
      '<h2>Posición</h2>' +
      '<div class="mc-choice-grid mc-choice-grid--4">' +
      positions +
      '</div>' +
      '<p class="ct-field-error" id="mc-position-error" hidden></p>' +
      '</div>' +
      '<div class="ct-card mc-panel">' +
      '<h2>Arquetipo</h2>' +
      '<div class="mc-choice-grid mc-choice-grid--2">' +
      archetypes +
      '</div>' +
      '<p class="ct-field-error" id="mc-archetype-error" hidden></p>' +
      '</div>' +
      '<div class="mc-actions mc-actions--sticky">' +
      '<button type="button" class="ct-button ct-button--ghost" data-mc-action="go-intro">Volver</button>' +
      '<button type="submit" class="ct-button ct-button--primary ct-button--lg">Crear jugador</button>' +
      '</div></form></section>'
    );
  }

  function countryResultsHtml(countries, selectedId) {
    if (!countries.length) {
      return '<p class="mc-empty-inline">No hay países con ese filtro.</p>';
    }
    return countries
      .map(function (c) {
        var selected = c.id === selectedId;
        return (
          '<button type="button" class="mc-country-item' +
          (selected ? ' is-selected' : '') +
          '" role="option" aria-selected="' +
          selected +
          '" data-mc-action="pick-country" data-id="' +
          F().escapeHtml(c.id) +
          '">' +
          C().countryFlagHtml(c, 'sm') +
          '<span class="mc-country-item__text"><strong>' +
          F().escapeHtml(c.name) +
          '</strong><em>' +
          F().escapeHtml(c.nationality || c.iso2) +
          '</em></span></button>'
        );
      })
      .join('');
  }

  function presentScreen(ctx) {
    var state = ctx.state;
    var country = ctx.engine.world.countriesById[state.player.countryId];
    var club = ctx.engine.getClub(state.clubId);
    var arch = ctx.engine.world.archetypesById[state.player.archetypeId];

    return (
      '<section class="mc-screen mc-screen--present">' +
      '<header class="mc-screen__header">' +
      '<p class="mc-kicker">Presentación</p>' +
      '<h1>Tu carta está lista</h1>' +
      '</header>' +
      '<article class="mc-player-card ct-card mc-reveal">' +
      '<div class="mc-player-card__top">' +
      C().countryFlagHtml(country, 'lg') +
      '<div><p class="mc-player-card__pos">' +
      F().escapeHtml(F().POSITION_SHORT[state.player.position] + ' · ' + F().POSITION_LABELS[state.player.position]) +
      '</p>' +
      '<h2>' +
      F().escapeHtml(state.player.name) +
      '</h2>' +
      '<p class="mc-player-card__arch">' +
      F().escapeHtml(arch ? arch.name : '') +
      '</p></div></div>' +
      '<div class="mc-player-card__club">' +
      C().clubBadgeHtml(club, 'lg') +
      '<div><span>Club inicial</span><strong>' +
      F().escapeHtml(club ? club.shortName || club.name : '—') +
      '</strong></div></div>' +
      '<div class="mc-player-card__ratings">' +
      '<div><span>Rating</span><strong class="mc-num" data-mc-count="' +
      state.rating +
      '">' +
      state.rating +
      '</strong></div>' +
      '<div><span>Potencial</span><strong class="mc-num" data-mc-count="' +
      state.potential +
      '">' +
      state.potential +
      '</strong></div>' +
      '<div><span>Edad</span><strong>17</strong></div>' +
      '</div></article>' +
      '<div class="mc-actions">' +
      '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="begin-career">Comenzar carrera</button>' +
      '</div></section>'
    );
  }

  function seasonStatsFromHistory(state, age) {
    if (!state.seasonHistory || !state.seasonHistory.length) return null;
    if (age == null || age === state.age) return null;
    for (var i = 0; i < state.seasonHistory.length; i++) {
      if (state.seasonHistory[i].age === age) return state.seasonHistory[i];
    }
    return null;
  }

  function seasonScreen(ctx) {
    var state = ctx.state;
    var club = ctx.engine.getClub(state.clubId);
    var country = ctx.engine.world.countriesById[state.player.countryId];
    var comp = club ? ctx.engine.world.competitionsById[club.primaryCompetitionId] : null;
    var focusAge = ctx.focusAge != null ? ctx.focusAge : state.age;
    var past = seasonStatsFromHistory(state, focusAge);
    var decision = state.currentDecision;
    var viewingPast = !!(past && focusAge !== state.age);

    var decisionHtml = viewingPast
      ? '<div class="ct-card mc-panel"><p class="mc-kicker">Temporada consultada</p><h2>A los ' +
        focusAge +
        ' años</h2><p>Estás viendo el archivo. Volvé a la temporada actual para decidir.</p>' +
        '<button type="button" class="ct-button ct-button--secondary" data-mc-action="focus-age" data-age="' +
        state.age +
        '">Volver al presente</button></div>'
      : renderDecision(ctx, decision, club);

    var lastSeason =
      state.seasonHistory && state.seasonHistory.length
        ? state.seasonHistory[state.seasonHistory.length - 1]
        : null;
    var statsSource = past || (!viewingPast ? lastSeason : null);
    var statsBlock = statsSource
      ? '<div class="mc-stat-grid">' +
        C().statChip('Partidos', statsSource.appearances) +
        C().statChip('Goles', statsSource.goals) +
        C().statChip('Asistencias', statsSource.assists) +
        C().statChip('Rating', statsSource.averageRating) +
        C().statChip('Títulos', (statsSource.trophies || []).length) +
        C().statChip('Lesión', (statsSource.injuryWeeks || 0) + ' sem') +
        C().statChip('Selección', statsSource.nationalCaps || 0) +
        '</div>'
      : '<p class="mc-muted">Las estadísticas aparecen al cerrar tu primera temporada.</p>';

    return (
      '<section class="mc-screen mc-screen--season">' +
      '<div class="mc-season-layout">' +
      '<div class="mc-season-main">' +
      '<header class="mc-season-top ct-card">' +
      '<div class="mc-season-top__club">' +
      C().clubBadgeHtml(club, 'lg') +
      '<div>' +
      '<p class="mc-kicker">' +
      F().escapeHtml(F().seasonLabel(state.seasonIndex)) +
      ' · ' +
      state.age +
      ' años</p>' +
      '<h1>' +
      F().escapeHtml(state.player.name) +
      '</h1>' +
      '<p>' +
      C().countryFlagHtml(country, 'sm') +
      ' ' +
      F().escapeHtml(F().POSITION_LABELS[state.player.position]) +
      ' · ' +
      F().escapeHtml(club ? club.shortName || club.name : 'Sin club') +
      '</p></div></div>' +
      '<div class="mc-season-top__ovr"><span>OVR</span><strong class="mc-num">' +
      state.rating +
      '</strong></div></header>' +
      C().timelineHtml(state, focusAge) +
      decisionHtml +
      '</div>' +
      '<aside class="mc-season-side" aria-label="Estado del jugador">' +
      '<div class="ct-card mc-panel">' +
      '<h2>Estado</h2>' +
      C().meter('Forma', state.form, 10, 'warm') +
      C().meter('Físico', state.fitness, 100, 'accent') +
      C().meter('Prestigio', state.prestige, 100, 'primary') +
      C().meter('Popularidad', state.popularity, 100, 'warm') +
      '<div class="mc-side-facts">' +
      C().statChip('Valor', F().formatMoney(state.marketValue)) +
      C().statChip('Dinero', F().formatMoney(state.money)) +
      C().statChip('Potencial', state.potential) +
      C().statChip('Selección', state.nationalCaps + ' PJ') +
      '</div>' +
      (comp ? '<p class="mc-muted mc-comp-line">Compite en <strong>' + F().escapeHtml(comp.shortName || comp.name) + '</strong></p>' : '') +
      '</div>' +
      '<div class="ct-card mc-panel">' +
      '<h2>' +
      (viewingPast ? 'Temporada archivada' : 'Última temporada') +
      '</h2>' +
      statsBlock +
      '</div></aside></div></section>'
    );
  }

  function renderDecision(ctx, decision, currentClub) {
    if (!decision) {
      return '<div class="ct-card mc-panel" role="status"><p>No hay decisión pendiente.</p></div>';
    }

    if (decision.type === 'transferencia') {
      return renderTransferDecision(ctx, decision, currentClub);
    }

    if (decision.type === 'seleccion') {
      return renderNationalDecision(ctx, decision);
    }

    var options = (decision.options || [])
      .map(function (opt) {
        return (
          '<button type="button" class="mc-decision-option" data-mc-action="choose-option" data-option="' +
          F().escapeHtml(opt.id) +
          '">' +
          '<strong>' +
          F().escapeHtml(opt.label) +
          '</strong>' +
          '<span>' +
          F().escapeHtml(opt.summary || '') +
          '</span></button>'
        );
      })
      .join('');

    return (
      '<article class="ct-card mc-decision mc-reveal" aria-labelledby="mc-decision-title">' +
      '<p class="mc-kicker">Decisión</p>' +
      '<h2 id="mc-decision-title">' +
      F().escapeHtml(decision.title) +
      '</h2>' +
      '<p class="mc-decision__prompt">' +
      F().escapeHtml(decision.prompt) +
      '</p>' +
      '<div class="mc-decision__options">' +
      options +
      '</div></article>'
    );
  }

  function renderTransferDecision(ctx, decision, currentClub) {
    var offers = ctx.state.pendingOffers || [];
    var selectedOfferId = ctx.selectedOfferId || (offers[0] && offers[0].id) || '';
    var offerCards = offers
      .map(function (offer) {
        var club = ctx.engine.getClub(offer.clubId);
        var comp = club ? ctx.engine.world.competitionsById[club.primaryCompetitionId] : null;
        var selected = offer.id === selectedOfferId;
        return (
          '<button type="button" class="mc-offer-card' +
          (selected ? ' is-selected' : '') +
          '" data-mc-action="select-offer" data-offer="' +
          F().escapeHtml(offer.id) +
          '" aria-pressed="' +
          selected +
          '">' +
          C().clubBadgeHtml(club, 'md') +
          '<div class="mc-offer-card__body">' +
          '<strong>' +
          F().escapeHtml(club ? club.shortName || club.name : 'Club') +
          '</strong>' +
          '<span>' +
          F().escapeHtml(F().LEVEL_LABELS[club ? club.level : 1] || '') +
          ' · Prestigio ' +
          (club ? club.prestige : '—') +
          '</span>' +
          '<span>' +
          F().escapeHtml(F().ROLE_LABELS[offer.role] || offer.role) +
          ' · ' +
          F().formatMoney(offer.wage) +
          '/año</span>' +
          '<span>' +
          F().escapeHtml(comp ? comp.shortName || comp.name : 'Competición') +
          '</span></div></button>'
        );
      })
      .join('');

    var selected = offers.filter(function (o) {
      return o.id === selectedOfferId;
    })[0];
    var selectedClub = selected ? ctx.engine.getClub(selected.clubId) : null;
    var compare =
      selectedClub && currentClub
        ? '<div class="mc-compare" aria-label="Comparación de clubes">' +
          '<div class="mc-compare__col"><p class="mc-kicker">Club actual</p>' +
          C().clubBadgeHtml(currentClub, 'md') +
          '<strong>' +
          F().escapeHtml(currentClub.shortName || currentClub.name) +
          '</strong>' +
          '<ul>' +
          '<li>Nivel: ' +
          F().escapeHtml(F().LEVEL_LABELS[currentClub.level] || String(currentClub.level)) +
          '</li>' +
          '<li>Prestigio: ' +
          currentClub.prestige +
          '</li></ul></div>' +
          '<div class="mc-compare__vs" aria-hidden="true">VS</div>' +
          '<div class="mc-compare__col is-offer"><p class="mc-kicker">Nueva oferta</p>' +
          C().clubBadgeHtml(selectedClub, 'md') +
          '<strong>' +
          F().escapeHtml(selectedClub.shortName || selectedClub.name) +
          '</strong>' +
          '<ul>' +
          '<li>Nivel: ' +
          F().escapeHtml(F().LEVEL_LABELS[selectedClub.level] || String(selectedClub.level)) +
          '</li>' +
          '<li>Prestigio: ' +
          selectedClub.prestige +
          '</li>' +
          '<li>Salario: ' +
          F().formatMoney(selected.wage) +
          '</li>' +
          '<li>Rol: ' +
          F().escapeHtml(F().ROLE_LABELS[selected.role] || selected.role) +
          '</li></ul></div></div>'
        : '<p class="mc-muted">No hay ofertas sobre la mesa. Podés reforzar el vínculo con tu club.</p>';

    return (
      '<article class="ct-card mc-decision mc-decision--transfer mc-reveal">' +
      '<p class="mc-kicker">Mercado</p>' +
      '<h2>Oferta sobre la mesa</h2>' +
      '<p class="mc-decision__prompt">' +
      F().escapeHtml(decision.prompt) +
      '</p>' +
      compare +
      (offers.length
        ? '<div class="mc-offer-list" role="list">' + offerCards + '</div>'
        : '') +
      '<div class="mc-decision__options mc-decision__options--row">' +
      (selected
        ? '<button type="button" class="ct-button ct-button--primary" data-mc-action="choose-option" data-option="accept_best_prestige" data-offer="' +
          F().escapeHtml(selected.id) +
          '">Aceptar oferta</button>' +
          '<button type="button" class="ct-button ct-button--secondary" data-mc-action="choose-option" data-option="accept_minutes" data-offer="' +
          F().escapeHtml(selected.id) +
          '">Priorizar minutos</button>'
        : '') +
      '<button type="button" class="ct-button ct-button--ghost" data-mc-action="choose-option" data-option="stay_loyal">Quedarme</button>' +
      '</div></article>'
    );
  }

  function renderNationalDecision(ctx, decision) {
    var state = ctx.state;
    var nt = ctx.engine.world.nationalTeamsById[state.nationalTeamId];
    var country = ctx.engine.world.countriesById[state.player.countryId];
    var options = (decision.options || [])
      .map(function (opt) {
        return (
          '<button type="button" class="mc-decision-option" data-mc-action="choose-option" data-option="' +
          F().escapeHtml(opt.id) +
          '"><strong>' +
          F().escapeHtml(opt.label) +
          '</strong><span>' +
          F().escapeHtml(opt.summary || '') +
          '</span></button>'
        );
      })
      .join('');

    return (
      '<article class="ct-card mc-decision mc-decision--national mc-reveal">' +
      '<p class="mc-kicker">Selección</p>' +
      '<div class="mc-national-head">' +
      C().countryFlagHtml(country, 'lg') +
      '<div><h2>' +
      F().escapeHtml(nt ? nt.name : country ? country.name : 'Selección') +
      '</h2>' +
      '<p>' +
      F().escapeHtml(decision.prompt) +
      '</p></div></div>' +
      '<div class="mc-stat-grid">' +
      C().statChip('Internacionales', state.nationalCaps) +
      C().statChip('Goles', state.nationalGoals) +
      C().statChip('Prestigio NT', nt ? nt.prestige : '—') +
      '</div>' +
      '<div class="mc-decision__options">' +
      options +
      '</div></article>'
    );
  }

  function eventModalBody(event) {
    var lines = F().effectImpactLines(event.effects);
    return (
      '<p class="mc-event-kicker">Tu temporada cambió</p>' +
      '<p class="mc-event-body">' +
      F().escapeHtml(event.body || '') +
      '</p>' +
      (lines.length
        ? '<ul class="mc-impact-list">' +
          lines
            .map(function (l) {
              return '<li>' + F().escapeHtml(l) + '</li>';
            })
            .join('') +
          '</ul>'
        : '')
    );
  }

  function seasonFeedbackBody(payload) {
    var season = payload.season;
    var deltas = payload.deltas || {};
    return (
      '<p class="mc-kicker">Temporada ' +
      F().escapeHtml(F().seasonLabel(season.seasonIndex)) +
      '</p>' +
      '<p class="mc-stars" aria-hidden="true">' +
      F().starsFromRating(season.averageRating) +
      '</p>' +
      '<p class="mc-feedback-score"><strong>' +
      season.averageRating +
      '</strong> · Grado ' +
      F().escapeHtml(season.performanceGrade) +
      '</p>' +
      '<p>' +
      F().escapeHtml(F().seasonBlurb(season.performanceGrade, season.averageRating)) +
      '</p>' +
      '<div class="mc-stat-grid">' +
      C().statChip('PJ', season.appearances) +
      C().statChip('Goles', season.goals) +
      C().statChip('Asist.', season.assists) +
      C().statChip('Títulos', (season.trophies || []).length) +
      '</div>' +
      '<ul class="mc-delta-list">' +
      '<li>' +
      F().escapeHtml(F().formatDelta(deltas.rating, { zero: 'Rating estable' })) +
      (deltas.rating ? ' Rating' : '') +
      '</li>' +
      '<li>' +
      F().escapeHtml(F().formatDelta(deltas.marketValue, { money: true, zero: 'Valor estable' })) +
      (deltas.marketValue ? ' valor' : '') +
      '</li>' +
      '<li>' +
      F().escapeHtml(F().formatDelta(deltas.prestige, { zero: 'Prestigio estable' })) +
      (deltas.prestige ? ' Prestigio' : '') +
      '</li></ul>'
    );
  }

  function retireScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var reward = ctx.reward || null;
    var card = UI.CareerCardRenderer.render(state, engine);
    var legacy = UI.Legacy.buildLegacy(state, engine);
    var achievements = card.viewModel.achievements || [];
    var shareAvailable = UI.Share.canNativeShare();

    return (
      '<section class="mc-screen mc-screen--retire">' +
      '<header class="mc-screen__header mc-reveal">' +
      '<p class="mc-kicker">Fin de ciclo</p>' +
      '<h1>Tu carrera terminó</h1>' +
      '<p class="mc-cinematic">' +
      F().escapeHtml(state.retirementLine || 'Colgaste los botines.') +
      '</p></header>' +
      '<div class="mc-retire-stack">' +
      card.html +
      UI.Legacy.legacyHtml(legacy) +
      UI.Legacy.achievementsHtml(achievements) +
      UI.Rewards.rewardsHtml(reward) +
      '<section class="ct-card mc-final-actions mc-reveal" aria-label="Acciones finales">' +
      '<div class="mc-actions mc-actions--final">' +
      '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="share-career"' +
      (shareAvailable ? '' : ' hidden') +
      '>Compartir mi carrera</button>' +
      '<button type="button" class="ct-button ct-button--secondary ct-button--lg" data-mc-action="copy-career">' +
      (shareAvailable ? 'Copiar resultado' : 'Copiar resultado') +
      '</button>' +
      '<button type="button" class="ct-button ct-button--primary" data-mc-action="play-again">Jugar otra vez</button>' +
      '<a class="ct-button ct-button--ghost" href="games.html">Volver a Crack Total</a>' +
      '</div>' +
      '<p class="mc-toast" id="mc-share-toast" role="status" aria-live="polite" hidden></p>' +
      '</section></div></section>'
    );
  }

  UI.screens = {
    intro: introScreen,
    create: createScreen,
    present: presentScreen,
    season: seasonScreen,
    retire: retireScreen,
    countryResultsHtml: countryResultsHtml,
    eventModalBody: eventModalBody,
    seasonFeedbackBody: seasonFeedbackBody
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
