// --- Importaciones ---
import { save100FutbolerosResult } from './firebase-utils.js';

// --- WebSocket URL (¡Configura esto!) ---
const WEBSOCKET_URL = (() => {
    // Probar primero localhost y luego el servidor de producción
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
        return 'ws://localhost:3000';
    } else {
        return 'wss://cracktotal-servidor.onrender.com';
    }
})();

// --- Variables de reconexión ---
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 segundos
let reconnectTimeout = null;

// Comunicación con la página principal para salas disponibles
window.addEventListener('message', function(event) {
    console.log('🔍 [100-FUTBOLEROS] Mensaje recibido:', event.data);
    
    // Verificar origen del mensaje
    if (event.origin !== window.location.origin) return;
    
    // Si se solicitan las salas disponibles
    if (event.data && event.data.type === 'requestRooms' && event.data.gameType === '100-futboleros-dicen') {
        console.log('✅ [100-FUTBOLEROS] Solicitud de salas 100 Futboleros Dicen recibida desde games.html');
        
        if (document.readyState === 'complete') {
            // Si la página ya está cargada, solicitar salas
            if (window.gameState && window.gameState.websocket && 
                window.gameState.websocket.readyState === WebSocket.OPEN) {
                console.log('📡 [100-FUTBOLEROS] Solicitando salas al servidor');
                window.sendToServer('getRooms', { gameType: '100-futboleros-dicen' });
                
                // Almacenar el origen para responder cuando recibamos la lista
                window.roomsRequestSource = event.source;
                window.roomsRequestOrigin = event.origin;
            } else {
                console.warn('⚠️ [100-FUTBOLEROS] WebSocket no conectado, enviando lista vacía');
                // Si no hay conexión, enviar lista vacía
                event.source.postMessage({
                    type: 'availableRooms',
                    gameType: '100-futboleros-dicen',
                    rooms: []
                }, event.origin);
            }
        } else {
            console.log('⏳ [100-FUTBOLEROS] Página no cargada, esperando...');
            // Si la página aún no está cargada, esperar
            window.addEventListener('load', function() {
                setTimeout(function() {
                    if (window.gameState && window.gameState.websocket && 
                        window.gameState.websocket.readyState === WebSocket.OPEN) {
                        console.log('📡 [100-FUTBOLEROS] Solicitando salas al servidor (después de carga)');
                        window.sendToServer('getRooms', { gameType: '100-futboleros-dicen' });
                        
                        // Almacenar el origen para responder cuando recibamos la lista
                        window.roomsRequestSource = event.source;
                        window.roomsRequestOrigin = event.origin;
                    } else {
                        console.warn('⚠️ [100-FUTBOLEROS] WebSocket no conectado después de esperar, enviando lista vacía');
                        // Si no hay conexión después de esperar, enviar lista vacía
                        event.source.postMessage({
                            type: 'availableRooms',
                            gameType: '100-futboleros-dicen',
                            rooms: []
                        }, event.origin);
                    }
                }, 1000); // Esperar 1 segundo para asegurar que la conexión esté establecida
            });
        }
    } else if (event.data && event.data.type === 'requestRooms') {
        console.log(`❌ [100-FUTBOLEROS] Solicitud de salas para ${event.data.gameType} (no es 100 Futboleros Dicen), ignorando`);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // ========================================= 
    // ======== SISTEMA DE SONIDO COMPLETO ======== 
    // ========================================= 
    
    class SoundManager {
        constructor() {
            this.audioContext = null;
            this.sounds = {};
            this.volume = 0.7; // Volumen por defecto 70%
            this.isMuted = false;
            this.currentBackgroundMusic = null;
            this.soundEnabled = true;
            
            // Cargar configuración guardada
            this.loadSoundSettings();
            
            // Inicializar Web Audio API
            this.initAudioContext();
            
            // Crear sonidos usando osciladores y síntesis
            this.createSounds();
        }
        
        initAudioContext() {
            try {
                // Crear contexto de audio compatible con navegadores
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log("Audio context initialized successfully");
            } catch (error) {
                console.warn("Web Audio API not supported:", error);
                this.soundEnabled = false;
            }
        }
        
        createSounds() {
            if (!this.audioContext || !this.soundEnabled) return;
            
            // Definir configuraciones de sonidos
            this.soundConfigs = {
                correct: {
                    type: 'success',
                    frequency: [523, 659, 784], // Do-Mi-Sol mayor
                    duration: 0.3,
                    volume: 0.4
                },
                incorrect: {
                    type: 'error', 
                    frequency: [196, 165], // Sol-Mi descendente
                    duration: 0.4,
                    volume: 0.3
                },
                reveal: {
                    type: 'reveal',
                    frequency: [440, 554, 659, 784], // La-Do#-Mi-Sol
                    duration: 0.6,
                    volume: 0.35
                },
                steal: {
                    type: 'warning',
                    frequency: [300, 350, 400], // Frecuencias ascendentes
                    duration: 0.5,
                    volume: 0.4
                },
                victory: {
                    type: 'celebration',
                    frequency: [523, 659, 784, 1047], // Do-Mi-Sol-Do mayor
                    duration: 0.6,
                    volume: 0.5
                },
                defeat: {
                    type: 'sad',
                    frequency: [220, 196, 175], // La-Sol-Fa descendente
                    duration: 0.8,
                    volume: 0.4
                },
                gameStart: {
                    type: 'start',
                    frequency: [440, 554, 659], // La-Do#-Mi
                    duration: 0.4,
                    volume: 0.3
                },
                roundComplete: {
                    type: 'complete',
                    frequency: [659, 784, 988], // Mi-Sol-Si
                    duration: 0.5,
                    volume: 0.35
                }
            };
        }
        
        playSound(soundName, options = {}) {
            if (!this.audioContext || !this.soundEnabled || this.isMuted) return;
            
            const config = this.soundConfigs[soundName];
            if (!config) {
                console.warn(`Sound "${soundName}" not found`);
                return;
            }
            
            try {
                // Reanudar contexto si está suspendido
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                
                const { frequency, duration, volume: baseVolume } = config;
                const finalVolume = (baseVolume * this.volume * (options.volume || 1));
                
                // Crear osciladores para cada frecuencia
                frequency.forEach((freq, index) => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    // Configurar oscilador
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = this.getOscillatorType(config.type);
                    
                    // Configurar ganancia con envelope
                    const startTime = this.audioContext.currentTime + (index * 0.1);
                    const endTime = startTime + duration;
                    
                    gainNode.gain.setValueAtTime(0, startTime);
                    gainNode.gain.linearRampToValueAtTime(finalVolume, startTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
                    
                    // Conectar nodos
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    // Programar reproducción
                    oscillator.start(startTime);
                    oscillator.stop(endTime);
                });
                
            } catch (error) {
                console.error("Error playing sound:", error);
            }
        }
        
        getOscillatorType(soundType) {
            const types = {
                success: 'sine',
                error: 'triangle', 
                reveal: 'sine',
                warning: 'triangle',
                celebration: 'sine',
                sad: 'sawtooth',
                start: 'sine',
                complete: 'sine'
            };
            return types[soundType] || 'sine';
        }
        
        setVolume(newVolume) {
            this.volume = Math.max(0, Math.min(1, newVolume));
            this.saveSoundSettings();
        }
        
        toggleMute() {
            this.isMuted = !this.isMuted;
            this.saveSoundSettings();
        }
        
        saveSoundSettings() {
            const settings = {
                volume: this.volume,
                isMuted: this.isMuted
            };
            localStorage.setItem('100FutbolerosSoundSettings', JSON.stringify(settings));
        }
        
        loadSoundSettings() {
            try {
                const settings = JSON.parse(localStorage.getItem('100FutbolerosSoundSettings'));
                if (settings) {
                    this.volume = settings.volume !== undefined ? settings.volume : 0.7;
                    this.isMuted = settings.isMuted || false;
                }
            } catch (error) {
                console.warn("Error loading sound settings:", error);
            }
        }
        
        // Método de limpieza
        destroy() {
            if (this.audioContext) {
                this.audioContext.close();
            }
        }
    }
    
    // Crear instancia global del manager de sonido
    window.soundManager = new SoundManager();
    
    console.log("Sound system initialized for 100 Futboleros Dicen");
    
    // ========================================= 
    // ======== FIN SISTEMA DE SONIDO ======== 
    // =========================================

    // --- Game State Variables (100 Futboleros Dicen) ---
    let gameState = {
        players: {
            player1: { id: null, name: 'Jugador 1', score: 0 },
            player2: { id: null, name: 'Jugador 2', score: 0 }
        },
        roomId: null,
        myPlayerId: null,
        currentRound: 1,
        maxRounds: 5, // 5 rondas por partida
        currentQuestion: null,
        currentAnswers: [], // Respuestas disponibles para la pregunta actual
        revealedAnswers: [], // Respuestas ya reveladas
        currentTurn: null, // Player ID del jugador que tiene el turno
        strikes: 0, // Número de fallos en el turno actual
        maxStrikes: 3, // Máximo 3 fallos antes de cambiar turno
        gamePhase: 'lobby', // lobby, guessing, steal, roundOver, gameOver
        gameActive: false,
        websocket: null,
        pendingRoomsRequest: null, // Para almacenar solicitud pendiente de salas
        isRoomCreator: false, // Para saber si este jugador creó la sala
        playNotificationSound: null, // Para la función de sonido de notificación
        roundWinner: null, // Ganador de la ronda actual
        stealAttempt: false, // Si está en modo robo
        stealingPlayer: null, // Jugador que intenta robar
        roundPoints: 0 // Puntos acumulados en la ronda actual
    };

    // --- DOM Elements (100 Futboleros Dicen) ---
    // Player Info (Header)
    const player1NameEl = document.getElementById('player1Name');
    const player1ScoreEl = document.getElementById('player1Score');
    const player2NameEl = document.getElementById('player2Name');
    const player2ScoreEl = document.getElementById('player2Score');
    const playersHeaderInfoEl = document.getElementById('playersHeaderInfo');

    // Game Status Display
    const gameRoundDisplayEl = document.getElementById('gameRoundDisplay');
    const gameCategoryDisplayEl = document.getElementById('gameCategoryDisplay');

    // Timer elements
    const timerDisplayEl = document.getElementById('timerDisplay');
    const timerCountdownEl = document.getElementById('timerCountdown');
    const timerProgressBarEl = document.getElementById('timerProgressBar');

    // Question and Game Area
    const questionTextEl = document.getElementById('questionText');
    const localPlayerNameEl = document.getElementById('localPlayerName');
    const localPlayerScoreEl = document.getElementById('localPlayerScore');
    const opponentPlayerNameEl = document.getElementById('opponentPlayerName');
    const opponentPlayerScoreEl = document.getElementById('opponentPlayerScore');
    const currentRoundTextEl = document.getElementById('currentRoundText');
    const answersRevealedCountEl = document.getElementById('answersRevealedCount');
    const totalAnswersCountEl = document.getElementById('totalAnswersCount');
    const answersGridEl = document.getElementById('answersGrid');

    // Interaction Area
    const interactionAreaEl = document.getElementById('interactionArea');
    const waitingPhaseEl = document.getElementById('waitingPhase');
    const guessingPhaseEl = document.getElementById('guessingPhase');
    const stealPhaseEl = document.getElementById('stealPhase');
    const turnIndicatorEl = document.getElementById('turnIndicator');
    const turnIndicatorTextEl = document.getElementById('turnIndicatorText');
    const guessInputEl = document.getElementById('guessInput');
    const submitGuessButtonEl = document.getElementById('submitGuessButton');
    const stealTitleEl = document.getElementById('stealTitle');
    const stealInstructionsEl = document.getElementById('stealInstructions');
    const stealInputEl = document.getElementById('stealInput');
    const submitStealButtonEl = document.getElementById('submitStealButton');

    // Feedback and Strikes
    const feedbackAreaEl = document.getElementById('feedbackArea');
    const strikesDisplayEl = document.getElementById('strikesDisplay');
    const strike1El = document.getElementById('strike1');
    const strike2El = document.getElementById('strike2');
    const strike3El = document.getElementById('strike3');

    // Lobby Elements
    const lobbySectionEl = document.getElementById('lobbySection');
    const lobbyMessageAreaEl = document.getElementById('lobbyMessageArea');
    const createPlayerNameInput = document.getElementById('createPlayerName');
    const createRoomPasswordInput = document.getElementById('createRoomPassword');
    const createRoomButton = document.getElementById('createRoomButton');
    const joinPlayerNameInput = document.getElementById('joinPlayerName');
    const joinRoomIdInput = document.getElementById('joinRoomId');
    const joinRoomPasswordInput = document.getElementById('joinRoomPassword');
    const joinRoomButton = document.getElementById('joinRoomButton');
    const joinRandomRoomButton = document.getElementById('joinRandomRoomButton');
    const gameContentSectionEl = document.getElementById('gameContentSection');
    const availableRoomsListEl = document.getElementById('availableRoomsList');

    // Password Modal
    const privateRoomPasswordModalEl = document.getElementById('privateRoomPasswordModal');
    const passwordModalTitleEl = document.getElementById('passwordModalTitle');
    const passwordModalTextEl = document.getElementById('passwordModalText');
    const privateRoomPasswordFormEl = document.getElementById('privateRoomPasswordForm');
    const passwordModalInputEl = document.getElementById('passwordModalInput');
    const cancelPasswordSubmitEl = document.getElementById('cancelPasswordSubmit');
    const submitPasswordButtonEl = document.getElementById('submitPasswordButton');
    const passwordErrorTextEl = document.getElementById('passwordErrorText');
    let currentJoiningRoomId = null; 

    // End Game Modal
    const endGameModalEl = document.getElementById('gameResultModalFutboleros');
    const resultTitleEl = document.getElementById('resultTitleFutboleros');
    const resultMessageEl = document.getElementById('resultMessageFutboleros');
    const resultStatsEl = document.getElementById('resultStatsFutboleros');
    const playAgainButtonFutbolerosEl = document.getElementById('playAgainButtonFutboleros');
    const backToLobbyButtonFutbolerosEl = document.getElementById('backToLobbyButtonFutboleros');
    const backToGamesButtonFutbolerosEl = document.getElementById('backToGamesButtonFutboleros');

    // Waiting Area
    const waitingAreaEl = document.getElementById('waitingArea');

    // --- Initialization ---
    function initializeApp() {
        console.log("Inicializando 100 Futboleros Dicen App...");
        
        // Verificar que los elementos DOM esenciales estén presentes
        const requiredElements = {
            feedbackAreaEl,
            waitingAreaEl,
            playersHeaderInfoEl,
            guessingPhaseEl,
            stealPhaseEl
        };
        
        // Registrar los elementos que faltan (para depuración)
        Object.entries(requiredElements).forEach(([name, element]) => {
            if (!element) {
                console.warn(`Elemento faltante: ${name}`);
            }
        });
        
        // Inicializar la interfaz de usuario
        showLobby();
        setupEventListeners();
        hideEndGameModal();
        
        // Inicializar el sistema de notificaciones
        initializeNotificationSystem();
        
        // Inicializar la conexión WebSocket después de preparar la UI
        initializeWebSocket();
        
        // Cargar el nombre del jugador desde localStorage si está disponible
        loadPlayerName();
        
        // Configurar polling automático de salas cada 5 segundos cuando estamos en el lobby
        setupAutomaticRoomPolling();
        
        console.log("Inicialización completada.");
    }

    function loadPlayerName() {
        const savedPlayerName = localStorage.getItem('playerName');
        if (savedPlayerName) {
            if (createPlayerNameInput) createPlayerNameInput.value = savedPlayerName;
            if (joinPlayerNameInput) joinPlayerNameInput.value = savedPlayerName;
            console.log(`Prefilled player name from localStorage (100 Futboleros): ${savedPlayerName}`);
        }
    }

    function showLobby() {
        gameState.gamePhase = 'lobby';
        lobbySectionEl.style.display = 'block';
        gameContentSectionEl.style.display = 'none';
        lobbySectionEl.classList.add('active');
        gameContentSectionEl.classList.remove('active');
        if (playersHeaderInfoEl) playersHeaderInfoEl.style.display = 'none';
        clearLobbyMessage();
        enableLobbyButtons();
    }

    function showGameScreen() {
        lobbySectionEl.style.display = 'none';
        gameContentSectionEl.style.display = 'block';
        lobbySectionEl.classList.remove('active');
        gameContentSectionEl.classList.add('active');
        if (playersHeaderInfoEl) playersHeaderInfoEl.style.display = 'flex';
    }
    
    function resetGameUI() {
        questionTextEl.textContent = 'Esperando pregunta...';
        guessInputEl.value = '';
        stealInputEl.value = '';
        feedbackAreaEl.innerHTML = '';
        resetStrikes();
        clearAnswersGrid();
        updateGamePhaseUI('waiting');
    }

    // --- Lobby Logic ---
    function setupLobbyEventListeners() {
        if (createRoomButton) createRoomButton.addEventListener('click', handleCreateRoom);
        if (joinRoomButton) joinRoomButton.addEventListener('click', handleJoinRoomById);
        if (joinRandomRoomButton) joinRandomRoomButton.addEventListener('click', handleJoinRandomRoom);

        [createRoomPasswordInput, joinRoomPasswordInput, createPlayerNameInput, joinPlayerNameInput, joinRoomIdInput].forEach(input => {
            if(input) input.addEventListener('input', clearLobbyMessage);
        });
    }

    function handleCreateRoom() {
        if (!createRoomButton || createRoomButton.disabled) return;
        const playerName = createPlayerNameInput.value.trim() || 'Jugador 1';
        localStorage.setItem('playerName', playerName);
        const password = createRoomPasswordInput.value;
        showLobbyMessage("Creando sala de 100 Futboleros Dicen...", "info");
        disableLobbyButtons(true);
        sendToServer('createRoom', { playerName, password, gameType: '100-futboleros-dicen' });
    }

    function handleJoinRoomById() {
        if (!joinRoomButton || joinRoomButton.disabled) return;
        const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';
        localStorage.setItem('playerName', playerName);
        const roomId = joinRoomIdInput.value.trim();
        const password = joinRoomPasswordInput.value;
        if (!roomId) {
            showLobbyMessage("Por favor, poné un ID de sala.", "error");
            return;
        }
        showLobbyMessage(`Uniéndote a la sala ${roomId}...`, "info");
        disableLobbyButtons(false, true);
        sendToServer('joinRoom', { playerName, roomId, password, gameType: '100-futboleros-dicen' });
    }

     function handleJoinRandomRoom() {
         if (!joinRandomRoomButton || joinRandomRoomButton.disabled) return;
         const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';
         localStorage.setItem('playerName', playerName);
         showLobbyMessage("Buscando una sala de 100 Futboleros Dicen...", "info");
         disableLobbyButtons(false, false, true);
         sendToServer('joinRandomRoom', { playerName, gameType: '100-futboleros-dicen' });
     }

    function showLobbyMessage(message, type = "info") {
        if (!lobbyMessageAreaEl) return;
        lobbyMessageAreaEl.textContent = message;
        lobbyMessageAreaEl.className = 'lobby-message';
        void lobbyMessageAreaEl.offsetWidth;
        lobbyMessageAreaEl.classList.add(type, 'show');
        if (type !== 'error') {
            setTimeout(() => {
                if (lobbyMessageAreaEl.textContent === message) clearLobbyMessage();
            }, 5000);
        }
    }

    function clearLobbyMessage() {
        lobbyMessageAreaEl.classList.remove('show');
         setTimeout(() => {
             if (!lobbyMessageAreaEl.classList.contains('show')) {
                lobbyMessageAreaEl.textContent = '';
                lobbyMessageAreaEl.className = 'lobby-message';
             }
         }, 300);
    }

    function disableLobbyButtons(spinCreate = false, spinJoinId = false, spinJoinRandom = false) {
        if (createRoomButton) {
            createRoomButton.disabled = true;
            createRoomButton.innerHTML = spinCreate ? 'Creando... <span class="spinner-lobby"></span>' : 'Crear Sala';
        }
        if (joinRoomButton) {
            joinRoomButton.disabled = true;
            joinRoomButton.innerHTML = spinJoinId ? 'Uniéndote... <span class="spinner-lobby"></span>' : 'Unirse por ID';
        }
        if (joinRandomRoomButton) {
            joinRandomRoomButton.disabled = true;
            joinRandomRoomButton.innerHTML = spinJoinRandom ? 'Buscando... <span class="spinner-lobby"></span>' : 'Buscar Sala Aleatoria';
        }
    }

    function enableLobbyButtons() {
        if (createRoomButton) {
            createRoomButton.disabled = false;
            createRoomButton.innerHTML = 'Crear Sala';
        }
        if (joinRoomButton) {
            joinRoomButton.disabled = false;
            joinRoomButton.innerHTML = 'Unirse por ID';
        }
        if (joinRandomRoomButton) {
            joinRandomRoomButton.disabled = false;
            joinRandomRoomButton.innerHTML = 'Buscar Sala Aleatoria';
        }
    }

    // --- Game Event Listeners ---
    function setupGameEventListeners() {
        if(submitGuessButtonEl) submitGuessButtonEl.addEventListener('click', handleSubmitGuess);
        if(submitStealButtonEl) submitStealButtonEl.addEventListener('click', handleSubmitSteal);
        
        // Enter key for inputs
        if(guessInputEl) guessInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !submitGuessButtonEl.disabled) {
                handleSubmitGuess();
            }
        });
        
        if(stealInputEl) stealInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !submitStealButtonEl.disabled) {
                handleSubmitSteal();
            }
        });
    }

    // --- Game UI Update Functions ---
    function updatePlayerUI() {
        if (!gameState.players || !gameState.myPlayerId) {
            console.log("⚠️ Faltan datos para updatePlayerUI:", {players: gameState.players, myId: gameState.myPlayerId});
            return;
        }
        
        const p1 = gameState.players.player1;
        const p2 = gameState.players.player2;
        console.log(`⭐ updatePlayerUI - Jugadores:`, p1, p2, `Mi ID: ${gameState.myPlayerId}, Turno: ${gameState.currentTurn}`);
        
        const localPlayer = p1?.id === gameState.myPlayerId ? p1 : (p2?.id === gameState.myPlayerId ? p2 : null);
        const opponentPlayer = p1?.id !== gameState.myPlayerId ? p1 : (p2?.id !== gameState.myPlayerId ? p2 : null);

        // Update header players info
        if (playersHeaderInfoEl && localPlayer && opponentPlayer) {
            const localNameEl = playersHeaderInfoEl.querySelector('.local-player .player-name');
            const localScoreEl = playersHeaderInfoEl.querySelector('.local-player .score');
            const opponentNameEl = playersHeaderInfoEl.querySelector('.opponent-player .player-name');
            const opponentScoreEl = playersHeaderInfoEl.querySelector('.opponent-player .score');

            if (localNameEl) localNameEl.textContent = localPlayer.name || 'Tú';
            if (localScoreEl) localScoreEl.textContent = `Puntos: ${localPlayer.score || 0}`;
            if (opponentNameEl) opponentNameEl.textContent = opponentPlayer.name || 'Oponente';
            if (opponentScoreEl) opponentScoreEl.textContent = `Puntos: ${opponentPlayer.score || 0}`;

            const localPlayerBox = playersHeaderInfoEl.querySelector('.local-player');
            const opponentPlayerBox = playersHeaderInfoEl.querySelector('.opponent-player');
            
            // Resaltar el jugador activo
            if (localPlayerBox) {
                localPlayerBox.classList.remove('active-turn');
                if (localPlayer.id === gameState.currentTurn) {
                    localPlayerBox.classList.add('active-turn');
                }
            }
            
            if (opponentPlayerBox) {
                opponentPlayerBox.classList.remove('active-turn');
                if (opponentPlayer.id === gameState.currentTurn) {
                    opponentPlayerBox.classList.add('active-turn');
                }
            }
        }
        
        // Update scoreboard in game area
        if (localPlayerNameEl && localPlayer) localPlayerNameEl.textContent = localPlayer.name || 'Tú';
        if (localPlayerScoreEl && localPlayer) localPlayerScoreEl.textContent = localPlayer.score || 0;
        if (opponentPlayerNameEl && opponentPlayer) opponentPlayerNameEl.textContent = opponentPlayer.name || 'Oponente';
        if (opponentPlayerScoreEl && opponentPlayer) opponentPlayerScoreEl.textContent = opponentPlayer.score || 0;
    }

    function updateGameStatusDisplay() {
        if(gameRoundDisplayEl) {
            gameRoundDisplayEl.innerHTML = `
                <i class="fas fa-trophy"></i> 
                Ronda ${gameState.currentRound}/${gameState.maxRounds}
            `;
        }
        
        if(gameCategoryDisplayEl && gameState.currentQuestion) {
            gameCategoryDisplayEl.innerHTML = `
                <i class="fas fa-tags"></i> 
                Categoría: ${gameState.currentQuestion.category || 'Fútbol'}
            `;
        }
        
        if(currentRoundTextEl) {
            currentRoundTextEl.textContent = `Ronda ${gameState.currentRound}/${gameState.maxRounds}`;
        }
    }
    
    function updateAnswersBoard() {
        if (!answersGridEl) return;
        
        // Actualizar contadores
        if (answersRevealedCountEl) {
            answersRevealedCountEl.textContent = gameState.revealedAnswers.length;
        }
        if (totalAnswersCountEl && gameState.currentAnswers) {
            totalAnswersCountEl.textContent = gameState.currentAnswers.length;
        }
        
        // Limpiar grid
        answersGridEl.innerHTML = '';
        
        if (!gameState.currentAnswers || gameState.currentAnswers.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-answers-message';
            emptyMessage.innerHTML = '<p>Esperando respuestas...</p>';
            answersGridEl.appendChild(emptyMessage);
            return;
        }
        
        // Crear slots para todas las respuestas
        gameState.currentAnswers.forEach((answer, index) => {
            const answerSlot = document.createElement('div');
            answerSlot.className = 'answer-slot';
            answerSlot.dataset.index = index;
            
            const isRevealed = gameState.revealedAnswers.some(revealed => revealed.index === index);
            
            if (isRevealed) {
                answerSlot.classList.add('revealed');
                const revealedAnswer = gameState.revealedAnswers.find(revealed => revealed.index === index);
                answerSlot.innerHTML = `
                    <span class="answer-text">${answer.text}</span>
                    <span class="answer-points">${answer.points}</span>
                `;
            } else {
                answerSlot.classList.add('empty');
                answerSlot.innerHTML = `
                    <span class="answer-text">???</span>
                    <span class="answer-points">?</span>
                `;
            }
            
            answersGridEl.appendChild(answerSlot);
        });
    }

    function clearAnswersGrid() {
        if (answersGridEl) {
            answersGridEl.innerHTML = '';
        }
        gameState.revealedAnswers = [];
        gameState.currentAnswers = [];
    }

    function updateGamePhaseUI(phase) {
        console.log("Actualizando UI para fase:", phase, "Mi turno?", gameState.currentTurn === gameState.myPlayerId);
        gameState.gamePhase = phase;
        
        // Hide all phase divs initially
        if(waitingPhaseEl) waitingPhaseEl.style.display = 'none';
        if(guessingPhaseEl) guessingPhaseEl.style.display = 'none';
        if(stealPhaseEl) stealPhaseEl.style.display = 'none';

        const isMyTurn = gameState.currentTurn === gameState.myPlayerId;
        console.log("¿Es mi turno?", isMyTurn, "Mi ID:", gameState.myPlayerId, "Turno actual:", gameState.currentTurn);

        // Actualizar visual de jugadores
        updatePlayerUI();

        switch (phase) {
            case 'guessing':
                if(guessingPhaseEl) guessingPhaseEl.style.display = 'block';
                
                // Actualizar indicador de turno
                if(turnIndicatorTextEl) {
                    if (isMyTurn) {
                        turnIndicatorTextEl.textContent = 'Tu turno para adivinar';
                        turnIndicatorEl.classList.add('your-turn');
                    } else {
                        const currentTurnPlayerName = gameState.players.player1?.id === gameState.currentTurn 
                            ? gameState.players.player1.name 
                            : (gameState.players.player2?.id === gameState.currentTurn 
                                ? gameState.players.player2.name 
                                : 'otro jugador');
                        turnIndicatorTextEl.textContent = `Turno de ${currentTurnPlayerName}`;
                        turnIndicatorEl.classList.remove('your-turn');
                    }
                }
                
                // Habilitar/deshabilitar elementos según el turno
                if(guessInputEl) {
                    guessInputEl.disabled = !isMyTurn;
                    if (isMyTurn) {
                        guessInputEl.value = '';
                        setTimeout(() => guessInputEl.focus(), 300);
                    }
                }
                
                if(submitGuessButtonEl) {
                    submitGuessButtonEl.disabled = !isMyTurn;
                }
                
                break;
                
            case 'steal':
                if(stealPhaseEl) stealPhaseEl.style.display = 'block';
                const isStealingPlayer = gameState.stealingPlayer === gameState.myPlayerId;
                
                if(stealTitleEl && stealInstructionsEl) {
                    if (isStealingPlayer) {
                        stealTitleEl.textContent = '¡Oportunidad de robar!';
                        stealInstructionsEl.textContent = 'El otro jugador falló 3 veces. ¡Es tu turno de intentar robar los puntos!';
                    } else {
                        const stealerName = gameState.players.player1?.id === gameState.stealingPlayer 
                            ? gameState.players.player1.name 
                            : (gameState.players.player2?.id === gameState.stealingPlayer 
                                ? gameState.players.player2.name 
                                : 'el otro jugador');
                        stealTitleEl.textContent = 'Intento de robo';
                        stealInstructionsEl.textContent = `${stealerName} está intentando robar los puntos.`;
                    }
                }
                
                if(stealInputEl) {
                    stealInputEl.disabled = !isStealingPlayer;
                    if (isStealingPlayer) {
                        stealInputEl.value = '';
                        setTimeout(() => stealInputEl.focus(), 300);
                    }
                }
                
                if(submitStealButtonEl) {
                    submitStealButtonEl.disabled = !isStealingPlayer;
                }
                
                break;
                
            case 'roundOver':
            case 'gameOver':
                if(waitingPhaseEl) waitingPhaseEl.style.display = 'block';
                break;
                
            case 'waiting':
            default:
                if(waitingPhaseEl) waitingPhaseEl.style.display = 'block';
                break;
        }
        
        // Actualizar strikes
        updateStrikesDisplay();
    }

    function updateStrikesDisplay() {
        const strikeElements = [strike1El, strike2El, strike3El];
        
        strikeElements.forEach((strikeEl, index) => {
            if (strikeEl) {
                if (index < gameState.strikes) {
                    strikeEl.classList.add('active');
                } else {
                    strikeEl.classList.remove('active');
                }
            }
        });
    }

    function resetStrikes() {
        gameState.strikes = 0;
        updateStrikesDisplay();
    }

    // --- Game Actions ---
    function handleSubmitGuess() {
        if (!guessInputEl || guessInputEl.disabled) return;
        
        const guess = guessInputEl.value.trim();
        if (!guess) {
            showFeedback("Debes escribir una respuesta.", "error");
            return;
        }
        
        console.log(`⭐ Enviando respuesta: ${guess}`);
        
        // Deshabilitar botones mientras esperamos respuesta del servidor
        guessInputEl.disabled = true;
        submitGuessButtonEl.disabled = true;
        showWaitingMessage("Enviando respuesta...");
        
        try {
            sendToServer('100futbolerosGuess', { guess: guess });
        } catch (error) {
            console.error("Error enviando respuesta:", error);
            showError("Error enviando respuesta: " + error.message);
            // Rehabilitar botones si hay error
            guessInputEl.disabled = false;
            submitGuessButtonEl.disabled = false;
            hideWaitingMessage();
        }
    }

    function handleSubmitSteal() {
        if (!stealInputEl || stealInputEl.disabled) return;
        
        const guess = stealInputEl.value.trim();
        if (!guess) {
            showFeedback("Debes escribir una respuesta para robar.", "error");
            return;
        }
        
        console.log(`⭐ Enviando intento de robo: ${guess}`);
        
        // Deshabilitar botones mientras esperamos respuesta del servidor
        stealInputEl.disabled = true;
        submitStealButtonEl.disabled = true;
        showWaitingMessage("Enviando intento de robo...");
        
        try {
            sendToServer('100futbolerosSteal', { guess: guess });
        } catch (error) {
            console.error("Error enviando intento de robo:", error);
            showError("Error enviando intento de robo: " + error.message);
            // Rehabilitar botones si hay error
            stealInputEl.disabled = false;
            submitStealButtonEl.disabled = false;
            hideWaitingMessage();
        }
    }

    // --- Feedback Functions ---
    function showFeedback(message, type = "info") {
        // Reproducir sonido según el tipo de feedback
        if (window.soundManager) {
            if (type === 'correct' || type === 'success') {
                window.soundManager.playSound('correct');
            } else if (type === 'error' || type === 'incorrect') {
                window.soundManager.playSound('incorrect');
            } else if (type === 'reveal') {
                window.soundManager.playSound('reveal');
            } else if (type === 'steal-success') {
                window.soundManager.playSound('steal');
            }
        }
        
        const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
        const feedbackModalText = document.getElementById('feedbackModalText');
        
        if (feedbackModalOverlay && feedbackModalText) {
            feedbackModalText.textContent = message;
            feedbackModalOverlay.classList.add('active');
            
            setTimeout(() => {
                feedbackModalOverlay.classList.remove('active');
            }, 3000);
        }
        
        // También mostrar en el área de feedback del juego
        if (feedbackAreaEl) {
            feedbackAreaEl.innerHTML = `<div class="feedback-message ${type}">${message}</div>`;
        }
    }
    
    function showError(message) {
        if (!feedbackAreaEl) {
            console.error("feedbackAreaEl no está disponible");
            return;
        }
        feedbackAreaEl.innerHTML = `<span class="feedback-message error">Error: ${message}</span>`;
        console.error("100 Futboleros Dicen Game Error:", message);
    }

    function showWaitingMessage(message = "Esperando acción...") {
        if (!waitingAreaEl) return;
        waitingAreaEl.querySelector('p').textContent = message;
        waitingAreaEl.classList.add('active');
    }

    function hideWaitingMessage() {
        if (!waitingAreaEl) return;
        waitingAreaEl.classList.remove('active');
    }

    // --- WebSocket Communication ---
    function initializeWebSocket() {
        const wsUrl = WEBSOCKET_URL;
        console.log(`[100-FUTBOLEROS] Intentando conectar WebSocket: ${wsUrl}`);
        
        // Limpiar timeout de reconexión si existe
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        
        if (gameState.websocket && gameState.websocket.readyState !== WebSocket.CLOSED) {
            console.log("[100-FUTBOLEROS] Cerrando conexión WebSocket anterior...");
            gameState.websocket.onclose = null;
            gameState.websocket.close();
        }
        
        try {
            showLobbyMessage(`Conectando al servidor... (Intento ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`, "info");
            gameState.websocket = new WebSocket(wsUrl);
        } catch (error) {
            console.error("[100-FUTBOLEROS] Error al crear WebSocket:", error);
            handleConnectionError();
            return;
        }
        
        const connectionTimeout = setTimeout(() => {
            if (gameState.websocket && gameState.websocket.readyState === WebSocket.CONNECTING) {
                console.error("[100-FUTBOLEROS] Tiempo de conexión agotado");
                gameState.websocket.close();
                handleConnectionError();
            }
        }, 10000);
        
        gameState.websocket.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log('[100-FUTBOLEROS] WebSocket Conectado!');
            reconnectAttempts = 0; // Reset intentos de reconexión
            showLobbyMessage("✅ Conectado al servidor. ¡Listo para jugar!", "success");
            enableLobbyButtons();
            
            // Solicitar salas disponibles al conectar
            setTimeout(() => {
                if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN) {
                    sendToServer('getRooms', { gameType: '100-futboleros-dicen' });
                }
            }, 500);
        };
        
        gameState.websocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('[100-FUTBOLEROS] Mensaje recibido:', message);
                handleServerMessage(message);
            } catch (error) {
                console.error('[100-FUTBOLEROS] Error analizando mensaje:', error, event.data);
            }
        };
        
        gameState.websocket.onerror = (error) => {
            clearTimeout(connectionTimeout);
            console.error('[100-FUTBOLEROS] Error de WebSocket:', error);
        };
        
        gameState.websocket.onclose = (event) => {
            clearTimeout(connectionTimeout);
            console.log('[100-FUTBOLEROS] WebSocket Desconectado:', event.code, event.reason);
            gameState.websocket = null;
            
            if (gameState.gameActive) {
                showError("❌ Conexión perdida con el servidor. Juego terminado.");
                gameState.gameActive = false;
                showEndGameModalWithError("Conexión Perdida");
            } else {
                // Intentar reconectar si no hemos alcanzado el límite
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    showLobbyMessage(`⚠️ Conexión perdida. Reintentando en ${RECONNECT_DELAY/1000} segundos...`, "warning");
                    disableLobbyButtons();
                    
                    reconnectTimeout = setTimeout(() => {
                        reconnectAttempts++;
                        initializeWebSocket();
                    }, RECONNECT_DELAY);
                } else {
                    showLobbyMessage("❌ No se pudo conectar al servidor. Por favor verifica tu conexión o intenta más tarde.", "error");
                    showOfflineOptions();
                }
            }
        };
    }
    
    function handleConnectionError() {
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            showLobbyMessage(`⚠️ No se pudo conectar. Reintentando en ${RECONNECT_DELAY/1000} segundos...`, "warning");
            disableLobbyButtons();
            
            reconnectTimeout = setTimeout(() => {
                reconnectAttempts++;
                initializeWebSocket();
            }, RECONNECT_DELAY);
        } else {
            showLobbyMessage("❌ No se pudo conectar al servidor después de varios intentos.", "error");
            showOfflineOptions();
        }
    }
    
    function showOfflineOptions() {
        // Mostrar opciones para jugar offline o instrucciones
        const offlineMessage = document.createElement('div');
        offlineMessage.className = 'offline-options';
        offlineMessage.innerHTML = `
            <div class="offline-message">
                <h3>⚠️ Modo Offline</h3>
                <p>No se pudo conectar al servidor de juego.</p>
                <p>Posibles soluciones:</p>
                <ul>
                    <li>Verifica tu conexión a internet</li>
                    <li>Intenta refrescar la página (F5)</li>
                    <li>El servidor podría estar en mantenimiento</li>
                </ul>
                <div class="offline-actions">
                    <button onclick="location.reload()" class="primary-button">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                    <button onclick="location.href='games.html'" class="secondary-button">
                        <i class="fas fa-gamepad"></i> Otros Juegos
                    </button>
                </div>
            </div>
        `;
        
        if (lobbyMessageAreaEl && !document.querySelector('.offline-options')) {
            lobbyMessageAreaEl.appendChild(offlineMessage);
        }
    }

    function sendToServer(type, payload) {
        if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type, payload });
            console.log('⭐ Enviando mensaje al servidor:', type, payload);
            try {
                gameState.websocket.send(message);
            } catch (error) {
                console.error('Error al enviar mensaje:', error);
                showError("Error al enviar mensaje al servidor: " + error.message);
            }
        } else {
            console.error('WebSocket not connected. Cannot send (100 Futboleros):', type, payload);
            if (gameState.gameActive) showError("No conectado. No se puede enviar mensaje.");
            else showLobbyMessage("No conectado. Por favor refresca.", "error");
        }
    }

    // Hacer sendToServer disponible globalmente
    window.sendToServer = sendToServer;
    window.gameState = gameState;

    // --- Server Message Handler ---
    function handleServerMessage(message) {
        console.log('🎮 [HANDLE MESSAGE] Procesando:', message.type, message.payload);
        
        switch (message.type) {
            case 'roomCreated':
                handleRoomCreated(message.payload);
                break;
            case 'roomJoined':
                handleRoomJoined(message.payload);
                break;
            case 'playerJoined':
                handlePlayerJoined(message.payload);
                break;
            case 'playerLeft':
                handlePlayerLeft(message.payload);
                break;
            case 'gameStarted':
                handleGameStarted(message.payload);
                break;
            case '100futbolerosNewQuestion':
                handleNewQuestion(message.payload);
                break;
            case '100futbolerosGuessResult':
                handleGuessResult(message.payload);
                break;
            case '100futbolerosStealResult':
                handleStealResult(message.payload);
                break;
            case '100futbolerosRoundEnd':
                handleRoundEnd(message.payload);
                break;
            case '100futbolerosGameEnd':
                handleGameEnd(message.payload);
                break;
            case '100futbolerosTurnChange':
                handleTurnChange(message.payload);
                break;
            case '100futbolerosAnswerRevealed':
                handleAnswerRevealed(message.payload);
                break;
            case 'roomsUpdate':
                updateAvailableRoomsList(message.payload);
                break;
            case 'error':
                handleServerError(message.payload);
                break;
            case 'requirePassword':
                handleRequirePassword(message.payload);
                break;
            default:
                console.log('🔍 [HANDLE MESSAGE] Tipo de mensaje no manejado:', message.type);
        }
    }

    // --- Game Handler Functions ---
    function handleRoomCreated(payload) {
        console.log('✅ Sala creada:', payload);
        gameState.roomId = payload.roomId;
        gameState.myPlayerId = payload.playerId;
        gameState.isRoomCreator = true;
        
        // Actualizar información del jugador
        if (payload.player) {
            gameState.players.player1 = payload.player;
        }
        
        showLobbyMessage(`Sala creada: ${payload.roomId}. Esperando oponente...`, "success");
        
        // Copiar ID de sala al campo de unirse
        if (joinRoomIdInput) {
            joinRoomIdInput.value = payload.roomId;
        }
        
        enableLobbyButtons();
        updatePlayerUI();
    }

    function handleRoomJoined(payload) {
        console.log('✅ Unido a sala:', payload);
        gameState.roomId = payload.roomId;
        gameState.myPlayerId = payload.playerId;
        gameState.isRoomCreator = false;
        
        // Actualizar información de jugadores
        if (payload.players) {
            gameState.players = payload.players;
        }
        
        showLobbyMessage(`Te uniste a la sala ${payload.roomId}`, "success");
        enableLobbyButtons();
        updatePlayerUI();
        
        // Si hay 2 jugadores, el juego puede empezar
        if (payload.players && Object.keys(payload.players).length === 2) {
            setTimeout(() => {
                showLobbyMessage("¡Sala completa! El juego comenzará pronto...", "success");
            }, 1000);
        }
    }

    function handlePlayerJoined(payload) {
        console.log('👤 Jugador se unió:', payload);
        
        if (payload.players) {
            gameState.players = payload.players;
        }
        
        const joinedPlayer = payload.player || payload.newPlayer;
        if (joinedPlayer) {
            showLobbyMessage(`${joinedPlayer.name} se unió a la sala`, "success");
        }
        
        updatePlayerUI();
        
        // Si hay 2 jugadores, mostrar mensaje de sala completa
        if (payload.players && Object.keys(payload.players).length === 2) {
            setTimeout(() => {
                showLobbyMessage("¡Sala completa! El juego comenzará automáticamente...", "success");
            }, 1000);
        }
    }

    function handlePlayerLeft(payload) {
        console.log('👤 Jugador se fue:', payload);
        
        if (payload.players) {
            gameState.players = payload.players;
        }
        
        const leftPlayer = payload.player || payload.leftPlayer;
        if (leftPlayer) {
            showLobbyMessage(`${leftPlayer.name} abandonó la sala`, "warning");
        }
        
        updatePlayerUI();
        
        if (gameState.gameActive) {
            gameState.gameActive = false;
            showError("El otro jugador abandonó el juego.");
            setTimeout(() => {
                showLobby();
            }, 3000);
        }
    }

    function handleGameStarted(payload) {
        console.log('🎮 Juego iniciado:', payload);
        
        gameState.gameActive = true;
        gameState.currentRound = 1;
        gameState.players = payload.players || gameState.players;
        
        // Reproducir sonido de inicio
        if (window.soundManager) {
            window.soundManager.playSound('gameStart');
        }
        
        showGameScreen();
        updatePlayerUI();
        updateGameStatusDisplay();
        resetGameUI();
        
        showFeedback("¡El juego ha comenzado! Buena suerte 🍀", "success");
        
        // Esperar un poco antes de la primera pregunta
        setTimeout(() => {
            updateGamePhaseUI('waiting');
        }, 2000);
    }

    function handleNewQuestion(payload) {
        console.log('❓ Nueva pregunta:', payload);
        
        gameState.currentQuestion = payload.question;
        gameState.currentAnswers = payload.question.answers || [];
        gameState.revealedAnswers = [];
        gameState.currentTurn = payload.currentTurn;
        gameState.strikes = 0;
        gameState.roundPoints = 0;
        gameState.stealAttempt = false;
        gameState.stealingPlayer = null;
        
        // Actualizar la UI con la nueva pregunta
        if (questionTextEl) {
            questionTextEl.textContent = payload.question.question;
        }
        
        updateGameStatusDisplay();
        updateAnswersBoard();
        updateGamePhaseUI('guessing');
        
        showFeedback(`Nueva pregunta de ${payload.question.category}: ${payload.question.question}`, "info");
    }

    function handleGuessResult(payload) {
        console.log('📝 Resultado de respuesta:', payload);
        
        // Rehabilitar controles
        if (guessInputEl) {
            guessInputEl.disabled = false;
            guessInputEl.value = '';
        }
        if (submitGuessButtonEl) {
            submitGuessButtonEl.disabled = false;
        }
        
        hideWaitingMessage();
        
        if (payload.correct) {
            // Respuesta correcta
            showFeedback(`¡Correcto! "${payload.guess}" está en el tablero (+${payload.points} puntos)`, "correct");
            
            // Actualizar respuesta revelada
            if (payload.revealedAnswer) {
                gameState.revealedAnswers.push(payload.revealedAnswer);
                updateAnswersBoard();
            }
            
            // Actualizar puntuación
            if (payload.players) {
                gameState.players = payload.players;
                updatePlayerUI();
            }
            
            gameState.roundPoints += payload.points || 0;
            
        } else {
            // Respuesta incorrecta
            gameState.strikes = payload.strikes || (gameState.strikes + 1);
            showFeedback(`"${payload.guess}" no está en el tablero. Strike ${gameState.strikes}/3`, "incorrect");
            updateStrikesDisplay();
            
            // Si llegamos a 3 strikes, cambiar a modo robo
            if (gameState.strikes >= 3) {
                gameState.stealAttempt = true;
                gameState.stealingPlayer = payload.stealingPlayer;
                updateGamePhaseUI('steal');
                return;
            }
        }
        
        // Actualizar turno si cambió
        if (payload.currentTurn) {
            gameState.currentTurn = payload.currentTurn;
        }
        
        updateGamePhaseUI('guessing');
    }

    function handleStealResult(payload) {
        console.log('🏴‍☠️ Resultado de robo:', payload);
        
        // Rehabilitar controles
        if (stealInputEl) {
            stealInputEl.disabled = false;
            stealInputEl.value = '';
        }
        if (submitStealButtonEl) {
            submitStealButtonEl.disabled = false;
        }
        
        hideWaitingMessage();
        
        if (payload.success) {
            showFeedback(`¡Robo exitoso! "${payload.guess}" roba todos los puntos (+${payload.stolenPoints})`, "steal-success");
            
            // Actualizar respuesta revelada
            if (payload.revealedAnswer) {
                gameState.revealedAnswers.push(payload.revealedAnswer);
                updateAnswersBoard();
            }
            
        } else {
            showFeedback(`"${payload.guess}" no está en el tablero. Robo fallido.`, "incorrect");
        }
        
        // Actualizar puntuación
        if (payload.players) {
            gameState.players = payload.players;
            updatePlayerUI();
        }
        
        // El robo termina la ronda, esperar resultado
        updateGamePhaseUI('waiting');
    }

    function handleTurnChange(payload) {
        console.log('🔄 Cambio de turno:', payload);
        
        gameState.currentTurn = payload.currentTurn;
        gameState.strikes = 0;
        resetStrikes();
        
        updateGamePhaseUI('guessing');
        
        const currentPlayerName = gameState.players.player1?.id === payload.currentTurn 
            ? gameState.players.player1.name 
            : gameState.players.player2?.name;
        
        showFeedback(`Turno de ${currentPlayerName}`, "info");
    }

    function handleAnswerRevealed(payload) {
        console.log('💡 Respuesta revelada:', payload);
        
        if (payload.revealedAnswer) {
            gameState.revealedAnswers.push(payload.revealedAnswer);
            updateAnswersBoard();
            
            if (window.soundManager) {
                window.soundManager.playSound('reveal');
            }
        }
    }

    function handleRoundEnd(payload) {
        console.log('🏁 Fin de ronda:', payload);
        
        gameState.roundWinner = payload.winner;
        gameState.currentRound = payload.nextRound || (gameState.currentRound + 1);
        
        // Actualizar puntuación final
        if (payload.players) {
            gameState.players = payload.players;
            updatePlayerUI();
        }
        
        // Revelar respuestas restantes si las hay
        if (payload.remainingAnswers) {
            payload.remainingAnswers.forEach(answer => {
                gameState.revealedAnswers.push(answer);
            });
            updateAnswersBoard();
        }
        
        // Mostrar resultado de la ronda
        const winnerName = payload.winner 
            ? (gameState.players.player1?.id === payload.winner 
                ? gameState.players.player1.name 
                : gameState.players.player2?.name)
            : 'Nadie';
        
        showFeedback(`¡Ronda ${gameState.currentRound - 1} terminada! Ganador: ${winnerName}`, "success");
        
        if (window.soundManager) {
            window.soundManager.playSound('roundComplete');
        }
        
        updateGameStatusDisplay();
        updateGamePhaseUI('waiting');
        
        // Esperar antes de la siguiente ronda
        setTimeout(() => {
            if (gameState.currentRound <= gameState.maxRounds) {
                showFeedback(`Preparando Ronda ${gameState.currentRound}...`, "info");
            }
        }, 3000);
    }

    function handleGameEnd(payload) {
        console.log('🎉 Fin del juego:', payload);
        
        gameState.gameActive = false;
        
        // Actualizar puntuación final
        if (payload.players) {
            gameState.players = payload.players;
            updatePlayerUI();
        }
        
        const winner = payload.winner;
        const winnerName = winner 
            ? (gameState.players.player1?.id === winner 
                ? gameState.players.player1.name 
                : gameState.players.player2?.name)
            : 'Empate';
        
        const isWinner = winner === gameState.myPlayerId;
        const isDraw = !winner;
        
        // Reproducir sonido según resultado
        if (window.soundManager) {
            if (isWinner) {
                window.soundManager.playSound('victory');
            } else if (!isDraw) {
                window.soundManager.playSound('defeat');
            }
        }
        
        // Mostrar modal de resultado
        setTimeout(() => {
            showEndGameModal(isWinner, isDraw, winnerName, payload);
        }, 2000);
        
        // Guardar resultado en Firebase si está disponible
        if (typeof save100FutbolerosResult === 'function') {
            const gameResult = {
                isWinner,
                isDraw,
                finalScore: gameState.players,
                completedRounds: gameState.currentRound - 1,
                timestamp: Date.now()
            };
            
            save100FutbolerosResult(gameResult).catch(error => {
                console.warn('Error guardando resultado:', error);
            });
        }
    }

    // --- Error Handlers ---
    function handleServerError(payload) {
        console.error('❌ Error del servidor:', payload);
        
        const errorMessage = payload.message || payload.error || 'Error desconocido del servidor';
        
        if (gameState.gameActive) {
            showError(errorMessage);
        } else {
            showLobbyMessage(errorMessage, "error");
            enableLobbyButtons();
        }
        
        hideWaitingMessage();
        
        // Rehabilitar controles si están deshabilitados
        if (guessInputEl) guessInputEl.disabled = false;
        if (submitGuessButtonEl) submitGuessButtonEl.disabled = false;
        if (stealInputEl) stealInputEl.disabled = false;
        if (submitStealButtonEl) submitStealButtonEl.disabled = false;
    }

    function handleRequirePassword(payload) {
        console.log('🔐 Sala requiere contraseña:', payload);
        currentJoiningRoomId = payload.roomId;
        showPasswordModal(payload.roomId);
        enableLobbyButtons();
    }

    // --- Modal Functions ---
    function showPasswordModal(roomId) {
        if (!privateRoomPasswordModalEl) return;
        
        if (passwordModalTitleEl) {
            passwordModalTitleEl.textContent = `Sala ${roomId} - Contraseña Requerida`;
        }
        
        if (passwordModalTextEl) {
            passwordModalTextEl.textContent = 'Esta sala es privada. Ingresa la contraseña para unirte:';
        }
        
        if (passwordModalInputEl) {
            passwordModalInputEl.value = '';
            passwordModalInputEl.focus();
        }
        
        if (passwordErrorTextEl) {
            passwordErrorTextEl.style.display = 'none';
        }
        
        privateRoomPasswordModalEl.style.display = 'flex';
        privateRoomPasswordModalEl.classList.add('active');
    }

    function hidePasswordModal() {
        if (!privateRoomPasswordModalEl) return;
        
        privateRoomPasswordModalEl.classList.remove('active');
        setTimeout(() => {
            privateRoomPasswordModalEl.style.display = 'none';
        }, 300);
        
        currentJoiningRoomId = null;
    }

    function showEndGameModal(isWinner, isDraw, winnerName, gameData) {
        if (!endGameModalEl) return;
        
        // Actualizar título
        if (resultTitleEl) {
            if (isDraw) {
                resultTitleEl.textContent = '¡Empate!';
                resultTitleEl.className = 'result-title draw';
            } else if (isWinner) {
                resultTitleEl.textContent = '¡Victoria!';
                resultTitleEl.className = 'result-title victory';
            } else {
                resultTitleEl.textContent = 'Derrota';
                resultTitleEl.className = 'result-title defeat';
            }
        }
        
        // Actualizar mensaje
        if (resultMessageEl) {
            if (isDraw) {
                resultMessageEl.textContent = '¡Excelente partida! Terminaron empatados.';
            } else if (isWinner) {
                resultMessageEl.textContent = '¡Felicitaciones! Has ganado la partida.';
            } else {
                resultMessageEl.textContent = `${winnerName} ha ganado esta vez. ¡Mejor suerte la próxima!`;
            }
        }
        
        // Actualizar estadísticas
        if (resultStatsEl) {
            const p1 = gameState.players.player1;
            const p2 = gameState.players.player2;
            const rounds = gameState.currentRound - 1;
            
            resultStatsEl.innerHTML = `
                <div class="stat-row">
                    <span class="stat-label">Rondas jugadas:</span>
                    <span class="stat-value">${rounds}/${gameState.maxRounds}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">${p1?.name || 'Jugador 1'}:</span>
                    <span class="stat-value">${p1?.score || 0} puntos</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">${p2?.name || 'Jugador 2'}:</span>
                    <span class="stat-value">${p2?.score || 0} puntos</span>
                </div>
                <div class="stat-row highlight">
                    <span class="stat-label">Ganador:</span>
                    <span class="stat-value">${winnerName}</span>
                </div>
            `;
        }
        
        endGameModalEl.style.display = 'flex';
        endGameModalEl.classList.add('active');
    }

    function hideEndGameModal() {
        if (!endGameModalEl) return;
        
        endGameModalEl.classList.remove('active');
        setTimeout(() => {
            endGameModalEl.style.display = 'none';
        }, 300);
    }

    function showEndGameModalWithError(errorTitle) {
        if (!endGameModalEl || !resultTitleEl || !resultMessageEl) return;
        
        resultTitleEl.textContent = errorTitle;
        resultTitleEl.className = 'result-title error';
        resultMessageEl.textContent = 'El juego terminó inesperadamente debido a un error de conexión.';
        
        if (resultStatsEl) {
            resultStatsEl.innerHTML = '<p>No se pudieron obtener las estadísticas finales.</p>';
        }
        
        endGameModalEl.style.display = 'flex';
        endGameModalEl.classList.add('active');
    }

    // --- Available Rooms Management ---
    function updateAvailableRoomsList(payload) {
        console.log('🏠 Actualizando lista de salas:', payload);
        
        if (!availableRoomsListEl) return;
        
        // Limpiar lista actual
        availableRoomsListEl.innerHTML = '';
        
        if (!payload.rooms || payload.rooms.length === 0) {
            const noRoomsItem = document.createElement('li');
            noRoomsItem.className = 'no-rooms-message';
            noRoomsItem.innerHTML = '<span>No hay salas disponibles</span>';
            availableRoomsListEl.appendChild(noRoomsItem);
            return;
        }
        
        // Agregar cada sala
        payload.rooms.forEach(room => {
            const roomItem = document.createElement('li');
            roomItem.className = 'room-item';
            
            const playersCount = room.playerCount || 0;
            const maxPlayers = 2;
            const isPrivate = room.isPrivate || false;
            const isFull = playersCount >= maxPlayers;
            
            roomItem.innerHTML = `
                <div class="room-info">
                    <div class="room-header">
                        <span class="room-id">${room.id}</span>
                        ${isPrivate ? '<i class="fas fa-lock" title="Sala privada"></i>' : ''}
                        ${isFull ? '<span class="room-status full">Llena</span>' : '<span class="room-status available">Disponible</span>'}
                    </div>
                    <div class="room-details">
                        <span class="room-players">
                            <i class="fas fa-users"></i> ${playersCount}/${maxPlayers}
                        </span>
                        <span class="room-game">100 Futboleros Dicen</span>
                    </div>
                </div>
                <button class="join-room-btn ${isFull ? 'disabled' : ''}" 
                        data-room-id="${room.id}" 
                        data-is-private="${isPrivate}"
                        ${isFull ? 'disabled' : ''}>
                    ${isFull ? 'Llena' : 'Unirse'}
                </button>
            `;
            
            // Agregar event listener al botón de unirse
            const joinButton = roomItem.querySelector('.join-room-btn');
            if (joinButton && !isFull) {
                joinButton.addEventListener('click', () => {
                    handleJoinSpecificRoom(room.id, isPrivate);
                });
            }
            
            availableRoomsListEl.appendChild(roomItem);
        });
        
        // Enviar respuesta a games.html si hay una solicitud pendiente
        if (window.roomsRequestSource && window.roomsRequestOrigin) {
            window.roomsRequestSource.postMessage({
                type: 'availableRooms',
                gameType: '100-futboleros-dicen',
                rooms: payload.rooms
            }, window.roomsRequestOrigin);
            
            // Limpiar la solicitud pendiente
            window.roomsRequestSource = null;
            window.roomsRequestOrigin = null;
        }
    }

    function handleJoinSpecificRoom(roomId, isPrivate) {
        const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';
        localStorage.setItem('playerName', playerName);
        
        if (isPrivate) {
            // Mostrar modal de contraseña
            currentJoiningRoomId = roomId;
            showPasswordModal(roomId);
        } else {
            // Unirse directamente
            showLobbyMessage(`Uniéndote a la sala ${roomId}...`, "info");
            disableLobbyButtons(false, true);
            sendToServer('joinRoom', { 
                playerName, 
                roomId, 
                password: '', 
                gameType: '100-futboleros-dicen' 
            });
        }
    }

    // --- Setup Event Listeners ---
    function setupEventListeners() {
        setupLobbyEventListeners();
        setupGameEventListeners();
        setupModalEventListeners();
        setupUIEventListeners();
    }

    function setupModalEventListeners() {
        // Password modal
        if (privateRoomPasswordFormEl) {
            privateRoomPasswordFormEl.addEventListener('submit', (e) => {
                e.preventDefault();
                handlePasswordSubmit();
            });
        }
        
        if (cancelPasswordSubmitEl) {
            cancelPasswordSubmitEl.addEventListener('click', hidePasswordModal);
        }
        
        // End game modal
        if (playAgainButtonFutbolerosEl) {
            playAgainButtonFutbolerosEl.addEventListener('click', () => {
                hideEndGameModal();
                showLobby();
            });
        }
        
        if (backToLobbyButtonFutbolerosEl) {
            backToLobbyButtonFutbolerosEl.addEventListener('click', () => {
                hideEndGameModal();
                showLobby();
            });
        }
        
        if (backToGamesButtonFutbolerosEl) {
            backToGamesButtonFutbolerosEl.addEventListener('click', () => {
                window.location.href = 'games.html';
            });
        }
        
        // Close modals on background click
        if (privateRoomPasswordModalEl) {
            privateRoomPasswordModalEl.addEventListener('click', (e) => {
                if (e.target === privateRoomPasswordModalEl) {
                    hidePasswordModal();
                }
            });
        }
        
        if (endGameModalEl) {
            endGameModalEl.addEventListener('click', (e) => {
                if (e.target === endGameModalEl) {
                    // Don't close end game modal on background click
                }
            });
        }
    }

    function setupUIEventListeners() {
        // Prevent form submission on Enter in inputs
        [createPlayerNameInput, createRoomPasswordInput, joinPlayerNameInput, 
         joinRoomIdInput, joinRoomPasswordInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                    }
                });
            }
        });
    }

    function handlePasswordSubmit() {
        if (!currentJoiningRoomId || !passwordModalInputEl) return;
        
        const password = passwordModalInputEl.value.trim();
        const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';
        
        localStorage.setItem('playerName', playerName);
        
        // Ocultar error anterior
        if (passwordErrorTextEl) {
            passwordErrorTextEl.style.display = 'none';
        }
        
        // Deshabilitar botón mientras se procesa
        if (submitPasswordButtonEl) {
            submitPasswordButtonEl.disabled = true;
            submitPasswordButtonEl.textContent = 'Verificando...';
        }
        
        showLobbyMessage(`Verificando contraseña para sala ${currentJoiningRoomId}...`, "info");
        
        sendToServer('joinRoom', {
            playerName,
            roomId: currentJoiningRoomId,
            password,
            gameType: '100-futboleros-dicen'
        });
        
        // Re-habilitar botón después de un tiempo
        setTimeout(() => {
            if (submitPasswordButtonEl) {
                submitPasswordButtonEl.disabled = false;
                submitPasswordButtonEl.textContent = 'Unirse';
            }
        }, 3000);
    }

    // --- Notification System ---
    function initializeNotificationSystem() {
        // Configurar sistema de notificaciones si es necesario
        console.log('🔔 Sistema de notificaciones inicializado');
    }

    // --- Room Polling ---
    function setupAutomaticRoomPolling() {
        let pollingInterval;
        
        function startPolling() {
            // Solicitar salas inmediatamente
            requestAvailableRooms();
            
            // Luego cada 10 segundos
            pollingInterval = setInterval(() => {
                if (gameState.gamePhase === 'lobby' && 
                    gameState.websocket && 
                    gameState.websocket.readyState === WebSocket.OPEN) {
                    requestAvailableRooms();
                }
            }, 10000);
        }
        
        function stopPolling() {
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
        }
        
        // Iniciar polling cuando se muestre el lobby
        function checkLobbyVisibility() {
            if (gameState.gamePhase === 'lobby') {
                startPolling();
            } else {
                stopPolling();
            }
        }
        
        // Observer para cambios de fase del juego
        let lastPhase = gameState.gamePhase;
        setInterval(() => {
            if (gameState.gamePhase !== lastPhase) {
                lastPhase = gameState.gamePhase;
                checkLobbyVisibility();
            }
        }, 1000);
        
        // Iniciar polling inmediatamente si estamos en lobby
        checkLobbyVisibility();
    }

    function requestAvailableRooms() {
        if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN) {
            sendToServer('getRooms', { gameType: '100-futboleros-dicen' });
        }
    }

    // --- Start App ---
    initializeApp();
}); 