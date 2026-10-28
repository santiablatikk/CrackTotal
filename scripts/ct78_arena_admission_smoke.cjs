'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createArenaAdmission}=require('../server/rankings/arena-admission');
const clock={time:1793173200000};
const now=()=>clock.time;
const jwt=(value)=>value+'.'+('a'.repeat(138));
const alice=jwt('alice'),bob=jwt('bob'),anonymous=jwt('anonymous'),revoked=jwt('revoked');
const claims=(uid,provider='google.com')=>({
 uid,exp:Math.floor(now()/1000)+1800,auth_time:Math.floor(now()/1000)-60,
 firebase:{sign_in_provider:provider}
});
let calls=[];
let resolveLate=null;
const verifier=async(t,revoke)=>{
 calls.push({revoked:revoke,token:t});
 if(t===revoked)throw Error('revoked Firebase Admin credential');
 if(t===anonymous)return claims('anonAccount','anonymous');
 if(t===alice)return claims('authAlice');
 if(t===bob)return claims('authBob');
 if(t===jwt('delayed'))return new Promise(resolve=>{resolveLate=()=>resolve(claims('authAlice'));});
 throw Error('unknown Firebase token');
};
const room='PRIVATE_ROOM_123456';
const participants=new WeakMap();
const aliceSocket={},bobSocket={},spectator={},ghost={},raceSocket={};
participants.set(aliceSocket,{roomId:room,serverPlayerId:'player_alice_ABC'});
participants.set(bobSocket,{roomId:room,serverPlayerId:'player_bob_ABC'});
participants.set(raceSocket,{roomId:'OTHER_ROOM_123456',serverPlayerId:'player_other_ABC'});
const auth=createArenaAdmission({verifyIdToken:verifier,now,resolveCompetitor:ws=>participants.get(ws)});
(async()=>{
 assert.equal(auth.resolveUid(room,'player_alice_ABC'),null);
 assert.deepEqual(await auth.authenticate(spectator,{idToken:alice}),{
  authenticated:false,competitive:false,reason:'join-a-room-as-player-first'
 });
 assert.equal((await auth.authenticate(aliceSocket,{idToken:anonymous})).authenticated,false);
 assert.equal((await auth.authenticate(aliceSocket,{idToken:revoked})).authenticated,false);
 assert.equal((await auth.authenticate(aliceSocket,{idToken:alice,uid:'authAlice'})).authenticated,false);
 const status=await auth.authenticate(aliceSocket,{idToken:alice});
 assert.equal(status.authenticated,true);
 assert.equal(status.competitive,true);
 assert.equal(status.expiresAt,Math.floor(clock.time/1000)*1000+1800000);
 assert.equal(auth.resolveUid(room,'player_alice_ABC').uid,'authAlice');
 assert.equal((await auth.authenticate(bobSocket,{idToken:alice})).authenticated,false,
  'One account must never claim both seats');
 assert.equal((await auth.authenticate(aliceSocket,{idToken:bob})).authenticated,false,
  'No mid-match UID changes');
 assert.equal((await auth.authenticate(bobSocket,{idToken:bob})).authenticated,true);
 assert.equal(auth.resolveUid(room,'player_bob_ABC').uid,'authBob');
 const slow=auth.authenticate(raceSocket,{idToken:jwt('delayed')});
 await Promise.resolve();
 const second=await auth.authenticate(raceSocket,{idToken:jwt('delayed')});
 assert.equal(second.reason,'authentication-in-progress');
 participants.delete(raceSocket); // simulated connection leaving while Admin verifies
 resolveLate();
 const after=await slow;
 assert.equal(after.reason,'player-session-changed');
 assert.equal(auth.resolveUid('OTHER_ROOM_123456','player_other_ABC'),null);
 assert(calls.every(x=>x.revoked===true),'Firebase Admin revocation check must always be true');
 clock.time+=1801000;
 assert.equal(auth.resolveUid(room,'player_alice_ABC'),null,'Expired identity loses ranking rights');
 assert.equal(auth.resolveUid(room,'player_bob_ABC'),null);
 auth.forgetParticipant(room,'player_alice_ABC');
 auth.forgetRoom(room);
 const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
 assert.match(server,/CT_COMPETITIVE_AUTH_ENABLED === 'true'/);
 assert.match(server,/createArenaAdmission\(/);
 assert.match(server,/require\('firebase-admin'\)/);
 assert.match(server,/arena:authenticate/);
 assert.match(server,/rankings-not-enabled/);
 assert.doesNotMatch(server,/console\.log\([^)]*idToken/);
 console.log('PASS CT7.8 opt-in competitor admission: two distinct Firebase Admin verified seats, no spectators, revocation, expiry, race safety and disabled-by-default WS response');
})().catch(e=>{console.error(e);process.exitCode=1});
