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
    'RETIREMENT',
    'LEGACY',
    'CAREER_CARD'
  ];

  function freshSession() {
    return {
      scene: 'INTRO',
      createStep: 'name',
      draft: { name: '', country: 'AR', age: 17, position: 'ST', profile: 'finisher', seasonYear: 2026 },
      career: null,
      firstClubs: null,
      pending: null,
      eventQueue: [],
      selectedOffer: null
    };
  }

  function buildEventQueue(career, season) {
    var queue = [];
    var titles = season.titles || [];
    var awards = season.awards || [];
    var seenTitle = {};
    var titlesBefore = Math.max(0, (career.titles || []).length - titles.length);
    var firstTitle = titlesBefore === 0 && titles.length > 0;

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
          first: firstTitle && idx === 0
        });
      }
    });

    awards.forEach(function (a) {
      queue.push({
        kind: a.awardId === 'ballon_dor' ? 'AWARD' : 'AWARD',
        awardId: a.awardId,
        seasonYear: a.seasonYear || season.seasonYear
      });
    });

    (career.moments || [])
      .filter(function (m) {
        return m.seasonIndex === season.seasonIndex;
      })
      .forEach(function (m) {
        if (
          m.type === 'debut_national_team' ||
          m.type === 'comeback' ||
          m.type === 'major_injury' ||
          m.type === 'world_cup' ||
          m.type === 'continental_title'
        ) {
          queue.push({
            kind: 'MOMENT',
            type: m.type,
            payload: m.payload,
            age: m.age,
            seasonYear: m.seasonYear
          });
        }
      });

    // Ballon first among awards
    queue.sort(function (a, b) {
      if (a.awardId === 'ballon_dor') return -1;
      if (b.awardId === 'ballon_dor') return 1;
      if (a.kind === 'TROPHY' && b.kind !== 'TROPHY') return -1;
      if (b.kind === 'TROPHY' && a.kind !== 'TROPHY') return 1;
      return 0;
    });

    return queue;
  }

  function createController(rootEl) {
    var session = freshSession();
    var stage = rootEl.querySelector('[data-mc-stage]') || rootEl;

    function persist() {
      NS.Persistence.save(session);
    }

    function setScene(name) {
      session.scene = name;
      render();
      persist();
    }

    function render() {
      var renderer = UI.Screens[session.scene];
      stage.innerHTML = '';
      var node = renderer ? renderer(session) : UI.Components.text('p', 'mc-sub', 'Escena no encontrada');
      stage.appendChild(node);
      stage.setAttribute('data-active-scene', session.scene);
      rootEl.setAttribute('data-scene', session.scene);
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
      if (action === 'start') {
        session = freshSession();
        NS.Persistence.clear();
        session.scene = 'CREATE';
        session.createStep = 'name';
        setScene('CREATE');
        return;
      }
      if (action === 'continue') {
        var saved = NS.Persistence.load();
        if (saved && saved.career) {
          session = Object.assign(freshSession(), saved);
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
        afterMarketDecision(opt);
        return;
      }
      if (action === 'retire') {
        NS.Engine.retire(session.career, (session.pending && session.pending.retirement && session.pending.retirement.reason) || 'retired');
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
        session = freshSession();
        NS.Persistence.clear();
        setScene('CREATE');
        return;
      }
      if (action === 'to-intro') {
        session = freshSession();
        setScene('INTRO');
      }
    }

    stage.addEventListener('click', function (e) {
      var t = e.target.closest('[data-action]');
      if (!t || !stage.contains(t)) return;
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
        }
        render();
      }
    };
  }

  function boot(selector) {
    var rootEl = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!rootEl) throw new Error('Mi Carrera: root no encontrado');
    var ready = NS.loadPhase1Data
      ? NS.loadPhase1Data()
      : Promise.resolve(NS.loadPhase1DataSync());
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
