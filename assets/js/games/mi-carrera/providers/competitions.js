/**
 * Competition catalog + logo provider for Mi Carrera.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Providers = (NS.Providers = NS.Providers || {});

  var competitionsById = Object.create(null);
  var competitionsList = [];
  var logoManifest = { items: {} };

  Providers.competitions = {
    load: function (competitionsPayload, logosPayload) {
      competitionsById = Object.create(null);
      competitionsList = (competitionsPayload && competitionsPayload.competitions) || competitionsPayload || [];
      logoManifest = logosPayload || { items: {} };
      competitionsList.forEach(function (c) {
        if (c && c.id) competitionsById[c.id] = c;
      });
    },

    getAll: function () {
      return competitionsList.slice();
    },

    count: function () {
      return competitionsList.length;
    },

    getById: function (id) {
      return competitionsById[id] || null;
    },

    getByType: function (type) {
      return competitionsList.filter(function (c) {
        return c.type === type;
      });
    },

    getByRegion: function (region) {
      return competitionsList.filter(function (c) {
        return c.region === region;
      });
    },

    getCompetitionLogo: function (competitionId) {
      var competition = competitionsById[competitionId];
      var entry = (logoManifest.items && logoManifest.items[competitionId]) || null;

      if (entry && entry.status === 'real' && entry.src) {
        return {
          status: 'real',
          src: entry.src,
          license: entry.license || null
        };
      }

      return {
        status: 'missing',
        src: null,
        fallback: {
          type: 'competition_wordmark',
          label: (competition && (competition.shortName || competition.name)) || competitionId,
          rarity: (competition && competition.rarity) || 'normal',
          honest: true
        }
      };
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
