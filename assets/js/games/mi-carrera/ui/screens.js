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

  function previewOvr(arch) {
    var bias = arch && arch.modifiers ? arch.modifiers.ratingBias || 0 : 0;
    return 62 + bias + 2;
  }

  function assetSrc(view) {
    if (!view) return null;
    if (NS.Assets && NS.Assets.resolveSrc) return NS.Assets.resolveSrc(view);
    return view.generatedHref || view.href || null;
  }

  function playerCardHtml(draft, data, liveState) {
    var country = null;
    var arch = null;
    var name = 'Tu nombre';
    var pos = '—';
    var ovr = '—';
    var age = 17;
    var clubLabel = 'Sin club';

    if (liveState) {
      name = liveState.player.name;
      pos = liveState.player.position;
      ovr = liveState.rating;
      age = liveState.age;
      country = data && data.countries
        ? null
        : null;
      if (liveState.player.countryId && NS._lastEngine) {
        country = NS._lastEngine.world.countriesById[liveState.player.countryId];
        arch = NS._lastEngine.world.archetypesById[liveState.player.archetypeId];
        var club = NS._lastEngine.getClub(liveState.clubId);
        clubLabel = club ? club.shortName || club.name : clubLabel;
      }
    } else {
      draft = draft || {};
      name = String(draft.name || '').trim() || 'Tu nombre';
      pos = draft.position || '—';
      country = draft.countryId
        ? (data.countries || []).filter(function (c) {
            return c.id === draft.countryId;
          })[0]
        : null;
      arch = draft.archetypeId
        ? (data.archetypes || []).filter(function (a) {
            return a.id === draft.archetypeId;
          })[0]
        : null;
      ovr = arch ? previewOvr(arch) : '—';
    }

    var img = NS.getPlayerImage
      ? NS.getPlayerImage(null, { name: name, position: draft && draft.position ? draft.position : pos })
      : null;
    var src = assetSrc(img);

    return (
      '<aside class="mc-player-card mc-player-card--premium" aria-live="polite">' +
      '<div class="mc-player-card__glow" aria-hidden="true"></div>' +
      '<div class="mc-player-card__top">' +
      (country ? C().countryFlagHtml(country, 'lg') : '<span class="mc-player-card__flag-ph"></span>') +
      '<span class="mc-player-card__age">' +
      age +
      ' años</span></div>' +
      (src
        ? '<img class="mc-player-card__avatar" src="' + F().escapeHtml(src) + '" alt="" width="88" height="88" />'
        : '<div class="mc-player-card__avatar mc-player-card__avatar--ph" aria-hidden="true"></div>') +
      '<p class="mc-player-card__pos">' +
      F().escapeHtml(pos) +
      '</p>' +
      '<h2 class="mc-player-card__name">' +
      F().escapeHtml(name) +
      '</h2>' +
      '<p class="mc-player-card__arch">' +
      F().escapeHtml(arch ? arch.name : 'Elegí tu estilo') +
      '</p>' +
      '<div class="mc-player-card__ovr"><span>OVR</span><strong>' +
      F().escapeHtml(String(ovr)) +
      '</strong></div>' +
      '<p class="mc-player-card__club">' +
      F().escapeHtml(clubLabel) +
      '</p></aside>'
    );
  }

  function introScreen(ctx) {
    var active = ctx.activeSummary;
    var resume = '';
    if (active) {
      resume =
        '<section class="mc-resume mc-resume--game" aria-labelledby="mc-resume-title">' +
        '<p class="mc-kicker">Partida en curso</p>' +
        '<h2 id="mc-resume-title">' +
        F().escapeHtml(active.playerName) +
        '</h2>' +
        '<p>' +
        active.age +
        ' años · ' +
        F().escapeHtml(active.clubName) +
        ' · OVR ' +
        active.rating +
        '</p>' +
        '<div class="mc-actions">' +
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="continue-career">Continuar</button>' +
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="new-career-confirm">Nueva carrera</button>' +
        '</div></section>';
    }

    return (
      '<section class="mc-screen mc-screen--cover">' +
      '<div class="mc-cover">' +
      '<div class="mc-cover__visual" aria-hidden="true">' +
      '<div class="mc-cover__pitch"></div>' +
      '<div class="mc-cover__silhouette"></div>' +
      '<div class="mc-cover__card-float">' +
      '<span>OVR</span><strong>99</strong><em>LEYENDA</em></div></div>' +
      '<div class="mc-cover__copy">' +
      '<p class="mc-kicker">Crack Total</p>' +
      '<h1 class="mc-cover__title">Mi Carrera</h1>' +
      '<p class="mc-cover__tag">CONVERTITE EN LEYENDA.</p>' +
      '<p class="mc-cover__lead">Creá tu futbolista. Tomá decisiones. Ganate un lugar en la historia.</p>' +
      '<div class="mc-actions">' +
      (active
        ? ''
        : '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="start-create">Crear mi futbolista</button>') +
      '<a class="ct-button ct-button--ghost" href="#como-funciona">Cómo funciona</a>' +
      '</div>' +
      '<ul class="mc-cover__pillars" id="como-funciona">' +
      '<li><span aria-hidden="true">🏆</span>Títulos</li>' +
      '<li><span aria-hidden="true">🥇</span>Premios</li>' +
      '<li><span aria-hidden="true">🌎</span>Selección</li>' +
      '<li><span aria-hidden="true">⭐</span>Legado</li>' +
      '</ul></div></div>' +
      resume +
      '</section>'
    );
  }

  function createScreen(ctx) {
    var draft = ctx.draft || {};
    var step = draft.createStep || 1;
    var data = ctx.data || {};
    var stepTitle = ['', 'Tu nombre', 'Tu país', 'Tu posición', 'Tu estilo'][step] || '';
    var body = '';

    if (step === 1) {
      body =
        '<label class="ct-label sr-only" for="mc-player-name">Nombre</label>' +
        '<input class="mc-create-name" id="mc-player-name" name="name" maxlength="24" autocomplete="nickname" required placeholder="TISAN" value="' +
        F().escapeHtml(draft.name || '') +
        '" />' +
        '<p class="ct-field-error" id="mc-name-error" hidden></p>';
    } else if (step === 2) {
      body =
        '<label class="ct-label" for="mc-country-search">Buscar país</label>' +
        '<input class="ct-input" id="mc-country-search" type="search" placeholder="Argentina, Brasil…" value="' +
        F().escapeHtml(draft.countryQuery || '') +
        '" autocomplete="off" />' +
        '<div class="mc-chip-row" role="group" aria-label="Continente">' +
        '<button type="button" class="mc-chip' +
        (!draft.continentId ? ' is-active' : '') +
        '" data-mc-action="filter-continent" data-id="">Todos</button>' +
        (data.continents || [])
          .map(function (c) {
            return (
              '<button type="button" class="mc-chip' +
              (draft.continentId === c.id ? ' is-active' : '') +
              '" data-mc-action="filter-continent" data-id="' +
              F().escapeHtml(c.id) +
              '">' +
              F().escapeHtml(c.shortName || c.name) +
              '</button>'
            );
          })
          .join('') +
        '</div>' +
        '<div class="mc-country-list mc-country-list--game" id="mc-country-list" role="listbox"></div>' +
        '<p class="ct-field-error" id="mc-country-error" hidden></p>';
    } else if (step === 3) {
      body =
        '<div class="mc-pos-grid">' +
        ['GK', 'DEF', 'MID', 'FWD']
          .map(function (pos) {
            return (
              '<button type="button" class="mc-pos-tile' +
              (draft.position === pos ? ' is-selected' : '') +
              '" data-mc-action="pick-position" data-id="' +
              pos +
              '" aria-pressed="' +
              (draft.position === pos) +
              '"><strong>' +
              pos +
              '</strong><span>' +
              F().escapeHtml(F().POSITION_LABELS[pos]) +
              '</span></button>'
            );
          })
          .join('') +
        '</div><p class="ct-field-error" id="mc-position-error" hidden></p>';
    } else {
      body =
        '<div class="mc-arch-grid">' +
        (data.archetypes || [])
          .map(function (arch) {
            return (
              '<button type="button" class="mc-arch-tile' +
              (draft.archetypeId === arch.id ? ' is-selected' : '') +
              '" data-mc-action="pick-archetype" data-id="' +
              F().escapeHtml(arch.id) +
              '" aria-pressed="' +
              (draft.archetypeId === arch.id) +
              '"><strong>' +
              F().escapeHtml(arch.name) +
              '</strong><span>' +
              F().escapeHtml(arch.description) +
              '</span></button>'
            );
          })
          .join('') +
        '</div><p class="ct-field-error" id="mc-archetype-error" hidden></p>';
    }

    return (
      '<section class="mc-screen mc-screen--create-flow">' +
      '<div class="mc-create-flow">' +
      '<div class="mc-create-preview">' +
      playerCardHtml(draft, data, null) +
      '</div>' +
      '<div class="mc-create-flow__main">' +
      '<p class="mc-kicker">Paso 0' +
      step +
      ' / 04</p>' +
      '<h1>' +
      F().escapeHtml(stepTitle) +
      '</h1>' +
      '<form id="mc-create-form" class="mc-create-step" novalidate>' +
      body +
      '<div class="mc-actions mc-actions--sticky">' +
      (step > 1
        ? '<button type="button" class="ct-button ct-button--ghost" data-mc-action="create-prev">Atrás</button>'
        : '<button type="button" class="ct-button ct-button--ghost" data-mc-action="go-intro">Volver</button>') +
      (step < 4
        ? '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="create-next">Siguiente</button>'
        : '<button type="submit" class="ct-button ct-button--primary ct-button--lg">Firmar y crear</button>') +
      '</div></form></div></div></section>'
    );
  }

  function countryResultsHtml(countries, selectedId) {
    if (!countries.length) return '<p class="mc-empty-inline">Sin resultados.</p>';
    return countries
      .map(function (c) {
        return (
          '<button type="button" class="mc-country-item' +
          (c.id === selectedId ? ' is-selected' : '') +
          '" role="option" aria-selected="' +
          (c.id === selectedId) +
          '" data-mc-action="pick-country" data-id="' +
          F().escapeHtml(c.id) +
          '">' +
          C().countryFlagHtml(c, 'sm') +
          '<span class="mc-country-item__text"><strong>' +
          F().escapeHtml(c.name) +
          '</strong></span></button>'
        );
      })
      .join('');
  }

  function presentScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var country = engine.world.countriesById[state.player.countryId];
    var club = engine.getClub(state.clubId);
    var comp = club ? engine.world.competitionsById[club.primaryCompetitionId] : null;
    var badge = C().clubBadgeHtml(club, 'xl');

    return (
      '<section class="mc-screen mc-screen--contract">' +
      '<p class="mc-kicker mc-reveal">Tu carrera comienza</p>' +
      '<h1 class="mc-display">Primer contrato</h1>' +
      '<article class="mc-contract-card mc-reveal">' +
      badge +
      '<h2>' +
      F().escapeHtml(club ? club.name : 'Club') +
      '</h2>' +
      '<p>' +
      F().escapeHtml(comp ? comp.shortName || comp.name : '') +
      ' · ' +
      (country ? C().countryFlagHtml(country, 'sm') + ' ' + F().escapeHtml(country.name) : '') +
      '</p>' +
      '<div class="mc-contract-stats">' +
      '<div><span>Edad</span><strong>' +
      state.age +
      '</strong></div>' +
      '<div><span>OVR</span><strong class="is-accent">' +
      state.rating +
      '</strong></div>' +
      '<div><span>Valor</span><strong>' +
      F().escapeHtml(F().formatMoney(state.marketValue)) +
      '</strong></div></div>' +
      '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="begin-career">Comenzar temporada</button>' +
      '</article></section>'
    );
  }

  function careerHomeScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine.getClub(state.clubId);
    var country = engine.world.countriesById[state.player.countryId];
    var last =
      state.seasonHistory && state.seasonHistory.length
        ? state.seasonHistory[state.seasonHistory.length - 1]
        : null;
    var decision = state.currentDecision;
    var needsMarket =
      (state.pendingOffers && state.pendingOffers.length) ||
      (decision && decision.type === 'transferencia');
    var preseason =
      decision &&
      decision.type !== 'transferencia' &&
      state.phase === 'decision'
        ? '<div class="mc-preseason ct-card">' +
          '<p class="mc-kicker">Antes de salir a la cancha</p>' +
          '<h2>' +
          F().escapeHtml(decision.title) +
          '</h2>' +
          '<p>' +
          F().escapeHtml(decision.prompt) +
          '</p>' +
          '<div class="mc-decision__options">' +
          (decision.options || [])
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
            .join('') +
          '</div></div>'
        : '';

    var cta = needsMarket
      ? '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="open-market">Ir al mercado</button>'
      : state.phase === 'simulate'
        ? '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="play-season">Jugar temporada</button>'
        : preseason
          ? ''
          : '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="open-market">Continuar</button>';

    return (
      '<section class="mc-screen mc-screen--career-home">' +
      '<header class="mc-hero-player">' +
      '<div class="mc-hero-player__badge">' +
      C().clubBadgeHtml(club, 'xl') +
      '</div>' +
      '<div class="mc-hero-player__id">' +
      '<div class="mc-hero-player__name-row">' +
      '<h1>' +
      F().escapeHtml(state.player.name) +
      '</h1>' +
      C().countryFlagHtml(country, 'lg') +
      '</div>' +
      '<p class="mc-hero-player__pos">' +
      F().escapeHtml(state.player.position) +
      '</p>' +
      '<p class="mc-hero-player__club">' +
      F().escapeHtml(club ? club.shortName || club.name : '—') +
      '</p></div>' +
      '<div class="mc-hero-player__stats">' +
      '<div class="mc-hero-player__ovr"><span>OVR</span><strong>' +
      state.rating +
      '</strong></div>' +
      '<div class="mc-hero-player__value"><span>Valor</span><strong>' +
      F().escapeHtml(F().formatMoney(state.marketValue)) +
      '</strong></div></div></header>' +
      '<p class="mc-season-chip">' +
      F().escapeHtml(F().seasonLabel(state.seasonIndex)) +
      ' · ' +
      state.age +
      ' años · Forma ' +
      state.form +
      '/10</p>' +
      (last
        ? '<div class="mc-last-strip" aria-label="Última temporada">' +
          '<div><span>PJ</span><strong>' +
          last.appearances +
          '</strong></div>' +
          '<div><span>Goles</span><strong>' +
          last.goals +
          '</strong></div>' +
          '<div><span>Asist.</span><strong>' +
          last.assists +
          '</strong></div>' +
          '<div><span>Títulos</span><strong>' +
          (last.titles || last.trophies || []).length +
          '</strong></div></div>'
        : '<p class="mc-muted">Tu primera temporada te espera.</p>') +
      '<div class="mc-dash-grid">' +
      C().statChip('Títulos', (state.titles || []).length) +
      C().statChip('Premios', (state.awards || []).length) +
      C().statChip('Selección', state.nationalCaps || 0) +
      C().statChip('Récords', (state.records || []).length) +
      '</div>' +
      C().timelineHtml(state, state.age) +
      preseason +
      '<div class="mc-actions mc-actions--sticky">' +
      cta +
      '</div></section>'
    );
  }

  function marketScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var offers = state.pendingOffers || [];
    var selectedOfferId = ctx.selectedOfferId || (offers[0] && offers[0].id) || '';
    var currentClub = engine.getClub(state.clubId);

    if (!offers.length) {
      return (
        '<section class="mc-screen mc-screen--market">' +
        '<div class="mc-market-hero">' +
        '<p class="mc-kicker">Mercado de fichajes</p>' +
        '<h1 class="mc-display">Silencio en el mercado</h1>' +
        '<p class="mc-market-lead">Esta temporada nadie llamó a tu puerta. Tu historia todavía no terminó.</p>' +
        '<article class="mc-stay-card">' +
        C().clubBadgeHtml(currentClub, 'xl') +
        '<h2>Continuar en ' +
        F().escapeHtml(currentClub ? currentClub.shortName || currentClub.name : 'tu club') +
        '</h2>' +
        '<p>Convertite en referente. Más continuidad, más protagonismo.</p>' +
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="market-stay">Continuar en mi club</button>' +
        '</article></div></section>'
      );
    }

    var cards = offers
      .map(function (offer) {
        var club = engine.getClub(offer.clubId);
        var comp = club ? engine.world.competitionsById[club.primaryCompetitionId] : null;
        var country = club ? engine.world.countriesById[club.countryId] : null;
        var stars = Math.max(1, Math.min(5, offer.level || club.level || 1));
        var selected = offer.id === selectedOfferId;
        return (
          '<article class="mc-offer-hero' +
          (selected ? ' is-selected' : '') +
          '">' +
          C().clubBadgeHtml(club, 'xl') +
          '<h2>' +
          F().escapeHtml(club ? club.name : 'Club') +
          '</h2>' +
          '<p class="mc-offer-hero__comp">' +
          F().escapeHtml(comp ? comp.shortName || comp.name : '') +
          (country ? ' · ' + F().escapeHtml(country.name) : '') +
          '</p>' +
          '<p class="mc-offer-stars" aria-label="Nivel">' +
          Array(stars + 1).join('⭐') +
          '</p>' +
          '<p class="mc-offer-hero__role">' +
          F().escapeHtml(F().ROLE_LABELS[offer.role] || offer.role) +
          '</p>' +
          '<div class="mc-offer-hero__money">' +
          '<div><span>Salario</span><strong>' +
          F().escapeHtml(F().formatMoney(offer.wage)) +
          '</strong></div>' +
          '<div><span>Prestigio</span><strong>' +
          (offer.prestige || (club && club.prestige) || '—') +
          '</strong></div></div>' +
          '<p class="mc-offer-project">Proyecto: <strong>' +
          Math.max(1, Math.min(10, Math.round((offer.prestige || (club && club.prestige) || 50) / 10))) +
          '/10</strong></p>' +
          '<p class="mc-muted">' +
          F().escapeHtml(offer.blurb || 'Proyecto deportivo.') +
          '</p>' +
          '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="market-compare" data-offer="' +
          F().escapeHtml(offer.id) +
          '">Ver oferta</button>' +
          '</article>'
        );
      })
      .join('');

    return (
      '<section class="mc-screen mc-screen--market">' +
      '<div class="mc-market-hero">' +
      '<p class="mc-kicker">Mercado de fichajes</p>' +
      '<h1 class="mc-display">Tu futuro está en juego</h1>' +
      '<p class="mc-market-lead">Después de la temporada, varios clubes preguntan por vos.</p></div>' +
      '<div class="mc-offer-rail">' +
      cards +
      '</div>' +
      '<div class="mc-actions">' +
      '<button type="button" class="ct-button ct-button--ghost" data-mc-action="market-stay">Quedarme en mi club</button>' +
      '</div></section>'
    );
  }

  function compareOfferBody(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var offer = ctx.offer;
    var current = engine.getClub(state.clubId);
    var next = engine.getClub(offer.clubId);
    var curComp = current ? engine.world.competitionsById[current.primaryCompetitionId] : null;
    var nextComp = next ? engine.world.competitionsById[next.primaryCompetitionId] : null;
    var minutesHint =
      offer.role === 'titular' ? 'Altos' : offer.role === 'promesa' ? 'Crecimiento' : 'Rotación';

    return (
      '<div class="mc-compare-pro">' +
      '<div class="mc-compare-pro__grid">' +
      '<div class="mc-compare-pro__col">' +
      '<p class="mc-kicker">Club actual</p>' +
      C().clubBadgeHtml(current, 'xl') +
      '<strong class="mc-compare-pro__name">' +
      F().escapeHtml(current ? current.shortName || current.name : '—') +
      '</strong>' +
      '<p class="mc-compare-pro__comp">' +
      F().escapeHtml(curComp ? curComp.shortName || curComp.name : '') +
      '</p>' +
      '<ul class="mc-compare-pro__list">' +
      '<li><span>Nivel</span><strong>' +
      F().escapeHtml(F().LEVEL_LABELS[current ? current.level : 1] || '') +
      '</strong></li>' +
      '<li><span>Prestigio</span><strong>' +
      (current ? current.prestige || '—' : '—') +
      '</strong></li></ul></div>' +
      '<div class="mc-compare-pro__vs" aria-hidden="true">VS</div>' +
      '<div class="mc-compare-pro__col is-next">' +
      '<p class="mc-kicker">Nuevo club</p>' +
      C().clubBadgeHtml(next, 'xl') +
      '<strong class="mc-compare-pro__name">' +
      F().escapeHtml(next ? next.shortName || next.name : '—') +
      '</strong>' +
      '<p class="mc-compare-pro__comp">' +
      F().escapeHtml(nextComp ? nextComp.shortName || nextComp.name : '') +
      '</p>' +
      '<ul class="mc-compare-pro__list">' +
      '<li><span>Nivel</span><strong>' +
      F().escapeHtml(F().LEVEL_LABELS[next ? next.level : 1] || '') +
      '</strong></li>' +
      '<li class="is-focus"><span>Minutos</span><strong>' +
      F().escapeHtml(minutesHint) +
      '</strong></li>' +
      '<li class="is-focus"><span>Salario</span><strong>' +
      F().escapeHtml(F().formatMoney(offer.wage)) +
      '</strong></li>' +
      '<li><span>Rol</span><strong>' +
      F().escapeHtml(F().ROLE_LABELS[offer.role] || offer.role) +
      '</strong></li></ul></div></div>' +
      '<div class="mc-stay-aside">' +
      '<p class="mc-kicker">Quedarte</p>' +
      '<p>Convertite en referente: más continuidad y liderazgo. Menos escaparate internacional.</p>' +
      '</div></div>'
    );
  }

  function transferCinematicHtml(ctx) {
    var club = ctx.club;
    var state = ctx.state;
    return (
      '<section class="mc-screen mc-screen--cinematic">' +
      '<p class="mc-kicker">Nuevo capítulo</p>' +
      C().clubBadgeHtml(club, 'xl') +
      '<h1 class="mc-display">' +
      F().escapeHtml(club ? club.name : 'Nuevo club') +
      '</h1>' +
      '<p class="mc-cinematic-line">Fichaje confirmado</p>' +
      '<p><strong>' +
      F().escapeHtml(state.player.name) +
      '</strong> · ' +
      F().escapeHtml(F().seasonLabel(state.seasonIndex)) +
      '</p>' +
      '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="after-transfer">Continuar</button>' +
      '</section>'
    );
  }

  function seasonRecapScreen(ctx) {
    var season = ctx.season;
    var state = ctx.state;
    var club = ctx.engine.getClub(season.clubId || state.clubId);
    return (
      '<section class="mc-screen mc-screen--recap">' +
      '<p class="mc-kicker">Temporada ' +
      F().escapeHtml(season.seasonLabel || F().seasonLabel(season.seasonIndex)) +
      '</p>' +
      '<h1 class="mc-display">Resultado</h1>' +
      '<p class="mc-recap-club">' +
      C().clubBadgeHtml(club, 'md') +
      ' ' +
      F().escapeHtml(club ? club.shortName || club.name : '') +
      '</p>' +
      '<p class="mc-stars" aria-hidden="true">' +
      F().starsFromRating(season.averageRating) +
      '</p>' +
      '<p class="mc-feedback-score"><strong>' +
      season.averageRating +
      '</strong> · Grado ' +
      F().escapeHtml(season.performanceGrade) +
      '</p>' +
      '<div class="mc-last-strip">' +
      '<div><span>PJ</span><strong>' +
      season.appearances +
      '</strong></div>' +
      '<div><span>Goles</span><strong>' +
      season.goals +
      '</strong></div>' +
      '<div><span>Asist.</span><strong>' +
      season.assists +
      '</strong></div>' +
      '<div><span>Títulos</span><strong>' +
      (season.titles || season.trophies || []).length +
      '</strong></div></div>' +
      '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="open-market">Ir al mercado</button>' +
      '</section>'
    );
  }

  function seasonScreen(ctx) {
    return careerHomeScreen(ctx);
  }

  function eventModalBody(event) {
    var lines = F().effectImpactLines(event.effects);
    return (
      '<p class="mc-event-kicker">Fuera de la cancha</p>' +
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
    return (
      '<p class="mc-kicker">' +
      F().escapeHtml(season.seasonLabel || F().seasonLabel(season.seasonIndex)) +
      '</p>' +
      '<p class="mc-stars" aria-hidden="true">' +
      F().starsFromRating(season.averageRating) +
      '</p>' +
      '<div class="mc-stat-grid">' +
      C().statChip('PJ', season.appearances) +
      C().statChip('Goles', season.goals) +
      C().statChip('Asist.', season.assists) +
      C().statChip('Títulos', (season.titles || season.trophies || []).length) +
      '</div>'
    );
  }

  function titleCelebrationBody(title, club, nt) {
    var who = club ? club.shortName || club.name : nt ? nt.name : '';
    return (
      '<div class="mc-celebrate mc-celebrate--title">' +
      '<p class="mc-celebrate__icon" aria-hidden="true">🏆</p>' +
      '<p class="mc-kicker">Campeones</p>' +
      '<h3 class="mc-celebrate__name">' +
      F().escapeHtml(title.name) +
      '</h3>' +
      (club ? C().clubBadgeHtml(club, 'lg') : '') +
      (who ? '<p class="mc-celebrate__club">' + F().escapeHtml(who) + '</p>' : '') +
      '<p class="mc-celebrate__season">' +
      F().escapeHtml(title.seasonLabel || '') +
      '</p></div>'
    );
  }

  function awardCelebrationBody(award, playerName) {
    var isBallon = award.awardId === 'award_ballon_dor';
    return (
      '<div class="mc-celebrate mc-celebrate--award' +
      (isBallon ? ' mc-celebrate--ballon' : '') +
      '">' +
      '<p class="mc-celebrate__icon" aria-hidden="true">🥇</p>' +
      '<p class="mc-kicker">' +
      (isBallon ? 'El mejor del mundo' : 'Premio individual') +
      '</p>' +
      '<h3 class="mc-celebrate__name">' +
      F().escapeHtml(award.name) +
      '</h3>' +
      '<p class="mc-celebrate__club">' +
      F().escapeHtml(playerName || '') +
      '</p>' +
      '<p class="mc-celebrate__season">' +
      F().escapeHtml(award.seasonLabel || '') +
      '</p>' +
      '<p class="mc-stars" aria-hidden="true">★★★★★</p></div>'
    );
  }

  function momentCelebrationBody(moment) {
    return (
      '<div class="mc-celebrate mc-celebrate--moment">' +
      '<p class="mc-celebrate__icon" aria-hidden="true">⭐</p>' +
      '<p class="mc-kicker">Momento histórico</p>' +
      '<h3 class="mc-celebrate__name">' +
      F().escapeHtml(moment.label || '') +
      '</h3>' +
      '<p class="mc-celebrate__season">' +
      F().escapeHtml(moment.seasonLabel || '') +
      '</p></div>'
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
    var agg = NS.Scoring.aggregateHistory(state);

    return (
      '<section class="mc-screen mc-screen--retire">' +
      '<header class="mc-screen__header mc-reveal">' +
      '<p class="mc-kicker">Fin de ciclo</p>' +
      '<h1 class="mc-display">Tu historia terminó</h1>' +
      '<p class="mc-cinematic">' +
      F().escapeHtml(state.retirementLine || 'Colgaste los botines.') +
      '</p></header>' +
      '<div class="mc-last-strip mc-reveal">' +
      '<div><span>PJ</span><strong>' +
      agg.games +
      '</strong></div>' +
      '<div><span>Goles</span><strong>' +
      agg.goals +
      '</strong></div>' +
      '<div><span>Títulos</span><strong>' +
      agg.titles +
      '</strong></div>' +
      '<div><span>Premios</span><strong>' +
      (state.awards || []).length +
      '</strong></div></div>' +
      '<div class="mc-retire-stack">' +
      card.html +
      UI.Legacy.legacyHtml(legacy) +
      UI.Legacy.achievementsHtml(achievements) +
      UI.Rewards.rewardsHtml(reward) +
      '<section class="ct-card mc-final-actions mc-reveal">' +
      '<div class="mc-actions mc-actions--final">' +
      '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="share-career"' +
      (shareAvailable ? '' : ' hidden') +
      '>Compartir mi carrera</button>' +
      '<button type="button" class="ct-button ct-button--secondary ct-button--lg" data-mc-action="copy-career">Copiar resultado</button>' +
      '<a class="ct-button ct-button--ghost" href="#mc-legacy-title">Ver mi legado</a>' +
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
    careerHome: careerHomeScreen,
    market: marketScreen,
    seasonRecap: seasonRecapScreen,
    transferCinematic: transferCinematicHtml,
    compareOfferBody: compareOfferBody,
    retire: retireScreen,
    countryResultsHtml: countryResultsHtml,
    eventModalBody: eventModalBody,
    seasonFeedbackBody: seasonFeedbackBody,
    titleCelebrationBody: titleCelebrationBody,
    awardCelebrationBody: awardCelebrationBody,
    momentCelebrationBody: momentCelebrationBody,
    previewOvr: previewOvr,
    playerCardHtml: playerCardHtml
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
