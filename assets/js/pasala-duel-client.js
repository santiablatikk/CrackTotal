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
    clockTimer: null, retryTimer: null, manualLeave: false, clockOffset: 0, pendingAction: false,
    pendingAnswer: null, connectionSlowTimer: null };
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
  const correctedTime = () => Date.now() + state.clockOffset;
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
    if (state.connectionSlowTimer) clearTimeout(state.connectionSlowTimer);
    state.connectionSlowTimer = setTimeout(() => {
      if (!state.connected) notice('El servidor de pruebas está iniciando. Puede tardar cerca de un minuto; no cierres esta pantalla.');
    }, 7000);
    let ws;
    try { ws = new WebSocket(wsUrl); }
    catch { notice('No se pudo abrir el servidor de la arena. Revisá su dirección.', true); return; }
    state.ws = ws; state.connected = false;
    ws.onopen = () => {
      if (state.ws !== ws) return;
      state.connected = true;
      if (state.connectionSlowTimer) clearTimeout(state.connectionSlowTimer);
      setLobbyAvailability(true); notice('Arena conectada. Lista para jugar.');
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
      if (state.connectionSlowTimer) clearTimeout(state.connectionSlowTimer);
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
        if (payload.mode === 'turns' && payload.phase === 'playing' &&
            payload.activeSlot !== payload.players.findIndex(p => p && p.id === state.selfId)) {
          state.question = null;
        }
        if (state.room?.phase === 'finished' && payload.phase === 'countdown') {
          state.result = null; state.question = null; state.statuses = {}; state.pendingAnswer = null;
        }
        state.room = payload; state.roomId = payload.roomId;
        if (Number.isFinite(payload.serverNow)) state.clockOffset = payload.serverNow - Date.now();
        enterMatch(); renderMatch(); break;
      case 'question':
        state.question = payload; state.statuses = payload.statuses || {}; state.pendingAnswer = null;
        $('answerInput').value = ''; state.pendingAction = false; setActionControls(true);
        $('answerFeedback').textContent = '';
        renderMatch();
        if (!state.spectator && state.room && state.room.phase === 'playing') $('answerInput').focus({ preventScroll:true });
        break;
      case 'answerPending':
        state.pendingAnswer = payload; state.pendingAction = false;
        $('correctionInput').value = payload.answer;
        $('confirmAnswer').disabled = false;
        renderMatch();
        break;
      case 'answerResult':
        state.pendingAnswer = null; state.pendingAction = true;
        state.statuses[payload.letter] = payload.correct ? 'correct' : 'incorrect';
        $('answerFeedback').textContent = payload.correct ? '¡CORRECTO! +1' :
          state.room?.mode === 'turns' ? 'INCORRECTO · TURNO DEL RIVAL' : 'INCORRECTO. SEGUÍ JUGANDO.';
        renderRing(); break;
      case 'playerFinished':
        state.question = null; renderMatch(); break;
      case 'result':
        state.result = payload; state.question = null; state.pendingAnswer = null; renderMatch(); break;
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
        if (state.room?.phase === 'playing' && !state.spectator) {
          state.pendingAction = false;
          const selfSlot = state.room.players.findIndex(p => p && p.id === state.selfId);
          setActionControls(!state.pendingAnswer && (state.room.mode !== 'turns' ||
            (state.room.activeSlot === selfSlot && !state.room.turnReadyAt)));
        }
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
    $('playerRole').textContent = state.spectator ? 'ESPECTADOR / SOLO MARCADOR' :
      state.room?.mode === 'turns' ? 'JUGADOR / ROSCO POR TURNOS' : 'JUGADOR / ROSCO ESPEJO';
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
    state.statuses = {}; state.result = null; state.pendingAction = false; state.pendingAnswer = null;
    setActionControls(false);
    if (!watchOnly) document.body.classList.remove('overlay-mode');
  }
  function renderLobbyPlayers() {
    const panel = $('lobbyPlayers');
    if (!state.room || !['waiting', 'countdown'].includes(state.room.phase)) {
      panel.hidden = true; return;
    }
    panel.hidden = false;
    const turns = state.room.mode === 'turns';
    $('lobbyModeLabel').textContent = turns ? 'ROSCO POR TURNOS' : 'ROSCO ESPEJO';
    const durationMinutes = Math.floor(state.room.duration / 60);
    const durationSeconds = String(state.room.duration % 60).padStart(2, '0');
    $('lobbyDurationLabel').textContent = durationMinutes + ':' + durationSeconds + (turns ? ' POR JUGADOR' : ' POR PARTIDA');
    const holder = $('lobbyPlayersList'); holder.replaceChildren();
    (state.room.players || []).forEach((player, index) => {
      const item = document.createElement('div');
      item.className = 'lobby-player' + (player?.ready ? ' is-ready' : '') + (!player?.connected && player ? ' is-disconnected' : '');
      const role = document.createElement('span');
      role.textContent = index === 0 ? '01 · ANFITRIÓN' : '02 · INVITADO';
      const title = document.createElement('strong');
      title.textContent = player?.name || 'ESPERANDO RIVAL…';
      const status = document.createElement('small');
      status.textContent = !player ? 'COMPARTÍ EL CÓDIGO PARA INVITARLO' :
        !player.connected ? 'DESCONECTADO · ESPERANDO RECONEXIÓN' :
        player.ready ? '● LISTO PARA JUGAR' : '● CONECTADO · FALTA CONFIRMAR';
      item.append(role, title, status); holder.append(item);
    });
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
        player.id === state.selfId ? (phase === 'playing' && state.room?.mode === 'turns' && state.room.activeSlot === index ? 'VOS · EN TURNO' : 'VOS') :
        !player.connected ? 'DESCONECTADO' :
        phase === 'playing' ? (player.finished ? 'ROSCO FINALIZADO' :
          state.room?.mode === 'turns' ? (state.room.activeSlot === index ? 'EN TURNO' : 'ESPERANDO TURNO') : 'JUGANDO') :
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
      if (player && state.room?.mode === 'turns' && state.room.phase === 'playing' && state.room.activeSlot === index) card.classList.add('is-active');
      if (player && opponent && state.room?.phase === 'playing' && player.correct > opponent.correct) {
        const lead = document.createElement('span'); lead.className = 'score-lead'; lead.textContent = 'EN VENTAJA'; identity.append(lead);
        card.classList.add('is-leading');
      }
      const score = document.createElement('div'); score.className='score-value'; score.textContent = String(player?.correct ?? 0).padStart(2,'0');
      card.append(identity,score); board.append(card);
    });
  }
  function renderRing() {
    const turnMode = state.room?.mode === 'turns';
    const players = state.room?.players || [];
    const ownSlot = state.spectator ? 0 : Math.max(0, players.findIndex(p => p && p.id === state.selfId));
    const render = (ring, statuses, currentLetter, passedLetters = []) => {
      ring.replaceChildren();
      const passed = new Set(Array.isArray(passedLetters) ? passedLetters : []);
      letters.forEach((letter,index) => {
        const node = document.createElement('span');
        const status = statuses?.[letter] || 'pending';
        const visualStatus = status === 'pending' && passed.has(letter) ? 'passed' : status;
        node.className = 'ring-letter ' + visualStatus + (currentLetter === letter ? ' current' : '');
        node.style.setProperty('--angle', (index * 360 / letters.length) + 'deg');
        node.textContent = letter; node.setAttribute('role','listitem');
        node.setAttribute('aria-label', 'Letra ' + letter + ': ' +
          ({correct:'correcta',incorrect:'incorrecta',passed:'Pasapalabra, pendiente',pending:'sin responder'}[visualStatus] || 'sin responder') +
          (currentLetter === letter ? ', en juego' : ''));
        ring.append(node);
      });
    };
    render($('duelRing'), turnMode ? players[ownSlot]?.status : state.statuses,
      turnMode && state.room.activeSlot !== ownSlot ? null : state.question?.letter,
      players[ownSlot]?.passedLetters || state.question?.passedLetters);
    if (turnMode) render($('opponentRing'), players[1 - ownSlot]?.status, null,
      players[1 - ownSlot]?.passedLetters);
  }
  function renderMatch() {
    if (!state.room) return;
    const phase = state.room.phase;
    const players = state.room.players || [];
    const self = players.find(p => p && p.id === state.selfId);
    const other = players.find(p => p && p.id !== state.selfId);
    const turnMode = state.room.mode === 'turns';
    const ownSlot = state.spectator ? 0 : Math.max(0, players.findIndex(p => p && p.id === state.selfId));
    const transitioning = turnMode && phase === 'playing' && !!state.room.turnReadyAt;
    const myTurn = !state.spectator && state.room.activeSlot === ownSlot && !transitioning;
    $('matchStage').classList.toggle('turns-stage', turnMode);
    $('matchStage').classList.toggle('is-rival-turn', turnMode && phase === 'playing' && state.room.activeSlot !== null && state.room.activeSlot !== ownSlot);
    $('matchStage').classList.toggle('is-handoff', !!transitioning);
    $('turnTransition').hidden = !transitioning;
    if (transitioning) $('turnTransitionLabel').textContent = (players[state.room.activeSlot]?.name || 'JUGADOR') + ' ENTRA A LA CANCHA';
    $('opponentRingSide').hidden = !turnMode;
    $('ownRingLabel').textContent = turnMode ? (state.spectator ? players[0]?.name || 'JUGADOR 1' : 'TU ROSCO') : 'TU ROSCO';
    $('opponentRingLabel').textContent = turnMode ? (state.spectator ? players[1]?.name || 'JUGADOR 2' : other?.name || 'RIVAL') : 'RIVAL';
    $('otherClockBlock').hidden = !turnMode;
    $('turnHint').hidden = !turnMode;
    $('turnHint').textContent = turnMode && phase === 'playing' ?
      (transitioning ? 'CAMBIO DE TURNO · RELOJES DETENIDOS' :
        state.spectator ? 'JUEGA ' + (players[state.room.activeSlot]?.name || '—') :
        myTurn ? 'ES TU TURNO · ACERTÁ PARA SEGUIR' : 'TURNO DE ' + (other?.name || 'TU RIVAL')) :
      'DOS ROSCOS · UN TURNO POR VEZ';
    drawScore();
    renderLobbyPlayers();
    $('readyPanel').hidden = phase === 'finished' || (phase === 'playing' &&
      (turnMode ? myTurn : !self?.finished && !state.spectator));
    $('questionPanel').hidden = phase !== 'playing' || state.spectator || !state.question ||
      !!self?.finished || (turnMode && !myTurn);
    $('answerForm').hidden = !!state.pendingAnswer;
    $('answerCorrection').hidden = !state.pendingAnswer || $('questionPanel').hidden;
    if (state.pendingAnswer) {
      $('provisionalValue').textContent = state.pendingAnswer.answer;
      $('correctButton').disabled = !state.pendingAnswer.editsRemaining;
      $('correctionInput').disabled = !state.pendingAnswer.editsRemaining || correctedTime() >= state.pendingAnswer.endsAt;
    }
    setActionControls(!$('questionPanel').hidden && !state.pendingAction && !state.pendingAnswer);
    $('resultsPanel').hidden = phase !== 'finished';
    const phases = {waiting:'ESPERANDO RIVAL',countdown:'CUENTA REGRESIVA',playing:'DUELO EN VIVO',finished:'PARTIDO FINALIZADO'};
    $('matchStatus').textContent = ({waiting:'SALA ABIERTA / ESPERANDO A LOS DOS',countdown:'CUENTA REGRESIVA / PREPARATE',playing:'DUELO EN CURSO / MARCADOR EN VIVO',finished:'FINAL / RESULTADOS OFICIALES'})[phase] || 'PREPARANDO PARTIDO';
    $('streamPhase').textContent = phases[phase] || 'PREPARANDO PARTIDO';
    $('streamAudience').textContent = (state.room.spectatorCount || 0) + ' MIRANDO';
    $('playerRole').textContent = state.spectator ? 'ESPECTADOR / SOLO MARCADOR' :
      turnMode ? 'JUGADOR / ROSCO POR TURNOS' : 'JUGADOR / ROSCO ESPEJO';
    if (phase === 'playing' && turnMode && !myTurn && !state.spectator && !self?.finished) {
      $('readyHeading').textContent = transitioning ? 'CAMBIO DE TURNO.' : 'JUEGA TU RIVAL.';
      $('readyDescription').textContent = transitioning ? 'Los dos relojes están detenidos. El servidor habilita al próximo jugador en 2 segundos.' :
        'Tu reloj está detenido. Cuando el rival pase, se equivoque o termine, seguís con tu rosco.';
      $('readyButton').hidden = true;
    }
    if (phase === 'playing' && self?.finished) {
      $('readyHeading').textContent = 'ROSCO COMPLETO.';
      $('readyDescription').textContent = 'Terminaste tus 26 letras. Esperá a que tu rival cierre su rosco o termine el reloj.';
      $('readyButton').hidden = true;
    }
    if (phase === 'waiting' || phase === 'countdown') {
      $('readyHeading').textContent = phase === 'countdown' ? 'ARRANCA EL DUELO.' : !other ? 'ESPERANDO RIVAL.' : 'LOS DOS EN CANCHA.';
      $('readyDescription').textContent = phase === 'countdown' ?
        turnMode ? 'Dos roscos distintos. Un jugador por vez. Cada uno con su propio reloj.' : 'Ambos reciben las mismas 26 preguntas.' :
        !other ? 'Compartí la invitación y esperá a que llegue tu rival.' : 'Los dos deben marcarse como listos. Recién ahí comienza el partido.';
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
        forfeit: 'Victoria por abandono voluntario del rival.',
        disconnect: 'Victoria por desconexión del rival tras vencer el plazo de reconexión.',
        draw: turnMode ? 'Igual cantidad de aciertos. Los roscos eran diferentes: empate y revancha.' : 'Empate exacto. La revancha está abierta.',
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
    } else if (!self?.finished && phase !== 'playing') $('readyButton').hidden = false;
    if (phase === 'playing') $('readyButton').hidden = true;
    renderRing(); updateClock();
  }
  function updateClock() {
    if (state.room?.phase === 'finished') {
      $('correctionCountdown').textContent = '00:00';
      $('turnTransitionCountdown').textContent = '';
      $('clock').textContent = 'FINAL';
      $('otherClock').textContent = 'FINAL';
      $('streamClock').textContent = 'FINAL';
      return;
    }
    if (!state.room) {
      $('clock').textContent = '05:00';
      $('streamClock').textContent = overlay ? '--:--' : '05:00';
      return;
    }
    if (state.room.mode === 'turns') {
      const players = state.room.players || [];
      const ownSlot = state.spectator ? 0 : Math.max(0, players.findIndex(p => p && p.id === state.selfId));
      const millis = slot => {
        const p = players[slot];
        if (!p) return state.room.duration * 1000;
        return state.room.phase === 'playing' && state.room.activeSlot === slot && state.room.deadline ?
          Math.max(0, state.room.deadline - (Date.now() + state.clockOffset)) :
          Math.max(0, p.remainingMs ?? state.room.duration * 1000);
      };
      const label = ms => { const secs = Math.ceil(ms / 1000);
        return String(Math.floor(secs / 60)).padStart(2,'0') + ':' + String(secs % 60).padStart(2,'0'); };
      $('clock').textContent = label(millis(ownSlot));
      $('turnTransitionCountdown').textContent = state.room.turnReadyAt ?
        Math.min(2, Math.max(0, Math.ceil((state.room.turnReadyAt - correctedTime()) / 1000))) + ' S' : '';
      $('correctionCountdown').textContent = state.pendingAnswer ?
        Math.min(6, Math.max(0, Math.ceil((state.pendingAnswer.endsAt - correctedTime()) / 1000))) + ' S' : '00';
      if (state.pendingAnswer && correctedTime() >= state.pendingAnswer.endsAt) {
        $('correctButton').disabled = true;
        $('confirmAnswer').disabled = true;
      }
      $('otherClock').textContent = label(millis(1 - ownSlot));
      $('streamClock').textContent = state.room.phase === 'playing' ?
        label(millis(state.room.activeSlot)) : label(state.room.duration * 1000);
      if (state.room.phase === 'countdown' && state.room.countdownEndsAt) {
        const remaining = Math.max(1, Math.ceil((state.room.countdownEndsAt - (Date.now() + state.clockOffset)) / 1000));
        $('readyHeading').textContent = 'ARRANCAMOS EN ' + remaining;
      }
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
    state.result = null; state.question = null; state.statuses = {}; state.pendingAnswer = null;
    if (mode === 'create') send('create', { name:name(), difficulty:$('difficulty').value, mode:$('duelMode').value, public:false });
    if (mode === 'join') send('join', { roomId:roomCode, name:name() });
    if (mode === 'matchmake') send('matchmake', { name:name(), difficulty:$('difficulty').value, mode:$('duelMode').value });
    if (mode === 'spectate') send('spectate', { roomId:roomCode });
  }
  $('duelMode').addEventListener('change', () => {
    const turns = $('duelMode').value === 'turns';
    $('duelModeHelp').textContent = turns ? 'Dos roscos diferentes, uno por jugador. Cambia el turno cuando alguien pasa o se equivoca.' :
      'Rosco Espejo: mismas 26 preguntas, ambos juegan al mismo tiempo.';
    const labels = turns ?
      ['Clásico · 2:30 por jugador', 'Sin apuro · 3:00 por jugador', 'Contrarreloj · 2:00 por jugador'] :
      ['Clásico · 5 minutos', 'Sin apuro · 6 minutos', 'Contrarreloj · 4 minutos'];
    Array.from($('difficulty').options).forEach((option,index) => { option.textContent = labels[index]; });
    $('heroLead').textContent = turns ? 'Dos roscos distintos. Un turno por vez. La próxima respuesta puede cambiar el partido.' :
      'Las mismas preguntas. Dos jugadores en simultáneo. Gana quien más acierta.';
    $('heroClockLabel').textContent = turns ? 'RELOJ POR JUGADOR' : 'RELOJ COMPARTIDO';
  });
  $('duelMode').dispatchEvent(new Event('change'));
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
  $('correctButton').addEventListener('click', () => {
    const pending = state.pendingAnswer;
    if (!pending || !pending.editsRemaining || correctedTime() >= pending.endsAt) return;
    const answer = $('correctionInput').value.trim();
    if (!answer) return;
    if (send('reviseAnswer', { letter: pending.letter, answer })) {
      $('correctButton').disabled = true;
      $('correctionInput').disabled = true;
    }
  });
  $('confirmAnswer').addEventListener('click', () => {
    const pending = state.pendingAnswer;
    if (!pending || correctedTime() >= pending.endsAt) return;
    if (send('confirmAnswer', { letter: pending.letter })) $('confirmAnswer').disabled = true;
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
    return '⚽ CRACK TOTAL · PASALA CHE 1V1 · ' + (state.room?.mode === 'turns' ? 'POR TURNOS' : 'ESPEJO') + '\n' + names +
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
  $('copyInvite').addEventListener('click', async () => {
    const link = invitation('sala');
    if (navigator.share && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
      try { await navigator.share({ title: 'Crack Total · Pasala Che 1v1', text: 'Te desafío a un duelo futbolero', url: link }); return; }
      catch (err) { if (err.name === 'AbortError') return; }
    }
    copyText($('copyInvite'), link);
  });
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
