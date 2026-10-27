'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const svc=read('assets/js/services/progress/ranking-service.js');
const hub=read('assets/js/services/hub-service.js');
const rules=read('firestore.rules');
assert.doesNotMatch(svc,/assets\/data\/rankings|injectLocalPlayer/);
assert.match(hub,/if \(key === 'userRanking'\) \{[\s\S]{0,300}RankingService/);
assert.match(rules,/match \/leaderboard_scopes\/\{scope\}\/entries\/\{playerId\}/);
assert.match(rules,/allow write: if false/);
for(const page of ['ranking.html','ranking-mentiroso.html','ranking-quiensabemas.html','ranking-top10.html','ranking-wordle.html']){
  assert.match(read(page),/services\/progress\/ranking-service\.js/);
}
const data=[
 {id:'a',data:()=>({playerId:'a',name:'Ana',score:20,verified:true,verifiedBy:'server',schemaVersion:1,victories:2})},
 {id:'fake',data:()=>({playerId:'fake',name:'False',score:90000,verified:false,verifiedBy:'browser',schemaVersion:1})},
 {id:'b',data:()=>({playerId:'b',name:'Beto',score:50,verified:true,verifiedBy:'server',schemaVersion:1,victories:1})}
];
let callback;let cleaned=false;const snapshot=()=>({forEach:fn=>data.forEach(fn)});
const queryOps=[];
const query={
 where:(field,op,val)=>{queryOps.push(['where',field,op,val]);return query;},
 orderBy:(field,dir)=>{queryOps.push(['orderBy',field,dir]);return query;},
 limit:n=>{queryOps.push(['limit',n]);return {
   get:async()=>snapshot(),
   onSnapshot:fn=>{callback=fn;return ()=>{cleaned=true;}}
 }}
};
const fakeDb={collection:root=>{
 assert.equal(root,'leaderboard_scopes');
 return {doc:scope=>{
   assert.equal(scope,'global');
   return {collection:child=>{assert.equal(child,'entries');return query;}};
 }};
}};
const window={db:fakeDb,CrackTotalServices:{}};
vm.runInNewContext(svc,{window,Date,Promise,Number,String,Array,Object,Error,TypeError});
const ranking=window.CrackTotalServices.RankingService;
const updates=[];const stop=ranking.subscribe('global',v=>updates.push(JSON.parse(JSON.stringify(v))),10);
callback(snapshot());
assert.deepEqual(queryOps.slice(0,7),[
 ['where','verified','==',true],
 ['where','verifiedBy','==','server'],
 ['where','schemaVersion','==',1],
 ['orderBy','score','desc'],
 ['orderBy','victories','desc'],
 ['orderBy','playerId','asc'],
 ['limit',10]
],'Verified filters must run before the score-limit and tie-breaking belongs to Firestore');
assert.deepEqual(updates[0].items.map(v=>v.name),['Beto','Ana']);
assert.equal(updates[0].source,'verified-firestore');
data[0]={id:'a',data:()=>({playerId:'a',name:'Ana',score:75,verified:true,verifiedBy:'server',schemaVersion:1,victories:2})};
callback(snapshot());
assert.deepEqual(updates[1].items.map(v=>v.name),['Ana','Beto']);
data.push({id:'c',data:()=>({playerId:'c',name:'Carlos',score:75,verified:true,
 verifiedBy:'server',schemaVersion:1,victories:7})});
callback(snapshot());
assert.deepEqual(updates[2].items.map(v=>v.playerId),['c','a','b'],
 'Equal-score players must be sorted by victories then stable ID');
// Corrupt or untrusted-looking leaderboard documents must fail closed.
data.push({id:'bad-number',data:()=>({playerId:'bad-number',name:'Corrupt',
 score:999999,verified:true,verifiedBy:'server',schemaVersion:1,
 gamesPlayed:Infinity,victories:0})});
data.push({id:'bad-name',data:()=>({playerId:'bad-name',name:'   ',
 score:999999,verified:true,verifiedBy:'server',schemaVersion:1})});
data.push({id:'bad-wins',data:()=>({playerId:'bad-wins',name:'Wins',
 score:999999,verified:true,verifiedBy:'server',schemaVersion:1,
 gamesPlayed:1,victories:1000})});
data.push({id:'bad-id!',data:()=>({playerId:'bad-id!',name:'Invalid key',
 score:999999,verified:true,verifiedBy:'server',schemaVersion:1})});
callback(snapshot());
assert.deepEqual(updates[3].items.map(v=>v.playerId),['c','a','b'],
 'Malformed verified rows must not enter the public competitive board');
stop();assert(cleaned);
ranking.getRanking('global',10).then(r=>{
 assert.equal(r.items.length,3);
 console.log('PASS 6.2: only server-verified players, live reorder, unsubscribe, no mock ranking');
}).catch(e=>{console.error(e);process.exitCode=1});
