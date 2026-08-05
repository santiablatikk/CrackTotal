(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  function hashSeed(input) {
    var str = String(input == null ? 0 : input);
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function CareerRandomizer(seed) {
    var numeric = typeof seed === 'number' ? (seed >>> 0) : hashSeed(seed);
    if (numeric === 0) numeric = 1;
    this._seed = numeric;
    this._next = mulberry32(numeric);
    this._calls = 0;
  }

  CareerRandomizer.hashSeed = hashSeed;

  CareerRandomizer.prototype.nextFloat = function () {
    this._calls += 1;
    return this._next();
  };

  CareerRandomizer.prototype.next = function () {
    return this.nextFloat();
  };

  CareerRandomizer.prototype.int = function (min, maxInclusive) {
    var lo = Math.ceil(min);
    var hi = Math.floor(maxInclusive);
    if (hi < lo) {
      var tmp = lo;
      lo = hi;
      hi = tmp;
    }
    return lo + Math.floor(this.nextFloat() * (hi - lo + 1));
  };

  CareerRandomizer.prototype.range = function (min, max) {
    return min + (max - min) * this.nextFloat();
  };

  CareerRandomizer.prototype.bool = function (probability) {
    var p = probability == null ? 0.5 : probability;
    return this.nextFloat() < p;
  };

  CareerRandomizer.prototype.pick = function (arr) {
    if (!arr || !arr.length) return null;
    return arr[this.int(0, arr.length - 1)];
  };

  CareerRandomizer.prototype.shuffle = function (arr) {
    var out = arr.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = this.int(0, i);
      var t = out[i];
      out[i] = out[j];
      out[j] = t;
    }
    return out;
  };

  CareerRandomizer.prototype.weightedPick = function (items, weightFn) {
    if (!items || !items.length) return null;
    var weights = [];
    var total = 0;
    for (var i = 0; i < items.length; i++) {
      var w = weightFn ? weightFn(items[i], i) : items[i].weight != null ? items[i].weight : 1;
      w = Math.max(0, Number(w) || 0);
      weights.push(w);
      total += w;
    }
    if (total <= 0) return this.pick(items);
    var roll = this.nextFloat() * total;
    var acc = 0;
    for (var j = 0; j < items.length; j++) {
      acc += weights[j];
      if (roll <= acc) return items[j];
    }
    return items[items.length - 1];
  };

  CareerRandomizer.prototype.fork = function (salt) {
    return new CareerRandomizer(hashSeed(String(this._seed) + ':' + String(salt) + ':' + this._calls));
  };

  CareerRandomizer.prototype.getSeed = function () {
    return this._seed;
  };

  NS.Randomizer = CareerRandomizer;
})(typeof globalThis !== 'undefined' ? globalThis : window);
