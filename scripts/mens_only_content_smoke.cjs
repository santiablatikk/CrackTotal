'use strict';
/**
 * Crack Total 6.1 content gate: no women's football game questions/challenges.
 * Editorial policy for this version. Does not judge the sport or its participants.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const banks=[
 'assets/data/pasalache_2025.json',
 'assets/data/preguntas_combinadas.json',
 ...Array.from({length:6},(_,i)=>'assets/data/level_'+(i+1)+'.json'),
 'assets/data/top10_pool.json',
 'assets/data/top10_pool_extended.json',
 'assets/data/top10_verified_v2.json',
 'assets/data/wordle_pool.json',
 'assets/data/mentiroso_objective_pilot.json',
 'docs/football-facts-2026-10-19.json',
 'docs/audit/content-61-ledger.json'
];
// Avoid false positives from 'mujeres' inside an unrelated webpage footer by
// limiting the scan to actual football game banks and their provenance registry.
const pattern=/\bfemenin[ao]s?\b|\bmujer(?:es)?\b|\bwomen(?:'s)?\b|\bwoman\b|\bladies\b|\bfemale\b|\buwcl\b|\bwsl\b|\bgirls\b|\blionesses\b|\bfemeni\b|\bbonmat[ií]\b|\bputellas\b|\bblackstenius\b|\bcarmona\b|\bpajor\b|\brapinoe\b|\balex morgan\b|\bsam kerr\b/i;
let inspected=0;
for(const file of banks){
 const obj=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
 const recurse=(value,location)=>{
  if(typeof value==='string'){
   if(pattern.test(value))throw new Error(file+' '+location+' contains excluded content: '+value.slice(0,120));
  }else if(Array.isArray(value)){
   value.forEach((v,i)=>recurse(v,location+'['+i+']'));
  }else if(value && typeof value==='object'){
   Object.entries(value).forEach(([k,v])=>recurse(v,location+'.'+k));
  }
 };
 recurse(obj,'$');inspected++;
}
const bank=require('../assets/data/pasalache_2025.json');
const qsm=[1,2,3,4,5,6].map(i=>require('../assets/data/level_'+i+'.json').preguntas);
assert.equal(bank.reduce((s,g)=>s+g.preguntas.length,0),293);
assert.equal(qsm.reduce((s,g)=>s+g.length,0),373);
assert.equal(require('../assets/data/top10_pool.json').length,11);
console.log('MEN-ONLY GAME CONTENT: PASS ('+inspected+' files; zero excluded women's-football records).');
