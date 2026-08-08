/**
 * Transfer / loan / stay market — trajectory-aware, never invents clubs.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});
  var Rules = Engine.Rules;

  function offerFingerprint(option) {
    return [option.type, option.clubId || 'stay', option.role || '', option.kind || ''].join(':');
  }

  function recentlyLeft(career, clubId) {
    return (career.marketMemory.recentClubIds || []).indexOf(clubId) !== -1;
  }

  function yearsAtClub(career) {
    return career.marketMemory.yearsAtClub || 0;
  }

  function clubCareerLevel(club) {
    if (!club) return 0;
    var rank = Rules.bandRank(Rules.clubBand(club));
    var prestige = club.prestige || 50;
    var tier = club.tier || 3;
    return rank * 12 + prestige / 10 + tier;
  }

  function previousClubIds(career) {
    var ids = [];
    var seen = Object.create(null);
    (career.clubs || []).forEach(function (spell) {
      if (!spell || !spell.clubId || spell.clubId === career.currentClubId) return;
      if (seen[spell.clubId]) return;
      seen[spell.clubId] = 1;
      ids.push(spell.clubId);
    });
    return ids;
  }

  function familiarLeagueIds(career) {
    var leagues = Object.create(null);
    (career.clubs || []).forEach(function (spell) {
      var c = NS.Providers.clubs.getById(spell.clubId);
      if (c && c.leagueId) leagues[c.leagueId] = 1;
    });
    return leagues;
  }

  function seasonForm(career) {
    var p = career.player;
    var last = (career.seasons && career.seasons[career.seasons.length - 1]) || {};
    var rating = last.rating || 6.5;
    var minutes = last.minutes || 0;
    var delta =
      (last.overallAfter != null ? last.overallAfter : p.overall) -
      (last.overallBefore != null ? last.overallBefore : p.overall);
    var form = p.form || 50;
    var injury = (last.injurySeverity || 0) >= 2;
    var great =
      !injury &&
      ((rating >= 7.35 && minutes >= 1800 && delta >= 1) ||
        (rating >= 7.2 && minutes >= 2200 && delta >= 2) ||
        (delta >= 3 && minutes >= 1500));
    var good =
      !injury &&
      (great ||
        rating >= 7.05 ||
        (form >= 68 && minutes >= 1600) ||
        (delta >= 2 && minutes >= 1400) ||
        (rating >= 6.9 && minutes >= 2000 && form >= 60));
    var poor =
      injury ||
      (rating < 6.45 && form < 52) ||
      minutes < 900 ||
      delta <= -2 ||
      (career.role === 'substitute' && minutes < 1200);
    return {
      good: good,
      great: great,
      poor: poor,
      rating: rating,
      minutes: minutes,
      delta: delta,
      form: form,
      injury: injury
    };
  }

  /** Trajectory snapshot for market decisions — derived only from existing career data. */
  function buildCareerMarketProfile(career) {
    var form = seasonForm(career);
    var p = career.player;
    var titles = career.titles || [];
    var hasCL = titles.some(function (t) {
      return t.competitionId === 'uefa_cl';
    });
    var hasLib = titles.some(function (t) {
      return t.competitionId === 'conmebol_libertadores';
    });
    var hasWC = titles.some(function (t) {
      return t.competitionId === 'fifa_world_cup';
    });
    var hasContNT = titles.some(function (t) {
      return t.competitionId === 'uefa_euro' || t.competitionId === 'conmebol_copa_america';
    });
    var caps = (career.nationalTeam && career.nationalTeam.caps) || 0;
    var fromClub = NS.Providers.clubs.getById(career.currentClubId);
    var fromRank = fromClub ? Rules.bandRank(Rules.clubBand(fromClub)) : 3;
    var years = yearsAtClub(career);
    var prev = previousClubIds(career);
    var contractPressure = (career.contractYears || 0) <= 1;
    var lowMinutes = form.minutes < 1400;
    var benchRole =
      career.role === 'youth_prospect' ||
      career.role === 'substitute' ||
      career.role === 'rotation';
    var comebackRecent = (career.moments || []).some(function (m) {
      return m.type === 'comeback' && m.seasonIndex >= (career.seasonIndex || 1) - 2;
    });
    return {
      form: form,
      age: p.age,
      overall: p.overall,
      reputation: p.reputation || 0,
      potential: p.potential || p.overall,
      fromClub: fromClub,
      fromRank: fromRank,
      fromLevel: clubCareerLevel(fromClub),
      yearsAtClub: years,
      previousClubIds: prev,
      familiarLeagues: familiarLeagueIds(career),
      hasCL: hasCL,
      hasLib: hasLib,
      hasWC: hasWC,
      hasContNT: hasContNT,
      caps: caps,
      contractPressure: contractPressure,
      lowMinutes: lowMinutes,
      benchRole: benchRole,
      young: p.age <= 22,
      prime: p.age >= 23 && p.age <= 29,
      veteran: p.age >= 30,
      comebackRecent: comebackRecent,
      playedEurope: !!(career.flags && career.flags.playedEurope),
      playedSouthAmerica: !!(career.flags && career.flags.playedSouthAmerica)
    };
  }

  function offerReason(profile, moveKind, toClub, fromClub) {
    if (moveKind === 'RIVAL') return 'No es un traspaso cualquiera.';
    if (moveKind === 'RETURN') return 'Volvés al lugar donde ya escribiste historia.';
    if (moveKind === 'LOAN') return 'Te ofrecen protagonismo y minutos.';
    if (moveKind === 'HOME') return 'Regreso a tu mercado.';
    if (moveKind === 'GIANT') return 'Un club de élite midió tu momento.';
    if (moveKind === 'EUROPE') return 'Europa te pone en la agenda.';
    if (moveKind === 'RECOVERY') return 'Un proyecto para recuperar ritmo.';
    if (moveKind === 'STEP_UP') return 'Buscan un salto de nivel contigo.';
    if (profile.caps >= 10) return 'Tu nivel internacional elevó tu perfil.';
    if (profile.young && (toClub.youthLevel || 0) >= 75) return 'Buscan talento para desarrollar.';
    if (profile.veteran) return 'Buscan experiencia.';
    if (profile.lowMinutes || profile.benchRole) return 'Te ofrecen protagonismo.';
    if ((toClub.squadStrength || 70) - profile.overall <= 2) return 'Buscan un titular.';
    return 'Ven un encaje deportivo.';
  }

  function buildStayOption(career, club, profile) {
    var gains = ['Continuidad', 'Minutos estables', 'Vínculo con el club'];
    var risks = ['Menor salto de prestigio', 'Puede estancar exposición'];
    if (profile && profile.yearsAtClub >= 5) {
      gains = ['Identidad', 'Casa', 'Continuidad'];
      risks = ['Menos escaparate', 'Rutina'];
    }
    return {
      type: 'stay',
      kind: 'STAY',
      clubId: club.id,
      label: 'Quedarte',
      role: career.role,
      expectedMinutes: Rules.expectedMinutes(career.role),
      gains: gains,
      risks: risks,
      reason: profile && profile.yearsAtClub >= 5 ? 'El club ya es parte de tu historia.' : 'El proyecto continúa.',
      prestige: club.prestige,
      band: Rules.clubBand(club)
    };
  }

  function classifyMove(career, fromClub, toClub, profile) {
    var Rivalries = Engine.Rivalries;
    if (Rivalries && Rivalries.isRival(fromClub.id, toClub.id)) return 'RIVAL';
    if (profile && profile.previousClubIds.indexOf(toClub.id) !== -1) return 'RETURN';
    var a = Rules.bandRank(Rules.clubBand(fromClub));
    var b = Rules.bandRank(Rules.clubBand(toClub));
    if (b >= 6 && b > a) return 'GIANT';
    if (toClub.continent === 'EU' && fromClub.continent === 'SA') return 'EUROPE';
    if (toClub.continent === 'SA' && fromClub.continent === 'EU') {
      if (toClub.countryCode === career.player.country) return 'HOME';
      return 'SOUTH_AMERICA';
    }
    if (toClub.countryCode === career.player.country && fromClub.countryCode !== career.player.country) {
      return 'HOME';
    }
    if (profile && profile.familiarLeagues[toClub.leagueId] && toClub.leagueId !== fromClub.leagueId) {
      if (b >= a - 1 && b <= a + 1) return 'FAMILIAR_LEAGUE';
    }
    if (b >= a + 2) return 'STEP_UP';
    if (b > a) return 'STEP_UP';
    if (b <= a - 2) return profile && profile.form.poor ? 'RECOVERY' : 'RECOVERY';
    if (b < a) return profile && profile.form.poor ? 'RECOVERY' : 'RECOVERY';
    return 'SIDEWAYS';
  }

  function rivalEligible(profile, fromClub, toClub) {
    if (!Engine.Rivalries || !Engine.Rivalries.isRival(fromClub.id, toClub.id)) return false;
    if (profile.form.injury) return false;
    if (profile.form.poor) return false;
    if (!profile.form.good && !profile.form.great) return false;
    if (profile.overall < 76) return false;
    if (profile.age < 21 || profile.age > 32) return false;
    if (profile.yearsAtClub < 1) return false;
    var intensity = Engine.Rivalries.intensityBetween(fromClub.id, toClub.id);
    if (intensity === 'ARCHRIVAL') {
      return (
        profile.overall >= 78 &&
        (profile.form.great ||
          profile.reputation >= 68 ||
          profile.caps >= 10 ||
          (profile.form.good && profile.overall >= 82))
      );
    }
    return profile.overall >= 76 && (profile.form.good || profile.caps >= 6);
  }

  function scoreClubForInterest(career, club, rng, profile) {
    var p = career.player;
    profile = profile || buildCareerMarketProfile(career);
    if (!Rules.canJoinClub(p, club)) return 0;
    if (club.id === career.currentClubId) return 0;
    if (recentlyLeft(career, club.id)) return 0;
    if ((career.marketMemory.rejectedClubIds || []).indexOf(club.id) !== -1 && rng.chance(0.78)) return 0;

    var fromClub = profile.fromClub;
    if (!fromClub) return 0;

    var Rivalries = Engine.Rivalries;
    var isRival = Rivalries && Rivalries.isRival(fromClub.id, club.id);
    if (isRival && !rivalEligible(profile, fromClub, club)) return 0;

    if (fromClub.continent !== club.continent) {
      if (Engine.Eligibility && !Engine.Eligibility.isCredibleInternationalMove(career, fromClub, club)) {
        return 0;
      }
    }

    var band = Rules.clubBand(club);
    var rank = Rules.bandRank(band);
    var max = Rules.bandRank(Rules.maxClubBandForPlayer(p));
    if (rank > max) return 0;

    var fromRank = profile.fromRank;
    // Hard gate: great/good seasons should not chase clearly inferior clubs as primary interest
    if (profile.form.good && !isRival && profile.previousClubIds.indexOf(club.id) === -1) {
      if (rank <= fromRank - 2) return 0;
    }
    if (profile.form.great && !isRival && profile.previousClubIds.indexOf(club.id) === -1) {
      if (rank < fromRank) return 0;
    }

    var score = 10;
    score += Math.max(0, 20 - Math.abs(club.squadStrength - p.overall));
    score += (p.reputation || 0) / 8;
    score += (clubCareerLevel(club) - profile.fromLevel) * 0.35;

    if (profile.form.form >= 70) score += 8;
    if (profile.form.rating >= 7.2) score += 10;
    if (profile.form.great) score += 12;
    if (p.age <= 22 && (club.youthLevel || 0) >= 80) score += 12;
    if (p.age >= 32 && rank >= 6) score -= 15;
    if (p.age <= 21 && rank >= 6 && profile.benchRole) score -= 8;

    if (profile.hasCL) score += 8;
    if (profile.hasLib) score += 7;
    if (profile.hasWC) score += 10;
    if (profile.hasContNT) score += 5;
    if (profile.caps >= 10) score += 6;
    if (profile.caps >= 30) score += 4;
    if (profile.contractPressure) score += 5;
    if (profile.yearsAtClub >= 4 && rank >= fromRank) score += 4;
    if (profile.comebackRecent && profile.form.good) score += 6;
    if (profile.form.injury) score *= 0.2;
    else if ((career.seasons[career.seasons.length - 1] || {}).injurySeverity >= 1) score *= 0.7;

    if (profile.previousClubIds.indexOf(club.id) !== -1) {
      score += 18;
    }
    if (profile.familiarLeagues[club.leagueId]) score += 6;

    if (profile.form.good) {
      if (rank >= fromRank) score *= 1.45;
      if (rank > fromRank) score *= 1.3;
      if (rank === fromRank) score *= 1.12;
    } else if (profile.form.poor) {
      if (rank < fromRank) score *= 1.35;
      if (rank <= fromRank - 1) score *= 1.15;
      if (rank > fromRank + 1) score *= 0.4;
    }

    if (club.countryCode === p.country) score += 8;
    score += rng.next() * (profile.form.good ? 3 : 6);

    var fromCont = fromClub.continent;
    var homeCont = Engine.Eligibility ? Engine.Eligibility.playerHomeContinent(career) : null;
    if (club.continent === 'EU' && fromCont === 'SA' && p.overall >= 76) score += 10;
    if (club.continent === 'EU' && fromCont === 'SA' && p.overall < 74) score *= 0.35;
    if (club.continent === 'SA' && fromCont === 'EU') {
      if (club.countryCode === p.country) score += 14;
      if (p.age >= 30) score += 8;
      if (p.age < 28) score *= 0.45;
      if (p.age < 26) score *= 0.15;
      if (homeCont === 'EU') score *= 0.25;
    }
    if (fromCont === 'SA' && club.continent === 'SA' && club.countryCode !== p.country) {
      if (['VE', 'BO', 'PY', 'EC', 'PE'].indexOf(club.countryCode) !== -1) score += 6;
    }

    var level =
      Engine.Eligibility && Engine.Eligibility.leagueLevel ? Engine.Eligibility.leagueLevel(club) : 1;
    if (level >= 2) {
      if (profile.lowMinutes || profile.benchRole || profile.form.poor) score += 10;
      else score *= 0.35;
    }

    if (club.countryCode === p.country && p.age >= 30 && fromCont && club.continent !== fromCont) {
      score += 12;
    }

    if (rank >= 6) {
      var gap = (club.squadStrength || 70) - p.overall;
      if (gap > 8) score *= 0.35;
      if (gap > 12) score *= 0.15;
      if (profile.overall < 80 && !profile.hasCL && !profile.hasLib) score *= 0.5;
    }

    if (isRival) {
      // Rare and prestigious — keep score high only when eligible
      score *= Engine.Rivalries.isArchRival(fromClub.id, club.id) ? 1.55 : 1.35;
    }

    return Math.max(0, score);
  }

  function makeTransferOption(career, fromClub, toClub, kind, profile) {
    profile = profile || buildCareerMarketProfile(career);
    var gap = (toClub.squadStrength || 70) - career.player.overall;
    var role = 'starter';
    if (gap > 12) role = 'rotation';
    else if (gap > 6) role = 'regular';
    else if (gap > 0) role = 'starter';
    else role = career.player.overall >= 84 ? 'key_player' : 'starter';

    var league = NS.Providers.clubs.getLeague ? NS.Providers.clubs.getLeague(toClub.leagueId) : null;
    var moveKind = kind || classifyMove(career, fromClub, toClub, profile);
    // Rival always wins over forced HOME/STEP_UP labels
    if (Engine.Rivalries && Engine.Rivalries.isRival(fromClub.id, toClub.id)) {
      moveKind = 'RIVAL';
    }
    var gains = ['Nuevo proyecto', 'Cambio de contexto'];
    var risks = gap > 8 ? ['Menos minutos', 'Adaptación'] : ['Adaptación', 'Expectativa'];

    if (moveKind === 'RIVAL') {
      gains = ['Polémica', 'Protagonismo extremo', 'Historia'];
      risks = ['Rechazo hinchas', 'Presión máxima', 'Herida abierta'];
    } else if (moveKind === 'RETURN') {
      gains = ['Regreso', 'Identidad', 'Cierre de círculo'];
      risks = ['Expectativa local', 'Comparaciones'];
    } else if (moveKind === 'EUROPE') {
      gains = ['Europa', 'Exposición', 'Techo más alto'];
      risks = gap > 6 ? ['Menos minutos', 'Adaptación'] : ['Adaptación', 'Competencia'];
    } else if (moveKind === 'HOME') {
      gains = ['Regreso a casa', 'Protagonismo', 'Historia'];
      risks = ['Expectativa local', 'Menos escaparate europeo'];
    } else if (moveKind === 'STEP_UP' || moveKind === 'GIANT') {
      gains = moveKind === 'GIANT' ? ['Élite', 'Prestigio', 'Escenario máximo'] : ['Salto de nivel', 'Prestigio', 'Competición mayor'];
      risks = gap > 6 ? ['Riesgo de banco', 'Adaptación'] : ['Expectativa', 'Competencia interna'];
    } else if (moveKind === 'RECOVERY') {
      gains = ['Más minutos', 'Confianza', 'Protagonismo'];
      risks = ['Menor prestigio', 'Techo más bajo'];
    } else if (moveKind === 'SIDEWAYS' || moveKind === 'FAMILIAR_LEAGUE' || moveKind === 'LATERAL') {
      gains = ['Cambio de aire', 'Seguir compitiendo'];
      risks = ['Misma exigencia', 'Adaptación'];
      if (moveKind === 'LATERAL') moveKind = 'SIDEWAYS';
    } else if (moveKind === 'SOUTH_AMERICA') {
      gains = ['Sudamérica', 'Nuevo capítulo', 'Identidad'];
      risks = ['Cambio de contexto', 'Expectativa'];
    } else if (moveKind === 'MINUTES' || moveKind === 'DECLINE') {
      moveKind = 'RECOVERY';
      gains = ['Más minutos', 'Confianza', 'Protagonismo'];
      risks = ['Menor prestigio', 'Techo más bajo'];
    }

    return {
      type: 'transfer',
      kind: moveKind,
      clubId: toClub.id,
      label: 'Fichar',
      role: role,
      expectedMinutes: Rules.expectedMinutes(role),
      gains: gains,
      risks: risks,
      reason: offerReason(profile, moveKind, toClub, fromClub),
      prestige: toClub.prestige,
      band: Rules.clubBand(toClub),
      fromClubId: fromClub.id,
      leagueId: toClub.leagueId || null,
      leagueName: (league && league.name) || toClub.league || '',
      countryCode: toClub.countryCode || '',
      continent: toClub.continent || '',
      rivalry: Engine.Rivalries ? Engine.Rivalries.intensityBetween(fromClub.id, toClub.id) : null
    };
  }

  function makeLoanOption(career, fromClub, toClub, profile) {
    profile = profile || buildCareerMarketProfile(career);
    var role = 'starter';
    if ((toClub.squadStrength || 70) - career.player.overall > 6) role = 'regular';
    var league = NS.Providers.clubs.getLeague ? NS.Providers.clubs.getLeague(toClub.leagueId) : null;
    return {
      type: 'loan',
      kind: 'LOAN',
      clubId: toClub.id,
      label: 'Cesión',
      role: role,
      expectedMinutes: Rules.expectedMinutes(role),
      gains: ['Minutos', 'Desarrollo', 'Visibilidad'],
      risks: ['Temporal', 'Vuelves al club de origen'],
      reason: offerReason(profile, 'LOAN', toClub, fromClub),
      prestige: toClub.prestige,
      band: Rules.clubBand(toClub),
      fromClubId: fromClub.id,
      loanFromClubId: fromClub.id,
      leagueId: toClub.leagueId || null,
      leagueName: (league && league.name) || toClub.league || '',
      countryCode: toClub.countryCode || '',
      continent: toClub.continent || ''
    };
  }

  function generateMarket(career, rng) {
    var clubsProvider = NS.Providers.clubs;
    var fromClub = clubsProvider.getById(career.currentClubId);
    if (!fromClub) return { situation: 'no_club', options: [], profile: null };

    if (career.onLoan) {
      return {
        situation: 'loan_end',
        profile: buildCareerMarketProfile(career),
        options: [
          {
            type: 'loan_return',
            kind: 'RETURN',
            clubId: career.loanFromClubId,
            label: 'Volver del préstamo',
            role: 'rotation',
            expectedMinutes: Rules.expectedMinutes('rotation'),
            gains: ['Regreso', 'Nueva oportunidad'],
            risks: ['Competencia por el puesto'],
            reason: 'Se termina la cesión.',
            prestige: (clubsProvider.getById(career.loanFromClubId) || fromClub).prestige,
            band: Rules.clubBand(clubsProvider.getById(career.loanFromClubId) || fromClub)
          }
        ]
      };
    }

    var profile = buildCareerMarketProfile(career);
    var options = [];
    var stay = buildStayOption(career, fromClub, profile);
    options.push(stay);

    var all = clubsProvider.getAll();
    var scored = [];
    for (var i = 0; i < all.length; i++) {
      var s = scoreClubForInterest(career, all[i], rng, profile);
      if (s > 0) scored.push({ club: all[i], score: s });
    }
    scored.sort(function (a, b) {
      return b.score - a.score;
    });

    var p = career.player;
    var last = career.seasons[career.seasons.length - 1] || {};
    var fromRank = profile.fromRank;
    var formState = profile.form;

    // Loan — young players short of minutes at big clubs
    var loanChance = 0;
    if (profile.form.injury) loanChance = 0;
    else if (profile.young && fromRank >= 5 && (profile.lowMinutes || profile.benchRole) && profile.potential >= 76) {
      loanChance = 0.72;
    } else if (profile.young && fromRank >= 4 && profile.lowMinutes && profile.potential >= 78) {
      loanChance = 0.45;
    } else if (p.age <= 23 && profile.benchRole && profile.lowMinutes) {
      loanChance = 0.28;
    }

    var used = {};
    if (rng.chance(loanChance)) {
      var loanPool = scored
        .filter(function (x) {
          var r = Rules.bandRank(Rules.clubBand(x.club));
          return r <= fromRank - 1 && r >= 1 && x.club.id !== fromClub.id;
        })
        .slice(0, 20);
      if (!loanPool.length) {
        loanPool = clubsProvider
          .getAll()
          .filter(function (c) {
            var r = Rules.bandRank(Rules.clubBand(c));
            return c.id !== fromClub.id && r <= fromRank - 1 && r >= 2 && Rules.canJoinClub(p, c);
          })
          .slice(0, 20)
          .map(function (c) {
            return { club: c, score: 10 + (c.youthLevel || 40) / 10 };
          });
      }
      if (loanPool.length) {
        var loanClub = rng.weighted(loanPool, function (x) {
          return x.score;
        }).club;
        used[loanClub.id] = 1;
        options.push(makeLoanOption(career, fromClub, loanClub, profile));
      }
    }

    // Transfer volume by form — not every season needs a move
    var interest = formState.great || formState.good || p.form >= 68 || p.overall >= 78;
    var cold = formState.poor || formState.injury;
    var transferCount = 0;
    if (cold) transferCount = rng.chance(0.4) ? 1 : 0;
    else if (formState.great) transferCount = rng.chance(0.82) ? rng.int(1, 2) : 1;
    else if (interest) transferCount = rng.chance(0.62) ? rng.int(1, 2) : rng.chance(0.35) ? 1 : 0;
    else transferCount = rng.chance(0.32) ? 1 : 0;

    for (var t = 0; t < transferCount; t++) {
      var eligible = scored.filter(function (x) {
        if (used[x.club.id]) return false;
        if (!Rules.canJoinClub(p, x.club)) return false;
        // Never put rivals into the generic transfer pool
        if (Engine.Rivalries && Engine.Rivalries.isRival(fromClub.id, x.club.id)) return false;
        return true;
      });
      if (formState.good || formState.great) {
        var floor = formState.great ? fromRank : fromRank;
        var up = eligible.filter(function (x) {
          return Rules.bandRank(Rules.clubBand(x.club)) >= floor;
        });
        if (up.length >= 3) eligible = up;
      } else if (formState.poor) {
        var down = eligible.filter(function (x) {
          var r = Rules.bandRank(Rules.clubBand(x.club));
          return r <= fromRank && r >= Math.max(1, fromRank - 2);
        });
        if (down.length >= 3) eligible = down;
      }
      var pool = eligible.slice(0, formState.good ? 20 : 28);
      if (!formState.good && !formState.great && eligible.length > 40 && rng.chance(0.28)) {
        pool = pool.concat(eligible.slice(28, 80));
      }
      if (!pool.length) break;
      var pick = rng.weighted(pool, function (x) {
        return x.score;
      }).club;
      used[pick.id] = 1;
      options.push(makeTransferOption(career, fromClub, pick, null, profile));
    }

    // Rival tease — exceptional only (Figo/Campbell-class rarity)
    var rivalList = Engine.Rivalries ? Engine.Rivalries.rivalsOf(fromClub.id) : [];
    if (rivalList.length && !formState.injury && formState.good) {
      var hasArch = rivalList.some(function (r) {
        return r.intensity === 'ARCHRIVAL';
      });
      var rivalChance = hasArch ? (profile.form.great ? 0.09 : 0.04) : profile.form.great ? 0.1 : 0.05;
      if (profile.contractPressure) rivalChance += 0.02;
      if (profile.yearsAtClub >= 4) rivalChance += 0.02;
      if (rng.chance(rivalChance)) {
        var rivalCandidates = rivalList
          .map(function (r) {
            return clubsProvider.getById(r.clubId);
          })
          .filter(function (c) {
            return c && !used[c.id] && rivalEligible(profile, fromClub, c) && Rules.canJoinClub(p, c);
          });
        if (rivalCandidates.length) {
          var rivalClub = rng.pick(rivalCandidates);
          used[rivalClub.id] = 1;
          options.push(makeTransferOption(career, fromClub, rivalClub, 'RIVAL', profile));
        }
      }
    }

    // Return to a previous club (still respects international credibility)
    if (profile.previousClubIds.length && rng.chance(profile.veteran ? 0.22 : profile.form.poor ? 0.12 : 0.06)) {
      var backId = rng.pick(profile.previousClubIds);
      var backClub = clubsProvider.getById(backId);
      if (
        backClub &&
        !used[backClub.id] &&
        Rules.canJoinClub(p, backClub) &&
        !(
          fromClub.continent !== backClub.continent &&
          Engine.Eligibility &&
          !Engine.Eligibility.isCredibleInternationalMove(career, fromClub, backClub)
        )
      ) {
        used[backClub.id] = 1;
        options.push(makeTransferOption(career, fromClub, backClub, 'RETURN', profile));
      }
    }

    // Home return tease
    if (
      career.flags.playedEurope &&
      ((p.age >= 29 && rng.chance(0.38)) ||
        (p.age >= 27 && (profile.lowMinutes || (p.form || 50) < 50) && rng.chance(0.28)))
    ) {
      var home = scored.filter(function (x) {
        return (
          !used[x.club.id] &&
          x.club.countryCode === p.country &&
          Rules.bandRank(Rules.clubBand(x.club)) >= 3 &&
          !(Engine.Rivalries && Engine.Rivalries.isRival(fromClub.id, x.club.id)) &&
          Engine.Eligibility.isCredibleInternationalMove(career, fromClub, x.club)
        );
      });
      if (home.length) {
        var h = rng.pick(home).club;
        used[h.id] = 1;
        options.push(makeTransferOption(career, fromClub, h, 'HOME', profile));
      }
    }

    // Prefer meaningful extras: rival/giant/step_up/europe before noise
    var extras = options.slice(1);
    extras.sort(function (a, b) {
      var rank = function (o) {
        if (o.kind === 'RIVAL') return 100;
        if (o.kind === 'GIANT') return 90;
        if (o.kind === 'EUROPE') return 80;
        if (o.kind === 'RETURN') return 75;
        if (o.kind === 'STEP_UP') return 70;
        if (o.type === 'loan') return 60;
        if (o.kind === 'HOME') return 55;
        return 40;
      };
      return rank(b) - rank(a);
    });
    // Keep stay + up to 2 others; if good form, drop recovery/inferior leftovers
    if (formState.good || formState.great) {
      extras = extras.filter(function (o) {
        if (o.type === 'loan') return true;
        if (o.kind === 'RIVAL' || o.kind === 'RETURN' || o.kind === 'HOME' || o.kind === 'GIANT') return true;
        if (o.kind === 'RECOVERY' || o.kind === 'DECLINE' || o.kind === 'MINUTES') return false;
        var to = clubsProvider.getById(o.clubId);
        if (!to) return false;
        return Rules.bandRank(Rules.clubBand(to)) >= fromRank - (formState.great ? 0 : 0);
      });
    }
    extras = extras.slice(0, 2);
    options = [stay].concat(extras);

    career.marketMemory.lastOfferFingerprints = options.map(offerFingerprint);

    var situation = 'decision';
    if (extras.length === 0) situation = cold ? 'market_cold' : 'club_wants_you';
    else if (extras.some(function (o) {
      return o.kind === 'RIVAL';
    }))
      situation = 'rival_interest';
    else if (extras.some(function (o) {
      return o.kind === 'EUROPE';
    }))
      situation = 'europe_interest';
    else if (extras.some(function (o) {
      return o.type === 'loan';
    }))
      situation = 'loan_suggested';
    else if (extras.some(function (o) {
      return o.kind === 'STEP_UP' || o.kind === 'GIANT';
    }))
      situation = 'step_up';
    else if (extras.some(function (o) {
      return o.kind === 'RETURN' || o.kind === 'HOME';
    }))
      situation = 'home_interest';

    return { situation: situation, options: options, profile: profile };
  }

  Engine.Market = {
    generateMarket: generateMarket,
    offerFingerprint: offerFingerprint,
    yearsAtClub: yearsAtClub,
    seasonForm: seasonForm,
    buildCareerMarketProfile: buildCareerMarketProfile,
    clubCareerLevel: clubCareerLevel,
    classifyMove: classifyMove,
    rivalEligible: rivalEligible
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
