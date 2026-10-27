'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const bank=JSON.parse(read('assets/data/timeline-verified.json'));
const engine=read('assets/js/ct7-timeline.js');
const html=read('ordena-historia.html'),css=read('assets/css/ct7-timeline.css');
assert.equal(bank.scope,'men-senior-official');
assert.equal(bank.rounds.length,5);
assert.equal(bank.rounds.flatMap(r=>r.events).length,20);
const ids=new Set();
for(const round of bank.rounds){
 assert(round.title&&round.deck&&round.events.length===4);
 assert(!ids.has(round.id),'Duplicate chronology ID');ids.add(round.id);
 assert.match(round.source_url,/^https:\/\/(?:www\.fifa\.com|es\.uefa\.com)\//);
 assert.equal(new Set(round.events.map(e=>e.year)).size,4,'Dates must be strictly ordered');
 assert.equal(new Set(round.events.map(e=>e.id)).size,4);
 for(const item of round.events){assert(Number.isInteger(item.year)&&item.year>=1930&&item.year<=2026);
  assert(item.label.length>15&&!/femenin|women|mujeres/i.test(item.label));}
}
for(const id of ['tlStart','tlPlay','tlAnswer','tlEnd','tlStartButton','tlRoundCounter','tlScore',
 'tlItems','tlCheck','tlSkip','tlNext','tlPoints','tlSource','tlEndStats','tlFeedback']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Missing/duplicate DOM id: '+id);
}
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(css,/max-width:355px/);
assert.match(css,/min-width:44px|44px/,'Touch targets must be at least 44 pixels');
assert(!/firebaseService|window\.db|leaderboard_scopes|\.innerHTML\s*=/.test(engine),
 'Timeline must never publish client XP to competitive rankings or inject raw HTML');
assert.match(engine,/scope:'local-only'/);
class Storage{
 constructor(){this.m=new Map();}
 getItem(key){return this.m.has(key)?this.m.get(key):null;}
 setItem(key,value){this.m.set(key,String(value));}
 removeItem(key){this.m.delete(key);}
}
class El{
 constructor(tag){this.tag=tag;this.id=tag;this.children=[];this.dataset={};this.style={};
  this.hidden=false;this.disabled=false;this.textContent='';this.callbacks={};this.attrs={};this.parent=null;}
 append(...children){for(const item of children){item.parent=this;this.children.push(item);}}
 appendChild(item){this.append(item);}
 replaceChildren(){this.children=[];}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(type,fn){this.callbacks[type]=fn;}
 click(){assert(this.callbacks.click,'No click bound for '+this.id);this.callbacks.click({preventDefault(){}});}
 focus(){}
 closest(selector){
  if(selector==='li'){let node=this;while(node&&node.tag!=='li')node=node.parent;return node;}
  if(selector==='button[data-direction]'){let node=this;
   while(node&&!(node.tag==='button'&&Object.hasOwn(node.dataset,'direction')))node=node.parent;return node;}
  return null;
 }
}
const localStorage=new Storage(),sessionStorage=new Storage();
async function load(){
 const elements=new Map();
 const document={getElementById(id){if(!elements.has(id))elements.set(id,new El(id));return elements.get(id);},
  createElement(tag){return new El(tag);}};
 const ctx={document,window:{},localStorage,sessionStorage,
  fetch:async()=>({ok:true,json:async()=>bank}),Date,Promise,Error,
  Set,Map,Math,Number,String,JSON,Array,Object,Uint32Array,console};
 vm.runInNewContext(engine,ctx,{filename:'ct7-timeline.js'});
 await new Promise(done=>setImmediate(done));
 return elements;
}
function el(e,id){let x=e.get(id);assert(x,'Node missing '+id);return x;}
function state(){return JSON.parse(sessionStorage.getItem('ct7:timeline:session:v1'));}
function reorder(e){
 const round=bank.rounds.find(r=>r.id===state().roundIds[state().idx]);
 assert(round);const expected=round.events.slice().sort((a,b)=>a.year-b.year).map(x=>x.id);
 for(let i=0;i<4;i++){
  let current=state().order.indexOf(expected[i]);
  while(current>i){
   const row=el(e,'tlItems').children.find(x=>x.dataset.eventId===expected[i]);
   const up=row.children[2].children[0];
   assert.equal(up.dataset.direction,'-1');
   el(e,'tlItems').callbacks.click({target:up});
   current--;
  }
 }
 assert.deepEqual(state().order,expected,'Simulated arrow click order must match sourced chronology');
}
(async()=>{
 let e=await load();
 assert.equal(el(e,'tlStartButton').disabled,false,'Official bank not initialized');
 el(e,'tlStartButton').click();
 for(let i=0;i<5;i++){
  assert.equal(state().idx,i);
  assert.equal(el(e,'tlPlay').hidden,false);
  assert.equal(el(e,'tlItems').children.length,4);
  reorder(e);
  el(e,'tlCheck').click();
  assert.equal(state().lastResult.points,500,'Four correct positions + complete bonus = 500');
  assert.equal(el(e,'tlAnswer').hidden,false);
  assert.match(el(e,'tlSource').href,/^https:\/\//);
  if(i===0){
   const xp=JSON.parse(localStorage.getItem('ct7:local-progress:v1')).xp;
   e=await load(); // Real reload-equivalent. Confirm that score cannot duplicate.
   assert.equal(el(e,'tlAnswer').hidden,false);
   assert.equal(JSON.parse(localStorage.getItem('ct7:local-progress:v1')).xp,xp);
  }
  el(e,'tlNext').click();
 }
 assert.equal(state().score,2500);
 assert.equal(state().perfect,5);
 assert.equal(state().correctPositions,20);
 assert.equal(el(e,'tlEnd').hidden,false);
 const p=JSON.parse(localStorage.getItem('ct7:local-progress:v1'));
 assert.equal(p.history.filter(h=>h.mode==='timeline').length,5);
 assert(p.history.every(h=>h.scope==='local-only'));
 assert.equal(p.games,1);
 assert(p.achievements.includes('explorador'));
 e=await load();
 assert.equal(el(e,'tlEnd').hidden,false);
 assert.equal(JSON.parse(localStorage.getItem('ct7:local-progress:v1')).games,1);
 console.log('CT7 TIMELINE PASS: 20 factual events, 5 sorted puzzles, real arrow moves, 500-point scoring, reload idempotence, zero Firebase, local medal');
})().catch(e=>{console.error(e);process.exitCode=1});
