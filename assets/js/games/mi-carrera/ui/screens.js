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
    if (!src) return '<span class="mc-comp-mark">' + label + '</span>';
    return (
      '<span class="mc-comp-mark"><img src="' +
      F().escapeHtml(src) +
      '" alt="" width="28" height="28" loading="lazy" /><span>' +
      label +
      '</span></span>'
    );
  }

  function awardMarkHtml(award) {
    if (!award) return '<span class="mc-award-mark" aria-hidden="true">★</span>';
    var id = award.awardId || award.id;
    var view = NS.getAwardIcon ? NS.getAwardIcon(id, award) : null;
    var src = assetSrc(view);
    if (!src) return '<span class="mc-award-mark" aria-hidden="true">★</span>';
    return (
      '<img class="mc-award-mark" src="' +
      F().escapeHtml(src) +
      '" alt="" width="96" height="96" loading="lazy" />'
    );
  }

  function tradeoffPhrase(current, next, offer) {
    var curL = (current && current.level) || 1;
    var nextL = (next && next.level) || 1;
    if (offer && offer.kind === 'loan') return 'Más minutos. No es definitivo.';
    if (nextL >= curL + 2) return 'Salto enorme. Riesgo alto.';
    if (nextL > curL) return 'Más escaparate. Hay que pelear el puesto.';
    if (offer && offer.role === 'titular') return 'Te quieren como titular.';
    if (nextL < curL) return 'Menos escaparate. Más protagonismo.';
    return 'Nuevo escenario para tu carrera.';
  }

  function tradeoffChips(current, next, offer) {
    var chips = [];
    var curL = (current && current.level) || 1;
    var nextL = (next && next.level) || 1;
    if (nextL > curL) chips.push({ tone: 'up', text: 'Nivel' });
    else if (nextL < curL) chips.push({ tone: 'down', text: 'Nivel' });
    if (offer.role === 'titular') chips.push({ tone: 'up', text: 'Minutos' });
    else if (offer.role === 'rotacion') chips.push({ tone: 'down', text: 'Minutos' });
    if (offer.kind === 'loan') {
      chips = [
        { tone: 'up', text: 'Minutos' },
        { tone: 'down', text: 'Permanencia' }
      ];
    }
    if (nextL >= curL + 2) chips.push({ tone: 'down', text: 'Riesgo' });
    if (!chips.length) chips.push({ tone: 'up', text: 'Cambio' });
    return chips
      .slice(0, 3)
      .map(function (c) {
        return (
          '<em class="mc-choice__chip mc-choice__chip--' +
          c.tone +
          '">' +
          F().escapeHtml(c.text) +
          '</em>'
        );
      })
      .join('');
  }

  function tradeoffMetricsHtml(current, next, offer) {
    return '<div class="mc-trade-row">' + tradeoffChips(current, next, offer) + '</div>';
  }

  function seasonMomentLine(season) {
    if (!season) return 'Otra página de tu historia.';
    if (season.consequence) return season.consequence;
    if (season.titles && season.titles.length) {
      return 'Campeón: ' + (season.titles[0].shortName || season.titles[0].name);
    }
    var g = season.performanceGrade;
    if (g === 'S') return 'Temporada de crack.';
    if (g === 'A') return 'Gran temporada.';
    if (g === 'D') return 'El año dolió.';
    return 'Temporada jugada.';
  }

  function stage(opts) {
    opts = opts || {};
    return (
      '<section class="mc-stage mc-stage--' +
      F().escapeHtml(opts.id || 'beat') +
      (opts.tone ? ' mc-stage--tone-' + F().escapeHtml(opts.tone) : '') +
      (opts.extraClass ? ' ' + opts.extraClass : '') +
      '" data-mc-scene="' +
      F().escapeHtml(opts.id || 'beat') +
      '">' +
      '<div class="mc-stage__body">' +
      (opts.kicker ? '<p class="mc-stage__kicker">' + opts.kicker + '</p>' : '') +
      (opts.title ? '<h1 class="mc-stage__title">' + opts.title + '</h1>' : '') +
      (opts.lead ? '<p class="mc-stage__lead">' + opts.lead + '</p>' : '') +
      (opts.body || '') +
      '</div>' +
      (opts.actions ? '<div class="mc-stage__actions">' + opts.actions + '</div>' : '') +
      '</section>'
    );
  }

  // Compat alias used by older helpers/tests
  function scene(opts) {
    opts = opts || {};
    return stage({
      id: opts.id,
      tone: opts.tone,
      kicker: opts.kicker,
      title: opts.title,
      lead: opts.lead,
      body: opts.body,
      actions: opts.actions,
      extraClass: 'mc-scene mc-scene--' + (opts.id || 'beat')
    });
  }

  function statsRow(html) {
    return '<div class="mc-recap__stats mc-scene-stats">' + html + '</div>';
  }

  function introScreen(ctx) {
    var active = ctx && ctx.activeSummary;
    var actions = active
      ? '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="continue-career">Seguir carrera</button>' +
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="new-career-confirm">Nueva carrera</button>'
      : '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="start-create">Empezar carrera</button>';
    return (
      '<section class="mc-stage mc-stage--intro mc-screen--cover" data-mc-scene="intro">' +
      '<div class="mc-stage__body">' +
      '<p class="mc-stage__kicker">Crack Total</p>' +
      '<h1 class="mc-stage__title">TU CARRERA</h1>' +
      '<p class="mc-stage__lead">CONVERTITE EN LEYENDA.</p>' +
      '<p class="mc-stage__copy">Decidís. Jugás. Dejás legado.</p>' +
      (active
        ? '<p class="mc-stage__meta">' +
          F().escapeHtml(active.playerName) +
          ' · ' +
          active.age +
          ' años · ' +
          F().escapeHtml(active.clubName) +
          '</p>'
        : '') +
      '<p class="mc-stage__meta" id="como-funciona">Modo · Club · Decisión · Temporada · Carta</p>' +
      '</div>' +
      '<div class="mc-stage__actions">' +
      actions +
      '</div></section>'
    );
  }

  function modeSelectScreen() {
    var modes = (NS.Beats && NS.Beats.PACING) || {
      intense: { id: 'intense', label: 'Intensa', blurb: 'Una decisión por temporada.' },
      normal: { id: 'normal', label: 'Normal', blurb: 'Una decisión cada 2 temporadas.' },
      express: { id: 'express', label: 'Exprés', blurb: 'Una decisión cada 3 temporadas.' }
    };
    var order = ['intense', 'normal', 'express'];
    var cards = order
      .map(function (id) {
        var m = modes[id];
        if (!m) return '';
        var tag = id === 'intense' ? '1 temp' : id === 'normal' ? '2 temp' : '3 temp';
        return (
          '<button type="button" class="mc-mode" data-mc-action="pick-mode" data-mode="' +
          F().escapeHtml(m.id) +
          '"><span class="mc-mode__tag">' +
          tag +
          '</span><strong>' +
          F().escapeHtml(m.label) +
          '</strong><span>' +
          F().escapeHtml(m.blurb) +
          '</span></button>'
        );
      })
      .join('');
    return stage({
      id: 'mode',
      tone: 'cover',
      kicker: 'Mi Carrera',
      title: 'Elegí el ritmo',
      lead: 'Misma fantasía. Distinta duración.',
      body: '<div class="mc-mode-grid">' + cards + '</div>',
      actions:
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="go-intro">Volver</button>'
    });
  }

  function careerBeatScreen(ctx) {
    var state = ctx.state;
    var beat = ctx.beat || state.currentBeat;
    var engine = ctx.engine;
    var club = engine.getClub(state.clubId);
    var options = (beat && beat.options) || [];
    var blockN = (beat && beat.blockSize) || (NS.Beats ? NS.Beats.blockSize(state) : 1);
    var optsHtml = options
      .map(function (opt) {
        return (
          '<button type="button" class="mc-choice mc-beat-option" data-mc-action="resolve-beat" data-option="' +
          F().escapeHtml(opt.id) +
          '"><strong class="mc-choice__label">' +
          F().escapeHtml(opt.label) +
          '</strong><span class="mc-choice__sum">' +
          F().escapeHtml(opt.summary || '') +
          '</span><span class="mc-choice__trade">' +
          (opt.ups || [])
            .map(function (u) {
              return '<em class="mc-choice__chip mc-choice__chip--up">+ ' + F().escapeHtml(u) + '</em>';
            })
            .join('') +
          (opt.downs || [])
            .map(function (d) {
              return '<em class="mc-choice__chip mc-choice__chip--down">− ' + F().escapeHtml(d) + '</em>';
            })
            .join('') +
          '</span></button>'
        );
      })
      .join('');
    return stage({
      id: 'career-beat',
      tone: 'decision',
      kicker: blockN === 1 ? 'Próxima temporada' : 'Próximas ' + blockN + ' temporadas',
      title: F().escapeHtml((beat && beat.title) || state.age + ' AÑOS'),
      lead: F().escapeHtml((beat && beat.lead) || (club ? club.shortName || club.name : '')),
      body:
        '<div class="mc-stage__crest">' +
        C().clubBadgeHtml(club, 'xxl') +
        '</div>' +
        '<p class="mc-stage__prompt">' +
        F().escapeHtml((beat && beat.prompt) || '¿Qué hacés ahora?') +
        '</p>' +
        '<div class="mc-choice-list">' +
        optsHtml +
        '</div>'
    });
  }

  function beatCommitScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine.getClub(state.clubId);
    var beat = ctx.beatResult || {};
    var blockN = NS.Beats ? NS.Beats.blockSize(state) : state.blockSeasonsLeft || 1;
    return stage({
      id: 'beat-commit',
      tone: 'preseason',
      kicker: F().escapeHtml(beat.label || state.lastBeatLabel || 'Decisión tomada'),
      title: state.age + ' AÑOS',
      lead: F().escapeHtml(club ? club.shortName || club.name : 'Tu club'),
      body:
        '<div class="mc-stage__crest">' +
        C().clubBadgeHtml(club, 'xxl') +
        '</div>' +
        '<p class="mc-stage__prompt">' +
        F().escapeHtml(beat.consequence || state.lastBeatConsequence || 'La temporada ya empezó.') +
        '</p>' +
        '<p class="mc-stage__meta">' +
        (blockN === 1 ? 'Se simula 1 temporada.' : 'Se simulan ' + blockN + ' temporadas.') +
        '</p>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="confirm-beat-play">Jugar</button>'
    });
  }

  function recapBody(block, state, engine) {
    var club = engine.getClub((block && block.clubId) || state.clubId);
    var player = (state && state.player) || {};
    var consequence =
      (block && block.consequence) ||
      state.lastBeatConsequence ||
      seasonMomentLine(block);
    var age =
      block && block.ageEnd != null
        ? block.ageEnd
        : block && block.age != null
          ? block.age
          : state.age;
    var ovrAfter = block.ratingAfter != null ? block.ratingAfter : state.rating;
    var ovrBefore =
      block.ratingBefore != null ? block.ratingBefore : ovrAfter;
    var titles = ((block && block.titles) || []).slice(0, 2);
    return (
      '<div class="mc-recap-hero mc-recap">' +
      '<div class="mc-stage__crest">' +
      C().clubBadgeHtml(club, 'xxl') +
      '</div>' +
      '<p class="mc-stage__prompt">' +
      F().escapeHtml(consequence) +
      '</p>' +
      '<p class="mc-recap__ovr"><span>' +
      ovrBefore +
      '</span><span aria-hidden="true">→</span><strong>' +
      ovrAfter +
      '</strong></p>' +
      statsRow(F().primarySeasonStatsHtml(block, player.position)) +
      (titles.length
        ? '<p class="mc-stage__meta">' +
          F().escapeHtml(
            titles
              .map(function (t) {
                return t.shortName || t.name;
              })
              .join(' · ')
          ) +
          '</p>'
        : '') +
      '</div>'
    );
  }

  function blockRecapScreen(ctx) {
    var block = ctx.block || ctx.season;
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine.getClub((block && block.clubId) || state.clubId);
    var age =
      block && block.ageEnd != null ? block.ageEnd : state.age - 1;
    return stage({
      id: 'block-recap',
      tone: 'recap',
      kicker: F().escapeHtml((block && block.seasonLabel) || F().seasonLabel(state.seasonIndex - 1)),
      title: age + ' AÑOS',
      lead: F().escapeHtml(club ? club.shortName || club.name : 'Tu club'),
      body: recapBody(block, state, engine),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="after-recap">Continuar</button>'
    });
  }

  function seasonRecapScreen(ctx) {
    var season = ctx.season;
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine.getClub((season && season.clubId) || state.clubId);
    var age = season && season.age != null ? season.age : state.age;
    return stage({
      id: 'recap',
      tone: 'recap',
      kicker: F().escapeHtml((season && season.seasonLabel) || F().seasonLabel(season.seasonIndex)),
      title: age + ' AÑOS',
      lead: F().escapeHtml(club ? club.shortName || club.name : 'Tu club'),
      body: recapBody(season, state, engine),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="after-recap">Continuar</button>'
    });
  }

  function createScreen(ctx) {
    var draft = ctx.draft || {};
    var step = draft.createStep || 1;
    var data = ctx.data || {};
    var titles = ['', 'Tu nombre', 'Tu país', 'Tu edad', 'Tu posición', 'Tu estilo'];
    var body = '';

    if (step === 1) {
      body =
        '<label class="sr-only" for="mc-player-name">Nombre</label>' +
        '<input class="mc-stage__input" id="mc-player-name" name="name" maxlength="24" autocomplete="nickname" required placeholder="TISAN" value="' +
        F().escapeHtml(draft.name || '') +
        '" />' +
        '<p class="ct-field-error" id="mc-name-error" hidden></p>';
    } else if (step === 2) {
      var featured = (data.countries || []).filter(function (c) {
        return (
          [
            'country_ar',
            'country_br',
            'country_uy',
            'country_es',
            'country_mx',
            'country_co',
            'country_fr',
            'country_eng'
          ].indexOf(c.id) !== -1
        );
      });
      body =
        '<div class="mc-pick-grid" role="listbox" aria-label="País">' +
        featured
          .map(function (c) {
            return (
              '<button type="button" class="mc-pick' +
              (draft.countryId === c.id ? ' is-selected' : '') +
              '" data-mc-action="pick-country" data-id="' +
              F().escapeHtml(c.id) +
              '" role="option" aria-selected="' +
              (draft.countryId === c.id) +
              '">' +
              C().countryFlagHtml(c, 'lg') +
              '<strong>' +
              F().escapeHtml(c.name) +
              '</strong></button>'
            );
          })
          .join('') +
        '</div>' +
        '<input class="mc-stage__search" id="mc-country-search" type="search" placeholder="Buscar otro país…" value="' +
        F().escapeHtml(draft.countryQuery || '') +
        '" autocomplete="off" />' +
        '<div class="mc-country-list" id="mc-country-list" role="listbox"></div>' +
        '<p class="ct-field-error" id="mc-country-error" hidden></p>';
    } else if (step === 3) {
      body =
        '<div class="mc-pick-grid mc-pick-grid--2">' +
        [16, 17, 18, 19]
          .map(function (age) {
            return (
              '<button type="button" class="mc-pick' +
              (Number(draft.age) === age ? ' is-selected' : '') +
              '" data-mc-action="pick-age" data-age="' +
              age +
              '"><strong>' +
              age +
              '</strong><span>años</span></button>'
            );
          })
          .join('') +
        '</div><p class="ct-field-error" id="mc-age-error" hidden></p>';
    } else if (step === 4) {
      body =
        '<div class="mc-pick-grid mc-pick-grid--2">' +
        ['GK', 'DEF', 'MID', 'FWD']
          .map(function (pos) {
            return (
              '<button type="button" class="mc-pick' +
              (draft.position === pos ? ' is-selected' : '') +
              '" data-mc-action="pick-position" data-id="' +
              pos +
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
        '<div class="mc-pick-grid">' +
        (data.archetypes || [])
          .slice(0, 6)
          .map(function (arch) {
            return (
              '<button type="button" class="mc-pick' +
              (draft.archetypeId === arch.id ? ' is-selected' : '') +
              '" data-mc-action="pick-archetype" data-id="' +
              F().escapeHtml(arch.id) +
              '"><strong>' +
              F().escapeHtml(arch.name) +
              '</strong></button>'
            );
          })
          .join('') +
        '</div><p class="ct-field-error" id="mc-archetype-error" hidden></p>';
    }

    return (
      '<section class="mc-stage mc-stage--create mc-create-flow" data-mc-scene="create">' +
      '<div class="mc-stage__body">' +
      '<form id="mc-create-form" novalidate>' +
      '<p class="mc-stage__kicker">' +
      step +
      ' / 5</p>' +
      '<h1 class="mc-stage__title">' +
      F().escapeHtml(titles[step]) +
      '</h1>' +
      body +
      '</form></div>' +
      '<div class="mc-stage__actions">' +
      (step > 1
        ? '<button type="button" class="ct-button ct-button--ghost" data-mc-action="create-prev">Atrás</button>'
        : '<button type="button" class="ct-button ct-button--ghost" data-mc-action="go-intro">Volver</button>') +
      (step < 5
        ? '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="create-next">Continuar</button>'
        : '<button type="submit" form="mc-create-form" class="ct-button ct-button--primary ct-button--lg">Empezar</button>') +
      '</div></section>'
    );
  }

  function countryResultsHtml(countries, selectedId) {
    if (!countries.length) return '';
    return countries
      .slice(0, 6)
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
          '<strong>' +
          F().escapeHtml(c.name) +
          '</strong></button>'
        );
      })
      .join('');
  }

  function presentScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine.getClub(state.clubId);
    return stage({
      id: 'present',
      tone: 'start',
      kicker: 'Primer contrato',
      title: F().escapeHtml(club ? club.shortName || club.name : 'Tu club'),
      lead: F().escapeHtml(state.player.name),
      body:
        '<div class="mc-stage__crest">' +
        C().clubBadgeHtml(club, 'xxl') +
        '</div>' +
        '<p class="mc-stage__meta">' +
        state.age +
        ' años · ' +
        F().escapeHtml(F().ROLE_LABELS[state.clubRole] || state.clubRole || 'Promesa') +
        '</p>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="begin-career">Firmar</button>'
    });
  }

  function startClubScreen(ctx) {
    var draft = ctx.draft || {};
    var engine = ctx.engine;
    var options = ctx.options || draft.startOptions || [];
    var picks = options
      .map(function (opt) {
        return C().clubPathCardHtml(opt, engine);
      })
      .join('');
    return stage({
      id: 'start-club',
      tone: 'start',
      kicker: 'Primer club',
      title: '¿Dónde empezás?',
      lead: 'Tres caminos. Una carrera.',
      body: '<div class="mc-start-row">' + picks + '</div>',
      actions:
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="create-prev">Atrás</button>'
    });
  }

  function debutScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine.getClub(state.clubId);
    return stage({
      id: 'debut',
      tone: 'start',
      kicker: 'Debut profesional',
      title: state.age + ' AÑOS',
      lead: F().escapeHtml(club ? club.shortName || club.name : 'Tu club'),
      body:
        '<div class="mc-stage__crest mc-stage__crest--pulse">' +
        C().clubBadgeHtml(club, 'xxl') +
        '</div>' +
        '<p class="mc-stage__prompt">La primera noche bajo los reflectores.</p>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="after-debut">Entrar al vestuario</button>'
    });
  }

  /** Compat stub for smokes — never used as live destination. */
  function careerHomeScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine.getClub(state.clubId);
    return stage({
      id: 'hub',
      kicker: 'Compat',
      title: F().escapeHtml(club ? club.shortName || club.name : 'Tu club'),
      body:
        '<div class="mc-hub-hero mc-hero-player">' +
        C().clubBadgeHtml(club, 'xxl') +
        '<div class="mc-hub-age"><strong>' +
        state.age +
        '</strong><span>AÑOS</span></div></div>' +
        '<div class="mc-now"><p class="mc-stage__prompt">Seguí la carrera.</p></div>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="play-season">Continuar</button>'
    });
  }

  function marketScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var offers = state.pendingOffers || [];
    var currentClub = engine.getClub(state.clubId);
    var canLoan =
      state.canLoan ||
      (NS.Rules.loanEligible && NS.Rules.loanEligible(state, engine.world));
    var focusIndex = Math.max(
      0,
      Math.min(ctx.offerIndex != null ? ctx.offerIndex : 0, Math.max(0, offers.length - 1))
    );

    if (!offers.length) {
      var stayInfo =
        NS.Rules && NS.Rules.stayConsequence
          ? NS.Rules.stayConsequence(
              Object.assign({}, state, { marketCold: true }),
              engine.world
            )
          : null;
      var coldLead = state.marketLegacy
        ? (stayInfo && stayInfo.headline) ||
          'Después de tanto, el club quiere convertirte en referente.'
        : (stayInfo && stayInfo.headline) ||
          'Nadie llamó. Quedarte también es una decisión.';
      if (state.marketLegacy && coldLead.indexOf('referente') === -1 && coldLead.indexOf('legado') === -1) {
        coldLead = 'Tu legado sigue acá. El club te quiere como referente.';
      }
      return stage({
        id: 'market',
        tone: 'quiet',
        kicker: 'Tu futuro',
        title: state.marketLegacy ? 'Tu club te necesita' : 'El mercado pasó de largo',
        lead: F().escapeHtml(coldLead),
        body:
          '<div class="mc-stay-card">' +
          '<div class="mc-stage__crest">' +
          C().clubBadgeHtml(currentClub, 'xxl') +
          '</div>' +
          '<h2>' +
          F().escapeHtml(currentClub ? currentClub.shortName || currentClub.name : 'Tu club') +
          '</h2>' +
          (stayInfo
            ? '<span class="mc-choice__trade">' +
              (stayInfo.ups || [])
                .map(function (u) {
                  return '<em class="mc-choice__chip mc-choice__chip--up">+ ' + F().escapeHtml(u) + '</em>';
                })
                .join('') +
              (stayInfo.downs || [])
                .map(function (d) {
                  return '<em class="mc-choice__chip mc-choice__chip--down">− ' + F().escapeHtml(d) + '</em>';
                })
                .join('') +
              '</span>'
            : '') +
          '</div>',
        actions:
          '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="market-stay">Quedarme</button>' +
          (canLoan
            ? '<button type="button" class="ct-button ct-button--ghost" data-mc-action="seek-loan">Buscar préstamo</button>'
            : '')
      });
    }

    var offer = offers[focusIndex];
    var isLoan = offer.kind === 'loan';
    var club = engine.getClub(offer.clubId);
    var country = club ? engine.world.countriesById[club.countryId] : null;
    var more = focusIndex < offers.length - 1;
    var blurb = offer.blurb || tradeoffPhrase(currentClub, club, offer);

    return stage({
      id: 'market',
      tone: isLoan ? 'loan' : 'market',
      kicker:
        offers.length > 1
          ? 'Oferta ' + (focusIndex + 1) + ' de ' + offers.length
          : isLoan
            ? 'Cesión'
            : 'Oferta',
      title: F().escapeHtml(club ? club.shortName || club.name : 'Club'),
      lead: F().escapeHtml(blurb),
      body:
        '<article class="mc-offer-focus' +
        (isLoan ? ' mc-offer-focus--loan' : '') +
        '">' +
        C().clubBadgeHtml(club, 'xxl') +
        (isLoan ? '<p class="mc-stage__meta">Cesión</p>' : '') +
        (country ? '<p class="mc-stage__meta">' + C().countryFlagHtml(country, 'sm') + ' ' + F().escapeHtml(country.name) + '</p>' : '') +
        '<p class="mc-stage__meta">' +
        F().escapeHtml(F().ROLE_LABELS[offer.role] || offer.role) +
        '</p>' +
        '<div class="mc-trade-row">' +
        tradeoffChips(currentClub, club, offer) +
        '</div></article>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="market-sign" data-offer="' +
        F().escapeHtml(offer.id) +
        '">' +
        (isLoan ? 'Aceptar cesión' : 'Firmar') +
        '</button>' +
        (more
          ? '<button type="button" class="ct-button ct-button--ghost" data-mc-action="market-next-offer">Otra oferta</button>'
          : '') +
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="market-stay">Quedarme</button>'
    });
  }

  function compareOfferBody(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var offer = ctx.offer;
    var current = engine.getClub(state.clubId);
    var next = engine.getClub(offer.clubId);
    return (
      '<div class="mc-vs">' +
      '<div class="mc-vs__col">' +
      C().clubBadgeHtml(current, 'xl') +
      '<strong>' +
      F().escapeHtml(current ? current.shortName || current.name : '—') +
      '</strong></div>' +
      '<div class="mc-vs__mark">VS</div>' +
      '<div class="mc-vs__col">' +
      C().clubBadgeHtml(next, 'xl') +
      '<strong>' +
      F().escapeHtml(next ? next.shortName || next.name : '—') +
      '</strong></div></div>' +
      '<div class="mc-trade-metrics mc-trade-row">' +
      tradeoffChips(current, next, offer) +
      '</div>'
    );
  }

  function compareScene(ctx) {
    var offer = ctx.offer;
    return stage({
      id: 'compare',
      tone: 'market',
      kicker: 'Comparar',
      title: '¿Te vas?',
      body: compareOfferBody(ctx),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="market-sign" data-offer="' +
        F().escapeHtml(offer.id) +
        '">Fichar</button>' +
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="market-stay">Quedarme</button>' +
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="open-market">Volver</button>'
    });
  }

  function transferCinematicHtml(ctx) {
    var club = ctx.club;
    var state = ctx.state;
    var engine = ctx.engine;
    var prev = engine.getClub(state.prevClubId || state._prevClubId);
    var consequence =
      ctx.consequence ||
      state._lastTransferLine ||
      'Nuevo club. Nueva presión.';
    return stage({
      id: 'transfer',
      tone: 'transfer',
      kicker: 'Nuevo capítulo',
      title: 'Cambiaste de club',
      lead: F().escapeHtml(club ? club.name : 'Nuevo club'),
      body:
        '<div class="mc-stage__crest mc-stage__crest--pulse">' +
        C().clubBadgeHtml(club, 'xxl') +
        '</div>' +
        (prev
          ? '<p class="mc-stage__meta">' +
            F().escapeHtml(prev.shortName || prev.name) +
            ' → ' +
            F().escapeHtml(club ? club.shortName || club.name : '') +
            '</p>'
          : '') +
        '<p class="mc-stage__prompt">' +
        F().escapeHtml(consequence) +
        '</p>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="after-transfer">Continuar</button>'
    });
  }

  function preSeasonScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine.getClub(state.clubId);
    var sit =
      NS.Rules && NS.Rules.seasonSituation
        ? NS.Rules.seasonSituation(state, engine.world)
        : { age: state.age, line: 'Listo.', objective: 'Competir', roleLabel: '—', valueLabel: '—' };
    var line =
      (UI.Narrative && UI.Narrative.preSeasonLine
        ? UI.Narrative.preSeasonLine(state, engine.world)
        : null) || sit;
    var prompt =
      (line && typeof line === 'object' ? line.line : null) || sit.line || 'Listo para salir a la cancha.';
    return stage({
      id: 'preseason',
      kicker: F().escapeHtml(F().seasonLabel(state.seasonIndex)),
      title: (sit.age || state.age) + ' AÑOS',
      lead: F().escapeHtml(club ? club.shortName || club.name : ''),
      body:
        '<div class="mc-stage__crest">' +
        C().clubBadgeHtml(club, 'xxl') +
        '</div>' +
        '<p class="mc-stage__prompt">' +
        F().escapeHtml(prompt) +
        '</p>' +
        '<div class="mc-pre-meta">' +
        '<div><span>Objetivo</span><strong>' +
        F().escapeHtml(sit.objective || 'Competir') +
        '</strong></div>' +
        '<div><span>Rol</span><strong>' +
        F().escapeHtml(sit.roleLabel || F().ROLE_LABELS[sit.role] || state.clubRole || '—') +
        '</strong></div>' +
        '<div><span>Valor</span><strong>' +
        F().escapeHtml(sit.valueLabel || '—') +
        '</strong></div></div>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="confirm-season">Jugar</button>'
    });
  }

  function ageUpScreen(ctx) {
    var fromAge = ctx.fromAge;
    var toAge = ctx.toAge;
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine && state ? engine.getClub(state.clubId) : null;
    var chapter =
      (UI.Narrative && UI.Narrative.ageHeadline
        ? UI.Narrative.ageHeadline(toAge, state)
        : '') ||
      (NS.Rules && NS.Rules.ageChapter ? NS.Rules.ageChapter(toAge, state) : '') ||
      '';
    return stage({
      id: 'age-up',
      tone: 'age',
      kicker: 'El tiempo no perdona',
      title: String(toAge) + ' AÑOS',
      lead: F().escapeHtml(chapter),
      body:
        (club ? '<div class="mc-stage__crest">' + C().clubBadgeHtml(club, 'xl') + '</div>' : '') +
        '<div class="mc-age-up"><span>' +
        fromAge +
        '</span><span aria-hidden="true">↓</span><strong>' +
        toAge +
        '</strong></div>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="after-age-up">Continuar</button>'
    });
  }

  function seasonScreen(ctx) {
    return careerHomeScreen(ctx);
  }

  function beatScene(opts) {
    return scene(opts);
  }

  function titleCelebrationBody(title, club) {
    return (
      '<div class="mc-celebrate">' +
      '<p class="mc-stage__kicker">Campeones</p>' +
      '<h3>' +
      F().escapeHtml(title.name) +
      '</h3>' +
      (club ? C().clubBadgeHtml(club, 'xl') : '') +
      '</div>'
    );
  }

  function titleScene(title, club, nt) {
    return stage({
      id: 'title',
      tone: 'title',
      kicker: 'Campeones',
      title: 'Campeón',
      lead: F().escapeHtml(title.shortName || title.name),
      body: titleCelebrationBody(title, club, nt),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="beat-continue">Continuar</button>'
    });
  }

  function awardCelebrationBody(award, playerName) {
    return (
      '<div class="mc-celebrate">' +
      awardMarkHtml(award) +
      '<h3>' +
      F().escapeHtml(award.shortName || award.name) +
      '</h3>' +
      (playerName ? '<p class="mc-stage__meta">' + F().escapeHtml(playerName) + '</p>' : '') +
      '</div>'
    );
  }

  function awardScene(award, playerName) {
    var ballon = award && award.awardId === 'award_ballon_dor';
    return stage({
      id: 'award',
      tone: ballon ? 'ballon' : 'award',
      kicker: ballon ? 'Historia' : 'Premio',
      title: ballon ? 'Balón de Oro' : F().escapeHtml(award.shortName || award.name),
      lead: ballon
        ? 'Esto puede cambiar una carrera.'
        : F().escapeHtml(playerName || ''),
      body: awardCelebrationBody(award, playerName),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="beat-continue">Continuar</button>'
    });
  }

  function ballonTeaseScene(award, playerName) {
    return stage({
      id: 'ballon-tease',
      tone: 'ballon',
      kicker: 'Nominados',
      title: 'Balón de Oro',
      lead: F().escapeHtml(playerName || ''),
      body: '<p class="mc-stage__prompt">Estás entre los nominados.</p>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="beat-continue">Continuar</button>'
    });
  }

  function momentCelebrationBody(moment) {
    return (
      '<div class="mc-celebrate"><h3>' +
      F().escapeHtml((moment && moment.label) || 'Momento') +
      '</h3></div>'
    );
  }

  function momentScene(moment) {
    return stage({
      id: 'moment',
      kicker: 'Momento',
      title: F().escapeHtml((moment && moment.label) || 'Momento'),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="beat-continue">Continuar</button>'
    });
  }

  function eventScene(event) {
    return stage({
      id: 'event',
      kicker: 'Suceso',
      title: F().escapeHtml((event && event.title) || 'Evento'),
      lead: F().escapeHtml((event && (event.body || event.summary)) || ''),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="beat-continue">Continuar</button>'
    });
  }

  function timelineHtml(state, engine) {
    if (!NS.Rules || !NS.Rules.clubTimelineSummary) return '';
    var rows = NS.Rules.clubTimelineSummary(state, engine.world);
    if (!rows.length) return '';
    return (
      '<div class="mc-career-timeline mc-timeline" aria-label="Clubes">' +
      rows
        .map(function (row) {
          var club = engine.getClub(row.clubId);
          return (
            '<div class="mc-timeline__row">' +
            C().clubBadgeHtml(club, 'sm') +
            '<div><strong>' +
            row.ageStart +
            (row.ageEnd !== row.ageStart ? '–' + row.ageEnd : '') +
            '</strong> ' +
            F().escapeHtml(row.name) +
            (row.onLoan ? ' <span>(cesión)</span>' : '') +
            '</div></div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function retireScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var reward = ctx.reward || null;
    var card = UI.CareerCardRenderer.render(state, engine);
    var shareAvailable = UI.Share.canNativeShare();
    var seasons = (state.seasonHistory || []).length;
    var analysis =
      NS.Rules && NS.Rules.analyzeCareer ? NS.Rules.analyzeCareer(state, engine.world) : null;
    var archLabel =
      analysis && NS.Rules.archetypeLabel
        ? NS.Rules.archetypeLabel(analysis.archetype)
        : '';
    var story =
      NS.Rules && NS.Rules.careerStoryPhrase
        ? NS.Rules.careerStoryPhrase(state, engine.world)
        : state.retirementLine || '';
    var storyBits = (state.storyBeats || [])
      .slice(0, 3)
      .map(function (b) {
        return (
          '<li>' +
          (b.age != null ? '<strong>' + b.age + '</strong> ' : '') +
          F().escapeHtml(b.line || '') +
          '</li>'
        );
      })
      .join('');

    return stage({
      id: 'retire',
      tone: 'retire',
      kicker: 'Tu legado',
      title: archLabel || 'Tu historia terminó',
      lead: F().escapeHtml(story),
      body:
        '<p class="mc-stage__meta">' +
        (state.ageStart != null ? state.ageStart : 17) +
        ' → ' +
        state.age +
        ' · ' +
        seasons +
        ' temp · Pico ' +
        (state.peakRating || state.rating) +
        '</p>' +
        timelineHtml(state, engine) +
        (storyBits ? '<ul class="mc-story-beats">' + storyBits + '</ul>' : '') +
        '<div class="mc-retire-card">' +
        card.html +
        '</div>' +
        UI.Rewards.rewardsHtml(reward) +
        '<p class="mc-retire-hook">¿Y si hubieras elegido distinto?</p>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="play-again">Nueva carrera</button>' +
        '<button type="button" class="ct-button ct-button--secondary" data-mc-action="share-career"' +
        (shareAvailable ? '' : ' hidden') +
        '>Compartir mi carrera</button>' +
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="copy-career">Copiar resultado</button>'
    });
  }

  function seasonFeedbackBody(payload) {
    var season = payload.season;
    var position =
      (payload.state && payload.state.player && payload.state.player.position) || 'MID';
    return (
      '<p class="mc-stage__kicker">' +
      F().escapeHtml(season.seasonLabel || '') +
      '</p>' +
      statsRow(F().primarySeasonStatsHtml(season, position))
    );
  }

  function eventModalBody(event) {
    return '<p>' + F().escapeHtml((event && (event.body || event.summary)) || '') + '</p>';
  }

  function playerCardHtml(draft, data) {
    var name = String((draft && draft.name) || '').trim() || 'Tu nombre';
    return (
      '<aside class="mc-mini-id"><strong>' +
      F().escapeHtml(name) +
      '</strong><span>' +
      F().escapeHtml((draft && draft.position) || '—') +
      '</span></aside>'
    );
  }

  UI.screens = {
    intro: introScreen,
    modeSelect: modeSelectScreen,
    careerBeat: careerBeatScreen,
    beatCommit: beatCommitScreen,
    blockRecap: blockRecapScreen,
    create: createScreen,
    startClub: startClubScreen,
    present: presentScreen,
    debut: debutScreen,
    season: seasonScreen,
    careerHome: careerHomeScreen,
    market: marketScreen,
    seasonRecap: seasonRecapScreen,
    preSeason: preSeasonScreen,
    ageUp: ageUpScreen,
    transferCinematic: transferCinematicHtml,
    compareOfferBody: compareOfferBody,
    compareScene: compareScene,
    titleScene: titleScene,
    awardScene: awardScene,
    ballonTease: ballonTeaseScene,
    momentScene: momentScene,
    eventScene: eventScene,
    beatScene: beatScene,
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
