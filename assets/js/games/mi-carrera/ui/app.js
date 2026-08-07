/**
 * Mi Carrera experience controller — scene loop over Engine API.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  var SCENES = [
    'INTRO',
    'CREATE',
    'FIRST_CLUB',
    'DEBUT',
    'PRESEASON',
    'SEASON',
    'RECAP',
    'TROPHY',
    'AWARD',
    'MOMENT',
    'AGE_UP',
    'MARKET',
    'COMPARE',
    'TRANSFER',
    'HISTORY',
    'RETIREMENT',
    'LEGACY',
    'CAREER_CARD'
  ];

  var HUD_HIDE = {
    INTRO: 1,
    CREATE: 1,
    FIRST_CLUB: 1,
    TROPHY: 1,
    AWARD: 1,
    MOMENT: 1,
    CAREER_CARD: 1,
    LEGACY: 1,
    RETIREMENT: 1,
    HISTORY: 1
  };

  function freshSession() {
    return {
      scene: 'INTRO',
      createStep: 'name',
      draft: { name: '', country: 'AR', age: 17, position: 'ST', profile: 'finisher', seasonYear: 2026 },
      career: null,
      firstClubs: null,
      pending: null,
      eventQueue: [],
      selectedOffer: null,
      compareOffer: null,
      compareIndex: null,
      overlay: null,
      returnScene: null
    };
  }

  function buildEventQueue(career, season) {
    var queue = [];
    var titles = season.titles || [];
    var awards = season.awards || [];
    var seenTitle = {};
    var titlesBefore = Math.max(0, (career.titles || []).length - titles.length);
    var firstTitle = titlesBefore === 0 && titles.length > 0;
    var seenMoment = {};

    titles.forEach(function (t, idx) {
      if (seenTitle[t.competitionId]) return;
      seenTitle[t.competitionId] = 1;
      var rarity = t.rarity || (NS.Providers.competitions.getById(t.competitionId) || {}).rarity;
      if (
        rarity === 'legendary' ||
        rarity === 'major' ||
        String(t.competitionId).indexOf('uefa_') === 0 ||
        String(t.competitionId).indexOf('conmebol_') === 0 ||
        String(t.competitionId).indexOf('fifa_') === 0
      ) {
        queue.push({
          kind: 'TROPHY',
          competitionId: t.competitionId,
          seasonYear: season.seasonYear,
          age: season.ageAfter != null ? season.ageAfter : season.age,
          clubId: t.clubId || season.clubId || career.currentClubId,
          first: firstTitle && idx === 0
        });
      }
    });

    awards.forEach(function (a) {
      queue.push({
        kind: 'AWARD',
        awardId: a.awardId,
        seasonYear: a.seasonYear || season.seasonYear
      });
    });

    (career.moments || [])
      .filter(function (m) {
        return m.seasonIndex === season.seasonIndex;
      })
      .forEach(function (m) {
        if (seenMoment[m.type]) return;
        if (
          m.type === 'debut_national_team' ||
          m.type === 'comeback' ||
          m.type === 'major_injury' ||
          m.type === 'injury' ||
          m.type === 'world_cup' ||
          m.type === 'continental_title' ||
          m.type === 'first_goal' ||
          m.type === 'first_title' ||
          m.type === 'champions' ||
          m.type === 'libertadores'
        ) {
          if (m.type === 'champions' || m.type === 'libertadores' || m.type === 'first_title') {
            if (titles.length) return;
          }
          seenMoment[m.type] = 1;
          queue.push({
            kind: 'MOMENT',
            type: m.type,
            payload: m.payload,
            age: m.age,
            seasonYear: m.seasonYear
          });
        }
      });

    queue.sort(function (a, b) {
      if (a.awardId === 'ballon_dor') return -1;
      if (b.awardId === 'ballon_dor') return 1;
      if (a.kind === 'TROPHY' && b.kind !== 'TROPHY') return -1;
      if (b.kind === 'TROPHY' && a.kind !== 'TROPHY') return 1;
      if (a.kind === 'AWARD' && b.kind === 'MOMENT') return -1;
      if (b.kind === 'AWARD' && a.kind === 'MOMENT') return 1;
      return 0;
    });

    return queue;
  }

  function createController(rootEl) {
    var session = freshSession();
    var stage = rootEl.querySelector('[data-mc-stage]') || rootEl;
    var chrome = rootEl.querySelector('[data-mc-chrome]');
    var hudMount = rootEl.querySelector('[data-mc-hud]');
    var modalMount = rootEl.querySelector('[data-mc-modal]');

    if (!chrome) {
      chrome = document.createElement('div');
      chrome.className = 'mc-chrome';
      chrome.setAttribute('data-mc-chrome', '');
      chrome.hidden = true;
      hudMount = document.createElement('div');
      hudMount.setAttribute('data-mc-hud', '');
      var menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.className = 'mc-chrome__menu';
      menuBtn.setAttribute('data-action', 'open-menu');
      menuBtn.setAttribute('aria-label', 'Menú');
      menuBtn.textContent = '☰';
      chrome.appendChild(hudMount);
      chrome.appendChild(menuBtn);
      if (typeof rootEl.insertBefore === 'function' && stage && stage.parentNode === rootEl) {
        rootEl.insertBefore(chrome, stage);
      } else {
        rootEl.appendChild(chrome);
      }
    } else {
      hudMount = chrome.querySelector('[data-mc-hud]') || hudMount;
    }
    if (!modalMount) {
      modalMount = document.createElement('div');
      modalMount.className = 'mc-modal-root';
      modalMount.setAttribute('data-mc-modal', '');
      modalMount.hidden = true;
      rootEl.appendChild(modalMount);
    }

    function persist() {
      NS.Persistence.save(session);
    }

    function setScene(name) {
      session.scene = name;
      session.overlay = null;
      render();
      persist();
    }

    function updateChrome() {
      var career = session.career;
      var hide =
        !career ||
        !career.currentClubId ||
        career.status === 'retired' ||
        HUD_HIDE[session.scene] ||
        session.overlay === 'menu';
      chrome.hidden = !!hide;
      if (rootEl.classList) {
        if (typeof rootEl.classList.toggle === 'function') {
          rootEl.classList.toggle('mc-has-hud', !hide);
        } else if (!hide && rootEl.classList.add) {
          rootEl.classList.add('mc-has-hud');
        }
      }
      if (hudMount) {
        hudMount.innerHTML = '';
        if (!hide) hudMount.appendChild(UI.Components.CareerHUD(career));
      }
    }

    function renderOverlay() {
      modalMount.innerHTML = '';
      modalMount.hidden = !session.overlay;
      if (!session.overlay) return;
      var C = UI.Components;
      if (session.overlay === 'menu') {
        var menu = C.el('div', 'mc-menu-panel');
        menu.appendChild(C.text('div', 'mc-kicker', 'MI CARRERA'));
        menu.appendChild(C.PrimaryCTA('CONTINUAR', 'close-menu'));
        menu.appendChild(C.SecondaryCTA('MI HISTORIA', 'open-history'));
        menu.appendChild(C.SecondaryCTA('NUEVA CARRERA', 'ask-new-career'));
        menu.appendChild(C.SecondaryCTA('SALIR', 'ask-exit'));
        modalMount.appendChild(menu);
        return;
      }
      if (session.overlay === 'exit') {
        modalMount.appendChild(
          C.Modal('SALIR DE LA CARRERA', 'Tu progreso está guardado.', [
            { label: 'CONTINUAR', action: 'close-menu', primary: true },
            { label: 'SALIR AL MENÚ', action: 'confirm-exit' }
          ])
        );
        return;
      }
      if (session.overlay === 'new') {
        modalMount.appendChild(
          C.Modal('¿EMPEZAR UNA NUEVA CARRERA?', 'La carrera actual quedará reemplazada.', [
            { label: 'CANCELAR', action: 'close-menu' },
            { label: 'NUEVA CARRERA', action: 'confirm-new-career', primary: true }
          ])
        );
      }
    }

    function render() {
      var renderer = UI.Screens[session.scene];
      stage.innerHTML = '';
      var node = renderer ? renderer(session) : UI.Components.text('p', 'mc-sub', 'Escena no encontrada');
      stage.appendChild(node);
      stage.setAttribute('data-active-scene', session.scene);
      rootEl.setAttribute('data-scene', session.scene);
      updateChrome();
      renderOverlay();
    }

    function ensureCareerFromDraft() {
      var d = session.draft;
      var career = NS.Engine.createCareer({
        name: (d.name || 'Jugador').trim() || 'Jugador',
        country: d.country || 'AR',
        age: d.age || 17,
        position: d.position || 'ST',
        profile: d.profile || 'finisher',
        seasonYear: d.seasonYear || 2026,
        seed: d.seed != null ? d.seed : NS.Engine.hashString(String(Date.now()) + Math.random())
      });
      session.career = career;
      session.firstClubs = NS.Engine.generateFirstClubs(career);
      return career;
    }

    function advanceCreate() {
      var steps = UI.CREATE_STEPS;
      var idx = steps.indexOf(session.createStep);
      if (session.createStep === 'name') {
        var input = stage.querySelector('[data-field="name"]');
        if (input) session.draft.name = input.value.trim() || 'Jugador';
      }
      if (idx < steps.length - 1) {
        session.createStep = steps[idx + 1];
        setScene('CREATE');
      }
    }

    function afterEventsOrAge() {
      if (session.eventQueue && session.eventQueue.length) {
        var next = session.eventQueue[0];
        setScene(next.kind);
        return;
      }
      setScene('AGE_UP');
    }

    function afterMarketDecision(offer) {
      session.selectedOffer = offer;
      var moved = offer && (offer.type === 'transfer' || offer.type === 'loan' || offer.type === 'loan_return');
      NS.Engine.applyDecision(session.career, offer);
      if (moved) {
        setScene('TRANSFER');
      } else {
        goPreseasonOrRetire();
      }
    }

    function goPreseasonOrRetire() {
      var retirement = session.pending && session.pending.retirement;
      if (retirement && retirement.shouldRetire) {
        setScene('RETIREMENT');
        return;
      }
      session.pending = null;
      session.selectedOffer = null;
      setScene('PRESEASON');
    }

    function onAction(action, el) {
      if (action === 'open-menu') {
        session.overlay = 'menu';
        render();
        return;
      }
      if (action === 'close-menu') {
        session.overlay = null;
        render();
        persist();
        return;
      }
      if (action === 'ask-exit') {
        session.overlay = 'exit';
        render();
        return;
      }
      if (action === 'confirm-exit') {
        session.overlay = null;
        var resumeScene = session.scene;
        if (resumeScene === 'HISTORY' || resumeScene === 'INTRO') {
          resumeScene = session.returnScene || 'PRESEASON';
        }
        var snap = Object.assign({}, session, { scene: resumeScene, overlay: null, returnScene: null });
        NS.Persistence.save(snap);
        session = freshSession();
        session.scene = 'INTRO';
        render();
        return;
      }
      if (action === 'ask-new-career') {
        session.overlay = 'new';
        render();
        return;
      }
      if (action === 'confirm-new-career' || action === 'start') {
        NS.Persistence.clear();
        session = freshSession();
        session.scene = 'CREATE';
        session.createStep = 'name';
        render();
        return;
      }
      if (action === 'open-history') {
        session.overlay = null;
        if (session.scene !== 'HISTORY') session.returnScene = session.scene;
        setScene('HISTORY');
        return;
      }
      if (action === 'close-history') {
        var back = session.returnScene || 'PRESEASON';
        session.returnScene = null;
        setScene(back);
        return;
      }
      if (action === 'continue') {
        var saved = NS.Persistence.load();
        if (saved && saved.career) {
          session = Object.assign(freshSession(), saved);
          session.overlay = null;
          setScene(session.scene || 'PRESEASON');
        }
        return;
      }
      if (action === 'create-next') {
        advanceCreate();
        return;
      }
      if (action === 'create-finish') {
        if (!session.draft.profile) {
          var first = stage.querySelector('[data-action="pick-profile"]');
          if (first) session.draft.profile = first.getAttribute('data-value');
        }
        ensureCareerFromDraft();
        setScene('FIRST_CLUB');
        return;
      }
      if (action === 'pick-country') {
        session.draft.country = el.getAttribute('data-value');
        render();
        persist();
        return;
      }
      if (action === 'pick-age') {
        session.draft.age = Number(el.getAttribute('data-value'));
        render();
        persist();
        return;
      }
      if (action === 'pick-position') {
        session.draft.position = el.getAttribute('data-value');
        render();
        persist();
        return;
      }
      if (action === 'pick-profile') {
        session.draft.profile = el.getAttribute('data-value');
        render();
        persist();
        return;
      }
      if (action === 'pick-first-club') {
        var clubId = el.getAttribute('data-club');
        var meta = (session.firstClubs || []).filter(function (o) {
          return o.clubId === clubId;
        })[0];
        NS.Engine.chooseFirstClub(session.career, clubId, meta);
        setScene('DEBUT');
        return;
      }
      if (action === 'to-preseason' || action === 'after-transfer') {
        session.selectedOffer = null;
        setScene('PRESEASON');
        return;
      }
      if (action === 'to-season') {
        setScene('SEASON');
        return;
      }
      if (action === 'play-season') {
        var turned = NS.Engine.playSeason(session.career);
        session.pending = {
          season: turned.season,
          market: turned.market,
          retirement: turned.retirement
        };
        session.eventQueue = buildEventQueue(session.career, turned.season);
        setScene('RECAP');
        return;
      }
      if (action === 'after-recap') {
        afterEventsOrAge();
        return;
      }
      if (action === 'next-event') {
        session.eventQueue.shift();
        afterEventsOrAge();
        return;
      }
      if (action === 'to-market') {
        var ret = session.pending && session.pending.retirement;
        if (ret && ret.force) {
          setScene('RETIREMENT');
          return;
        }
        setScene('MARKET');
        return;
      }
      if (action === 'pick-offer') {
        var idx = Number(el.getAttribute('data-index'));
        var opt = session.pending.market.options[idx];
        if (opt && opt.type !== 'stay' && opt.type !== 'loan_return' && opt.clubId) {
          session.compareOffer = opt;
          session.compareIndex = idx;
          setScene('COMPARE');
          return;
        }
        afterMarketDecision(opt);
        return;
      }
      if (action === 'confirm-compare') {
        afterMarketDecision(session.compareOffer);
        session.compareOffer = null;
        return;
      }
      if (action === 'cancel-compare') {
        session.compareOffer = null;
        setScene('MARKET');
        return;
      }
      if (action === 'retire') {
        NS.Engine.retire(
          session.career,
          (session.pending && session.pending.retirement && session.pending.retirement.reason) || 'retired'
        );
        NS.Persistence.clear();
        setScene('LEGACY');
        return;
      }
      if (action === 'keep-playing') {
        session.pending = null;
        setScene('PRESEASON');
        return;
      }
      if (action === 'to-card') {
        setScene('CAREER_CARD');
        return;
      }
      if (action === 'new-career') {
        session.overlay = 'new';
        render();
        return;
      }
      if (action === 'to-intro') {
        persist();
        session.scene = 'INTRO';
        session.overlay = null;
        render();
      }
    }

    rootEl.addEventListener('click', function (e) {
      var t = e.target.closest('[data-action]');
      if (!t || !rootEl.contains(t)) return;
      onAction(t.getAttribute('data-action'), t);
    });

    return {
      session: function () {
        return session;
      },
      render: render,
      setScene: setScene,
      onAction: onAction,
      buildEventQueue: buildEventQueue,
      start: function () {
        var saved = NS.Persistence.load();
        if (saved && saved.career && saved.scene && saved.scene !== 'INTRO' && saved.scene !== 'CAREER_CARD') {
          session = Object.assign(freshSession(), saved);
          session.overlay = null;
        }
        render();
      }
    };
  }

  function boot(selector) {
    var rootEl = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!rootEl) throw new Error('Mi Carrera: root no encontrado');
    var ready = NS.loadPhase1Data ? NS.loadPhase1Data() : Promise.resolve(NS.loadPhase1DataSync());
    return Promise.resolve(ready).then(function () {
      var ctrl = createController(rootEl);
      ctrl.start();
      UI.controller = ctrl;
      return ctrl;
    });
  }

  UI.SCENES = SCENES;
  UI.createController = createController;
  UI.boot = boot;
  UI.buildEventQueue = buildEventQueue;
  UI.freshSession = freshSession;
})(typeof globalThis !== 'undefined' ? globalThis : window);
