/**
 * Browser-side visual audit helper for Mi Carrera FASE 5A.
 * Paste/eval in DevTools or inject via CDP. Does not change engine rules.
 */
(function () {
  'use strict';
  var MC = window.MiCarrera;
  if (!MC || !MC.UI) throw new Error('MiCarrera UI missing');

  function metrics(name) {
    var stage = document.querySelector('[data-mc-stage]');
    var scene = document.querySelector('.mc-scene');
    var rect = scene ? scene.getBoundingClientRect() : null;
    return {
      name: name,
      active: document.querySelector('[data-active-scene]') && document.querySelector('[data-active-scene]').getAttribute('data-active-scene'),
      vw: window.innerWidth,
      vh: window.innerHeight,
      scrollNeeded: document.documentElement.scrollHeight > window.innerHeight + 48,
      stageH: rect ? Math.round(rect.height) : null,
      badges: Array.prototype.map.call(stage.querySelectorAll('.mc-badge'), function (b) {
        return {
          status: b.getAttribute('data-badge') || b.getAttribute('data-status'),
          w: Math.round(b.getBoundingClientRect().width),
          h: Math.round(b.getBoundingClientRect().height)
        };
      }),
      trophies: Array.prototype.map.call(stage.querySelectorAll('.mc-trophy'), function (t) {
        return {
          status: t.getAttribute('data-trophy'),
          w: Math.round(t.getBoundingClientRect().width),
          comp: t.getAttribute('data-competition')
        };
      }),
      awards: Array.prototype.map.call(stage.querySelectorAll('.mc-award'), function (a) {
        return {
          status: a.getAttribute('data-award'),
          w: Math.round(a.getBoundingClientRect().width),
          id: a.getAttribute('data-award-id')
        };
      }),
      cardish: stage.querySelectorAll('.mc-path, .mc-offer, .mc-choice, .mc-card, .mc-choice-grid .mc-choice').length,
      borderedBoxes: stage.querySelectorAll('[class*="mc-path"], [class*="mc-offer"], .mc-choice, .mc-scene').length,
      headline: ((stage.querySelector('.mc-headline') || {}).textContent || '').trim().slice(0, 90),
      textPreview: (stage.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 220)
    };
  }

  function ensureCtrl() {
    var root = document.querySelector('[data-mc-root]');
    if (!MC.UI.controller) MC.UI.controller = MC.UI.createController(root);
    return MC.UI.controller;
  }

  window.__mcAuditRender = function (name, mutator) {
    var ctrl = ensureCtrl();
    mutator(ctrl.session(), MC, ctrl);
    ctrl.render();
    return metrics(name);
  };

  window.__mcAuditAll = function () {
    var ctrl = ensureCtrl();
    var out = [];
    var live = MC.Engine.createCareer({
      name: 'AUDIT',
      country: 'AR',
      age: 17,
      position: 'ST',
      profile: 'finisher',
      seed: 550011
    });
    var first = MC.Engine.generateFirstClubs(live);
    var full = MC.Engine.simulateFullCareer({
      name: 'AUDIT',
      country: 'AR',
      age: 17,
      position: 'ST',
      profile: 'finisher',
      seed: 550011
    });

    function go(name, fn) {
      fn(ctrl.session());
      ctrl.render();
      out.push(metrics(name));
    }

    go('INTRO', function (s) {
      Object.assign(s, { scene: 'INTRO', career: null, pending: null, eventQueue: [], draft: {}, createStep: 'name', firstClubs: null });
    });
    go('CREATE_NAME', function (s) {
      Object.assign(s, { scene: 'CREATE', createStep: 'name', draft: { name: 'AUDIT' } });
    });
    go('CREATE_COUNTRY', function (s) {
      Object.assign(s, { scene: 'CREATE', createStep: 'country', draft: { name: 'AUDIT', country: 'AR' } });
    });
    go('CREATE_AGE', function (s) {
      Object.assign(s, { scene: 'CREATE', createStep: 'age', draft: { name: 'AUDIT', country: 'AR', age: 17 } });
    });
    go('CREATE_POSITION', function (s) {
      Object.assign(s, { scene: 'CREATE', createStep: 'position', draft: { name: 'AUDIT', country: 'AR', age: 17, position: 'ST' } });
    });
    go('CREATE_PROFILE', function (s) {
      Object.assign(s, { scene: 'CREATE', createStep: 'profile', draft: { name: 'AUDIT', country: 'AR', age: 17, position: 'ST', profile: 'finisher' } });
    });
    go('FIRST_CLUB', function (s) {
      Object.assign(s, { scene: 'FIRST_CLUB', career: live, firstClubs: first });
    });
    MC.Engine.chooseFirstClub(live, first[0].clubId, first[0]);
    go('DEBUT', function (s) {
      Object.assign(s, { scene: 'DEBUT', career: live });
    });
    go('PRESEASON', function (s) {
      Object.assign(s, { scene: 'PRESEASON', career: live });
    });
    go('SEASON', function (s) {
      Object.assign(s, { scene: 'SEASON', career: live });
    });
    var turned = MC.Engine.playSeason(live);
    go('RECAP', function (s) {
      Object.assign(s, { scene: 'RECAP', career: live, pending: { season: turned.season } });
    });
    go('TROPHY', function (s) {
      Object.assign(s, {
        scene: 'TROPHY',
        career: live,
        eventQueue: [
          {
            kind: 'TROPHY',
            competitionId: 'uefa_cl',
            seasonYear: 2030,
            age: 24,
            clubId: live.currentClubId,
            first: true
          }
        ]
      });
    });
    go('AWARD', function (s) {
      Object.assign(s, {
        scene: 'AWARD',
        career: live,
        eventQueue: [{ kind: 'AWARD', awardId: 'ballon_dor', seasonYear: 2031 }]
      });
    });
    go('MOMENT', function (s) {
      Object.assign(s, {
        scene: 'MOMENT',
        career: live,
        eventQueue: [{ kind: 'MOMENT', type: 'debut_national_team', age: 19, seasonYear: 2028, payload: {} }]
      });
    });
    go('AGE_UP', function (s) {
      Object.assign(s, {
        scene: 'AGE_UP',
        career: live,
        pending: { season: { age: 20, ageAfter: 21 } },
        eventQueue: []
      });
    });
    var market = MC.Engine.Market.generateMarket(live, MC.Engine.createRng(99));
    go('MARKET', function (s) {
      Object.assign(s, { scene: 'MARKET', career: live, pending: { season: turned.season, market: market } });
    });
    go('TRANSFER', function (s) {
      Object.assign(s, {
        scene: 'TRANSFER',
        career: live,
        selectedOffer: { type: 'transfer', fromClubId: live.currentClubId }
      });
    });
    go('RETIREMENT', function (s) {
      Object.assign(s, {
        scene: 'RETIREMENT',
        career: full,
        pending: { retirement: { shouldRetire: true, force: false } }
      });
    });
    go('LEGACY', function (s) {
      Object.assign(s, { scene: 'LEGACY', career: full, pending: null });
    });
    go('CAREER_CARD', function (s) {
      Object.assign(s, { scene: 'CAREER_CARD', career: full });
    });
    return out;
  };

  return 'audit-ready';
})();
