'use strict';
// Dedicated production Arena: loopback process, real HTTP and WS handshakes.
// NO Firestore access or fake leaderboard records.
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const http=require('node:http');
const net=require('node:net');
const path=require('node:path');
const WebSocket=require('ws');
const sleep=n=>new Promise(done=>setTimeout(done,n));
async function reservePort(){
 return new Promise((resolve,reject)=>{
   const l=net.createServer();
   l.once('error',reject);
   l.listen(0,'127.0.0.1',()=>{const n=l.address().port;l.close(()=>resolve(n));});
 });
}
async function httpJson(url){
 return new Promise((resolve,reject)=>{
   const req=http.get(url,res=>{
     let body='';
     res.on('data',chunk=>body+=chunk);
     res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(body)})}catch(e){reject(e)}});
   });
   req.setTimeout(800,()=>req.destroy(Error('Timeout')));
   req.once('error',reject);
 });
}
function wsHandshake(url,origin){
 return new Promise((resolve,reject)=>{
   const opts={handshakeTimeout:4000};
   if(origin!==undefined)opts.origin=origin;
   const ws=new WebSocket(url,opts);
   const messages=[];
   ws.on('message',raw=>{try{messages.push(JSON.parse(String(raw)))}catch{}});
   let done=false;
   const settle=(result,error)=>{if(done)return;done=true;ws.on('error',()=>{});if(error)reject(error);else resolve(result);};
   ws.once('open',()=>settle({allowed:true,ws,messages}));
   ws.once('unexpected-response',(_req,res)=>{res.resume();settle({allowed:false,status:res.statusCode});});
   ws.once('error',e=>settle(null,e));
 });
}
(async()=>{
 const port=await reservePort();
 const proc=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{
   env:{...process.env,PORT:String(port),CT_STAGING:'false',CT_ARENA_PRODUCTION:'true',
        CT_OBJECTIVE_MENTIROSO:'true',CT_ARENA_PRODUCTION_ORIGINS:''},
   stdio:['ignore','pipe','pipe']
 });
 let output='';proc.stdout.on('data',d=>output+=d.toString());proc.stderr.on('data',d=>output+=d.toString());
 const sockets=[];
 try {
   let health;
   for(let i=0;i<100;i++){
     if(proc.exitCode!==null)throw Error('Server exited '+output.slice(-900));
     try{health=await httpJson('http://127.0.0.1:'+port+'/__ct_arena/health');break}catch{}
     await sleep(70);
   }
   assert(health,'Arena never started: '+output.slice(-900));
   assert.equal(health.status,200);
   assert.equal(health.body.service,'cracktotal-arena-production');
   assert.equal(health.body.arenaProtocol,'cracktotal-arena-5.2');
   assert.equal(health.body.features.pasalaDuel,true);
   assert.equal(health.body.features.qsmResume,true);
   assert.equal(health.body.features.mentirosoObjective,true);
   for(const origin of ['https://cracktotal.com','https://www.cracktotal.com',
                        'https://cracktotal-pz9u.onrender.com']){
      const result=await wsHandshake('ws://127.0.0.1:'+port,origin);
      assert(result.allowed,origin+' should connect');
      sockets.push(result.ws);
      let message;
      for(let attempt=0;attempt<120;attempt++){
        message=result.messages.find(data=>data.type==='arena:hello');
        if(message)break;
        await sleep(25);
      }
      assert(message,'No arena:hello');
      assert.equal(message.payload.protocol,'cracktotal-arena-5.2');
      assert.equal(message.payload.features.pasalaDuel,true);
   }
   for(const origin of ['https://attacker.example','http://cracktotal.com','null',undefined]){
     const result=await wsHandshake('ws://127.0.0.1:'+port,origin);
     assert.equal(result.allowed,false,'Foreign or absent origin must fail: '+origin);
     assert.equal(result.status,403);
   }
   console.log('PASS CT7.6: production Arena health, exact protocol, QSM recovery, first-party origins, four rejected origins');
 }finally{
   for(const ws of sockets){try{ws.close()}catch{}}
   proc.kill('SIGTERM');
   await Promise.race([new Promise(resolve=>proc.once('exit',resolve)),sleep(1500)]);
   if(proc.exitCode===null)proc.kill('SIGKILL');
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
