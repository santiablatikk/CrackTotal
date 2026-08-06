(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  function F() {
    return UI.format;
  }

  function buildShareText(vm) {
    var flag = vm.country ? F().flagEmoji(vm.country.iso2 || vm.country.flagCode) : '';
    var category = (vm.category && vm.category.label) || 'Carrera';
    var lines = [
      'Mi carrera en Crack Total',
      '',
      vm.playerName,
      (vm.emergentLabel || vm.position) +
        (flag ? ' · ' + flag : ''),
      vm.ageStart + ' → ' + vm.ageEnd + ' años',
      '',
      vm.storyPhrase || '',
      '',
      vm.appearances + ' partidos · Pico ' + vm.peakRating,
      F().isGoalkeeper(vm.position)
        ? vm.goalsAgainst + ' GC · ' + vm.cleanSheets + ' VI'
        : vm.goals + ' goles · ' + vm.titles + ' títulos',
      '',
      String(category).toUpperCase() +
        (vm.score != null ? ' · ' + Number(vm.score).toFixed(1) + '/10' : ''),
      '',
      '¿Podés superar mi carrera?',
      'https://cracktotal.com/mi-carrera.html'
    ].filter(function (line, i, arr) {
      return !(line === '' && arr[i - 1] === '');
    });
    return lines.join('\n');
  }

  function copyText(text) {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        return { ok: true, method: 'clipboard' };
      });
    }
    return new Promise(function (resolve, reject) {
      try {
        if (typeof document === 'undefined') {
          reject(new Error('Clipboard no disponible'));
          return;
        }
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(area);
        if (ok) resolve({ ok: true, method: 'execCommand' });
        else reject(new Error('No se pudo copiar'));
      } catch (e) {
        reject(e);
      }
    });
  }

  function canNativeShare() {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    );
  }

  function shareCareer(vm) {
    var text = buildShareText(vm);
    if (canNativeShare()) {
      return navigator
        .share({
          title: 'Mi Carrera — Crack Total',
          text: text,
          url: 'https://cracktotal.com/mi-carrera.html'
        })
        .then(function () {
          return { ok: true, method: 'share', text: text };
        })
        .catch(function (err) {
          if (err && err.name === 'AbortError') {
            return { ok: false, aborted: true, method: 'share', text: text };
          }
          return copyText(text).then(function (r) {
            return { ok: true, method: 'clipboard-fallback', text: text, from: r.method };
          });
        });
    }
    return copyText(text).then(function (r) {
      return { ok: true, method: 'clipboard', text: text, from: r.method };
    });
  }

  UI.Share = {
    buildShareText: buildShareText,
    copyText: copyText,
    shareCareer: shareCareer,
    canNativeShare: canNativeShare
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
