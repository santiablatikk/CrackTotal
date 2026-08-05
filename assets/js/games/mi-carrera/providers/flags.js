(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  var FLAG_BASE = 'assets/images/flags/';
  var cache = Object.create(null);

  function getCountryFlag(countryCode) {
    var code = String(countryCode || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!code) {
      return {
        type: 'fallback',
        code: 'xx',
        href: null,
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
    FLAG_BASE: FLAG_BASE
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
