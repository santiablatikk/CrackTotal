/**
 * Mi Carrera data bootstrap (Phase 1).
 * Loads local datasets into providers. Career engine lives under engine/.
 */
(function (root) {
  'use strict';

  var NS = (root.MiCarrera = root.MiCarrera || {});
  var DATA_ROOT = 'assets/data/mi-carrera/';

  function getFs() {
    try {
      return typeof require === 'function' ? require('fs') : null;
    } catch (e) {
      return null;
    }
  }

  function getPath() {
    try {
      return typeof require === 'function' ? require('path') : null;
    } catch (e) {
      return null;
    }
  }

  function readJsonNode(rel) {
    var fs = getFs();
    var path = getPath();
    if (!fs || !path) return null;
    var full = path.join(process.cwd(), rel.replace(/\//g, path.sep));
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  }

  function readJsonBrowser(rel) {
    return fetch(rel).then(function (res) {
      if (!res.ok) throw new Error('No se pudo cargar ' + rel);
      return res.json();
    });
  }

  function loadAllSync() {
    var countries = readJsonNode(DATA_ROOT + 'countries.json');
    var leagues = readJsonNode(DATA_ROOT + 'leagues.json');
    var clubs = readJsonNode(DATA_ROOT + 'clubs.json');
    var competitions = readJsonNode(DATA_ROOT + 'competitions.json');
    var awards = readJsonNode(DATA_ROOT + 'awards.json');
    var profiles = readJsonNode(DATA_ROOT + 'profiles.json');
    var clubBadges = readJsonNode(DATA_ROOT + 'manifests/club-badges.json');
    var competitionLogos = readJsonNode(DATA_ROOT + 'manifests/competition-logos.json');
    var trophyImages = readJsonNode(DATA_ROOT + 'manifests/trophy-images.json');
    var awardImages = readJsonNode(DATA_ROOT + 'manifests/award-images.json');

    if (!countries || !clubs || !competitions || !awards) {
      throw new Error('Mi Carrera Phase 1: datasets incompletos');
    }

    NS.Providers.flags.loadCountries(countries.countries);
    NS.Providers.clubs.load(clubs, leagues, clubBadges);
    NS.Providers.competitions.load(competitions, competitionLogos);
    NS.Providers.awards.load(awards, awardImages);
    NS.Providers.trophies.load(trophyImages, competitions);
    NS.data = {
      countries: countries,
      leagues: leagues,
      clubs: clubs,
      competitions: competitions,
      awards: awards,
      profiles: profiles,
      manifests: {
        clubBadges: clubBadges,
        competitionLogos: competitionLogos,
        trophyImages: trophyImages,
        awardImages: awardImages
      }
    };
    NS.ready = true;
    return NS.data;
  }

  function loadAll() {
    var fs = getFs();
    if (fs) {
      return Promise.resolve(loadAllSync());
    }

    return Promise.all([
      readJsonBrowser(DATA_ROOT + 'countries.json'),
      readJsonBrowser(DATA_ROOT + 'leagues.json'),
      readJsonBrowser(DATA_ROOT + 'clubs.json'),
      readJsonBrowser(DATA_ROOT + 'competitions.json'),
      readJsonBrowser(DATA_ROOT + 'awards.json'),
      readJsonBrowser(DATA_ROOT + 'profiles.json'),
      readJsonBrowser(DATA_ROOT + 'manifests/club-badges.json'),
      readJsonBrowser(DATA_ROOT + 'manifests/competition-logos.json'),
      readJsonBrowser(DATA_ROOT + 'manifests/trophy-images.json'),
      readJsonBrowser(DATA_ROOT + 'manifests/award-images.json')
    ]).then(function (all) {
      var countries = all[0];
      var leagues = all[1];
      var clubs = all[2];
      var competitions = all[3];
      var awards = all[4];
      var profiles = all[5];
      var clubBadges = all[6];
      var competitionLogos = all[7];
      var trophyImages = all[8];
      var awardImages = all[9];

      NS.Providers.flags.loadCountries(countries.countries);
      NS.Providers.clubs.load(clubs, leagues, clubBadges);
      NS.Providers.competitions.load(competitions, competitionLogos);
      NS.Providers.awards.load(awards, awardImages);
      NS.Providers.trophies.load(trophyImages, competitions);
      NS.data = {
        countries: countries,
        leagues: leagues,
        clubs: clubs,
        competitions: competitions,
        awards: awards,
        profiles: profiles,
        manifests: {
          clubBadges: clubBadges,
          competitionLogos: competitionLogos,
          trophyImages: trophyImages,
          awardImages: awardImages
        }
      };
      NS.ready = true;
      return NS.data;
    });
  }

  NS.loadPhase1Data = loadAll;
  NS.loadPhase1DataSync = loadAllSync;
})(typeof globalThis !== 'undefined' ? globalThis : window);
