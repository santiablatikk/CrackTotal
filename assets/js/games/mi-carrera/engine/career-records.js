(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  function aggregate(state) {
    var games = 0;
    var goals = 0;
    var assists = 0;
    var titles = (state.titles || []).length;
    var champions = 0;
    var libertadores = 0;
    var clubSeasons = Object.create(null);
    (state.seasonHistory || []).forEach(function (s) {
      games += s.appearances || 0;
      goals += s.goals || 0;
      assists += s.assists || 0;
      if (s.clubId) clubSeasons[s.clubId] = (clubSeasons[s.clubId] || 0) + 1;
    });
    (state.titles || []).forEach(function (t) {
      if (t.competitionId === 'comp_ucl') champions += 1;
      if (t.competitionId === 'comp_libertadores') libertadores += 1;
    });
    var maxClubSeasons = 0;
    Object.keys(clubSeasons).forEach(function (id) {
      if (clubSeasons[id] > maxClubSeasons) maxClubSeasons = clubSeasons[id];
    });
    return {
      games: games,
      goals: goals,
      assists: assists,
      titles: titles,
      champions: champions,
      libertadores: libertadores,
      clubs: (state.clubsPlayed || []).length,
      maxClubSeasons: maxClubSeasons,
      nationalCaps: state.nationalCaps || 0,
      nationalGoals: state.nationalGoals || 0,
      peakRating: state.peakRating || state.rating || 0,
      peakMarketValue: state.peakMarketValue || state.marketValue || 0
    };
  }

  function hasRecord(state, id) {
    var list = state.records || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return true;
    }
    return false;
  }

  function pushRecord(state, record) {
    if (!record || !record.id) return null;
    if (hasRecord(state, record.id)) return null;
    if (!state.records) state.records = [];
    state.records.push(record);
    return record;
  }

  function updateCareerRecords(state, seasonExtras) {
    seasonExtras = seasonExtras || {};
    var agg = aggregate(state);
    var created = [];
    var seasonLabel =
      NS.Competitions && NS.Competitions.seasonLabel
        ? NS.Competitions.seasonLabel(Math.max(0, state.seasonIndex - 1))
        : String(state.seasonIndex);

    function add(id, label, value) {
      var rec = pushRecord(state, {
        id: id,
        label: label,
        value: value,
        seasonIndex: Math.max(0, state.seasonIndex - 1),
        seasonLabel: seasonLabel,
        age: state.age - 1
      });
      if (rec) created.push(rec);
    }

    if (agg.goals >= 100) add('rec_career_goals_100', 'Máximo goleador de la carrera (100+)', agg.goals);
    if (agg.assists >= 80) add('rec_career_assists_80', 'Máximo asistidor de la carrera (80+)', agg.assists);
    if (agg.titles >= 10) add('rec_titles_10', 'Más títulos de la carrera (10+)', agg.titles);
    if (agg.champions >= 2) add('rec_ucl_multi', 'Más Champions de la carrera', agg.champions);
    if (agg.nationalCaps >= 80) add('rec_caps_80', 'Más partidos internacionales', agg.nationalCaps);
    if (agg.nationalGoals >= 30) add('rec_nt_goals_30', 'Más goles internacionales', agg.nationalGoals);
    if (agg.peakRating >= 92) add('rec_peak_92', 'Mayor rating de la carrera', agg.peakRating);
    if (agg.peakMarketValue >= 80000000) {
      add('rec_market_80m', 'Mayor valor de mercado', agg.peakMarketValue);
    }
    if (agg.maxClubSeasons >= 8) {
      add('rec_club_loyalty', 'Más temporadas en un club', agg.maxClubSeasons);
    }
    if (agg.clubs >= 6) add('rec_many_clubs', 'Más clubes en la carrera', agg.clubs);

    if (seasonExtras.ballonAge != null && seasonExtras.ballonAge <= 22) {
      add('rec_young_ballon', 'Jugador más joven en ganar Balón de Oro', seasonExtras.ballonAge);
    }
    if (seasonExtras.uclAge != null && seasonExtras.uclAge <= 21) {
      add('rec_young_ucl', 'Jugador más joven en ganar Champions', seasonExtras.uclAge);
    }
    if (seasonExtras.veteranTitleAge != null && seasonExtras.veteranTitleAge >= 36) {
      add(
        'rec_veteran_title',
        'Jugador más veterano en ganar un título',
        seasonExtras.veteranTitleAge
      );
    }

    return created;
  }

  NS.Records = {
    aggregate: aggregate,
    updateCareerRecords: updateCareerRecords,
    hasRecord: hasRecord
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
