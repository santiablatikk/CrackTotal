(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  function hasMoment(state, id) {
    var list = state.moments || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return true;
    }
    return false;
  }

  function pushMoment(state, moment) {
    if (!moment || !moment.id) return null;
    if (hasMoment(state, moment.id) && moment.unique !== false) return null;
    if (!state.moments) state.moments = [];
    if (!state.careerHistory) state.careerHistory = [];
    state.moments.push(moment);
    state.careerHistory.push({
      type: 'moment',
      id: moment.id,
      label: moment.label,
      seasonIndex: moment.seasonIndex,
      seasonLabel: moment.seasonLabel,
      age: moment.age
    });
    return moment;
  }

  function seasonLabelFor(state) {
    var idx = Math.max(0, (state.seasonIndex || 1) - 1);
    return NS.Competitions && NS.Competitions.seasonLabel
      ? NS.Competitions.seasonLabel(idx)
      : String(idx);
  }

  function detectSeasonMoments(state, seasonRecord, clubBag, ntBag, awards) {
    var created = [];
    var label = seasonLabelFor(state);
    var seasonIndex = Math.max(0, state.seasonIndex - 1);
    var age = state.age - 1;

    function add(id, text, unique) {
      var m = pushMoment(state, {
        id: id,
        label: text,
        seasonIndex: seasonIndex,
        seasonLabel: label,
        age: age,
        clubId: state.clubId,
        unique: unique !== false
      });
      if (m) created.push(m);
    }

    var league = clubBag && clubBag.competitions && clubBag.competitions.league;
    if (league && league.champion) {
      add('moment_first_league', 'Primera liga conquistada');
    }

    var cont = clubBag && clubBag.competitions && clubBag.competitions.continentalCompetition;
    if (cont && cont.champion) {
      if (cont.competitionId === 'comp_ucl') add('moment_first_ucl', 'Primera Champions League');
      if (cont.competitionId === 'comp_libertadores') {
        add('moment_first_libertadores', 'Primera Copa Libertadores');
      }
    }

    (ntBag.nationalTeamCompetitions || []).forEach(function (c) {
      if (c.competitionId === 'comp_world_cup' && c.champion) {
        add('moment_world_cup', 'Campeón del Mundo');
      }
    });

    (awards || []).forEach(function (a) {
      if (a.awardId === 'award_ballon_dor') add('moment_ballon', 'Primer Balón de Oro');
    });

    var games = 0;
    var goals = 0;
    (state.seasonHistory || []).forEach(function (s) {
      games += s.appearances || 0;
      goals += s.goals || 0;
    });
    if (goals >= 100) add('moment_100_goals', 'Superó los 100 goles');
    if (games >= 500) add('moment_500_apps', 'Superó los 500 partidos');

    if (seasonRecord.firstCallUp) {
      add('moment_first_callup', 'Primera convocatoria');
      add('moment_intl_debut', 'Debut internacional');
    }

    if (seasonRecord.transferThisSeason) {
      add('moment_big_transfer_' + seasonIndex, 'Gran traspaso', false);
      if (seasonRecord.returnHome) add('moment_return_home', 'Regreso al club de origen');
    }

    if (state.retired) add('moment_retire', 'Retiro');

    if (seasonRecord && created.length) {
      seasonRecord.moments = (seasonRecord.moments || []).concat(
        created.map(function (m) {
          return m.id;
        })
      );
    }

    return created;
  }

  NS.Moments = {
    detectSeasonMoments: detectSeasonMoments,
    hasMoment: hasMoment,
    pushMoment: pushMoment
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
