'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>JSON.parse(fs.readFileSync(path.join(__dirname,'..',p),'utf8'));
const pasala=read('assets/data/pasalache_2025.json');
const levels=Array.from({length:6},(_,i)=>read('assets/data/level_'+(i+1)+'.json'));
const top10=read('assets/data/top10_pool.json');
const excluded=/femenin|women'?s|Pajor|Ullevaal/i;
for(const [name,list] of [
 ['pasalache',pasala.flatMap(g=>g.preguntas)],
 ['top10',top10],
 ...levels.map((o,i)=>['level_'+(i+1),o.preguntas])
]){
 for(const entry of list){
   assert(!excluded.test(JSON.stringify(entry)),name+' has out-of-scope football content');
 }
}
const released=pasala.flatMap(g=>g.preguntas.map(q=>({...q,letra:g.letra})))
 .filter(q=>q.content_batch==='62-verified-20261024');
assert.equal(released.length,6,'Exactly six new sourced Pasala prompts expected');
const additions=levels.flatMap(o=>o.preguntas)
 .filter(q=>q.content_batch==='62-verified-20261024');
assert.equal(additions.length,12,'Exactly twelve new QSM prompts expected');
for(const q of [...released,...additions]){
 assert.match(q.source_url,/^https:\/\/(?:www\.fifa\.com|www\.uefa\.com)/);
 assert.equal(q.verified_at,'2026-10-24');
 assert.equal(q.audit_status,'verified_official');
 assert(q.pregunta.length>25 && q.respuesta.length>1);
}
for(const q of released) {
 assert(q.respuesta.toLocaleUpperCase('es').startsWith(q.letra));
}
for(const q of additions){
 assert.equal(Object.keys(q.opciones).length,4);
 assert.equal(new Set(Object.values(q.opciones)).size,4);
 assert.equal(q.opciones[q.respuesta_correcta],q.respuesta);
}
const normalized=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const keys=additions.map(q=>normalized(q.pregunta));
assert.equal(new Set(keys).size,keys.length);
const css=fs.readFileSync(path.join(__dirname,'../assets/css/pasalache.css'),'utf8');
for(const state of ['correct','incorrect','pending'])
 assert(css.includes('#lettersContainer .letter.'+state),'Pasala hotfix lost '+state+' fill');
console.log('PASS 6.2: 18 new sourced prompts, male-only question banks, choices and Pasala live fills');
