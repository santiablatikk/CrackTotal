/**
 * Scene renderers. Display engine state only — no simulation rules.
 * FASE 5B: one scene = one idea = one emotion = one decision.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  var POSITIONS = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
  var POS_LABEL = {
    GK: 'Arquero',
    CB: 'Central',
    LB: 'Lateral izq.',
    RB: 'Lateral der.',
    DM: 'Mediocentro def.',
    CM: 'Mediocampista',
    AM: 'Enganche',
    LW: 'Extremo izq.',
    RW: 'Extremo der.',
    ST: 'Delantero'
  };

  function clubName(id) {
    var c = NS.Providers.clubs.getById(id);
    return c ? c.name : id;
  }

  function clubShort(id) {
    var c = NS.Providers.clubs.getById(id);
    return c ? c.shortName || c.name : id;
  }

  function clubMeta(id) {
    var c = NS.Providers.clubs.getById(id);
    if (!c) return '';
    return [c.league || c.countryCode, c.countryCode].filter(Boolean).join(' · ');
  }

  function profilesFor(position) {
    var list = (NS.data && NS.data.profiles && NS.data.profiles.profiles) || [];
    var aliases = { GK: 'POR', CB: 'DFC', LB: 'LI', RB: 'LD', DM: 'MCD', CM: 'MC', AM: 'MCO', LW: 'EI', RW: 'ED', ST: 'DC' };
    var local = aliases[position] || position;
    var matched = list.filter(function (p) {
      return (p.positions || []).indexOf(local) !== -1 || (p.positions || []).indexOf(position) !== -1;
    });
    return matched.length ? matched : list;
  }

  function playableCountries() {
    var all = (NS.data && NS.data.countries && NS.data.countries.countries) || [];
    var priority = ['AR', 'BR', 'UY', 'ES', 'GB', 'IT', 'DE', 'FR', 'PT', 'MX', 'CO', 'CL'];
    var playable = all.filter(function (c) {
      return c.playable !== false;
    });
    var byCode = {};
    playable.forEach(function (c) {
      byCode[c.code] = c;
    });
    var ordered = [];
    priority.forEach(function (code) {
      if (byCode[code]) ordered.push(byCode[code]);
    });
    playable.forEach(function (c) {
      if (priority.indexOf(c.code) === -1) ordered.push(c);
    });
    return ordered.slice(0, 12);
  }

  function gainRisk(opt) {
    return {
      gains: (opt.gains || []).slice(0, 2),
      risks: (opt.risks || []).slice(0, 2)
    };
  }

  /** Engine expectedMinutes is match-load, not clock minutes. */
  function expectedLoadLabel(n) {
    if (n == null) return '';
    if (n <= 45) return '~' + n + ' PJ';
    return 'MIN ~' + n;
  }

  var Screens = {
    INTRO: function (session) {
      var C = UI.Components;
      var scene = C.Scene('INTRO');
      var lay = C.el('div', 'mc-intro');
      var copy = C.el('div', 'mc-intro__copy');
      copy.appendChild(C.text('div', 'mc-kicker', 'MI CARRERA'));
      copy.appendChild(C.CareerHeadline('TU HISTORIA\nEMPIEZA AQUÍ'));
      copy.appendChild(C.text('p', 'mc-sub mc-sub--tight', 'Modo carrera. Tu legado.'));
      var actions = C.el('div', 'mc-actions');
      actions.appendChild(C.PrimaryCTA('EMPEZAR MI HISTORIA', 'start'));
      if (NS.Persistence.hasSave()) {
        actions.appendChild(C.SecondaryCTA('CONTINUAR PARTIDA', 'continue'));
      }
      copy.appendChild(actions);
      var art = C.el('div', 'mc-intro__art');
      art.appendChild(C.text('div', 'mc-intro__years', '16–19'));
      art.appendChild(C.text('div', 'mc-intro__years-u', 'EL COMIENZO'));
      lay.appendChild(copy);
      lay.appendChild(art);
      scene.appendChild(lay);
      return scene;
    },

    CREATE: function (session) {
      var C = UI.Components;
      var draft = session.draft || {};
      var step = session.createStep || 'name';
      var scene = C.Scene('CREATE');
      scene.setAttribute('data-step', step);

      if (step === 'name') {
        scene.appendChild(C.text('div', 'mc-kicker', 'NOMBRE'));
        scene.appendChild(C.CareerHeadline('¿CÓMO TE\nLLAMÁS?'));
        var input = C.el('input', 'mc-input mc-input--hero');
        input.type = 'text';
        input.maxLength = 24;
        input.placeholder = 'Tu nombre';
        input.value = draft.name || '';
        input.setAttribute('data-field', 'name');
        scene.appendChild(input);
        scene.appendChild(C.PrimaryCTA('SIGUIENTE', 'create-next'));
      } else if (step === 'country') {
        scene.appendChild(C.text('div', 'mc-kicker', 'PAÍS'));
        scene.appendChild(C.CareerHeadline('¿DE DÓNDE\nSOS?'));
        var rail = C.el('div', 'mc-rail mc-rail--nations');
        playableCountries().forEach(function (c) {
          var btn = C.el('button', 'mc-rail__item' + (draft.country === c.code ? ' is-on' : ''));
          btn.type = 'button';
          btn.setAttribute('data-action', 'pick-country');
          btn.setAttribute('data-value', c.code);
          btn.appendChild(C.Flag(c.code, 'md'));
          btn.appendChild(C.text('span', 'mc-rail__name', c.name));
          rail.appendChild(btn);
        });
        scene.appendChild(rail);
        scene.appendChild(C.PrimaryCTA('SIGUIENTE', 'create-next'));
      } else if (step === 'age') {
        var age = draft.age || 17;
        scene.appendChild(C.text('div', 'mc-kicker', 'EDAD'));
        scene.appendChild(C.text('div', 'mc-age-hero', String(age)));
        scene.appendChild(C.text('div', 'mc-age-hero__u', 'AÑOS'));
        var ages = C.el('div', 'mc-age-rail');
        [16, 17, 18, 19].forEach(function (a) {
          var btn = C.el('button', 'mc-age-rail__n' + (age === a ? ' is-on' : ''));
          btn.type = 'button';
          btn.setAttribute('data-action', 'pick-age');
          btn.setAttribute('data-value', String(a));
          btn.textContent = a;
          ages.appendChild(btn);
        });
        scene.appendChild(ages);
        scene.appendChild(C.PrimaryCTA('SIGUIENTE', 'create-next'));
      } else if (step === 'position') {
        scene.appendChild(C.text('div', 'mc-kicker', 'POSICIÓN'));
        scene.appendChild(C.CareerHeadline('¿DÓNDE\nJUGÁS?'));
        var posRail = C.el('div', 'mc-pos-rail');
        POSITIONS.forEach(function (pos) {
          var btn = C.el('button', 'mc-pos' + (draft.position === pos ? ' is-on' : ''));
          btn.type = 'button';
          btn.setAttribute('data-action', 'pick-position');
          btn.setAttribute('data-value', pos);
          btn.appendChild(C.text('span', 'mc-pos__code', pos));
          btn.appendChild(C.text('span', 'mc-pos__name', POS_LABEL[pos]));
          posRail.appendChild(btn);
        });
        scene.appendChild(posRail);
        scene.appendChild(C.PrimaryCTA('SIGUIENTE', 'create-next'));
      } else {
        scene.appendChild(C.text('div', 'mc-kicker', 'ESTILO'));
        scene.appendChild(C.CareerHeadline('¿CÓMO\nJUGÁS?'));
        var styles = C.el('div', 'mc-style-rail');
        profilesFor(draft.position || 'CM').forEach(function (pr) {
          var btn = C.el('button', 'mc-style' + (draft.profile === pr.id ? ' is-on' : ''));
          btn.type = 'button';
          btn.setAttribute('data-action', 'pick-profile');
          btn.setAttribute('data-value', pr.id);
          btn.appendChild(C.text('span', 'mc-style__name', pr.name));
          styles.appendChild(btn);
        });
        scene.appendChild(styles);
        scene.appendChild(C.PrimaryCTA('VER CLUBES', 'create-finish'));
      }
      return scene;
    },

    FIRST_CLUB: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var scene = C.Scene('FIRST_CLUB');
      scene.appendChild(C.text('div', 'mc-kicker', 'PRIMER CLUB'));
      scene.appendChild(C.CareerHeadline('ELEGÍ TU\nCAMINO'));
      scene.appendChild(C.text('p', 'mc-sub', 'Tres puertas. Una historia.'));
      var row = C.el('div', 'mc-paths');
      var order = { minutes: 0, balance: 1, prestige: 2 };
      var opts = (session.firstClubs || []).slice().sort(function (a, b) {
        return (order[a.path] != null ? order[a.path] : 9) - (order[b.path] != null ? order[b.path] : 9);
      });
      opts.forEach(function (opt) {
        var meta = N.pathMeta(opt.path);
        var club = NS.Providers.clubs.getById(opt.clubId);
        var panel = C.el('article', 'mc-path mc-path--' + meta.tone);
        /* CAMINO → CLUB → CONSECUENCIA */
        panel.appendChild(C.text('div', 'mc-path__tag', meta.title));
        panel.appendChild(C.text('div', 'mc-path__promise', meta.promise));
        var crest = C.el('div', 'mc-path__crest');
        crest.appendChild(C.Badge(opt.clubId, 'xl'));
        panel.appendChild(crest);
        var body = C.el('div', 'mc-path__body');
        body.appendChild(C.text('h3', 'mc-path__name', club ? club.shortName || club.name : opt.clubId));
        body.appendChild(C.text('div', 'mc-path__meta', clubMeta(opt.clubId)));
        body.appendChild(
          C.text(
            'div',
            'mc-path__role',
            [
              N.roleLabel(opt.role),
              opt.expectedMinutes != null && opt.expectedMinutes >= 200
                ? '~' + opt.expectedMinutes + ' MIN'
                : ''
            ]
              .filter(Boolean)
              .join(' · ')
          )
        );
        var trade = C.el('div', 'mc-path__axes');
        trade.appendChild(
          C.text('div', 'mc-path__axis is-gain', 'GANÁS · ' + ((opt.gains || [])[0] || meta.gainLabel || '').toUpperCase())
        );
        trade.appendChild(
          C.text('div', 'mc-path__axis is-risk', 'ARRIESGÁS · ' + ((opt.risks || [])[0] || meta.riskLabel || '').toUpperCase())
        );
        body.appendChild(trade);
        var cta = C.PrimaryCTA('ELEGIR', 'pick-first-club');
        cta.setAttribute('data-club', opt.clubId);
        body.appendChild(cta);
        panel.appendChild(body);
        row.appendChild(panel);
      });
      scene.appendChild(row);
      return scene;
    },

    DEBUT: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var career = session.career;
      var scene = C.Scene('DEBUT');
      var lay = C.el('div', 'mc-debut');
      var copy = C.el('div', 'mc-debut__copy');
      copy.appendChild(C.text('div', 'mc-kicker', 'DEBUT'));
      copy.appendChild(C.text('div', 'mc-debut__age', String(career.player.age)));
      copy.appendChild(C.CareerHeadline('TU HISTORIA\nCOMIENZA'));
      copy.appendChild(C.text('div', 'mc-debut__chapter', 'PRIMER CAPÍTULO'));
      lay.appendChild(copy);
      var crest = C.el('div', 'mc-debut__crest');
      crest.appendChild(C.Badge(career.currentClubId, 'xl'));
      crest.appendChild(C.text('h2', 'mc-display', clubShort(career.currentClubId)));
      crest.appendChild(C.text('div', 'mc-path__meta', clubMeta(career.currentClubId)));
      crest.appendChild(C.text('div', 'mc-role', N.roleLabel(career.role)));
      lay.appendChild(crest);
      scene.appendChild(lay);
      scene.appendChild(C.PrimaryCTA('EMPEZAR TEMPORADA', 'to-preseason'));
      return scene;
    },

    PRESEASON: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var career = session.career;
      var scene = C.Scene('PRESEASON');
      var lay = C.el('div', 'mc-preseason');
      var board = C.el('div', 'mc-season-board');
      board.appendChild(C.text('div', 'mc-kicker', 'ESTA TEMPORADA'));
      board.appendChild(C.text('div', 'mc-season-board__age', String(career.player.age)));
      board.appendChild(C.text('div', 'mc-season-board__age-u', 'AÑOS'));
      board.appendChild(C.text('div', 'mc-season-board__ovr', String(career.player.overall)));
      board.appendChild(C.text('div', 'mc-season-board__ovr-u', 'OVR'));
      board.appendChild(C.text('div', 'mc-role mc-role--lg', N.roleLabel(career.role).toUpperCase()));
      board.appendChild(C.text('p', 'mc-quote mc-quote--hero', N.preseasonLine(career)));
      lay.appendChild(board);
      var crest = C.el('div', 'mc-preseason__crest');
      crest.appendChild(C.Badge(career.currentClubId, 'xl'));
      crest.appendChild(C.text('div', 'mc-display', clubShort(career.currentClubId)));
      crest.appendChild(C.text('div', 'mc-path__meta', clubMeta(career.currentClubId)));
      lay.appendChild(crest);
      scene.appendChild(lay);
      scene.appendChild(C.PrimaryCTA('JUGAR TEMPORADA', 'to-season'));
      return scene;
    },

    SEASON: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var career = session.career;
      var scene = C.Scene('SEASON');
      var lay = C.el('div', 'mc-season-play');
      var left = C.el('div', 'mc-season-play__main');
      left.appendChild(C.text('div', 'mc-kicker', 'ANTES DEL PARTIDO'));
      left.appendChild(C.text('div', 'mc-ovr-solo', String(career.player.overall)));
      left.appendChild(C.text('div', 'mc-ovr-solo__u', 'OVR'));
      left.appendChild(
        C.text(
          'div',
          'mc-season-line__t',
          career.player.age + ' AÑOS · ' + N.roleLabel(career.role).toUpperCase()
        )
      );
      var lastSeason = (career.seasons || [])[(career.seasons || []).length - 1];
      if (lastSeason) {
        var feelPrev = N.progressionFeel(lastSeason, career);
        if (feelPrev) {
          left.appendChild(C.text('div', 'mc-progress-feel mc-progress-feel--' + feelPrev, N.progressionLine(feelPrev)));
        }
      }
      left.appendChild(C.text('p', 'mc-quote mc-quote--hero', N.seasonStakeLine(career)));
      lay.appendChild(left);
      var right = C.el('div', 'mc-season-play__crest');
      right.appendChild(C.Badge(career.currentClubId, 'xl'));
      right.appendChild(C.text('div', 'mc-display', clubShort(career.currentClubId)));
      lay.appendChild(right);
      scene.appendChild(lay);
      scene.appendChild(C.PrimaryCTA('JUGAR LA TEMPORADA', 'play-season'));
      return scene;
    },

    RECAP: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var career = session.career;
      var season = session.pending && session.pending.season;
      var scene = C.Scene('RECAP');
      if (!season) {
        scene.appendChild(C.text('p', 'mc-sub', 'Sin temporada.'));
        return scene;
      }
      var beat = season.beat;
      var feel = N.progressionFeel(season, career);
      scene.appendChild(C.text('div', 'mc-kicker', 'ASÍ FUE TU AÑO'));
      if (beat) {
        scene.appendChild(C.text('div', 'mc-season-beat', N.seasonBeatLine(beat)));
      }
      scene.appendChild(
        C.text(
          'div',
          'mc-year',
          [String(season.seasonYear), season.age + ' AÑOS', clubShort(season.clubId)].filter(Boolean).join(' · ')
        )
      );
      var crest = C.el('div', 'mc-recap-club');
      crest.appendChild(C.Badge(season.clubId, 'lg'));
      scene.appendChild(crest);
      scene.appendChild(C.CareerHeadline(N.recapHeadline(season, career)));
      if (feel) {
        scene.appendChild(C.text('div', 'mc-progress-feel mc-progress-feel--' + feel, N.progressionLine(feel)));
      }
      scene.appendChild(C.OVRChange(season.overallBefore, season.overallAfter));
      var stats = C.el('div', 'mc-recap-stats mc-recap-stats--editorial');
      stats.appendChild(C.Stat('PJ', season.matches));
      if (NS.Engine.Rules.isGoalkeeper(career.player.position)) {
        stats.appendChild(C.Stat('Vallas', season.cleanSheets || 0));
      } else {
        stats.appendChild(C.Stat('G', season.goals));
        stats.appendChild(C.Stat('A', season.assists));
      }
      scene.appendChild(stats);
      scene.appendChild(C.PrimaryCTA('VER CÓMO SIGUE', 'after-recap'));
      return scene;
    },

    TROPHY: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var ev = session.eventQueue && session.eventQueue[0];
      var career = session.career;
      var scene = C.Scene('TROPHY');
      scene.classList.add('mc-scene--celebrate');
      if (!ev) return scene;
      var id = ev.competitionId;
      var clubId = ev.clubId || career.currentClubId;
      var comp = NS.Providers.competitions.getById(id);
      var shortName = comp ? (comp.shortName || comp.name || id) : id;
      scene.appendChild(C.text('div', 'mc-kicker mc-kicker--gold', N.trophyTitle(id)));
      var hero = C.el('div', 'mc-trophy-hero');
      hero.appendChild(C.Trophy(id, 'xl'));
      scene.appendChild(hero);
      scene.appendChild(C.text('div', 'mc-trophy-comp', String(shortName).toUpperCase()));
      scene.appendChild(
        C.text(
          'div',
          'mc-year',
          [ev.seasonYear || '', ev.age != null ? ev.age + ' AÑOS' : career.player.age + ' AÑOS']
            .filter(Boolean)
            .join(' · ')
        )
      );
      if (clubId) {
        var clubRow = C.el('div', 'mc-trophy-club');
        clubRow.appendChild(C.Badge(clubId, 'md'));
        clubRow.appendChild(C.text('span', 'mc-trophy-club__n', clubShort(clubId)));
        scene.appendChild(clubRow);
      }
      var phrase = N.trophyPhrase(id, { first: !!ev.first, clubId: clubId });
      if (phrase) scene.appendChild(C.text('p', 'mc-quote mc-quote--hero', phrase));
      var trophyCta = C.PrimaryCTA('SEGUIR', 'next-event');
      trophyCta.classList.add('mc-cta--gold');
      scene.appendChild(trophyCta);
      return scene;
    },

    AWARD: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var ev = session.eventQueue && session.eventQueue[0];
      var scene = C.Scene('AWARD');
      if (!ev) return scene;
      if (ev.awardId === 'ballon_dor') scene.classList.add('mc-scene--ballon');
      else scene.classList.add('mc-scene--celebrate');
      scene.appendChild(C.text('div', 'mc-kicker mc-kicker--gold', 'PREMIO'));
      var awardHero = C.el('div', 'mc-trophy-hero mc-award-hero');
      awardHero.appendChild(C.Award(ev.awardId, 'xl'));
      scene.appendChild(awardHero);
      scene.appendChild(C.CareerHeadline(N.awardTitle(ev.awardId)));
      if (ev.awardId === 'ballon_dor') {
        scene.appendChild(C.text('div', 'mc-display', session.career.player.name));
      }
      scene.appendChild(C.text('div', 'mc-year', String(ev.seasonYear || '')));
      var awardCta = C.PrimaryCTA('SEGUIR', 'next-event');
      awardCta.classList.add('mc-cta--gold');
      scene.appendChild(awardCta);
      return scene;
    },

    MOMENT: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var ev = session.eventQueue && session.eventQueue[0];
      var scene = C.Scene('MOMENT');
      if (!ev) return scene;
      scene.appendChild(C.el('div', 'mc-moment-mark'));
      scene.appendChild(C.text('div', 'mc-kicker', N.momentKicker(ev.type)));
      scene.appendChild(C.CareerHeadline(N.momentLine(ev.type)));
      if (ev.payload && ev.payload.to) scene.appendChild(C.Badge(ev.payload.to, 'xl'));
      else if (ev.payload && ev.payload.clubId) scene.appendChild(C.Badge(ev.payload.clubId, 'xl'));
      else if (session.career && session.career.currentClubId) scene.appendChild(C.Badge(session.career.currentClubId, 'lg'));
      scene.appendChild(
        C.text(
          'div',
          'mc-year',
          [ev.age != null ? ev.age + ' AÑOS' : '', ev.seasonYear || ''].filter(Boolean).join(' · ')
        )
      );
      scene.appendChild(C.PrimaryCTA('SEGUIR', 'next-event'));
      return scene;
    },

    AGE_UP: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var season = session.pending && session.pending.season;
      var scene = C.Scene('AGE_UP');
      var before = season ? season.age : session.career.player.age - 1;
      var after = season ? season.ageAfter : session.career.player.age;
      scene.appendChild(C.text('div', 'mc-kicker', 'EL TIEMPO'));
      var wrap = C.el('div', 'mc-age-flow mc-age-flow--stage');
      wrap.appendChild(C.text('div', 'mc-age-flow__n', before));
      wrap.appendChild(C.text('div', 'mc-age-flow__arrow', '↓'));
      wrap.appendChild(C.text('div', 'mc-age-flow__n is-next', after));
      scene.appendChild(wrap);
      scene.appendChild(C.text('div', 'mc-age-chapter', N.ageChapterTitle(after)));
      scene.appendChild(C.text('p', 'mc-quote mc-quote--hero', N.ageUpLine(before, after, session.career)));
      scene.appendChild(C.PrimaryCTA('AL MERCADO', 'to-market'));
      return scene;
    },

    MARKET: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var career = session.career;
      var market = session.pending && session.pending.market;
      var scene = C.Scene('MARKET');
      scene.appendChild(C.text('div', 'mc-kicker', 'MERCADO'));
      scene.appendChild(C.CareerHeadline('¿ME QUEDO\nO DOY EL SALTO?'));
      scene.appendChild(C.text('p', 'mc-quote', N.marketSituationLine(market && market.situation)));

      var dual = C.el('div', 'mc-market-dual');
      var stayCol = C.el('div', 'mc-market-col mc-market-col--stay');
      stayCol.appendChild(C.text('div', 'mc-market-col__h', 'QUEDARME'));
      stayCol.appendChild(C.Badge(career.currentClubId, 'xl'));
      stayCol.appendChild(C.text('div', 'mc-display', clubShort(career.currentClubId)));
      stayCol.appendChild(C.text('div', 'mc-change-offer__meta', clubMeta(career.currentClubId)));

      var changeCol = C.el('div', 'mc-market-col mc-market-col--change');
      changeCol.appendChild(C.text('div', 'mc-market-col__h', 'CAMBIAR'));

      ((market && market.options) || []).forEach(function (opt, idx) {
        if (opt.type === 'stay' || opt.type === 'loan_return') {
          var stayCta = C.PrimaryCTA(opt.type === 'loan_return' ? 'VOLVER' : 'QUEDARME', 'pick-offer');
          stayCta.setAttribute('data-index', String(idx));
          stayCol.appendChild(
            C.text(
              'div',
              'mc-path__axis is-gain',
              ((opt.gains || [])[0] || 'CONTINUIDAD').toUpperCase()
            )
          );
          if (opt.expectedMinutes != null) {
            stayCol.appendChild(
              C.text('div', 'mc-change-offer__meta', 'CARGA · ' + expectedLoadLabel(opt.expectedMinutes))
            );
          }
          stayCol.appendChild(stayCta);
        } else if (opt.clubId) {
          var offer = C.el('button', 'mc-change-offer');
          offer.type = 'button';
          offer.setAttribute('data-action', 'pick-offer');
          offer.setAttribute('data-index', String(idx));
          offer.appendChild(C.Badge(opt.clubId, 'lg'));
          offer.appendChild(
            C.text('span', 'mc-move-kind', N.marketMoveLabel(opt.kind, opt.type))
          );
          offer.appendChild(C.text('span', 'mc-change-offer__n', clubShort(opt.clubId)));
          offer.appendChild(
            C.text(
              'span',
              'mc-change-offer__m',
              [opt.leagueName || clubMeta(opt.clubId), N.roleLabel(opt.role)].filter(Boolean).join(' · ')
            )
          );
          if (opt.expectedMinutes != null) {
            offer.appendChild(
              C.text('span', 'mc-change-offer__meta', expectedLoadLabel(opt.expectedMinutes))
            );
          }
          var gr = gainRisk(opt);
          if (gr.gains[0]) {
            offer.appendChild(C.text('span', 'mc-change-offer__gain', '⊕ ' + String(gr.gains[0]).toUpperCase()));
          }
          if (gr.risks[0]) {
            offer.appendChild(C.text('span', 'mc-change-offer__risk', '⊖ ' + String(gr.risks[0]).toUpperCase()));
          }
          changeCol.appendChild(offer);
        }
      });

      dual.appendChild(stayCol);
      dual.appendChild(changeCol);
      scene.appendChild(dual);
      return scene;
    },

    COMPARE: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var career = session.career;
      var opt = session.compareOffer;
      var scene = C.Scene('COMPARE');
      if (!opt || !opt.clubId) {
        scene.appendChild(C.text('p', 'mc-sub', 'Sin oferta.'));
        scene.appendChild(C.SecondaryCTA('VOLVER', 'cancel-compare'));
        return scene;
      }
      scene.appendChild(C.text('div', 'mc-kicker', 'COMPARÁ'));
      scene.appendChild(C.CareerHeadline('¿TE VAS?'));
      var vs = C.el('div', 'mc-vs');
      var left = C.el('div', 'mc-vs__side');
      left.appendChild(C.Badge(career.currentClubId, 'xl'));
      left.appendChild(C.text('div', 'mc-vs__name', clubShort(career.currentClubId)));
      left.appendChild(C.text('div', 'mc-vs__tag', 'AHORA'));
      left.appendChild(C.text('div', 'mc-change-offer__meta', clubMeta(career.currentClubId)));
      var mid = C.text('div', 'mc-vs__mark', '→');
      var right = C.el('div', 'mc-vs__side');
      right.appendChild(C.Badge(opt.clubId, 'xl'));
      right.appendChild(C.text('div', 'mc-vs__name', clubShort(opt.clubId)));
      right.appendChild(
        C.text('div', 'mc-vs__tag', opt.type === 'loan' ? 'PRÉSTAMO' : opt.kind === 'HOME' ? 'CASA' : 'DESTINO')
      );
      right.appendChild(
        C.text('div', 'mc-change-offer__meta', opt.leagueName || clubMeta(opt.clubId))
      );
      vs.appendChild(left);
      vs.appendChild(mid);
      vs.appendChild(right);
      scene.appendChild(vs);

      var axes = C.el('div', 'mc-vs-axes');
      var gr = gainRisk(opt);
      axes.appendChild(C.text('div', 'mc-path__axis is-gain', 'GANÁS · ' + (gr.gains[0] || 'SALTO').toUpperCase()));
      axes.appendChild(C.text('div', 'mc-path__axis is-risk', 'ARRIESGÁS · ' + (gr.risks[0] || 'RIESGO').toUpperCase()));
      if (opt.expectedMinutes != null) {
        axes.appendChild(C.text('div', 'mc-vs-axes__m', 'CARGA ESPERADA · ' + expectedLoadLabel(opt.expectedMinutes)));
      }
      if (opt.role) axes.appendChild(C.text('div', 'mc-vs-axes__m', 'ROL · ' + N.roleLabel(opt.role).toUpperCase()));
      if (opt.kind || opt.type) {
        axes.appendChild(C.text('div', 'mc-vs-axes__m', 'MOVIMIENTO · ' + N.marketMoveLabel(opt.kind, opt.type)));
      }
      scene.appendChild(axes);

      var actions = C.el('div', 'mc-actions');
      actions.appendChild(
        C.PrimaryCTA(opt.type === 'loan' ? 'ACEPTAR EL DESAFÍO' : 'DAR EL SALTO', 'confirm-compare')
      );
      actions.appendChild(C.SecondaryCTA('QUEDARME', 'cancel-compare'));
      scene.appendChild(actions);
      return scene;
    },

    TRANSFER: function (session) {
      var C = UI.Components;
      var offer = session.selectedOffer;
      var career = session.career;
      var scene = C.Scene('TRANSFER');
      var from =
        offer && offer.fromClubId
          ? offer.fromClubId
          : (career.transfers[career.transfers.length - 1] || {}).fromClubId;
      var to = career.currentClubId;
      scene.appendChild(C.text('div', 'mc-kicker', offer && offer.type === 'loan' ? 'CESIÓN' : 'FICHAJE'));
      var crests = C.el('div', 'mc-transfer');
      if (from) crests.appendChild(C.Badge(from, 'lg'));
      crests.appendChild(C.text('div', 'mc-transfer__arrow', '→'));
      crests.appendChild(C.Badge(to, 'xl'));
      scene.appendChild(crests);
      scene.appendChild(C.CareerHeadline(offer && offer.type === 'loan' ? 'NUEVA CASA.' : 'NUEVO CLUB.'));
      scene.appendChild(C.text('div', 'mc-display', clubName(to)));
      scene.appendChild(
        C.text('div', 'mc-path__meta', career.player.age + ' AÑOS · OVR ' + career.player.overall)
      );
      scene.appendChild(C.PrimaryCTA('EMPEZAR NUEVO CAPÍTULO', 'after-transfer'));
      return scene;
    },

    RETIREMENT: function (session) {
      var C = UI.Components;
      var retirement = session.pending && session.pending.retirement;
      var career = session.career;
      var scene = C.Scene('RETIREMENT');
      scene.appendChild(C.text('div', 'mc-kicker', 'EL FINAL'));
      scene.appendChild(C.CareerHeadline('¿COLGÁS LOS\nBOTINES?'));
      scene.appendChild(C.Age(career.player.age, { huge: true }));
      scene.appendChild(
        C.text(
          'p',
          'mc-quote mc-quote--hero',
          retirement && retirement.force
            ? 'El cuerpo ya no da para más.'
            : 'Podés seguir… o cerrar el capítulo.'
        )
      );
      scene.appendChild(
        C.text(
          'div',
          'mc-path__meta',
          (career.seasons || []).length + ' TEMPORADAS · ' + (career.clubs || []).length + ' CLUBES'
        )
      );
      var actions = C.el('div', 'mc-actions');
      actions.appendChild(C.PrimaryCTA('RETIRARME', 'retire'));
      if (!(retirement && retirement.force)) {
        actions.appendChild(C.SecondaryCTA('SEGUIR UN AÑO MÁS', 'keep-playing'));
      }
      scene.appendChild(actions);
      return scene;
    },

    LEGACY: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var career = session.career;
      var legacy = career.legacy || {};
      var totals = legacy.totals || {};
      var scene = C.Scene('LEGACY');
      scene.appendChild(C.text('div', 'mc-kicker', 'LEGADO'));
      scene.appendChild(C.text('div', 'mc-display', career.player.name));
      scene.appendChild(C.text('div', 'mc-arch-label', N.archetypeLabel(legacy.archetype)));
      scene.appendChild(C.text('p', 'mc-quote mc-quote--hero', N.legacyLine(career)));
      scene.appendChild(
        C.ClubTimeline(legacy.timeline || career.clubs, {
          size: 'lg',
          variant: 'poster',
          retireAge: totals.retireAge || career.player.age
        })
      );
      var stats = C.el('div', 'mc-recap-stats mc-recap-stats--editorial');
      stats.appendChild(C.Stat('Peak', totals.peakOverall));
      stats.appendChild(C.Stat('Títulos', totals.titles));
      stats.appendChild(C.Stat('Goles', totals.goals));
      stats.appendChild(C.Stat('Selección', totals.nationalCaps || 0));
      scene.appendChild(stats);
      scene.appendChild(C.PrimaryCTA('VER MI LEGADO', 'to-card'));
      return scene;
    },

    CAREER_CARD: function (session) {
      var C = UI.Components;
      var scene = C.Scene('CAREER_CARD');
      var mount = C.el('div', 'mc-card-mount');
      UI.CareerCard.render(session.career, mount);
      scene.appendChild(mount);
      var actions = C.el('div', 'mc-actions');
      actions.appendChild(C.PrimaryCTA('OTRA CARRERA', 'new-career'));
      actions.appendChild(C.SecondaryCTA('INICIO', 'to-intro'));
      scene.appendChild(actions);
      return scene;
    }
  };

  UI.Screens = Screens;
  UI.CREATE_STEPS = ['name', 'country', 'age', 'position', 'profile'];
  UI.POSITIONS = POSITIONS;
})(typeof globalThis !== 'undefined' ? globalThis : window);
