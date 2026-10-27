/* Rankings públicos: exclusivamente documentos que valida el servidor.
   Firestore leaderboard_scopes/{scope}/entries/{playerId}.
   Ningún punto enviado desde el navegador participa en esta clasificación. */
(function () {
  'use strict';
  const Services=window.CrackTotalServices=window.CrackTotalServices||{};
  const scopes=['global','weekly','monthly','pasalache','pasala-duel','quiensabemas','mentiroso','top10','wordle'];
  const size=n=>Math.min(50,Math.max(1,Number.isInteger(n)?n:20));
  const unavailable=(scope,error)=>({ok:false,scope,items:[],updatedAt:null,live:false,
    source:'verified-firestore',message:'Ranking verificado no disponible.',error:String(error)});
  function entries(scope,limit) {
    if(!window.db) throw new Error('Firestore no disponible');
    // Server-created verified records only: filter BEFORE sorting/limiting.
    // Each scope is a single collection; matching composite index is declared
    // in firestore.indexes.json. Missing indexes fail closed (not fake scores).
    return window.db.collection('leaderboard_scopes').doc(scope)
      .collection('entries')
      .where('verified','==',true)
      .where('verifiedBy','==','server')
      .where('schemaVersion','==',1)
      .orderBy('score','desc')
      .orderBy('victories','desc')
      .orderBy('playerId','asc')
      .limit(size(limit));
  }
  function parse(snapshot,scope,limit,stream=false) {
    const items=[];
    let lastUpdated=null;
    snapshot.forEach(doc=>{
      const d=doc.data()||{};
      if(d.verified!==true||d.verifiedBy!=='server'||d.schemaVersion!==1||
         d.playerId!==doc.id||typeof d.playerId!=='string'||typeof d.name!=='string'||
         !Number.isSafeInteger(d.score)||d.score<0||d.score>100000000) return;
      // Field-level defense in depth: an unexpectedly malformed server
      // document must never make a competitive score or profile statistic.
      const numeric=(value,maximum)=>{
        if(value===undefined||value===null) return 0; // legacy verified rows
        return Number.isSafeInteger(value)&&value>=0&&value<=maximum ? value : null;
      };
      const gamesPlayed=numeric(d.gamesPlayed,10000000);
      const victories=numeric(d.victories,10000000);
      if(gamesPlayed===null||victories===null||
         (d.gamesPlayed!==undefined && victories>gamesPlayed)||
         d.name.trim().length===0||d.name.length>80||
         !/^[a-zA-Z0-9_-]{1,100}$/.test(d.playerId)) return;
      const modified=d.updatedAt?.toDate?.() || (typeof d.updatedAt==='string' ? new Date(d.updatedAt) : null);
      if(modified && Number.isFinite(modified.getTime()) && (!lastUpdated || modified>lastUpdated)) lastUpdated=modified;
      items.push({playerId:d.playerId,name:d.name.trim().slice(0,32),score:d.score,
        gamesPlayed,victories,meta:'Resultado validado'});
    });
    // Reapply identical ordering in case snapshots are mocked or cached.
    items.sort((a,b)=>b.score-a.score||b.victories-a.victories||
      a.playerId.localeCompare(b.playerId));
    items.length=Math.min(items.length,size(limit));
    items.forEach((x,i)=>{x.rank=i+1;});
    return {ok:true,scope,items,updatedAt:lastUpdated?lastUpdated.toISOString():null,
      live:stream && snapshot.metadata?.fromCache!==true,
      source:'verified-firestore',message:items.length?'':'Todavía no hay resultados verificados.'};
  }
  function getRanking(scope,limit=20) {
    if(!scopes.includes(scope))return Promise.resolve(unavailable(scope,'Ámbito inválido'));
    try{return entries(scope,limit).get().then(s=>parse(s,scope,limit,false))
      .catch(e=>unavailable(scope,e.message));}
    catch(e){return Promise.resolve(unavailable(scope,e.message));}
  }
  function subscribe(scope,cb,limit=20){
    if(typeof cb!=='function')throw new TypeError('Callback requerido');
    if(!scopes.includes(scope)){cb(unavailable(scope,'Ámbito inválido'));return ()=>{};}
    try{return entries(scope,limit).onSnapshot(s=>cb(parse(s,scope,limit,true)),
      e=>cb(unavailable(scope,e.message)));}
    catch(e){cb(unavailable(scope,e.message));return ()=>{};}
  }
  Services.RankingService={scopes:()=>scopes.slice(),getRanking,subscribe,
    getAll:async()=>Object.fromEntries((await Promise.all(scopes.map(scope=>getRanking(scope)))).map(x=>[x.scope,x]))};
})();
