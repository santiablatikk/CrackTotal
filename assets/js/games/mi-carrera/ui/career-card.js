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
    var card = C.el('article', 'mc-card');
    card.setAttribute('data-career-card', '1');

    var top = C.el('div', 'mc-card__top');
    top.appendChild(C.Flag(p.country, 'md'));
    top.appendChild(C.text('div', 'mc-card__eyebrow', 'MI CARRERA'));
    card.appendChild(top);

    card.appendChild(C.text('h2', 'mc-card__name', p.name));
    card.appendChild(
      C.text(
        'div',
        'mc-card__meta',
        [p.position, totals.retireAge ? totals.retireAge + ' años' : '', legacy.archetype || '']
          .filter(Boolean)
          .join(' · ')
      )
    );

    var peak = C.el('div', 'mc-card__peak');
    peak.appendChild(C.text('div', 'mc-card__peak-n', totals.peakOverall || p.peakOverall || p.overall));
    peak.appendChild(C.text('div', 'mc-card__peak-l', 'MEJOR OVR'));
    card.appendChild(peak);

    var stats = C.el('div', 'mc-card__stats');
    stats.appendChild(C.Stat('PJ', totals.appearances || 0));
    if (NS.Engine.Rules.isGoalkeeper(p.position)) {
      stats.appendChild(C.Stat('Vallas', totals.cleanSheets || 0));
    } else {
      stats.appendChild(C.Stat('Goles', totals.goals || 0));
      stats.appendChild(C.Stat('Asist.', totals.assists || 0));
    }
    stats.appendChild(C.Stat('Títulos', totals.titles || 0));
    stats.appendChild(C.Stat('Premios', totals.awards || 0));
    card.appendChild(stats);

    var clubs = C.el('div', 'mc-card__clubs');
    (legacy.timeline || career.clubs || []).slice(0, 6).forEach(function (spell) {
      clubs.appendChild(C.Badge(spell.clubId, 'sm'));
    });
    card.appendChild(clubs);

    card.appendChild(C.text('p', 'mc-card__line', N.legacyLine(career)));
    card.appendChild(C.text('div', 'mc-card__fp', (legacy.fingerprint || '').slice(0, 48)));

    if (mount) {
      mount.innerHTML = '';
      mount.appendChild(card);
    }
    return card;
  }

  UI.CareerCard = { render: render };
})(typeof globalThis !== 'undefined' ? globalThis : window);
