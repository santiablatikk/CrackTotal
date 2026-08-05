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

  function competitionMarkHtml(comp, size) {
    size = size || 'sm';
    if (!comp) return '';
    var view = NS.getCompetitionLogo ? NS.getCompetitionLogo(comp.id, comp) : null;
    var src = assetSrc(view);
    var label = F().escapeHtml(comp.shortName || comp.name || '');
    if (!src) {
      return '<span class="mc-comp-mark mc-comp-mark--' + size + '">' + label + '</span>';
    }
    return (
      '<span class="mc-comp-mark mc-comp-mark--' +
      size +
      '"><img src="' +
      F().escapeHtml(src) +
      '" alt="" width="28" height="28" loading="lazy" decoding="async" />' +
      '<span>' +
      label +
      '</span></span>'
    );
  }

  function awardMarkHtml(award) {
    if (!award) return '';
    var id = award.awardId || award.id;
    var view = NS.getAwardIcon ? NS.getAwardIcon(id, award) : null;
    var src = assetSrc(view);
    if (!src) return '<span class="mc-award-mark" aria-hidden="true">🥇</span>';
    return (
      '<img class="mc-award-mark" src="' +
      F().escapeHtml(src) +
      '" alt="" width="72" height="72" loading="lazy" decoding="async" />'
    );
  }

  function projectScore(offer, club) {
    return Math.max(1, Math.min(10, Math.round((offer.prestige || (club && club.prestige) || 50) / 10)));
  }

  function levelStars(level) {
    var n = Math.max(1, Math.min(5, Number(level) || 1));
    return Array(n + 1).join('★');
  }

  function tradeoffChips(current, next, offer) {
    var chips = [];
    var curP = (current && current.prestige) || 0;
    var nextP = (next && next.prestige) || 0;
    var curL = (current && current.level) || 1;
    var nextL = (next && next.level) || 1;
    if (nextP > curP + 4) chips.push({ tone: 'up', text: '+ Prestigio' });
    else if (nextP < curP - 4) chips.push({ tone: 'down', text: '− Prestigio' });
    if (nextL > curL) chips.push({ tone: 'up', text: '+ Escaparate' });
    else if (nextL < curL) chips.push({ tone: 'down', text: '− Escaparate' });
    if (offer.role === 'titular') chips.push({ tone: 'up', text: '+ Minutos' });
    else if (offer.role === 'rotacion') chips.push({ tone: 'down', text: '− Minutos' });
    else if (offer.role === 'promesa') chips.push({ tone: 'up', text: '+ Protagonismo futuro' });
    if (nextL >= 4 && offer.role !== 'titular') chips.push({ tone: 'down', text: '− Estabilidad' });
    if (nextL <= curL && offer.role === 'titular') chips.push({ tone: 'up', text: '+ Liderazgo' });
    if (!chips.length) chips.push({ tone: 'up', text: 'Cambio de escenario' });
    return chips
      .slice(0, 4)
      .map(function (c) {
        return (
          '<span class="mc-trade-chip mc-trade-chip--' +
          c.tone +
          '">' +
          F().escapeHtml(c.text) +
          '</span>'
        );
      })
      .join('');
  }

  function seasonMomentLine(season) {
    if (!season) return 'Otra página de tu historia.';
    if (season.moments && season.moments.length) {
      return season.moments[0].label || season.moments[0].id || 'Momento de la temporada.';
    }
    if (season.titles && season.titles.length) {
      return 'Campeón: ' + (season.titles[0].shortName || season.titles[0].name);
    }
    if (season.awards && season.awards.length) {
      return season.awards[0].shortName || season.awards[0].name;
    }
    var g = season.performanceGrade;
    if (g === 'S') return 'Temporada de crack.';
    if (g === 'A') return 'Rendimiento de élite.';
    if (g === 'B') return 'Temporada sólida.';
    if (g === 'C') return 'Temporada irregular.';
    return 'Temporada para aprender.';
  }

  function momentRailHtml(state) {
    var moments = (state.moments || []).slice(-5);
    if (!moments.length) return '';
    return (
      '<section class="mc-moment-rail" aria-label="Momentos históricos">' +
      '<p class="mc-kicker">Tu historia</p>' +
      '<div class="mc-moment-rail__track">' +
      moments
        .map(function (m) {
          return (
            '<article class="mc-moment-card">' +
            '<span aria-hidden="true">⭐</span>' +
            '<div><strong>' +
            F().escapeHtml(m.seasonLabel || '') +
            '</strong><p>' +
            F().escapeHtml(m.label || '') +
            '</p></div></article>'
          );
        })
        .join('') +
      '</div></section>'
    );
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

    var ovrNum = Number(ovr);
    var ovrBand =
      !isNaN(ovrNum) && ovrNum >= 85 ? 'elite' : !isNaN(ovrNum) && ovrNum >= 75 ? 'high' : 'base';

    return (
      '<aside class="mc-player-card mc-player-card--premium mc-player-card--' +
      ovrBand +
      '" aria-live="polite" aria-label="Carta del futbolista">' +
      '<div class="mc-player-card__glow" aria-hidden="true"></div>' +
      '<div class="mc-player-card__stripe" aria-hidden="true"></div>' +
      '<div class="mc-player-card__top">' +
      (country ? C().countryFlagHtml(country, 'lg') : '<span class="mc-player-card__flag-ph" aria-hidden="true"></span>') +
      '<span class="mc-player-card__age">' +
      age +
      ' años</span></div>' +
      (src
        ? '<img class="mc-player-card__avatar" src="' +
          F().escapeHtml(src) +
          '" alt="" width="96" height="96" />'
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
      '<div class="mc-step-rail" aria-hidden="true">' +
      [1, 2, 3, 4]
        .map(function (n) {
          return (
            '<span class="' +
            (n < step ? 'is-done' : n === step ? 'is-current' : '') +
            '"></span>'
          );
        })
        .join('') +
      '</div>' +
      '<p class="mc-kicker">Paso 0' +
      step +
      ' / 04</p>' +
      '<h1 class="mc-create-flow__title">' +
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
          C().countryFlagHtml(c, 'md') +
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
    var badge = C().clubBadgeHtml(club, 'xxl');

    return (
      '<section class="mc-screen mc-screen--contract">' +
      '<p class="mc-kicker mc-reveal">Tu carrera comienza</p>' +
      '<h1 class="mc-display">Primer contrato</h1>' +
      '<article class="mc-contract-card mc-reveal">' +
      '<div class="mc-contract-card__crest">' +
      badge +
      '</div>' +
      '<h2>' +
      F().escapeHtml(club ? club.name : 'Club') +
      '</h2>' +
      '<p class="mc-contract-card__meta">' +
      competitionMarkHtml(comp, 'md') +
      (country
        ? '<span>' + C().countryFlagHtml(country, 'sm') + ' ' + F().escapeHtml(country.name) + '</span>'
        : '') +
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
    var isLife =
      decision &&
      (decision.type === 'familia' ||
        decision.type === 'rumor' ||
        decision.type === 'actitud' ||
        decision.type === 'prensa' ||
        decision.type === 'patrocinio');

    var nowBlock = '';
    if (needsMarket) {
      nowBlock =
        '<section class="mc-now mc-now--market" aria-label="Momento actual">' +
        '<p class="mc-kicker">Momento actual</p>' +
        '<h2>El mercado te está mirando</h2>' +
        '<p>Tu próximo club puede cambiar toda la carrera.</p></section>';
    } else if (state.phase === 'simulate') {
      nowBlock =
        '<section class="mc-now mc-now--play" aria-label="Momento actual">' +
        '<p class="mc-kicker">Momento actual</p>' +
        '<h2>Listo para la temporada</h2>' +
        '<p>Salí a la cancha y escribí el próximo capítulo.</p></section>';
    } else if (decision && decision.type !== 'transferencia') {
      nowBlock =
        '<section class="mc-now' +
        (isLife ? ' mc-now--life' : '') +
        '" aria-label="Momento actual">' +
        '<p class="mc-kicker">' +
        (isLife ? 'Fuera de la cancha' : 'Antes del pitazo') +
        '</p>' +
        '<h2>' +
        F().escapeHtml(decision.title) +
        '</h2>' +
        '<p>' +
        F().escapeHtml(decision.prompt) +
        '</p></section>';
    }

    var preseason =
      decision &&
      decision.type !== 'transferencia' &&
      state.phase === 'decision'
        ? '<div class="mc-preseason' +
          (isLife ? ' mc-preseason--life' : '') +
          '" role="group" aria-label="Decisión">' +
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
      ? '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="open-market">Ir al mercado de fichajes</button>'
      : state.phase === 'simulate'
        ? '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="play-season">Jugar temporada</button>'
        : preseason
          ? ''
          : '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="open-market">Continuar</button>';

    return (
      '<section class="mc-screen mc-screen--career-home">' +
      '<header class="mc-hero-player">' +
      '<div class="mc-hero-player__badge">' +
      C().clubBadgeHtml(club, 'xxl') +
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
      ' años</p>' +
      nowBlock +
      (last
        ? '<section class="mc-home-form" aria-label="Último rendimiento">' +
          '<p class="mc-kicker">Última temporada</p>' +
          '<div class="mc-last-strip">' +
          '<div><span>PJ</span><strong>' +
          last.appearances +
          '</strong></div>' +
          '<div><span>Goles</span><strong>' +
          last.goals +
          '</strong></div>' +
          '<div><span>Asist.</span><strong>' +
          last.assists +
          '</strong></div>' +
          '<div><span>Nota</span><strong>' +
          last.averageRating +
          '</strong></div></div></section>'
        : '<p class="mc-muted mc-home-empty">Tu primera temporada te espera.</p>') +
      preseason +
      '<section class="mc-home-legacy" aria-label="Logros">' +
      '<p class="mc-kicker">Legado</p>' +
      '<div class="mc-dash-grid mc-dash-grid--compact">' +
      C().statChip('Títulos', (state.titles || []).length) +
      C().statChip('Premios', (state.awards || []).length) +
      C().statChip('Selección', state.nationalCaps || 0) +
      '</div></section>' +
      momentRailHtml(state) +
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
        '<article class="mc-stay-card mc-stay-card--hero">' +
        C().clubBadgeHtml(currentClub, 'xxl') +
        '<h2>' +
        F().escapeHtml(currentClub ? currentClub.shortName || currentClub.name : 'Tu club') +
        '</h2>' +
        '<p class="mc-stay-card__pitch">Convertite en referente. Continuidad, protagonismo, liderazgo.</p>' +
        '<ul class="mc-stay-points" aria-label="Consecuencias">' +
        '<li class="is-up">+ Continuidad</li>' +
        '<li class="is-up">+ Protagonismo</li>' +
        '<li class="is-down">− Menos escaparate</li>' +
        '</ul>' +
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="market-stay">Continuar en mi club</button>' +
        '</article></div></section>'
      );
    }

    var cards = offers
      .map(function (offer, idx) {
        var club = engine.getClub(offer.clubId);
        var comp = club ? engine.world.competitionsById[club.primaryCompetitionId] : null;
        var country = club ? engine.world.countriesById[club.countryId] : null;
        var tier = String(offer.tier || 'C').toLowerCase();
        var selected = offer.id === selectedOfferId;
        var roleLabel = F().ROLE_LABELS[offer.role] || offer.role;
        return (
          '<article class="mc-offer-hero mc-offer-hero--tier-' +
          F().escapeHtml(tier) +
          (selected ? ' is-selected' : '') +
          (idx === 0 ? ' is-featured' : '') +
          '">' +
          '<div class="mc-offer-hero__crest">' +
          C().clubBadgeHtml(club, 'xxl') +
          '</div>' +
          '<h2>' +
          F().escapeHtml(club ? club.name : 'Club') +
          '</h2>' +
          '<div class="mc-offer-hero__league">' +
          competitionMarkHtml(comp, 'md') +
          (country
            ? '<span class="mc-offer-hero__nation">' +
              C().countryFlagHtml(country, 'sm') +
              ' ' +
              F().escapeHtml(country.name) +
              '</span>'
            : '') +
          '</div>' +
          '<p class="mc-offer-stars" aria-label="Nivel ' +
          (offer.level || (club && club.level) || 1) +
          '">' +
          levelStars(offer.level || (club && club.level) || 1) +
          '</p>' +
          '<span class="mc-offer-hero__role-badge">' +
          F().escapeHtml(roleLabel) +
          '</span>' +
          '<div class="mc-offer-hero__project" aria-label="Proyecto">' +
          '<span>Proyecto</span><strong>' +
          projectScore(offer, club) +
          '/10</strong></div>' +
          '<p class="mc-offer-hero__wage">' +
          F().escapeHtml(F().formatMoney(offer.wage)) +
          '<span>/año</span></p>' +
          '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="market-compare" data-offer="' +
          F().escapeHtml(offer.id) +
          '" aria-label="Ver oferta de ' +
          F().escapeHtml(club ? club.shortName || club.name : 'club') +
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
      '<div class="mc-offer-rail" role="list">' +
      cards +
      '</div>' +
      '<div class="mc-actions mc-actions--market-stay">' +
      '<button type="button" class="ct-button ct-button--secondary ct-button--lg" data-mc-action="market-stay">Quedarme en mi club</button>' +
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
      '<p class="mc-compare-pro__question">¿Qué gano y qué arriesgo si me voy?</p>' +
      '<div class="mc-trade-row" aria-label="Balance">' +
      tradeoffChips(current, next, offer) +
      '</div>' +
      '<div class="mc-compare-pro__grid">' +
      '<div class="mc-compare-pro__col">' +
      '<p class="mc-kicker">Club actual</p>' +
      C().clubBadgeHtml(current, 'xxl') +
      '<strong class="mc-compare-pro__name">' +
      F().escapeHtml(current ? current.shortName || current.name : '—') +
      '</strong>' +
      '<div class="mc-compare-pro__comp">' +
      competitionMarkHtml(curComp, 'sm') +
      '</div>' +
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
      C().clubBadgeHtml(next, 'xxl') +
      '<strong class="mc-compare-pro__name">' +
      F().escapeHtml(next ? next.shortName || next.name : '—') +
      '</strong>' +
      '<div class="mc-compare-pro__comp">' +
      competitionMarkHtml(nextComp, 'sm') +
      '</div>' +
      '<ul class="mc-compare-pro__list">' +
      '<li class="is-focus"><span>Rol</span><strong>' +
      F().escapeHtml(F().ROLE_LABELS[offer.role] || offer.role) +
      '</strong></li>' +
      '<li class="is-focus"><span>Minutos</span><strong>' +
      F().escapeHtml(minutesHint) +
      '</strong></li>' +
      '<li><span>Salario</span><strong>' +
      F().escapeHtml(F().formatMoney(offer.wage)) +
      '</strong></li>' +
      '<li><span>Proyecto</span><strong>' +
      projectScore(offer, next) +
      '/10</strong></li></ul></div></div>' +
      '<div class="mc-stay-aside">' +
      '<p class="mc-kicker">Si te quedás</p>' +
      '<p>Más continuidad y liderazgo. Menos escaparate inmediato.</p>' +
      '</div></div>'
    );
  }

  function transferCinematicHtml(ctx) {
    var club = ctx.club;
    var state = ctx.state;
    var engine = ctx.engine || NS._lastEngine;
    var comp =
      club && engine && engine.world
        ? engine.world.competitionsById[club.primaryCompetitionId]
        : null;
    return (
      '<section class="mc-screen mc-screen--cinematic mc-reveal">' +
      '<p class="mc-kicker">Nuevo capítulo</p>' +
      '<div class="mc-cinematic-crest">' +
      C().clubBadgeHtml(club, 'xxl') +
      '</div>' +
      '<h1 class="mc-display">' +
      F().escapeHtml(club ? club.name : 'Nuevo club') +
      '</h1>' +
      (comp ? '<p class="mc-cinematic-comp">' + competitionMarkHtml(comp, 'md') + '</p>' : '') +
      '<p class="mc-cinematic-line">Fichaje confirmado</p>' +
      '<p class="mc-cinematic-meta"><strong>' +
      F().escapeHtml(state.player.name) +
      '</strong> · ' +
      F().escapeHtml(F().seasonLabel(state.seasonIndex)) +
      '</p>' +
      '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="after-transfer">Continuar carrera</button>' +
      '</section>'
    );
  }

  function seasonRecapScreen(ctx) {
    var season = ctx.season;
    var state = ctx.state;
    var club = ctx.engine.getClub(season.clubId || state.clubId);
    var ovr = season.ratingAfter != null ? season.ratingAfter : state.rating;
    var moment = seasonMomentLine(season);
    return (
      '<section class="mc-screen mc-screen--recap">' +
      '<p class="mc-kicker">Cierre de temporada</p>' +
      '<h1 class="mc-display">' +
      F().escapeHtml(season.seasonLabel || F().seasonLabel(season.seasonIndex)) +
      '</h1>' +
      '<div class="mc-recap-club">' +
      C().clubBadgeHtml(club, 'xl') +
      '<div>' +
      '<strong>' +
      F().escapeHtml(club ? club.shortName || club.name : '') +
      '</strong>' +
      '<span class="mc-recap-ovr">OVR ' +
      ovr +
      '</span></div></div>' +
      '<p class="mc-stars" aria-hidden="true">' +
      F().starsFromRating(season.averageRating) +
      '</p>' +
      '<p class="mc-feedback-score">Nota <strong>' +
      season.averageRating +
      '</strong> · Grado ' +
      F().escapeHtml(season.performanceGrade) +
      '</p>' +
      '<div class="mc-last-strip mc-last-strip--recap">' +
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
      '<aside class="mc-recap-moment">' +
      '<p class="mc-kicker">Momento de la temporada</p>' +
      '<p>' +
      F().escapeHtml(moment) +
      '</p></aside>' +
      '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="open-market">Ir al mercado de fichajes</button>' +
      '</section>'
    );
  }

  function seasonScreen(ctx) {
    return careerHomeScreen(ctx);
  }

  function titleCelebrationBody(title, club, nt) {
    var who = club ? club.shortName || club.name : nt ? nt.name : '';
    var importance = title.importance || 50;
    var epic = importance >= 70;
    var comp =
      title.competitionId && NS.getCompetitionLogo
        ? NS.getCompetitionLogo(title.competitionId, { id: title.competitionId, shortName: title.shortName || title.name })
        : null;
    var compSrc = assetSrc(comp);
    return (
      '<div class="mc-celebrate mc-celebrate--title' +
      (epic ? ' mc-celebrate--epic' : '') +
      '">' +
      (compSrc
        ? '<img class="mc-celebrate__trophy" src="' +
          F().escapeHtml(compSrc) +
          '" alt="" width="88" height="88" />'
        : '<p class="mc-celebrate__icon" aria-hidden="true">🏆</p>') +
      '<p class="mc-kicker">Campeones</p>' +
      '<h3 class="mc-celebrate__name">' +
      F().escapeHtml(title.name) +
      '</h3>' +
      (club ? C().clubBadgeHtml(club, 'xl') : '') +
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
      awardMarkHtml(award) +
      '<p class="mc-kicker">' +
      (isBallon ? 'Balón de Oro' : 'Premio individual') +
      '</p>' +
      (isBallon
        ? '<p class="mc-celebrate__world">El mejor del mundo</p>'
        : '') +
      '<h3 class="mc-celebrate__name">' +
      F().escapeHtml(isBallon ? playerName || award.name : award.name) +
      '</h3>' +
      (!isBallon
        ? '<p class="mc-celebrate__club">' + F().escapeHtml(playerName || '') + '</p>'
        : '') +
      '<p class="mc-celebrate__season">' +
      F().escapeHtml(award.seasonLabel || '') +
      '</p></div>'
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

  function eventModalBody(event) {
    var lines = F().effectImpactLines(event.effects);
    return (
      '<div class="mc-event-panel">' +
      '<p class="mc-event-kicker">Fuera de la cancha</p>' +
      '<p class="mc-event-body">' +
      F().escapeHtml(event.body || event.title || '') +
      '</p>' +
      (lines.length
        ? '<ul class="mc-impact-list">' +
          lines
            .map(function (l) {
              return '<li>' + F().escapeHtml(l) + '</li>';
            })
            .join('') +
          '</ul>'
        : '') +
      '</div>'
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
