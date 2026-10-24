'use strict';
/* Remote staging deployment contract: exact commit, rendered routes, offline manifest.
 * Does not access Crack Total production or touch any Firestore user data.
 */
const assert=require('node:assert/strict');
const ROOT='https://cracktotal-arena-staging.onrender.com';
const SHA=process.env.GITHUB_SHA||process.env.CT_EXPECTED_STAGING_SHA;
assert.match(SHA||'',/^[a-f0-9]{40}$/,'Release SHA must be pinned');
const sleep=t=>new Promise(done=>setTimeout(done,t));
async function get(file) {
 const response=await fetch(ROOT+file,{redirect:'manual',headers:{'Cache-Control':'no-cache'},
   signal:AbortSignal.timeout(15000)});
 assert.equal(response.status,200,'Expected 200 for '+file+' instead of '+response.status);
 assert.equal(new URL(response.url).origin,ROOT,'Unexpected redirect '+file);
 const body=await response.text();
 assert(body.length>20,'Empty asset '+file);
 return body;
}
(async()=>{
 let ready=false,last='';
 for(let step=0;step<75;step++){
  try{
   const health=JSON.parse(await get('/__ct_staging/health'));
   if(health.commit===SHA&&health.arenaProtocol==='cracktotal-arena-5.2'&&health.features?.pasalaDuel===true){
      ready=true;break;
   }
   last='Different SHA '+health.commit;
  }catch(error){last=String(error.message||error)}
  await sleep(4000);
 }
 assert(ready,'Render never deployed expected SHA '+SHA+'; last='+last);
 console.log('EXACT REMOTE CT7.1 SHA '+SHA);
 const expected={
 '/conexiones.html':['ct71-conexiones.js','ct71-conexiones.css','ct7-pwa.js','CONE'],
 '/quien-soy.html':['ct7-games.js','ct7-pwa.js'],
 '/adivina-carrera.html':['ct7-games.js','ct7-pwa.js'],
 '/ordena-historia.html':['ct7-timeline.js','ct7-pwa.js'],
 '/assets/js/ct71-conexiones.js':['ct71:connections:session:v1','local-only'],
 '/assets/css/ct71-conexiones.css':['prefers-reduced-motion','max-width:355px'],
 '/assets/data/conexiones-verified.json':['men-senior-football','2026-10-24'],
 '/assets/js/ct7-pwa.js':['serviceWorker.register','CT7_ACTIVATE_UPDATE'],
 '/sw.js':['ct7-offline-','/conexiones.html','if(!PATHS.has(path))return'],
 '/games.html':['conexiones.html','ct71-catalog-connections'],
 '/profile.html':['ct7-pwa.js','ct7-profile.js'],
 '/':['conexiones.html','CT7']
 };
 for(const [file,tokens] of Object.entries(expected)){
  const body=await get(file);
  for(const token of tokens)assert(body.includes(token),file+' missing '+token);
  console.log('REMOTE ASSET OK '+file);
 }
 const manifest=JSON.parse(await get('/config/manifest.json'));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');
 assert(manifest.shortcuts.some(s=>s.url==='/conexiones.html'));
 assert(!JSON.stringify(manifest).includes('push-notifications'));
 const bank=JSON.parse(await get('/assets/data/conexiones-verified.json'));
 assert.equal(bank.puzzles.length,2);
 assert(bank.puzzles.every(p=>p.groups.length===4&&p.groups.every(g=>g.members.length===4)));
 const svg=await get('/assets/icons/ct7-app.svg');
 assert(svg.includes('<svg')&&svg.includes('CRACK')===false,'Unexpected generic logo');
 console.log('PASS REMOTE CT7.1: install assets, four offline solo modes, game catalogue and sourced puzzles');
})().catch(error=>{console.error(error);process.exitCode=1});
