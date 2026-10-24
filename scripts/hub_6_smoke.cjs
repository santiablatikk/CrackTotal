'use strict';
// Structural safety checks for the editorial game-hub redesign.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'games.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/css/games-hub-6.css'),'utf8');
assert.match(html, /class="discover-page ct-ds ct6-game-hub"/);
assert.match(html, /assets\/css\/games-hub-6\.css/);
for(const id of ['playerNameDisplay','changeNameBtn','gameSearch','catalogEmptyState','catalogResultStatus','homeDailyTop10Title','homeDailyWordleStatus']) {
  assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,'Missing or duplicate id: '+id);
}
for(const dest of ['pasalache.html','pasala-1v1.html','top10.html','wordle-futbol.html','quiensabemas.html','mentiroso.html']){
  assert.ok(html.includes('href="'+dest+'"'),'Game missing from hub: '+dest);
}
const cardCount=(html.match(/class="home-game-card home-reveal/g)||[]).length;
assert.equal(cardCount,9,'Expect nine published game / game-mode cards, including three CT7 formats');
for (const dest of ['quien-soy.html','adivina-carrera.html','ordena-historia.html']) assert.ok(html.includes('href="'+dest+'"'),'CT7 game missing from catalogue: '+dest);
assert.match(css, /@media\(max-width:360px\)/,'Small-phone layout missing');
assert.match(css, /prefers-reduced-motion:reduce/,'Reduced-motion support missing');
assert(!/mi-carrera\.html|ct6-career-card/i.test(html),'Retired career game must not appear in the catalog');
console.log('PASS game hub: nine linked experiences, semantic hooks, responsive and motion rules');
