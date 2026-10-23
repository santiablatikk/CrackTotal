/**
 * Trophy image provider for Mi Carrera competitions.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Providers = (NS.Providers = NS.Providers || {});

  var trophyManifest = { items: {} };
  var competitionsById = Object.create(null);

  Providers.trophies = {
    load: function (trophyPayload, competitionsPayload) {
      trophyManifest = trophyPayload || { items: {} };
      competitionsById = Object.create(null);
      var list = (competitionsPayload && competitionsPayload.competitions) || competitionsPayload || [];
      list.forEach(function (c) {
        if (c && c.id) competitionsById[c.id] = c;
      });
    },

    getTrophyImage: function (competitionId) {
      var competition = competitionsById[competitionId];
      var entry = (trophyManifest.items && trophyManifest.items[competitionId]) || null;

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
          type: 'trophy_silhouette',
          label: (competition && (competition.shortName || competition.name)) || competitionId,
          rarity: (competition && competition.rarity) || 'normal',
          honest: true
        }
      };
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
