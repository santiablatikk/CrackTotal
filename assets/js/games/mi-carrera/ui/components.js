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
    var gen = view && view.generatedHref;
    if (!src) {
      return (
        '<span class="mc-badge mc-badge--' +
        size +
        '" aria-hidden="true">' +
        F().escapeHtml(view.initials || 'FC') +
        '</span>'
      );
    }
    var onerr =
      gen && src !== gen
        ? ' onerror="this.onerror=null;this.src=\'' + String(gen).replace(/'/g, '%27') + '\'"'
        : '';
    return (
      '<img class="mc-badge mc-badge--' +
      size +
      '" src="' +
      F().escapeHtml(src) +
      '" alt="" width="64" height="64" loading="lazy" decoding="async" data-club="' +
      F().escapeHtml(club.id) +
      '"' +
      onerr +
      ' />'
    );
  }

  function clubPathCardHtml(option, engine) {
    if (!option) return '';
    var club = option.club || (engine && engine.getClub(option.clubId));
    var country =
      club && engine ? engine.world.countriesById[club.countryId] : null;
    var stars = Array(Math.max(1, Math.min(5, option.stars || 1)) + 1).join('★');
    return (
      '<article class="mc-club-pick mc-club-pick--' +
      F().escapeHtml(option.pathId || 'balance') +
      '">' +
      clubBadgeHtml(club, 'xxl') +
      '<p class="mc-club-pick__path">' +
      F().escapeHtml(option.pathLabel || '') +
      '</p>' +
      '<h2>' +
      F().escapeHtml(club ? club.shortName || club.name : 'Club') +
      '</h2>' +
      '<p class="mc-club-pick__meta">' +
      (country ? countryFlagHtml(country, 'sm') + ' ' : '') +
      F().escapeHtml(option.competitionName || '') +
      '</p>' +
      '<p class="mc-club-pick__stars" aria-hidden="true">' +
      stars +
      '</p>' +
      '<p class="mc-club-pick__role">' +
      F().escapeHtml(F().ROLE_LABELS[option.role] || option.role || '') +
      ' · ' +
      F().escapeHtml((option.minutes && option.minutes.label) || '') +
      '</p>' +
      '<p class="mc-club-pick__tag">' +
      F().escapeHtml(option.tagline || '') +
      '</p>' +
      '<button type="button" class="ct-button ct-button--primary" data-mc-action="pick-start-club" data-club="' +
      F().escapeHtml(option.clubId) +
      '">Elegir</button></article>'
    );
  }

  function countryFlagHtml(country, size) {
    size = size || 'md';
    if (!country) {
      return '<span class="mc-flag mc-flag--' + size + '" aria-hidden="true">🏳️</span>';
    }
    var code = String(country.flagCode || country.iso2 || '')
      .toLowerCase()
      .replace(/[^a-z]/g, '');
    var emoji = F().flagEmoji(country.iso2 || country.flagCode);
    var view = null;
    if (NS.getCountryFlag) view = NS.getCountryFlag(code);
    else if (NS.Flags && NS.Flags.getCountryFlag) view = NS.Flags.getCountryFlag(code);
    var src = view && (view.href || view.fallbackHref);
    if (src) {
      return (
        '<img class="mc-flag mc-flag--img mc-flag--' +
        size +
        '" src="' +
        F().escapeHtml(src) +
        '" alt="' +
        F().escapeHtml(country.name || code.toUpperCase()) +
        '" title="' +
        F().escapeHtml(country.name || '') +
        '" width="32" height="24" loading="lazy" decoding="async" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'mc-flag mc-flag--' +
        size +
        '\',textContent:\'' +
        emoji +
        '\',title:this.title}));" />'
      );
    }
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
    overlay.setAttribute('aria-hidden', 'false');
    overlay.hidden = false;
    var focusable = overlay.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }

  function closeModal() {
    var overlay = document.getElementById('mc-modal-root');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.removeAttribute('data-open');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    overlay.innerHTML = '';
  }

  function timelineHtml(state, selectedAge) {
    var moments = state.moments || [];
    var titles = state.titles || [];
    var awards = state.awards || [];
    var events = [];

    function pushEv(ev) {
      if (!ev || !ev.label) return;
      events.push(ev);
    }

    if (state.seasonHistory && state.seasonHistory.length) {
      var first = state.seasonHistory[0];
      pushEv({
        seasonIndex: first.seasonIndex,
        seasonLabel: first.seasonLabel || F().seasonLabel(first.seasonIndex),
        label: 'Debut',
        type: 'debut',
        icon: '🚩'
      });
    }

    titles.forEach(function (t) {
      pushEv({
        seasonIndex: t.seasonIndex,
        seasonLabel: t.seasonLabel,
        label: t.shortName || t.name,
        type: 'title',
        icon: '🏆'
      });
    });

    awards.forEach(function (a) {
      pushEv({
        seasonIndex: a.seasonIndex,
        seasonLabel: a.seasonLabel,
        label: a.shortName || a.name,
        type: 'award',
        icon: '🥇'
      });
    });

    moments.forEach(function (m) {
      var important =
        m.id === 'moment_retire' ||
        m.id === 'moment_intl_debut' ||
        m.id === 'moment_first_callup' ||
        m.id === 'moment_world_cup' ||
        m.id === 'moment_first_ucl' ||
        m.id === 'moment_first_libertadores' ||
        m.id === 'moment_ballon' ||
        m.id === 'moment_100_goals' ||
        m.id === 'moment_500_apps' ||
        m.id === 'moment_first_league';
      if (!important) return;
      pushEv({
        seasonIndex: m.seasonIndex,
        seasonLabel: m.seasonLabel,
        label: m.label,
        type: 'moment',
        icon: '⭐'
      });
    });

    if (state.retired) {
      pushEv({
        seasonIndex: Math.max(0, (state.seasonIndex || 1) - 1),
        seasonLabel: NS.Competitions
          ? NS.Competitions.seasonLabel(Math.max(0, state.seasonIndex - 1))
          : '',
        label: 'Retiro',
        type: 'retire',
        icon: '🎖️'
      });
    }

    events.sort(function (a, b) {
      return (a.seasonIndex || 0) - (b.seasonIndex || 0);
    });

    var seen = Object.create(null);
    var unique = [];
    events.forEach(function (ev) {
      var key = (ev.seasonIndex || 0) + ':' + ev.label;
      if (seen[key]) return;
      seen[key] = true;
      unique.push(ev);
    });

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

    var ageStrip =
      '<div class="mc-timeline" role="group" aria-label="Edades de carrera">' + items.join('') + '</div>';

    if (!unique.length) {
      return ageStrip;
    }

    var story = unique
      .slice(-10)
      .map(function (ev) {
        return (
          '<li class="mc-story-timeline__item mc-story-timeline__item--' +
          F().escapeHtml(ev.type || 'event') +
          '">' +
          '<span class="mc-story-timeline__icon" aria-hidden="true">' +
          (ev.icon || '•') +
          '</span>' +
          '<div><strong>' +
          F().escapeHtml(ev.seasonLabel || '') +
          '</strong>' +
          '<span>' +
          F().escapeHtml(ev.label) +
          '</span></div></li>'
        );
      })
      .join('');

    return (
      '<div class="mc-timeline-stack">' +
      ageStrip +
      '<ol class="mc-story-timeline" aria-label="Momentos de la carrera">' +
      story +
      '</ol></div>'
    );
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
    clubPathCardHtml: clubPathCardHtml,
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
