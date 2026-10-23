'use strict';
/* 5.0 regression contract: typography, accessible palette, and unaffected game hooks.
 * Passing this is NOT visual-browser QA and does not claim WCAG certification.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const pages=['index.html','games.html','top10.html','pasalache.html',
 'wordle-futbol.html','quiensabemas.html','mentiroso.html',
 'ranking.html','profile.html','logros.html','blog.html'];
const tokens=read('assets/css/design-system/tokens.css');
assert(tokens.includes('family=Manrope'), 'Manrope font must load through canonical design tokens');
assert(tokens.includes('Space+Grotesk'), 'Display font must load alongside readable UI type');
for(const [name,value] of [['--ct-bg:','#101b1b'],['--ct-surface-strong:','#243b35'],
 ['--ct-text:','#f4f2e9'],['--ct-primary:','#b5eb53'],['--ct-accent:','#d89b70']]){
 assert(tokens.includes(name+' '+value+';'), name+' canonical palette mismatch');
}
assert(tokens.includes('--ct-font-sans: "Manrope"'));
assert(tokens.includes('--ct-font-display: "Space Grotesk"'));
const bridge=read('assets/css/design-system/bridges.css');
assert(bridge.includes('body.ct-ds :is(h1,h2,h3,h4,h5,h6)'));
assert(bridge.includes('body.ct-ds :is(button,input,select,textarea)'));
for(const page of pages){
 const html=read(page);
 assert(html.includes('design-system/index.css?v=20261020v5'),page+' lacks 5.0 design system revision');
 assert(html.includes('ct-ds'),page+' lost design tokens class');
 assert(!html.includes('family=Montserrat'),page+' still downloads retired Montserrat');
 assert(!html.includes('family=Oswald'),page+' still downloads condensed Oswald');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length,page+' duplicated HTML IDs');
}
const arena=read('pasala-1v1.html'),arenaCss=read('assets/css/pasala-duel.css');
assert(arena.includes('pasala-duel.css?v=20261023-mobile-qa2'));
assert(arenaCss.includes('family=Manrope')&&arenaCss.includes('Space+Grotesk'));
assert(!arenaCss.includes('Barlow Condensed'));
assert(!arenaCss.includes('DM Sans'));
const home=read('assets/css/home-4.css');
assert(home.includes('Space Grotesk'));
assert(!home.includes('Oswald'));
assert(read('index.html').includes('home-4.css?v=20261020v5'));
for(const p of ['assets/css/top10.css','assets/css/wordle.css','assets/css/pasalache.css']){
 const css=read(p);
 assert(!css.includes('Oswald'), p+' still requires condensed font');
 assert(css.includes('@media'),p+' must have responsive rules');
}
const pasala=read('assets/css/pasalache.css');
assert(pasala.includes('body.game-body .question-card{position:relative;order:1'),
 'Individual mobile question must be placed in a separate full-width reading panel');
assert(pasala.includes('body.game-body .letters-container{position:relative;flex:none'),
 'Mobile ring coordinates must stay scoped to their parent');
assert(read('top10.html').includes('id="top10GameCard"'));
assert(read('wordle-futbol.html').match(/game-shell\.css/g).length===1);
assert(read('mentiroso.html').match(/game-shell\.css/g).length===1);
assert(read('blog.html').includes('href="#main-content">Explorar artículos</a>'));
function linear(c){const v=parseInt(c,16)/255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)}
function lum(hex){const c=hex.replace('#','');return [.2126,.7152,.0722].reduce((s,w,i)=>s+w*linear(c.slice(i*2,i*2+2)),0)}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
for(const [text,bg] of [['#f4f2e9','#101b1b'],['#c7d2c8','#101b1b'],
 ['#b5eb53','#101b1b'],['#243b35','#f4f2e9']]){
 assert(contrast(text,bg)>=4.5, 'Normal text palette has insufficient contrast '+text+'/'+bg);
}
console.log('Crack Total 5.0 visual-contract smoke PASS — 11 DS pages, 1 standalone arena, typography, 4 palette contrast pairs, game IDs');
