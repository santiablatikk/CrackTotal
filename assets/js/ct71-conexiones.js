/* Conexiones Futboleras 7.1 — 16 names / four sourced groups.
 * Offline/local gameplay. NOT a competitive leaderboard or authoritative result.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const BANK='assets/data/conexiones-verified.json';
const SESSION='ct71:connections:session:v1';
const SEEN='ct71:connections:seen:v1';
const PROGRESS='ct7:local-progress:v1';
const COLORS=['cx-color-0','cx-color-1','cx-color-2','cx-color-3'];
let bank=[],state=null,volatile=null;
function read(store,key){try{return JSON.parse(store.getItem(key)||'null');}catch{return null;}}
function write(store,key,value){try{store.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function utc(){return new Date().toISOString().slice(0,10);}
function random(n){
 if(window.crypto?.getRandomValues){const x=new Uint32Array(1);window.crypto.getRandomValues(x);return x[0]%n;}
 return Math.floor(Math.random()*n);
}
function shuffle(xs){const a=xs.slice();for(let i=a.length-1;i>0;i--){const j=random(i+1);[a[j],a[i]]=[a[i],a[j]];}return a;}
function normalize(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function puzzle(){return bank.find(b=>b.id===state?.puzzleId);}
function save(){if(state)write(sessionStorage,SESSION,state);}
function announce(text){$('cxFeedback').textContent=text;}
function view(id){['cxStart','cxPlay','cxEnd'].forEach(k=>$(k).hidden=k!==id);}
function btn(name){
 const el=document.createElement('button');el.type='button';el.className='cx-tile';
 el.textContent=name;el.setAttribute('aria-pressed',String(state.selection.includes(name)));
 if(state.selection.includes(name))el.classList.add('is-selected');
 el.addEventListener('click',()=>select(name));return el;
}
function addGroup(root,group,index,reveal=false){
 const box=document.createElement('article');box.className='cx-group '+COLORS[index%4];
 const heading=document.createElement('h3');heading.textContent=group.title;
 const names=document.createElement('p');names.textContent=group.members.join(' · ');
 const link=document.createElement('a');link.href=group.source_url;link.target='_blank';link.rel='noopener noreferrer';
 link.textContent=reveal?'FUENTE OFICIAL · VERIFICAR ↗':'VER FUENTE FIFA / UEFA ↗';
 box.append(heading,names,link);root.appendChild(box);
}
function render(){
 if(!state)return;
 const b=puzzle();if(!b)return;
 if(state.phase==='end'){renderEnd();return;}
 view('cxPlay');
 $('cxEyebrow').textContent=b.eyebrow;
 $('cxBoardTitle').textContent=b.title;
 $('cxBrief').textContent=b.description;
 $('cxGroups').textContent=state.solved.length+'/4';
 $('cxPoints').textContent=String(state.score).padStart(4,'0');
 $('cxMistakes').textContent='● '.repeat(Math.max(0,4-state.mistakes)).trim()+
   (state.mistakes?' ○'.repeat(state.mistakes):'');
 const solved=$('cxSolved');solved.replaceChildren();
 const tiles=$('cxTiles');tiles.replaceChildren();
 b.groups.forEach((group,i)=>{
   if(state.solved.includes(group.id))addGroup(solved,group,i);
 });
 for(const name of state.tiles){
   const found=b.groups.find(g=>g.members.includes(name));
   if(!found||state.solved.includes(found.id))continue;
   tiles.appendChild(btn(name));
 }
 $('cxCheck').disabled=state.selection.length!==4;
 $('cxCheck').textContent='COMPROBAR GRUPO · '+state.selection.length+'/4';
 $('cxClear').disabled=state.selection.length===0;
 $('cxShuffle').disabled=tiles.children.length<=4;
}
function select(name){
 if(!state||state.phase!=='playing')return;
 const group=puzzle().groups.find(g=>g.members.includes(name));
 if(!group||state.solved.includes(group.id))return;
 const ix=state.selection.indexOf(name);
 if(ix>=0)state.selection.splice(ix,1);
 else if(state.selection.length<4)state.selection.push(name);
 else return;
 save();render();
}
function clear(){if(state?.phase!=='playing')return;state.selection=[];save();render();announce('Elegí otro cuarteto.');}
function mix(){if(state?.phase!=='playing')return;state.tiles=shuffle(state.tiles);save();render();announce('Tablero mezclado. Tus selecciones siguen marcadas.');}
function check(){
 if(state?.phase!=='playing'||state.selection.length!==4)return;
 const b=puzzle();let matched=null,best=0;
 for(const group of b.groups){
  if(state.solved.includes(group.id))continue;
  const count=group.members.filter(name=>state.selection.includes(name)).length;
  if(count===4)matched=group;best=Math.max(best,count);
 }
 if(matched){
  state.score+=Math.max(50,120-state.mistakes*10);
  state.solved.push(matched.id);
  state.selection=[];
  if(state.solved.length===4){end(true);return;}
  announce('Cuarteto correcto: '+matched.title+'. Seguís con '+(4-state.solved.length)+' grupos.');
 }else{
  state.mistakes++;
  state.selection=[];
  if(state.mistakes===4){end(false);return;}
  announce(best===3?'Te falta uno. Tres nombres pertenecían al mismo grupo.':
    'No es ese cuarteto. Quedan '+(4-state.mistakes)+' errores disponibles.');
 }
 save();render();
}
function progress(){
 const p=read(localStorage,PROGRESS);if(p&&p.version===1&&Array.isArray(p.history))return p;
 return volatile||{version:1,xp:0,rounds:0,correct:0,games:0,best:0,streak:0,
    lastDay:'',daily:{},recentIds:[],achievements:[],history:[]};
}
function commitResult(won){
 if(state.recorded)return;
 const p=progress();const amount=state.score;
 p.xp=Math.max(0,Number(p.xp)||0)+amount;
 p.games=Math.max(0,Number(p.games)||0)+1;
 p.rounds=Math.max(0,Number(p.rounds)||0)+4;
 p.correct=Math.max(0,Number(p.correct)||0)+state.solved.length;
 p.best=Math.max(0,Number(p.best)||0,amount);
 p.history=Array.isArray(p.history)?p.history:[];
 p.history.unshift({mode:'connections',scope:'local-only',date:utc(),won,
   points:amount,groups:state.solved.length,puzzleId:state.puzzleId});
 p.history=p.history.slice(0,60);
 volatile=p;write(localStorage,PROGRESS,p);
 let seen=read(localStorage,SEEN);if(!Array.isArray(seen))seen=[];
 if(!seen.includes(state.puzzleId))seen.push(state.puzzleId);
 write(localStorage,SEEN,seen.slice(-bank.length));
 state.recorded=true;save();
}
function end(won){
 state.phase='end';state.won=won;
 commitResult(won);renderEnd();
}
function renderEnd(){
 view('cxEnd');const b=puzzle();
 $('cxEndTitle').textContent=state.won?'LO DESCIFRASTE.':'EL ARCHIVO SE REVELA.';
 $('cxEndText').textContent=state.won?
   'Encontraste los cuatro cuartetos. El mérito es tuyo: cada vínculo corresponde a una final documentada.':
   'Llegaste al límite de errores. Acá están los cuartetos completos y sus fuentes para la próxima.';
 $('cxEndGroups').textContent=state.solved.length+'/4';
 $('cxEndPoints').textContent=String(state.score).padStart(4,'0');
 $('cxEndErrors').textContent=String(state.mistakes);
 const root=$('cxEndSources');root.replaceChildren();
 b.groups.forEach((g,i)=>addGroup(root,g,i,true));
}
function start(){
 if(!bank.length)return;
 let seen=read(localStorage,SEEN);if(!Array.isArray(seen))seen=[];
 const available=bank.filter(p=>!seen.includes(p.id));
 const candidates=available.length?available:bank;
 const chosen=candidates[random(candidates.length)];
 state={version:1,puzzleId:chosen.id,tiles:shuffle(chosen.groups.flatMap(g=>g.members)),
   selected:[],selection:[],solved:[],mistakes:0,score:0,phase:'playing',
   recorded:false,won:false};
 save();render();announce('Seleccioná cuatro nombres relacionados.');
}
function validate(data){
 if(data?.editorial_scope!=='men-senior-football'||!Array.isArray(data.puzzles)||!data.puzzles.length)
   throw Error('Archivo no válido');
 data.puzzles.forEach(p=>{
  if(!p.id||!Array.isArray(p.groups)||p.groups.length!==4)throw Error('Tablero incompleto');
  const names=p.groups.flatMap(g=>g.members);
  if(names.length!==16||new Set(names.map(normalize)).size!==16)throw Error('Nombres duplicados');
  for(const g of p.groups)if(g.members.length!==4||!/^https:\/\/(?:www\.fifa\.com|inside\.fifa\.com|www\.uefa\.com)/.test(g.source_url))
    throw Error('Cuarteto sin fuente');
 });
 return data.puzzles;
}
$('cxStartButton').addEventListener('click',start);
$('cxCheck').addEventListener('click',check);
$('cxClear').addEventListener('click',clear);
$('cxShuffle').addEventListener('click',mix);
$('cxAgain').addEventListener('click',start);
(async()=>{
 try{
  const response=await fetch(BANK,{cache:'no-cache'});
  if(!response.ok)throw Error('HTTP '+response.status);
  bank=validate(await response.json());
  $('cxStartButton').disabled=false;
  $('cxStartButton').textContent='ENTRAR AL ARCHIVO ↗';
  $('cxStartStatus').textContent=bank.length+' tableros verificados · Progreso guardado en este dispositivo';
  const saved=read(sessionStorage,SESSION);
  if(saved?.version===1&&bank.some(b=>b.id===saved.puzzleId)&&
    Array.isArray(saved.tiles)&&saved.tiles.length===16&&Array.isArray(saved.selection)&&
    Array.isArray(saved.solved)&&['playing','end'].includes(saved.phase)){
    state=saved;render();
  }else view('cxStart');
 }catch(error){
  $('cxStartStatus').textContent='No se pudo cargar el archivo. Revisá la conexión y volvé a abrir el juego.';
  $('cxStartButton').disabled=true;
  console.warn('Conexiones: catálogo no disponible',error);
 }
})();
})();
