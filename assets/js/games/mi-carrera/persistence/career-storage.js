(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  var KEYS = {
    meta: 'ct_mi_carrera_v1',
    active: 'ct_mi_carrera_active_v1',
    history: 'ct_mi_carrera_history_v1'
  };

  var MAX_HISTORY = 20;

  function getStore() {
    if (typeof localStorage !== 'undefined') return localStorage;
    if (!root.__miCarreraMemoryStore) {
      root.__miCarreraMemoryStore = {
        _data: Object.create(null),
        getItem: function (k) {
          return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null;
        },
        setItem: function (k, v) {
          this._data[k] = String(v);
        },
        removeItem: function (k) {
          delete this._data[k];
        }
      };
    }
    return root.__miCarreraMemoryStore;
  }

  function readJson(key, fallback) {
    try {
      var raw = getStore().getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    getStore().setItem(key, JSON.stringify(value));
  }

  function defaultMeta() {
    return {
      version: 1,
      careersCompleted: 0,
      bestScore: null,
      bestCategory: null,
      totalTitles: 0,
      totalGoals: 0,
      totalGames: 0,
      rewardedCareerIds: [],
      updatedAt: null
    };
  }

  function getMeta() {
    return Object.assign(defaultMeta(), readJson(KEYS.meta, {}));
  }

  function saveMeta(meta) {
    meta.updatedAt = new Date().toISOString();
    writeJson(KEYS.meta, meta);
    return meta;
  }

  function saveActive(state) {
    if (!state) {
      getStore().removeItem(KEYS.active);
      return null;
    }
    var snapshot = NS.State.serialize(state);
    writeJson(KEYS.active, { savedAt: new Date().toISOString(), state: snapshot });
    return snapshot;
  }

  function loadActive() {
    var bag = readJson(KEYS.active, null);
    if (!bag || !bag.state) return null;
    return NS.State.deserialize(bag.state);
  }

  function clearActive() {
    getStore().removeItem(KEYS.active);
  }

  function getHistory() {
    var list = readJson(KEYS.history, []);
    return Array.isArray(list) ? list : [];
  }

  function summarizeCareer(state) {
    var agg = NS.Scoring.aggregateHistory(state);
    var initialClubId =
      (state.seasonHistory[0] && state.seasonHistory[0].clubId) ||
      (state.clubsPlayed && state.clubsPlayed[0]) ||
      state.clubId;
    var finalClubId =
      (state.seasonHistory.length &&
        state.seasonHistory[state.seasonHistory.length - 1].clubId) ||
      state.clubId;
    return {
      id: 'career_' + state.careerSeed + '_' + (state.createdAt || ''),
      careerSeed: state.careerSeed,
      playerName: state.player.name,
      countryId: state.player.countryId,
      position: state.player.position,
      archetypeId: state.player.archetypeId,
      ageStart: 17,
      ageEnd: state.age,
      seasons: (state.seasonHistory || []).length,
      peakRating: state.peakRating,
      peakMarketValue: state.peakMarketValue || state.marketValue || 0,
      score: state.careerScore,
      category: state.careerCategory,
      flags: state.careerFlags || [],
      clubsPlayed: (state.clubsPlayed || []).slice(),
      initialClubId: initialClubId,
      finalClubId: finalClubId,
      appearances: agg.games,
      goals: agg.goals,
      assists: agg.assists,
      titles: agg.titles,
      nationalCaps: state.nationalCaps,
      nationalGoals: state.nationalGoals,
      retirementReason: state.retirementReason,
      retirementLine: state.retirementLine || null,
      completedAt: new Date().toISOString(),
      date: new Date().toISOString()
    };
  }

  function getBestCareers(limit) {
    var max = limit != null ? limit : MAX_HISTORY;
    return getHistory()
      .slice()
      .sort(function (a, b) {
        var ds = (b.score || 0) - (a.score || 0);
        if (ds !== 0) return ds;
        return String(b.completedAt || '').localeCompare(String(a.completedAt || ''));
      })
      .slice(0, max);
  }

  function ensureHistoryEntry(state) {
    if (!state || !state.retired) return null;
    var summary = summarizeCareer(state);
    var history = getHistory();
    var exists = history.some(function (h) {
      return h.id === summary.id || (h.careerSeed === summary.careerSeed && h.playerName === summary.playerName && h.ageEnd === summary.ageEnd && h.score === summary.score);
    });
    if (!exists) {
      return saveFinished(state);
    }
    return history.filter(function (h) {
      return h.id === summary.id;
    })[0] || summary;
  }

  function saveFinished(state) {
    if (!state || !state.retired) {
      throw new Error('Solo se archivan carreras retiradas');
    }
    var summary = summarizeCareer(state);
    var history = getHistory();
    history.unshift(summary);
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    writeJson(KEYS.history, history);

    var meta = getMeta();
    meta.careersCompleted += 1;
    meta.totalTitles += summary.titles || 0;
    meta.totalGoals += summary.goals || 0;
    meta.totalGames += summary.appearances || 0;
    if (meta.bestScore == null || summary.score > meta.bestScore) {
      meta.bestScore = summary.score;
      meta.bestCategory = summary.category;
    }
    saveMeta(meta);
    clearActive();
    return summary;
  }

  function autosave(state) {
    if (!state) return null;
    if (state.retired) return saveFinished(state);
    return saveActive(state);
  }

  function getStats() {
    var meta = getMeta();
    var history = getHistory();
    return {
      meta: meta,
      historyCount: history.length,
      best: history.length
        ? history.slice().sort(function (a, b) {
            return (b.score || 0) - (a.score || 0);
          })[0]
        : null,
      hasActive: !!readJson(KEYS.active, null)
    };
  }

  function resetAll() {
    getStore().removeItem(KEYS.meta);
    getStore().removeItem(KEYS.active);
    getStore().removeItem(KEYS.history);
  }

  NS.Storage = {
    KEYS: KEYS,
    MAX_HISTORY: MAX_HISTORY,
    getMeta: getMeta,
    saveMeta: saveMeta,
    saveActive: saveActive,
    loadActive: loadActive,
    clearActive: clearActive,
    getHistory: getHistory,
    saveFinished: saveFinished,
    autosave: autosave,
    getStats: getStats,
    summarizeCareer: summarizeCareer,
    getBestCareers: getBestCareers,
    ensureHistoryEntry: ensureHistoryEntry,
    resetAll: resetAll
  };

  NS.getBestCareers = getBestCareers;
})(typeof globalThis !== 'undefined' ? globalThis : window);
