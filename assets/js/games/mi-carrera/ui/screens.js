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
      '<span class="mc-comp-mark mc-comp-mark--' +
      size +
      '"><img src="' +
      F().escapeHtml(src) +
      '" alt="" width="28" height="28" loading="lazy" decoding="async" /><span>' +
      label +
      '</span></span>'
    );
  }

  function awardMarkHtml(award) {
    if (!award) return '<span class="mc-award-mark" aria-hidden="true">🥇</span>';
    var id = award.awardId || award.id;
    var view = NS.getAwardIcon ? NS.getAwardIcon(id, award) : null;
    var src = assetSrc(view);
    if (!src) return '<span class="mc-award-mark" aria-hidden="true">🥇</span>';
    return (
      '<img class="mc-award-mark" src="' +
      F().escapeHtml(src) +
      '" alt="" width="96" height="96" loading="lazy" decoding="async" />'
    );
  }

  function projectScore(offer, club) {
    return Math.max(1, Math.min(10, Math.round((offer.prestige || (club && club.prestige) || 50) / 10)));
  }

  function levelStars(level) {
    var n = Math.max(1, Math.min(5, Number(level) || 1));
    return Array(n + 1).join('★');
  }

  function tradeoffPhrase(current, next, offer) {
    var curP = (current && current.prestige) || 0;
    var nextP = (next && next.prestige) || 0;
    var curL = (current && current.level) || 1;
    var nextL = (next && next.level) || 1;
    if (offer && offer.kind === 'loan') return 'Más minutos. Menor riesgo. No es definitivo.';
    if (nextL >= curL + 2) return 'Salto enorme. Riesgo alto.';
    if (nextL > curL) return 'Más escaparate. Hay que pelear el puesto.';
    if (offer && offer.role === 'titular' && nextP < curP) return 'Más minutos, menos prestigio.';
    if (offer && offer.role === 'titular') return 'Te quieren como titular.';
    if (offer && offer.role === 'promesa') return 'Gran oportunidad para crecer.';
    if (nextL < curL) return 'Menos escaparate. Más protagonismo.';
    return 'Nuevo escenario para tu carrera.';
  }

  function tradeoffChips(current, next, offer) {
    var chips = [];
    var curP = (current && current.prestige) || 0;
    var nextP = (next && next.prestige) || 0;
    var curL = (current && current.level) || 1;
    var nextL = (next && next.level) || 1;
    if (nextP > curP + 4) chips.push({ tone: 'up', text: 'Prestigio' });
    else if (nextP < curP - 4) chips.push({ tone: 'down', text: 'Prestigio' });
    if (nextL > curL) chips.push({ tone: 'up', text: 'Competición' });
    else if (nextL < curL) chips.push({ tone: 'down', text: 'Competición' });
    if (offer.role === 'titular') chips.push({ tone: 'up', text: 'Minutos' });
    else if (offer.role === 'rotacion') chips.push({ tone: 'down', text: 'Minutos' });
    else if (offer.role === 'promesa') chips.push({ tone: 'up', text: 'Desarrollo' });
    if (offer.kind === 'loan') {
      chips = [
        { tone: 'up', text: 'Minutos' },
        { tone: 'up', text: 'Desarrollo' },
        { tone: 'down', text: 'Riesgo' }
      ];
    }
    if (nextL >= curL + 2) chips.push({ tone: 'down', text: 'Riesgo' });
    if (!chips.length) chips.push({ tone: 'up', text: 'Desarrollo' });
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
      return season.moments[0].label || 'Momento de la temporada.';
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

  function seasonLine(state) {
    var fs = NS.Rules && NS.Rules.formStatus ? NS.Rules.formStatus(state.form) : null;
    if (state.arcFlags && state.arcFlags.crisis) return 'Algo no está funcionando.';
    if (state.arcFlags && state.arcFlags.breakout) return 'Tu momento llegó.';
    if (state.arcFlags && state.arcFlags.comeback) return 'Volviste.';
    if (fs && fs.id === 'hot') return 'Tu temporada está siendo extraordinaria.';
    if (fs && fs.id === 'good') return 'Te ganaste un lugar.';
    if (fs && fs.id === 'low') return 'El entrenador todavía no confía en vos.';
    if (fs && fs.id === 'crisis') return 'Estás en crisis.';
    if (state.phase === 'simulate') return 'Listo para salir a la cancha.';
    return 'Tomá la siguiente decisión.';
  }

  function scene(opts) {
    opts = opts || {};
    return (
      '<section class="mc-scene mc-scene--' +
      F().escapeHtml(opts.id || 'beat') +
      (opts.tone ? ' mc-scene--tone-' + F().escapeHtml(opts.tone) : '') +
      '" data-mc-scene="' +
      F().escapeHtml(opts.id || 'beat') +
      '">' +
      '<div class="mc-scene__stage">' +
      (opts.kicker ? '<p class="mc-scene__kicker">' + opts.kicker + '</p>' : '') +
      (opts.title ? '<h1 class="mc-scene__title">' + opts.title + '</h1>' : '') +
      (opts.lead ? '<p class="mc-scene__lead">' + opts.lead + '</p>' : '') +
      (opts.body || '') +
      '</div>' +
      (opts.actions
        ? '<div class="mc-scene__actions">' + opts.actions + '</div>'
        : '') +
      '</section>'
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
      '<aside class="mc-player-card mc-player-card--scene mc-player-card--' +
      ovrBand +
      '" aria-live="polite" aria-label="Carta del futbolista">' +
      '<div class="mc-player-card__glow" aria-hidden="true"></div>' +
      '<div class="mc-player-card__top">' +
      (country ? C().countryFlagHtml(country, 'md') : '<span class="mc-player-card__flag-ph" aria-hidden="true"></span>') +
      '<span class="mc-player-card__age">' +
      age +
      '</span></div>' +
      (src
        ? '<img class="mc-player-card__avatar" src="' +
          F().escapeHtml(src) +
          '" alt="" width="72" height="72" />'
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
    if (active) {
      return scene({
        id: 'intro',
        tone: 'resume',
        kicker: 'Mi Carrera',
        title: F().escapeHtml(active.playerName),
        lead:
          active.age +
          ' años · ' +
          F().escapeHtml(active.clubName) +
          ' · <strong>' +
          active.rating +
          ' OVR</strong>',
        body:
          '<div class="mc-scene-crest">' +
          (active.clubId && NS._lastEngine
            ? C().clubBadgeHtml(NS._lastEngine.getClub(active.clubId), 'xxl')
            : '') +
          '</div>' +
          '<p class="mc-scene__meta">' +
          F().escapeHtml(F().seasonLabel(active.seasonIndex)) +
          (active.lastHighlight ? ' · ' + F().escapeHtml(active.lastHighlight) : '') +
          '</p>',
        actions:
          '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="continue-career">Continuar</button>' +
          '<button type="button" class="ct-button ct-button--ghost" data-mc-action="new-career-confirm">Nueva carrera</button>'
      });
    }

    return (
      '<div class="mc-screen mc-screen--cover">' +
      scene({
        id: 'intro',
        tone: 'cover',
        kicker: 'Crack Total',
        title: 'Tu carrera. Tu historia.',
        lead: 'CONVERTITE EN LEYENDA.',
        body:
          '<div class="mc-cover-visual" aria-hidden="true">' +
          '<div class="mc-cover-visual__pitch"></div>' +
          '<div class="mc-cover-visual__card"></div></div>' +
          '<p class="mc-scene__meta" id="como-funciona">Creá. Jugá. Decidí tu futuro.</p>',
        actions:
          '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="start-create">Empezar carrera</button>'
      }) +
      '</div>'
    );
  }

  function createScreen(ctx) {
    var draft = ctx.draft || {};
    var step = draft.createStep || 1;
    var data = ctx.data || {};
    var titles = ['', 'Tu nombre', 'Tu país', 'Tu posición', 'Tu estilo'];
    var body = '';

    if (step === 1) {
      body =
        '<label class="sr-only" for="mc-player-name">Nombre</label>' +
        '<input class="mc-scene-input" id="mc-player-name" name="name" maxlength="24" autocomplete="nickname" required placeholder="TISAN" value="' +
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
        '<div class="mc-choice-grid mc-choice-grid--flags" role="listbox" aria-label="País">' +
        featured
          .map(function (c) {
            return (
              '<button type="button" class="mc-choice' +
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
        '<label class="sr-only" for="mc-country-search">Buscar país</label>' +
        '<input class="mc-scene-search" id="mc-country-search" type="search" placeholder="Buscar otro país…" value="' +
        F().escapeHtml(draft.countryQuery || '') +
        '" autocomplete="off" />' +
        '<div class="mc-country-list mc-country-list--compact" id="mc-country-list" role="listbox"></div>' +
        '<p class="ct-field-error" id="mc-country-error" hidden></p>';
    } else if (step === 3) {
      body =
        '<div class="mc-choice-grid mc-choice-grid--2">' +
        ['GK', 'DEF', 'MID', 'FWD']
          .map(function (pos) {
            return (
              '<button type="button" class="mc-choice mc-choice--pos' +
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
        '<div class="mc-choice-grid mc-choice-grid--arch">' +
        (data.archetypes || [])
          .slice(0, 6)
          .map(function (arch) {
            return (
              '<button type="button" class="mc-choice' +
              (draft.archetypeId === arch.id ? ' is-selected' : '') +
              '" data-mc-action="pick-archetype" data-id="' +
              F().escapeHtml(arch.id) +
              '" aria-pressed="' +
              (draft.archetypeId === arch.id) +
              '"><strong>' +
              F().escapeHtml(arch.name) +
              '</strong></button>'
            );
          })
          .join('') +
        '</div><p class="ct-field-error" id="mc-archetype-error" hidden></p>';
    }

    return (
      '<section class="mc-scene mc-scene--create mc-create-flow" data-mc-scene="create">' +
      '<div class="mc-scene__stage mc-scene__stage--split">' +
      '<div class="mc-create-preview">' +
      playerCardHtml(draft, data, null) +
      '</div>' +
      '<form id="mc-create-form" class="mc-create-step" novalidate>' +
      '<p class="mc-scene__kicker">0' +
      step +
      ' / 04</p>' +
      '<h1 class="mc-scene__title">' +
      F().escapeHtml(titles[step]) +
      '</h1>' +
      body +
      '</form></div>' +
      '<div class="mc-scene__actions">' +
      (step > 1
        ? '<button type="button" class="ct-button ct-button--ghost" data-mc-action="create-prev">Atrás</button>'
        : '<button type="button" class="ct-button ct-button--ghost" data-mc-action="go-intro">Volver</button>') +
      (step < 4
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
    var country = engine.world.countriesById[state.player.countryId];
    var club = engine.getClub(state.clubId);
    var comp = club ? engine.world.competitionsById[club.primaryCompetitionId] : null;
    var mins = NS.Rules.expectedMinutesBand
      ? NS.Rules.expectedMinutesBand(state, club)
      : { label: '—' };
    var role = state.clubRole || (NS.Rules.expectedRoleForClub
      ? NS.Rules.expectedRoleForClub(state, club)
      : 'promesa');
    return scene({
      id: 'contract',
      tone: 'contract',
      kicker: 'Tu carrera comienza',
      title: 'Primer contrato',
      body:
        '<div class="mc-scene-crest">' +
        C().clubBadgeHtml(club, 'xxl') +
        '</div>' +
        '<h2 class="mc-scene__club">' +
        F().escapeHtml(club ? club.name : 'Club') +
        '</h2>' +
        '<p class="mc-scene__meta">' +
        competitionMarkHtml(comp, 'md') +
        (country ? ' ' + C().countryFlagHtml(country, 'sm') : '') +
        '</p>' +
        '<div class="mc-scene-stats">' +
        '<div><span>Rol</span><strong>' +
        F().escapeHtml(F().ROLE_LABELS[role] || role) +
        '</strong></div>' +
        '<div><span>OVR</span><strong class="is-accent">' +
        state.rating +
        '</strong></div>' +
        '<div><span>Minutos</span><strong>' +
        F().escapeHtml(mins.label) +
        '</strong></div></div>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="begin-career">Firmar</button>'
    });
  }

  function startClubScreen(ctx) {
    var options = ctx.options || [];
    var cards = options
      .map(function (opt) {
        return C().clubPathCardHtml(opt, ctx.engine);
      })
      .join('');
    return scene({
      id: 'start-club',
      tone: 'start',
      kicker: 'Capítulo uno',
      title: '¿Dónde empieza tu historia?',
      lead: 'Protagonista. Equilibrio. Escaparate. Tres caminos distintos.',
      body: '<div class="mc-start-row">' + cards + '</div>',
      actions:
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="go-intro">Volver</button>'
    });
  }

  function debutScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine.getClub(state.clubId);
    return scene({
      id: 'debut',
      tone: 'debut',
      kicker: 'Debut profesional',
      title: state.age + ' años',
      lead: F().escapeHtml(club ? club.shortName || club.name : 'Tu club'),
      body:
        '<div class="mc-scene-crest">' +
        C().clubBadgeHtml(club, 'xxl') +
        '</div>' +
        '<p class="mc-scene__meta">Primer partido. La historia empieza.</p>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="after-debut">Continuar</button>'
    });
  }

  function careerHomeScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine.getClub(state.clubId);
    var country = engine.world.countriesById[state.player.countryId];
    var decision = state.currentDecision;
    var needsMarket =
      state.phase === 'decision' ||
      (state.pendingOffers && state.pendingOffers.length) ||
      (decision && decision.type === 'transferencia');
    var fs = NS.Rules && NS.Rules.formStatus ? NS.Rules.formStatus(state.form) : null;
    var tone = 'hub';
    if (state.arcFlags && state.arcFlags.crisis) tone = 'crisis';
    else if (state.arcFlags && state.arcFlags.comeback) tone = 'comeback';
    else if (state.arcFlags && state.arcFlags.breakout) tone = 'prime';
    else if (state.age >= 33) tone = 'decline';
    else if (state.rating >= 88) tone = 'prime';

    var poster =
      state.seasonIndex === 0
        ? 'Tu primera temporada puede cambiarlo todo.'
        : state.arcFlags && state.arcFlags.crisis
          ? 'El año se te hizo cuesta arriba. Todavía hay partido.'
          : state.arcFlags && state.arcFlags.comeback
            ? 'Volviste. Ahora hay que sostenerlo.'
            : 'Este año puede cambiarlo todo.';

    var actions = '';
    if (decision && decision.type === 'retiro') {
      actions = (decision.options || [])
        .slice(0, 2)
        .map(function (opt) {
          return (
            '<button type="button" class="ct-button ' +
            (opt.id === 'retire_yes' ? 'ct-button--danger' : 'ct-button--primary') +
            ' ct-button--lg" data-mc-action="choose-option" data-option="' +
            F().escapeHtml(opt.id) +
            '">' +
            F().escapeHtml(opt.label) +
            '</button>'
          );
        })
        .join('');
    } else if (needsMarket) {
      actions =
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="open-market">El mercado</button>';
    } else {
      actions =
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="play-season">Jugar temporada</button>';
    }

    var seasonN = Math.max(1, (state.seasonIndex || 0) + 1);
    var seasonOrdinal =
      seasonN === 1 ? 'Tu primera temporada' : 'Tu temporada ' + seasonN;

    return scene({
      id: 'hub',
      tone: tone,
      kicker: F().escapeHtml(F().seasonLabel(state.seasonIndex)),
      title: F().escapeHtml(club ? club.shortName || club.name : 'Tu club'),
      lead: F().escapeHtml(seasonOrdinal),
      body:
        '<div class="mc-hub-hero mc-hero-player">' +
        C().clubBadgeHtml(club, 'xxl') +
        '<div class="mc-hub-hero__id">' +
        C().countryFlagHtml(country, 'md') +
        '<p class="mc-hub-pos">' +
        F().escapeHtml(state.player.position) +
        ' · ' +
        F().escapeHtml(state.player.name) +
        '</p>' +
        '<p class="mc-hub-club">' +
        F().escapeHtml(club ? club.shortName || club.name : '—') +
        '</p></div>' +
        '<div class="mc-hub-ovr"><span>OVR</span><strong>' +
        state.rating +
        '</strong></div></div>' +
        '<div class="mc-now">' +
        '<p class="mc-poster-line">' +
        F().escapeHtml(poster) +
        '</p>' +
        (fs
          ? '<p class="mc-form-chip mc-form-chip--' +
            F().escapeHtml(fs.id) +
            '">' +
            F().escapeHtml(fs.label) +
            '</p>'
          : '') +
        '</div>',
      actions: actions
    });
  }

  function marketScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var offers = state.pendingOffers || [];
    var transfers = offers.filter(function (o) {
      return o.kind !== 'loan';
    });
    var loans = offers.filter(function (o) {
      return o.kind === 'loan';
    });
    var currentClub = engine.getClub(state.clubId);
    var canLoan =
      state.canLoan ||
      (NS.Rules.loanEligible && NS.Rules.loanEligible(state, engine.world));

    function offerCard(offer, isLoan) {
      var club = engine.getClub(offer.clubId);
      var comp = club ? engine.world.competitionsById[club.primaryCompetitionId] : null;
      var country = club ? engine.world.countriesById[club.countryId] : null;
      return (
        '<article class="mc-offer-scene' +
        (isLoan ? ' mc-offer-scene--loan' : '') +
        '">' +
        C().clubBadgeHtml(club, 'xxl') +
        (isLoan ? '<p class="mc-offer-kind">Cesión</p>' : '') +
        '<h2>' +
        F().escapeHtml(club ? club.shortName || club.name : 'Club') +
        '</h2>' +
        '<p class="mc-offer-scene__league">' +
        (country ? C().countryFlagHtml(country, 'sm') + ' ' : '') +
        F().escapeHtml(country ? country.name : '') +
        '</p>' +
        '<p class="mc-offer-scene__league">' +
        competitionMarkHtml(comp, 'sm') +
        '</p>' +
        '<p class="mc-offer-stars" aria-hidden="true">' +
        levelStars(offer.level || (club && club.level) || 1) +
        '</p>' +
        '<span class="mc-offer-role">' +
        F().escapeHtml(F().ROLE_LABELS[offer.role] || offer.role) +
        (offer.minutesLabel ? ' · ' + F().escapeHtml(offer.minutesLabel) : '') +
        '</span>' +
        (offer.blurb
          ? '<p class="mc-offer-blurb">' + F().escapeHtml(offer.blurb) + '</p>'
          : '') +
        '<button type="button" class="ct-button ct-button--primary" data-mc-action="market-compare" data-offer="' +
        F().escapeHtml(offer.id) +
        '">' +
        (isLoan ? 'Ver cesión' : 'Ver oferta') +
        '</button></article>'
      );
    }

    if (!transfers.length && !loans.length) {
      return scene({
        id: 'market',
        tone: 'quiet',
        kicker: 'Tu futuro',
        title: 'El mercado pasó de largo',
        lead: 'Nadie llamó. Quedarte también construye tu historia.',
        body:
          '<div class="mc-stay-card">' +
          '<div class="mc-scene-crest">' +
          C().clubBadgeHtml(currentClub, 'xxl') +
          '</div>' +
          '<h2 class="mc-scene__club">' +
          F().escapeHtml(currentClub ? currentClub.shortName || currentClub.name : 'Tu club') +
          '</h2>' +
          '<p class="mc-scene__meta">Podés construir tu legado acá.</p></div>',
        actions:
          '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="market-stay">Quedarme</button>' +
          (canLoan
            ? '<button type="button" class="ct-button ct-button--secondary" data-mc-action="seek-loan">Buscar préstamo</button>'
            : '')
      });
    }

    var cards = transfers
      .slice(0, 3)
      .map(function (o) {
        return offerCard(o, false);
      })
      .concat(
        loans.slice(0, 2).map(function (o) {
          return offerCard(o, true);
        })
      )
      .join('');

    return scene({
      id: 'market',
      tone: 'market',
      kicker: 'Mercado de fichajes',
      title: 'El mercado habla',
      lead: transfers.length
        ? 'Hay clubes que te quieren. Elegí tu próximo capítulo.'
        : 'Hay cesiones sobre la mesa. Más minutos, menos presión.',
      body: '<div class="mc-offer-row">' + cards + '</div>',
      actions:
        '<button type="button" class="ct-button ct-button--secondary ct-button--lg" data-mc-action="market-stay">Quedarme</button>' +
        (canLoan && !loans.length
          ? '<button type="button" class="ct-button ct-button--ghost" data-mc-action="seek-loan">Buscar préstamo</button>'
          : '')
    });
  }

  function compareOfferBody(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var offer = ctx.offer;
    var current = engine.getClub(state.clubId);
    var next = engine.getClub(offer.clubId);
    return (
      '<div class="mc-compare-pro">' +
      '<div class="mc-vs">' +
      '<div class="mc-vs__col">' +
      C().clubBadgeHtml(current, 'xl') +
      '<strong>' +
      F().escapeHtml(current ? current.shortName || current.name : '—') +
      '</strong></div>' +
      '<div class="mc-vs__mark">VS</div>' +
      '<div class="mc-vs__col is-next">' +
      C().clubBadgeHtml(next, 'xl') +
      '<strong>' +
      F().escapeHtml(next ? next.shortName || next.name : '—') +
      '</strong></div></div>' +
      '<div class="mc-trade-row">' +
      tradeoffChips(current, next, offer) +
      '</div></div>'
    );
  }

  function compareScene(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var offer = ctx.offer;
    var current = engine.getClub(state.clubId);
    var next = engine.getClub(offer.clubId);
    return scene({
      id: 'compare',
      tone: 'decision',
      kicker: offer.kind === 'loan' ? '¿Cesión?' : '¿Te vas?',
      title: offer.kind === 'loan' ? 'Préstamo' : 'Tu decisión',
      lead: tradeoffPhrase(current, next, offer),
      body:
        '<div class="mc-vs">' +
        '<div class="mc-vs__col">' +
        C().clubBadgeHtml(current, 'xxl') +
        '<strong>' +
        F().escapeHtml(current ? current.shortName || current.name : '—') +
        '</strong><span>Actual</span></div>' +
        '<div class="mc-vs__mark" aria-hidden="true">VS</div>' +
        '<div class="mc-vs__col is-next">' +
        C().clubBadgeHtml(next, 'xxl') +
        '<strong>' +
        F().escapeHtml(next ? next.shortName || next.name : '—') +
        '</strong><span>' +
        F().escapeHtml(
          offer.kind === 'loan'
            ? 'Cesión'
            : F().ROLE_LABELS[offer.role] || offer.role
        ) +
        '</span></div></div>' +
        '<div class="mc-trade-row">' +
        tradeoffChips(current, next, offer) +
        '</div>' +
        '<p class="mc-compare-line">' +
        F().escapeHtml(tradeoffPhrase(current, next, offer)) +
        '</p>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="market-sign" data-offer="' +
        F().escapeHtml(offer.id) +
        '">' +
        (offer.kind === 'loan' ? 'Ir cedido' : 'Fichar') +
        '</button>' +
        '<button type="button" class="ct-button ct-button--secondary" data-mc-action="open-market">Volver</button>'
    });
  }

  function transferCinematicHtml(ctx) {
    var club = ctx.club;
    var state = ctx.state;
    var engine = ctx.engine || NS._lastEngine;
    var prevId =
      (state.clubsPlayed && state.clubsPlayed.length > 1
        ? state.clubsPlayed[state.clubsPlayed.length - 2]
        : null) || null;
    var prev = prevId && engine ? engine.getClub(prevId) : null;
    var comp =
      club && engine && engine.world
        ? engine.world.competitionsById[club.primaryCompetitionId]
        : null;
    return scene({
      id: 'transfer',
      tone: 'transfer',
      kicker: 'Nuevo capítulo',
      title: 'Nuevo club',
      lead: F().escapeHtml(club ? club.name : 'Nuevo club'),
      body:
        (prev
          ? '<div class="mc-vs" style="margin-bottom:1rem">' +
            '<div class="mc-vs__col">' +
            C().clubBadgeHtml(prev, 'xl') +
            '</div>' +
            '<div class="mc-vs__mark" aria-hidden="true">→</div>' +
            '<div class="mc-vs__col is-next">' +
            C().clubBadgeHtml(club, 'xxl') +
            '</div></div>'
          : '<div class="mc-scene-crest mc-scene-crest--pulse">' +
            C().clubBadgeHtml(club, 'xxl') +
            '</div>') +
        (comp ? '<p class="mc-scene__meta">' + competitionMarkHtml(comp, 'md') + '</p>' : '') +
        '<p class="mc-scene__meta"><strong>' +
        F().escapeHtml(state.player.name) +
        '</strong> · ' +
        F().escapeHtml(F().seasonLabel(state.seasonIndex)) +
        '</p>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="after-transfer">Continuar</button>'
    });
  }

  function seasonRecapScreen(ctx) {
    var season = ctx.season;
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine.getClub(season.clubId || state.clubId);
    var player = (state && state.player) || {};
    var country = player.countryId
      ? engine.world.countriesById[player.countryId]
      : null;
    var ovrAfter = season.ratingAfter != null ? season.ratingAfter : state.rating;
    var ovrBefore =
      season.ratingBefore != null ? season.ratingBefore : ovrAfter - (season.growth || 0);
    var arc = season.arcFlags || {};
    var tone = 'recap';
    if (arc.crisis) tone = 'crisis';
    else if (arc.comeback) tone = 'comeback';
    else if (arc.breakout) tone = 'prime';
    else if (season.performanceGrade === 'S' || season.performanceGrade === 'A') tone = 'hot';
    else if (season.performanceGrade === 'D') tone = 'cold';

    var narrative =
      UI.Narrative && UI.Narrative.seasonNarrative
        ? UI.Narrative.seasonNarrative(season, state)
        : seasonMomentLine(season);

    var fs =
      NS.Rules && NS.Rules.formStatus
        ? NS.Rules.formStatus(season.formAfter != null ? season.formAfter : state.form)
        : null;

    var minorAwards = (season.awards || []).filter(function (a) {
      return (a.importance || 0) < 70;
    });
    var awardChips = minorAwards
      .map(function (a) {
        return (
          '<span class="mc-recap-chip">' + F().escapeHtml(a.shortName || a.name) + '</span>'
        );
      })
      .join('');

    return scene({
      id: 'recap',
      tone: tone,
      kicker: 'Tu temporada',
      title: F().escapeHtml(season.seasonLabel || F().seasonLabel(season.seasonIndex)),
      lead: F().escapeHtml(narrative),
      body:
        '<div class="mc-recap-hero">' +
        '<div class="mc-recap-hero__club">' +
        C().clubBadgeHtml(club, 'xxl') +
        '<div>' +
        '<strong class="mc-recap-club">' +
        F().escapeHtml(club ? club.shortName || club.name : '—') +
        '</strong>' +
        '<p class="mc-scene__meta">' +
        (country ? C().countryFlagHtml(country, 'sm') + ' ' : '') +
        F().escapeHtml(player.name || '') +
        (player.position ? ' · ' + F().escapeHtml(player.position) : '') +
        '</p></div></div>' +
        '<div class="mc-recap-numbers">' +
        '<div><strong>' +
        season.appearances +
        '</strong><span>Partidos</span></div>' +
        '<div><strong>' +
        season.goals +
        '</strong><span>Goles</span></div>' +
        '<div><strong>' +
        season.assists +
        '</strong><span>Asistencias</span></div>' +
        '</div>' +
        '<div class="mc-recap-ovrline">' +
        '<span>' +
        ovrBefore +
        '</span><span class="mc-recap-ovrline__arrow" aria-hidden="true">→</span>' +
        '<strong>' +
        ovrAfter +
        ' OVR</strong></div>' +
        (fs
          ? '<p class="mc-form-chip mc-form-chip--' +
            F().escapeHtml(fs.id) +
            '">' +
            F().escapeHtml(fs.label) +
            '</p>'
          : '') +
        (awardChips ? '<div class="mc-recap-chips">' + awardChips + '</div>' : '') +
        '<p class="mc-recap-moment"><span class="mc-scene__kicker">Momento de la temporada</span>' +
        F().escapeHtml(seasonMomentLine(season)) +
        '</p></div>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="after-recap">Continuar</button>'
    });
  }

  function seasonScreen(ctx) {
    return careerHomeScreen(ctx);
  }

  function beatScene(opts) {
    return scene(opts);
  }

  function titleCelebrationBody(title, club, nt) {
    var who = club ? club.shortName || club.name : nt ? nt.name : '';
    var epic = (title.importance || 50) >= 70;
    var comp =
      title.competitionId && NS.getCompetitionLogo
        ? NS.getCompetitionLogo(title.competitionId, {
            id: title.competitionId,
            shortName: title.shortName || title.name
          })
        : null;
    var compSrc = assetSrc(comp);
    return (
      '<div class="mc-celebrate mc-celebrate--title' +
      (epic ? ' mc-celebrate--epic' : '') +
      '">' +
      (compSrc
        ? '<img class="mc-celebrate__trophy" src="' +
          F().escapeHtml(compSrc) +
          '" alt="" width="96" height="96" />'
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

  function titleScene(title, club, nt) {
    var tone =
      UI.Narrative && UI.Narrative.titleTone ? UI.Narrative.titleTone(title) : 'title';
    var epic = tone === 'epic' || (title.importance || 50) >= 70;
    return scene({
      id: 'title',
      tone: epic ? 'title' : 'title',
      kicker: epic ? 'Campeones' : 'Título',
      title: 'Campeón',
      lead: F().escapeHtml(title.shortName || title.name),
      body: titleCelebrationBody(title, club, nt),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="beat-continue">Continuar</button>'
    });
  }

  function awardCelebrationBody(award, playerName) {
    var isBallon = award.awardId === 'award_ballon_dor';
    return (
      '<div class="mc-celebrate mc-celebrate--award' +
      (isBallon ? ' mc-celebrate--ballon' : '') +
      '">' +
      awardMarkHtml(award) +
      '<p class="mc-kicker">' +
      (isBallon ? 'Balón de Oro' : 'Premio') +
      '</p>' +
      (isBallon ? '<p class="mc-celebrate__world">Número 1 del mundo</p>' : '') +
      '<h3 class="mc-celebrate__name">' +
      F().escapeHtml(isBallon ? playerName || award.name : award.name) +
      '</h3>' +
      '<p class="mc-celebrate__season">' +
      F().escapeHtml(award.seasonLabel || '') +
      '</p></div>'
    );
  }

  function ballonTeaseScene(award, playerName) {
    return scene({
      id: 'ballon-tease',
      tone: 'ballon',
      kicker: 'Balón de Oro',
      title: 'Los nominados',
      lead: 'Y el ganador es…',
      body:
        '<div class="mc-ballon-tease">' +
        awardMarkHtml(award) +
        '<p class="mc-scene__meta">' +
        F().escapeHtml(award.seasonLabel || '') +
        '</p></div>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="beat-continue">Revelar</button>'
    });
  }

  function awardScene(award, playerName) {
    var isBallon = award.awardId === 'award_ballon_dor';
    return scene({
      id: 'award',
      tone: isBallon ? 'ballon' : 'award',
      kicker: isBallon ? 'Balón de Oro' : 'Premio',
      title: isBallon ? F().escapeHtml(playerName || '') : F().escapeHtml(award.name),
      lead: isBallon ? 'Tu carrera acaba de cambiar.' : '',
      body: awardCelebrationBody(award, playerName),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="beat-continue">Continuar</button>'
    });
  }

  function momentCelebrationBody(moment) {
    return (
      '<div class="mc-celebrate mc-celebrate--moment">' +
      '<p class="mc-celebrate__icon" aria-hidden="true">⭐</p>' +
      '<p class="mc-kicker">Momento</p>' +
      '<h3 class="mc-celebrate__name">' +
      F().escapeHtml(moment.label || '') +
      '</h3>' +
      '<p class="mc-celebrate__season">' +
      F().escapeHtml(moment.seasonLabel || '') +
      '</p></div>'
    );
  }

  function momentScene(moment) {
    var tone = 'moment';
    var title = F().escapeHtml(moment.label || 'Momento');
    if (String(moment.id).indexOf('moment_crisis') === 0) {
      tone = 'crisis';
      title = 'Algo cambió';
    } else if (String(moment.id).indexOf('moment_comeback') === 0) {
      tone = 'comeback';
      title = 'Volviste';
    } else if (String(moment.id).indexOf('moment_breakout') === 0) {
      tone = 'prime';
      title = 'Tu momento llegó';
    }
    return scene({
      id: 'moment',
      tone: tone,
      kicker: 'Momento',
      title: title,
      body: momentCelebrationBody(moment),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="beat-continue">Continuar</button>'
    });
  }

  function eventModalBody(event) {
    return (
      '<div class="mc-event-panel">' +
      '<p class="mc-event-kicker">Fuera de la cancha</p>' +
      '<p class="mc-event-body">' +
      F().escapeHtml(event.body || event.title || '') +
      '</p></div>'
    );
  }

  function eventScene(event) {
    return scene({
      id: 'event',
      tone: 'life',
      kicker: 'Fuera de la cancha',
      title: F().escapeHtml(event.title || 'Evento'),
      lead: F().escapeHtml(event.body || ''),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="beat-continue">Continuar</button>'
    });
  }

  function retireScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var reward = ctx.reward || null;
    var card = UI.CareerCardRenderer.render(state, engine);
    var shareAvailable = UI.Share.canNativeShare();
    var seasons = (state.seasonHistory || []).length;

    return scene({
      id: 'retire',
      tone: 'retire',
      kicker: 'Tu legado',
      title: 'Tu historia terminó',
      lead: F().escapeHtml(state.retirementLine || 'Colgaste los botines.'),
      body:
        '<p class="mc-scene__meta">' +
        seasons +
        ' temporadas · Pico ' +
        (state.peakRating || state.rating) +
        ' OVR</p>' +
        '<div class="mc-retire-card">' +
        card.html +
        '</div>' +
        UI.Rewards.rewardsHtml(reward),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="play-again">¿Y si lo intentamos de nuevo?</button>' +
        '<button type="button" class="ct-button ct-button--secondary" data-mc-action="share-career"' +
        (shareAvailable ? '' : ' hidden') +
        '>Compartir mi carrera</button>' +
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="copy-career">Copiar resultado</button>'
    });
  }

  function seasonFeedbackBody(payload) {
    var season = payload.season;
    return (
      '<p class="mc-kicker">' +
      F().escapeHtml(season.seasonLabel || F().seasonLabel(season.seasonIndex)) +
      '</p>' +
      '<div class="mc-scene-stats">' +
      '<div><span>PJ</span><strong>' +
      season.appearances +
      '</strong></div>' +
      '<div><span>Goles</span><strong>' +
      season.goals +
      '</strong></div>' +
      '<div><span>Asist.</span><strong>' +
      season.assists +
      '</strong></div></div>'
    );
  }

  UI.screens = {
    intro: introScreen,
    create: createScreen,
    startClub: startClubScreen,
    present: presentScreen,
    debut: debutScreen,
    season: seasonScreen,
    careerHome: careerHomeScreen,
    market: marketScreen,
    seasonRecap: seasonRecapScreen,
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
