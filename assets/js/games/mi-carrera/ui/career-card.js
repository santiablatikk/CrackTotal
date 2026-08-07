/**
 * Career Card poster composition from real legacy data.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  function render(career, mount) {
    var C = UI.Components;
    var N = UI.Narrative;
    var p = career.player;
    var legacy = career.legacy || NS.Engine.History.buildLegacy(career);
    var totals = legacy.totals || {};
    var archCode = legacy.archetype || '';
    var card = C.el('article', 'mc-card');
    card.setAttribute('data-career-card', '1');

    var top = C.el('div', 'mc-card__top');
    top.appendChild(C.Flag(p.country, 'md'));
    top.appendChild(C.text('div', 'mc-card__eyebrow', 'MI CARRERA'));
    card.appendChild(top);

    card.appendChild(C.text('h2', 'mc-card__name', p.name));
    card.appendChild(C.text('div', 'mc-card__arch', N.archetypeLabel(archCode)));

    var peak = C.el('div', 'mc-card__peak');
    peak.appendChild(C.text('div', 'mc-card__peak-n', totals.peakOverall || p.peakOverall || p.overall));
    peak.appendChild(C.text('div', 'mc-card__peak-l', 'PEAK OVR'));
    card.appendChild(peak);

    var timeline = C.ClubTimeline(legacy.timeline || career.clubs, {
      size: 'sm',
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
    if (caps > 0 || (career.nationalTeam && career.nationalTeam.status !== 'uncapped')) {
      card.appendChild(
        C.text(
          'div',
          'mc-card__national',
          'SELECCIÓN · ' + caps + ' PARTIDOS'
        )
      );
    }

    card.appendChild(
      C.text(
        'div',
        'mc-card__meta',
        [p.position, totals.retireAge ? 'RETIRO A LOS ' + totals.retireAge : ''].filter(Boolean).join(' · ')
      )
    );

    card.appendChild(C.text('p', 'mc-card__line', N.legacyLine(career)));

    if (mount) {
      mount.innerHTML = '';
      mount.appendChild(card);
    }
    return card;
  }

  UI.CareerCard = { render: render };
})(typeof globalThis !== 'undefined' ? globalThis : window);
