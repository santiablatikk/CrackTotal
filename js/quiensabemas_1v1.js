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
        optionsRequested: true, // Options are always considered "requested" or available now
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
    const questionCounterEl = document.getElementById('questionCounter');

    // Question & Answer Areas
    const questionTextEl = document.getElementById('questionText');
    const level2PlusOptionsAreaEl = document.getElementById('level2PlusOptionsArea'); // This is now the main options area
    const optionsContainerEl = document.getElementById('optionsContainer');
    const optionButtons = optionsContainerEl.querySelectorAll('.option'); // NodeList

    // Action Buttons
    const fiftyFiftyButtonEl = document.getElementById('fiftyFiftyButton');

    // Feedback & Waiting Areas
    const feedbackAreaEl = document.getElementById('feedbackArea');
    const waitingAreaEl = document.getElementById('waitingArea'); // To show waiting messages

    // End Game Modal
    const endGameModalEl = document.getElementById('endGameModal');
    const resultTitleEl = document.getElementById('resultTitle');
    const resultMessageEl = document.getElementById('resultMessage');
    const resultStatsEl = document.getElementById('resultStats');
    const playAgainButtonQSM = document.getElementById('playAgainButtonQSM');
    const backToLobbyButtonQSM = document.getElementById('backToLobbyButtonQSM');

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
    const playersHeaderInfoEl = document.getElementById('playersHeaderInfo');

    // --- Initialization ---
    function initializeApp() {
        console.log("Initializing Quien Sabe Más 1v1 App...");
        showLobby();
        setupEventListeners();
        hideEndGameModal();

        const savedPlayerName = sessionStorage.getItem('playerName');
        if (savedPlayerName) {
            if (createPlayerNameInput) createPlayerNameInput.value = savedPlayerName;
            if (joinPlayerNameInput) joinPlayerNameInput.value = savedPlayerName;
            console.log(`Prefilled player name: ${savedPlayerName}`);
        }
        initializeWebSocket();
    }

    // --- Helper function to normalize text ---
    // function normalizeText(text) { // No longer needed client-side for answer checking
    //     if (typeof text !== 'string') return '';
    //     return text.toLowerCase()
    //                .normalize("NFD")
    //                .replace(/\u0300-\u036f/g, "");
    // }
    // --- End Helper ---

    function showLobby() {
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

    function startGame() {
        console.log("Starting game (waiting for server data)...");
        updatePlayerUI();
        showGameScreen();
        gameState.gameActive = true;
    }

    // --- Lobby Logic ---
    function setupLobbyEventListeners() {
        if (createRoomButton) createRoomButton.addEventListener('click', handleCreateRoom);
        if (joinRoomButton) joinRoomButton.addEventListener('click', handleJoinRoomById);
        if (joinRandomRoomButton) joinRandomRoomButton.addEventListener('click', handleJoinRandomRoom);
        [createRoomPasswordInput, joinRoomPasswordInput].forEach(input => {
            if(input) input.addEventListener('input', clearLobbyMessage);
        });
        [createPlayerNameInput, joinPlayerNameInput, joinRoomIdInput].forEach(input => {
            if(input) input.addEventListener('input', clearLobbyMessage);
        });
    }

    function handleCreateRoom() {
        if (!createRoomButton || createRoomButton.disabled) return;
        const playerName = createPlayerNameInput.value.trim() || 'Jugador 1';
        const password = createRoomPasswordInput.value;
        showLobbyMessage("Creando sala...", "info");
        disableLobbyButtons(true);
        sendToServer('createRoom', { playerName, password });
    }

    function handleJoinRoomById() {
        if (!joinRoomButton || joinRoomButton.disabled) return;
        const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';
        const roomId = joinRoomIdInput.value.trim();
        const password = joinRoomPasswordInput.value;
        if (!roomId) {
            showLobbyMessage("Por favor, poné un ID de sala.", "error");
            return;
        }
        showLobbyMessage(`Uniéndote a la sala ${roomId}...`, "info");
        disableLobbyButtons(false, true);
        sendToServer('joinRoom', { playerName, roomId, password });
    }

     function handleJoinRandomRoom() {
         if (!joinRandomRoomButton || joinRandomRoomButton.disabled) return;
         const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';
         showLobbyMessage("Buscando una sala disponible...", "info");
         disableLobbyButtons(false, false, true);
         sendToServer('joinRandomRoom', { playerName });
     }

    function showLobbyMessage(message, type = "info", persistent = false) {
        if (!lobbyMessageAreaEl) return;
        lobbyMessageAreaEl.textContent = message;
        lobbyMessageAreaEl.className = 'lobby-message';
        void lobbyMessageAreaEl.offsetWidth;
        lobbyMessageAreaEl.classList.add(type);
        lobbyMessageAreaEl.classList.add('show');
        if (!persistent && (type === 'success' || type === 'info')) {
            setTimeout(() => {
                if (lobbyMessageAreaEl.textContent === message) {
                    clearLobbyMessage();
                }
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
         }, 500);
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

    // --- Game Logic ---
    function updatePlayerUI() {
        if (!gameState.players || !gameState.myPlayerId) return;

        const player1 = gameState.players.player1;
        const player2 = gameState.players.player2;
        const localPlayer = player1?.id === gameState.myPlayerId ? player1 : (player2?.id === gameState.myPlayerId ? player2 : null);
        const opponentPlayer = player1?.id !== gameState.myPlayerId ? player1 : (player2?.id !== gameState.myPlayerId ? player2 : null);

        if (playersHeaderInfoEl && localPlayer && opponentPlayer) {
            const localNameEl = playersHeaderInfoEl.querySelector('.local-player .player-name');
            const localScoreEl = playersHeaderInfoEl.querySelector('.local-player .score');
            const opponentNameEl = playersHeaderInfoEl.querySelector('.opponent-player .player-name');
            const opponentScoreEl = playersHeaderInfoEl.querySelector('.opponent-player .score');

            if (localNameEl) localNameEl.textContent = localPlayer.name || 'Tú';
            if (localScoreEl) localScoreEl.textContent = `Score: ${localPlayer.score || 0}`;
            if (opponentNameEl) opponentNameEl.textContent = opponentPlayer.name || 'Oponente';
            if (opponentScoreEl) opponentScoreEl.textContent = `Score: ${opponentPlayer.score || 0}`;

            const localPlayerBox = playersHeaderInfoEl.querySelector('.local-player');
            const opponentPlayerBox = playersHeaderInfoEl.querySelector('.opponent-player');
            if (localPlayerBox) localPlayerBox.classList.toggle('active-turn', localPlayer.id === gameState.currentTurn);
            if (opponentPlayerBox) opponentPlayerBox.classList.toggle('active-turn', opponentPlayer.id === gameState.currentTurn);

        } else if (playersHeaderInfoEl) {
             const localNameEl = playersHeaderInfoEl.querySelector('.local-player .player-name');
             const localScoreEl = playersHeaderInfoEl.querySelector('.local-player .score');
             const opponentNameEl = playersHeaderInfoEl.querySelector('.opponent-player .player-name');
             const opponentScoreEl = playersHeaderInfoEl.querySelector('.opponent-player .score');
             if (localNameEl) localNameEl.textContent = 'Esperando...';
             if (localScoreEl) localScoreEl.textContent = 'Score: 0';
             if (opponentNameEl) opponentNameEl.textContent = 'Esperando...';
             if (opponentScoreEl) opponentScoreEl.textContent = 'Score: 0';
        }
    }

    // --- Question Display (Triggered by Server) ---
    function displayQuestion(question) {
        if (!question) {
            console.error("displayQuestion called without question data.");
            questionTextEl.textContent = "Error loading question.";
            return;
        }
        console.log("Displaying question:", question);
        gameState.currentQuestionData = question;
        questionTextEl.textContent = question.text;
        feedbackAreaEl.innerHTML = '';

        gameState.optionsRequested = true; // Always true now
        fiftyFiftyButtonEl.classList.remove('used');
        gameState.fiftyFiftyUsed = false;

        level2PlusOptionsAreaEl.classList.add('active');
        optionsContainerEl.style.display = 'grid';
        optionButtons.forEach(btn => {
            btn.style.display = 'flex';
            btn.disabled = true;
            btn.classList.remove('selected', 'correct', 'incorrect', 'hidden');
            btn.querySelector('.option-text').textContent = '';
        });
        
        fiftyFiftyButtonEl.style.display = 'inline-flex';
        fiftyFiftyButtonEl.disabled = true;

        if (question.opciones && question.opciones.length > 0) {
            displayOptionsFromServer(question.opciones);
        } else {
            console.warn("Question received without 'opciones' field. Options will be empty.");
             optionButtons.forEach((btn) => {
                btn.querySelector('.option-text').textContent = '';
                btn.style.display = 'none';
            });
        }
    }

    // --- Turn & Game Flow Updates (Triggered by Server) ---
    function updateLevelAndQuestionCounter(level, qNum = null, qTotal = null) {
        gameState.currentLevel = level;
        gameLevelDisplayEl.textContent = `Nivel ${gameState.currentLevel}`;
        if (qNum !== null && qTotal !== null) {
            questionCounterEl.textContent = `Pregunta ${qNum}/${qTotal}`;
        } else {
             questionCounterEl.textContent = '';
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
        disablePlayerInput();
        showWaitingMessage("Respuesta enviada. Esperando oponente/resultado...");
    }

    function handleOptionClick(event) {
        if (gameState.currentTurn !== gameState.myPlayerId || !gameState.gameActive) return;

        const selectedButton = event.target.closest('.option');
        if (!selectedButton || selectedButton.disabled || selectedButton.classList.contains('hidden')) return;

        const selectedIndex = parseInt(selectedButton.getAttribute('data-index'));
        submitAnswer({ selectedIndex: selectedIndex });
    }

    // --- Action Buttons Logic ---
    function handleFiftyFifty() {
        if (!gameState.gameActive || gameState.currentTurn !== gameState.myPlayerId) return;
        if (gameState.fiftyFiftyUsed) return; // fiftyFiftyUsed implies optionsRequested is true

        console.log("Requesting 50/50 from server...");
        sendToServer('requestFiftyFifty', {});
        fiftyFiftyButtonEl.disabled = true;
        fiftyFiftyButtonEl.classList.add('used');
    }

    // --- UI Updates & Feedback ---
    function showFeedback(message, type) { // type = 'correct' or 'incorrect'
        feedbackAreaEl.innerHTML = `<span class="feedback-message ${type}">${message}</span>`;
    }

     function visualizeAnswerOptions(selectedIndex, correctIndex, isLocalPlayerCorrect) {
         if (gameState.currentQuestionData && gameState.optionsRequested) { // gameState.optionsRequested is always true
             optionButtons.forEach((btn, index) => {
                 btn.classList.remove('selected');
                 if (index === correctIndex) {
                     btn.classList.add('correct');
                 }
                 if (index === selectedIndex && !isLocalPlayerCorrect) {
                     btn.classList.add('incorrect');
                 }
                 btn.disabled = true;
             });
         }
     }

     function displayOptionsFromServer(options) {
         console.log("Displaying options from server:", options);
         optionsContainerEl.style.display = 'grid';
         optionButtons.forEach((btn, index) => {
            if (index < options.length) {
                btn.querySelector('.option-text').textContent = options[index];
                btn.style.display = 'flex';
                btn.disabled = true;
                btn.classList.remove('hidden', 'correct', 'incorrect', 'selected');
            } else {
                btn.style.display = 'none';
            }
         });
         gameState.optionsRequested = true; // Remains true

         if (gameState.currentTurn === gameState.myPlayerId && gameState.gameActive) {
             fiftyFiftyButtonEl.disabled = gameState.fiftyFiftyUsed;
         }
     }

     function removeFiftyFiftyOptions(indicesToRemove) {
         console.log("Applying 50/50, removing options at indices:", indicesToRemove);
         indicesToRemove.forEach(index => {
             if (optionButtons[index]) {
                 optionButtons[index].style.display = 'none';
                 optionButtons[index].classList.add('hidden');
                 optionButtons[index].disabled = true;
             }
         });
         gameState.fiftyFiftyUsed = true;
         fiftyFiftyButtonEl.disabled = true;
         fiftyFiftyButtonEl.classList.add('used');
     }

    function showError(message) {
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
        optionButtons.forEach(btn => btn.disabled = true);
        fiftyFiftyButtonEl.disabled = true;
    }

    function enablePlayerInput() {
        if (gameState.currentTurn !== gameState.myPlayerId || !gameState.gameActive) {
             disablePlayerInput();
             return;
        }
        hideWaitingMessage();

        if (gameState.currentQuestionData) {
            const optionsAreVisible = gameState.optionsRequested; // Always true

            fiftyFiftyButtonEl.disabled = !optionsAreVisible || gameState.fiftyFiftyUsed;
            fiftyFiftyButtonEl.classList.toggle('used', gameState.fiftyFiftyUsed);

            optionButtons.forEach(btn => {
                btn.disabled = !optionsAreVisible || btn.classList.contains('hidden');
            });
        } else {
             console.warn("enablePlayerInput called but no currentQuestionData available.");
             disablePlayerInput();
        }
    }

    // --- WebSocket Communication ---
    function initializeWebSocket() {
        const wsUrl = WEBSOCKET_URL;
        console.log(`Attempting to connect WebSocket: ${wsUrl}`);
        if (gameState.websocket && gameState.websocket.readyState !== WebSocket.CLOSED && gameState.websocket.readyState !== WebSocket.CLOSING) {
            console.log("Closing previous WebSocket connection.");
            gameState.websocket.onclose = null;
            gameState.websocket.close();
        }
        try {
            gameState.websocket = new WebSocket(wsUrl);
        } catch (error) {
             console.error("Failed to create WebSocket:", error);
             showLobbyMessage("Failed to initialize connection. Please check console and refresh.", "error");
             disableLobbyButtons();
             return;
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
            if (gameState.gameActive) {
                showError("Connection error. Please return to lobby.");
            } else {
                showLobbyMessage("Server connection error. Please refresh or try again later.", "error");
            }
             disableLobbyButtons();
             if(gameState.gameActive) disablePlayerInput();
        };
        gameState.websocket.onclose = (event) => {
            console.log('WebSocket Disconnected:', event.reason, `Code: ${event.code}`, `WasClean: ${event.wasClean}`);
            const wasConnected = !!gameState.websocket;
            gameState.websocket = null;
            if (gameState.gameActive) {
                 showError("Lost connection to the server. Game ended.");
                 gameState.gameActive = false;
                 disablePlayerInput();
                 showEndGameModalWithError("Connection Lost");
            } else if (wasConnected) {
                showLobbyMessage("Disconnected from server. Please refresh to reconnect.", "error");
                 disableLobbyButtons();
            }
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
            if (gameState.gameActive) {
                 showError("Not connected to server. Cannot send message.");
            } else {
                 showLobbyMessage("Not connected. Please refresh.", "error");
            }
        }
    }

    // --- Message Handling ---
    function handleServerMessage(message) {
        if (message.type !== 'playerDisconnect' && message.type !== 'updateState') {
            hideWaitingMessage();
        }

        switch (message.type) {
            case 'yourInfo':
                gameState.myPlayerId = message.payload.playerId;
                console.log(`Assigned Player ID: ${gameState.myPlayerId}`);
                const creatorPlayerName = createPlayerNameInput?.value || joinPlayerNameInput?.value;
                if (creatorPlayerName) {
                    sessionStorage.setItem('playerName', creatorPlayerName);
                }
                break;
            case 'roomCreated':
                gameState.roomId = message.payload.roomId;
                gameState.players.player1 = {
                    id: gameState.myPlayerId,
                    name: createPlayerNameInput.value.trim() || 'Jugador 1',
                    score: 0
                };
                gameState.players.player2 = null;
                showGameScreen();
                updatePlayerUI();
                questionTextEl.textContent = '';
                level2PlusOptionsAreaEl.classList.remove('active');
                showWaitingMessage(`Room ${gameState.roomId} created. Waiting for opponent...`);
                disablePlayerInput();
                break;
            case 'joinSuccess':
                gameState.roomId = message.payload.roomId;
                 if (message.payload.players) {
                    gameState.players = message.payload.players;
                 }
                 showLobbyMessage(`Joined room ${gameState.roomId}! Waiting for game to start...`, "success");
                 break;
             case 'joinError':
                 showLobbyMessage(message.payload.error || "Error joining/creating room.", "error");
                 enableLobbyButtons();
                 break;
             case 'randomJoinSuccess':
                 gameState.roomId = message.payload.roomId;
                  if (message.payload.players) {
                     gameState.players = message.payload.players;
                 }
                 showLobbyMessage(`Joined random room ${gameState.roomId}! Waiting for game to start...`, "success");
                 break;
             case 'randomJoinError':
                 showLobbyMessage(message.payload.error || "No suitable random rooms available.", "error");
                 enableLobbyButtons();
                 break;
            case 'gameStart':
                 gameState.players = message.payload.players;
                 gameState.currentTurn = message.payload.startingPlayerId;
                 console.log("Received gameStart:", message.payload);
                 startGame();
                 showWaitingMessage("Game starting! Waiting for first question...");
                 break;
            case 'newQuestion':
                 if (!gameState.gameActive) {
                    console.log("Received newQuestion while game not marked active. Activating game screen.");
                    showGameScreen();
                    gameState.gameActive = true;
                 }
                 if(message.payload.players) gameState.players = message.payload.players;
                 gameState.currentTurn = message.payload.currentTurn;
                 updatePlayerUI();
                 displayQuestion(message.payload.question);
                 updateLevelAndQuestionCounter(message.payload.question.level, message.payload.questionNumber, message.payload.totalQuestionsInLevel);

                 if (gameState.currentTurn === gameState.myPlayerId) {
                     console.log("It's my turn. Enabling input.");
                     enablePlayerInput();
                     hideWaitingMessage();
                 } else {
                     console.log("It's opponent's turn. Disabling input.");
                     showWaitingMessage("Opponent's turn...");
                     disablePlayerInput();
                 }
                 break;
            case 'updateState':
                 console.log("Received updateState:", message.payload);
                 gameState.currentTurn = message.payload.currentTurn;
                 gameState.players = message.payload.players;
                 updatePlayerUI();

                 if (gameState.gameActive) {
                     if (gameState.currentTurn === gameState.myPlayerId) {
                         hideWaitingMessage();
                         console.log("State updated, now my turn (waiting for new question?)");
                     } else {
                         disablePlayerInput();
                         showWaitingMessage("Opponent's turn...");
                         console.log("State updated, now opponent's turn.");
                     }
                 }
                 break;
            case 'answerResult':
                 console.log("Received answerResult:", message.payload);
                 const { isCorrect, pointsAwarded, correctAnswerText, forPlayerId, selectedIndex, correctIndex } = message.payload;

                 let answeredPlayer = null;
                 if(gameState.players && gameState.players.player1 && gameState.players.player1.id === forPlayerId) {
                     answeredPlayer = gameState.players.player1;
                 } else if (gameState.players && gameState.players.player2 && gameState.players.player2.id === forPlayerId) {
                     answeredPlayer = gameState.players.player2;
                 }
                 const playerName = answeredPlayer ? answeredPlayer.name : 'Player';
                 let feedbackMsg = `${playerName} answered: ${isCorrect ? 'Correct!' : 'Incorrect.'} ${pointsAwarded > 0 ? `(+${pointsAwarded} points)` : ''}`;
                 
                 if (!isCorrect && correctAnswerText) {
                    feedbackMsg += ` Answer: ${correctAnswerText}`;
                 }
                 showFeedback(feedbackMsg, isCorrect ? 'correct' : 'incorrect');

                 if (gameState.currentQuestionData && gameState.optionsRequested) {
                    visualizeAnswerOptions(selectedIndex, correctIndex, isCorrect);
                    optionButtons.forEach(btn => btn.disabled = true);
                 }
                 disablePlayerInput();
                 showWaitingMessage("Waiting for next turn...");
                 break;
            case 'optionsProvided':
                 console.log("Received (potentially unexpected) optionsProvided:", message.payload);
                 displayOptionsFromServer(message.payload.options);
                 if (gameState.currentTurn === gameState.myPlayerId && gameState.gameActive) {
                     enablePlayerInput();
                     hideWaitingMessage();
                 }
                 break;
            case 'fiftyFiftyApplied':
                 console.log("Received fiftyFiftyApplied:", message.payload);
                 removeFiftyFiftyOptions(message.payload.optionsToRemove);
                 if (gameState.currentTurn === gameState.myPlayerId && gameState.gameActive) {
                     enablePlayerInput();
                 }
                 break;
            case 'gameOver':
                 console.log("Received gameOver:", message.payload);
                 gameState.gameActive = false;
                 disablePlayerInput();
                 hideWaitingMessage();
                 endGame(message.payload);
                 break;
            case 'playerDisconnect':
                 console.log("Received playerDisconnect:", message.payload);
                 showError(`${message.payload.disconnectedPlayerName || 'Opponent'} disconnected.`);
                 showWaitingMessage("Opponent disconnected. Waiting for server update...");
                 disablePlayerInput();
                 break;
            case 'errorMessage':
                 console.error("Received errorMessage:", message.payload);
                 if (gameState.gameActive) {
                     showError(message.payload.error || "An error occurred during the game.");
                     disablePlayerInput();
                 } else {
                     showLobbyMessage(message.payload.error || "An error occurred.", "error");
                     enableLobbyButtons();
                 }
                 break;
            case 'availableRooms':
                console.log("Received availableRooms:", message.payload.rooms);
                renderAvailableRooms(message.payload.rooms);
                 break;
            default:
                 console.warn('Unknown message type received:', message.type);
        }
    }

    // --- End Game ---
    function endGame(payload) {
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

        let myFinalScore = 'N/A';
        let opponentFinalScore = 'N/A';
        let opponentId = null;

        for (const playerId in finalScores) {
            if (playerId === gameState.myPlayerId) {
                myFinalScore = finalScores[playerId];
            } else {
                opponentFinalScore = finalScores[playerId];
                opponentId = playerId;
            }
        }

        let myName = 'Tú';
        let opponentName = 'Oponente';
        const player1 = gameState.players?.player1;
        const player2 = gameState.players?.player2;
        if (player1?.id === gameState.myPlayerId) myName = player1.name || myName;
        else if (player2?.id === gameState.myPlayerId) myName = player2.name || myName;

        if (player1?.id === opponentId) opponentName = player1.name || opponentName;
        else if (player2?.id === opponentId) opponentName = player2.name || opponentName;

        let title = "";
        let message = payload.reason || "";

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
             if (!message) message = "La partida ha finalizado.";
        }

        resultTitleEl.textContent = title;
        resultMessageEl.textContent = message;

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
        setupLobbyEventListeners();

        // Game Listeners
        optionButtons.forEach(button => {
            button.addEventListener('click', handleOptionClick);
        });
        fiftyFiftyButtonEl.addEventListener('click', handleFiftyFifty);

        // Modal Buttons
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
    }

    // --- Lobby Room List Rendering ---
    function renderAvailableRooms(rooms) {
        if (!availableRoomsListEl) {
            console.error("Available rooms list element not found.");
            return;
        }
        availableRoomsListEl.innerHTML = '';
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
            const roomIdSpan = document.createElement('span');
            roomIdSpan.innerHTML = `ID: <strong>${room.id}</strong>`;
            roomInfo.appendChild(roomIdSpan);
            const playerCountSpan = document.createElement('span');
            const currentPlayers = room.playerCount || 0;
            const maxPlayers = room.maxPlayers || 2;
            playerCountSpan.innerHTML = `Players: <strong>${currentPlayers}/${maxPlayers}</strong>`;
            roomInfo.appendChild(playerCountSpan);
            if (room.requiresPassword) {
                 const passwordSpan = document.createElement('span');
                 passwordSpan.innerHTML = `<strong><i class="fas fa-lock"></i> Private</strong>`;
                 roomInfo.appendChild(passwordSpan);
            }
            roomItem.appendChild(roomInfo);
            const joinButton = document.createElement('button');
            joinButton.className = 'secondary-button lobby-button join-room-list-btn';
            joinButton.textContent = 'Join';
            joinButton.disabled = currentPlayers >= maxPlayers;
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
        let password = '';
        console.log(`Attempting to join room ${roomId} from list as ${playerName}. Requires Password: ${requiresPassword}`);
        if (requiresPassword) {
            password = joinRoomPasswordInput.value;
            if (!password) {
                showLobbyMessage(`Room ${roomId} requires a password. Please enter it below.`, "error");
                joinRoomPasswordInput.focus();
                joinRoomIdInput.value = '';
                return;
            } else {
                joinRoomPasswordInput.value = '';
                 joinRoomIdInput.value = roomId;
            }
        } else {
             joinRoomPasswordInput.value = '';
              joinRoomIdInput.value = roomId;
        }
        showLobbyMessage(`Joining room ${roomId}...`, "info");
        disableLobbyButtons();
        sendToServer('joinRoom', { playerName, roomId, password });
    }

    // --- Start App ---
    initializeApp();

});