'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const bank=JSON.parse(read('assets/data/identidad-futbolera.json'));
assert.equal(bank.jugadores.length,32);
assert.equal(bank.modo,'solo masculino');
const normalized=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const ids=new Set(), aliases=new Set();
let careers=0;
for(const row of bank.jugadores){
 assert.match(row.id,/^[a-z0-9-]+$/);
 assert(!ids.has(row.id),'Duplicate player id '+row.id);ids.add(row.id);
 assert(Array.isArray(row.aliases)&&row.aliases.length>0);
 assert(Array.isArray(row.pistas)&&row.pistas.length===4);
 assert(Array.isArray(row.clubes)&&row.clubes.length>=1);
 if(row.clubes.length>1)careers++;
 assert.match(row.fuente,/^https:\/\/(?:www\.fifa\.com|inside\.fifa\.com|www\.uefa\.com)\//);
 assert.equal(row.verificado,'2026-10-24');
 assert(!/femenin|women|female/i.test(JSON.stringify(row)));
 for(const alias of row.aliases) {
   const key=normalized(alias);
   assert(key.length>=4);
   assert(!aliases.has(key),'Ambiguous shared alias '+key);
   aliases.add(key);
 }
}
assert(careers>=28);
for(const mode of ['pistas','carrera']){
 const html=read('identidad-futbolera.html');
 assert(html.includes('modo='+mode));
 assert(html.includes('id="idPlay"')&&html.includes('id="idFinish"'));
 assert(html.includes('services/progress/progress-service.js'));
 assert(html.includes('assets/js/identidad-futbolera.js'));
}
const css=read('assets/css/identidad-futbolera.css');
assert.match(css,/@media\(max-width:380px\)/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(css,/:focus-visible/);
const game=read('assets/js/identidad-futbolera.js');assert.doesNotThrow(()=>new Function(game));
assert(game.includes('window.CrackTotalProgress'));
assert(!game.includes('RankingService'));
const missionJS=read('assets/js/missions-63.js');
assert.doesNotThrow(()=>new Function(missionJS));
const context={window:{},Date,Number,Math,Set,String,Array,Object};vm.runInNewContext(missionJS,context);
const now=new Date('2026-10-24T12:00:00Z');
const snap={history:{matches:[
 {at:'2026-10-24T09:00:00Z',gameId:'quien-soy',result:'victory',correctAnswers:5},
 {at:'2026-10-24T10:00:00Z',gameId:'trayectoria',result:'victory',correctAnswers:4},
 {at:'2026-10-23T12:00:00Z',gameId:'pasalache',result:'defeat',correctAnswers:1},
 {at:'2026-10-22T12:00:00Z',gameId:'top10',result:'victory',correctAnswers:4},
 {at:'2026-10-15T12:00:00Z',gameId:'top10',result:'victory',correctAnswers:200},
 {at:'2026-10-25T09:00:00Z',gameId:'mentiroso',result:'victory',correctAnswers:200}
]}};
const list=context.window.CrackTotalMissions.evaluate(snap,now);
const byId=Object.fromEntries(list.map(m=>[m.id,m]));
assert.equal(byId['d-play'].raw,2);
assert.equal(byId['d-answers'].raw,9);
assert.equal(byId['d-win'].raw,2);
assert.equal(byId['w-play'].raw,4);
assert.equal(byId['w-win'].raw,3);
assert.equal(byId['w-variety'].raw,4);
assert.equal(list.filter(x=>x.done).length,5);
const profile=read('profile.html');
assert(profile.includes('assets/js/missions-63.js'));
assert(profile.includes('assets/css/missions-63.css'));
assert(read('assets/js/profile-gamification.js').includes('CrackTotalMissions.mount'));
const hub=read('games.html');
assert(hub.includes('identidad-futbolera.html?modo=pistas'));
assert(hub.includes('identidad-futbolera.html?modo=carrera'));
console.log('6.3 PASS: 32 sourced identities, 28 club paths, alias uniqueness, two working mode contracts and six local missions.');
