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
async function connect(port) {
  const socket = new WebSocket('ws://127.0.0.1:' + port, { origin });
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
  console.log('Arena WebSocket integration OK: staging health, origin rejection, two clients, ' +
    'unready/ready, mirrored rosco, real socket reconnect, server-scored 26 answers, spectator privacy, ' +
    'rematch, forfeit and immutable final statistics');
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
