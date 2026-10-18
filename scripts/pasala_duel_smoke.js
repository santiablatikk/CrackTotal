'use strict';
const assert = require('node:assert/strict');
const { createPasalaDuelService } = require('../server/pasala-duel');

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const bank = alphabet.map(letter => ({ letra:letter, preguntas:[
  { pregunta:'Pregunta compartida para ' + letter, respuesta:'Gol ' + letter },
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
advance(3000);
assert.equal(get(a,'state').phase,'playing');
assert.equal(get(a,'question').text,get(b,'question').text);
assert.equal(get(audience,'question'),undefined,'Spectator cannot see answers/questions');
assert.equal(JSON.stringify(audience.messages).includes('respuesta'),false);
act(a,'answer',{letter:'Z',answer:'Gol Z'});
assert.match(get(a,'error').message,/fuera de turno/);
act(a,'answer',{letter:'A',answer:'Gol A'});
assert.equal(get(a,'answerResult').correct,true);
assert.equal(get(a,'question').letter,'B');
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
act(aAgain,'rematch');
assert.equal(get(b,'state').phase,'finished','First rematch request must not start without rival');
act(b,'rematch');
assert.equal(get(b,'state').phase,'countdown');
advance(3000);
assert.equal(get(aAgain,'state').phase,'playing');
assert.equal(get(b,'state').players[0].correct,0);
assert.equal(get(audience,'question'),undefined);
act(aAgain,'leave');
service.destroy();
assert.equal(service.rooms.size,0);
console.log('Pasala Che duel smoke OK: room, mirrored questions, authoritative answers, spectators, reconnect, winner, rematch, cleanup');
