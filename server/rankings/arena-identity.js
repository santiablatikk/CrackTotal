'use strict';
/**
 * Competitive Firebase Auth boundary for Arena — SERVER PRIVATE, opt-in only.
 * Do not call from a browser/WS request with a playerId supplied by that client.
 * Caller must resolve (roomId,serverPlayerId) from its own live room maps.
 *
 * verifyIdToken = (token,checkRevoked) => firebaseAdmin.auth().verifyIdToken(token,true)
 * A verifier is never optional; do not implement a local JWT trust fallback.
 */
const UID=/^[A-Za-z0-9:_-]{1,128}$/;
const ROOM=/^[A-Za-z0-9_-]{4,96}$/;
const SERVER_PLAYER=/^[A-Za-z0-9_-]{8,128}$/;
const MAX_TTL=60*60*1000;
function createCompetitiveIdentity({verifyIdToken,now=Date.now}={}) {
  if(typeof verifyIdToken!=='function'||typeof now!=='function')
    throw new TypeError('Firebase Admin verifyIdToken and server clock required');
  const rooms=new Map();
  const liveKey=(roomId,serverPlayerId)=>{
    if(typeof roomId!=='string'||!ROOM.test(roomId)||
       typeof serverPlayerId!=='string'||!SERVER_PLAYER.test(serverPlayerId))
      throw new TypeError('Arena private room/participant reference required');
    return roomId+':'+serverPlayerId;
  };
  const check=async token=>{
    if(typeof token!=='string'||token.length<80||token.length>4096||
      !/^[A-Za-z0-9_.-]+$/.test(token))throw new TypeError('Invalid Firebase bearer token format');
    // Explicit revocation check; no trust of decoded client claims.
    const decoded=await verifyIdToken(token,true);
    const provider=decoded?.firebase?.sign_in_provider;
    if(!decoded||!UID.test(decoded.uid||'')||
       provider==='anonymous'||!provider||
       decoded.email_verified===false && provider==='password'||
       !Number.isSafeInteger(decoded.exp)||decoded.exp*1000<=now()||
       !Number.isSafeInteger(decoded.auth_time)||
       decoded.auth_time*1000>now())throw new TypeError('Verified, non-anonymous Firebase user required');
    return Object.freeze({uid:decoded.uid,exp:decoded.exp*1000});
  };
  async function bind(roomId,serverPlayerId,token){
    const key=liveKey(roomId,serverPlayerId);
    const identity=await check(token);
    const old=rooms.get(key);
    if(old&&old.uid!==identity.uid)
      throw new TypeError('Competitive participant cannot switch UID during a match');
    for(const [existingKey,record] of rooms) {
      if(existingKey.startsWith(roomId+':') && existingKey!==key && record.uid===identity.uid)
        throw new TypeError('One authenticated account cannot represent both rivals');
    }
    const value=Object.freeze({uid:identity.uid,expiresAt:identity.exp,verifiedWithAdmin:true});
    rooms.set(key,value);
    return Object.freeze({authenticated:true,expiresAt:identity.exp});
  }
  function resolveAuthenticatedUid(roomId,serverPlayerId){
    const binding=rooms.get(liveKey(roomId,serverPlayerId));
    return binding?.expiresAt>now()?binding:null;
  }
  async function revalidate(roomId,serverPlayerId,token){
    // Identity is immutable across disconnect/reconnect; token must authenticate
    // to the exact same user ID (including revoked-session checks).
    return bind(roomId,serverPlayerId,token);
  }
  function forgetParticipant(roomId,serverPlayerId) {
    rooms.delete(liveKey(roomId,serverPlayerId));
  }
  function forgetRoom(roomId){
    if(typeof roomId!=='string'||!ROOM.test(roomId))return;
    for(const key of rooms.keys())if(key.startsWith(roomId+':'))rooms.delete(key);
  }
  return Object.freeze({bind,revalidate,resolveAuthenticatedUid,forgetParticipant,forgetRoom});
}
module.exports={createCompetitiveIdentity};
