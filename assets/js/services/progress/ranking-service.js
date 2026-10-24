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
    return window.db.collection('leaderboard_scopes').doc(scope)
      .collection('entries').orderBy('score','desc').limit(size(limit));
  }
  function parse(snapshot,scope,limit,stream=false) {
    const items=[];
    let lastUpdated=null;
    snapshot.forEach(doc=>{
      const d=doc.data()||{};
      if(d.verified!==true||d.verifiedBy!=='server'||d.schemaVersion!==1||
         d.playerId!==doc.id||typeof d.playerId!=='string'||typeof d.name!=='string'||
         !Number.isSafeInteger(d.score)||d.score<0||d.score>100000000) return;
      const modified=d.updatedAt?.toDate?.() || (typeof d.updatedAt==='string' ? new Date(d.updatedAt) : null);
      if(modified && Number.isFinite(modified.getTime()) && (!lastUpdated || modified>lastUpdated)) lastUpdated=modified;
      items.push({playerId:d.playerId,name:d.name.slice(0,32),score:d.score,
        gamesPlayed:Math.max(0,Number(d.gamesPlayed)||0),
        victories:Math.max(0,Number(d.victories)||0),meta:'Resultado validado'});
    });
    items.sort((a,b)=>b.score-a.score||b.victories-a.victories||
      a.name.localeCompare(b.name,'es')||a.playerId.localeCompare(b.playerId));
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
