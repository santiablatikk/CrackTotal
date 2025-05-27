const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const fs = require('fs'); // Added for file system operations
const path = require('path'); // Added for constructing file paths

// --- Constants ---
const MAX_LEVELS = 6;
const QUESTIONS_PER_LEVEL = 3; // Number of questions per level before advancing
const DATA_DIR = path.join(__dirname, 'data'); // Assuming 'data' folder is in the same directory as server.js

// --- Server Setup ---
// We need an HTTP server primarily to handle the WebSocket upgrade requests.
const server = http.createServer((req, res) => {
    // Basic response for any HTTP request other than WebSocket upgrade
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running.');
});

// Obtener puerto de Render o usar 8081 por defecto
const PORT = process.env.PORT || 8081;

// Attach WebSocket server to the HTTP server
const wss = new WebSocket.Server({ server });

server.listen(PORT, () => {
    console.log(`Servidor HTTP y WebSocket iniciado en el puerto ${PORT}...`);
    loadQuestions(); // Load questions for Quien Sabe Mas
    
    // DISABLED: Automatic room broadcasting to prevent mixing game types
    // Each client will request rooms specifically with gameType filter
    // setInterval(broadcastAvailableRooms, 5000);
});

// --- Game Data Loading ---
let allQuestions = {}; // Store questions globally { level: [processedQuestion, ...] }

function processRawQuestion(rawQ, level) {
    // Ensure basic structure exists based on level
    if (!rawQ || typeof rawQ.pregunta !== 'string' || typeof rawQ.respuesta_correcta !== 'string') {
        console.warn(`[L${level} - ERROR FORMATO BASICO] Pregunta saltada. Falta 'pregunta' o 'respuesta_correcta' como string. Pregunta: ${rawQ ? rawQ.pregunta : 'DESCONOCIDA'}`);
        return null;
    }

    let optionsArray = [];
    let correctIndex = -1;
    let correctAnswerText = '';
    const optionKeys = ['A', 'B', 'C', 'D'];

    // ALL LEVELS will now be processed this way:
    if (!rawQ.opciones || typeof rawQ.opciones !== 'object' || rawQ.opciones === null) { // Añadido chequeo de null
        console.warn(`[L${level} - ERROR OPCIONES] Pregunta saltada. Falta 'opciones' o no es un objeto. Pregunta: ${rawQ.pregunta}`);
        return null;
    }

    optionsArray = optionKeys.map(key => {
        const optionValue = rawQ.opciones[key];
        if (typeof optionValue !== 'string') {
            console.warn(`[L${level} - ERROR OPCION INDIVIDUAL] Opción '${key}' para la pregunta '${rawQ.pregunta}' no es un string. Valor: ${optionValue}`);
            return undefined; // Marcar como indefinido para filtrarlo luego
        }
        return optionValue;
    });

    // Filtrar opciones indefinidas y verificar que queden 4
    const validOptionsArray = optionsArray.filter(opt => opt !== undefined);
    if (validOptionsArray.length !== 4) {
        console.warn(`[L${level} - ERROR NUMERO OPCIONES] Pregunta saltada. No tiene exactamente 4 opciones de texto válidas después de procesar. Pregunta: ${rawQ.pregunta}. Opciones procesadas: [${validOptionsArray.join(', ')}]`);
        return null;
    }
    // Usar validOptionsArray para el resto de la lógica
    optionsArray = validOptionsArray;


    correctIndex = optionKeys.indexOf(rawQ.respuesta_correcta); // rawQ.respuesta_correcta MUST be 'A', 'B', 'C', or 'D'
    if (correctIndex === -1) {
        console.warn(`[L${level} - ERROR RESPUESTA] Clave de respuesta correcta inválida ('${rawQ.respuesta_correcta}') para P: ${rawQ.pregunta}. Debe ser A, B, C, o D.`);
        return null;
    }
    correctAnswerText = optionsArray[correctIndex];

    const normalizedCorrectAnswer = correctAnswerText.toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, "");

    if (!normalizedCorrectAnswer) {
        console.warn(`[L${level} - ERROR TEXTO RESPUESTA] No se pudo determinar texto de respuesta válido para P: ${rawQ.pregunta}`);
        return null;
    }

    return {
        text: rawQ.pregunta,
        options: optionsArray,
        correctIndex: correctIndex,
        correctAnswerText: normalizedCorrectAnswer,
        level: level
    };
}

function loadQuestions() {
    console.log("===========================================");
    console.log("       CARGANDO PREGUNTAS - INICIO         ");
    console.log("===========================================");
    console.log(`Buscando preguntas en el directorio: ${DATA_DIR}...`);
    allQuestions = {};
    let totalLoadedOverall = 0;
    let totalProcessedOverall = 0;

    try {
        for (let level = 1; level <= MAX_LEVELS; level++) {
            console.log(`--- Cargando Nivel ${level} ---`);
            const filePath = path.join(DATA_DIR, `level_${level}.json`);
            let questionsForThisLevelProcessed = 0;
            let questionsForThisLevelValid = 0;

            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                let jsonData;
                try {
                    jsonData = JSON.parse(fileContent);
                } catch (parseError) {
                    console.error(`[NIVEL ${level}] ERROR FATAL: El archivo JSON está malformado y no se pudo parsear: ${filePath}. Error: ${parseError.message}`);
                    allQuestions[level] = [];
                    continue; // Saltar al siguiente nivel
                }
                
                if (jsonData && jsonData.preguntas && Array.isArray(jsonData.preguntas)) {
                    questionsForThisLevelProcessed = jsonData.preguntas.length;
                    totalProcessedOverall += questionsForThisLevelProcessed;

                    allQuestions[level] = jsonData.preguntas
                                            .map(q => processRawQuestion(q, level))
                                            .filter(q => q !== null);
                    questionsForThisLevelValid = allQuestions[level].length;
                    totalLoadedOverall += questionsForThisLevelValid;
                    
                    if (questionsForThisLevelProcessed === 0) {
                        console.warn(`[NIVEL ${level}] No se encontraron preguntas en el array 'preguntas' en ${filePath}.`);
                    } else if (questionsForThisLevelValid === 0 && questionsForThisLevelProcessed > 0) {
                        console.error(`[NIVEL ${level}] Se procesaron ${questionsForThisLevelProcessed} preguntas, pero NINGUNA fue válida. Revisa los logs de errores para este nivel.`);
                    } else {
                        console.log(`[NIVEL ${level}] Procesadas: ${questionsForThisLevelProcessed}, Válidas cargadas: ${questionsForThisLevelValid}.`);
                    }
                } else {
                    console.error(`[NIVEL ${level}] ERROR FORMATO: No se encontró el array 'preguntas' o el formato es incorrecto en ${filePath}.`);
                    allQuestions[level] = [];
                }
            } else {
                console.warn(`[NIVEL ${level}] ARCHIVO NO ENCONTRADO: ${filePath}`);
                allQuestions[level] = [];
            }
            console.log(`--- Fin Carga Nivel ${level} ---`);
        }
        console.log("===========================================");
        console.log("        CARGANDO PREGUNTAS - FIN           ");
        console.log(`Total de preguntas procesadas en todos los niveles: ${totalProcessedOverall}`);
        console.log(`Total de preguntas VÁLIDAS cargadas en todos los niveles: ${totalLoadedOverall}`);
        console.log("===========================================");
        if (totalLoadedOverall === 0 && totalProcessedOverall > 0) {
             console.error("CRITICO: Se procesaron preguntas, pero NINGUNA fue válida globalmente. El juego no funcionará.");
        } else if (totalLoadedOverall === 0) {
            console.error("CRITICO: No se cargaron preguntas válidas. El juego no puede funcionar.");
        }
    } catch (error) {
        console.error("ERROR GENERAL DURANTE LA CARGA DE PREGUNTAS:", error);
        allQuestions = {};
    }
}

// --- Game State Management ---
const clients = new Map(); // Map<WebSocket, {id: string, roomId: string | null}>
const rooms = new Map(); // Map<string, Room>
// interface Room {
//     roomId: string;
//     players: { player1: Player | null, player2: Player | null };
//     password?: string;
//     gameActive: boolean;
//     spectators: WebSocket[]; // Optional
//     // Game state added:
//     currentTurn: string | null; // Player ID of the current turn
//     currentLevel: number;
//     questionsAnsweredInLevel: number;
//     usedQuestionIndices: { [level: number]: number[] }; // Tracks indices used per level
//     currentQuestion: any | null; // The question object currently active
//     optionsSent: boolean; // Track if options were sent for current level > 1 question
//     fiftyFiftyUsed: boolean; // Track if 50/50 was used for current question turn
//     questionsPerLevel: number; // Config stored per room
// }
// interface Player {
//     id: string;
//     name: string;
//     ws: WebSocket;
//     score: number;
// }

// --- Helper Functions ---
function generateUniqueId() {
    return Math.random().toString(36).substring(2, 9);
}

function generateRoomId() {
    let newId;
    do {
        newId = Math.floor(1000 + Math.random() * 9000).toString();
    } while (rooms.has(newId));
    return newId;
}

// NEW FUNCTION: Broadcast available rooms to lobby clients
function broadcastAvailableRooms() {
    console.log('--- Broadcasting Available Rooms ---');
    const availableRoomsList = [];
    for (const [roomId, room] of rooms.entries()) {
        // Criteria: Not active, waiting for player 2
        if (!room.gameActive && room.players.player1 && !room.players.player2) { // NEW CRITERIA: list all non-active rooms with 1 player
            console.log(`Room ${roomId} is available (Player: ${room.players.player1.name}, Password: ${room.password ? 'Yes' : 'No'}, Type: ${room.gameType || 'default'})`);
            availableRoomsList.push({
                id: roomId,
                playerCount: 1, // Always 1 if it meets criteria
                maxPlayers: 2,
                requiresPassword: !!room.password, // True if room.password is a non-empty string
                // Optionally add creator's name if needed by client UI
                 creatorName: room.players.player1.name,
                 gameType: room.gameType || 'quiensabemas' // Default to quiensabemas if not specified
            });
        }
    }

    const message = {
        type: 'availableRooms',
        payload: { rooms: availableRoomsList }
    };
    const messageString = JSON.stringify(message);
    let lobbyCount = 0;

    // Send to clients in the lobby (roomId is null)
    clients.forEach((clientInfo, ws) => {
        if (clientInfo.roomId === null && ws.readyState === WebSocket.OPEN) {
            ws.send(messageString);
            lobbyCount++;
        }
    });
    console.log(`Sent available rooms list to ${lobbyCount} client(s) in lobby.`);
    console.log('--- Finished Broadcasting Rooms ---');
}

// Broadcast to everyone IN THE ROOM (players and spectators)
function broadcastToRoom(roomId, message, senderWs = null) {
    const room = rooms.get(roomId);
    if (!room) return;

    const messageString = JSON.stringify(message);
    // console.log(`Broadcasting to room ${roomId}:`, messageString); // Verbose

    const players = [room.players.player1, room.players.player2].filter(p => p);
    players.forEach(player => {
        // Ensure player.ws exists before checking readyState
        if (player && player.ws && player.ws !== senderWs && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(messageString);
        }
    });
    if (room.spectators) { // Check if spectators array exists
    room.spectators.forEach(spectatorWs => {
         if (spectatorWs !== senderWs && spectatorWs.readyState === WebSocket.OPEN) {
             spectatorWs.send(messageString);
         }
    });
    }
}

// Send message safely to a specific WebSocket client
function safeSend(ws, message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        // console.warn("Attempted to send message to a closed or invalid WebSocket."); // Can be noisy
    }
}

// --- WebSocket Event Handlers ---
wss.on('connection', (ws, req) => {
    const clientId = generateUniqueId();
    clients.set(ws, { id: clientId, roomId: null });
    console.log(`Client connected: ${clientId} (Total: ${clients.size})`);
    safeSend(ws, { type: 'yourInfo', payload: { playerId: clientId } });
    
    // REMOVED: Automatic room broadcast on connection
    // Client will request rooms specifically with gameType filter

    ws.on('message', (message) => {
        let parsedMessage;
        try {
            // Limit message size to prevent abuse
             const messageString = message.toString(); // Ensure it's a string
            if (messageString.length > 4096) {
                console.warn(`Message too long from ${clientId}. Closing connection.`);
                ws.terminate();
                return;
            }
            parsedMessage = JSON.parse(messageString);
            // console.log(`Received from ${clientId}:`, parsedMessage); // Less verbose logging
            handleClientMessage(ws, parsedMessage);
        } catch (error) {
            console.error(`Failed to parse message or handle: ${message}`, error);
            safeSend(ws, { type: 'errorMessage', payload: { error: 'Invalid message format.' } });
        }
    });

    ws.on('close', () => {
        const clientInfo = clients.get(ws);
        if (clientInfo) {
            console.log(`Client disconnected: ${clientInfo.id}`);
            handleDisconnect(ws, clientInfo.id, clientInfo.roomId);
            clients.delete(ws);
            console.log(`Client removed. Total clients: ${clients.size}`);
        } else {
            // console.log('Unknown client disconnected.'); // Less verbose
        }
    });

    ws.on('error', (error) => {
        const clientInfo = clients.get(ws);
        const clientId = clientInfo ? clientInfo.id : 'unknown';
        console.error(`WebSocket error for client ${clientId}:`, error);
        // Attempt graceful disconnect and cleanup if possible
        if (clientInfo) {
            handleDisconnect(ws, clientInfo.id, clientInfo.roomId); // Try cleanup
            clients.delete(ws);
            console.log(`Client removed after error. Total clients: ${clients.size}`);
        }
        // Terminate the connection if it's still open
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
             ws.terminate();
        }
    });
});

// --- Message Routing ---
function handleClientMessage(ws, message) {
    const clientInfo = clients.get(ws);
    if (!clientInfo) { return; } // Should not happen if client is connected

    // Log message type and player ID for debugging
    // console.log(`Handling message type: ${message.type} from player ${clientInfo.id}`);

    switch (message.type) {
        case 'createRoom':
            handleCreateRoom(ws, clientInfo, message.payload);
            break;
        case 'joinRoom':
            handleJoinRoom(ws, clientInfo, message.payload);
            break;
        case 'joinRandomRoom':
             handleJoinRandomRoom(ws, clientInfo, message.payload);
             break;
        case 'leaveRoom': // Added leave room handler
            handleLeaveRoom(ws, clientInfo);
            break;
        case 'getRooms':
            handleGetRooms(ws, clientInfo, message.payload);
            break;
        // --- Game Actions (Quien Sabe Mas) ---
        case 'submitAnswer':
             handleSubmitAnswer(ws, clientInfo, message.payload);
             break;
        case 'requestOptions':
            handleRequestOptions(ws, clientInfo);
             break;
        case 'requestFiftyFifty':
            handleRequestFiftyFifty(ws, clientInfo);
            break;
        // --- Game Actions (Mentiroso) ---
        case 'mentirosoSubmitBid':
            handleMentirosoSubmitBid(ws, clientInfo, message.payload);
            break;
        case 'mentirosoCallLiar':
            handleMentirosoCallLiar(ws, clientInfo, message.payload);
            break;
        case 'mentirosoSubmitAnswers':
            handleMentirosoSubmitAnswers(ws, clientInfo, message.payload);
            break;
        case 'mentirosoSubmitValidation':
            handleMentirosoSubmitValidation(ws, clientInfo, message.payload);
            break;
        default:
            console.warn(`Unknown message type received from ${clientInfo.id}: ${message.type}`);
            safeSend(ws, { type: 'errorMessage', payload: { error: `Unknown message type: ${message.type}` } });
    }
}

// --- Handler Implementations ---

function handleCreateRoom(ws, clientInfo, payload) {
    if (clientInfo.roomId) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Ya estás en una sala.' } });
        return;
    }
    const roomId = generateRoomId();
    const playerName = payload.playerName || `Jugador_${clientInfo.id.substring(0, 4)}`;
    const password = payload.password || ''; // Empty string if no password
    const gameType = payload.gameType || 'quiensabemas'; // Default to quiensabemas

    const player1 = {
        id: clientInfo.id,
        name: playerName,
        ws: ws,
        score: 0
    };

    const newRoom = {
        roomId: roomId,
        gameType: gameType,
        players: { player1: player1, player2: null },
        password: password,
        gameActive: false,
        spectators: [],
        // Game state initialization (will be properly set in startGame)
        currentTurn: null,
        currentLevel: 1,
        questionsAnsweredInLevel: 0,
        usedQuestionIndices: {},
        currentQuestion: null,
        optionsSent: false,
        fiftyFiftyUsed: false,
        questionsPerLevel: QUESTIONS_PER_LEVEL, // Store config per room
        // Mentiroso specific state
        mentirosoState: gameType === 'mentiroso' ? {
            currentRound: 1,
            maxRounds: 18,
            categoryRound: 1,
            globalCategoryIndex: 0,
            currentCategory: null,
            challengeTextTemplate: "",
            lastBidder: null,
            currentBid: 0,
            playerWhoCalledMentiroso: null,
            playerToListAnswers: null,
            answersListed: [],
            validationResults: [],
            gamePhase: 'lobby',
            scores: {}
        } : null
    };

    rooms.set(roomId, newRoom);
    clientInfo.roomId = roomId; // Update client's state

    console.log(`Room ${roomId} (${gameType}) created by ${playerName} (${clientInfo.id}). Password: ${password ? 'Yes' : 'No'}`);
    safeSend(ws, { type: 'roomCreated', payload: { roomId: roomId } });

    // REMOVED: Automatic broadcast - clients will request rooms with gameType filter
}

function handleJoinRoom(ws, clientInfo, payload) {
    if (clientInfo.roomId) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Ya estás en una sala.' } });
        return;
    }
    // Ensure payload exists before destructuring
    if (!payload) {
         safeSend(ws, { type: 'joinError', payload: { error: 'Invalid join request.' } });
        return;
    }
    const { roomId, password, playerName } = payload;
     if (!roomId) {
         safeSend(ws, { type: 'joinError', payload: { error: 'Room ID is required.' } });
         return;
     }
    const room = rooms.get(roomId);

    if (!room) {
        safeSend(ws, { type: 'joinError', payload: { error: `La sala ${roomId} no existe.` } });
        return;
    }

    // Check password
    if (room.password && room.password !== password) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Contraseña incorrecta.' } });
        return;
    }

    // Check if room is full
    if (room.players.player1 && room.players.player2) {
        safeSend(ws, { type: 'joinError', payload: { error: 'La sala ya está llena.' } });
        return;
    }

    // Ensure player1 exists before proceeding
    if (!room.players.player1) {
        console.error(`Room ${roomId} has no player 1, cannot join.`);
        safeSend(ws, { type: 'joinError', payload: { error: 'Error interno de la sala.' } });
        return;
    }


    // Add player 2
    const player2 = {
        id: clientInfo.id,
        name: playerName || `Jugador_${clientInfo.id.substring(0, 4)}`,
        ws: ws,
        score: 0
    };
    room.players.player2 = player2;
    clientInfo.roomId = roomId; // Update client's state

    console.log(`${player2.name} (${clientInfo.id}) joined room ${roomId}`);

    // Notify both players they are joined and prepare for game start
    const playersInfo = {
        player1: { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score },
        player2: { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score }
    };

    // Send join success specifically to the joining player (player 2)
    safeSend(ws, { type: 'joinSuccess', payload: { roomId: roomId, players: playersInfo } });

    // Notify player 1 that player 2 joined
    safeSend(room.players.player1.ws, { type: 'playerJoined', payload: { players: playersInfo } });

    // Start the game now that both players are in
    startGame(roomId);

    // REMOVED: Automatic broadcast - clients will request rooms with gameType filter
}

function handleJoinRandomRoom(ws, clientInfo, payload) {
    if (clientInfo.roomId) {
        safeSend(ws, { type: 'randomJoinError', payload: { error: 'Ya estás en una sala.' } });
        return;
    }

    let availableRoomId = null;
    // Find a public room with exactly one player
    for (const [roomId, room] of rooms.entries()) {
        if (!room.password && room.players.player1 && !room.players.player2 && !room.gameActive) {
             // Ensure the only player isn't the one trying to join
             if (room.players.player1.id !== clientInfo.id) {
                // Check gameType if provided in payload, otherwise join any
                if (payload && payload.gameType && room.gameType !== payload.gameType) {
                    continue; // Skip if game types don't match
                }
                availableRoomId = roomId;
                break;
            }
        }
    }

    if (availableRoomId) {
        // Join the found room
        console.log(`Found random room ${availableRoomId} for ${clientInfo.id}`);
         handleJoinRoom(ws, clientInfo, {
            roomId: availableRoomId,
            password: '', // Public room, no password
            playerName: payload ? payload.playerName : undefined, // Handle potential missing payload
            // gameType is implicitly handled by the room found
        });
    } else {
        // No room found, create a new public QSM room.
        const targetGameType = (payload && payload.gameType) || 'quiensabemas'; // Default to QSM if not specified
        console.log(`No random ${targetGameType} room found for ${clientInfo.id}. Creating new public quiensabemas room.`);
            handleCreateRoom(ws, clientInfo, { playerName: payload ? payload.playerName : undefined, password: '' });
    }
}

function handleLeaveRoom(ws, clientInfo) {
    const roomId = clientInfo.roomId;
    if (!roomId) {
        // safeSend(ws, { type: 'errorMessage', payload: { error: 'You are not in a room.' } });
        return; // Not in a room, nothing to leave
    }

    const room = rooms.get(roomId);
    if (!room) {
        console.warn(`Client ${clientInfo.id} tried to leave non-existent room ${roomId}`);
        clientInfo.roomId = null; // Correct client state anyway
        return;
    }

    console.log(`Player ${clientInfo.id} is leaving room ${roomId}`);
    const leavingPlayerId = clientInfo.id;
    let remainingPlayer = null;
    let leavingPlayerName = 'Opponent';

    // Remove player from room and get their name
    if (room.players.player1 && room.players.player1.id === leavingPlayerId) {
        leavingPlayerName = room.players.player1.name;
        remainingPlayer = room.players.player2;
        room.players.player1 = null;
    } else if (room.players.player2 && room.players.player2.id === leavingPlayerId) {
        leavingPlayerName = room.players.player2.name;
        remainingPlayer = room.players.player1;
        room.players.player2 = null;
    }

    // Update client state (must happen after checking room)
    clientInfo.roomId = null;

    // Check room status
    if (!room.players.player1 && !room.players.player2) {
        // Room is empty, delete it
        console.log(`Room ${roomId} is empty, deleting.`);
        rooms.delete(roomId);
    } else if (remainingPlayer && room.gameActive) {
        // Game was active, opponent left, remaining player wins
        console.log(`Game in room ${roomId} ended due to player ${leavingPlayerId} leaving.`);
        // Use the name we captured before setting the player to null
        endGame(roomId, `${leavingPlayerName} left the game.`);
        // Notify the remaining player
        safeSend(remainingPlayer.ws, {
            type: 'gameOver',
            payload: {
                reason: `${leavingPlayerName} left the game.`, // Use a generic payload, endGame handles details
                 winnerId: remainingPlayer.id // Indicate winner explicitly
            }
        });
        // Room might persist until the winner leaves or manually removed
        room.gameActive = false; // Mark game as inactive
    } else if (remainingPlayer) {
        // Game wasn't active (lobby), just notify remaining player opponent left
        safeSend(remainingPlayer.ws, {
            type: 'opponentLeftLobby',
            payload: { message: `${leavingPlayerName} has left the lobby.` }
         });
    }

    // REMOVED: Automatic broadcast - clients will request rooms with gameType filter
}

// --- Game Logic Handlers ---

function startGame(roomId) {
    const room = rooms.get(roomId);
    // Add rigorous checks
    if (!room) {
         console.error(`startGame called for non-existent room: ${roomId}`);
         return;
     }
    if (!room.players.player1 || !room.players.player2) {
        console.error(`Cannot start game in room ${roomId}: Missing players. P1:${!!room.players.player1}, P2:${!!room.players.player2}`);
        // Maybe notify players if possible?
        return;
    }
     if (room.gameActive) {
         console.warn(`startGame called for already active room: ${roomId}`);
         return; // Prevent restarting an active game
     }

    console.log(`Starting ${room.gameType} game in room ${roomId}...`);

    // Initialize game state
    room.gameActive = true;
    room.players.player1.score = 0; // Reset scores
    room.players.player2.score = 0;

    // Randomly select starting player
    room.currentTurn = Math.random() < 0.5 ? room.players.player1.id : room.players.player2.id;

    const playersInfo = {
        player1: { id: room.players.player1.id, name: room.players.player1.name, score: 0 },
        player2: { id: room.players.player2.id, name: room.players.player2.name, score: 0 }
    };

    if (room.gameType === 'mentiroso') {
        // Initialize Mentiroso specific state
        room.mentirosoState.gameActive = true;
        room.mentirosoState.scores = {};
        room.mentirosoState.scores[room.players.player1.id] = 0;
        room.mentirosoState.scores[room.players.player2.id] = 0;
        
        // Send gameStart message for Mentiroso
        const startMessage = { type: 'mentirosoGameStart', payload: { players: playersInfo, currentTurn: room.currentTurn } };
        broadcastToRoom(roomId, startMessage);
        
        // Start first round
        setTimeout(() => {
            nextRoundMentiroso(roomId);
        }, 1000);
    } else {
        // Initialize Quien Sabe Mas specific state
        room.currentLevel = 1;
        room.questionsAnsweredInLevel = 0;
        room.usedQuestionIndices = {}; // Reset used questions for new game
        for (let l = 1; l <= MAX_LEVELS; l++) { // Initialize for all potential levels
            room.usedQuestionIndices[l] = [];
        }
        room.currentQuestion = null;
        room.optionsSent = false;
        room.fiftyFiftyUsed = false;

        // Send gameStart message to both players
        const startMessage = { type: 'gameStart', payload: { players: playersInfo, startingPlayerId: room.currentTurn } };
        safeSend(room.players.player1.ws, startMessage);
        safeSend(room.players.player2.ws, startMessage);

        // Send the first question immediately
        setTimeout(() => {
            sendNextQuestion(roomId);
        }, 50); // Short delay (50ms)
    }
}

function sendNextQuestion(roomId) {
    // console.log(`DEBUG: sendNextQuestion called for room ${roomId}`); // Less verbose
    const room = rooms.get(roomId);
    if (!room || !room.gameActive) {
         // console.log(`DEBUG: sendNextQuestion aborted for room ${roomId} - Room not found or game not active.`); // Less verbose
        return;
    }
    // Ensure players are still present
    if (!room.players.player1 || !room.players.player2) {
        console.warn(`DEBUG: sendNextQuestion aborted for room ${roomId} - Player missing.`);
        // Game might have ended due to disconnect between answer and next question
        return;
    }


    console.log(`Sending next question for room ${roomId}, Level ${room.currentLevel}`);

    // Check for level advancement
    if (room.questionsAnsweredInLevel >= room.questionsPerLevel) {
        room.currentLevel++;
        room.questionsAnsweredInLevel = 0;
        console.log(`Advancing room ${roomId} to Level ${room.currentLevel}`);
    }

    // Check if game should end (max level reached)
    if (room.currentLevel > MAX_LEVELS) {
        console.log(`Room ${roomId} reached max level.`);
        endGame(roomId, "Completed all levels!");
        return;
    }

    // Ensure the level exists in loaded questions
     // console.log(`DEBUG: Checking questions for Level ${room.currentLevel}...`); // Less verbose
    if (!allQuestions[room.currentLevel] || allQuestions[room.currentLevel].length === 0) {
        console.error(`CRITICAL: No questions available for Level ${room.currentLevel} in room ${roomId}. Ending game.`); // Keep critical error
        endGame(roomId, "Error: No questions available for this level.");
        return;
    }
     // console.log(`DEBUG: Found ${allQuestions[room.currentLevel].length} questions for Level ${room.currentLevel}.`); // Less verbose

    // Select a random, unused question for the current level
    const questionsForLevel = allQuestions[room.currentLevel];
     // Ensure the array exists before accessing it
     if (!room.usedQuestionIndices[room.currentLevel]) {
        room.usedQuestionIndices[room.currentLevel] = [];
    }
    const usedIndices = room.usedQuestionIndices[room.currentLevel];
    const availableIndices = questionsForLevel
        .map((_, index) => index)
        .filter(index => !usedIndices.includes(index));

     // console.log(`DEBUG: Level ${room.currentLevel} - Used Indices: [${usedIndices.join(', ')}, Available Indices: [${availableIndices.join(', ')}]`); // Less verbose

    if (availableIndices.length === 0) {
        console.warn(`No unused questions left for Level ${room.currentLevel} in room ${roomId}. Ending game.`);
        endGame(roomId, `Ran out of questions for Level ${room.currentLevel}.`);
        return;
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    room.currentQuestion = questionsForLevel[randomIndex];
     // console.log(`DEBUG: Selected question index ${randomIndex} for Level ${room.currentLevel}. Text: ${room.currentQuestion.text}`); // Less verbose

    // Mark question as used for this room and level
    room.usedQuestionIndices[room.currentLevel].push(randomIndex);

    // Increment count AFTER selecting the question for this turn
    room.questionsAnsweredInLevel++;

    // Reset turn-specific state
    room.optionsSent = false;
    room.fiftyFiftyUsed = false;

    // Prepare payload (exclude answer info)
    const questionPayload = {
        level: room.currentQuestion.level,
        text: room.currentQuestion.text,
        // Send options immediately for levels > 1 for simplicity
        options: room.currentQuestion.options // NEW WAY: Always send processed options
    };

     // Ensure players exist before accessing properties
     const player1Info = room.players.player1 ? { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score } : null;
     const player2Info = room.players.player2 ? { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score } : null;

     if (!player1Info || !player2Info) {
          console.error(`DEBUG: Player data missing when sending newQuestion for room ${roomId}`); // Keep Error
          return; // Cannot proceed without player info
      }

     const playersInfo = { player1: player1Info, player2: player2Info };


     const message = {
         type: 'newQuestion',
         payload: {
            question: questionPayload,
            questionNumber: room.questionsAnsweredInLevel,
            totalQuestionsInLevel: room.questionsPerLevel,
             currentTurn: room.currentTurn,
            players: playersInfo
        }
    };

    console.log(`Room ${roomId} - Sending Q${room.questionsAnsweredInLevel} L${room.currentLevel}, Turn: ${room.currentTurn}`); // Keep this summary log
     // console.log(`DEBUG: Broadcasting newQuestion message for room ${roomId}...`); // Less verbose
    broadcastToRoom(roomId, message);
    // Also send individually to handle cases where broadcast might miss one? Redundant if broadcast works? Let's rely on broadcast for now.
    // safeSend(room.players.player1.ws, message);
    // safeSend(room.players.player2.ws, message);
     // console.log(`DEBUG: newQuestion message sent for room ${roomId}.`); // Less verbose
}

function handleSubmitAnswer(ws, clientInfo, payload) {
    const roomId = clientInfo.roomId;
    const room = rooms.get(roomId);

    if (!room || !room.gameActive) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Game not active.' } });
        return;
    }
    if (clientInfo.id !== room.currentTurn) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Not your turn.' } });
        return;
    }
    if (!room.currentQuestion) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No active question.' } });
        return;
    }
    // Check players still exist
    if (!room.players.player1 || !room.players.player2) {
         console.warn(`handleSubmitAnswer called in room ${roomId} but a player is missing.`);
         // If a player is missing, end the game
         if (room.gameActive) endGame(roomId, "Player disconnected before answering.");
         return; // Avoid errors if a player disconnected right before answering
    }

    const question = room.currentQuestion;
    let isCorrect = false;
    let pointsAwarded = 0;
    let submittedAnswerIndex = -1; // For levels > 1 option clicks

    // Normalize submitted text answer if present
    // const playerAnswerText = payload && typeof payload.answerText === 'string'
    //     ? payload.answerText.toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, "")
    //     : ''; // REMOVED
    // submittedAnswerText = payload?.answerText || ''; // Keep original for display // REMOVED

    if (payload && typeof payload.selectedIndex === 'number') {
            // If no text, check for selected index (options must have been requested)
             submittedAnswerIndex = payload.selectedIndex;
            if (submittedAnswerIndex >= 0 && submittedAnswerIndex < question.options.length) {
                // Check if options were actually sent before accepting index answer
            // For QSM 1v1, options are always sent with the question now for all levels.
            // if (!room.optionsSent) { // This check might be less relevant if options are always with question
            //     console.warn(`Room ${roomId} Answer: Index submitted but options were not requested/sent.`);
            //     safeSend(ws, { type: 'errorMessage', payload: { error: 'Cannot answer with index before requesting options.' } });
            //     return;
            // }
                isCorrect = submittedAnswerIndex === question.correctIndex;
            // answerMethod = 'index'; // Already set to index
             console.log(`Room ${roomId} L${question.level} Answer (Index): Submitted Index=${submittedAnswerIndex}, Correct Index=${question.correctIndex}, Result=${isCorrect}`); // Keep answer logs
            } else {
                 // console.warn(`Room ${roomId} L>1 Answer: Invalid index submitted:`, payload.selectedIndex); // Less verbose
                 safeSend(ws, { type: 'errorMessage', payload: { error: 'Invalid answer format (index out of bounds).' } });
                 return; // Invalid submission
            }
        } else {
            // Neither text nor valid index provided for Level > 1
        console.warn(`Room ${roomId} L${question.level} Answer: No valid answer submitted (no selectedIndex). Payload:`, payload);
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Invalid answer format (missing selectedIndex).' } });
            return; // Invalid submission
    }

    // --- Score Calculation & Result Payload --- 
    const currentPlayer = room.players.player1.id === clientInfo.id ? room.players.player1 : room.players.player2;
    if (isCorrect) {
        // --- New Scoring Logic --- 
        // if (question.level === 1) { // OLD LEVEL 1 SCORING
        //     pointsAwarded = 1;
        // } else { // Levels 2-6 // OLD L>1 SCORING
        //     if (answerMethod === 'text') { // Answered without requesting options // TEXT METHOD REMOVED
        //         pointsAwarded = 2;
        //     } else { // Answered using options index
        //         if (room.fiftyFiftyUsed) {
        //             pointsAwarded = 0.5;
        //         } else {
        //             pointsAwarded = 1;
        //         }
        //     }
        // }

        // --- UNIFIED SCORING LOGIC FOR ALL LEVELS (ANSWERED BY INDEX) --- 
                if (room.fiftyFiftyUsed) {
            pointsAwarded = 0.5; // Half points if 50/50 was used
                } else {
            pointsAwarded = 1;   // Full point if answered correctly without 50/50
        }
        // For QSM 1v1, there's no concept of answering by text *before* options for levels > 1 anymore.
        // All answers are via selectedIndex.
        // The `optionsSent` flag might be less critical if options always come with the question.
        // If we want to re-introduce higher points for answering a hypothetical text input before options are shown for L>1 (not current setup):
        // We would need a way for the client to submit text for L>1 *instead* of an index, and then handle that path.
        // Given the current client sends selectedIndex, this scoring is simpler.

        // --- End New Scoring Logic ---
        currentPlayer.score += pointsAwarded;
    } else {
        pointsAwarded = 0; // Explicitly set to 0 if incorrect
    }

    // Correct answer text normalization should happen during question loading now
    // const normalizedCorrectAnswerText = question.correctAnswerText.toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, "");

    const resultPayload = {
        isCorrect: isCorrect,
        pointsAwarded: pointsAwarded,
        // Send the already normalized correctAnswerText from the question object
        correctAnswerText: question.correctAnswerText.toUpperCase(), 
        correctIndex: question.correctIndex, // Send correct index (will be -1 for L1)
        forPlayerId: clientInfo.id,
        // submittedAnswerText: answerMethod === 'text' ? submittedAnswerText : null, // REMOVED
        submittedAnswerText: null, // No text submission method anymore
        selectedIndex: submittedAnswerIndex // Send submitted index (was always by index)
    };

    // Send result to everyone in the room
    broadcastToRoom(roomId, { type: 'answerResult', payload: resultPayload });

    // Switch turn
    room.currentTurn = room.players.player1.id === clientInfo.id ? room.players.player2.id : room.players.player1.id;

    // Prepare state update message
     const playersInfo = {
        player1: { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score },
        player2: { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score }
    };
    const updatePayload = { currentTurn: room.currentTurn, players: playersInfo };
    const updateMessage = { type: 'updateState', payload: updatePayload };

     // Send state update to everyone
     broadcastToRoom(roomId, updateMessage);

    // Send next question after a short delay to allow clients to process result
    setTimeout(() => {
         // Check if room still exists and game is active before sending next question
         const currentRoom = rooms.get(roomId);
         if (currentRoom && currentRoom.gameActive) {
            sendNextQuestion(roomId);
         } else {
              // console.log(`DEBUG: Skipping sendNextQuestion for room ${roomId} as it no longer exists or game is inactive.`); // Less verbose
         }
    }, 1500); // Adjust delay as needed (e.g., 1.5 seconds)
}

function handleRequestOptions(ws, clientInfo) {
    const roomId = clientInfo.roomId;
    const room = rooms.get(roomId);

    // Add check for currentQuestion existence
    if (!room || !room.gameActive || clientInfo.id !== room.currentTurn || !room.currentQuestion || room.currentQuestion.level === 1) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Cannot request options now.' } });
         return;
    }
    if (room.optionsSent) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Options already requested/sent.' } });
         return;
     }

    room.optionsSent = true;
    // Ensure currentQuestion has options before sending
     if (!room.currentQuestion.options || room.currentQuestion.options.length === 0) {
          console.error(`Room ${roomId} - Cannot provide options for question without options array.`);
          safeSend(ws, { type: 'errorMessage', payload: { error: 'Error retrieving options for this question.' } });
          room.optionsSent = false; // Reset flag if failed
        return;
    }
    const optionsPayload = { options: room.currentQuestion.options };
    // console.log(`Room ${roomId} - Sending options to ${clientInfo.id}`); // Less verbose
    safeSend(ws, { type: 'optionsProvided', payload: optionsPayload });
}

function handleRequestFiftyFifty(ws, clientInfo) {
    const roomId = clientInfo.roomId;
    const room = rooms.get(roomId);

    // Add check for currentQuestion existence
     if (!room || !room.gameActive || clientInfo.id !== room.currentTurn || !room.currentQuestion || room.currentQuestion.level === 1 || !room.optionsSent || room.fiftyFiftyUsed) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Cannot use 50/50 now.' } });
         return;
     }
    // Ensure options array exists and has enough elements
     if (!room.currentQuestion.options || room.currentQuestion.options.length < 4) {
          console.error(`Room ${roomId} - Cannot apply 50/50: Invalid options data.`);
          safeSend(ws, { type: 'errorMessage', payload: { error: 'Error applying 50/50.' } });
         return;
     }

    room.fiftyFiftyUsed = true;
    const correctIndex = room.currentQuestion.correctIndex;
    const optionsCount = room.currentQuestion.options.length; // Should be 4
    let indicesToRemove = [];

    // Generate indices 0, 1, 2, 3
    const allIndices = Array.from({ length: optionsCount }, (_, i) => i);
    // Filter out the correct index
    const incorrectIndices = allIndices.filter(index => index !== correctIndex);

    // Shuffle incorrect indices
    for (let i = incorrectIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [incorrectIndices[i], incorrectIndices[j]] = [incorrectIndices[j], incorrectIndices[i]];
    }

    // Take the first two shuffled incorrect indices
    indicesToRemove = incorrectIndices.slice(0, 2);


    if (indicesToRemove.length === 2) {
        const fiftyFiftyPayload = { optionsToRemove: indicesToRemove };
        // console.log(`Room ${roomId} - Sending 50/50 removal indices ${indicesToRemove} to ${clientInfo.id}`); // Less verbose
        safeSend(ws, { type: 'fiftyFiftyApplied', payload: fiftyFiftyPayload });
    } else {
        // Fallback logic (should ideally not be reached with 4 options)
        console.error(`Room ${roomId} - Failed to select 2 indices for 50/50. Incorrect Indices:`, incorrectIndices);
        room.fiftyFiftyUsed = false; // Reset if failed
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Failed to apply 50/50.' } });
}
}


// --- End Game & Cleanup ---

function endGame(roomId, reason = "Game finished") {
    const room = rooms.get(roomId);
    if (!room) return;
     // Check if game is already inactive to prevent double execution
     if (!room.gameActive) {
          // console.log(`Game in room ${roomId} is already inactive. Ignoring endGame call.`); // Less verbose
          return;
      }


    console.log(`Ending game in room ${roomId}. Reason: ${reason}`);
    room.gameActive = false;

    let winnerId = null;
    let draw = false;
    const p1 = room.players.player1;
    const p2 = room.players.player2;

    // Determine winner based on score, handle cases where a player might be null
    if (p1 && p2) {
        if (p1.score > p2.score) winnerId = p1.id;
        else if (p2.score > p1.score) winnerId = p2.id;
        else draw = true;
    } else if (p1 && !p2) {
         winnerId = p1.id; // Player 1 wins if player 2 disconnected earlier
         reason = reason || `${p1.name} wins! Opponent disconnected.`; // Adjust reason if needed
    } else if (!p1 && p2) {
         winnerId = p2.id; // Player 2 wins if player 1 disconnected earlier
         reason = reason || `${p2.name} wins! Opponent disconnected.`; // Adjust reason if needed
    } else {
         // Both players null? Should not happen if called correctly, but handle defensively
         console.warn(`endGame called for room ${roomId} with no players.`);
         reason = reason || "Game ended unexpectedly.";
    }


    const finalScores = {};
    if (p1) finalScores[p1.id] = p1.score;
    if (p2) finalScores[p2.id] = p2.score;

    const gameOverPayload = {
            finalScores: finalScores,
            winnerId: winnerId,
            draw: draw,
            reason: reason
    };

    // Send gameOver message to both players (if they exist and are connected)
    const message = { type: 'gameOver', payload: gameOverPayload };
    if (p1) safeSend(p1.ws, message);
    if (p2) safeSend(p2.ws, message);

    // Consider cleanup: Keep room until players disconnect?
    // Let's keep it for now, disconnect logic handles removal.
    console.log(`Game ended for room ${roomId}. Final state sent.`);
    
    // REMOVED: Automatic broadcast - clients will request rooms with gameType filter
}

function handleDisconnect(ws, clientId, roomId) {
    console.log(`Handling disconnect for ${clientId} in room ${roomId || 'lobby'}`);
    if (roomId) {
    const room = rooms.get(roomId);
        if (room) {
    let remainingPlayer = null;
    let disconnectedPlayerName = 'Opponent';
            let wasGameActive = room.gameActive; // Check game status *before* modifying players

            // Identify players and check if game was active
    if (room.players.player1 && room.players.player1.id === clientId) {
        disconnectedPlayerName = room.players.player1.name;
        room.players.player1 = null;
                remainingPlayer = room.players.player2;
    } else if (room.players.player2 && room.players.player2.id === clientId) {
        disconnectedPlayerName = room.players.player2.name;
        room.players.player2 = null;
                remainingPlayer = room.players.player1;
            }

            if (!room.players.player1 && !room.players.player2) {
                // Both players gone (or only one was ever there), remove room
                console.log(`Room ${roomId} empty after disconnect, removing.`);
             rooms.delete(roomId);
            } else if (remainingPlayer && wasGameActive) { // Use the captured status
                // Game was active, notify remaining player and end game immediately
                console.log(`Game in room ${roomId} ended due to player ${clientId} disconnecting.`); // Keep important disconnect log
                // End the game *before* sending the final message to ensure state is updated
                endGame(roomId, `${disconnectedPlayerName} disconnected. ${remainingPlayer.name} wins!`);
                // The endGame function now sends the gameOver message. No need to send another one here.
                 room.gameActive = false; // Ensure game is marked inactive again if endGame didn't run fully
            } else if (remainingPlayer) {
                 // Game not active (lobby), notify remaining player opponent left
            safeSend(remainingPlayer.ws, {
                     type: 'opponentLeftLobby',
                payload: { message: `${disconnectedPlayerName} left the lobby.` }
            });
            }
            // REMOVED: Automatic broadcast - clients will request rooms with gameType filter
        } else {
             console.warn(`Disconnect in room ${roomId}, but room not found in rooms map.`);
        }
    }
    // Client record is deleted in the main 'close' handler AFTER this function runs
}

console.log("Server script initialized. Waiting for connections...");

// Graceful shutdown (optional but good practice)
process.on('SIGINT', () => {
    console.log('\nGracefully shutting down...');
    wss.close(() => {
        console.log('WebSocket server closed.');
        server.close(() => {
            console.log('HTTP server closed.');
            process.exit(0);
        });
    });
});

// --- Mentiroso Game Functions ---

// Constants for Mentiroso
const CATEGORY_ORDER = [
    "Fútbol Argentino",
    "Libertadores", 
    "Mundiales",
    "Champions League",
    "Selección Argentina",
    "Fútbol General"
];

function handleGetRooms(ws, clientInfo, payload) {
    const gameTypeFilter = payload ? payload.gameType : null;
    
    const availableRoomsInfo = [];
    for (const [roomId, room] of rooms.entries()) {
        // Only include rooms that are not full and match game type if specified
        if (room.players.player1 && !room.players.player2 && !room.gameActive) {
            if (!gameTypeFilter || room.gameType === gameTypeFilter) {
                availableRoomsInfo.push({
                    id: room.roomId,
                    creatorName: room.players.player1.name,
                    playerCount: 1,
                    maxPlayers: 2,
                    requiresPassword: !!room.password,
                    gameType: room.gameType
                });
            }
        }
    }
    
    safeSend(ws, { 
        type: 'availableRooms', 
        payload: { rooms: availableRoomsInfo } 
    });
}

function nextRoundMentiroso(roomId) {
    const room = rooms.get(roomId);
    if (!room || !room.mentirosoState || !room.mentirosoState.gameActive) {
        console.error(`nextRoundMentiroso: Room ${roomId} not found or game not active`);
        return;
    }

    const state = room.mentirosoState;

    // Check if game should end
    if (state.currentRound > state.maxRounds) {
        endGameMentiroso(roomId);
        return;
    }

    // Update round info
    state.categoryRound = ((state.currentRound - 1) % 3) + 1;
    state.globalCategoryIndex = Math.floor((state.currentRound - 1) / 3);
    state.currentCategory = CATEGORY_ORDER[state.globalCategoryIndex];

    // Select random challenge template
    let categoryKey = state.currentCategory;
    // Map category names to the keys used in mentirosoCategories
    const categoryMapping = {
        "Fútbol Argentino": "FÚTBOL ARGENTINO",
        "Libertadores": "LIBERTADORES", 
        "Mundiales": "MUNDIALES",
        "Champions League": "CHAMPIONS LEAGUE",
        "Selección Argentina": "SELECCIÓN ARGENTINA",
        "Fútbol General": "FÚTBOL GENERAL"
    };
    
    const mappedKey = categoryMapping[categoryKey] || categoryKey;
    const categoryData = mentirosoCategories[mappedKey];
    if (!categoryData || categoryData.length === 0) {
        console.error(`No challenges found for category: ${state.currentCategory} (key: ${categoryKey})`);
        endGameMentiroso(roomId, "Error: No challenges available");
        return;
    }

    const randomChallenge = categoryData[Math.floor(Math.random() * categoryData.length)];
    state.challengeTextTemplate = randomChallenge.template;

    // Reset round state
    state.currentBid = 0;
    state.lastBidder = null;
    state.playerWhoCalledMentiroso = null;
    state.playerToListAnswers = null;
    state.answersListed = [];
    state.validationResults = [];
    state.gamePhase = 'bidding';

    console.log(`Mentiroso Room ${roomId}: Starting round ${state.currentRound}/18 - Category: ${state.currentCategory} (${state.categoryRound}/3)`);

    // Send new round message
    const payload = {
        round: state.currentRound,
        categoryRound: state.categoryRound,
        globalCategoryIndex: state.globalCategoryIndex,
        category: state.currentCategory,
        challengeTemplate: state.challengeTextTemplate,
        currentTurn: room.currentTurn,
        players: {
            player1: { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score },
            player2: { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score }
        },
        isNewCategory: state.categoryRound === 1 && state.currentRound > 1
    };

    broadcastToRoom(roomId, { type: 'mentirosoNextRound', payload });
}

function handleMentirosoSubmitBid(ws, clientInfo, payload) {
    const roomId = clientInfo.roomId;
    if (!roomId) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No estás en una sala de juego.' } });
        return;
    }

    const room = rooms.get(roomId);
    if (!room || !room.mentirosoState || !room.mentirosoState.gameActive) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No hay un juego activo en esta sala.' } });
        return;
    }

    const state = room.mentirosoState;

    // Verify it's the player's turn
    if (room.currentTurn !== clientInfo.id) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No es tu turno para apostar.' } });
        return;
    }

    // Validate bid
    const bid = parseInt(payload.bid);
    if (isNaN(bid) || bid <= state.currentBid) {
        safeSend(ws, { type: 'errorMessage', payload: { error: `La apuesta debe ser un número mayor que la apuesta actual (${state.currentBid}).` } });
        return;
    }

    // Update game state
    state.currentBid = bid;
    state.lastBidder = clientInfo.id;

    // Switch turn to other player
    const otherPlayer = room.players.player1.id === clientInfo.id ? room.players.player2 : room.players.player1;
    room.currentTurn = otherPlayer.id;

    console.log(`Mentiroso Room ${roomId}: ${clientInfo.name || clientInfo.id} bid ${bid}`);

    // Send confirmation and broadcast update
    safeSend(ws, { type: 'bidConfirmed', payload: { bid, message: `Tu apuesta de ${bid} fue enviada.` } });

    setTimeout(() => {
        broadcastToRoom(roomId, {
            type: 'mentirosoBidUpdate',
            payload: {
                newBid: bid,
                bidderId: clientInfo.id,
                bidderName: clientInfo.name || 'Jugador',
                nextTurn: otherPlayer.id
            }
        });
    }, 100);
}

function handleMentirosoCallLiar(ws, clientInfo, payload) {
    const roomId = clientInfo.roomId;
    if (!roomId) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No estás en una sala de juego.' } });
        return;
    }

    const room = rooms.get(roomId);
    if (!room || !room.mentirosoState || !room.mentirosoState.gameActive) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No hay un juego activo en esta sala.' } });
        return;
    }

    const state = room.mentirosoState;

    // Verify it's the player's turn
    if (room.currentTurn !== clientInfo.id) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No es tu turno para llamar Mentiroso.' } });
        return;
    }

    // Verify there's a bid to call
    if (!state.lastBidder || state.currentBid <= 0) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No hay una apuesta activa para llamar Mentiroso.' } });
        return;
    }

    // Can't call liar on own bid
    if (state.lastBidder === clientInfo.id) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No puedes llamar Mentiroso a tu propia apuesta.' } });
        return;
    }

    // Update game state
    state.playerWhoCalledMentiroso = clientInfo.id;
    state.playerToListAnswers = state.lastBidder;
    room.currentTurn = state.lastBidder; // The accused player must list answers

    const accusedPlayer = room.players.player1.id === state.lastBidder ? room.players.player1 : room.players.player2;

    console.log(`Mentiroso Room ${roomId}: ${clientInfo.name || clientInfo.id} called liar on ${accusedPlayer.name || accusedPlayer.id}`);

    broadcastToRoom(roomId, {
        type: 'mentirosoLiarCalled',
        payload: {
            callerId: clientInfo.id,
            callerName: clientInfo.name || 'Jugador',
            accusedId: state.lastBidder,
            accusedName: accusedPlayer.name || 'Jugador acusado'
        }
    });
}

function handleMentirosoSubmitAnswers(ws, clientInfo, payload) {
    const roomId = clientInfo.roomId;
    if (!roomId) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No estás en una sala de juego.' } });
        return;
    }

    const room = rooms.get(roomId);
    if (!room || !room.mentirosoState || !room.mentirosoState.gameActive) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No hay un juego activo en esta sala.' } });
        return;
    }

    const state = room.mentirosoState;

    // Verify this player should list answers
    if (state.playerToListAnswers !== clientInfo.id) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No te corresponde listar respuestas en este momento.' } });
        return;
    }

    // Validate answers
    const answers = Array.isArray(payload.answers) ? payload.answers : [];
    if (answers.length < 1) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Debes listar al menos una respuesta.' } });
        return;
    }

    if (answers.length < state.currentBid) {
        safeSend(ws, { type: 'errorMessage', payload: { error: `Debes listar al menos ${state.currentBid} respuestas según tu apuesta.` } });
        return;
    }

    // Save answers and change turn to validator
    state.answersListed = answers;
    room.currentTurn = state.playerWhoCalledMentiroso;

    const validatorPlayer = room.players.player1.id === state.playerWhoCalledMentiroso ? room.players.player1 : room.players.player2;

    console.log(`Mentiroso Room ${roomId}: ${clientInfo.name || clientInfo.id} submitted ${answers.length} answers`);

    broadcastToRoom(roomId, {
        type: 'mentirosoAnswersSubmitted',
        payload: {
            listerId: clientInfo.id,
            listerName: clientInfo.name || 'Jugador',
            answers: answers,
            validatorId: state.playerWhoCalledMentiroso,
            validatorName: validatorPlayer.name || 'Validador'
        }
    });
}

function handleMentirosoSubmitValidation(ws, clientInfo, payload) {
    const roomId = clientInfo.roomId;
    if (!roomId) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No estás en una sala de juego.' } });
        return;
    }

    const room = rooms.get(roomId);
    if (!room || !room.mentirosoState || !room.mentirosoState.gameActive) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No hay un juego activo en esta sala.' } });
        return;
    }

    const state = room.mentirosoState;

    // Verify this player should validate
    if (state.playerWhoCalledMentiroso !== clientInfo.id) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'No te corresponde validar respuestas en este momento.' } });
        return;
    }

    // Validate payload
    const validations = Array.isArray(payload.validations) ? payload.validations : [];
    if (validations.length !== state.answersListed.length) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Debes validar todas las respuestas.' } });
        return;
    }

    // Save validations and determine round winner
    state.validationResults = validations;
    const validAnswersCount = validations.filter(v => v === true).length;
    const wasMentiroso = validAnswersCount < state.currentBid;
    const roundWinnerId = wasMentiroso ? state.playerWhoCalledMentiroso : state.playerToListAnswers;

    // Update scores
    const winnerPlayer = room.players.player1.id === roundWinnerId ? room.players.player1 : room.players.player2;
    winnerPlayer.score = (winnerPlayer.score || 0) + 1;
    state.scores[roundWinnerId] = winnerPlayer.score;

    // Prepare result message
    let resultMessage = '';
    if (wasMentiroso) {
        resultMessage = `¡Era MENTIROSO! ${validAnswersCount} respuestas válidas de ${state.currentBid} requeridas.`;
    } else {
        resultMessage = `¡NO era mentiroso! Tenía ${validAnswersCount} respuestas válidas de ${state.currentBid} requeridas.`;
    }

    console.log(`Mentiroso Room ${roomId}: Round ${state.currentRound} finished. Winner: ${winnerPlayer.name || winnerPlayer.id}`);

    // Send round result
    broadcastToRoom(roomId, {
        type: 'mentirosoRoundResult',
        payload: {
            wasMentiroso: wasMentiroso,
            validAnswersCount: validAnswersCount,
            requiredCount: state.currentBid,
            winnerId: roundWinnerId,
            winnerName: winnerPlayer.name || 'Ganador',
            message: resultMessage,
            players: {
                player1: { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score },
                player2: { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score }
            }
        }
    });

    // Move to next round
    state.currentRound++;
    setTimeout(() => {
        nextRoundMentiroso(roomId);
    }, 3000);
}

function endGameMentiroso(roomId, reason = "Game completed") {
    const room = rooms.get(roomId);
    if (!room || !room.mentirosoState) {
        console.error(`endGameMentiroso: Room ${roomId} not found`);
        return;
    }

    room.gameActive = false;
    room.mentirosoState.gameActive = false;

    const player1 = room.players.player1;
    const player2 = room.players.player2;

    if (!player1 || !player2) {
        console.error(`endGameMentiroso: Missing players in room ${roomId}`);
        return;
    }

    // Determine winner
    let winnerId = null;
    let draw = false;

    if (player1.score > player2.score) {
        winnerId = player1.id;
    } else if (player2.score > player1.score) {
        winnerId = player2.id;
    } else {
        draw = true;
    }

    const finalScores = {};
    finalScores[player1.id] = player1.score;
    finalScores[player2.id] = player2.score;

    console.log(`Mentiroso Game ended in room ${roomId}. Final scores: ${player1.name}: ${player1.score}, ${player2.name}: ${player2.score}`);

    const gameOverPayload = {
        gameType: 'mentiroso',
        finalScores: finalScores,
        winnerId: winnerId,
        draw: draw,
        reason: reason
    };

    broadcastToRoom(roomId, { type: 'gameOver', payload: gameOverPayload });
    
    // REMOVED: Automatic broadcast - clients will request rooms with gameType filter
}

const mentirosoCategories = {
  "SELECCIÓN ARGENTINA": [
    { template: "Puedo nombrar X futbolistas argentinos que jugaron al menos un Mundial como titulares." },
    { template: "Puedo nombrar X jugadores argentinos que fueron figuras en la Copa América desde 2000." },
    { template: "Puedo nombrar X futbolistas que hayan sido capitanes en partidos oficiales con Argentina." },
    { template: "Puedo nombrar X jugadores que marcaron goles en eliminatorias sudamericanas jugando como visitantes." },
    { template: "Puedo nombrar X delanteros que compartieron equipo con Messi en la Selección mayor." },
    { template: "Puedo nombrar X arqueros convocados a la Selección en los últimos 20 años." },
    { template: "Puedo nombrar X jugadores que hayan pasado por la Sub-20 y debutaron en la mayor." },
    { template: "Puedo nombrar X jugadores que hayan sido expulsados jugando por la Selección." },
    { template: "Puedo nombrar X futbolistas que fueron campeones con la Sub-23 en Juegos Olímpicos." },
    { template: "Puedo nombrar X jugadores que pasaron de ser titulares a no ser convocados nunca más." },
    { template: "Puedo nombrar X futbolistas que hayan jugado con Maradona y luego con Messi." },
    { template: "Puedo nombrar X futbolistas que fueron dirigidos por Bilardo y por Menotti." },
    { template: "Puedo nombrar X jugadores que hayan marcado en finales de torneos oficiales." },
    { template: "Puedo nombrar X defensores con más de 30 partidos oficiales con la Selección." },
    { template: "Puedo nombrar X jugadores de clubes argentinos convocados a Copas del Mundo." },
    { template: "Puedo nombrar X futbolistas que participaron en al menos 3 Copas América." },
    { template: "Puedo nombrar X jugadores que debutaron con la Selección antes de los 20 años." },
    { template: "Puedo nombrar X futbolistas que usaron la camiseta número 10 en partidos oficiales." },
    { template: "Puedo nombrar X jugadores que fueron parte del plantel del Mundial sin jugar un minuto." },
    { template: "Puedo nombrar X futbolistas que hayan jugado en más de una posición con Argentina." }
  ],
  "FÚTBOL ARGENTINO": [
    { template: "Puedo nombrar X futbolistas que ganaron torneos con más de un club argentino." },
    { template: "Puedo nombrar X jugadores que disputaron más de 400 partidos en el fútbol argentino." },
    { template: "Puedo nombrar X jugadores que pasaron por Boca y San Lorenzo." },
    { template: "Puedo nombrar X jugadores que jugaron en River y Racing." },
    { template: "Puedo nombrar X jugadores que fueron figuras en equipos chicos." },
    { template: "Puedo nombrar X extranjeros que se destacaron en el fútbol argentino en los últimos 20 años." },
    { template: "Puedo nombrar X técnicos que fueron campeones con más de un equipo." },
    { template: "Puedo nombrar X futbolistas que fueron goleadores en torneos de Primera División." },
    { template: "Puedo nombrar X jugadores que jugaron en Primera y luego fueron DT de su mismo club." },
    { template: "Puedo nombrar X futbolistas que volvieron a jugar en Argentina después de 10 años o más." },
    { template: "Puedo nombrar X jugadores que descendieron más de una vez en Argentina." },
    { template: "Puedo nombrar X futbolistas con pasos por al menos cinco equipos argentinos." },
    { template: "Puedo nombrar X jugadores que ganaron copas nacionales con diferentes clubes." },
    { template: "Puedo nombrar X jugadores que debutaron muy jóvenes y llegaron a la selección." },
    { template: "Puedo nombrar X futbolistas con goles en más de 15 canchas distintas." },
    { template: "Puedo nombrar X jugadores que fueron expulsados en más de cinco ocasiones." },
    { template: "Puedo nombrar X futbolistas que usaron la camiseta 10 en equipos grandes." },
    { template: "Puedo nombrar X delanteros históricos con más de 100 goles en torneos locales." },
    { template: "Puedo nombrar X arqueros que atajaron penales clave en partidos definitorios." },
    { template: "Puedo nombrar X jugadores que pasaron por clubes de todas las grandes ligas argentinas (A, B, C)." }
  ],
  "MUNDIALES": [
    { template: "Puedo nombrar X futbolistas que jugaron más de 10 partidos en Copas del Mundo." },
    { template: "Puedo nombrar X jugadores que fueron figuras en Mundiales sin ganar el título." },
    { template: "Puedo nombrar X delanteros con goles en más de un Mundial." },
    { template: "Puedo nombrar X jugadores que convirtieron dobletes en Copas del Mundo." },
    { template: "Puedo nombrar X jugadores que convirtieron en cuartos de final de Mundiales." },
    { template: "Puedo nombrar X jugadores que jugaron en 3 o más ediciones distintas." },
    { template: "Puedo nombrar X futbolistas que fueron expulsados en Mundiales." },
    { template: "Puedo nombrar X jugadores que fueron suplentes en más de un Mundial." },
    { template: "Puedo nombrar X jugadores que enfrentaron a Brasil en Mundiales." },
    { template: "Puedo nombrar X jugadores que convirtieron goles en debut mundialista." },
    { template: "Puedo nombrar X jugadores que marcaron de cabeza en Mundiales." },
    { template: "Puedo nombrar X jugadores que usaron la número 10 en selecciones sudamericanas." },
    { template: "Puedo nombrar X arqueros que fueron titulares en más de un Mundial." },
    { template: "Puedo nombrar X jugadores que convirtieron goles en tiempo extra." },
    { template: "Puedo nombrar X jugadores que fallaron penales en tandas decisivas." },
    { template: "Puedo nombrar X futbolistas que jugaron para más de una selección." },
    { template: "Puedo nombrar X jugadores que anotaron goles contra selecciones campeonas." },
    { template: "Puedo nombrar X jugadores que marcaron goles en mundiales sub-17, sub-20 y mayores." },
    { template: "Puedo nombrar X jugadores que se retiraron tras un Mundial." },
    { template: "Puedo nombrar X futbolistas que debutaron en un Mundial con más de 30 años." }
  ],
  "LIBERTADORES": [
    { template: "Puedo nombrar X futbolistas que jugaron más de 50 partidos en Libertadores." },
    { template: "Puedo nombrar X jugadores que fueron campeones con más de un club." },
    { template: "Puedo nombrar X futbolistas que marcaron goles en fases definitorias (semis o final)." },
    { template: "Puedo nombrar X jugadores con más de un hat-trick en Copa Libertadores." },
    { template: "Puedo nombrar X arqueros que atajaron penales en la Libertadores." },
    { template: "Puedo nombrar X técnicos que dirigieron a tres o más clubes en esta competencia." },
    { template: "Puedo nombrar X extranjeros campeones con equipos argentinos o brasileños." },
    { template: "Puedo nombrar X futbolistas que jugaron finales en estadios neutrales." },
    { template: "Puedo nombrar X jugadores que marcaron en más de 5 ediciones." },
    { template: "Puedo nombrar X futbolistas con pasos por clubes de al menos 3 países." },
    { template: "Puedo nombrar X jugadores que debutaron profesionalmente en la Libertadores." },
    { template: "Puedo nombrar X jugadores que jugaron Libertadores y Champions en la misma carrera." },
    { template: "Puedo nombrar X jugadores con goles en fases preliminares y en la final." },
    { template: "Puedo nombrar X futbolistas que ganaron Libertadores y luego fueron DTs." },
    { template: "Puedo nombrar X arqueros con más de 20 partidos sin goles recibidos." },
    { template: "Puedo nombrar X jugadores con goles en todas las fases de una edición." },
    { template: "Puedo nombrar X futbolistas que perdieron más de una final." },
    { template: "Puedo nombrar X jugadores que marcaron en Superclásicos por Copa." },
    { template: "Puedo nombrar X jugadores que jugaron con más de 36 años en Copa." },
    { template: "Puedo nombrar X futbolistas que fueron suplentes en al menos tres ediciones." }
  ],
  "CHAMPIONS LEAGUE": [
    { template: "Puedo nombrar X futbolistas que marcaron más de 20 goles en Champions." },
    { template: "Puedo nombrar X jugadores que jugaron finales con equipos diferentes." },
    { template: "Puedo nombrar X jugadores que marcaron en más de una final." },
    { template: "Puedo nombrar X arqueros con más de 30 partidos en Champions." },
    { template: "Puedo nombrar X jugadores sudamericanos que fueron campeones." },
    { template: "Puedo nombrar X jugadores que jugaron en clubes de tres ligas top (ESP, ITA, ENG)." },
    { template: "Puedo nombrar X jugadores que convirtieron goles en cuartos, semis y final." },
    { template: "Puedo nombrar X jugadores expulsados en instancias decisivas." },
    { template: "Puedo nombrar X técnicos campeones y subcampeones." },
    { template: "Puedo nombrar X futbolistas que debutaron con menos de 18 años." },
    { template: "Puedo nombrar X delanteros con goles en fases de grupos y eliminación directa." },
    { template: "Puedo nombrar X jugadores que enfrentaron al Real Madrid en semis." },
    { template: "Puedo nombrar X futbolistas con goles en más de 5 ediciones." },
    { template: "Puedo nombrar X jugadores con doblete en semifinales." },
    { template: "Puedo nombrar X jugadores con goles en 5 clubes distintos." },
    { template: "Puedo nombrar X sudamericanos que fueron goleadores de la Champions." },
    { template: "Puedo nombrar X futbolistas con pasos por clubes históricos sin ganar el torneo." },
    { template: "Puedo nombrar X jugadores que marcaron de tiro libre en fases KO." },
    { template: "Puedo nombrar X futbolistas con pasos por clubes rusos y Champions League." },
    { template: "Puedo nombrar X arqueros con penales atajados en definiciones." }
  ],
  "FÚTBOL GENERAL": [
    { template: "Puedo nombrar X jugadores que fueron compañeros de Messi y Cristiano Ronaldo." },
    { template: "Puedo nombrar X futbolistas que pasaron por más de 5 ligas distintas." },
    { template: "Puedo nombrar X jugadores africanos campeones en clubes europeos." },
    { template: "Puedo nombrar X futbolistas que jugaron en América y Asia." },
    { template: "Puedo nombrar X jugadores con más de 100 goles en su carrera profesional." },
    { template: "Puedo nombrar X futbolistas que fueron capitanes en clubes de 3 países distintos." },
    { template: "Puedo nombrar X jugadores que ganaron Copa América y Eurocopa (por doble nacionalidad)." },
    { template: "Puedo nombrar X futbolistas que jugaron más de 700 partidos oficiales." },
    { template: "Puedo nombrar X jugadores con pasos por clubes de todos los continentes." },
    { template: "Puedo nombrar X futbolistas que marcaron en más de 10 estadios distintos." },
    { template: "Puedo nombrar X jugadores que jugaron Mundial de Clubes y Mundial de selecciones." },
    { template: "Puedo nombrar X futbolistas que fueron goleadores en dos ligas distintas." },
    { template: "Puedo nombrar X jugadores que cambiaron de dorsal en cada club." },
    { template: "Puedo nombrar X futbolistas que se retiraron campeones." },
    { template: "Puedo nombrar X jugadores que jugaron con más de 15 entrenadores distintos." },
    { template: "Puedo nombrar X futbolistas con títulos en 3 o más clubes." },
    { template: "Puedo nombrar X jugadores que erraron penales en partidos clave." },
    { template: "Puedo nombrar X jugadores que jugaron en clásicos de más de un país." },
    { template: "Puedo nombrar X jugadores que fueron entrenadores de selecciones nacionales." },
    { template: "Puedo nombrar X jugadores que jugaron como juveniles en una selección y como mayores en otra." }
  ]
}; 