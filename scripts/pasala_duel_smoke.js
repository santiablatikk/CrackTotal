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
const initialRosco = Object.fromEntries(alphabet.map(letter => [letter, service.rooms.get(created.roomId).questions[letter].pregunta]));
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
assert.equal(get(aAgain,'result').reason,'correct','Most correct answers decide first');
assert.equal(get(b,'result').players[0].correct,26);
assert.equal(get(b,'result').players[1].correct,0);
assert.equal(get(audience,'result').winner,created.playerId);
assert.equal(get(audience,'state').spectatorCount,1,'Spectator count is public metadata');
act(aAgain,'rematch');
assert.equal(get(b,'state').phase,'finished','First rematch request must not start without rival');
act(b,'rematch');
assert.equal(get(b,'state').phase,'countdown');
const replayRosco = service.rooms.get(created.roomId).questions;
assert.ok(alphabet.every(letter => replayRosco[letter].pregunta !== initialRosco[letter]),
  'A rematch uses another question for every letter when the bank has alternatives');
advance(3000);
assert.equal(get(aAgain,'state').phase,'playing');
assert.equal(get(b,'state').players[0].correct,0);
assert.equal(get(audience,'question'),undefined);
act(aAgain,'leave');
assert.equal(get(b,'result').reason,'forfeit','The opponent wins an abandoned match');
assert.equal(get(b,'result').players[1].elapsedSeconds,0,'Forfeit time must not show full round');
const disconnectedHost=socket(), disconnectedGuest=socket();
act(disconnectedHost,'create',{name:'Desconectado'});
const disconnectedRoom=get(disconnectedHost,'created').roomId;
act(disconnectedGuest,'join',{roomId:disconnectedRoom,name:'Rival'});
act(disconnectedHost,'ready');
act(disconnectedGuest,'ready');
advance(3000);
disconnectedHost.readyState=3;
service.disconnect(disconnectedHost);
advance(44999);
assert.equal(get(disconnectedGuest,'state').phase,'playing','Reconnection grace holds the match for 45 seconds');
advance(1);
assert.equal(get(disconnectedGuest,'result').reason,'disconnect','Connection timeout is distinct from voluntary forfeit');
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

const turns = createPasalaDuelService({bank, now:()=>clock, random:()=>0, timers:fakeTimers});
const turnA=socket(), turnB=socket(), turnAudience=socket();
turns.handle(turnA,{type:'pasala:create',payload:{name:'A',mode:'turns',difficulty:'normal'}});
const turnsCreated=get(turnA,'created');
turns.handle(turnB,{type:'pasala:join',payload:{roomId:turnsCreated.roomId,name:'B'}});
turns.handle(turnAudience,{type:'pasala:spectate',payload:{roomId:turnsCreated.roomId}});
turns.handle(turnA,{type:'pasala:ready'});
turns.handle(turnB,{type:'pasala:ready'});
const pair=turns.rooms.get(turnsCreated.roomId).questions;
assert.ok(alphabet.every(l=>pair[0][l].pregunta!==pair[1][l].pregunta),'Each player gets distinct questions');
advance(3000);
assert.equal(get(turnA,'state').activeSlot,0);
assert.equal(get(turnA,'state').turnReadyAt,null,'First player starts immediately after countdown');
advance(30000);
assert.equal(get(turnA,'state').players[1].remainingMs,150000,'Waiting player clock is frozen');
turns.handle(turnA,{type:'pasala:answer',payload:{letter:'A',answer:'Gol A'}});
assert.equal(get(turnA,'answerResult'),undefined,'No correct/incorrect feedback during correction window');
assert.equal(get(turnAudience,'answerPending'),undefined,'Spectator cannot see provisional answers');
assert.equal(get(turnA,'answerPending').editsRemaining,1);
assert.equal(get(turnA,'answerPending').endsAt,clock+6000,'Correction uses server-clock timestamp');
turns.handle(turnA,{type:'pasala:answer',payload:{letter:'A',answer:'Gol A'}});
assert.match(get(turnA,'error').message,/Primero confirmá/,'Cannot spam submissions in provisional window');
turns.handle(turnA,{type:'pasala:reviseAnswer',payload:{letter:'A',answer:'Gol A'}});
assert.equal(get(turnA,'answerPending').editsRemaining,0);
turns.handle(turnA,{type:'pasala:reviseAnswer',payload:{letter:'A',answer:'Pase A'}});
assert.match(get(turnA,'error').message,/Solo se permite una/,'Only one edit allowed');
turns.handle(turnA,{type:'pasala:confirmAnswer',payload:{letter:'A'}});
assert.equal(get(turnA,'answerResult').correct,true,'Confirmed final answer scored on server');
assert.equal(get(turnA,'question').letter,'B','Correct answer keeps same turn');
advance(210);
turns.handle(turnA,{type:'pasala:pass',payload:{letter:'B'}});
const changing=get(turnB,'state');
assert.equal(changing.activeSlot,1,'Pass schedules other player');
assert.equal(changing.turnReadyAt,clock+2000);
assert.equal(changing.deadline,null,'Neither clock runs in transition');
const paused=get(turnA,'state').players[0].remainingMs;
const beforeBQuestions=turnB.messages.filter(m=>m.type==='pasala:question').length;
turns.handle(turnB,{type:'pasala:answer',payload:{letter:'A',answer:'Pase A'}});
assert.match(get(turnB,'error').message,/cambio de turno/,'No actions during the two-second handoff');
advance(1999);
assert.equal(turnB.messages.filter(m=>m.type==='pasala:question').length,beforeBQuestions);
assert.equal(get(turnB,'state').players[0].remainingMs,paused);
advance(1);
assert.equal(get(turnB,'question').letter,'A','Second player starts after 2000 ms with own A');
assert.equal(get(turnB,'state').turnReadyAt,null);
assert.ok(get(turnB,'state').deadline > clock);
advance(10000);
assert.equal(get(turnB,'state').players[0].remainingMs,paused,'Inactive player clock never drains');
turns.handle(turnA,{type:'pasala:answer',payload:{letter:'C',answer:'Gol C'}});
assert.match(get(turnA,'error').message,/no es tu turno/);
turns.handle(turnB,{type:'pasala:answer',payload:{letter:'A',answer:'INVALIDA'}});
assert.equal(get(turnB,'answerPending').editsRemaining,1);
advance(6000);
assert.equal(get(turnB,'answerResult').correct,false,'Server resolves wrong answer after correction window');
assert.equal(get(turnA,'state').turnReadyAt,clock+2000,'Wrong answer triggers the same handoff');
turns.handle(turnB,{type:'pasala:reviseAnswer',payload:{letter:'A',answer:'Pase A'}});
assert.match(get(turnB,'error').message,/La ventana de corrección terminó/,'Late edits rejected');
advance(2000);
assert.equal(get(turnA,'question').letter,'C','Host resumes pending rosco after opponent mistake');
advance(310000);
assert.equal(get(turnA,'result').reason,'correct');
assert.equal(get(turnA,'result').winner,turnsCreated.playerId);
assert.equal(get(turnA,'result').players[0].elapsedSeconds,150);
assert.equal(get(turnB,'result').players[1].elapsedSeconds,150);
assert.equal(get(turnAudience,'question'),undefined);
assert.equal(JSON.stringify(turnAudience.messages).includes('INVALIDA'),false,'Private answers never reach spectators');
turns.destroy();

const tieService=createPasalaDuelService({bank, now:()=>clock, random:()=>0, timers:fakeTimers});
const tieA=socket(), tieB=socket();
tieService.handle(tieA,{type:'pasala:create',payload:{mode:'turns',name:'Empate A'}});
const tieRoom=get(tieA,'created').roomId;
tieService.handle(tieB,{type:'pasala:join',payload:{roomId:tieRoom,name:'Empate B'}});
tieService.handle(tieA,{type:'pasala:ready'});
tieService.handle(tieB,{type:'pasala:ready'});
advance(3000);
advance(307000);
assert.equal(get(tieA,'result').winner,null,'Distinct roscos tied on correct answers are a draw');
assert.equal(get(tieA,'result').reason,'draw');
tieService.destroy();
console.log('Pasala Che duel smoke OK: room, mirrored questions, countdown, verified aliases, rate limit, spectators, reconnect, winner, nonrepeating rematch, closed-room notices, room cap, cleanup');
