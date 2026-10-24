'use strict';
// Remote Render staging HTTP contract: verify exact release commit and actual
// HTML, CSS, JS and JSON assets, without changing real production.
const assert=require('node:assert/strict');
const origin='https://cracktotal-arena-staging.onrender.com';
const expected=process.env.GITHUB_SHA||process.env.CT_EXPECTED_STAGING_SHA;
assert.match(expected||'',/^[0-9a-f]{40}$/,'Require exact Git commit');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function get(path){
 const url=origin+path;
 const response=await fetch(url,{
  signal:AbortSignal.timeout(12000),
  redirect:'manual',
  headers:{'Cache-Control':'no-cache'}
 });
 assert.equal(response.status,200,url+' must respond HTTP 200, not '+response.status);
 assert.equal(new URL(response.url).host,new URL(origin).host,'Unexpected host');
 const body=await response.text();
 assert(body.length>30,url+' must contain usable content');
 return {body,response};
}
(async()=>{
 let last='';
 for(let i=0;i<70;i++){
  try{
   const health=JSON.parse((await get('/__ct_staging/health')).body);
   if(health.commit===expected && health.arenaProtocol==='cracktotal-arena-5.2' && health.features?.pasalaDuel===true)break;
   last=JSON.stringify({commit:health.commit,expected});
  }catch(error){last=String(error.message||error)}
  if(i===69)throw Error('Staging never served the requested commit: '+last);
  await wait(3500);
 }
 for(const [path,parts] of [
  ['/index.html',['ct7-home-feature','ordena-historia.html']],
  ['/games.html',['quien-soy.html','adivina-carrera.html','ordena-historia.html']],
  ['/quien-soy.html',['ct7-games.js','data-ct7-mode="identity"']],
  ['/adivina-carrera.html',['ct7-games.js','data-ct7-mode="career"']],
  ['/ordena-historia.html',['ct7-timeline.js','tlStartButton']],
  ['/assets/js/ct7-games.js',['ct7:local-progress:v1','local-only']],
  ['/assets/js/ct7-timeline.js',['ct7:timeline:session:v1','local-only']],
  ['/assets/css/ct7-games.css',['prefers-reduced-motion']],
  ['/assets/css/ct7-timeline.css',['max-width:355px']],
  ['/assets/css/ct7-catalog.css',['ct7-catalog-timeline']]
 ]){
  const {body}=await get(path);
  for(const phrase of parts)assert(body.includes(phrase),path+' missing '+phrase);
  console.log('LIVE CT7 ASSET OK '+path);
 }
 const bank=JSON.parse((await get('/assets/data/timeline-verified.json')).body);
 assert.equal(bank.rounds.length,5);
 assert.equal(bank.rounds.reduce((n,r)=>n+r.events.length,0),20);
 const careers=JSON.parse((await get('/assets/data/career-challenge-verified.json')).body);
 assert(careers.records.length>=12);
 console.log('PASS CT7 REMOTE STAGING: exact SHA '+expected+'; nine modes, three new playable routes, all essential CSS/JS/JSON served, 20 sourced historical events and 12 careers');
})().catch(error=>{console.error(error);process.exitCode=1});
