'use strict';
/**
 * External staging smoke: TWO real Internet WebSocket clients, one Render service.
 * Never connects to Crack Total production, writes Firebase, or fabricates ranks.
 * On staging push, wait until Render health reports precisely this Git SHA.
 */
const assert=require('node:assert/strict');
const WebSocket=require('ws');
const bank=require('../assets/data/pasalache_2025.json');
const BASE='https://cracktotal-arena-staging.onrender.com';
const WS='wss://cracktotal-arena-staging.onrender.com';
const EXPECTED=process.env.GITHUB_SHA||process.env.CT_EXPECTED_STAGING_SHA;
assert.match(EXPECTED||'',/^[a-f0-9]{40}$/,'Expected exact target commit required');
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const connected=[];
async function ready(){
  let last='no response';
  for(let i=0;i<70;i++){
    try{
      const response=await fetch(BASE+'/__ct_staging/health',{
        signal:AbortSignal.timeout(8500),headers:{'Cache-Control':'no-cache'}
      });
      const body=await response.json();
      if(response.ok&&body.ok===true&&body.service==='cracktotal-arena-staging'&&
         body.websocket===true&&body.arenaProtocol==='cracktotal-arena-5.2'&&
         body.features?.pasalaDuel===true&&body.commit===EXPECTED){
        console.log('EXACT STAGING COMMIT LIVE: '+body.commit);
        return;
      }
      last=JSON.stringify({status:response.status,commit:body.commit,websocket:body.websocket});
    }catch(e){last=String(e.message||e)}
    await sleep(4000);
  }
  throw Error('Render never deployed expected commit '+EXPECTED+', last: '+last);
}
async function connect(label){
  const ws=new WebSocket(WS,{origin:BASE,handshakeTimeout:12000});
  const c={ws,label,messages:[]};connected.push(c);
  ws.on('message',raw=>{try{c.messages.push(JSON.parse(String(raw)))}catch{}});
  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(Error('WebSocket handshake timeout '+label)),16000);
    ws.once('open',()=>{clearTimeout(timeout);resolve()});
    ws.once('error',e=>{clearTimeout(timeout);reject(e)});
    ws.once('unexpected-response',(req,res)=>{
      clearTimeout(timeout);res.resume();reject(Error(label+' rejected by staging HTTP '+res.statusCode));
    });
  });
  return c;
}
async function wait(c,type,predicate=()=>true,since=0,timeoutMs=9000){
  const until=Date.now()+timeoutMs;
  while(Date.now()<until){
    for(let i=since;i<c.messages.length;i++){
      const event=c.messages[i];
      if(event.type===type&&predicate(event.payload||{}))return event.payload||{};
    }
    await sleep(35);
  }
  throw Error('Timeout '+c.label+' waiting '+type+'; events '+c.messages.slice(-12).map(m=>m.type).join(','));
}
function send(c,type,payload={}){
  assert.equal(c.ws.readyState,WebSocket.OPEN,c.label+' WS must be open');
  c.ws.send(JSON.stringify({type:'pasala:'+type,payload}));
}
async function hello(c){
  const data=await wait(c,'arena:hello',()=>true,0,4000);
  assert.equal(data.protocol,'cracktotal-arena-5.2');
  assert.equal(data.features.pasalaDuel,true);
}
async function run(){
  await ready();
  let host=await connect('host'),rival=await connect('rival'),viewer=await connect('viewer');
  await Promise.all([hello(host),hello(rival),hello(viewer)]);
  send(host,'create',{name:'QA staging 6.2 A',difficulty:'normal',public:false});
  const created=await wait(host,'pasala:created');
  assert.match(created.roomId,/^[A-F0-9]{10}$/);
  assert.ok(created.reconnectToken);
  send(rival,'join',{name:'QA staging 6.2 B',roomId:created.roomId});
  const joined=await wait(rival,'pasala:joined');
  assert.equal(joined.roomId,created.roomId);
  send(viewer,'spectate',{roomId:created.roomId});
  await wait(viewer,'pasala:spectating');
  // Never allow viewers to award themselves points.
  const before=viewer.messages.length;
  send(viewer,'answer',{letter:'A',answer:'Inventado'});
  await wait(viewer,'pasala:error',p=>p.message==='Acción no permitida.',before);
  send(host,'ready');send(rival,'ready');
  await wait(host,'pasala:state',p=>p.phase==='playing',0,10000);
  const qa=await wait(host,'pasala:question');
  const qb=await wait(rival,'pasala:question');
  assert.equal(qa.text,qb.text);
  assert.equal(qa.letter,qb.letter);
  // Unplug the first client's real TCP socket and authenticate a fresh one.
  const previous=rival.messages.length;
  host.ws.terminate();
  await wait(rival,'pasala:state',p=>p.phase==='playing'&&p.players[0].connected===false,previous);
  host=await connect('resumed host');await hello(host);
  send(host,'resume',{roomId:created.roomId,reconnectToken:created.reconnectToken});
  const resumed=await wait(host,'pasala:joined');
  assert.equal(resumed.resumed,true);
  const q=await wait(host,'pasala:question');
  const record=bank.find(group=>group.letra===q.letter)?.preguntas.find(item=>item.pregunta===q.text);
  assert(record,'Question from exact staged bank must be recognized');
  await sleep(230);
  const from=host.messages.length;
  send(host,'answer',{letter:q.letter,answer:record.respuesta});
  const ack=await wait(host,'pasala:answerResult',p=>p.letter===q.letter,from);
  assert.equal(ack.correct,true,'Remote server, not browser, validates score');
  const beforeForfeit=rival.messages.length;
  send(host,'leave');
  const end=await wait(rival,'pasala:result',p=>p.reason==='forfeit',beforeForfeit);
  assert.equal(end.winner,joined.playerId);
  assert(!viewer.messages.some(e=>e.type==='pasala:question'),
    'Spectators must never receive hidden competitive questions');
  console.log('PASS REAL REMOTE STAGING: two peers, third spectator, secret handshake, right answer, forced drop/recovery and server-authoritative forfeit');
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{
  for(const c of connected)try{c.ws.terminate()}catch{}
});
