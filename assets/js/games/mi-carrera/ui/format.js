(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  var POSITION_LABELS = {
    GK: 'Arquero',
    DEF: 'Defensor',
    MID: 'Mediocampista',
    FWD: 'Delantero'
  };

  var POSITION_SHORT = {
    GK: 'GK',
    DEF: 'DEF',
    MID: 'MID',
    FWD: 'FWD'
  };

  var ROLE_LABELS = {
    titular: 'Titular',
    rotacion: 'Rotación',
    promesa: 'Promesa'
  };

  var LEVEL_LABELS = {
    1: 'Formativo',
    2: 'Medio',
    3: 'Alto',
    4: 'Élite',
    5: 'World Elite'
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function flagEmoji(iso2) {
    var code = String(iso2 || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    if (code.length !== 2) return '🏳️';
    return String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1));
  }

  function formatMoney(value) {
    var n = Number(value) || 0;
    var abs = Math.abs(n);
    var sign = n < 0 ? '-' : '';
    if (abs >= 1000000000) return sign + '€' + (abs / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (abs >= 1000000) return sign + '€' + (abs / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (abs >= 1000) return sign + '€' + Math.round(abs / 1000) + 'K';
    return sign + '€' + Math.round(abs);
  }

  function formatDelta(value, opts) {
    opts = opts || {};
    var n = Number(value) || 0;
    if (!n) return opts.zero || '0';
    var prefix = n > 0 ? '+' : '';
    if (opts.money) return prefix + formatMoney(n);
    if (opts.fixed != null) return prefix + n.toFixed(opts.fixed);
    return prefix + String(n);
  }

  function seasonLabel(seasonIndex, baseYear) {
    var y = (baseYear || 2026) + (Number(seasonIndex) || 0);
    return y + '/' + String(y + 1).slice(-2);
  }

  function starsFromRating(avg) {
    var n = Number(avg) || 0;
    var filled = Math.max(1, Math.min(5, Math.round(n / 2)));
    var out = '';
    for (var i = 1; i <= 5; i++) out += i <= filled ? '★' : '☆';
    return out;
  }

  function seasonBlurb(grade, avg) {
    if (grade === 'S') return 'Temporada histórica. La afición no te olvida.';
    if (grade === 'A' || avg >= 7.5) return 'Tu mejor versión estuvo en la cancha.';
    if (grade === 'B') return 'Sólido. Sin ruido, con rendimiento.';
    if (grade === 'C') return 'Temporada irregular. Queda margen.';
    return 'La temporada pesó. Hora de resetear.';
  }

  function effectImpactLines(effects) {
    if (!effects) return [];
    var lines = [];
    var map = [
      ['injuryWeeks', function (v) {
        return 'Fuera aproximadamente ' + v + (v === 1 ? ' semana' : ' semanas');
      }],
      ['fitnessDelta', function (v) {
        return v < 0 ? 'Baja la condición física' : 'Mejora la condición física';
      }],
      ['moraleDelta', function (v) {
        return v < 0 ? 'El ánimo se resiente' : 'Sube la moral';
      }],
      ['ratingDelta', function (v) {
        return (v > 0 ? '+' : '') + v + ' en rating';
      }],
      ['popularityDelta', function (v) {
        return v > 0 ? 'Crece tu popularidad' : 'La prensa te enfría';
      }],
      ['prestigeDelta', function (v) {
        return v > 0 ? 'Suma prestigio' : 'Se diluye el prestigio';
      }],
      ['clubRelationDelta', function (v) {
        return v < 0 ? 'Roce con el club' : 'Mejora la relación con el club';
      }],
      ['nationalCapsDelta', function (v) {
        return '+' + v + ' partidos con la selección';
      }],
      ['minutesBias', function (v) {
        return v < 0 ? 'Menos minutos a corto plazo' : 'Más protagonismo en el once';
      }]
    ];
    map.forEach(function (pair) {
      if (effects[pair[0]] != null && effects[pair[0]] !== 0) lines.push(pair[1](effects[pair[0]]));
    });
    return lines.slice(0, 4);
  }

  UI.format = {
    POSITION_LABELS: POSITION_LABELS,
    POSITION_SHORT: POSITION_SHORT,
    ROLE_LABELS: ROLE_LABELS,
    LEVEL_LABELS: LEVEL_LABELS,
    escapeHtml: escapeHtml,
    flagEmoji: flagEmoji,
    formatMoney: formatMoney,
    formatDelta: formatDelta,
    seasonLabel: seasonLabel,
    starsFromRating: starsFromRating,
    seasonBlurb: seasonBlurb,
    effectImpactLines: effectImpactLines
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
