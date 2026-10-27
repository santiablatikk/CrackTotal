'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const games=['pasalache.html','pasala-1v1.html','quiensabemas.html','mentiroso.html',
'top10.html','wordle-futbol.html','quien-soy.html','adivina-carrera.html',
'ordena-historia.html','conexiones.html'];
const others=['games.html','ranking.html','ranking-mentiroso.html','ranking-quiensabemas.html',
'ranking-top10.html','ranking-wordle.html','profile.html'];
const css=read('assets/css/ct74-unified.css');
assert(css.length>10000);
for(const rx of [/prefers-reduced-motion:\s*reduce/,/max-width:\s*380px/,/max-width:\s*600px/,
/\.ct7-clue\.is-hidden/,/data-ct7-mode="career"/,/\.ct7-tl-card/,/\.cx-tile\.is-selected/,
/\.ct-quiz-stage/,/\.ct-bluff-stage/,/\.wordle-card/,/\.arena-shell/,/\.ranking-container/])
  assert.match(css,rx);
assert.doesNotMatch(css,/#lettersContainer\s+\.letter\s*\.(?:correct|incorrect|pending)/);
assert.doesNotMatch(css,/\.tile\.(?:correct|present|absent)/);
for(const file of [...games,...others]){
 const html=read(file);
 assert.equal((html.match(/ct74-unified\.css/g)||[]).length,1,'Missing style '+file);
 assert.match(html,/<body\b[^>]*\bclass="[^"]*\bct74\b/i,'Scope missing '+file);
 assert(html.indexOf('ct74-unified.css')<html.toLowerCase().indexOf('</head>'),'Style outside head '+file);
 assert.match(html,/<script[^>]+src=/i,'Lost game engine '+file);
}
for(const file of ['quien-soy.html','adivina-carrera.html']){
 const html=read(file);
 for(const id of ['startView','playView','answerView','finishView','answerPortrait'])
  assert(html.includes('id="'+id+'"'),'Missing lifecycle '+id);
}
assert.match(read('assets/css/pasalache.css'),/#lettersContainer \.letter\.correct/);
assert.match(read('assets/js/services/progress/ranking-service.js'),/verifiedBy/);
console.log('PASS CT7.4: 10 games and seven navigation/profile screens; statuses and accessibility intact');
