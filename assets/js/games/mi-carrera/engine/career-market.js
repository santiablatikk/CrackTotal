/**
 * Transfer / loan / stay market generation with memory and gates.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});
  var Rules = Engine.Rules;

  function offerFingerprint(option) {
    return [option.type, option.clubId || 'stay', option.role || ''].join(':');
  }

  function recentlyLeft(career, clubId) {
    return (career.marketMemory.recentClubIds || []).indexOf(clubId) !== -1;
  }

  function yearsAtClub(career) {
    return career.marketMemory.yearsAtClub || 0;
  }

  function buildStayOption(career, club) {
    return {
      type: 'stay',
      kind: 'STAY',
      clubId: club.id,
      label: 'Quedarte',
      role: career.role,
      expectedMinutes: Rules.expectedMinutes(career.role),
      gains: ['Continuidad', 'Minutos estables', 'Vínculo con el club'],
      risks: ['Menor salto de prestigio', 'Puede estancar exposición'],
      prestige: club.prestige,
      band: Rules.clubBand(club)
    };
  }

  function scoreClubForInterest(career, club, rng) {
    var p = career.player;
    if (!Rules.canJoinClub(p, club)) return 0;
    if (club.id === career.currentClubId) return 0;
    if (recentlyLeft(career, club.id)) return 0;
    if ((career.marketMemory.rejectedClubIds || []).indexOf(club.id) !== -1 && rng.chance(0.7)) return 0;

    var fromClub = NS.Providers.clubs.getById(career.currentClubId);
    if (fromClub && fromClub.continent !== club.continent) {
      if (Engine.Eligibility && !Engine.Eligibility.isCredibleInternationalMove(career, fromClub, club)) {
        return 0;
      }
    }

    var band = Rules.clubBand(club);
    var rank = Rules.bandRank(band);
    var max = Rules.bandRank(Rules.maxClubBandForPlayer(p));
    if (rank > max) return 0;

    var score = 10;
    score += Math.max(0, 20 - Math.abs(club.squadStrength - p.overall));
    score += (p.reputation || 0) / 8;
    if ((p.form || 50) >= 70) score += 8;
    if ((career.seasons[career.seasons.length - 1] || {}).rating >= 7.2) score += 10;
    if (p.age <= 22 && (club.youthLevel || 0) >= 80) score += 12;
    if (p.age >= 32 && rank >= 6) score -= 15;
    if (p.age <= 21 && rank >= 6 && (career.role === 'youth_prospect' || career.role === 'substitute')) score -= 8;

    // Prefer home country affinity
    var country = p.country;
    if (club.countryCode === country) score += 8;
    // Soft catalog spread: small noise so mid-table clubs can surface
    score += rng.next() * 6;

    var fromCont = fromContinent(career);
    var homeCont = Engine.Eligibility ? Engine.Eligibility.playerHomeContinent(career) : null;
    var last = (career.seasons && career.seasons[career.seasons.length - 1]) || {};
    var lowMinutes = (last.minutes || 0) < 1400;
    var benchRole =
      career.role === 'youth_prospect' ||
      career.role === 'substitute' ||
      career.role === 'rotation';

    // SA → EU pathway boost for ready players
    if (club.continent === 'EU' && fromCont === 'SA' && p.overall >= 76) score += 10;
    if (club.continent === 'EU' && fromCont === 'SA' && p.overall < 74) score *= 0.35;

    // EU → SA: contextual only (hard gate above). Soft weighting when allowed.
    if (club.continent === 'SA' && fromCont === 'EU') {
      if (club.countryCode === country) score += 14;
      if (p.age >= 30) score += 8;
      if (p.age < 28) score *= 0.45;
      if (p.age < 26) score *= 0.15;
      if (homeCont === 'EU') score *= 0.25;
    }

    // Keep CONMEBOL periphery reachable (VE/BO/PY/EC/PE) for SA careers
    if (fromCont === 'SA' && club.continent === 'SA' && club.countryCode !== country) {
      if (['VE', 'BO', 'PY', 'EC', 'PE'].indexOf(club.countryCode) !== -1) score += 6;
    }

    // Minutes pathway: second divisions matter when you need games
    var level =
      Engine.Eligibility && Engine.Eligibility.leagueLevel ? Engine.Eligibility.leagueLevel(club) : 1;
    if (level >= 2) {
      if (lowMinutes || benchRole || (p.form || 50) < 48) score += 10;
      else score *= 0.42;
    }

    // Late-career home return pull
    if (club.countryCode === country && p.age >= 30 && fromCont && club.continent !== fromCont) {
      score += 12;
    }

    // Giants: require closer overall match
    if (rank >= 6) {
      var gap = (club.squadStrength || 70) - p.overall;
      if (gap > 8) score *= 0.4;
      if (gap > 12) score *= 0.2;
    }

    return Math.max(0, score);
  }

  function fromContinent(career) {
    var c = NS.Providers.clubs.getById(career.currentClubId);
    return c ? c.continent : null;
  }

  function classifyMove(fromClub, toClub) {
    var a = Rules.bandRank(Rules.clubBand(fromClub));
    var b = Rules.bandRank(Rules.clubBand(toClub));
    if (toClub.continent === 'EU' && fromClub.continent === 'SA') return 'EUROPE';
    if (toClub.continent === 'SA' && fromClub.continent === 'EU') return 'SOUTH_AMERICA';
    if (b >= a + 2) return 'STEP_UP';
    if (b <= a - 2) return 'DECLINE';
    if (b > a) return 'STEP_UP';
    if (b < a) return 'MINUTES';
    return 'LATERAL';
  }

  function makeTransferOption(career, fromClub, toClub, kind) {
    var role = Rules.roleFromContext(career.player, toClub, { chance: function () { return false; }, next: function () { return 0.5; }, int: function (a, b) { return a; } });
    // Approximate role without rng dependency issues
    var gap = (toClub.squadStrength || 70) - career.player.overall;
    if (gap > 12) role = 'rotation';
    else if (gap > 6) role = 'regular';
    else if (gap > 0) role = 'starter';
    else role = career.player.overall >= 84 ? 'key_player' : 'starter';

    var league = NS.Providers.clubs.getLeague ? NS.Providers.clubs.getLeague(toClub.leagueId) : null;
    var moveKind = kind || classifyMove(fromClub, toClub);
    var gains = ['Nuevo proyecto', 'Cambio de contexto'];
    var risks = gap > 8 ? ['Menos minutos', 'Adaptación', 'Competencia interna'] : ['Adaptación', 'Expectativa'];
    if (moveKind === 'EUROPE') {
      gains = ['Europa', 'Exposición', 'Techo más alto'];
      risks = gap > 6 ? ['Menos minutos', 'Adaptación'] : ['Adaptación', 'Competencia'];
    } else if (moveKind === 'HOME') {
      gains = ['Regreso a casa', 'Protagonismo', 'Historia'];
      risks = ['Expectativa local', 'Menos escaparate europeo'];
    } else if (moveKind === 'STEP_UP') {
      gains = ['Salto de nivel', 'Prestigio', 'Competición mayor'];
      risks = gap > 6 ? ['Riesgo de banco', 'Adaptación'] : ['Expectativa', 'Competencia interna'];
    } else if (moveKind === 'MINUTES' || moveKind === 'DECLINE') {
      gains = ['Más minutos', 'Confianza', 'Protagonismo'];
      risks = ['Menor prestigio', 'Techo más bajo'];
    } else if (moveKind === 'SOUTH_AMERICA') {
      gains = ['Sudamérica', 'Nuevo capítulo', 'Identidad'];
      risks = ['Cambio de contexto', 'Expectativa'];
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
      prestige: toClub.prestige,
      band: Rules.clubBand(toClub),
      fromClubId: fromClub.id,
      leagueId: toClub.leagueId || null,
      leagueName: (league && league.name) || toClub.league || '',
      countryCode: toClub.countryCode || '',
      continent: toClub.continent || ''
    };
  }

  function makeLoanOption(career, fromClub, toClub) {
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
    if (!fromClub) return { situation: 'no_club', options: [] };

    if (career.onLoan) {
      // Forced evaluation: return or make permanent-ish stay/transfer later handled by engine
      return {
        situation: 'loan_end',
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
            prestige: (clubsProvider.getById(career.loanFromClubId) || fromClub).prestige,
            band: Rules.clubBand(clubsProvider.getById(career.loanFromClubId) || fromClub)
          }
        ]
      };
    }

    var options = [];
    var stay = buildStayOption(career, fromClub);
    options.push(stay);

    var all = clubsProvider.getAll();
    var scored = [];
    for (var i = 0; i < all.length; i++) {
      var s = scoreClubForInterest(career, all[i], rng);
      if (s > 0) scored.push({ club: all[i], score: s });
    }
    scored.sort(function (a, b) {
      return b.score - a.score;
    });

    var p = career.player;
    var last = career.seasons[career.seasons.length - 1] || {};
    var lowMinutes = (last.minutes || 0) < 1400;
    var young = p.age <= 22;
    var fromRank = Rules.bandRank(Rules.clubBand(fromClub));
    var bigClub = fromRank >= 5;
    var benchRole =
      career.role === 'youth_prospect' ||
      career.role === 'substitute' ||
      career.role === 'rotation';

    // Loan opportunity — common for young players stuck behind a stronger squad
    var loanChance = 0;
    if (young && bigClub && (lowMinutes || benchRole) && p.potential >= 76) loanChance = 0.72;
    else if (young && fromRank >= 4 && lowMinutes && p.potential >= 78) loanChance = 0.45;
    else if (p.age <= 23 && benchRole && lowMinutes) loanChance = 0.28;

    if (rng.chance(loanChance)) {
      var loanPool = scored
        .filter(function (x) {
          var r = Rules.bandRank(Rules.clubBand(x.club));
          return r <= fromRank - 1 && r >= 1 && x.club.id !== fromClub.id;
        })
        .slice(0, 20);
      if (!loanPool.length) {
        loanPool = NS.Providers.clubs
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
        options.push(makeLoanOption(career, fromClub, loanClub));
      }
    }

    // Transfer interest
    var interest = (last.rating || 6.5) >= 7.0 || p.form >= 68 || p.overall >= 78;
    var cold = (last.rating || 6.5) < 6.5 && p.form < 45;
    var transferCount = cold ? (rng.chance(0.35) ? 1 : 0) : interest ? rng.int(1, 2) : rng.chance(0.4) ? 1 : 0;

    var used = {};
    for (var t = 0; t < transferCount; t++) {
      var eligible = scored.filter(function (x) {
        return !used[x.club.id] && Rules.canJoinClub(p, x.club);
      });
      // Top slice + deeper catalog picks so mid/small leagues stay alive
      var pool = eligible.slice(0, 28);
      if (eligible.length > 40 && rng.chance(0.34)) {
        pool = pool.concat(eligible.slice(28, 90));
      }
      if (eligible.length > 70 && rng.chance(0.22)) {
        var deep = eligible.slice(50, 140);
        if (deep.length) pool.push(rng.pick(deep));
      }
      if (!pool.length) break;
      var pick = rng.weighted(pool, function (x) {
        return x.score;
      }).club;
      used[pick.id] = 1;
      options.push(makeTransferOption(career, fromClub, pick));
    }

    // Home return tease for veterans / soft landings (contextual)
    if (
      career.flags.playedEurope &&
      ((p.age >= 29 && rng.chance(0.38)) ||
        (p.age >= 27 && ((last.minutes || 0) < 1400 || (p.form || 50) < 50) && rng.chance(0.28)))
    ) {
      var home = scored.filter(function (x) {
        return (
          x.club.countryCode === p.country &&
          Rules.bandRank(Rules.clubBand(x.club)) >= 3 &&
          Engine.Eligibility.isCredibleInternationalMove(career, fromClub, x.club)
        );
      });
      if (home.length) {
        var h = rng.pick(home).club;
        if (!used[h.id]) {
          var opt = makeTransferOption(career, fromClub, h, 'HOME');
          opt.kind = 'HOME';
          options.push(opt);
        }
      }
    }

    // Cap options 1..3 (+ stay already). Max 3 choices total for clarity in later UI.
    // Keep stay + up to 2 others
    var extras = options.slice(1);
    extras = rng.shuffle(extras).slice(0, 2);
    options = [stay].concat(extras);

    // Dedup fingerprints vs last seasons
    var fps = options.map(offerFingerprint);
    career.marketMemory.lastOfferFingerprints = fps;

    var situation = 'decision';
    if (extras.length === 0) situation = cold ? 'market_cold' : 'club_wants_you';
    else if (extras.some(function (o) { return o.kind === 'EUROPE'; })) situation = 'europe_interest';
    else if (extras.some(function (o) { return o.type === 'loan'; })) situation = 'loan_suggested';
    else if (extras.some(function (o) { return o.kind === 'STEP_UP'; })) situation = 'step_up';

    return { situation: situation, options: options };
  }

  Engine.Market = {
    generateMarket: generateMarket,
    offerFingerprint: offerFingerprint,
    yearsAtClub: yearsAtClub
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
