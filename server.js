const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const fs = require('fs'); // Added for file system operations
const path = require('path'); // Added for constructing file paths

// --- Constants ---
const MAX_LEVELS = 6;
const QUESTIONS_TO_ADVANCE_LEVEL = 5; // Adjust to 5 questions per level (assuming 1 question per turn, shared between players)
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

const wss = new WebSocket.Server({ port: PORT });

console.log(`Servidor WebSocket iniciado en el puerto ${PORT}...`);

// --- Game Data Loading ---
let allQuestions = {}; // Store questions globally { level: [processedQuestion, ...] }

function processRawQuestion(rawQ, level) {
    // Similar processing as frontend, but keep answers on server
    let optionsArray = [];
    let correctIndex = -1;
    let correctAnswerText = '';

    if (level > 1 && rawQ.opciones) {
        const optionKeys = ['A', 'B', 'C', 'D'];
        optionsArray = optionKeys.map(key => rawQ.opciones[key]).filter(opt => opt !== undefined && opt !== null);
        correctIndex = optionKeys.indexOf(rawQ.respuesta_correcta);
        if (correctIndex !== -1 && optionsArray[correctIndex]) {
            correctAnswerText = optionsArray[correctIndex];
        } else {
             console.warn(`Missing correct answer text/index for Q: ${rawQ.pregunta} in Level ${level}`);
             correctIndex = -1; // Mark as invalid if data is inconsistent
        }
         // Ensure exactly 4 options if possible, pad if necessary?
         // For simplicity, we assume data files have 4 options for levels > 1

    } else if (level === 1 && rawQ.opciones && rawQ.respuesta_correcta) {
        // Level 1: Extract the correct answer text directly
        correctAnswerText = rawQ.opciones[rawQ.respuesta_correcta];
        if (!correctAnswerText) {
            console.warn(`Missing correct answer text for Q: ${rawQ.pregunta} in Level 1`);
        }
        optionsArray = [];
        correctIndex = -1;
    } else {
        console.warn(`Invalid question format for Q: ${rawQ.pregunta} in Level ${level}`);
         return null; // Skip invalid questions
    }

    return {
        text: rawQ.pregunta,
        options: optionsArray, // Array of options text [A, B, C, D] for levels > 1
        correctIndex: correctIndex, // Index (0-3) of the correct option for levels > 1
        correctAnswerText: correctAnswerText ? correctAnswerText.toLowerCase().trim() : '', // Correct answer text (esp. for level 1)
        level: level
    };
}

function loadQuestions() {
    console.log(`Loading questions from ${DATA_DIR}...`);
    allQuestions = {}; // Reset
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
                    console.log(`Loaded ${allQuestions[level].length} questions for Level ${level}`);
                } else {
                    console.warn(`Invalid format in ${filePath}`);
                    allQuestions[level] = [];
                }
            } else {
                console.warn(`File not found: ${filePath}`);
                allQuestions[level] = [];
            }
        }
    } catch (error) {
        console.error("Error loading questions:", error);
        // Handle critical error? Maybe prevent server start?
        allQuestions = {}; // Clear potentially partial data
    }
}

// --- Game State Management ---
// Store connected clients and game rooms
const clients = new Map(); // Map<WebSocket, {id: string, roomId: string | null}>
const rooms = new Map(); // Map<string, Room>
// interface Room {
//     roomId: string;
//     players: { player1: Player | null, player2: Player | null };
//     password?: string;
//     // Game-specific state will go here
//     currentTurn: string | null;
//     currentLevel: number;
//     // ... other game state like scores, questions used, etc.
//     gameActive: boolean;
//     spectators: WebSocket[]; // Optional
// }
// interface Player {
//     id: string;
//     name: string;
//     ws: WebSocket;
//     score: number;
// }

// --- Helper Functions ---
function generateUniqueId() {
    // Simple ID generation (replace with a more robust method if needed)
    return Math.random().toString(36).substring(2, 9);
}

function generateRoomId() {
    // Simple 4-digit room code (ensure it's unique enough for your scale)
    let newId;
    do {
        newId = Math.floor(1000 + Math.random() * 9000).toString();
    } while (rooms.has(newId)); // Ensure uniqueness
    return newId;
}

function broadcast(roomId, message, senderWs = null) {
    const room = rooms.get(roomId);
    if (!room) return;

    const messageString = JSON.stringify(message);
    console.log(`Broadcasting to room ${roomId}:`, messageString);

    const players = [room.players.player1, room.players.player2].filter(p => p !== null);
    players.forEach(player => {
        if (player && player.ws !== senderWs && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(messageString);
        }
    });
    // Optionally broadcast to spectators too
    room.spectators.forEach(spectatorWs => {
         if (spectatorWs !== senderWs && spectatorWs.readyState === WebSocket.OPEN) {
             spectatorWs.send(messageString);
         }
    });
}

function safeSend(ws, message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        console.warn("Attempted to send message to a closed or invalid WebSocket.");
    }
}

// --- WebSocket Event Handlers ---
wss.on('connection', (ws, req) => {
    const clientId = generateUniqueId();
    clients.set(ws, { id: clientId, roomId: null });
    console.log(`Client connected: ${clientId} (Total: ${clients.size})`);
    safeSend(ws, { type: 'yourInfo', payload: { playerId: clientId } });

    ws.on('message', (message) => {
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(message);
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
        if (clientInfo) {
            handleDisconnect(ws, clientInfo.id, clientInfo.roomId);
            clients.delete(ws);
            console.log(`Client removed after error. Total clients: ${clients.size}`);
        }
    });
});

// --- Message Routing ---
function handleClientMessage(ws, message) {
    const clientInfo = clients.get(ws);
    if (!clientInfo) { return; }
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
        case 'submitAnswer':
             handleSubmitAnswer(ws, clientInfo, message.payload);
             break;
        case 'requestOptions':
             handleRequestOptions(ws, clientInfo, message.payload);
             break;
        case 'requestFiftyFifty':
             handleRequestFiftyFifty(ws, clientInfo, message.payload);
             break;
        default:
            console.warn(`Unknown message type received: ${message.type}`);
            safeSend(ws, { type: 'errorMessage', payload: { error: `Unknown message type: ${message.type}` } });
    }
}

// --- Handler Implementations ---

function handleCreateRoom(ws, clientInfo, payload) {
    if (clientInfo.roomId) {
        safeSend(ws, { type: 'joinError', payload: { error: 'You are already in a room.' } });
        return;
    }
    const roomId = generateRoomId();
    const player = {
        id: clientInfo.id,
        name: payload.playerName || `Player_${clientInfo.id.substring(0, 4)}`,
        ws: ws,
        score: 0
    };

    // Initialize usedQuestionIndices for all levels
    const usedQuestionIndices = {};
    for (let i = 1; i <= MAX_LEVELS; i++) {
        usedQuestionIndices[i] = [];
    }

    const newRoom = {
        roomId: roomId,
        players: { player1: player, player2: null },
        password: payload.password || undefined,
        currentTurn: null,
        currentLevel: 1,
        gameActive: false,
        spectators: [],
        // --- Game State --- //
        usedQuestionIndices: usedQuestionIndices,
        questionsAnsweredThisLevel: 0,
        currentQuestionData: null, // Stores the full question object from allQuestions
        fiftyFiftyUsedThisTurn: false,
        optionsSentThisTurn: false // Track if options were sent for current question
    };

    rooms.set(roomId, newRoom);
    clientInfo.roomId = roomId;
    console.log(`Room created: ${roomId} by ${player.name} (${player.id})`);
    safeSend(ws, { type: 'roomCreated', payload: { roomId: roomId } });
}

function handleJoinRoom(ws, clientInfo, payload) {
    if (clientInfo.roomId) {
        safeSend(ws, { type: 'joinError', payload: { error: 'You are already in a room.' } });
        return;
    }
    if (!payload || !payload.roomId) {
         safeSend(ws, { type: 'joinError', payload: { error: 'Room ID is required.' } });
         return;
     }

    const room = rooms.get(payload.roomId);

    if (!room) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Room not found.' } });
        return;
    }

    // Check password if the room has one
    if (room.password && room.password !== payload.password) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Incorrect password.' } });
        return;
    }

    // Check if room is full
    if (room.players.player1 && room.players.player2) {
        safeSend(ws, { type: 'joinError', payload: { error: 'Room is full.' } });
        return;
    }

    // Add player to the room
    const player = {
        id: clientInfo.id,
        name: payload.playerName || `Player_${clientInfo.id.substring(0, 4)}`,
        ws: ws,
        score: 0
    };

    let joinedAs = '';
    if (!room.players.player1) { room.players.player1 = player; joinedAs = 'player1';}
    else if (!room.players.player2) { room.players.player2 = player; joinedAs = 'player2';}

    clientInfo.roomId = room.roomId; // Update client's state
    console.log(`${player.name} (${player.id}) joined room ${room.roomId} as ${joinedAs}`);

    safeSend(ws, {
        type: 'joinSuccess',
        payload: {
            roomId: room.roomId,
            players: {
                 player1: room.players.player1 ? { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score } : null,
                 player2: room.players.player2 ? { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score } : null
             }
        }
    });

    // Notify the other player
    const otherPlayer = room.players.player1 === player ? room.players.player2 : room.players.player1;
    if (otherPlayer) {
        safeSend(otherPlayer.ws, {
            type: 'playerJoined',
            payload: {
                playerName: player.name,
                players: { // Send updated player list
                    player1: room.players.player1 ? { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score } : null,
                    player2: room.players.player2 ? { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score } : null
                }
            }
        });
    }

    // Start game if full
    if (room.players.player1 && room.players.player2) {
        startGame(room.roomId);
    }
}

function handleJoinRandomRoom(ws, clientInfo, payload) {
    if (clientInfo.roomId) {
        safeSend(ws, { type: 'randomJoinError', payload: { error: 'You are already in a room.' } });
        return;
    }
    let foundRoomId = null;
    for (const [roomId, room] of rooms.entries()) {
        if (!room.password && !room.players.player2 && room.players.player1) {
            if(room.players.player1.id !== clientInfo.id) {
                foundRoomId = roomId;
                break;
            }
        }
    }
    if (foundRoomId) {
        console.log(`Found random room ${foundRoomId} for ${clientInfo.id}`);
         handleJoinRoom(ws, clientInfo, {
             roomId: foundRoomId,
             playerName: payload.playerName,
             password: ''
         });
         console.log(`Client ${clientInfo.id} joined room ${foundRoomId} via random join.`);
    } else {
        console.log(`No random room found for ${clientInfo.id}, creating a new one.`);
         handleCreateRoom(ws, clientInfo, {
             playerName: payload.playerName,
             password: ''
         });
    }
}

function startGame(roomId) {
    const room = rooms.get(roomId);
    if (!room || !room.players.player1 || !room.players.player2) { return; }

    room.gameActive = true;
    room.players.player1.score = 0;
    room.players.player2.score = 0;
    room.currentLevel = 1;
    room.questionsAnsweredThisLevel = 0;
    room.currentQuestionData = null;
    // Reset used questions for the new game
    for (let i = 1; i <= MAX_LEVELS; i++) {
        room.usedQuestionIndices[i] = [];
    }

    room.currentTurn = Math.random() < 0.5 ? room.players.player1.id : room.players.player2.id;
    console.log(`Starting game in room ${roomId}. Turn: ${room.currentTurn}`);

    const playersData = {
        player1: { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score },
        player2: { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score }
    };
    const message = {
        type: 'gameStart',
        payload: {
            players: playersData,
            startingPlayerId: room.currentTurn,
            currentLevel: room.currentLevel
        }
    };
    safeSend(room.players.player1.ws, message);
    safeSend(room.players.player2.ws, message);

    // Send the first question
    sendNextQuestion(roomId);
}

function sendNextQuestion(roomId) {
    const room = rooms.get(roomId);
    if (!room || !room.gameActive || !room.players.player1 || !room.players.player2) return;

    // Reset turn-specific flags
    room.fiftyFiftyUsedThisTurn = false;
    room.optionsSentThisTurn = false;

    const currentLevel = room.currentLevel;
    const levelQuestions = allQuestions[currentLevel] || [];
    const usedIndices = room.usedQuestionIndices[currentLevel] || [];

    const availableIndices = levelQuestions
        .map((_, index) => index)
        .filter(index => !usedIndices.includes(index));

    if (availableIndices.length === 0) {
        console.warn(`No more questions available for level ${currentLevel} in room ${roomId}.`);
        // TODO: Handle this case properly - End game? Go to final round?
        // For now, let's end the game if no questions left in the final level
        if (currentLevel >= MAX_LEVELS) {
             endGame(roomId, "Ran out of questions!");
        } else {
            // Or maybe advance level automatically if possible?
             console.warn(`Advancing level prematurely for room ${roomId} due to lack of questions.`);
             room.currentLevel++;
             room.questionsAnsweredThisLevel = 0;
             sendNextQuestion(roomId); // Try sending question for next level
        }
        return;
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    room.usedQuestionIndices[currentLevel].push(randomIndex);
    room.currentQuestionData = levelQuestions[randomIndex]; // Store the full question object

    console.log(`Sending Q (Level ${currentLevel}, Index ${randomIndex}) to room ${roomId}. Turn: ${room.currentTurn}`);

    // Prepare question data for the client (exclude answer info)
    const questionPayloadForClient = {
        level: room.currentQuestionData.level,
        text: room.currentQuestionData.text
    };

    // Calculate question number within the level based on used count
    const questionNumber = usedIndices.length; // Before pushing, it was the count of previous questions
    // Total questions = number available initially for this level
    const totalQuestionsInLevel = levelQuestions.length;

     const message = {
         type: 'newQuestion',
         payload: {
             question: questionPayloadForClient, // Send sanitized question
             currentTurn: room.currentTurn,
             players: { // Send updated scores/state
                 player1: { id: room.players.player1.id, name: room.players.player1.name, score: room.players.player1.score },
                 player2: { id: room.players.player2.id, name: room.players.player2.name, score: room.players.player2.score }
             },
             questionNumber: questionNumber,
             totalQuestionsInLevel: totalQuestionsInLevel
         }
     };

    safeSend(room.players.player1.ws, message);
    safeSend(room.players.player2.ws, message);
}

function handleSubmitAnswer(ws, clientInfo, payload) {
    const room = rooms.get(clientInfo.roomId);
    if (!room || !room.gameActive || !clientInfo.roomId) { return; }
    if (clientInfo.id !== room.currentTurn) {
         safeSend(ws, { type: 'errorMessage', payload: { error: 'Not your turn.' } });
         return;
     }
     if (!room.currentQuestionData) {
          safeSend(ws, { type: 'errorMessage', payload: { error: 'No active question to answer.' } });
          return;
      }

    const question = room.currentQuestionData;
    let isCorrect = false;

    if (question.level === 1) {
        const playerAnswer = (payload.answerText || '').toLowerCase().trim();
        isCorrect = playerAnswer === question.correctAnswerText && playerAnswer !== '';
    } else {
        const playerIndex = payload.selectedIndex;
        isCorrect = playerIndex === question.correctIndex && playerIndex !== undefined && playerIndex !== null;
    }

    const pointsAwarded = isCorrect ? (10 * room.currentLevel) : 0;

    // Update player score
    const currentPlayer = room.players.player1.id === clientInfo.id ? room.players.player1 : room.players.player2;
    if(currentPlayer) {
        currentPlayer.score += pointsAwarded;
        console.log(`Player ${clientInfo.id} answered ${isCorrect ? 'correctly' : 'incorrectly'}. Score: ${currentPlayer.score}`);
    }

    // Send result to both players
    const resultPayload = {
        isCorrect: isCorrect,
        pointsAwarded: pointsAwarded,
        // Send correct answer info so client can display it
        correctAnswerText: question.correctAnswerText,
        correctIndex: question.correctIndex,
        selectedIndex: payload.selectedIndex, // Echo back the selection
        forPlayerId: clientInfo.id
    };
    const resultMessage = { type: 'answerResult', payload: resultPayload };
    safeSend(room.players.player1.ws, resultMessage);
    safeSend(room.players.player2.ws, resultMessage);

    // Increment answered count and check for level advance / game over
    room.questionsAnsweredThisLevel++;
    let levelAdvanced = false;
    if (room.currentLevel < MAX_LEVELS && room.questionsAnsweredThisLevel >= QUESTIONS_TO_ADVANCE_LEVEL) {
        room.currentLevel++;
        room.questionsAnsweredThisLevel = 0;
        levelAdvanced = true;
        console.log(`Advancing room ${room.roomId} to level ${room.currentLevel}`);
    }

    // Switch turn
    room.currentTurn = room.players.player1.id === clientInfo.id
        ? room.players.player2.id
        : room.players.player1.id;

    // Send next question or end game after a delay
    setTimeout(() => {
         if (!rooms.has(room.roomId)) return; // Room might have been deleted due to disconnect during timeout
         const isGameOver = room.currentLevel > MAX_LEVELS;
         if (isGameOver) {
             endGame(room.roomId, "Reached max level");
         } else {
             sendNextQuestion(room.roomId);
         }
     }, 2500); // 2.5 second delay
}

function handleRequestOptions(ws, clientInfo, payload) {
    const room = rooms.get(clientInfo.roomId);
    if (!room || !room.gameActive || !clientInfo.roomId) return;
    if (clientInfo.id !== room.currentTurn) return;
    if (!room.currentQuestionData || room.currentQuestionData.level === 1) {
         safeSend(ws, { type: 'errorMessage', payload: { error: 'Options not available for this question/level.' } });
         return;
    }
    if (room.optionsSentThisTurn) {
         safeSend(ws, { type: 'errorMessage', payload: { error: 'Options already requested/sent for this turn.' } });
         return;
     }

    console.log(`Sending options for Q (Level ${room.currentLevel}) to ${clientInfo.id} in room ${room.roomId}`);
    room.optionsSentThisTurn = true; // Mark options as sent for this question/turn
    safeSend(ws, { type: 'optionsProvided', payload: { options: room.currentQuestionData.options } });
}

function handleRequestFiftyFifty(ws, clientInfo, payload) {
    const room = rooms.get(clientInfo.roomId);
    if (!room || !room.gameActive || !clientInfo.roomId) return;
    if (clientInfo.id !== room.currentTurn) return;
    if (!room.currentQuestionData || room.currentQuestionData.level === 1) {
        safeSend(ws, { type: 'errorMessage', payload: { error: '50/50 not available for this question/level.' } });
        return;
    }
    if (!room.optionsSentThisTurn) {
         safeSend(ws, { type: 'errorMessage', payload: { error: 'Options must be requested before using 50/50.' } });
         return;
     }
    if (room.fiftyFiftyUsedThisTurn) {
         safeSend(ws, { type: 'errorMessage', payload: { error: '50/50 already used for this turn.' } });
         return;
     }

    const question = room.currentQuestionData;
    const correctIndex = question.correctIndex;
    const options = question.options;

    if (correctIndex < 0 || correctIndex >= options.length) {
         safeSend(ws, { type: 'errorMessage', payload: { error: 'Cannot apply 50/50 due to invalid question data.' } });
         return;
     }

    // Find indices of incorrect options
    const incorrectIndices = options
        .map((_, index) => index)
        .filter(index => index !== correctIndex);

    if (incorrectIndices.length < 2) {
        safeSend(ws, { type: 'errorMessage', payload: { error: 'Not enough incorrect options to remove for 50/50.' } });
        return; // Should not happen with 4 options
    }

    // Shuffle incorrect indices and pick the first two to remove
    incorrectIndices.sort(() => 0.5 - Math.random());
    const optionsToRemoveIndices = incorrectIndices.slice(0, 2);

    room.fiftyFiftyUsedThisTurn = true; // Mark as used
    console.log(`Applying 50/50 for ${clientInfo.id} in room ${room.roomId}. Removing indices:`, optionsToRemoveIndices);

    safeSend(ws, { type: 'fiftyFiftyApplied', payload: { optionsToRemove: optionsToRemoveIndices } });
}

function endGame(roomId, reason = "Game finished") {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!room.gameActive) return; // Prevent ending game twice

    console.log(`Ending game in room ${roomId}. Reason: ${reason}`);
    room.gameActive = false;
    let winnerId = null;
    let draw = false;
    if (room.players.player1 && room.players.player2) {
        if (room.players.player1.score > room.players.player2.score) winnerId = room.players.player1.id;
        else if (room.players.player2.score > room.players.player1.score) winnerId = room.players.player2.id;
        else draw = true;
    } else {
        winnerId = room.players.player1 ? room.players.player1.id : (room.players.player2 ? room.players.player2.id : null);
        reason = reason || "Opponent left";
    }

    const finalScores = {};
    if(room.players.player1) finalScores[room.players.player1.id] = room.players.player1.score;
    if(room.players.player2) finalScores[room.players.player2.id] = room.players.player2.score;

    const message = {
        type: 'gameOver',
        payload: {
            finalScores: finalScores,
            winnerId: winnerId,
            draw: draw,
            reason: reason
        }
    };

    // Use safeSend for robustness
    if(room.players.player1) safeSend(room.players.player1.ws, message);
    if(room.players.player2) safeSend(room.players.player2.ws, message);
    room.spectators.forEach(ws => safeSend(ws, message)); // Notify spectators too

    // Consider deleting room after a short delay? Or keep it until players leave?
    // For simplicity, let's keep it until handled by disconnects or explicit leave.
    // setTimeout(() => rooms.delete(roomId), 60000); // Example: delete after 1 minute
}

function handleDisconnect(ws, clientId, roomId) {
    console.log(`Handling disconnect for ${clientId} in room ${roomId}`);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    let disconnectedPlayerKey = null;
    let remainingPlayer = null;
    let disconnectedPlayerName = 'Opponent';

    if (room.players.player1 && room.players.player1.id === clientId) {
        disconnectedPlayerKey = 'player1';
        disconnectedPlayerName = room.players.player1.name;
        remainingPlayer = room.players.player2;
        room.players.player1 = null;
    } else if (room.players.player2 && room.players.player2.id === clientId) {
        disconnectedPlayerKey = 'player2';
        disconnectedPlayerName = room.players.player2.name;
        remainingPlayer = room.players.player1;
        room.players.player2 = null;
    } else {
         const spectatorIndex = room.spectators.indexOf(ws);
         if (spectatorIndex > -1) {
             room.spectators.splice(spectatorIndex, 1);
             console.log(`Spectator ${clientId} left room ${roomId}`);
             return;
         }
         console.warn(`Disconnecting client ${clientId} not found in room ${roomId}`);
         return;
    }

    console.log(`Player ${clientId} (${disconnectedPlayerName}) disconnected from room ${roomId}`);

    if (room.gameActive) {
        if (remainingPlayer) {
            safeSend(remainingPlayer.ws, {
                type: 'playerDisconnect',
                payload: { disconnectedPlayerName: disconnectedPlayerName }
            });
             endGame(roomId, `${disconnectedPlayerName} disconnected`);
        } else {
             console.log(`Game was active in room ${roomId} but no remaining player found after disconnect.`);
             rooms.delete(roomId);
             console.log(`Room ${roomId} deleted.`);
        }
    } else {
        // Lobby stage
        if (remainingPlayer) {
            safeSend(remainingPlayer.ws, {
                type: 'lobbyUpdate',
                payload: { message: `${disconnectedPlayerName} left the lobby.` }
            });
        } else {
            console.log(`Room ${roomId} is now empty. Deleting.`);
            rooms.delete(roomId);
        }
    }
}

// --- Start Server ---
loadQuestions(); // Load questions before starting the server

server.listen(PORT, () => {
    console.log(`HTTP and WebSocket server listening on port ${PORT}`);
});

// Basic error handling for the server itself
server.on('error', (error) => {
    console.error('Server error:', error);
}); 