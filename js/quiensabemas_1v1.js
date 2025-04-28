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
    const turnIndicatorEl = document.getElementById('turnIndicator');

    // Question & Answer Areas
    const questionTextEl = document.getElementById('questionText');
    const level1InputAreaEl = document.getElementById('level1InputArea');
    const answerFormLevel1 = document.getElementById('answerFormLevel1');
    const answerInputEl = document.getElementById('answerInput');
    const level2PlusOptionsAreaEl = document.getElementById('level2PlusOptionsArea');
    const optionsContainerEl = document.getElementById('optionsContainer');
    const optionButtons = optionsContainerEl.querySelectorAll('.option'); // NodeList

    // Action Buttons
    const requestOptionsButtonEl = document.getElementById('requestOptionsButton');
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
    const playAgainButtonQSM = document.getElementById('playAgainButtonQSM');
    const backToGamesButtonQSM = document.getElementById('backToGamesButtonQSM');

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

    // --- Initialization ---
    function initializeApp() {
        console.log("Initializing Quien Sabe Más 1v1 App...");
        showLobby(); // Start in the lobby
        setupEventListeners();
        hideEndGameModal();
        initializeWebSocket(); // Connect WebSocket on app load
    }

    function showLobby() {
        lobbySectionEl.style.display = 'block';
        gameContentSectionEl.style.display = 'none';
        lobbySectionEl.classList.add('active');
        gameContentSectionEl.classList.remove('active');
        // Hide player info in header while in lobby
        player1InfoEl.style.display = 'none';
        player2InfoEl.style.display = 'none';
        clearLobbyMessage();
        enableLobbyButtons(); // Ensure buttons are enabled when returning to lobby
    }

    function showGameScreen() {
        lobbySectionEl.style.display = 'none';
        gameContentSectionEl.style.display = 'block';
        lobbySectionEl.classList.remove('active');
        gameContentSectionEl.classList.add('active');
        // Show player info in header
        player1InfoEl.style.display = 'flex'; // Or 'block' depending on your CSS
        player2InfoEl.style.display = 'flex'; // Or 'block'
    }

    function startGame() {
        console.log("Starting game (waiting for server data)...");
        // Game state is now primarily set by server messages ('gameStart', 'newQuestion')
        updatePlayerUI(); // Update with initial player data from server
        showGameScreen();
        gameState.gameActive = true;
        // Waiting message will be shown based on whose turn it is (from server)
    }

    // --- Lobby Logic ---
    function setupLobbyEventListeners() {
        createRoomButton.addEventListener('click', handleCreateRoom);
        joinRoomButton.addEventListener('click', handleJoinRoomById);
        joinRandomRoomButton.addEventListener('click', handleJoinRandomRoom);
        // Add listener for password inputs to potentially clear errors on input
        [createRoomPasswordInput, joinRoomPasswordInput].forEach(input => {
            input.addEventListener('input', clearLobbyMessage);
        });
        [createPlayerNameInput, joinPlayerNameInput, joinRoomIdInput].forEach(input => {
             input.addEventListener('input', clearLobbyMessage);
        });
    }

    function handleCreateRoom() {
        const playerName = createPlayerNameInput.value.trim() || 'Jugador 1';
        const password = createRoomPasswordInput.value; // Don't trim password
        console.log(`Requesting to create room for ${playerName}` + (password ? ' with password.' : '.'));
        showLobbyMessage("Creating room...", "info");
        disableLobbyButtons();
        sendToServer('createRoom', { playerName, password });
    }

    function handleJoinRoomById() {
        const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';
        const roomId = joinRoomIdInput.value.trim();
        const password = joinRoomPasswordInput.value; // Don't trim password

        if (!roomId) {
            showLobbyMessage("Please enter a Room ID.", "error");
            return;
        }
        console.log(`Requesting to join room ${roomId} as ${playerName}` + (password ? ' with password.' : '.'));
        showLobbyMessage(`Joining room ${roomId}...`, "info");
        disableLobbyButtons();
        sendToServer('joinRoom', { playerName, roomId, password });
    }

     function handleJoinRandomRoom() {
         const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2'; // Use the name from the join section
         console.log(`Searching for random room for ${playerName}...`);
         showLobbyMessage("Searching for an available room...", "info");
         disableLobbyButtons();
         sendToServer('joinRandomRoom', { playerName });
     }

    function showLobbyMessage(message, type = "info") { // type can be 'info', 'success', 'error'
        lobbyMessageAreaEl.textContent = message;
        lobbyMessageAreaEl.className = `lobby-message ${type}`; // Use classes for styling
    }

    function clearLobbyMessage() {
        lobbyMessageAreaEl.textContent = '';
        lobbyMessageAreaEl.className = 'lobby-message';
    }

    function disableLobbyButtons() {
        createRoomButton.disabled = true;
        joinRoomButton.disabled = true;
        joinRandomRoomButton.disabled = true;
    }

    function enableLobbyButtons() {
        createRoomButton.disabled = false;
        joinRoomButton.disabled = false;
        joinRandomRoomButton.disabled = false;
    }

    // --- Game Logic ---
    function updatePlayerUI() {
        // Determine which player is local and which is opponent based on myPlayerId
        let localPlayerKey = null;
        let opponentPlayerKey = null;

        // Ensure players object and IDs exist before accessing them
        if (gameState.players && gameState.players.player1 && gameState.players.player1.id === gameState.myPlayerId) {
            localPlayerKey = 'player1';
            opponentPlayerKey = 'player2';
        } else if (gameState.players && gameState.players.player2 && gameState.players.player2.id === gameState.myPlayerId) {
            localPlayerKey = 'player2';
            opponentPlayerKey = 'player1';
        }

        // Update UI - Assuming player1 UI elements always show local player, player2 shows opponent
        // Add checks to ensure player objects exist before accessing properties
        if (localPlayerKey && opponentPlayerKey && gameState.players && gameState.players[localPlayerKey] && gameState.players[opponentPlayerKey]) {
            player1NameEl.textContent = gameState.players[localPlayerKey].name || 'You';
            player1ScoreEl.textContent = `Score: ${gameState.players[localPlayerKey].score}`;
            player2NameEl.textContent = gameState.players[opponentPlayerKey].name || 'Opponent';
            player2ScoreEl.textContent = `Score: ${gameState.players[opponentPlayerKey].score}`;
        } else {
            // Fallback or initial state before full player data is known
            // Check if gameState.players itself exists
             const p1Name = gameState.players && gameState.players.player1 ? gameState.players.player1.name : 'Player 1';
             const p1Score = gameState.players && gameState.players.player1 ? gameState.players.player1.score : 0;
             const p2Name = gameState.players && gameState.players.player2 ? gameState.players.player2.name : 'Player 2';
             const p2Score = gameState.players && gameState.players.player2 ? gameState.players.player2.score : 0;

             player1NameEl.textContent = p1Name;
             player1ScoreEl.textContent = `Score: ${p1Score}`;
             player2NameEl.textContent = p2Name;
             player2ScoreEl.textContent = `Score: ${p2Score}`;
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
        gameState.currentQuestionData = question; // Store current question data
        questionTextEl.textContent = question.text;
        feedbackAreaEl.innerHTML = ''; // Clear previous feedback

        // Reset options/input state
        gameState.optionsRequested = false;
        requestOptionsButtonEl.classList.remove('used'); // Reset visual state if any
        fiftyFiftyButtonEl.classList.remove('used'); // Reset visual state if any
        gameState.fiftyFiftyUsed = false; // Reset fifty-fifty status for the new question

        if (question.level === 1) {
            level1InputAreaEl.classList.add('active');
            level2PlusOptionsAreaEl.classList.remove('active');
            answerInputEl.value = '';
            answerInputEl.disabled = true; // Disabled until it's our turn
            const submitBtn = answerFormLevel1.querySelector('button[type="submit"]');
             if(submitBtn) submitBtn.disabled = true;

        } else {
            level1InputAreaEl.classList.remove('active');
            level2PlusOptionsAreaEl.classList.add('active');
            optionsContainerEl.style.display = 'none'; // Options hidden initially
            optionButtons.forEach(btn => {
                btn.style.display = 'none'; // Hide all buttons initially
                btn.disabled = true;
                btn.classList.remove('selected', 'correct', 'incorrect', 'hidden'); // Reset states
                btn.querySelector('.option-text').textContent = ''; // Clear text
            });
            requestOptionsButtonEl.disabled = true; // Disabled until it's our turn
            fiftyFiftyButtonEl.disabled = true; // Disabled until options are shown & it's our turn
        }
    }

    // --- Turn & Game Flow Updates (Triggered by Server) ---
    function updateTurnIndicator() {
        if (!gameState.currentTurn || !gameState.players) { // Add check for gameState.players
            turnIndicatorEl.textContent = "Waiting for turn...";
            return;
        }
        // Add checks for player existence before accessing name
        const player1Exists = gameState.players.player1 && gameState.players.player1.id;
        const player2Exists = gameState.players.player2 && gameState.players.player2.id;

        const currentPlayer = (player1Exists && gameState.players.player1.id === gameState.currentTurn)
                            ? gameState.players.player1
                            : ((player2Exists && gameState.players.player2.id === gameState.currentTurn)
                                ? gameState.players.player2
                                : null);

        const currentPlayerName = currentPlayer ? currentPlayer.name : 'Player ?';
        turnIndicatorEl.textContent = `Turn: ${currentPlayerName}`;

        // Highlight the active player's info box
        const isP1Turn = player1Exists && gameState.players.player1.id === gameState.currentTurn;
        const isP2Turn = player2Exists && gameState.players.player2.id === gameState.currentTurn;

        // Assuming player1InfoEl ALWAYS refers to player1 from gameState, player2InfoEl to player2
        player1InfoEl.classList.toggle('active-turn', isP1Turn);
        player2InfoEl.classList.toggle('active-turn', isP2Turn);
    }


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
        showWaitingMessage("Answer submitted. Waiting for opponent/result...");
    }

    function handleLevel1Submit(event) {
        event.preventDefault();
        const playerAnswer = answerInputEl.value.trim();
        if (!playerAnswer) return; // Don't submit empty answers
        submitAnswer({ answerText: playerAnswer });
        answerInputEl.value = ''; // Clear input after submission
    }

    function handleOptionClick(event) {
        // This check might be redundant if buttons are correctly disabled, but good for safety
        if (!gameState.optionsRequested || gameState.currentTurn !== gameState.myPlayerId || !gameState.gameActive) return;

        const selectedButton = event.target.closest('.option');
        if (!selectedButton || selectedButton.disabled || selectedButton.classList.contains('hidden')) return;

        const selectedIndex = parseInt(selectedButton.getAttribute('data-index'));

        // Optional: Visually mark the selected option immediately (can be confirmed/overridden by server)
        // optionButtons.forEach(btn => btn.classList.remove('selected'));
        // selectedButton.classList.add('selected');

        submitAnswer({ selectedIndex: selectedIndex });
    }

    // --- Action Buttons Logic ---
    function handleRequestOptions() {
        if (!gameState.gameActive || gameState.currentTurn !== gameState.myPlayerId) return;
        if (gameState.currentLevel === 1 || gameState.optionsRequested) return;

        console.log("Requesting options from server...");
        sendToServer('requestOptions', {});
        requestOptionsButtonEl.disabled = true; // Disable button while waiting for server response
        requestOptionsButtonEl.classList.add('used'); // Visually indicate it's used/pending
    }

    function handleFiftyFifty() {
        if (!gameState.gameActive || gameState.currentTurn !== gameState.myPlayerId) return;
        // Can only use 50/50 if options are shown and it hasn't been used yet for this question
        if (!gameState.optionsRequested || gameState.fiftyFiftyUsed) return;

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


     function displayOptionsFromServer(options) {
         console.log("Displaying options from server:", options);
         optionsContainerEl.style.display = 'grid'; // Or 'flex', 'block' depending on CSS
         optionButtons.forEach((btn, index) => {
            if (index < options.length) {
                btn.querySelector('.option-text').textContent = options[index];
                btn.style.display = 'block'; // Show button
                btn.disabled = true; // Keep disabled until enabled by enablePlayerInput
                btn.classList.remove('hidden', 'correct', 'incorrect', 'selected'); // Reset classes
            } else {
                btn.style.display = 'none'; // Hide unused buttons
            }
         });
         gameState.optionsRequested = true; // Mark options as requested/shown
         requestOptionsButtonEl.disabled = true; // Cannot request again
         requestOptionsButtonEl.classList.add('used');

         // Re-evaluate if 50/50 button should be enabled now (if it's player's turn)
         if (gameState.currentTurn === gameState.myPlayerId && gameState.gameActive) {
             fiftyFiftyButtonEl.disabled = gameState.fiftyFiftyUsed; // Enable if not used
         }
     }

     function removeFiftyFiftyOptions(indicesToRemove) {
         console.log("Applying 50/50, removing options at indices:", indicesToRemove);
         indicesToRemove.forEach(index => {
             if (optionButtons[index]) {
                 optionButtons[index].style.display = 'none'; // Hide the button
                 optionButtons[index].classList.add('hidden'); // Add class for potential styling/logic
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
        // Level 1
        answerInputEl.disabled = true;
        const submitBtnLvl1 = answerFormLevel1.querySelector('button[type="submit"]');
        if(submitBtnLvl1) submitBtnLvl1.disabled = true;

        // Level 2+
        optionButtons.forEach(btn => btn.disabled = true);
        requestOptionsButtonEl.disabled = true;
        fiftyFiftyButtonEl.disabled = true;
    }

    function enablePlayerInput() {
        // Only enable if it's currently this player's turn AND the game is active
        if (gameState.currentTurn !== gameState.myPlayerId || !gameState.gameActive) {
             disablePlayerInput(); // Ensure everything is disabled if not our turn or game inactive
             return;
        }

        hideWaitingMessage(); // Hide waiting message when input is enabled

        // Enable based on current level and state
        if (gameState.currentQuestionData) { // Check if question data exists
            if (gameState.currentQuestionData.level === 1) {
                answerInputEl.disabled = false;
                const submitBtnLvl1 = answerFormLevel1.querySelector('button[type="submit"]');
                if(submitBtnLvl1) submitBtnLvl1.disabled = false;
                answerInputEl.focus();
            } else {
                // Level 2+
                requestOptionsButtonEl.disabled = gameState.optionsRequested; // Enable only if options not yet shown/requested

                // Enable 50/50 only if options ARE shown AND it hasn't been used for this question
                fiftyFiftyButtonEl.disabled = !gameState.optionsRequested || gameState.fiftyFiftyUsed;

                // Enable option buttons only if options are shown AND they are not hidden by 50/50
                optionButtons.forEach(btn => {
                    if (gameState.optionsRequested && !btn.classList.contains('hidden')) {
                        btn.disabled = false;
                    } else {
                        btn.disabled = true; // Keep disabled if options not shown or hidden by 50/50
                    }
                });
            }
        } else {
             console.warn("enablePlayerInput called but no currentQuestionData available.");
             disablePlayerInput(); // Keep controls disabled if no question is active
        }
    }


    // --- WebSocket Communication ---
    function initializeWebSocket() {
        // Determine WebSocket URL (adjust as needed for deployment)
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Use relative path or configure absolute path if needed
        // Assumes WS server is on same host/port and listens at the root path '/'
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        // For local development, you might use:
        // const wsUrl = 'ws://localhost:8080'; // Ensure this matches your server config

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
                break;

            case 'roomCreated': // Successfully created a room
                gameState.roomId = message.payload.roomId;
                showLobbyMessage(`Room ${gameState.roomId} created. Waiting for opponent... (ID: ${gameState.roomId})`, "success");
                // Still waiting, keep buttons disabled, show waiting state visually if needed
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
                 displayQuestion(message.payload.question); // Display the new question { level, text }
                 updateLevelAndQuestionCounter(message.payload.question.level, message.payload.questionNumber, message.payload.totalQuestionsInLevel);
                 updateTurnIndicator();

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
                 updateTurnIndicator();
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

                 // Update score in local state immediately for responsiveness (server 'updateState' should confirm)
                 // if(answeredPlayer) {
                 //     answeredPlayer.score += pointsAwarded; // Let updateState handle score updates primarily
                 // }
                 // updatePlayerUI(); // updateState will handle UI updates

                 // Show feedback (correct/incorrect message)
                 // Add correct answer text if incorrect
                 if (!isCorrect && correctAnswerText) {
                     // Show correct answer for Level 1 always, or Level 2+ only if options were shown
                     if (gameState.currentQuestionData &&
                         (gameState.currentQuestionData.level === 1 || gameState.optionsRequested)) {
                         feedbackMsg += ` Answer: ${correctAnswerText}`;
                     }
                 }
                 showFeedback(feedbackMsg, isCorrect ? 'correct' : 'incorrect');


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
                 displayOptionsFromServer(message.payload.options);
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

            default:
                 console.warn('Unknown message type received:', message.type);
        }
    }

    // --- End Game ---
    function endGame(payload) { // payload: { finalScores: {playerId1: score, playerId2: score}, winnerId: id | null, draw: boolean, reason?: string }
        console.log("Game Over. Payload:", payload);
        gameState.gameActive = false;
        disablePlayerInput();
        hideWaitingMessage();

        const finalScores = payload.finalScores;
        // Ensure myPlayerId is valid and we have score data before proceeding
        if (!gameState.myPlayerId || !finalScores || typeof finalScores !== 'object') {
             console.error("Cannot determine final scores. Invalid state or payload.", gameState, payload);
             showEndGameModalWithError("Error calculating results.");
             return;
         }

        const myScore = finalScores[gameState.myPlayerId] !== undefined ? finalScores[gameState.myPlayerId] : 'N/A';
        const opponentId = Object.keys(finalScores).find(id => id !== gameState.myPlayerId);
        const opponentScore = opponentId && finalScores[opponentId] !== undefined ? finalScores[opponentId] : 'N/A';

         // Get names safely, falling back to defaults, using the last known state
        let myName = 'You';
        let opponentName = 'Opponent';
        if (gameState.players && gameState.players.player1 && gameState.players.player1.id === gameState.myPlayerId) myName = gameState.players.player1.name;
        else if (gameState.players && gameState.players.player2 && gameState.players.player2.id === gameState.myPlayerId) myName = gameState.players.player2.name;

        if (opponentId && gameState.players && gameState.players.player1 && gameState.players.player1.id === opponentId) opponentName = gameState.players.player1.name;
        else if (opponentId && gameState.players && gameState.players.player2 && gameState.players.player2.id === opponentId) opponentName = gameState.players.player2.name;


        let title = "";
        let message = `Final Score: ${myName} ${myScore} - ${opponentName} ${opponentScore}`;

        if (payload.draw) {
            title = "It's a Draw!";
        } else if (payload.winnerId === gameState.myPlayerId) {
            title = `You Won, ${myName}!`;
        } else if (opponentId && payload.winnerId === opponentId) {
            title = `${opponentName} Won!`;
            // message += ". Better luck next time!"; // Keep message shorter
        } else {
            // Handle cases like disconnect where winner might be null but not a draw
             title = "Game Over";
             if (payload.reason) { // Optional reason from server (e.g., "Opponent disconnected")
                 message = payload.reason;
             } else {
                 // Default message if no specific reason given
                 message = `Final Score: ${myName} ${myScore} - ${opponentName} ${opponentScore}`;
             }
        }

        resultTitleEl.textContent = title;
        resultMessageEl.textContent = message;
        // Assuming finalPlayer1ScoreEl shows YOUR score and finalPlayer2ScoreEl shows OPPONENT's score
        finalPlayer1ScoreEl.textContent = myScore;
        finalPlayer2ScoreEl.textContent = opponentScore;

        showEndGameModal();
    }

    function showEndGameModal() {
        endGameModalEl.classList.add('active');
    }

     function showEndGameModalWithError(reason) {
         resultTitleEl.textContent = "Game Over";
         resultMessageEl.textContent = reason || "An error occurred.";
         // Try to display last known scores if available
         const myScore = gameState.myPlayerId && gameState.players && gameState.players[gameState.myPlayerId === gameState.players.player1.id ? 'player1' : 'player2']
                        ? gameState.players[gameState.myPlayerId === gameState.players.player1.id ? 'player1' : 'player2'].score
                        : 'N/A';
         const opponentId = gameState.myPlayerId && gameState.players
                            ? Object.keys(gameState.players).find(key => gameState.players[key] && gameState.players[key].id !== gameState.myPlayerId)
                            : null;
         const opponentScore = opponentId && gameState.players[opponentId]
                               ? gameState.players[opponentId].score
                               : 'N/A';

         finalPlayer1ScoreEl.textContent = myScore;
         finalPlayer2ScoreEl.textContent = opponentScore;
         showEndGameModal();
     }


    function hideEndGameModal() {
        endGameModalEl.classList.remove('active');
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        setupLobbyEventListeners(); // Sets up lobby button listeners

        // Game Listeners
        answerFormLevel1.addEventListener('submit', handleLevel1Submit);
        optionButtons.forEach(button => {
            button.addEventListener('click', handleOptionClick);
        });
        requestOptionsButtonEl.addEventListener('click', handleRequestOptions);
        fiftyFiftyButtonEl.addEventListener('click', handleFiftyFifty);

        // Modal Buttons
        playAgainButtonQSM.addEventListener('click', () => {
            hideEndGameModal();
            showLobby(); // Go back to lobby, WS connection should persist if server is up
             // Reset local state? Better to let server send fresh 'gameStart' if playing again.
             gameState.gameActive = false; // Ensure game is marked inactive
             // Consider sending a 'leaveRoom' message to server if needed
             // Or just rely on server cleanup / new room creation flow
        });
        backToGamesButtonQSM.addEventListener('click', () => {
            // Navigate back to a main games page if applicable
            window.location.href = 'games.html'; // Adjust if needed
        });
    }

    // --- Start App ---
    initializeApp(); // Start with the lobby and WebSocket connection

});