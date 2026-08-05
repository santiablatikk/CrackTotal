(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  var BADGE_BASE = 'assets/images/badges/';
  var cache = Object.create(null);

  function initialsFromName(shortName, name) {
    var src = String(shortName || name || 'FC').trim();
    var parts = src.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 3).toUpperCase();
    }
    return parts
      .slice(0, 3)
      .map(function (p) {
        return p.charAt(0);
      })
      .join('')
      .toUpperCase();
  }

  function escapeXml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildGeneratedSvg(club) {
    var primary = (club.colors && club.colors.primary) || '#1f2937';
    var secondary = (club.colors && club.colors.secondary) || '#e5e7eb';
    var style = club.badgeStyle || 'shield';
    var initials = initialsFromName(club.shortName, club.name);
    var shape;
    if (style === 'circle') {
      shape =
        '<circle cx="32" cy="32" r="28" fill="' +
        primary +
        '" stroke="' +
        secondary +
        '" stroke-width="4"/>';
    } else if (style === 'stripes') {
      shape =
        '<rect x="4" y="4" width="56" height="56" rx="8" fill="' +
        primary +
        '"/>' +
        '<rect x="18" y="4" width="10" height="56" fill="' +
        secondary +
        '" opacity="0.85"/>' +
        '<rect x="36" y="4" width="10" height="56" fill="' +
        secondary +
        '" opacity="0.85"/>';
    } else {
      shape =
        '<path d="M32 4 L56 14 V34 C56 48 44 56 32 60 C20 56 8 48 8 34 V14 Z" fill="' +
        primary +
        '" stroke="' +
        secondary +
        '" stroke-width="3"/>';
    }
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
      shape +
      '<text x="32" y="38" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" fill="' +
      secondary +
      '">' +
      escapeXml(initials) +
      '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function getClubBadge(clubId, clubData) {
    var key = String(clubId || '');
    if (cache[key] && !clubData) return cache[key];

    var club = clubData || null;
    if (!club && NS._lastEngine && NS._lastEngine.getClub) {
      club = NS._lastEngine.getClub(clubId);
    }

    var badgeId = club && club.badgeId ? club.badgeId : null;
    var result;
    if (badgeId) {
      result = {
        type: 'image',
        clubId: key,
        href: BADGE_BASE + badgeId + '.webp',
        generatedHref: club ? buildGeneratedSvg(club) : null,
        initials: club ? initialsFromName(club.shortName, club.name) : 'FC',
        colors: club && club.colors ? club.colors : null,
        shape: club && club.badgeStyle ? club.badgeStyle : 'shield'
      };
    } else if (club) {
      result = {
        type: 'generated',
        clubId: key,
        href: null,
        generatedHref: buildGeneratedSvg(club),
        initials: initialsFromName(club.shortName, club.name),
        colors: club.colors || null,
        shape: club.badgeStyle || 'shield'
      };
    } else {
      result = {
        type: 'generated',
        clubId: key,
        href: null,
        generatedHref: buildGeneratedSvg({
          shortName: 'FC',
          name: 'Unknown',
          colors: { primary: '#334155', secondary: '#f8fafc' },
          badgeStyle: 'circle'
        }),
        initials: 'FC',
        colors: { primary: '#334155', secondary: '#f8fafc' },
        shape: 'circle'
      };
    }
    cache[key] = result;
    return result;
  }

  function resolveBadgeSrc(badgeView, existsFn) {
    if (!badgeView) return null;
    if (badgeView.type === 'image' && badgeView.href) {
      if (typeof existsFn !== 'function' || existsFn(badgeView.href)) return badgeView.href;
    }
    return badgeView.generatedHref || null;
  }

  NS.Badges = {
    getClubBadge: getClubBadge,
    resolveBadgeSrc: resolveBadgeSrc,
    initialsFromName: initialsFromName,
    buildGeneratedSvg: buildGeneratedSvg,
    BADGE_BASE: BADGE_BASE
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
