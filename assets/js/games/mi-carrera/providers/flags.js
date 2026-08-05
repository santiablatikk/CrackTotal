(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  var FLAG_BASE = 'assets/images/flags/';
  var cache = Object.create(null);

  /** Map non-file codes to a local SVG that exists (never hotlink). */
  var FLAG_ALIASES = {
    'gb-eng': 'gb',
    'gb-sct': 'gb',
    'gb-wls': 'gb',
    'gb-nir': 'gb',
    eng: 'gb',
    sco: 'gb',
    wal: 'gb',
    nir: 'gb',
    uk: 'gb',
    en: 'gb'
  };

  function normalizeCode(countryCode) {
    var raw = String(countryCode || '')
      .toLowerCase()
      .trim();
    // Keep hyphenated regional codes (gb-eng) before stripping.
    var hyphen = raw.replace(/[^a-z0-9\-]/g, '');
    if (FLAG_ALIASES[hyphen]) return FLAG_ALIASES[hyphen];
    var plain = hyphen.replace(/[^a-z]/g, '');
    if (FLAG_ALIASES[plain]) return FLAG_ALIASES[plain];
    return plain || hyphen;
  }

  function getCountryFlag(countryCode) {
    var code = normalizeCode(countryCode);
    if (!code) {
      return {
        type: 'fallback',
        code: 'xx',
        href: null,
        fallbackHref: FLAG_BASE + '_unknown.svg',
        label: '??'
      };
    }
    if (cache[code]) return cache[code];
    var result = {
      type: 'svg',
      code: code,
      href: FLAG_BASE + code + '.svg',
      fallbackHref: FLAG_BASE + '_unknown.svg',
      label: code.toUpperCase()
    };
    cache[code] = result;
    return result;
  }

  function resolveFlagSrc(flagView, existsFn) {
    if (!flagView) return null;
    if (flagView.type === 'fallback') return flagView.fallbackHref || null;
    if (typeof existsFn === 'function' && !existsFn(flagView.href)) {
      return flagView.fallbackHref || null;
    }
    return flagView.href;
  }

  NS.Flags = {
    getCountryFlag: getCountryFlag,
    resolveFlagSrc: resolveFlagSrc,
    FLAG_BASE: FLAG_BASE,
    FLAG_ALIASES: FLAG_ALIASES,
    normalizeCode: normalizeCode
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
