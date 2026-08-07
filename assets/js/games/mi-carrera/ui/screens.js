/**
 * Scene renderers. Display engine state only — no simulation rules.
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

  function profilesFor(position) {
    var list = (NS.data && NS.data.profiles && NS.data.profiles.profiles) || [];
    var enginePos = position;
    var aliases = { GK: 'POR', CB: 'DFC', LB: 'LI', RB: 'LD', DM: 'MCD', CM: 'MC', AM: 'MCO', LW: 'EI', RW: 'ED', ST: 'DC' };
    var local = aliases[enginePos] || enginePos;
    var matched = list.filter(function (p) {
      return (p.positions || []).indexOf(local) !== -1 || (p.positions || []).indexOf(enginePos) !== -1;
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

  var Screens = {
    INTRO: function (session) {
      var C = UI.Components;
      var scene = C.Scene('INTRO');
      scene.appendChild(C.text('div', 'mc-kicker', 'MI CARRERA'));
      scene.appendChild(C.CareerHeadline('TU CARRERA.\nTU HISTORIA.'));
      scene.appendChild(C.text('p', 'mc-sub', 'Empezá a los 16–19. Elegí tu camino. Viví cada temporada.'));
      var actions = C.el('div', 'mc-actions');
      actions.appendChild(C.PrimaryCTA('EMPEZAR CARRERA', 'start'));
      if (NS.Persistence.hasSave()) {
        actions.appendChild(C.SecondaryCTA('CONTINUAR', 'continue'));
      }
      scene.appendChild(actions);
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
        scene.appendChild(C.CareerHeadline('¿CÓMO TE LLAMÁS?'));
        var input = C.el('input', 'mc-input');
        input.type = 'text';
        input.maxLength = 24;
        input.placeholder = 'Tu nombre';
        input.value = draft.name || '';
        input.setAttribute('data-field', 'name');
        scene.appendChild(input);
        scene.appendChild(C.PrimaryCTA('SIGUIENTE', 'create-next'));
      } else if (step === 'country') {
        scene.appendChild(C.text('div', 'mc-kicker', 'PAÍS'));
        scene.appendChild(C.CareerHeadline('¿DE DÓNDE SOS?'));
        var grid = C.el('div', 'mc-choice-grid mc-choice-grid--countries');
        playableCountries().slice(0, 24).forEach(function (c) {
          var btn = C.el('button', 'mc-choice' + (draft.country === c.code ? ' is-on' : ''));
          btn.type = 'button';
          btn.setAttribute('data-action', 'pick-country');
          btn.setAttribute('data-value', c.code);
          btn.appendChild(C.Flag(c.code, 'sm'));
          btn.appendChild(C.text('span', 'mc-choice__t', c.name));
          grid.appendChild(btn);
        });
        scene.appendChild(grid);
        scene.appendChild(C.PrimaryCTA('SIGUIENTE', 'create-next'));
      } else if (step === 'age') {
        var age = draft.age || 17;
        var year = (draft.seasonYear || 2026) - age;
        scene.appendChild(C.text('div', 'mc-kicker', 'EDAD'));
        scene.appendChild(C.Age(age, { huge: true, birthYear: year }));
        var ages = C.el('div', 'mc-age-picks');
        [16, 17, 18, 19].forEach(function (a) {
          var btn = C.el('button', 'mc-choice' + (age === a ? ' is-on' : ''));
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
        scene.appendChild(C.CareerHeadline('¿DÓNDE JUGÁS?'));
        var gridP = C.el('div', 'mc-choice-grid');
        POSITIONS.forEach(function (pos) {
          var btn = C.el('button', 'mc-choice mc-choice--pos' + (draft.position === pos ? ' is-on' : ''));
          btn.type = 'button';
          btn.setAttribute('data-action', 'pick-position');
          btn.setAttribute('data-value', pos);
          btn.appendChild(C.text('span', 'mc-choice__big', pos));
          btn.appendChild(C.text('span', 'mc-choice__t', POS_LABEL[pos]));
          gridP.appendChild(btn);
        });
        scene.appendChild(gridP);
        scene.appendChild(C.PrimaryCTA('SIGUIENTE', 'create-next'));
      } else {
        scene.appendChild(C.text('div', 'mc-kicker', 'ESTILO'));
        scene.appendChild(C.CareerHeadline('¿CÓMO JUGÁS?'));
        var gridS = C.el('div', 'mc-choice-grid');
        profilesFor(draft.position || 'CM').forEach(function (pr) {
          var btn = C.el('button', 'mc-choice' + (draft.profile === pr.id ? ' is-on' : ''));
          btn.type = 'button';
          btn.setAttribute('data-action', 'pick-profile');
          btn.setAttribute('data-value', pr.id);
          btn.appendChild(C.text('span', 'mc-choice__big', pr.name));
          gridS.appendChild(btn);
        });
        scene.appendChild(gridS);
        scene.appendChild(C.PrimaryCTA('VER CLUBES', 'create-finish'));
      }
      return scene;
    },

    FIRST_CLUB: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var scene = C.Scene('FIRST_CLUB');
      scene.appendChild(C.text('div', 'mc-kicker', 'PRIMER CLUB'));
      scene.appendChild(C.CareerHeadline('ELEGÍ TU CAMINO'));
      var row = C.el('div', 'mc-paths');
      var order = { minutes: 0, balance: 1, prestige: 2 };
      var opts = (session.firstClubs || []).slice().sort(function (a, b) {
        return (order[a.path] != null ? order[a.path] : 9) - (order[b.path] != null ? order[b.path] : 9);
      });
      opts.forEach(function (opt) {
        var meta = N.pathMeta(opt.path);
        var club = NS.Providers.clubs.getById(opt.clubId);
        var panel = C.el('article', 'mc-path mc-path--' + meta.tone);
        var crest = C.el('div', 'mc-path__crest');
        crest.appendChild(C.Badge(opt.clubId, meta.tone === 'minutes' ? 'xl' : 'lg'));
        panel.appendChild(crest);
        var body = C.el('div', 'mc-path__body');
        body.appendChild(C.text('div', 'mc-path__tag', meta.title));
        body.appendChild(C.text('h3', 'mc-path__name', club ? club.name : opt.clubId));
        body.appendChild(
          C.text(
            'div',
            'mc-path__meta',
            [club && club.league, NS.Providers.clubs.getTierLabel(club)].filter(Boolean).join(' · ')
          )
        );
        body.appendChild(C.text('p', 'mc-path__promise', meta.promise));
        body.appendChild(
          C.text(
            'div',
            'mc-path__trade',
            'Ganás: ' + (opt.gains || []).slice(0, 2).join(' · ') + '. Arriesgás: ' + (opt.risks || []).slice(0, 2).join(' · ') + '.'
          )
        );
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
      scene.appendChild(C.text('div', 'mc-kicker', 'DEBUT'));
      scene.appendChild(
        C.Age(career.player.age, {
          huge: true,
          chapter: N.ageChapterTitle(career.player.age)
        })
      );
      scene.appendChild(C.Badge(career.currentClubId, 'xl'));
      scene.appendChild(C.text('h2', 'mc-display', clubName(career.currentClubId)));
      scene.appendChild(C.text('div', 'mc-role', N.roleLabel(career.role)));
      scene.appendChild(C.CareerHeadline('ACÁ EMPIEZA TODO.'));
      scene.appendChild(C.PrimaryCTA('CONTINUAR', 'to-preseason'));
      return scene;
    },

    PRESEASON: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var career = session.career;
      var scene = C.Scene('PRESEASON');
      scene.appendChild(
        C.text(
          'div',
          'mc-kicker',
          career.seasons.length ? 'TEMPORADA ' + career.seasonYear : 'PRIMERA TEMPORADA'
        )
      );
      var lay = C.el('div', 'mc-split');
      var left = C.el('div', 'mc-split__main');
      left.appendChild(
        C.Age(career.player.age, {
          huge: true,
          chapter: N.ageChapterTitle(career.player.age)
        })
      );
      left.appendChild(C.text('p', 'mc-quote mc-quote--hero', N.preseasonLine(career)));
      var right = C.el('div', 'mc-split__side');
      right.appendChild(C.Badge(career.currentClubId, 'xl'));
      right.appendChild(C.text('div', 'mc-display', clubName(career.currentClubId)));
      right.appendChild(C.text('div', 'mc-role', N.roleLabel(career.role)));
      lay.appendChild(left);
      lay.appendChild(right);
      scene.appendChild(lay);
      scene.appendChild(C.PrimaryCTA('ENTRAR A LA TEMPORADA', 'to-season'));
      return scene;
    },

    SEASON: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var career = session.career;
      var scene = C.Scene('SEASON');
      scene.appendChild(C.text('div', 'mc-kicker', career.player.age + ' AÑOS · ' + clubName(career.currentClubId)));
      scene.appendChild(C.text('div', 'mc-ovr-solo', String(career.player.overall)));
      scene.appendChild(C.text('div', 'mc-ovr-solo__u', 'OVR'));
      scene.appendChild(C.text('p', 'mc-quote mc-quote--hero', N.seasonStakeLine(career)));
      var chip = C.el('div', 'mc-season-chip');
      chip.appendChild(C.Badge(career.currentClubId, 'md'));
      chip.appendChild(C.text('span', 'mc-season-chip__t', N.roleLabel(career.role)));
      scene.appendChild(chip);
      scene.appendChild(C.PrimaryCTA('JUGAR TEMPORADA', 'play-season'));
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
      scene.appendChild(C.text('div', 'mc-kicker', String(season.seasonYear) + ' · ' + season.age + ' AÑOS'));
      scene.appendChild(C.CareerHeadline(N.recapHeadline(season, career)));
      var hero = C.el('div', 'mc-recap-hero');
      hero.appendChild(C.Badge(season.clubId, 'xl'));
      var heroText = C.el('div', 'mc-recap-hero__text');
      heroText.appendChild(C.text('div', 'mc-recap-club', clubName(season.clubId)));
      heroText.appendChild(C.OVRChange(season.overallBefore, season.overallAfter));
      hero.appendChild(heroText);
      scene.appendChild(hero);
      var stats = C.el('div', 'mc-recap-stats');
      stats.appendChild(C.Stat('PJ', season.matches));
      if (NS.Engine.Rules.isGoalkeeper(career.player.position)) {
        stats.appendChild(C.Stat('Vallas', season.cleanSheets || 0));
      } else {
        stats.appendChild(C.Stat('Goles', season.goals));
        stats.appendChild(C.Stat('Asist.', season.assists));
      }
      stats.appendChild(C.Stat('Nota', season.rating));
      scene.appendChild(stats);
      scene.appendChild(C.PrimaryCTA('CONTINUAR', 'after-recap'));
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
      var age = ev.age != null ? ev.age : career.player.age;
      var clubId = ev.clubId || career.currentClubId;
      scene.appendChild(C.text('div', 'mc-kicker', 'CAMPEÓN'));
      var hero = C.el('div', 'mc-trophy-hero');
      hero.appendChild(C.Trophy(id, 'xl'));
      scene.appendChild(hero);
      scene.appendChild(C.CareerHeadline(N.competitionDisplayName(id)));
      scene.appendChild(C.text('div', 'mc-trophy-title', N.trophyTitle(id)));
      scene.appendChild(
        C.text(
          'div',
          'mc-year',
          [age != null ? age + ' AÑOS' : '', clubName(clubId)].filter(Boolean).join(' · ')
        )
      );
      scene.appendChild(C.text('p', 'mc-quote mc-quote--hero', N.trophyPhrase(id, { first: ev.first })));
      scene.appendChild(C.PrimaryCTA('CONTINUAR', 'next-event'));
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
      scene.appendChild(C.text('div', 'mc-kicker', 'PREMIO'));
      scene.appendChild(C.Award(ev.awardId, ev.awardId === 'ballon_dor' ? 'lg' : 'md'));
      scene.appendChild(C.CareerHeadline(N.awardTitle(ev.awardId)));
      if (ev.awardId === 'ballon_dor') {
        scene.appendChild(C.text('div', 'mc-display', session.career.player.name));
      }
      scene.appendChild(C.text('div', 'mc-year', String(ev.seasonYear || '')));
      scene.appendChild(C.PrimaryCTA('CONTINUAR', 'next-event'));
      return scene;
    },

    MOMENT: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var ev = session.eventQueue && session.eventQueue[0];
      var scene = C.Scene('MOMENT');
      if (!ev) return scene;
      scene.appendChild(C.CareerHeadline(N.momentLine(ev.type)));
      if (ev.payload && ev.payload.to) scene.appendChild(C.Badge(ev.payload.to, 'lg'));
      if (ev.payload && ev.payload.clubId) scene.appendChild(C.Badge(ev.payload.clubId, 'lg'));
      scene.appendChild(C.text('div', 'mc-kicker', (ev.age != null ? ev.age + ' AÑOS' : '') + (ev.seasonYear ? ' · ' + ev.seasonYear : '')));
      scene.appendChild(C.PrimaryCTA('CONTINUAR', 'next-event'));
      return scene;
    },

    AGE_UP: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var season = session.pending && session.pending.season;
      var scene = C.Scene('AGE_UP');
      var before = season ? season.age : session.career.player.age - 1;
      var after = season ? season.ageAfter : session.career.player.age;
      scene.appendChild(C.text('div', 'mc-kicker', 'UN AÑO MÁS'));
      scene.appendChild(C.text('div', 'mc-age-chapter', N.ageChapterTitle(after)));
      var wrap = C.el('div', 'mc-age-flow');
      wrap.appendChild(C.text('div', 'mc-age-flow__n', before));
      wrap.appendChild(C.text('div', 'mc-age-flow__arrow', '↓'));
      var next = C.el('div', 'mc-age-flow__next');
      next.appendChild(C.text('div', 'mc-age-flow__n is-next', after));
      next.appendChild(C.text('div', 'mc-age-flow__u', 'AÑOS'));
      wrap.appendChild(next);
      scene.appendChild(wrap);
      scene.appendChild(C.text('p', 'mc-quote mc-quote--hero', N.ageUpLine(before, after, session.career)));
      scene.appendChild(C.PrimaryCTA('CONTINUAR', 'to-market'));
      return scene;
    },

    MARKET: function (session) {
      var C = UI.Components;
      var N = UI.Narrative;
      var career = session.career;
      var market = session.pending && session.pending.market;
      var scene = C.Scene('MARKET');
      scene.appendChild(C.text('div', 'mc-kicker', 'MERCADO'));
      scene.appendChild(C.text('p', 'mc-quote mc-quote--hero', N.marketSituationLine(market && market.situation)));
      var here = C.el('div', 'mc-market-here');
      here.appendChild(C.Badge(career.currentClubId, 'lg'));
      var hereText = C.el('div', 'mc-market-here__t');
      hereText.appendChild(C.text('div', 'mc-kicker', 'ESTÁS EN'));
      hereText.appendChild(C.text('div', 'mc-display', clubName(career.currentClubId)));
      here.appendChild(hereText);
      scene.appendChild(here);
      var list = C.el('div', 'mc-market-list');
      ((market && market.options) || []).forEach(function (opt, idx) {
        var row = C.el('article', 'mc-offer mc-offer--' + (opt.type || 'stay'));
        if (opt.type !== 'stay' && opt.clubId) {
          var crests = C.el('div', 'mc-offer__crests');
          crests.appendChild(C.Badge(career.currentClubId, 'md'));
          crests.appendChild(C.text('span', 'mc-offer__to', '→'));
          crests.appendChild(C.Badge(opt.clubId, 'xl'));
          row.appendChild(crests);
          row.appendChild(C.text('h3', 'mc-offer__name', clubName(opt.clubId)));
        } else {
          var stayRow = C.el('div', 'mc-offer__crests');
          stayRow.appendChild(C.Badge(career.currentClubId, 'lg'));
          row.appendChild(stayRow);
          row.appendChild(C.text('h3', 'mc-offer__name', opt.label || 'Quedarte'));
        }
        row.appendChild(
          C.text(
            'div',
            'mc-offer__meta',
            [N.roleLabel(opt.role), opt.expectedMinutes != null ? '~' + opt.expectedMinutes + ' PJ' : '']
              .filter(Boolean)
              .join(' · ')
          )
        );
        row.appendChild(
          C.text(
            'div',
            'mc-path__trade',
            'Ganás: ' + (opt.gains || []).slice(0, 2).join(' · ') + '. Arriesgás: ' + (opt.risks || []).slice(0, 2).join(' · ') + '.'
          )
        );
        var cta = C.PrimaryCTA(opt.type === 'stay' ? 'QUEDARME' : opt.type === 'loan' ? 'IR A PRÉSTAMO' : 'ACEPTAR', 'pick-offer');
        cta.setAttribute('data-index', String(idx));
        row.appendChild(cta);
        list.appendChild(row);
      });
      scene.appendChild(list);
      return scene;
    },

    COMPARE: function (session) {
      return Screens.MARKET(session);
    },

    TRANSFER: function (session) {
      var C = UI.Components;
      var offer = session.selectedOffer;
      var career = session.career;
      var scene = C.Scene('TRANSFER');
      var from = offer && offer.fromClubId ? offer.fromClubId : (career.transfers[career.transfers.length - 1] || {}).fromClubId;
      var to = career.currentClubId;
      var crests = C.el('div', 'mc-transfer');
      if (from) crests.appendChild(C.Badge(from, 'lg'));
      crests.appendChild(C.text('div', 'mc-transfer__arrow', '→'));
      crests.appendChild(C.Badge(to, 'xl'));
      scene.appendChild(crests);
      scene.appendChild(C.CareerHeadline(offer && offer.type === 'loan' ? 'CESIÓN.' : 'NUEVO CLUB.'));
      scene.appendChild(C.text('div', 'mc-display', clubName(to)));
      scene.appendChild(C.PrimaryCTA('CONTINUAR', 'after-transfer'));
      return scene;
    },

    RETIREMENT: function (session) {
      var C = UI.Components;
      var retirement = session.pending && session.pending.retirement;
      var scene = C.Scene('RETIREMENT');
      scene.appendChild(C.CareerHeadline('¿COLGÁS LOS BOTINES?'));
      scene.appendChild(C.Age(session.career.player.age, { huge: true }));
      scene.appendChild(C.text('p', 'mc-quote', retirement && retirement.force ? 'El cuerpo ya no da para más.' : 'Podés seguir… o cerrar el capítulo.'));
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
      scene.appendChild(C.CareerHeadline(N.legacyLine(career)));
      scene.appendChild(
        C.ClubTimeline(legacy.timeline || career.clubs, {
          size: 'md',
          variant: 'poster',
          retireAge: totals.retireAge || career.player.age
        })
      );
      var stats = C.el('div', 'mc-recap-stats');
      stats.appendChild(C.Stat('Peak', totals.peakOverall));
      stats.appendChild(C.Stat('Títulos', totals.titles));
      stats.appendChild(C.Stat('Premios', totals.awards));
      stats.appendChild(C.Stat('Selección', totals.nationalCaps || 0));
      scene.appendChild(stats);
      scene.appendChild(C.PrimaryCTA('VER CAREER CARD', 'to-card'));
      return scene;
    },

    CAREER_CARD: function (session) {
      var C = UI.Components;
      var scene = C.Scene('CAREER_CARD');
      var mount = C.el('div', 'mc-card-mount');
      UI.CareerCard.render(session.career, mount);
      scene.appendChild(mount);
      var actions = C.el('div', 'mc-actions');
      actions.appendChild(C.PrimaryCTA('NUEVA CARRERA', 'new-career'));
      actions.appendChild(C.SecondaryCTA('INICIO', 'to-intro'));
      scene.appendChild(actions);
      return scene;
    }
  };

  UI.Screens = Screens;
  UI.CREATE_STEPS = ['name', 'country', 'age', 'position', 'profile'];
  UI.POSITIONS = POSITIONS;
})(typeof globalThis !== 'undefined' ? globalThis : window);
