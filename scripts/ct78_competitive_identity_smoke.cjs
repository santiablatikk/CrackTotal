'use strict';
const assert=require('node:assert/strict');
const {createCompetitiveIdentity}=require('../server/rankings/arena-identity');
const clock={t:1793130000000},current=()=>clock.t;
const token=name=>name+'.'+('a'.repeat(130));
const claims=uid=>({uid,exp:Math.floor(clock.t/1000)+1800,
  auth_time:Math.floor(clock.t/1000)-20,firebase:{sign_in_provider:'google.com'}});
const known=new Map([[token('Alice'),claims('firebaseUidA')],[token('Bob'),claims('firebaseUidB')],
 [token('Evil'),{...claims('firebaseUidX'),firebase:{sign_in_provider:'anonymous'}}],
 [token('Unverified'),{...claims('firebaseUidY'),firebase:{sign_in_provider:'password'},email_verified:false}]]);
const calls=[];
const verify=async(t,revoked)=>{calls.push({revoked});if(!known.has(t))throw Error('Invalid Firebase Admin JWT');return known.get(t)};
const room='room_ABCDEFGH',a='serverPlayer_A1',b='serverPlayer_B1';
async function main(){
 assert.throws(()=>createCompetitiveIdentity(),/Firebase Admin/);
 const gate=createCompetitiveIdentity({verifyIdToken:verify,now:current});
 assert.equal(gate.resolveAuthenticatedUid(room,a),null);
 await assert.rejects(gate.bind(room,a,'some fake uid'),/bearer token/);
 await assert.rejects(gate.bind(room,a,token('Evil')),/non-anonymous/);
 await assert.rejects(gate.bind(room,a,token('Unverified')),/non-anonymous/);
 await assert.rejects(gate.bind(room,a,token('Fake')),/Invalid Firebase Admin JWT/);
 const res=await gate.bind(room,a,token('Alice'));
 assert(res.authenticated);
 assert.equal(gate.resolveAuthenticatedUid(room,a).uid,'firebaseUidA');
 await assert.rejects(gate.bind(room,b,token('Alice')),/both rivals/);
 await assert.rejects(gate.bind(room,a,token('Bob')),/cannot switch UID/);
 await gate.bind(room,b,token('Bob'));
 await gate.revalidate(room,a,token('Alice'));
 assert.equal(gate.resolveAuthenticatedUid(room,b).uid,'firebaseUidB');
 const saved=gate.resolveAuthenticatedUid(room,a);
 assert(!('token' in saved) && !('idToken' in saved),'Bearer token must never be persisted');
 assert(calls.every(x=>x.revoked===true),'Firebase Admin revocation checks must always be on');
 clock.t+=1801*1000;
 assert.equal(gate.resolveAuthenticatedUid(room,a),null,'Expired Firebase claims cannot publish match result');
 assert.equal(gate.resolveAuthenticatedUid(room,b),null);
 gate.forgetRoom(room);
 assert.equal(gate.resolveAuthenticatedUid(room,a),null);
 console.log('PASS CT7.8 Firebase identity: admin-only, non-anonymous, immutable rivals, revocation checks, token refresh and expiry');
}
main().catch(e=>{console.error(e);process.exitCode=1});
