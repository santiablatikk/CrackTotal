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

  function Badge(clubId, size) {
    size = size || 'md';
    var wrap = el('div', 'mc-badge mc-badge--' + size);
    var club = NS.Providers.clubs.getById(clubId);
    var asset = NS.Providers.clubs.getClubBadge(clubId);
    wrap.setAttribute('data-status', asset.status || 'missing');
    if (asset.status === 'real' && asset.src) {
      var img = el('img', 'mc-badge__img');
      img.src = asset.src;
      img.alt = club ? club.name : clubId;
      img.loading = 'lazy';
      wrap.appendChild(img);
    } else {
      var fb = asset.fallback || {};
      var tile = el('div', 'mc-badge__fallback');
      tile.style.background =
        'linear-gradient(145deg, ' +
        (fb.primaryColor || '#1f2937') +
        ', ' +
        (fb.secondaryColor || '#9ca3af') +
        ')';
      tile.appendChild(text('span', 'mc-badge__label', fb.label || '?'));
      wrap.appendChild(tile);
    }
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
    wrap.setAttribute('data-status', asset.status || 'missing');
    wrap.setAttribute('data-rarity', (comp && comp.rarity) || 'normal');
    if (asset.status === 'real' && asset.src) {
      var img = el('img', 'mc-trophy__img');
      img.src = asset.src;
      img.alt = (comp && (comp.shortName || comp.name)) || competitionId;
      wrap.appendChild(img);
    } else {
      var fb = asset.fallback || {};
      var sil = el('div', 'mc-trophy__fallback mc-trophy__fallback--' + (fb.rarity || 'normal'));
      sil.appendChild(text('span', 'mc-trophy__mark', '◆'));
      sil.appendChild(text('span', 'mc-trophy__label', fb.label || competitionId));
      wrap.appendChild(sil);
    }
    return wrap;
  }

  function Award(awardId, size) {
    size = size || 'sm';
    var wrap = el('div', 'mc-award mc-award--' + size);
    var asset = NS.Providers.awards.getAwardImage(awardId);
    var award = NS.Providers.awards.getById(awardId);
    wrap.setAttribute('data-status', asset.status || 'missing');
    wrap.setAttribute('data-rarity', (award && award.rarity) || 'normal');
    if (awardId === 'ballon_dor') wrap.classList.add('mc-award--ballon');
    if (asset.status === 'real' && asset.src) {
      var img = el('img', 'mc-award__img');
      img.src = asset.src;
      img.alt = (award && award.name) || awardId;
      wrap.appendChild(img);
    } else {
      var fb = asset.fallback || {};
      var mark = el('div', 'mc-award__fallback');
      mark.appendChild(text('span', 'mc-award__glyph', awardId === 'ballon_dor' ? '●' : '★'));
      mark.appendChild(text('span', 'mc-award__label', fb.label || awardId));
      wrap.appendChild(mark);
    }
    return wrap;
  }

  function Age(age, opts) {
    opts = opts || {};
    var wrap = el('div', 'mc-age' + (opts.huge ? ' mc-age--huge' : ''));
    wrap.appendChild(text('div', 'mc-age__n', age));
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
    var wrap = el('div', 'mc-timeline');
    (spells || []).forEach(function (spell) {
      var row = el('div', 'mc-timeline__row');
      var ages = String(spell.ageStart) + (spell.ageEnd != null ? '–' + spell.ageEnd : '');
      row.appendChild(text('div', 'mc-timeline__age', ages));
      row.appendChild(Badge(spell.clubId, opts.size || 'sm'));
      var club = NS.Providers.clubs.getById(spell.clubId);
      row.appendChild(text('div', 'mc-timeline__name', club ? club.name : spell.clubId));
      wrap.appendChild(row);
    });
    return wrap;
  }

  function CareerHeadline(textValue) {
    return text('h2', 'mc-headline', textValue);
  }

  function Scene(kind) {
    var scene = el('section', 'mc-scene mc-scene--' + String(kind || 'base').toLowerCase());
    scene.setAttribute('data-scene', kind);
    return scene;
  }

  function PrimaryCTA(label, action) {
    var btn = el('button', 'mc-cta mc-cta--primary');
    btn.type = 'button';
    btn.textContent = label;
    if (action) btn.setAttribute('data-action', action);
    return btn;
  }

  function SecondaryCTA(label, action) {
    var btn = el('button', 'mc-cta mc-cta--secondary');
    btn.type = 'button';
    btn.textContent = label;
    if (action) btn.setAttribute('data-action', action);
    return btn;
  }

  UI.Components = {
    el: el,
    text: text,
    Badge: Badge,
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
    SecondaryCTA: SecondaryCTA
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
