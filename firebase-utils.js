import { db } from './firebase-init.js';
import { 
    doc, 
    setDoc, 
    updateDoc, 
    increment, 
    collection, 
    addDoc, 
    serverTimestamp,
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Obtener ID del usuario (anónimo pero persistente)
export async function getUserId() {
    // Usar un ID anónimo persistente en localStorage
    let anonymousId = localStorage.getItem('anonymousUserId');
    if (!anonymousId) {
        anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('anonymousUserId', anonymousId);
    }
    return anonymousId;
}

// Obtener nombre del usuario actual desde localStorage
export function getUserDisplayName() {
    return localStorage.getItem('playerName') || 'Jugador';
}

// Crear o actualizar perfil de usuario
export async function ensureUserProfile() {
    const userId = await getUserId();
    const displayName = getUserDisplayName();
    
    try {
        // Comprobar si el usuario ya existe
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            // Crear nuevo perfil de usuario con estadísticas a cero
            await setDoc(userRef, {
                uid: userId,
                displayName: displayName,
                createdAt: serverTimestamp(),
                stats: {
                    pasalache: {
                        played: 0,
                        wins: 0,
                        score: 0,
                        correctAnswers: 0,
                        incorrectAnswers: 0
                    },
                    quiensabemas: {
                        played: 0,
                        wins: 0,
                        score: 0
                    },
                    mentiroso: {
                        played: 0,
                        wins: 0,
                        score: 0
                    }
                }
            });
            console.log("Perfil de usuario creado con éxito");
        } else {
            // Actualizar nombre si ha cambiado
            const userData = userSnap.data();
            if (userData.displayName !== displayName) {
                await updateDoc(userRef, {
                    displayName: displayName
                });
            }
        }
        
        return userId;
    } catch (error) {
        console.error("Error al crear/actualizar perfil de usuario:", error);
        return userId; // Devolvemos el ID aunque haya error
    }
}

// Guardar resultados de Pasala Che
export async function savePasalacheResult(gameStats) {
    try {
        // Primero aseguramos que el perfil del usuario existe
        await ensureUserProfile();
        const userId = await getUserId();
        const displayName = getUserDisplayName();
        
        // 1. Guardar la partida en matches
        await addDoc(collection(db, "matches"), {
            gameType: "pasalache",
            playerName: displayName,
            playerUid: userId,
            timestamp: serverTimestamp(),
            result: gameStats.result, // "victory", "defeat", "timeout"
            score: gameStats.score,
            difficulty: gameStats.difficulty || "normal",
            timeSpent: gameStats.timeSpent || 0,
            passes: gameStats.passes || 0,
            players: [
                {
                    displayName: displayName,
                    playerId: userId,
                    score: gameStats.score,
                    errors: gameStats.incorrectAnswers || 0
                }
            ]
        });
        
        // 2. Actualizar estadísticas del usuario
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            "stats.pasalache.played": increment(1),
            "stats.pasalache.score": increment(gameStats.score),
            "stats.pasalache.correctAnswers": increment(gameStats.correctAnswers || 0),
            "stats.pasalache.incorrectAnswers": increment(gameStats.incorrectAnswers || 0)
        });
        
        // Si ganó, incrementar contador de victorias
        if (gameStats.result === "victory") {
            await updateDoc(userRef, {
                "stats.pasalache.wins": increment(1)
            });
        }
        
        console.log("Datos de Pasala Che guardados correctamente");
        return true;
    } catch (error) {
        console.error("Error al guardar datos de Pasala Che:", error);
        return false;
    }
}

// Guardar resultados de Quién Sabe Más 1v1
export async function saveQuienSabeMasResult(gameStats) {
    try {
        await ensureUserProfile();
        const userId = await getUserId();
        const displayName = getUserDisplayName();
        
        // Preparar datos de la partida
        const matchData = {
            gameType: "quiensabemas",
            playerName: displayName,
            playerUid: userId,
            timestamp: serverTimestamp(),
            result: gameStats.result, // "victory", "defeat", "timeout"
            score: gameStats.myScore || 0,
            players: [
                {
                    displayName: displayName,
                    playerId: userId,
                    score: gameStats.myScore || 0
                }
            ]
        };
        
        // Añadir datos del oponente si están disponibles
        if (gameStats.opponentName) {
            matchData.players.push({
                displayName: gameStats.opponentName,
                playerId: gameStats.opponentId || "unknown",
                score: gameStats.opponentScore || 0
            });
        }
        
        // 1. Guardar partida en la colección matches
        await addDoc(collection(db, "matches"), matchData);
        
        // 2. Actualizar estadísticas del usuario
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            "stats.quiensabemas.played": increment(1),
            "stats.quiensabemas.score": increment(gameStats.myScore || 0)
        });
        
        // Si ganó, incrementar contador de victorias
        if (gameStats.result === "victory") {
            await updateDoc(userRef, {
                "stats.quiensabemas.wins": increment(1)
            });
        }
        
        console.log("Datos de Quién Sabe Más guardados correctamente");
        return true;
    } catch (error) {
        console.error("Error al guardar datos de Quién Sabe Más:", error);
        return false;
    }
}

// Guardar resultados de El Mentiroso
export async function saveMentirosoResult(gameStats) {
    try {
        await ensureUserProfile();
        const userId = await getUserId();
        const displayName = getUserDisplayName();
        
        // Preparar datos de la partida
        const matchData = {
            gameType: "mentiroso",
            playerName: displayName,
            playerUid: userId,
            timestamp: serverTimestamp(),
            result: gameStats.result, // "victory", "defeat", "timeout"
            score: gameStats.myScore || 0,
            players: [
                {
                    displayName: displayName,
                    playerId: userId,
                    score: gameStats.myScore || 0
                }
            ]
        };
        
        // Añadir datos de oponentes si están disponibles
        if (gameStats.opponents && Array.isArray(gameStats.opponents)) {
            gameStats.opponents.forEach(opponent => {
                matchData.players.push({
                    displayName: opponent.name || "Oponente",
                    playerId: opponent.id || "unknown",
                    score: opponent.score || 0
                });
            });
        }
        
        // 1. Guardar partida en la colección matches
        await addDoc(collection(db, "matches"), matchData);
        
        // 2. Actualizar estadísticas del usuario
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            "stats.mentiroso.played": increment(1),
            "stats.mentiroso.score": increment(gameStats.myScore || 0)
        });
        
        // Si ganó, incrementar contador de victorias
        if (gameStats.result === "victory") {
            await updateDoc(userRef, {
                "stats.mentiroso.wins": increment(1)
            });
        }
        
        console.log("Datos de El Mentiroso guardados correctamente");
        return true;
    } catch (error) {
        console.error("Error al guardar datos de El Mentiroso:", error);
        return false;
    }
}
