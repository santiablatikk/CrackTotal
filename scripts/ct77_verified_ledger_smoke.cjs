'use strict';
const assert=require('node:assert/strict');
const {createVerifiedMatchLedger}=require('../server/rankings/verified-match-ledger');
const id='match_1234567890abcdef1234567890';
const roomId='room_1234567890abcdef';
const players=[
 {serverPlayerId:'player_A_12345678',name:'Jugador A',score:17},
 {serverPlayerId:'player_B_12345678',name:'Jugador B',score:14.5}
];
let completed={
 matchId:id,roomId,gameType:'quiensabemas',finalised:true,
 finishedAt:'2026-10-27T18:00:00Z',players
};
const data=new Map(),calls=[];
function ref(path){
 return {
  path,
  doc(id){return ref(path+'/'+id)},
  collection(id){return ref(path+'/'+id)}
 };
}
const db={
 collection(name){return ref(name)},
 runTransaction:async(fn)=>{
  const pending=new Map(),reads=[];
  const tx={
   async get(r){reads.push(r.path);const v=data.get(r.path);
     return {exists:v!==undefined,data:()=>v};},
   set(r,value){pending.set(r.path,value);}
  };
  const val=await fn(tx);
  // Simulate Firestore read-before-write and commit only after success.
  calls.push({reads,writes:[...pending.keys()]});
  for(const [k,v] of pending)data.set(k,v);
  return val;
 }
};
const bindings=new Map([
 [roomId+':'+players[0].serverPlayerId,{uid:'firebaseUidA',verifiedWithAdmin:true}],
 [roomId+':'+players[1].serverPlayerId,{uid:'firebaseUidB',verifiedWithAdmin:true}]
]);
const build=(identity=async(r,p)=>bindings.get(r+':'+p),get=async()=>completed)=>createVerifiedMatchLedger({
 db,resolveAuthenticatedUid:identity,loadFinishedMatch:get,now:()=>new Date('2026-10-27T18:01:00Z')
});
function entry(scope,uid){return data.get('leaderboard_scopes/'+scope+'/entries/'+uid)}
async function main(){
 const svc=build();
 let r=await svc.commitCompletedMatch(id);
 assert.equal(r.written,true);
 assert.equal(data.size,5,'One ledger doc + global and QSM for two UIDs');
 assert.deepEqual([entry('global','firebaseUidA').score,entry('global','firebaseUidB').score],[3,0]);
 assert.equal(entry('quiensabemas','firebaseUidA').victories,1);
 assert.equal(entry('global','firebaseUidB').gamesPlayed,1);
 assert.equal(entry('global','firebaseUidA').verifiedBy,'server');
 assert.equal(data.get('verified_matches/'+id).winnerUid,'firebaseUidA');
 assert.equal(calls[0].reads.length,5);
 assert.equal(calls[0].writes.length,5);
 r=await svc.commitCompletedMatch(id);
 assert.equal(r.written,false,'Delivery replay must not award points again');
 assert.equal(data.size,5);
 assert.equal(entry('global','firebaseUidA').gamesPlayed,1);
 assert.equal(calls[1].reads.length,1,'Existing match should short circuit without touching rankings');
 assert.equal(calls[1].writes.length,0);
 completed={...completed,matchId:'match_1234567890abcdef1234567891',
   gameType:'mentiroso',players:[{...players[0],score:1},{...players[1],score:1}]};
 await svc.commitCompletedMatch(completed.matchId);
 assert.deepEqual([entry('global','firebaseUidA').score,entry('global','firebaseUidB').score],[4,1],
   'Draws gain one point each');
 assert.equal(entry('mentiroso','firebaseUidA').gamesPlayed,1);
 assert.equal(entry('global','firebaseUidA').gamesPlayed,2);
 assert.equal(entry('global','firebaseUidA').victories,1);
 assert.equal(data.size,8,'Existing global entries updated; only new Mentiroso entries and match audit created');
 const sizeBefore=data.size;
 completed={...completed,matchId:'match_1234567890abcdef1234567892'};
 await assert.rejects(build(async()=>null).commitCompletedMatch(completed.matchId),/missing Firebase Admin verified binding/);
 await assert.rejects(build(async()=>({uid:'firebaseUidA',verifiedWithAdmin:false})).commitCompletedMatch(completed.matchId),/missing Firebase Admin verified binding/);
 await assert.rejects(build(async()=>({uid:'firebaseUidA',verifiedWithAdmin:true})).commitCompletedMatch(completed.matchId),/same authenticated account/);
 await assert.rejects(build(undefined,async()=>({...completed,finalised:false})).commitCompletedMatch(completed.matchId),/not finalised/);
 await assert.rejects(build(undefined,async()=>({...completed,players:[
   {...players[0],score:99999999},players[1]]})).commitCompletedMatch(completed.matchId),/bad server-scored/);
 await assert.rejects(build(undefined,async()=>({...completed,players:[
   {...players[0],name:'<img src=x onerror=alert(1)>'},players[1]]})).commitCompletedMatch(completed.matchId),/invalid display name/);
 await assert.rejects(svc.commitCompletedMatch('../etc/passwd'),/invalid unique match id/);
 assert.equal(data.size,sizeBefore,'Rejected or spoofed matches must not write any data');
 assert(!('firebaseIdToken' in data.get('verified_matches/'+id)),'Never save bearer secrets');
 console.log('PASS CT7.7 ledger: atomic verified-only global/game scores, duplicate replay, draws, Firebase UID bindings and rejection of forged/invalid results');
}
main().catch(e=>{console.error(e);process.exitCode=1});
