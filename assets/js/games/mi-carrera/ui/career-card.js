/**
 * Career Card poster composition from real legacy data.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  function debutAge(career, legacy) {
    if (legacy && legacy.totals && legacy.totals.debutAge != null) return legacy.totals.debutAge;
    var tl = (legacy && legacy.timeline) || career.clubs || [];
    if (tl[0] && tl[0].ageStart != null) return tl[0].ageStart;
    if (career.seasons && career.seasons[0]) return career.seasons[0].age;
    return career.careerStartAge || null;
  }

  function importantClubs(career, legacy) {
    var spells = career.clubs || [];
    var scored = spells
      .map(function (s) {
        var club = NS.Providers.clubs.getById(s.clubId);
        var band = club && NS.Engine.Rules ? NS.Engine.Rules.clubBand(club) : 'MID';
        var rank = NS.Engine.Rules ? NS.Engine.Rules.bandRank(band) : 1;
        return {
          clubId: s.clubId,
          score: (s.seasons || 0) * 3 + (s.titles || 0) * 5 + rank + (s.appearances || 0) / 40
        };
      })
      .sort(function (a, b) {
        return b.score - a.score;
      });
    var out = [];
    var seen = {};
    scored.forEach(function (s) {
      if (!s.clubId || seen[s.clubId]) return;
      seen[s.clubId] = 1;
      out.push(s.clubId);
    });
    if (!out.length && legacy && legacy.timeline) {
      legacy.timeline.forEach(function (t) {
        if (t.clubId && !seen[t.clubId]) {
          seen[t.clubId] = 1;
          out.push(t.clubId);
        }
      });
    }
    return out.slice(0, 5);
  }

  function render(career, mount) {
    var C = UI.Components;
    var N = UI.Narrative;
    var p = career.player;
    var legacy = career.legacy || NS.Engine.History.buildLegacy(career);
    var totals = legacy.totals || {};
    var archCode = legacy.archetype || '';
    var dAge = debutAge(career, legacy);
    var peakAge = totals.peakAge;
    var years =
      dAge != null && totals.retireAge != null ? Math.max(1, totals.retireAge - dAge) : totals.seasons || null;
    var card = C.el('article', 'mc-card');
    card.setAttribute('data-career-card', '1');
    card.setAttribute('data-export', 'poster');

    var top = C.el('div', 'mc-card__top');
    top.appendChild(C.Flag(p.country, 'md'));
    top.appendChild(C.text('div', 'mc-card__eyebrow', 'MI CARRERA'));
    card.appendChild(top);

    card.appendChild(C.text('h2', 'mc-card__name', p.name));
    card.appendChild(
      C.text(
        'div',
        'mc-card__meta',
        [p.position, p.country, dAge != null && totals.retireAge ? dAge + ' → ' + totals.retireAge : '']
          .filter(Boolean)
          .join(' · ')
      )
    );
    card.appendChild(C.text('div', 'mc-card__arch', N.archetypeLabel(archCode)));

    var peak = C.el('div', 'mc-card__peak');
    peak.appendChild(C.text('div', 'mc-card__peak-n', totals.peakOverall || p.peakOverall || p.overall));
    peak.appendChild(
      C.text(
        'div',
        'mc-card__peak-l',
        peakAge != null ? 'PEAK · ' + peakAge + ' AÑOS' : 'PEAK OVR'
      )
    );
    card.appendChild(peak);

    if (years != null) {
      card.appendChild(C.text('div', 'mc-card__years', years + ' AÑOS DE CARRERA'));
    }

    var clubs = importantClubs(career, legacy);
    if (clubs.length) {
      var clubsRow = C.el('div', 'mc-card__clubs');
      clubsRow.appendChild(C.text('div', 'mc-card__section', 'CLUBES'));
      var badges = C.el('div', 'mc-card__icons');
      clubs.forEach(function (id) {
        badges.appendChild(C.Badge(id, 'sm'));
      });
      clubsRow.appendChild(badges);
      card.appendChild(clubsRow);
    }

    var timeline = C.ClubTimeline(legacy.timeline || career.clubs, {
      size: 'md',
      variant: 'poster',
      retireAge: totals.retireAge || p.age
    });
    timeline.classList.add('mc-timeline--card');
    card.appendChild(timeline);

    var majors = N.majorTitles(legacy.titles || career.titles || []);
    if (majors.length) {
      var titlesRow = C.el('div', 'mc-card__titles');
      titlesRow.appendChild(C.text('div', 'mc-card__section', 'TÍTULOS'));
      var icons = C.el('div', 'mc-card__icons');
      majors.slice(0, 6).forEach(function (t) {
        icons.appendChild(C.Trophy(t.competitionId, 'sm'));
      });
      titlesRow.appendChild(icons);
      card.appendChild(titlesRow);
    }

    var stats = C.el('div', 'mc-card__stats');
    stats.appendChild(C.Stat('PJ', totals.appearances || 0));
    if (NS.Engine.Rules.isGoalkeeper(p.position)) {
      stats.appendChild(C.Stat('Vallas', totals.cleanSheets || 0));
    } else {
      stats.appendChild(C.Stat('Goles', totals.goals || 0));
      stats.appendChild(C.Stat('Asist.', totals.assists || 0));
    }
    card.appendChild(stats);

    var awards = legacy.awards || career.awards || [];
    if (awards.length) {
      var awardsRow = C.el('div', 'mc-card__awards');
      awardsRow.appendChild(C.text('div', 'mc-card__section', 'PREMIOS'));
      var aIcons = C.el('div', 'mc-card__icons');
      awards.slice(0, 4).forEach(function (a) {
        aIcons.appendChild(C.Award(a.awardId, 'sm'));
      });
      awardsRow.appendChild(aIcons);
      card.appendChild(awardsRow);
    }

    var caps = totals.nationalCaps || 0;
    var nt = career.nationalTeam || {};
    if (caps > 0 || (nt.status && nt.status !== 'uncapped')) {
      var natBits = ['SELECCIÓN', String(caps)];
      if (p.country) natBits.push(p.country);
      card.appendChild(C.text('div', 'mc-card__national', natBits.join(' · ')));
      var tournaments = nt.tournaments || [];
      tournaments.forEach(function (t) {
        if (!t || !t.won) return;
        if (t.id === 'fifa_world_cup') {
          card.appendChild(C.text('div', 'mc-card__national-title', 'CAMPEÓN DEL MUNDO · ' + (t.year || '')));
        } else if (t.id === 'conmebol_copa_america') {
          card.appendChild(C.text('div', 'mc-card__national-title', 'COPA AMÉRICA · ' + (t.year || '')));
        } else if (t.id === 'uefa_euro') {
          card.appendChild(C.text('div', 'mc-card__national-title', 'EURO · ' + (t.year || '')));
        }
      });
    }

    card.appendChild(C.text('p', 'mc-card__line', N.legacyLine(career)));

    if (mount) {
      mount.innerHTML = '';
      mount.appendChild(card);
    }
    return card;
  }

  UI.CareerCard = { render: render };
})(typeof globalThis !== 'undefined' ? globalThis : window);
