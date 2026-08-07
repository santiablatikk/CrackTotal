/**
 * Responsive / scene structure guards (static + CSS).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT } = require('./_load_mi_carrera_ui');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

console.log('Mi Carrera responsive smoke\n');

const css = fs.readFileSync(path.join(ROOT, 'assets/css/mi-carrera.css'), 'utf8');
assert(css.indexOf('@media (max-width: 900px)') !== -1, 'tablet/mobile breakpoint');
assert(css.indexOf('@media (max-width: 520px)') !== -1, 'small mobile breakpoint');
assert(css.indexOf('prefers-reduced-motion') !== -1, 'reduced motion respected');
assert(css.indexOf('overflow-x') === -1 || css.indexOf('mc-shell') !== -1, 'shell present');

const screens = fs.readFileSync(path.join(ROOT, 'assets/js/games/mi-carrera/ui/screens.js'), 'utf8');
assert(screens.indexOf('WORLD_GIANT') === -1, 'UI does not hardcode club bands as content rules');
assert((screens.match(/Real Madrid|Man City|Barcelona FC/g) || []).length === 0, 'no hardcoded mega-club list');

const app = fs.readFileSync(path.join(ROOT, 'assets/js/games/mi-carrera/ui/app.js'), 'utf8');
assert(app.indexOf('playSeason') !== -1, 'uses engine playSeason');
assert(app.indexOf('simulateSeasonStats') === -1, 'UI does not call internal sim helpers');

const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const games = fs.readFileSync(path.join(ROOT, 'games.html'), 'utf8');
assert(index.indexOf('mi-carrera.html') !== -1, 'index links Mi Carrera');
assert(games.indexOf('mi-carrera.html') !== -1, 'games links Mi Carrera');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nResponsive smoke passed.');
