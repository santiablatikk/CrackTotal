'use strict';
// Quality gate: do not introduce additional exact duplicates while legacy
// duplicates are being replaced with separately sourced questions.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
function findDuplicates(items){
 const map=new Map();
 for(const item of items){
  const key=norm(item.question);
  assert(key,'Empty question in '+item.file);
  const entries=map.get(key)||[];entries.push(item);map.set(key,entries);
 }
 return [...map.entries()].filter(([_,v])=>v.length>1).map(([question,locations])=>({question,locations}));
}
const fallback=read('assets/data/preguntas_combinadas.json').flatMap(group=>
 group.preguntas.map((q,i)=>({question:q.pregunta,file:'preguntas_combinadas.json',index:group.letra+'/'+i})));
const qsm=Array.from({length:6},(_,i)=>{
 const level=i+1;
 return read('assets/data/level_'+level+'.json').preguntas.map((q,j)=>({question:q.pregunta,file:'level_'+level+'.json',index:j}));
}).flat();
const acceptedLegacyFallback=new Set([
 'cual es el club aleman del signal iduna park',
 'nombre del estadio del fc barcelona',
 'contiene s apellido del futbolista argentino 8 veces balon de oro'
]);
const acceptedLegacyQsm=new Set([
 'cuantas champions league consecutivas gano el real madrid entre 2016 2018',
 'en que ano river plate fue relegado a la primera b nacional',
 'que seleccion gano la primera eurocopa en 1960',
 'que seleccion gano la copa america 2019',
 'cuantos goles marco gerd muller en el mundial 1970'
]);
const fallbackDupe=findDuplicates(fallback);
const qsmDupe=findDuplicates(qsm);
for(const d of fallbackDupe)assert(acceptedLegacyFallback.has(d.question),'New duplicate in legacy Pasala: '+d.question);
for(const d of qsmDupe)assert(acceptedLegacyQsm.has(d.question),'New repeated QSM knowledge across levels: '+d.question);
assert(fallbackDupe.length<=3,'Legacy fallback repetition increased');
assert(qsmDupe.length<=5,'Cross-level QSM repetition increased');
assert(fallbackDupe.every(x=>x.locations.length===2),'Unexpected fallback repetition multiplicity');
assert(qsmDupe.every(x=>x.locations.length===2),'Unexpected QSM repetition multiplicity');
console.log('DUPLICATES 6.1: PASS ('+fallbackDupe.length+' grandfathered fallback pairs; '+
 qsmDupe.length+' grandfathered QSM cross-level pairs; no new exact duplicates).');
console.log('These pairs remain audit candidates, not yet independently fact-verified or resolved.');
