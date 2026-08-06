(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  var PACING = {
    intense: { id: 'intense', label: 'Intensa', blockSize: 1, blurb: 'Una decisión por temporada.' },
    normal: { id: 'normal', label: 'Normal', blockSize: 2, blurb: 'Una decisión cada 2 temporadas.' },
    express: { id: 'express', label: 'Exprés', blockSize: 3, blurb: 'Una decisión cada 3 temporadas.' }
  };

  function pacingInfo(mode) {
    return PACING[mode] || PACING.normal;
  }

  function blockSize(state) {
    return pacingInfo(state && state.pacingMode).blockSize;
  }

  function clubLevel(state, world) {
    var club = NS.Rules.getClub(world, state.clubId);
    return (club && club.level) || 2;
  }

  function regionOf(state, world) {
    var club = NS.Rules.getClub(world, state.clubId);
    return (club && club.continentId) || '';
  }

  function option(id, label, summary, ups, downs, effects, consequence) {
    return {
      id: id,
      label: label,
      summary: summary,
      ups: ups || [],
      downs: downs || [],
      effects: effects || {},
      consequence: consequence || summary
    };
  }

  function buildBeatPool(state, world) {
    var age = state.age || 17;
    var form = state.form || 5;
    var role = state.clubRole || 'rotacion';
    var level = clubLevel(state, world);
    var region = regionOf(state, world);
    var pos = state.player && state.player.position;
    var crisis = !!(state.arcFlags && state.arcFlags.crisis);
    var comeback = !!(state.arcFlags && state.arcFlags.comeback);
    var pool = [];

    pool.push(
      option(
        'train_hard',
        'Entrenar al límite',
        'Más crecimiento, más riesgo físico',
        ['Forma', 'Potencial', 'OVR'],
        ['Lesión', 'Fatiga'],
        {
          formDelta: 1,
          fitnessDelta: -6,
          injuryRiskBias: 0.08,
          minutesBias: 0.03,
          trainingFocus: 'intensity',
          confidenceDelta: 2
        },
        'Entrenaste al límite: subió el nivel, pero el cuerpo pagó.'
      )
    );

    pool.push(
      option(
        'recover',
        'Priorizar recuperación',
        'Cuidar el cuerpo y la cabeza',
        ['Fitness', 'Menos lesiones'],
        ['Menos explosión', 'Menos escaparate'],
        {
          fitnessDelta: 8,
          formDelta: form <= 3 ? 1 : 0,
          injuryRiskBias: -0.06,
          minutesBias: -0.02,
          moraleDelta: 3,
          trainingFocus: 'recovery'
        },
        'Priorizaste recuperarte: llegaste más entero, con menos ruido.'
      )
    );

    if (role !== 'titular') {
      pool.push(
        option(
          'fight_start',
          'Pelear la titularidad',
          'Exigir minutos ya',
          ['Minutos', 'Confianza'],
          ['Roce con el DT', 'Presión'],
          {
            minutesBias: 0.14,
            clubRelationDelta: -4,
            confidenceDelta: 3,
            moraleDelta: 2,
            formDelta: 1
          },
          'Peleaste el puesto: más minutos, más exposición… y más presión.'
        )
      );
    } else {
      pool.push(
        option(
          'accept_rotation',
          'Aceptar rotación inteligente',
          'Cuidar el cuerpo sin soltar el arco/puesto',
          ['Fitness', 'Longevidad'],
          ['Menos PJ', 'Menos mercado'],
          {
            minutesBias: -0.1,
            fitnessDelta: 5,
            injuryRiskBias: -0.04,
            clubRelationDelta: 4,
            transferBias: -0.04
          },
          'Aceptaste rotar: menos partidos, más cuerpo para lo que viene.'
        )
      );
    }

    if (region === 'continent_sa' && age <= 28 && state.rating >= 72) {
      pool.push(
        option(
          'push_europe',
          'Apostar por Europa',
          'Forzar el salto de continente',
          ['Escaparate', 'Mercado'],
          ['Menos minutos posibles', 'Más exigencia'],
          {
            transferBias: 0.16,
            prestigeDelta: 3,
            reputationDelta: 4,
            minutesBias: -0.04,
            confidenceDelta: 2
          },
          'Te pusiste en modo Europa: el mercado te mira distinto.'
        )
      );
    }

    if (region === 'continent_eu' && age >= 30) {
      pool.push(
        option(
          'anchor_club',
          'Consolidar en el club',
          'Ser referente y cerrar el círculo',
          ['Attachment', 'Minutos', 'Legado'],
          ['Menos salto', 'Menos novedad'],
          {
            transferBias: -0.14,
            minutesBias: 0.06,
            clubRelationDelta: 8,
            moraleDelta: 4,
            popularityDelta: 4
          },
          'Elegiste consolidarte: más legado, menos maletas.'
        )
      );
    }

    if (region === 'continent_eu' && age <= 26 && level >= 4) {
      pool.push(
        option(
          'seek_minutes_loan',
          'Pedir protagonismo',
          'Si no hay PJ, abrir la puerta a una cesión',
          ['Minutos', 'Crecimiento'],
          ['Salir del escaparate', 'Inestabilidad'],
          {
            minutesBias: 0.08,
            transferBias: 0.1,
            clubRelationDelta: -3,
            confidenceDelta: 1
          },
          'Pediste protagonismo: o jugás acá, o el mercado de cesiones se abre.'
        )
      );
    }

    if (state.nationalCaps > 0 || state.reputation >= 55) {
      pool.push(
        option(
          'focus_nt',
          'Priorizar la selección',
          'Llegar bien a las fechas FIFA',
          ['Selección', 'Prestigio'],
          ['Fatiga de club', 'Riesgo físico'],
          {
            reputationDelta: 5,
            prestigeDelta: 3,
            fitnessDelta: -4,
            clubRelationDelta: -2,
            formDelta: 1
          },
          'Priorizaste la selección: más peso internacional, más desgaste.'
        )
      );
    } else {
      pool.push(
        option(
          'focus_club',
          'Priorizar el club',
          'Ganar el puesto en casa primero',
          ['Minutos', 'Relación con el club'],
          ['Menos escaparate internacional'],
          {
            minutesBias: 0.07,
            clubRelationDelta: 6,
            reputationDelta: 1,
            transferBias: -0.03
          },
          'Priorizaste el club: primero el puesto, después el mundo.'
        )
      );
    }

    if (crisis || form <= 3) {
      pool.push(
        option(
          'reset_mind',
          'Reset mental',
          'Bajar la niebla y volver a competir',
          ['Moral', 'Forma'],
          ['Menos intensidad inmediata'],
          {
            moraleDelta: 10,
            formDelta: 2,
            confidenceDelta: 4,
            minutesBias: -0.03,
            injuryRiskBias: -0.03
          },
          'Hiciste un reset mental: volviste a competir con la cabeza más clara.'
        )
      );
    }

    if (comeback || (state.arcFlags && state.arcFlags.breakout)) {
      pool.push(
        option(
          'confirm_level',
          'Confirmar el nivel',
          'No aflojar después del salto',
          ['Consistencia', 'Reputación'],
          ['Presión extra'],
          {
            formDelta: 1,
            reputationDelta: 4,
            confidenceDelta: 3,
            minutesBias: 0.05,
            trainingFocus: 'consistency'
          },
          'Saliste a confirmar el nivel: la carrera pidió continuidad.'
        )
      );
    }

    if (age >= 34 && NS.Rules.canVoluntaryRetire && NS.Rules.canVoluntaryRetire(age)) {
      pool.push(
        option(
          'last_dance',
          'Última gran temporada',
          'Apostar el cuerpo a un cierre memorable',
          ['Minutos', 'Momento'],
          ['Riesgo físico alto'],
          {
            minutesBias: 0.1,
            formDelta: 1,
            fitnessDelta: -8,
            injuryRiskBias: 0.1,
            moraleDelta: 5
          },
          'Apostaste a una última gran temporada: todo o nada.'
        )
      );
    }

    if (pos === 'GK') {
      pool.push(
        option(
          'gk_command',
          'Mandar en el arco',
          'Exigir la titularidad bajo los palos',
          ['Vallas', 'Minutos'],
          ['Presión', 'Menos margen de error'],
          {
            minutesBias: 0.12,
            confidenceDelta: 3,
            clubRelationDelta: -2,
            formDelta: 1
          },
          'Exigiste el arco: más partidos, más vallas… y más responsabilidad.'
        )
      );
    }

    return pool;
  }

  function pickBeat(state, world, rng) {
    var pool = buildBeatPool(state, world);
    if (!pool.length) {
      return {
        id: 'beat_default',
        type: 'career_beat',
        title: 'Tu próximo paso',
        prompt: '¿Cómo encarás esta etapa?',
        options: pool
      };
    }
    // Pick 2–3 distinct options weighted by context
    var shuffled = pool.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = rng.int(0, i);
      var tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    var count = Math.min(3, Math.max(2, shuffled.length));
    var options = shuffled.slice(0, count);
    var chapter =
      NS.Rules && NS.Rules.ageChapter ? NS.Rules.ageChapter(state.age, state) : '';
    var club = NS.Rules.getClub(world, state.clubId);
    return {
      id: 'beat_' + state.seasonIndex + '_' + state.age,
      type: 'career_beat',
      title: state.age + ' AÑOS',
      prompt: chapter
        ? chapter + '. ¿Qué hacés ahora?'
        : '¿Cómo encarás las próximas temporadas?',
      lead: club ? club.shortName || club.name : 'Tu club',
      blockSize: blockSize(state),
      options: options
    };
  }

  function findOption(beat, optionId) {
    if (!beat || !beat.options) return null;
    for (var i = 0; i < beat.options.length; i++) {
      if (beat.options[i].id === optionId) return beat.options[i];
    }
    return null;
  }

  function applyBeat(state, beat, optionId, world) {
    var opt = findOption(beat, optionId);
    if (!opt) throw new Error('Opción de beat inválida: ' + optionId);
    var effects = opt.effects || {};
    NS.State.applyEffects(state, effects);

    // Persist across the whole pacing block (re-applied each season).
    state.blockModifiers = {
      minutesBias: effects.minutesBias || 0,
      goalBias: effects.goalBias || 0,
      assistBias: effects.assistBias || 0,
      injuryRiskBias: effects.injuryRiskBias || 0,
      transferBias: effects.transferBias || 0,
      trainingFocus: effects.trainingFocus || null
    };
    state.blockSeasonsLeft = blockSize(state);
    state.lastBeatId = opt.id;
    state.lastBeatLabel = opt.label;
    state.lastBeatConsequence = opt.consequence || opt.summary;
    state.recentBeats = NS.State.pushRecent(
      state.recentBeats || [],
      {
        id: opt.id,
        label: opt.label,
        seasonIndex: state.seasonIndex,
        age: state.age,
        consequence: state.lastBeatConsequence
      },
      12
    );
    return {
      option: opt,
      consequence: state.lastBeatConsequence,
      ups: opt.ups || [],
      downs: opt.downs || []
    };
  }

  function applyBlockModifiersToSeason(state) {
    if (!state.blockModifiers) return;
    var bm = state.blockModifiers;
    var sm = state.seasonModifiers || (state.seasonModifiers = {});
    sm.minutesBias = (sm.minutesBias || 0) + (bm.minutesBias || 0);
    sm.goalBias = (sm.goalBias || 0) + (bm.goalBias || 0);
    sm.assistBias = (sm.assistBias || 0) + (bm.assistBias || 0);
    sm.injuryRiskBias = (sm.injuryRiskBias || 0) + (bm.injuryRiskBias || 0);
    sm.transferBias = (sm.transferBias || 0) + (bm.transferBias || 0);
    if (bm.trainingFocus) sm.trainingFocus = bm.trainingFocus;
  }

  function tickBlockModifiers(state) {
    if (state.blockSeasonsLeft == null) return;
    state.blockSeasonsLeft -= 1;
    if (state.blockSeasonsLeft <= 0) {
      state.blockModifiers = null;
      state.blockSeasonsLeft = 0;
    }
  }

  function aggregateBlock(seasons, state) {
    seasons = seasons || [];
    var agg = {
      seasons: seasons.slice(),
      seasonCount: seasons.length,
      appearances: 0,
      goals: 0,
      assists: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      titles: [],
      awards: [],
      ageStart: seasons[0] ? seasons[0].age : state.age,
      ageEnd: seasons.length ? seasons[seasons.length - 1].age : state.age,
      clubId: seasons.length ? seasons[seasons.length - 1].clubId : state.clubId,
      ratingBefore: seasons[0] ? seasons[0].ratingBefore : state.rating,
      ratingAfter: seasons.length ? seasons[seasons.length - 1].ratingAfter : state.rating,
      performanceGrade: 'B',
      seasonLabel: '',
      seasonIndex: seasons[0] ? seasons[0].seasonIndex : state.seasonIndex,
      consequence: state.lastBeatConsequence || '',
      beatLabel: state.lastBeatLabel || ''
    };
    var gradeRank = { S: 4, A: 3, B: 2, C: 1, D: 0 };
    var best = 'D';
    seasons.forEach(function (s) {
      agg.appearances += s.appearances || 0;
      agg.goals += s.goals || 0;
      agg.assists += s.assists || 0;
      agg.goalsAgainst += s.goalsAgainst || 0;
      agg.cleanSheets += s.cleanSheets || 0;
      (s.titles || []).forEach(function (t) {
        agg.titles.push(t);
      });
      (s.awards || []).forEach(function (a) {
        agg.awards.push(a);
      });
      if ((gradeRank[s.performanceGrade] || 0) > (gradeRank[best] || 0)) {
        best = s.performanceGrade;
      }
    });
    agg.performanceGrade = best;
    if (seasons.length === 1) {
      agg.seasonLabel = seasons[0].seasonLabel;
    } else if (seasons.length > 1) {
      agg.seasonLabel =
        (seasons[0].seasonLabel || '') + ' → ' + (seasons[seasons.length - 1].seasonLabel || '');
    }
    return agg;
  }

  function defaultOptionId(beat) {
    if (!beat || !beat.options || !beat.options.length) return null;
    return beat.options[0].id;
  }

  NS.Beats = {
    PACING: PACING,
    pacingInfo: pacingInfo,
    blockSize: blockSize,
    pickBeat: pickBeat,
    applyBeat: applyBeat,
    findOption: findOption,
    applyBlockModifiersToSeason: applyBlockModifiersToSeason,
    tickBlockModifiers: tickBlockModifiers,
    aggregateBlock: aggregateBlock,
    defaultOptionId: defaultOptionId
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
