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

  function tradeMetric(label, delta) {
    var tone = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    var sign = delta > 0 ? '+' : delta < 0 ? '−' : '·';
    var word =
      tone === 'up' ? 'Más ' + label : tone === 'down' ? 'Menos ' + label : label + ' similar';
    return (
      '<div class="mc-trade-metric mc-trade-metric--' +
      tone +
      '"><span class="mc-trade-metric__sign" aria-hidden="true">' +
      sign +
      '</span><strong>' +
      F().escapeHtml(word) +
      '</strong></div>'
    );
  }

  function tradeoffMetricsHtml(current, next, offer) {
    var curP = (current && current.prestige) || 0;
    var nextP = (next && next.prestige) || 0;
    var curL = (current && current.level) || 1;
    var nextL = (next && next.level) || 1;
    var minsDelta = 0;
    if (offer.kind === 'loan' || offer.role === 'titular') minsDelta = 1;
    else if (offer.role === 'rotacion') minsDelta = -1;
    else if (offer.role === 'promesa') minsDelta = 0;
    var prestigeDelta = nextP > curP + 4 ? 1 : nextP < curP - 4 ? -1 : 0;
    var levelDelta = nextL > curL ? 1 : nextL < curL ? -1 : 0;
    var html =
      '<div class="mc-trade-metrics" role="list">' +
      tradeMetric('prestigio', prestigeDelta) +
      tradeMetric('minutos', minsDelta) +
      tradeMetric('nivel', levelDelta);
    if (offer.kind === 'loan') {
      html +=
        '<div class="mc-trade-metric mc-trade-metric--flat"><strong>Temporal · volvés</strong></div>';
    } else if (nextL >= curL + 2) {
      html +=
        '<div class="mc-trade-metric mc-trade-metric--down"><strong>Más presión</strong></div>';
    }
    return html + '</div>';
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
      age = draft.age != null ? draft.age : 17;
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
    var titles = ['', 'Tu nombre', 'Tu país', 'Tu edad', 'Tu posición', 'Tu estilo'];
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
        '<div class="mc-choice-grid mc-choice-grid--2" role="listbox" aria-label="Edad inicial">' +
        [16, 17, 18, 19]
          .map(function (age) {
            var birth = 2026 - age;
            return (
              '<button type="button" class="mc-choice mc-choice--age' +
              (Number(draft.age) === age ? ' is-selected' : '') +
              '" data-mc-action="pick-age" data-age="' +
              age +
              '" role="option" aria-selected="' +
              (Number(draft.age) === age) +
              '"><strong>' +
              age +
              '</strong><span>años · ' +
              birth +
              '</span></button>'
            );
          })
          .join('') +
        '</div><p class="ct-field-error" id="mc-age-error" hidden></p>';
    } else if (step === 4) {
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
      ' / 05</p>' +
      '<h1 class="mc-scene__title">' +
      F().escapeHtml(titles[step]) +
      '</h1>' +
      body +
      '</form></div>' +
      '<div class="mc-scene__actions">' +
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
      lead: 'Tres clubes. Tres carreras distintas. Elegí el costo que estás dispuesto a pagar.',
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
    var hist = state.seasonHistory || [];
    var last = hist.length ? hist[hist.length - 1] : null;
    var tone = 'hub';
    if (state.arcFlags && state.arcFlags.crisis) tone = 'crisis';
    else if (state.arcFlags && state.arcFlags.comeback) tone = 'comeback';
    else if (state.arcFlags && state.arcFlags.breakout) tone = 'prime';
    else if (state.age >= 33) tone = 'decline';
    else if (state.rating >= 88) tone = 'prime';

    var poster = seasonLine(state);
    var ctaLabel = 'Jugar temporada';
    if (state.seasonIndex === 0) {
      poster = 'Tu primera temporada puede cambiarlo todo.';
      ctaLabel = 'Debutá la temporada';
    } else if (needsMarket) {
      if (state.marketCold) {
        poster = state.marketLegacy
          ? 'Nadie llamó. Acá todavía te quieren como referente.'
          : 'El mercado pasó de largo. Quedarte también construye legado.';
        ctaLabel = 'Ver tu futuro';
      } else if ((state.pendingOffers || []).some(function (o) {
        return o.kind === 'loan';
      }) && !(state.pendingOffers || []).some(function (o) {
        return o.kind !== 'loan';
      })) {
        poster = 'Hay una cesión sobre la mesa. Más minutos, menos presión.';
        ctaLabel = 'Ver cesión';
      } else {
        poster = 'Hay clubes que te quieren. Una decisión puede reescribir tu carrera.';
        ctaLabel = 'Abrir el mercado';
      }
    } else if (state.arcFlags && state.arcFlags.crisis) {
      poster = 'El año se te hizo cuesta arriba. Todavía hay partido.';
      ctaLabel = 'Seguí peleando';
    } else if (state.arcFlags && state.arcFlags.comeback) {
      poster = 'Volviste. Ahora hay que sostenerlo.';
      ctaLabel = 'Sostener el comeback';
    } else if (last && (last.performanceGrade === 'S' || last.performanceGrade === 'A')) {
      poster = 'Después de una gran temporada, este año pide más.';
      ctaLabel = 'Subir la apuesta';
    } else if (last && last.performanceGrade === 'D') {
      poster = 'El año pasado dolió. Este puede ser el reinicio.';
      ctaLabel = 'Buscar el reinicio';
    } else if (state.onLoan) {
      poster = 'Estás cedido. Cada minuto cuenta para volver más fuerte.';
      ctaLabel = 'Jugar la cesión';
    } else if (state.age >= 33) {
      poster = 'Los últimos capítulos pesan más. Escribí bien este.';
      ctaLabel = 'Jugar temporada';
    }

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
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="open-market">' +
        F().escapeHtml(ctaLabel) +
        '</button>';
    } else {
      actions =
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="play-season">' +
        F().escapeHtml(ctaLabel) +
        '</button>';
    }

    var seasonN = Math.max(1, (state.seasonIndex || 0) + 1);
    var seasonOrdinal =
      seasonN === 1 ? 'Tu primera temporada' : 'Temporada ' + seasonN;
    var chapter =
      UI.Narrative && UI.Narrative.ageHeadline
        ? UI.Narrative.ageHeadline(state.age, state)
        : '';

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
        '<div class="mc-hub-age" aria-label="Edad"><strong>' +
        state.age +
        '</strong><span>AÑOS</span></div>' +
        '<div class="mc-hub-ovr"><span>OVR</span><strong>' +
        state.rating +
        '</strong></div></div>' +
        (chapter
          ? '<p class="mc-age-chapter">' + F().escapeHtml(chapter) + '</p>'
          : '') +
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
        ? stayInfo &&
          stayInfo.headline &&
          (stayInfo.headline.indexOf('legado') !== -1 ||
            stayInfo.headline.indexOf('referente') !== -1)
          ? stayInfo.headline
          : 'Después de tanto, el club quiere convertirte en referente.'
        : stayInfo && stayInfo.headline && stayInfo.headline.indexOf('Nadie') !== -1
          ? stayInfo.headline
          : 'Nadie llamó. ' +
            (stayInfo && stayInfo.headline
              ? stayInfo.headline
              : 'Quedarte también construye tu historia.');
      return scene({
        id: 'market',
        tone: 'quiet',
        kicker: 'Tu futuro',
        title: state.marketLegacy ? 'Tu club te necesita' : 'El mercado pasó de largo',
        lead: F().escapeHtml(coldLead),
        body:
          '<div class="mc-stay-card">' +
          '<div class="mc-scene-crest">' +
          C().clubBadgeHtml(currentClub, 'xxl') +
          '</div>' +
          '<h2 class="mc-scene__club">' +
          F().escapeHtml(currentClub ? currentClub.shortName || currentClub.name : 'Tu club') +
          '</h2>' +
          (stayInfo
            ? '<div class="mc-stay-trade">' +
              (stayInfo.ups || [])
                .map(function (u) {
                  return '<span class="mc-path-up">+ ' + F().escapeHtml(u) + '</span>';
                })
                .join('') +
              (stayInfo.downs || [])
                .map(function (d) {
                  return '<span class="mc-path-down">− ' + F().escapeHtml(d) + '</span>';
                })
                .join('') +
              '</div>'
            : '<p class="mc-scene__meta">Podés construir tu legado acá.</p>') +
          '</div>',
        actions:
          '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="market-stay">Quedarme</button>' +
          (canLoan
            ? '<button type="button" class="ct-button ct-button--secondary" data-mc-action="seek-loan">Buscar préstamo</button>'
            : '')
      });
    }

    var offer = offers[focusIndex];
    var isLoan = offer.kind === 'loan';
    var club = engine.getClub(offer.clubId);
    var comp = club ? engine.world.competitionsById[club.primaryCompetitionId] : null;
    var country = club ? engine.world.countriesById[club.countryId] : null;
    var more = focusIndex < offers.length - 1;
    var blurb =
      offer.blurb ||
      tradeoffPhrase(currentClub, club, offer);

    return scene({
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
        (isLoan ? '<p class="mc-offer-kind">Cesión</p>' : '') +
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
        '</span></article>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="market-compare" data-offer="' +
        F().escapeHtml(offer.id) +
        '">' +
        (isLoan ? 'Ver cesión' : 'Ver oferta') +
        '</button>' +
        (more
          ? '<button type="button" class="ct-button ct-button--secondary" data-mc-action="market-next-offer">Otra oferta</button>'
          : '') +
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="market-stay">Quedarme</button>' +
        (canLoan && !offers.some(function (o) {
          return o.kind === 'loan';
        })
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
    var consequence =
      NS.Rules && NS.Rules.transferConsequence
        ? NS.Rules.transferConsequence(state, offer, engine.world)
        : tradeoffPhrase(current, next, offer);
    return scene({
      id: 'compare',
      tone: 'decision',
      kicker: offer.kind === 'loan' ? '¿Cesión?' : '¿Te vas?',
      title: offer.kind === 'loan' ? 'Préstamo' : 'Tu decisión',
      lead: F().escapeHtml(consequence),
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
        tradeoffMetricsHtml(current, next, offer) +
        '<div class="mc-trade-row">' +
        tradeoffChips(current, next, offer) +
        '</div>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="market-sign" data-offer="' +
        F().escapeHtml(offer.id) +
        '">' +
        (offer.kind === 'loan' ? 'Ir cedido' : 'Fichar') +
        '</button>' +
        '<button type="button" class="ct-button ct-button--secondary" data-mc-action="market-stay">Quedarme</button>' +
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="open-market">Otra oferta</button>'
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
    var consequence =
      ctx.consequence ||
      (state._lastTransferLine
        ? state._lastTransferLine
        : 'Nuevo club. Nueva presión. Nueva oportunidad.');
    return scene({
      id: 'transfer',
      tone: 'transfer',
      kicker: 'Nuevo capítulo',
      title: 'Cambiaste de club',
      lead: F().escapeHtml(club ? club.name : 'Nuevo club'),
      body:
        (prev
          ? '<div class="mc-vs" style="margin-bottom:1rem">' +
            '<div class="mc-vs__col">' +
            C().clubBadgeHtml(prev, 'xl') +
            '<strong>' +
            F().escapeHtml(prev.shortName || prev.name) +
            '</strong></div>' +
            '<div class="mc-vs__mark" aria-hidden="true">→</div>' +
            '<div class="mc-vs__col is-next">' +
            C().clubBadgeHtml(club, 'xxl') +
            '<strong>' +
            F().escapeHtml(club ? club.shortName || club.name : '') +
            '</strong></div></div>'
          : '<div class="mc-scene-crest mc-scene-crest--pulse">' +
            C().clubBadgeHtml(club, 'xxl') +
            '</div>') +
        (comp ? '<p class="mc-scene__meta">' + competitionMarkHtml(comp, 'md') + '</p>' : '') +
        '<p class="mc-poster-line">' +
        F().escapeHtml(consequence) +
        '</p>' +
        '<p class="mc-scene__meta"><strong>' +
        F().escapeHtml(state.player.name) +
        '</strong> · ' +
        state.age +
        ' años · ' +
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
        ? UI.Narrative.seasonNarrative(season, state, engine && engine.world)
        : seasonMomentLine(season);

    var fs =
      NS.Rules && NS.Rules.formStatus
        ? NS.Rules.formStatus(season.formAfter != null ? season.formAfter : state.form)
        : null;
    var seasonAge = season.age != null ? season.age : state.age;
    var chapter =
      season.ageChapter ||
      (UI.Narrative && UI.Narrative.ageHeadline
        ? UI.Narrative.ageHeadline(seasonAge, state)
        : '');
    var roleLabel = season.role
      ? F().ROLE_LABELS[season.role] || season.role
      : '';

    var highlightBits = [];
    (season.titles || []).slice(0, 2).forEach(function (t) {
      highlightBits.push(
        '<p class="mc-recap-highlight mc-recap-highlight--title">🏆 ' +
          F().escapeHtml(t.shortName || t.name) +
          '</p>'
      );
    });
    (season.awards || [])
      .filter(function (a) {
        return (a.importance || 0) >= 70 || a.awardId === 'award_ballon_dor';
      })
      .slice(0, 2)
      .forEach(function (a) {
        highlightBits.push(
          '<p class="mc-recap-highlight mc-recap-highlight--award">⭐ ' +
            F().escapeHtml(a.shortName || a.name) +
            '</p>'
        );
      });
    if (season.firstCallUp) {
      highlightBits.push(
        '<p class="mc-recap-highlight mc-recap-highlight--nt">🌎 Debut con la selección</p>'
      );
    }

    return scene({
      id: 'recap',
      tone: tone,
      kicker: F().escapeHtml(season.seasonLabel || F().seasonLabel(season.seasonIndex)),
      title: F().escapeHtml(narrative),
      lead:
        '<span class="mc-recap-age">' +
        seasonAge +
        ' AÑOS</span> · ' +
        F().escapeHtml(club ? club.shortName || club.name : 'Tu club'),
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
        (roleLabel ? ' · ' + F().escapeHtml(roleLabel) : '') +
        '</p>' +
        (chapter
          ? '<p class="mc-age-chapter">' + F().escapeHtml(chapter) + '</p>'
          : '') +
        '</div></div>' +
        '<div class="mc-recap-ovrline">' +
        '<span>' +
        ovrBefore +
        '</span><span class="mc-recap-ovrline__arrow" aria-hidden="true">→</span>' +
        '<strong>' +
        ovrAfter +
        ' OVR</strong></div>' +
        '<div class="mc-recap-numbers">' +
        F().primarySeasonStatsHtml(
          season,
          (player && player.position) || (state.player && state.player.position)
        ) +
        '</div>' +
        (fs
          ? '<p class="mc-form-chip mc-form-chip--' +
            F().escapeHtml(fs.id) +
            '">' +
            F().escapeHtml(fs.label) +
            '</p>'
          : '') +
        (highlightBits.length
          ? '<div class="mc-recap-highlights">' + highlightBits.join('') + '</div>'
          : '') +
        '</div>',
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="after-recap">Continuar</button>'
    });
  }

  function preSeasonScreen(ctx) {
    var state = ctx.state;
    var engine = ctx.engine;
    var club = engine.getClub(state.clubId);
    var sit =
      UI.Narrative && UI.Narrative.preSeasonLine
        ? UI.Narrative.preSeasonLine(state, engine.world)
        : NS.Rules.seasonSituation
          ? NS.Rules.seasonSituation(state, engine.world)
          : { age: state.age, chapter: '', line: 'Listo para salir a la cancha.' };
    var seasonN = Math.max(1, (state.seasonIndex || 0) + 1);
    return scene({
      id: 'preseason',
      tone: sit.tone || 'hub',
      kicker: F().escapeHtml(F().seasonLabel(state.seasonIndex)),
      title: sit.age + ' AÑOS',
      lead: F().escapeHtml(
        seasonN === 1 ? 'PRIMERA TEMPORADA' : sit.chapter || 'TEMPORADA ' + seasonN
      ),
      body:
        '<div class="mc-scene-crest">' +
        C().clubBadgeHtml(club, 'xxl') +
        '</div>' +
        '<p class="mc-scene__club">' +
        F().escapeHtml(club ? club.shortName || club.name : 'Tu club') +
        '</p>' +
        '<p class="mc-poster-line">' +
        F().escapeHtml(sit.line || '') +
        '</p>' +
        '<div class="mc-pre-meta">' +
        '<div><span>Rol</span><strong>' +
        F().escapeHtml(sit.roleLabel || F().ROLE_LABELS[sit.role] || '—') +
        '</strong></div>' +
        '<div><span>Forma</span><strong>' +
        F().escapeHtml(sit.formLabel || '—') +
        '</strong></div>' +
        '<div><span>Valor</span><strong>' +
        F().escapeHtml(sit.valueLabel || '—') +
        '</strong></div></div>' +
        (sit.objective
          ? '<p class="mc-pre-objective"><span>Objetivo</span> ' +
            F().escapeHtml(sit.objective) +
            '</p>'
          : ''),
      actions:
        '<button type="button" class="ct-button ct-button--primary ct-button--lg" data-mc-action="confirm-season">Jugar temporada</button>' +
        '<button type="button" class="ct-button ct-button--ghost" data-mc-action="back-hub">Volver</button>'
    });
  }

  function ageUpScreen(ctx) {
    var fromAge = ctx.fromAge;
    var toAge = ctx.toAge;
    return scene({
      id: 'age-up',
      tone: 'age',
      kicker: 'Nueva temporada',
      title: String(toAge) + ' AÑOS',
      lead: F().escapeHtml(
        (UI.Narrative && UI.Narrative.ageHeadline
          ? UI.Narrative.ageHeadline(toAge, ctx.state)
          : '') || ''
      ),
      body:
        '<div class="mc-age-up" aria-live="polite">' +
        '<span>' +
        fromAge +
        '</span>' +
        '<span class="mc-age-up__arrow" aria-hidden="true">↓</span>' +
        '<strong>' +
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

    return scene({
      id: 'retire',
      tone: 'retire',
      kicker: 'Tu legado',
      title: archLabel || 'Tu historia terminó',
      lead: F().escapeHtml(story),
      body:
        '<p class="mc-scene__meta">' +
        (state.ageStart != null ? state.ageStart : 17) +
        ' → ' +
        state.age +
        ' años · ' +
        seasons +
        ' temporadas · Pico ' +
        (state.peakRating || state.rating) +
        ' OVR</p>' +
        timelineHtml(state, engine) +
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

  function timelineHtml(state, engine) {
    if (!NS.Rules || !NS.Rules.clubTimelineSummary) return '';
    var rows = NS.Rules.clubTimelineSummary(state, engine.world);
    if (!rows.length) return '';
    return (
      '<div class="mc-career-timeline" aria-label="Historial de clubes">' +
      rows
        .map(function (row) {
          return (
            '<p><strong>' +
            row.ageStart +
            (row.ageEnd !== row.ageStart ? '–' + row.ageEnd : '') +
            '</strong> ' +
            F().escapeHtml(row.name) +
            (row.onLoan ? ' <span>(cesión)</span>' : '') +
            '</p>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function seasonFeedbackBody(payload) {
    var season = payload.season;
    var position =
      (payload.state && payload.state.player && payload.state.player.position) ||
      (season && season.position) ||
      'MID';
    return (
      '<p class="mc-kicker">' +
      F().escapeHtml(season.seasonLabel || F().seasonLabel(season.seasonIndex)) +
      '</p>' +
      '<div class="mc-scene-stats">' +
      F().primarySeasonStatsHtml(season, position) +
      '</div>'
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
