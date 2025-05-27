// --- Importaciones ---
import { saveQuienSabeMasResult } from './firebase-utils.js';

// --- WebSocket URL (¡Configura esto!) ---
const WEBSOCKET_URL = (() => {
    // Siempre usar el servidor de producción para evitar problemas de configuración local
    return 'wss://cracktotal-servidor.onrender.com';
})();

// Comunicación con la página principal para salas disponibles
window.addEventListener('message', function(event) {
    console.log('🔍 [QSM] Mensaje recibido:', event.data);
    
    // Verificar origen del mensaje
    if (event.origin !== window.location.origin) return;
    
    // Si se solicitan las salas disponibles
    if (event.data && event.data.type === 'requestRooms' && event.data.gameType === 'quiensabemas') {
        console.log('✅ [QSM] Solicitud de salas QSM recibida desde games.html');
        
        if (document.readyState === 'complete') {
            // Si la página ya está cargada, solicitar salas
            if (window.gameState && window.gameState.websocket && 
                window.gameState.websocket.readyState === WebSocket.OPEN) {
                console.log('📡 [QSM] Solicitando salas de Quien Sabe Más al servidor');
                window.sendToServer('getRooms', { gameType: 'quiensabemas' });
                
                // Almacenar el origen para responder cuando recibamos la lista
                window.roomsRequestSource = event.source;
                window.roomsRequestOrigin = event.origin;
            } else {
                console.warn('⚠️ [QSM] WebSocket no conectado, enviando lista vacía');
                // Si no hay conexión, enviar lista vacía
                event.source.postMessage({
                    type: 'availableRooms',
                    gameType: 'quiensabemas',
                    rooms: []
                }, event.origin);
            }
        } else {
            console.log('⏳ [QSM] Página no cargada, esperando...');
            // Si la página aún no está cargada, esperar
            window.addEventListener('load', function() {
                setTimeout(function() {
                    if (window.gameState && window.gameState.websocket && 
                        window.gameState.websocket.readyState === WebSocket.OPEN) {
                        console.log('📡 [QSM] Solicitando salas de Quien Sabe Más al servidor (después de carga)');
                        window.sendToServer('getRooms', { gameType: 'quiensabemas' });
                        
                        // Almacenar el origen para responder cuando recibamos la lista
                        window.roomsRequestSource = event.source;
                        window.roomsRequestOrigin = event.origin;
                    } else {
                        console.warn('⚠️ [QSM] WebSocket no conectado después de esperar, enviando lista vacía');
                        // Si no hay conexión después de esperar, enviar lista vacía
                        event.source.postMessage({
                            type: 'availableRooms',
                            gameType: 'quiensabemas',
                            rooms: []
                        }, event.origin);
                    }
                }, 1000); // Esperar 1 segundo para asegurar que la conexión esté establecida
            });
        }
    } else if (event.data && event.data.type === 'requestRooms') {
        console.log(`❌ [QSM] Solicitud de salas para ${event.data.gameType} (no es QSM), ignorando`);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // --- Game State Variables ---
    let gameState = {
        players: {
            player1: { id: null, name: 'Jugador 1', score: 0 },
            player2: { id: null, name: 'Jugador 2', score: 0 }
        },
        roomId: null,
        myPlayerId: null,
        currentLevel: 1,
        maxLevel: 6, // Assuming 6 levels based on previous structure
        questions: {}, // Questions will be managed by the server now
        currentQuestionData: null,
        currentTurn: null,
        optionsRequested: false, // Track if options are visible for levels 2+
        fiftyFiftyUsed: false, // Track if 50/50 power-up is used
        gameActive: false,
        websocket: null,
        pendingRoomsRequest: null
    };

    // --- DOM Elements ---
    // Player Info
    const player1InfoEl = document.getElementById('player1Info');
    const player1NameEl = document.getElementById('player1Name');
    const player1ScoreEl = document.getElementById('player1Score');
    const player2InfoEl = document.getElementById('player2Info');
    const player2NameEl = document.getElementById('player2Name');
    const player2ScoreEl = document.getElementById('player2Score');

    // Game Status
    const gameLevelDisplayEl = document.getElementById('gameLevelDisplay');
    const questionCounterEl = document.getElementById('questionCounter'); // Might be updated by server messages
    // const turnIndicatorEl = document.getElementById('turnIndicator'); // No longer used as it's in header

    // Question & Answer Areas
    const questionTextEl = document.getElementById('questionText');
    // const level1InputAreaEl = document.getElementById('level1InputArea'); // REMOVED
    // const answerFormLevel1 = document.getElementById('answerFormLevel1'); // REMOVED
    // const answerInputEl = document.getElementById('answerInput'); // REMOVED
    const level2PlusOptionsAreaEl = document.getElementById('level2PlusOptionsArea');
    const optionsContainerEl = document.getElementById('optionsContainer');
    const optionButtons = optionsContainerEl.querySelectorAll('.option'); // NodeList

    // Action Buttons
    // const requestOptionsButtonEl = document.getElementById('requestOptionsButton'); // REMOVED
    const fiftyFiftyButtonEl = document.getElementById('fiftyFiftyButton');

    // Feedback & Waiting Areas
    const feedbackAreaEl = document.getElementById('feedbackArea');
    const waitingAreaEl = document.getElementById('waitingArea'); // To show waiting messages

    // End Game Modal
    const endGameModalEl = document.getElementById('gameResultModal');
    const resultTitleEl = document.getElementById('resultTitle');
    const resultMessageEl = document.getElementById('resultMessage');
    const finalPlayer1ScoreEl = document.getElementById('finalPlayer1Score');
    const finalPlayer2ScoreEl = document.getElementById('finalPlayer2Score');
    const resultStatsEl = document.getElementById('resultStats');
    const playAgainButtonQSM = document.getElementById('playAgainButtonQSM');
    const backToLobbyButtonQSM = document.getElementById('backToLobbyButtonQSM');

    // Lobby Elements
    const lobbySectionEl = document.getElementById('lobbySection');
    const lobbyMessageAreaEl = document.getElementById('lobbyMessageArea'); // To show lobby status/errors
    const createPlayerNameInput = document.getElementById('createPlayerName');
    const createRoomPasswordInput = document.getElementById('createRoomPassword'); // Optional password
    const createRoomButton = document.getElementById('createRoomButton');
    const joinPlayerNameInput = document.getElementById('joinPlayerName');
    const joinRoomIdInput = document.getElementById('joinRoomId');
    const joinRoomPasswordInput = document.getElementById('joinRoomPassword'); // Optional password
    const joinRoomButton = document.getElementById('joinRoomButton');
    const joinRandomRoomButton = document.getElementById('joinRandomRoomButton'); // New button
    const gameContentSectionEl = document.getElementById('gameContentSection'); // Game area container
    const availableRoomsListEl = document.getElementById('availableRoomsList'); // Container for the room list UL
    const playersHeaderInfoEl = document.getElementById('playersHeaderInfo'); // Referencia al contenedor de info de jugadores

    // --- Modal Contraseña Sala Privada ---
    const privateRoomPasswordModalEl = document.getElementById('privateRoomPasswordModal');
    const passwordModalTitleEl = document.getElementById('passwordModalTitle');
    const passwordModalTextEl = document.getElementById('passwordModalText');
    const privateRoomPasswordFormEl = document.getElementById('privateRoomPasswordForm');
    const passwordModalInputEl = document.getElementById('passwordModalInput');
    const cancelPasswordSubmitEl = document.getElementById('cancelPasswordSubmit');
    const submitPasswordButtonEl = document.getElementById('submitPasswordButton');
    const passwordErrorTextEl = document.getElementById('passwordErrorText');
    let currentJoiningRoomId = null; // Para guardar el ID de la sala a la que se intenta unir con contraseña

    // --- Initialization ---
    function initializeApp() {
        console.log("🚀 [QSM] Initializing Quien Sabe Más 1v1 App...");
        console.log("🚀 [QSM] Versión con filtrado de salas implementado");
        showLobby(); // Start in the lobby
        setupEventListeners();
        hideEndGameModal();

        // --- Prefill player name from localStorage (MAIN.JS SHOULD HANDLE THIS, BUT AS FALLBACK) ---
        const savedPlayerName = localStorage.getItem('playerName'); // Changed from sessionStorage
        if (savedPlayerName) {
            if (createPlayerNameInput && !createPlayerNameInput.value) createPlayerNameInput.value = savedPlayerName;
            if (joinPlayerNameInput && !joinPlayerNameInput.value) joinPlayerNameInput.value = savedPlayerName;
            console.log(`Prefilled player name from localStorage (QSM): ${savedPlayerName}`);
        }
        // --- End Prefill ---

        initializeWebSocket(); // Connect WebSocket on app load
        
        // Configurar polling automático de salas cada 5 segundos cuando estamos en el lobby
        setupAutomaticRoomPolling();

        // Añadir soporte para comunicación de salas disponibles
        window.addEventListener('message', function(event) {
            // Verificar origen del mensaje por seguridad
            if (event.origin !== window.location.origin) return;
            
            // Si nos piden las salas disponibles
            if (event.data && event.data.type === 'requestRooms' && event.data.gameType === 'quiensabemas') {
                // Verificar si hay conexión WebSocket activa
                if (!gameState.websocket || gameState.websocket.readyState !== WebSocket.OPEN) {
                    // Enviar lista vacía si no hay conexión
                    event.source.postMessage({
                        type: 'availableRooms',
                        gameType: 'quiensabemas',
                        rooms: []
                    }, event.origin);
                    return;
                }
                
                // Solicitar salas al servidor
                sendToServer('getRooms', { gameType: 'quiensabemas' });
                
                // Guardar el origen para responder cuando recibamos la lista del servidor
                gameState.pendingRoomsRequest = {
                    source: event.source,
                    origin: event.origin
                };
            }
        });
    }

    // --- Helper function to normalize text ---
    function normalizeText(text) {
        if (typeof text !== 'string') return '';
        return text.toLowerCase()
                   .normalize("NFD") // Decompose accented characters
                   .replace(/\u0300-\u036f/g, ""); // Remove diacritical marks
    }
    // --- End Helper ---

    function clearAndHideOptions() {
        optionButtons.forEach((btn) => {
            btn.querySelector('.option-text').textContent = '';
            btn.style.display = 'none';
            btn.classList.remove('hidden', 'correct', 'incorrect', 'selected');
        });
        // optionsContainerEl.style.display = 'none'; // Optionally hide the whole container
    }

    function showLobby() {
        lobbySectionEl.style.display = 'block';
        gameContentSectionEl.style.display = 'none';
        lobbySectionEl.classList.add('active');
        gameContentSectionEl.classList.remove('active');
        // Hide player info in header while in lobby
        if (playersHeaderInfoEl) playersHeaderInfoEl.style.display = 'none';
        clearLobbyMessage();
        enableLobbyButtons(); // Ensure buttons are enabled when returning to lobby
        
        // Limpiar completamente la lista de salas al mostrar el lobby
        if (availableRoomsListEl) {
            console.log("🧹 [QSM] Limpiando lista de salas al mostrar lobby");
            availableRoomsListEl.innerHTML = '<li class="no-rooms-message">Cargando salas disponibles...</li>';
        }
    }

    function showGameScreen() {
        lobbySectionEl.style.display = 'none';
        gameContentSectionEl.style.display = 'block';
        lobbySectionEl.classList.remove('active');
        gameContentSectionEl.classList.add('active');
        // Show player info in header
        if (playersHeaderInfoEl) playersHeaderInfoEl.style.display = 'flex'; // Or 'block' depending on your CSS
    }

    function startGame() {
        console.log("Starting game (waiting for server data)...");
        updatePlayerUI(); // Update with initial player data from server
        showGameScreen();
        gameState.gameActive = true;
        // Waiting message will be shown based on whose turn it is (from server)
    }

    // --- Lobby Logic ---
    function setupLobbyEventListeners() {
        if (createRoomButton) createRoomButton.addEventListener('click', handleCreateRoom);
        if (joinRoomButton) joinRoomButton.addEventListener('click', handleJoinRoomById);
        if (joinRandomRoomButton) joinRandomRoomButton.addEventListener('click', handleJoinRandomRoom);
        // Add listener for password inputs to potentially clear errors on input
        [createRoomPasswordInput, joinRoomPasswordInput].forEach(input => {
            if(input) input.addEventListener('input', clearLobbyMessage);
        });
        // [createPlayerNameInput, joinPlayerNameInput, joinRoomIdInput, answerInputEl].forEach(input => { // answerInputEl removed
        [createPlayerNameInput, joinPlayerNameInput, joinRoomIdInput].forEach(input => {
            if(input) input.addEventListener('input', clearLobbyMessage);
        });
    }

    function handleCreateRoom() {
        // Check if button exists and is already disabled (prevent double click)
        if (!createRoomButton || createRoomButton.disabled) return;

        const playerName = createPlayerNameInput.value.trim() || 'Jugador 1';
        const password = createRoomPasswordInput.value; // Don't trim password
        console.log(`Requesting to create room for ${playerName}` + (password ? ' with password.' : '.'));
        showLobbyMessage("Creando sala...", "info");
        disableLobbyButtons(true); // Disable and show spinner on create button
        sendToServer('createRoom', { playerName, password, gameType: 'quiensabemas' });
    }

    function handleJoinRoomById() {
        // Check if button exists and is already disabled
        if (!joinRoomButton || joinRoomButton.disabled) return;

        const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';
        const roomId = joinRoomIdInput.value.trim();
        const password = joinRoomPasswordInput.value; // Don't trim password

        if (!roomId) {
            showLobbyMessage("Por favor, poné un ID de sala.", "error");
            return;
        }
        console.log(`Requesting to join room ${roomId} as ${playerName}` + (password ? ' with password.' : '.'));
        showLobbyMessage(`Uniéndote a la sala ${roomId}...`, "info");
        disableLobbyButtons(false, true); // Disable and show spinner on join by ID button
        sendToServer('joinRoom', { playerName, roomId, password, gameType: 'quiensabemas' });
    }

     function handleJoinRandomRoom() {
         // Check if button exists and is already disabled
         if (!joinRandomRoomButton || joinRandomRoomButton.disabled) return;

         const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2'; // Use the name from the join section
         console.log(`Searching for random room for ${playerName}...`);
         showLobbyMessage("Buscando una sala disponible...", "info");
         disableLobbyButtons(false, false, true); // Disable and show spinner on join random button
         sendToServer('joinRandomRoom', { playerName, gameType: 'quiensabemas' });
     }

    function showLobbyMessage(message, type = "info", persistent = false) { // type can be 'info', 'success', 'error'
        if (!lobbyMessageAreaEl) return;
        lobbyMessageAreaEl.textContent = message;
        lobbyMessageAreaEl.className = 'lobby-message'; // Reset classes
        void lobbyMessageAreaEl.offsetWidth; // Force reflow
        lobbyMessageAreaEl.classList.add(type);
        lobbyMessageAreaEl.classList.add('show');

        // Si no es persistente, ocultar después de un tiempo (ej. 5 segundos)
        if (!persistent && (type === 'success' || type === 'info')) {
            setTimeout(() => {
                // Solo ocultar si sigue siendo el mismo mensaje (evita ocultar un error posterior)
                if (lobbyMessageAreaEl.textContent === message) {
                    clearLobbyMessage();
                }
            }, 5000);
        }
        // Los errores (type === 'error') se quedan visibles hasta la siguiente acción.
    }

    function clearLobbyMessage() {
        lobbyMessageAreaEl.classList.remove('show');
        // Retrasar limpieza de texto y clases para permitir la transición de salida
         setTimeout(() => {
            // Solo limpiar si no se mostró otro mensaje mientras tanto
             if (!lobbyMessageAreaEl.classList.contains('show')) {
        lobbyMessageAreaEl.textContent = '';
        lobbyMessageAreaEl.className = 'lobby-message';
             }
         }, 500); // Debe ser >= duración de transición CSS
    }

    function disableLobbyButtons(spinCreate = false, spinJoinId = false, spinJoinRandom = false) {
        if (createRoomButton) {
        createRoomButton.disabled = true;
            // Add spinner logic if needed, assuming spinner element exists or is added via CSS
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
            createRoomButton.innerHTML = 'Crear Sala'; // Restore original text
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

    // --- Game Logic ---
    function updatePlayerUI() {
        if (!gameState.players || !gameState.myPlayerId) return; // Necesitamos saber quiénes somos

        const player1 = gameState.players.player1;
        const player2 = gameState.players.player2;
        const localPlayer = player1?.id === gameState.myPlayerId ? player1 : (player2?.id === gameState.myPlayerId ? player2 : null);
        const opponentPlayer = player1?.id !== gameState.myPlayerId ? player1 : (player2?.id !== gameState.myPlayerId ? player2 : null);

        // Actualizar Header
        if (playersHeaderInfoEl && localPlayer && opponentPlayer) {
            const localNameEl = playersHeaderInfoEl.querySelector('.local-player .player-name');
            const localScoreEl = playersHeaderInfoEl.querySelector('.local-player .score');
            const opponentNameEl = playersHeaderInfoEl.querySelector('.opponent-player .player-name');
            const opponentScoreEl = playersHeaderInfoEl.querySelector('.opponent-player .score');

            if (localNameEl) localNameEl.textContent = localPlayer.name || 'Tú';
            if (localScoreEl) localScoreEl.textContent = `Score: ${localPlayer.score || 0}`;
            if (opponentNameEl) opponentNameEl.textContent = opponentPlayer.name || 'Oponente';
            if (opponentScoreEl) opponentScoreEl.textContent = `Score: ${opponentPlayer.score || 0}`;

            // Marcar turno activo en el header
            const localPlayerBox = playersHeaderInfoEl.querySelector('.local-player');
            const opponentPlayerBox = playersHeaderInfoEl.querySelector('.opponent-player');
            if (localPlayerBox) localPlayerBox.classList.toggle('active-turn', localPlayer.id === gameState.currentTurn);
            if (opponentPlayerBox) opponentPlayerBox.classList.toggle('active-turn', opponentPlayer.id === gameState.currentTurn);

        } else if (playersHeaderInfoEl) {
            // Estado inicial o si falta info
             const localNameEl = playersHeaderInfoEl.querySelector('.local-player .player-name');
             const localScoreEl = playersHeaderInfoEl.querySelector('.local-player .score');
             const opponentNameEl = playersHeaderInfoEl.querySelector('.opponent-player .player-name');
             const opponentScoreEl = playersHeaderInfoEl.querySelector('.opponent-player .score');
             if (localNameEl) localNameEl.textContent = 'Esperando...';
             if (localScoreEl) localScoreEl.textContent = 'Score: 0';
             if (opponentNameEl) opponentNameEl.textContent = 'Esperando...';
             if (opponentScoreEl) opponentScoreEl.textContent = 'Score: 0';
        }

        // Actualizar Turn Indicator (si existe fuera del header)
        // if (turnIndicatorEl) { // turnIndicatorEl no longer used directly
        //      if (!gameState.currentTurn || !gameState.players) {
        //          turnIndicatorEl.textContent = "Esperando turno...";
        // } else {
        //          const currentPlayer = player1?.id === gameState.currentTurn ? player1 : player2;
        //          turnIndicatorEl.textContent = `Turno de: ${currentPlayer?.name || '...'}`;
        // }
        // }
    }

    // --- Question Display (Triggered by Server) ---
    function displayQuestion(question) {
        // Validar estructura de pregunta recibida
        if (question && typeof question === 'object') {
            const hasOptions = question.hasOwnProperty('options') && Array.isArray(question.options);
            if (!hasOptions) {
                console.warn("Question received without valid options array");
            }
        }

        if (!question) {
            console.error("displayQuestion called without question data.");
            questionTextEl.textContent = "Error loading question.";
            return;
        }
        console.log("Displaying question:", question);
        gameState.currentQuestionData = question; // Store current question data
        questionTextEl.textContent = question.text;
        feedbackAreaEl.innerHTML = ''; // Clear previous feedback

        // Reset options/input state
        gameState.optionsRequested = true; // Options are now always implicitly "requested" or rather, available
        // requestOptionsButtonEl.classList.remove('used'); // Button removed
        fiftyFiftyButtonEl.classList.remove('used');
        gameState.fiftyFiftyUsed = false;

        // --- Input Area Visibility (Simplified: Options always shown) --- 
        level2PlusOptionsAreaEl.classList.add('active'); // Always show L2+ area (which is now the only option area)
        optionsContainerEl.style.display = 'grid'; // Options are now always shown, ensure container is visible
        optionButtons.forEach(btn => {
            btn.style.display = 'flex'; // Use flex as per HTML, ensure buttons are visible templates
            btn.disabled = true;
            btn.classList.remove('selected', 'correct', 'incorrect', 'hidden');
            btn.querySelector('.option-text').textContent = '';
        });
        fiftyFiftyButtonEl.style.display = 'inline-flex'; // Ensure button is visible
        fiftyFiftyButtonEl.disabled = true; // Start disabled
        // --- End Simplified Input Area Visibility ---

        // Populate options directly if available in the question data sent by server
        let optionsToShow = null;
        const directOptions = question ? question.options : null; // Direct access (no space)

        if (directOptions && Array.isArray(directOptions) && directOptions.length > 0) {
            console.log("[CLIENT] Using 'question.options' (no space). It is a valid array.");
            optionsToShow = directOptions;
        } else {
            // Fallback or check for the version with a space, just in case server is inconsistent
            const optionsWithSpace = question && question['options ']; // Note the space
            if (optionsWithSpace && Array.isArray(optionsWithSpace) && optionsWithSpace.length > 0) {
                console.warn("[CLIENT] 'question.options' (no space) was invalid or empty. FALLING BACK to 'options ' (with space).");
                optionsToShow = optionsWithSpace;
            }
        }

        if (optionsToShow) {
            displayOptionsFromArray(optionsToShow);
        } else {
            console.warn("[CLIENT] Neither 'question.options' (no space) nor 'options ' (with space) yielded a valid & non-empty options array. Options will be empty.", question);
            // The detailed logs at the start of the function should provide more insight into the raw question object.
            clearAndHideOptions();
        }
    }

    // --- Turn & Game Flow Updates (Triggered by Server) ---
    function updateLevelAndQuestionCounter(level, qNum = null, qTotal = null) {
        gameState.currentLevel = level;
        gameLevelDisplayEl.textContent = `Level ${gameState.currentLevel}`;
        if (qNum !== null && qTotal !== null) {
            questionCounterEl.textContent = `Question ${qNum}/${qTotal}`;
        } else {
             questionCounterEl.textContent = ''; // Clear if no info provided
        }
    }

    // --- Answer Handling & Submission ---
    function submitAnswer(answerData) {
        if (!gameState.gameActive || gameState.currentTurn !== gameState.myPlayerId) {
            console.warn("Attempted to submit answer when not allowed.");
            return;
        }
        console.log("Submitting answer to server:", answerData);
        sendToServer('submitAnswer', answerData);
        disablePlayerInput(); // Disable input after submitting
        showWaitingMessage("Respuesta enviada. Esperando oponente/resultado..."); // Updated message
    }

    function handleOptionClick(event) {
        // This check might be redundant if buttons are correctly disabled, but good for safety
        // if (!gameState.optionsRequested || gameState.currentTurn !== gameState.myPlayerId || !gameState.gameActive) return; // gameState.optionsRequested is always true now

        if (gameState.currentTurn !== gameState.myPlayerId || !gameState.gameActive) return;


        const selectedButton = event.target.closest('.option');
        if (!selectedButton || selectedButton.disabled || selectedButton.classList.contains('hidden')) return;

        const selectedIndex = parseInt(selectedButton.getAttribute('data-index'));

        // Optional: Visually mark the selected option immediately (can be confirmed/overridden by server)
        // optionButtons.forEach(btn => btn.classList.remove('selected'));
        // selectedButton.classList.add('selected');

        submitAnswer({ selectedIndex: selectedIndex });
    }

    // --- Action Buttons Logic ---
    /* // REMOVED: handleRequestOptions function
    function handleRequestOptions() {
        if (!gameState.gameActive || gameState.currentTurn !== gameState.myPlayerId) return;
        // if (gameState.currentLevel === 1 || gameState.optionsRequested) return; // Logic changed

        console.log("Requesting options from server..."); // This path should not be hit
        // sendToServer('requestOptions', {}); // Action removed
        // requestOptionsButtonEl.disabled = true; // Button removed
        // requestOptionsButtonEl.classList.add('used'); // Button removed
    }
    */

    function handleFiftyFifty() {
        if (!gameState.gameActive || gameState.currentTurn !== gameState.myPlayerId) return;
        // Can only use 50/50 if options are shown (always true now) and it hasn't been used yet for this question
        // if (!gameState.optionsRequested || gameState.fiftyFiftyUsed) return; // gameState.optionsRequested is always true
        if (gameState.fiftyFiftyUsed) return;

        console.log("Requesting 50/50 from server...");
        sendToServer('requestFiftyFifty', {});
        fiftyFiftyButtonEl.disabled = true; // Disable button while waiting for server response
        fiftyFiftyButtonEl.classList.add('used'); // Visually indicate it's used/pending
    }

    // --- UI Updates & Feedback ---
    function showFeedback(message, type) { // type = 'correct' or 'incorrect'
        feedbackAreaEl.innerHTML = `<span class="feedback-message ${type}">${message}</span>`;
        // Optionally, clear feedback after a delay
        // setTimeout(() => { feedbackAreaEl.innerHTML = ''; }, 3000);
    }

     function visualizeAnswerOptions(selectedIndex, correctIndex, isLocalPlayerCorrect) {
        // Show correctness on options only for levels 2+
         if (gameState.currentQuestionData && gameState.currentQuestionData.level > 1 && gameState.optionsRequested) {
             optionButtons.forEach((btn, index) => {
                // Remove previous selection states first
                 btn.classList.remove('selected');

                 if (index === correctIndex) {
                     btn.classList.add('correct');
                 }
                 // If the selecting player selected an option and it was incorrect, mark it incorrect
                 // We need to know WHO selected the index to apply 'incorrect' correctly for both players viewing
                 // This function might need adjustment based on whether 'forPlayerId' is available here
                 // Assuming this function is called for the player who just answered:
                 if (index === selectedIndex && !isLocalPlayerCorrect) {
                     btn.classList.add('incorrect');
                 }
                 // Ensure all buttons are disabled after revealing the answer
                 btn.disabled = true;
             });
         }
     }


     function displayOptionsFromObject(optionsObject) {
        console.log("Displaying options from object:", optionsObject);
         optionsContainerEl.style.display = 'grid'; // Show the grid
        const optionKeys = ['A', 'B', 'C', 'D']; // Expected keys

         optionButtons.forEach((btn, index) => {
            const key = optionKeys[index];
            if (optionsObject[key]) {
                btn.querySelector('.option-text').textContent = optionsObject[key];
                btn.style.display = 'flex'; // Show the button (use flex)
                btn.disabled = true; // Keep disabled until enabled by enablePlayerInput
                btn.classList.remove('hidden', 'correct', 'incorrect', 'selected'); // Reset classes
            } else {
                btn.style.display = 'none'; // Hide if no option for this key
            }
         });
         gameState.optionsRequested = true; // Mark options as requested/shown (always true now)

         // Re-evaluate if 50/50 button should be enabled now
         if (gameState.currentTurn === gameState.myPlayerId && gameState.gameActive) {
             fiftyFiftyButtonEl.disabled = gameState.fiftyFiftyUsed;
         }
     }

     function removeFiftyFiftyOptions(indicesToRemove) {
         console.log("Applying 50/50, removing options at indices:", indicesToRemove);
         indicesToRemove.forEach(index => {
             if (optionButtons[index]) {
                 optionButtons[index].style.display = 'none'; // Hide the button
                 optionButtons[index].classList.add('hidden'); // CORRECT: Apply to individual button
                 optionButtons[index].disabled = true; // Ensure it's disabled
             }
         });
         gameState.fiftyFiftyUsed = true; // Mark 50/50 as used for this question turn
         fiftyFiftyButtonEl.disabled = true; // Disable 50/50 button permanently for this question
         fiftyFiftyButtonEl.classList.add('used'); // Visually mark as used
     }

    function showError(message) {
        // Use feedback area for game-related errors shown to user
        feedbackAreaEl.innerHTML = `<span class="feedback-message error">Error: ${message}</span>`;
        console.error("Game Error:", message);
    }

    function showWaitingMessage(message = "Waiting for opponent...") {
        waitingAreaEl.querySelector('p').textContent = message;
        waitingAreaEl.classList.add('active');
    }

    function hideWaitingMessage() {
        waitingAreaEl.classList.remove('active');
    }

    function disablePlayerInput() {
        // Level 1 (Now all levels are options only)
        // answerInputEl.disabled = true; // REMOVED
        // const submitBtnLvl1 = answerFormLevel1.querySelector('button[type="submit"]'); // REMOVED
        // if(submitBtnLvl1) submitBtnLvl1.disabled = true; // REMOVED

        // Level 2+ (Now all levels)
        optionButtons.forEach(btn => btn.disabled = true);
        // requestOptionsButtonEl.disabled = true; // REMOVED
        fiftyFiftyButtonEl.disabled = true;
    }

    function enablePlayerInput() {
        // Only enable if it's currently this player's turn AND the game is active
        if (gameState.currentTurn !== gameState.myPlayerId || !gameState.gameActive) {
             disablePlayerInput();
             return;
        }

        hideWaitingMessage();

        // Enable based on current level and state (Hybrid Logic)
        if (gameState.currentQuestionData) {
            // const isLevel1 = gameState.currentQuestionData.level === 1; // Not needed
            const optionsAreVisible = gameState.optionsRequested; // Always true now

            // Enable/Disable Text Input - All removed
            // answerInputEl.disabled = !isLevel1 && optionsAreVisible; 
            // const submitBtnLvl1 = answerFormLevel1.querySelector('button[type="submit"]');
            // if(submitBtnLvl1) submitBtnLvl1.disabled = answerInputEl.disabled;
            // if (!answerInputEl.disabled) {
            //     answerInputEl.focus(); 
            // }

            // Enable/Disable L2+ Buttons (Now all levels) - Simplified
            fiftyFiftyButtonEl.disabled = !optionsAreVisible || gameState.fiftyFiftyUsed; 
            fiftyFiftyButtonEl.classList.toggle('used', gameState.fiftyFiftyUsed);

            optionButtons.forEach(btn => {
                // Enable option button if options are visible AND it's not hidden by 50/50
                btn.disabled = !optionsAreVisible || btn.classList.contains('hidden');
            });
        } else {
             console.warn("enablePlayerInput called but no currentQuestionData available.");
             disablePlayerInput();
        }
    }


    // --- WebSocket Communication ---
    function initializeWebSocket() {
        // URL definida arriba
        const wsUrl = WEBSOCKET_URL;

        console.log(`Attempting to connect WebSocket: ${wsUrl}`);

        // Close existing connection if any (to prevent duplicates on potential re-init)
        if (gameState.websocket && gameState.websocket.readyState !== WebSocket.CLOSED && gameState.websocket.readyState !== WebSocket.CLOSING) {
            console.log("Closing previous WebSocket connection.");
            gameState.websocket.onclose = null; // Prevent old onclose handler from firing unexpectedly
            gameState.websocket.close();
        }

        try {
            gameState.websocket = new WebSocket(wsUrl);
        } catch (error) {
             console.error("Failed to create WebSocket:", error);
             showLobbyMessage("Failed to initialize connection. Please check console and refresh.", "error");
             disableLobbyButtons();
             return; // Stop initialization
        }


        gameState.websocket.onopen = () => {
            console.log('WebSocket Connected!');
            showLobbyMessage("Connected to server. Choose an option.", "success");
            enableLobbyButtons();
        };

        gameState.websocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('Message received from server:', message);
                handleServerMessage(message);
            } catch (error) {
                console.error('Error parsing message from server:', error, event.data);
            }
        };

        gameState.websocket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            // Display different messages based on context
            if (gameState.gameActive) {
                showError("Connection error. Please return to lobby.");
            } else {
                showLobbyMessage("Server connection error. Please refresh or try again later.", "error");
            }
             disableLobbyButtons(); // Disable lobby actions on error
             // Consider disabling game input if game was active
             if(gameState.gameActive) disablePlayerInput();
        };

        gameState.websocket.onclose = (event) => {
            console.log('WebSocket Disconnected:', event.reason, `Code: ${event.code}`, `WasClean: ${event.wasClean}`);
            const wasConnected = !!gameState.websocket; // Check if we thought we were connected
            gameState.websocket = null; // Clear the reference

            // Provide feedback based on whether the game was active and if the close was clean
            if (gameState.gameActive) {
                 showError("Lost connection to the server. Game ended.");
                 gameState.gameActive = false; // Mark game as inactive
                 disablePlayerInput();
                 showEndGameModalWithError("Connection Lost"); // Show a modal indicating connection issue
            } else if (wasConnected) { // Only show lobby error if we were actually connected before closing
                // If connection closes while in lobby (or before game starts)
                showLobbyMessage("Disconnected from server. Please refresh to reconnect.", "error");
                 disableLobbyButtons();
            }
             // If it wasn't clean and not during a game, it might be a connection failure initially.
             else if (!event.wasClean && !gameState.gameActive) {
                 showLobbyMessage("Could not connect to the server. Please ensure it's running and refresh.", "error");
                 disableLobbyButtons();
             }
        };
    }


    function sendToServer(type, payload) {
        if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type, payload });
            console.log('Sending message to server:', message);
            gameState.websocket.send(message);
        } else {
            console.error('WebSocket not connected. Cannot send:', type, payload);
            // Show error relevant to context
            if (gameState.gameActive) {
                 showError("Not connected to server. Cannot send message.");
                 // Consider if this error should end the game or prompt reconnect
            } else {
                 showLobbyMessage("Not connected. Please refresh.", "error");
            }
        }
    }

    // --- Message Handling ---
    function handleServerMessage(message) {
        console.log("🔔 [QSM] handleServerMessage ejecutándose, tipo:", message.type);
        
        // Always hide the main waiting overlay when a message arrives,
        // specific messages might show it again if needed.
        // Exception: Don't hide if the message itself indicates waiting state (e.g., playerDisconnect)
        if (message.type !== 'playerDisconnect' && message.type !== 'updateState' /* add other exceptions if needed */) {
            hideWaitingMessage();
        }


        switch (message.type) {
            case 'yourInfo': // Server assigns our ID
                gameState.myPlayerId = message.payload.playerId;
                console.log(`Assigned Player ID: ${gameState.myPlayerId}`);
                // --- Save player name to localStorage when assigned --- 
                // Tomar el nombre que el jugador usó en el lobby
                let currentLobbyPlayerName = '';
                if (gameState.myPlayerId === gameState.players?.player1?.id) { // Si somos player1 (usualmente el creador)
                    currentLobbyPlayerName = createPlayerNameInput?.value.trim();
                } else if (gameState.myPlayerId === gameState.players?.player2?.id) { // Si somos player2 (usualmente el que se une)
                    currentLobbyPlayerName = joinPlayerNameInput?.value.trim();
                }

                if (currentLobbyPlayerName && currentLobbyPlayerName !== 'Jugador 1' && currentLobbyPlayerName !== 'Jugador 2') {
                    localStorage.setItem('playerName', currentLobbyPlayerName);
                    console.log(`Saved/Updated player name to localStorage (QSM): ${currentLobbyPlayerName}`);
                } else {
                    // Si no se pudo obtener de los inputs, intentar con el que ya está en localStorage
                    const existingName = localStorage.getItem('playerName');
                    if (existingName) {
                         // Si el servidor nos dio un nombre (en gameState.players) y es diferente, lo actualizamos
                        const serverNameForMe = gameState.players?.player1?.id === gameState.myPlayerId ? gameState.players.player1.name : gameState.players?.player2?.name;
                        if(serverNameForMe && serverNameForMe !== existingName && serverNameForMe !== 'Jugador 1' && serverNameForMe !== 'Jugador 2'){
                            localStorage.setItem('playerName', serverNameForMe);
                            console.log(`Updated player name in localStorage from server info (QSM): ${serverNameForMe}`);
                        }
                    } // No hacemos nada si no hay nombre en los inputs ni en localStorage
                }
                // --- End Save ---
                break;

            case 'roomCreated': // Successfully created a room
                gameState.roomId = message.payload.roomId;
                // Update player state with the creator's info (assuming server doesn't send full player list here)
                gameState.players.player1 = {
                    id: gameState.myPlayerId,
                    name: createPlayerNameInput.value.trim() || 'Jugador 1',
                    score: 0
                };
                gameState.players.player2 = null; // No opponent yet

                showGameScreen(); // Transition UI away from lobby
                updatePlayerUI(); // Show player 1 info in the header
                // Hide game elements not needed yet
                questionTextEl.textContent = '';
                level2PlusOptionsAreaEl.classList.remove('active');
                showWaitingMessage(`Room ${gameState.roomId} created. Waiting for opponent...`); // Show waiting message in the game screen area
                disablePlayerInput(); // Ensure inputs are disabled while waiting
                break;

            case 'joinSuccess': // Successfully joined a room
                gameState.roomId = message.payload.roomId;
                 if (message.payload.players) {
                    gameState.players = message.payload.players;
                 }
                 // Si el modal de contraseña estaba activo, ocultarlo
                 if (privateRoomPasswordModalEl && privateRoomPasswordModalEl.classList.contains('active')) {
                    hidePasswordPromptModal();
                 }
                 showLobbyMessage(`Joined room ${gameState.roomId}! Waiting for game to start...`, "success");
                 // Los botones del lobby se mantienen deshabilitados, esperando gameStart
                 // enableLobbyButtons(); // No habilitar aquí, esperar gameStart
                 // Restaurar texto del botón de submit de contraseña si fue cambiado
                 if (submitPasswordButtonEl) {
                    submitPasswordButtonEl.disabled = false;
                    submitPasswordButtonEl.textContent = 'Unirse';
                 }
                break;

             case 'joinError': // Failed to join/create room
                 showLobbyMessage(message.payload.error || "Error joining/creating room.", "error");
                 enableLobbyButtons(); 

                 // Manejar error específico en el modal de contraseña
                 if (privateRoomPasswordModalEl && privateRoomPasswordModalEl.classList.contains('active') && 
                     message.payload.failedRoomId && message.payload.failedRoomId === currentJoiningRoomId) {
                     
                     passwordErrorTextEl.textContent = message.payload.error || "Contraseña incorrecta o error en la sala.";
                     passwordErrorTextEl.style.display = 'block';
                     if (submitPasswordButtonEl) {
                        submitPasswordButtonEl.disabled = false;
                        submitPasswordButtonEl.textContent = 'Unirse';
                     }
                     if (passwordModalInputEl) passwordModalInputEl.focus();
                 } else {
                    // Si el error no es del modal de contraseña específico, pero estaba activo, ocultarlo.
                    if (privateRoomPasswordModalEl && privateRoomPasswordModalEl.classList.contains('active')) {
                         hidePasswordPromptModal(); 
                    }
                 }
                 break;

            // Handle random join results separately for clarity
             case 'randomJoinSuccess':
                 gameState.roomId = message.payload.roomId;
                  if (message.payload.players) {
                     gameState.players = message.payload.players;
                 }
                 showLobbyMessage(`Joined random room ${gameState.roomId}! Waiting for game to start...`, "success");
                 // Still waiting for game start, keep buttons disabled
                 break;

             case 'randomJoinError':
                 showLobbyMessage(message.payload.error || "No suitable random rooms available.", "error");
                 enableLobbyButtons(); // Allow user to try again or create a room
                 break;

            case 'gameStart': // Both players are ready, game begins
                 gameState.players = message.payload.players; // Get initial player data { player1: {id, name, score}, player2: {id, name, score} }
                 gameState.currentTurn = message.payload.startingPlayerId;
                 console.log("Received gameStart:", message.payload);
                 startGame(); // Transition to game screen, update UI
                 // Don't enable input here; wait for the first 'newQuestion' message
                 showWaitingMessage("Game starting! Waiting for first question...");
                 break;

            case 'newQuestion': // Server sends a new question
                 // Ensure game is marked active if it wasn't already (e.g., reconnect)
                 if (!gameState.gameActive) {
                    console.log("Received newQuestion while game not marked active. Activating game screen.");
                    showGameScreen(); // Ensure game screen is visible
                    gameState.gameActive = true;
                 }
                 // Update player scores/names if included in the message (optional, based on server design)
                 if(message.payload.players) gameState.players = message.payload.players;
                 gameState.currentTurn = message.payload.currentTurn; // Server dictates whose turn it is
                 updatePlayerUI();

                 // +++ DEBUG: Log the question object AS RECEIVED from payload +++
                 console.log("[DEBUG] SERVER PAYLOAD question object:", JSON.parse(JSON.stringify(message.payload.question)));
                 // Pass a DEEP COPY to displayQuestion to avoid issues with console.log live references or later modifications
                 const questionCopy = JSON.parse(JSON.stringify(message.payload.question));
                 displayQuestion(questionCopy); 
                 // displayQuestion(message.payload.question); // OLD WAY
                 updateLevelAndQuestionCounter(questionCopy.level, questionCopy.questionNumber, questionCopy.totalQuestionsInLevel);
                 // updateTurnIndicator(); // REMOVED: Function does not exist

                 // Handle enabling/disabling input based on whose turn it is
                 if (gameState.currentTurn === gameState.myPlayerId) {
                     console.log("It's my turn. Enabling input.");
                     enablePlayerInput(); // Enable input if it's our turn
                     hideWaitingMessage(); // Ensure no waiting message is shown
                 } else {
                     console.log("It's opponent's turn. Disabling input.");
                     showWaitingMessage("Opponent's turn...");
                     disablePlayerInput(); // Disable input if it's opponent's turn
                 }
                 break;

            case 'updateState': // General state update (e.g., after an answer, turn change without new question yet)
                 console.log("Received updateState:", message.payload);
                 gameState.currentTurn = message.payload.currentTurn;
                 gameState.players = message.payload.players; // Update scores primarily
                 // gameState.currentLevel = message.payload.currentLevel; // Usually level changes with newQuestion
                 updatePlayerUI();
                 // updateTurnIndicator(); // REMOVED: Function does not exist
                 // updateLevelAndQuestionCounter(gameState.currentLevel); // Level display usually updates with newQuestion

                 if (gameState.gameActive) {
                     if (gameState.currentTurn === gameState.myPlayerId) {
                         // If it's now our turn (likely after opponent answered, before new question arrives)
                         // We might still be waiting for the next question, so don't necessarily enable input yet.
                         // Server should send 'newQuestion' to signal readiness for input.
                         // However, we can hide the "Opponent's turn" message.
                         hideWaitingMessage();
                         console.log("State updated, now my turn (waiting for new question?)");
                         // Optional: Show a generic waiting message if needed?
                         // showWaitingMessage("Waiting for next question...");
                     } else {
                         // If it's opponent's turn (likely after we answered)
                         disablePlayerInput(); // Ensure input is disabled
                         showWaitingMessage("Opponent's turn...");
                         console.log("State updated, now opponent's turn.");
                     }
                 }
                 break;

            case 'answerResult': // Server sends result of an answer submission
                 console.log("Received answerResult:", message.payload);
                 const { isCorrect, pointsAwarded, correctAnswerText, forPlayerId, selectedIndex, correctIndex } = message.payload;

                 // Find the player object who answered, ensuring player data exists
                 let answeredPlayer = null;
                 if(gameState.players && gameState.players.player1 && gameState.players.player1.id === forPlayerId) {
                     answeredPlayer = gameState.players.player1;
                 } else if (gameState.players && gameState.players.player2 && gameState.players.player2.id === forPlayerId) {
                     answeredPlayer = gameState.players.player2;
                 }

                 const playerName = answeredPlayer ? answeredPlayer.name : 'Player';
                 let feedbackMsg = `${playerName} answered: ${isCorrect ? 'Correct!' : 'Incorrect.'} ${pointsAwarded > 0 ? `(+${pointsAwarded} points)` : ''}`;
                 let finalIsCorrect = isCorrect; // Use this for feedback display

                 // Show feedback (correct/incorrect message)
                     if (gameState.currentQuestionData && gameState.currentQuestionData.level > 1 && gameState.optionsRequested) { // optionsRequested is always true
                         feedbackMsg += ` Answer: ${correctAnswerText}`;
                 }
                 // Use finalIsCorrect to determine feedback type class
                 showFeedback(feedbackMsg, finalIsCorrect ? 'correct' : 'incorrect');


                 // Visualize options if level > 1 and options were requested
                 if (gameState.currentQuestionData && gameState.currentQuestionData.level > 1 && gameState.optionsRequested) {
                    // Reveal correct/incorrect options
                    // Pass 'isCorrect' based on the player who answered
                    visualizeAnswerOptions(selectedIndex, correctIndex, isCorrect);
                    // Ensure all option buttons are disabled after showing result
                    optionButtons.forEach(btn => btn.disabled = true);
                 }

                 // Input remains disabled, waiting for 'updateState' or 'newQuestion' for next turn/question
                 disablePlayerInput(); // Explicitly disable here
                 // Show a brief waiting message before the next update
                 showWaitingMessage("Waiting for next turn...");
                 break;

            case 'optionsProvided': // Server provides options after request
                 console.log("Received optionsProvided:", message.payload);
                 // This message might still be used by the server even if client doesn't explicitly request.
                 // Or, server might always include options in 'newQuestion'.
                 // Assuming this message means "here are the options to display":
                 if (message.payload && message.payload.options && Array.isArray(message.payload.options)) {
                    console.log("[CLIENT] optionsProvided: Displaying options from message.payload.options array.");
                    displayOptionsFromArray(message.payload.options);
                 } else {
                    console.warn("[CLIENT] optionsProvided: message.payload.options is missing or not an array.", message.payload);
                    clearAndHideOptions(); // Fallback if options are not in expected format
                 }

                 // Input might be enabled here if it's still our turn (and game active)
                 if (gameState.currentTurn === gameState.myPlayerId && gameState.gameActive) {
                     enablePlayerInput();
                     hideWaitingMessage(); // Hide waiting message as options are now interactable
                 }
                 break;

            case 'fiftyFiftyApplied': // Server confirms 50/50 and sends options to remove
                 console.log("Received fiftyFiftyApplied:", message.payload);
                 removeFiftyFiftyOptions(message.payload.optionsToRemove);
                 // Input might be enabled here if it's still our turn (and game active)
                 if (gameState.currentTurn === gameState.myPlayerId && gameState.gameActive) {
                     enablePlayerInput(); // Re-enable input (option buttons) after removing some
                 }
                 break;

            case 'gameOver': // Game has ended
                 console.log("Received gameOver:", message.payload);
                 gameState.gameActive = false;
                 disablePlayerInput();
                 hideWaitingMessage();
                 endGame(message.payload); // Show final results
                 break;

            case 'playerDisconnect': // Opponent disconnected during the game
                 console.log("Received playerDisconnect:", message.payload);
                 showError(`${message.payload.disconnectedPlayerName || 'Opponent'} disconnected.`);
                 // Server should ideally handle game state (e.g., award win, end game)
                 // Client just shows a waiting message or prepares for game over
                 showWaitingMessage("Opponent disconnected. Waiting for server update..."); // Inform user
                 disablePlayerInput(); // Disable input while waiting
                 // The server might send a 'gameOver' message shortly after this.
                 break;

            case 'errorMessage': // Specific error from server logic
                 console.error("Received errorMessage:", message.payload);
                 // Display error appropriately based on context
                 if (gameState.gameActive) {
                     showError(message.payload.error || "An error occurred during the game.");
                     // Decide if the error is fatal for the game
                     // Maybe disable input, wait for server 'gameOver' or manual exit
                     disablePlayerInput();
                 } else {
                     showLobbyMessage(message.payload.error || "An error occurred.", "error");
                     enableLobbyButtons(); // Allow retry in lobby
                 }
                 break;

            case 'availableRooms': // Server sends the list of available rooms
                console.log("📋 [QSM] Payload completo recibido:", JSON.stringify(message.payload, null, 2));
                console.log("📋 [QSM] Salas recibidas del servidor:", message.payload.rooms);
                
                // Verificación de seguridad para el array de salas
                const rooms = message.payload.rooms || [];
                if (!Array.isArray(rooms)) {
                    console.error("❌ [QSM] payload.rooms no es un array:", typeof rooms, rooms);
                    return;
                }
                
                console.log(`🔍 [QSM] Llamando renderAvailableRooms con ${rooms.length} salas`);
                renderAvailableRooms(rooms, 'quiensabemas');
                
                // Si hay una solicitud pendiente desde la página principal, responderla
                if (gameState.pendingRoomsRequest) {
                    console.log("📤 [QSM] Enviando salas a games.html (pendingRequest):", message.payload.rooms?.length || 0, "salas");
                    gameState.pendingRoomsRequest.source.postMessage({
                        type: 'availableRooms',
                        gameType: 'quiensabemas',
                        rooms: message.payload.rooms || []
                    }, gameState.pendingRoomsRequest.origin);
                    
                    // Limpiar la solicitud pendiente
                    gameState.pendingRoomsRequest = null;
                }
                
                // Si hay una solicitud desde games.html, responderla
                if (window.roomsRequestSource && window.roomsRequestOrigin) {
                    console.log("📤 [QSM] Enviando salas a games.html (roomsRequest):", message.payload.rooms?.length || 0, "salas");
                    window.roomsRequestSource.postMessage({
                        type: 'availableRooms',
                        gameType: 'quiensabemas',
                        rooms: message.payload.rooms || []
                    }, window.roomsRequestOrigin);
                    
                    // Limpiar la solicitud
                    window.roomsRequestSource = null;
                    window.roomsRequestOrigin = null;
                }
                 break;

            default:
                 console.warn('Unknown message type received:', message.type);
        }
    }

    // --- Función para guardar estadísticas en Firebase ---
    async function saveQuienSabeMasStats(payload) {
        try {
            const finalScores = payload.finalScores;
            if (!gameState.myPlayerId || !finalScores) return;

            let myFinalScore = 0;
            let opponentScore = 0;
            let opponentId = null;
            let opponentName = 'Oponente';
            let result = 'defeat';
            
            // Determinar mi puntuación y la del oponente
            for (const playerId in finalScores) {
                if (playerId === gameState.myPlayerId) {
                    myFinalScore = finalScores[playerId];
                } else {
                    opponentScore = finalScores[playerId];
                    opponentId = playerId;
                }
            }
            
            // Obtener nombre del oponente
            const player1 = gameState.players?.player1;
            const player2 = gameState.players?.player2;
            if (player1?.id === opponentId) opponentName = player1.name || opponentName;
            else if (player2?.id === opponentId) opponentName = player2.name || opponentName;
            
            // Determinar resultado
            if (payload.draw) {
                result = 'draw';
            } else if (payload.winnerId === gameState.myPlayerId) {
                result = 'victory';
            }

            const gameStats = {
                result: result,
                myScore: myFinalScore,
                opponentId: opponentId,
                opponentName: opponentName,
                opponentScore: opponentScore
            };

            await saveQuienSabeMasResult(gameStats);
            console.log("Estadísticas de Quién Sabe Más guardadas exitosamente");
        } catch (error) {
            console.error("Error guardando estadísticas de Quién Sabe Más:", error);
        }
    }

    // --- End Game --- Reestructurada para 1v1
    function endGame(payload) { // payload: { finalScores: {playerId1: score, playerId2: score}, winnerId: id | null, draw: boolean, reason?: string }
        console.log("Game Over. Payload:", payload);
        gameState.gameActive = false;
        disablePlayerInput();
        hideWaitingMessage();

        const finalScores = payload.finalScores;
        if (!gameState.myPlayerId || !finalScores || typeof finalScores !== 'object') {
            console.error("Cannot determine final scores.", gameState, payload);
            showEndGameModalWithError("Error calculando resultados.");
             return;
         }

        // Identificar mi score y el del oponente
        let myFinalScore = 'N/A';
        let opponentFinalScore = 'N/A';
        let opponentId = null;

        for (const playerId in finalScores) {
            if (playerId === gameState.myPlayerId) {
                myFinalScore = finalScores[playerId];
            } else {
                opponentFinalScore = finalScores[playerId];
                opponentId = playerId; // Guardamos el ID del oponente
            }
        }

        // Obtener nombres (del estado actual del juego)
        let myName = 'Tú';
        let opponentName = 'Oponente';
        const player1 = gameState.players?.player1;
        const player2 = gameState.players?.player2;
        if (player1?.id === gameState.myPlayerId) myName = player1.name || myName;
        else if (player2?.id === gameState.myPlayerId) myName = player2.name || myName;

        if (player1?.id === opponentId) opponentName = player1.name || opponentName;
        else if (player2?.id === opponentId) opponentName = player2.name || opponentName;


        let title = "";
        let message = payload.reason || ""; // Mostrar razón si la hay (ej. desconexión)
        let headerClass = ''; // Clase para el header del modal

        if (payload.draw) {
            title = "¡Es un Empate!";
            if (!message) message = "Ambos jugadores tienen la misma puntuación.";
            headerClass = 'result-header-timeout'; // Usar un color neutral o de "tiempo agotado" para empate
        } else if (payload.winnerId === gameState.myPlayerId) {
            title = `¡Has Ganado, ${myName}!`;
            if (!message) message = "¡Felicidades!";
            headerClass = 'result-header-victory';
        } else if (opponentId && payload.winnerId === opponentId) {
            title = `¡${opponentName} ha Ganado!`;
             if (!message) message = "Mejor suerte la próxima vez.";
            headerClass = 'result-header-defeat';
        } else {
             title = "Juego Terminado";
             if (!message) message = "La partida ha finalizado."; // Mensaje por defecto si no hay razón ni ganador claro
             // No specific class, or a default one if you define it in CSS
        }

        resultTitleEl.textContent = title;
        resultMessageEl.textContent = message;

        // Aplicar clase al header del modal
        const modalHeader = endGameModalEl.querySelector('.result-modal-header');
        if (modalHeader) {
            modalHeader.classList.remove('result-header-victory', 'result-header-defeat', 'result-header-timeout');
            if (headerClass) {
                modalHeader.classList.add(headerClass);
            }
        }

        // Llenar dinámicamente los stats en el modal
        let player1StatClass = '';
        let player2StatClass = '';

        if (!payload.draw) {
            if (payload.winnerId === gameState.myPlayerId) {
                player1StatClass = 'winner';
                player2StatClass = 'loser';
            } else if (opponentId && payload.winnerId === opponentId) {
                player1StatClass = 'loser';
                player2StatClass = 'winner';
            }
        }
        // Si es empate, no se añaden clases winner/loser a los items individuales,
        // el header ya indica el estado de empate (result-header-timeout).

        resultStatsEl.innerHTML = `
            <div class="stat-item your-score ${player1StatClass}">
                <span class="stat-label"><i class="fas fa-user-shield"></i> ${myName} (Tú)</span>
                <span class="stat-value">${myFinalScore}</span>
            </div>
            <div class="stat-item opponent-score ${player2StatClass}">
                <span class="stat-label"><i class="fas fa-user-ninja"></i> ${opponentName}</span>
                <span class="stat-value">${opponentFinalScore}</span>
            </div>
        `;

        // Guardar estadísticas en Firebase
        saveQuienSabeMasStats(payload);

        showEndGameModal();
    }

    function showEndGameModal() {
        endGameModalEl.classList.add('active');
    }

     function showEndGameModalWithError(reason) {
         resultTitleEl.textContent = "Juego Interrumpido";
         resultMessageEl.textContent = reason || "Ha ocurrido un error.";

        // Aplicar clase de error al header del modal
        const modalHeader = endGameModalEl.querySelector('.result-modal-header');
        if (modalHeader) {
            modalHeader.classList.remove('result-header-victory', 'result-header-defeat', 'result-header-timeout');
            modalHeader.classList.add('result-header-defeat'); // Usar clase de derrota para errores generales
        }

         // Intentar mostrar el último score conocido
         let myLastScore = 'N/A';
         let opponentLastScore = 'N/A';
         let myName = 'Tú';
         let opponentName = 'Oponente';
         const player1 = gameState.players?.player1;
         const player2 = gameState.players?.player2;

         if (player1?.id === gameState.myPlayerId) {
             myLastScore = player1.score;
             myName = player1.name || myName;
             if(player2) {
                 opponentLastScore = player2.score;
                 opponentName = player2.name || opponentName;
             }
         } else if (player2?.id === gameState.myPlayerId) {
             myLastScore = player2.score;
             myName = player2.name || myName;
              if(player1) {
                 opponentLastScore = player1.score;
                 opponentName = player1.name || opponentName;
             }
         }

         resultStatsEl.innerHTML = `
            <div class="stat-item your-score">
                <span class="stat-label">${myName} (Tú)</span>
                <span class="stat-value">${myLastScore}</span>
            </div>
            <div class="stat-item opponent-score">
                <span class="stat-label">${opponentName}</span>
                <span class="stat-value">${opponentLastScore}</span>
            </div>
        `;
         showEndGameModal();
     }

    function hideEndGameModal() {
        endGameModalEl.classList.remove('active');
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        setupLobbyEventListeners(); // Lobby listeners

        // Game Listeners
        // answerFormLevel1.addEventListener('submit', handleLevel1Submit); // REMOVED
        optionButtons.forEach(button => {
            button.addEventListener('click', handleOptionClick);
        });
        // requestOptionsButtonEl.addEventListener('click', handleRequestOptions); // REMOVED
        fiftyFiftyButtonEl.addEventListener('click', handleFiftyFifty);

        // Modal Buttons (Result Modal)
        playAgainButtonQSM.addEventListener('click', () => {
            hideEndGameModal();
            showLobby();
            gameState.gameActive = false;
             if (gameState.roomId) {
                sendToServer('leaveRoom', { roomId: gameState.roomId });
                gameState.roomId = null;
             }
        });
        backToLobbyButtonQSM.addEventListener('click', () => {
            hideEndGameModal();
            showLobby();
             gameState.gameActive = false;
             if (gameState.roomId) {
                sendToServer('leaveRoom', { roomId: gameState.roomId });
                gameState.roomId = null;
             }
        });

        // Listeners para el Modal de Contraseña de Sala Privada
        if (privateRoomPasswordFormEl) {
            privateRoomPasswordFormEl.addEventListener('submit', handleSubmitPasswordModal);
        }
        if (cancelPasswordSubmitEl) {
            cancelPasswordSubmitEl.addEventListener('click', hidePasswordPromptModal);
        }
        // Opcional: cerrar modal de contraseña si se clickea fuera del contenido
        if (privateRoomPasswordModalEl) {
            privateRoomPasswordModalEl.addEventListener('click', (event) => {
                if (event.target === privateRoomPasswordModalEl) {
                    hidePasswordPromptModal();
                }
            });
        }
    }

    // --- Lobby Room List Rendering ---
    function renderAvailableRooms(rooms, gameTypeFilter = 'quiensabemas') {
        console.log("🏠 [QSM] renderAvailableRooms llamado con:", {
            roomsType: typeof rooms,
            roomsLength: rooms ? rooms.length : 'null/undefined',
            gameTypeFilter,
            rooms: rooms
        });
        
        if (!availableRoomsListEl) {
            console.error("Available rooms list element not found.");
            return;
        }

        // Verificación adicional de seguridad
        if (!rooms || !Array.isArray(rooms)) {
            console.error("❌ [QSM] renderAvailableRooms: rooms no es un array válido:", rooms);
            availableRoomsListEl.innerHTML = '<li class="no-rooms-message">Error: datos de salas inválidos</li>';
            return;
        }

        availableRoomsListEl.innerHTML = ''; // Clear existing list

        // Filtrar salas por tipo de juego
        console.log(`🔍 [QSM] Filtrando salas. Total recibidas: ${rooms.length}, Filtro: ${gameTypeFilter}`);
        const filteredRooms = gameTypeFilter ? rooms.filter(room => {
            const matches = room.gameType === gameTypeFilter;
            if (!matches) {
                console.log(`❌ [QSM] Sala ${room.id} descartada: tipo '${room.gameType}' ≠ '${gameTypeFilter}'`);
            }
            return matches;
        }) : rooms;
        console.log(`✅ [QSM] Salas filtradas para mostrar: ${filteredRooms.length}`);

        if (!filteredRooms || filteredRooms.length === 0) {
            const noRoomsMsg = document.createElement('li');
            noRoomsMsg.className = 'no-rooms-message';
            noRoomsMsg.textContent = 'No hay salas de Quién Sabe Más disponibles.';
            availableRoomsListEl.appendChild(noRoomsMsg);
            return;
        }

        filteredRooms.forEach(room => {
            const roomItem = document.createElement('li');
            roomItem.className = 'room-item';
            roomItem.dataset.roomId = room.id;

            const roomInfo = document.createElement('div');
            roomInfo.className = 'room-info';

            // Display Room ID (or name if server provides it)
            const roomIdSpan = document.createElement('span');
            roomIdSpan.innerHTML = `ID: <strong>${room.id}</strong>`;
            roomInfo.appendChild(roomIdSpan);

            // Display Creator Name if available
            if (room.creatorName) {
                const creatorSpan = document.createElement('span');
                creatorSpan.innerHTML = `Creador: <strong>${room.creatorName}</strong>`;
                roomInfo.appendChild(creatorSpan);
            }

            // Display Player Count
            const playerCountSpan = document.createElement('span');
            // Assuming server sends playerCount like '1/2'
            const currentPlayers = room.playerCount || 0; // Default to 0 if undefined
            const maxPlayers = room.maxPlayers || 2; // Default to 2 if undefined
            playerCountSpan.innerHTML = `Jugadores: <strong>${currentPlayers}/${maxPlayers}</strong>`;
            roomInfo.appendChild(playerCountSpan);

             // Display if password required (optional)
            if (room.requiresPassword) {
                 const passwordSpan = document.createElement('span');
                 passwordSpan.innerHTML = `<strong><i class="fas fa-lock"></i> Private</strong>`;
                 roomInfo.appendChild(passwordSpan);
            }

            roomItem.appendChild(roomInfo);

            // Add Join Button
            const joinButton = document.createElement('button');
            joinButton.className = 'secondary-button lobby-button join-room-list-btn'; // Re-use styling
            joinButton.textContent = 'Join';
            // Disable join button if room is full or if it's the player's own room (need player ID check)
            joinButton.disabled = currentPlayers >= maxPlayers; // Basic check for fullness

            joinButton.addEventListener('click', () => {
                handleJoinRoomFromList(room.id, room.requiresPassword);
            });

            roomItem.appendChild(joinButton);
            availableRoomsListEl.appendChild(roomItem);
        });
    }

    // --- Join Room from List Logic ---
    function handleJoinRoomFromList(roomId, requiresPassword) {
        const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';

        console.log(`🎯 [QSM] Intentando unirse a sala ${roomId} como ${playerName}. Requiere contraseña: ${requiresPassword}`);

        if (requiresPassword) {
            currentJoiningRoomId = roomId; // Guardar el ID de la sala actual
            passwordModalTextEl.textContent = `La sala de Quién Sabe Más '${roomId}' es privada. Por favor, ingresá la contraseña:`;
            passwordModalInputEl.value = ''; // Limpiar input
            passwordErrorTextEl.textContent = '';
            passwordErrorTextEl.style.display = 'none';
            passwordModalInputEl.focus();
            showPasswordPromptModal();
            } else {
            // Unirse directamente si no requiere contraseña
            joinRoomIdInput.value = roomId; // Actualizar el input general del lobby (opcional, pero consistente)
            joinRoomPasswordInput.value = ''; // Limpiar el input general de contraseña del lobby
            showLobbyMessage(`Uniéndote a la sala pública de QSM ${roomId}...`, "info");
            disableLobbyButtons();
            sendToServer('joinRoom', { playerName, roomId, password: '', gameType: 'quiensabemas' });
        }
    }

    // --- Funciones para el Modal de Contraseña ---
    function showPasswordPromptModal() {
        if (privateRoomPasswordModalEl) privateRoomPasswordModalEl.classList.add('active');
        if (passwordModalInputEl) passwordModalInputEl.focus();
         // Deshabilitar botones del lobby mientras el modal de contraseña está activo
        disableLobbyButtons();
    }

    function hidePasswordPromptModal() {
        if (privateRoomPasswordModalEl) privateRoomPasswordModalEl.classList.remove('active');
        currentJoiningRoomId = null; // Limpiar el ID de la sala actual
        // Habilitar botones del lobby nuevamente
        enableLobbyButtons(); 
    }

    function handleSubmitPasswordModal(event) {
        event.preventDefault();
        const password = passwordModalInputEl.value;
        const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';

        if (!password) {
            passwordErrorTextEl.textContent = 'La contraseña no puede estar vacía.';
            passwordErrorTextEl.style.display = 'block';
            passwordModalInputEl.focus();
            return;
        }

        if (currentJoiningRoomId) {
            console.log(`Attempting to join room ${currentJoiningRoomId} with password from modal.`);
            passwordErrorTextEl.textContent = '';
            passwordErrorTextEl.style.display = 'none';
            // Mostrar un feedback de carga en el botón o modal aquí sería ideal
            submitPasswordButtonEl.disabled = true;
            submitPasswordButtonEl.textContent = 'Uniéndote...';

            sendToServer('joinRoom', { 
                playerName, 
                roomId: currentJoiningRoomId, 
                password,
                gameType: 'quiensabemas'
            });
        } else {
            console.error("No currentJoiningRoomId set when submitting password modal.");
            hidePasswordPromptModal(); // Cerrar si no hay ID, es un estado inesperado
        }
    }

    // --- Función para polling automático de salas ---
    function setupAutomaticRoomPolling() {
        // Solicitar salas inmediatamente al cargar
        setTimeout(() => {
            if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN && !gameState.gameActive) {
                sendToServer('getRooms', { gameType: 'quiensabemas' });
            }
        }, 1000);
        
        // Polling automático cada 3 segundos cuando estamos en el lobby
        setInterval(() => {
            // Solo hacer polling si estamos en el lobby, conectados, y no en un juego activo
            if (gameState.websocket && 
                gameState.websocket.readyState === WebSocket.OPEN && 
                !gameState.gameActive && 
                !gameState.roomId &&
                lobbySectionEl && 
                lobbySectionEl.style.display !== 'none') {
                
                console.log('🔄 Solicitando actualización automática de salas (Quién Sabe Más)');
                sendToServer('getRooms', { gameType: 'quiensabemas' });
            }
        }, 3000); // Cada 3 segundos
    }

    // --- Start App ---
    initializeApp(); // Start with the lobby and WebSocket connection

    // +++ NEW FUNCTION to display options from an array +++
    function displayOptionsFromArray(optionsArray) {
        console.log("[CLIENT] Displaying options from array:", optionsArray);
        if (!optionsContainerEl) {
            console.error("[CLIENT] optionsContainerEl is null in displayOptionsFromArray");
            return;
        }
        optionsContainerEl.style.display = 'grid';

        if (!optionButtons || optionButtons.length === 0) {
            console.error("[CLIENT] optionButtons NodeList is empty or null in displayOptionsFromArray");
            return;
        }

        optionButtons.forEach((btn, index) => {
            if (index < optionsArray.length && typeof optionsArray[index] === 'string') {
                const optionTextEl = btn.querySelector('.option-text');
                if (optionTextEl) {
                    optionTextEl.textContent = optionsArray[index];
                } else {
                    console.warn(`[CLIENT] .option-text element not found in button index ${index}`);
                }
                btn.style.display = 'flex';
                btn.disabled = true; // Disabled until enablePlayerInput is called
                btn.classList.remove('hidden', 'correct', 'incorrect', 'selected');
            } else {
                btn.style.display = 'none'; // Hide button if no corresponding option or option is not a string
                if (index >= optionsArray.length) {
                    // This is expected if optionsArray has fewer than 4 options, no warning needed
                } else if (typeof optionsArray[index] !== 'string') {
                    console.warn(`[CLIENT] Option at index ${index} is not a string:`, optionsArray[index]);
                }
            }
        });

        gameState.optionsRequested = true; // Options are now displayed

        // Update 50/50 button state
        if (gameState.currentTurn === gameState.myPlayerId && gameState.gameActive) {
            if(fiftyFiftyButtonEl) fiftyFiftyButtonEl.disabled = gameState.fiftyFiftyUsed;
        }
    }
    // +++ END NEW FUNCTION +++

});