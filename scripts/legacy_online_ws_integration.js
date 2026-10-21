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
      CT_STAGING_ORIGINS: origin, CT_QSM_TEST_QUESTION_MS: '6000', CT_QSM_TEST_NEXT_DELAY_MS: '30' },
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

  // Complete all 36 QSM questions across six levels, not merely the first round.
  // The staging-only next-question delay is 30 ms; production remains 1.5 seconds.
  let nextQuestionEvent = 0;
  for (let turn = 3; turn <= 36; turn++) {
    const expectedLevel = Math.floor((turn - 1) / 6) + 1;
    const expectedNumber = ((turn - 1) % 6) + 1;
    const question = await wait(q2, 'newQuestion', v =>
      v.question?.level === expectedLevel && v.questionNumber === expectedNumber,
      nextQuestionEvent, 5000);
    const foundAt = q2.events.findIndex((event, idx) =>
      idx >= nextQuestionEvent && event.type === 'newQuestion' &&
      event.payload?.question?.level === expectedLevel &&
      event.payload.questionNumber === expectedNumber);
    assert.ok(foundAt >= 0, 'Question order must be observable');
    nextQuestionEvent = foundAt + 1;
    assert.equal(question.totalQuestionsInLevel, 6);
    assert.equal(question.question.options.length, 4);
    const respondingPlayer = question.currentTurn === made.playerId ? q1Recovered : q2;
    const expectedPlayerId = question.currentTurn;
    const fromResponse = respondingPlayer.events.length;
    send(respondingPlayer, 'submitAnswer', {selectedIndex: 0});
    const resolved = await wait(respondingPlayer,'answerResult',
      value => value.forPlayerId === expectedPlayerId, fromResponse, 5000);
    assert.ok([0, 0.5, 1].includes(resolved.pointsAwarded));
  }
  const qsmFinal = await wait(q2,'gameOver',value=>Boolean(value.finalScores),0,6000);
  assert.ok(Number.isFinite(qsmFinal.finalScores[made.playerId]));
  assert.ok(Number.isFinite(qsmFinal.finalScores[joined.playerId]));
  const scoredTotal = qsmFinal.finalScores[made.playerId] + qsmFinal.finalScores[joined.playerId];
  assert.ok(scoredTotal >= 0 && scoredTotal <= 36, 'QSM must have exactly 36 scoring opportunities');
  const qsmRematchStart = q2.events.length;
  send(q1Recovered, 'requestRematch', {gameType:'quiensabemas'});
  const qsmVote = await wait(q2,'rematchState', v=>v.waiting===true, qsmRematchStart);
  assert.deepEqual(qsmVote.requested,[made.playerId]);
  await sleep(80);
  assert.equal(q2.events.slice(qsmRematchStart).filter(e=>e.type==='gameStart').length,0,
    'One QSM player may not restart the match unilaterally');
  const qsmBothVotes = q1Recovered.events.length;
  send(q2,'requestRematch',{gameType:'quiensabemas'});
  await wait(q1Recovered,'rematchState',v=>v.waiting===false,qsmBothVotes);
  await wait(q1Recovered,'gameStart',()=>true,qsmBothVotes);
  await wait(q1Recovered,'newQuestion',v=>v.question?.level===1&&v.questionNumber===1,qsmBothVotes);
  q1Recovered.ws.close();
  q2.ws.close();
  console.log('QSM: all six levels, 36 questions, final result and consent-based rematch PASS');

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

  // Finish all six objective categories, then verify a mutual rematch really
  // starts a clean match in the SAME room. No subjective answer votes allowed.
  for (let roundNumber = 2; roundNumber <= 6; roundNumber++) {
    const active = await wait(m2, 'mentirosoNextRound', value => value.round === roundNumber,
      0, 7000);
    const verifiedSet = catalog.challenges.find(entry => entry.category === active.category);
    assert.ok(verifiedSet && verifiedSet.answers.length >= 20,
      'Active round must use a source-checked 20+ canonical bank');
    const player = active.currentTurn === mc.playerId ? m1Recovered : m2;
    const opponent = player === m1Recovered ? m2 : m1Recovered;
    const bidStart = opponent.events.length;
    send(player,'mentirosoSubmitBid',{bid:1});
    await wait(opponent,'mentirosoBidUpdate',value=>value.newBid===1,bidStart);
    const callStart = player.events.length;
    send(opponent,'mentirosoCallLiar');
    await wait(player,'mentirosoLiarCalled',()=>true,callStart);
    const resultStart = player.events.length;
    const deliberateMiss = roundNumber === 2;
    send(player,'mentirosoSubmitAnswers',{
      answers: deliberateMiss ? [] : [verifiedSet.answers[0].label]
    });
    const roundResult = await wait(player,'mentirosoRoundResult',
      value=>value.validAnswersCount === (deliberateMiss ? 0 : 1),resultStart);
    assert.equal(roundResult.wasMentiroso,deliberateMiss,
      'Insufficient replies lose the bid objectively; correct replies win');
  }
  const finalMentiroso = await wait(m2,'gameOver',v=>v.gameType==='mentiroso',0,8000);
  assert.ok(finalMentiroso.finalScores[mc.playerId] >= 0);
  assert.ok(finalMentiroso.finalScores[mj.playerId] >= 0);
  assert.equal(finalMentiroso.finalScores[mc.playerId]+finalMentiroso.finalScores[mj.playerId],6);

  const firstRequest = m2.events.length;
  send(m1Recovered,'requestRematch',{gameType:'mentiroso'});
  const pending = await wait(m2,'rematchState',v=>v.waiting===true,firstRequest);
  assert.deepEqual(pending.requested,[mc.playerId]);
  const secondRequest = m1Recovered.events.length;
  send(m2,'requestRematch',{gameType:'mentiroso'});
  await wait(m1Recovered,'rematchState',v=>v.waiting===false,secondRequest);
  await wait(m1Recovered,'mentirosoGameStart',()=>true,secondRequest);
  const fresh = await wait(m1Recovered,'mentirosoNextRound',v=>v.round===1,secondRequest,7000);
  assert.equal(fresh.category,'Fútbol Argentino');
  assert.equal(fresh.maxBid,28);
  console.log('MENTIROSO: six complete rounds, authoritative final score and mutual rematch PASS');
}

(async()=>{
  try { await run(); console.log('SHARED ARENA INTEGRATION: PASS'); }
  catch(err) { console.error('SHARED ARENA INTEGRATION: FAIL',err.stack||err); process.exitCode=1; }
  finally {
    clients.forEach(c=>{try{c.ws.terminate()}catch{}});
    if(child) child.kill('SIGINT');
  }
})();
