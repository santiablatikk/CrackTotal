// 100 Futboleros Dicen - Firebase Integration
import { db, isFirebaseAvailable, safeFirestoreOperation } from './firebase-init.js';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    where, 
    orderBy, 
    limit,
    serverTimestamp,
    addDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export class FutbolerosDicenFirebase {
    constructor() {
        this.currentRoomRef = null;
        this.currentPlayerId = null;
        this.listeners = new Map();
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.init();
    }

    async init() {
        if (!isFirebaseAvailable()) {
            console.warn('Firebase no disponible para 100 Futboleros Dicen');
            return false;
        }

        try {
            // Configurar colecciones
            this.roomsCollection = collection(db, 'futbolerosDicen_rooms');
            this.playersCollection = collection(db, 'futbolerosDicen_players');
            this.gameStateCollection = collection(db, 'futbolerosDicen_gameStates');
            
            this.isConnected = true;
            console.log('Firebase integrado correctamente para 100 Futboleros Dicen');
            return true;
        } catch (error) {
            console.error('Error inicializando Firebase para 100 Futboleros Dicen:', error);
            return false;
        }
    }

    // Crear una nueva sala
    async createRoom(hostData) {
        return await safeFirestoreOperation(async () => {
            const roomId = this.generateRoomId();
            const roomData = {
                id: roomId,
                hostId: hostData.playerId,
                hostName: hostData.playerName,
                maxPlayers: hostData.maxPlayers || 4,
                currentPlayers: 1,
                gamePhase: 'waiting',
                isPrivate: !!hostData.password,
                password: hostData.password || null,
                createdAt: serverTimestamp(),
                lastActivity: serverTimestamp(),
                gameConfig: {
                    rounds: 5,
                    timePerTurn: 30,
                    maxStrikes: 3
                },
                players: {
                    [hostData.playerId]: {
                        id: hostData.playerId,
                        name: hostData.playerName,
                        isHost: true,
                        team: 'A',
                        score: 0,
                        isReady: true,
                        joinedAt: serverTimestamp()
                    }
                },
                gameState: {
                    currentRound: 0,
                    currentQuestion: null,
                    currentPlayerIndex: 0,
                    teamAScore: 0,
                    teamBScore: 0,
                    roundScore: 0,
                    strikes: 0,
                    revealedAnswers: [],
                    timer: 30
                }
            };

            const roomRef = doc(this.roomsCollection, roomId);
            await setDoc(roomRef, roomData);
            
            this.currentRoomRef = roomRef;
            this.currentPlayerId = hostData.playerId;
            
            console.log('Sala creada exitosamente:', roomId);
            return { roomId, roomData };
        });
    }

    // Unirse a una sala existente
    async joinRoom(roomId, playerData, password = null) {
        return await safeFirestoreOperation(async () => {
            const roomRef = doc(this.roomsCollection, roomId);
            const roomSnap = await getDoc(roomRef);
            
            if (!roomSnap.exists()) {
                throw new Error('Sala no encontrada');
            }
            
            const roomData = roomSnap.data();
            
            // Verificar contraseña si es necesaria
            if (roomData.isPrivate && roomData.password !== password) {
                throw new Error('Contraseña incorrecta');
            }
            
            // Verificar capacidad
            if (roomData.currentPlayers >= roomData.maxPlayers) {
                throw new Error('Sala llena');
            }
            
            // Asignar equipo alternadamente
            const team = roomData.currentPlayers % 2 === 0 ? 'A' : 'B';
            
            const updatedPlayers = {
                ...roomData.players,
                [playerData.playerId]: {
                    id: playerData.playerId,
                    name: playerData.playerName,
                    isHost: false,
                    team: team,
                    score: 0,
                    isReady: false,
                    joinedAt: serverTimestamp()
                }
            };
            
            await updateDoc(roomRef, {
                players: updatedPlayers,
                currentPlayers: roomData.currentPlayers + 1,
                lastActivity: serverTimestamp()
            });
            
            this.currentRoomRef = roomRef;
            this.currentPlayerId = playerData.playerId;
            
            console.log('Unido a la sala exitosamente:', roomId);
            return { roomId, roomData: { ...roomData, players: updatedPlayers } };
        });
    }

    // Buscar salas disponibles
    async getAvailableRooms() {
        return await safeFirestoreOperation(async () => {
            const q = query(
                this.roomsCollection,
                where('gamePhase', '==', 'waiting'),
                where('isPrivate', '==', false),
                orderBy('createdAt', 'desc'),
                limit(10)
            );
            
            const querySnapshot = await getDocs(q);
            const rooms = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.currentPlayers < data.maxPlayers) {
                    rooms.push({
                        id: doc.id,
                        hostName: data.hostName,
                        currentPlayers: data.currentPlayers,
                        maxPlayers: data.maxPlayers,
                        createdAt: data.createdAt
                    });
                }
            });
            
            return rooms;
        }) || [];
    }

    // Escuchar cambios en la sala
    listenToRoom(roomId, callback) {
        if (!this.isConnected) return null;
        
        const roomRef = doc(this.roomsCollection, roomId);
        const unsubscribe = onSnapshot(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data());
            } else {
                callback(null); // Sala eliminada
            }
        }, (error) => {
            console.error('Error escuchando cambios en la sala:', error);
            callback(null);
        });
        
        this.listeners.set(`room_${roomId}`, unsubscribe);
        return unsubscribe;
    }

    // Actualizar estado del jugador
    async updatePlayerStatus(roomId, playerId, status) {
        return await safeFirestoreOperation(async () => {
            const roomRef = doc(this.roomsCollection, roomId);
            await updateDoc(roomRef, {
                [`players.${playerId}.isReady`]: status,
                lastActivity: serverTimestamp()
            });
        });
    }

    // Iniciar el juego
    async startGame(roomId, gameData) {
        return await safeFirestoreOperation(async () => {
            const roomRef = doc(this.roomsCollection, roomId);
            await updateDoc(roomRef, {
                gamePhase: 'playing',
                gameState: {
                    ...gameData,
                    startedAt: serverTimestamp()
                },
                lastActivity: serverTimestamp()
            });
        });
    }

    // Enviar respuesta del jugador
    async submitAnswer(roomId, playerId, answer) {
        return await safeFirestoreOperation(async () => {
            const roomRef = doc(this.roomsCollection, roomId);
            const roomSnap = await getDoc(roomRef);
            
            if (!roomSnap.exists()) return false;
            
            const roomData = roomSnap.data();
            const gameState = roomData.gameState;
            
            // Procesar respuesta y actualizar estado
            await updateDoc(roomRef, {
                [`gameState.lastAnswer`]: {
                    playerId,
                    answer,
                    timestamp: serverTimestamp()
                },
                lastActivity: serverTimestamp()
            });
            
            return true;
        });
    }

    // Actualizar estado del juego
    async updateGameState(roomId, newState) {
        return await safeFirestoreOperation(async () => {
            const roomRef = doc(this.roomsCollection, roomId);
            await updateDoc(roomRef, {
                gameState: newState,
                lastActivity: serverTimestamp()
            });
        });
    }

    // Finalizar juego
    async endGame(roomId, results) {
        return await safeFirestoreOperation(async () => {
            const roomRef = doc(this.roomsCollection, roomId);
            await updateDoc(roomRef, {
                gamePhase: 'finished',
                results: {
                    ...results,
                    finishedAt: serverTimestamp()
                },
                lastActivity: serverTimestamp()
            });
        });
    }

    // Salir de la sala
    async leaveRoom(roomId, playerId) {
        return await safeFirestoreOperation(async () => {
            const roomRef = doc(this.roomsCollection, roomId);
            const roomSnap = await getDoc(roomRef);
            
            if (!roomSnap.exists()) return;
            
            const roomData = roomSnap.data();
            const updatedPlayers = { ...roomData.players };
            delete updatedPlayers[playerId];
            
            const newPlayerCount = Object.keys(updatedPlayers).length;
            
            if (newPlayerCount === 0) {
                // Eliminar sala si no quedan jugadores
                await deleteDoc(roomRef);
            } else {
                // Asignar nuevo host si es necesario
                if (roomData.players[playerId]?.isHost) {
                    const newHostId = Object.keys(updatedPlayers)[0];
                    updatedPlayers[newHostId].isHost = true;
                    
                    await updateDoc(roomRef, {
                        hostId: newHostId,
                        hostName: updatedPlayers[newHostId].name,
                        players: updatedPlayers,
                        currentPlayers: newPlayerCount,
                        lastActivity: serverTimestamp()
                    });
                } else {
                    await updateDoc(roomRef, {
                        players: updatedPlayers,
                        currentPlayers: newPlayerCount,
                        lastActivity: serverTimestamp()
                    });
                }
            }
            
            this.currentRoomRef = null;
            this.currentPlayerId = null;
        });
    }

    // Limpiar listeners
    cleanup() {
        this.listeners.forEach((unsubscribe, key) => {
            unsubscribe();
        });
        this.listeners.clear();
        this.currentRoomRef = null;
        this.currentPlayerId = null;
    }

    // Generar ID único para sala
    generateRoomId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    // Generar ID único para jugador
    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 12) + Date.now();
    }

    // Verificar si está conectado
    isReady() {
        return this.isConnected && isFirebaseAvailable();
    }
} 