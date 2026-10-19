'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const html = read('index.html');
const css = read('assets/css/home-4.css');
const js = read('assets/js/home.js');
const catalog = read('games.html');
assert.match(html, /href="assets\/css\/home-4\.css\?v=20261019a"/);
assert.match(html, /class="ct4-hero"/);
assert.match(html, /class="ct4-arena /);
assert.match(html, /class="ct4-daily /);
assert.match(html, /class="ct4-catalog /);
assert.match(html, /class="home-footer ct4-footer"/);
assert(!html.includes('id="historias"'), 'Long-form articles belong on blog, not home');
assert(!html.includes('id="gameSearch"'), 'Full search belongs in game catalog');
assert(catalog.includes('id="gameSearch"'), 'Catalog search preserved');
for(const href of ['pasala-1v1.html','pasalache.html','top10.html','wordle-futbol.html','quiensabemas.html','mentiroso.html','games.html','ranking.html','logros.html','profile.html','privacy.html','cookies.html','terminos.html']){
  assert(html.includes('href="'+href+'"'), 'Missing essential link '+href);
}
for(const id of ['main-content','hero-title','juegos','catalog-title','desafios-diarios','ct35-daily-title','homeDailyTop10Title','homeDailyTop10Context','homeDailyTop10Status','homeDailyWordleStatus','homeDailyDate','homeNavMenu','homeMenuToggle']){
  assert(html.includes('id="'+id+'"'), 'Required homepage ID missing: '+id);
}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');
const main=html.indexOf('<main');
const footer=html.indexOf('<footer',main);
assert(main>0 && footer>main);
assert.equal((html.slice(main,footer).match(/<section\b/g)||[]).length,5,'Focused home must have five sections');
const five=[...html.matchAll(/class="ct4-game ct4-game--/g)];
assert.equal(five.length,5);
assert(html.includes('assets/js/home.js'), 'Daily progress and menu script preserved');
assert(js.includes("readSaved('top10_state_v1')"), 'Daily storage logic preserved');
assert(js.includes("readSaved('wordle_game_state_v1')"), 'Wordle daily storage logic preserved');
assert(css.includes('prefers-reduced-motion'), 'Reduced motion preserved');
assert(css.includes('@media(max-width:500px)'), 'Responsive mobile rules required');
assert(html.includes('VISTA ILUSTRATIVA'), 'Non-live Arena art must be marked illustrative');
assert.equal((html.match(/--x:/g) || []).length, 52, 'Two accurate 26-letter roscos are expected');
assert(!html.includes('00 : 00'), 'No fabricated live scores');
assert(html.includes('href="games.html#juegos"'), 'Header search must lead to the real catalog');
assert(!html.includes('mi-carrera.html'), 'No public Mi Carrera link');
console.log('Crack Total 4.0 home smoke PASS — five-game discovery, daily IDs, navigation, accessible page scaffolding');
