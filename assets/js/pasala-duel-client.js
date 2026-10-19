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
    clockTimer: null, retryTimer: null, manualLeave: false, clockOffset: 0, pendingAction: false };
  const isStaticPreview = /(?:^|\.)netlify\.app$/i.test(location.hostname) || /(?:^|\.)netlify\.com$/i.test(location.hostname);
  // Connect automatically only on the exact isolated PR preview; never on production or other Netlify sites.
  const previewStaging = location.hostname === 'deploy-preview-1--zingy-haupia-53b742.netlify.app'
    ? 'wss://cracktotal-arena-staging.onrender.com' : '';
  const urlOverride = params.get('server') || window.CRACK_TOTAL_DUEL_WS_URL || previewStaging;
  const wsUrl = urlOverride || (!isStaticPreview ? ((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host) : '');
  const safeCode = code => /^[A-F0-9]{10}$/.test(code);
  const savedSession = () => { try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { return null; } };
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
    if (overlay && error) $('streamPhase').textContent = 'SEÑAL INTERRUMPIDA';
    $('reconnectButton').hidden = !error || !wsUrl;
  };
  function persistSession(payload) {
    try { sessionStorage.setItem(storageKey, JSON.stringify(payload)); } catch {}
  }
  function clearSession() { try { sessionStorage.removeItem(storageKey); } catch {} }
  function setLobbyAvailability(available) {
    ['createForm', 'joinForm', 'watchForm'].forEach(id => {
      $(id).querySelector('button[type="submit"]').disabled = !available;
    });
    $('randomButton').disabled = !available;
  }
  function setActionControls(enabled) {
    $('answerInput').disabled = !enabled;
    $('answerForm').querySelector('button[type="submit"]').disabled = !enabled;
    $('passButton').disabled = !enabled;
  }
  function connect() {
    setLobbyAvailability(false);
    if (!wsUrl) {
      notice('Esta vista previa es estática: para jugar online falta desplegar el servidor WebSocket de esta rama. Podés explorar la interfaz.', true);
      $('reconnectButton').hidden = true; return;
    }
    if (!/^wss:\/\//i.test(wsUrl) && !/^ws:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(wsUrl)) {
      notice('La dirección del servidor debe usar una conexión segura (wss://).', true); return;
    }
    if (state.ws) { state.ws.onclose = null; state.ws.close(); }
    notice('Conectando al servidor del duelo…');
    let ws;
    try { ws = new WebSocket(wsUrl); }
    catch { notice('No se pudo abrir el servidor de la arena. Revisá su dirección.', true); return; }
    state.ws = ws; state.connected = false;
    ws.onopen = () => {
      if (state.ws !== ws) return;
      state.connected = true; setLobbyAvailability(true); notice('Arena conectada. Lista para jugar.');
      if (watchOnly && safeCode(initialRoom)) send('spectate', { roomId: initialRoom });
      else if (savedSession()?.roomId && savedSession()?.reconnectToken && savedSession()?.endpoint === wsUrl && !state.manualLeave && (!safeCode(initialRoom) || initialRoom === savedSession().roomId)) {
        state.reconnecting = true; send('resume', { roomId: savedSession().roomId, reconnectToken: savedSession().reconnectToken });
      } else if (state.spectator && safeCode(state.roomId || initialRoom)) send('spectate', { roomId: state.roomId || initialRoom });
      else if (safeCode(initialRoom)) send('join', { roomId: initialRoom, name: name() });
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
      state.connected = false; setLobbyAvailability(false); setActionControls(false);
      notice('Conexión interrumpida. Intentando volver a la sala…', true);
      if (!state.manualLeave && wsUrl && !state.retryTimer) {
        state.retryTimer = setTimeout(() => { state.retryTimer = null; connect(); }, 3500);
      }
    };
  }
  function receive(type, payload) {
    switch (type) {
      case 'created': case 'joined':
        state.selfId = payload.playerId; state.roomId = payload.roomId; state.spectator = false;
        state.reconnecting = false; state.manualLeave = false;
        persistSession({ roomId: payload.roomId, reconnectToken: payload.reconnectToken, endpoint: wsUrl });
        enterMatch(); break;
      case 'spectating':
        state.roomId = payload.roomId; state.spectator = true; enterMatch(); break;
      case 'state':
        if (state.room?.phase === 'finished' && payload.phase === 'countdown') {
          state.result = null; state.question = null; state.statuses = {};
        }
        state.room = payload; state.roomId = payload.roomId;
        if (Number.isFinite(payload.serverNow)) state.clockOffset = payload.serverNow - Date.now();
        enterMatch(); renderMatch(); break;
      case 'question':
        state.question = payload; state.statuses = payload.statuses || {};
        $('answerInput').value = ''; state.pendingAction = false; setActionControls(true);
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
        state.result = payload; state.question = null; renderMatch(); break;
      case 'closed':
        clearSession(); state.manualLeave = true; state.spectator = watchOnly;
        leaveUI();
        notice(payload.message || 'La sala se cerró. Podés buscar otro duelo.', true);
        if (overlay) {
          $('match').hidden = false;
          $('streamPhase').textContent = 'SALA CERRADA';
          $('streamClock').textContent = '--:--';
        }
        break;
      case 'error':
        if (state.room?.phase === 'playing' && !state.spectator) { state.pendingAction = false; setActionControls(true); }
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
    // Un espectador puede compartir la vista, pero no invitar jugadores al lobby.
    $('copyInvite').hidden = state.spectator;
    $('copyCode').hidden = state.spectator;
    $('copySpectator').hidden = overlay;
    if (overlay) document.body.classList.add('overlay-mode');
  }
  function leaveUI() {
    $('match').hidden = true; $('lobby').hidden = false;
    state.room = null; state.roomId = null; state.selfId = null; state.question = null;
    state.statuses = {}; state.result = null; state.pendingAction = false;
    setActionControls(false);
    if (!watchOnly) document.body.classList.remove('overlay-mode');
  }
  function drawScore() {
    const board = $('scoreboard'); board.replaceChildren();
    const players = state.room?.players || [null,null];
    players.forEach((player,index) => {
      if (index) { const versus = document.createElement('div'); versus.className='score-versus'; versus.textContent='VS'; board.append(versus); }
      const card = document.createElement('div'); card.className='score-player';
      const identity = document.createElement('div'); identity.className='score-name'; identity.textContent = player?.name || 'RIVAL PENDIENTE';
      const phase = state.room?.phase;
      const label = document.createElement('span');
      label.textContent = !player ? 'ESPERANDO…' :
        player.id === state.selfId ? 'VOS' :
        !player.connected ? 'DESCONECTADO' :
        phase === 'playing' ? (player.finished ? 'ROSCO COMPLETO' : 'JUGANDO') :
        phase === 'finished' ? 'PARTIDO FINALIZADO' :
        player.ready ? 'LISTO' : 'EN SALA';
      identity.append(label);
      const progress = document.createElement('span');
      progress.className = 'score-progress';
      progress.textContent = (player?.answered ?? 0) + '/26 LETRAS RESUELTAS';
      identity.append(progress);
      const meter = document.createElement('div');
      meter.className = 'score-meter';
      meter.setAttribute('role', 'progressbar');
      meter.setAttribute('aria-label', 'Letras resueltas por ' + (player?.name || 'jugador pendiente'));
      meter.setAttribute('aria-valuemin', '0');
      meter.setAttribute('aria-valuemax', '26');
      meter.setAttribute('aria-valuenow', String(player?.answered ?? 0));
      const meterFill = document.createElement('div');
      meterFill.className = 'score-meter-fill';
      meterFill.style.width = Math.max(0, Math.min(100, ((player?.answered ?? 0) / 26) * 100)) + '%';
      meter.append(meterFill); identity.append(meter);
      const opponent = players[1 - index];
      if (player && opponent && state.room?.phase === 'playing' && player.correct > opponent.correct) {
        const lead = document.createElement('span'); lead.className = 'score-lead'; lead.textContent = 'EN VENTAJA'; identity.append(lead);
        card.classList.add('is-leading');
      }
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
    $('readyPanel').hidden = phase === 'finished' || (phase === 'playing' && !self?.finished && !state.spectator);
    $('questionPanel').hidden = phase !== 'playing' || state.spectator || !state.question || !!self?.finished;
    $('resultsPanel').hidden = phase !== 'finished';
    const phases = {waiting:'ESPERANDO RIVAL',countdown:'CUENTA REGRESIVA',playing:'DUELO EN VIVO',finished:'PARTIDO FINALIZADO'};
    $('matchStatus').textContent = ({waiting:'SALA ABIERTA / ESPERANDO A LOS DOS',countdown:'CUENTA REGRESIVA / PREPARATE',playing:'DUELO EN CURSO / MARCADOR EN VIVO',finished:'FINAL / RESULTADOS OFICIALES'})[phase] || 'PREPARANDO PARTIDO';
    $('streamPhase').textContent = phases[phase] || 'PREPARANDO PARTIDO';
    $('streamAudience').textContent = (state.room.spectatorCount || 0) + ' MIRANDO';
    if (phase === 'playing' && self?.finished) {
      $('readyHeading').textContent = 'ROSCO COMPLETO.';
      $('readyDescription').textContent = 'Terminaste tus 26 letras. Esperá a que tu rival cierre su rosco o termine el reloj.';
      $('readyButton').hidden = true;
    }
    if (phase === 'waiting' || phase === 'countdown') {
      $('readyHeading').textContent = phase === 'countdown' ? 'ARRANCA EL DUELO.' : !other ? 'ESPERANDO RIVAL.' : 'LOS DOS EN CANCHA.';
      $('readyDescription').textContent = phase === 'countdown' ? 'Preparate: ambos reciben las mismas 26 preguntas.' : !other ? 'Compartí la invitación y esperá a que llegue tu rival.' : 'Los dos deben marcarse como listos. Recién ahí comienza el partido.';
      $('readyButton').disabled = !other || phase !== 'waiting';
      $('readyButton').textContent = self?.ready ? 'CANCELAR LISTO ↶' : 'ESTOY LISTO ✓';
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
      const decisionText = {
        correct: 'Se definió por cantidad de aciertos.',
        incorrect: 'Empate de aciertos: ganó quien cometió menos errores.',
        speed: 'Empate de aciertos y errores: decidió quién terminó antes.',
        forfeit: 'Victoria por abandono o desconexión sin reconexión del rival.',
        draw: 'Empate exacto. La revancha está abierta.',
        incomplete: 'El duelo terminó sin dos participantes.'
      }[state.result?.reason] || 'El duelo terminó.';
      $('resultDescription').textContent = decisionText +
        (winner && !state.spectator ? (victorious ? ' ¡Gran partido!' :
          other?.connected ? ' Pedí revancha y volvé a intentarlo.' : ' Podés abrir un nuevo duelo cuando quieras.') : '');
      const stats = $('resultStats');
      stats.replaceChildren();
      if (summary) summary.filter(Boolean).forEach(player => {
        const row = document.createElement('div');
        row.className = 'result-stat-item' + (player.id === winner ? ' is-winner' : '');
        const identity = document.createElement('strong');
        identity.textContent = player.name + (player.id === winner ? ' ★' : '');
        const numbers = document.createElement('span');
        const time = Number.isFinite(player.elapsedSeconds) ?
          Math.floor(player.elapsedSeconds / 60) + ':' + String(player.elapsedSeconds % 60).padStart(2, '0') : '—';
        const pending = Math.max(0, 26 - player.correct - player.incorrect);
        numbers.textContent = player.correct + ' ✓  ·  ' + player.incorrect + ' ✕  ·  ' +
          pending + ' pendientes  ·  ' + time;
        row.append(identity, numbers);
        stats.appendChild(row);
      });
      const canRematch = !!self && !!other && !!other.connected && state.connected;
      $('rematchButton').hidden = state.spectator;
      $('rematchButton').disabled = !!self?.ready || !canRematch;
      $('rematchButton').textContent = self?.ready ? 'REVANCHA SOLICITADA ✓' :
        !other?.connected ? 'RIVAL DESCONECTADO' : 'PEDIR REVANCHA ↗';
      $('rematchHint').textContent = state.spectator ? '' :
        !other?.connected ? 'El otro jugador salió o está sin conexión. Volvé al lobby para buscar otro rival; si se reconecta, reaparecerá la revancha.' :
        self?.ready ? 'Tu pedido ya se registró. El rival también tiene que aceptar.' :
        'Los dos tienen que pedir revancha para jugar otro rosco.';
      $('shareResult').hidden = !state.result;
      $('shareResult').disabled = !state.result;
    }
    if (state.spectator && phase !== 'finished') {
      $('readyPanel').hidden = false; $('readyButton').hidden = true;
      $('readyHeading').textContent = phase === 'playing' ? 'DUELO EN VIVO.' : 'EN LA PREVIA.';
      $('readyDescription').textContent = 'Estás siguiendo el marcador de ambos jugadores sin ver sus respuestas.';
    } else if (!self?.finished) $('readyButton').hidden = false;
    renderRing(); updateClock();
  }
  function updateClock() {
    if (!state.room) {
      $('clock').textContent = '05:00';
      $('streamClock').textContent = overlay ? '--:--' : '05:00';
      return;
    }
    if (state.room?.phase === 'countdown' && state.room.countdownEndsAt) {
      const remaining = Math.max(1, Math.ceil((state.room.countdownEndsAt - (Date.now() + state.clockOffset)) / 1000));
      $('readyHeading').textContent = `ARRANCAMOS EN ${remaining}`;
    }
    const ms = state.room?.deadline ? Math.max(0, state.room.deadline - (Date.now() + state.clockOffset)) : state.room?.duration * 1000 || 300000;
    const sec = Math.ceil(ms / 1000);
    const timeLabel = String(Math.floor(sec / 60)).padStart(2,'0') + ':' + String(sec % 60).padStart(2,'0');
    $('clock').textContent = timeLabel;
    $('streamClock').textContent = timeLabel;
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
  $('readyButton').addEventListener('click', () => {
    const self = state.room?.players?.find(player => player && player.id === state.selfId);
    send(self?.ready ? 'unready' : 'ready');
  });
  $('answerForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!state.question) return;
    const answer = $('answerInput').value.trim();
    if (!answer) return;
    if (state.pendingAction) return;
    if (send('answer', { letter:state.question.letter, answer })) {
      state.pendingAction = true; setActionControls(false);
    }
  });
  $('passButton').addEventListener('click', () => {
    if (!state.question || state.pendingAction) return;
    if (send('pass', { letter:state.question.letter })) {
      state.pendingAction = true; setActionControls(false);
    }
  });
  $('rematchButton').addEventListener('click', () => send('rematch'));
  function shareResultText() {
    if (!state.result?.players?.length) return '';
    const names = state.result.players.filter(Boolean).map(player =>
      player.name + ' ' + player.correct + '/26').join('  ·  ');
    const winner = state.result.players.find(player => player && player.id === state.result.winner);
    const verdict = winner ? 'Ganó ' + winner.name : 'Empate';
    return '⚽ CRACK TOTAL · PASALA CHE 1V1\n' + names +
      '\n' + verdict + '\n' + 'Jugá tu duelo: ' + new URL('pasala-1v1.html', location.href).origin +
      new URL('pasala-1v1.html', location.href).pathname;
  }
  $('shareResult').addEventListener('click', () => {
    const summary = shareResultText();
    if (summary) copyText($('shareResult'), summary);
  });
  function exitRoom() {
    send('leave'); state.manualLeave = true;
    if (state.retryTimer) { clearTimeout(state.retryTimer); state.retryTimer = null; }
    state.spectator = false;
    clearSession(); leaveUI();
    const lobbyUrl = new URL('pasala-1v1.html', location.href);
    if (urlOverride) lobbyUrl.searchParams.set('server', urlOverride);
    history.replaceState({}, '', lobbyUrl.pathname + lobbyUrl.search);
  }
  $('backToLobby').addEventListener('click', exitRoom);
  $('leaveButton').addEventListener('click', exitRoom);
  function invitation(type) {
    const link = new URL('pasala-1v1.html', location.href);
    link.search = '';
    link.searchParams.set(type, state.roomId || '');
    if (urlOverride) link.searchParams.set('server', urlOverride);
    return link.href;
  }
  async function copyText(button, value) {
    try { await navigator.clipboard.writeText(value); button.textContent = 'COPIADO ✓'; }
    catch { window.prompt('Copiá y compartí:', value); }
  }
  $('copyCode').addEventListener('click', () => copyText($('copyCode'), state.roomId || ''));
  $('copyInvite').addEventListener('click', () => copyText($('copyInvite'), invitation('sala')));
  $('copySpectator').addEventListener('click', () => copyText($('copySpectator'), invitation('spectator')));
  $('watchOverlay').addEventListener('click', () => {
    const link = new URL('pasala-1v1.html',location.href); link.search=''; link.searchParams.set('overlay',state.roomId || ''); if (urlOverride) link.searchParams.set('server',urlOverride);
    window.open(link.href, '_blank', 'noopener,noreferrer');
  });
  const setupForm = $('stagingSetup');
  if (setupForm) {
    setupForm.hidden = !isStaticPreview || !!urlOverride || watchOnly;
    setupForm.addEventListener('submit', event => {
      event.preventDefault();
      const feedback = $('stagingSetupFeedback');
      try {
        const proposed = new URL($('stagingServerInput').value.trim());
        const host = proposed.hostname.toLowerCase();
        if (!['https:', 'wss:'].includes(proposed.protocol) || proposed.username || proposed.password ||
            host === 'cracktotal.com' || host.endsWith('.cracktotal.com')) {
          throw new Error('Usá un servidor de pruebas HTTPS independiente, nunca cracktotal.com.');
        }
        const newPage = new URL(location.href);
        newPage.searchParams.set('server', 'wss://' + proposed.host);
        location.assign(newPage.href);
      } catch (error) {
        feedback.textContent = error.message || 'Ingresá la URL HTTPS del servidor de pruebas.';
      }
    });
  }
  $('reconnectButton').addEventListener('click', () => { if (state.retryTimer) clearTimeout(state.retryTimer); state.retryTimer=null; connect(); });
  setLobbyAvailability(false); setActionControls(false);
  if (safeCode(initialRoom) && !watchOnly) $('roomCode').value = initialRoom;
  if (savedSession()?.roomId && savedSession()?.endpoint === wsUrl && !watchOnly && !initialRoom) $('roomCode').value = savedSession().roomId;
  if (overlay) document.body.classList.add('overlay-mode');
  state.clockTimer = setInterval(updateClock, 500);
  connect();
})();
