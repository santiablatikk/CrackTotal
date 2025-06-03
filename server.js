const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const fs = require('fs'); // Added for file system operations
const path = require('path'); // Added for constructing file paths

// --- Constants ---
const MAX_LEVELS = 6; // 6 niveles de dificultad
const QUESTIONS_PER_LEVEL = 6; // 6 preguntas por nivel (3 para cada jugador)
const DATA_DIR = path.join(__dirname, 'assets/data'); // Updated to new assets/data directory structure

// Función para obtener el tipo MIME correcto
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

// --- Server Setup ---
// Servidor HTTP que maneja tanto archivos estáticos como WebSocket upgrades
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Parse URL
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // Redirect /index.html to /
    if (pathname === '/index.html') {
        res.writeHead(301, { 'Location': '/' });
        res.end();
        return;
    }
    
    // Default to index.html for root
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Construir ruta del archivo
    const filePath = path.join(__dirname, pathname);
    
    // Verificar que el archivo esté dentro del directorio del proyecto (seguridad)
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }
    
    // Verificar si el archivo existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // Si no existe, servir index.html para SPA routing
            if (pathname !== '/index.html') {
                const indexPath = path.join(__dirname, 'index.html');
                fs.readFile(indexPath, (indexErr, indexData) => {
                    if (indexErr) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('File not found');
                    } else {
                        res.writeHead(200, { 
                            'Content-Type': 'text/html',
                            'Cache-Control': 'no-cache'
                        });
                        res.end(indexData);
                    }
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
            }
            return;
        }
        
        // Leer y servir el archivo
        fs.readFile(filePath, (readErr, data) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
                return;
            }
            
            const mimeType = getMimeType(filePath);
            const headers = {
                'Content-Type': mimeType,
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block'
            };
            
            // Cache para archivos estáticos (excepto HTML)
            if (mimeType !== 'text/html') {
                headers['Cache-Control'] = 'public, max-age=31536000'; // 1 año
            } else {
                headers['Cache-Control'] = 'no-cache';
            }
            
            res.writeHead(200, headers);
            res.end(data);
        });
    });
});

// Obtener puerto de Render o usar 3000 por defecto
const PORT = process.env.PORT || 3000;

// Attach WebSocket server to the HTTP server
const wss = new WebSocket.Server({ server });

server.listen(PORT, () => {
    console.log(`🚀 Servidor HTTP y WebSocket iniciado en el puerto ${PORT}`);
    console.log(`🌐 Servidor listo para servir archivos estáticos y WebSocket`);
    console.log(`📁 Directorio de trabajo: ${__dirname}`);
    console.log(`📊 Directorio de datos: ${DATA_DIR}`);
    loadQuestions(); // Load questions for Quien Sabe Mas
    
    // DISABLED: Automatic room broadcasting to prevent mixing game types
    // Each client will request rooms specifically with gameType filter
    // setInterval(broadcastAvailableRooms, 5000);
});

// Mensaje de inicio
console.log('🎯 Server script initialized. Waiting for connections...');

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
            scores: {},
            // Timer para preguntas de 60 segundos
            questionTimer: null,
            timeRemaining: 15, // Cambiado de 60 a 15 segundos para apostar
            timerActive: false,
            // Diferentes duraciones según la fase
            biddingTimerDuration: 15, // 15 segundos para apostar
            listingTimerDuration: 60  // 60 segundos para listar respuestas
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
    
    // Iniciar timer de 15 segundos para la apuesta
    setTimeout(() => {
        startMentirosoQuestionTimer(roomId, 15, 'bidding');
    }, 2000); // Dar 2 segundos para que se cargue la UI antes de iniciar el timer
}

// Función para iniciar el timer de Mentiroso con duración específica
function startMentirosoQuestionTimer(roomId, duration = 15, phase = 'bidding') {
    const room = rooms.get(roomId);
    if (!room || !room.mentirosoState || !room.mentirosoState.gameActive) {
        return;
    }

    const state = room.mentirosoState;
    
    // Limpiar timer anterior si existe
    if (state.questionTimer) {
        clearInterval(state.questionTimer);
    }
    
    state.timeRemaining = duration;
    state.timerActive = true;
    
    // Notificar a los clientes que el timer comenzó
    broadcastToRoom(roomId, {
        type: 'mentirosoTimerStart',
        payload: { 
            timeRemaining: state.timeRemaining,
            phase: phase, // Indicar la fase del timer
            duration: duration
        }
    });
    
    state.questionTimer = setInterval(() => {
        state.timeRemaining--;
        
        // Notificar actualización del timer
        broadcastToRoom(roomId, {
            type: 'mentirosoTimerUpdate',
            payload: { 
                timeRemaining: state.timeRemaining,
                phase: phase
            }
        });
        
        if (state.timeRemaining <= 0) {
            // Timer agotado
            clearInterval(state.questionTimer);
            state.questionTimer = null;
            state.timerActive = false;
            
            broadcastToRoom(roomId, {
                type: 'mentirosoTimerStop',
                payload: { reason: 'timeout', phase: phase }
            });
            
            // Manejar timeout según la fase
            handleMentirosoTimeOut(roomId, phase);
        }
    }, 1000);
}

// Función para detener el timer cuando se llama Mentiroso
function stopMentirosoQuestionTimer(roomId, reason = 'stop') {
    const room = rooms.get(roomId);
    if (!room || !room.mentirosoState) {
        return;
    }

    const state = room.mentirosoState;
    if (state.questionTimer) {
        clearInterval(state.questionTimer);
        state.questionTimer = null;
        state.timerActive = false;
        
        // Notificar a los clientes que el timer se detuvo
        broadcastToRoom(roomId, {
            type: 'mentirosoTimerStop',
            payload: { reason: reason, phase: state.gamePhase || 'bidding' }
        });
    }
}

// Función para manejar el tiempo agotado
function handleMentirosoTimeOut(roomId, phase) {
    const room = rooms.get(roomId);
    if (!room || !room.mentirosoState || !room.mentirosoState.gameActive) {
        return;
    }
    
    const state = room.mentirosoState;
    console.log(`Mentiroso Room ${roomId}: Timer expired for round ${state.currentRound} in phase ${phase}`);
    
    if (phase === 'bidding') {
        // Si se agota el tiempo en la fase de apuesta
        // El jugador actual pierde automáticamente el punto
        
        let winnerId = null;
        if (state.currentTurn === room.players.player1.id) {
            winnerId = room.players.player2.id;
        } else {
            winnerId = room.players.player1.id;
        }
        
        // Dar punto al otro jugador
        if (winnerId === room.players.player1.id) {
            room.players.player1.score++;
        } else {
            room.players.player2.score++;
        }
        
        // Actualizar estado para próxima ronda
        const mentirosoState = room.mentirosoState;
        mentirosoState.currentRound++;
        
        broadcastToRoom(roomId, {
            type: 'mentirosoRoundResult',
            payload: {
                winnerId: winnerId,
                message: `Tiempo agotado. El punto va para el oponente.`,
                players: [room.players.player1, room.players.player2],
                currentRound: mentirosoState.currentRound
            }
        });
        
        // Verificar si el juego terminó
        if (mentirosoState.currentRound > mentirosoState.maxRounds) {
            endGameMentiroso(roomId, "Juego completado");
            return;
        }
        
        // Continuar con la siguiente ronda después de un breve delay
        setTimeout(() => {
            nextRoundMentiroso(roomId);
        }, 1000);
        
    } else if (phase === 'listing') {
        // Si se agota el tiempo para listar respuestas
        // El jugador que debía listar pierde automáticamente
        
        let winnerId = state.playerWhoCalledMentiroso; // Quien llamó mentiroso gana
        
        // Dar punto al que llamó mentiroso
        if (winnerId === room.players.player1.id) {
            room.players.player1.score++;
        } else {
            room.players.player2.score++;
        }
        
        // Actualizar estado para próxima ronda
        const mentirosoState = room.mentirosoState;
        mentirosoState.currentRound++;
        
        broadcastToRoom(roomId, {
            type: 'mentirosoRoundResult',
            payload: {
                winnerId: winnerId,
                message: `Tiempo agotado para listar. El punto va para quien llamó Mentiroso.`,
                players: [room.players.player1, room.players.player2],
                currentRound: mentirosoState.currentRound
            }
        });
        
        // Verificar si el juego terminó
        if (mentirosoState.currentRound > mentirosoState.maxRounds) {
            endGameMentiroso(roomId, "Juego completado");
            return;
        }
        
        // Continuar con la siguiente ronda después de un breve delay
        setTimeout(() => {
            nextRoundMentiroso(roomId);
        }, 1000);
    }
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
        
        // Reiniciar timer de 15 segundos para el siguiente jugador
        setTimeout(() => {
            // Detener timer actual antes de iniciar uno nuevo
            stopMentirosoQuestionTimer(roomId, 'restart');
            // Iniciar nuevo timer
            setTimeout(() => {
                startMentirosoQuestionTimer(roomId, 15, 'bidding');
            }, 100);
        }, 300);
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

    // Detener el timer cuando se llama Mentiroso
    stopMentirosoQuestionTimer(roomId, 'mentiroso_called');

    const accusedPlayer = room.players.player1.id === state.lastBidder ? room.players.player1 : room.players.player2;
    
    broadcastToRoom(roomId, {
        type: 'mentirosoLiarCalled',
        payload: {
            callerId: clientInfo.id,
            accusedId: state.lastBidder,
            callerName: clientInfo.name || 'Jugador',
            accusedName: accusedPlayer.name || 'Jugador acusado',
            currentBid: state.currentBid
        }
    });
    
    // Iniciar timer de 60 segundos para listar respuestas
    setTimeout(() => {
        startMentirosoQuestionTimer(roomId, 60, 'listing');
    }, 1000); // Dar 1 segundo para que se actualice la UI
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
    }, 1000); // Reducido de 3000ms a 1000ms para transiciones más rápidas
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
  "FÚTBOL ARGENTINO": [
    { template: "Puedo nombrar X jugadores que hayan salido de River Plate y ganado algo importante en Europa." },
    { template: "Puedo nombrar X futbolistas que hayan jugado en Boca Juniors y en la Selección Argentina en el mismo año." },
    { template: "Puedo nombrar X directores técnicos que hayan dirigido al menos dos de los 'cinco grandes' del fútbol argentino." },
    { template: "Puedo nombrar X futbolistas que, después de ser estrellas en Argentina, fracasaron en Europa y volvieron." },
    { template: "Puedo nombrar X jugadores que hayan sido goleadores de un torneo de Primera División argentino en los últimos 30 años." },
    { template: "Puedo nombrar X clásicos del fútbol argentino (además del Superclásico)." },
    { template: "Puedo nombrar X futbolistas que jugaron en la Selección Argentina y nunca jugaron en River o Boca." },
    { template: "Puedo nombrar X futbolistas que hayan jugado al menos 300 partidos en la Primera División argentina." },
    { template: "Puedo nombrar X técnicos extranjeros que hayan dirigido a un equipo argentino de Primera División." },
    { template: "Puedo nombrar X equipos de la provincia de Santa Fe que hayan jugado en Primera División." },
    { template: "Puedo nombrar X futbolistas que hayan jugado en el fútbol argentino y luego en la MLS." },
    { template: "Puedo nombrar X jugadores que hayan sido campeones de la Copa Sudamericana con un club argentino." },
    { template: "Puedo nombrar X apodos raros o poco comunes de jugadores argentinos." },
    { template: "Puedo nombrar X jugadores que hayan jugado en el fútbol argentino y en la Liga MX de México." },
    { template: "Puedo nombrar X hinchadas de fútbol argentino que se consideren de las más 'picantes' de Sudamérica." },
    { template: "Puedo nombrar X técnicos que agarraron un fierro caliente en un grande y lo sacaron campeón contra todos los pronósticos." },
    { template: "Puedo nombrar X jugadores que metieron un golazo de tiro libre en un clásico que quedó para la historia." },
    { template: "Puedo nombrar X equipos 'chicos' que le ganaron una final o un partido definitorio a un grande y fue un batacazo." },
    { template: "Puedo nombrar X apodos de jugadores del fútbol argentino que son más conocidos que su propio nombre." },
    { template: "Puedo nombrar X futbolistas que fueron figuras en el Ascenso y después la rompieron en Primera." },
    { template: "Puedo nombrar X clubes del interior que jugaron al menos 5 temporadas seguidas en Primera División." },
    { template: "Puedo nombrar X jugadores que metieron un gol en el último minuto para salvar a su equipo del descenso." },
    { template: "Puedo nombrar X equipos que hayan ganado un título nacional sin ser de Buenos Aires o Rosario." },
    { template: "Puedo nombrar X cánticos de hinchadas argentinas que se escuchan en todo el mundo." },
    { template: "Puedo nombrar X hermanos que hayan jugado juntos en un mismo equipo de Primera División argentina." },
    { template: "Puedo nombrar X equipos que hayan llenado su cancha jugando en el Ascenso." },
    { template: "Puedo nombrar X futbolistas que fueron ídolos en un club 'chico' y rechazaron ofertas de los grandes." }
  ],
  "SELECCIÓN ARGENTINA": [
    { template: "Puedo nombrar X jugadores argentinos que ganaron la Copa del Mundo en el '78 o el '86 o el '22." },
    { template: "Puedo nombrar X máximos goleadores históricos de la Selección Argentina." },
    { template: "Puedo nombrar X jugadores con más partidos disputados en la Selección Argentina." },
    { template: "Puedo nombrar X arqueros que hayan jugado en la Selección Argentina en Mundiales." },
    { template: "Puedo nombrar X jugadores que hayan sido capitán de la Selección Argentina en Mundiales o Copas América." },
    { template: "Puedo nombrar X futbolistas que hayan marcado un gol en una final de Copa América o Mundial con la Selección Argentina." },
    { template: "Puedo nombrar X directores técnicos que hayan dirigido a la Selección Argentina en un Mundial." },
    { template: "Puedo nombrar X jugadores que hayan ganado la Copa América con la Selección Argentina." },
    { template: "Puedo nombrar X futbolistas que hayan jugado en la Selección Argentina y el Barcelona." },
    { template: "Puedo nombrar X jugadores que hayan debutado con la Selección Argentina antes de los 20 años." },
    { template: "Puedo nombrar X futbolistas argentinos que hayan ganado la medalla de oro en Juegos Olímpicos." },
    { template: "Puedo nombrar X jugadores que hayan jugado en la Selección Argentina y el Real Madrid." },
    { template: "Puedo nombrar X jugadores que hayan marcado en su debut con la Selección Argentina." },
    { template: "Puedo nombrar X jugadores que hayan sido parte de la Selección Argentina en al menos 3 Mundiales." },
    { template: "Puedo nombrar X delanteros que hayan vestido la camiseta número 9 en la Selección Argentina en los últimos 30 años." },
    { template: "Puedo nombrar X jugadores de la Selección Argentina que hayan sido campeones del mundo y también de la Copa América." },
    { template: "Puedo nombrar X jugadores de la Selección Argentina que hayan sido campeones del mundo y también de la Champions League." },
    { template: "Puedo nombrar X jugadores de la Selección Argentina que hayan marcado un gol de cabeza en un Mundial." },
    { template: "Puedo nombrar X arqueros que hayan atajado penales decisivos para Argentina en Mundiales o Copas América." },
    { template: "Puedo nombrar X jugadores que hayan sido capitanes de la Selección Argentina en más de 20 partidos." },
    { template: "Puedo nombrar X jugadores que hayan ganado la Copa América 2021 y el Mundial 2022." },
    { template: "Puedo nombrar X futbolistas que jugaron en Boca Juniors y fueron campeones del mundo con Argentina." },
    { template: "Puedo nombrar X jugadores que hayan metido un gol de tiro libre memorable con la camiseta argentina." },
    { template: "Puedo nombrar X futbolistas que jugaron en River Plate y fueron campeones del mundo con Argentina." },
    { template: "Puedo nombrar X jugadores que hayan metido un gol agónico para la Selección Argentina en Eliminatorias." },
    { template: "Puedo nombrar X jugadores que hayan disputado 3 o más Mundiales con la Selección Argentina." },
    { template: "Puedo nombrar X jugadores de la Selección Argentina que le hayan metido un gol a Brasil en partidos oficiales." },
    { template: "Puedo nombrar X técnicos que hayan sido campeones de la Copa América con Argentina." },
    { template: "Puedo nombrar X goles de Argentina en Mundiales que se gritaron con el alma." },
    { template: "Puedo nombrar X jugadores de la Selección Argentina que hayan metido un gol en el Maracaná contra Brasil." },
    { template: "Puedo nombrar X jugadores que hayan sido figuras de la Selección Argentina en los años 90." },
    { template: "Puedo nombrar X apodos de jugadores históricos de la Selección Argentina." }
  ],
  "MUNDIALES": [
    { template: "Puedo nombrar X países que hayan ganado la Copa del Mundo al menos una vez." },
    { template: "Puedo nombrar X directores técnicos que hayan ganado la Copa del Mundo." },
    { template: "Puedo nombrar X máximos goleadores en la historia de los Mundiales (más de 5 goles)." },
    { template: "Puedo nombrar X ciudades que hayan sido sede de una final de Copa del Mundo." },
    { template: "Puedo nombrar X futbolistas que hayan sido capitán de una selección campeona del mundo." },
    { template: "Puedo nombrar X estadios que hayan sido sede de partidos de Mundiales." },
    { template: "Puedo nombrar X selecciones que hayan sido subcampeonas del mundo en al menos una ocasión." },
    { template: "Puedo nombrar X futbolistas que hayan participado en 4 o más Mundiales." },
    { template: "Puedo nombrar X jugadores que hayan ganado el Balón de Oro de un Mundial." },
    { template: "Puedo nombrar X jugadores que hayan ganado la Bota de Oro de un Mundial." },
    { template: "Puedo nombrar X porteros que hayan ganado el Guante de Oro de un Mundial." },
    { template: "Puedo nombrar X países que hayan sido sede de la Copa del Mundo." },
    { template: "Puedo nombrar X jugadores con más partidos disputados en Copas del Mundo." },
    { template: "Puedo nombrar X futbolistas que hayan marcado el gol de la victoria en una final de Copa del Mundo." },
    { template: "Puedo nombrar X jugadores que hayan fallado un penal en una tanda de penales de un Mundial." },
    { template: "Puedo nombrar X futbolistas que hayan marcado un hat-trick en una Copa del Mundo." },
    { template: "Puedo nombrar X jugadores que hayan ganado el Mundial y la Copa América." },
    { template: "Puedo nombrar X jugadores que hayan ganado el Mundial y el Balón de Oro en el mismo año." },
    { template: "Puedo nombrar X selecciones que ganaron el Mundial jugando de local." },
    { template: "Puedo nombrar X jugadores que metieron un gol en la final del Mundial y su selección igual perdió." },
    { template: "Puedo nombrar X futbolistas que fueron goleadores de un Mundial y su selección no pasó de cuartos." },
    { template: "Puedo nombrar X 'sorpresas' o batacazos históricos de selecciones chicas eliminando a potencias en Mundiales." },
    { template: "Puedo nombrar X jugadores que metieron un gol de tiro libre que fue clave para ganar un Mundial." },
    { template: "Puedo nombrar X arqueros que hayan sido figura en un Mundial sin que su equipo llegue a la final." },
    { template: "Puedo nombrar X goles anulados polémicamente que podrían haber cambiado la historia de un Mundial." },
    { template: "Puedo nombrar X futbolistas que ganaron el Mundial como jugador y luego lo dirigieron como técnico." },
    { template: "Puedo nombrar X selecciones que hayan ganado el Mundial sin perder un solo partido." },
    { template: "Puedo nombrar X jugadores que hayan sido los más jóvenes en ganar un Mundial." },
    { template: "Puedo nombrar X selecciones que ganaron el Mundial tras haber perdido su primer partido del torneo." },
    { template: "Puedo nombrar X futbolistas que fueron transferencias récord después de brillar en un Mundial." },
    { template: "Puedo nombrar X mascotas de Mundiales que la gente todavía recuerda." }
  ],
  "LIBERTADORES": [
    { template: "Puedo nombrar X clubes que hayan ganado la Copa Libertadores al menos una vez." },
    { template: "Puedo nombrar X países con al menos un equipo campeón de la Copa Libertadores." },
    { template: "Puedo nombrar X directores técnicos que hayan ganado la Copa Libertadores." },
    { template: "Puedo nombrar X máximos goleadores históricos de la Copa Libertadores." },
    { template: "Puedo nombrar X jugadores que hayan ganado la Copa Libertadores con dos equipos diferentes." },
    { template: "Puedo nombrar X equipos brasileños que hayan ganado la Copa Libertadores." },
    { template: "Puedo nombrar X futbolistas que hayan marcado un hat-trick en una fase eliminatoria de Copa Libertadores." },
    { template: "Puedo nombrar X estadios que hayan sido sede de una final de Copa Libertadores." },
    { template: "Puedo nombrar X jugadores argentinos que hayan sido campeones de la Copa Libertadores." },
    { template: "Puedo nombrar X clubes que hayan sido subcampeones de la Copa Libertadores en al menos una ocasión." },
    { template: "Puedo nombrar X jugadores que hayan marcado un gol en una final de Copa Libertadores." },
    { template: "Puedo nombrar X equipos que hayan ganado la Copa Sudamericana y la Copa Libertadores." },
    { template: "Puedo nombrar X equipos colombianos que hayan participado en la Copa Libertadores al menos 5 veces." },
    { template: "Puedo nombrar X jugadores que hayan ganado la Copa Libertadores y la Copa América." },
    { template: "Puedo nombrar X porteros que hayan ganado la Copa Libertadores." },
    { template: "Puedo nombrar X futbolistas que hayan sido capitanes de equipos campeones de la Copa Libertadores." },
    { template: "Puedo nombrar X equipos argentinos que ganaron la Libertadores jugando la final de visitante." },
    { template: "Puedo nombrar X jugadores que metieron un gol en la final de la Libertadores y se consagraron ídolos eternos." },
    { template: "Puedo nombrar X técnicos que ganaron la Libertadores con más de un club." },
    { template: "Puedo nombrar X futbolistas que fueron goleadores de la Libertadores jugando para un equipo que no fue campeón." },
    { template: "Puedo nombrar X equipos 'chicos' de Sudamérica que llegaron a una final de Libertadores." },
    { template: "Puedo nombrar X jugadores brasileños que hayan sido figuras excluyentes en una Libertadores ganada por su equipo." },
    { template: "Puedo nombrar X arqueros que fueron héroes en una tanda de penales que definió una Libertadores." },
    { template: "Puedo nombrar X partidos de Copa Libertadores que terminaron en batallas campales o con incidentes graves." },
    { template: "Puedo nombrar X estadios míticos de Sudamérica donde ganar de visitante en la Libertadores es una hazaña." },
    { template: "Puedo nombrar X jugadores que usaron la camiseta número 10 en equipos campeones de Libertadores." },
    { template: "Puedo nombrar X futbolistas del Boca de Bianchi que marcaron una época en la Libertadores." },
    { template: "Puedo nombrar X equipos que ganaron la Libertadores en su primera o segunda participación." },
    { template: "Puedo nombrar X goles de cabeza memorables en finales de Copa Libertadores." },
    { template: "Puedo nombrar X futbolistas del River de Gallardo que hicieron historia en la Libertadores." },
    { template: "Puedo nombrar X equipos que hayan ganado la Libertadores remontando un resultado adverso en la final." },
    { template: "Puedo nombrar X jugadores 'desconocidos' que se convirtieron en héroes inesperados en una campaña de Libertadores." }
  ],
  "CHAMPIONS LEAGUE": [
    { template: "Puedo nombrar X clubes que hayan ganado la Champions League al menos una vez." },
    { template: "Puedo nombrar X jugadores que hayan ganado la Champions League con dos equipos diferentes." },
    { template: "Puedo nombrar X directores técnicos que hayan ganado la Champions League con dos o más clubes." },
    { template: "Puedo nombrar X futbolistas que hayan sido máximos goleadores de la Champions League en al menos una temporada." },
    { template: "Puedo nombrar X futbolistas que hayan jugado tanto en el Real Madrid como en el Bayern Múnich." },
    { template: "Puedo nombrar X jugadores que hayan ganado la Champions League y el Mundial en el mismo año." },
    { template: "Puedo nombrar X estadios que hayan sido sede de la final de la Champions League más de una vez." },
    { template: "Puedo nombrar X futbolistas que hayan jugado al menos 100 partidos en la Champions League." },
    { template: "Puedo nombrar X futbolistas que hayan marcado un gol en su debut en la Champions League." },
    { template: "Puedo nombrar X clubes que hayan llegado a 3 o más finales de Champions League sin ganarla." },
    { template: "Puedo nombrar X futbolistas que hayan jugado en el Arsenal y el Barcelona." },
    { template: "Puedo nombrar X jugadores que hayan marcado un hat-trick en una fase eliminatoria de Champions League." },
    { template: "Puedo nombrar X directores técnicos que hayan dirigido al menos dos clubes en finales de Champions League." },
    { template: "Puedo nombrar X futbolistas que hayan ganado la Champions League y la Eurocopa." },
    { template: "Puedo nombrar X porteros que hayan ganado la Champions League." },
    { template: "Puedo nombrar X futbolistas que hayan sido capitanes de equipos campeones de la Champions League." },
    { template: "Puedo nombrar X clubes que hayan participado en la Champions League al menos 15 veces." },
    { template: "Puedo nombrar X equipos que ganaron la Champions League y nunca más volvieron a una final." },
    { template: "Puedo nombrar X técnicos que ganaron la Champions League sin dirigir a un equipo de los 'nuevos ricos' o superpoderosos." },
    { template: "Puedo nombrar X futbolistas que fueron figura en la Champions y nunca ganaron un Balón de Oro." },
    { template: "Puedo nombrar X 'pecheadas' históricas de equipos grandes en la Champions League." },
    { template: "Puedo nombrar X equipos 'cenicienta' que llegaron a semifinales de Champions contra todo pronóstico." },
    { template: "Puedo nombrar X jugadores argentinos que hayan sido goleadores o figuras clave en una Champions ganada por su equipo." },
    { template: "Puedo nombrar X remontadas épicas en fases eliminatorias de la Champions League." },
    { template: "Puedo nombrar X estadios que son una caldera y donde los grandes de Europa han sufrido para ganar en Champions." },
    { template: "Puedo nombrar X jugadores que usaron la camiseta número 7 en equipos campeones de Champions." },
    { template: "Puedo nombrar X equipos que hayan ganado la Champions League sin perder un solo partido." },
    { template: "Puedo nombrar X técnicos que hayan ganado la Champions League como jugador y como entrenador." },
    { template: "Puedo nombrar X equipos que hayan disputado la final de la Champions League contra un equipo de su mismo país." },
    { template: "Puedo nombrar X futbolistas que jugaron en el Milan de Sacchi o Capello y dominaron Europa." },
    { template: "Puedo nombrar X equipos que ganaron la Champions League en su primera participación." },
    { template: "Puedo nombrar X goles de cabeza memorables en finales de Champions League." }
  ],
  "FÚTBOL GENERAL": [
    { template: "Puedo nombrar X jugadores que hayan ganado el Balón de Oro al menos una vez." },
    { template: "Puedo nombrar X clubes de fútbol más valiosos del mundo según Forbes o Deloitte." },
    { template: "Puedo nombrar X leyendas del fútbol que nunca ganaron un Mundial, pero sí su liga nacional o copas internacionales de clubes." },
    { template: "Puedo nombrar X estadios de fútbol con capacidad para más de 80.000 espectadores." },
    { template: "Puedo nombrar X futbolistas que hayan marcado más de 500 goles en su carrera profesional." },
    { template: "Puedo nombrar X directores técnicos con más de 15 títulos en su carrera." },
    { template: "Puedo nombrar X clubes que hayan ganado al menos 25 títulos de liga en su país." },
    { template: "Puedo nombrar X futbolistas que hayan jugado en al menos 4 ligas diferentes de países top." },
    { template: "Puedo nombrar X jugadores que hayan ganado la Bota de Oro europea al menos una vez." },
    { template: "Puedo nombrar X porteros con más vallas invictas en la historia del fútbol moderno." },
    { template: "Puedo nombrar X hermanos que hayan jugado fútbol profesionalmente para la misma selección nacional en un Mundial." },
    { template: "Puedo nombrar X clubes con los apodos más populares del fútbol mundial." },
    { template: "Puedo nombrar X futbolistas que hayan ganado el premio Puskas al mejor gol del año." },
    { template: "Puedo nombrar X jugadores que se hayan retirado del fútbol en los últimos 10 años y sean considerados leyendas de su club." },
    { template: "Puedo nombrar X directores técnicos que hayan ganado la liga en 3 o más países diferentes." },
    { template: "Puedo nombrar X futbolistas que hayan jugado en el FC Barcelona y en el Bayern Múnich." },
    { template: "Puedo nombrar X clubes que hayan ganado el triplete (Liga, Copa nacional y Champions League)." },
    { template: "Puedo nombrar X jugadores que ganaron el Balón de Oro y nunca jugaron en el Real Madrid o Barcelona." },
    { template: "Puedo nombrar X clubes de fútbol que tengan más de 100 años de historia y sigan siendo relevantes." },
    { template: "Puedo nombrar X ligas de fútbol fuera de Europa que son competitivas y exportan muchos jugadores." },
    { template: "Puedo nombrar X leyendas del fútbol que se retiraron y siguen siendo más famosas que muchos jugadores actuales." },
    { template: "Puedo nombrar X estadios de fútbol con nombres de empresas o marcas." },
    { template: "Puedo nombrar X futbolistas que hayan marcado más de 35 goles en una sola temporada en una liga top europea." },
    { template: "Puedo nombrar X directores técnicos que hayan dirigido en más de 5 países diferentes." },
    { template: "Puedo nombrar X futbolistas que hayan jugado en la Premier League, La Liga y la Serie A." },
    { template: "Puedo nombrar X futbolistas que hayan sido transferencias millonarias y terminaron siendo un fiasco total." },
    { template: "Puedo nombrar X porteros que hayan metido goles de tiro libre o penal en partidos oficiales." },
    { template: "Puedo nombrar X padres e hijos que hayan jugado fútbol profesionalmente y ambos hayan sido internacionales." },
    { template: "Puedo nombrar X apodos de clubes de fútbol que no tienen nada que ver con su ciudad o colores." },
    { template: "Puedo nombrar X jugadores que se retiraron jóvenes (antes de los 30) estando en la cima de su carrera." },
    { template: "Puedo nombrar X futbolistas que hayan sido ídolos en dos clubes rivales." },
    { template: "Puedo nombrar X equipos que hayan descendido de categoría el año después de salir campeones." },
    { template: "Puedo nombrar X futbolistas que sean conocidos por sus actos de Fair Play memorables." },
    { template: "Puedo nombrar X directores técnicos que hayan revolucionado la táctica del fútbol." },
    { template: "Puedo nombrar X futbolistas que hayan jugado en el Ajax de los 90 y después triunfaron en grandes de Europa." },
    { template: "Puedo nombrar X goles 'fantasma' que generaron polémica mundial." },
    { template: "Puedo nombrar X futbolistas que hayan jugado más de 800 partidos oficiales en su carrera." },
    { template: "Puedo nombrar X selecciones que hayan tenido una generación dorada y no hayan podido ganar un título importante." },
    { template: "Puedo nombrar X goles de volea espectaculares que quedaron en la retina de los hinchas." }
  ]
}; 