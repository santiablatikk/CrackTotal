'use strict';

/**
 * Arena admission boundary for future verified competition.
 *
 * SECURITY: resolveCompetitor(ws) must derive the room and PLAYER identity
 * from private Arena room/connection maps. Client-supplied room IDs, player
 * IDs, nicknames, reconnect tokens or "isWinner" flags are NEVER accepted
 * as proof of identity. A spectator cannot authenticate as a competitor.
 *
 * This module is intentionally separate from game actions and ranking writes.
 * It does not unlock rankings: finalization must still check each participant's
 * Firebase Admin verified UID and a unique server-owned match ID.
 */
const {createCompetitiveIdentity}=require('./arena-identity');

function createArenaAdmission({verifyIdToken,resolveCompetitor,now=Date.now}={}) {
  if(typeof verifyIdToken!=='function'||typeof resolveCompetitor!=='function')
    throw new TypeError('Firebase Admin verifier and private Arena participant resolver required');
  const gate=createCompetitiveIdentity({verifyIdToken,now});
  const inflight=new WeakSet();
  function context(ws) {
    const ref=resolveCompetitor(ws);
    if(!ref||typeof ref.roomId!=='string'||typeof ref.serverPlayerId!=='string')
      return null;
    return {roomId:ref.roomId,serverPlayerId:ref.serverPlayerId};
  }
  function same(a,b) {
    return !!a&&!!b&&a.roomId===b.roomId&&a.serverPlayerId===b.serverPlayerId;
  }
  async function authenticate(ws,payload) {
    const own=context(ws);
    if(!own) return {authenticated:false,competitive:false,reason:'join-a-room-as-player-first'};
    if(!payload||typeof payload!=='object'||Array.isArray(payload)||
       typeof payload.idToken!=='string'||Object.keys(payload).some(k=>k!=='idToken'))
      return {authenticated:false,competitive:false,reason:'invalid-authentication-request'};
    if(inflight.has(ws)) return {authenticated:false,competitive:false,reason:'authentication-in-progress'};
    inflight.add(ws);
    try {
      // The existing identity module calls Firebase Admin verifyIdToken(jwt,true)
      // and rejects anonymous credentials, expired or revoked tokens.
      const result=await gate.bind(own.roomId,own.serverPlayerId,payload.idToken);
      // A room may close or the socket may leave while Admin is verifying JWT.
      if(!same(own,context(ws))){
        gate.forgetParticipant(own.roomId,own.serverPlayerId);
        return {authenticated:false,competitive:false,reason:'player-session-changed'};
      }
      return {authenticated:true,competitive:true,expiresAt:result.expiresAt};
    } catch {
      // Never disclose Firebase Admin exceptions, JWTs, UIDs or room secrets.
      return {authenticated:false,competitive:false,reason:'verified-account-required'};
    } finally {
      inflight.delete(ws);
    }
  }
  async function revalidate(ws,payload){
    return authenticate(ws,payload);
  }
  function resolveUid(roomId,serverPlayerId) {
    return gate.resolveAuthenticatedUid(roomId,serverPlayerId);
  }
  function forgetRoom(roomId){gate.forgetRoom(roomId);}
  function forgetParticipant(roomId,serverPlayerId){gate.forgetParticipant(roomId,serverPlayerId);}
  return Object.freeze({authenticate,revalidate,resolveUid,forgetRoom,forgetParticipant});
}
module.exports={createArenaAdmission};
