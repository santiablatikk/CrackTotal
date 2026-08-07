/**
 * Narrative copy derived from real engine state. Never invents outcomes.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  var ROLE_LABEL = {
    youth_prospect: 'Promesa',
    rotation: 'Rotación',
    substitute: 'Suplente',
    regular: 'Habitual',
    starter: 'Titular',
    key_player: 'Figura',
    star: 'Estrella',
    captain: 'Capitán',
    veteran_leader: 'Líder veterano'
  };

  var PATH_META = {
    minutes: {
      title: 'PROTAGONISTA',
      promise: 'JUGÁS.',
      tone: 'minutes',
      gainLabel: 'MINUTOS',
      riskLabel: 'PRESTIGIO'
    },
    balance: {
      title: 'EQUILIBRIO',
      promise: 'CRECÉS.',
      tone: 'balance',
      gainLabel: 'DESARROLLO',
      riskLabel: 'TECHO'
    },
    prestige: {
      title: 'ESCAPARATE',
      promise: 'TE VEN.',
      tone: 'prestige',
      gainLabel: 'PRESTIGIO',
      riskLabel: 'PACIENCIA'
    }
  };

  /** Human-facing archetype labels — never show technical fingerprints. */
  var ARCHETYPE_LABEL = {
    BALLON_DOR_WINNER: 'BALÓN DE ORO',
    WORLD_CHAMPION: 'CAMPEÓN DEL MUNDO',
    WORLDCUP_HERO: 'CAMPEÓN DEL MUNDO',
    ONE_CLUB_LEGEND: 'LEYENDA DE UN CLUB',
    ONE_CLUB_MAN: 'UN SOLO ESCUDO',
    CLUB_ICON: 'ÍDOLO DEL CLUB',
    JOURNEYMAN: 'NÓMADA',
    MERCENARY: 'MERCENARIO',
    COMEBACK: 'EL REGRESO',
    EUROPEAN_STAR: 'ESTRELLA EUROPEA',
    SOUTH_AMERICAN_LEGEND: 'LEYENDA SUDAMERICANA',
    SOUTH_AMERICAN_KING: 'LEYENDA SUDAMERICANA',
    FALLEN_WONDERKID: 'PROMESA QUEBRADA',
    FALLEN_PRODIGY: 'PROMESA QUEBRADA',
    LATE_BLOOMER: 'FLOR TARDÍA',
    WONDERKID: 'WONDERKID',
    INTERNATIONAL_STAR: 'ESTRELLA INTERNACIONAL',
    CONTINENTAL_BRIDGE: 'PUENTE CONTINENTAL',
    HOMECOMING: 'EL REGRESO A CASA',
    UNDERDOG_CHAMPION: 'CAMPEÓN IMPROBABLE',
    GIANT_FAILURE: 'GIGANTE QUE NO FUE',
    GIANT_SUCCESS: 'CONQUISTÓ AL GIGANTE',
    INJURY_CAREER: 'CARRERA MARCADA',
    TROPHY_HUNTER: 'CAZADOR DE TÍTULOS',
    CULT_HERO: 'ÍDOLO DEL CLUB',
    LONG_CAREER: 'CARRERA LARGA',
    EARLY_RETIREMENT: 'RETIRO TEMPRANO',
    VETERAN: 'VETERANO',
    OVERACHIEVER: 'SUPERÓ EL TECHO',
    CAREER_PLAYER: 'CARRERA REAL'
  };

  var ARCHETYPE_LINE = {
    BALLON_DOR_WINNER: 'EL MEJOR DEL MUNDO.',
    WORLD_CHAMPION: 'HÉROE DE UN MUNDIAL.',
    WORLDCUP_HERO: 'HÉROE DE UN MUNDIAL.',
    ONE_CLUB_LEGEND: 'EL ÍDOLO QUE NUNCA SE FUE.',
    ONE_CLUB_MAN: 'TODA UNA VIDA EN UN SOLO ESCUDO.',
    CLUB_ICON: 'MÁS QUE UN JUGADOR: UNA IDENTIDAD.',
    JOURNEYMAN: 'UNA CARRERA SIN GUION.',
    MERCENARY: 'CAMBIÓ DE ESCUDO HASTA ENCONTRARSE.',
    COMEBACK: 'EL QUE VOLVIÓ CUANDO TODOS LO DABAN POR MUERTO.',
    EUROPEAN_STAR: 'DE PROMESA A ESTRELLA EUROPEA.',
    SOUTH_AMERICAN_LEGEND: 'EL REY DE SUDAMÉRICA.',
    SOUTH_AMERICAN_KING: 'EL REY DE SUDAMÉRICA.',
    FALLEN_WONDERKID: 'EL TALENTO QUE EL FÚTBOL NO PERDONÓ.',
    FALLEN_PRODIGY: 'EL TALENTO QUE EL FÚTBOL NO PERDONÓ.',
    LATE_BLOOMER: 'EL QUE EXPLOTÓ CUANDO NADIE ESPERABA.',
    WONDERKID: 'LA PROMESA QUE CUMPLIÓ.',
    INTERNATIONAL_STAR: 'LA SELECCIÓN FUE SU SEGUNDO CLUB.',
    CONTINENTAL_BRIDGE: 'CRUZÓ EL OCÉANO Y DEJÓ HUELLA.',
    HOMECOMING: 'SE FUE. VOLVIÓ. CERRÓ EL CÍRCULO.',
    UNDERDOG_CHAMPION: 'GANÓ DONDE NADIE ESPERABA.',
    GIANT_FAILURE: 'LLEGÓ AL TECHO… Y SE QUEBRÓ.',
    GIANT_SUCCESS: 'ENTRE GIGANTES, FUE GIGANTE.',
    INJURY_CAREER: 'EL CUERPO PIDIÓ PELEA. ÉL SIGUIÓ.',
    TROPHY_HUNTER: 'UNA VIDA COLECCIONANDO TÍTULOS.',
    CULT_HERO: 'MÁS QUE UN JUGADOR: UNA IDENTIDAD.',
    LONG_CAREER: 'DURÓ MÁS QUE CASI TODOS.',
    EARLY_RETIREMENT: 'SE FUE ANTES DE QUE LO OBLIGARAN.',
    VETERAN: 'EL ÚLTIMO QUE APAGÓ LA LUZ.',
    OVERACHIEVER: 'LLEGÓ MÁS LEJOS DE LO PREVISTO.',
    CAREER_PLAYER: 'UNA CARRERA REAL.'
  };

  var MAJOR_TITLE_IDS = {
    uefa_cl: 1,
    conmebol_libertadores: 1,
    conmebol_sudamericana: 1,
    fifa_world_cup: 1,
    fifa_club_world_cup: 1,
    uefa_euro: 1,
    conmebol_copa_america: 1,
    uefa_el: 1
  };

  function roleLabel(role) {
    return ROLE_LABEL[role] || role || 'Jugador';
  }

  function pathMeta(path) {
    return PATH_META[path] || PATH_META.balance;
  }

  function ageChapter(age) {
    if (age <= 18) return 'juvenil';
    if (age <= 21) return 'desarrollo';
    if (age <= 25) return 'crecimiento';
    if (age <= 29) return 'prime';
    if (age <= 32) return 'prime_tardio';
    if (age <= 35) return 'declive';
    return 'veterano';
  }

  function ageChapterTitle(age) {
    if (age <= 18) return 'EL COMIENZO';
    if (age <= 21) return 'EL SALTO';
    if (age <= 25) return 'EN ASCENSO';
    if (age <= 29) return 'TU PRIME';
    if (age <= 32) return 'EL DESAFÍO';
    if (age <= 35) return 'EL FINAL SE ACERCA';
    return 'LA ÚLTIMA ETAPA';
  }

  function archetypeLabel(code) {
    return ARCHETYPE_LABEL[code] || 'CARRERA REAL';
  }

  function majorTitles(titles) {
    return (titles || []).filter(function (t) {
      if (!t || !t.competitionId) return false;
      if (MAJOR_TITLE_IDS[t.competitionId]) return true;
      var c = NS.Providers.competitions.getById(t.competitionId);
      return c && (c.rarity === 'legendary' || c.rarity === 'major');
    });
  }

  function trophyPhrase(competitionId, ctx) {
    ctx = ctx || {};
    if (competitionId === 'fifa_world_cup') return 'El sueño de todos. Hecho realidad.';
    if (competitionId === 'uefa_cl') return 'La noche más grande del fútbol de clubes.';
    if (competitionId === 'conmebol_libertadores') return 'América entera lo va a recordar.';
    if (competitionId === 'conmebol_sudamericana') return 'Un título continental que pesa.';
    if (competitionId === 'uefa_euro') return 'Rey de Europa con la selección.';
    if (competitionId === 'conmebol_copa_america') return 'Campeón de América.';
    if (competitionId === 'fifa_club_world_cup') return 'El mundo de clubes a tus pies.';
    if (ctx.first) return 'Tu primer gran título.';
    return 'Otro título para la colección.';
  }

  function preseasonLine(career) {
    var p = career.player;
    var age = p.age;
    var role = career.role;
    var club = NS.Providers.clubs.getById(career.currentClubId);
    var years = (career.marketMemory && career.marketMemory.yearsAtClub) || 0;
    var last = career.seasons[career.seasons.length - 1];
    var chapter = ageChapter(age);

    if (!career.seasons.length) {
      if (role === 'youth_prospect' || role === 'substitute') {
        return 'El club te ve como una apuesta de futuro.';
      }
      if (role === 'starter' || role === 'regular') {
        return 'Llegás para jugar. El vestuario te está esperando.';
      }
      return 'Tu primera temporada empieza ahora.';
    }

    if (p.injury && p.injury.status && p.injury.status !== 'healthy') {
      return 'Venís de una lesión. Esta temporada es de reconstrucción.';
    }
    if (career.crisis && career.crisis.active) {
      return 'Estás en crisis. Hay que recuperar el lugar.';
    }
    if (career.comeback && career.comeback.active) {
      return 'El comeback está en marcha. Esta temporada define si vuelve.';
    }
    if (career.onLoan) {
      return 'Estás cedido. Los minutos son la prioridad.';
    }
    if ((career.contractYears || 0) <= 1) {
      return 'Tu contrato termina esta temporada. Cada partido pesa más.';
    }
    if (last && last.rating >= 7.3 && last.minutes >= 2000) {
      return 'Después de una gran temporada, ahora todos esperan más de vos.';
    }
    if (last && last.minutes < 900) {
      return 'Llegaste a un club donde vas a tener que pelear minutos.';
    }
    if (role === 'youth_prospect' || role === 'rotation' || role === 'substitute') {
      return 'Tu entrenador todavía no te considera titular.';
    }
    if (chapter === 'prime' || chapter === 'prime_tardio') {
      return 'Estás entrando en tu mejor etapa.';
    }
    if (chapter === 'declive' || chapter === 'veterano') {
      return 'La experiencia es tu ventaja. Hay que administrarla.';
    }
    if (years >= 3 && club) {
      return 'Ya sos parte de ' + (club.shortName || club.name) + '. El vínculo pesa.';
    }
    if (career.nationalTeam && career.nationalTeam.status === 'uncapped' && p.overall >= 78) {
      return 'Tu selección te está siguiendo.';
    }
    if (role === 'star' || role === 'key_player') {
      return 'Sos referencia. El club gira alrededor de tu rendimiento.';
    }
    return 'Una nueva temporada. Un nuevo capítulo.';
  }

  function seasonStakeLine(career) {
    var role = career.role;
    var p = career.player;
    if (career.onLoan) return 'Este año puede definir si volvés más fuerte.';
    if (role === 'youth_prospect' || role === 'substitute') {
      return 'Este año puede cambiar tu lugar en el equipo.';
    }
    if (p.age >= 30) return 'Cada temporada cuenta. No sobra tiempo.';
    if (p.overall >= 84) return 'El listón está alto. Hay que responder.';
    return 'Este año puede cambiar tu lugar en el equipo.';
  }

  function recapHeadline(season, career) {
    var before = season.overallBefore;
    var after = season.overallAfter;
    var delta = after - before;
    var minutes = season.minutes || 0;
    var rating = season.rating || 0;
    var titles = season.titles || [];
    var awards = season.awards || [];
    var goals = season.goals || 0;
    var age = season.age;

    if (awards.some(function (a) { return a.awardId === 'ballon_dor'; })) {
      return 'EL AÑO QUE EL MUNDO TE NOMBRÓ.';
    }
    if (titles.some(function (t) {
      return t.competitionId === 'uefa_cl' || t.competitionId === 'conmebol_libertadores' || t.competitionId === 'fifa_world_cup';
    })) {
      return 'EL AÑO DEL TÍTULO GRANDE.';
    }
    if (season.national && season.national.caps > 0 && career.nationalTeam && career.nationalTeam.caps <= (season.national.caps || 0) + 2) {
      if ((career.moments || []).some(function (m) {
        return m.type === 'debut_national_team' && m.seasonIndex === season.seasonIndex;
      })) {
        return 'DEBUT INTERNACIONAL.';
      }
    }
    if ((career.careerArc || []).indexOf('comeback') !== -1 && (career.moments || []).some(function (m) {
      return m.type === 'comeback' && m.seasonIndex === season.seasonIndex;
    })) {
      return 'EL REGRESO.';
    }
    if (season.injurySeverity >= 2) {
      return 'UNA TEMPORADA MARCADA POR LA LESIÓN.';
    }
    if (minutes >= 2200 && rating >= 7.25 && delta >= 2) {
      return age <= 21 ? 'DE PROMESA A TITULAR.' : 'EL AÑO QUE CAMBIASTE DE NIVEL.';
    }
    if (minutes >= 2000 && rating >= 7.1 && goals >= 15) {
      return 'TE GANASTE EL PUESTO.';
    }
    if (minutes < 700) {
      return 'POCOS MINUTOS. DEMASIADAS DUDAS.';
    }
    if (delta >= 3 && minutes >= 1500) {
      return age <= 21 ? 'CRECISTE A LO GRANDE.' : 'EL SALTO LLEGÓ ANTES DE LO ESPERADO.';
    }
    if (goals >= 12 && minutes >= 1800) {
      return 'TE GANASTE EL PUESTO.';
    }
    if (rating < 6.5 && minutes >= 1000 && delta <= 1 && goals < 8) {
      return 'NO FUE TU MEJOR TEMPORADA.';
    }
    if (rating < 6.5 && minutes >= 1000 && delta >= 2) {
      return 'NÚMEROS DUROS. PERO SEGUÍSTE CRECIENDO.';
    }
    if (delta <= -2) {
      return 'TU PRODUCCIÓN CAYÓ. EL PRÓXIMO PASO SERÁ DIFÍCIL.';
    }
    if (after >= 82 && before < 80) {
      return 'EL MUNDO EMPIEZA A MIRARTE.';
    }
    if (minutes >= 2500 && rating >= 7.0) {
      return 'UNA TEMPORADA SÓLIDA.';
    }
    if ((career.marketMemory && career.marketMemory.yearsAtClub || 0) >= 4) {
      return 'EL CLUB YA FORMA PARTE DE TU IDENTIDAD.';
    }
    return 'OTRO CAPÍTULO EN TU HISTORIA.';
  }

  function ageUpLine(ageBefore, ageAfter, career) {
    var chapter = ageChapter(ageAfter);
    var last = career.seasons[career.seasons.length - 1];
    if (ageAfter === 18) return 'Dejás de ser un pibe del plantel.';
    if (ageAfter === 20) return 'Ya no sos solo una apuesta.';
    if (ageAfter === 23) return 'Ya no sos una promesa.';
    if (ageAfter === 26) return 'Entrá al corazón de tu carrera.';
    if (ageAfter === 30) return 'La veteranía llega. La cabeza manda.';
    if (ageAfter === 34) return 'Cada temporada es una decisión.';
    if (chapter === 'prime' && last && last.rating >= 7.2) return 'Estás en tu mejor momento.';
    if (last && last.overallAfter < last.overallBefore) return 'No sos el mismo jugador. Hay que adaptarse.';
    return 'No sos el mismo jugador.';
  }

  function marketSituationLine(situation) {
    return (
      {
        decision: 'El mercado está abierto.',
        market_cold: 'El teléfono no suena. Hay que decidir con la cabeza fría.',
        club_wants_you: 'El club quiere que te quedes.',
        europe_interest: 'Europa llama.',
        loan_suggested: 'Una cesión puede destrabarte.',
        step_up: 'Hay un salto posible.',
        loan_end: 'Se termina el préstamo.',
        no_club: 'Sin club. Hay que rearmar el camino.'
      }[situation] || 'Decidí tu próximo paso.'
    );
  }

  function legacyLine(career) {
    var arch = career.legacy && career.legacy.archetype;
    return ARCHETYPE_LINE[arch] || 'SE TERMINÓ UNA CARRERA.';
  }

  function trophyTitle(competitionId) {
    var c = NS.Providers.competitions.getById(competitionId);
    if (!c) return 'CAMPEÓN';
    if (competitionId === 'fifa_world_cup') return 'CAMPEÓN DEL MUNDO';
    if (competitionId === 'uefa_cl') return 'CAMPEÓN DE EUROPA';
    if (competitionId === 'conmebol_libertadores') return 'CAMPEÓN DE AMÉRICA';
    if (competitionId === 'uefa_euro') return 'CAMPEÓN DE EUROPA';
    if (competitionId === 'conmebol_copa_america') return 'CAMPEÓN DE AMÉRICA';
    return 'CAMPEÓN · ' + (c.shortName || c.name).toUpperCase();
  }

  function competitionDisplayName(competitionId) {
    var c = NS.Providers.competitions.getById(competitionId);
    return c ? (c.name || c.shortName || competitionId).toUpperCase() : String(competitionId || '').toUpperCase();
  }

  function awardTitle(awardId) {
    var a = NS.Providers.awards.getById(awardId);
    if (awardId === 'ballon_dor') return 'BALÓN DE ORO';
    return ((a && (a.shortName || a.name)) || awardId).toUpperCase();
  }

  function momentLine(type) {
    return (
      {
        debut_national_team: 'DEBUT EN LA SELECCIÓN.',
        first_goal: 'TU PRIMER GOL.',
        first_title: 'TU PRIMER TÍTULO.',
        major_injury: 'UNA LESIÓN QUE MARCA.',
        comeback: 'EL COMEBACK.',
        major_transfer: 'UN CAMBIO DE DESTINO.',
        world_cup: 'EL MUNDIAL.',
        continental_title: 'TÍTULO CONTINENTAL.',
        loan: 'NUEVA CASA POR UNA TEMPORADA.',
        ballon_dor: 'BALÓN DE ORO.',
        retirement: 'SE TERMINÓ UNA CARRERA.'
      }[type] || 'UN MOMENTO CLAVE.'
    );
  }

  UI.Narrative = {
    roleLabel: roleLabel,
    pathMeta: pathMeta,
    ageChapter: ageChapter,
    ageChapterTitle: ageChapterTitle,
    archetypeLabel: archetypeLabel,
    majorTitles: majorTitles,
    trophyPhrase: trophyPhrase,
    competitionDisplayName: competitionDisplayName,
    preseasonLine: preseasonLine,
    seasonStakeLine: seasonStakeLine,
    recapHeadline: recapHeadline,
    ageUpLine: ageUpLine,
    marketSituationLine: marketSituationLine,
    legacyLine: legacyLine,
    trophyTitle: trophyTitle,
    awardTitle: awardTitle,
    momentLine: momentLine,
    ARCHETYPE_LINE: ARCHETYPE_LINE,
    ARCHETYPE_LABEL: ARCHETYPE_LABEL
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
