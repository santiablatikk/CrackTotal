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
const fakeDb={collection:root=>{
 assert.equal(root,'leaderboard_scopes');
 return {doc:scope=>{
   assert.equal(scope,'global');
   return {collection:child=>{
     assert.equal(child,'entries');
     return {orderBy:()=>({limit:n=>({
       get:async()=>snapshot(),
       onSnapshot:fn=>{callback=fn;return ()=>{cleaned=true;}}
     })})};
   }};
 }};
}};
const window={db:fakeDb,CrackTotalServices:{}};
vm.runInNewContext(svc,{window,Date,Promise,Number,String,Array,Object,Error,TypeError});
const ranking=window.CrackTotalServices.RankingService;
const updates=[];const stop=ranking.subscribe('global',v=>updates.push(JSON.parse(JSON.stringify(v))),10);
callback(snapshot());
assert.deepEqual(updates[0].items.map(v=>v.name),['Beto','Ana']);
assert.equal(updates[0].source,'verified-firestore');
data[0]={id:'a',data:()=>({playerId:'a',name:'Ana',score:75,verified:true,verifiedBy:'server',schemaVersion:1,victories:2})};
callback(snapshot());
assert.deepEqual(updates[1].items.map(v=>v.name),['Ana','Beto']);
stop();assert(cleaned);
ranking.getRanking('global',10).then(r=>{
 assert.equal(r.items.length,2);
 console.log('PASS 6.2: only server-verified players, live reorder, unsubscribe, no mock ranking');
}).catch(e=>{console.error(e);process.exitCode=1});
