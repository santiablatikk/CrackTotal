const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- CONFIGURACIÓN DE FIREBASE ADMIN ---
// Asegúrate de que la ruta al archivo de clave de servicio sea correcta
// y que el archivo NO esté en un repositorio público.
// Idealmente, usa variables de entorno para la configuración en producción.
try {
  const serviceAccount = require('./firebase-service-account-key.json'); // <--- RUTA A TU ARCHIVO
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
      // databaseURL: "https://TU_PROJECT_ID.firebaseio.com" // Opcional, si usas Realtime Database además de Firestore
    });
    console.log('Firebase Admin SDK inicializado correctamente.');
  } else {
    console.log('Firebase Admin SDK ya estaba inicializado.');
  }
  const db = admin.firestore(); // <--- Instancia de Firestore
} catch (error) {
  console.error('ERROR: No se pudo inicializar Firebase Admin SDK. Verifica la ruta a tu firebase-service-account-key.json y su contenido.', error);
  // Considera terminar el proceso si Firebase es esencial y no se puede inicializar
  // process.exit(1); 
}
// --- FIN CONFIGURACIÓN DE FIREBASE ADMIN ---

// --- CONSTANTES PARA QUIEN SABE MAS (QSM) ---
const QSM_MAX_LEVELS = 6;
const QSM_QUESTIONS_PER_LEVEL = 3;
const QSM_DATA_DIR = path.join(__dirname, '../data'); // Asumiendo que 'data' está en la raíz del proyecto, un nivel arriba de 'server'

// --- Almacenamiento de Preguntas QSM ---
let qsmAllQuestions = {}; // { level: [processedQuestion, ...] }

// --- Lógica de Carga de Preguntas QSM (traída de server.js raíz) ---
function qsmProcessRawQuestion(rawQ, level) {
    // ... (Contenido de la función processRawQuestion de server.js raíz)
    // Asegurarse de que las referencias a console.warn/error sean claras
    if (!rawQ || typeof rawQ.pregunta !== 'string' || typeof rawQ.respuesta_correcta !== 'string') {
        console.warn(`[QSM L${level} - FORMATO BASICO] Pregunta saltada. Falta 'pregunta' o 'respuesta_correcta'. Pregunta: ${rawQ ? rawQ.pregunta : 'DESCONOCIDA'}`);
        return null;
    }

    let optionsArray = [];
    let correctIndex = -1;
    let correctAnswerText = '';
    const optionKeys = ['A', 'B', 'C', 'D'];

    if (!rawQ.opciones || typeof rawQ.opciones !== 'object' || rawQ.opciones === null) {
        console.warn(`[QSM L${level} - OPCIONES] Pregunta saltada. Falta 'opciones' o no es un objeto. Pregunta: ${rawQ.pregunta}`);
        return null;
    }

    optionsArray = optionKeys.map(key => {
        const optionValue = rawQ.opciones[key];
        if (typeof optionValue !== 'string') {
            console.warn(`[QSM L${level} - OPCION INDIVIDUAL] Opción '${key}' para P '${rawQ.pregunta}' no es string. Valor: ${optionValue}`);
            return undefined;
        }
        return optionValue;
    });

    const validOptionsArray = optionsArray.filter(opt => opt !== undefined);
    if (validOptionsArray.length !== 4) {
        console.warn(`[QSM L${level} - NUMERO OPCIONES] Pregunta saltada. No tiene 4 opciones válidas. P: ${rawQ.pregunta}. Opciones: [${validOptionsArray.join(', ')}]`);
        return null;
    }
    optionsArray = validOptionsArray;

    correctIndex = optionKeys.indexOf(rawQ.respuesta_correcta);
    if (correctIndex === -1) {
        console.warn(`[QSM L${level} - RESPUESTA] Clave de respuesta correcta inválida ('${rawQ.respuesta_correcta}') para P: ${rawQ.pregunta}.`);
        return null;
    }
    correctAnswerText = optionsArray[correctIndex];
    const normalizedCorrectAnswer = correctAnswerText.toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, "");

    if (!normalizedCorrectAnswer) {
        console.warn(`[QSM L${level} - TEXTO RESPUESTA] No se pudo determinar texto de respuesta para P: ${rawQ.pregunta}`);
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

function qsmLoadQuestions() {
    console.log("===========================================");
    console.log("  CARGANDO PREGUNTAS QSM (server/server.js) ");
    console.log("===========================================");
    console.log(`Buscando preguntas QSM en: ${QSM_DATA_DIR}...`);
    qsmAllQuestions = {};
    let totalLoadedOverall = 0;
    let totalProcessedOverall = 0;

    try {
        for (let level = 1; level <= QSM_MAX_LEVELS; level++) {
            console.log(`--- QSM Cargando Nivel ${level} ---`);
            const filePath = path.join(QSM_DATA_DIR, `level_${level}.json`);
            let questionsForThisLevelProcessed = 0;
            let questionsForThisLevelValid = 0;

            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                let jsonData;
                try {
                    jsonData = JSON.parse(fileContent);
                } catch (parseError) {
                    console.error(`[QSM NIVEL ${level}] ERROR FATAL JSON: ${filePath}. Error: ${parseError.message}`);
                    qsmAllQuestions[level] = [];
                    continue;
                }
                
                if (jsonData && jsonData.preguntas && Array.isArray(jsonData.preguntas)) {
                    questionsForThisLevelProcessed = jsonData.preguntas.length;
                    totalProcessedOverall += questionsForThisLevelProcessed;

                    qsmAllQuestions[level] = jsonData.preguntas
                                            .map(q => qsmProcessRawQuestion(q, level)) // Usar la función con prefijo
                                            .filter(q => q !== null);
                    questionsForThisLevelValid = qsmAllQuestions[level].length;
                    totalLoadedOverall += questionsForThisLevelValid;
                    
                    if (questionsForThisLevelProcessed === 0) {
                        console.warn(`[QSM NIVEL ${level}] No se encontraron preguntas en 'preguntas' en ${filePath}.`);
                    } else if (questionsForThisLevelValid === 0 && questionsForThisLevelProcessed > 0) {
                        console.error(`[QSM NIVEL ${level}] ${questionsForThisLevelProcessed} procesadas, NINGUNA válida.`);
                    } else {
                        console.log(`[QSM NIVEL ${level}] Procesadas: ${questionsForThisLevelProcessed}, Válidas: ${questionsForThisLevelValid}.`);
                    }
                } else {
                    console.error(`[QSM NIVEL ${level}] ERROR FORMATO: Falta array 'preguntas' en ${filePath}.`);
                    qsmAllQuestions[level] = [];
                }
            } else {
                console.warn(`[QSM NIVEL ${level}] ARCHIVO NO ENCONTRADO: ${filePath}`);
                qsmAllQuestions[level] = [];
            }
            console.log(`--- Fin Carga QSM Nivel ${level} ---`);
        }
        console.log("===========================================");
        console.log("     CARGANDO PREGUNTAS QSM - FIN          ");
        console.log(`Total QSM procesadas: ${totalProcessedOverall}`);
        console.log(`Total QSM VÁLIDAS cargadas: ${totalLoadedOverall}`);
        console.log("===========================================");
        if (totalLoadedOverall === 0 && totalProcessedOverall > 0) {
             console.error("CRITICO QSM: Ninguna pregunta válida globalmente.");
        } else if (totalLoadedOverall === 0) {
            console.error("CRITICO QSM: No se cargaron preguntas. El juego no funcionará.");
        }
    } catch (error) {
        console.error("ERROR GENERAL CARGA PREGUNTAS QSM:", error);
        qsmAllQuestions = {};
    }
}
// --- FIN Lógica de Carga de Preguntas QSM ---

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

// Estructuras de datos para manejar el estado del juego
const rooms = {}; // Almacenará las salas de juego activas
const clients = new Map(); // Almacenará la información de los clientes conectados (ws -> {id, roomId, etc.})

console.log(`Servidor WebSocket iniciado en el puerto ${PORT}`);
qsmLoadQuestions();

wss.on('connection', (ws) => {
    const clientId = uuidv4();
    clients.set(ws, { id: clientId });
    console.log(`Nuevo cliente conectado: ${clientId}`);

    ws.send(JSON.stringify({ type: 'yourInfo', payload: { playerId: clientId } }));

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            console.log(`Mensaje recibido de ${clientId}:`, parsedMessage);
            handleClientMessage(ws, parsedMessage);
        } catch (error) {
            console.error(`Error al parsear mensaje de ${clientId}:`, error, message);
            ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'Mensaje inválido.' } }));
        }
    });

    ws.on('close', () => {
        console.log(`Cliente desconectado: ${clientId}`);
        handleClientDisconnect(ws);
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error(`Error en WebSocket para cliente ${clientId}:`, error);
        // El evento 'close' se disparará después de esto
    });
});

function handleClientMessage(ws, message) {
    const clientData = clients.get(ws);
    if (!clientData) {
        console.error("Mensaje recibido de un cliente no registrado.");
        return;
    }

    const { type, payload } = message;

    // Asegurarse de que payload exista para evitar errores
    const safePayload = payload || {};
    
    // Agregar log detallado para cada mensaje recibido
    console.log(`[DEBUG] Mensaje recibido de ${clientData.id} (${clientData.name || 'Sin nombre'}): Tipo=${type}`, safePayload);

    switch (type) {
        // Lógica del Lobby
        case 'createRoom':
            handleCreateRoom(ws, safePayload);
            break;
        case 'joinRoom':
            handleJoinRoom(ws, safePayload);
            break;
        case 'joinRandomRoom':
            handleJoinRandomRoom(ws, safePayload);
            break;
        case 'leaveRoom':
            handleLeaveRoom(ws);
            break;

        // Lógica específica del juego "Mentiroso"
        case 'mentirosoSubmitBid':
            console.log(`[INFO] Bid solicitado por ${clientData.id} (${clientData.name || 'Sin nombre'}): ${safePayload.bid}`);
            handleMentirosoSubmitBid(ws, safePayload);
            break;
        case 'mentirosoCallLiar':
            handleMentirosoCallLiar(ws, safePayload);
            break;
        case 'mentirosoSubmitAnswers':
            handleMentirosoSubmitAnswers(ws, safePayload);
            break;
        case 'mentirosoSubmitValidation':
            handleMentirosoSubmitValidation(ws, safePayload);
            break;
        
        default:
            console.log(`Tipo de mensaje desconocido: ${type}`);
            ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: `Tipo de mensaje desconocido: ${type}` } }));
    }
}

function handleClientDisconnect(ws) {
    const clientData = clients.get(ws);
    if (!clientData) {
        console.warn("[Disconnect] Intento de desconectar cliente no encontrado en `clients` map.");
        return; // Si no hay clientData, no hay nada que hacer
    }

    const clientId = clientData.id;
    const clientName = clientData.name || `Cliente ${clientId.substring(0,4)}`;
    const currentRoomId = clientData.roomId;

    console.log(`[Disconnect] Cliente ${clientName} (${clientId}) desconectado.`);

    // Si el cliente estaba en una sala, manejar la desconexión de la sala
    if (currentRoomId) {
        const room = rooms[currentRoomId];
        if (room) {
            console.log(`[Disconnect] Cliente ${clientName} estaba en sala ${currentRoomId} (${room.gameType}).`);
            
            const wasPlayerInRoom = room.players.find(p => p.id === clientId);
            room.players = room.players.filter(player => player.id !== clientId);
            clientData.roomId = null; // Actualizar clientData para reflejar que ya no está en una sala

            if (room.players.length === 0) {
                console.log(`[RoomCleanup] Sala ${currentRoomId} vacía tras desconexión de ${clientName}. Eliminándola.`);
                delete rooms[currentRoomId];
            } else {
                // Notificar al otro jugador (si queda alguno)
                const remainingPlayer = room.players[0]; // En juegos 1v1, si queda alguien, es el único.
                if (remainingPlayer && remainingPlayer.ws && remainingPlayer.ws.readyState === WebSocket.OPEN) {
                    remainingPlayer.ws.send(JSON.stringify({
                        type: 'playerDisconnect',
                        payload: { 
                            disconnectedPlayerId: clientId,
                            disconnectedPlayerName: clientName,
                            message: `${clientName} se ha desconectado.`
                        }
                    }));
                    console.log(`[Notify] Notificado a ${remainingPlayer.name} sobre desconexión de ${clientName} en sala ${currentRoomId}.`);
                }

                // Si el juego estaba activo, el jugador restante podría ganar por abandono.
                // La lógica de endGame (Mentiroso o QSM) debería ser llamada por el flujo normal del juego 
                // o cuando el cliente restante realiza una acción y el servidor nota que el oponente no está.
                // Sin embargo, podemos forzar el fin del juego aquí para QSM si estaba activo.
                if (room.gameState && room.gameState.gameActive) {
                    console.log(`[GameImpact] Juego en sala ${currentRoomId} (${room.gameType}) estaba activo. ${clientName} se desconectó.`);
                    if (room.gameType === 'quiensabemas') {
                        // Para QSM, si un jugador se va, el otro gana automáticamente.
                        // endGameQSM se encarga de las notificaciones y guardado en Firebase.
                        if (room.players.length === 1) { // Asegurarse que realmente queda 1 jugador
                           console.log(`[QSM AutoWin] ${remainingPlayer.name} gana por desconexión de ${clientName} en sala ${currentRoomId}.`);
                           endGameQSM(room, `${clientName} se desconectó. ${remainingPlayer.name} gana.`);
                        } else {
                            // Esto no debería pasar si room.players.length no es 0 arriba.
                             console.warn(`[QSM Disconnect] Juego activo pero número inesperado de jugadores (${room.players.length}) tras desconexión en sala ${currentRoomId}.`);
                        }
                    } else if (room.gameType === 'mentiroso') {
                        // Para Mentiroso, el juego podría continuar o el otro jugador podría ser declarado ganador.
                        // Por ahora, la lógica de timeouts o acciones del jugador restante manejará esto.
                        // Si quieres que el jugador restante gane inmediatamente:
                        // if (room.players.length === 1) {
                        //    endGameMentiroso(room, `${clientName} se desconectó. ${remainingPlayer.name} gana.`);
                        // }
                        console.log(`[Mentiroso Disconnect] ${clientName} se desconectó de un juego activo de Mentiroso en sala ${currentRoomId}. El juego puede terminar o continuar.`);
                    }
                }
            }
            // Después de modificar el estado de las salas (eliminada o jugador removido),
            // actualizamos la lista para el lobby.
            broadcastAvailableRooms(); 
        } else {
            console.warn(`[Disconnect] Cliente ${clientName} tenía roomId ${currentRoomId}, pero la sala no se encontró en \`rooms\`.`);
        }
    }

    clients.delete(ws); // Eliminar al cliente del mapa global de clientes
    console.log(`[Disconnect] Cliente ${clientName} (${clientId}) eliminado de \`clients\`. Total clientes: ${clients.size}`);
}

// --- Funciones de utilidad y lógica del juego (se añadirán aquí) ---

function generateRoomId() {
    // Genera un ID de sala corto y legible (ej. ABCDE)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function handleCreateRoom(ws, payload) {
    const clientData = clients.get(ws);
    if (clientData.roomId) {
        ws.send(JSON.stringify({ type: 'joinError', payload: { error: 'Ya estás en una sala.' } }));
        return;
    }

    const roomId = generateRoomId();
    const playerName = payload.playerName || `Jugador ${clientData.id.substring(0, 4)}`;
    const gameType = payload.gameType; // <<--- OBTENER DE PAYLOAD

    if (!gameType || (gameType !== 'mentiroso' && gameType !== 'quiensabemas')) {
        ws.send(JSON.stringify({ type: 'joinError', payload: { error: 'Tipo de juego no válido o no especificado.' } }));
        return;
    }

    rooms[roomId] = {
        id: roomId,
        creatorId: clientData.id,
        creatorName: playerName,
        players: [{ id: clientData.id, name: playerName, ws: ws, score: 0 }],
        gameType: gameType, // <<--- ALMACENAR gameType
        password: payload.password || null,
        isPrivate: !!payload.password,
        maxPlayers: 2, // Ambos juegos son 1v1 por ahora
        gameState: null 
    };

    clientData.roomId = roomId;
    clientData.name = playerName;

    ws.send(JSON.stringify({
        type: 'roomCreated',
        payload: {
            roomId: roomId,
            gameType: gameType, // Devolver gameType
            players: rooms[roomId].players.map(p => ({ id: p.id, name: p.name, score: p.score }))
        }
    }));
    console.log(`Sala ${roomId} (${gameType}) creada por ${playerName} (${clientData.id}).`);
    broadcastAvailableRooms();
}

function handleJoinRoom(ws, payload) {
    const clientData = clients.get(ws);
    if (clientData.roomId) {
        ws.send(JSON.stringify({ type: 'joinError', payload: { error: 'Ya estás en una sala.' } }));
        return;
    }

    const { roomId, playerName, password } = payload; // gameType se verifica desde la sala
    const room = rooms[roomId];

    if (!room) {
        ws.send(JSON.stringify({ type: 'joinError', payload: { error: 'La sala no existe.', failedRoomId: roomId } }));
        return;
    }

    // Opcional: verificar si el cliente especificó un gameType y si coincide con el de la sala
    // if (payload.gameType && room.gameType !== payload.gameType) {
    //     ws.send(JSON.stringify({ type: 'joinError', payload: { error: `Esta sala es para ${room.gameType}, no para ${payload.gameType}.`, failedRoomId: roomId } }));
    //     return;
    // }

    if (room.players.length >= room.maxPlayers) {
        ws.send(JSON.stringify({ type: 'joinError', payload: { error: 'La sala está llena.', failedRoomId: roomId } }));
        return;
    }

    if (room.password && room.password !== password) {
        ws.send(JSON.stringify({ type: 'joinError', payload: { error: 'Contraseña incorrecta.', failedRoomId: roomId } }));
        return;
    }

    const pName = playerName || `Jugador ${clientData.id.substring(0, 4)}`;
    const newPlayer = { id: clientData.id, name: pName, ws: ws, score: 0 };
    room.players.push(newPlayer);

    clientData.roomId = roomId;
    clientData.name = pName;

    const playerInfoForClient = room.players.map(p => ({ id: p.id, name: p.name, score: p.score }));

    ws.send(JSON.stringify({
        type: 'joinSuccess',
        payload: {
            roomId: roomId,
            gameType: room.gameType, // Enviar el tipo de juego de la sala
            players: playerInfoForClient,
        }
    }));

    room.players.forEach(player => {
        if (player.ws && player.ws !== ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify({
                type: 'playerJoined',
                payload: {
                    roomId: roomId,
                    gameType: room.gameType,
                    newPlayer: { id: newPlayer.id, name: newPlayer.name, score: newPlayer.score },
                    players: playerInfoForClient 
                }
            }));
        }
    });
    
    console.log(`${pName} (${clientData.id}) se unió a la sala ${roomId} (${room.gameType}).`);

    if (room.players.length === room.maxPlayers) {
        if (room.gameType === 'mentiroso') {
            setTimeout(() => startGameMentiroso(room), 1000);
        } else if (room.gameType === 'quiensabemas') {
            setTimeout(() => startGameQSM(room), 1000); // <--- INICIAR JUEGO QSM
        }
    }
    broadcastAvailableRooms();
}

function handleJoinRandomRoom(ws, payload) {
    const clientData = clients.get(ws);
    if (clientData.roomId) {
        ws.send(JSON.stringify({ type: 'joinError', payload: { error: 'Ya estás en una sala.' } }));
        return;
    }

    const gameType = payload.gameType; // El cliente DEBE especificar qué juego quiere
    const playerName = payload.playerName;

    if (!gameType || (gameType !== 'mentiroso' && gameType !== 'quiensabemas')) {
        ws.send(JSON.stringify({ type: 'joinRandomError', payload: { error: 'Debes especificar un tipo de juego válido (mentiroso o quiensabemas) para unirte a una sala aleatoria.' } }));
        return;
    }

    const availablePublicRooms = Object.values(rooms).filter(
        room => room.gameType === gameType &&
                !room.isPrivate &&
                room.players.length < room.maxPlayers &&
                room.players.every(p => p.id !== clientData.id) // Asegurarse de no unirse a una sala creada por sí mismo si está vacía
    );

    if (availablePublicRooms.length === 0) {
        console.log(`No hay salas aleatorias de ${gameType} disponibles. Creando una nueva para ${playerName || clientData.id}`);
        handleCreateRoom(ws, { 
            playerName: playerName, 
            password: null, // Pública
            gameType: gameType 
        });
        return;
    }

    const roomToJoin = availablePublicRooms[0]; // Unirse a la primera disponible
    handleJoinRoom(ws, { 
        roomId: roomToJoin.id, 
        playerName: playerName, 
        password: null, // Es pública
        // gameType se infiere de la sala a la que se une
    });
}

function handleLeaveRoom(ws) {
    const clientData = clients.get(ws);
    if (!clientData || !clientData.roomId) {
        // No está en ninguna sala, o ya se manejó por disconnect
        return;
    }

    const roomId = clientData.roomId;
    const room = rooms[roomId];

    if (room) {
        const oldPlayerName = clientData.name || clientData.id;
        room.players = room.players.filter(player => player.id !== clientData.id);
        clientData.roomId = null; // Importante: sacar al cliente de la sala
        // clientData.name podría resetearse o mantenerse, según preferencia

        console.log(`${oldPlayerName} (${clientData.id}) salió de la sala ${roomId}.`);
        ws.send(JSON.stringify({ type: 'leftRoom', payload: { roomId: roomId, message: 'Has salido de la sala.'}}));

        if (room.players.length === 0) {
            console.log(`Sala ${roomId} vacía tras salida voluntaria, eliminándola.`);
            delete rooms[roomId];
        } else {
            // Notificar al jugador restante
            room.players.forEach(player => {
                if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                    player.ws.send(JSON.stringify({
                        type: 'playerLeft',
                        payload: { 
                            roomId: roomId, 
                            leftPlayerId: clientData.id,
                            leftPlayerName: oldPlayerName,
                            message: `${oldPlayerName} ha salido de la sala.`
                        }
                    }));
                }
            });
            // Aquí también se podría manejar la lógica de fin de juego si estaba activo
        }
        broadcastAvailableRooms();
    }
}

function broadcastToRoom(roomId, message, excludeWs = null) {
    const room = rooms[roomId];
    if (!room) {
        console.error(`[ERROR] Intento de broadcast a sala inexistente: ${roomId}`);
        return;
    }

    // Log para diagnóstico
    console.log(`[BroadcastToRoom] Sala ${roomId}, mensaje: ${message.type}`, message.payload);

    let successCount = 0;
    let failCount = 0;
    let messageStr = '';
    
    try {
        messageStr = JSON.stringify(message);
    } catch (err) {
        console.error(`[ERROR] Error serializando mensaje: ${err.message}`);
        return;
    }

    room.players.forEach(player => {
        if (player.ws && player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
            try {
                player.ws.send(messageStr);
                console.log(`[DEBUG] Mensaje enviado a ${player.id} (${player.name}): ${message.type}`);
                successCount++;
            } catch (error) {
                console.error(`Error enviando mensaje a ${player.id} en sala ${roomId}:`, error);
                failCount++;
            }
        } else {
            if (!player.ws) {
                console.warn(`[WARN] Player ${player.id} sin WebSocket`);
            } else if (player.ws.readyState !== WebSocket.OPEN) {
                console.warn(`[WARN] WebSocket de ${player.id} no está abierto: readyState=${player.ws.readyState}`);
            }
        }
    });

    console.log(`[BroadcastToRoom] Resultado: ${successCount} enviados, ${failCount} fallidos`);
}

// Modificamos el temporizador para llamar a una función separada
function broadcastAvailableRooms() {
    const availableRoomsInfo = Object.values(rooms)
        .filter(room => 
            room.players.length < (room.maxPlayers || 2) && 
            !room.isPrivate && // Solo públicas
            (room.gameType === 'mentiroso' || room.gameType === 'quiensabemas') // Mostrar ambos tipos de juego
        )
        .map(room => ({
            id: room.id,
            creatorName: room.creatorName,
            playerCount: room.players.length,
            maxPlayers: room.maxPlayers || 2,
            requiresPassword: !!room.password,
            gameType: room.gameType // Incluir el gameType en la info de la sala
        }));    
    
    // Filtrar clientes que están en el lobby (sin roomId)
    let lobbyClientCount = 0;
    clients.forEach((clientInfo, wsClient) => {
        if (wsClient.readyState === WebSocket.OPEN && !clientInfo.roomId) { 
            try {
                wsClient.send(JSON.stringify({ type: 'availableRooms', payload: { rooms: availableRoomsInfo } }));
                lobbyClientCount++;
            } catch (error) {
                console.error("Error enviando lista de salas disponibles a " + clientInfo.id, error);
            }
        }
    });
    if (lobbyClientCount > 0) {
      // console.log(`Lista de salas disponibles (${availableRoomsInfo.length}) enviada a ${lobbyClientCount} clientes en el lobby.`);
    }
}

// Ya no necesitamos el setInterval aquí si se llama después de crear/unir/salir
// setInterval(broadcastAvailableRooms, 5000); 
// En su lugar, llamamos a broadcastAvailableRooms() explícitamente después de cambios en las salas:
// - Después de handleCreateRoom
// - Después de handleJoinRoom
// - Después de handleLeaveRoom
// - Después de handleClientDisconnect (si afecta a una sala)

// --- Lógica específica del Juego Mentiroso ---
function startGameMentiroso(room) {
    console.log(`Iniciando juego Mentiroso en sala ${room.id} con jugadores: ${room.players.map(p => p.name).join(', ')}`);
    
    // Verificar que tenemos exactamente 2 jugadores
    if (room.players.length !== 2) {
        console.error(`Error al iniciar juego Mentiroso en sala ${room.id}: Se requieren exactamente 2 jugadores, hay ${room.players.length}`);
        return;
    }
    
    console.log(`[DEBUG] IDs de jugadores: ${room.players[0].id}, ${room.players[1].id}`);
    
    // Inicializar estado del juego Mentiroso con valores claros
    room.gameState = {
        gameType: 'mentiroso',
        currentRound: 1,
        maxRounds: 18, // 18 preguntas en total (6 categorías x 3 preguntas)
        currentCategory: null,
        challengeTextTemplate: "", 
        lastBidder: null, 
        currentBid: 0, 
        playerWhoCalledMentiroso: null, 
        playerToListAnswers: null, 
        answersListed: [], 
        validationResults: [],
        currentTurn: room.players[0].id, // El primer jugador empieza por defecto
        scores: {
            [room.players[0].id]: 0,
            [room.players[1].id]: 0
        },
        gameActive: true,
        categoryRound: 1, // Pregunta dentro de la categoría actual (1-3)
        globalCategoryIndex: 0 // Índice de la categoría actual (0-5)
    };

    // Validar que los IDs de los jugadores estén correctamente asignados
    console.log(`[DEBUG] Verificando estado inicial - Turno: ${room.gameState.currentTurn}`);
    console.log(`[DEBUG] Turno asignado a: ${room.players.find(p => p.id === room.gameState.currentTurn)?.name || 'No encontrado'}`);

    // Enviar mensaje de inicio de juego a ambos jugadores
    const gameStartPayload = {
        gameType: 'mentiroso',
        players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score || 0 })),
        currentTurn: room.gameState.currentTurn // Añadir el turno inicial en el payload
    };
    
    console.log("Enviando gameStart a los jugadores:", gameStartPayload);
    broadcastToRoom(room.id, { type: 'gameStart', payload: gameStartPayload });

    // Esperar un momento antes de empezar la primera ronda para que los jugadores vean el mensaje de inicio
    setTimeout(() => nextRoundMentiroso(room), 1000);
}

function nextRoundMentiroso(room) {
    if (!room || !room.gameState) {
        console.error(`[ERROR] Sala no válida o sin gameState en nextRoundMentiroso`);
        return;
    }
    
    if (room.gameState.currentRound > room.gameState.maxRounds) {
        console.log(`[INFO] Máximas rondas alcanzadas (${room.gameState.currentRound}/${room.gameState.maxRounds})`);
        endGameMentiroso(room, "Se alcanzó el número máximo de rondas.");
        return;
    }

    console.log(`[DEBUG] Iniciando ronda ${room.gameState.currentRound} en sala ${room.id}`);
    console.log(`[DEBUG] Jugadores en sala: ${JSON.stringify(room.players.map(p => ({ id: p.id, name: p.name })))}`);

    // Determinar si es una nueva categoría (cada 3 rondas o al inicio)
    const isNewCategory = room.gameState.categoryRound === 1 || room.gameState.categoryRound > 3;
    
    // Si es una nueva categoría, avanzar al siguiente índice de categoría
    if (isNewCategory) {
        if (room.gameState.categoryRound > 3) {
            // Solo incrementamos el índice de categoría si ya completamos 3 preguntas
            room.gameState.globalCategoryIndex = (room.gameState.globalCategoryIndex + 1) % 6;
        }
        // Resetear contador de rondas por categoría
        room.gameState.categoryRound = 1;
        
        // Seleccionar categoría según el orden fijo
        room.gameState.currentCategory = getSequentialCategory(room.gameState.globalCategoryIndex);
        console.log(`[DEBUG] Nueva categoría seleccionada: ${room.gameState.currentCategory}, categoryRound: ${room.gameState.categoryRound}, globalCategoryIndex: ${room.gameState.globalCategoryIndex}`);
    }
    
    // Verificar consistencia entre índice de categoría y nombre de categoría
    const expectedCategory = getSequentialCategory(room.gameState.globalCategoryIndex);
    if (room.gameState.currentCategory !== expectedCategory) {
        console.warn(`[WARN] Inconsistencia detectada en sala ${room.id}: categoría actual ${room.gameState.currentCategory} no coincide con el índice ${room.gameState.globalCategoryIndex} (${expectedCategory})`);
        // Corregir la inconsistencia
        room.gameState.currentCategory = expectedCategory;
    }
    
    // Obtener plantilla de desafío para la categoría actual
    room.gameState.challengeTextTemplate = getChallengeTemplateForCategory(room.gameState.currentCategory);
    
    // Resetear estado de la ronda
    room.gameState.lastBidder = null;
    room.gameState.currentBid = 0;
    room.gameState.playerWhoCalledMentiroso = null;
    room.gameState.playerToListAnswers = null;
    room.gameState.answersListed = [];
    room.gameState.validationResults = [];
    
    // Decidir quién empieza la ronda
    if (room.players.length > 0) {
        if (room.gameState.currentRound === 1 || room.players.length === 1) {
            room.gameState.currentTurn = room.players[0].id;
        } else {
            // Alternar: si el turno anterior NO era del primer jugador, ahora es del primero. Sino, del segundo.
            const lastTurnPlayerIndex = room.players.findIndex(p => p.id === room.gameState.currentTurn);
            if (lastTurnPlayerIndex === -1) { // Si no se encuentra el id anterior, usamos el primer jugador
                console.log(`[WARN] No se encontró jugador con ID ${room.gameState.currentTurn} en la sala, usando el primero`);
                room.gameState.currentTurn = room.players[0].id;
            } else {
                room.gameState.currentTurn = room.players[(lastTurnPlayerIndex + 1) % room.players.length].id;
            }
        }
        
        // Verificar que el jugador existe
        const turnPlayer = room.players.find(p => p.id === room.gameState.currentTurn);
        if (!turnPlayer) {
            console.error(`[ERROR] No se encontró jugador asignado al turno: ${room.gameState.currentTurn}`);
            room.gameState.currentTurn = room.players[0].id; // Asignar al primer jugador por defecto
        }
    } else {
        console.error("No hay jugadores para empezar la ronda en la sala", room.id);
        return; // No se puede empezar la ronda sin jugadores
    }

    console.log(`Sala ${room.id}, Ronda ${room.gameState.currentRound} (${room.gameState.categoryRound}/3): Cat: ${room.gameState.currentCategory}, Turno: ${room.gameState.currentTurn} (${room.players.find(p => p.id === room.gameState.currentTurn)?.name || 'Jugador desconocido'})`);

    // Actualizar el formato del payload para incluir campos adicionales
    const roundStartPayload = {
        round: room.gameState.currentRound,
        categoryRound: room.gameState.categoryRound, // Contador de ronda dentro de categoría
        globalCategoryIndex: room.gameState.globalCategoryIndex, // Índice de la categoría actual
        category: room.gameState.currentCategory,
        challengeTemplate: room.gameState.challengeTextTemplate,
        question: room.gameState.challengeTextTemplate, // Añadir campo question para compatibilidad
        isNewCategory: isNewCategory, // Indicar explícitamente si es nueva categoría
        startingPlayerId: room.gameState.currentTurn,
        currentTurn: room.gameState.currentTurn, // Añadir campo currentTurn para compatibilidad
        players: room.players.map(p => ({ 
            id: p.id, 
            name: p.name, 
            score: room.gameState.scores[p.id] || 0 
        }))
    };

    console.log("Enviando mentirosoNextRound a los jugadores:", roundStartPayload);
    broadcastToRoom(room.id, { 
        type: 'mentirosoNextRound', 
        payload: roundStartPayload 
    });

    // Enviar también como 'newQuestion' para compatibilidad
    broadcastToRoom(room.id, { 
        type: 'newQuestion', 
        payload: roundStartPayload 
    });
}

// Orden fijo de categorías para el juego
const CATEGORY_ORDER = [
    "Fútbol Argentino",
    "Libertadores",
    "Mundiales",
    "Champions League",
    "Selección Argentina",
    "Fútbol General"
];

// Función que devuelve la categoría según el índice secuencial
function getSequentialCategory(index) {
    // Asegurar que el índice esté en el rango válido
    const validIndex = index % CATEGORY_ORDER.length;
    const category = CATEGORY_ORDER[validIndex];
    console.log(`[DEBUG] Obteniendo categoría para índice ${index} (normalizado: ${validIndex}): ${category}`);
    return category;
}

// Reemplazar la función aleatoria con la secuencial
function getRandomCategoryMentiroso() {
    console.warn("Función obsoleta getRandomCategoryMentiroso() llamada. Se debe usar getSequentialCategory()");
    return CATEGORY_ORDER[0]; // Por seguridad, devolvemos la primera categoría
}

// Categorías y desafíos organizados según el orden proporcionado por el usuario
const mentirosoCategories = {
  "Fútbol Argentino": [
    { template: "¿Puedo nombrar X equipos que jugaron en Primera División en los últimos 20 años?" },
    { template: "¿Puedo nombrar X campeones del fútbol argentino desde 2000?" },
    { template: "¿Puedo nombrar X goleadores del torneo local en los últimos 20 años?" },
    { template: "¿Puedo nombrar X técnicos campeones del fútbol argentino?" },
    { template: "¿Puedo nombrar X clubes que descendieron desde 2000?" },
    { template: "¿Puedo nombrar X clásicos del fútbol argentino?" },
    { template: "¿Puedo nombrar X equipos del interior que jugaron en Primera?" },
    { template: "¿Puedo nombrar X estadios de equipos de Primera División?" },
    { template: "¿Puedo nombrar X arqueros históricos del fútbol argentino?" },
    { template: "¿Puedo nombrar X jugadores que salieron de las inferiores de River?" },
    { template: "¿Puedo nombrar X jugadores que salieron de las inferiores de Boca?" },
    { template: "¿Puedo nombrar X equipos que jugaron copas internacionales siendo de Argentina?" },
    { template: "¿Puedo nombrar X goleadores históricos de un solo club argentino?" },
    { template: "¿Puedo nombrar X futbolistas argentinos que volvieron del exterior al fútbol local?" },
    { template: "¿Puedo nombrar X entrenadores que dirigieron más de 5 equipos argentinos?" },
    { template: "¿Puedo nombrar X jugadores que pasaron por Boca y River?" },
    { template: "¿Puedo nombrar X equipos que jugaron en el Nacional B y luego ascendieron?" },
    { template: "¿Puedo nombrar X futbolistas que jugaron más de 300 partidos en el fútbol argentino?" },
    { template: "¿Puedo nombrar X presidentes históricos de clubes argentinos?" },
    { template: "¿Puedo nombrar X partidos recordados del fútbol argentino?" },
    { template: "¿Puedo nombrar X apodos de equipos argentinos?" },
    { template: "¿Puedo nombrar X camisetas clásicas de equipos argentinos?" },
    { template: "¿Puedo nombrar X jugadores que fueron campeones con más de un club argentino?" },
    { template: "¿Puedo nombrar X árbitros reconocidos del fútbol argentino?" },
    { template: "¿Puedo nombrar X equipos que participaron en liguillas pre-libertadores?" },
    { template: "¿Puedo nombrar X jugadores que se destacaron en torneos cortos?" },
    { template: "¿Puedo nombrar X entrenadores jóvenes del fútbol argentino actual?" },
    { template: "¿Puedo nombrar X ídolos máximos de diferentes clubes argentinos?" },
    { template: "¿Puedo nombrar X campeones invictos del fútbol argentino?" },
    { template: "¿Puedo nombrar X jugadores que fueron goleadores y luego técnicos en Argentina?" }
  ],
  "Libertadores": [
    { template: "¿Puedo nombrar X equipos campeones de la Copa Libertadores?" },
    { template: "¿Puedo nombrar X jugadores argentinos que ganaron la Libertadores?" },
    { template: "¿Puedo nombrar X finales de Libertadores desde 1990?" },
    { template: "¿Puedo nombrar X entrenadores campeones de Libertadores?" },
    { template: "¿Puedo nombrar X goleadores históricos de la Libertadores?" },
    { template: "¿Puedo nombrar X equipos brasileños campeones de Libertadores?" },
    { template: "¿Puedo nombrar X estadios donde se jugó una final de Libertadores?" },
    { template: "¿Puedo nombrar X clubes que perdieron una final de Libertadores?" },
    { template: "¿Puedo nombrar X jugadores que ganaron Libertadores más de una vez?" },
    { template: "¿Puedo nombrar X equipos que hayan sido semifinalistas en los últimos 15 años?" },
    { template: "¿Puedo nombrar X clubes que participaron por primera vez desde 2010?" },
    { template: "¿Puedo nombrar X arqueros destacados de la Libertadores?" },
    { template: "¿Puedo nombrar X finales de Libertadores que se definieron por penales?" },
    { template: "¿Puedo nombrar X partidos entre argentinos y brasileños en Libertadores?" },
    { template: "¿Puedo nombrar X jugadores extranjeros que ganaron Libertadores con clubes argentinos?" },
    { template: "¿Puedo nombrar X equipos paraguayos que jugaron semifinales?" },
    { template: "¿Puedo nombrar X jugadores que convirtieron goles en finales de Libertadores?" },
    { template: "¿Puedo nombrar X clubes con más de 10 participaciones en Libertadores?" },
    { template: "¿Puedo nombrar X técnicos argentinos campeones de Libertadores?" },
    { template: "¿Puedo nombrar X equipos uruguayos en fases de grupos recientes?" },
    { template: "¿Puedo nombrar X jugadores que fueron capitán en una final de Libertadores?" },
    { template: "¿Puedo nombrar X clubes que eliminaron a Boca en Libertadores?" },
    { template: "¿Puedo nombrar X clubes que eliminaron a River en Libertadores?" },
    { template: "¿Puedo nombrar X ediciones ganadas por clubes no argentinos ni brasileños?" },
    { template: "¿Puedo nombrar X partidos de Libertadores con más de 5 goles?" },
    { template: "¿Puedo nombrar X goles recordados en finales de Libertadores?" },
    { template: "¿Puedo nombrar X equipos que ascendieron y luego jugaron Libertadores?" },
    { template: "¿Puedo nombrar X ediciones consecutivas jugadas por un mismo club?" },
    { template: "¿Puedo nombrar X finales jugadas por equipos argentinos?" },
    { template: "¿Puedo nombrar X técnicos que dirigieron más de 20 partidos de Libertadores?" }
  ],
  "Mundiales": [
    { template: "¿Puedo nombrar X países campeones del mundo?" },
    { template: "¿Puedo nombrar X goleadores históricos de los Mundiales?" },
    { template: "¿Puedo nombrar X jugadores argentinos con al menos 2 mundiales jugados?" },
    { template: "¿Puedo nombrar X países que organizaron un Mundial?" },
    { template: "¿Puedo nombrar X jugadores que jugaron 3 o más mundiales?" },
    { template: "¿Puedo nombrar X campeones del mundo desde 1970?" },
    { template: "¿Puedo nombrar X jugadores que marcaron goles en finales del Mundial?" },
    { template: "¿Puedo nombrar X arqueros titulares en mundiales?" },
    { template: "¿Puedo nombrar X jugadores expulsados en mundiales?" },
    { template: "¿Puedo nombrar X partidos que terminaron por penales en mundiales?" },
    { template: "¿Puedo nombrar X países que llegaron a semifinales del Mundial?" },
    { template: "¿Puedo nombrar X mundiales donde jugó Messi?" },
    { template: "¿Puedo nombrar X selecciones africanas que jugaron mundiales?" },
    { template: "¿Puedo nombrar X selecciones asiáticas que participaron en mundiales?" },
    { template: "¿Puedo nombrar X técnicos campeones del mundo?" },
    { template: "¿Puedo nombrar X mundiales donde hubo al menos un jugador expulsado en la final?" },
    { template: "¿Puedo nombrar X jugadores que usaron la 10 en un Mundial?" },
    { template: "¿Puedo nombrar X países que clasificaron al Mundial 2022?" },
    { template: "¿Puedo nombrar X goles en finales de mundiales?" },
    { template: "¿Puedo nombrar X jugadores que fueron capitanes en un Mundial?" },
    { template: "¿Puedo nombrar X países que hayan eliminado a Argentina en mundiales?" },
    { template: "¿Puedo nombrar X mundiales donde Argentina llegó a cuartos o más?" },
    { template: "¿Puedo nombrar X jugadores con más partidos jugados en mundiales?" },
    { template: "¿Puedo nombrar X finales de mundiales desde 1982?" },
    { template: "¿Puedo nombrar X jugadores sudamericanos con goles en mundiales?" },
    { template: "¿Puedo nombrar X selecciones europeas que llegaron a semifinales?" },
    { template: "¿Puedo nombrar X selecciones que clasificaron a más de 10 mundiales?" },
    { template: "¿Puedo nombrar X jugadores que hicieron doblete en un partido de Mundial?" },
    { template: "¿Puedo nombrar X países que nunca jugaron un Mundial?" },
    { template: "¿Puedo nombrar X camisetas históricas usadas en mundiales?" }
  ],
  "Champions League": [
    { template: "¿Puedo nombrar X equipos que hayan ganado la Champions League?" },
    { template: "¿Puedo nombrar X jugadores que hayan sido goleadores de una Champions?" },
    { template: "¿Puedo nombrar X entrenadores que hayan ganado la Champions?" },
    { template: "¿Puedo nombrar X finales de Champions disputadas desde 2000?" },
    { template: "¿Puedo nombrar X jugadores argentinos campeones de Champions?" },
    { template: "¿Puedo nombrar X clubes que hayan llegado a la final sin ganarla?" },
    { template: "¿Puedo nombrar X jugadores brasileños que hayan ganado la Champions?" },
    { template: "¿Puedo nombrar X países que tuvieron equipos en semifinales de Champions?" },
    { template: "¿Puedo nombrar X equipos italianos que hayan jugado la Champions?" },
    { template: "¿Puedo nombrar X equipos que eliminaron al Real Madrid en Champions?" },
    { template: "¿Puedo nombrar X finales que se definieron por penales en Champions?" },
    { template: "¿Puedo nombrar X equipos ingleses que hayan ganado la Champions?" },
    { template: "¿Puedo nombrar X jugadores que hayan ganado Champions con más de un club?" },
    { template: "¿Puedo nombrar X goleadores históricos de la Champions?" },
    { template: "¿Puedo nombrar X jugadores que hayan jugado más de 100 partidos en Champions?" },
    { template: "¿Puedo nombrar X ciudades donde se haya jugado una final de Champions?" },
    { template: "¿Puedo nombrar X equipos que hayan eliminado al Barcelona en Champions?" },
    { template: "¿Puedo nombrar X campeones de Champions entre 1990 y 2020?" },
    { template: "¿Puedo nombrar X defensores que hayan sido titulares en finales de Champions?" },
    { template: "¿Puedo nombrar X jugadores franceses campeones de Champions?" },
    { template: "¿Puedo nombrar X goles en finales de Champions entre 2010 y 2024?" },
    { template: "¿Puedo nombrar X partidos de Champions que terminaron con goleada?" },
    { template: "¿Puedo nombrar X arqueros que hayan sido titulares en finales de Champions?" },
    { template: "¿Puedo nombrar X clubes con más de 10 participaciones en Champions?" },
    { template: "¿Puedo nombrar X jugadores que hayan sido MVP de una final de Champions?" },
    { template: "¿Puedo nombrar X equipos que hayan enfrentado al PSG en Champions?" },
    { template: "¿Puedo nombrar X jugadores sudamericanos que hayan jugado finales de Champions?" },
    { template: "¿Puedo nombrar X finales donde haya jugado un equipo alemán?" },
    { template: "¿Puedo nombrar X jugadores que hayan hecho hat-trick en Champions?" },
    { template: "¿Puedo nombrar X jugadores que hayan ganado la Champions y el Mundial?" }
  ],
  "Selección Argentina": [
    { template: "¿Puedo nombrar X jugadores que hayan sido convocados por la Selección Argentina en un Mundial?" },
    { template: "¿Puedo nombrar X jugadores que hayan usado la camiseta número 10 en la Selección?" },
    { template: "¿Puedo nombrar X técnicos que dirigieron a la Selección Argentina?" },
    { template: "¿Puedo nombrar X jugadores que hayan sido campeones con Argentina?" },
    { template: "¿Puedo nombrar X partidos memorables de Argentina en Mundiales?" },
    { template: "¿Puedo nombrar X jugadores argentinos que marcaron en finales de torneos oficiales?" },
    { template: "¿Puedo nombrar X rivales históricos de Argentina en Copas del Mundo?" },
    { template: "¿Puedo nombrar X arqueros que hayan sido titulares en la Selección?" },
    { template: "¿Puedo nombrar X capitanes de la Selección Argentina?" },
    { template: "¿Puedo nombrar X goles famosos de la Selección Argentina?" },
    { template: "¿Puedo nombrar X jugadores que jugaron más de 50 partidos con la Selección?" },
    { template: "¿Puedo nombrar X campeones del mundo con Argentina?" },
    { template: "¿Puedo nombrar X jugadores que jugaron más de una Copa América?" },
    { template: "¿Puedo nombrar X jugadores argentinos que jugaron en Europa y fueron convocados?" },
    { template: "¿Puedo nombrar X partidos de eliminatorias en los que jugó Argentina?" },
    { template: "¿Puedo nombrar X títulos ganados por la Selección Argentina?" },
    { template: "¿Puedo nombrar X juveniles que llegaron a la mayor desde la Sub-20?" },
    { template: "¿Puedo nombrar X partidos entre Argentina y Brasil?" },
    { template: "¿Puedo nombrar X mediocampistas históricos de la Selección?" },
    { template: "¿Puedo nombrar X delanteros históricos de la Selección?" },
    { template: "¿Puedo nombrar X defensores que fueron titulares en torneos oficiales?" },
    { template: "¿Puedo nombrar X jugadores que compartieron cancha con Messi en la Selección?" },
    { template: "¿Puedo nombrar X equipos contra los que Argentina jugó más de 5 veces?" },
    { template: "¿Puedo nombrar X goles de Argentina en el Mundial 2022?" },
    { template: "¿Puedo nombrar X penales pateados por Argentina en Copas del Mundo?" },
    { template: "¿Puedo nombrar X amistosos jugados por Argentina en los últimos 10 años?" },
    { template: "¿Puedo nombrar X goles de tiro libre de jugadores argentinos en la Selección?" },
    { template: "¿Puedo nombrar X estadios donde jugó Argentina de local?" },
    { template: "¿Puedo nombrar X jugadores de clubes argentinos que fueron convocados?" },
    { template: "¿Puedo nombrar X jugadores de la Scaloneta?" }
  ],
  "Fútbol General": [
    { template: "¿Puedo nombrar X países con ligas de fútbol profesionales?" },
    { template: "¿Puedo nombrar X jugadores que ganaron el Balón de Oro?" },
    { template: "¿Puedo nombrar X clubes que participaron en el Mundial de Clubes?" },
    { template: "¿Puedo nombrar X entrenadores famosos a nivel mundial?" },
    { template: "¿Puedo nombrar X jugadores históricos del fútbol mundial?" },
    { template: "¿Puedo nombrar X clásicos del fútbol mundial?" },
    { template: "¿Puedo nombrar X camisetas icónicas del fútbol?" },
    { template: "¿Puedo nombrar X jugadores que hayan jugado en más de 5 países?" },
    { template: "¿Puedo nombrar X arqueros históricos del fútbol mundial?" },
    { template: "¿Puedo nombrar X selecciones con al menos un título internacional?" },
    { template: "¿Puedo nombrar X jugadores que hayan jugado en el Real Madrid y el Barcelona?" },
    { template: "¿Puedo nombrar X clubes que hayan ganado copas continentales?" },
    { template: "¿Puedo nombrar X países que han sido sede de competiciones FIFA?" },
    { template: "¿Puedo nombrar X ligas nacionales con más de 20 equipos?" },
    { template: "¿Puedo nombrar X futbolistas que se retiraron en 2020 o después?" },
    { template: "¿Puedo nombrar X jugadores que pasaron de Sudamérica a Europa?" },
    { template: "¿Puedo nombrar X jugadores que fueron capitanes en sus selecciones?" },
    { template: "¿Puedo nombrar X futbolistas que jugaron en equipos árabes?" },
    { template: "¿Puedo nombrar X delanteros históricos de Europa?" },
    { template: "¿Puedo nombrar X técnicos que dirigieron selecciones y clubes top?" },
    { template: "¿Puedo nombrar X países que participaron en la Copa Confederaciones?" },
    { template: "¿Puedo nombrar X equipos con más de 100 años de historia?" },
    { template: "¿Puedo nombrar X jugadores que hayan sido campeones olímpicos?" },
    { template: "¿Puedo nombrar X futbolistas que usaron la camiseta número 7 en clubes famosos?" },
    { template: "¿Puedo nombrar X jugadores que ganaron Champions y Libertadores?" },
    { template: "¿Puedo nombrar X ligas donde jugaron más de 10 argentinos?" },
    { template: "¿Puedo nombrar X entrenadores que ganaron títulos en 3 países distintos?" },
    { template: "¿Puedo nombrar X jugadores que fueron figura en mundiales juveniles?" },
    { template: "¿Puedo nombrar X futbolistas africanos destacados de las últimas décadas?" },
    { template: "¿Puedo nombrar X defensores históricos a nivel mundial?" }
  ]
};

function getChallengeTemplateForCategory(categoryName) {
    const categoryChallenges = mentirosoCategories[categoryName];
    if (!categoryChallenges || categoryChallenges.length === 0) {
        console.error(`No hay desafíos para la categoría: ${categoryName}`);
        return "Puedo nombrar X elementos de esta categoría."; // Fallback
    }
    
    // Obtener una pregunta aleatoria para la categoría
    const randomChallengeObj = categoryChallenges[Math.floor(Math.random() * categoryChallenges.length)];
    console.log(`[DEBUG] Pregunta seleccionada para ${categoryName}: ${randomChallengeObj.template}`);
    return randomChallengeObj.template;
}

async function endGameMentiroso(room, reason = "Juego finalizado") {
    if (!room || !room.gameState || !room.gameState.gameActive) return;

    console.log(`Juego Mentiroso terminado en sala ${room.id}. Razón: ${reason}`);
    room.gameState.gameActive = false;

    let winnerId = null;
    let draw = false;
    const scores = room.gameState.scores;
    const playerIds = Object.keys(scores);

    if (playerIds.length === 2) {
        if (scores[playerIds[0]] > scores[playerIds[1]]) {
            winnerId = playerIds[0];
        } else if (scores[playerIds[1]] > scores[playerIds[0]]) {
            winnerId = playerIds[1];
        } else {
            draw = true;
        }
    } else if (playerIds.length === 1) {
        winnerId = playerIds[0];
    }

    const finalPayload = {
        gameType: 'mentiroso',
        reason: reason,
        finalScores: scores,
        winnerId: winnerId,
        draw: draw,
        players: room.players.map(p => ({ id: p.id, name: p.name, finalScore: scores[p.id] || 0 }))
    };

    broadcastToRoom(room.id, { type: 'gameOver', payload: finalPayload });

    // --- GUARDAR RESULTADOS EN FIREBASE ---
    try {
        const db = admin.firestore(); // Obtener instancia de Firestore
        const batch = db.batch(); // Usar un batch para múltiples escrituras

        // 1. Guardar la partida en la colección 'matches'
        const matchDocRef = db.collection('matches').doc(); // Nuevo documento con ID automático
        const matchData = {
            gameType: "mentiroso",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            reason: reason,
            roomId: room.id,
            players: room.players.map(p => ({
                playerId: p.id,
                displayName: p.name,
                score: scores[p.id] || 0,
                isWinner: p.id === winnerId && !draw,
                isDraw: draw
            })),
            // Puedes añadir más detalles de la partida si es necesario
        };
        batch.set(matchDocRef, matchData);
        console.log(`[Firebase] Datos de partida Mentiroso preparados para sala ${room.id}`);

        // 2. Actualizar estadísticas de cada jugador en la colección 'users'
        for (const player of room.players) {
            const userDocRef = db.collection('users').doc(player.id);
            const userStatsUpdate = {
                displayName: player.name, // Asegurar que el nombre esté actualizado
                lastPlayed: admin.firestore.FieldValue.serverTimestamp(),
                [`stats.mentiroso.played`]: admin.firestore.FieldValue.increment(1),
                [`stats.mentiroso.totalScore`]: admin.firestore.FieldValue.increment(scores[player.id] || 0),
            };
            if (player.id === winnerId && !draw) {
                userStatsUpdate[`stats.mentiroso.wins`] = admin.firestore.FieldValue.increment(1);
            } else if (draw) {
                userStatsUpdate[`stats.mentiroso.draws`] = admin.firestore.FieldValue.increment(1);
            } else {
                userStatsUpdate[`stats.mentiroso.losses`] = admin.firestore.FieldValue.increment(1);
            }
            batch.set(userDocRef, userStatsUpdate, { merge: true }); // Usar set con merge para crear si no existe
            console.log(`[Firebase] Estadísticas de usuario Mentiroso preparadas para ${player.id} (${player.name})`);
        }

        await batch.commit(); // Ejecutar todas las operaciones en el batch
        console.log(`[Firebase] Resultados de Mentiroso para sala ${room.id} guardados exitosamente.`);

    } catch (error) {
        console.error(`[Firebase] ERROR al guardar resultados de Mentiroso para sala ${room.id}:`, error);
        // Opcional: notificar a los jugadores del error si es crítico, o solo loguearlo
    }
    // --- FIN GUARDAR RESULTADOS EN FIREBASE ---
}

// --- Implementación de funciones para manejar mensajes del juego Mentiroso ---

function handleMentirosoSubmitBid(ws, payload) {
    const clientData = clients.get(ws);
    if (!clientData || !clientData.roomId) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No estás en una sala de juego.' } 
        }));
        return;
    }

    const roomId = clientData.roomId;
    const room = rooms[roomId];

    if (!room || !room.gameState || !room.gameState.gameActive) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No hay un juego activo en esta sala.' } 
        }));
        return;
    }

    // Verificar si es el turno del jugador
    console.log(`[DEBUG] Bid - Turno actual: ${room.gameState.currentTurn}, Jugador: ${clientData.id}`);
    console.log(`[DEBUG] Tipos: ${typeof room.gameState.currentTurn} vs ${typeof clientData.id}`);
    console.log(`[DEBUG] Longitudes: ${room.gameState.currentTurn.length} vs ${clientData.id.length}`);
    
    // Comparación segura ignorando tipo
    const isSameTurn = String(room.gameState.currentTurn).trim() === String(clientData.id).trim();
    console.log(`[DEBUG] Comparación segura: ${isSameTurn}`);
    
    console.log(`[DEBUG] Jugadores en sala: ${JSON.stringify(room.players.map(p => ({id: p.id, name: p.name})))}`);
    
    if (!isSameTurn) {
        console.log(`[ERROR] Jugador ${clientData.id} intentó apostar fuera de su turno. Turno actual: ${room.gameState.currentTurn}`);
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No es tu turno para apostar.' } 
        }));
        return;
    }

    // Validar la apuesta
    const bid = parseInt(payload.bid);
    if (isNaN(bid) || bid <= room.gameState.currentBid) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: `La apuesta debe ser un número mayor que la apuesta actual (${room.gameState.currentBid}).` } 
        }));
        return;
    }

    console.log(`[DEBUG] Apuesta válida recibida: ${bid} de ${clientData.name} (${clientData.id})`);

    // Actualizar estado del juego
    room.gameState.currentBid = bid;
    room.gameState.lastBidder = clientData.id;
    
    // Determinar quién es el siguiente jugador (en un juego 1v1 es simplemente el otro jugador)
    const otherPlayer = room.players.find(p => p.id !== clientData.id);
    if (!otherPlayer) {
        console.error(`No se encontró otro jugador en la sala ${roomId}`);
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No se pudo encontrar al otro jugador.' } 
        }));
        return;
    }
    
    // Cambiar el turno
    const oldTurn = room.gameState.currentTurn;
    room.gameState.currentTurn = otherPlayer.id;
    console.log(`[DEBUG] Cambio de turno: ${oldTurn} -> ${otherPlayer.id}`);

    // Crear el payload con la información completa
    const bidUpdatePayload = {
        newBid: bid,
        bidderId: clientData.id,
        bidderName: clientData.name,
        nextTurn: otherPlayer.id,
        nextTurnName: otherPlayer.name
    };

    console.log(`[Mentiroso] Sala ${roomId}: ${clientData.name} apostó ${bid}, siguiente turno: ${otherPlayer.name}`);
    
    // Enviar confirmación al jugador que hizo la apuesta
    console.log(`[DEBUG] Enviando bidConfirmed a ${clientData.id}`);
    try {
        ws.send(JSON.stringify({
            type: 'bidConfirmed',
            payload: {
                bid: bid,
                message: `Tu apuesta de ${bid} fue enviada. Ahora es el turno de ${otherPlayer.name}.`
            }
        }));
    } catch (error) {
        console.error(`Error enviando bidConfirmed: ${error.message}`);
    }
    
    // Usamos setTimeout para asegurar que el mensaje bidConfirmed se procese antes
    setTimeout(() => {
        console.log(`[DEBUG] Enviando mentirosoBidUpdate a sala ${roomId}: `, bidUpdatePayload);
        
        try {
            broadcastToRoom(roomId, { 
                type: 'mentirosoBidUpdate', 
                payload: bidUpdatePayload 
            });
            console.log('[DEBUG] Broadcast completado con éxito');
        } catch (error) {
            console.error('[ERROR] Error en broadcast:', error);
        }
    }, 100);
}

function handleMentirosoCallLiar(ws, payload) {
    const clientData = clients.get(ws);
    if (!clientData || !clientData.roomId) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No estás en una sala de juego.' } 
        }));
        return;
    }

    const roomId = clientData.roomId;
    const room = rooms[roomId];

    if (!room || !room.gameState || !room.gameState.gameActive) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No hay un juego activo en esta sala.' } 
        }));
        return;
    }

    // Verificar si es el turno del jugador
    if (room.gameState.currentTurn !== clientData.id) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No es tu turno para llamar Mentiroso.' } 
        }));
        return;
    }

    // Verificar si hay una apuesta para llamar Mentiroso
    if (!room.gameState.lastBidder || room.gameState.currentBid <= 0) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No hay una apuesta activa para llamar Mentiroso.' } 
        }));
        return;
    }

    // No puedes llamar Mentiroso a tu propia apuesta
    if (room.gameState.lastBidder === clientData.id) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No puedes llamar Mentiroso a tu propia apuesta.' } 
        }));
        return;
    }

    // Actualizar estado del juego
    room.gameState.playerWhoCalledMentiroso = clientData.id;
    room.gameState.playerToListAnswers = room.gameState.lastBidder;
    room.gameState.currentTurn = room.gameState.lastBidder; // El acusado debe listar respuestas

    // Enviar mensaje a todos los jugadores
    const liarCalledPayload = {
        callerId: clientData.id,
        callerName: clientData.name,
        accusedId: room.gameState.lastBidder,
        accusedName: room.players.find(p => p.id === room.gameState.lastBidder)?.name || 'Jugador acusado'
    };

    broadcastToRoom(roomId, { 
        type: 'mentirosoLiarCalled', 
        payload: liarCalledPayload 
    });

    console.log(`[Mentiroso] Sala ${roomId}: ${clientData.name} llamó Mentiroso a ${liarCalledPayload.accusedName}`);
}

function handleMentirosoSubmitAnswers(ws, payload) {
    const clientData = clients.get(ws);
    if (!clientData || !clientData.roomId) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No estás en una sala de juego.' } 
        }));
        return;
    }

    const roomId = clientData.roomId;
    const room = rooms[roomId];

    if (!room || !room.gameState || !room.gameState.gameActive) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No hay un juego activo en esta sala.' } 
        }));
        return;
    }

    // Verificar si este jugador debe listar respuestas
    if (room.gameState.playerToListAnswers !== clientData.id) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No te corresponde listar respuestas en este momento.' } 
        }));
        return;
    }

    // Validar respuestas
    const answers = Array.isArray(payload.answers) ? payload.answers : [];
    if (answers.length < 1) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'Debes listar al menos una respuesta.' } 
        }));
        return;
    }

    // Comprobar si el número de respuestas es suficiente
    if (answers.length < room.gameState.currentBid) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: `Debes listar al menos ${room.gameState.currentBid} respuestas según tu apuesta.` } 
        }));
        return;
    }

    // Guardar respuestas y actualizar turno (ahora le toca validar al que llamó mentiroso)
    room.gameState.answersListed = answers;
    room.gameState.currentTurn = room.gameState.playerWhoCalledMentiroso;

    // Enviar mensaje a todos los jugadores
    const answersSubmittedPayload = {
        listerId: clientData.id,
        listerName: clientData.name,
        answers: answers,
        validatorId: room.gameState.playerWhoCalledMentiroso,
        validatorName: room.players.find(p => p.id === room.gameState.playerWhoCalledMentiroso)?.name || 'Validador'
    };

    broadcastToRoom(roomId, { 
        type: 'mentirosoAnswersSubmitted', 
        payload: answersSubmittedPayload 
    });

    console.log(`[Mentiroso] Sala ${roomId}: ${clientData.name} envió ${answers.length} respuestas para validar.`);
}

function handleMentirosoSubmitValidation(ws, payload) {
    const clientData = clients.get(ws);
    if (!clientData || !clientData.roomId) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No estás en una sala de juego.' } 
        }));
        return;
    }

    const roomId = clientData.roomId;
    const room = rooms[roomId];

    if (!room || !room.gameState || !room.gameState.gameActive) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No hay un juego activo en esta sala.' } 
        }));
        return;
    }

    // Verificar si este jugador debe validar respuestas
    if (room.gameState.playerWhoCalledMentiroso !== clientData.id) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'No te corresponde validar respuestas en este momento.' } 
        }));
        return;
    }

    // Validar payload
    const validations = Array.isArray(payload.validations) ? payload.validations : [];
    if (validations.length !== room.gameState.answersListed.length) {
        ws.send(JSON.stringify({ 
            type: 'errorMessage', 
            payload: { error: 'Debes validar todas las respuestas.' } 
        }));
        return;
    }

    // Guardar validaciones
    room.gameState.validationResults = validations;

    // Evaluar resultados y determinar ganador de la ronda
    const validAnswersCount = validations.filter(v => v === true).length;
    const wasMentiroso = validAnswersCount < room.gameState.currentBid;
    const roundWinnerId = wasMentiroso ? room.gameState.playerWhoCalledMentiroso : room.gameState.playerToListAnswers;
    
    // Actualizar puntuaciones
    room.gameState.scores[roundWinnerId] = (room.gameState.scores[roundWinnerId] || 0) + 1;
    
    // Actualizar puntuaciones en los objetos de jugadores también
    room.players.forEach(player => {
        if (player.id === roundWinnerId) {
            player.score = (player.score || 0) + 1;
        }
    });

    // Determinar mensaje según resultado
    let resultMessage = '';
    if (wasMentiroso) {
        resultMessage = `¡Era MENTIROSO! ${validAnswersCount} respuestas válidas de ${room.gameState.currentBid} requeridas. Punto para ${room.players.find(p => p.id === room.gameState.playerWhoCalledMentiroso)?.name || 'Jugador que llamó Mentiroso'}.`;
    } else {
        resultMessage = `¡NO era mentiroso! Tenía ${validAnswersCount} respuestas válidas de ${room.gameState.currentBid} requeridas. Punto para ${room.players.find(p => p.id === room.gameState.playerToListAnswers)?.name || 'Jugador acusado'}.`;
    }

    // Preparar payload con resultado de la ronda
    const roundResultPayload = {
        wasMentiroso: wasMentiroso,
        validAnswersCount: validAnswersCount,
        requiredCount: room.gameState.currentBid,
        winnerId: roundWinnerId,
        winnerName: room.players.find(p => p.id === roundWinnerId)?.name || 'Ganador de la ronda',
        message: resultMessage,
        players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
        answers: room.gameState.answersListed.map((answer, index) => ({
            text: answer,
            isValid: validations[index]
        }))
    };

    // Enviar mensaje a todos los jugadores
    broadcastToRoom(roomId, { 
        type: 'mentirosoRoundResult', 
        payload: roundResultPayload 
    });

    console.log(`[Mentiroso] Sala ${roomId}: Ronda ${room.gameState.currentRound} terminada. Ganador: ${roundResultPayload.winnerName}`);

    // Verificar si el juego ha terminado (por número de rondas o puntuación)
    if (room.gameState.currentRound >= room.gameState.maxRounds) {
        console.log(`[Mentiroso] Sala ${roomId}: Juego terminado. Máximas rondas alcanzadas.`);
        setTimeout(() => endGameMentiroso(room, "Se alcanzó el número máximo de rondas."), 3000);
    } else {
        // Incrementar la ronda antes de iniciar la siguiente
        room.gameState.currentRound++;
        
        // También incrementar la ronda dentro de la categoría
        if (room.gameState.categoryRound >= 3) {
            // Si completamos las 3 preguntas de la categoría, pasamos a la siguiente
            room.gameState.categoryRound = 1;
            room.gameState.globalCategoryIndex = (room.gameState.globalCategoryIndex + 1) % 6;
            const nextCategory = getSequentialCategory(room.gameState.globalCategoryIndex);
            console.log(`[Mentiroso] Sala ${roomId}: Completada categoría. Avanzando a categoría ${room.gameState.globalCategoryIndex} (${nextCategory})`);
        } else {
            // Si no, solo incrementamos la pregunta dentro de la categoría
            room.gameState.categoryRound++;
        }
        
        console.log(`[Mentiroso] Sala ${roomId}: Avanzando a ronda ${room.gameState.currentRound}, ronda de categoría ${room.gameState.categoryRound}, categoría global ${room.gameState.globalCategoryIndex}`);
        
        // Determinar si es un cambio de categoría para ajustar el tiempo de espera
        const isNewCategory = room.gameState.categoryRound === 1;
        const waitTime = isNewCategory ? 1500 : 1000; // Tiempo más corto para transiciones entre categorías

        setTimeout(() => {
            // Verificar que la sala aún existe antes de iniciar la siguiente ronda
            const currentRoom = rooms[roomId];
            if (currentRoom && currentRoom.gameState && currentRoom.gameState.gameActive) {
                console.log(`[Mentiroso] Sala ${roomId}: Iniciando siguiente ronda (${currentRoom.gameState.currentRound}, cat: ${currentRoom.gameState.categoryRound})`);
                nextRoundMentiroso(currentRoom);
            } else {
                console.warn(`[Mentiroso] Sala ${roomId}: No se pudo iniciar la siguiente ronda, sala ya no existe o juego inactivo`);
            }
        }, waitTime);
    }
}

console.log("Lógica básica del servidor y manejo de conexiones WebSocket configurado."); 

// Imprimir una pregunta de ejemplo para cada categoría
console.log("=== PREGUNTAS DE EJEMPLO POR CATEGORÍA ===");
CATEGORY_ORDER.forEach(category => {
    const exampleQuestion = getChallengeTemplateForCategory(category);
    console.log(`${category}: "${exampleQuestion}"`);
}); 

// --- LÓGICA DEL JUEGO QUIEN SABE MAS (QSM) ---

function startGameQSM(room) {
    if (!room || room.players.length !== 2) {
        console.error(`[QSM] Error al iniciar juego en sala ${room.id}: Se requieren 2 jugadores.`);
        // Podríamos notificar a los jugadores si es necesario
        return;
    }
    if (room.gameState && room.gameState.gameActive) {
        console.warn(`[QSM] Intento de iniciar juego ya activo en sala ${room.id}`);
        return;
    }

    console.log(`[QSM] Iniciando juego en sala ${room.id} con jugadores: ${room.players.map(p => p.name).join(', ')}`);

    room.gameState = {
        gameType: 'quiensabemas',
        gameActive: true,
        currentLevel: 1,
        questionsAnsweredInLevel: 0,
        usedQuestionIndices: {}, // { level: [index1, index2] }
        currentQuestion: null,
        optionsSent: false, // Para QSM, las opciones se envían con la pregunta o bajo demanda L>1
        fiftyFiftyUsed: false,
        questionsPerLevel: QSM_QUESTIONS_PER_LEVEL,
        scores: { // Inicializar scores aquí, obteniendo los IDs de room.players
            [room.players[0].id]: 0,
            [room.players[1].id]: 0
        },
        // currentTurn se determinará antes de la primera pregunta
    };

    for (let l = 1; l <= QSM_MAX_LEVELS; l++) {
        room.gameState.usedQuestionIndices[l] = [];
    }
    
    // Resetear scores en el objeto player también, aunque gameState.scores es la fuente de verdad durante el juego.
    room.players.forEach(p => { p.score = 0; });

    // Determinar jugador inicial aleatoriamente
    room.gameState.currentTurn = Math.random() < 0.5 ? room.players[0].id : room.players[1].id;

    const gameStartPayloadQSM = {
        gameType: 'quiensabemas',
        players: room.players.map(p => ({ id: p.id, name: p.name, score: 0 })),
        startingPlayerId: room.gameState.currentTurn
    };

    broadcastToRoom(room.id, { type: 'gameStart', payload: gameStartPayloadQSM });
    console.log(`[QSM] Sala ${room.id}: Juego iniciado. Turno para ${room.gameState.currentTurn}`);

    // Enviar la primera pregunta
    setTimeout(() => sendNextQuestionQSM(room.id), 50); 
}

function sendNextQuestionQSM(roomId) {
    const room = rooms[roomId];
    if (!room || !room.gameState || !room.gameState.gameActive) {
        console.log(`[QSM sendNextQuestion] Abortado para sala ${roomId} - no activa o no existe.`);
        return;
    }
    if (!room.players[0] || !room.players[1]) {
        console.warn(`[QSM sendNextQuestion] Abortado para sala ${roomId} - jugador(es) faltantes.`);
        if (room.gameState.gameActive) endGameQSM(room, "Un jugador se desconectó.");
        return;
    }

    const gs = room.gameState; // gameState

    if (gs.questionsAnsweredInLevel >= gs.questionsPerLevel) {
        gs.currentLevel++;
        gs.questionsAnsweredInLevel = 0;
        console.log(`[QSM] Sala ${roomId} avanzando a Nivel ${gs.currentLevel}`);
    }

    if (gs.currentLevel > QSM_MAX_LEVELS) {
        console.log(`[QSM] Sala ${roomId} alcanzó nivel máximo.`);
        endGameQSM(room, "Se completaron todos los niveles!");
        return;
    }

    if (!qsmAllQuestions[gs.currentLevel] || qsmAllQuestions[gs.currentLevel].length === 0) {
        console.error(`[QSM CRITICO] Sala ${roomId}: No hay preguntas para Nivel ${gs.currentLevel}. Terminando juego.`);
        endGameQSM(room, "Error: No hay preguntas disponibles para este nivel.");
        return;
    }

    const questionsForLevel = qsmAllQuestions[gs.currentLevel];
    if (!gs.usedQuestionIndices[gs.currentLevel]) {
        gs.usedQuestionIndices[gs.currentLevel] = [];
    }
    const usedIndices = gs.usedQuestionIndices[gs.currentLevel];
    const availableIndices = questionsForLevel
        .map((_, index) => index)
        .filter(index => !usedIndices.includes(index));

    if (availableIndices.length === 0) {
        console.warn(`[QSM] Sala ${roomId}: No quedan preguntas sin usar para Nivel ${gs.currentLevel}. Terminando juego.`);
        endGameQSM(room, `Se acabaron las preguntas para el Nivel ${gs.currentLevel}.`);
        return;
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    gs.currentQuestion = { ...questionsForLevel[randomIndex] }; // Copiar la pregunta para evitar mutaciones si es necesario
    gs.usedQuestionIndices[gs.currentLevel].push(randomIndex);
    gs.questionsAnsweredInLevel++;
    gs.optionsSent = false; // Resetear para la nueva pregunta
    gs.fiftyFiftyUsed = false; // Resetear para la nueva pregunta

    const questionPayload = {
        level: gs.currentQuestion.level,
        text: gs.currentQuestion.text,
        options: gs.currentQuestion.options // En QSM, las opciones siempre se envían con la pregunta
    };

    const playersCurrentInfo = room.players.map(p => ({ id: p.id, name: p.name, score: gs.scores[p.id] || 0 }));

    const message = {
        type: 'newQuestion', // El cliente espera 'newQuestion'
        payload: {
            gameType: 'quiensabemas',
            question: questionPayload,
            questionNumber: gs.questionsAnsweredInLevel,
            totalQuestionsInLevel: gs.questionsPerLevel,
            currentTurn: gs.currentTurn,
            players: playersCurrentInfo
        }
    };
    console.log(`[QSM] Sala ${roomId} - Enviando Q${gs.questionsAnsweredInLevel} L${gs.currentLevel}, Turno: ${gs.currentTurn}`);
    broadcastToRoom(roomId, message);
}

// Las funciones handleSubmitAnswerQSM, handleRequestOptionsQSM, handleRequestFiftyFiftyQSM, endGameQSM
// serán muy similares a las de server.js (raíz), pero adaptadas para usar room.gameState y qsmAllQuestions
// y la estructura de `rooms` y `clients` de server/server.js

// Implementaremos estas funciones a continuación.

// No olvides actualizar handleClientMessage para dirigir los mensajes de QSM a estas nuevas funciones.

// ... (código existente de Mentiroso, como endGameMentiroso, etc.)

function handleSubmitAnswerQSM(ws, clientData, payload) {
    const roomId = clientData.roomId;
    const room = rooms[roomId];

    if (!room || !room.gameState || !room.gameState.gameActive || room.gameState.gameType !== 'quiensabemas') {
        ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'Juego QSM no activo o sala incorrecta.' } }));
        return;
    }

    const gs = room.gameState;
    if (clientData.id !== gs.currentTurn) {
        ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'No es tu turno en QSM.' } }));
        return;
    }
    if (!gs.currentQuestion) {
        ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'No hay pregunta activa en QSM.' } }));
        return;
    }
    if (!room.players[0] || !room.players[1]) {
        console.warn(`[QSM handleSubmitAnswer] en sala ${roomId} pero falta un jugador.`);
        if (gs.gameActive) endGameQSM(room, "Un jugador se desconectó antes de responder.");
        return;
    }

    const question = gs.currentQuestion;
    let isCorrect = false;
    let pointsAwarded = 0;
    let submittedAnswerIndex = -1;

    if (payload && typeof payload.selectedIndex === 'number') {
        submittedAnswerIndex = payload.selectedIndex;
        if (submittedAnswerIndex >= 0 && submittedAnswerIndex < question.options.length) {
            isCorrect = submittedAnswerIndex === question.correctIndex;
            console.log(`[QSM] Sala ${roomId} L${question.level} Respuesta (Índice): Enviado=${submittedAnswerIndex}, Correcto=${question.correctIndex}, Resultado=${isCorrect}`);
        } else {
            ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'Respuesta QSM inválida (índice fuera de rango).' } }));
            return;
        }
    } else {
        ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'Respuesta QSM inválida (falta selectedIndex).' } }));
        return;
    }

    const currentPlayer = room.players.find(p => p.id === clientData.id);
    if (isCorrect) {
        pointsAwarded = gs.fiftyFiftyUsed ? 0.5 : 1;
        gs.scores[clientData.id] = (gs.scores[clientData.id] || 0) + pointsAwarded;
        if (currentPlayer) currentPlayer.score = gs.scores[clientData.id]; // Actualizar también el score en el objeto player si se usa
    }

    const resultPayload = {
        isCorrect: isCorrect,
        pointsAwarded: pointsAwarded,
        correctAnswerText: question.correctAnswerText.toUpperCase(),
        correctIndex: question.correctIndex,
        forPlayerId: clientData.id,
        submittedAnswerText: null, // QSM no usa texto directo para responder aquí
        selectedIndex: submittedAnswerIndex
    };

    broadcastToRoom(roomId, { type: 'answerResult', payload: resultPayload });

    // Cambiar turno
    gs.currentTurn = room.players.find(p => p.id !== clientData.id)?.id;
    if (!gs.currentTurn) { // Fallback si algo sale mal encontrando al otro jugador
        console.error("[QSM] No se pudo determinar el siguiente turno, finalizando juego.");
        endGameQSM(room, "Error al determinar el siguiente turno.");
        return;
    }

    const playersCurrentInfo = room.players.map(p => ({ id: p.id, name: p.name, score: gs.scores[p.id] || 0 }));
    const updatePayload = { currentTurn: gs.currentTurn, players: playersCurrentInfo };
    broadcastToRoom(roomId, { type: 'updateState', payload: updatePayload });

    setTimeout(() => {
        const currentRoom = rooms[roomId];
        if (currentRoom && currentRoom.gameState && currentRoom.gameState.gameActive) {
            sendNextQuestionQSM(roomId);
        }
    }, 1500);
}

function handleRequestOptionsQSM(ws, clientData) { // Prácticamente deprecada si las opciones van con la pregunta
    const roomId = clientData.roomId;
    const room = rooms[roomId];
    if (!room || !room.gameState || !room.gameState.gameActive || room.gameState.gameType !== 'quiensabemas' || clientData.id !== room.gameState.currentTurn || !room.gameState.currentQuestion || room.gameState.optionsSent) {
        ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'No se pueden solicitar opciones QSM ahora.' } }));
        return;
    }
    room.gameState.optionsSent = true;
    if (!room.gameState.currentQuestion.options || room.gameState.currentQuestion.options.length === 0) {
        ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'Error obteniendo opciones QSM.' } }));
        room.gameState.optionsSent = false;
        return;
    }
    safeSend(ws, { type: 'optionsProvided', payload: { options: room.gameState.currentQuestion.options } });
}

function handleRequestFiftyFiftyQSM(ws, clientData) {
    const roomId = clientData.roomId;
    const room = rooms[roomId];
    if (!room || !room.gameState || !room.gameState.gameActive || room.gameState.gameType !== 'quiensabemas' || clientData.id !== room.gameState.currentTurn || !room.gameState.currentQuestion || !room.gameState.currentQuestion.options || room.gameState.currentQuestion.options.length < 4 /*|| !room.gameState.optionsSent*/ || room.gameState.fiftyFiftyUsed) {
        // Ya no se chequea optionsSent porque las opciones vienen con la pregunta
        ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'No se puede usar 50/50 QSM ahora.' } }));
        return;
    }

    room.gameState.fiftyFiftyUsed = true;
    const correctIndex = room.gameState.currentQuestion.correctIndex;
    const optionsCount = room.gameState.currentQuestion.options.length;
    let indicesToRemove = [];
    const allIndices = Array.from({ length: optionsCount }, (_, i) => i);
    const incorrectIndices = allIndices.filter(index => index !== correctIndex);
    for (let i = incorrectIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [incorrectIndices[i], incorrectIndices[j]] = [incorrectIndices[j], incorrectIndices[i]];
    }
    indicesToRemove = incorrectIndices.slice(0, 2); // Tomar 2 incorrectas para remover

    if (indicesToRemove.length === 2) {
        safeSend(ws, { type: 'fiftyFiftyApplied', payload: { optionsToRemove: indicesToRemove } });
    } else {
        room.gameState.fiftyFiftyUsed = false; 
        ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'Fallo al aplicar 50/50 QSM.' } }));
    }
}

async function endGameQSM(room, reason = "Juego QSM finalizado") { // Debe ser async por Firebase
    if (!room || !room.gameState || !room.gameState.gameActive) {
        return;
    }
    console.log(`[QSM] Terminando juego en sala ${room.id}. Razón: ${reason}`);
    room.gameState.gameActive = false;

    let winnerId = null;
    let draw = false;
    const p1Data = room.players[0];
    const p2Data = room.players[1];
    const scores = room.gameState.scores;

    if (p1Data && p2Data) {
        if (scores[p1Data.id] > scores[p2Data.id]) winnerId = p1Data.id;
        else if (scores[p2Data.id] > scores[p1Data.id]) winnerId = p2Data.id;
        else draw = true;
    } else if (p1Data && !p2Data) {
        winnerId = p1Data.id;
        reason = reason || `${p1Data.name} gana! Oponente desconectado.`;
    } else if (!p1Data && p2Data) {
        winnerId = p2Data.id;
        reason = reason || `${p2Data.name} gana! Oponente desconectado.`;
    } else {
        console.warn(`[QSM endGame] sala ${room.id} sin jugadores.`);
    }

    const finalPayload = {
        gameType: 'quiensabemas',
        finalScores: scores,
        winnerId: winnerId,
        draw: draw,
        reason: reason,
        players: room.players.map(p => ({ id: p.id, name: p.name, finalScore: scores[p.id] || 0 }))
    };
    broadcastToRoom(room.id, { type: 'gameOver', payload: finalPayload });

    // --- GUARDAR RESULTADOS EN FIREBASE (Quien Sabe Mas) ---
    try {
        const db = admin.firestore(); 
        const batch = db.batch();

        const matchDocRef = db.collection('matches').doc();
        const matchData = {
            gameType: "quiensabemas",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            reason: reason,
            roomId: room.id,
            players: room.players.map(p => ({
                playerId: p.id,
                displayName: p.name,
                score: scores[p.id] || 0,
                isWinner: p.id === winnerId && !draw,
                isDraw: draw
            }))
        };
        batch.set(matchDocRef, matchData);

        for (const player of room.players) {
            const userDocRef = db.collection('users').doc(player.id);
            const userStatsUpdate = {
                displayName: player.name,
                lastPlayed: admin.firestore.FieldValue.serverTimestamp(),
                [`stats.quiensabemas.played`]: admin.firestore.FieldValue.increment(1),
                [`stats.quiensabemas.totalScore`]: admin.firestore.FieldValue.increment(scores[player.id] || 0),
            };
            if (player.id === winnerId && !draw) {
                userStatsUpdate[`stats.quiensabemas.wins`] = admin.firestore.FieldValue.increment(1);
            } else if (draw) {
                userStatsUpdate[`stats.quiensabemas.draws`] = admin.firestore.FieldValue.increment(1);
            } else if (winnerId && ( (p1Data && p1Data.id === player.id && p2Data) || (p2Data && p2Data.id === player.id && p1Data) ) ) {
                 // Solo contar derrota si hubo un oponente y no fue empate ni victoria
                userStatsUpdate[`stats.quiensabemas.losses`] = admin.firestore.FieldValue.increment(1);
            }
            batch.set(userDocRef, userStatsUpdate, { merge: true });
        }
        await batch.commit();
        console.log(`[Firebase QSM] Resultados para sala ${room.id} guardados.`);
    } catch (error) {
        console.error(`[Firebase QSM] ERROR guardando resultados para sala ${room.id}:`, error);
    }
    // --- FIN GUARDAR RESULTADOS ---
}


function handleClientMessage(ws, message) {
    const clientData = clients.get(ws);
    if (!clientData) {
        console.error("Mensaje de cliente no registrado.");
        return;
    }

    const { type, payload } = message;
    const safePayload = payload || {};
    const roomId = clientData.roomId;
    const room = roomId ? rooms[roomId] : null;
    
    console.log(`[DEBUG] Mensaje de ${clientData.id} (${clientData.name || 'Sin nombre'}), Sala: ${roomId || 'N/A'}, Tipo: ${type}`, safePayload);

    switch (type) {
        case 'createRoom':
            handleCreateRoom(ws, safePayload);
            break;
        case 'joinRoom':
            handleJoinRoom(ws, safePayload);
            break;
        case 'joinRandomRoom':
            handleJoinRandomRoom(ws, safePayload); // Necesitará adaptación para gameType
            break;
        case 'leaveRoom':
            handleLeaveRoom(ws);
            break;

        // Lógica específica del juego basada en room.gameType
        case 'mentirosoSubmitBid':
            if (room && room.gameType === 'mentiroso') handleMentirosoSubmitBid(ws, safePayload);
            else ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'Acción no válida para esta sala/juego.' } }));
            break;
        case 'mentirosoCallLiar':
            if (room && room.gameType === 'mentiroso') handleMentirosoCallLiar(ws, safePayload);
            else ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'Acción no válida para esta sala/juego.' } }));
            break;
        case 'mentirosoSubmitAnswers':
            if (room && room.gameType === 'mentiroso') handleMentirosoSubmitAnswers(ws, safePayload);
            else ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'Acción no válida para esta sala/juego.' } }));
            break;
        case 'mentirosoSubmitValidation':
            if (room && room.gameType === 'mentiroso') handleMentirosoSubmitValidation(ws, safePayload);
            else ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'Acción no válida para esta sala/juego.' } }));
            break;

        // --- ACCIONES PARA QUIEN SABE MAS ---
        case 'submitAnswer': // Nombre genérico, usado por QSM
            if (room && room.gameType === 'quiensabemas') {
                handleSubmitAnswerQSM(ws, clientData, safePayload);
            } else if (room) { // Si está en sala pero no es QSM, podría ser un error o para otro juego
                 ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'submitAnswer no válido para el juego actual de la sala.' } }));
            } else {
                 ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'Debes estar en una sala para enviar una respuesta.' } }));
            }
            break;
        case 'requestOptions': // Usado por QSM (aunque opciones ya van con la pregunta)
            if (room && room.gameType === 'quiensabemas') {
                handleRequestOptionsQSM(ws, clientData);
            } else if (room) {
                ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'requestOptions no válido para el juego actual.' } }));
            }
            break;
        case 'requestFiftyFifty': // Usado por QSM
            if (room && room.gameType === 'quiensabemas') {
                handleRequestFiftyFiftyQSM(ws, clientData);
            } else if (room) {
                ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: 'requestFiftyFifty no válido para el juego actual.' } }));
            }
            break;
        
        default:
            console.log(`Tipo de mensaje desconocido: ${type}`);
            ws.send(JSON.stringify({ type: 'errorMessage', payload: { error: `Tipo de mensaje desconocido: ${type}` } }));
    }
}

// ... (resto del código, incluyendo `broadcastAvailableRooms` y la lógica de Mentiroso)