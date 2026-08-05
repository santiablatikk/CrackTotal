(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  function F() {
    return UI.format;
  }

  function clubBadgeHtml(club, size) {
    size = size || 'md';
    if (!club) {
      return '<span class="mc-badge mc-badge--' + size + ' mc-badge--empty" aria-hidden="true">FC</span>';
    }
    var view = NS.getClubBadge(club.id, club);
    var src = NS.Badges.resolveBadgeSrc(view);
    var label = F().escapeHtml(club.shortName || club.name || 'Club');
    if (!src) {
      return (
        '<span class="mc-badge mc-badge--' +
        size +
        '" aria-hidden="true">' +
        F().escapeHtml(view.initials || 'FC') +
        '</span>'
      );
    }
    return (
      '<img class="mc-badge mc-badge--' +
      size +
      '" src="' +
      F().escapeHtml(src) +
      '" alt="" width="64" height="64" loading="lazy" decoding="async" data-club="' +
      F().escapeHtml(club.id) +
      '" />'
    );
  }

  function countryFlagHtml(country, size) {
    size = size || 'md';
    if (!country) {
      return '<span class="mc-flag mc-flag--' + size + '" aria-hidden="true">🏳️</span>';
    }
    var emoji = F().flagEmoji(country.iso2 || country.flagCode);
    return (
      '<span class="mc-flag mc-flag--' +
      size +
      '" title="' +
      F().escapeHtml(country.name) +
      '" aria-hidden="true">' +
      emoji +
      '</span>'
    );
  }

  function meter(label, value, max, tone) {
    var pct = Math.max(0, Math.min(100, Math.round((Number(value) / (max || 100)) * 100)));
    return (
      '<div class="mc-meter" data-tone="' +
      F().escapeHtml(tone || 'primary') +
      '">' +
      '<div class="mc-meter__head"><span>' +
      F().escapeHtml(label) +
      '</span><strong>' +
      F().escapeHtml(String(value)) +
      '</strong></div>' +
      '<div class="mc-meter__track" role="presentation"><span style="width:' +
      pct +
      '%"></span></div>' +
      '</div>'
    );
  }

  function statChip(label, value, hint) {
    return (
      '<div class="mc-stat-chip"' +
      (hint ? ' title="' + F().escapeHtml(hint) + '"' : '') +
      '>' +
      '<span class="mc-stat-chip__label">' +
      F().escapeHtml(label) +
      '</span>' +
      '<strong class="mc-stat-chip__value">' +
      F().escapeHtml(String(value)) +
      '</strong></div>'
    );
  }

  function openModal(opts) {
    var overlay = document.getElementById('mc-modal-root');
    if (!overlay) return;
    var title = opts.title || '';
    var body = opts.bodyHtml || '';
    var actions = opts.actionsHtml || '';
    var size = opts.size || 'md';
    overlay.innerHTML =
      '<div class="ct-modal mc-modal mc-modal--' +
      size +
      '" role="dialog" aria-modal="true" aria-labelledby="mc-modal-title">' +
      '<h2 class="ct-modal__title" id="mc-modal-title">' +
      F().escapeHtml(title) +
      '</h2>' +
      '<div class="ct-modal__body mc-modal__body">' +
      body +
      '</div>' +
      '<div class="ct-modal__actions mc-modal__actions">' +
      actions +
      '</div></div>';
    overlay.classList.add('is-open');
    overlay.setAttribute('data-open', 'true');
    overlay.hidden = false;
    var focusable = overlay.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }

  function closeModal() {
    var overlay = document.getElementById('mc-modal-root');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.removeAttribute('data-open');
    overlay.hidden = true;
    overlay.innerHTML = '';
  }

  function timelineHtml(state, selectedAge) {
    var currentAge = state.age;
    var start = 17;
    var end = Math.max(currentAge, 17);
    var items = [];
    var focus = selectedAge != null ? selectedAge : currentAge;
    for (var age = start; age <= end; age++) {
      var isCurrent = age === currentAge;
      var isSelected = age === focus;
      var past = age < currentAge;
      items.push(
        '<button type="button" class="mc-timeline__item' +
          (isCurrent ? ' is-current' : '') +
          (isSelected ? ' is-selected' : '') +
          (past ? ' is-past' : '') +
          '" data-mc-action="focus-age" data-age="' +
          age +
          '" aria-pressed="' +
          (isSelected ? 'true' : 'false') +
          '" aria-label="Temporada a los ' +
          age +
          ' años">' +
          age +
          '</button>'
      );
    }
    return '<div class="mc-timeline" role="group" aria-label="Línea de carrera">' + items.join('') + '</div>';
  }

  function loadingSkeleton() {
    return (
      '<div class="mc-screen mc-screen--loading" aria-busy="true" aria-live="polite">' +
      '<div class="ct-card mc-panel">' +
      '<div class="ct-skeleton ct-skeleton--title"></div>' +
      '<div class="ct-skeleton" style="margin-top:1rem"></div>' +
      '<div class="ct-skeleton" style="margin-top:.6rem;width:80%"></div>' +
      '<div class="ct-skeleton ct-skeleton--card" style="margin-top:1.5rem"></div>' +
      '</div></div>'
    );
  }

  function errorBlock(message, actionLabel) {
    return (
      '<div class="mc-screen mc-screen--error ct-card" role="alert">' +
      '<p class="ct-empty__title">Algo falló</p>' +
      '<p class="ct-empty__text">' +
      F().escapeHtml(message || 'No pudimos cargar Mi Carrera.') +
      '</p>' +
      '<button type="button" class="ct-button ct-button--primary" data-mc-action="retry">' +
      F().escapeHtml(actionLabel || 'Reintentar') +
      '</button></div>'
    );
  }

  UI.components = {
    clubBadgeHtml: clubBadgeHtml,
    countryFlagHtml: countryFlagHtml,
    meter: meter,
    statChip: statChip,
    openModal: openModal,
    closeModal: closeModal,
    timelineHtml: timelineHtml,
    loadingSkeleton: loadingSkeleton,
    errorBlock: errorBlock
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
