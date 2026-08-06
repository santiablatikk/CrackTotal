/**
 * Seeded PRNG for Mi Carrera (deterministic).
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var Engine = (NS.Engine = NS.Engine || {});

  function mulberry32(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function createRng(seed) {
    var s = typeof seed === 'number' ? seed >>> 0 : hashString(String(seed || 'mi-carrera'));
    var next = mulberry32(s);
    return {
      seed: s,
      next: next,
      float: function (min, max) {
        return min + next() * (max - min);
      },
      int: function (min, maxInclusive) {
        return min + Math.floor(next() * (maxInclusive - min + 1));
      },
      chance: function (p) {
        return next() < p;
      },
      pick: function (arr) {
        if (!arr || !arr.length) return null;
        return arr[Math.floor(next() * arr.length)];
      },
      shuffle: function (arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
          var j = Math.floor(next() * (i + 1));
          var tmp = a[i];
          a[i] = a[j];
          a[j] = tmp;
        }
        return a;
      },
      weighted: function (items, weightFn) {
        var total = 0;
        var weights = [];
        for (var i = 0; i < items.length; i++) {
          var w = Math.max(0, weightFn(items[i], i));
          weights.push(w);
          total += w;
        }
        if (total <= 0) return this.pick(items);
        var r = next() * total;
        for (var j = 0; j < items.length; j++) {
          r -= weights[j];
          if (r <= 0) return items[j];
        }
        return items[items.length - 1];
      }
    };
  }

  Engine.createRng = createRng;
  Engine.hashString = hashString;
})(typeof globalThis !== 'undefined' ? globalThis : window);
