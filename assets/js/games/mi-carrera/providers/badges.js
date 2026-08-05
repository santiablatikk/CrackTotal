(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  /** Local-only badge roots (no runtime hotlinking). */
  var BADGE_ROOTS = ['assets/images/mi-carrera/clubs/', 'assets/images/badges/'];
  var cache = Object.create(null);
  var manifestById = Object.create(null);
  var manifestLoaded = false;

  function initialsFromName(shortName, name) {
    var src = String(shortName || name || 'FC').trim();
    var parts = src.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
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

  function loadManifest(manifest) {
    manifestById = Object.create(null);
    manifestLoaded = false;
    if (!manifest || !manifest.clubs) return;
    (manifest.clubs || []).forEach(function (entry) {
      if (entry && entry.clubId) manifestById[entry.clubId] = entry;
    });
    manifestLoaded = true;
    cache = Object.create(null);
  }

  function candidateHrefs(clubId, badgeId, manifestPath) {
    var id = String(clubId || '').replace(/[^a-z0-9_\-]/gi, '');
    var bid = badgeId ? String(badgeId).replace(/[^a-z0-9_\-]/gi, '') : '';
    var list = [];
    if (manifestPath) list.push(manifestPath);
    BADGE_ROOTS.forEach(function (root) {
      if (id) {
        list.push(root + id + '.svg');
        list.push(root + id + '.webp');
        list.push(root + id + '.png');
      }
      if (bid && bid !== id) {
        list.push(root + bid + '.svg');
        list.push(root + bid + '.webp');
        list.push(root + bid + '.png');
      }
    });
    return list;
  }

  function getClubBadge(clubId, clubData) {
    var key = String(clubId || '');
    if (cache[key] && !clubData) return cache[key];

    var club = clubData || null;
    if (!club && NS._lastEngine && NS._lastEngine.getClub) {
      club = NS._lastEngine.getClub(clubId);
    }

    var entry = manifestById[key] || null;
    var badgeId = (club && club.badgeId) || (entry && entry.badgeId) || null;
    var status = entry && entry.status ? entry.status : 'missing';
    var generated = club
      ? buildGeneratedSvg(club)
      : buildGeneratedSvg({
          shortName: (entry && entry.shortName) || 'FC',
          name: (entry && entry.clubName) || 'Unknown',
          colors: (entry && entry.colors) || { primary: '#334155', secondary: '#f8fafc' },
          badgeStyle: (entry && entry.badgeStyle) || 'circle'
        });

    var hrefs = candidateHrefs(key, badgeId, entry && entry.assetPath);

    var result = {
      type: status === 'real' ? 'image' : 'generated',
      status: status,
      clubId: key,
      href: status === 'real' && entry && entry.assetPath ? entry.assetPath : hrefs[0] || null,
      hrefCandidates: hrefs,
      generatedHref: generated,
      initials: club
        ? initialsFromName(club.shortName, club.name)
        : initialsFromName(entry && entry.shortName, entry && entry.clubName),
      colors:
        (club && club.colors) ||
        (entry && entry.colors) || { primary: '#334155', secondary: '#f8fafc' },
      shape: (club && club.badgeStyle) || (entry && entry.badgeStyle) || 'shield',
      hasLocalFile: status === 'real',
      isOfficialCrest: status === 'real'
    };
    cache[key] = result;
    return result;
  }

  function resolveBadgeSrc(badgeView, existsFn) {
    if (!badgeView) return null;
    // Official crest only when status is real and file exists (or known from manifest).
    if (badgeView.status === 'real' && badgeView.href) {
      if (typeof existsFn !== 'function' || existsFn(badgeView.href)) {
        badgeView.hasLocalFile = true;
        badgeView.type = 'image';
        return badgeView.href;
      }
    }
    var candidates = badgeView.hrefCandidates || (badgeView.href ? [badgeView.href] : []);
    if (typeof existsFn === 'function') {
      for (var i = 0; i < candidates.length; i++) {
        if (candidates[i] && existsFn(candidates[i])) {
          badgeView.hasLocalFile = true;
          badgeView.type = 'image';
          badgeView.status = 'real';
          badgeView.isOfficialCrest = true;
          return candidates[i];
        }
      }
      badgeView.type = 'generated';
      badgeView.status = badgeView.status === 'fallback' ? 'fallback' : 'missing';
      badgeView.isOfficialCrest = false;
      return badgeView.generatedHref || null;
    }
    // Browser: never assume a disk file exists → generated until real assets ship.
    badgeView.type = 'generated';
    badgeView.isOfficialCrest = false;
    return badgeView.generatedHref || null;
  }

  NS.Badges = {
    getClubBadge: getClubBadge,
    resolveBadgeSrc: resolveBadgeSrc,
    loadManifest: loadManifest,
    initialsFromName: initialsFromName,
    buildGeneratedSvg: buildGeneratedSvg,
    BADGE_BASE: BADGE_ROOTS[0],
    BADGE_ROOTS: BADGE_ROOTS,
    isManifestLoaded: function () {
      return manifestLoaded;
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
