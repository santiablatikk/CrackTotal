/**
 * Documented club rivalries for Mi Carrera.
 * Only historically recognised pairs from the local catalog — never invent rivalries.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});

  /** intensity: ARCHRIVAL | RIVAL */
  var PAIRS = [
    // Argentina
    { a: 'ar_boca-juniors', b: 'ar_river-plate', intensity: 'ARCHRIVAL' },
    { a: 'ar_racing-club', b: 'ar_independiente', intensity: 'ARCHRIVAL' },
    { a: 'ar_san-lorenzo', b: 'ar_huracan', intensity: 'RIVAL' },
    { a: 'ar_newell-s-old-boys', b: 'ar_rosario-central', intensity: 'ARCHRIVAL' },
    // Uruguay
    { a: 'uy_nacional', b: 'uy_penarol', intensity: 'ARCHRIVAL' },
    // Brazil
    { a: 'br_flamengo', b: 'br_fluminense', intensity: 'ARCHRIVAL' },
    { a: 'br_corinthians', b: 'br_palmeiras', intensity: 'ARCHRIVAL' },
    { a: 'br_sao-paulo', b: 'br_santos', intensity: 'RIVAL' },
    { a: 'br_gremio', b: 'br_internacional', intensity: 'ARCHRIVAL' },
    // Chile
    { a: 'cl_colo-colo', b: 'cl_universidad-de-chile', intensity: 'ARCHRIVAL' },
    { a: 'cl_universidad-catolica', b: 'cl_universidad-de-chile', intensity: 'RIVAL' },
    // Spain
    { a: 'es_fc-barcelona', b: 'es_real-madrid', intensity: 'ARCHRIVAL' },
    { a: 'es_athletic-club', b: 'es_real-sociedad', intensity: 'RIVAL' },
    { a: 'es_sevilla', b: 'es_real-betis', intensity: 'ARCHRIVAL' },
    // England
    { a: 'gb_arsenal', b: 'gb_tottenham-hotspur', intensity: 'ARCHRIVAL' },
    { a: 'gb_manchester-united', b: 'gb_manchester-city', intensity: 'ARCHRIVAL' },
    { a: 'gb_liverpool', b: 'gb_everton', intensity: 'ARCHRIVAL' },
    // Italy
    { a: 'it_inter', b: 'it_ac-milan', intensity: 'ARCHRIVAL' },
    { a: 'it_juventus', b: 'it_torino', intensity: 'ARCHRIVAL' },
    { a: 'it_roma', b: 'it_lazio', intensity: 'ARCHRIVAL' },
    // Portugal
    { a: 'pt_benfica', b: 'pt_porto', intensity: 'ARCHRIVAL' },
    { a: 'pt_benfica', b: 'pt_sporting-cp', intensity: 'ARCHRIVAL' },
    { a: 'pt_porto', b: 'pt_sporting-cp', intensity: 'RIVAL' },
    // Netherlands
    { a: 'nl_ajax', b: 'nl_feyenoord', intensity: 'ARCHRIVAL' },
    // Mexico
    { a: 'mx_club-america', b: 'mx_guadalajara', intensity: 'ARCHRIVAL' }
  ];

  var INDEX = null;

  function ensureIndex() {
    if (INDEX) return INDEX;
    INDEX = Object.create(null);
    PAIRS.forEach(function (p) {
      if (!p.a || !p.b) return;
      INDEX[p.a + '|' + p.b] = p.intensity;
      INDEX[p.b + '|' + p.a] = p.intensity;
    });
    return INDEX;
  }

  function intensityBetween(clubA, clubB) {
    if (!clubA || !clubB || clubA === clubB) return null;
    return ensureIndex()[clubA + '|' + clubB] || null;
  }

  function isRival(clubA, clubB) {
    return !!intensityBetween(clubA, clubB);
  }

  function isArchRival(clubA, clubB) {
    return intensityBetween(clubA, clubB) === 'ARCHRIVAL';
  }

  function rivalsOf(clubId) {
    var out = [];
    if (!clubId) return out;
    PAIRS.forEach(function (p) {
      if (p.a === clubId) out.push({ clubId: p.b, intensity: p.intensity });
      if (p.b === clubId) out.push({ clubId: p.a, intensity: p.intensity });
    });
    return out;
  }

  /** Drop pairs whose clubs are missing from the loaded catalog. */
  function validateAgainstCatalog() {
    var clubs = NS.Providers && NS.Providers.clubs ? NS.Providers.clubs.getAll() : [];
    var ids = Object.create(null);
    clubs.forEach(function (c) {
      ids[c.id] = 1;
    });
    var valid = [];
    var missing = [];
    PAIRS.forEach(function (p) {
      if (ids[p.a] && ids[p.b]) valid.push(p);
      else missing.push(p);
    });
    return { valid: valid, missing: missing, total: PAIRS.length };
  }

  Engine.Rivalries = {
    PAIRS: PAIRS,
    intensityBetween: intensityBetween,
    isRival: isRival,
    isArchRival: isArchRival,
    rivalsOf: rivalsOf,
    validateAgainstCatalog: validateAgainstCatalog
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
