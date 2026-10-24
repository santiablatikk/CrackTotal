'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const dataset=JSON.parse(read('assets/data/career-challenge-verified.json'));
const engine=read('assets/js/ct7-games.js');
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
assert.equal(dataset.editorial_scope,'male-senior-football');
assert(dataset.records.length>=12,'At least twelve traceable career dossiers');
const ids=new Set(),aliases=new Map();
for(const item of dataset.records){
  assert(!ids.has(item.id),'Duplicate player ID: '+item.id);ids.add(item.id);
  assert(item.name&&item.clubs.length>=2&&item.hints.length===4);
  assert.equal(item.verified_at,'2026-10-24');
  assert(Array.isArray(item.aliases)&&item.source_urls.length>=1);
  assert(!/women|femenin|mujeres/i.test(JSON.stringify(item)));
  item.source_urls.forEach(u=>assert(/^https:\/\/(?:www\.fifa\.com|inside\.fifa\.com|publications\.fifa\.com|www\.uefa\.com|es\.uefa\.com)\//.test(u),item.id+' unofficial source'));
  for(const name of [item.name,...item.aliases]){
    const key=normalize(name);
    assert(key);
    assert(!aliases.has(key)||aliases.get(key)===item.id,'Ambiguous accepted alias "'+name+'" for '+item.id+' and '+aliases.get(key));
    aliases.set(key,item.id);
  }
}
const htmlIds=['startButton','roundLabel','scoreLabel','roundProgress','roundProgressFill',
 'startView','playView','answerView','finishView','revealLabel','attemptsLabel','questionHeading',
 'clueList','revealButton','guessForm','guessInput','gameFeedback','passButton','answerState',
 'answerName','answerText','answerPoints','answerSource','nextButton','finishHeading',
 'finishSummary','finishNumbers','againButton','localXp','localWins','localStreak',
 'missionProgress','dailyMission','missionCounter'];
for(const [file,mode] of [['quien-soy.html','identity'],['adivina-carrera.html','career']]){
  const html=read(file);
  assert(html.includes('data-ct7-mode="'+mode+'"'));
  assert(html.includes('assets/js/ct7-games.js')&&html.includes('assets/css/ct7-games.css'));
  for(const id of htmlIds) assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,file+' ID '+id);
}
assert(!/firebaseService|window\.db|leaderboard_scopes|\.innerHTML\s*=/.test(engine),
  'Client-only XP cannot publish to server leaderboards or inject HTML');
assert(engine.includes("scope: 'local-only'"));
assert(read('games.html').includes('href="quien-soy.html"'));
assert(read('games.html').includes('href="adivina-carrera.html"'));
assert.match(read('assets/css/ct7-games.css'),/prefers-reduced-motion:reduce/);
assert.match(read('assets/css/ct7-games.css'),/max-width:360px/);
assert.match(read('assets/css/ct7-games.css'),/\.ct7-screen\[hidden\]\{display:none!important\}/);

class Storage {
  constructor(){this.data=new Map();}
  getItem(k){return this.data.has(k)?this.data.get(k):null;}
  setItem(k,v){this.data.set(k,String(v));}
}
class El {
  constructor(id){this.id=id;this.style={};this.hidden=false;this.disabled=false;
    this.value='';this.textContent='';this.href='';this.children=[];this.callbacks={};this.attrs={};}
  addEventListener(event,fn){this.callbacks[event]=fn;}
  click(){const fn=this.callbacks.click;assert.equal(typeof fn,'function',this.id+' must have click handler');fn({preventDefault(){}});}
  submit(){const fn=this.callbacks.submit;assert.equal(typeof fn,'function','Form must submit');fn({preventDefault(){}});}
  replaceChildren(){this.children=[];}
  appendChild(child){this.children.push(child);}
  append(...children){this.children.push(...children);}
  setAttribute(k,v){this.attrs[k]=v;}
  focus(){}
  select(){}
}
const localStorage=new Storage(),sessions={identity:new Storage(),career:new Storage()};
async function load(mode){
  const elements=new Map();
  const document={
    body:{dataset:{ct7Mode:mode}},
    getElementById(id){if(!elements.has(id))elements.set(id,new El(id));return elements.get(id);},
    createElement:()=>new El('generated')
  };
  const window={};
  const context={document,window,fetch:async()=>({ok:true,json:async()=>dataset}),Date,
    localStorage,sessionStorage:sessions[mode],Uint32Array,Map,Set,Math,JSON,
    Promise,Error,Number,String,Array,Object,console};
  vm.runInNewContext(engine,context,{filename:'ct7-games.js'});
  await new Promise(resolve=>setImmediate(resolve));
  return elements;
}
function el(e,id){const item=e.get(id);assert(item,'Missing '+id);return item;}
function playRound(e,mode,wrong=false){
  const saved=JSON.parse(sessions[mode].getItem('ct7:session:'+mode+':v1'));
  const current=dataset.records.find(p=>p.id===saved.order[saved.index]);
  assert(current);
  if(wrong){
    el(e,'guessInput').value='Esta persona no existe';
    el(e,'guessForm').submit();
    assert.match(el(e,'gameFeedback').textContent,/quedan 2 intentos/);
    el(e,'revealButton').click();
  }
  el(e,'guessInput').value=current.name;
  el(e,'guessForm').submit();
  assert.equal(el(e,'answerView').hidden,false,'Answer must be revealed after valid correct guess');
  assert.match(el(e,'answerSource').href,/^https:/);
  return current;
}
async function scenario(mode){
  let e=await load(mode);
  assert.equal(el(e,'startButton').disabled,false,'Bank should load');
  el(e,'startButton').click();
  assert.equal(el(e,'playView').hidden,false,'Start must reveal game');
  assert(el(e,'clueList').children.length>=2,'Clues must actually render');
  playRound(e,mode,true);
  const prior=JSON.parse(localStorage.getItem('ct7:local-progress:v1'));
  const xp=prior.xp;
  assert(xp>0,'Correct round grants local XP');
  // Reopen the same page; answer state must restore without duplicate rewards.
  e=await load(mode);
  assert.equal(el(e,'answerView').hidden,false,'Session should restore result');
  assert.equal(JSON.parse(localStorage.getItem('ct7:local-progress:v1')).xp,xp,
    'Reload must not duplicate points');
  for(let i=1;i<6;i++){
    el(e,'nextButton').click();
    assert.equal(el(e,'playView').hidden,false);
    playRound(e,mode);
  }
  el(e,'nextButton').click();
  assert.equal(el(e,'finishView').hidden,false);
  assert.match(el(e,'finishSummary').textContent,/6 jugadores identificados/);
  const p=JSON.parse(localStorage.getItem('ct7:local-progress:v1'));
  assert.equal(p.history.filter(x=>x.mode===mode).length,6);
  assert(p.history.every(x=>x.scope==='local-only'));
  assert(p.achievements.includes('explorador'),'Local 3-round mission unlocks');
  assert.equal(el(e,'missionCounter').textContent,'3 / 3 RONDAS');
  const games=p.games;
  const reopened=await load(mode);
  assert.equal(el(reopened,'finishView').hidden,false);
  assert.equal(JSON.parse(localStorage.getItem('ct7:local-progress:v1')).games,games,
    'Reload must not double-record completed match');
  return p;
}
(async()=>{
  const p1=await scenario('identity');
  assert.equal(p1.correct,6);
  const p2=await scenario('career');
  assert.equal(p2.correct,12);
  assert.equal(p2.games,2);
  assert.equal(p2.rounds,12);
  console.log('CT7 PASS: sourced/unique football dossiers; two modes; 12 playable rounds; clues; correct/incorrect; accessible UI; refresh/idempotence; local-only XP and daily medal.');
})().catch(e=>{console.error(e);process.exitCode=1});
