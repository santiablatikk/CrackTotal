/* Ordená la historia — timeline match logic (source-backed, client-only).
   No verified ranking writes and no automated answer guessing. */
(function(){
'use strict';
const get=id=>document.getElementById(id);
const DATA='assets/data/timeline-verified.json';
const PROGRESS='ct7:local-progress:v1';
const SESSION='ct7:timeline:session:v1';
let rounds=[],map=new Map(),state=null,volatile=null;
function stored(storage,key){try{return JSON.parse(storage.getItem(key)||'null');}catch{return null;}}
function put(storage,key,value){try{storage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function progress(){const p=stored(localStorage,PROGRESS);return p?.version===1?p:volatile||{
 version:1,xp:0,rounds:0,correct:0,games:0,best:0,streak:0,lastDay:'',daily:{},recentIds:[],achievements:[],history:[]
};}
function saveProgress(p){volatile=p;put(localStorage,PROGRESS,p);}
function save(){if(state)put(sessionStorage,SESSION,state);}
function day(){return new Date().toISOString().slice(0,10);}
function daysBetween(a,b){return Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);}
function rand(n){if(window.crypto?.getRandomValues){const a=new Uint32Array(1);window.crypto.getRandomValues(a);return a[0]%n;}return Math.floor(Math.random()*n);}
function shuffle(xs){const a=xs.slice();for(let i=a.length-1;i>0;i--){let j=rand(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function board(){return state&&map.get(state.roundIds[state.idx]);}
function view(name){for(const id of ['tlStart','tlPlay','tlAnswer','tlEnd'])get(id).hidden=id!==name;}
function status(text){get('tlFeedback').textContent=text;}
function header(){
const index=state?Math.min(state.idx+1,5):0;
const completed=state?state.idx+(state.phase==='answer'||state.phase==='end'?1:0):0;
get('tlRoundCounter').textContent='ARCHIVO '+String(index).padStart(2,'0')+' / 05';
get('tlScore').textContent=String(state?.score||0).padStart(4,'0')+' PTS';
get('tlTrack').setAttribute('aria-valuenow',String(Math.min(5,completed)));
get('tlTrackFill').style.width=(completed/5*100)+'%';
get('tlCurrent').textContent=index+'/5';
get('tlPerfect').textContent=String(state?.perfect||0);
get('tlXp').textContent=String(progress().xp||0);
}
function list(){
const round=board(),container=get('tlItems');
container.replaceChildren();
for(let i=0;i<state.order.length;i++){
 const e=round.events.find(x=>x.id===state.order[i]);
 const row=document.createElement('li');row.className='ct7-tl-card';row.tabIndex=0;row.dataset.eventId=e.id;
 const idx=document.createElement('span');idx.className='ct7-tl-card-index';idx.textContent=String(i+1).padStart(2,'0');
 const label=document.createElement('span');label.className='ct7-tl-card-label';label.textContent=e.label;
 const controls=document.createElement('span');controls.className='ct7-tl-controls';
 const up=document.createElement('button');up.type='button';up.className='ct7-tl-shift';up.dataset.direction='-1';
 up.setAttribute('aria-label','Subir '+e.label+' una posición');up.textContent='↑';up.disabled=i===0;
 const down=document.createElement('button');down.type='button';down.className='ct7-tl-shift';down.dataset.direction='1';
 down.setAttribute('aria-label','Bajar '+e.label+' una posición');down.textContent='↓';down.disabled=i===state.order.length-1;
 controls.append(up,down);row.append(idx,label,controls);container.appendChild(row);
 }
 get('tlMoveCounter').textContent=state.moves+' MOVIMIENTOS';
}
function move(id,delta){
 if(!state||state.phase!=='play')return;
 const from=state.order.indexOf(id),to=from+delta;
 if(from<0||to<0||to>=state.order.length)return;
 [state.order[from],state.order[to]]=[state.order[to],state.order[from]];
 state.moves++;list();save();
 const row=[...get('tlItems').children].find(x=>x.dataset.eventId===id);
 if(row)row.focus({preventScroll:true});
 status('Posición '+(to+1)+' de '+state.order.length+'.');
}
function play(){
const r=board();if(!r){finish();return;}
state.phase='play';view('tlPlay');header();
get('tlChapter').textContent=String(state.idx+1).padStart(2,'0')+' / EL ARCHIVO';
get('tlTitle').textContent=r.title;
get('tlDescription').textContent=r.deck;
get('tlCheck').disabled=false;get('tlSkip').disabled=false;
list();status('Usá las flechas de cada tarjeta para moverla.');save();
}
function trackResult(points,exact){
const p=progress(),now=day();
if(!p.daily||typeof p.daily!=='object')p.daily={};
if(!Array.isArray(p.history))p.history=[];
if(!Array.isArray(p.achievements))p.achievements=[];
if(p.lastDay!==now){p.streak=p.lastDay&&daysBetween(p.lastDay,now)===1?(p.streak||0)+1:1;p.lastDay=now;}
if(!p.daily[now])p.daily[now]={rounds:0,correct:0};
p.daily[now].rounds+=1;
p.daily[now].correct+=exact?1:0;
p.rounds=(p.rounds||0)+1;
if(exact)p.correct=(p.correct||0)+1;
p.xp=(p.xp||0)+Math.floor(points/10);
p.history.unshift({id:board().id,mode:'timeline',won:exact,points,date:now,scope:'local-only'});
p.history.length=Math.min(60,p.history.length);
if(p.daily[now].rounds>=3&&!p.achievements.includes('explorador'))p.achievements.push('explorador');
if(p.correct>=10&&!p.achievements.includes('observador'))p.achievements.push('observador');
saveProgress(p);
}
function answer(skipped=false){
if(!state||state.phase!=='play')return;
const r=board(),sorted=r.events.slice().sort((a,b)=>a.year-b.year);
const hit=skipped?0:state.order.reduce((n,id,i)=>n+(sorted[i].id===id?1:0),0);
const full=hit===4,points=skipped?0:hit*80+(full?180:0);
state.score+=points;state.correctPositions+=hit;
if(full)state.perfect++;
state.phase='answer';state.lastResult={hit,points,skipped};
trackResult(points,full);save();
view('tlAnswer');header();
get('tlAnswerState').textContent=skipped?'RONDA SALTADA':full?'ORDEN PERFECTO':hit+' DE 4 POSICIONES CORRECTAS';
get('tlAnswerTitle').textContent=full?'SIN CAMBIAR UNA COMA.':skipped?'ACÁ ESTABA LA CLAVE.':'ASÍ FUE LA HISTORIA.';
get('tlAnswerDesc').textContent=r.title+'. Estos son los años reales, del primero al último.';
get('tlPoints').textContent='+'+points+' PTS LOCALES';
const target=get('tlCorrectOrder');target.replaceChildren();
sorted.forEach((e,i)=>{
 const li=document.createElement('li'),rank=document.createElement('strong'),desc=document.createElement('span'),year=document.createElement('time');
 rank.textContent=String(i+1).padStart(2,'0');desc.textContent=e.label;year.textContent=String(e.year);year.dateTime=String(e.year);
 li.append(rank,desc,year);target.appendChild(li);
});
get('tlSource').href=r.source_url;
get('tlSource').textContent='FUENTE: '+r.source_label.toUpperCase()+' ↗';
get('tlNext').textContent=state.idx>=4?'VER RESULTADOS ↗':'SIGUIENTE ARCHIVO ↗';
get('tlNext').focus({preventScroll:true});
}
function finish(){
if(!state)return;
if(state.phase!=='end'){
 const p=progress();p.games=(p.games||0)+1;p.best=Math.max(p.best||0,state.score);saveProgress(p);
}
state.phase='end';save();view('tlEnd');header();
get('tlEndTitle').textContent=state.perfect>=4?'MEMORIA DE CAMPEÓN.':state.perfect>=2?'BUENA MEMORIA.':'HAY HISTORIA POR REPASAR.';
get('tlEndMessage').textContent=state.correctPositions+' posiciones correctas de 20. '+state.perfect+' cronologías perfectas. Tu puntaje es local; no participa de rankings competitivos.';
const target=get('tlEndStats');target.replaceChildren();
[['PUNTOS',state.score],['POSICIONES',state.correctPositions+'/20'],['PERFECTAS',state.perfect+'/5']].forEach(([k,v])=>{
 const section=document.createElement('div'),label=document.createElement('span'),number=document.createElement('strong');
 label.textContent=k;number.textContent=v;section.append(label,number);target.appendChild(section);
});
}
function begin(){
const order=shuffle(rounds).map(x=>x.id);
state={version:1,roundIds:order,idx:0,score:0,perfect:0,correctPositions:0,
 order:shuffle(map.get(order[0]).events.map(x=>x.id)),moves:0,phase:'play',lastResult:null};
play();
}
function next(){
if(!state||state.phase!=='answer')return;
if(state.idx===4){finish();return;}
state.idx++;
state.order=shuffle(board().events.map(x=>x.id));state.moves=0;state.lastResult=null;
play();
}
function restore(){
const old=stored(sessionStorage,SESSION);
if(!old||old.version!==1||!Array.isArray(old.roundIds)||old.roundIds.length!==5||
new Set(old.roundIds).size!==5||old.roundIds.some(id=>!map.has(id))||
!Number.isInteger(old.idx)||old.idx<0||old.idx>4||!Number.isInteger(old.score)||old.score<0||
!Number.isInteger(old.perfect)||old.perfect<0||old.perfect>5||
!Number.isInteger(old.correctPositions)||old.correctPositions<0||old.correctPositions>20||
!Array.isArray(old.order)||old.order.length!==4||new Set(old.order).size!==4||
old.order.some(id=>!map.get(old.roundIds[old.idx]).events.some(e=>e.id===id))||
!Number.isInteger(old.moves)||old.moves<0||!['play','answer','end'].includes(old.phase))return false;
state=old;
if(state.phase==='play')play();
else if(state.phase==='answer'){
 // One-shot result persists. Never count it twice after a reload.
 const r=board(),sorted=r.events.slice().sort((a,b)=>a.year-b.year),last=state.lastResult||{hit:0,points:0,skipped:true};
 view('tlAnswer');header();
 get('tlAnswerState').textContent=last.skipped?'RONDA SALTADA':last.hit===4?'ORDEN PERFECTO':last.hit+' DE 4 POSICIONES CORRECTAS';
 get('tlAnswerTitle').textContent=last.hit===4?'SIN CAMBIAR UNA COMA.':last.skipped?'ACÁ ESTABA LA CLAVE.':'ASÍ FUE LA HISTORIA.';
 get('tlAnswerDesc').textContent=r.title+'. Estos son los años reales, del primero al último.';
 get('tlPoints').textContent='+'+last.points+' PTS LOCALES';
 get('tlCorrectOrder').replaceChildren();
 sorted.forEach((e,i)=>{const li=document.createElement('li'),rank=document.createElement('strong'),label=document.createElement('span'),year=document.createElement('time');rank.textContent=String(i+1).padStart(2,'0');label.textContent=e.label;year.textContent=String(e.year);year.dateTime=String(e.year);li.append(rank,label,year);get('tlCorrectOrder').appendChild(li);});
 get('tlSource').href=r.source_url;get('tlSource').textContent='FUENTE: '+r.source_label.toUpperCase()+' ↗';
 get('tlNext').textContent=state.idx===4?'VER RESULTADOS ↗':'SIGUIENTE ARCHIVO ↗';
}else finish();
return true;
}
function init(){
get('tlStartButton').disabled=true;
get('tlStartButton').addEventListener('click',begin);
get('tlCheck').addEventListener('click',()=>answer(false));
get('tlSkip').addEventListener('click',()=>answer(true));
get('tlNext').addEventListener('click',next);
get('tlRestart').addEventListener('click',begin);
get('tlItems').addEventListener('click',event=>{
 const button=event.target.closest('button[data-direction]');
 if(button){move(button.closest('li')?.dataset.eventId,Number(button.dataset.direction));}
});
get('tlItems').addEventListener('keydown',event=>{
 if(!['ArrowUp','ArrowDown'].includes(event.key)||event.target.closest('button'))return;
 event.preventDefault();move(event.target.closest('li')?.dataset.eventId,event.key==='ArrowUp'?-1:1);
});
header();
fetch(DATA,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(json=>{
 if(json.scope!=='men-senior-official'||!Array.isArray(json.rounds)||json.rounds.length!==5)throw Error('Fuentes incompletas');
 rounds=json.rounds;
 for(const r of rounds){
  if(!r.id||r.events?.length!==4||new Set(r.events.map(e=>e.id)).size!==4||
     new Set(r.events.map(e=>e.year)).size!==4||!r.events.every(e=>Number.isInteger(e.year)&&e.year>=1930&&e.year<=2026&&e.label)||
     !/^https:\/\/(?:www\.fifa\.com|es\.uefa\.com)\//.test(r.source_url))throw Error('Registro histórico no válido');
 }
 map=new Map(rounds.map(r=>[r.id,r]));
 if(map.size!==5)throw Error('Archivos duplicados');
 get('tlStartButton').disabled=false;restore();
}).catch(e=>{
 const msg=document.createElement('p');msg.className='ct7-tl-feedback';msg.setAttribute('role','alert');
 msg.textContent='No se pudo cargar el archivo histórico: '+e.message;get('tlStart').appendChild(msg);
});
}
init();
})();
