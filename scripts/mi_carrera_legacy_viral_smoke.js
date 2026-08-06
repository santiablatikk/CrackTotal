#!/usr/bin/env node
'use strict';

/**
 * Legacy / viral phrase / eligibility smoke.
 * Run: node scripts/mi_carrera_legacy_viral_smoke.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'assets', 'data', 'mi-carrera');
const JS_ROOT = path.join(ROOT, 'assets', 'js', 'games', 'mi-carrera');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log('  OK  ' + msg);
  } else {
    failed += 1;
    console.error('  FAIL  ' + msg);
  }
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8'));
}

function loadMC() {
  const sandbox = {
    console: console,
    globalThis: null,
    document: {
      createElement: function () {
        return { style: {}, setAttribute: function () {} };
      },
      body: { appendChild: function () {} }
    },
    navigator: {},
    localStorage: {
      _s: {},
      getItem: function (k) {
        return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null;
      },
      setItem: function (k, v) {
        this._s[k] = String(v);
      },
      removeItem: function (k) {
        delete this._s[k];
      }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  [
    'engine/career-randomizer.js',
    'engine/career-state.js',
    'engine/career-rules.js',
    'engine/career-events.js',
    'engine/career-decisions.js',
    'engine/career-competitions.js',
    'engine/career-awards.js',
    'engine/career-records.js',
    'engine/career-moments.js',
    'engine/career-scoring.js',
    'engine/career-engine.js',
    'persistence/career-storage.js',
    'providers/flags.js',
    'providers/badges.js',
    'providers/assets.js',
    'ui/format.js',
    'ui/components.js',
    'ui/career-narrative.js',
    'ui/career-card.js',
    'ui/career-share.js',
    'ui/career-rewards.js',
    'ui/career-legacy.js',
    'ui/screens.js',
    'main.js'
  ].forEach(function (rel) {
    const full = path.join(JS_ROOT, rel);
    if (!fs.existsSync(full)) return;
    vm.runInContext(fs.readFileSync(full, 'utf8'), context, { filename: rel });
  });
  return context.MiCarrera;
}

function loadData() {
  return {
    continents: readJson('world/continents.json'),
    countries: readJson('world/countries.json'),
    competitions: readJson('world/competitions.json'),
    nationalTeams: readJson('world/national-teams.json'),
    clubs: readJson('clubs/clubs_seed.json'),
    archetypes: readJson('narrative/archetypes.json'),
    decisions: readJson('narrative/decisions.json'),
    events: readJson('narrative/events.json'),
    retirementLines: readJson('narrative/retirement_lines.json'),
    awards: readJson('narrative/awards.json')
  };
}

console.log('Mi Carrera legacy / viral smoke\n');
const MC = loadMC();
const data = loadData();
const engine = MC.createEngine(data);
MC._lastEngine = engine;

assert(typeof MC.Rules.careerStoryPhrase === 'function', 'careerStoryPhrase exists');
assert(typeof MC.Rules.transferConsequence === 'function', 'transferConsequence exists');
assert(typeof MC.Rules.stayConsequence === 'function', 'stayConsequence exists');
assert(MC.Rules.archetypeLabel('ONE_CLUB_LEGEND').indexOf('ÍDOLO') !== -1, 'archetype labels ES');

const young = engine.createCareer({
  name: 'Kid',
  countryId: 'country_ar',
  position: 'FWD',
  archetypeId: 'arch_physical',
  age: 16,
  seed: 12
});
young.rating = 62;
young.potential = 84;
young.reputation = 15;
const madrid = (data.clubs || []).filter(function (c) {
  return /madrid/i.test(c.name || '') || /madrid/i.test(c.shortName || '');
})[0] || (data.clubs || []).filter(function (c) {
  return c.level >= 5 && c.continentId === 'continent_eu';
})[0];
assert(!!madrid, 'found elite EU club');
assert(
  MC.Rules.isEligibleForClub(young, madrid, engine.world) === false,
  '16yo low OVR not eligible for elite EU'
);

const sit = MC.Rules.seasonSituation(young, engine.world);
assert(sit.objective && sit.valueLabel && sit.roleLabel, 'preseason situation has objective/value/role');

const preHtml = MC.UI.screens.preSeason({ state: young, engine: engine });
assert(preHtml.indexOf('Objetivo') !== -1, 'preseason UI shows objetivo');
assert(preHtml.indexOf('Rol') !== -1, 'preseason UI shows rol');

engine.autoPlayUntilRetired(young, 22);
if (!young.retired) engine.forceRetire(young, 'voluntary');
const phrase = MC.Rules.careerStoryPhrase(young, engine.world);
assert(phrase && phrase.length > 8, 'story phrase generated');
const card = MC.UI.CareerCardRenderer.render(young, engine);
assert(card.viewModel.storyPhrase, 'card has storyPhrase');
assert(card.viewModel.emergentLabel, 'card has emergentLabel');
assert(card.html.indexOf('mc-career-card__story') !== -1, 'card renders story');

const retire = MC.UI.screens.retire({ state: young, engine: engine, reward: null });
assert(retire.indexOf('Nueva carrera') !== -1, 'retire CTA');
assert(retire.indexOf(card.viewModel.emergentLabel) !== -1 || retire.indexOf('legado') !== -1, 'retire shows archetype/story');

const badge = MC.getClubBadge(young.clubId, engine.getClub(young.clubId));
const src = MC.Badges.resolveBadgeSrc(badge);
assert(badge.status !== 'real' || !!src, 'badge pipeline resolves');
assert(badge.isOfficialCrest !== true || badge.status === 'real', 'generated never marked official');

let ballons = 0;
for (let i = 0; i < 200; i++) {
  const s = engine.createCareer({
    name: 'B' + i,
    countryId: 'country_br',
    position: 'MID',
    archetypeId: 'arch_tech_promise',
    age: 17,
    seed: 5000 + i
  });
  engine.autoPlayUntilRetired(s, 28);
  if (!s.retired) engine.forceRetire(s, 'age_decline');
  const n = MC.Awards.countAwards(s, 'award_ballon_dor');
  if (n) ballons += 1;
}
assert(ballons <= 25, 'ballon rare in 200 careers (' + ballons + ')');

console.log('\nPassed: ' + passed + '  Failed: ' + failed);
if (failed) process.exit(1);
