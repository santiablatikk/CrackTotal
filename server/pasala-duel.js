'use strict';

/**
 * Pasala Che 1v1 — isolated, server-authoritative WebSocket rooms.
 * Existing Quién Sabe Más / Mentiroso protocol is intentionally untouched.
 * No answer is ever sent over the duel protocol.
 */
const crypto = require('crypto');
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DURATIONS = Object.freeze({ facil: 360, normal: 300, dificil: 240 });
const TURN_DURATIONS = Object.freeze({ facil: 180, normal: 150, dificil: 120 });
const TURN_HANDOFF_MS = 2000;
const ANSWER_CORRECTION_MS = 6000;
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
  const remainingFor = (room, slot) => {
    const player = room.players[slot];
    if (!player || room.mode !== 'turns') return null;
    if (room.phase === 'playing' && room.activeSlot === slot && room.deadline !== null) {
      return Math.max(0, Math.min(player.remainingMs, room.deadline - now()));
    }
    return player.remainingMs;
  };
  const playerPublic = (room, slot) => {
    const player = room.players[slot];
    return player && ({
      id: player.id, name: player.name, connected: live(player), ready: player.ready,
      correct: player.correct, incorrect: player.incorrect,
      answered: player.correct + player.incorrect, finished: player.finishedAt !== null,
      ...(room.mode === 'turns' ? { remainingMs: remainingFor(room, slot),
        status: { ...player.status } } : {})
    });
  };
  const snapshot = room => ({
    roomId: room.id, public: room.public, phase: room.phase, difficulty: room.difficulty,
    mode: room.mode, activeSlot: room.activeSlot, firstSlot: room.firstSlot,
    turnReadyAt: room.turnReadyAt, correctionWindowMs: room.mode === 'turns' ? ANSWER_CORRECTION_MS : null,
    serverNow: now(),
    duration: room.duration, deadline: room.deadline, countdownEndsAt: room.countdownEndsAt, endedAt: room.endedAt, winner: room.winner,
    spectatorCount: room.spectators.size,
    players: [playerPublic(room, 0), playerPublic(room, 1)]
  });
  function emitRoom(room) {
    const state = snapshot(room);
    room.players.forEach(player => { if (player) send(player.ws, 'pasala:state', state); });
    room.spectators.forEach(ws => send(ws, 'pasala:state', state));
  }
  const questionsFor = (room, slot) => room.mode === 'turns' ? room.questions[slot] : room.questions;
  function questionFor(room, player) {
    if (!player || room.phase !== 'playing' || player.finishedAt !== null) return;
    const slot = room.players.indexOf(player);
    if (room.mode === 'turns' && (room.activeSlot !== slot || room.turnReadyAt !== null)) return;
    const pending = LETTERS.filter(letter => player.status[letter] === 'pending');
    if (!pending.length) {
      player.finishedAt = now();
      send(player.ws, 'pasala:playerFinished', { correct: player.correct, incorrect: player.incorrect });
      emitRoom(room);
      if (room.mode === 'turns') switchTurn(room, 1 - slot);
      else if (room.players.every(p => p && p.finishedAt !== null)) finish(room);
      return;
    }
    for (let i = 0; i < LETTERS.length; i++) {
      const pos = (player.position + i) % LETTERS.length;
      if (player.status[LETTERS[pos]] === 'pending') {
        player.position = pos;
        const letter = LETTERS[pos];
        send(player.ws, 'pasala:question', {
          letter, text: questionsFor(room, slot)[letter].pregunta, statuses: player.status
        });
        return;
      }
    }
  }
  function selectQuestions(previous = null) {
    const selected = {};
    for (const letter of LETTERS) {
      const record = bank.find(item => item.letra === letter);
      if (!record || !Array.isArray(record.preguntas)) throw new Error('Missing bank letter ' + letter);
      const questions = record.preguntas.filter(q => typeof q.pregunta === 'string' && typeof q.respuesta === 'string');
      if (!questions.length) throw new Error('No valid questions for ' + letter);
      // Revancha inteligente: nunca repetir la misma pregunta si existe otra válida para la letra.
      // Si el banco solo tiene una, se conserva para no bloquear partidas antiguas.
      const fresh = previous?.[letter]
        ? questions.filter(q => normalize(q.pregunta) !== normalize(previous[letter].pregunta))
        : questions;
      const candidates = fresh.length ? fresh : questions;
      selected[letter] = candidates[Math.floor(random() * candidates.length)];
    }
    return selected;
  }
  function selectQuestionPair(previous = null) {
    const first = selectQuestions(previous?.[0] || null);
    const second = {};
    for (const letter of LETTERS) {
      const record = bank.find(item => item.letra === letter);
      const options = record.preguntas.filter(q => typeof q.pregunta === 'string' &&
        typeof q.respuesta === 'string' && normalize(q.pregunta) !== normalize(first[letter].pregunta));
      if (!options.length) throw new Error('Two different questions required for ' + letter);
      const previousTexts = new Set((previous || []).map(rosco =>
        rosco?.[letter] ? normalize(rosco[letter].pregunta) : '').filter(Boolean));
      const fresh = options.filter(q => !previousTexts.has(normalize(q.pregunta)));
      const candidates = fresh.length ? fresh : options;
      second[letter] = candidates[Math.floor(random() * candidates.length)];
    }
    return [first, second];
  }
  function activateTurn(room, slot) {
    if (room.phase !== 'playing' || room.activeSlot !== slot) return;
    room.turnReadyAt = null; room.turnTimer = null;
    room.deadline = now() + room.players[slot].remainingMs;
    room.deadlineTimer = timers.setTimeout(() => {
      if (room.phase !== 'playing' || room.activeSlot !== slot) return;
      if (room.players[slot].pendingAnswer) finalizeAnswer(room, slot, true);
      else switchTurn(room, 1 - slot);
    }, room.players[slot].remainingMs);
    emitRoom(room); questionFor(room, room.players[slot]);
  }
  function switchTurn(room, requestedSlot, immediate = false) {
    if (room.mode !== 'turns' || room.phase !== 'playing') return;
    if (room.deadlineTimer) timers.clearTimeout(room.deadlineTimer);
    if (room.turnTimer) timers.clearTimeout(room.turnTimer);
    if (room.activeSlot !== null && room.deadline !== null) {
      const outgoing = room.players[room.activeSlot];
      outgoing.remainingMs = remainingFor(room, room.activeSlot);
      if (outgoing.remainingMs <= 0 && outgoing.finishedAt === null) {
        outgoing.finishedAt = now();
        send(outgoing.ws, 'pasala:playerFinished', { correct: outgoing.correct, incorrect: outgoing.incorrect, reason: 'timeout' });
      }
    }
    room.deadline = null; room.turnReadyAt = null;
    const slot = [requestedSlot, 1 - requestedSlot].find(index => {
      const player = room.players[index];
      return player && player.finishedAt === null && player.remainingMs > 0;
    });
    if (slot === undefined) { finish(room); return; }
    room.activeSlot = slot;
    if (immediate) return activateTurn(room, slot);
    const at = now() + TURN_HANDOFF_MS;
    room.turnReadyAt = at;
    room.turnTimer = timers.setTimeout(() => {
      if (room.phase === 'playing' && room.activeSlot === slot && room.turnReadyAt === at) activateTurn(room, slot);
    }, TURN_HANDOFF_MS);
    emitRoom(room);
  }
  function finalizeAnswer(room, slot, timeExpired = false) {
    const player = room.players[slot], pending = player?.pendingAnswer;
    if (!pending || room.phase !== 'playing' || room.activeSlot !== slot) return;
    if (pending.timer) timers.clearTimeout(pending.timer);
    player.pendingAnswer = null;
    const question = questionsFor(room, slot)[pending.letter];
    const allowed = [question.respuesta, ...(Array.isArray(question.respuestasAlternativas) ? question.respuestasAlternativas : [])];
    const correct = allowed.some(value => normalize(pending.answer) === normalize(value));
    player.status[pending.letter] = correct ? 'correct' : 'incorrect';
    player[correct ? 'correct' : 'incorrect']++;
    player.position = (player.position + 1) % LETTERS.length;
    send(player.ws, 'pasala:answerResult', { letter: pending.letter, correct, correctCount: player.correct, incorrectCount: player.incorrect });
    if (!correct || timeExpired || now() >= room.deadline) switchTurn(room, 1 - slot);
    else { questionFor(room, player); emitRoom(room); }
  }
  function updateProvisionalAnswer(ws, payload = {}, finalize = false) {
    const link = peers.get(ws), room = link && rooms.get(link.roomId);
    if (!room || link.role !== 'player' || room.mode !== 'turns' || room.phase !== 'playing') return error(ws, 'Corrección no disponible.');
    const player = room.players[link.slot], pending = player?.pendingAnswer;
    if (!player || player.ws !== ws || room.activeSlot !== link.slot || !pending ||
        pending.letter !== payload.letter || now() >= pending.endsAt) return error(ws, 'La ventana de corrección terminó.');
    if (finalize) { finalizeAnswer(room, link.slot); return; }
    if (pending.edits >= 1) return error(ws, 'Solo se permite una corrección por respuesta.');
    if (typeof payload.answer !== 'string' || !payload.answer.trim() || payload.answer.length > 120) return error(ws, 'Ingresá una respuesta válida.');
    pending.answer = payload.answer.trim(); pending.edits++;
    send(ws, 'pasala:answerPending', { letter: pending.letter, answer: pending.answer, endsAt: pending.endsAt, editsRemaining: 0 });
  }
  function newPlayer(ws, name) {
    return {
      id: token(6), name: safeName(name), reconnectToken: token(18),
      ws, ready: false, correct: 0, incorrect: 0, position: 0,
      status: Object.fromEntries(LETTERS.map(letter => [letter, 'pending'])),
      finishedAt: null, lastAction: 0, graceTimer: null, remainingMs: null, pendingAnswer: null
    };
  }
  function create(ws, payload = {}, clientInfo) {
    if (peers.has(ws) || (clientInfo && clientInfo.roomId)) return error(ws, 'Ya estás en otra sala.');
    if (rooms.size >= MAX_ROOMS) return error(ws, 'La arena está completa. Probá de nuevo más tarde.');
    let roomId = token(5).toUpperCase();
    while (rooms.has(roomId)) roomId = token(5).toUpperCase();
    const mode = payload.mode === 'turns' ? 'turns' : 'mirror';
    const durationMap = mode === 'turns' ? TURN_DURATIONS : DURATIONS;
    const difficulty = durationMap[payload.difficulty] ? payload.difficulty : 'normal';
    const room = {
      id: roomId, public: !!payload.public, difficulty, mode, duration: durationMap[difficulty],
      phase: 'waiting', players: [newPlayer(ws, payload.name), null], spectators: new Set(),
      activeSlot: null, firstSlot: random() < 0.5 ? 0 : 1,
      questions: null, deadline: null, startedAt: null, endedAt: null, winner: null, winnerReason: null,
      createdAt: now(), countdown: null, countdownEndsAt: null, ticker: null, deadlineTimer: null,
      turnReadyAt: null, turnTimer: null, cleanup: null
    };
    room.players[0].remainingMs = room.duration * 1000;
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
    room.players[1].remainingMs = room.duration * 1000;
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
    const mode = payload.mode === 'turns' ? 'turns' : 'mirror';
    const difficulty = DURATIONS[payload.difficulty] ? payload.difficulty : 'normal';
    const available = [...rooms.values()].find(room =>
      room.public && room.phase === 'waiting' && !room.players[1] &&
      room.difficulty === difficulty && room.mode === mode && live(room.players[0]));
    if (available) return join(ws, { roomId: available.id, name: payload.name }, clientInfo);
    create(ws, { name: payload.name, difficulty, mode, public: true }, clientInfo);
  }
  function ready(ws) {
    const link = peers.get(ws);
    if (!link || link.role !== 'player') return error(ws, 'No estás jugando.');
    const room = rooms.get(link.roomId);
    if (!room || room.phase !== 'waiting') return error(ws, 'La partida no está en espera.');
    room.players[link.slot].ready = true;
    emitRoom(room);
    if (room.players.every(player => player && player.ready && live(player))) {
      try { room.questions = room.mode === 'turns' ? selectQuestionPair() : selectQuestions(); }
      catch (err) { console.error('Pasala 1v1 bank:', err); return error(ws, 'No se pudieron cargar preguntas.'); }
      room.phase = 'countdown';
      room.countdownEndsAt = now() + 3000;
      emitRoom(room);
      room.countdown = timers.setTimeout(() => start(room), 3000);
    }
  }
  function unready(ws) {
    const link = peers.get(ws);
    if (!link || link.role !== 'player') return error(ws, 'No estás jugando.');
    const room = rooms.get(link.roomId);
    if (!room || room.phase !== 'waiting') return error(ws, 'La partida ya está por comenzar.');
    const player = room.players[link.slot];
    if (!player || player.ws !== ws) return error(ws, 'No autorizado.');
    player.ready = false;
    emitRoom(room);
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
    if (room.mode === 'turns') {
      room.activeSlot = null;
      switchTurn(room, room.firstSlot, true);
    } else {
      room.deadline = room.startedAt + room.duration * 1000;
      emitRoom(room);
      room.players.forEach(player => questionFor(room, player));
      room.deadlineTimer = timers.setTimeout(() => finish(room), room.duration * 1000);
    }
    room.ticker = timers.setInterval(() => emitRoom(room), 1000);
  }
  function answer(ws, payload = {}, isPass = false) {
    const link = peers.get(ws);
    if (!link || link.role !== 'player') return error(ws, 'Acción no permitida.');
    const room = rooms.get(link.roomId);
    if (!room || room.phase !== 'playing') return error(ws, 'La partida terminó.');
    if (room.mode === 'turns') {
      if (room.turnReadyAt !== null || room.deadline === null) return error(ws, 'Esperá a que termine el cambio de turno.');
      if (room.activeSlot !== link.slot) return error(ws, 'Todavía no es tu turno.');
      if (now() >= room.deadline) {
        switchTurn(room, 1 - link.slot);
        return error(ws, 'Se agotó tu turno.');
      }
    } else if (now() >= room.deadline) return error(ws, 'La partida terminó.');
    const player = room.players[link.slot];
    if (!player || player.ws !== ws || player.finishedAt !== null) return error(ws, 'Acción no permitida.');
    const letter = LETTERS[player.position];
    if (player.status[letter] !== 'pending' || payload.letter !== letter) return error(ws, 'Letra fuera de turno.');
    if (room.mode === 'turns' && player.pendingAnswer) return error(ws, 'Primero confirmá tu respuesta provisional.');
    if (now() - player.lastAction < 180) return error(ws, 'Esperá un instante antes de responder o pasar.');
    player.lastAction = now();
    if (room.mode === 'turns' && !isPass) {
      if (typeof payload.answer !== 'string' || !payload.answer.trim() || payload.answer.length > 120) return error(ws, 'Ingresá una respuesta válida.');
      const endsAt = Math.min(now() + ANSWER_CORRECTION_MS, room.deadline);
      const pending = { letter, answer: payload.answer.trim(), endsAt, edits: 0, timer: null };
      player.pendingAnswer = pending;
      pending.timer = timers.setTimeout(() => finalizeAnswer(room, link.slot), Math.max(0, endsAt - now()));
      send(ws, 'pasala:answerPending', { letter, answer: pending.answer, endsAt, editsRemaining: 1 });
      return;
    }
    if (!isPass) {
      if (typeof payload.answer !== 'string' || !payload.answer.trim() || payload.answer.length > 120) return error(ws, 'Ingresá una respuesta válida.');
      const question = questionsFor(room, link.slot)[letter];
      const allowed = [question.respuesta, ...(Array.isArray(question.respuestasAlternativas) ? question.respuestasAlternativas : [])];
      const correct = allowed.some(value => normalize(payload.answer) === normalize(value));
      player.status[letter] = correct ? 'correct' : 'incorrect';
      player[correct ? 'correct' : 'incorrect']++;
      send(ws, 'pasala:answerResult', { letter, correct, correctCount: player.correct, incorrectCount: player.incorrect });
    }
    player.position = (player.position + 1) % LETTERS.length;
    if (room.mode === 'turns' && (isPass || player.status[letter] === 'incorrect')) {
      switchTurn(room, 1 - link.slot);
    } else {
      questionFor(room, player);
      emitRoom(room);
    }
  }
  function result(room) {
    const [a, b] = room.players;
    return {
      roomId: room.id, winner: room.winner, reason: room.winnerReason,
      players: [a, b].map(p => p && ({
        id: p.id, name: p.name, correct: p.correct, incorrect: p.incorrect,
        elapsedSeconds: room.mode === 'turns'
          ? Math.max(0, Math.min(room.duration, Math.ceil((room.duration * 1000 - p.remainingMs) / 1000)))
          : Math.max(0, Math.min(room.duration,
            Math.ceil(((p.finishedAt ?? Math.min(room.endedAt ?? now(), room.deadline ?? room.endedAt ?? now())) - room.startedAt) / 1000)))
      }))
    };
  }
  function finish(room, forfeitSlot = null, forfeitReason = 'forfeit') {
    if (!room || room.phase === 'finished') return;
    if (room.countdown) timers.clearTimeout(room.countdown);
    if (room.ticker) timers.clearInterval(room.ticker);
    if (room.deadlineTimer) timers.clearTimeout(room.deadlineTimer);
    if (room.turnTimer) timers.clearTimeout(room.turnTimer);
    room.players.forEach(p => { if (p?.pendingAnswer?.timer) timers.clearTimeout(p.pendingAnswer.timer); if (p) p.pendingAnswer = null; });
    if (room.mode === 'turns' && room.activeSlot !== null) {
      room.players[room.activeSlot].remainingMs = remainingFor(room, room.activeSlot);
    }
    room.activeSlot = null;
    room.turnReadyAt = null;
    if (room.mode === 'turns') room.deadline = null;
    room.phase = 'finished';
    room.endedAt = now(); // Freeze elapsed-time stats for reconnects and late spectators.
    room.players.forEach(p => { if (p) p.ready = false; });
    const [a, b] = room.players;
    if (forfeitSlot !== null) {
      room.winner = room.players[1 - forfeitSlot]?.id || null;
      room.winnerReason = forfeitReason;
    } else if (!a || !b) { room.winner = null; room.winnerReason = 'incomplete'; }
    else if (a.correct !== b.correct) {
      room.winner = (a.correct > b.correct ? a : b).id; room.winnerReason = 'correct';
    } else if (room.mode === 'turns') {
      room.winner = null; room.winnerReason = 'draw';
    } else if (a.incorrect !== b.incorrect) {
      room.winner = (a.incorrect < b.incorrect ? a : b).id; room.winnerReason = 'incorrect';
    } else if ((a.finishedAt || room.deadline) !== (b.finishedAt || room.deadline)) {
      room.winner = ((a.finishedAt || room.deadline) < (b.finishedAt || room.deadline) ? a : b).id;
      room.winnerReason = 'speed';
    } else { room.winner = null; room.winnerReason = 'draw'; }
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
    if (room.turnTimer) timers.clearTimeout(room.turnTimer);
    if (room.cleanup) timers.clearTimeout(room.cleanup);
    room.players.forEach(p => {
      if (!p) return;
      if (p.graceTimer) timers.clearTimeout(p.graceTimer);
      if (p.pendingAnswer?.timer) timers.clearTimeout(p.pendingAnswer.timer);
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
    if (room.phase === 'countdown') {
      if (room.countdown) timers.clearTimeout(room.countdown);
      room.phase = 'waiting';
      room.countdownEndsAt = null;
      room.players.forEach(p => { if (p) p.ready = false; });
    }
    player.graceTimer = timers.setTimeout(() => {
      if (player.ws) return;
      if (room.phase === 'playing') finish(room, link.slot, 'disconnect');
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
    if (room.phase === 'playing') {
      if (player.pendingAnswer) {
        const pending = player.pendingAnswer, question = questionsFor(room, slot)[pending.letter];
        send(ws, 'pasala:question', { letter: pending.letter, text: question.pregunta, statuses: player.status });
        send(ws, 'pasala:answerPending', { letter: pending.letter, answer: pending.answer, endsAt: pending.endsAt, editsRemaining: 1 - pending.edits });
      } else questionFor(room, player);
    }
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
        p.remainingMs = room.duration * 1000;
        p.lastAction = 0; p.pendingAnswer = null; p.status = Object.fromEntries(LETTERS.map(letter => [letter, 'pending']));
      });
      room.ready = false; room.deadline = null; room.startedAt = null; room.endedAt = null; room.winner = null; room.winnerReason = null;
      room.activeSlot = null;
      room.firstSlot = 1 - room.firstSlot;
      room.questions = room.mode === 'turns' ? selectQuestionPair(room.questions) : selectQuestions(room.questions);
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
      case 'pasala:unready': unready(ws); break;
      case 'pasala:answer': answer(ws, payload); break;
      case 'pasala:reviseAnswer': updateProvisionalAnswer(ws, payload); break;
      case 'pasala:confirmAnswer': updateProvisionalAnswer(ws, payload, true); break;
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
