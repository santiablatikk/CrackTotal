/**
 * Minimal localStorage persistence for Mi Carrera experience.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var KEY = 'ct_mi_carrera_v2';

  function stripCareer(career) {
    if (!career) return null;
    var copy = JSON.parse(JSON.stringify(career, function (k, v) {
      if (k === '__rng') return undefined;
      return v;
    }));
    if (career.__rng && typeof career.__rng.getState === 'function') {
      copy._rngT = career.__rng.getState();
      copy._rngSeed = career.__rng.seed;
    }
    return copy;
  }

  function restoreCareer(raw) {
    if (!raw) return null;
    var career = JSON.parse(JSON.stringify(raw));
    var Engine = NS.Engine;
    if (Engine && Engine.createRng) {
      career.__rng = Engine.createRng(career._rngSeed != null ? career._rngSeed : career.seed, career._rngT);
    }
    delete career._rngT;
    delete career._rngSeed;
    return career;
  }

  function save(session) {
    try {
      if (!root.localStorage) return false;
      var payload = {
        v: 2,
        savedAt: Date.now(),
        scene: session.scene,
        createStep: session.createStep || null,
        draft: session.draft || null,
        career: stripCareer(session.career),
        firstClubs: session.firstClubs || null,
        pending: session.pending || null,
        eventQueue: session.eventQueue || [],
        selectedOffer: session.selectedOffer || null
      };
      root.localStorage.setItem(KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      return false;
    }
  }

  function load() {
    try {
      if (!root.localStorage) return null;
      var raw = root.localStorage.getItem(KEY);
      if (!raw) return null;
      var payload = JSON.parse(raw);
      if (!payload || payload.v !== 2) return null;
      return {
        scene: payload.scene,
        createStep: payload.createStep,
        draft: payload.draft,
        career: restoreCareer(payload.career),
        firstClubs: payload.firstClubs,
        pending: payload.pending,
        eventQueue: payload.eventQueue || [],
        selectedOffer: payload.selectedOffer || null,
        savedAt: payload.savedAt
      };
    } catch (e) {
      return null;
    }
  }

  function clear() {
    try {
      if (root.localStorage) root.localStorage.removeItem(KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  function hasSave() {
    try {
      if (!root.localStorage) return false;
      var raw = root.localStorage.getItem(KEY);
      if (!raw) return false;
      var payload = JSON.parse(raw);
      return !!(payload && payload.v === 2 && payload.career);
    } catch (e) {
      return false;
    }
  }

  NS.Persistence = {
    KEY: KEY,
    save: save,
    load: load,
    clear: clear,
    hasSave: hasSave,
    stripCareer: stripCareer,
    restoreCareer: restoreCareer
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
