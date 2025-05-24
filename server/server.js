const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

// Estructuras de datos para manejar el estado del juego
const rooms = {}; // Almacenará las salas de juego activas
const clients = new Map(); // Almacenará la información de los clientes conectados (ws -> {id, roomId, etc.})

console.log(`Servidor WebSocket iniciado en el puerto ${PORT}`);

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
    if (!clientData) return; // Si no hay clientData, no hay nada que hacer

    // Si el cliente estaba en una sala, manejar la desconexión de la sala
    if (clientData.roomId) {
        const roomId = clientData.roomId;
        const room = rooms[roomId];

        if (room) {
            console.log(`Cliente ${clientData.id} desconectado de la sala ${roomId}`);
            // Eliminar al jugador de la sala
            room.players = room.players.filter(player => player.id !== clientData.id);
            // Actualizar clientData para reflejar que ya no está en una sala
            clientData.roomId = null;

            // Si la sala queda vacía, eliminarla
            if (room.players.length === 0) {
                console.log(`Sala ${roomId} vacía, eliminándola.`);
                delete rooms[roomId];
            } else {
                // Notificar al otro jugador (si queda alguno)
                const otherPlayer = room.players[0]; // Asumimos que solo queda uno en un juego 1v1
                if (otherPlayer && otherPlayer.ws && otherPlayer.ws.readyState === WebSocket.OPEN) {
                    otherPlayer.ws.send(JSON.stringify({
                        type: 'playerDisconnect',
                        payload: { 
                            disconnectedPlayerId: clientData.id,
                            disconnectedPlayerName: clientData.name || 'Un jugador',
                            message: `${clientData.name || 'Un jugador'} se ha desconectado.`
                        }
                    }));
                    // Aquí podrías agregar lógica para terminar el juego si está activo
                    if (room.gameState && room.gameState.gameActive) {
                         // Lógica para manejar el fin del juego por desconexión
                         // Por ejemplo, declarar al jugador restante como ganador
                         console.log(`Juego en sala ${roomId} terminado debido a desconexión.`);
                         // Esto se detallará más al implementar la lógica del juego
                    }
                }
            }
            // Actualizar la lista de salas disponibles para todos los clientes en el lobby
            broadcastAvailableRooms(); 
        }
    }
    clients.delete(ws); // Eliminar al cliente del mapa global de clientes
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
    const gameType = payload.gameType || 'mentiroso'; // Default a mentiroso

    rooms[roomId] = {
        id: roomId,
        creatorId: clientData.id,
        creatorName: playerName,
        players: [{ id: clientData.id, name: playerName, ws: ws, score: 0 }],
        gameType: gameType,
        password: payload.password || null,
        isPrivate: !!payload.password,
        maxPlayers: 2, // Para Mentiroso 1v1
        gameState: null // Se inicializará cuando comience el juego
    };

    clientData.roomId = roomId;
    clientData.name = playerName;

    ws.send(JSON.stringify({
        type: 'roomCreated',
        payload: {
            roomId: roomId,
            players: rooms[roomId].players.map(p => ({ id: p.id, name: p.name, score: p.score })),
            // Podrías enviar más info de la sala aquí si es necesario
        }
    }));
    console.log(`Sala ${roomId} (${gameType}) creada por ${playerName} (${clientData.id}). Contraseña: ${payload.password ? 'Sí' : 'No'}`);
    broadcastAvailableRooms(); // Actualizar lista para otros
}

function handleJoinRoom(ws, payload) {
    const clientData = clients.get(ws);
    if (clientData.roomId) {
        ws.send(JSON.stringify({ type: 'joinError', payload: { error: 'Ya estás en una sala.' } }));
        return;
    }

    const { roomId, playerName, password, gameType } = payload;
    const room = rooms[roomId];

    if (!room) {
        ws.send(JSON.stringify({ type: 'joinError', payload: { error: 'La sala no existe.', failedRoomId: roomId } }));
        return;
    }

    if (room.gameType !== gameType && gameType) { // gameType es opcional, pero si se provee, debe coincidir
         ws.send(JSON.stringify({ type: 'joinError', payload: { error: `Esta sala es para ${room.gameType}, no para ${gameType}.`, failedRoomId: roomId } }));
        return;
    }

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

    console.log(`[DEBUG] Jugador ${clientData.id} (${pName}) se unió a sala ${roomId}. Total jugadores: ${room.players.length}`);
    console.log(`[DEBUG] Lista de jugadores: ${JSON.stringify(room.players.map(p => ({ id: p.id, name: p.name })))}`);

    const playerInfoForClient = room.players.map(p => ({ id: p.id, name: p.name, score: p.score }));

    ws.send(JSON.stringify({
        type: 'joinSuccess',
        payload: {
            roomId: roomId,
            players: playerInfoForClient,
        }
    }));

    // Notificar al otro jugador en la sala
    room.players.forEach(player => {
        if (player.ws && player.ws !== ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify({
                type: 'playerJoined',
                payload: {
                    roomId: roomId,
                    newPlayer: { id: newPlayer.id, name: newPlayer.name, score: newPlayer.score },
                    players: playerInfoForClient // Enviar la lista actualizada de jugadores
                }
            }));
        }
    });
    
    console.log(`${pName} (${clientData.id}) se unió a la sala ${roomId}.`);

    // Si la sala está llena (ej. 2 jugadores para 1v1), iniciar el juego Mentiroso
    if (room.players.length === room.maxPlayers && room.gameType === 'mentiroso') {
        // Esperar un poco para asegurar que ambos clientes han procesado el evento playerJoined
        setTimeout(() => startGameMentiroso(room), 1000);
    }
    broadcastAvailableRooms(); // Actualizar lista para otros
}

function handleJoinRandomRoom(ws, payload) {
    const clientData = clients.get(ws);
    if (clientData.roomId) {
        ws.send(JSON.stringify({ type: 'joinError', payload: { error: 'Ya estás en una sala.' } }));
        return;
    }

    const gameType = payload.gameType || 'mentiroso';
    const availablePublicRooms = Object.values(rooms).filter(
        room => room.gameType === gameType &&
                !room.isPrivate &&
                room.players.length < room.maxPlayers
    );

    if (availablePublicRooms.length === 0) {
        // No hay salas disponibles, podría crear una nueva o enviar mensaje
        // Por ahora, creamos una nueva para este jugador
        console.log(`No hay salas aleatorias de ${gameType} disponibles. Creando una nueva para ${payload.playerName || clientData.id}`);
        handleCreateRoom(ws, { 
            playerName: payload.playerName, 
            password: null, // Pública
            gameType: gameType 
        });
        return;
    }

    // Unirse a la primera sala disponible (se podría añadir lógica más compleja de matchmaking)
    const roomToJoin = availablePublicRooms[0];
    handleJoinRoom(ws, { 
        roomId: roomToJoin.id, 
        playerName: payload.playerName, 
        password: null, // Es pública
        gameType: gameType 
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
        .filter(room => room.players.length < (room.maxPlayers || 2) && room.gameType === 'mentiroso') // Filtrar solo mentiroso por ahora
        .map(room => ({
            id: room.id,
            creatorName: room.creatorName,
            playerCount: room.players.length,
            maxPlayers: room.maxPlayers || 2,
            requiresPassword: !!room.password,
            gameType: room.gameType
        }));    
    
    wss.clients.forEach(wsClient => {
        const clientInfo = clients.get(wsClient); // Obtener clientData usando el ws como clave
        // DEBUG: Mostrar información sobre cada cliente al intentar transmitir
        console.log(`[BroadcastCheck] ClientID: ${clientInfo ? clientInfo.id : 'N/A'}, InRoom: ${clientInfo ? clientInfo.roomId : 'N/A'}`);

        // Enviar solo a los que están en el lobby (no tienen roomId) y WebSocket está abierto
        if (wsClient.readyState === WebSocket.OPEN && clientInfo && !clientInfo.roomId) { 
            try {
                 // DEBUG: Confirmar a quién se está enviando la lista
                console.log(`[BroadcastSend] Sending availableRooms to ClientID: ${clientInfo.id}`);
                wsClient.send(JSON.stringify({ type: 'availableRooms', payload: { rooms: availableRoomsInfo } }));
            } catch (error) {
                console.error("Error enviando lista de salas disponibles:", error);
            }
        }
    });
}

setInterval(broadcastAvailableRooms, 5000); // Llama a la función cada 5 segundos

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
    { template: "¿Puedo nombrar X goleadores históricos del futbol argentino?" },
    { template: "¿Puedo nombrar X futbolistas argentinos que volvieron del exterior al fútbol local?" },
    { template: "¿Puedo nombrar X entrenadores que dirigieron más de 5 equipos argentinos?" },
    { template: "¿Puedo nombrar X jugadores que pasaron por Boca y River?" },
    { template: "¿Puedo nombrar X equipos que jugaron en el Nacional B y luego ascendieron en el ultimo siglo?" },
    { template: "¿Puedo nombrar X futbolistas que jugaron más de 300 partidos en el fútbol argentino?" },
    { template: "¿Puedo nombrar X presidentes de clubes argentinos?" },
    { template: "¿Puedo nombrar X partidos recordados del fútbol argentino?" },
    { template: "¿Puedo nombrar X apodos de equipos argentinos?" },
    { template: "¿Puedo nombrar X jugadores que fueron campeones con más de un club argentino?" },
    { template: "¿Puedo nombrar X árbitros reconocidos del fútbol argentino?" },
    { template: "¿Puedo nombrar X jugadores que se destacaron en torneos cortos?" },
    { template: "¿Puedo nombrar X entrenadores jóvenes del fútbol argentino actual?" },
    { template: "¿Puedo nombrar X ídolos de diferentes clubes argentinos?" },
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
    { template: "¿Puedo nombrar X finales entre argentinos y brasileños en Libertadores?" },
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
    { template: "¿Puedo nombrar X técnicos que dirigieron más de 20 partidos de Libertadores?" }
  ],
  "Mundiales": [
    { template: "¿Puedo nombrar X goleadores históricos de los Mundiales?" },
    { template: "¿Puedo nombrar X jugadores argentinos con al menos 2 mundiales jugados?" },
    { template: "¿Puedo nombrar X países que organizaron un Mundial?" },
    { template: "¿Puedo nombrar X jugadores que jugaron 3 o más mundiales?" },
    { template: "¿Puedo nombrar X jugadores que marcaron goles en finales del Mundial?" },
    { template: "¿Puedo nombrar X arqueros titulares en mundiales?" },
    { template: "¿Puedo nombrar X jugadores expulsados en mundiales?" },
    { template: "¿Puedo nombrar X partidos que terminaron por penales en mundiales?" },
    { template: "¿Puedo nombrar X países que llegaron a semifinales del Mundial?" },
    { template: "¿Puedo nombrar X selecciones africanas que jugaron mundiales?" },
    { template: "¿Puedo nombrar X selecciones asiáticas que participaron en mundiales?" },
    { template: "¿Puedo nombrar X técnicos campeones del mundo?" },
    { template: "¿Puedo nombrar X mundiales donde hubo al menos un jugador expulsado en la final?" },
    { template: "¿Puedo nombrar X jugadores que usaron la 10 en un Mundial?" },
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
    { template: "¿Puedo nombrar X goles en finales de Champions entre 2010 y 2025?" },
    { template: "¿Puedo nombrar X partidos de Champions que terminaron con goleada?" },
    { template: "¿Puedo nombrar X arqueros que hayan sido titulares en finales de Champions?" },
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
    { template: "¿Puedo nombrar X jugadores que jugaron más de 50 partidos con la Selección?" },
    { template: "¿Puedo nombrar X campeones del mundo con Argentina?" },
    { template: "¿Puedo nombrar X jugadores que jugaron más de una Copa América?" },
    { template: "¿Puedo nombrar X partidos de eliminatorias en los que jugó Argentina?" },
    { template: "¿Puedo nombrar X títulos ganados por la Selección Argentina?" },
    { template: "¿Puedo nombrar X mediocampistas históricos de la Selección?" },
    { template: "¿Puedo nombrar X delanteros históricos de la Selección?" },
    { template: "¿Puedo nombrar X defensores que fueron titulares en torneos oficiales?" },
    { template: "¿Puedo nombrar X jugadores que compartieron cancha con Messi en la Selección?" },
    { template: "¿Puedo nombrar X equipos contra los que Argentina jugó más de 5 veces?" },
    { template: "¿Puedo nombrar X amistosos jugados por Argentina en los últimos 10 años?" },
    { template: "¿Puedo nombrar X goles de tiro libre de jugadores argentinos en la Selección?" },
    { template: "¿Puedo nombrar X estadios donde jugó Argentina de local?" },
    { template: "¿Puedo nombrar X jugadores de la Scaloneta?" }
  ],
  "Fútbol General": [
    { template: "¿Puedo nombrar X países con ligas de fútbol profesionales?" },
    { template: "¿Puedo nombrar X jugadores que ganaron el Balón de Oro?" },
    { template: "¿Puedo nombrar X clubes que participaron en el Mundial de Clubes?" },
    { template: "¿Puedo nombrar X entrenadores famosos a nivel mundial?" },
    { template: "¿Puedo nombrar X jugadores históricos del fútbol mundial?" },
    { template: "¿Puedo nombrar X clásicos del fútbol mundial?" },
    { template: "¿Puedo nombrar X jugadores que hayan jugado en 5 o mas ligas distintas?" },
    { template: "¿Puedo nombrar X arqueros históricos del fútbol mundial?" },
    { template: "¿Puedo nombrar X selecciones con al menos un título internacional?" },
    { template: "¿Puedo nombrar X jugadores que hayan jugado en el Real Madrid y el Barcelona?" },    { template: "¿Puedo nombrar X países que han sido sede de competiciones FIFA?" },
    { template: "¿Puedo nombrar X futbolistas que se retiraron en 2020 o después?" },
    { template: "¿Puedo nombrar X jugadores que pasaron de Sudamérica a Europa?" },
    { template: "¿Puedo nombrar X jugadores que fueron capitanes en sus selecciones?" },
    { template: "¿Puedo nombrar X futbolistas que jugaron en equipos árabes?" },
    { template: "¿Puedo nombrar X técnicos que dirigieron selecciones y clubes top?" },
    { template: "¿Puedo nombrar X equipos con más de 100 años de historia?" },
    { template: "¿Puedo nombrar X jugadores que hayan sido campeones olímpicos?" },
    { template: "¿Puedo nombrar X futbolistas que usaron la camiseta número 7 en clubes famosos?" },
    { template: "¿Puedo nombrar X jugadores que ganaron Champions y Libertadores?" },
    { template: "¿Puedo nombrar X ligas donde jugaron más de 10 argentinos?" },
    { template: "¿Puedo nombrar X entrenadores que ganaron títulos en 3 países distintos?" },
    { template: "¿Puedo nombrar X jugadores que fueron figura en mundiales juveniles?" },
    { template: "¿Puedo nombrar X futbolistas africanos destacados de las últimas décadas?" },
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

function endGameMentiroso(room, reason = "Juego finalizado") {
    if (!room || !room.gameState || !room.gameState.gameActive) return; // Prevenir múltiples finales
    
    console.log(`Juego Mentiroso terminado en sala ${room.id}. Razón: ${reason}`);
    room.gameState.gameActive = false;

    // Determinar ganador
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
        winnerId = playerIds[0]; // Si solo queda uno, es el ganador por defecto
    }
    // Si no hay jugadores, no hay ganador (esto no debería pasar si el juego empezó)

    const finalPayload = {
        gameType: 'mentiroso',
        reason: reason,
        finalScores: scores,
        winnerId: winnerId,
        draw: draw,
        players: room.players.map(p => ({ id: p.id, name: p.name, finalScore: scores[p.id] || 0 }))
    };

    broadcastToRoom(room.id, { type: 'gameOver', payload: finalPayload });

    // Opcional: Limpiar la sala o marcarla como "post-juego" para que puedan jugar de nuevo o irse
    // Por ahora, la sala persiste hasta que los jugadores se van y queda vacía.
    // Podrías resetear el gameState de la sala aquí si quieres permitir revanchas inmediatas sin volver al lobby
    // room.gameState = null;
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