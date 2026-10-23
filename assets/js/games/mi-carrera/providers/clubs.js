/**
 * Club catalog + badge provider for Mi Carrera.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Providers = (NS.Providers = NS.Providers || {});

  var clubsById = Object.create(null);
  var clubsList = [];
  var leaguesById = Object.create(null);
  var badgeManifest = { badges: {} };

  var TIER_LABELS = {
    7: 'Gigante mundial',
    6: 'Gigante',
    5: 'Grande',
    4: 'Proyecto fuerte',
    3: 'Competitivo',
    2: 'Modesto',
    1: 'Formador'
  };

  function tierLabel(tier, tags) {
    tags = tags || [];
    if (tags.indexOf('youth_factory') !== -1 && Number(tier) <= 4) return 'Club formador';
    if (tags.indexOf('world_class') !== -1) return 'Gigante mundial';
    return TIER_LABELS[Number(tier)] || 'Club';
  }

  Providers.clubs = {
    load: function (clubsPayload, leaguesPayload, badgesPayload) {
      clubsById = Object.create(null);
      leaguesById = Object.create(null);
      clubsList = (clubsPayload && clubsPayload.clubs) || clubsPayload || [];
      var leagues = (leaguesPayload && leaguesPayload.leagues) || leaguesPayload || [];
      badgeManifest = badgesPayload || { badges: {} };

      leagues.forEach(function (l) {
        if (l && l.id) leaguesById[l.id] = l;
      });
      clubsList.forEach(function (c) {
        if (c && c.id) clubsById[c.id] = c;
      });
    },

    getAll: function () {
      return clubsList.slice();
    },

    count: function () {
      return clubsList.length;
    },

    getById: function (id) {
      return clubsById[id] || null;
    },

    getLeague: function (leagueId) {
      return leaguesById[leagueId] || null;
    },

    getByCountry: function (countryCode) {
      var cc = String(countryCode || '').toUpperCase();
      return clubsList.filter(function (c) {
        return c.countryCode === cc;
      });
    },

    getByContinent: function (continent) {
      var cont = String(continent || '').toUpperCase();
      return clubsList.filter(function (c) {
        return c.continent === cont;
      });
    },

    getByLeague: function (leagueId) {
      return clubsList.filter(function (c) {
        return c.leagueId === leagueId;
      });
    },

    getTierLabel: function (club) {
      if (!club) return 'Club';
      return tierLabel(club.tier, club.tags);
    },

    getClubBadge: function (clubId) {
      var club = clubsById[clubId];
      var entry = (badgeManifest.badges && badgeManifest.badges[clubId]) || null;

      if (entry && entry.status === 'real' && entry.src) {
        return {
          status: 'real',
          src: entry.src,
          license: entry.license || null,
          source: entry.source || null
        };
      }

      if (entry && entry.status === 'generated' && entry.src) {
        return {
          status: 'generated',
          src: entry.src,
          license: entry.license || 'local-generated',
          source: entry.source || 'local-generated',
          honest: true
        };
      }

      return {
        status: entry && entry.status === 'fallback' ? 'fallback' : 'missing',
        src: null,
        fallback: {
          type: 'color_tile',
          primaryColor: (club && club.primaryColor) || (entry && entry.fallback && entry.fallback.primaryColor) || '#1f2937',
          secondaryColor: (club && club.secondaryColor) || (entry && entry.fallback && entry.fallback.secondaryColor) || '#9ca3af',
          label: (club && club.shortName) || (entry && entry.fallback && entry.fallback.label) || clubId || '?',
          honest: true
        }
      };
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
