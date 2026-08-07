/**
 * Mi Carrera engine orchestrator (Phase 2).
 * Simulates full careers without UI.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});
  var Rules = Engine.Rules;

  function profileBias(profileId) {
    var profiles = (NS.data && NS.data.profiles && NS.data.profiles.profiles) || [];
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].id === profileId) return profiles[i].bias || {};
    }
    return {};
  }

  function createCareer(input) {
    var seed = input.seed != null ? input.seed : Engine.hashString(String(Date.now()) + Math.random());
    var rng = Engine.createRng(seed);
    var career = Engine.State.createCareer(input, rng);
    career._rngState = null;
    career.__rng = rng;
    Engine.State.updateValue(career);
    return career;
  }

  function rngOf(career) {
    if (career.__rng) return career.__rng;
    career.__rng = Engine.createRng(career.seed + career.seasonIndex * 9973);
    return career.__rng;
  }

  /** Pick the single most important season beat from real season/moment data. */
  function deriveSeasonBeat(career, season) {
    var idx = season.seasonIndex;
    var momentTypes = {};
    (career.moments || []).forEach(function (m) {
      if (m.seasonIndex === idx) momentTypes[m.type] = 1;
    });
    var delta = (season.overallAfter || 0) - (season.overallBefore || 0);
    var minutes = season.minutes || 0;
    var rating = season.rating || 0;
    var titles = season.titles || [];
    var prev = (career.seasons || [])[career.seasons.length - 1];

    if (season.injurySeverity >= 3 || momentTypes.major_injury) return 'injury';
    if (momentTypes.comeback) return 'comeback';
    if (
      titles.some(function (t) {
        return (
          t.competitionId === 'uefa_cl' ||
          t.competitionId === 'conmebol_libertadores' ||
          t.competitionId === 'fifa_world_cup' ||
          t.competitionId === 'uefa_euro' ||
          t.competitionId === 'conmebol_copa_america'
        );
      })
    ) {
      return 'title';
    }
    if (momentTypes.debut_national_team || momentTypes.world_cup) return 'national_call';
    if (titles.length) return 'title';
    if (idx === 0) return 'debut';
    if (prev && prev.role && prev.role !== season.role) return 'role_change';
    if (delta >= 3 && minutes >= 1500) return 'explosion';
    if (delta <= -2) return 'collapse';
    if (minutes < 700) return 'bad_season';
    if (minutes >= 2200 && rating >= 7.2) return 'great_season';
    if (minutes >= 1800 && rating >= 7.0 && delta >= 1) return 'great_season';
    if (rating < 6.5 && minutes >= 1000) return 'bad_season';
    if (career.player.age >= 34 && minutes >= 900) return 'farewell';
    if (delta >= 1 && minutes >= 1200) return 'great_season';
    return null;
  }

  function generateFirstClubs(career) {
    var rng = rngOf(career);
    var p = career.player;
    var all = NS.Providers.clubs.getAll();
    var home = all.filter(function (c) {
      return c.countryCode === p.country;
    });
    var pool = home.length >= 9 ? home : all.filter(function (c) {
      return c.continent === (NS.Providers.flags.getCountry(p.country) || {}).continent || c.countryCode === p.country;
    });
    if (pool.length < 6) pool = all.slice();

    function pickBand(minRank, maxRank, preferYouth) {
      var list = pool.filter(function (c) {
        var r = Rules.bandRank(Rules.clubBand(c));
        if (r < minRank || r > maxRank) return false;
        if (!Rules.canJoinClub(p, c)) return false;
        if (preferYouth && (c.youthLevel || 0) < 70) return false;
        return true;
      });
      if (!list.length) {
        list = pool.filter(function (c) {
          return Rules.canJoinClub(p, c);
        });
      }
      return rng.weighted(list, function (c) {
        var s = 5 + (c.youthLevel || 40) / 20;
        if (preferYouth) s += (c.youthLevel || 0) / 10;
        if (c.countryCode === p.country) s += 8;
        return s;
      });
    }

    var big = pickBand(5, 7, false);
    var mid = pickBand(3, 5, true);
    var small = pickBand(1, 3, true);
    // Ensure distinct
    var ids = {};
    var opts = [];
    [big, mid, small].forEach(function (c, idx) {
      if (!c) return;
      if (ids[c.id]) {
        var alt = rng.pick(pool.filter(function (x) {
          return !ids[x.id] && Rules.canJoinClub(p, x);
        }));
        c = alt || c;
      }
      ids[c.id] = 1;
      var role =
        idx === 0 ? (Rules.bandRank(Rules.clubBand(c)) >= 6 ? 'youth_prospect' : 'rotation') : idx === 1 ? 'regular' : 'starter';
      opts.push({
        clubId: c.id,
        path: idx === 0 ? 'prestige' : idx === 1 ? 'balance' : 'minutes',
        role: role,
        expectedMinutes: Rules.expectedMinutes(role),
        band: Rules.clubBand(c),
        prestige: c.prestige,
        gains:
          idx === 0
            ? ['Prestigio', 'Exposición', 'Techo alto']
            : idx === 1
              ? ['Equilibrio', 'Minutos razonables', 'Crecimiento']
              : ['Protagonismo', 'Muchos minutos', 'Confianza'],
        risks:
          idx === 0
            ? ['Pocos minutos', 'Alta competencia']
            : idx === 1
              ? ['Menos escaparate que un gigante']
              : ['Menor prestigio inicial', 'Menor exposición']
      });
    });
    while (opts.length < 3) {
      var filler = rng.pick(pool);
      if (!filler || ids[filler.id]) break;
      ids[filler.id] = 1;
      opts.push({
        clubId: filler.id,
        path: 'balance',
        role: 'regular',
        expectedMinutes: 24,
        band: Rules.clubBand(filler),
        prestige: filler.prestige,
        gains: ['Oportunidad'],
        risks: ['Incertidumbre']
      });
    }
    return opts.slice(0, 3);
  }

  function chooseFirstClub(career, clubId, meta) {
    var club = NS.Providers.clubs.getById(clubId);
    if (!club) throw new Error('Club inválido: ' + clubId);
    var rng = rngOf(career);
    career.currentClubId = club.id;
    career.currentLeagueId = club.leagueId;
    career.role = (meta && meta.role) || Rules.roleFromContext(career.player, club, rng);
    career.contractYears = rng.int(2, 4);
    career.marketMemory.yearsAtClub = 0;
    if (club.continent === 'EU') career.flags.playedEurope = true;
    if (club.continent === 'SA') career.flags.playedSouthAmerica = true;
    Engine.History.ensureClubSpell(career, club.id, 'start');
    Engine.Events.pushMoment(career, 'career_start', { clubId: club.id });
    Engine.State.updateValue(career);
    return career;
  }

  function simulateSeasonStats(career, rng) {
    var p = career.player;
    var club = NS.Providers.clubs.getById(career.currentClubId);
    var role = career.role;
    var injury = Engine.Events.rollInjury(career, rng);
    var baseMatches = Rules.expectedMinutes(role);
    if (injury.severity >= 3) baseMatches = Math.max(0, baseMatches - rng.int(18, 28));
    else if (injury.severity === 2) baseMatches = Math.max(2, baseMatches - rng.int(8, 16));
    else if (injury.severity === 1) baseMatches = Math.max(4, baseMatches - rng.int(2, 6));

    var formAdj = ((p.form || 50) - 50) / 25;
    var trustAdj = ((p.managerTrust || 50) - 50) / 40;
    var matches = Engine.State.clamp(Math.round(baseMatches + formAdj * 3 + trustAdj * 2 + rng.float(-3, 3)), 0, 45);
    var starts = Math.round(matches * (role === 'star' || role === 'key_player' || role === 'starter' ? 0.9 : role === 'regular' ? 0.7 : 0.45));
    var minutes = Math.round(starts * rng.float(78, 92) + (matches - starts) * rng.float(15, 35));

    var bias = profileBias(p.profile);
    var rating = 6.2 + (p.overall - 70) * 0.035 + formAdj * 0.35 + rng.float(-0.35, 0.45);
    if (injury.severity >= 2) rating -= 0.35;
    rating = Engine.State.clamp(Number(rating.toFixed(2)), 5.4, 8.6);

    var goals = 0;
    var assists = 0;
    var cleanSheets = 0;
    if (Rules.isGoalkeeper(p.position)) {
      cleanSheets = Math.round(matches * Engine.State.clamp(0.18 + (p.overall - 70) * 0.01 + (rating - 6.5) * 0.05, 0.05, 0.55));
    } else {
      var goalRate =
        (p.position === 'ST' ? 0.45 : p.position === 'RW' || p.position === 'LW' || p.position === 'AM' ? 0.22 : p.position === 'CM' ? 0.08 : 0.04) *
        (bias.goal || 1);
      var assistRate =
        (p.position === 'AM' || p.position === 'CM' ? 0.28 : p.position === 'RW' || p.position === 'LW' ? 0.2 : p.position === 'ST' ? 0.12 : 0.06) *
        (bias.assist || 1);
      goals = Math.max(0, Math.round(matches * goalRate * (rating / 7) * rng.float(0.7, 1.25)));
      assists = Math.max(0, Math.round(matches * assistRate * (rating / 7) * rng.float(0.7, 1.25)));
      if (minutes < 600) {
        goals = Math.min(goals, 2);
        assists = Math.min(assists, 2);
      }
    }

    if (goals > 0 && !(career.milestones || []).some(function (m) { return m === 'first_goal'; })) {
      career.milestones.push('first_goal');
      Engine.Events.pushMoment(career, 'first_goal', { goals: goals });
    }

    return {
      matches: matches,
      starts: starts,
      minutes: minutes,
      goals: goals,
      assists: assists,
      cleanSheets: cleanSheets,
      rating: rating,
      injurySeverity: injury.severity || 0
    };
  }

  function playSeason(career) {
    if (career.status !== 'active') throw new Error('Carrera no activa');
    if (!career.currentClubId) throw new Error('Sin club actual');
    var rng = rngOf(career);
    var club = NS.Providers.clubs.getById(career.currentClubId);
    Engine.Progression.refreshRole(career, rng);

    var stats = simulateSeasonStats(career, rng);
    var titles = Engine.Competitions.resolveTitles(career, stats, rng);
    var national = Engine.National.resolveNationalSeason(career, stats, rng);
    titles = titles.concat(national.titles || []);

    stats.titlesWon = titles.length;
    stats.nationalCaps = national.caps || 0;
    stats.nationalGoals = national.goals || 0;
    stats.worldCupPlayed = !!national.worldCupPlayed;
    stats.worldCupWon = !!national.worldCupWon;

    // Age/OVR/rep first so awards (esp. Ballon) judge the season just played.
    var ageProg = Engine.Progression.applyAgeUp(career, Object.assign({}, stats, { overallDelta: 0 }), rng);
    stats.overallDelta = ageProg.delta;
    var awards = Engine.Awards.resolveAwards(career, stats, titles, rng);
    awards.forEach(function (a) {
      a.age = ageProg.ageBefore;
    });

    Engine.Events.updateCrisisAndComeback(
      career,
      Object.assign({}, stats, { overallDelta: ageProg.delta })
    );
    Engine.Events.maybeExtraEvent(career, rng);

    if (titles.length && !(career.milestones || []).some(function (m) { return m === 'first_title'; })) {
      career.milestones.push('first_title');
      Engine.Events.pushMoment(career, 'first_title', { competitionId: titles[0].competitionId });
    }
    titles.forEach(function (t) {
      if (t.competitionId === 'uefa_cl') Engine.Events.pushMoment(career, 'champions', { clubId: career.currentClubId });
      if (t.competitionId === 'conmebol_libertadores') Engine.Events.pushMoment(career, 'libertadores', { clubId: career.currentClubId });
    });

    career.titles = career.titles.concat(titles);
    career.awards = career.awards.concat(awards);

    var seasonRecord = {
      seasonIndex: career.seasonIndex,
      seasonYear: career.seasonYear,
      age: ageProg.ageBefore,
      ageAfter: ageProg.ageAfter,
      clubId: career.currentClubId,
      leagueId: career.currentLeagueId,
      continent: club.continent,
      role: career.role,
      matches: stats.matches,
      starts: stats.starts,
      minutes: stats.minutes,
      goals: stats.goals,
      assists: stats.assists,
      cleanSheets: stats.cleanSheets,
      rating: stats.rating,
      overallBefore: ageProg.overallBefore,
      overallAfter: ageProg.overallAfter,
      form: career.player.form,
      confidence: career.player.confidence,
      injurySeverity: stats.injurySeverity,
      titles: titles,
      awards: awards,
      national: {
        status: career.nationalTeam.status,
        caps: national.caps,
        goals: national.goals
      }
    };
    seasonRecord.beat = deriveSeasonBeat(career, seasonRecord);
    career.seasons.push(seasonRecord);
    Engine.History.applySeasonToSpell(career, seasonRecord);

    career.seasonIndex += 1;
    career.seasonYear += 1;
    career.contractYears = Math.max(0, (career.contractYears || 1) - 1);
    career.marketMemory.yearsAtClub = (career.marketMemory.yearsAtClub || 0) + 1;

    // Loan end flag
    if (career.onLoan && career.loanReturnAtSeason != null && career.seasonIndex >= career.loanReturnAtSeason) {
      // market will force return
    }

    var market = Engine.Market.generateMarket(career, rng);
    var retirement = evaluateRetirement(career, rng);

    return {
      season: seasonRecord,
      market: market,
      retirement: retirement
    };
  }

  function evaluateRetirement(career, rng) {
    var p = career.player;
    var last = career.seasons[career.seasons.length - 1];
    if (!last) return { shouldRetire: false, force: false, reason: null };
    if (p.age >= Rules.RETIRE_HARD_AGE) return { shouldRetire: true, force: true, reason: 'age_hard' };
    if (p.age >= Rules.RETIRE_SOFT_AGE) {
      var poor = (last.minutes || 0) < 800 && (last.rating || 0) < 6.6;
      var declining = p.overall <= 72 && p.age >= 35;
      if (poor && rng.chance(0.35)) return { shouldRetire: true, force: false, reason: 'low_minutes' };
      if (declining && rng.chance(0.4)) return { shouldRetire: true, force: false, reason: 'decline' };
      if (p.age >= 37 && rng.chance(0.55)) return { shouldRetire: true, force: false, reason: 'veteran' };
    }
    return { shouldRetire: false, force: false, reason: null };
  }

  function applyDecision(career, decision) {
    if (!decision || !decision.type) throw new Error('Decisión inválida');
    var rng = rngOf(career);
    var fromId = career.currentClubId;

    if (decision.type === 'stay' || decision.type === 'renew') {
      career.contractYears = Math.max(career.contractYears, rng.int(1, 3));
      career.player.managerTrust = Engine.State.clamp(career.player.managerTrust + rng.int(1, 5), 10, 95);
      career.player.confidence = Engine.State.clamp(career.player.confidence + rng.int(0, 4), 15, 98);
      return career;
    }

    if (decision.type === 'loan_return') {
      var backId = decision.clubId || career.loanFromClubId;
      Engine.History.closeCurrentSpell(career);
      career.onLoan = false;
      career.loanFromClubId = null;
      career.loanReturnAtSeason = null;
      career.currentClubId = backId;
      var back = NS.Providers.clubs.getById(backId);
      career.currentLeagueId = back ? back.leagueId : career.currentLeagueId;
      career.role = 'rotation';
      career.marketMemory.yearsAtClub = 0;
      Engine.History.ensureClubSpell(career, backId, 'loan_return');
      return career;
    }

    if (decision.type === 'loan') {
      var loanClub = NS.Providers.clubs.getById(decision.clubId);
      if (!loanClub) throw new Error('Cesión inválida');
      career.loans.push({
        fromClubId: career.currentClubId,
        toClubId: loanClub.id,
        seasonIndex: career.seasonIndex,
        age: career.player.age
      });
      Engine.History.closeCurrentSpell(career);
      career.onLoan = true;
      career.loanFromClubId = fromId;
      career.loanReturnAtSeason = career.seasonIndex + 1;
      career.currentClubId = loanClub.id;
      career.currentLeagueId = loanClub.leagueId;
      career.role = decision.role || 'starter';
      career.marketMemory.yearsAtClub = 0;
      career.marketMemory.recentClubIds = [fromId].concat(career.marketMemory.recentClubIds || []).slice(0, 4);
      Engine.History.ensureClubSpell(career, loanClub.id, 'loan');
      Engine.Events.pushMoment(career, 'loan', { from: fromId, to: loanClub.id });
      if (loanClub.continent === 'EU') career.flags.playedEurope = true;
      if (loanClub.continent === 'SA') career.flags.playedSouthAmerica = true;
      return career;
    }

    if (decision.type === 'transfer') {
      var toClub = NS.Providers.clubs.getById(decision.clubId);
      if (!toClub) throw new Error('Traspaso inválido');
      if (!Rules.canJoinClub(career.player, toClub)) {
        // Soft reject absurd — keep stay effect
        career.marketMemory.rejectedClubIds = (career.marketMemory.rejectedClubIds || []).concat([toClub.id]).slice(-12);
        return career;
      }
      career.transfers.push({
        fromClubId: fromId,
        toClubId: toClub.id,
        seasonIndex: career.seasonIndex,
        age: career.player.age,
        kind: decision.kind || 'TRANSFER'
      });
      Engine.History.closeCurrentSpell(career);
      career.onLoan = false;
      career.loanFromClubId = null;
      career.currentClubId = toClub.id;
      career.currentLeagueId = toClub.leagueId;
      career.role = decision.role || Rules.roleFromContext(career.player, toClub, rng);
      career.contractYears = rng.int(2, 5);
      career.marketMemory.yearsAtClub = 0;
      career.marketMemory.recentClubIds = [fromId].concat(career.marketMemory.recentClubIds || []).slice(0, 4);
      career.player.managerTrust = Engine.State.clamp(40 + rng.int(0, 20), 10, 95);
      Engine.History.ensureClubSpell(career, toClub.id, decision.kind || 'transfer');
      Engine.Events.pushMoment(career, 'major_transfer', { from: fromId, to: toClub.id, kind: decision.kind });
      if (toClub.continent === 'EU') career.flags.playedEurope = true;
      if (toClub.continent === 'SA') career.flags.playedSouthAmerica = true;
      Engine.State.updateValue(career);
      return career;
    }

    throw new Error('Tipo de decisión no soportado: ' + decision.type);
  }

  function retire(career, reason) {
    career.status = 'retired';
    career.retirementReason = reason || 'retired';
    Engine.History.buildLegacy(career);
    Engine.Events.pushMoment(career, 'retirement', { age: career.player.age, reason: career.retirementReason });
    return career.legacy;
  }

  function autoPickDecision(career, market, rng) {
    if (!market || !market.options || !market.options.length) return { type: 'stay', clubId: career.currentClubId };
    var opts = market.options;
    // Prefer loan if young & low minutes path available
    var last = career.seasons[career.seasons.length - 1];
    var loan = opts.filter(function (o) {
      return o.type === 'loan';
    })[0];
    if (loan && career.player.age <= 22 && last && last.minutes < 1000 && rng.chance(0.7)) return loan;

    var step = opts.filter(function (o) {
      return o.type === 'transfer' && (o.kind === 'STEP_UP' || o.kind === 'EUROPE');
    })[0];
    if (step && career.player.form >= 60 && rng.chance(0.55)) return step;

    var home = opts.filter(function (o) {
      return o.kind === 'HOME';
    })[0];
    if (home && career.player.age >= 28 && rng.chance(0.55)) return home;

    // SOUTH_AMERICA returns only when contextual (offer already gated); still rarer for young peaks
    var saReturn = opts.filter(function (o) {
      return o.type === 'transfer' && o.kind === 'SOUTH_AMERICA';
    })[0];
    if (saReturn) {
      var takeReturn =
        career.player.age >= 29 ||
        career.player.form < 50 ||
        (career.seasons[career.seasons.length - 1] && career.seasons[career.seasons.length - 1].minutes < 1400);
      if (takeReturn && rng.chance(0.4)) return saReturn;
    }

    var transfer = opts.filter(function (o) {
      return o.type === 'transfer' && o.kind !== 'SOUTH_AMERICA';
    })[0];
    if (transfer && rng.chance(0.35)) return transfer;

    var ret = opts.filter(function (o) {
      return o.type === 'loan_return';
    })[0];
    if (ret) return ret;

    return opts.filter(function (o) {
      return o.type === 'stay';
    })[0] || opts[0];
  }

  function simulateFullCareer(input, options) {
    options = options || {};
    var career = createCareer(input);
    var rng = rngOf(career);
    var first = generateFirstClubs(career);
    var chosen = options.firstClubId
      ? first.filter(function (o) {
          return o.clubId === options.firstClubId;
        })[0] || first[0]
      : rng.pick(first);
    chooseFirstClub(career, chosen.clubId, chosen);

    var guard = 0;
    while (career.status === 'active' && guard < 30) {
      guard++;
      var turned = playSeason(career);
      if (turned.retirement.shouldRetire) {
        if (turned.retirement.force || rng.chance(0.65) || career.player.age >= 37) {
          retire(career, turned.retirement.reason);
          break;
        }
      }
      var decision = options.decisionFn
        ? options.decisionFn(career, turned.market, rng)
        : autoPickDecision(career, turned.market, rng);
      applyDecision(career, decision);
      if (career.player.age >= Rules.RETIRE_HARD_AGE) {
        retire(career, 'age_hard');
        break;
      }
    }
    if (career.status === 'active') retire(career, 'length_guard');
    return career;
  }

  Engine.createCareer = createCareer;
  Engine.generateFirstClubs = generateFirstClubs;
  Engine.chooseFirstClub = chooseFirstClub;
  Engine.playSeason = playSeason;
  Engine.applyDecision = applyDecision;
  Engine.retire = retire;
  Engine.simulateFullCareer = simulateFullCareer;
  Engine.autoPickDecision = autoPickDecision;
  Engine.evaluateRetirement = evaluateRetirement;
})(typeof globalThis !== 'undefined' ? globalThis : window);
