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

  function clubName(world, clubId) {
    if (!world || !clubId || !NS.Rules || !NS.Rules.getClub) return '';
    var c = NS.Rules.getClub(world, clubId);
    return (c && (c.shortName || c.name)) || '';
  }

  function yearsAtClub(state) {
    var hist = (state && state.seasonHistory) || [];
    var n = 0;
    var id = state && state.clubId;
    for (var i = hist.length - 1; i >= 0; i--) {
      if (hist[i].clubId === id) n += 1;
      else break;
    }
    return n;
  }

  function memoryLine(season, state, world) {
    if (!season || !state) return '';
    var hist = state.seasonHistory || [];
    var idx = hist.indexOf(season);
    if (idx < 0) idx = hist.length - 1;
    var prev = idx > 0 ? hist[idx - 1] : null;
    var name = clubName(world, season.clubId);
    var prevName = prev ? clubName(world, prev.clubId) : '';
    var salt = (season.seasonIndex || 0) + ':' + (season.performanceGrade || 'B');

    if (season.returnHome && name) {
      return pickVariant(
        [
          'Volviste a ' + name + '. El círculo se cierra… o se reabre.',
          'El regreso a ' + name + ' no es nostalgia: es una decisión.'
        ],
        salt + ':home'
      );
    }

    if (prev && prev.clubId !== season.clubId && prevName && name) {
      if (season.performanceGrade === 'S' || season.performanceGrade === 'A') {
        return (
          'Después de ' +
          (prev.performanceGrade === 'D' || prev.performanceGrade === 'C'
            ? 'una temporada difícil en ' + prevName
            : 'tu paso por ' + prevName) +
          ', explotaste en ' +
          name +
          '.'
        );
      }
      if (prev.onLoan || (state.recentEvents || []).some(function (e) {
        return e && e.id === 'ev_loan_rumor';
      })) {
        return 'Cedido en ' + name + ', buscaste minutos y otra cara.';
      }
    }

    var years = yearsAtClub(state);
    if (years >= 7 && name && (season.performanceGrade === 'A' || season.performanceGrade === 'S')) {
      return (
        'Tras ' +
        years +
        ' temporadas en ' +
        name +
        ', el club empezó a construir alrededor tuyo.'
      );
    }
    if (years >= 5 && name && season.arcFlags && season.arcFlags.comeback) {
      return 'En ' + name + ' te conocen demasiado bien. Y igual te dieron otra chance.';
    }

    if (season.events && season.events.length) {
      var ev = season.events[0];
      if (ev && ev.id === 'ev_became_idol' && name) {
        return 'En ' + name + ' ya no sos un jugador: sos bandera.';
      }
      if (ev && ev.id === 'ev_lost_place') {
        return 'Perdiste el puesto. La carrera se pone seria.';
      }
      if (ev && ev.id === 'ev_called_up') {
        return 'La selección te sumó. El país te mira distinto.';
      }
    }

    if (season.firstCallUp) {
      return 'Primera convocatoria. Otro capítulo empieza.';
    }

    return '';
  }

  function seasonNarrative(season, state, world) {
    if (!season) return 'Otra página de tu historia.';
    var mem = memoryLine(season, state, world);
    if (mem) return mem;

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

  function ageHeadline(age, state) {
    if (NS.Rules && NS.Rules.ageChapter) return NS.Rules.ageChapter(age, state);
    if (age <= 18) return 'DESARROLLO';
    if (age <= 21) return 'CONSOLIDACIÓN';
    if (age <= 29) return 'PRIME';
    if (age <= 32) return 'EXPERIENCIA';
    return 'LEGADO';
  }

  function preSeasonLine(state, world) {
    if (NS.Rules && NS.Rules.seasonSituation) {
      return NS.Rules.seasonSituation(state, world);
    }
    return {
      age: state.age,
      chapter: ageHeadline(state.age, state),
      line: 'Listo para salir a la cancha.',
      tone: 'ready'
    };
  }

  function offerBlurb(state, club, role, world, rng) {
    if (NS.Rules && NS.Rules.craftOfferBlurb && rng) {
      return NS.Rules.craftOfferBlurb(state, club, role, world, rng);
    }
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
    memoryLine: memoryLine,
    offerBlurb: offerBlurb,
    marketShape: marketShape,
    awardTier: awardTier,
    titleTone: titleTone,
    pickVariant: pickVariant,
    ageHeadline: ageHeadline,
    preSeasonLine: preSeasonLine
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
