/**
 * Country flag provider for Mi Carrera.
 * Uses local SVG flags. Never pretends a missing flag is real.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Providers = (NS.Providers = NS.Providers || {});

  var FLAG_BASE = 'assets/images/flags/';
  var countryIndex = Object.create(null);

  function normalizeCode(code) {
    return String(code || '')
      .trim()
      .toUpperCase();
  }

  function flagFileCode(country) {
    if (!country) return '';
    return String(country.flagCode || country.code || '')
      .trim()
      .toLowerCase();
  }

  Providers.flags = {
    loadCountries: function (countries) {
      countryIndex = Object.create(null);
      (countries || []).forEach(function (c) {
        if (c && c.code) countryIndex[normalizeCode(c.code)] = c;
      });
    },

    getCountry: function (code) {
      return countryIndex[normalizeCode(code)] || null;
    },

    getCountryFlag: function (code) {
      var normalized = normalizeCode(code);
      var country = this.getCountry(code);
      if (!country) {
        return {
          status: 'missing',
          src: null,
          fallback: { type: 'code_tile', label: normalized || '?', honest: true }
        };
      }

      var fileCode = flagFileCode(country);
      if (!fileCode || country.flagStatus === 'missing') {
        return {
          status: 'missing',
          src: null,
          fallback: { type: 'code_tile', label: normalized, honest: true }
        };
      }

      return {
        status: 'real',
        src: FLAG_BASE + fileCode + '.svg',
        code: normalized,
        fileCode: fileCode
      };
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
