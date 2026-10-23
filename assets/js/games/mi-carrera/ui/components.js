/**
 * Visual components for Mi Carrera. Providers resolve assets; UI never invents official crests.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var UI = (NS.UI = NS.UI || {});

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function text(tag, cls, value) {
    var node = el(tag, cls);
    node.textContent = value == null ? '' : String(value);
    return node;
  }

  function colorLum(hex) {
    var c = String(hex || '').replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    if (c.length !== 6) return 80;
    var r = parseInt(c.slice(0, 2), 16);
    var g = parseInt(c.slice(2, 4), 16);
    var b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  function badgeColors(primary, secondary) {
    var p = primary || '#2a3344';
    var s = secondary || '#9aa3b5';
    if (colorLum(p) < 28) p = '#3d4658';
    if (colorLum(s) > 235 && colorLum(p) < 90) s = '#c8ceda';
    if (colorLum(p) > 220 && colorLum(s) > 220) {
      p = '#2a3344';
      s = '#d8ff3e';
    }
    return { primary: p, secondary: s };
  }

  function Badge(clubId, size) {
    size = size || 'md';
    var wrap = el('div', 'mc-badge mc-badge--' + size);
    var club = NS.Providers.clubs.getById(clubId);
    var asset = NS.Providers.clubs.getClubBadge(clubId);
    var status = asset.status || 'missing';
    wrap.setAttribute('data-status', status);
    wrap.setAttribute(
      'data-badge',
      status === 'real' ? 'real' : status === 'generated' ? 'generated' : 'fallback'
    );
    if ((status === 'real' || status === 'generated') && asset.src) {
      var img = el('img', 'mc-badge__img');
      img.src = asset.src;
      img.alt = club ? club.name : clubId;
      img.loading = 'lazy';
      if (status === 'generated') img.setAttribute('data-generated', '1');
      wrap.appendChild(img);
    } else {
      var fb = asset.fallback || {};
      var colors = badgeColors(fb.primaryColor, fb.secondaryColor);
      var tile = el('div', 'mc-badge__fallback');
      tile.setAttribute('aria-label', 'Escudo no disponible');
      tile.style.background =
        'linear-gradient(160deg, ' + colors.primary + ' 0%, ' + colors.secondary + ' 100%)';
      var label = String(fb.label || (club && club.shortName) || '?');
      tile.appendChild(text('span', 'mc-badge__label', label.length > 8 ? label.slice(0, 3) : label));
      wrap.appendChild(tile);
    }
    return wrap;
  }

  /** Club mark: badge + name + optional country/competition. Variants: sm, md, lg, card. */
  function ClubMark(clubId, opts) {
    opts = opts || {};
    var variant = opts.variant || 'md';
    var wrap = el('div', 'mc-club mc-club--' + variant);
    var club = NS.Providers.clubs.getById(clubId);
    var size = opts.size || (variant === 'lg' || variant === 'card' ? 'lg' : variant === 'sm' ? 'sm' : 'md');
    wrap.appendChild(Badge(clubId, size));
    var meta = el('div', 'mc-club__meta');
    meta.appendChild(text('div', 'mc-club__name', club ? club.name : clubId));
    var bits = [];
    if (opts.showCountry !== false && club && club.countryCode) bits.push(club.countryCode);
    if (opts.showCompetition !== false && club) {
      bits.push(NS.Providers.clubs.getTierLabel(club));
    }
    if (bits.length) meta.appendChild(text('div', 'mc-club__sub', bits.join(' · ')));
    wrap.appendChild(meta);
    return wrap;
  }

  function Flag(countryCode, size) {
    size = size || 'md';
    var wrap = el('div', 'mc-flag mc-flag--' + size);
    var asset = NS.Providers.flags.getCountryFlag(countryCode);
    wrap.setAttribute('data-status', asset.status || 'missing');
    if (asset.status === 'real' && asset.src) {
      var img = el('img', 'mc-flag__img');
      img.src = asset.src;
      img.alt = countryCode || '';
      img.loading = 'lazy';
      wrap.appendChild(img);
    } else {
      var fb = asset.fallback || {};
      wrap.appendChild(text('span', 'mc-flag__fallback', fb.label || countryCode || '?'));
    }
    return wrap;
  }

  function CompetitionLogo(competitionId, size) {
    size = size || 'md';
    var wrap = el('div', 'mc-comp mc-comp--' + size);
    var asset = NS.Providers.competitions.getCompetitionLogo(competitionId);
    var comp = NS.Providers.competitions.getById(competitionId);
    wrap.setAttribute('data-status', asset.status || 'missing');
    wrap.setAttribute('data-rarity', (comp && comp.rarity) || 'normal');
    if (asset.status === 'real' && asset.src) {
      var img = el('img', 'mc-comp__img');
      img.src = asset.src;
      img.alt = (comp && comp.name) || competitionId;
      wrap.appendChild(img);
    } else {
      var fb = asset.fallback || {};
      var mark = el('div', 'mc-comp__fallback');
      mark.appendChild(text('span', 'mc-comp__label', fb.label || competitionId));
      wrap.appendChild(mark);
    }
    return wrap;
  }

  function Trophy(competitionId, size) {
    size = size || 'sm';
    var wrap = el('div', 'mc-trophy mc-trophy--' + size);
    var asset = NS.Providers.trophies.getTrophyImage(competitionId);
    var comp = NS.Providers.competitions.getById(competitionId);
    var status = asset.status || 'missing';
    wrap.setAttribute('data-status', status);
    wrap.setAttribute('data-trophy', status === 'real' ? 'real' : 'fallback');
    wrap.setAttribute('data-rarity', (comp && comp.rarity) || 'normal');
    wrap.setAttribute('data-competition', competitionId || '');
    if (status === 'real' && asset.src) {
      var img = el('img', 'mc-trophy__img');
      img.src = asset.src;
      img.alt = (comp && (comp.shortName || comp.name)) || competitionId;
      wrap.appendChild(img);
    } else {
      var fb = asset.fallback || {};
      var rarity = (comp && comp.rarity) || fb.rarity || 'normal';
      var sil = el(
        'div',
        'mc-trophy__fallback mc-trophy__fallback--' + rarity + ' mc-trophy__fallback--' + String(competitionId || 'generic').replace(/[^a-z0-9_-]/gi, '')
      );
      sil.setAttribute('aria-label', 'Trofeo ilustrativo');
      sil.appendChild(el('div', 'mc-trophy__cup'));
      sil.appendChild(text('span', 'mc-trophy__label', fb.label || (comp && comp.shortName) || competitionId));
      wrap.appendChild(sil);
    }
    return wrap;
  }

  function Award(awardId, size) {
    size = size || 'sm';
    var wrap = el('div', 'mc-award mc-award--' + size);
    var asset = NS.Providers.awards.getAwardImage(awardId);
    var award = NS.Providers.awards.getById(awardId);
    var status = asset.status || 'missing';
    wrap.setAttribute('data-status', status);
    wrap.setAttribute('data-award', status === 'real' ? 'real' : 'fallback');
    wrap.setAttribute('data-rarity', (award && award.rarity) || 'normal');
    wrap.setAttribute('data-award-id', awardId || '');
    if (awardId === 'ballon_dor') wrap.classList.add('mc-award--ballon');
    if (status === 'real' && asset.src) {
      var img = el('img', 'mc-award__img');
      img.src = asset.src;
      img.alt = (award && award.name) || awardId;
      wrap.appendChild(img);
    } else {
      var fb = asset.fallback || {};
      var mark = el('div', 'mc-award__fallback');
      mark.setAttribute('aria-label', 'Premio ilustrativo');
      var disc = el('div', 'mc-award__disc' + (awardId === 'ballon_dor' ? ' mc-award__disc--ballon' : ''));
      mark.appendChild(disc);
      mark.appendChild(text('span', 'mc-award__label', fb.label || (award && award.shortName) || awardId));
      wrap.appendChild(mark);
    }
    return wrap;
  }

  function Age(age, opts) {
    opts = opts || {};
    var wrap = el('div', 'mc-age' + (opts.huge ? ' mc-age--huge' : ''));
    wrap.appendChild(text('div', 'mc-age__n', age));
    if (opts.chapter) wrap.appendChild(text('div', 'mc-age__chapter', opts.chapter));
    wrap.appendChild(text('div', 'mc-age__u', opts.unit || 'AÑOS'));
    if (opts.birthYear != null) wrap.appendChild(text('div', 'mc-age__birth', opts.birthYear));
    return wrap;
  }

  function Stat(label, value) {
    var wrap = el('div', 'mc-stat');
    wrap.appendChild(text('div', 'mc-stat__v', value));
    wrap.appendChild(text('div', 'mc-stat__l', label));
    return wrap;
  }

  function OVRChange(before, after) {
    var wrap = el('div', 'mc-ovr');
    wrap.appendChild(text('span', 'mc-ovr__before', before));
    wrap.appendChild(text('span', 'mc-ovr__arrow', '→'));
    wrap.appendChild(text('span', 'mc-ovr__after', after));
    var d = Number(after) - Number(before);
    if (d !== 0) {
      wrap.appendChild(text('span', 'mc-ovr__delta' + (d > 0 ? ' is-up' : ' is-down'), (d > 0 ? '+' : '') + d));
    }
    return wrap;
  }

  function ClubTimeline(spells, opts) {
    opts = opts || {};
    var wrap = el('div', 'mc-timeline' + (opts.variant === 'poster' ? ' mc-timeline--poster' : ''));
    (spells || []).forEach(function (spell, idx) {
      var row = el('div', 'mc-timeline__row');
      row.setAttribute('style', '--mc-i:' + idx);
      row.appendChild(text('div', 'mc-timeline__age', String(spell.ageStart)));
      row.appendChild(Badge(spell.clubId, opts.size || 'md'));
      var club = NS.Providers.clubs.getById(spell.clubId);
      var body = el('div', 'mc-timeline__body');
      body.appendChild(text('div', 'mc-timeline__name', club ? club.shortName || club.name : spell.clubId));
      if (spell.ageEnd != null && spell.ageEnd !== spell.ageStart) {
        body.appendChild(text('div', 'mc-timeline__span', spell.ageStart + '–' + spell.ageEnd));
      }
      row.appendChild(body);
      wrap.appendChild(row);
    });
    if (opts.retireAge != null) {
      var end = el('div', 'mc-timeline__row mc-timeline__row--retire');
      end.appendChild(text('div', 'mc-timeline__age', String(opts.retireAge)));
      end.appendChild(text('div', 'mc-timeline__retire-mark', '●'));
      end.appendChild(text('div', 'mc-timeline__name', 'RETIRO'));
      wrap.appendChild(end);
    }
    return wrap;
  }

  function CareerHeadline(textValue) {
    return text('h2', 'mc-headline', textValue);
  }

  function Scene(kind) {
    var scene = el('section', 'mc-scene mc-scene--' + String(kind || 'base').toLowerCase());
    scene.setAttribute('data-scene', kind);
    scene.appendChild(el('div', 'mc-atmosphere'));
    scene.appendChild(el('div', 'mc-vignette'));
    return scene;
  }

  function PrimaryCTA(label, action) {
    var btn = el('button', 'mc-cta mc-cta--primary');
    btn.type = 'button';
    btn.appendChild(text('span', 'mc-cta__label', String(label || '').trim()));
    if (action) btn.setAttribute('data-action', action);
    return btn;
  }

  function SecondaryCTA(label, action) {
    var btn = el('button', 'mc-cta mc-cta--secondary');
    btn.type = 'button';
    btn.appendChild(text('span', 'mc-cta__label', label));
    if (action) btn.setAttribute('data-action', action);
    return btn;
  }

  /** Compact career HUD — live totals from Engine.History.liveTotals. */
  function CareerHUD(career) {
    var wrap = el('div', 'mc-hud');
    if (!career || !career.player || !career.currentClubId) {
      wrap.classList.add('is-empty');
      return wrap;
    }
    var totals = NS.Engine.History.liveTotals(career);
    var club = NS.Providers.clubs.getById(career.currentClubId);
    var clubName = (club && (club.shortName || club.name)) || '—';

    var top = el('div', 'mc-hud__top');
    top.appendChild(text('div', 'mc-hud__brand', 'MI CARRERA'));
    var id = el('div', 'mc-hud__id');
    id.appendChild(text('span', 'mc-hud__age', totals.age + ' AÑOS'));
    id.appendChild(text('span', 'mc-hud__dot', '·'));
    id.appendChild(text('span', 'mc-hud__club', clubName));
    id.appendChild(text('span', 'mc-hud__dot', '·'));
    id.appendChild(text('span', 'mc-hud__ovr', 'OVR ' + totals.overall));
    top.appendChild(id);
    wrap.appendChild(top);

    var stats = el('div', 'mc-hud__stats');
    [
      ['PJ', totals.appearances],
      ['G', totals.goals],
      ['A', totals.assists],
      ['CLUBES', totals.clubs],
      ['TÍTULOS', totals.titles]
    ].forEach(function (pair) {
      var cell = el('div', 'mc-hud__stat');
      cell.appendChild(text('span', 'mc-hud__stat-k', pair[0]));
      cell.appendChild(text('span', 'mc-hud__stat-v', String(pair[1])));
      stats.appendChild(cell);
    });
    wrap.appendChild(stats);

    var mobile = el('div', 'mc-hud__mobile');
    mobile.appendChild(text('div', 'mc-hud__m1', totals.age + ' AÑOS · OVR ' + totals.overall));
    mobile.appendChild(text('div', 'mc-hud__m2', clubName));
    mobile.appendChild(
      text(
        'div',
        'mc-hud__m3',
        'PJ ' +
          totals.appearances +
          '   G ' +
          totals.goals +
          '   A ' +
          totals.assists +
          '   🏆 ' +
          totals.titles
      )
    );
    wrap.appendChild(mobile);
    return wrap;
  }

  function Modal(title, body, actions) {
    var root = el('div', 'mc-modal');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    var card = el('div', 'mc-modal__card');
    if (title) card.appendChild(text('div', 'mc-modal__title', title));
    if (body) card.appendChild(text('p', 'mc-modal__body', body));
    var row = el('div', 'mc-modal__actions');
    (actions || []).forEach(function (a) {
      var btn = a.primary ? PrimaryCTA(a.label, a.action) : SecondaryCTA(a.label, a.action);
      row.appendChild(btn);
    });
    card.appendChild(row);
    root.appendChild(card);
    return root;
  }

  UI.Components = {
    el: el,
    text: text,
    Badge: Badge,
    ClubMark: ClubMark,
    Flag: Flag,
    CompetitionLogo: CompetitionLogo,
    Trophy: Trophy,
    Award: Award,
    Age: Age,
    Stat: Stat,
    OVRChange: OVRChange,
    ClubTimeline: ClubTimeline,
    CareerHeadline: CareerHeadline,
    Scene: Scene,
    PrimaryCTA: PrimaryCTA,
    SecondaryCTA: SecondaryCTA,
    CareerHUD: CareerHUD,
    Modal: Modal
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
