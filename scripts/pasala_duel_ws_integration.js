'use strict';

/**
 * Real HTTP + WebSocket loopback test against a separate CT_STAGING Node process.
 * Does not connect to, read from, or mutate the production service.
 */
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const WebSocket = require('ws');
const bank = require('../assets/data/pasalache_2025.json');

const origin = 'https://deploy-preview-1--zingy-haupia-53b742.netlify.app';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const connections = [];
let serverProcess;
let serverLogs = '';

function reservePort() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', () => {
      const port = listener.address().port;
      listener.close(() => resolve(port));
    });
  });
}
function health(port) {
  return new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:' + port + '/__ct_staging/health', res => {
      let text = '';
      res.on('data', chunk => { text += chunk; });
      res.on('end', () => {
        try {
          const body = JSON.parse(text);
          assert.equal(res.statusCode, 200);
          assert.equal(body.service, 'cracktotal-arena-staging');
          assert.equal(body.websocket, true);
          resolve(body);
        } catch (error) { reject(error); }
      });
    });
    req.on('error', reject);
    req.setTimeout(800, () => req.destroy(new Error('health timeout')));
  });
}
async function awaitHealthy(port) {
  for (let i = 0; i < 140; i++) {
    if (serverProcess.exitCode !== null) throw new Error('Staging server exited: ' + serverLogs);
    try { await health(port); return; } catch {}
    await sleep(100);
  }
  throw new Error('Staging health endpoint did not respond: ' + serverLogs);
}
async function connect(port, requestOrigin = origin) {
  const socket = new WebSocket('ws://127.0.0.1:' + port, { origin: requestOrigin });
  const client = { socket, messages: [] };
  connections.push(client);
  socket.on('message', raw => {
    try { client.messages.push(JSON.parse(String(raw))); } catch {}
  });
  await new Promise((resolve, reject) => {
    socket.once('open', resolve);
    socket.once('error', reject);
  });
  return client;
}
function send(client, type, payload = {}) {
  assert.equal(client.socket.readyState, WebSocket.OPEN);
  client.socket.send(JSON.stringify({ type: 'pasala:' + type, payload }));
}
async function wait(client, type, predicate = () => true, from = 0, timeout = 7000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    for (let i = from; i < client.messages.length; i++) {
      const message = client.messages[i];
      if (message.type === 'pasala:' + type && predicate(message.payload || {})) {
        return { payload: message.payload || {}, index: i };
      }
    }
    await sleep(15);
  }
  throw new Error('Timed out waiting for ' + type + ': ' +
    client.messages.slice(-5).map(m => m.type).join(', '));
}
function answerFor(question) {
  const record = bank.find(entry => entry.letra === question.letter);
  assert.ok(record, 'Bank letter ' + question.letter);
  const choice = record.preguntas.find(entry => entry.pregunta === question.text);
  assert.ok(choice, 'Question exists server-side for ' + question.letter);
  return choice.respuesta;
}
async function playRosco(client, passFirst) {
  let lastQuestion = -1;
  const actionCount = passFirst ? 27 : 26;
  for (let step = 0; step < actionCount; step++) {
    const q = await wait(client, 'question', () => true, lastQuestion + 1);
    lastQuestion = q.index;
    await sleep(225); // Deliberately above the server's 180ms throttle.
    if (passFirst && step === 0) {
      send(client, 'pass', { letter: q.payload.letter });
    } else {
      const from = client.messages.length;
      send(client, 'answer', { letter: q.payload.letter, answer: answerFor(q.payload) });
      const ack = await wait(client, 'answerResult',
        payload => payload.letter === q.payload.letter, from);
      assert.equal(ack.payload.correct, true, 'Server verifies genuine bank answer');
    }
  }
  await wait(client, 'playerFinished', payload => payload.correct === 26, 0, 5000);
}
async function checkRejectedOrigin(port) {
  await new Promise((resolve, reject) => {
    const bad = new WebSocket('ws://127.0.0.1:' + port,
      { origin: 'https://untrusted-staging-origin.example' });
    const timer = setTimeout(() => {
      bad.terminate(); reject(new Error('Untrusted origin did not get rejected'));
    }, 3500);
    bad.on('error', () => {});
    bad.on('open', () => {
      clearTimeout(timer); bad.terminate();
      reject(new Error('Untrusted origin entered staging'));
    });
    bad.on('unexpected-response', (request, response) => {
      clearTimeout(timer);
      assert.equal(response.statusCode, 403);
      response.resume();
      resolve();
    });
  });
}
async function main() {
  const port = await reservePort();
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(port), CT_STAGING: 'true',
      CT_STAGING_ORIGINS: origin },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  serverProcess.stdout.on('data', chunk => {
    serverLogs = (serverLogs + chunk.toString()).slice(-4000);
  });
  serverProcess.stderr.on('data', chunk => {
    serverLogs = (serverLogs + chunk.toString()).slice(-4000);
  });
  await awaitHealthy(port);
  await checkRejectedOrigin(port);
  // Render serves its own staging HTML as well as WS. A same-origin
  // browser must be admitted even if staging env explicitly lists only
  // the authorized Netlify preview for cross-origin browser traffic.
  const renderSameOrigin = await connect(port, 'https://cracktotal-arena-staging.onrender.com');
  assert.equal(renderSameOrigin.socket.readyState, WebSocket.OPEN,
    'The actual Render staging origin must pass the WS upgrade');
  renderSameOrigin.socket.close();
  await new Promise(resolve => renderSameOrigin.socket.once('close', resolve));

  let host = await connect(port);
  const opponent = await connect(port);
  const spectator = await connect(port);

  send(host, 'create', { name: 'Prueba A', difficulty: 'normal', public: false });
  const created = (await wait(host, 'created')).payload;
  assert.match(created.roomId, /^[A-F0-9]{10}$/);
  send(opponent, 'join', { roomId: created.roomId, name: 'Prueba B' });
  const joined = (await wait(opponent, 'joined')).payload;
  assert.equal(joined.roomId, created.roomId);
  send(spectator, 'spectate', { roomId: created.roomId });
  await wait(spectator, 'spectating');
  await wait(opponent, 'state', state => state.spectatorCount === 1);

  // A player can undo a ready confirmation before the opponent accepts.
  const beforeReady = opponent.messages.length;
  send(host, 'ready');
  await wait(opponent, 'state', state => state.phase === 'waiting' &&
    state.players[0].ready === true, beforeReady);
  const beforeUnready = opponent.messages.length;
  send(host, 'unready');
  await wait(opponent, 'state', state => state.phase === 'waiting' &&
    state.players[0].ready === false, beforeUnready);
  const beforeOpponentReady = opponent.messages.length;
  send(opponent, 'ready');
  await wait(opponent, 'state', state => state.phase === 'waiting' &&
    state.players[1].ready === true && state.players[0].ready === false,
  beforeOpponentReady);
  send(host, 'ready');
  await wait(host, 'state', state => state.phase === 'countdown');
  await wait(host, 'state', state => state.phase === 'playing', 0, 6500);
  const firstHostQuestion = (await wait(host, 'question')).payload;
  const firstOpponentQuestion = (await wait(opponent, 'question')).payload;
  assert.equal(firstHostQuestion.text, firstOpponentQuestion.text);
  assert.equal(firstHostQuestion.letter, firstOpponentQuestion.letter);
  // Spectators cannot submit answers; the server rejects forged player actions.
  const spectatorBeforeForgery = spectator.messages.length;
  send(spectator, 'answer', { letter: firstHostQuestion.letter, answer: answerFor(firstHostQuestion) });
  await wait(spectator, 'error', payload => payload.message === 'Acción no permitida.',
    spectatorBeforeForgery);
  assert.equal(spectator.messages.some(m => m.type === 'pasala:question'), false);

  // Actual network drop followed by an authenticated reconnect within 45s.
  const disconnectedAt = opponent.messages.length;
  host.socket.terminate();
  await wait(opponent, 'state', state =>
    state.phase === 'playing' && state.players[0].connected === false, disconnectedAt);
  host = await connect(port);
  send(host, 'resume', { roomId: created.roomId, reconnectToken: created.reconnectToken });
  assert.equal((await wait(host, 'joined')).payload.resumed, true);
  assert.equal((await wait(host, 'question')).payload.text, firstHostQuestion.text);

  await Promise.all([playRosco(host, true), playRosco(opponent, false)]);
  const result = (await wait(spectator, 'result', () => true, 0, 6000)).payload;
  assert.equal(result.players[0].correct, 26);
  assert.equal(result.players[1].correct, 26);
  assert.ok([created.playerId, joined.playerId, null].includes(result.winner));
  assert.equal(spectator.messages.some(m => m.type === 'pasala:question'), false);
  assert.equal(JSON.stringify(spectator.messages).includes('respuestasAlternativas'), false);

  const beforeRematch = opponent.messages.length;
  send(host, 'rematch');
  send(opponent, 'rematch');
  await wait(opponent, 'state', state =>
    state.phase === 'countdown' && state.players[0].correct === 0, beforeRematch);
  await wait(opponent, 'state', state => state.phase === 'playing', beforeRematch, 6500);
  const beforeForfeit = opponent.messages.length;
  send(host, 'leave');
  const forfeit = (await wait(opponent, 'result', payload => payload.winner === joined.playerId,
    beforeForfeit)).payload;
  assert.equal(forfeit.winner, joined.playerId);
  assert.equal(forfeit.reason, 'forfeit', 'Server reports that opponent abandoned');
  assert.ok(forfeit.players[1].elapsedSeconds < 10, 'No full-duration time after immediate forfeit');
  // The final whistle freezes the official elapsed time: a late spectator must
  // see exactly the same statistics, even long after the game finished.
  await sleep(1500);
  const lateSpectator = await connect(port);
  send(lateSpectator, 'spectate', { roomId: created.roomId });
  const lateResult = (await wait(lateSpectator, 'result')).payload;
  assert.deepEqual(lateResult.players.map(p => p.elapsedSeconds),
    forfeit.players.map(p => p.elapsedSeconds),
    'Late spectators must never see growing elapsedSeconds after a final result');
  assert.equal(lateResult.winner, forfeit.winner);

  // 3.9: real alternating duel, instant exact/wrong grading, conditional spelling correction.
  const turnsA = await connect(port);
  const turnsB = await connect(port);
  const turnsViewer = await connect(port);
  send(turnsA, 'create', { name: 'Turnos A', difficulty: 'dificil', mode: 'turns', public: false });
  const turnRoom = (await wait(turnsA, 'created')).payload;
  send(turnsB, 'join', { roomId: turnRoom.roomId, name: 'Turnos B' });
  const turnJoin = (await wait(turnsB, 'joined')).payload;
  send(turnsViewer, 'spectate', { roomId: turnRoom.roomId });
  await wait(turnsViewer, 'spectating');
  send(turnsA, 'ready');
  send(turnsB, 'ready');
  const turnStart = (await wait(turnsA, 'state', p => p.phase === 'playing' && p.mode === 'turns', 0, 6500)).payload;
  assert.equal(turnStart.duration, 120);
  assert.ok([0, 1].includes(turnStart.activeSlot));
  assert.ok(turnStart.players.every(p => p.remainingMs >= 119900 && p.remainingMs <= 120000),
    'Both independent clocks start at 120 seconds');
  const first = turnStart.activeSlot === 0 ? turnsA : turnsB;
  const second = turnStart.activeSlot === 0 ? turnsB : turnsA;
  const firstQ = (await wait(first, 'question')).payload;
  assert.equal(firstQ.letter, 'A');
  assert.equal(second.messages.some(m => m.type === 'pasala:question'), false,
    'Only the active player receives a private question');
  assert.equal(turnsViewer.messages.some(m => m.type === 'pasala:question'), false,
    'Spectators never receive clues');
  const beforeIllegal = second.messages.length;
  send(second, 'answer', { letter: firstQ.letter, answer: answerFor(firstQ) });
  await wait(second, 'error', p => p.message === 'Todavía no es tu turno.', beforeIllegal);
  await sleep(230);
  const beforeCorrect = first.messages.length;
  // Match the real bank dynamically: a single appended character is eligible only
  // for normalized answers with at least six non-space characters.
  const realAnswer = answerFor(firstQ);
  const longEnough = String(realAnswer).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').length >= 6;
  send(first, 'answer', { letter: firstQ.letter, answer: longEnough ? realAnswer + 'z' : realAnswer });
  if (longEnough) {
    const provisional = (await wait(first, 'answerPending', p => p.letter === 'A', beforeCorrect)).payload;
    assert.equal(provisional.editsRemaining, 1);
    assert.ok(provisional.endsAt > Date.now() && provisional.endsAt <= Date.now() + 6100);
    assert.equal(first.messages.slice(beforeCorrect).some(m => m.type === 'pasala:answerResult'), false,
      'Near-typo remains ungraded during correction');
    assert.equal(turnsViewer.messages.some(m => m.type === 'pasala:answerPending'), false,
      'Spectator cannot see private draft');
    const beforeRevision = first.messages.length;
    send(first, 'reviseAnswer', { letter: 'A', answer: realAnswer });
    await wait(first, 'answerPending', p => p.editsRemaining === 0, beforeRevision);
    const beforeDuplicate = first.messages.length;
    send(first, 'reviseAnswer', { letter: 'A', answer: 'REINTENTO EXCESIVO' });
    await wait(first, 'error', p => /Solo se permite una/.test(p.message), beforeDuplicate);
    send(first, 'confirmAnswer', { letter: 'A' });
  }
  await wait(first, 'answerResult', p => p.correct && p.letter === 'A', beforeCorrect);
  const follow = (await wait(first, 'question', p => p.letter === 'B', beforeCorrect)).payload;
  const stillActive = (await wait(turnsViewer, 'state', p => p.phase === 'playing' &&
    p.players[turnStart.activeSlot].correct === 1)).payload;
  assert.equal(stillActive.activeSlot, turnStart.activeSlot);
  assert.equal(stillActive.players[1 - turnStart.activeSlot].remainingMs, 120000);
  await sleep(230);
  const beforePass = second.messages.length;
  send(first, 'pass', { letter: follow.letter });
  const handoff = (await wait(second, 'state', p => p.phase === 'playing' &&
    p.activeSlot === 1 - turnStart.activeSlot && Number.isFinite(p.turnReadyAt), beforePass)).payload;
  assert.equal(handoff.deadline, null, 'Both clocks paused during two-second transition');
  assert.ok(handoff.turnReadyAt >= Date.now() + 1400);
  const beforeEarly = second.messages.length;
  send(second, 'answer', { letter: 'A', answer: 'PRUEBA ANTICIPADA' });
  await wait(second, 'error', p => /cambio de turno/.test(p.message), beforeEarly);
  const secondQ = (await wait(second, 'question', p => p.letter === 'A', beforePass, 5000)).payload;
  assert.notEqual(firstQ.text, secondQ.text, 'Different question for same letter');
  const afterHandoff = (await wait(second, 'state', p => p.phase === 'playing' &&
    p.activeSlot === 1 - turnStart.activeSlot && p.turnReadyAt === null && p.deadline > Date.now(), beforePass)).payload;
  assert.equal(afterHandoff.players[turnStart.activeSlot].remainingMs, handoff.players[turnStart.activeSlot].remainingMs);
  await sleep(230);
  const beforeWrong = second.messages.length;
  const firstBeforeWrong = first.messages.length;
  send(second, 'answer', { letter: secondQ.letter, answer: 'RESPUESTA INVÁLIDA DE TEST 99999' });
  await wait(second, 'answerResult', p => p.correct === false && p.letter === 'A', beforeWrong, 2500);
  assert.equal(second.messages.slice(beforeWrong).some(m => m.type === 'pasala:answerPending'), false,
    'Clearly wrong response must not open a correction window');
  await wait(first, 'state', p => p.phase === 'playing' &&
    p.activeSlot === turnStart.activeSlot && p.turnReadyAt !== null &&
    p.players[1 - turnStart.activeSlot].incorrect === 1, firstBeforeWrong, 4500);
  const beforeIllegalSpectator = turnsViewer.messages.length;
  send(turnsViewer, 'pass', { letter: 'A' });
  await wait(turnsViewer, 'error', p => p.message === 'Acción no permitida.', beforeIllegalSpectator);
  assert.equal(turnsViewer.messages.some(m => m.type === 'pasala:question'), false);
  assert.equal(JSON.stringify(turnsViewer.messages).includes('respuestasAlternativas'), false);
  assert.equal(JSON.stringify(turnsViewer.messages).includes('RESPUESTA INVÁLIDA DE TEST'), false);
  const beforeEnding = second.messages.length;
  send(first, 'leave');
  const turnForfeit = (await wait(second, 'result', p => p.reason === 'forfeit', beforeEnding)).payload;
  assert.equal(turnForfeit.winner, turnStart.activeSlot === 0 ? turnJoin.playerId : turnRoom.playerId);
  assert.ok(turnForfeit.players.every(p => p.elapsedSeconds < 20));
  await sleep(350);
  const turnLateViewer = await connect(port);
  send(turnLateViewer, 'spectate', { roomId: turnRoom.roomId });
  const stableTurnResult = (await wait(turnLateViewer, 'result')).payload;
  assert.deepEqual(stableTurnResult.players.map(p => p.elapsedSeconds),
    turnForfeit.players.map(p => p.elapsedSeconds), 'Turn-duel clocks freeze at the final whistle');

  console.log('Arena WebSocket integration OK: staging health, origin rejection, two clients, ' +
    'unready/ready, mirrored rosco, real socket reconnect, server-scored 26 answers, spectator privacy, ' +
    'rematch, forfeit, conditional correction, instant wrong grading, alternating roscos and immutable final statistics');
}
async function cleanup() {
  for (const client of connections) {
    try { client.socket.terminate(); } catch {}
  }
  if (!serverProcess || serverProcess.exitCode !== null) return;
  await new Promise(resolve => {
    const timer = setTimeout(() => { serverProcess.kill('SIGKILL'); resolve(); }, 1800);
    serverProcess.once('exit', () => { clearTimeout(timer); resolve(); });
    serverProcess.kill('SIGTERM');
  });
}
main().catch(err => {
  console.error('Arena WebSocket integration FAILED:', err.stack || err);
  process.exitCode = 1;
}).finally(cleanup);
