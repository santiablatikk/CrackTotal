'use strict';
const assert = require('node:assert/strict');
const { createPasalaDuelService } = require('../server/pasala-duel');

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const bank = alphabet.map(letter => ({ letra:letter, preguntas:[
  { pregunta:'Pregunta compartida para ' + letter, respuesta:'Gol ' + letter, respuestasAlternativas:letter === 'A' ? ['Gol alternativo A'] : [] },
  { pregunta:'Otra pregunta de ' + letter, respuesta:'Pase ' + letter }
] }));
let clock = 1000000;
let nextId = 1;
const jobs = new Map();
const fakeTimers = {
  setTimeout(fn,ms) { const id=nextId++; jobs.set(id,{at:clock+ms,fn,interval:0}); return id; },
  clearTimeout(id) { jobs.delete(id); },
  setInterval(fn,ms) { const id=nextId++; jobs.set(id,{at:clock+ms,fn,interval:ms}); return id; },
  clearInterval(id) { jobs.delete(id); }
};
function advance(ms) {
  const end = clock + ms;
  for (let step=0;step<100000;step++) {
    const due = [...jobs.entries()].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
    if (!due) break;
    const [id,job] = due; clock=job.at;
    if (job.interval) job.at+=job.interval; else jobs.delete(id);
    job.fn();
  }
  clock=end;
}
const service = createPasalaDuelService({bank,now:()=>clock,random:()=>0,timers:fakeTimers});
const socket = () => ({readyState:1,messages:[],send(raw){this.messages.push(JSON.parse(raw));}});
const get = (ws,type) => ws.messages.filter(m=>m.type==='pasala:'+type).at(-1)?.payload;
const act = (ws,type,payload={}) => assert.equal(service.handle(ws,{type:'pasala:'+type,payload}),true);

const a=socket(), b=socket(), audience=socket();
act(a,'create',{name:'Davo',difficulty:'normal',public:true});
const created = get(a,'created');
assert.match(created.roomId,/^[A-F0-9]{10}$/);
assert.equal(get(a,'state').phase,'waiting');
act(b,'join',{name:'Cobra',roomId:created.roomId});
const joined=get(b,'joined');
assert.ok(joined.reconnectToken);
act(audience,'spectate',{roomId:created.roomId});
assert.equal(get(audience,'spectating').roomId,created.roomId);
act(a,'ready');
assert.equal(get(a,'state').phase,'waiting');
act(b,'ready');
assert.equal(get(a,'state').phase,'countdown');
assert.equal(get(a,'state').countdownEndsAt,clock+3000,'Countdown uses server time');
advance(3000);
assert.equal(get(a,'state').phase,'playing');
assert.equal(get(a,'question').text,get(b,'question').text);
assert.equal(get(audience,'question'),undefined,'Spectator cannot see answers/questions');
assert.equal(JSON.stringify(audience.messages).includes('respuesta'),false);
act(a,'answer',{letter:'Z',answer:'Gol Z'});
assert.match(get(a,'error').message,/fuera de turno/);
act(a,'answer',{letter:'A',answer:'Gol alternativo A'});
assert.equal(get(a,'answerResult').correct,true,'Verified accepted variant scores');
act(a,'pass',{letter:'B'});
assert.match(get(a,'error').message,/Esperá un instante/,'Throttled action receives acknowledgement');
assert.equal(get(a,'question').letter,'B');
assert.equal(get(a,'state').players[0].correct,1);
act(b,'answer',{letter:'A',answer:'incorrecto'});
assert.equal(get(b,'answerResult').correct,false);

a.readyState=3;
service.disconnect(a);
assert.equal(get(b,'state').players[0].connected,false);
const aAgain=socket();
act(aAgain,'resume',{roomId:created.roomId,reconnectToken:created.reconnectToken});
assert.equal(get(aAgain,'joined').resumed,true);
assert.equal(get(aAgain,'question').letter,'B');
assert.equal(get(b,'state').players[0].connected,true);

for(let i=0;i<25;i++) {
  clock+=210;
  const qa=get(aAgain,'question');
  if(qa && get(aAgain,'state').phase==='playing') act(aAgain,'answer',{letter:qa.letter,answer:'Gol '+qa.letter});
  clock+=210;
  const qb=get(b,'question');
  if(qb && get(b,'state').phase==='playing') act(b,'answer',{letter:qb.letter,answer:'mal'});
}
assert.equal(get(aAgain,'result').winner,created.playerId);
assert.equal(get(b,'result').players[0].correct,26);
assert.equal(get(b,'result').players[1].correct,0);
assert.equal(get(audience,'result').winner,created.playerId);
assert.equal(get(audience,'state').spectatorCount,1,'Spectator count is public metadata');
act(aAgain,'rematch');
assert.equal(get(b,'state').phase,'finished','First rematch request must not start without rival');
act(b,'rematch');
assert.equal(get(b,'state').phase,'countdown');
advance(3000);
assert.equal(get(aAgain,'state').phase,'playing');
assert.equal(get(b,'state').players[0].correct,0);
assert.equal(get(audience,'question'),undefined);
act(aAgain,'leave');
const host=socket(), invited=socket(), watcher=socket();
act(host,'create',{name:'Anfitrión'});
const roomId=get(host,'created').roomId;
act(invited,'join',{roomId,name:'Invitado'});
act(watcher,'spectate',{roomId});
assert.equal(get(invited,'state').spectatorCount,1,'Live spectator count increments');
act(watcher,'leave');
assert.equal(get(invited,'state').spectatorCount,0,'Live spectator count decrements');
act(watcher,'spectate',{roomId});
act(host,'ready');
assert.equal(get(invited,'state').players[0].ready,true);
service.disconnect(host);
assert.equal(get(invited,'state').players[0].ready,false,'Disconnected host resets lobby readiness');
const resumedHost=socket();
act(resumedHost,'resume',{roomId,reconnectToken:get(host,'created').reconnectToken});
act(resumedHost,'leave');
assert.match(get(invited,'closed').message,/sala se cerró/,'Invitee gets host closure notice');
assert.match(get(watcher,'closed').message,/sala se cerró/,'Spectator gets host closure notice');
assert.equal(service.rooms.has(roomId),false);
service.destroy();
assert.equal(service.rooms.size,0);
const capacity = createPasalaDuelService({bank, now:()=>clock, random:()=>0, timers:fakeTimers});
for (let i = 0; i < 250; i++) {
  const guest = socket();
  assert.equal(capacity.handle(guest,{type:'pasala:create',payload:{name:'Jugador'}}),true);
}
assert.equal(capacity.rooms.size,250);
const overflow=socket();
capacity.handle(overflow,{type:'pasala:create',payload:{name:'Excedente'}});
assert.match(get(overflow,'error').message,/arena está completa/);
capacity.destroy();
console.log('Pasala Che duel smoke OK: room, mirrored questions, countdown, verified aliases, rate limit, spectators, reconnect, winner, rematch, closed-room notices, room cap, cleanup');
