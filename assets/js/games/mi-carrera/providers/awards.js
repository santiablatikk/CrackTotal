/**
 * Awards catalog + image provider for Mi Carrera.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Providers = (NS.Providers = NS.Providers || {});

  var awardsById = Object.create(null);
  var awardsList = [];
  var imageManifest = { items: {} };

  Providers.awards = {
    load: function (awardsPayload, imagesPayload) {
      awardsById = Object.create(null);
      awardsList = (awardsPayload && awardsPayload.awards) || awardsPayload || [];
      imageManifest = imagesPayload || { items: {} };
      awardsList.forEach(function (a) {
        if (a && a.id) awardsById[a.id] = a;
      });
    },

    getAll: function () {
      return awardsList.slice();
    },

    count: function () {
      return awardsList.length;
    },

    getById: function (id) {
      return awardsById[id] || null;
    },

    getByRarity: function (rarity) {
      return awardsList.filter(function (a) {
        return a.rarity === rarity;
      });
    },

    getAwardImage: function (awardId) {
      var award = awardsById[awardId];
      var entry = (imageManifest.items && imageManifest.items[awardId]) || null;

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
          type: 'award_mark',
          label: (award && (award.shortName || award.name)) || awardId,
          rarity: (award && award.rarity) || 'normal',
          honest: true
        }
      };
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
