(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const overlay = params.has('overlay');
  const initialRoom = (params.get('overlay') || params.get('spectator') || params.get('sala') || '').trim().toUpperCase();
  const watchOnly = overlay || params.has('spectator');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const storageKey = 'ct-pasala-duel-session-v1';
  const state = { ws: null, connected: false, room: null, selfId: null, spectator: watchOnly,
    roomId: null, question: null, statuses: {}, result: null, reconnecting: false,
    clockTimer: null, retryTimer: null, manualLeave: false };
  const urlOverride = params.get('server') || window.CRACK_TOTAL_DUEL_WS_URL || '';
  const isStaticPreview = /(?:^|\.)netlify\.app$/i.test(location.hostname) || /(?:^|\.)netlify\.com$/i.test(location.hostname);
  const wsUrl = urlOverride || (!isStaticPreview ? ((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host) : '');
  const safeCode = code => /^[A-F0-9]{10}$/.test(code);
  const session = (() => { try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { return null; } })();
  const name = () => $('playerName').value.trim().slice(0,24) || 'Jugador';
  const send = (type, payload = {}) => {
    if (!state.connected || !state.ws || state.ws.readyState !== WebSocket.OPEN) {
      notice('No hay conexión con la arena. Reintentá cuando el servidor esté disponible.', true); return false;
    }
    state.ws.send(JSON.stringify({ type: 'pasala:' + type, payload }));
    return true;
  };
  const notice = (message, error = false) => {
    $('connectionText').textContent = message;
    $('connectionNotice').dataset.state = error ? 'error' : 'ready';
    $('reconnectButton').hidden = !error || !wsUrl;
  };
  function persistSession(payload) {
    try { sessionStorage.setItem(storageKey, JSON.stringify(payload)); } catch {}
  }
  function clearSession() { try { sessionStorage.removeItem(storageKey); } catch {} }
  function connect() {
    if (!wsUrl) {
      notice('Esta vista previa es estática: para jugar online falta desplegar el servidor WebSocket de esta rama. Podés explorar la interfaz.', true);
      $('reconnectButton').hidden = true; return;
    }
    if (!/^wss:\/\//i.test(wsUrl) && !/^ws:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(wsUrl)) {
      notice('La dirección del servidor debe usar una conexión segura (wss://).', true); return;
    }
    if (state.ws) { state.ws.onclose = null; state.ws.close(); }
    notice('Conectando al servidor del duelo…');
    const ws = new WebSocket(wsUrl);
    state.ws = ws; state.connected = false;
    ws.onopen = () => {
      if (state.ws !== ws) return;
      state.connected = true; notice('Arena conectada. Lista para jugar.');
      if (watchOnly && safeCode(initialRoom)) send('spectate', { roomId: initialRoom });
      else if (session && session.roomId && session.reconnectToken && !state.manualLeave) {
        state.reconnecting = true; send('resume', { roomId: session.roomId, reconnectToken: session.reconnectToken });
      } else if (safeCode(initialRoom)) send('join', { roomId: initialRoom, name: name() });
    };
    ws.onmessage = event => {
      if (state.ws !== ws) return;
      let message; try { message = JSON.parse(event.data); } catch { return; }
      if (typeof message.type !== 'string' || !message.type.startsWith('pasala:')) return;
      receive(message.type.slice(7), message.payload || {});
    };
    ws.onerror = () => notice('No se pudo establecer la conexión. Revisá que el servidor de duelos esté activo.', true);
    ws.onclose = () => {
      if (state.ws !== ws) return;
      state.connected = false;
      notice('Conexión interrumpida. Intentando volver a la sala…', true);
      if (!state.manualLeave && !isStaticPreview && !state.retryTimer) {
        state.retryTimer = setTimeout(() => { state.retryTimer = null; connect(); }, 3500);
      }
    };
  }
  function receive(type, payload) {
    switch (type) {
      case 'created': case 'joined':
        state.selfId = payload.playerId; state.roomId = payload.roomId; state.spectator = false;
        state.reconnecting = false; state.manualLeave = false;
        persistSession({ roomId: payload.roomId, reconnectToken: payload.reconnectToken });
        enterMatch(); break;
      case 'spectating':
        state.roomId = payload.roomId; state.spectator = true; enterMatch(); break;
      case 'state':
        state.room = payload; state.roomId = payload.roomId;
        enterMatch(); renderMatch(); break;
      case 'question':
        state.question = payload; state.statuses = payload.statuses || {};
        $('answerInput').value = ''; $('answerInput').disabled = false;
        $('answerFeedback').textContent = '';
        renderMatch();
        if (!state.spectator && state.room && state.room.phase === 'playing') $('answerInput').focus({ preventScroll:true });
        break;
      case 'answerResult':
        state.statuses[payload.letter] = payload.correct ? 'correct' : 'incorrect';
        $('answerFeedback').textContent = payload.correct ? '¡CORRECTO! +1' : 'INCORRECTO. SEGUÍ JUGANDO.';
        renderRing(); break;
      case 'playerFinished':
        state.question = null; renderMatch(); break;
      case 'result':
        state.result = payload; state.question = null; clearSession(); renderMatch(); break;
      case 'error':
        notice(payload.message || 'No se pudo completar la acción.', true);
        if (state.reconnecting) {
          state.reconnecting = false; clearSession();
          notice('La sesión anterior ya no está disponible. Creá una sala nueva o ingresá otro código.', true);
          if (!watchOnly) leaveUI();
        }
        break;
    }
  }
  function enterMatch() {
    if (!state.roomId) return;
    $('lobby').hidden = true; $('match').hidden = false;
    $('displayRoom').textContent = state.roomId;
    $('playerRole').textContent = state.spectator ? 'ESPECTADOR / SOLO MARCADOR' : 'JUGADOR / MISMO ROSCO';
    $('watchOverlay').hidden = overlay || !state.roomId;
    if (overlay) document.body.classList.add('overlay-mode');
  }
  function leaveUI() {
    $('match').hidden = true; $('lobby').hidden = false;
    state.room = null; state.roomId = null; state.selfId = null; state.question = null;
    state.statuses = {}; state.result = null;
    if (!watchOnly) document.body.classList.remove('overlay-mode');
  }
  function drawScore() {
    const board = $('scoreboard'); board.replaceChildren();
    const players = state.room?.players || [null,null];
    players.forEach((player,index) => {
      if (index) { const versus = document.createElement('div'); versus.className='score-versus'; versus.textContent='VS'; board.append(versus); }
      const card = document.createElement('div'); card.className='score-player';
      const identity = document.createElement('div'); identity.className='score-name'; identity.textContent = player?.name || 'RIVAL PENDIENTE';
      const label = document.createElement('span'); label.textContent = player ? ((player.id === state.selfId) ? 'VOS' : player.ready ? 'LISTO' : player.connected ? 'EN SALA' : 'DESCONECTADO') : 'ESPERANDO…';
      identity.append(label);
      const score = document.createElement('div'); score.className='score-value'; score.textContent = String(player?.correct ?? 0).padStart(2,'0');
      card.append(identity,score); board.append(card);
    });
  }
  function renderRing() {
    const ring = $('duelRing'); ring.replaceChildren();
    letters.forEach((letter,index) => {
      const node = document.createElement('span');
      node.className = 'ring-letter ' + (state.statuses[letter] || 'pending') + (state.question?.letter === letter && state.room?.phase === 'playing' ? ' current' : '');
      node.style.setProperty('--angle', (index * 360 / letters.length) + 'deg');
      node.textContent = letter; node.setAttribute('role','listitem');
      node.setAttribute('aria-label', letter + ': ' + (state.statuses[letter] || 'pendiente'));
      ring.append(node);
    });
  }
  function renderMatch() {
    if (!state.room) return;
    const phase = state.room.phase;
    const players = state.room.players || [];
    const self = players.find(p => p && p.id === state.selfId);
    const other = players.find(p => p && p.id !== state.selfId);
    drawScore();
    $('readyPanel').hidden = phase === 'playing' || phase === 'finished' || state.spectator;
    $('questionPanel').hidden = phase !== 'playing' || state.spectator || !state.question || !!self?.finished;
    $('resultsPanel').hidden = phase !== 'finished';
    $('matchStatus').textContent = ({waiting:'SALA ABIERTA / ESPERANDO A LOS DOS',countdown:'CUENTA REGRESIVA / PREPARATE',playing:'DUELO EN CURSO / MARCADOR EN VIVO',finished:'FINAL / RESULTADOS OFICIALES'})[phase] || 'PREPARANDO PARTIDO';
    if (phase === 'waiting' || phase === 'countdown') {
      $('readyHeading').textContent = phase === 'countdown' ? 'ARRANCA EL DUELO.' : !other ? 'ESPERANDO RIVAL.' : 'LOS DOS EN CANCHA.';
      $('readyDescription').textContent = phase === 'countdown' ? 'Preparate: ambos reciben las mismas 26 preguntas.' : !other ? 'Compartí la invitación y esperá a que llegue tu rival.' : 'Los dos deben marcarse como listos. Recién ahí comienza el partido.';
      $('readyButton').disabled = !other || !!self?.ready || phase !== 'waiting';
      $('readyButton').textContent = self?.ready ? 'YA ESTÁS LISTO ✓' : 'ESTOY LISTO ✓';
    }
    if (phase === 'playing' && state.question && !state.spectator) {
      $('currentLetter').textContent = state.question.letter;
      $('questionText').textContent = state.question.text;
    }
    if (phase === 'finished') {
      const winner = state.result?.winner ?? state.room.winner;
      const victorious = winner && winner === state.selfId;
      $('resultHeadline').textContent = !winner ? '¡EMPATE!' : state.spectator ? 'HAY GANADOR.' : victorious ? '¡GANASTE EL DUELO!' : 'FIN DEL PARTIDO.';
      const summary = state.result?.players;
      $('resultDescription').textContent = (summary ? summary.map(p => p ? p.name + ': ' + p.correct + ' aciertos' : '').join(' · ') : 'El rosco terminó.') + (winner && !state.spectator ? (victorious ? ' Gran partido.' : ' Pedí revancha y volvé a intentarlo.') : '');
      $('rematchButton').hidden = state.spectator;
      $('rematchButton').disabled = !!self?.ready;
      $('rematchButton').textContent = self?.ready ? 'REVANCHA SOLICITADA ✓' : 'PEDIR REVANCHA ↗';
    }
    if (state.spectator && phase !== 'finished') {
      $('readyPanel').hidden = false; $('readyButton').hidden = true;
      $('readyHeading').textContent = phase === 'playing' ? 'DUELO EN VIVO.' : 'EN LA PREVIA.';
      $('readyDescription').textContent = 'Estás siguiendo el marcador de ambos jugadores sin ver sus respuestas.';
    } else $('readyButton').hidden = false;
    renderRing(); updateClock();
  }
  function updateClock() {
    const ms = state.room?.deadline ? Math.max(0, state.room.deadline - Date.now()) : state.room?.duration * 1000 || 300000;
    const sec = Math.ceil(ms / 1000);
    $('clock').textContent = String(Math.floor(sec / 60)).padStart(2,'0') + ':' + String(sec % 60).padStart(2,'0');
  }
  function launch(mode, roomCode) {
    if (!state.connected) return notice('Esperá a conectarte con el servidor del duelo.', true);
    state.manualLeave = false;
    state.result = null; state.question = null; state.statuses = {};
    if (mode === 'create') send('create', { name:name(), difficulty:$('difficulty').value, public:false });
    if (mode === 'join') send('join', { roomId:roomCode, name:name() });
    if (mode === 'matchmake') send('matchmake', { name:name(), difficulty:$('difficulty').value });
    if (mode === 'spectate') send('spectate', { roomId:roomCode });
  }
  $('createForm').addEventListener('submit', event => { event.preventDefault(); launch('create'); });
  $('joinForm').addEventListener('submit', event => { event.preventDefault(); launch('join',$('roomCode').value.trim().toUpperCase()); });
  $('watchForm').addEventListener('submit', event => { event.preventDefault(); launch('spectate',$('spectatorCode').value.trim().toUpperCase()); });
  $('randomButton').addEventListener('click', () => launch('matchmake'));
  $('readyButton').addEventListener('click', () => send('ready'));
  $('answerForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!state.question) return;
    const answer = $('answerInput').value.trim();
    if (!answer) return;
    if (send('answer', { letter:state.question.letter, answer })) $('answerInput').disabled = true;
  });
  $('passButton').addEventListener('click', () => { if (state.question) send('pass', { letter:state.question.letter }); });
  $('rematchButton').addEventListener('click', () => send('rematch'));
  function exitRoom() {
    send('leave'); state.manualLeave = true;
    clearSession(); leaveUI();
    history.replaceState({}, '', 'pasala-1v1.html');
  }
  $('backToLobby').addEventListener('click', exitRoom);
  $('leaveButton').addEventListener('click', exitRoom);
  $('copyInvite').addEventListener('click', async () => {
    const link = new URL('pasala-1v1.html', location.href); link.search='?sala=' + encodeURIComponent(state.roomId || '');
    const value = link.href;
    try { await navigator.clipboard.writeText(value); $('copyInvite').textContent='COPIADO ✓'; }
    catch { window.prompt('Copiá esta invitación:', value); }
  });
  $('watchOverlay').addEventListener('click', () => {
    const link = new URL('pasala-1v1.html',location.href); link.search='?overlay=' + encodeURIComponent(state.roomId || '');
    window.open(link.href, '_blank', 'noopener,noreferrer');
  });
  $('reconnectButton').addEventListener('click', () => { if (state.retryTimer) clearTimeout(state.retryTimer); state.retryTimer=null; connect(); });
  if (safeCode(initialRoom) && !watchOnly) $('roomCode').value = initialRoom;
  if (session?.roomId && !watchOnly && !initialRoom) $('roomCode').value = session.roomId;
  if (overlay) document.body.classList.add('overlay-mode');
  state.clockTimer = setInterval(updateClock, 500);
  connect();
})();
