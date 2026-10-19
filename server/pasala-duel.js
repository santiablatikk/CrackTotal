'use strict';

/**
 * Pasala Che 1v1 — isolated, server-authoritative WebSocket rooms.
 * Existing Quién Sabe Más / Mentiroso protocol is intentionally untouched.
 * No answer is ever sent over the duel protocol.
 */
const crypto = require('crypto');
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DURATIONS = Object.freeze({ facil: 360, normal: 300, dificil: 240 });
const MAX_SPECTATORS = 80;
const MAX_ROOMS = 250;

function createPasalaDuelService(options = {}) {
  const bank = options.bank || require('../assets/data/pasalache_2025.json');
  const now = options.now || Date.now;
  const rooms = new Map();
  const peers = new Map();
  const random = options.random || Math.random;
  const timers = options.timers || { setTimeout, clearTimeout, setInterval, clearInterval };

  const normalize = value => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const safeName = value => String(value || 'Jugador').trim().slice(0, 24) || 'Jugador';
  const token = size => crypto.randomBytes(size).toString('hex');
  const send = (ws, type, payload = {}) => {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type, payload }));
  };
  const error = (ws, message) => send(ws, 'pasala:error', { message });
  const live = player => !!player && !!player.ws && player.ws.readyState === 1;
  const playerPublic = player => player && ({
    id: player.id, name: player.name, connected: live(player), ready: player.ready,
    correct: player.correct, incorrect: player.incorrect,
    answered: player.correct + player.incorrect,
    finished: player.finishedAt !== null
  });
  const snapshot = room => ({
    roomId: room.id, public: room.public, phase: room.phase, difficulty: room.difficulty,
    serverNow: now(),
    duration: room.duration, deadline: room.deadline, countdownEndsAt: room.countdownEndsAt, winner: room.winner,
    spectatorCount: room.spectators.size,
    players: [playerPublic(room.players[0]), playerPublic(room.players[1])]
  });
  function emitRoom(room) {
    const state = snapshot(room);
    room.players.forEach(player => { if (player) send(player.ws, 'pasala:state', state); });
    room.spectators.forEach(ws => send(ws, 'pasala:state', state));
  }
  function questionFor(room, player) {
    if (!player || room.phase !== 'playing' || player.finishedAt !== null) return;
    const pending = LETTERS.filter(letter => player.status[letter] === 'pending');
    if (!pending.length) {
      player.finishedAt = now();
      send(player.ws, 'pasala:playerFinished', { correct: player.correct, incorrect: player.incorrect });
      emitRoom(room);
      if (room.players.every(p => p && p.finishedAt !== null)) finish(room);
      return;
    }
    for (let i = 0; i < LETTERS.length; i++) {
      const pos = (player.position + i) % LETTERS.length;
      if (player.status[LETTERS[pos]] === 'pending') {
        player.position = pos;
        const letter = LETTERS[pos];
        send(player.ws, 'pasala:question', {
          letter, text: room.questions[letter].pregunta, statuses: player.status
        });
        return;
      }
    }
  }
  function selectQuestions() {
    const selected = {};
    for (const letter of LETTERS) {
      const record = bank.find(item => item.letra === letter);
      if (!record || !Array.isArray(record.preguntas)) throw new Error('Missing bank letter ' + letter);
      const questions = record.preguntas.filter(q => typeof q.pregunta === 'string' && typeof q.respuesta === 'string');
      if (!questions.length) throw new Error('No valid questions for ' + letter);
      selected[letter] = questions[Math.floor(random() * questions.length)];
    }
    return selected;
  }
  function newPlayer(ws, name) {
    return {
      id: token(6), name: safeName(name), reconnectToken: token(18),
      ws, ready: false, correct: 0, incorrect: 0, position: 0,
      status: Object.fromEntries(LETTERS.map(letter => [letter, 'pending'])),
      finishedAt: null, lastAction: 0, graceTimer: null
    };
  }
  function create(ws, payload = {}, clientInfo) {
    if (peers.has(ws) || (clientInfo && clientInfo.roomId)) return error(ws, 'Ya estás en otra sala.');
    if (rooms.size >= MAX_ROOMS) return error(ws, 'La arena está completa. Probá de nuevo más tarde.');
    let roomId = token(5).toUpperCase();
    while (rooms.has(roomId)) roomId = token(5).toUpperCase();
    const difficulty = DURATIONS[payload.difficulty] ? payload.difficulty : 'normal';
    const room = {
      id: roomId, public: !!payload.public, difficulty, duration: DURATIONS[difficulty],
      phase: 'waiting', players: [newPlayer(ws, payload.name), null], spectators: new Set(),
      questions: null, deadline: null, startedAt: null, winner: null,
      createdAt: now(), countdown: null, countdownEndsAt: null, ticker: null, deadlineTimer: null, cleanup: null
    };
    rooms.set(roomId, room);
    peers.set(ws, { roomId, role: 'player', slot: 0 });
    send(ws, 'pasala:created', { roomId, playerId: room.players[0].id, reconnectToken: room.players[0].reconnectToken });
    emitRoom(room);
  }
  function join(ws, payload = {}, clientInfo) {
    if (peers.has(ws) || (clientInfo && clientInfo.roomId)) return error(ws, 'Ya estás en otra sala.');
    const room = rooms.get(String(payload.roomId || '').trim().toUpperCase());
    if (!room || room.phase !== 'waiting' || room.players[1]) return error(ws, 'La sala no existe o ya comenzó.');
    room.players[1] = newPlayer(ws, payload.name);
    peers.set(ws, { roomId: room.id, role: 'player', slot: 1 });
    send(ws, 'pasala:joined', {
      roomId: room.id, playerId: room.players[1].id,
      reconnectToken: room.players[1].reconnectToken
    });
    emitRoom(room);
  }
  function spectate(ws, payload = {}, clientInfo) {
    if (peers.has(ws) || (clientInfo && clientInfo.roomId)) return error(ws, 'Ya estás en otra sala.');
    const room = rooms.get(String(payload.roomId || '').trim().toUpperCase());
    if (!room || room.spectators.size >= MAX_SPECTATORS) return error(ws, 'Sala no disponible.');
    room.spectators.add(ws);
    peers.set(ws, { roomId: room.id, role: 'spectator' });
    send(ws, 'pasala:spectating', { roomId: room.id });
    emitRoom(room);
    if (room.phase === 'finished') send(ws, 'pasala:result', result(room));
  }
  function matchmake(ws, payload = {}, clientInfo) {
    const difficulty = DURATIONS[payload.difficulty] ? payload.difficulty : 'normal';
    const available = [...rooms.values()].find(room =>
      room.public && room.phase === 'waiting' && !room.players[1] &&
      room.difficulty === difficulty && live(room.players[0]));
    if (available) return join(ws, { roomId: available.id, name: payload.name }, clientInfo);
    create(ws, { name: payload.name, difficulty, public: true }, clientInfo);
  }
  function ready(ws) {
    const link = peers.get(ws);
    if (!link || link.role !== 'player') return error(ws, 'No estás jugando.');
    const room = rooms.get(link.roomId);
    if (!room || room.phase !== 'waiting') return error(ws, 'La partida no está en espera.');
    room.players[link.slot].ready = true;
    emitRoom(room);
    if (room.players.every(player => player && player.ready && live(player))) {
      try { room.questions = selectQuestions(); }
      catch (err) { console.error('Pasala 1v1 bank:', err); return error(ws, 'No se pudieron cargar preguntas.'); }
      room.phase = 'countdown';
      room.countdownEndsAt = now() + 3000;
      emitRoom(room);
      room.countdown = timers.setTimeout(() => start(room), 3000);
    }
  }
  function start(room) {
    if (room.phase !== 'countdown') return;
    if (!room.players.every(live)) {
      room.phase = 'waiting';
      room.countdownEndsAt = null;
      room.players.forEach(p => { if (p) p.ready = false; });
      emitRoom(room);
      return;
    }
    room.phase = 'playing';
    room.countdownEndsAt = null;
    room.startedAt = now();
    room.deadline = room.startedAt + room.duration * 1000;
    emitRoom(room);
    room.players.forEach(player => questionFor(room, player));
    room.ticker = timers.setInterval(() => emitRoom(room), 1000);
    room.deadlineTimer = timers.setTimeout(() => finish(room), room.duration * 1000);
  }
  function answer(ws, payload = {}, isPass = false) {
    const link = peers.get(ws);
    if (!link || link.role !== 'player') return error(ws, 'Acción no permitida.');
    const room = rooms.get(link.roomId);
    if (!room || room.phase !== 'playing' || now() >= room.deadline) return error(ws, 'La partida terminó.');
    const player = room.players[link.slot];
    if (!player || player.ws !== ws || player.finishedAt !== null) return error(ws, 'Acción no permitida.');
    const letter = LETTERS[player.position];
    if (player.status[letter] !== 'pending' || payload.letter !== letter) return error(ws, 'Letra fuera de turno.');
    if (now() - player.lastAction < 180) return error(ws, 'Esperá un instante antes de responder o pasar.');
    player.lastAction = now();
    if (!isPass) {
      if (typeof payload.answer !== 'string' || !payload.answer.trim() || payload.answer.length > 120) return error(ws, 'Ingresá una respuesta válida.');
      const question = room.questions[letter];
      const allowed = [question.respuesta, ...(Array.isArray(question.respuestasAlternativas) ? question.respuestasAlternativas : [])];
      const correct = allowed.some(value => normalize(payload.answer) === normalize(value));
      player.status[letter] = correct ? 'correct' : 'incorrect';
      player[correct ? 'correct' : 'incorrect']++;
      send(ws, 'pasala:answerResult', { letter, correct, correctCount: player.correct, incorrectCount: player.incorrect });
    }
    player.position = (player.position + 1) % LETTERS.length;
    questionFor(room, player);
    emitRoom(room);
  }
  function result(room) {
    const [a, b] = room.players;
    return {
      roomId: room.id, winner: room.winner,
      players: [a, b].map(p => p && ({
        id: p.id, name: p.name, correct: p.correct, incorrect: p.incorrect,
        elapsedSeconds: Math.min(room.duration, Math.ceil(((p.finishedAt || room.deadline || now()) - room.startedAt) / 1000))
      }))
    };
  }
  function finish(room, forfeitSlot = null) {
    if (!room || room.phase === 'finished') return;
    if (room.countdown) timers.clearTimeout(room.countdown);
    if (room.ticker) timers.clearInterval(room.ticker);
    if (room.deadlineTimer) timers.clearTimeout(room.deadlineTimer);
    room.phase = 'finished';
    room.players.forEach(p => { if (p) p.ready = false; });
    const [a, b] = room.players;
    if (forfeitSlot !== null) room.winner = room.players[1 - forfeitSlot]?.id || null;
    else if (!a || !b) room.winner = null;
    else if (a.correct !== b.correct) room.winner = (a.correct > b.correct ? a : b).id;
    else if (a.incorrect !== b.incorrect) room.winner = (a.incorrect < b.incorrect ? a : b).id;
    else if ((a.finishedAt || room.deadline) !== (b.finishedAt || room.deadline)) room.winner = ((a.finishedAt || room.deadline) < (b.finishedAt || room.deadline) ? a : b).id;
    else room.winner = null;
    emitRoom(room);
    const resultData = result(room);
    room.players.forEach(p => { if (p) send(p.ws, 'pasala:result', resultData); });
    room.spectators.forEach(ws => send(ws, 'pasala:result', resultData));
    room.cleanup = timers.setTimeout(() => drop(room), 10 * 60 * 1000);
  }
  function drop(room) {
    if (!room) return;
    // Explicitly close clients still connected when the room expires or its host leaves.
    const closing = { message: 'La sala se cerró. Podés crear o unirte a otro duelo.' };
    room.players.forEach(p => { if (p) send(p.ws, 'pasala:closed', closing); });
    room.spectators.forEach(ws => send(ws, 'pasala:closed', closing));
    if (room.countdown) timers.clearTimeout(room.countdown);
    if (room.ticker) timers.clearInterval(room.ticker);
    if (room.deadlineTimer) timers.clearTimeout(room.deadlineTimer);
    if (room.cleanup) timers.clearTimeout(room.cleanup);
    room.players.forEach(p => {
      if (!p) return;
      if (p.graceTimer) timers.clearTimeout(p.graceTimer);
      if (p.ws) peers.delete(p.ws);
    });
    room.spectators.forEach(ws => peers.delete(ws));
    rooms.delete(room.id);
  }
  function leave(ws) {
    const link = peers.get(ws);
    if (!link) return;
    peers.delete(ws);
    const room = rooms.get(link.roomId);
    if (!room) return;
    if (link.role === 'spectator') { room.spectators.delete(ws); emitRoom(room); return; }
    const player = room.players[link.slot];
    if (!player || player.ws !== ws) return;
    player.ws = null;
    if (room.phase === 'playing') finish(room, link.slot);
    else if (room.phase === 'finished') emitRoom(room);
    else if (link.slot === 0) drop(room);
    else {
      room.players[1] = null;
      room.phase = 'waiting';
      room.countdownEndsAt = null;
      room.players[0].ready = false;
      if (room.countdown) timers.clearTimeout(room.countdown);
      emitRoom(room);
    }
  }
  function disconnect(ws) {
    const link = peers.get(ws);
    if (!link) return;
    peers.delete(ws);
    const room = rooms.get(link.roomId);
    if (!room) return;
    if (link.role === 'spectator') { room.spectators.delete(ws); emitRoom(room); return; }
    const player = room.players[link.slot];
    if (!player || player.ws !== ws) return;
    player.ws = null;
    player.ready = false;
    // A reconnect during the lobby must require two fresh ready confirmations.
    if (room.phase === 'waiting') room.players.forEach(p => { if (p) p.ready = false; });
    emitRoom(room);
    if (room.phase === 'countdown') {
      if (room.countdown) timers.clearTimeout(room.countdown);
      room.phase = 'waiting';
      room.countdownEndsAt = null;
      room.players.forEach(p => { if (p) p.ready = false; });
    }
    player.graceTimer = timers.setTimeout(() => {
      if (player.ws) return;
      if (room.phase === 'playing') finish(room, link.slot);
      else if (room.phase === 'waiting' && link.slot === 1) {
        room.players[1] = null;
        emitRoom(room);
      } else if (room.phase === 'waiting') drop(room);
    }, 45000);
    emitRoom(room);
  }
  function resume(ws, payload = {}, clientInfo) {
    if (peers.has(ws) || (clientInfo && clientInfo.roomId)) return error(ws, 'Ya estás en una sala.');
    const room = rooms.get(String(payload.roomId || '').trim().toUpperCase());
    if (!room) return error(ws, 'La partida ya no está disponible.');
    const slot = room.players.findIndex(p => p && p.reconnectToken === payload.reconnectToken);
    if (slot < 0 || !payload.reconnectToken) return error(ws, 'Token de reconexión inválido.');
    const player = room.players[slot];
    if (player.ws) peers.delete(player.ws);
    player.ws = ws;
    if (player.graceTimer) timers.clearTimeout(player.graceTimer);
    peers.set(ws, { roomId: room.id, role: 'player', slot });
    send(ws, 'pasala:joined', { roomId: room.id, playerId: player.id, reconnectToken: player.reconnectToken, resumed: true });
    send(ws, 'pasala:state', snapshot(room));
    if (room.phase === 'playing') questionFor(room, player);
    if (room.phase === 'finished') send(ws, 'pasala:result', result(room));
    emitRoom(room);
  }
  function rematch(ws) {
    const link = peers.get(ws);
    const room = link && rooms.get(link.roomId);
    if (!room || link.role !== 'player' || room.phase !== 'finished') return error(ws, 'No hay revancha disponible.');
    const player = room.players[link.slot];
    if (!player || player.ws !== ws) return error(ws, 'No autorizado.');
    player.ready = true;
    emitRoom(room);
    if (room.players.every(p => p && p.ready && live(p))) {
      if (room.cleanup) timers.clearTimeout(room.cleanup);
      room.players.forEach(p => {
        p.correct = 0; p.incorrect = 0; p.position = 0; p.finishedAt = null;
        p.lastAction = 0; p.status = Object.fromEntries(LETTERS.map(letter => [letter, 'pending']));
      });
      room.ready = false; room.deadline = null; room.winner = null;
      room.questions = selectQuestions();
      room.phase = 'countdown';
      room.countdownEndsAt = now() + 3000;
      emitRoom(room);
      room.countdown = timers.setTimeout(() => start(room), 3000);
    }
  }
  function handle(ws, message, clientInfo) {
    if (!message || typeof message.type !== 'string' || !message.type.startsWith('pasala:')) return false;
    const payload = message.payload && typeof message.payload === 'object' ? message.payload : {};
    if (clientInfo && clientInfo.roomId) { error(ws, 'Salí primero de tu otra sala.'); return true; }
    switch (message.type) {
      case 'pasala:create': create(ws, payload, clientInfo); break;
      case 'pasala:join': join(ws, payload, clientInfo); break;
      case 'pasala:matchmake': matchmake(ws, payload, clientInfo); break;
      case 'pasala:spectate': spectate(ws, payload, clientInfo); break;
      case 'pasala:ready': ready(ws); break;
      case 'pasala:answer': answer(ws, payload); break;
      case 'pasala:pass': answer(ws, payload, true); break;
      case 'pasala:leave': leave(ws); break;
      case 'pasala:resume': resume(ws, payload, clientInfo); break;
      case 'pasala:rematch': rematch(ws); break;
      default: error(ws, 'Acción desconocida.');
    }
    return true;
  }
  function destroy() { [...rooms.values()].forEach(drop); peers.clear(); }
  return { handle, disconnect, destroy, rooms, LETTERS, hasPeer: ws => peers.has(ws) };
}
module.exports = { createPasalaDuelService };
