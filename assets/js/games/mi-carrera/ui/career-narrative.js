(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  var GRADE_LINES = {
    S: [
      'Tu mejor temporada hasta ahora.',
      'Te convertiste en uno de los nombres del equipo.',
      'Esta temporada cambió tu carrera.',
      'Rendimiento de crack. El mercado toma nota.'
    ],
    A: [
      'Tu crecimiento empieza a llamar la atención.',
      'Te ganaste un lugar real.',
      'Una gran temporada. Falta el siguiente salto.',
      'Consistencia de élite.'
    ],
    B: [
      'Una temporada de aprendizaje.',
      'Sólido, sin ruido innecesario.',
      'Cumpliste. Ahora hace falta más.',
      'Base para el próximo salto.'
    ],
    C: [
      'Las cosas no salieron como esperabas.',
      'Temporada irregular. Hay que reaccionar.',
      'El entrenador pidió más.',
      'No alcanzaste tu mejor versión.'
    ],
    D: [
      'Una temporada para olvidar.',
      'El mercado empieza a mirar hacia otro lado.',
      'Pocos minutos. Poca confianza.',
      'Hay que resetear el rumbo.'
    ]
  };

  var ARC_LINES = {
    breakout: [
      'Esta temporada cambió tu carrera.',
      'De pronto, todos hablan de vos.',
      'Tu momento llegó.'
    ],
    comeback: [
      'Después de meses difíciles, volviste.',
      'El silencio se rompió. Volviste a ser vos.',
      'Comeback. La historia sigue abierta.'
    ],
    crisis: [
      'El entrenador dejó de confiar en vos.',
      'Algo se rompió en el vestuario.',
      'Estás lejos de tu mejor versión.'
    ]
  };

  function pickVariant(list, salt) {
    var arr = list || [];
    if (!arr.length) return '';
    var h = 0;
    var s = String(salt || 'x');
    for (var i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
    return arr[h % arr.length];
  }

  function seasonNarrative(season, state) {
    if (!season) return 'Otra página de tu historia.';
    var arc = season.arcFlags || (state && state.arcFlags) || {};
    var salt =
      (season.seasonIndex || 0) +
      ':' +
      (season.performanceGrade || 'B') +
      ':' +
      ((state && state.player && state.player.name) || 'p');
    if (arc.breakout) return pickVariant(ARC_LINES.breakout, salt + ':bo');
    if (arc.comeback) return pickVariant(ARC_LINES.comeback, salt + ':cb');
    if (arc.crisis) return pickVariant(ARC_LINES.crisis, salt + ':cr');
    var grade = season.performanceGrade || 'B';
    return pickVariant(GRADE_LINES[grade] || GRADE_LINES.B, salt);
  }

  function offerBlurb(state, club, role, world, rng) {
    var current = world && state ? NS.Rules.getClub(world, state.clubId) : null;
    var pool = [];
    var pos = state && state.player ? state.player.position : 'MID';
    var posWord =
      pos === 'FWD' ? 'delantero' : pos === 'DEF' ? 'defensor' : pos === 'GK' ? 'arquero' : 'mediocampista';

    if (role === 'titular') {
      pool.push('Necesitan un ' + posWord + ' titular.');
      pool.push('Buscan alguien que arranque de entrada.');
      pool.push('Te ofrecen minutos claros.');
    } else if (role === 'promesa') {
      pool.push('Quieren apostar por tu potencial.');
      pool.push('Te ven como proyecto a mediano plazo.');
      pool.push('El club cree que todavía no tocaste tu techo.');
    } else {
      pool.push('El entrenador te ve como pieza de rotación.');
      pool.push('Entras en un plantel competitivo.');
      pool.push('Escaparate grande, minutos a pelear.');
    }

    if (current && club && current.continentId === 'continent_sa' && club.continentId === 'continent_eu') {
      pool.push('Tu temporada en Sudamérica llamó su atención.');
      pool.push('Europa te está mirando.');
    }
    if (current && club && (club.level || 1) > (current.level || 1)) {
      pool.push('Es un salto de nivel. La presión sube.');
    }
    if (current && club && (club.level || 1) < (current.level || 1)) {
      pool.push('Menos escaparate. Más protagonismo.');
    }
    if (state && state.age <= 21) pool.push('Ven en vos una apuesta de futuro.');
    if (state && state.age >= 30) pool.push('Buscan experiencia inmediata.');
    if (state && state.arcFlags && state.arcFlags.breakout) {
      pool.push('Tu explosión no pasó desapercibida.');
    }

    if (rng && rng.pick) return rng.pick(pool);
    return pool[0];
  }

  function marketShape(transfers, loans) {
    var t = (transfers || []).length;
    var l = (loans || []).length;
    if (!t && !l) return 'cold';
    if (!t && l) return 'loan:' + l;
    if (t && !l) return 'tx:' + t;
    return 'tx:' + t + '+loan:' + l;
  }

  function awardTier(award) {
    if (!award) return 'minor';
    if (award.awardId === 'award_ballon_dor') return 'ballon';
    if ((award.importance || 0) >= 85) return 'major';
    if ((award.importance || 0) >= 70) return 'notable';
    return 'minor';
  }

  function titleTone(title) {
    var id = (title && title.competitionId) || '';
    if (id === 'comp_ucl' || id === 'comp_world_cup') return 'epic';
    if (id === 'comp_libertadores') return 'epic';
    if ((title && title.importance) >= 70) return 'major';
    return 'standard';
  }

  UI.Narrative = {
    seasonNarrative: seasonNarrative,
    offerBlurb: offerBlurb,
    marketShape: marketShape,
    awardTier: awardTier,
    titleTone: titleTone,
    pickVariant: pickVariant
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
