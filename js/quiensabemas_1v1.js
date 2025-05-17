// --- WebSocket URL (¡Configura esto!) ---
const WEBSOCKET_URL = (() => {
    // Usa 'wss:' si tu sitio está en HTTPS, 'ws:' si está en HTTP
    // const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Asume que el servidor WebSocket corre en el mismo host y puerto, en la raíz '/'.
    // ¡AJUSTA ESTO SI TU SERVIDOR ESTÁ EN OTRO LADO!
    // Ejemplo local: 'ws://localhost:8081'
    // Ejemplo producción: `${protocol}//${window.location.host}`
    // return `${protocol}//${window.location.host}`;
    return 'wss://cracktotal-servidor.onrender.com'; // <-- URL real de Render Web Service
})();

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
        websocket: null
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
    const endGameModalEl = document.getElementById('endGameModal');
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

    // --- Initialization ---
    function initializeApp() {
        console.log("Initializing Quien Sabe Más 1v1 App...");
        showLobby(); // Start in the lobby
        setupEventListeners();
        hideEndGameModal();

        // --- Prefill player name from session storage ---
        const savedPlayerName = sessionStorage.getItem('playerName');
        if (savedPlayerName) {
            if (createPlayerNameInput) createPlayerNameInput.value = savedPlayerName;
            if (joinPlayerNameInput) joinPlayerNameInput.value = savedPlayerName;
            console.log(`Prefilled player name: ${savedPlayerName}`);
        }
        // --- End Prefill ---

        initializeWebSocket(); // Connect WebSocket on app load
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
        sendToServer('createRoom', { playerName, password });
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
        sendToServer('joinRoom', { playerName, roomId, password });
    }

     function handleJoinRandomRoom() {
         // Check if button exists and is already disabled
         if (!joinRandomRoomButton || joinRandomRoomButton.disabled) return;

         const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2'; // Use the name from the join section
         console.log(`Searching for random room for ${playerName}...`);
         showLobbyMessage("Buscando una sala disponible...", "info");
         disableLobbyButtons(false, false, true); // Disable and show spinner on join random button
         sendToServer('joinRandomRoom', { playerName });
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

        // +++ DEBUGGING LOGS (MOVED AND ADDED) +++
        console.log("[DEBUG] Keys in received question object:", Object.keys(question));
        console.log("[DEBUG] question object (deep copy for inspection):", JSON.parse(JSON.stringify(question)));
        // console.log("[DEBUG] typeof question['options ']:", typeof question["options "]); // Old check
        // console.log("[DEBUG] Array.isArray(question['options ']):", Array.isArray(question["options "])); // Old check
        // +++ END DEBUGGING LOGS +++

        // Populate options directly if available in the question data sent by server
        // Server (server.js) sends 'options' (no space) as the key for an array of strings.
        const currentOptions = question.options; // Direct access

        if (currentOptions && Array.isArray(currentOptions) && currentOptions.length > 0) {
            console.log("[CLIENT] Displaying options from question.options (should be an array).");
            displayOptionsFromArray(currentOptions); // Call the new function
        } else {
            console.warn("[CLIENT] Question received, but 'question.options' is missing, not a valid array, or empty. Options will be empty.", question);
            // Add a check for the old problematic key for debugging if direct access fails
            if (question.hasOwnProperty("options ") && Array.isArray(question["options "])) { // Note the space in "options "
                console.warn("[CLIENT] Diagnostic: Problematic key 'options ' (with space) was found in question object. Value:", question["options "]);
            } else if (question.hasOwnProperty("options") && typeof question.options === 'object' && question.options !== null && !Array.isArray(question.options)) {
                console.warn("[CLIENT] Diagnostic: 'question.options' (no space) exists but is an object, not an array. Keys:", Object.keys(question.options));
            }
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
                // --- Save player name to session storage when assigned ---
                const creatorPlayerName = createPlayerNameInput?.value || joinPlayerNameInput?.value;
                if (creatorPlayerName) {
                    sessionStorage.setItem('playerName', creatorPlayerName);
                    console.log(`Saved player name to session storage: ${creatorPlayerName}`);
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
                // Update player names if provided by the server upon join
                 if (message.payload.players) {
                    gameState.players = message.payload.players;
                    // Don't update UI yet, wait for gameStart
                 }
                 showLobbyMessage(`Joined room ${gameState.roomId}! Waiting for game to start...`, "success");
                 // Still waiting for game start, keep buttons disabled
                break;

             case 'joinError': // Failed to join/create room
                 showLobbyMessage(message.payload.error || "Error joining/creating room.", "error");
                 enableLobbyButtons(); // Allow user to try again
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
                 if (gameState.currentQuestionData && gameState.optionsRequested) { // optionsRequested is always true
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
                console.log("Received availableRooms:", message.payload.rooms);
                renderAvailableRooms(message.payload.rooms);
                 break;

            default:
                 console.warn('Unknown message type received:', message.type);
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

        if (payload.draw) {
            title = "¡Es un Empate!";
            if (!message) message = "Ambos jugadores tienen la misma puntuación.";
        } else if (payload.winnerId === gameState.myPlayerId) {
            title = `¡Has Ganado, ${myName}!`;
            if (!message) message = "¡Felicidades!";
        } else if (opponentId && payload.winnerId === opponentId) {
            title = `¡${opponentName} ha Ganado!`;
             if (!message) message = "Mejor suerte la próxima vez.";
        } else {
             title = "Juego Terminado";
             if (!message) message = "La partida ha finalizado."; // Mensaje por defecto si no hay razón ni ganador claro
        }

        resultTitleEl.textContent = title;
        resultMessageEl.textContent = message;

        // Llenar dinámicamente los stats en el modal
        resultStatsEl.innerHTML = `
            <div class="stat-item your-score">
                <span class="stat-label">${myName} (Tú)</span>
                <span class="stat-value">${myFinalScore}</span>
            </div>
            <div class="stat-item opponent-score">
                <span class="stat-label">${opponentName}</span>
                <span class="stat-value">${opponentFinalScore}</span>
            </div>
        `;

        showEndGameModal();
    }

    function showEndGameModal() {
        endGameModalEl.classList.add('active');
    }

     function showEndGameModalWithError(reason) {
         resultTitleEl.textContent = "Juego Interrumpido";
         resultMessageEl.textContent = reason || "Ha ocurrido un error.";

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

        // Modal Buttons
        playAgainButtonQSM.addEventListener('click', () => {
            hideEndGameModal();
            // Enviar mensaje al servidor para buscar nueva partida o crear una?
            // Por ahora, simplemente vuelve al lobby
            showLobby();
            gameState.gameActive = false;
            // Considerar enviar 'leaveRoom' al servidor aquí
             if (gameState.roomId) {
                sendToServer('leaveRoom', { roomId: gameState.roomId }); // Asumiendo que existe este mensaje
                gameState.roomId = null;
             }
        });
        backToLobbyButtonQSM.addEventListener('click', () => {
            hideEndGameModal();
            showLobby();
             gameState.gameActive = false;
             if (gameState.roomId) {
                sendToServer('leaveRoom', { roomId: gameState.roomId }); // Asumiendo que existe este mensaje
                gameState.roomId = null;
             }
        });
    }

    // --- Lobby Room List Rendering ---
    function renderAvailableRooms(rooms) {
        if (!availableRoomsListEl) {
            console.error("Available rooms list element not found.");
            return;
        }

        availableRoomsListEl.innerHTML = ''; // Clear existing list

        if (!rooms || rooms.length === 0) {
            const noRoomsMsg = document.createElement('li');
            noRoomsMsg.className = 'no-rooms-message';
            noRoomsMsg.textContent = 'No public rooms available currently.';
            availableRoomsListEl.appendChild(noRoomsMsg);
            return;
        }

        rooms.forEach(room => {
            const roomItem = document.createElement('li');
            roomItem.className = 'room-item';
            roomItem.dataset.roomId = room.id;

            const roomInfo = document.createElement('div');
            roomInfo.className = 'room-info';

            // Display Room ID (or name if server provides it)
            const roomIdSpan = document.createElement('span');
            roomIdSpan.innerHTML = `ID: <strong>${room.id}</strong>`;
            roomInfo.appendChild(roomIdSpan);

            // Display Player Count
            const playerCountSpan = document.createElement('span');
            // Assuming server sends playerCount like '1/2'
            const currentPlayers = room.playerCount || 0; // Default to 0 if undefined
            const maxPlayers = room.maxPlayers || 2; // Default to 2 if undefined
            playerCountSpan.innerHTML = `Players: <strong>${currentPlayers}/${maxPlayers}</strong>`;
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
        const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2'; // Use name from join section
        let password = '';

        console.log(`Attempting to join room ${roomId} from list as ${playerName}. Requires Password: ${requiresPassword}`);

        // If password is required, prompt the user or use the dedicated input field
        if (requiresPassword) {
            password = joinRoomPasswordInput.value;
            if (!password) {
                // Instead of prompt, let's use the input field and show a message if empty
                showLobbyMessage(`Room ${roomId} requires a password. Please enter it below.`, "error");
                joinRoomPasswordInput.focus();
                // Clear the room ID input when focusing on password for a listed room
                joinRoomIdInput.value = '';
                return; // Stop the joining process until password is entered
            } else {
                // Clear password field after attempting to use it
                joinRoomPasswordInput.value = '';
                 // Optionally, set the Room ID input field for consistency before sending
                 joinRoomIdInput.value = roomId;
            }
        } else {
             // Clear password field if not needed for this room
             joinRoomPasswordInput.value = '';
              // Optionally, set the Room ID input field for consistency before sending
              joinRoomIdInput.value = roomId;
        }

        showLobbyMessage(`Joining room ${roomId}...`, "info");
        disableLobbyButtons();
        // Clear the room ID input again after sending, maybe?
        // joinRoomIdInput.value = '';

        sendToServer('joinRoom', { playerName, roomId, password });
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