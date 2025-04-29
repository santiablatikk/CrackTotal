const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const fs = require('fs'); // Added for file system operations
const path = require('path'); // Added for constructing file paths

// --- Constants ---
const MAX_LEVELS = 6;
const QUESTIONS_PER_LEVEL = 5; // Number of questions per level before advancing
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
    loadQuestions(); // Load questions when server starts
});

// --- Game Data Loading ---
let allQuestions = {}; // Store questions globally { level: [processedQuestion, ...] }

function processRawQuestion(rawQ, level) {
    // Ensure basic structure exists
    if (!rawQ || typeof rawQ.pregunta !== 'string' || !rawQ.opciones || typeof rawQ.respuesta_correcta !== 'string') {
        console.warn(`Invalid question structure skipped in Level ${level}:`, rawQ.pregunta);
        return null;
    }

    let optionsArray = [];
    let correctIndex = -1;
    let correctAnswerText = '';
        const optionKeys = ['A', 'B', 'C', 'D'];

    if (level > 1) {
        // Levels 2-6 expect options object {A, B, C, D}
        optionsArray = optionKeys.map(key => rawQ.opciones[key]).filter(opt => typeof opt === 'string');
        if (optionsArray.length !== 4) {
            console.warn(`Question in Level ${level} does not have exactly 4 options:`, rawQ.pregunta);
            return null; // Skip incomplete questions for levels > 1
        }
        correctIndex = optionKeys.indexOf(rawQ.respuesta_correcta);
        if (correctIndex === -1) {
            console.warn(`Invalid correct answer key ('${rawQ.respuesta_correcta}') for Q: ${rawQ.pregunta} in Level ${level}`);
            return null; // Skip if correct answer key is wrong
        }
            correctAnswerText = optionsArray[correctIndex];
        } else {
        // Level 1 expects answer text directly
        correctAnswerText = rawQ.opciones[rawQ.respuesta_correcta];
        if (typeof correctAnswerText !== 'string') {
            console.warn(`Missing or invalid correct answer text for Q: ${rawQ.pregunta} in Level 1`);
            return null; // Skip if level 1 answer is not found
        }
        optionsArray = []; // No multiple choice options for level 1
        correctIndex = -1;
    }

    return {
        text: rawQ.pregunta,
        options: optionsArray, // Array of options text [A, B, C, D] for levels > 1
        correctIndex: correctIndex, // Index (0-3) of the correct option for levels > 1
        // Standardize correct answer for comparison
        correctAnswerText: correctAnswerText.toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, ""), // Normalize for comparison
        level: level
    };
}

function loadQuestions() {
    console.log(`Loading questions from ${DATA_DIR}...`);
    allQuestions = {}; // Reset
    let totalLoaded = 0;
    try {
        for (let level = 1; level <= MAX_LEVELS; level++) {
            const filePath = path.join(DATA_DIR, `level_${level}.json`);
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const jsonData = JSON.parse(fileContent);
                if (jsonData && jsonData.preguntas && Array.isArray(jsonData.preguntas)) {
                    allQuestions[level] = jsonData.preguntas
                                            .map(q => processRawQuestion(q, level))
                                            .filter(q => q !== null); // Filter out invalid questions
                    console.log(`Loaded ${allQuestions[level].length} valid questions for Level ${level}`);
                    totalLoaded += allQuestions[level].length;
                } else {
                    console.warn(`Invalid format or missing 'preguntas' array in ${filePath}`);
                    allQuestions[level] = [];
                }
            } else {
                console.warn(`File not found: ${filePath}`);
                allQuestions[level] = [];
            }
        }
        console.log(`Total valid questions loaded: ${totalLoaded}`);
        if (totalLoaded === 0) {
             console.error("CRITICAL: No questions loaded. Game cannot function.");
             // Optionally, stop the server or enter a safe mode
        }
    } catch (error) {
        console.error("Error loading questions:", error);
        allQuestions = {}; // Clear potentially partial data
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
        // Criteria: Not active, public (no password), waiting for player 2
        if (!room.gameActive && !room.password && room.players.player1 && !room.players.player2) {
            console.log(`Room ${roomId} is available (Player: ${room.players.player1.name}).`);
            availableRoomsList.push({
                id: roomId,
                playerCount: 1, // Always 1 if it meets criteria
                maxPlayers: 2,
                requiresPassword: false,
                // Optionally add creator's name if needed by client UI
                 creatorName: room.players.player1.name
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
    // Send available rooms to the new client
    broadcastAvailableRooms();

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
            console.log('Unknown client disconnected.');
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
        // --- Game Actions ---
        case 'submitAnswer':
             handleSubmitAnswer(ws, clientInfo, message.payload);
             break;
        case 'requestOptions':
            handleRequestOptions(ws, clientInfo);
             break;
        case 'requestFiftyFifty':
            handleRequestFiftyFifty(ws, clientInfo);
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

    const player1 = {
        id: clientInfo.id,
        name: playerName,
        ws: ws,
        score: 0
    };

    const newRoom = {
        roomId: roomId,
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
        questionsPerLevel: QUESTIONS_PER_LEVEL // Store config per room
    };

    rooms.set(roomId, newRoom);
    clientInfo.roomId = roomId; // Update client's state

    console.log(`Room ${roomId} created by ${playerName} (${clientInfo.id}). Password: ${password ? 'Yes' : 'No'}`);
    safeSend(ws, { type: 'roomCreated', payload: { roomId: roomId } });

    // Broadcast updated room list to lobby
    broadcastAvailableRooms();
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

    // Broadcast updated room list (room is now full or private, so might disappear from public list)
    broadcastAvailableRooms();
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
            password: '',
            playerName: payload ? payload.playerName : undefined // Handle potential missing payload
        });
        // Use specific success type for random join if needed by client?
        // safeSend(ws, { type: 'randomJoinSuccess', payload: { roomId: availableRoomId } });
    } else {
        // No room found, maybe create a new public room instead?
        console.log(`No random room found for ${clientInfo.id}. Creating new public room.`);
        handleCreateRoom(ws, clientInfo, { playerName: payload ? payload.playerName : undefined, password: '' });
        // Let the client know it's waiting in a new room
        // safeSend(ws, { type: 'randomJoinError', payload: { error: 'No rooms available, created a new one for you.' } });
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
        // Game wasn't active (lobby), just notify remaining player
        safeSend(remainingPlayer.ws, {
            type: 'opponentLeftLobby',
            payload: { message: `${leavingPlayerName} has left the lobby.` }
         });
    }

    // Broadcast updated room list (room might become available or be deleted)
    broadcastAvailableRooms();
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

    console.log(`Starting game in room ${roomId}...`);

    // Initialize game state
    room.gameActive = true;
    room.currentLevel = 1;
    room.questionsAnsweredInLevel = 0;
    room.usedQuestionIndices = {}; // Reset used questions for new game
    for (let l = 1; l <= MAX_LEVELS; l++) { // Initialize for all potential levels
        room.usedQuestionIndices[l] = [];
    }
    room.currentQuestion = null;
    room.players.player1.score = 0; // Reset scores
    room.players.player2.score = 0;
    room.optionsSent = false;
    room.fiftyFiftyUsed = false;

    // Randomly select starting player
    room.currentTurn = Math.random() < 0.5 ? room.players.player1.id : room.players.player2.id;
    console.log(`Room ${roomId} - Game state initialized. Starting turn: ${room.currentTurn}`); // <--- DEBUG LOG

    const playersInfo = {
        player1: { id: room.players.player1.id, name: room.players.player1.name, score: 0 },
        player2: { id: room.players.player2.id, name: room.players.player2.name, score: 0 }
    };

    // Send gameStart message to both players
    const startMessage = { type: 'gameStart', payload: { players: playersInfo, startingPlayerId: room.currentTurn } };
    console.log(`Room ${roomId} - Sending gameStart message...`); // <--- DEBUG LOG
    safeSend(room.players.player1.ws, startMessage);
    safeSend(room.players.player2.ws, startMessage);
    console.log(`Room ${roomId} - gameStart message sent.`); // <--- DEBUG LOG

    // Send the first question immediately
    console.log(`Room ${roomId} - Calling sendNextQuestion for the first time...`); // <--- DEBUG LOG
    // Add a small delay before sending the first question?
    setTimeout(() => {
    sendNextQuestion(roomId);
        console.log(`Room ${roomId} - Returned from first call to sendNextQuestion.`); // <--- DEBUG LOG
    }, 50); // Short delay (50ms)
}

function sendNextQuestion(roomId) {
    console.log(`DEBUG: sendNextQuestion called for room ${roomId}`); // <--- DEBUG LOG
    const room = rooms.get(roomId);
    if (!room || !room.gameActive) {
         console.log(`DEBUG: sendNextQuestion aborted for room ${roomId} - Room not found or game not active.`); // <--- DEBUG LOG
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
     console.log(`DEBUG: Checking questions for Level ${room.currentLevel}...`); // <--- DEBUG LOG
    if (!allQuestions[room.currentLevel] || allQuestions[room.currentLevel].length === 0) {
        console.error(`CRITICAL: No questions available for Level ${room.currentLevel} in room ${roomId}. Ending game.`); // <--- DEBUG LOG
        endGame(roomId, "Error: No questions available for this level.");
        return;
    }
     console.log(`DEBUG: Found ${allQuestions[room.currentLevel].length} questions for Level ${room.currentLevel}.`); // <--- DEBUG LOG

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

     console.log(`DEBUG: Level ${room.currentLevel} - Used Indices: [${usedIndices.join(', ')}], Available Indices: [${availableIndices.join(', ')}]`); // <--- DEBUG LOG

    if (availableIndices.length === 0) {
        console.warn(`No unused questions left for Level ${room.currentLevel} in room ${roomId}. Ending game.`);
        endGame(roomId, `Ran out of questions for Level ${room.currentLevel}.`);
        return;
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    room.currentQuestion = questionsForLevel[randomIndex];
     console.log(`DEBUG: Selected question index ${randomIndex} for Level ${room.currentLevel}. Text: ${room.currentQuestion.text}`); // <--- DEBUG LOG

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
        options: room.currentQuestion.level > 1 ? room.currentQuestion.options : []
    };

     // Ensure players exist before accessing properties
     const player1Info = room.players.player1 ? { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score } : null;
     const player2Info = room.players.player2 ? { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score } : null;

     if (!player1Info || !player2Info) {
          console.error(`DEBUG: Player data missing when sending newQuestion for room ${roomId}`);
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

    console.log(`Room ${roomId} - Sending Q${room.questionsAnsweredInLevel} L${room.currentLevel}, Turn: ${room.currentTurn}`);
     console.log(`DEBUG: Broadcasting newQuestion message for room ${roomId}...`); // <--- DEBUG LOG
    broadcastToRoom(roomId, message);
    // Also send individually to handle cases where broadcast might miss one? Redundant if broadcast works? Let's rely on broadcast for now.
    // safeSend(room.players.player1.ws, message);
    // safeSend(room.players.player2.ws, message);
     console.log(`DEBUG: newQuestion message sent for room ${roomId}.`); // <--- DEBUG LOG
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
    let submittedAnswerText = ''; // For level 1 text input

    if (question.level === 1) {
        // Level 1: Check text input
        const playerAnswer = payload && typeof payload.answerText === 'string'
            ? payload.answerText.toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, "")
            : '';
        submittedAnswerText = payload?.answerText || ''; // Keep original for display

        if (!playerAnswerText) {
             console.warn(`Room ${roomId} L1 Answer: No text submitted.`);
             safeSend(ws, { type: 'errorMessage', payload: { error: 'Answer cannot be empty.' } });
             return; // Empty submission
        }
        isCorrect = playerAnswerText === question.correctAnswerText;
        console.log(`Room ${roomId} L1 Answer (Text): Submitted='${playerAnswerText}', Correct='${question.correctAnswerText}', Result=${isCorrect}`);

    } else {
        // Levels > 1: Check selected index
        if (payload && typeof payload.selectedIndex === 'number') {
            submittedAnswerIndex = payload.selectedIndex;
            if (submittedAnswerIndex >= 0 && submittedAnswerIndex < question.options.length) {
                isCorrect = submittedAnswerIndex === question.correctIndex;
                console.log(`Room ${roomId} L>1 Answer (Index): Submitted Index=${submittedAnswerIndex}, Correct Index=${question.correctIndex}, Result=${isCorrect}`);
            } else {
                console.warn(`Room ${roomId} L>1 Answer: Invalid index submitted:`, payload.selectedIndex);
                safeSend(ws, { type: 'errorMessage', payload: { error: 'Invalid answer format (index out of bounds).' } });
                return; // Invalid submission
            }
        } else {
            // No valid index provided for Level > 1
            console.warn(`Room ${roomId} L>1 Answer: No valid index submitted. Payload:`, payload);
            safeSend(ws, { type: 'errorMessage', payload: { error: 'Invalid answer format (missing index).' } });
            return; // Invalid submission
        }
    }

    // --- Score Calculation & Result Payload --- 
    const currentPlayer = room.players.player1.id === clientInfo.id ? room.players.player1 : room.players.player2;
    if (isCorrect) {
        pointsAwarded = 10 * question.level;
        currentPlayer.score += pointsAwarded;
    }

    const resultPayload = {
        isCorrect: isCorrect,
        pointsAwarded: pointsAwarded,
        correctAnswerText: question.correctAnswerText.toUpperCase(),
        correctIndex: question.correctIndex,
        forPlayerId: clientInfo.id,
        // Include submitted data based on level
        submittedAnswerText: question.level === 1 ? submittedAnswerText : null,
        selectedIndex: question.level > 1 ? submittedAnswerIndex : -1
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
              console.log(`DEBUG: Skipping sendNextQuestion for room ${roomId} as it no longer exists or game is inactive.`);
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
    console.log(`Room ${roomId} - Sending options to ${clientInfo.id}`);
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
        console.log(`Room ${roomId} - Sending 50/50 removal indices ${indicesToRemove} to ${clientInfo.id}`);
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
          console.log(`Game in room ${roomId} is already inactive. Ignoring endGame call.`);
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
                console.log(`Game in room ${roomId} ended due to player ${clientId} disconnecting.`);
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
            // Broadcast updated room list if needed
            broadcastAvailableRooms();
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