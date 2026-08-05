(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  function careerRewardId(state) {
    return (
      'mc_reward_' +
      String(state.careerSeed) +
      '_' +
      String(state.createdAt || '') +
      '_' +
      String(state.age) +
      '_' +
      String(state.careerScore)
    );
  }

  function getRewardedSet() {
    var meta = NS.Storage.getMeta();
    return meta.rewardedCareerIds || [];
  }

  function markRewarded(id) {
    var meta = NS.Storage.getMeta();
    var list = meta.rewardedCareerIds || [];
    if (list.indexOf(id) === -1) {
      list.unshift(id);
      if (list.length > 40) list = list.slice(0, 40);
      meta.rewardedCareerIds = list;
      NS.Storage.saveMeta(meta);
    }
  }

  function estimateXp(score, perfect) {
    var xp = 10; // match_played
    if (score >= 7) xp += 25; // victory
    if (perfect) xp += 20; // perfect_answers
    return xp;
  }

  function grantCareerRewards(state, extras) {
    extras = extras || {};
    var id = careerRewardId(state);
    var already = getRewardedSet().indexOf(id) !== -1;
    if (already) {
      return {
        granted: false,
        duplicate: true,
        rewardId: id,
        xpEstimate: 0,
        unlocked: [],
        message: 'Recompensa ya otorgada'
      };
    }

    var score = state.careerScore != null ? Number(state.careerScore) : 0;
    var won = score >= 7.0;
    var perfect = score >= 9.5;
    var result = null;
    var bridge = root.CrackTotalProgressBridge;
    var progress = root.CrackTotalProgress;
    var hasApi =
      (bridge && typeof bridge.reportMatch === 'function') ||
      (progress && typeof progress.recordMatch === 'function');

    if (!hasApi) {
      return {
        granted: false,
        duplicate: false,
        skipped: true,
        rewardId: id,
        xpEstimate: 0,
        unlocked: [],
        message: 'Progreso no disponible en este entorno'
      };
    }

    var payload = {
      id: id,
      gameId: 'mi_carrera',
      gameName: 'Mi Carrera',
      won: won,
      score: Math.round(score * 10),
      correctAnswers: 0,
      incorrectAnswers: 0,
      durationSec: extras.durationSec || 0,
      perfect: perfect,
      meta: {
        category: state.careerCategory,
        peakRating: state.peakRating,
        titles: state.totalTitles,
        clubs: (state.clubsPlayed || []).length,
        achievements: (extras.achievements || []).map(function (a) {
          return a.id;
        })
      }
    };

    try {
      if (bridge && typeof bridge.reportMatch === 'function') {
        result = bridge.reportMatch(payload);
      } else {
        result = progress.recordMatch(payload);
      }
    } catch (err) {
      return {
        granted: false,
        duplicate: false,
        error: true,
        rewardId: id,
        xpEstimate: 0,
        unlocked: [],
        message: 'No se pudo registrar la recompensa'
      };
    }

    markRewarded(id);

    return {
      granted: true,
      duplicate: false,
      rewardId: id,
      xpEstimate: estimateXp(score, perfect),
      unlocked: (result && result.unlocked) || [],
      snapshot: result && result.snapshot,
      message: won ? 'Carrera de élite recompensada' : 'Carrera registrada'
    };
  }

  function rewardsHtml(reward) {
    var F = UI.format;
    if (!reward) {
      return (
        '<section class="ct-card mc-xp mc-reveal"><h2>XP</h2><p class="mc-muted">Sin recompensa disponible.</p></section>'
      );
    }
    var unlocked =
      reward.unlocked && reward.unlocked.length
        ? '<ul class="mc-xp-unlocks">' +
          reward.unlocked
            .map(function (u) {
              return '<li>' + F.escapeHtml(u.title || u.id) + '</li>';
            })
            .join('') +
          '</ul>'
        : '';
    var body;
    if (reward.duplicate) {
      body = '<p class="mc-muted">Ya registramos esta carrera. No se duplicó XP.</p>';
    } else if (reward.skipped || reward.error) {
      body = '<p class="mc-muted">' + F.escapeHtml(reward.message) + '</p>';
    } else if (reward.granted) {
      body =
        '<p><strong>+' +
        reward.xpEstimate +
        ' XP</strong> estimada · ' +
        F.escapeHtml(reward.message) +
        '</p>';
    } else {
      body = '<p class="mc-muted">' + F.escapeHtml(reward.message || 'Sin cambios de XP.') + '</p>';
    }
    return (
      '<section class="ct-card mc-xp mc-reveal" aria-labelledby="mc-xp-title">' +
      '<p class="mc-kicker">Crack Total Progress</p>' +
      '<h2 id="mc-xp-title">XP ganada</h2>' +
      body +
      unlocked +
      '</section>'
    );
  }

  UI.Rewards = {
    careerRewardId: careerRewardId,
    grantCareerRewards: grantCareerRewards,
    rewardsHtml: rewardsHtml,
    estimateXp: estimateXp
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
