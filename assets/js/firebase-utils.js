/**
 * Firebase Utils - Compatible con Firebase compat v9.6.10
 * Sin imports ES6, usa window.firebase global
 */

console.log('[FIREBASE UTILS] Cargando utilidades de Firebase...');

// Función para obtener ID de usuario anónimo
function getUserId() {
    let anonymousId = localStorage.getItem('anonymousUserId');
    if (!anonymousId) {
        anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('anonymousUserId', anonymousId);
        console.log('[getUserId] Nuevo ID anónimo creado:', anonymousId);
    }
    return anonymousId;
}

// Función para obtener nombre de usuario
function getUserDisplayName() {
    const name = localStorage.getItem('playerName') || 'Jugador Anónimo';
    return name;
}

// Función para asegurar que existe el perfil de usuario
async function ensureUserProfile(userIdToEnsure, displayNameToEnsure) {
    console.log(`[ensureUserProfile] Verificando usuario: ${userIdToEnsure}, nombre: ${displayNameToEnsure}`);

    if (!window.db) {
        console.error("[ensureUserProfile] Firebase no está inicializado");
        return userIdToEnsure;
    }

    if (!userIdToEnsure) {
        console.error("[ensureUserProfile] ID de usuario no proporcionado");
        return null;
    }

    try {
        const userRef = window.db.collection('users').doc(userIdToEnsure);
        const userSnap = await userRef.get();
        
        const defaultStats = {
            pasalache: { played: 0, wins: 0, score: 0, correctAnswers: 0, incorrectAnswers: 0 },
            quiensabemas: { played: 0, wins: 0, score: 0 },
            mentiroso: { played: 0, wins: 0, score: 0 },
            crackrapido: { played: 0, wins: 0, score: 0, correctAnswers: 0, bestStreak: 0 }
        };

        if (!userSnap.exists) {
            console.log(`[ensureUserProfile] Creando usuario ${userIdToEnsure}...`);
            await userRef.set({
                uid: userIdToEnsure,
                displayName: displayNameToEnsure || 'Jugador Anónimo',
                createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                stats: defaultStats
            });
            console.log(`[ensureUserProfile] Usuario ${userIdToEnsure} creado exitosamente`);
        } else {
            console.log(`[ensureUserProfile] Usuario ${userIdToEnsure} ya existe`);
            const userData = userSnap.data();
            let updates = {};

            if (displayNameToEnsure && userData.displayName !== displayNameToEnsure) {
                updates.displayName = displayNameToEnsure;
            }

            // Asegurar estructura de stats
            let currentStats = userData.stats || {};
            let statsNeedUpdate = !userData.stats;

            for (const game in defaultStats) {
                if (!currentStats[game]) {
                    currentStats[game] = defaultStats[game];
                    statsNeedUpdate = true;
                }
            }

            if (statsNeedUpdate) {
                updates.stats = currentStats;
            }

            if (Object.keys(updates).length > 0) {
                await userRef.update(updates);
                console.log(`[ensureUserProfile] Usuario ${userIdToEnsure} actualizado`);
            }
        }
        return userIdToEnsure;
    } catch (error) {
        console.error(`[ensureUserProfile] Error para usuario ${userIdToEnsure}:`, error);
        return userIdToEnsure;
    }
}

// Función para guardar resultado de Pasala Che
async function savePasalacheResult(gameStats) {
    console.log('[savePasalacheResult] Guardando resultado:', gameStats);
    
    if (!window.db) {
        console.error("[savePasalacheResult] Firebase no está inicializado");
        return false;
    }

    try {
        const userId = await ensureUserProfile();
        const displayName = getUserDisplayName();

        // Guardar partido
        const matchDoc = {
            gameType: "pasalache",
            playerName: displayName,
            playerUid: userId,
            timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
            result: gameStats.result,
            score: gameStats.score,
            difficulty: gameStats.difficulty || "normal",
            timeSpent: gameStats.timeSpent || 0,
            passes: gameStats.passes || 0,
            players: [{
                displayName: displayName,
                playerId: userId,
                score: gameStats.score,
                errors: gameStats.incorrectAnswers || 0
            }]
        };

        await window.db.collection('matches').add(matchDoc);
        console.log('[savePasalacheResult] Partido guardado');

        // Actualizar estadísticas del usuario
        const userRef = window.db.collection('users').doc(userId);
        const userUpdates = {
            "stats.pasalache.played": window.firebase.firestore.FieldValue.increment(1),
            "stats.pasalache.score": window.firebase.firestore.FieldValue.increment(gameStats.score || 0),
            "stats.pasalache.correctAnswers": window.firebase.firestore.FieldValue.increment(gameStats.correctAnswers || 0),
            "stats.pasalache.incorrectAnswers": window.firebase.firestore.FieldValue.increment(gameStats.incorrectAnswers || 0)
        };

        if (gameStats.result === "victory") {
            userUpdates["stats.pasalache.wins"] = window.firebase.firestore.FieldValue.increment(1);
        }

        await userRef.update(userUpdates);
        console.log('[savePasalacheResult] Estadísticas actualizadas');

        return true;
    } catch (error) {
        console.error("[savePasalacheResult] Error guardando datos:", error);
        return false;
    }
}

// Función para guardar resultado de Crack Rápido
async function saveCrackRapidoResult(gameStats) {
    console.log('[saveCrackRapidoResult] Guardando resultado:', gameStats);
    
    if (!window.db) {
        console.error("[saveCrackRapidoResult] Firebase no está inicializado");
        return false;
    }

    try {
        const userId = await ensureUserProfile();
        const displayName = getUserDisplayName();

        // Guardar partido
        const matchDoc = {
            gameType: "crackrapido",
            playerName: displayName,
            playerUid: userId,
            timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
            result: gameStats.result,
            score: gameStats.score,
            level: gameStats.level || 1,
            timeSpent: gameStats.timeSpent || 0,
            correctAnswers: gameStats.correctAnswers || 0,
            totalQuestions: gameStats.totalQuestions || 0,
            accuracy: gameStats.accuracy || 0
        };

        await window.db.collection('matches').add(matchDoc);
        console.log('[saveCrackRapidoResult] Partido guardado');

        // Actualizar estadísticas del usuario
        const userRef = window.db.collection('users').doc(userId);
        const userUpdates = {
            "stats.crackrapido.played": window.firebase.firestore.FieldValue.increment(1),
            "stats.crackrapido.score": window.firebase.firestore.FieldValue.increment(gameStats.score || 0),
            "stats.crackrapido.correctAnswers": window.firebase.firestore.FieldValue.increment(gameStats.correctAnswers || 0)
        };

        if (gameStats.result === "victory") {
            userUpdates["stats.crackrapido.wins"] = window.firebase.firestore.FieldValue.increment(1);
        }

        if (gameStats.bestStreak) {
            userUpdates["stats.crackrapido.bestStreak"] = gameStats.bestStreak;
        }

        await userRef.update(userUpdates);
        console.log('[saveCrackRapidoResult] Estadísticas actualizadas');

        return true;
    } catch (error) {
        console.error("[saveCrackRapidoResult] Error guardando datos:", error);
        return false;
    }
}

// Función para guardar resultado de Quién Sabe Más
async function saveQSMResult(gameStats) {
    console.log('[saveQSMResult] Guardando resultado:', gameStats);
    
    if (!window.db) {
        console.error("[saveQSMResult] Firebase no está inicializado");
        return false;
    }

    try {
        const userId = await ensureUserProfile();
        const displayName = getUserDisplayName();

        // Guardar partido
        const matchDoc = {
            gameType: "quiensabemas",
            playerName: displayName,
            playerUid: userId,
            timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
            result: gameStats.result,
            score: gameStats.score,
            correctAnswers: gameStats.correctAnswers || 0,
            totalQuestions: gameStats.totalQuestions || 0,
            timeSpent: gameStats.timeSpent || 0
        };

        await window.db.collection('matches').add(matchDoc);
        console.log('[saveQSMResult] Partido guardado');

        // Actualizar estadísticas del usuario
        const userRef = window.db.collection('users').doc(userId);
        const userUpdates = {
            "stats.quiensabemas.played": window.firebase.firestore.FieldValue.increment(1),
            "stats.quiensabemas.score": window.firebase.firestore.FieldValue.increment(gameStats.score || 0)
        };

        if (gameStats.result === "victory") {
            userUpdates["stats.quiensabemas.wins"] = window.firebase.firestore.FieldValue.increment(1);
        }

        await userRef.update(userUpdates);
        console.log('[saveQSMResult] Estadísticas actualizadas');

        return true;
    } catch (error) {
        console.error("[saveQSMResult] Error guardando datos:", error);
        return false;
    }
}

// Función para guardar resultado de Mentiroso
async function saveMentirosoResult(gameStats) {
    console.log('[saveMentirosoResult] Guardando resultado:', gameStats);
    
    if (!window.db) {
        console.error("[saveMentirosoResult] Firebase no está inicializado");
        return false;
    }

    try {
        const userId = await ensureUserProfile();
        const displayName = getUserDisplayName();

        // Guardar partido
        const matchDoc = {
            gameType: "mentiroso",
            playerName: displayName,
            playerUid: userId,
            timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
            result: gameStats.result,
            score: gameStats.score,
            correctGuesses: gameStats.correctGuesses || 0,
            totalRounds: gameStats.totalRounds || 0,
            timeSpent: gameStats.timeSpent || 0
        };

        await window.db.collection('matches').add(matchDoc);
        console.log('[saveMentirosoResult] Partido guardado');

        // Actualizar estadísticas del usuario
        const userRef = window.db.collection('users').doc(userId);
        const userUpdates = {
            "stats.mentiroso.played": window.firebase.firestore.FieldValue.increment(1),
            "stats.mentiroso.score": window.firebase.firestore.FieldValue.increment(gameStats.score || 0)
        };

        if (gameStats.result === "victory") {
            userUpdates["stats.mentiroso.wins"] = window.firebase.firestore.FieldValue.increment(1);
        }

        await userRef.update(userUpdates);
        console.log('[saveMentirosoResult] Estadísticas actualizadas');

        return true;
    } catch (error) {
        console.error("[saveMentirosoResult] Error guardando datos:", error);
        return false;
    }
}

// Exportar funciones al objeto global para compatibilidad
window.FirebaseUtilsCompat = {
    getUserId: getUserId,
    getUserDisplayName: getUserDisplayName,
    ensureUserProfile: ensureUserProfile,
    savePasalacheResult: savePasalacheResult,
    saveCrackRapidoResult: saveCrackRapidoResult,
    saveQSMResult: saveQSMResult,
    saveMentirosoResult: saveMentirosoResult
};

console.log('[FIREBASE UTILS] ✅ Utilidades cargadas y disponibles globalmente');
