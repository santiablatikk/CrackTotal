'use strict';
/**
 * Real production-only external WS E2E for QSM + Mentiroso.
 * Uses ephemeral private rooms and authentic protocol messages.
 * Never accesses Firebase, modifies rankings or impersonates users.
 */
const assert=require('node:assert/strict');
const WebSocket=require('ws');
const {catalog}=require('../server/multiplayer/objective-mentiroso');
const URL='https://cracktotal-arena-prod.onrender.com';
const WS='wss://cracktotal-arena-prod.onrender.com';
const ORIGIN='https://www.cracktotal.com';
const EXPECTED=process.env.CT_EXPECTED_ARENA_SHA;
assert.match(EXPECTED||'',/^[0-9a-f]{40}$/,'Exact validated Arena commit required');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const connections=[];
async function ready(){
 let last='unknown';
 for(let n=0;n<45;n++){
  try{
   const r=await fetch(URL+'/__ct_arena/health',{signal:AbortSignal.timeout(9000),headers:{'Cache-Control':'no-cache'}});
   const j=await r.json();
   if(r.ok&&j.ok&&j.service==='cracktotal-arena-production'&&j.commit===EXPECTED
      &&j.arenaProtocol==='cracktotal-arena-5.2'&&j.features?.pasalaDuel
      &&j.features?.qsmResume&&j.features?.mentirosoObjective)return j;
   last=JSON.stringify({http:r.status,sha:j.commit,features:j.features});
  }catch(e){last=String(e)}
  await sleep(3000);
 }
 throw Error('No matching production Arena deployment: '+last);
}
async function connect(label){
 const ws=new WebSocket(WS,{origin:ORIGIN,handshakeTimeout:16000});
 const c={label,ws,events:[]};connections.push(c);
 ws.on('message',raw=>{try{c.events.push(JSON.parse(String(raw)))}catch{}});
 await new Promise((resolve,reject)=>{
  const t=setTimeout(()=>reject(Error('Connect timeout '+label)),20000);
  ws.once('open',()=>{clearTimeout(t);resolve()});
  ws.once('error',e=>{clearTimeout(t);reject(e)});
  ws.once('unexpected-response',(_req,res)=>{clearTimeout(t);res.resume();reject(Error('HTTP '+res.statusCode))});
 });
 const hello=await wait(c,'arena:hello',()=>true,0,5000);
 assert.equal(hello.protocol,'cracktotal-arena-5.2');
 return c;
}
function send(c,type,payload={}){
 assert.equal(c.ws.readyState,WebSocket.OPEN,c.label+' must be connected');
 c.ws.send(JSON.stringify({type,payload}));
}
async function wait(c,type,pred=()=>true,from=0,timeout=11000){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){
  for(let i=from;i<c.events.length;i++){
   const e=c.events[i];
   if(e.type===type&&pred(e.payload||{}))return e.payload||{};
  }
  await sleep(35);
 }
 throw Error('Timeout '+c.label+' '+type+' (last '+c.events.slice(-10).map(e=>e.type).join(',')+')');
}
async function qsm(){
 let host=await connect('QSM host'),rival=await connect('QSM rival');
 send(host,'createRoom',{playerName:'CT QA QSM A',gameType:'quiensabemas'});
 const room=await wait(host,'roomCreated');
 assert.match(room.reconnectToken,/^[A-F0-9]{48}$/);
 send(rival,'joinRoom',{roomId:room.roomId,playerName:'CT QA QSM B',gameType:'quiensabemas'});
 const joined=await wait(rival,'joinSuccess');
 assert.match(joined.reconnectToken,/^[A-F0-9]{48}$/);
 await wait(host,'gameStart');
 await wait(host,'newQuestion');
 host.ws.close();
 await wait(rival,'opponentDisconnected');
 const from=rival.events.length;
 send(rival,'submitAnswer',{selectedIndex:0});
 await wait(rival,'errorMessage',x=>/Esperando/.test(x.error||''),from);
 host=await connect('QSM resumed');
 send(host,'resumeRoom',{roomId:room.roomId,reconnectToken:room.reconnectToken,gameType:'quiensabemas'});
 const state=await wait(host,'roomResumed');
 assert.equal(state.playerId,room.playerId);
 assert.equal(state.gameActive,true);
 assert.match(state.questionId,/^[A-F0-9]{24}$/);
 assert.ok(state.question?.options?.length===4);
 assert.notEqual(state.reconnectToken,room.reconnectToken,'Reconnect credentials must rotate');
 await wait(rival,'opponentReconnected');
 const answerer=state.currentTurn===room.playerId?host:rival;
 const other=answerer===host?rival:host;
 const start=answerer.events.length;
 send(answerer,'submitAnswer',{selectedIndex:0,questionId:state.questionId});
 const scored=await wait(answerer,'answerResult',()=>true,start);
 assert.ok([0,.5,1].includes(scored.pointsAwarded));
 const staleStart=other.events.length;
 send(other,'submitAnswer',{selectedIndex:0,questionId:state.questionId});
 await wait(other,'errorMessage',()=>true,staleStart);
 send(host,'leaveRoom');
 send(rival,'leaveRoom');
 console.log('PASS QSM live: two clients, genuine private room, reconnect, rotated token, answer from server, stale action rejected');
}
async function mentiroso(){
 let host=await connect('Mentiroso host'),rival=await connect('Mentiroso rival');
 send(host,'createRoom',{playerName:'CT QA Mentiroso A',gameType:'mentiroso'});
 const made=await wait(host,'roomCreated');
 send(rival,'joinRoom',{roomId:made.roomId,playerName:'CT QA Mentiroso B',gameType:'mentiroso'});
 const joined=await wait(rival,'joinSuccess');
 await wait(host,'mentirosoGameStart');
 const round=await wait(host,'mentirosoNextRound',r=>r.objectiveValidation===true,0,13000);
 assert.ok(round.maxBid>=20);
 const current=round.currentTurn===made.playerId?host:rival;
 const other=current===host?rival:host;
 const before=other.events.length;
 send(current,'mentirosoSubmitBid',{bid:20});
 await wait(other,'mentirosoBidUpdate',r=>r.newBid===20,before);
 const called=current.events.length;
 send(other,'mentirosoCallLiar');
 await wait(current,'mentirosoLiarCalled',()=>true,called);
 const verified=catalog.challenges.find(x=>x.category===round.category);
 assert(verified?.answers?.length>=20,'Only audited canonical bank may be used');
 const resultFrom=current.events.length;
 send(current,'mentirosoSubmitAnswers',{answers:verified.answers.slice(0,20).map(x=>x.label)});
 const verdict=await wait(current,'mentirosoRoundResult',r=>r.validAnswersCount===20,resultFrom,12000);
 assert.equal(verdict.wasMentiroso,false);
 assert.equal(verdict.validationDetails.filter(x=>x.accepted).length,20);
 const subjectiveFrom=other.events.length;
 send(other,'mentirosoSubmitValidation',{validations:Array(20).fill(false)});
 await wait(other,'errorMessage',x=>/automática/.test(x.error||''),subjectiveFrom);
 await wait(rival,'mentirosoNextRound',r=>r.round===2,0,16000);
 host.ws.close();
 await wait(rival,'opponentDisconnected');
 host=await connect('Mentiroso resumed');
 send(host,'resumeRoom',{roomId:made.roomId,reconnectToken:made.reconnectToken,gameType:'mentiroso'});
 const restored=await wait(host,'roomResumed');
 assert.equal(restored.playerId,made.playerId);
 assert.equal(restored.mentiroso.currentRound,2);
 await wait(rival,'opponentReconnected');
 send(host,'leaveRoom');
 send(rival,'leaveRoom');
 console.log('PASS MENTIROSO live: two clients, 20 official answers, objective score, forged vote rejected, reconnect preserved round');
}
(async()=>{
 try {await ready();await qsm();await mentiroso();console.log('PASS REAL PRODUCTION QSM + MENTIROSO: remote authenticated-origin protocol and transient match state');}
 catch(e){console.error(e.stack||e);process.exitCode=1;}
 finally{for(const c of connections)try{c.ws.terminate()}catch{}}
})();