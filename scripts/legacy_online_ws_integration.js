'use strict';

/**
 * Real loopback WebSocket integration for the legacy game protocol running inside
 * the same isolated CT_STAGING server that hosts the Pasala duel service.
 * Never hits cracktotal.com, external Redis, Firebase or the old production API.
 */
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const WebSocket = require('ws');
const { catalog } = require('../server/multiplayer/objective-mentiroso');
const origin = 'https://deploy-preview-1--zingy-haupia-53b742.netlify.app';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const clients = [];
let child = null, log = '';

function port() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer().once('error', reject);
    listener.listen(0, '127.0.0.1', () => {
      const p = listener.address().port;
      listener.close(() => resolve(p));
    });
  });
}
function healthy(p) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:' + p + '/__ct_staging/health', res => {
      res.resume();
      res.once('end', () => res.statusCode === 200 ? resolve() : reject(new Error('Health HTTP '+res.statusCode)));
    }).once('error', reject);
  });
}
async function ready(p) {
  for (let n = 0; n < 110; n++) {
    if (child.exitCode !== null) throw new Error('Server exited: '+log);
    try { await healthy(p); return; } catch {}
    await sleep(100);
  }
  throw new Error('Arena did not start: '+log);
}
async function connect(p) {
  const ws = new WebSocket('ws://127.0.0.1:' + p, { origin });
  const client = { ws, events: [] };
  clients.push(client);
  ws.on('message', raw => { try { client.events.push(JSON.parse(String(raw))); } catch {} });
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  return client;
}
function send(client, type, payload = {}) {
  assert.equal(client.ws.readyState, WebSocket.OPEN);
  client.ws.send(JSON.stringify({ type, payload }));
}
async function wait(client, type, condition = () => true, start = 0, timeout = 8000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    for (let i = start; i < client.events.length; i++) {
      const event = client.events[i];
      if (event.type === type && condition(event.payload || {})) return event.payload || {};
    }
    await sleep(15);
  }
  throw new Error('Timeout '+type+', seen '+client.events.slice(-12).map(e=>e.type).join(', ')+
    '\nServer tail '+log);
}
async function run() {
  const p = await port();
  child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(p), CT_STAGING: 'true', CT_OBJECTIVE_MENTIROSO: 'true',
      CT_STAGING_ORIGINS: origin, CT_QSM_TEST_QUESTION_MS: '6000' },
    stdio: ['ignore','pipe','pipe']
  });
  child.stdout.on('data', chunk => { log = (log + String(chunk)).slice(-8000); });
  child.stderr.on('data', chunk => { log = (log + String(chunk)).slice(-8000); });
  await ready(p);

  const q1 = await connect(p), q2 = await connect(p);
  const handshake = await wait(q1, 'arena:hello');
  assert.equal(handshake.protocol,'cracktotal-arena-5.2');
  assert.equal(handshake.features.qsmResume,true);
  assert.equal(handshake.features.mentirosoObjective,true);
  send(q1, 'createRoom', { playerName: 'QSM Host', gameType: 'quiensabemas' });
  const made = await wait(q1,'roomCreated');
  assert.match(made.reconnectToken,/^[0-9A-F]{48}$/);
  send(q2,'joinRoom',{roomId:made.roomId,playerName:'QSM Rival',gameType:'quiensabemas'});
  const joined = await wait(q2,'joinSuccess');
  assert.match(joined.reconnectToken,/^[0-9A-F]{48}$/);
  await wait(q1,'gameStart');
  await wait(q1,'newQuestion');
  q1.ws.close();
  await wait(q2,'opponentDisconnected');
  const interrupted = q2.events.length;
  send(q2,'submitAnswer',{selectedIndex:0});
  await wait(q2,'errorMessage',p=>/Esperando/.test(p.error || ''),interrupted);

  const q1Recovered = await connect(p);
  send(q1Recovered,'resumeRoom',{roomId:made.roomId,reconnectToken:made.reconnectToken,gameType:'quiensabemas'});
  const state = await wait(q1Recovered,'roomResumed');
  assert.equal(state.playerId,made.playerId);
  assert.equal(state.gameType,'quiensabemas');
  assert.equal(state.gameActive,true);
  assert.ok(state.question && state.question.options.length===4,'QSM question restored');
  assert.notEqual(state.reconnectToken,made.reconnectToken,'Credentials rotated');
  await wait(q2,'opponentReconnected');
  const answerer = state.currentTurn === made.playerId ? q1Recovered : q2;
  const other = answerer === q1Recovered ? q2 : q1Recovered;
  const prior = answerer.events.length;
  send(answerer,'submitAnswer',{selectedIndex:0});
  await wait(answerer,'answerResult',()=>true,prior);
  const beforeRepeat = other.events.length;
  send(other,'submitAnswer',{selectedIndex:0});
  await wait(other,'errorMessage',p=>/ya fue respondida/.test(p.error||''),beforeRepeat);
  await wait(q2,'newQuestion',p=>p.questionNumber>=2,0,6500);
  const beforeClock = q2.events.length;
  send(q2, 'timeOut'); // Malicious or out-of-sync browser must not choose when the turn ends.
  await sleep(250);
  assert.equal(q2.events.slice(beforeClock).some(e=>e.type === 'answerResult'),false,
    'Client must not be able to force an early server timeout');
  const expired = await wait(q2,'answerResult',p=>p.timedOut === true,beforeClock,8500);
  assert.equal(expired.pointsAwarded,0,'Server enforces zero points for expired question');
  await wait(q2,'newQuestion',p=>p.questionNumber>=3,0,5000);
  console.log('QSM: room recovery, duplicate protection, forged timeout rejection and real server expiry PASS');

  const m1 = await connect(p), m2 = await connect(p);
  send(m1,'createRoom',{playerName:'Mentiroso Host',gameType:'mentiroso'});
  const mc = await wait(m1,'roomCreated');
  send(m2,'joinRoom',{roomId:mc.roomId,playerName:'Mentiroso Rival',gameType:'mentiroso'});
  const mj = await wait(m2,'joinSuccess');
  await wait(m1,'mentirosoGameStart');
  const round = await wait(m1,'mentirosoNextRound',p=>p.objectiveValidation === true,0,6500);
  assert.equal(round.category,'Fútbol Argentino');
  assert.ok(round.maxBid>=20);
  const bidder = round.currentTurn===mc.playerId ? m1 : m2;
  const challenger = bidder===m1 ? m2 : m1;
  const fromBid = challenger.events.length;
  send(bidder,'mentirosoSubmitBid',{bid:20});
  await wait(challenger,'mentirosoBidUpdate',p=>p.newBid===20,fromBid);
  const fromCall = bidder.events.length;
  send(challenger,'mentirosoCallLiar');
  await wait(bidder,'mentirosoLiarCalled',()=>true,fromCall);
  const names = catalog.challenges.find(c=>c.category==='Fútbol Argentino').answers.slice(0,20).map(a=>a.label);
  const fromResult = bidder.events.length;
  send(bidder,'mentirosoSubmitAnswers',{answers:names});
  const verdict = await wait(bidder,'mentirosoRoundResult',p=>p.validAnswersCount===20,fromResult);
  assert.equal(verdict.wasMentiroso,false);
  assert.equal(verdict.winnerId,bidder===m1 ? mc.playerId : mj.playerId);
  assert.equal(verdict.validationDetails.filter(x=>x.accepted).length,20);
  const afterScore = challenger.events.length;
  send(challenger,'mentirosoSubmitValidation',{validations:Array(20).fill(false)});
  await wait(challenger,'errorMessage',p=>/automática/.test(p.error||''),afterScore);
  console.log('MENTIROSO: 20/20 canonical answers server-verified, subjective rival votes rejected PASS');

  // Recovery of a Mentiroso room must preserve the category, round, bid and score.
  await wait(m2,'mentirosoNextRound',p=>p.round===2,0,6500);
  m1.ws.close();
  await wait(m2,'opponentDisconnected');
  const m1Recovered = await connect(p);
  send(m1Recovered,'resumeRoom',{roomId:mc.roomId,reconnectToken:mc.reconnectToken,gameType:'mentiroso'});
  const restored = await wait(m1Recovered,'roomResumed');
  assert.equal(restored.playerId,mc.playerId);
  assert.equal(restored.gameType,'mentiroso');
  assert.equal(restored.mentiroso.currentRound,2);
  assert.equal(restored.mentiroso.categoryRound,1);
  assert.ok(restored.mentiroso.maxBid>=20);
  await wait(m2,'opponentReconnected');
  console.log('MENTIROSO: reconnect preserves room, phase and round 2 PASS');
}

(async()=>{
  try { await run(); console.log('SHARED ARENA INTEGRATION: PASS'); }
  catch(err) { console.error('SHARED ARENA INTEGRATION: FAIL',err.stack||err); process.exitCode=1; }
  finally {
    clients.forEach(c=>{try{c.ws.terminate()}catch{}});
    if(child) child.kill('SIGINT');
  }
})();
