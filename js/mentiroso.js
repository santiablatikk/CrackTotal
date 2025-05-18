// Mentiroso Game Logic
console.log("Mentiroso JS loaded");

document.addEventListener('DOMContentLoaded', () => {
    // Try to get player name from localStorage and prefill
    const savedPlayerName = localStorage.getItem('playerName');
    const playerNameMentirosoInput = document.getElementById('playerNameMentiroso');
    if (savedPlayerName && playerNameMentirosoInput) {
        playerNameMentirosoInput.value = savedPlayerName;
    }

    // WebSocket connection
    // For local development: 'ws://localhost:8081'
    // For Render deployment, it will derive from window.location
    const WS_URL = window.location.protocol === 'https:' ? 
                   'wss://' + window.location.host.replace(/ ?: \d{4}$/, '') : 
                   'ws://localhost:8081';
    let ws = null;

    // Screen elements - ensure these IDs exist in mentiroso.html
    const initialScreen = document.getElementById('initialScreenMentiroso'); // Screen for player name input & connect button
    const matchmakingScreen = document.getElementById('matchmakingScreenMentiroso'); // Lobby screen
    const gameplayScreen = document.getElementById('gameplayScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    
    // Lobby elements
    const playerNameInput = document.getElementById('playerNameMentiroso');
    const connectMentirosoButton = document.getElementById('connectMentirosoButton');
    const createRoomButton = document.getElementById('createRoomMentiroso');
    const roomPasswordInput = document.getElementById('roomPasswordMentiroso');
    const joinRoomByIdButton = document.getElementById('joinRoomByIdMentiroso');
    const roomIdInput = document.getElementById('roomIdMentiroso');
    const joinRandomRoomButton = document.getElementById('joinRandomRoomMentiroso');
    const availableRoomsContainer = document.getElementById('availableRoomsMentiroso');
    const lobbyErrorContainer = document.getElementById('lobbyErrorMentiroso'); // For displaying lobby errors

    // Gameplay elements
    const leaveRoomButton = document.getElementById('leaveRoomButtonMentiroso'); // Changed from cancelMatchmakingButton
    const playerNameHeader = document.getElementById('playerNameHeader');
    const opponentNameHeader = document.getElementById('opponentNameHeader'); 
    const turnIndicator = document.getElementById('turnIndicator'); 

    const challengeTextEl = document.getElementById('challengeText');
    const declarationsListEl = document.getElementById('declarationsList');
    const declarationAmountInput = document.getElementById('declarationAmount');
    const declareButton = document.getElementById('declareButton');
    const liarButton = document.getElementById('liarButton');
    const playerActionsContainer = document.getElementById('playerActions'); // Container for declare/liar buttons

    const demonstrationContainer = document.getElementById('demonstrationContainer');
    const timerDisplay = document.getElementById('timerDisplay');
    const demonstrationChallengeTextEl = document.getElementById('demonstrationChallengeText');
    const demonstrationInput = document.getElementById('demonstrationInput'); // Textarea for list type
    const structuredQuestionsContainer = document.getElementById('structuredQuestionsContainer'); // For structured Qs
    const submitDemonstrationButton = document.getElementById('submitDemonstrationButton');

    const roundResultScreen = document.getElementById('roundResultScreen');
    const roundResultMessageEl = document.getElementById('roundResultMessage');
    const nextRoundButton = document.getElementById('nextRoundButton'); // May not be needed if server controls flow
    
    const gameOverMessageEl = document.getElementById('gameOverMessage');
    const winnerNameEl = document.getElementById('winnerName');
    const playAgainButtonMentiroso = document.getElementById('playAgainButtonMentiroso'); 
    const temporaryFeedbackElement = document.getElementById('temporaryFeedbackMentiroso');

    // --- Global Game State (Client-side) ---
    let playerId = null;        
    let roomId = null;          
    let playerName = "Jugador"; 
    let opponentName = "Oponente";
    let isMyTurn = false;
    let currentChallengeData = null; 
    let localDeclarations = []; 
    let demonstrationTimerInterval = null;
    let demonstrationTimeLeft = 0;
    let playerScores = { p1: 0, p2: 0 }; // Store player scores locally for UI update

    // --- WebSocket Setup ---
    function connectWebSocket() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected.');
            showScreen(matchmakingScreen); // Already connected, go to lobby
            sendMessage('requestAvailableRooms', { gameType: 'mentiroso' }); // Request rooms on re-entry to lobby
            return;
        }
        console.log(`Attempting to connect to WebSocket server at ${WS_URL}...`);
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('Connected to WebSocket server.');
            lobbyErrorContainer.textContent = ''; // Clear any previous connection errors
            playerName = playerNameInput.value.trim() || "Jugador Anónimo";
            // Server will send 'yourInfo' with playerId. Then we can request rooms.
            // showScreen(matchmakingScreen); // Wait for 'yourInfo' before fully entering lobby
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('Message from server:', message);
                handleServerMessage(message); 
            } catch (error) {
                console.error('Error parsing message from server:', error, "Raw data:", event.data);
                showTemporaryFeedback("Error procesando mensaje del servidor.", "error");
            }
        };

        ws.onclose = (event) => {
            console.log('Disconnected from WebSocket server:', event.code, event.reason);
            ws = null;
            showScreen(initialScreen);
            lobbyErrorContainer.textContent = "Desconectado del servidor. Intenta reconectar.";
            alert("Desconectado del servidor. Serás devuelto a la pantalla inicial.");
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            lobbyErrorContainer.textContent = 'Error de conexión. Asegúrate que el servidor esté corriendo.';
            if (matchmakingScreen.classList.contains('active') || gameplayScreen.classList.contains('active')) {
                 alert("Error de conexión con el servidor del juego.");
            }
            // Optionally try to close and nullify ws here to allow fresh connect attempt
            if(ws) { try { ws.close(); } catch(e){} ws = null; }
            showScreen(initialScreen);
        };
    }
    
    function sendMessage(type, payload) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const message = { type, payload };
            ws.send(JSON.stringify(message));
            console.log('Sent to server:', message);
        } else {
            console.warn('WebSocket not connected. Cannot send message:', type, payload);
            showTemporaryFeedback("No estás conectado al servidor.", "error");
            // Go to initial screen if ws is broken
            if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
                showScreen(initialScreen);
                lobbyErrorContainer.textContent = "Conexión perdida. Por favor, reconecta.";
            }
        }
    }

    // --- Screen Management ---
    const allScreens = [initialScreen, matchmakingScreen, gameplayScreen, gameOverScreen, roundResultScreen, demonstrationContainer];
    
    function showScreen(screenToShow) {
        allScreens.forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        if (screenToShow) {
            screenToShow.classList.add('active');
        }
        // Special handling for sections within gameplayScreen
        if (screenToShow === gameplayScreen) {
            if(demonstrationContainer) demonstrationContainer.classList.remove('active');
            if(roundResultScreen) roundResultScreen.classList.remove('active');
            if(playerActionsContainer) playerActionsContainer.classList.add('active'); // Show player actions by default
        } else if (screenToShow === demonstrationContainer || screenToShow === roundResultScreen) {
            if(gameplayScreen) gameplayScreen.classList.add('active'); // Keep gameplay screen as background
            if(playerActionsContainer) playerActionsContainer.classList.remove('active'); // Hide player actions during demo/result
        }
    }

    // --- Initial Setup & Event Listeners for Lobby ---
    if (connectMentirosoButton) {
        connectMentirosoButton.addEventListener('click', () => {
            playerName = playerNameInput.value.trim();
            if (!playerName) {
                alert("Por favor, ingresa tu nombre para jugar.");
                if(lobbyErrorContainer) lobbyErrorContainer.textContent = "Por favor, ingresa tu nombre.";
                return;
            }
            if(lobbyErrorContainer) lobbyErrorContainer.textContent = "Conectando...";
            connectWebSocket();
        });
    }

    if (createRoomButton) {
        createRoomButton.addEventListener('click', () => {
            const password = roomPasswordInput.value;
            // Ensure player name is set (e.g., from previous input or a default)
            if (!playerName && playerNameInput) playerName = playerNameInput.value.trim() || "Jugador Anónimo";
            if (!playerId) {
                showTemporaryFeedback("Aún no estás completamente conectado. Espera un momento.", "info");
                return;
            }
            sendMessage('createMentirosoRoom', { playerName, password });
        });
    }

    if (joinRoomByIdButton) {
        joinRoomByIdButton.addEventListener('click', () => {
            const rId = roomIdInput.value.trim();
            const joinPasswordEl = document.getElementById('joinPasswordInputMentiroso'); // Get the specific join password input element
            const joinPassword = joinPasswordEl ? joinPasswordEl.value : ''; // Get its value, default to empty string if not found
            if (!playerName && playerNameInput) playerName = playerNameInput.value.trim() || "Jugador Anónimo";
            if (!rId) {
                if(lobbyErrorContainer) lobbyErrorContainer.textContent = "Por favor, ingresa un ID de sala.";
                return;
            }
            if (!playerId) {
                showTemporaryFeedback("Aún no estás completamente conectado. Espera un momento.", "info");
                return;
            }
            if(lobbyErrorContainer) lobbyErrorContainer.textContent = "";
            sendMessage('joinMentirosoRoom', { playerName, roomId: rId, password: joinPassword });
        });
    }

    if (joinRandomRoomButton) {
        joinRandomRoomButton.addEventListener('click', () => {
            if (!playerName && playerNameInput) playerName = playerNameInput.value.trim() || "Jugador Anónimo";
            if (!playerId) {
                showTemporaryFeedback("Aún no estás completamente conectado. Espera un momento.", "info");
                return;
            }
            sendMessage('joinRandomRoom', { playerName, gameType: 'mentiroso' });
        });
    }

    // --- Main Server Message Handler ---
    function handleServerMessage(message) {
        switch (message.type) {
            case 'yourInfo':
                playerId = message.payload.playerId;
                console.log(`Player ID set to: ${playerId}`);
                lobbyErrorContainer.textContent = ""; // Clear "Conectando..."
                showScreen(matchmakingScreen); // Connection successful, show lobby
                sendMessage('requestAvailableRooms', { gameType: 'mentiroso' }); // Request available rooms for Mentiroso
                break;
            case 'availableRooms':
                 if (message.payload && message.payload.rooms) {
                    updateAvailableRooms(message.payload.rooms);
                }
                break;
            case 'mentirosoRoomCreated':
                roomId = message.payload.roomId;
                if (lobbyErrorContainer) lobbyErrorContainer.textContent = ``; // Clear lobby error
                showTemporaryFeedback(`Sala ${roomId} creada. Esperando oponente...`, 'success', 5000);
                if (playerNameHeader) playerNameHeader.textContent = `${playerName} (Tú) - Sala: ${roomId}`;
                if (opponentNameHeader) opponentNameHeader.textContent = "Esperando Oponente...";
                if (turnIndicator) turnIndicator.textContent = "Esperando para iniciar...";
                // UI should reflect waiting state - typically server sends newRound or playerJoined next
                showScreen(gameplayScreen); // Go to gameplay, but it will show "waiting"
                // Disable game actions until opponent joins and game starts
                if(declareButton) declareButton.disabled = true;
                if(liarButton) liarButton.disabled = true;
                if(declarationAmountInput) declarationAmountInput.disabled = true;
                break;
            case 'mentirosoJoinSuccess': // When current player successfully joins a room
                roomId = message.payload.roomId;
                isMyTurn = message.payload.startingPlayerId === playerId;
                
                if (message.payload.players.player1.id === playerId) {
                    playerName = message.payload.players.player1.name; // Server might normalize name
                    opponentName = message.payload.players.player2 ? message.payload.players.player2.name : "Oponente";
                    playerScores.p1 = message.payload.players.player1.score;
                    playerScores.p2 = message.payload.players.player2 ? message.payload.players.player2.score : 0;
                } else {
                    playerName = message.payload.players.player2.name;
                    opponentName = message.payload.players.player1.name;
                    playerScores.p1 = message.payload.players.player1.score; // p1 is opponent
                    playerScores.p2 = message.payload.players.player2.score; // p2 is me
                }
                if (lobbyErrorContainer) lobbyErrorContainer.textContent = ``;
                console.log(`Unido a la sala ${roomId}. Oponente: ${opponentName}. Mi turno: ${isMyTurn}`);
                // Server will typically send 'mentirosoNewRound' to start the game.
                // Gameplay screen is shown by 'mentirosoNewRound'
                break;
            case 'mentirosoPlayerJoined': // Sent to P1 when P2 joins P1's room
                roomId = message.payload.roomId; // Should be the same
                 if (message.payload.players.player1.id === playerId) { // I am player 1
                    opponentName = message.payload.players.player2.name;
                    playerScores.p2 = message.payload.players.player2.score;
                } else { // Should not happen if I am P1, but good for robustness
                    opponentName = message.payload.players.player1.name;
                }
                showTemporaryFeedback(`${opponentName} se ha unido a la sala!`, 'success');
                // Server will typically send 'mentirosoNewRound' to start the game.
                break;
            case 'mentirosoNewRound':
                handleNewRound(message.payload);
                break;
            case 'mentirosoDeclarationUpdate':
                handleDeclarationUpdate(message.payload);
                break;
            case 'mentirosoDemonstrationRequired':
                handleDemonstrationRequired(message.payload);
                break;
            case 'mentirosoDemonstrationWait':
                handleDemonstrationWait(message.payload);
                break;
            case 'mentirosoRoundResult':
                handleRoundResult(message.payload);
                break;
            case 'mentirosoGameOver':
                handleGameOver(message.payload);
                break;
            case 'errorMessage': // General errors from server
                console.error('Server error:', message.payload.error, 'Action:', message.payload.forAction);
                const errorMsg = message.payload.error || "Error desconocido del servidor.";
                if (message.payload.forAction) {
                    showTemporaryFeedback(`Error (${message.payload.forAction}): ${errorMsg}`, 'error');
                } else if (lobbyErrorContainer && matchmakingScreen.classList.contains('active')) {
                    lobbyErrorContainer.textContent = errorMsg;
                } else {
                    alert(`Error del servidor: ${errorMsg}`);
                }
                // If error is critical for room (e.g. room full on create), reset roomId
                if (message.payload.error === 'La sala ya está llena.' || message.payload.error === 'Contraseña incorrecta.') {
                    // Potentially keep user in lobby but clear their current attempt context.
                }
                break;
             case 'joinError': // Specific join errors (could be merged with errorMessage)
                console.error('Join error:', message.payload.error);
                if (lobbyErrorContainer && matchmakingScreen.classList.contains('active')){
                    lobbyErrorContainer.textContent = `Error al unirse: ${message.payload.error || "Error desconocido."}`;
                } else {
                     showTemporaryFeedback(`Error al unirse: ${message.payload.error || "Error desconocido."}`, 'error');
                }
                break;
            case 'opponentLeftLobby': // Opponent left while waiting in an unstarted room
                 if (roomId && message.payload.roomId === roomId) { // Check if it's about our current room
                    showTemporaryFeedback(message.payload.message || "El oponente ha dejado la sala.", 'info');
                    // Reset to lobby, allow creating/joining new room
                    showScreen(matchmakingScreen);
                    sendMessage('requestAvailableRooms', { gameType: 'mentiroso' }); // Refresh rooms
                    roomId = null; // Clear current room ID
                    if (playerNameHeader) playerNameHeader.textContent = playerName;
                    if (opponentNameHeader) opponentNameHeader.textContent = "Oponente";
                    if (turnIndicator) turnIndicator.textContent = "Esperando...";
                }
                break;
             case 'gameOver': // This might be a generic gameOver if server sends for other reasons (e.g. disconnect)
                if (message.payload.gameType === 'mentiroso' || !message.payload.gameType) { // Assume mentiroso if not specified
                    handleGameOver(message.payload); // Our specific Mentiroso game over
                }
                break;
            default:
                console.warn('Unknown message type from server:', message.type, message);
        }
    }

    function updateAvailableRooms(rooms) {
        if (!availableRoomsContainer) return;
        availableRoomsContainer.innerHTML = ''; // Clear previous list
        if (rooms.length === 0) {
            availableRoomsContainer.innerHTML = '<p>No hay salas de Mentiroso disponibles. ¡Crea una!</p>';
            return;
        }
        const ul = document.createElement('ul');
        rooms.forEach(room => {
            if (room.gameType === 'mentiroso') { // Only show mentiroso rooms
                const li = document.createElement('li');
                li.textContent = `Sala ${room.id} (Creador: ${room.creatorName || 'N/A'}, Jugadores: ${room.playerCount}/2)${room.requiresPassword ? ' (Privada)' : ''}`;
                const joinButton = document.createElement('button');
                joinButton.textContent = 'Unirse';
                joinButton.classList.add('button', 'small-button');
                joinButton.onclick = () => {
                    if (room.requiresPassword) {
                        const pass = prompt("Esta sala requiere contraseña. Ingrésala:");
                        if (pass !== null) {
                            sendMessage('joinMentirosoRoom', { playerName, roomId: room.id, password: pass });
                        }
                    } else {
                        sendMessage('joinMentirosoRoom', { playerName, roomId: room.id, password: '' });
                    }
                };
                li.appendChild(joinButton);
                ul.appendChild(li);
            }
        });
        if (ul.children.length === 0) {
             availableRoomsContainer.innerHTML = '<p>No hay salas de Mentiroso disponibles en este momento. ¡Crea una o intenta más tarde!</p>';
        } else {
            availableRoomsContainer.appendChild(ul);
        }
    }

    // --- Gameplay Logic (to be adapted for multiplayer) ---
    function updateScoresUI() {
        // Updated by handleNewRound and handleRoundResult based on server payload
        if(playerNameHeader && opponentNameHeader) { 
            let myNameForDisplay = playerName || "Tú";
            let opponentNameForDisplay = opponentName || "Oponente";
            let myCurrentScore = 0;
            let opponentCurrentScore = 0;

            // Prioritize scores from a direct payload if available (e.g. from mentirosoNewRound or mentirosoRoundResult)
            // This logic assumes that functions calling updateScoresUI() will have already updated playerScores object.
            // We need to determine which player is which in the playerScores object.
            // This requires knowing if the current `playerId` corresponds to `player1` or `player2` in the `room.players` structure on server.
            // This info isn't directly stored on client yet, so we rely on server sending identified scores.

            // Best approach: Server always sends player objects with their IDs, names, and scores.
            // Then, client iterates through them to find self and opponent.
            // For now, we use the globally updated playerName, opponentName and playerScores which should be set by message handlers.

            // If we assume playerScores.p1 is ME and playerScores.p2 is OPPONENT (this is an UNSAFE assumption without more context from server)
            // A better way is if handleNewRound, etc. set these explicitly.
            // Let's refine this based on how `handleNewRound` and `handleRoundResult` structure the data.
            // Current structure: `handleNewRound` sets `playerScores.p1` and `playerScores.p2` where p1 is the server's player1, p2 is server's player2.
            // It also sets global `playerName` (me) and `opponentName`.

            // Let's try to derive which score belongs to whom based on `playerName` and `opponentName` matching the names in a hypothetical payload.
            // This is still a bit indirect. The most robust way is if server payload for scores explicitly states which score belongs to which playerId.
            // Example: { players: { [playerId1]: { name: "A", score: 1}, [playerId2]: { name: "B", score: 2} } }

            // Given the current structure where handleNewRound sets global `playerName` to *my* name and `playerScores`
            // such that playerScores.p1 is server.player1 and playerScores.p2 is server.player2.
            // We need to know if *I* am server.player1 or server.player2 to pick the correct score.
            // This info is established during 'mentirosoJoinSuccess' or 'mentirosoPlayerJoined'.
            // Let's assume `amIServerPlayer1` is a boolean set during join. For now, this is missing.

            // Simpler approach for now: `playerNameHeader` shows current player's name (which IS `playerName`) and their score.
            // `opponentNameHeader` shows `opponentName` and their score.
            // The challenge is mapping scores from `playerScores.p1` and `playerScores.p2` to `playerName` and `opponentName` correctly.

            // Revised logic in `handleNewRound` and `handleRoundResult` now populates `playerScores` correctly relative to current player.
            // So, if current player is server's p1, their score will be in `playerScores.p1`. If server's p2, in `playerScores.p2`.
            // This is NOT how it was implemented. `playerScores.p1` was *always* server.player1's score.

            // Let's stick to what `handleNewRound` and `handleRoundResult` do:
            // They update `playerNameHeader` and `opponentNameHeader` directly.
            // So, `updateScoresUI` might just need to re-trigger that logic if called independently,
            // or rely on those handlers to do the full update.

            // The current `handleNewRound` updates the headers directly.
            // The current `handleRoundResult` also updates the headers (via its own logic).
            // So, this function can be simplified or ensure it uses the global `playerScores` that those functions update.

            let myScoreToDisplay = 0;
            let opponentScoreToDisplay = 0;

            // This assumes `handleNewRound` or `handleRoundResult` has correctly updated `playerScores.p1` to be the score of server's player1,
            // and `playerScores.p2` to be the score of server's player2.
            // And that `playerName` is my client's name, and `opponentName` is my opponent's name.
            // We also need to know if the *current client* is server's player1 or player2.
            // This link is missing. The `mentirosoJoinSuccess` and `mentirosoPlayerJoined` try to establish this.

            // Fallback if game not fully started, show basic info
             if (roomId && !currentChallengeData && initialScreen && !initialScreen.classList.contains('active')) { 
                 // Waiting for opponent or game to start
                 playerNameHeader.textContent = `${playerName} (Tú) - Sala: ${roomId}`;
                 opponentNameHeader.textContent = "Esperando Oponente...";
                 if (turnIndicator) turnIndicator.textContent = "Esperando para iniciar...";
                 return; // Exit early, no scores to show yet
             }

            // If in game, try to use the names and scores from the last relevant server message if possible.
            // The `handleNewRound` and `handleRoundResult` functions are now the primary updaters of these headers.
            // This function `updateScoresUI` if called standalone, should reflect the latest known state.
            // The `playerScores` object should hold the canonical scores for player1 and player2 as defined by the server.
            // We need to know if our `playerId` corresponds to player1 or player2 in that server model.

            // Let's assume that `handleNewRound` or similar has already set `playerNameHeader` and `opponentNameHeader` correctly.
            // This function then becomes a no-op if those handlers are comprehensive.
            // However, if we want it to be a generic refresher: 
            if (currentChallengeData && currentChallengeData.players) {
                 if (currentChallengeData.players.player1 && currentChallengeData.players.player1.id === playerId) {
                    myScoreToDisplay = currentChallengeData.players.player1.score;
                    opponentScoreToDisplay = currentChallengeData.players.player2 ? currentChallengeData.players.player2.score : 0;
                } else if (currentChallengeData.players.player2 && currentChallengeData.players.player2.id === playerId) {
                    myScoreToDisplay = currentChallengeData.players.player2.score;
                    opponentScoreToDisplay = currentChallengeData.players.player1 ? currentChallengeData.players.player1.score : 0;
                } // Else, if player ID doesn't match either, something is wrong or it's old data.

                playerNameHeader.textContent = `${playerName} (Tú): ${myScoreToDisplay}`;
                opponentNameHeader.textContent = `${opponentName}: ${opponentScoreToDisplay}`;
            } else if (roomId) { // In a room, but maybe no current challenge data with scores (e.g., just created room)
                playerNameHeader.textContent = `${playerName} (Tú): 0 - Sala: ${roomId}`;
                opponentNameHeader.textContent = `${opponentName}: 0`;
            }
        }
    }

    function updateTurnIndicatorUI() {
        if (!turnIndicator) return;
        if (isMyTurn) {
            turnIndicator.textContent = "Es tu turno";
            turnIndicator.classList.add('my-turn');
            turnIndicator.classList.remove('opponent-turn');
            declareButton.disabled = false;
            liarButton.disabled = localDeclarations.length === 0 || (localDeclarations.length > 0 && localDeclarations[localDeclarations.length -1].playerId === playerId) ;
            declarationAmountInput.disabled = false;
        } else {
            turnIndicator.textContent = `Turno de ${opponentName}`;
            turnIndicator.classList.add('opponent-turn');
            turnIndicator.classList.remove('my-turn');
            declareButton.disabled = true;
            liarButton.disabled = true; // Can only call liar on your turn on opponent's declaration
            declarationAmountInput.disabled = true;
        }
    }

    function addDeclarationToLogUI(playerNameText, amount) {
        const listItem = document.createElement('li');
        listItem.textContent = `${playerNameText} declara que puede nombrar ${amount}.`;
        declarationsListEl.appendChild(listItem);
        declarationsListEl.scrollTop = declarationsListEl.scrollHeight; // Auto-scroll
    }

    function formatChallengeTextForDisplay(challenge, amount = "X") {
        if (!challenge || !challenge.text_template) return "Error: Desafío no cargado.";
        let text = challenge.text_template.replace("X", amount.toString());
        // Replace placeholders like {mundial_year}
        if (challenge.runtime_details) {
            for (const key in challenge.runtime_details) {
                text = text.replace(`{${key}}`, challenge.runtime_details[key]);
            }
        }
        return text;
    }

    function handleNewRound(payload) {
        console.log("Handling new round:", payload);
        showScreen(gameplayScreen); 
        if(demonstrationContainer) demonstrationContainer.classList.remove('active');
        if(roundResultScreen) roundResultScreen.classList.remove('active');
        if(playerActionsContainer) playerActionsContainer.classList.add('active');

        currentChallengeData = payload.challenge; // This is the challenge object itself
        // currentChallengeData.players will be set here if server sends it with the round
        currentChallengeData.players = payload.players; // Explicitly store player data with scores for this round

        currentRoundNumber = payload.roundNumber;
        localDeclarations = []; 
        if(declarationsListEl) declarationsListEl.innerHTML = ''; 
        if(declarationAmountInput) {
            declarationAmountInput.value = '';
            declarationAmountInput.min = '1'; 
        }

        if(challengeTextEl) challengeTextEl.textContent = formatChallengeTextForDisplay(currentChallengeData, '_');
        
        // Update player names and scores based on the specific payload for this round
        if (payload.players && payload.players.player1 && payload.players.player2) {
            const p1FromServer = payload.players.player1;
            const p2FromServer = payload.players.player2;

            if (p1FromServer.id === playerId) {
                playerName = p1FromServer.name; 
                opponentName = p2FromServer.name;
                // Update main headers directly
                if(playerNameHeader) playerNameHeader.textContent = `${playerName} (Tú): ${p1FromServer.score}`;
                if(opponentNameHeader) opponentNameHeader.textContent = `${opponentName}: ${p2FromServer.score}`;
            } else {
                playerName = p2FromServer.name;
                opponentName = p1FromServer.name;
                // Update main headers directly
                if(playerNameHeader) playerNameHeader.textContent = `${playerName} (Tú): ${p2FromServer.score}`;
                if(opponentNameHeader) opponentNameHeader.textContent = `${opponentName}: ${p1FromServer.score}`;
            }
        } else {
            // Fallback if player data not in round (should ideally always be there)
            updateScoresUI(); 
        }

        isMyTurn = payload.currentTurn === playerId;
        updateTurnIndicatorUI();

        // Ensure player actions are enabled/disabled correctly at round start
        if(declareButton) declareButton.disabled = !isMyTurn;
        if(liarButton) liarButton.disabled = !isMyTurn || localDeclarations.length === 0; // Can only call liar if there are declarations
        if(declarationAmountInput) declarationAmountInput.disabled = !isMyTurn;
    }

    function handleDeclarationUpdate(payload) {
        console.log("Handling declaration update:", payload);
        localDeclarations = payload.declarationsLog;
        isMyTurn = payload.currentTurn === playerId;

        // Update declarations log UI
        declarationsListEl.innerHTML = ''; // Clear and rebuild
        localDeclarations.forEach(dec => {
            addDeclarationToLogUI(dec.playerId === playerId ? playerName : opponentName, dec.amount);
        });
        
        if (localDeclarations.length > 0) {
            const lastDeclaredAmount = localDeclarations[localDeclarations.length - 1].amount;
            declarationAmountInput.min = lastDeclaredAmount + 1;
            challengeTextEl.textContent = formatChallengeTextForDisplay(currentChallengeData, lastDeclaredAmount.toString());
        } else {
            challengeTextEl.textContent = formatChallengeTextForDisplay(currentChallengeData, '_');
            declarationAmountInput.min = '1';
        }

        updateTurnIndicatorUI();
    }

    // Event Listeners for Gameplay actions (will send messages to server)
    if (declareButton) {
        declareButton.addEventListener('click', () => {
            const amount = parseInt(declarationAmountInput.value, 10);
            if (isNaN(amount) || amount <= 0) {
                showTemporaryFeedback("Ingresa un número válido para declarar.", 'error');
                return;
            }
            const lastDeclaration = localDeclarations.length > 0 ? localDeclarations[localDeclarations.length - 1] : null;
            if (lastDeclaration && amount <= lastDeclaration.amount) {
                showTemporaryFeedback("Debes declarar un número mayor al anterior.", 'error');
                return;
            }
            if (currentChallengeData && currentChallengeData.type === 'structured' && amount > currentChallengeData.data.questions.length) {
                 showTemporaryFeedback(`No puedes declarar más de ${currentChallengeData.data.questions.length} preguntas para este desafío.`, 'error');
                return;
            }

            sendMessage('mentirosoDeclare', { roomId, amount });
            declarationAmountInput.value = ''; // Clear after sending
        });
    }

    if (liarButton) {
        liarButton.addEventListener('click', () => {
            if (localDeclarations.length === 0) {
                showTemporaryFeedback("No hay declaraciones para desafiar.", 'info');
                return;
            }
            // Check if the last declarer was the opponent
            const lastDeclarerId = localDeclarations[localDeclarations.length - 1].playerId;
            if (lastDeclarerId === playerId) {
                showTemporaryFeedback("No puedes acusarte a ti mismo.", 'info');
                return;
            }
            sendMessage('mentirosoCallLiar', { roomId });
        });
    }

    function startDemonstrationTimer(timeLimitSeconds) {
        clearInterval(demonstrationTimerInterval);
        demonstrationTimeLeft = timeLimitSeconds;
        timerDisplay.textContent = demonstrationTimeLeft;
        timerDisplay.classList.add('active');

        demonstrationTimerInterval = setInterval(() => {
            demonstrationTimeLeft--;
            timerDisplay.textContent = demonstrationTimeLeft;
            if (demonstrationTimeLeft <= 0) {
                clearInterval(demonstrationTimerInterval);
                timerDisplay.classList.remove('active');
                showTemporaryFeedback("¡Tiempo terminado para la demostración! Enviando automáticamente...", "info");
                submitDemonstrationAnswers(); // Auto-submit when time is up
            }
        }, 1000);
    }

    function handleDemonstrationRequired(payload) {
        console.log("Demonstration Required:", payload);
        currentChallengeData = payload.challenge; 
        // Ensure player scores from the demonstration payload (if provided) are reflected
        if (payload.players && payload.players.player1 && payload.players.player2) {
            currentChallengeData.players = payload.players; // Update with latest scores
             const p1FromServer = payload.players.player1;
            const p2FromServer = payload.players.player2;
            if (p1FromServer.id === playerId) {
                if(playerNameHeader) playerNameHeader.textContent = `${p1FromServer.name} (Tú): ${p1FromServer.score}`;
                if(opponentNameHeader) opponentNameHeader.textContent = `${p2FromServer.name}: ${p2FromServer.score}`;
            } else {
                if(playerNameHeader) playerNameHeader.textContent = `${p2FromServer.name} (Tú): ${p2FromServer.score}`;
                if(opponentNameHeader) opponentNameHeader.textContent = `${p1FromServer.name}: ${p1FromServer.score}`;
            }
        }

        const declaredAmount = payload.declaredAmount;
        const timeLimit = payload.timeLimit;
        
        if(demonstrationChallengeTextEl) demonstrationChallengeTextEl.textContent = `Debes demostrar: "${formatChallengeTextForDisplay(currentChallengeData, declaredAmount)}"`;
        
        // Hide player actions (declare/liar), show demonstration area
        if(playerActionsContainer) playerActionsContainer.classList.remove('active');
        showScreen(demonstrationContainer); // This also keeps gameplayScreen active in background

        if(structuredQuestionsContainer) structuredQuestionsContainer.innerHTML = ''; 
        if(demonstrationInput) {
            demonstrationInput.value = '';
            demonstrationInput.style.display = 'none'; // Hide by default
        }
        if(submitDemonstrationButton) submitDemonstrationButton.style.display = 'block';


        if (currentChallengeData.type === 'list') {
            if(demonstrationInput) {
                demonstrationInput.style.display = 'block';
                demonstrationInput.placeholder = `Escribe tus respuestas (hasta ${declaredAmount} ${currentChallengeData.data.answer_entity || 'elementos'}), una por línea.`;
                demonstrationInput.rows = Math.min(10, declaredAmount + 1); 
            }
        } else if (currentChallengeData.type === 'structured') {
            renderStructuredQuestionsForDemonstration(currentChallengeData.data.questions.slice(0, declaredAmount));
        }
        startDemonstrationTimer(timeLimit);
    }

    function renderStructuredQuestionsForDemonstration(questionsToRender) {
        structuredQuestionsContainer.innerHTML = '';
        questionsToRender.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('structured-question-item');
            questionDiv.innerHTML = `<p class="question-text">${index + 1}. ${q.text}</p>`;
            const answerInput = document.createElement('input');
            answerInput.type = 'text';
            answerInput.name = `q_${q.q_id}`;
            answerInput.placeholder = "Tu respuesta";
            answerInput.dataset.questionId = q.q_id;
            questionDiv.appendChild(answerInput);
            structuredQuestionsContainer.appendChild(questionDiv);
        });
    }

    function handleDemonstrationWait(payload) {
        console.log("Waiting for demonstration:", payload);
        if(demonstrationChallengeTextEl) demonstrationChallengeTextEl.textContent = `${payload.demonstratorName} está demostrando: "${payload.challengeText}"`;
        
        if(playerActionsContainer) playerActionsContainer.classList.remove('active');
        showScreen(demonstrationContainer);

        if(timerDisplay) timerDisplay.classList.remove('active'); 
        if(structuredQuestionsContainer) structuredQuestionsContainer.innerHTML = '<p>Esperando que el oponente termine su demostración...</p>';
        if(demonstrationInput) demonstrationInput.style.display = 'none';
        if(submitDemonstrationButton) submitDemonstrationButton.style.display = 'none'; 
    }

    if (submitDemonstrationButton) {
        submitDemonstrationButton.addEventListener('click', submitDemonstrationAnswers);
    }

    function submitDemonstrationAnswers() {
        clearInterval(demonstrationTimerInterval);
        timerDisplay.classList.remove('active');
        let answers = [];
        if (currentChallengeData.type === 'list') {
            answers = demonstrationInput.value.split('\n').map(ans => ans.trim()).filter(ans => ans !== '');
        } else if (currentChallengeData.type === 'structured') {
            const inputs = structuredQuestionsContainer.querySelectorAll('input[type="text"]');
            inputs.forEach(input => {
                answers.push({ 
                    question_id: input.dataset.questionId, 
                    user_answer: input.value.trim()
                });
            });
        }
        sendMessage('mentirosoSubmitDemonstration', { roomId, answers });
        demonstrationContainer.classList.remove('active');
        // Show a waiting message, server will send roundResult
        challengeTextEl.textContent = "Esperando resultado de la demostración...";
    }

    function handleRoundResult(payload) {
        console.log("Round Result:", payload);
        let message = `Ronda ${payload.roundNumber}: ${payload.reason}<br>`;
        message += `Ganador de la ronda: ${payload.roundWinnerName}.<br>`;
        
        let p1NameDisplay = "Jugador 1", p2NameDisplay = "Jugador 2";
        let p1ScoreDisplay = 0, p2ScoreDisplay = 0;

        if (payload.players && payload.players.player1 && payload.players.player2) {
            const p1FromServer = payload.players.player1;
            const p2FromServer = payload.players.player2;

            p1NameDisplay = p1FromServer.name;
            p1ScoreDisplay = p1FromServer.score;
            p2NameDisplay = p2FromServer.name;
            p2ScoreDisplay = p2FromServer.score;
            
            // Update main headers for the game screen in the background
            if (p1FromServer.id === playerId) {
                if(playerNameHeader) playerNameHeader.textContent = `${p1NameDisplay} (Tú): ${p1ScoreDisplay}`;
                if(opponentNameHeader) opponentNameHeader.textContent = `${p2NameDisplay}: ${p2ScoreDisplay}`;
            } else {
                if(playerNameHeader) playerNameHeader.textContent = `${p2NameDisplay} (Tú): ${p2ScoreDisplay}`;
                if(opponentNameHeader) opponentNameHeader.textContent = `${p1NameDisplay}: ${p1ScoreDisplay}`;
            }
            // `playerScores` global object is not strictly needed if headers are updated directly by each relevant message handler.
        }
        message += `Puntajes: ${p1NameDisplay}: ${p1ScoreDisplay} - ${p2NameDisplay}: ${p2ScoreDisplay}`;
        
        if(roundResultMessageEl) roundResultMessageEl.innerHTML = message;
        
        // updateScoresUI(); // Headers are already updated directly above
        
        showScreen(roundResultScreen);
    }

    // The nextRoundButton might not be needed if server controls flow
    if (nextRoundButton) {
        nextRoundButton.addEventListener('click', () => {
            // This button might be removed or repurposed if server automatically starts next round/game over
            // For now, it hides the result screen and expects server to send new round or game over.
            roundResultScreen.classList.remove('active');
            challengeTextEl.textContent = "Esperando siguiente ronda...";
            // sendMessage('readyForNextRound', { roomId }); // If explicit ready signal is needed
        });
    }

    function handleGameOver(payload) {
        console.log("Game Over:", payload);
        let message = `${payload.reason}<br>`;
        let finalP1Name = "Jugador 1", finalP2Name = "Jugador 2";
        let finalP1Score = 0, finalP2Score = 0;

        if (payload.finalScores && payload.finalScores.player1 && payload.finalScores.player2) {
            finalP1Name = payload.finalScores.player1.name;
            finalP1Score = payload.finalScores.player1.score;
            finalP2Name = payload.finalScores.player2.name;
            finalP2Score = payload.finalScores.player2.score;
        }


        if (payload.draw) {
            message += "¡Es un empate!";
            if(winnerNameEl) winnerNameEl.textContent = "Empate";
        } else {
            message += `Ganador final: ${payload.winnerName || 'Desconocido'}!`;
            if(winnerNameEl) winnerNameEl.textContent = payload.winnerName || 'Desconocido';
        }
        message += `<br>Puntajes Finales: ${finalP1Name}: ${finalP1Score} - ${finalP2Name}: ${finalP2Score}`;
        if(gameOverMessageEl) gameOverMessageEl.innerHTML = message;
        
        showScreen(gameOverScreen);
        roomId = null; 
    }

    if (playAgainButtonMentiroso) {
        playAgainButtonMentiroso.addEventListener('click', () => {
            // Reset local game state variables if any were purely client-side for display
            playerScores = { p1: 0, p2: 0 };
            localDeclarations = [];
            currentChallengeData = null;
            // Go back to lobby/matchmaking screen
            showScreen(matchmakingScreen);
            // Player name should persist from playerNameInput or be re-confirmed
            // The WebSocket connection should still be active.
            // If ws is null, it means disconnected, then initialScreen is better.
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                showScreen(initialScreen);
            } else {
                // Request available rooms again if needed, or server might send automatically
                sendMessage('requestAvailableRooms', { gameType: 'mentiroso' }); 
            }
        });
    }

    if(leaveRoomButton) {
        leaveRoomButton.addEventListener('click', () => {
            if (roomId) {
                sendMessage('leaveRoom', { roomId }); // Server will handle cleanup and notify opponent
                roomId = null; // Clear room ID on client
                currentChallengeData = null; // Clear current challenge data
                localDeclarations = [];
                if(declarationsListEl) declarationsListEl.innerHTML = '';
            }
            // Go back to lobby if WS still good, otherwise initial screen
            if (ws && ws.readyState === WebSocket.OPEN) {
                showScreen(matchmakingScreen);
                sendMessage('requestAvailableRooms', { gameType: 'mentiroso' }); // Refresh lobby rooms
            } else {
                showScreen(initialScreen);
                 if(ws) { try { ws.close(); } catch(e){} ws = null; } // Ensure WS is closed and nulled if broken
            }
        });
    }

    function showTemporaryFeedback(message, type = 'info', duration = 3000) {
        const feedbackEl = document.getElementById('temporaryFeedbackMentiroso') || document.createElement('div');
        if (!document.getElementById('temporaryFeedbackMentiroso')) {
            feedbackEl.id = 'temporaryFeedbackMentiroso';
            feedbackEl.style.position = 'fixed';
            feedbackEl.style.bottom = '20px';
            feedbackEl.style.left = '50%';
            feedbackEl.style.transform = 'translateX(-50%)';
            feedbackEl.style.padding = '10px 20px';
            feedbackEl.style.borderRadius = '5px';
            feedbackEl.style.zIndex = '1000';
            feedbackEl.style.transition = 'opacity 0.5s ease-in-out';
            feedbackEl.style.textAlign = 'center';
            feedbackEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            document.body.appendChild(feedbackEl);
        }

        feedbackEl.textContent = message;
        feedbackEl.style.opacity = '1';
        feedbackEl.className = 'feedback-message '; // Reset classes

        if (type === 'error') {
            feedbackEl.classList.add('feedback-error');
            // fallback styles if CSS vars not defined
            feedbackEl.style.backgroundColor = '#FF5470'; 
            feedbackEl.style.color = '#FFFFFE';
        } else if (type === 'success') {
            feedbackEl.classList.add('feedback-success');
            feedbackEl.style.backgroundColor = '#2CB67D';
            feedbackEl.style.color = '#FFFFFE';
        } else { // info
            feedbackEl.classList.add('feedback-info');
            feedbackEl.style.backgroundColor = '#FF8E3C';
            feedbackEl.style.color = '#16161A';
        }

        setTimeout(() => {
            feedbackEl.style.opacity = '0';
        }, duration);
    }

    // Initial screen to show
    showScreen(initialScreen);
}); 