'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const data=JSON.parse(read('assets/data/conexiones-verified.json'));
const code=read('assets/js/ct71-conexiones.js');
const html=read('conexiones.html'),css=read('assets/css/ct71-conexiones.css');
assert.equal(data.editorial_scope,'men-senior-football');
assert.equal(data.puzzles.length,2);
for(const board of data.puzzles){
 assert(board.id&&board.title&&board.groups.length===4);
 const all=[];
 for(const group of board.groups){
  assert.equal(group.members.length,4);
  assert.equal(group.verified_at,'2026-10-24');
  assert.match(group.source_url,/^https:\/\/(?:www\.fifa\.com|inside\.fifa\.com|www\.uefa\.com)\//);
  all.push(...group.members);
 }
 const normalized=all.map(s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
 assert.equal(new Set(normalized).size,16,'Ambiguous tile labels: '+board.id);
}
for(const id of ['cxStart','cxPlay','cxEnd','cxStartButton','cxTiles','cxSolved','cxCheck',
 'cxClear','cxShuffle','cxFeedback','cxMistakes','cxGroups','cxPoints','cxEndSources','cxAgain']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Missing DOM '+id);
}
assert(html.includes('ct71-conexiones.js')&&html.includes('ct71-conexiones.css'));
assert.match(css,/max-width:355px/);assert.match(css,/prefers-reduced-motion:reduce/);
assert(!/firebaseService|leaderboard_scopes|window\.db|\.innerHTML\s*=/.test(code),
 'Unverified local games must never write authoritative rankings or inject HTML');
class Store{
 constructor(){this.m=new Map();}
 getItem(k){return this.m.has(k)?this.m.get(k):null;}
 setItem(k,v){this.m.set(k,String(v));}
}
class El{
 constructor(id){this.id=id;this.children=[];this.events={};this.attrs={};this.textContent='';
 this.hidden=false;this.disabled=false;this.href='';this.type='';this.className='';
 this.classList={add(){},remove(){}};}
 addEventListener(n,fn){this.events[n]=fn;}
 setAttribute(n,v){this.attrs[n]=String(v);}
 replaceChildren(...items){this.children=items;}
 append(...items){this.children.push(...items);}
 appendChild(item){this.children.push(item);}
 click(){const cb=this.events.click;assert(cb,'No click handler '+this.id);cb({preventDefault(){}});}
}
const localStorage=new Store(),sessionStorage=new Store();
const map=new Map();
const document={
 getElementById(id){if(!map.has(id))map.set(id,new El(id));return map.get(id)},
 createElement(type){return new El(type)}
};
const get=id=>document.getElementById(id);
const win={crypto:{getRandomValues(a){a[0]=0;return a}}};
vm.runInNewContext(code,{document,window:win,
 localStorage,sessionStorage,
 fetch:async()=>({ok:true,json:async()=>data}),Date,Uint32Array,Promise,Math,Number,Array,JSON,Set,Map,
 URL,Error,console:{warn(){}}});
const next=()=>new Promise(done=>setTimeout(done,0));
function state(){return JSON.parse(sessionStorage.getItem('ct71:connections:session:v1'));}
function select(names){
 for(const n of names){
  const b=get('cxTiles').children.find(x=>x.textContent===n);
  assert(b,'Missing active tile '+n);b.click();
 }
}
function check(){assert.equal(get('cxCheck').disabled,false);get('cxCheck').click();}
(async()=>{
 await next();
 assert.equal(get('cxStartButton').disabled,false);
 get('cxStartButton').click();
 assert.equal(get('cxTiles').children.length,16);
 const board=data.puzzles.find(p=>p.id===state().puzzleId);
 // Real button clicks, one error with a meaningful near-match notice.
 const bad=[...board.groups[0].members.slice(0,3),board.groups[1].members[0]];
 select(bad);check();assert.equal(state().mistakes,1);
 assert.match(get('cxFeedback').textContent,/Te falta uno/);
 for(const group of board.groups){
  select(group.members);check();
 }
 assert.equal(state().phase,'end');
 assert.equal(get('cxEndSources').children.length,4);
 assert.equal(state().solved.length,4);
 assert(state().score>=200);
 let saved=JSON.parse(localStorage.getItem('ct7:local-progress:v1'));
 assert.equal(saved.history[0].scope,'local-only');
 assert.equal(saved.history[0].mode,'connections');
 const xp=saved.xp;
 // Move to unplayed board and deliberately lose. Reveal all sources.
 get('cxAgain').click();
 const other=data.puzzles.find(x=>x.id===state().puzzleId);
 assert.notEqual(other.id,board.id,'Unplayed sourced board must be selected first');
 for(let n=0;n<4;n++){
  const mixed=other.groups.map(g=>g.members[n%4]);
  select(mixed);check();
 }
 assert.equal(state().phase,'end');assert.equal(state().won,false);
 assert.equal(get('cxEndSources').children.length,4);
 saved=JSON.parse(localStorage.getItem('ct7:local-progress:v1'));
 assert.equal(saved.history.filter(h=>h.mode==='connections').length,2);
 assert(saved.history.every(h=>h.scope==='local-only'));
 assert.equal(saved.xp,xp,'Failed attempts cannot invent competitive or local points');
 console.log('CT7.1 Conexiones PASS: 32 documented tiles, actual clicks, 3-of-4 hint, victory, loss, sources and local-only history');
})().catch(error=>{console.error(error);process.exitCode=1});
