(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  var IMG_ROOT = 'assets/images/mi-carrera/';
  var cache = Object.create(null);

  function escapeXml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hashHue(str) {
    var h = 0;
    var s = String(str || 'x');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 360;
  }

  function svgData(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function generatedPlayerSvg(name, position) {
    var hue = hashHue(name + position);
    var initials = String(name || 'CT')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (p) {
        return p.charAt(0);
      })
      .join('')
      .toUpperCase() || 'CT';
    return svgData(
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="hsl(' +
        hue +
        ',55%,28%)"/><stop offset="100%" stop-color="hsl(' +
        ((hue + 40) % 360) +
        ',50%,16%)"/></linearGradient></defs>' +
        '<rect width="96" height="96" rx="20" fill="url(#g)"/>' +
        '<circle cx="48" cy="38" r="18" fill="rgba(255,255,255,0.18)"/>' +
        '<text x="48" y="78" text-anchor="middle" fill="#f7f9fc" font-family="Segoe UI,Arial" font-size="18" font-weight="700">' +
        escapeXml(initials) +
        '</text></svg>'
    );
  }

  function generatedCompetitionSvg(comp) {
    var name = (comp && (comp.shortName || comp.name)) || 'CUP';
    var hue = hashHue(comp && comp.id);
    var label = String(name).slice(0, 4).toUpperCase();
    return svgData(
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
        '<rect width="64" height="64" rx="12" fill="hsl(' +
        hue +
        ',40%,18%)"/>' +
        '<path d="M18 18 H46 V28 C46 40 36 48 32 50 C28 48 18 40 18 28 Z" fill="hsl(' +
        hue +
        ',55%,48%)"/>' +
        '<text x="32" y="30" text-anchor="middle" fill="#0b1524" font-size="9" font-weight="800" font-family="Segoe UI,Arial">' +
        escapeXml(label) +
        '</text></svg>'
    );
  }

  function generatedAwardSvg(award) {
    var name = (award && (award.shortName || award.name)) || 'AW';
    var hue = hashHue(award && award.id);
    return svgData(
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
        '<circle cx="32" cy="32" r="28" fill="hsl(' +
        hue +
        ',55%,42%)" stroke="#fbbf24" stroke-width="3"/>' +
        '<text x="32" y="37" text-anchor="middle" fill="#0b1524" font-size="11" font-weight="800" font-family="Segoe UI,Arial">' +
        escapeXml(String(name).slice(0, 4).toUpperCase()) +
        '</text></svg>'
    );
  }

  function resolveAsset(realHref, fallbackHref, generatedHref, existsFn) {
    if (realHref) {
      if (typeof existsFn === 'function') {
        if (existsFn(realHref)) {
          return { type: 'image', href: realHref, generatedHref: generatedHref };
        }
      }
      // Without an existence probe, never assume a real file is present.
    }
    if (fallbackHref && typeof existsFn === 'function' && existsFn(fallbackHref)) {
      return { type: 'fallback', href: fallbackHref, generatedHref: generatedHref };
    }
    return { type: 'generated', href: null, generatedHref: generatedHref };
  }

  function getPlayerImage(playerId, playerData) {
    var key = 'player:' + (playerId || (playerData && playerData.name) || 'unknown');
    if (cache[key]) return cache[key];
    var name = (playerData && playerData.name) || String(playerId || 'Jugador');
    var position = (playerData && playerData.position) || 'MID';
    var real = playerId ? IMG_ROOT + 'players/' + playerId + '.webp' : null;
    var fallback = IMG_ROOT + 'players/_fallback.svg';
    var generated = generatedPlayerSvg(name, position);
    var result = resolveAsset(real, fallback, generated);
    result.playerId = playerId || null;
    cache[key] = result;
    return result;
  }

  function getCompetitionLogo(competitionId, competitionData) {
    var key = 'comp:' + (competitionId || '');
    if (cache[key] && !competitionData) return cache[key];
    var comp = competitionData || null;
    if (!comp && NS._lastEngine && NS._lastEngine.world) {
      comp = NS._lastEngine.world.competitionsById[competitionId] || null;
    }
    var real = competitionId ? IMG_ROOT + 'competitions/' + competitionId + '.webp' : null;
    var fallback = IMG_ROOT + 'competitions/_fallback.svg';
    var generated = generatedCompetitionSvg(comp || { id: competitionId, shortName: 'CUP' });
    var result = resolveAsset(real, fallback, generated);
    result.competitionId = competitionId || null;
    cache[key] = result;
    return result;
  }

  function getAwardIcon(awardId, awardData) {
    var key = 'award:' + (awardId || '');
    if (cache[key] && !awardData) return cache[key];
    var award = awardData || null;
    if (!award && NS._lastEngine && NS._lastEngine.world) {
      award = (NS._lastEngine.world.awards || []).filter(function (a) {
        return a.id === awardId;
      })[0];
    }
    var real = awardId ? IMG_ROOT + 'awards/' + awardId + '.webp' : null;
    var fallback = IMG_ROOT + 'awards/_fallback.svg';
    var generated = generatedAwardSvg(award || { id: awardId, shortName: 'AW' });
    var result = resolveAsset(real, fallback, generated);
    result.awardId = awardId || null;
    cache[key] = result;
    return result;
  }

  function getClubBadge(clubId, clubData) {
    if (NS.Badges && NS.Badges.getClubBadge) {
      var badge = NS.Badges.getClubBadge(clubId, clubData);
      var local = clubId ? IMG_ROOT + 'clubs/' + clubId + '.webp' : null;
      return {
        type: badge.type,
        clubId: clubId,
        href: badge.href || local,
        generatedHref: badge.generatedHref,
        initials: badge.initials,
        colors: badge.colors,
        shape: badge.shape,
        localHref: local
      };
    }
    return {
      type: 'generated',
      clubId: clubId,
      href: null,
      generatedHref: generatedCompetitionSvg({ id: clubId, shortName: 'FC' })
    };
  }

  function resolveSrc(view, existsFn) {
    if (!view) return null;
    if (view.href && (typeof existsFn !== 'function' || existsFn(view.href))) return view.href;
    if (view.localHref && (typeof existsFn !== 'function' || existsFn(view.localHref))) {
      return view.localHref;
    }
    return view.generatedHref || null;
  }

  NS.Assets = {
    IMG_ROOT: IMG_ROOT,
    getPlayerImage: getPlayerImage,
    getClubBadge: getClubBadge,
    getCompetitionLogo: getCompetitionLogo,
    getAwardIcon: getAwardIcon,
    resolveSrc: resolveSrc
  };

  NS.getPlayerImage = getPlayerImage;
  NS.getClubBadge = function (clubId, clubData) {
    return getClubBadge(clubId, clubData);
  };
  NS.getCompetitionLogo = getCompetitionLogo;
  NS.getAwardIcon = getAwardIcon;
})(typeof globalThis !== 'undefined' ? globalThis : window);
