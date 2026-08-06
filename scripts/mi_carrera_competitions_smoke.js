/**
 * Competitions / awards / flags provider smoke for Mi Carrera Phase 1.
 * Run: node scripts/mi_carrera_competitions_smoke.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('OK:', msg);
  }
}

function loadScripts(rels) {
  const context = { globalThis: {}, console, process, require, module, __dirname, __filename };
  context.window = context.globalThis;
  vm.createContext(context);
  for (const rel of rels) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, context);
  }
  return context.globalThis.MiCarrera;
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function main() {
  console.log('Mi Carrera competitions / awards / flags smoke\n');

  const competitions = readJson('assets/data/mi-carrera/competitions.json');
  const awards = readJson('assets/data/mi-carrera/awards.json');
  const countries = readJson('assets/data/mi-carrera/countries.json');
  const logos = readJson('assets/data/mi-carrera/manifests/competition-logos.json');
  const trophies = readJson('assets/data/mi-carrera/manifests/trophy-images.json');
  const awardImages = readJson('assets/data/mi-carrera/manifests/award-images.json');

  assert(competitions.count >= 25, 'competitions >= 25');
  assert(awards.count >= 10, 'awards >= 10');

  const mustHave = [
    'uefa_cl',
    'uefa_el',
    'conmebol_libertadores',
    'conmebol_sudamericana',
    'fifa_world_cup',
    'conmebol_copa_america',
    'uefa_euro',
    'ballon_dor'
  ];
  const compIds = new Set(competitions.competitions.map((c) => c.id));
  const awardIds = new Set(awards.awards.map((a) => a.id));
  mustHave.forEach((id) => {
    assert(compIds.has(id) || awardIds.has(id), 'required id present: ' + id);
  });

  const ballon = awards.awards.find((a) => a.id === 'ballon_dor');
  assert(ballon && ballon.rarity === 'mythic', 'Balón de Oro is mythic');

  const rarities = new Set(competitions.competitions.map((c) => c.rarity));
  assert(rarities.has('legendary') || rarities.has('mythic'), 'has legendary/mythic competitions');

  const MC = loadScripts([
    'assets/js/games/mi-carrera/providers/flags.js',
    'assets/js/games/mi-carrera/providers/competitions.js',
    'assets/js/games/mi-carrera/providers/awards.js',
    'assets/js/games/mi-carrera/providers/trophies.js',
    'assets/js/games/mi-carrera/providers/clubs.js',
    'assets/js/games/mi-carrera/main.js'
  ]);

  MC.Providers.flags.loadCountries(countries.countries);
  MC.Providers.competitions.load(competitions, logos);
  MC.Providers.awards.load(awards, awardImages);
  MC.Providers.trophies.load(trophies, competitions);

  const arFlag = MC.Providers.flags.getCountryFlag('AR');
  assert(arFlag.status === 'real', 'Argentina flag real locally');
  assert(String(arFlag.src).includes('flags/ar.svg'), 'Argentina flag path local');

  const unknownFlag = MC.Providers.flags.getCountryFlag('ZZ');
  assert(unknownFlag.status === 'missing', 'unknown country flag missing');
  assert(unknownFlag.fallback && unknownFlag.fallback.type === 'code_tile', 'flag fallback honest');

  const clLogo = MC.Providers.competitions.getCompetitionLogo('uefa_cl');
  assert(clLogo.status === 'real' || clLogo.status === 'missing', 'CL logo status honest');
  if (clLogo.status !== 'real') assert(clLogo.fallback.honest === true, 'CL logo fallback honest');

  const trophy = MC.Providers.trophies.getTrophyImage('conmebol_libertadores');
  assert(trophy.status === 'real' || trophy.status === 'missing', 'Libertadores trophy status honest');

  const awardImg = MC.Providers.awards.getAwardImage('ballon_dor');
  assert(awardImg.status === 'real' || awardImg.status === 'missing', 'BdO image status honest');
  if (awardImg.status !== 'real') assert(awardImg.fallback.rarity === 'mythic', 'BdO fallback keeps rarity');

  // Bootstrap loader sync path
  process.chdir(ROOT);
  const data = MC.loadPhase1DataSync();
  assert(data.clubs.count >= 500, 'bootstrap loads clubs');
  assert(MC.Providers.clubs.count() === data.clubs.count, 'bootstrap wires clubs provider');

  const realFlags = countries.countries.filter((c) => c.flagStatus === 'real').length;
  assert(realFlags >= 40, 'many local flags available (' + realFlags + ')');

  if (failed) {
    console.error('\nFAILED:', failed);
    process.exit(1);
  }
  console.log('\nAll competition/award/flag checks passed.');
}

main();
