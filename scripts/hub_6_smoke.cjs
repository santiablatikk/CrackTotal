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
for(const dest of ['pasalache.html','pasala-1v1.html','top10.html','wordle-futbol.html','quiensabemas.html','mentiroso.html','mi-carrera.html']){
  assert.ok(html.includes('href="'+dest+'"'),'Game missing from hub: '+dest);
}
const cardCount=(html.match(/class="home-game-card home-reveal/g)||[]).length;
assert.equal(cardCount,7,'Expect seven live game / game-mode cards');
assert.match(css, /@media\(max-width:360px\)/,'Small-phone layout missing');
assert.match(css, /prefers-reduced-motion:reduce/,'Reduced-motion support missing');
console.log('PASS 6.0 game hub: seven linked experiences, semantic hooks, responsive and motion rules');
