// --- Importaciones ---
import { saveMentirosoResult } from './firebase-utils.js';

// --- WebSocket URL (¡Configura esto!) ---
const WEBSOCKET_URL = (() => {
    // Siempre usar el servidor de producción para evitar problemas de configuración local
    return 'wss://cracktotal-servidor.onrender.com';
    
    // Código anterior comentado:
    // if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    //     const port = 8081; // Puerto del servidor unificado
    //     return `ws://${window.location.hostname}:${port}`;
    // }
    // return 'wss://cracktotal-servidor.onrender.com';
})();

// Agregar después de la declaración de WEBSOCKET_URL, antes de DOMContentLoaded

// Comunicación con la página principal para salas disponibles
window.addEventListener('message', function(event) {
    // Verificar origen del mensaje
    if (event.origin !== window.location.origin) return;
    
    // Si se solicitan las salas disponibles
    if (event.data && event.data.type === 'requestRooms' && event.data.gameType === 'mentiroso') {
        if (document.readyState === 'complete') {
            // Si la página ya está cargada, solicitar salas
            if (window.gameState && window.gameState.websocket && 
                window.gameState.websocket.readyState === WebSocket.OPEN) {
                console.log('Solicitando salas de Mentiroso para games.html');
                window.sendToServer('getRooms', {});
                
                // Almacenar el origen para responder cuando recibamos la lista
                window.roomsRequestSource = event.source;
                window.roomsRequestOrigin = event.origin;
            } else {
                // Si no hay conexión, enviar lista vacía
                event.source.postMessage({
                    type: 'availableRooms',
                    gameType: 'mentiroso',
                    rooms: []
                }, event.origin);
            }
        } else {
            // Si la página aún no está cargada, esperar
            window.addEventListener('load', function() {
                setTimeout(function() {
                    if (window.gameState && window.gameState.websocket && 
                        window.gameState.websocket.readyState === WebSocket.OPEN) {
                        console.log('Solicitando salas de Mentiroso para games.html (después de carga)');
                        window.sendToServer('getRooms', {});
                        
                        // Almacenar el origen para responder cuando recibamos la lista
                        window.roomsRequestSource = event.source;
                        window.roomsRequestOrigin = event.origin;
                    } else {
                        // Si no hay conexión después de esperar, enviar lista vacía
                        event.source.postMessage({
                            type: 'availableRooms',
                            gameType: 'mentiroso',
                            rooms: []
                        }, event.origin);
                    }
                }, 1000); // Esperar 1 segundo para asegurar que la conexión esté establecida
            });
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // --- Game State Variables (Mentiroso) ---
    let gameState = {
        players: {
            player1: { id: null, name: 'Jugador 1', score: 0 },
            player2: { id: null, name: 'Jugador 2', score: 0 }
        },
        roomId: null,
        myPlayerId: null,
        currentRound: 1,
        maxRounds: 18, // 18 preguntas en total (6 categorías x 3 preguntas)
        categoryRound: 1, // Ronda dentro de la categoría actual (1-3)
        globalCategoryIndex: 0, // Índice de la categoría actual (0-5)
        currentCategory: null, // e.g., "Fútbol Argentino"
        challengeTextTemplate: "", // e.g., "Puedo nombrar X jugadores..."
        lastBidder: null, // Player ID of the last player to make a bid
        currentBid: 0, // The current number bid by lastBidder
        playerWhoCalledMentiroso: null, // Player ID of who called Mentiroso
        playerToListAnswers: null, // Player ID of who needs to list answers
        answersListed: [], // Array of strings listed by the player
        validationResults: [], // Array of booleans from validator [{answer: "text", isValid: true/false}]
        gamePhase: 'lobby', // lobby, bidding, listing, validating, roundOver, gameOver
        currentTurn: null, // Player ID for the current action
        gameActive: false,
        websocket: null,
        pendingRoomsRequest: null // Para almacenar solicitud pendiente de salas
    };

    // Orden fijo de categorías para el juego (debe coincidir con el servidor)
    const CATEGORY_ORDER = [
        "Fútbol Argentino",
        "Libertadores",
        "Mundiales",
        "Champions League",
        "Selección Argentina",
        "Fútbol General"
    ];

    // --- DOM Elements (Mentiroso) ---
    // Player Info (Header - Reused)
    const player1NameEl = document.getElementById('player1Name');
    const player1ScoreEl = document.getElementById('player1Score');
    const player2NameEl = document.getElementById('player2Name');
    const player2ScoreEl = document.getElementById('player2Score');
    const playersHeaderInfoEl = document.getElementById('playersHeaderInfo');

    // Game Status Display
    const gameRoundDisplayEl = document.getElementById('gameRoundDisplay');
    const gameCategoryDisplayEl = document.getElementById('gameCategoryDisplay');

    // Challenge & Interaction Area
    const challengeTextEl = document.getElementById('challengeText');
    const currentBidTextEl = document.getElementById('currentBidText');
    const interactionAreaEl = document.getElementById('interactionArea');

    // Phase Specific DIVs
    const biddingPhaseEl = document.getElementById('biddingPhase');
    const playerTurnBidTextEl = document.getElementById('playerTurnBidText');
    const bidInputEl = document.getElementById('bidInput');
    const submitBidButtonEl = document.getElementById('submitBidButton');
    const callMentirosoButtonEl = document.getElementById('callMentirosoButton');

    const listingPhaseEl = document.getElementById('listingPhase');
    const listingInstructionTextEl = document.getElementById('listingInstructionText');
    const bidToListCountEl = document.getElementById('bidToListCount');
    const answerListAreaEl = document.getElementById('answerListArea');
    const submitAnswersButtonEl = document.getElementById('submitAnswersButton');

    const validationPhaseEl = document.getElementById('validationPhase');
    const validationInstructionTextEl = document.getElementById('validationInstructionText');
    const answersToValidateListEl = document.getElementById('answersToValidateList');
    const submitValidationButtonEl = document.getElementById('submitValidationButton');
    
    const feedbackAreaEl = document.getElementById('feedbackArea');
    const waitingAreaEl = document.getElementById('waitingArea');

    // End Game Modal (Mentiroso specific IDs)
    const endGameModalEl = document.getElementById('gameResultModalMentiroso');
    const resultTitleEl = document.getElementById('resultTitleMentiroso');
    const resultMessageEl = document.getElementById('resultMessageMentiroso');
    const resultStatsEl = document.getElementById('resultStatsMentiroso');
    const playAgainButtonMentirosoEl = document.getElementById('playAgainButtonMentiroso');
    const backToLobbyButtonMentirosoEl = document.getElementById('backToLobbyButtonMentiroso');

    // Lobby Elements (Reused IDs from QSM where applicable)
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

    // Password Modal (Reused IDs)
    const privateRoomPasswordModalEl = document.getElementById('privateRoomPasswordModal');
    const passwordModalTitleEl = document.getElementById('passwordModalTitle');
    const passwordModalTextEl = document.getElementById('passwordModalText');
    const privateRoomPasswordFormEl = document.getElementById('privateRoomPasswordForm');
    const passwordModalInputEl = document.getElementById('passwordModalInput');
    const cancelPasswordSubmitEl = document.getElementById('cancelPasswordSubmit');
    const submitPasswordButtonEl = document.getElementById('submitPasswordButton');
    const passwordErrorTextEl = document.getElementById('passwordErrorText');
    let currentJoiningRoomId = null; 

    // --- Initialization ---
    function initializeApp() {
        console.log("Inicializando Mentiroso 1v1 App...");
        
        // Verificar que los elementos DOM esenciales estén presentes
        const requiredElements = {
            feedbackAreaEl,
            waitingAreaEl,
            playersHeaderInfoEl,
            biddingPhaseEl,
            listingPhaseEl,
            validationPhaseEl
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
            console.log(`Prefilled player name from localStorage (Mentiroso): ${savedPlayerName}`);
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
        challengeTextEl.textContent = 'Esperando desafío...';
        currentBidTextEl.textContent = 'Apuesta actual: Ninguna';
        bidInputEl.value = '';
        answerListAreaEl.value = '';
        answersToValidateListEl.innerHTML = '';
        feedbackAreaEl.innerHTML = '';
        updateGamePhaseUI('waiting'); // Or a suitable default phase for start of game
    }

    // --- Lobby Logic (Largely Reused from QSM) ---
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
        localStorage.setItem('playerName', playerName); // Save name
        const password = createRoomPasswordInput.value;
        showLobbyMessage("Creando sala de Mentiroso...", "info");
        disableLobbyButtons(true);
        sendToServer('createRoom', { playerName, password, gameType: 'mentiroso' });
    }

    function handleJoinRoomById() {
        if (!joinRoomButton || joinRoomButton.disabled) return;
        const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';
        localStorage.setItem('playerName', playerName); // Save name
        const roomId = joinRoomIdInput.value.trim();
        const password = joinRoomPasswordInput.value;
        if (!roomId) {
            showLobbyMessage("Por favor, poné un ID de sala.", "error");
            return;
        }
        showLobbyMessage(`Uniéndote a la sala ${roomId}...`, "info");
        disableLobbyButtons(false, true);
        sendToServer('joinRoom', { playerName, roomId, password, gameType: 'mentiroso' });
    }

     function handleJoinRandomRoom() {
         if (!joinRandomRoomButton || joinRandomRoomButton.disabled) return;
         const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';
         localStorage.setItem('playerName', playerName); // Save name
         showLobbyMessage("Buscando una sala de Mentiroso...", "info");
         disableLobbyButtons(false, false, true);
         sendToServer('joinRandomRoom', { playerName, gameType: 'mentiroso' });
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
    
    // --- Mentiroso Game Event Listeners ---
    function setupMentirosoEventListeners() {
        if(submitBidButtonEl) submitBidButtonEl.addEventListener('click', handleSubmitBid);
        if(callMentirosoButtonEl) callMentirosoButtonEl.addEventListener('click', handleCallMentiroso);
        if(submitAnswersButtonEl) submitAnswersButtonEl.addEventListener('click', handleSubmitAnswers);
        if(submitValidationButtonEl) submitValidationButtonEl.addEventListener('click', handleSubmitValidation);
    }

    // --- Game UI Update Functions (Mentiroso) ---
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
            
            // Resaltar claramente el jugador que tiene el turno actualmente
            if (localPlayerBox) {
                localPlayerBox.classList.remove('active-turn');
                if (localPlayer.id === gameState.currentTurn) {
                    localPlayerBox.classList.add('active-turn');
                    console.log("UI: Resaltando jugador local como turno activo");
                }
            }
            
            if (opponentPlayerBox) {
                opponentPlayerBox.classList.remove('active-turn');
                if (opponentPlayer.id === gameState.currentTurn) {
                    opponentPlayerBox.classList.add('active-turn');
                    console.log("UI: Resaltando oponente como turno activo");
                }
            }
            
            // Mostrar indicador de turno adicional
            if (localPlayerBox && localPlayer.id === gameState.currentTurn) {
                if (!localPlayerBox.querySelector('.turn-indicator')) {
                    const turnIndicator = document.createElement('div');
                    turnIndicator.className = 'turn-indicator';
                    turnIndicator.innerHTML = '<i class="fas fa-arrow-right"></i> Tu turno';
                    localPlayerBox.appendChild(turnIndicator);
                }
            } else if (localPlayerBox && localPlayerBox.querySelector('.turn-indicator')) {
                localPlayerBox.querySelector('.turn-indicator').remove();
            }
            
            if (opponentPlayerBox && opponentPlayer.id === gameState.currentTurn) {
                if (!opponentPlayerBox.querySelector('.turn-indicator')) {
                    const turnIndicator = document.createElement('div');
                    turnIndicator.className = 'turn-indicator';
                    turnIndicator.innerHTML = '<i class="fas fa-arrow-right"></i> Su turno';
                    opponentPlayerBox.appendChild(turnIndicator);
                }
            } else if (opponentPlayerBox && opponentPlayerBox.querySelector('.turn-indicator')) {
                opponentPlayerBox.querySelector('.turn-indicator').remove();
            }
            
        } else if (playersHeaderInfoEl) {
            console.log("⚠️ No se encontraron jugadores completos en updatePlayerUI");
            const localNameEl = playersHeaderInfoEl.querySelector('.local-player .player-name');
            const localScoreEl = playersHeaderInfoEl.querySelector('.local-player .score');
            const opponentNameEl = playersHeaderInfoEl.querySelector('.opponent-player .player-name');
            const opponentScoreEl = playersHeaderInfoEl.querySelector('.opponent-player .score');
            if (localNameEl) localNameEl.textContent = 'Esperando...';
            if (localScoreEl) localScoreEl.textContent = 'Puntos: 0';
            if (opponentNameEl) opponentNameEl.textContent = 'Esperando...';
            if (opponentScoreEl) opponentScoreEl.textContent = 'Puntos: 0';
        }
    }

    function updateGameStatusDisplay() {
        // Calcular número global de pregunta (de 18) y categoría actual (de 6)
        const categoryRound = gameState.categoryRound || 1; // Pregunta dentro de la categoría (1-3)
        const globalCategoryIndex = gameState.globalCategoryIndex || 0; // Índice de categoría (0-5)
        const categoryNumber = globalCategoryIndex + 1; // Número de categoría para mostrar (1-6)
        
        // Verificar que la categoría actual coincida con el índice global
        const expectedCategory = CATEGORY_ORDER[globalCategoryIndex];
        if (gameState.currentCategory !== expectedCategory) {
            console.warn(`Inconsistencia detectada: categoría actual (${gameState.currentCategory}) no coincide con el índice global (${globalCategoryIndex}: ${expectedCategory})`);
            // Corregir la categoría actual para que coincida con el índice
            gameState.currentCategory = expectedCategory;
        }
        
        // Información clara sobre ronda actual
        if(gameRoundDisplayEl) {
            gameRoundDisplayEl.innerHTML = `
                <i class="fas fa-trophy"></i> 
                <span class="round-info">
                    <span class="category-counter">Categoría ${categoryNumber}/6: ${gameState.currentCategory}</span>
                    <span class="question-counter">Pregunta ${categoryRound}/3</span>
                    <span class="global-counter">Progreso: ${gameState.currentRound}/18</span>
                </span>
            `;
        }
        
        // Actualizar pills de categorías en la UI
        updateCategoryPills(globalCategoryIndex);
    }

    // Nueva función para actualizar visualmente las pills de categorías
    function updateCategoryPills(activeIndex) {
        const pills = document.querySelectorAll('.category-pill');
        if (pills && pills.length) {
            pills.forEach(pill => {
                pill.classList.remove('active', 'completed');
                
                const pillIndex = parseInt(pill.getAttribute('data-category'));
                
                if (pillIndex < activeIndex) {
                    pill.classList.add('completed');
                } else if (pillIndex === activeIndex) {
                    pill.classList.add('active');
                }
            });
            console.log(`Pills de categorías actualizadas. Categoría activa: ${activeIndex+1} (${CATEGORY_ORDER[activeIndex]})`);
        }
    }
    
    function updateChallengeArea() {
        console.log("Actualizando área de desafío", {
            template: gameState.challengeTextTemplate,
            bid: gameState.currentBid,
            lastBidder: gameState.lastBidder
        });
        
        // Actualizar el texto del desafío
        if (challengeTextEl && gameState.challengeTextTemplate) {
            let challengeText = gameState.challengeTextTemplate;
            // Asegurarse de que siempre se muestre "X" y no "?"
            // Usar expresión regular para reemplazar TODOS los signos de interrogación
            if (challengeText.includes('?')) {
                challengeText = challengeText.replace(/\?/g, 'X');
            }
            // Si ya tiene "X", reemplazar con la apuesta actual o mantener "X" si no hay apuesta
            challengeText = challengeText.replace('X', gameState.currentBid > 0 ? gameState.currentBid : 'X');
            challengeTextEl.textContent = challengeText;
        }
        
        // Actualizar texto de la apuesta actual
        if (currentBidTextEl) {
            if (gameState.currentBid > 0 && gameState.lastBidder) {
                // Obtener el nombre del apostador
                let bidderName = "Alguien";
                if (gameState.lastBidder === gameState.myPlayerId) {
                    bidderName = "Tú";
                } else if (gameState.players.player1?.id === gameState.lastBidder) {
                    bidderName = gameState.players.player1.name;
                } else if (gameState.players.player2?.id === gameState.lastBidder) {
                    bidderName = gameState.players.player2.name;
                }
                
                currentBidTextEl.textContent = `${bidderName} dice que puede nombrar ${gameState.currentBid}.`;
                currentBidTextEl.style.fontWeight = 'bold';
                currentBidTextEl.style.color = 'var(--primary-light)';
            } else {
                currentBidTextEl.textContent = "Aún no hay apuestas.";
                currentBidTextEl.style.fontWeight = 'normal';
                currentBidTextEl.style.color = '';
            }
        }
    }

    function updateGamePhaseUI(phase) {
        console.log("Actualizando UI para fase:", phase, "Mi turno?", gameState.currentTurn === gameState.myPlayerId);
        gameState.gamePhase = phase;
        
        // Hide all phase divs initially
        if(biddingPhaseEl) biddingPhaseEl.style.display = 'none';
        if(listingPhaseEl) listingPhaseEl.style.display = 'none';
        if(validationPhaseEl) validationPhaseEl.style.display = 'none';
        
        // Limpiar el área de feedback solo si no es 'waiting'
        if (phase !== 'waiting' && feedbackAreaEl) {
            // No borrar feedback inmediatamente para dar tiempo a leerlo
            // El feedback será reemplazado por cualquier nuevo mensaje
        }

        const isMyTurn = gameState.currentTurn === gameState.myPlayerId;
        console.log("¿Es mi turno?", isMyTurn, "Mi ID:", gameState.myPlayerId, "Turno actual:", gameState.currentTurn);

        // Actualizar visual de jugadores (resaltar jugador activo)
        updatePlayerUI();

        switch (phase) {
            case 'bidding':
                if(biddingPhaseEl) biddingPhaseEl.style.display = 'block';
                
                // Actualizar el texto según de quién es el turno
                if(playerTurnBidTextEl) {
                    if (isMyTurn) {
                        playerTurnBidTextEl.innerHTML = '<i class="fas fa-arrow-circle-right"></i> Tu turno para apostar o decir "¡Mentiroso!"';
                        playerTurnBidTextEl.classList.add('your-turn');
                    } else {
                        const currentTurnPlayerName = gameState.players.player1?.id === gameState.currentTurn 
                            ? gameState.players.player1.name 
                            : (gameState.players.player2?.id === gameState.currentTurn 
                                ? gameState.players.player2.name 
                                : 'otro jugador');
                        playerTurnBidTextEl.innerHTML = `<i class="fas fa-hourglass-half"></i> Esperando que ${currentTurnPlayerName} realice su jugada...`;
                        playerTurnBidTextEl.classList.remove('your-turn');
                    }
                }
                
                // Habilitar/deshabilitar elementos de interfaz según el turno
                if(bidInputEl) {
                    bidInputEl.disabled = !isMyTurn;
                    if (isMyTurn) {
                        bidInputEl.value = '';
                        setTimeout(() => bidInputEl.focus(), 300);
                    }
                }
                
                if(submitBidButtonEl) {
                    submitBidButtonEl.disabled = !isMyTurn;
                }
                
                // El botón de Mentiroso solo está habilitado si hay una apuesta previa y no es mía
                const canCallMentiroso = isMyTurn && gameState.currentBid > 0 && gameState.lastBidder !== gameState.myPlayerId;
                if(callMentirosoButtonEl) {
                    callMentirosoButtonEl.disabled = !canCallMentiroso;
                }
                
                // Asegurarse de que el input de apuesta use la clase correcta
                if (bidInputEl) {
                    bidInputEl.classList.add('mentiroso-form-input');
                }
                
                break;
            case 'listing':
                if(listingPhaseEl) listingPhaseEl.style.display = 'block';
                const isListingPlayer = gameState.playerToListAnswers === gameState.myPlayerId;
                
                // Obtener nombre del jugador listando de forma segura
                let listerName = "otro jugador";
                if (gameState.players.player1 && gameState.players.player1.id === gameState.playerToListAnswers) {
                    listerName = gameState.players.player1.name || "Jugador 1";
                } else if (gameState.players.player2 && gameState.players.player2.id === gameState.playerToListAnswers) {
                    listerName = gameState.players.player2.name || "Jugador 2";
                }
                
                if(listingInstructionTextEl) {
                    listingInstructionTextEl.innerHTML = isListingPlayer ? 
                        `¡Te llamaron Mentiroso! Nombra los <strong id="bidToListCount">${gameState.currentBid}</strong> ítems:` : 
                        `Esperando que ${listerName} liste sus respuestas.`;
                }
                
                if(answerListAreaEl) answerListAreaEl.disabled = !isListingPlayer;
                if(submitAnswersButtonEl) submitAnswersButtonEl.disabled = !isListingPlayer;
                if (isListingPlayer && answerListAreaEl) answerListAreaEl.focus();
                break;
            case 'validating':
                if(validationPhaseEl) validationPhaseEl.style.display = 'block';
                const isValidatingPlayer = gameState.playerWhoCalledMentiroso === gameState.myPlayerId;
                
                // Obtener nombre del validador de forma segura
                let validatorName = "otro jugador";
                if (gameState.players.player1 && gameState.players.player1.id === gameState.playerWhoCalledMentiroso) {
                    validatorName = gameState.players.player1.name || "Jugador 1";
                } else if (gameState.players.player2 && gameState.players.player2.id === gameState.playerWhoCalledMentiroso) {
                    validatorName = gameState.players.player2.name || "Jugador 2";
                }
                
                if(validationInstructionTextEl) {
                    validationInstructionTextEl.textContent = isValidatingPlayer ? 
                        'Valida las respuestas de tu oponente:' : 
                        `Esperando que ${validatorName} valide.`;
                }
                
                // Logic to enable/disable validation buttons will be handled when list is populated
                if(submitValidationButtonEl) submitValidationButtonEl.disabled = !isValidatingPlayer;
                populateValidationList(gameState.answersListed, isValidatingPlayer);
                break;
            case 'roundOver':
            case 'gameOver':
                // Handled by modals mostly
                break;
            case 'waiting': // Generic waiting state
                 showWaitingMessage("Esperando acción del servidor o del oponente...");
                 break;
            default:
                console.warn("Unknown game phase for UI update:", phase);
        }
        
        // Actualizar el área de desafío si es necesario
        updateChallengeArea();
    }
    
    function populateValidationList(answers, canValidate) {
        if (!answersToValidateListEl) return;
        answersToValidateListEl.innerHTML = ''; // Clear previous
        answers.forEach((answer, index) => {
            const li = document.createElement('li');
            const answerTextSpan = document.createElement('span');
            answerTextSpan.textContent = answer;
            li.appendChild(answerTextSpan);

            if (canValidate) {
                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'validation-buttons';

                const correctButton = document.createElement('button');
                correctButton.innerHTML = '<i class="fas fa-check"></i>';
                correctButton.classList.add('validate-correct');
                correctButton.dataset.index = index;
                correctButton.addEventListener('click', handleSingleValidation);

                const incorrectButton = document.createElement('button');
                incorrectButton.innerHTML = '<i class="fas fa-times"></i>';
                incorrectButton.classList.add('validate-incorrect');
                incorrectButton.dataset.index = index;
                incorrectButton.addEventListener('click', handleSingleValidation);
                
                buttonsDiv.appendChild(correctButton);
                buttonsDiv.appendChild(incorrectButton);
                li.appendChild(buttonsDiv);
            } else {
                 // Display placeholder if not the validator (e.g., show if server sent current validation state)
                const validationStatusSpan = document.createElement('span');
                validationStatusSpan.className = 'validation-status-display';
                // This part would need server to send validation status per item if non-validator should see it live
                // For now, non-validators just wait.
                li.appendChild(validationStatusSpan); 
            }
            answersToValidateListEl.appendChild(li);
        });
    }
    
    function handleSingleValidation(event) {
        const button = event.currentTarget;
        const index = parseInt(button.dataset.index);
        const isCorrect = button.classList.contains('validate-correct');
        
        // Store this client-side first, then send all at once
        if (!gameState.clientSideValidations) gameState.clientSideValidations = [];
        gameState.clientSideValidations[index] = isCorrect;
        
        // UI update for the button pair
        const parentLi = button.closest('li');
        parentLi.querySelectorAll('.validation-buttons button').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        
        console.log(`Validated item ${index} as ${isCorrect ? 'correct' : 'incorrect'}`);
    }

    // --- Funciones de feedback y error dentro del alcance del DOM ---
    // Función para mostrar feedback durante el juego
    function showFeedback(message, type = "info") {
        if (!feedbackAreaEl) {
            console.error("feedbackAreaEl no está disponible");
            return;
        }
        feedbackAreaEl.innerHTML = `<span class="feedback-message ${type}">${message}</span>`;
        console.log(`Feedback (${type}): ${message}`);
    }
    
    function showError(message) {
        if (!feedbackAreaEl) {
            console.error("feedbackAreaEl no está disponible");
            return;
        }
        feedbackAreaEl.innerHTML = `<span class="feedback-message error">Error: ${message}</span>`;
        console.error("Mentiroso Game Error:", message);
    }

    // --- Mentiroso Game Actions ---
    function handleSubmitBid() {
        if (!bidInputEl || bidInputEl.disabled) return;
        
        const bidAmount = parseInt(bidInputEl.value);
        if (isNaN(bidAmount)) {
            showFeedback("La apuesta debe ser un número válido.", "error");
            return;
        }
        
        if (bidAmount <= gameState.currentBid) {
            showFeedback(`Tu apuesta debe ser mayor que la apuesta actual (${gameState.currentBid}).`, "error");
            return;
        }
        
        console.log(`⭐ Enviando apuesta: ${bidAmount}`);
        
        // Deshabilitar botones mientras esperamos respuesta del servidor
        bidInputEl.disabled = true;
        submitBidButtonEl.disabled = true;
        callMentirosoButtonEl.disabled = true;
        showWaitingMessage("Enviando apuesta...");
        
        try {
            sendToServer('mentirosoSubmitBid', { bid: bidAmount });
        } catch (error) {
            console.error("Error enviando apuesta:", error);
            showError("Error enviando apuesta: " + error.message);
            // Rehabilitar botones si hay error
            bidInputEl.disabled = false;
            submitBidButtonEl.disabled = false;
            callMentirosoButtonEl.disabled = !(gameState.currentBid > 0 && gameState.lastBidder !== gameState.myPlayerId);
            hideWaitingMessage();
        }
    }

    function handleCallMentiroso() {
        if (!callMentirosoButtonEl || callMentirosoButtonEl.disabled) return;
        
        if (gameState.currentBid <= 0 || !gameState.lastBidder) {
            showFeedback("No hay una apuesta activa para llamar Mentiroso.", "error");
            return;
        }
        
        if (gameState.lastBidder === gameState.myPlayerId) {
            showFeedback("No puedes llamar Mentiroso a tu propia apuesta.", "error");
            return;
        }
        
        console.log("Llamando Mentiroso");
        sendToServer('mentirosoCallLiar', {});
        
        // Deshabilitar botones mientras esperamos respuesta del servidor
        bidInputEl.disabled = true;
        submitBidButtonEl.disabled = true;
        callMentirosoButtonEl.disabled = true;
        showWaitingMessage("Llamando Mentiroso...");
    }

    function handleSubmitAnswers() {
        if (!answerListAreaEl || answerListAreaEl.disabled) return;
        
        const answers = answerListAreaEl.value
            .split('\n')
            .map(ans => ans.trim())
            .filter(ans => ans.length > 0);
            
        if (answers.length === 0) { 
            showFeedback("Debes listar al menos una respuesta.", "error");
            return;
        }
        
        if (answers.length < gameState.currentBid) {
            showFeedback(`Debes listar al menos ${gameState.currentBid} respuestas según tu apuesta.`, "error");
            return;
        }
        
        console.log(`Enviando ${answers.length} respuestas`);
        sendToServer('mentirosoSubmitAnswers', { answers });
        
        // Deshabilitar botones mientras esperamos respuesta del servidor
        answerListAreaEl.disabled = true;
        submitAnswersButtonEl.disabled = true;
        showWaitingMessage("Enviando respuestas...");
    }
    
    function handleSubmitValidation() {
        if (!submitValidationButtonEl || submitValidationButtonEl.disabled) return;
        
        // Asegurarnos de que tenemos validaciones para todas las respuestas
        if (!gameState.clientSideValidations || 
            gameState.clientSideValidations.length !== gameState.answersListed.length || 
            gameState.clientSideValidations.includes(undefined)) {
            
            showFeedback("Debes validar todas las respuestas antes de confirmar.", "error");
            return;
        }
        
        console.log(`Enviando validaciones: ${gameState.clientSideValidations}`);
        sendToServer('mentirosoSubmitValidation', { validations: gameState.clientSideValidations });
        
        // Deshabilitar botones mientras esperamos respuesta del servidor
        const validationButtons = document.querySelectorAll('.validation-buttons button');
        validationButtons.forEach(btn => btn.disabled = true);
        submitValidationButtonEl.disabled = true;
        showWaitingMessage("Enviando validaciones...");
        
        // Limpiamos las validaciones después de enviar
        gameState.clientSideValidations = [];
    }

    // --- WebSocket Communication (Largely Reused) ---
    function initializeWebSocket() {
        const wsUrl = WEBSOCKET_URL;
        console.log(`Intentando conectar WebSocket (Mentiroso): ${wsUrl}`);
        
        if (gameState.websocket && gameState.websocket.readyState !== WebSocket.CLOSED) {
            console.log("Cerrando conexión WebSocket anterior...");
            gameState.websocket.onclose = null; // Evitar que se dispare el evento onclose
            gameState.websocket.close();
        }
        
        try {
            showLobbyMessage("Conectando al servidor...", "info");
            gameState.websocket = new WebSocket(wsUrl);
        } catch (error) {
            console.error("Error al crear WebSocket:", error);
            showLobbyMessage(`Error de conexión: ${error.message}. Refresca la página.`, "error");
            disableLobbyButtons();
            return;
        }
        
        // Establecer tiempo máximo de conexión (10 segundos)
        const connectionTimeout = setTimeout(() => {
            if (gameState.websocket && gameState.websocket.readyState === WebSocket.CONNECTING) {
                console.error("Tiempo de conexión agotado");
                showLobbyMessage("No se pudo conectar al servidor. Comprueba que esté en funcionamiento.", "error");
                gameState.websocket.close();
                disableLobbyButtons();
            }
        }, 10000);
        
        gameState.websocket.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log('WebSocket Conectado! (Mentiroso)');
            showLobbyMessage("Conectado al servidor. Elige una opción.", "success");
            enableLobbyButtons();
        };
        
        gameState.websocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('Mensaje recibido del servidor (Mentiroso):', message);
                handleServerMessage(message);
            } catch (error) {
                console.error('Error analizando mensaje del servidor (Mentiroso):', error, event.data);
            }
        };
        
        gameState.websocket.onerror = (error) => {
            clearTimeout(connectionTimeout);
            console.error('Error de WebSocket (Mentiroso):', error);
            if (gameState.gameActive) showError("Error de conexión. Vuelve al lobby.");
            else showLobbyMessage("Error de conexión con el servidor. Verifica que el servidor esté funcionando.", "error");
            disableLobbyButtons();
            if(gameState.gameActive) updateGamePhaseUI('waiting');
        };
        
        gameState.websocket.onclose = (event) => {
            clearTimeout(connectionTimeout);
            console.log('WebSocket Desconectado (Mentiroso):', event.reason, `Código: ${event.code}`);
            const wasConnected = !!gameState.websocket;
            gameState.websocket = null;
            
            if (gameState.gameActive) {
                showError("Conexión perdida con el servidor. Juego terminado.");
                gameState.gameActive = false;
                showEndGameModalWithError("Conexión Perdida");
            } else if (wasConnected) {
                showLobbyMessage("Desconectado del servidor. Por favor refresca para reconectar.", "error");
                disableLobbyButtons();
            } else if (!event.wasClean) {
                showLobbyMessage("No se pudo conectar al servidor. Asegúrate que esté corriendo y refresca.", "error");
                disableLobbyButtons();
            }
        };
    }

    function sendToServer(type, payload) {
        if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type, payload });
            console.log('⭐ Enviando mensaje al servidor:', type, payload);
            try {
                gameState.websocket.send(message);
                // Mostrar mensaje de espera después de enviar ciertos mensajes
                if (type === 'mentirosoSubmitBid') {
                    console.log('Apuesta enviada, esperando respuesta...');
                    showWaitingMessage("Enviando apuesta...");
                } else if (type === 'mentirosoCallLiar') {
                    showWaitingMessage("Llamando Mentiroso...");
                }
            } catch (error) {
                console.error('Error al enviar mensaje:', error);
                showError("Error al enviar mensaje al servidor: " + error.message);
            }
        } else {
            console.error('WebSocket not connected. Cannot send (Mentiroso):', type, payload);
            if (gameState.gameActive) showError("No conectado. No se puede enviar mensaje.");
            else showLobbyMessage("No conectado. Por favor refresca.", "error");
        }
    }

    // --- Server Message Handling (Mentiroso) ---
    function handleServerMessage(message) {
        try {
            console.log('⭐ Mensaje recibido:', message.type, message);
            hideWaitingMessage(); // General hide, specific messages might reshow

            switch (message.type) {
                case 'yourInfo':
                    gameState.myPlayerId = message.payload.playerId;
                    console.log(`⭐ Mi ID asignado: ${gameState.myPlayerId}`);
                    break;
                
                case 'roomCreated':
                case 'joinSuccess': // Server might send full player list or just confirmation
                    gameState.roomId = message.payload.roomId;
                    console.log(`⭐ Unido a sala: ${gameState.roomId}`);
                    
                    // Normalizar players - puede venir como array o como objeto
                    let normalizedPlayers = [];
                    if (message.payload.players) {
                        if (Array.isArray(message.payload.players)) {
                            normalizedPlayers = message.payload.players;
                        } else if (message.payload.players.player1 || message.payload.players.player2) {
                            // Convertir objeto a array
                            if (message.payload.players.player1) normalizedPlayers.push(message.payload.players.player1);
                            if (message.payload.players.player2) normalizedPlayers.push(message.payload.players.player2);
                        }
                    }
                    
                    if (normalizedPlayers.length > 0) {
                        // Si recibimos lista completa de jugadores
                        console.log(`⭐ Recibida lista de jugadores: `, normalizedPlayers);
                        
                        // Determinar quién soy yo y quién es el oponente
                        const me = normalizedPlayers.find(p => p && p.id === gameState.myPlayerId);
                        const opponent = normalizedPlayers.find(p => p && p.id !== gameState.myPlayerId);
                        
                        if (me) {
                            gameState.players.player1 = { 
                                id: me.id, 
                                name: me.name || 'Tú', 
                                score: me.score || 0 
                            };
                        } else {
                            console.log("⚠️ No me encontré en la lista de jugadores");
                        }
                        
                        if (opponent) {
                            gameState.players.player2 = { 
                                id: opponent.id, 
                                name: opponent.name || 'Oponente', 
                                score: opponent.score || 0 
                            };
                        } else {
                            gameState.players.player2 = null; // Aún no hay otro jugador
                        }
                    } else {
                        // Si solo recibimos confirmación, asumimos que soy el primer jugador
                        gameState.players.player1 = { 
                            id: gameState.myPlayerId, 
                            name: createPlayerNameInput?.value.trim() || joinPlayerNameInput?.value.trim() || 'Tú', 
                            score: 0 
                        };
                        gameState.players.player2 = null;
                    }
                    
                    if (privateRoomPasswordModalEl.classList.contains('active')) hidePasswordPromptModal();
                    showGameScreen();
                    resetGameUI();
                    updatePlayerUI();
                    showWaitingMessage(`Sala ${gameState.roomId} ${message.type === 'roomCreated' ? 'creada' : 'unida'}. Esperando oponente...`);
                    break;
                
                case 'playerJoined':
                    // Manejar cuando otro jugador se une a nuestra sala
                    console.log("⭐ Otro jugador se unió:", message.payload);
                    
                    // Normalizar players - puede venir como array o como objeto
                    let normalizedPlayersJoined = [];
                    if (message.payload.players) {
                        if (Array.isArray(message.payload.players)) {
                            normalizedPlayersJoined = message.payload.players;
                        } else if (message.payload.players.player1 || message.payload.players.player2) {
                            // Convertir objeto a array
                            if (message.payload.players.player1) normalizedPlayersJoined.push(message.payload.players.player1);
                            if (message.payload.players.player2) normalizedPlayersJoined.push(message.payload.players.player2);
                        }
                    }
                    
                    if (normalizedPlayersJoined.length > 0) {
                        // Actualizar la lista de jugadores completa
                        console.log(`⭐ Lista actualizada de jugadores: `, normalizedPlayersJoined);
                        
                        // Determinar quién soy yo y quién es el oponente
                        const me = normalizedPlayersJoined.find(p => p && p.id === gameState.myPlayerId);
                        const opponent = normalizedPlayersJoined.find(p => p && p.id !== gameState.myPlayerId);
                        
                        if (me) {
                            gameState.players.player1 = { 
                                id: me.id, 
                                name: me.name || 'Tú', 
                                score: me.score || 0 
                            };
                        }
                        
                        if (opponent) {
                            gameState.players.player2 = { 
                                id: opponent.id, 
                                name: opponent.name || 'Oponente', 
                                score: opponent.score || 0 
                            };
                        }
                        
                    } else if (message.payload.newPlayer) {
                        // Si solo se envía el nuevo jugador, asumimos que es el oponente
                        const newPlayer = message.payload.newPlayer;
                        gameState.players.player2 = { 
                            id: newPlayer.id, 
                            name: newPlayer.name || 'Oponente', 
                            score: newPlayer.score || 0 
                        };
                    }
                    
                    updatePlayerUI();
                    showFeedback(`${message.payload.newPlayer ? message.payload.newPlayer.name : 'Otro jugador'} se unió a la sala.`, 'info');
                    break;
                
                case 'gameStart':
                case 'mentirosoGameStart':
                    // El servidor inicia el juego
                    console.log("⭐ Inicio de juego Mentiroso:", message.payload);
                    gameState.gameActive = true;
                    
                    // Normalizar players - puede venir como array o como objeto
                    let normalizedPlayersStart = [];
                    if (message.payload.players) {
                        if (Array.isArray(message.payload.players)) {
                            normalizedPlayersStart = message.payload.players;
                        } else if (message.payload.players.player1 || message.payload.players.player2) {
                            // Convertir objeto a array
                            if (message.payload.players.player1) normalizedPlayersStart.push(message.payload.players.player1);
                            if (message.payload.players.player2) normalizedPlayersStart.push(message.payload.players.player2);
                        }
                    }
                    
                    if (normalizedPlayersStart.length > 0) {
                        console.log(`⭐ Lista de jugadores para inicio de juego: `, normalizedPlayersStart);
                        
                        // Determinar quién soy yo y quién es el oponente
                        const me = normalizedPlayersStart.find(p => p && p.id === gameState.myPlayerId);
                        const opponent = normalizedPlayersStart.find(p => p && p.id !== gameState.myPlayerId);
                        
                        if (me) {
                            gameState.players.player1 = { 
                                id: me.id, 
                                name: me.name || 'Tú', 
                                score: me.score || 0 
                            };
                        }
                        
                        if (opponent) {
                            gameState.players.player2 = { 
                                id: opponent.id, 
                                name: opponent.name || 'Oponente', 
                                score: opponent.score || 0 
                            };
                        }
                    }
                    
                    // Si el mensaje incluye el turno, actualizarlo
                    if (message.payload.currentTurn) {
                        gameState.currentTurn = message.payload.currentTurn;
                        console.log(`⭐ Turno inicial: ${gameState.currentTurn}`);
                    }
                    
                    updatePlayerUI();
                    showGameScreen();
                    resetGameUI();
                    showWaitingMessage("Comenzando juego...");
                    break;
                
                case 'newQuestion':
                case 'mentirosoNextRound': // Server signals start of game or new round
                    gameState.gameActive = true;
                    console.log("⭐ Nueva ronda/pregunta:", message.payload);
                    
                    // Verificación de seguridad para players
                    if (message.payload.players) {
                        // Normalizar players - puede venir como array o como objeto
                        let normalizedPlayersRound = [];
                        if (Array.isArray(message.payload.players)) {
                            normalizedPlayersRound = message.payload.players;
                        } else if (message.payload.players.player1 || message.payload.players.player2) {
                            // Convertir objeto a array
                            if (message.payload.players.player1) normalizedPlayersRound.push(message.payload.players.player1);
                            if (message.payload.players.player2) normalizedPlayersRound.push(message.payload.players.player2);
                        }
                        
                        // Actualizar scores pero mantener las referencias player1/player2
                        if (gameState.players.player1 && normalizedPlayersRound.some(p => p && p.id === gameState.players.player1.id)) {
                            const p1Updated = normalizedPlayersRound.find(p => p && p.id === gameState.players.player1.id);
                            if (p1Updated) gameState.players.player1.score = p1Updated.score || 0;
                        }
                        
                        if (gameState.players.player2 && normalizedPlayersRound.some(p => p && p.id === gameState.players.player2.id)) {
                            const p2Updated = normalizedPlayersRound.find(p => p && p.id === gameState.players.player2.id);
                            if (p2Updated) gameState.players.player2.score = p2Updated.score || 0;
                        }
                    }
                    
                    // Actualizar información de la ronda
                    if (message.payload.round !== undefined) {
                        gameState.currentRound = message.payload.round || 1;
                    } else if (message.payload.questionNumber !== undefined) {
                        gameState.currentRound = message.payload.questionNumber || 1;
                    }
                    
                    // Actualizar ronda dentro de la categoría
                    if (message.payload.categoryRound !== undefined) {
                        gameState.categoryRound = message.payload.categoryRound || 1;
                    } else {
                        // Si no viene del servidor, calcular (fallback)
                        gameState.categoryRound = ((gameState.currentRound - 1) % 3) + 1;
                    }
                    
                    // Después de actualizar el índice global de categoría
                    if (message.payload.globalCategoryIndex !== undefined) {
                        gameState.globalCategoryIndex = message.payload.globalCategoryIndex;
                    } else {
                        // Si no viene del servidor, calcular (fallback)
                        gameState.globalCategoryIndex = Math.floor((gameState.currentRound - 1) / 3);
                    }
                    
                    // Verificar consistencia y corregir si es necesario
                    const expectedCategory = CATEGORY_ORDER[gameState.globalCategoryIndex];
                    if (message.payload.category && message.payload.category !== expectedCategory) {
                        console.warn(`Categoría inconsistente recibida del servidor: ${message.payload.category}, esperada: ${expectedCategory} para índice ${gameState.globalCategoryIndex}`);
                        // Priorizar el índice sobre el nombre de categoría
                        gameState.currentCategory = expectedCategory;
                    } else if (message.payload.category) {
                        gameState.currentCategory = message.payload.category;
                        console.log(`⭐ Categoría actual: ${gameState.currentCategory} (índice ${gameState.globalCategoryIndex})`);
                    } else {
                        // Si no viene del servidor, usar el orden fijo (fallback)
                        gameState.currentCategory = CATEGORY_ORDER[gameState.globalCategoryIndex];
                    }
                    
                    // Verificar si es nueva categoría (del servidor o calculado)
                    const isNewCategory = message.payload.isNewCategory || 
                                          (gameState.categoryRound === 1 && gameState.currentRound > 1);
                    
                    // Disparar un evento personalizado para nueva categoría/ronda
                    dispatchGameEvent('mentirosoNextRound', {
                        round: gameState.currentRound,
                        categoryRound: gameState.categoryRound,
                        globalCategoryIndex: gameState.globalCategoryIndex,
                        category: gameState.currentCategory,
                        isNewCategory: isNewCategory
                    });
                    
                    // Actualizar plantilla de desafío
                    if (message.payload.challengeTemplate) {
                        gameState.challengeTextTemplate = message.payload.challengeTemplate;
                    } else if (message.payload.question) {
                        gameState.challengeTextTemplate = message.payload.question;
                    } else {
                        // Fallback a una plantilla genérica
                        gameState.challengeTextTemplate = "Puedo nombrar X elementos...";
                    }
                    
                    // Asegurarse de que la plantilla siempre tenga "X" y no "?"
                    if (gameState.challengeTextTemplate.includes("?")) {
                        gameState.challengeTextTemplate = gameState.challengeTextTemplate.replace(/\?/g, "X");
                    }
                    
                    // Reiniciar estado de la ronda
                    gameState.currentBid = 0;
                    gameState.lastBidder = null;
                    
                    // Actualizar el turno
                    if (message.payload.startingPlayerId || message.payload.currentTurn) {
                        gameState.currentTurn = message.payload.startingPlayerId || message.payload.currentTurn;
                        console.log(`⭐ Turno para nueva ronda: ${gameState.currentTurn} (Mi ID: ${gameState.myPlayerId})`);
                    }
                    
                    // Reiniciar otros estados
                    gameState.playerWhoCalledMentiroso = null;
                    gameState.playerToListAnswers = null;
                    gameState.answersListed = [];
                    gameState.validationResults = [];
                    gameState.clientSideValidations = [];
                    
                    // Actualizar UI
                    showGameScreen(); // Ensure game screen if not already
                    updatePlayerUI();
                    updateGameStatusDisplay();
                    
                    // Si es nueva categoría, mostrar un mensaje especial
                    if (isNewCategory && gameState.currentRound > 1) {
                        const categoryNumber = gameState.globalCategoryIndex + 1;
                        const categoryMessage = `
                            <div class="category-change-message">
                                <div class="category-change-title">¡NUEVA CATEGORÍA!</div>
                                <div class="category-change-name">${gameState.currentCategory}</div>
                                <div class="category-change-subtitle">Categoría ${categoryNumber} de 6</div>
                            </div>
                        `;
                        
                        if (feedbackAreaEl) {
                            feedbackAreaEl.innerHTML = categoryMessage;
                            
                            // Mostrar brevemente el mensaje de nueva categoría (reducido a 1000ms)
                            setTimeout(() => {
                                feedbackAreaEl.innerHTML = '';
                                updateGamePhaseUI('bidding');
                            }, 1000);
                        } else {
                            updateGamePhaseUI('bidding');
                        }
                    } else {
                        updateGamePhaseUI('bidding');
                    }
                    
                    // Mensaje basado en si es nueva categoría o nueva pregunta
                    const isFirstRound = gameState.currentRound === 1;
                    const feedbackMessage = isNewCategory ? 
                        `¡Nueva categoría! Ahora jugando: ${gameState.currentCategory}` :
                        `${isFirstRound ? '¡Comienza' : 'Continúa'} la ronda ${gameState.categoryRound}/3! Categoría: ${gameState.currentCategory}`;
                    
                    showFeedback(feedbackMessage, 'info');
                    break;
                
                case 'bidConfirmed':
                    // El servidor confirmó nuestra apuesta
                    console.log("Apuesta confirmada:", message.payload);
                    if (message.payload.message) {
                        showFeedback(message.payload.message, 'info');
                    }
                    // No cambiamos el turno hasta recibir mentirosoBidUpdate
                    break;
                
                case 'mentirosoBidUpdate': // Server broadcasts a new bid or turn change in bidding
                    console.log("⭐ Recibido mentirosoBidUpdate:", message.payload);
                    
                    if (!message.payload.hasOwnProperty('newBid') || !message.payload.hasOwnProperty('nextTurn')) {
                        console.error("mentirosoBidUpdate con datos incompletos:", message.payload);
                        showError("Datos de apuesta incompletos");
                        return;
                    }
                    
                    // Actualizar el estado del juego
                    gameState.currentBid = message.payload.newBid;
                    gameState.lastBidder = message.payload.bidderId;
                    
                    if (message.payload.nextTurn) {
                        console.log(`⭐ Cambiando turno: ${gameState.currentTurn} -> ${message.payload.nextTurn}`);
                        gameState.currentTurn = message.payload.nextTurn;
                    } else {
                        console.error("mentirosoBidUpdate sin nextTurn:", message.payload);
                    }
                    
                    // Mostrar un mensaje de quién apostó
                    let bidderName = "Otro jugador";
                    if (message.payload.bidderId === gameState.myPlayerId) {
                        bidderName = "Tú";
                    } else if (gameState.players.player1 && gameState.players.player1.id === message.payload.bidderId) {
                        bidderName = gameState.players.player1.name || "Jugador 1";
                    } else if (gameState.players.player2 && gameState.players.player2.id === message.payload.bidderId) {
                        bidderName = gameState.players.player2.name || "Jugador 2";
                    } else if (message.payload.bidderName) {
                        bidderName = message.payload.bidderName;
                    }
                    
                    // Actualizar la interfaz para reflejar el cambio de turno
                    hideWaitingMessage();
                    
                    // Mostrar mensaje de quién apostó
                    showFeedback(`${bidderName} apostó ${message.payload.newBid}`, 'info');
                    
                    // Actualizar mensaje de turno
                    console.log(`⭐ Mi turno ahora?: ${gameState.currentTurn === gameState.myPlayerId}, Mi ID: ${gameState.myPlayerId}, Turno actual: ${gameState.currentTurn}`);
                    
                    // Esperar un momento para que el usuario vea el feedback antes de actualizar la interfaz
                    setTimeout(() => {
                        updateGamePhaseUI('bidding');
                        
                        // Verificar si es nuestro turno ahora
                        if (gameState.currentTurn === gameState.myPlayerId) {
                            console.log("⭐ Ahora es mi turno!");
                            // Restablecemos el campo de apuesta y le damos foco
                            if (bidInputEl) {
                                bidInputEl.value = '';
                                bidInputEl.disabled = false;
                                setTimeout(() => bidInputEl.focus(), 300);
                            }
                            
                            // Habilitamos botones
                            if (submitBidButtonEl) submitBidButtonEl.disabled = false;
                            if (callMentirosoButtonEl) {
                                callMentirosoButtonEl.disabled = !(gameState.currentBid > 0 && 
                                                                     gameState.lastBidder !== gameState.myPlayerId);
                            }
                            
                            // Resaltar que es mi turno
                            showFeedback("¡Es tu turno ahora!", "info");
                        } else {
                            console.log("Ahora es turno del otro jugador:", gameState.currentTurn);
                            // Deshabilitamos campos y botones
                            if (bidInputEl) bidInputEl.disabled = true;
                            if (submitBidButtonEl) submitBidButtonEl.disabled = true;
                            if (callMentirosoButtonEl) callMentirosoButtonEl.disabled = true;
                        }
                        
                        // Actualizar indicadores visuales
                        updateChallengeArea();
                        updatePlayerUI();
                    }, 300);
                    
                    break;

                case 'mentirosoLiarCalled': // Server confirms liar was called
                    gameState.playerWhoCalledMentiroso = message.payload.callerId;
                    gameState.playerToListAnswers = message.payload.accusedId;
                    gameState.currentTurn = message.payload.accusedId; // Accused player's turn to list
                    showFeedback(`${gameState.players.player1?.id === gameState.playerWhoCalledMentiroso ? gameState.players.player1.name : gameState.players.player2.name} gritó ¡MENTIROSO!`, 'info');
                    updateGamePhaseUI('listing');
                    break;
                
                case 'mentirosoAnswersSubmitted': // Server confirms answers were submitted, now validation phase
                    gameState.answersListed = message.payload.answers;
                    gameState.currentTurn = gameState.playerWhoCalledMentiroso; // Caller's turn to validate
                    showFeedback(`Respuestas recibidas. ${gameState.players.player1?.id === gameState.currentTurn ? gameState.players.player1.name : gameState.players.player2.name} debe validar.`, 'info');
                    updateGamePhaseUI('validating');
                    break;

                case 'mentirosoRoundResult':
                    // Asegurarse de que players exista antes de actualizarlo
                    if (message.payload.players) {
                        // Normalizar players - puede venir como array o como objeto
                        let normalizedPlayersResult = [];
                        if (Array.isArray(message.payload.players)) {
                            normalizedPlayersResult = message.payload.players;
                        } else if (message.payload.players.player1 || message.payload.players.player2) {
                            // Convertir objeto a array
                            if (message.payload.players.player1) normalizedPlayersResult.push(message.payload.players.player1);
                            if (message.payload.players.player2) normalizedPlayersResult.push(message.payload.players.player2);
                        }
                        
                        // Reconstruir la estructura players de forma segura
                        if (normalizedPlayersResult.length > 0) {
                            // Asegurarse de que los IDs coincidan con la estructura anterior
                            for (const player of normalizedPlayersResult) {
                                if (player && player.id) {
                                    if (gameState.players.player1 && gameState.players.player1.id === player.id) {
                                        gameState.players.player1.score = player.score || 0;
                                    } else if (gameState.players.player2 && gameState.players.player2.id === player.id) {
                                        gameState.players.player2.score = player.score || 0;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Ocultar waiting area para asegurarse que no tape el resultado
                    hideWaitingMessage();
                    
                    // Actualizar UI primero para que los puntajes estén actualizados
                    updatePlayerUI();
                    
                    // Determinar si es la última pregunta de la categoría
                    const isLastQuestionInCategory = gameState.categoryRound === 3;
                    
                    // Determinar quién ganó el punto de forma más clara
                    let winnerName = "Nadie";
                    let isPlayerWinner = false;
                    
                    if (message.payload.winnerId === gameState.myPlayerId) {
                        winnerName = "¡TÚ!";
                        isPlayerWinner = true;
                    } else if (message.payload.winnerId) {
                        // Buscar el nombre del ganador
                        if (gameState.players.player1 && gameState.players.player1.id === message.payload.winnerId) {
                            winnerName = gameState.players.player1.name || "Jugador 1";
                        } else if (gameState.players.player2 && gameState.players.player2.id === message.payload.winnerId) {
                            winnerName = gameState.players.player2.name || "Jugador 2";
                        } else {
                            winnerName = "Oponente";
                        }
                    }
                    
                    // Crear un mensaje destacado con el resultado
                    const categoryNumber = gameState.globalCategoryIndex + 1;
                    const resultMessage = `
                        <div class="round-result ${isPlayerWinner ? 'winner' : 'loser'}">
                            <div class="result-header">RESULTADO PREGUNTA ${gameState.categoryRound}/3 (${gameState.currentRound}/18)</div>
                            <div class="result-winner">Punto para: <strong>${winnerName}</strong></div>
                            <div class="result-detail">${message.payload.message}</div>
                            ${isLastQuestionInCategory ? `<div class="category-complete">¡CATEGORÍA ${categoryNumber} COMPLETADA!</div>` : ''}
                        </div>
                    `;
                    
                    // Mostrar el mensaje de resultado
                    if (feedbackAreaEl) {
                        feedbackAreaEl.innerHTML = resultMessage;
                    }
                    
                    // Actualizar a fase roundOver sin mostrar el waiting message aún
                    updateGamePhaseUI('roundOver');
                    
                    // Dar tiempo suficiente para ver el resultado antes de mostrar el mensaje de espera
                    // 5 segundos para ver el resultado cuando completas una categoría, 3 segundos para preguntas normales
                    const waitTime = isLastQuestionInCategory ? 3000 : 1500; // Tiempos aumentados para mejor experiencia
                    
                    // Mostrar el waiting message después de un tiempo para no tapar el resultado
                    setTimeout(() => {
                        const nextCategoryNumber = (categoryNumber % 6) + 1;
                        const waitingMessage = isLastQuestionInCategory ? 
                            `Fin de la categoría ${categoryNumber}. Preparando categoría ${nextCategoryNumber}: ${CATEGORY_ORDER[nextCategoryNumber-1]}...` : 
                            "Fin de la pregunta. Preparando siguiente pregunta...";
                        showWaitingMessage(waitingMessage);
                    }, waitTime);
                    break;
                
                case 'gameOver': // Generic or Mentiroso specific game over
                    gameState.gameActive = false;
                    // Ensure payload is for Mentiroso if distinguishing
                    if (message.payload.gameType === 'mentiroso' || !message.payload.gameType) { 
                        endGame(message.payload); // Show final results for Mentiroso
                    }
                    break;
                case 'playerDisconnect':
                     showError(`${message.payload.disconnectedPlayerName || 'Oponente'} desconectado.`);
                     showWaitingMessage("Oponente desconectado. Esperando al servidor...");
                     if(gameState.gameActive) updateGamePhaseUI('waiting');
                     break;
                case 'errorMessage':
                    console.error("Mentiroso Error Message:", message.payload);
                    if (gameState.gameActive) {
                        showError(message.payload.error || "Error en el juego.");
                        // Si hay error en la apuesta, habilitar campos para volver a intentar
                        if (gameState.currentTurn === gameState.myPlayerId) {
                            if (bidInputEl) bidInputEl.disabled = false;
                            if (submitBidButtonEl) submitBidButtonEl.disabled = false;
                            if (callMentirosoButtonEl) {
                                callMentirosoButtonEl.disabled = !(gameState.currentBid > 0 && 
                                                                gameState.lastBidder !== gameState.myPlayerId);
                            }
                        }
                    }
                    else showLobbyMessage(message.payload.error || "Ocurrió un error.", "error");
                    // Potentially revert phase or enable buttons if error is lobby-related
                    if(!gameState.gameActive) enableLobbyButtons();
                    break;
                case 'availableRooms': 
                    console.log('Received availableRooms for Mentiroso');
                    renderAvailableRooms(message.payload.rooms, 'mentiroso');
                    
                    // Si hay una solicitud pendiente desde la página principal, responderla
                    if (gameState.pendingRoomsRequest) {
                        gameState.pendingRoomsRequest.source.postMessage({
                            type: 'availableRooms',
                            gameType: 'mentiroso',
                            rooms: message.payload.rooms || []
                        }, gameState.pendingRoomsRequest.origin);
                        
                        // Limpiar la solicitud pendiente
                        gameState.pendingRoomsRequest = null;
                    }
                    
                    // Si hay una solicitud desde games.html, responderla
                    if (window.roomsRequestSource && window.roomsRequestOrigin) {
                        window.roomsRequestSource.postMessage({
                            type: 'availableRooms',
                            gameType: 'mentiroso',
                            rooms: message.payload.rooms || []
                        }, window.roomsRequestOrigin);
                        
                        // Limpiar la solicitud
                        window.roomsRequestSource = null;
                        window.roomsRequestOrigin = null;
                    }
                    break;
                default:
                     console.warn('Unknown message type (Mentiroso):', message.type, message.payload);
                     // Si es un mensaje desconocido, intentar extraer información útil
                     if (message.type === 'playerJoined' || message.payload && message.payload.players) {
                         console.log('Detectado mensaje playerJoined no manejado directamente:', message);
                         // Actualizar jugadores si es posible
                         if (message.payload && message.payload.players) {
                             // Normalizar players - puede venir como array o como objeto
                             let normalizedPlayersDefault = [];
                             if (Array.isArray(message.payload.players)) {
                                 normalizedPlayersDefault = message.payload.players;
                             } else if (message.payload.players.player1 || message.payload.players.player2) {
                                 // Convertir objeto a array
                                 if (message.payload.players.player1) normalizedPlayersDefault.push(message.payload.players.player1);
                                 if (message.payload.players.player2) normalizedPlayersDefault.push(message.payload.players.player2);
                             }
                             
                             if (normalizedPlayersDefault.length > 0 && gameState.players) {
                                 gameState.players = {
                                     player1: normalizedPlayersDefault[0],
                                     player2: normalizedPlayersDefault.length > 1 ? normalizedPlayersDefault[1] : null
                                 };
                                 updatePlayerUI();
                             }
                         }
                     } else if (message.type === 'gameStart' || message.type === 'newQuestion') {
                         console.log('Detectado inicio de juego o nueva pregunta no manejada directamente:', message);
                         // Intentar iniciar el juego con la información disponible
                         gameState.gameActive = true;
                         if (message.payload) {
                             if (message.payload.round) gameState.currentRound = message.payload.round;
                             if (message.payload.category) gameState.currentCategory = message.payload.category;
                             if (message.payload.question) gameState.challengeTextTemplate = message.payload.question;
                             if (message.payload.currentTurn) gameState.currentTurn = message.payload.currentTurn;
                         }
                         showGameScreen();
                         updatePlayerUI();
                         updateGameStatusDisplay();
                         updateGamePhaseUI('bidding');
                     }
            }
        } catch (error) {
            console.error("Error procesando mensaje:", error);
            showError("Error procesando mensaje del servidor: " + error.message);
        }
    }

    // --- Función para guardar estadísticas en Firebase ---
    async function saveMentirosoStats(payload) {
        try {
            const finalScores = payload.finalScores;
            if (!gameState.myPlayerId || !finalScores) return;

            let myFinalScore = 0;
            let result = 'defeat';
            
            // Determinar mi puntuación y resultado
            if (finalScores[gameState.myPlayerId] !== undefined) {
                myFinalScore = finalScores[gameState.myPlayerId];
            }
            
            if (payload.draw) {
                result = 'draw';
            } else if (payload.winnerId === gameState.myPlayerId) {
                result = 'victory';
            }

            // Obtener información del oponente
            const opponents = [];
            for (const playerId in finalScores) {
                if (playerId !== gameState.myPlayerId) {
                    const player = gameState.players?.player1?.id === playerId ? 
                        gameState.players.player1 : gameState.players?.player2;
                    opponents.push({
                        id: playerId,
                        name: player?.name || 'Oponente',
                        score: finalScores[playerId] || 0
                    });
                }
            }

            const gameStats = {
                result: result,
                myScore: myFinalScore,
                opponents: opponents
            };

            await saveMentirosoResult(gameStats);
            console.log("Estadísticas de Mentiroso guardadas exitosamente");
        } catch (error) {
            console.error("Error guardando estadísticas de Mentiroso:", error);
        }
    }

    // --- End Game (Mentiroso) ---
    function endGame(payload) { 
        console.log("Game Over (Mentiroso). Payload:", payload);
        gameState.gameActive = false;
        updateGamePhaseUI('gameOver');
        hideWaitingMessage();

        const finalScores = payload.finalScores;
        if (!gameState.myPlayerId || !finalScores || typeof finalScores !== 'object') {
            showEndGameModalWithError("Error calculando resultados.");
            return;
        }

        let myFinalScore = 'N/A', opponentFinalScore = 'N/A', opponentId = null;
        for (const playerId in finalScores) {
            if (playerId === gameState.myPlayerId) myFinalScore = finalScores[playerId];
            else { opponentFinalScore = finalScores[playerId]; opponentId = playerId; }
        }

        let myName = 'Tú', opponentName = 'Oponente';
        const p1 = gameState.players?.player1;
        const p2 = gameState.players?.player2;
        if (p1?.id === gameState.myPlayerId) myName = p1.name || myName;
        else if (p2?.id === gameState.myPlayerId) myName = p2.name || myName;
        if (p1?.id === opponentId) opponentName = p1.name || opponentName;
        else if (p2?.id === opponentId) opponentName = p2.name || opponentName;

        let title = "", message = payload.reason || "", headerClass = '';
        if (payload.draw) {
            title = "¡Es un Empate!";
            if (!message) message = "Ambos jugadores tienen los mismos puntos.";
            headerClass = 'result-header-timeout';
        } else if (payload.winnerId === gameState.myPlayerId) {
            title = `¡Ganaste, ${myName}!`;
            if (!message) message = "¡Felicidades!";
            headerClass = 'result-header-victory';
        } else if (opponentId && payload.winnerId === opponentId) {
            title = `¡${opponentName} ganó!`;
            if (!message) message = "Mejor suerte la próxima.";
            headerClass = 'result-header-defeat';
        } else {
            title = "Juego Terminado";
            if (!message) message = "La partida finalizó.";
        }

        resultTitleEl.textContent = title;
        resultMessageEl.textContent = message;
        const modalHeader = endGameModalEl.querySelector('.result-modal-header');
        if (modalHeader) {
            modalHeader.className = 'result-modal-header'; // Reset
            if (headerClass) modalHeader.classList.add(headerClass);
        }
        resultStatsEl.innerHTML = `
            <div class="stat-item your-score ${payload.winnerId === gameState.myPlayerId && !payload.draw ? 'winner' : (payload.winnerId && !payload.draw ? 'loser' : '')}">
                <span class="stat-label"><i class="fas fa-user-shield"></i> ${myName} (Tú)</span>
                <span class="stat-value">${myFinalScore}</span>
            </div>
            <div class="stat-item opponent-score ${payload.winnerId === opponentId && !payload.draw ? 'winner' : (payload.winnerId && !payload.draw ? 'loser' : '')}">
                <span class="stat-label"><i class="fas fa-user-ninja"></i> ${opponentName}</span>
                <span class="stat-value">${opponentFinalScore}</span>
            </div>`;
        
        // Guardar estadísticas en Firebase
        saveMentirosoStats(payload);
        
        showEndGameModal();
    }

    function showEndGameModal() { endGameModalEl.classList.add('active'); }
    function hideEndGameModal() { endGameModalEl.classList.remove('active'); }
    function showEndGameModalWithError(reason) {
        resultTitleEl.textContent = "Juego Interrumpido";
        resultMessageEl.textContent = reason || "Ocurrió un error.";
        const modalHeader = endGameModalEl.querySelector('.result-modal-header');
        if (modalHeader) { modalHeader.className = 'result-modal-header result-header-defeat';}
        // Attempt to show last known scores
        let myLastScore = gameState.players?.player1?.id === gameState.myPlayerId ? gameState.players.player1.score : gameState.players?.player2?.score || 'N/A';
        let opponentLastScore = gameState.players?.player1?.id !== gameState.myPlayerId ? gameState.players.player1?.score : gameState.players?.player2?.score || 'N/A';
        resultStatsEl.innerHTML = `<div class="stat-item"><span>Tu Score:</span><span>${myLastScore}</span></div><div class="stat-item"><span>Score Oponente:</span><span>${opponentLastScore}</span></div>`;
        showEndGameModal();
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        setupLobbyEventListeners();
        setupMentirosoEventListeners(); // Specific listeners for Mentiroso game actions

        if(playAgainButtonMentirosoEl) playAgainButtonMentirosoEl.addEventListener('click', () => {
            hideEndGameModal();
            showLobby(); // Go back to lobby
            gameState.gameActive = false;
            if (gameState.roomId) sendToServer('leaveRoom', { roomId: gameState.roomId });
            gameState.roomId = null;
        });
        if(backToLobbyButtonMentirosoEl) backToLobbyButtonMentirosoEl.addEventListener('click', () => {
            hideEndGameModal();
            showLobby();
            gameState.gameActive = false;
            if (gameState.roomId) sendToServer('leaveRoom', { roomId: gameState.roomId });
            gameState.roomId = null;
        });
        
        // Password Modal Listeners (reused)
        if (privateRoomPasswordFormEl) privateRoomPasswordFormEl.addEventListener('submit', handleSubmitPasswordModal);
        if (cancelPasswordSubmitEl) cancelPasswordSubmitEl.addEventListener('click', hidePasswordPromptModal);
        if (privateRoomPasswordModalEl) privateRoomPasswordModalEl.addEventListener('click', (event) => {
            if (event.target === privateRoomPasswordModalEl) hidePasswordPromptModal();
        });
    }

    // --- Room List Rendering (can be slightly adapted if Mentiroso rooms have different data) ---
    function renderAvailableRooms(rooms, gameTypeFilter = null) {
        if (!availableRoomsListEl) return;
        availableRoomsListEl.innerHTML = '';
        const filteredRooms = gameTypeFilter ? rooms.filter(room => room.gameType === gameTypeFilter) : rooms;

        if (!filteredRooms || filteredRooms.length === 0) {
            const noRoomsMsg = document.createElement('li');
            noRoomsMsg.className = 'no-rooms-message';
            noRoomsMsg.innerHTML = `No hay salas de ${gameTypeFilter || 'juego'} disponibles. <i class="fas fa-sad-tear"></i>`;
            availableRoomsListEl.appendChild(noRoomsMsg);
            return;
        }
        filteredRooms.forEach(room => {
            const roomItem = document.createElement('li');
            roomItem.className = 'room-item';
            roomItem.dataset.roomId = room.id;
            const roomInfo = document.createElement('div');
            roomInfo.className = 'room-info';
            roomInfo.innerHTML = `<span>ID: <strong>${room.id}</strong></span>
                                <span>Creador: <strong>${room.creatorName || 'N/A'}</strong></span>
                                <span>Jugadores: <strong>${room.playerCount || 0}/${room.maxPlayers || 2}</strong></span>` +
                               (room.requiresPassword ? `<span><strong><i class="fas fa-lock"></i> Privada</strong></span>` : '');
            const joinButton = document.createElement('button');
            joinButton.className = 'secondary-button lobby-button join-room-list-btn';
            joinButton.textContent = 'Unirse';
            joinButton.disabled = (room.playerCount >= room.maxPlayers);
            joinButton.addEventListener('click', () => handleJoinRoomFromList(room.id, room.requiresPassword));
            roomItem.appendChild(roomInfo);
            roomItem.appendChild(joinButton);
            availableRoomsListEl.appendChild(roomItem);
        });
    }

    function handleJoinRoomFromList(roomId, requiresPassword) {
        const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';
        localStorage.setItem('playerName', playerName);
        if (requiresPassword) {
            currentJoiningRoomId = roomId;
            passwordModalTextEl.textContent = `La sala de Mentiroso '${roomId}' es privada. Ingresa la contraseña:`;
            passwordModalInputEl.value = '';
            passwordErrorTextEl.textContent = '';
            passwordErrorTextEl.style.display = 'none';
            showPasswordPromptModal();
        } else {
            joinRoomIdInput.value = roomId;
            joinRoomPasswordInput.value = '';
            showLobbyMessage(`Uniéndote a sala pública ${roomId}...`, "info");
            disableLobbyButtons();
            sendToServer('joinRoom', { playerName, roomId, password: '', gameType: 'mentiroso' });
        }
    }

    // --- Password Modal Functions (Reused) ---
    function showPasswordPromptModal() {
        if (privateRoomPasswordModalEl) privateRoomPasswordModalEl.classList.add('active');
        if (passwordModalInputEl) passwordModalInputEl.focus();
        disableLobbyButtons();
    }
    function hidePasswordPromptModal() {
        if (privateRoomPasswordModalEl) privateRoomPasswordModalEl.classList.remove('active');
        currentJoiningRoomId = null;
        enableLobbyButtons(); 
    }
    function handleSubmitPasswordModal(event) {
        event.preventDefault();
        const password = passwordModalInputEl.value;
        const playerName = joinPlayerNameInput.value.trim() || 'Jugador 2';
        localStorage.setItem('playerName', playerName);
        if (!password) {
            passwordErrorTextEl.textContent = 'La contraseña no puede estar vacía.';
            passwordErrorTextEl.style.display = 'block';
            passwordModalInputEl.focus();
            return;
        }
        if (currentJoiningRoomId) {
            passwordErrorTextEl.textContent = '';
            passwordErrorTextEl.style.display = 'none';
            submitPasswordButtonEl.disabled = true;
            submitPasswordButtonEl.textContent = 'Uniéndote...';
            sendToServer('joinRoom', { playerName, roomId: currentJoiningRoomId, password, gameType: 'mentiroso' });
        } else {
            hidePasswordPromptModal();
        }
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
    
    // --- Función para polling automático de salas ---
    function setupAutomaticRoomPolling() {
        // Solicitar salas inmediatamente al cargar
        setTimeout(() => {
            if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN && !gameState.gameActive) {
                sendToServer('getRooms', {});
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
                
                console.log('🔄 Solicitando actualización automática de salas (Mentiroso)');
                sendToServer('getRooms', {});
            }
        }, 3000); // Cada 3 segundos
    }

    // --- Start App ---
    initializeApp();

    // Utilidad para disparar eventos personalizados relacionados con el juego
    function dispatchGameEvent(eventName, detail) {
        try {
            const event = new CustomEvent(eventName, { detail: detail });
            window.dispatchEvent(event);
            console.log(`Evento disparado: ${eventName}`, detail);
        } catch (error) {
            console.error(`Error al disparar evento ${eventName}:`, error);
        }
    }

    // Añadir manejo de errores adicional para mostrar errores claramente
    window.addEventListener('error', function(e) {
        console.error('Error global:', e.message, e);
        showError(`Error en el juego: ${e.message}. Prueba refrescar la página.`);
    });

    // Asegurarse de que la visualización de la categoría se actualice correctamente
    window.addEventListener('mentirosoNextRound', function(e) {
        if (e.detail && e.detail.isNewCategory) {
            console.log("🎮 Nueva categoría detectada:", e.detail.category);
            
            // Asegurar que la UI se actualice correctamente
            setTimeout(() => {
                updateGameStatusDisplay();
                updateChallengeArea();
            }, 100);
        }
    });

    // Asegurarse de que updateCategoryPills se llame cuando se dispare el evento mentirosoNextRound
    window.addEventListener('mentirosoNextRound', function(e) {
        if (e.detail) {
            const categoryIndex = e.detail.globalCategoryIndex || 0;
            updateCategoryPills(categoryIndex);
            
            // Verificar y corregir posibles inconsistencias
            const expectedCategory = CATEGORY_ORDER[categoryIndex];
            if (e.detail.category && e.detail.category !== expectedCategory) {
                console.warn(`Inconsistencia en el evento: categoría ${e.detail.category} no coincide con el índice ${categoryIndex} (${expectedCategory})`);
                // Actualizar la UI para reflejar la categoría correcta según el índice
                if (gameRoundDisplayEl) {
                    const categoryElements = gameRoundDisplayEl.querySelectorAll('.category-counter');
                    if (categoryElements.length > 0) {
                        categoryElements[0].textContent = `Categoría ${categoryIndex+1}/6: ${expectedCategory}`;
                    }
                }
            }
        }
    });

    // Añadir soporte para comunicación de salas disponibles
    window.addEventListener('message', function(event) {
        // Verificar origen del mensaje por seguridad
        if (event.origin !== window.location.origin) return;
        
        // Si nos piden las salas disponibles
        if (event.data && event.data.type === 'requestRooms' && event.data.gameType === 'mentiroso') {
            // Verificar si hay conexión WebSocket activa
            if (!gameState.websocket || gameState.websocket.readyState !== WebSocket.OPEN) {
                // Enviar lista vacía si no hay conexión
                event.source.postMessage({
                    type: 'availableRooms',
                    gameType: 'mentiroso',
                    rooms: []
                }, event.origin);
                return;
            }
            
            // Solicitar salas al servidor
            sendToServer('getRooms', {});
            
            // Guardar el origen para responder cuando recibamos la lista del servidor
            gameState.pendingRoomsRequest = {
                source: event.source,
                origin: event.origin
            };
        }
    });
}); 
