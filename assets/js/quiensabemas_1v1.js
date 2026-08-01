// Juego: ¿Quién Sabe Más? (1v1) - Lógica del Cliente (WebSocket)
// Versión renovada - Junio 2024

// Firebase Integration - Usa window.firebaseService

console.log("✨ quiensabemas_1v1.js cargado (v3 Renovada - Junio 2024)");

// --- Configuración ---
const CONFIG = {
    WEBSOCKET_URL: 'wss://cracktotal-servidor.onrender.com',
    RECONNECT_DELAY: 3000,
    MAX_RECONNECT_ATTEMPTS: 5,
    TIME_PER_QUESTION: 20,
    TOTAL_QUESTIONS: 10,
    STORAGE_KEYS: {
        PLAYER_NAME: 'playerName',
        INTRO_SHOWN: 'qsmIntroShown'
    }
};

// --- DOM Elements ---
const DOM = {
    // Lobby
    lobbyContainer: document.getElementById('lobbyContainer'),
    createRoomNameInput: document.getElementById('createRoomName'),
    createRoomPasswordInput: document.getElementById('createRoomPassword'),
    createRoomBtn: document.getElementById('createRoomBtn'),
    joinRoomIdInput: document.getElementById('joinRoomId'),
    joinRoomPasswordInput: document.getElementById('joinRoomPassword'),
    joinRoomBtn: document.getElementById('joinRoomBtn'),
    joinRandomRoomBtn: document.getElementById('joinRandomRoomBtn'),
    roomsListElement: document.getElementById('roomsList'),
    lobbyMessage: document.getElementById('lobbyMessage'),

    // Game Area
    gameArea: document.getElementById('gameArea'),
    qsmQuestionText: document.getElementById('qsmQuestionText'),
    optionsGrid: document.getElementById('optionsGrid'),
    feedbackMessage: document.getElementById('feedbackMessage'),
    waitingArea: document.getElementById('waitingArea'),
    waitingMessage: document.getElementById('waitingMessage'),

    // Header Info
    player1NameHeader: document.getElementById('player1Name'),
    player1ScoreHeader: document.getElementById('player1Score'),
    player2NameHeader: document.getElementById('player2Name'),
    player2ScoreHeader: document.getElementById('player2Score'),
    turnIndicator: document.getElementById('turnIndicator'),
    questionNumberDisplay: document.getElementById('questionNumber'),
    timerProgress: document.getElementById('timerProgress'),

    // Modals
    qsmIntroModal: document.getElementById('qsmIntroModal'),
    goToLobbyQSMButton: document.getElementById('goToLobbyQSMButton'),
    qsmResultModal: document.getElementById('qsmResultModal'),
    resultTitle: document.getElementById('resultTitle'),
    resultMessageModal: document.getElementById('resultMessage'),
    playerFinalScoreDisplay: document.getElementById('playerFinalScore'),
    opponentFinalScoreDisplay: document.getElementById('opponentFinalScore'),
    playAgainQSMBtn: document.getElementById('playAgainQSMBtn'),
    goToLobbyFromResultsBtn: document.getElementById('goToLobbyFromResultsBtn'),

    // Connection Status
    connectionStatus: document.getElementById('connectionStatus')
};

// --- Game State ---
const gameState = {
    websocket: null,
    myPlayerId: null,
    playerName: localStorage.getItem(CONFIG.STORAGE_KEYS.PLAYER_NAME) || 'Jugador Anónimo',
    roomId: null,
    isRoomCreator: false,
    gameActive: false,
    gamePhase: 'lobby', // lobby, waitingForOpponent, playing, roundOver, gameOver
    gameStartTime: null,
    resultPublished: false,
    
    players: {}, // { playerId1: { name: 'P1', score: 0, avatar: 'P1' }, playerId2: { name: 'P2', score: 0, avatar: 'P2' } }
    currentTurn: null,
    
    currentQuestion: null, // { text: "...", options: ["","","",""], correctAnswer: "..." }
    currentQuestionIndex: 0,
    totalQuestions: CONFIG.TOTAL_QUESTIONS,
    
    timerInterval: null,
    timePerQuestion: CONFIG.TIME_PER_QUESTION,
    timeLeft: CONFIG.TIME_PER_QUESTION,

    pendingRoomsRequest: null,
    firebaseInstances: null,
    
    // Nuevas propiedades para reconexión
    reconnectAttempts: 0,
    reconnectTimer: null,
    lastMessageTimestamp: Date.now()
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', initializeQSMApp);

async function initializeQSMApp() {
    console.log("🎮 Inicializando App ¿Quién Sabe Más?...");

    // Firebase se inicializa automáticamente a través de window.firebaseService
    if (window.firebaseService) {
        console.log("🔒 Firebase Service disponible para QSM");
    } else {
        console.warn("⚠️ Firebase Service no disponible para QSM");
    }

    loadPlayerName();
    updatePlayerNameInUI();
    initializeWebSocket();
    setupEventListeners();
    showLobbyView();
    updateConnectionStatusUI(false, 'Conectando al servidor...');

    // Mostrar modal de introducción si es la primera vez
    if (DOM.qsmIntroModal && !localStorage.getItem(CONFIG.STORAGE_KEYS.INTRO_SHOWN)) {
        DOM.qsmIntroModal.style.display = 'flex';
    }
}

function loadPlayerName() {
    const nameFromStorage = localStorage.getItem('playerName');
    if (nameFromStorage) {
        gameState.playerName = nameFromStorage;
        console.log(`🏷️ Nombre de jugador cargado: ${gameState.playerName}`);
    } else {
        gameState.playerName = '';
        console.log('Modo invitado activo. El nombre se solicitará al entrar a una sala.');
    }
}

function updatePlayerNameInUI() {
    // Actualizar el nombre del jugador en los campos de creación de sala
    const createPlayerNameInput = document.getElementById('createPlayerName');
    const joinPlayerNameInput = document.getElementById('joinPlayerName');
    
    if (createPlayerNameInput && gameState.playerName) {
        createPlayerNameInput.value = gameState.playerName;
    }
    
    if (joinPlayerNameInput && gameState.playerName) {
        joinPlayerNameInput.value = gameState.playerName;
    }
    
    // Actualizar el nombre en el encabezado del juego si existe
    if (DOM.player1NameHeader) {
        DOM.player1NameHeader.textContent = gameState.playerName || 'Invitado';
    }
    
    console.log(`Nombre de jugador actualizado en la UI: ${gameState.playerName}`);
}

async function ensureLobbyPlayerName(preferredName = '') {
    const candidate = preferredName.trim();
    const validation = window.CrackTotalProfile?.validatePlayerName(candidate);

    if (candidate && (!validation || validation.valid)) {
        localStorage.setItem('playerName', candidate);
        gameState.playerName = candidate;
        return candidate;
    }

    const playerName = window.CrackTotalProfile
        ? await window.CrackTotalProfile.ensurePlayerName({ reason: 'join-game' })
        : localStorage.getItem('playerName');

    if (playerName) {
        gameState.playerName = playerName;
        updatePlayerNameInUI();
    }
    return playerName || '';
}

function updateConnectionStatusUI(connected, message = '') {
    if (!DOM.connectionStatus) return;
    
    DOM.connectionStatus.style.display = 'block';
    const statusText = message || (connected ? 'Conectado' : 'Desconectado');
    DOM.connectionStatus.textContent = statusText;
    
    if (connected) {
        DOM.connectionStatus.className = 'connection-status connected';
        // Ocultar después de 3 segundos si está conectado
        setTimeout(() => {
            if (DOM.connectionStatus.classList.contains('connected')) {
                DOM.connectionStatus.style.display = 'none';
            }
        }, 3000);
    } else {
        DOM.connectionStatus.className = `connection-status ${statusText.toLowerCase().includes('conectando') ? 'connecting' : 'disconnected'}`;
    }
}

// --- WebSocket Communication ---
function initializeWebSocket() {
    // Limpiar cualquier intento de reconexión pendiente
    if (gameState.reconnectTimer) {
        clearTimeout(gameState.reconnectTimer);
        gameState.reconnectTimer = null;
    }

    if (gameState.websocket && gameState.websocket.readyState !== WebSocket.CLOSED) {
        console.log("🔄 Cerrando conexión WebSocket anterior...");
        gameState.websocket.onclose = null; // Evitar que se dispare el evento onclose
        gameState.websocket.close();
    }

    console.log(`🔌 Conectando a: ${CONFIG.WEBSOCKET_URL}`);
    updateConnectionStatusUI(false, 'Conectando...');
    showLobbyMessage('Conectando al servidor de juego...', 'info', false);

    try {
        gameState.websocket = new WebSocket(CONFIG.WEBSOCKET_URL);
    } catch (error) {
        console.error("❌ Error creando conexión WebSocket:", error);
        showLobbyMessage(`Error de conexión: ${error.message}. Intenta refrescar la página.`, "error", true);
        updateConnectionStatusUI(false, 'Error de conexión');
        disableLobbyButtons();
        scheduleReconnect();
        return;
    }
    
    const connectionTimeout = setTimeout(() => {
        if (gameState.websocket && gameState.websocket.readyState === WebSocket.CONNECTING) {
            console.error("⏰ Timeout de conexión WebSocket.");
            showLobbyMessage("No se pudo conectar al servidor. Verificá tu conexión a internet.", "error", true);
            updateConnectionStatusUI(false, 'Timeout de conexión');
            gameState.websocket.close();
            scheduleReconnect();
        }
    }, 10000); // 10 segundos de timeout

    gameState.websocket.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ WebSocket Conectado!');
        updateConnectionStatusUI(true, 'Conectado');
        showLobbyMessage('¡Conectado! Listo para jugar.', 'success', true);
        enableLobbyButtons();
        gameState.reconnectAttempts = 0; // Resetear intentos de reconexión
        
        // Solicitar salas disponibles inmediatamente después de conectar
        setTimeout(() => {
            if (gameState.gamePhase === 'lobby') {
                refreshAvailableRooms();
            }
        }, 500); // Pequeño retraso para asegurar que todo esté listo
    };

    gameState.websocket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            // Filtrar mensajes que no son para QSM
            if (message.game && message.game !== 'qsm') {
                return;
            }
            console.log('📥 Mensaje recibido:', message.type);
            gameState.lastMessageTimestamp = Date.now(); // Actualizar timestamp del último mensaje
            handleServerMessage(message);
        } catch (error) {
            console.error('❌ Error analizando mensaje:', error, event.data);
        }
    };

    gameState.websocket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ Error de WebSocket:', error);
        updateConnectionStatusUI(false, 'Error de conexión');
        showLobbyMessage('Error de conexión con el servidor de juego.', 'error', true);
        if (gameState.gameActive) showErrorInGame("Se ha producido un error de conexión.");
        disableLobbyButtons();
    };

    gameState.websocket.onclose = (event) => {
        clearTimeout(connectionTimeout);
        const wasClean = event.wasClean;
        const reason = event.reason || (wasClean ? 'Desconexión normal' : 'Conexión interrumpida');
        console.log(`🔌 WebSocket Desconectado: ${reason} (Código: ${event.code})`);
        
        updateConnectionStatusUI(false, wasClean ? 'Desconectado' : 'Conexión perdida');
        gameState.websocket = null;
        
        if (gameState.gameActive) {
            showErrorInGame("Conexión perdida. La partida ha terminado.");
            handleGameEnd({ reason: "Conexión perdida. Intenta jugar de nuevo." });
        } else {
            showLobbyMessage('Desconectado del servidor. Intentando reconectar...', 'error', true);
        }
        
        disableLobbyButtons();
        gameState.gameActive = false;
        scheduleReconnect();
    };

    // Ping para mantener la conexión activa
    setupPingInterval();
}

function scheduleReconnect() {
    if (gameState.reconnectTimer) {
        clearTimeout(gameState.reconnectTimer);
    }
    
    if (gameState.reconnectAttempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
        console.warn(`⚠️ Máximo de intentos de reconexión (${CONFIG.MAX_RECONNECT_ATTEMPTS}) alcanzado.`);
        showLobbyMessage('No se pudo reconectar al servidor. Por favor, recarga la página.', 'error', false);
        updateConnectionStatusUI(false, 'Reconexión fallida');
        return;
    }
    
    const delay = CONFIG.RECONNECT_DELAY * Math.pow(1.5, gameState.reconnectAttempts);
    gameState.reconnectAttempts++;
    
    console.log(`🔄 Reintentando conexión en ${delay/1000} segundos (intento ${gameState.reconnectAttempts}/${CONFIG.MAX_RECONNECT_ATTEMPTS})...`);
    updateConnectionStatusUI(false, `Reconectando en ${Math.round(delay/1000)}s...`);
    
    gameState.reconnectTimer = setTimeout(() => {
        if (!gameState.websocket || gameState.websocket.readyState === WebSocket.CLOSED) {
            initializeWebSocket();
        }
    }, delay);
}

function setupPingInterval() {
    // Enviar ping cada 30 segundos para mantener la conexión viva
    const pingInterval = setInterval(() => {
        if (!gameState.websocket || gameState.websocket.readyState !== WebSocket.OPEN) {
            clearInterval(pingInterval);
            return;
        }
        
        // Si no hubo mensajes en los últimos 25 segundos, enviar ping
        const timeSinceLastMessage = Date.now() - gameState.lastMessageTimestamp;
        if (timeSinceLastMessage > 25000) {
            sendToServer('ping');
        }
    }, 30000);
}

function sendToServer(type, payload = {}) {
    if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({ type, payload });
        console.log('📤 Enviando al servidor:', type, payload);
        gameState.websocket.send(message);
    } else {
        console.error('🔌 WebSocket no conectado. No se puede enviar:', type, payload);
        if (type !== 'ping') { // No mostrar error para pings
            showLobbyMessage('No estás conectado al servidor. Intenta reconectar.', 'error', true);
        }
    }
}

// --- Server Message Handling ---
function handleServerMessage(message) {
    const { type, payload } = message;
    
    switch (type) {
        case 'ping':
        case 'pong':
            // Responder al ping con un pong o ignorar el pong
            if (type === 'ping') sendToServer('pong');
            break;
            
        case 'yourInfo':
            gameState.myPlayerId = payload.playerId;
            console.log(`🆔 ID de jugador: ${gameState.myPlayerId}`);
            if (payload.playerName && payload.playerName !== gameState.playerName) {
                gameState.playerName = payload.playerName;
                localStorage.setItem(CONFIG.STORAGE_KEYS.PLAYER_NAME, gameState.playerName);
                console.log(`🏷️ Nombre actualizado: ${gameState.playerName}`);
            }
            break;
            
        case 'availableRooms':
            console.log('📋 Salas disponibles recibidas:', payload.rooms);
            // Asegurarse de que todas las salas tengan la información necesaria
            if (payload.rooms && Array.isArray(payload.rooms)) {
                payload.rooms.forEach(room => {
                    if (!room.name && room.roomName) {
                        room.name = room.roomName; // Asegurarse de que name esté disponible
                    }
                });
            }
            renderAvailableRooms(payload.rooms);
            if (gameState.pendingRoomsRequest) {
                gameState.pendingRoomsRequest.source.postMessage({
                    type: 'availableRooms', 
                    gameType: 'quiensabemas', 
                    rooms: payload.rooms || []
                }, gameState.pendingRoomsRequest.origin);
                gameState.pendingRoomsRequest = null;
            }
            break;
        
        case 'roomCheckResult':
            // Este caso se maneja en el listener específico creado en checkRoomBeforeJoining
            // No es necesario procesarlo aquí, pero lo documentamos para referencia
            console.log('ℹ️ Resultado de verificación de sala recibido:', payload);
            break;
            
        case 'roomCreated':
            gameState.roomId = payload.roomId;
            gameState.isRoomCreator = true;
            gameState.players = {
                [gameState.myPlayerId]: { 
                    name: gameState.playerName, 
                    score: 0,
                    isHost: true
                }
            };
            showLobbyMessage(`¡Sala creada! ID: ${gameState.roomId}. Esperando oponente...`, 'success', true);
            switchToGameView("Esperando a que un oponente se una...");
            updatePlayersHeaderUI();
            break;
            
        case 'joinSuccess':
            gameState.roomId = payload.roomId;
            gameState.isRoomCreator = false;
            gameState.players = payload.players;
            showLobbyMessage(`¡Te has unido a la sala ${gameState.roomId}!`, 'success', true);
            switchToGameView(
                Object.keys(gameState.players).length < 2 ? 
                "Esperando a que el otro jugador se una..." : 
                "Esperando a que comience el juego..."
            );
            updatePlayersHeaderUI();
            console.log('Unido exitosamente a la sala:', gameState.roomId, 'Jugadores:', gameState.players);
            break;
            
        case 'joinError':
            console.error("❌ Error al unirse a la sala:", payload.error);
            showLobbyMessage(payload.error || "Error al unirse a la sala", 'error', true);
            enableLobbyButtons();
            break;
            
        case 'playerJoined':
            gameState.players = payload.players;
            updatePlayersHeaderUI();
            const newPlayerName = Object.values(gameState.players).find(p => p.name !== gameState.playerName)?.name || 'Un oponente';
            showFeedbackInGame(`${newPlayerName} se unió a la sala. ${gameState.isRoomCreator ? '¡Iniciando pronto!' : 'Preparándose para comenzar.'}`, 'info');
            if (Object.keys(gameState.players).length === 2) {
                hideWaitingStateInGame();
            }
            break;
            
        case 'gameStart':
            gameState.gameActive = true;
            gameState.gamePhase = 'playing';
            gameState.gameStartTime = Date.now();
            gameState.resultPublished = false;
            gameState.players = payload.players;
            gameState.currentTurn = payload.startingPlayerId;
            hideWaitingStateInGame();
            updatePlayersHeaderUI();
            showFeedbackInGame("¡El juego ha comenzado!", "success");
            // La primera pregunta llegará con el mensaje 'newQuestion'
            break;
            
        case 'newQuestion':
            gameState.currentQuestion = payload.question;
            gameState.currentQuestionIndex = payload.questionNumber - 1;
            gameState.totalQuestions = payload.totalQuestionsInLevel;
            gameState.currentTurn = payload.currentTurn;
            gameState.players = payload.players;
            
            displayQuestionInUI();
            updatePlayersHeaderUI();
            showFeedbackInGame(
                `Pregunta ${payload.questionNumber}/${payload.totalQuestionsInLevel}. Turno de ${gameState.players[gameState.currentTurn]?.name || 'alguien'}.`,
                 "info"
            );
            break;
            
        case 'updateState':
            gameState.currentTurn = payload.currentTurn;
            gameState.players = payload.players;
            updatePlayersHeaderUI();
            break;
            
        case 'answerResult':
            const { 
                isCorrect, 
                correctAnswerText, 
                pointsAwarded, 
                correctIndex, 
                forPlayerId, 
                submittedAnswerText, 
                selectedIndex: playerSelectedIndex 
            } = payload;
            
            // Actualizar UI con el resultado
            let actualPlayerAnswerText = "";
            if (gameState.currentQuestion?.options && 
                playerSelectedIndex >= 0 && 
                playerSelectedIndex < gameState.currentQuestion.options.length) {
                actualPlayerAnswerText = gameState.currentQuestion.options[playerSelectedIndex];
            }
            
            highlightAnswerUI(
                isCorrect, 
                gameState.currentQuestion.options[correctIndex], 
                actualPlayerAnswerText
            );
            
            const feedbackText = isCorrect ? 
                `¡Correcto! ${pointsAwarded ? ` (+${pointsAwarded} pts)` : ''}` : 
                `Incorrecto. La respuesta correcta era: ${correctAnswerText}`;
                
            showFeedbackInGame(
                feedbackText,
                isCorrect ? 'correct' : 'incorrect'
            );
            break;
            
        case 'gameOver':
            gameState.gameActive = false;
            gameState.gamePhase = 'gameOver';
            handleGameEnd(payload);
            break;
            
        case 'errorMessage':
            console.error("❌ Error del servidor:", payload.error);
            if (gameState.gamePhase !== 'lobby') {
                showErrorInGame(payload.error);
            } else {
                showLobbyMessage(payload.error, 'error', true);
            }
            
            enableLobbyButtons();
            if (gameState.gameActive && payload.kickToLobby) {
                 showLobbyView();
                 gameState.gameActive = false;
                 gameState.roomId = null;
            }
            break;
            
        case 'opponentLeftLobby':
            showLobbyMessage(payload.message || 'El oponente abandonó la sala.', 'warning', true);
            if (gameState.gamePhase !== 'lobby' && gameState.roomId) {
                const opponentId = Object.keys(gameState.players).find(id => id !== gameState.myPlayerId);
                if (opponentId) {
                    delete gameState.players[opponentId];
                }
                updatePlayersHeaderUI();
                showWaitingStateInGame("El oponente abandonó. Esperando a un nuevo jugador o vuelve al lobby.");
            }
            break;
            
        default:
            console.warn('⚠️ Tipo de mensaje desconocido:', type);
    }
}

// --- Lobby Logic ---
function showLobbyView() {
    if (DOM.lobbyContainer) DOM.lobbyContainer.style.display = 'block';
    if (DOM.gameArea) DOM.gameArea.style.display = 'none';
    if (DOM.qsmIntroModal && 
        DOM.qsmIntroModal.style.display !== 'none' && 
        localStorage.getItem(CONFIG.STORAGE_KEYS.INTRO_SHOWN)) {
        DOM.qsmIntroModal.style.display = 'none';
    }
    
    gameState.gamePhase = 'lobby';
    clearLobbyMessage();
    enableLobbyButtons();
    
    // Solicitar lista de salas disponibles
    if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN) {
        console.log('Solicitando lista de salas disponibles...');
        sendToServer('getRooms', { gameType: 'quiensabemas' });
        
        // Si no hay salas cargadas después de 2 segundos, mostrar mensaje
        setTimeout(() => {
            if (DOM.roomsListElement && DOM.roomsListElement.children.length === 0) {
                DOM.roomsListElement.innerHTML = '<li class="no-rooms-message"><i class="fas fa-info-circle"></i> No hay salas disponibles o hay un problema de conexión. Intenta refrescar.</li>';
            }
        }, 2000);
    } else {
        console.warn('WebSocket no está conectado. No se pueden solicitar salas.');
        if (DOM.roomsListElement) {
            DOM.roomsListElement.innerHTML = '<li class="no-rooms-message"><i class="fas fa-exclamation-circle"></i> No hay conexión con el servidor. Recarga la página.</li>';
        }
    }
}

function switchToGameView(initialMessage = "Preparando el juego...") {
    if (DOM.lobbyContainer) DOM.lobbyContainer.style.display = 'none';
    if (DOM.gameArea) DOM.gameArea.style.display = 'block';
    gameState.gamePhase = 'waitingForOpponent';
    showWaitingStateInGame(initialMessage);
}

function showLobbyMessage(message, type = 'info', autoDismiss = true) {
    if (!DOM.lobbyMessage) return;
    
    DOM.lobbyMessage.textContent = message;
    DOM.lobbyMessage.className = `lobby-message ${type}`;
    DOM.lobbyMessage.style.display = 'block';
    
    if (autoDismiss && type !== 'error') {
        setTimeout(() => {
            if (DOM.lobbyMessage.textContent === message) {
                clearLobbyMessage();
            }
        }, 5000);
    }
}

function clearLobbyMessage() {
    if (DOM.lobbyMessage) DOM.lobbyMessage.style.display = 'none';
}

function disableLobbyButtons(isCreating = false, isJoiningById = false, isJoiningRandom = false) {
    // Mostrar indicadores visuales de carga
    if (DOM.createRoomBtn) {
        DOM.createRoomBtn.disabled = true;
        if (isCreating) {
            DOM.createRoomBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        }
    }
    
    if (DOM.joinRoomBtn) {
        DOM.joinRoomBtn.disabled = true;
        if (isJoiningById) {
            DOM.joinRoomBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uniéndose...';
        }
    }
    
    if (DOM.joinRandomRoomBtn) {
        DOM.joinRandomRoomBtn.disabled = true;
        if (isJoiningRandom) {
            DOM.joinRandomRoomBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
        }
    }
}

function enableLobbyButtons() {
    // Restaurar botones a su estado normal
    if (DOM.createRoomBtn) {
        DOM.createRoomBtn.disabled = false;
        DOM.createRoomBtn.innerHTML = '<i class="fas fa-plus"></i> Crear Sala';
    }
    
    if (DOM.joinRoomBtn) {
        DOM.joinRoomBtn.disabled = false;
        DOM.joinRoomBtn.innerHTML = '<i class="fas fa-door-open"></i> Unirse por ID';
    }
    
    if (DOM.joinRandomRoomBtn) {
        DOM.joinRandomRoomBtn.disabled = false;
        DOM.joinRandomRoomBtn.innerHTML = '<i class="fas fa-bolt"></i> Partida Rápida';
    }
}

async function handleCreateRoom() {
    const createPlayerNameInput = document.getElementById('createPlayerName');
    const password = DOM.createRoomPasswordInput?.value || null;
    const playerName = await ensureLobbyPlayerName(createPlayerNameInput?.value || '');
    if (!playerName) return;
    const roomName = DOM.createRoomNameInput?.value.trim() || `Sala de ${playerName}`;
    
    sendToServer('createRoom', { 
        playerName: playerName, 
        roomName, 
        password, 
        gameType: 'quiensabemas' 
    });
    
    showLobbyMessage(`Creando sala para ${playerName}...`, 'info', false);
    disableLobbyButtons(true);
}

async function handleJoinRoomById() {
    const joinPlayerNameInput = document.getElementById('joinPlayerName');
    const roomIdToJoin = DOM.joinRoomIdInput?.value.trim();
    
    if (!roomIdToJoin) {
        showLobbyMessage('Ingresa un ID de sala válido.', 'error', false);
        return;
    }
    
    const playerName = await ensureLobbyPlayerName(joinPlayerNameInput?.value || '');
    if (!playerName) return;
    
    console.log(`Intentando unirse a la sala: ${roomIdToJoin} con nombre: ${playerName}`);
    
    // Verificar si la sala existe y si requiere contraseña
    checkRoomBeforeJoining(roomIdToJoin, playerName);
    
    showLobbyMessage(`Verificando sala ${roomIdToJoin}...`, 'info', false);
    disableLobbyButtons(false, true);
}

// Nueva función para verificar si una sala existe y si requiere contraseña
function checkRoomBeforeJoining(roomId, playerName) {
    // Enviar solicitud al servidor para obtener información de la sala
    sendToServer('checkRoom', { 
        roomId: roomId, 
        gameType: 'quiensabemas' 
    });
    
    // Establecer un timeout para la respuesta
    const checkTimeout = setTimeout(() => {
        showLobbyMessage(`No se pudo verificar la sala. Intentando unirse directamente...`, 'warning', true);
        joinRoomDirectly(roomId, playerName, DOM.joinRoomPasswordInput?.value || null);
    }, 3000);
    
    // Configurar un listener único para la respuesta del servidor
    const handleRoomCheckResponse = (event) => {
        try {
            const message = JSON.parse(event.data);
            // Solo procesar mensajes de verificación de sala
            if (message.type === 'roomCheckResult') {
                clearTimeout(checkTimeout);
                gameState.websocket.removeEventListener('message', handleRoomCheckResponse);
                
                const { exists, needsPassword, roomName } = message.payload;
                
                if (!exists) {
                    showLobbyMessage(`La sala ${roomId} no existe.`, 'error', true);
                    enableLobbyButtons();
                    return;
                }
                
                if (needsPassword) {
                    // Mostrar modal para contraseña
                    promptForRoomPassword(roomName || `Sala ${roomId}`, (password) => {
                        if (password === null) {
                            // Usuario canceló
                            showLobbyMessage('Unión a sala cancelada.', 'info', true);
                            enableLobbyButtons();
                            return;
                        }
                        
                        // Actualizar el campo de contraseña visible
                        if (DOM.joinRoomPasswordInput) {
                            DOM.joinRoomPasswordInput.value = password;
                        }
                        
                        // Unirse a la sala con la contraseña
                        joinRoomDirectly(roomId, playerName, password);
                    });
                } else {
                    // Sala sin contraseña, unirse directamente
                    joinRoomDirectly(roomId, playerName, null);
                }
            }
        } catch (error) {
            console.error('Error procesando respuesta de verificación de sala:', error);
            clearTimeout(checkTimeout);
            gameState.websocket.removeEventListener('message', handleRoomCheckResponse);
            // Intentar unirse directamente como fallback
            joinRoomDirectly(roomId, playerName, DOM.joinRoomPasswordInput?.value || null);
        }
    };
    
    // Agregar el listener para la respuesta
    gameState.websocket.addEventListener('message', handleRoomCheckResponse);
}

// Función auxiliar para unirse directamente a una sala
function joinRoomDirectly(roomId, playerName, password) {
    sendToServer('joinRoom', { 
        playerName: playerName, 
        roomId: roomId, 
        password: password, 
        gameType: 'quiensabemas' 
    });
    
    showLobbyMessage(`Uniéndote a la sala ${roomId}...`, 'info', false);
    disableLobbyButtons(false, true);
}

async function handleJoinRandomRoom() {
    const joinPlayerNameInput = document.getElementById('joinPlayerName');
    const playerName = await ensureLobbyPlayerName(joinPlayerNameInput?.value || '');
    if (!playerName) return;
    
    sendToServer('joinRandomRoom', { 
        playerName: playerName, 
        gameType: 'quiensabemas' 
    });
    
    showLobbyMessage(`Buscando sala disponible para ${playerName}...`, 'info', false);
    disableLobbyButtons(false, false, true);
}

// Nueva función para manejar el clic en unirse a sala desde la lista
async function handleJoinRoomFromListClick(room) {
    const roomId = room.id;
    const roomName = room.name || room.roomName || `Sala ${roomId}`;
    // Asegurar que needsPassword sea un valor booleano utilizando doble negación
    const needsPassword = !!room.needsPassword;
    
    console.log(`Intentando unirse a sala desde lista: ${roomId} (${roomName}), Requiere contraseña: ${needsPassword}`);
    
    // Verificar si hay un campo de entrada de nombre en la sala y usarlo si existe
    const joinPlayerNameInput = document.getElementById('joinPlayerName');
    
    const playerName = await ensureLobbyPlayerName(joinPlayerNameInput?.value || '');
    if (!playerName) return;
    
    // Actualizar el campo de ID de sala en el formulario principal
    if (DOM.joinRoomIdInput) {
        DOM.joinRoomIdInput.value = roomId;
    }
    
    // Si la sala requiere contraseña, mostrar el modal
    if (needsPassword) {
        promptForRoomPassword(roomName, (password) => {
            if (password === null) {
                // Usuario canceló
                showLobbyMessage('Unión a sala cancelada.', 'info', true);
                return;
            }
            
            // Actualizar campo de contraseña visible
            if (DOM.joinRoomPasswordInput) {
                DOM.joinRoomPasswordInput.value = password;
            }
            
            // Enviar solicitud al servidor
            sendToServer('joinRoom', { 
                playerName: playerName, 
                roomId: roomId, 
                password: password, 
                gameType: 'quiensabemas' 
            });
            
            showLobbyMessage(`Uniéndote a la sala ${roomName}...`, 'info', false);
            disableLobbyButtons(false, true);
        });
    } else {
        // Sala sin contraseña, unirse directamente
        // Limpiar campo de contraseña
        if (DOM.joinRoomPasswordInput) {
            DOM.joinRoomPasswordInput.value = '';
        }
        
        // Enviar solicitud al servidor
        sendToServer('joinRoom', { 
            playerName: playerName, 
            roomId: roomId, 
            password: null, 
            gameType: 'quiensabemas' 
        });
        
        showLobbyMessage(`Uniéndote a la sala ${roomName}...`, 'info', false);
        disableLobbyButtons(false, true);
    }
}

// Función para solicitar contraseña de sala mediante un modal o prompt
function promptForRoomPassword(roomName, callback) {
    // Crear un modal personalizado para la contraseña
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay password-prompt-modal';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content password-prompt';
    modalContent.style.background = 'var(--qsm-panel-bg, #1e2028)';
    modalContent.style.borderRadius = '16px';
    modalContent.style.padding = '25px';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '400px';
    modalContent.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
    modalContent.style.border = '1px solid var(--qsm-border, rgba(255, 255, 255, 0.1))';
    modalContent.style.position = 'relative';
    
    // Título del modal
    const modalTitle = document.createElement('h3');
    modalTitle.style.marginTop = '0';
    modalTitle.style.marginBottom = '20px';
    modalTitle.style.color = 'var(--qsm-text, white)';
    modalTitle.style.textAlign = 'center';
    modalTitle.innerHTML = `<i class="fas fa-lock"></i> Sala protegida`;
    
    // Texto descriptivo
    const modalText = document.createElement('p');
    modalText.style.color = 'var(--qsm-text-muted, rgba(255, 255, 255, 0.7))';
    modalText.style.marginBottom = '20px';
    modalText.style.textAlign = 'center';
    modalText.textContent = `Ingresa la contraseña para unirte a "${roomName}"`;
    
    // Campo de contraseña
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Contraseña de la sala';
    passwordInput.style.width = '100%';
    passwordInput.style.padding = '12px 15px';
    passwordInput.style.marginBottom = '20px';
    passwordInput.style.backgroundColor = 'var(--qsm-input-bg, rgba(16, 17, 26, 0.6))';
    passwordInput.style.border = '1px solid var(--qsm-border, rgba(255, 255, 255, 0.1))';
    passwordInput.style.borderRadius = '8px';
    passwordInput.style.color = 'var(--qsm-text, white)';
    passwordInput.style.fontSize = '1rem';
    passwordInput.style.outline = 'none';
    passwordInput.style.transition = 'border-color 0.3s ease';
    
    // Estilo de foco
    passwordInput.addEventListener('focus', () => {
        passwordInput.style.borderColor = 'var(--qsm-purple, #a651ff)';
    });
    
    passwordInput.addEventListener('blur', () => {
        passwordInput.style.borderColor = 'var(--qsm-border, rgba(255, 255, 255, 0.1))';
    });
    
    // Botones
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'space-between';
    buttonsContainer.style.gap = '10px';
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Unirse';
    confirmButton.style.flex = '1';
    confirmButton.style.padding = '10px';
    confirmButton.style.backgroundColor = 'var(--qsm-purple, #a651ff)';
    confirmButton.style.color = 'white';
    confirmButton.style.border = 'none';
    confirmButton.style.borderRadius = '8px';
    confirmButton.style.cursor = 'pointer';
    confirmButton.style.fontSize = '0.95rem';
    confirmButton.style.fontWeight = '600';
    confirmButton.style.transition = 'all 0.3s ease';
    
    confirmButton.addEventListener('mouseover', () => {
        confirmButton.style.backgroundColor = 'var(--qsm-purple-dark, #9040dc)';
        confirmButton.style.transform = 'translateY(-2px)';
    });
    
    confirmButton.addEventListener('mouseout', () => {
        confirmButton.style.backgroundColor = 'var(--qsm-purple, #a651ff)';
        confirmButton.style.transform = 'translateY(0)';
    });
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    cancelButton.style.flex = '1';
    cancelButton.style.padding = '10px';
    cancelButton.style.backgroundColor = 'var(--qsm-input-bg, rgba(16, 17, 26, 0.6))';
    cancelButton.style.color = 'var(--qsm-text-muted, rgba(255, 255, 255, 0.7))';
    cancelButton.style.border = '1px solid var(--qsm-border, rgba(255, 255, 255, 0.1))';
    cancelButton.style.borderRadius = '8px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.fontSize = '0.95rem';
    cancelButton.style.fontWeight = '600';
    cancelButton.style.transition = 'all 0.3s ease';
    
    cancelButton.addEventListener('mouseover', () => {
        cancelButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });
    
    cancelButton.addEventListener('mouseout', () => {
        cancelButton.style.backgroundColor = 'var(--qsm-input-bg, rgba(16, 17, 26, 0.6))';
    });
    
    // Armar el modal
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(confirmButton);
    
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalText);
    modalContent.appendChild(passwordInput);
    modalContent.appendChild(buttonsContainer);
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Enfocar el input de contraseña después de un breve retraso
    setTimeout(() => passwordInput.focus(), 100);
    
    // Manejar eventos de teclado
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            confirmButton.click();
        } else if (e.key === 'Escape') {
            cancelButton.click();
        }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Configurar botones
    confirmButton.addEventListener('click', () => {
        const password = passwordInput.value.trim();
        if (!password) {
            // Destacar el campo de contraseña en rojo si está vacío
            passwordInput.style.borderColor = 'var(--qsm-red, #ff453a)';
            passwordInput.style.backgroundColor = 'rgba(255, 69, 58, 0.1)';
            passwordInput.placeholder = 'Debes ingresar una contraseña';
            
            // Restaurar después de un momento
            setTimeout(() => {
                passwordInput.style.borderColor = 'var(--qsm-border, rgba(255, 255, 255, 0.1))';
                passwordInput.style.backgroundColor = 'var(--qsm-input-bg, rgba(16, 17, 26, 0.6))';
                passwordInput.placeholder = 'Contraseña de la sala';
            }, 1500);
            
            return;
        }
        
        document.removeEventListener('keydown', handleKeyDown);
        modalOverlay.remove();
        callback(password);
    });
    
    cancelButton.addEventListener('click', () => {
        document.removeEventListener('keydown', handleKeyDown);
        modalOverlay.remove();
        callback(null);
    });
    
    // Cerrar al hacer clic fuera del modal
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            cancelButton.click();
        }
    });
}

function renderAvailableRooms(rooms) {
    if (!DOM.roomsListElement) return;
    
    DOM.roomsListElement.innerHTML = '';
    
    if (!rooms || rooms.length === 0) {
        DOM.roomsListElement.innerHTML = '<li class="no-rooms-message"><i class="fas fa-info-circle"></i> No hay salas disponibles. ¡Crea una nueva sala para comenzar!</li>';
        return;
    }
    
    console.log('Renderizando salas:', rooms);
    
    rooms.forEach(room => {
        const li = document.createElement('li');
        li.className = 'room-item';
        
        const isRoomFull = room.playerCount >= (room.maxPlayers || 2);
        
        // Asegurar que se muestre el nombre de la sala (si no tiene, usar el ID)
        const roomDisplayName = room.name || room.roomName || `Sala ${room.id}`;
        const creatorName = room.creatorName || 'Anónimo';
        
        // Asegurar que needsPassword es un booleano
        const needsPassword = !!room.needsPassword;
        
        li.innerHTML = `
            <div class="room-info">
                <div class="room-name">
                    <i class="fas fa-${needsPassword ? 'lock' : 'door-open'}"></i>
                    <strong>${roomDisplayName}</strong>
                </div>
                <div class="room-details">
                    <span class="room-creator"><i class="fas fa-user"></i> ${creatorName}</span>
                    <span class="room-players"><i class="fas fa-users"></i> ${room.playerCount || 0}/${room.maxPlayers || 2}</span>
                    <span class="room-id"><i class="fas fa-hashtag"></i> ${room.id}</span>
                </div>
            </div>
            <button class="join-room-list-btn ${isRoomFull ? 'disabled' : ''}" 
                    data-roomid="${room.id}"
                    data-needspassword="${needsPassword ? 'true' : 'false'}"
                    data-roomname="${roomDisplayName}"
                    ${isRoomFull ? 'disabled' : ''}>
                ${isRoomFull ? '<i class="fas fa-ban"></i> Llena' : '<i class="fas fa-sign-in-alt"></i> Unirse'}
            </button>`;
        
        DOM.roomsListElement.appendChild(li);
        
        // Si la sala no está llena, permitir hacer clic en toda la sala
        if (!isRoomFull) {
            // Crear una copia del objeto room con needsPassword como booleano para pasar a handleJoinRoomFromListClick
            const roomData = {
                ...room,
                needsPassword: needsPassword
            };
            
            // Hacer que la información de la sala sea clickeable
            const roomInfo = li.querySelector('.room-info');
            if (roomInfo) {
                roomInfo.style.cursor = 'pointer';
                roomInfo.addEventListener('click', function() {
                    handleJoinRoomFromListClick(roomData);
                });
            }
            
            // También mantener el evento en el botón
            const joinButton = li.querySelector('.join-room-list-btn');
            if (joinButton) {
                joinButton.addEventListener('click', function(e) {
                    e.stopPropagation(); // Evitar doble activación
                    handleJoinRoomFromListClick(roomData);
                });
            }
        }
    });
}

// Función de actualización de salas
function refreshAvailableRooms() {
    console.log('Actualizando lista de salas disponibles...');
    
    // Mostrar animación de carga en el botón de refrescar
    const refreshIcon = document.querySelector('#refreshRoomsBtn i');
    if (refreshIcon) {
        refreshIcon.classList.add('fa-spin');
        setTimeout(() => {
            refreshIcon.classList.remove('fa-spin');
        }, 1000);
    }
    
    // Mostrar mensaje de carga en la lista de salas
    if (DOM.roomsListElement) {
        DOM.roomsListElement.innerHTML = '<li class="loading-rooms"><i class="fas fa-spinner fa-spin"></i> Actualizando lista de salas...</li>';
    }
    
    // Solicitar las salas al servidor
    if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN) {
        sendToServer('getRooms', { gameType: 'quiensabemas' });
    } else {
        // Si no hay conexión, mostrar error
        if (DOM.roomsListElement) {
            DOM.roomsListElement.innerHTML = '<li class="no-rooms-message"><i class="fas fa-exclamation-triangle"></i> No hay conexión con el servidor. Intenta recargar la página.</li>';
        }
        showLobbyMessage('No hay conexión con el servidor de juego. Intenta recargar la página.', 'error', true);
    }
}

// --- Game Logic & UI ---
function updatePlayersHeaderUI() {
    const playerIds = Object.keys(gameState.players);
    let p1Id = null, p2Id = null;

    if (playerIds.includes(gameState.myPlayerId)) {
        p1Id = gameState.myPlayerId;
        p2Id = playerIds.find(id => id !== gameState.myPlayerId);
    } else if (playerIds.length > 0) {
        p1Id = playerIds[0];
        if (playerIds.length > 1) p2Id = playerIds[1];
    }
    
    const p1Box = DOM.player1NameHeader?.closest('.player-box');
    const p2Box = DOM.player2NameHeader?.closest('.player-box');
    
    // Avatar updates with FontAwesome icons
    const p1Avatar = document.getElementById('player1Avatar');
    const p2Avatar = document.getElementById('player2Avatar');

    if (p1Id && gameState.players[p1Id]) {
        if (DOM.player1NameHeader) DOM.player1NameHeader.textContent = gameState.players[p1Id].name || 'Jugador 1';
        if (DOM.player1ScoreHeader) DOM.player1ScoreHeader.textContent = gameState.players[p1Id].score || 0;
        if (p1Box) p1Box.classList.toggle('active-turn', gameState.currentTurn === p1Id);
        if (p1Avatar) p1Avatar.innerHTML = '<i class="fas fa-user"></i>';
    } else {
        if (DOM.player1NameHeader) DOM.player1NameHeader.textContent = gameState.playerName || 'Tú';
        if (DOM.player1ScoreHeader) DOM.player1ScoreHeader.textContent = 0;
        if (p1Box) p1Box.classList.remove('active-turn');
        if (p1Avatar) p1Avatar.innerHTML = '<i class="fas fa-user"></i>';
    }

    if (p2Id && gameState.players[p2Id]) {
        if (DOM.player2NameHeader) DOM.player2NameHeader.textContent = gameState.players[p2Id].name || 'Oponente';
        if (DOM.player2ScoreHeader) DOM.player2ScoreHeader.textContent = gameState.players[p2Id].score || 0;
        if (p2Box) p2Box.classList.toggle('active-turn', gameState.currentTurn === p2Id);
        if (p2Avatar) p2Avatar.innerHTML = '<i class="fas fa-user-friends"></i>';
    } else {
        if (DOM.player2NameHeader) DOM.player2NameHeader.textContent = "Esperando...";
        if (DOM.player2ScoreHeader) DOM.player2ScoreHeader.textContent = 0;
        if (p2Box) p2Box.classList.remove('active-turn');
        if (p2Avatar) p2Avatar.innerHTML = '<i class="fas fa-user-clock"></i>';
    }
    
    if (DOM.turnIndicator && gameState.gameActive) {
        const turnPlayerName = gameState.currentTurn && gameState.players[gameState.currentTurn] ?
            gameState.players[gameState.currentTurn].name : "Esperando";
        DOM.turnIndicator.innerHTML = `<i class="fas fa-user-clock"></i> Turno de: ${turnPlayerName}`;
    } else if (DOM.turnIndicator) {
        DOM.turnIndicator.innerHTML = '<i class="fas fa-hourglass-half"></i> Esperando inicio...';
    }
}

function displayQuestionInUI() {
    if (!DOM.qsmQuestionText || !DOM.optionsGrid || !gameState.currentQuestion) {
        console.error("❌ Elementos de UI o pregunta faltantes.");
        return;
    }
    
    hideWaitingStateInGame();

    // Mostrar texto de la pregunta con animación
    DOM.qsmQuestionText.textContent = '';
    DOM.qsmQuestionText.classList.add('question-appear');
    
    setTimeout(() => {
        DOM.qsmQuestionText.textContent = gameState.currentQuestion.text;
        setTimeout(() => {
            DOM.qsmQuestionText.classList.remove('question-appear');
        }, 300);
    }, 300);
    
    // Generar opciones de respuesta
    DOM.optionsGrid.innerHTML = '';
    const optionLetters = ['A', 'B', 'C', 'D'];
    
    gameState.currentQuestion.options.forEach((optionText, index) => {
        const btn = document.createElement('button');
        btn.className = 'modern-option';
        btn.dataset.optionText = optionText;
        btn.dataset.optionIndex = index;
        
        btn.innerHTML = `
            <span class="option-letter">${optionLetters[index]}</span>
            <span class="option-text">${optionText}</span>
        `;
        
        btn.onclick = () => submitAnswerToAPI(optionText, index, btn);
        DOM.optionsGrid.appendChild(btn);
        
        // Pequeña animación de aparición escalonada
        setTimeout(() => {
            btn.classList.add('option-appear');
        }, 100 * (index + 1));
    });

    if (DOM.questionNumberDisplay) {
        DOM.questionNumberDisplay.innerHTML = `<i class="fas fa-question-circle"></i> Pregunta ${gameState.currentQuestionIndex + 1}/${gameState.totalQuestions}`;
    }
    
    clearFeedbackInGame();

    if (gameState.currentTurn === gameState.myPlayerId) {
        enableAnswerOptions();
        startQuestionTimer();
    } else {
        disableAnswerOptions();
        stopQuestionTimer(); // Timer solo para el jugador activo
    }
}

function submitAnswerToAPI(selectedOptionText, selectedIndex, optionButton) {
    if (gameState.currentTurn !== gameState.myPlayerId || !gameState.gameActive) {
        showErrorInGame(gameState.gameActive ? "No es tu turno." : "El juego no ha comenzado.");
        return;
    }
    
    stopQuestionTimer();
    disableAnswerOptions();
    
    if (optionButton) {
        optionButton.classList.add('selected');
        // Añadir efecto visual para la selección
        optionButton.classList.add('pulse-select');
    }

    sendToServer('submitAnswer', {
        selectedIndex: selectedIndex
    });
    
    showFeedbackInGame("Respuesta enviada...", "info");
}

function highlightAnswerUI(wasCorrect, correctAnswerText, playerAnswerText) {
    Array.from(DOM.optionsGrid.children).forEach(button => {
        button.classList.remove('pulse-select'); // Quitar cualquier animación previa
        
        const optText = button.dataset.optionText;
        
        if (optText === correctAnswerText) {
            button.classList.add('correct');
            // Añadir pequeña animación para respuesta correcta
            button.classList.add('correct-reveal');
        }
        
        if (optText === playerAnswerText && !wasCorrect) {
            button.classList.add('incorrect');
            // Añadir pequeña animación para respuesta incorrecta
            button.classList.add('incorrect-shake');
        }
        
        if (optText === playerAnswerText) {
            button.classList.add('selected');
        }
    });
}

function enableAnswerOptions() {
    Array.from(DOM.optionsGrid.children).forEach(button => {
        button.disabled = false;
        button.classList.remove('correct', 'incorrect', 'selected', 'correct-reveal', 'incorrect-shake', 'pulse-select');
    });
}

function disableAnswerOptions() {
    Array.from(DOM.optionsGrid.children).forEach(button => {
        button.disabled = true;
    });
}

function showFeedbackInGame(message, type = 'info') {
    if (!DOM.feedbackMessage) return;
    
    DOM.feedbackMessage.textContent = message;
    DOM.feedbackMessage.className = `feedback-message ${type}`;
    DOM.feedbackMessage.style.display = 'block';
    
    // Añadir animación al mostrar feedback
    DOM.feedbackMessage.classList.add('feedback-appear');
    setTimeout(() => {
        DOM.feedbackMessage.classList.remove('feedback-appear');
    }, 300);
    
    // Auto-ocultar feedback informativo después de 5 segundos
    if (type === 'info') {
        setTimeout(() => {
            if (DOM.feedbackMessage.textContent === message) {
                clearFeedbackInGame();
            }
        }, 5000);
    }
}

function clearFeedbackInGame() {
    if (DOM.feedbackMessage) DOM.feedbackMessage.style.display = 'none';
}

function showErrorInGame(message) {
    showFeedbackInGame(message, 'error');
}

function startQuestionTimer() {
    stopQuestionTimer();
    gameState.timeLeft = gameState.timePerQuestion;
    
    if (DOM.timerProgress) {
        DOM.timerProgress.style.width = '100%';
        DOM.timerProgress.style.backgroundColor = ''; // Reset to default color
    }

    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        
        if (DOM.timerProgress) {
            const percentage = Math.max(0, (gameState.timeLeft / gameState.timePerQuestion) * 100);
            DOM.timerProgress.style.width = `${percentage}%`;
            
            // Cambiar color según tiempo restante
            if (gameState.timeLeft <= 5 && gameState.timeLeft > 2) {
                DOM.timerProgress.style.backgroundColor = 'orange';
                // Añadir animación de pulso en tiempo bajo
                DOM.timerProgress.classList.add('timer-pulse');
            } else if (gameState.timeLeft <= 2) {
                DOM.timerProgress.style.backgroundColor = 'red';
                DOM.timerProgress.classList.add('timer-pulse-fast');
            } else {
                DOM.timerProgress.style.backgroundColor = '';
                DOM.timerProgress.classList.remove('timer-pulse', 'timer-pulse-fast');
            }
        }
        
        if (gameState.timeLeft <= 0) {
            stopQuestionTimer();
            showFeedbackInGame('¡Tiempo agotado!', 'error');
            disableAnswerOptions();
            // Enviar timeOut al servidor
            sendToServer('timeOut');
        }
    }, 1000);
}

function stopQuestionTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    
    if (DOM.timerProgress) {
        DOM.timerProgress.classList.remove('timer-pulse', 'timer-pulse-fast');
    }
}

function showWaitingStateInGame(message) {
    if (DOM.waitingArea) { 
        DOM.waitingArea.style.display = 'flex'; 
        if (DOM.waitingMessage) DOM.waitingMessage.textContent = message; 
    }
    
    if (DOM.qsmQuestionText) DOM.qsmQuestionText.textContent = '';
    if (DOM.optionsGrid) DOM.optionsGrid.innerHTML = '';
    
    clearFeedbackInGame();
    stopQuestionTimer();
}

function hideWaitingStateInGame() {
    if (DOM.waitingArea) DOM.waitingArea.style.display = 'none';
}

// --- Game End ---
async function handleGameEnd(payload) {
    console.log("🏁 Juego terminado:", payload);
    stopQuestionTimer();
    gameState.gameActive = false;
    gameState.gamePhase = 'gameOver';

    const myPlayerId = gameState.myPlayerId;
    const finalScores = payload.finalScores || {};
    const myScore = finalScores[myPlayerId] || 0;
    let opponentScore = 0;
    let opponentId = null;

    // Encontrar el ID y puntaje del oponente
    for (const playerId in finalScores) {
        if (playerId !== myPlayerId) {
            opponentId = playerId;
            opponentScore = finalScores[playerId];
            break;
        }
    }

    // Determinar resultado para el jugador actual
    let resultText = "Juego Terminado";
    let resultTitleText = "Fin del Juego";
    let resultIcon = "fas fa-check-circle";
    
    if (payload.draw) {
        resultTitleText = "¡Empate!";
        resultText = payload.reason || "Ambos jugadores empataron en puntuación.";
        resultIcon = "fas fa-balance-scale";
    } else if (payload.winnerId === myPlayerId) {
        resultTitleText = "¡Victoria!";
        resultText = payload.reason || "¡Felicitaciones! Has ganado la partida.";
        resultIcon = "fas fa-trophy";
    } else if (payload.winnerId && payload.winnerId !== myPlayerId) {
        resultTitleText = "Derrota";
        resultText = payload.reason || "Mejor suerte la próxima vez.";
        resultIcon = "fas fa-award";
    } else if (payload.reason) {
        resultTitleText = "Juego Interrumpido";
        resultText = payload.reason;
        resultIcon = "fas fa-exclamation-triangle";
    }

    // Actualizar UI del modal de resultados
    if (DOM.resultTitle) DOM.resultTitle.innerHTML = `<i class="${resultIcon}"></i> ${resultTitleText}`;
    if (DOM.resultMessageModal) DOM.resultMessageModal.textContent = resultText;
    if (DOM.playerFinalScoreDisplay) DOM.playerFinalScoreDisplay.textContent = myScore;
    if (DOM.opponentFinalScoreDisplay) DOM.opponentFinalScoreDisplay.textContent = opponentScore;
    if (DOM.qsmResultModal) {
        // Añadir una pequeña demora para que el jugador vea el estado final del juego
        setTimeout(() => {
            DOM.qsmResultModal.style.display = 'flex';
        }, 1500);
    }

    // Gamification (local) — independent from Firebase publish
    if (!gameState.progressReported && window.CrackTotalProgressBridge) {
        gameState.progressReported = true;
        const won = Boolean(!payload.draw && payload.winnerId === myPlayerId);
        window.CrackTotalProgressBridge.reportMatch({
            gameId: 'quiensabemas',
            gameName: 'Quién Sabe Más',
            won: won,
            result: payload.draw ? 'draw' : (won ? 'victory' : 'defeat'),
            score: myScore,
            correctAnswers: myScore,
            durationSec: Math.floor((Date.now() - (gameState.gameStartTime || Date.now())) / 1000)
        });
    }

    // Guardar resultados usando el servicio de Firebase
    if (window.firebaseService && typeof window.firebaseService.saveMatch === 'function') {
        if (gameState.resultPublished) return;
        gameState.resultPublished = true;
        try {
            const playerName = gameState.playerName || 
                             localStorage.getItem('playerName') ||
                             (window.CrackTotalProfile
                                ? await window.CrackTotalProfile.ensurePlayerName({ reason: 'publish-score' })
                                : '');
            if (!playerName) return;

            const matchData = {
                playerName: playerName,
                score: myScore,
                correctAnswers: myScore, // En QSM, el score es directamente las respuestas correctas
                totalQuestions: gameState.totalQuestions || 10,
                accuracy: Math.round((myScore / (gameState.totalQuestions || 10)) * 100),
                duration: Math.floor((Date.now() - (gameState.gameStartTime || Date.now())) / 1000)
            };

            await window.firebaseService.saveMatch('quiensabemas', matchData);
            console.log("✅ [QUIENSABEMAS] Resultado guardado en Firebase");
        } catch (error) {
            console.error("❌ [QUIENSABEMAS] Error guardando resultado:", error);
        }
    } else {
        console.warn("⚠️ [QUIENSABEMAS] Firebase Service no disponible");
    }
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    console.log("⚙️ Configurando event listeners...");
    
    // Botones del lobby
    if (DOM.createRoomBtn) DOM.createRoomBtn.addEventListener('click', handleCreateRoom);
    if (DOM.joinRoomBtn) DOM.joinRoomBtn.addEventListener('click', handleJoinRoomById);
    if (DOM.joinRandomRoomBtn) DOM.joinRandomRoomBtn.addEventListener('click', handleJoinRandomRoom);
    
    // Input fields para nombres de jugadores
    const createPlayerNameInput = document.getElementById('createPlayerName');
    const joinPlayerNameInput = document.getElementById('joinPlayerName');
    
    // Botón para refrescar la lista de salas
    const refreshRoomsBtn = document.getElementById('refreshRoomsBtn');
    if (refreshRoomsBtn) {
        console.log('Configurando botón de refrescar salas...');
        refreshRoomsBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto
            console.log('Botón de refrescar salas clickeado');
            refreshAvailableRooms();
        });
    } else {
        console.warn('⚠️ No se encontró el botón de refrescar salas (refreshRoomsBtn)');
    }
    
    // Inicializar lista de salas
    setTimeout(() => {
        if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN) {
            console.log('Solicitando lista inicial de salas...');
            refreshAvailableRooms();
        }
    }, 1000);
    
    // Sincronizar nombres de jugador entre los campos de formulario
    if (createPlayerNameInput) {
        createPlayerNameInput.addEventListener('input', () => {
            if (createPlayerNameInput.value.trim() && joinPlayerNameInput) {
                joinPlayerNameInput.value = createPlayerNameInput.value.trim();
            }
        });
    }
    
    if (joinPlayerNameInput) {
        joinPlayerNameInput.addEventListener('input', () => {
            if (joinPlayerNameInput.value.trim() && createPlayerNameInput) {
                createPlayerNameInput.value = joinPlayerNameInput.value.trim();
            }
        });
    }

    // Modal de introducción
    if (DOM.qsmIntroModal && DOM.goToLobbyQSMButton) {
        DOM.goToLobbyQSMButton.addEventListener('click', () => {
            DOM.qsmIntroModal.style.display = 'none';
            localStorage.setItem(CONFIG.STORAGE_KEYS.INTRO_SHOWN, 'true');
            showLobbyView();
        });
        
        // Cerrar modal al hacer clic fuera
        DOM.qsmIntroModal.addEventListener('click', (e) => {
            if (e.target === DOM.qsmIntroModal) DOM.goToLobbyQSMButton.click();
        });
    }
    
    // Modal de resultados
    if (DOM.qsmResultModal) {
        if (DOM.playAgainQSMBtn) {
            DOM.playAgainQSMBtn.addEventListener('click', () => {
                DOM.qsmResultModal.style.display = 'none';
                showLobbyView();
            });
        }
        
        if (DOM.goToLobbyFromResultsBtn) {
            DOM.goToLobbyFromResultsBtn.addEventListener('click', () => {
                DOM.qsmResultModal.style.display = 'none';
                showLobbyView();
            });
        }
        
        // Cerrar modal al hacer clic fuera
        DOM.qsmResultModal.addEventListener('click', (e) => {
            if (e.target === DOM.qsmResultModal) {
                DOM.qsmResultModal.style.display = 'none';
                showLobbyView();
            }
        });
    }

    // Comunicación con games.html
    window.addEventListener('message', function(event) {
        if (event.origin !== window.location.origin) return;
        
        if (event.data?.type === 'requestRooms' && event.data?.gameType === 'quiensabemas') {
            console.log('💬 Solicitud de salas recibida desde games.html');
            
            if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN) {
                sendToServer('getRooms', { gameType: 'quiensabemas' });
                gameState.pendingRoomsRequest = { source: event.source, origin: event.origin };
            } else {
                event.source.postMessage({ 
                    type: 'availableRooms', 
                    gameType: 'quiensabemas', 
                    rooms: [] 
                }, event.origin);
            }
        }
    });
    
    // Teclas de acceso rápido
    document.addEventListener('keydown', (e) => {
        // Responder con teclas A, B, C, D si es nuestro turno y el juego está activo
        if (gameState.gameActive && gameState.currentTurn === gameState.myPlayerId) {
            const optionButtons = DOM.optionsGrid?.children;
            if (!optionButtons || optionButtons.length === 0) return;
            
            let optionIndex = -1;
            
            switch (e.key.toLowerCase()) {
                case 'a': optionIndex = 0; break;
                case 'b': optionIndex = 1; break;
                case 'c': optionIndex = 2; break;
                case 'd': optionIndex = 3; break;
            }
            
            if (optionIndex >= 0 && optionIndex < optionButtons.length) {
                const button = optionButtons[optionIndex];
                if (!button.disabled) {
                    button.click();
                }
            }
        }
        
        // Escape para cerrar modales
        if (e.key === 'Escape') {
            if (DOM.qsmResultModal && DOM.qsmResultModal.style.display === 'flex') {
                DOM.qsmResultModal.style.display = 'none';
                showLobbyView();
            }
            
            if (DOM.qsmIntroModal && DOM.qsmIntroModal.style.display === 'flex' && 
                localStorage.getItem(CONFIG.STORAGE_KEYS.INTRO_SHOWN)) {
                DOM.qsmIntroModal.style.display = 'none';
            }
        }
    });
}

// Nota: La lógica del servidor (server.js) DEBE ser actualizada para manejar los nuevos tipos de mensajes
// qsmGetPlayerInfo, qsmRequestRoomList, qsmCreateRoom, qsmJoinRoomById, qsmJoinRandomRoom, qsmSubmitAnswer, qsmTimeOut, etc.
// y para gestionar el estado completo del juego QSM (preguntas, turnos, scores).

// Nota: Este es un esqueleto. Faltan muchas validaciones, manejo de errores robusto,
// lógica de reconexión, seguridad de Firestore rules, y posiblemente una 
// integración más profunda con un backend o Cloud Functions para operaciones sensibles
// como la creación de salas o la gestión de turnos complejos.
// La carga de preguntas desde `assets/data/level_X.json` es simulada y debe
// ser implementada correctamente según cómo se sirvan esos archivos o si se mueven a Firestore. 