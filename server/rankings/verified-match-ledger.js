'use strict';

/**
 * Competitive verified-match ledger — SERVER ONLY, NOT YET WIRED.
 *
 * Accepts a match id, never a browser-submitted score. Its two injected
 * callbacks MUST be backed by private in-process Arena state:
 *  - loadFinishedMatch(matchId) returns a final server-scored result;
 *  - resolveAuthenticatedUid(roomId, serverPlayerId) returns a UID already
 *    authenticated with Firebase Admin verifyIdToken at room admission.
 *
 * A missing binding MUST reject publication. Do not wire this to HTTP/WS
 * commands, client-settable flags, or anonymous nickname-based standings.
 * Firestore transactions make duplicate match delivery a no-op.
 *
 * Competitive score convention: win = 3, draw = 1, loss = 0. Individual
 * QSM half-point question totals are only used to determine match outcome.
 * This initial ledger ONLY updates global and game-specific rankings.
 * Weekly/monthly require calendar-bound scopes and separate versioning.
 */
const GAME_TYPES=new Set(['pasala-duel','quiensabemas','mentiroso']);
const MATCH_ID=/^[a-zA-Z0-9_-]{16,96}$/;
const ROOM_ID=/^[a-zA-Z0-9_-]{4,96}$/;
const SERVER_PLAYER_ID=/^[a-zA-Z0-9_-]{8,128}$/;
const FIREBASE_UID=/^[a-zA-Z0-9:_-]{1,128}$/;
function reject(message){throw new TypeError('Verified match rejected: '+message);}
function cleanName(name) {
 if(typeof name!=='string')reject('missing display name');
 const result=name.trim().replace(/\s+/g,' ');
 if(!result||result.length>80||/[\u0000-\u001f\u007f<>]/.test(result))reject('invalid display name');
 return result.slice(0,32);
}
function validScore(score) {
 return typeof score==='number'&&Number.isFinite(score)&&score>=0&&score<=1000000&&Number.isSafeInteger(score*2);
}
function validateFinishedMatch(match,requestedMatchId) {
 if(!match||typeof match!=='object'||match.matchId!==requestedMatchId||
    match.finalised!==true||!GAME_TYPES.has(match.gameType))reject('match not finalised or unknown game');
 if(typeof match.roomId!=='string'||!ROOM_ID.test(match.roomId))reject('invalid room reference');
 if(!Array.isArray(match.players)||match.players.length!==2)reject('exactly two competitors required');
 const playerIds=new Set();
 for(const player of match.players){
   if(!player||typeof player.serverPlayerId!=='string'||!SERVER_PLAYER_ID.test(player.serverPlayerId)||
      !validScore(player.score))reject('bad server-scored player');
   if(playerIds.has(player.serverPlayerId))reject('duplicate room player id');
   playerIds.add(player.serverPlayerId);
   cleanName(player.name);
 }
 const time=new Date(match.finishedAt);
 if(!match.finishedAt||!Number.isFinite(time.getTime()))reject('missing valid finish timestamp');
 return {gameType:match.gameType,roomId:match.roomId,finishedAt:time,
         players:match.players.map(p=>({serverPlayerId:p.serverPlayerId,score:p.score,name:cleanName(p.name)}))};
}
function createVerifiedMatchLedger({db,loadFinishedMatch,resolveAuthenticatedUid,now=()=>new Date()}={}) {
 if(!db||typeof db.runTransaction!=='function'||typeof db.collection!=='function'||
    typeof loadFinishedMatch!=='function'||typeof resolveAuthenticatedUid!=='function'||
    typeof now!=='function')throw new TypeError('Admin Firestore and trusted private Arena resolvers required');
 async function commitCompletedMatch(matchId) {
   if(typeof matchId!=='string'||!MATCH_ID.test(matchId))reject('invalid unique match id');
   // No client result object is ever accepted here.
   const result=validateFinishedMatch(await loadFinishedMatch(matchId),matchId);
   const users=await Promise.all(result.players.map(async p=>{
     const identity=await resolveAuthenticatedUid(result.roomId,p.serverPlayerId);
     const uid=identity&&identity.uid;
     if(typeof uid!=='string'||!FIREBASE_UID.test(uid)||
        identity.verifiedWithAdmin!==true)reject('missing Firebase Admin verified binding');
     return {...p,uid};
   }));
   if(users[0].uid===users[1].uid)reject('same authenticated account on both sides');
   // No modifications of an ended match's score are allowed after a successful write.
   const ranks=users.map((u,i)=>({
     ...u, victory:u.score>users[1-i].score,
     draw:u.score===users[1-i].score
   }));
   const ledgerRef=db.collection('verified_matches').doc(matchId);
   const scopes=['global',result.gameType];
   const entryRefs=ranks.flatMap(u=>scopes.map(scope=>({
     scope,uid:u.uid,user:u,
     ref:db.collection('leaderboard_scopes').doc(scope).collection('entries').doc(u.uid)
   })));
   return db.runTransaction(async tx=>{
     const previous=await tx.get(ledgerRef);
     if(previous.exists)return {written:false,matchId,reason:'already-recorded'};
     // Read all entry snapshots BEFORE writing anything (Firestore transaction contract).
     const existing=await Promise.all(entryRefs.map(e=>tx.get(e.ref)));
     const recordedAt=now();
     if(!(recordedAt instanceof Date)||!Number.isFinite(recordedAt.getTime()))
       throw new TypeError('Invalid server timestamp');
     tx.set(ledgerRef,{
       matchId,roomId:result.roomId,gameType:result.gameType,
       verified:true,verifiedBy:'server',schemaVersion:1,
       finishedAt:result.finishedAt,recordedAt,
       winnerUid:ranks.find(u=>u.victory)?.uid||null,
       participants:ranks.map(u=>({uid:u.uid,score:u.score,result:u.victory?'win':u.draw?'draw':'loss'}))
     });
     entryRefs.forEach((entry,index)=>{
       const previousData=existing[index].exists?existing[index].data():{};
       const previousGames=previousData.gamesPlayed??0;
       const previousVictories=previousData.victories??0;
       const previousScore=previousData.score??0;
       if(![previousGames,previousVictories,previousScore].every(n=>
            Number.isSafeInteger(n)&&n>=0&&n<=100000000)||
          previousVictories>previousGames)reject('corrupt ranking aggregate');
       const gamesPlayed=previousGames+1,victories=previousVictories+(entry.user.victory?1:0);
       const score=previousScore+(entry.user.victory?3:entry.user.draw?1:0);
       if(![gamesPlayed,victories,score].every(Number.isSafeInteger)||
           gamesPlayed>10000000||score>100000000)reject('ranking total exceeds bounds');
       tx.set(entry.ref,{
         playerId:entry.uid,name:entry.user.name,score,
         victories,gamesPlayed,
         verified:true,verifiedBy:'server',schemaVersion:1,
         updatedAt:recordedAt
       });
     });
     return {written:true,matchId,gameType:result.gameType,participants:2};
   });
 }
 return Object.freeze({commitCompletedMatch});
}
module.exports={createVerifiedMatchLedger};
