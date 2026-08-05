(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});

  var DATA_ROOT = 'assets/data/mi-carrera/';

  var FILE_MAP = {
    continents: 'world/continents.json',
    countries: 'world/countries.json',
    competitions: 'world/competitions.json',
    nationalTeams: 'world/national-teams.json',
    clubs: 'clubs/clubs_seed.json',
    archetypes: 'narrative/archetypes.json',
    decisions: 'narrative/decisions.json',
    events: 'narrative/events.json',
    retirementLines: 'narrative/retirement_lines.json',
    packs: 'manifests/packs.json'
  };

  function fetchJson(path) {
    return fetch(path, { credentials: 'same-origin' }).then(function (res) {
      if (!res.ok) throw new Error('No se pudo cargar ' + path);
      return res.json();
    });
  }

  function loadDataBundle(basePath) {
    var rootPath = basePath || DATA_ROOT;
    var keys = Object.keys(FILE_MAP);
    return Promise.all(
      keys.map(function (k) {
        return fetchJson(rootPath + FILE_MAP[k]).then(function (json) {
          return { key: k, json: json };
        });
      })
    ).then(function (parts) {
      var data = {};
      parts.forEach(function (p) {
        data[p.key] = p.json;
      });
      return data;
    });
  }

  function createEngineFromData(data) {
    var engine = NS.createEngine(data);
    NS._lastEngine = engine;
    return engine;
  }

  function boot(options) {
    var opts = options || {};
    return loadDataBundle(opts.dataRoot).then(function (data) {
      var engine = createEngineFromData(data);
      return { engine: engine, data: data, storage: NS.Storage, flags: NS.Flags, badges: NS.Badges };
    });
  }

  NS.DATA_ROOT = DATA_ROOT;
  NS.FILE_MAP = FILE_MAP;
  NS.loadDataBundle = loadDataBundle;
  NS.createEngineFromData = createEngineFromData;
  NS.boot = boot;
  NS.getCountryFlag = function (code) {
    return NS.Flags.getCountryFlag(code);
  };
  NS.getClubBadge = function (clubId, clubData) {
    return NS.Badges.getClubBadge(clubId, clubData);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
