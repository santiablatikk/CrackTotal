// import { db } from './firebase-init.js'; // db will be passed as a parameter to relevant functions
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

export async function getUserId() {
    let anonymousId = localStorage.getItem('anonymousUserId');
    if (!anonymousId) {
        anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('anonymousUserId', anonymousId);
        console.log('[getUserId] New anonymousId created:', anonymousId);
    } else {
        // console.log('[getUserId] Using existing anonymousId:', anonymousId); // Descomentar si necesitas mucho detalle
    }
    return anonymousId;
}

export function getUserDisplayName() {
    const name = localStorage.getItem('playerName') || 'Jugador Anónimo';
    // console.log('[getUserDisplayName] Name:', name); // Descomentar si necesitas mucho detalle
    return name;
}

/**
 * Ensures a user profile document exists in Firestore.
 * @param {object} dbInstance - The Firestore instance.
 * @param {string} userIdToEnsure - The Firebase User ID (auth.currentUser.uid).
 * @param {string} displayNameToEnsure - The display name for the user.
 * @returns {Promise<string>} The user ID that was ensured.
 */
export async function ensureUserProfile(dbInstance, userIdToEnsure, displayNameToEnsure) {
    console.log(`[ensureUserProfile] START - userId: ${userIdToEnsure}, displayName: ${displayNameToEnsure}`);

    if (!dbInstance) {
        console.error("[ensureUserProfile] DB instance is not provided. Cannot ensure user profile.");
        // Decide on fallback behavior. Throw error or return userIdToEnsure?
        // Returning userIdToEnsure allows the caller to potentially proceed if this is non-critical.
        return userIdToEnsure; 
    }
    if (!userIdToEnsure) {
        console.error("[ensureUserProfile] userIdToEnsure is not provided. Cannot ensure user profile.");
        return null; // Or throw error
    }

    try {
        const userRef = doc(dbInstance, "users", userIdToEnsure);
        const userSnap = await getDoc(userRef);
        
        const defaultStats = {
            pasalache: { played: 0, wins: 0, score: 0, correctAnswers: 0, incorrectAnswers: 0 },
            quiensabemas: { played: 0, wins: 0, score: 0 },
            mentiroso: { played: 0, wins: 0, score: 0 },
            crackrapido: { played: 0, wins: 0, score: 0, correctAnswers: 0, bestStreak: 0 }
        };

        if (!userSnap.exists()) {
            console.log(`[ensureUserProfile] User ${userIdToEnsure} does NOT exist. CREATING...`);
            await setDoc(userRef, {
                uid: userIdToEnsure,
                displayName: displayNameToEnsure || 'Jugador Anónimo', // Use provided name or fallback
                createdAt: serverTimestamp(),
                stats: defaultStats
            });
            console.log(`[ensureUserProfile] User ${userIdToEnsure} CREATED successfully.`);
        } else {
            console.log(`[ensureUserProfile] User ${userIdToEnsure} EXISTS. Checking displayName and stats structure.`);
            const userData = userSnap.data();
            let updates = {};
            if (displayNameToEnsure && userData.displayName !== displayNameToEnsure) {
                updates.displayName = displayNameToEnsure;
                console.log(`[ensureUserProfile] Queuing update for displayName for ${userIdToEnsure} from "${userData.displayName}" to "${displayNameToEnsure}".`);
            }

            // Ensure the stats structure exists and all game stats are present
            let currentStats = userData.stats || {};
            let statsNeedUpdate = !userData.stats;

            for (const game in defaultStats) {
                if (!currentStats[game]) {
                    currentStats[game] = defaultStats[game];
                    statsNeedUpdate = true;
                    console.log(`[ensureUserProfile] Queuing creation of stats for game ${game} for user ${userIdToEnsure}.`);
                }
            }
            if (statsNeedUpdate) {
                updates.stats = currentStats;
            }

            if (Object.keys(updates).length > 0) {
                console.log(`[ensureUserProfile] Applying updates for user ${userIdToEnsure}:`, updates);
                await updateDoc(userRef, updates);
                console.log(`[ensureUserProfile] User ${userIdToEnsure} UPDATED successfully.`);
            } else {
                console.log(`[ensureUserProfile] No updates needed for user ${userIdToEnsure}.`);
            }
        }
        return userIdToEnsure;
    } catch (error) {
        console.error(`[ensureUserProfile] CRITICAL ERROR for userId ${userIdToEnsure}:`, error);
        return userIdToEnsure; // Or rethrow, depending on desired error handling
    }
}

// --- Funciones savePasalacheResult, saveQuienSabeMasResult, saveMentirosoResult ---
// (Estas funciones ya las tienes de mi respuesta anterior, asegúrate de que estén aquí)
// Voy a añadir logs a una de ellas como ejemplo, debes hacer lo mismo para las otras dos.

export async function savePasalacheResult(gameStats) {
    console.log('[savePasalacheResult] CALLED with gameStats:', gameStats);
    if (!db) {
        console.error("[savePasalacheResult] DB is not initialized. Cannot save result.");
        return false;
    }
    try {
        const userId = await ensureUserProfile(); // ensureUserProfile ya tiene logs
        const displayName = getUserDisplayName();
        console.log(`[savePasalacheResult] User ID: ${userId}, Display Name: ${displayName}`);

        const matchDoc = {
            gameType: "pasalache",
            playerName: displayName,
            playerUid: userId,
            timestamp: serverTimestamp(),
            result: gameStats.result,
            score: gameStats.score,
            difficulty: gameStats.difficulty || "normal",
            timeSpent: gameStats.timeSpent || 0,
            passes: gameStats.passes || 0,
            players: [{ displayName: displayName, playerId: userId, score: gameStats.score, errors: gameStats.incorrectAnswers || 0 }]
        };
        console.log('[savePasalacheResult] Saving match document:', matchDoc);
        await addDoc(collection(db, "matches"), matchDoc);
        console.log('[savePasalacheResult] Match document saved.');

        const userRef = doc(db, "users", userId);
        const userStatsUpdate = {
            "stats.pasalache.played": increment(1),
            "stats.pasalache.score": increment(gameStats.score || 0),
            "stats.pasalache.correctAnswers": increment(gameStats.correctAnswers || 0),
            "stats.pasalache.incorrectAnswers": increment(gameStats.incorrectAnswers || 0)
        };
        console.log('[savePasalacheResult] Updating user stats:', userStatsUpdate);
        await updateDoc(userRef, userStatsUpdate);
        console.log('[savePasalacheResult] User stats updated.');

        if (gameStats.result === "victory") {
            console.log('[savePasalacheResult] Incrementing wins for user.');
            await updateDoc(userRef, { "stats.pasalache.wins": increment(1) });
            console.log('[savePasalacheResult] User wins incremented.');
        }
        
        console.log("[savePasalacheResult] COMPLETED successfully for Pasala Che.");
        return true;
    } catch (error) {
        console.error("[savePasalacheResult] CRITICAL ERROR saving Pasala Che data:", error);
        return false;
    }
}

/**
 * Saves the result of a Quien Sabe Mas game.
 * @param {object} dbInstance - The Firestore instance.
 * @param {string} currentUserId - The Firebase User ID (auth.currentUser.uid) of the player.
 * @param {object} gameData - The game data to save (structure defined in quiensabemas_1v1.js).
 */
export async function saveQSMResult(dbInstance, currentUserId, gameData) {
    console.log('[saveQSMResult] CALLED with gameData:', gameData, 'for user:', currentUserId);
    if (!dbInstance) {
        console.error("[saveQSMResult] DB instance is not provided. Cannot save result.");
        return false;
    }
    if (!currentUserId) {
        console.error("[saveQSMResult] currentUserId is not provided. Cannot save result.");
        return false;
    }

    try {
        // The calling context (quiensabemas_1v1.js) should provide the correct display name if available
        // For simplicity, we assume gameData might contain player names, or we use a generic one.
        const displayName = localStorage.getItem('playerName') || 'Jugador Desconocido'; // Fallback, ideally comes from auth or game state

        // Ensure user profile exists, using the Firebase UID
        await ensureUserProfile(dbInstance, currentUserId, displayName); 

        const matchDocPayload = {
            gameType: 'quiensabemas_1v1',
            timestamp: gameData.timestamp || serverTimestamp(), // Use timestamp from gameData or generate new
            // Store all players involved, using their Firebase UID if available, or WebSocket ID as fallback
            players: [], 
            // Include all scores and winner information from gameData
            // This assumes gameData.scores is an object like { playerId1: score1, playerId2: score2 }
            // And gameData.myPlayerId is the WebSocket ID of the current user.
            rawScores: gameData.scores, 
            winnerId: gameData.winnerId, // WebSocket ID of the winner
            isDraw: gameData.draw,
            // Store which player this record is for, using their Firebase UID
            recordForPlayerUid: currentUserId 
        };

        // Populate players array for the match document
        // We need a way to map WebSocket player IDs from gameData.scores to display names or Firebase UIDs if known
        // For now, let's assume gameData.scores has the WebSocket IDs as keys
        if (gameData.scores) {
            Object.keys(gameData.scores).forEach(wsPlayerId => {
                let playerInfo = {
                    wsPlayerId: wsPlayerId,
                    score: gameData.scores[wsPlayerId],
                    // If this wsPlayerId is the current user, we know their Firebase UID and display name
                    isCurrentUser: wsPlayerId === gameData.myPlayerId 
                };
                if (playerInfo.isCurrentUser) {
                    playerInfo.firebaseUid = currentUserId;
                    playerInfo.displayName = displayName;
                }
                // TODO: If we have a mapping of opponent wsPlayerId to their Firebase UID or name, add it here
                matchDocPayload.players.push(playerInfo);
            });
        }

        console.log('[saveQSMResult] Saving match document:', matchDocPayload);
        await addDoc(collection(dbInstance, "matches"), matchDocPayload);
        console.log('[saveQSMResult] Match document saved.');

        // Update user's personal game statistics
        const userStatsRef = doc(dbInstance, "userStats", currentUserId);
        const userStatsUpdate = {
            "stats.quiensabemas.played": increment(1),
            "stats.quiensabemas.score": increment(gameData.myScore || 0)
        };
        if (gameData.winnerId === gameData.myPlayerId && !gameData.draw) {
            userStatsUpdate["stats.quiensabemas.wins"] = increment(1);
        }

        console.log('[saveQSMResult] Updating user stats for:', currentUserId, userStatsUpdate);
        // Using set with merge:true to create userStats doc if it doesn't exist, or update if it does.
        await setDoc(userStatsRef, userStatsUpdate, { merge: true }); 
        console.log('[saveQSMResult] User stats updated for', currentUserId);
        
        console.log("[saveQSMResult] COMPLETED successfully for Quién Sabe Más.");
        return true;
    } catch (error) {
        console.error("[saveQSMResult] CRITICAL ERROR saving Quién Sabe Más data:", error);
        return false;
    }
}

export async function saveMentirosoResult(gameStats) {
    console.log('[saveMentirosoResult] CALLED with gameStats:', gameStats);
    if (!db) {
        console.error("[saveMentirosoResult] DB is not initialized. Cannot save result.");
        return false;
    }
    try {
        const userId = await ensureUserProfile();
        const displayName = getUserDisplayName();
        console.log(`[saveMentirosoResult] User ID: ${userId}, Display Name: ${displayName}`);

        // Crear documento de match mejorado
        const matchData = {
            gameType: "mentiroso",
            playerName: displayName,
            playerUid: userId,
            timestamp: serverTimestamp(),
            result: gameStats.result,
            myScore: gameStats.myScore || 0,
            opponents: gameStats.opponents || [],
            duration: gameStats.duration || null,
            perfectRound: gameStats.myScore === 18 && gameStats.opponents?.[0]?.score === 0,
            gameResult: gameStats.gameResult || 'Normal',
            // Estadísticas específicas del juego
            successfulDeceptions: gameStats.successfulDeceptions || 0,
            liesDetected: gameStats.liesDetected || 0,
            timeouts: gameStats.timeouts || 0,
            falseAccusations: gameStats.falseAccusations || 0
        };
        
        console.log('[saveMentirosoResult] Saving match document:', matchData);
        await addDoc(collection(db, "matches"), matchData);
        console.log('[saveMentirosoResult] Match document saved.');

        // Obtener estadísticas actuales del usuario para calcular nuevos valores
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        const currentStats = userDoc.exists() ? userDoc.data()?.mentiroso || {} : {};
        
        // Calcular nuevas estadísticas
        const isWin = gameStats.result === 'victory';
        const isLoss = gameStats.result === 'defeat';
        const isPerfectRound = gameStats.myScore === 18 && gameStats.opponents?.[0]?.score === 0;
        
        const userStatsUpdate = {
            "mentiroso.gamesPlayed": increment(1),
            "mentiroso.totalPointsWon": increment(gameStats.myScore || 0),
            "mentiroso.successfulDeceptions": increment(gameStats.successfulDeceptions || 0),
            "mentiroso.liesDetected": increment(gameStats.liesDetected || 0),
            "mentiroso.timeouts": increment(gameStats.timeouts || 0),
            "mentiroso.falseAccusations": increment(gameStats.falseAccusations || 0)
        };

        if (isWin) {
            userStatsUpdate["mentiroso.wins"] = increment(1);
        }
        
        if (isLoss) {
            userStatsUpdate["mentiroso.losses"] = increment(1);
        }
        
        if (isPerfectRound) {
            userStatsUpdate["mentiroso.perfectRounds"] = increment(1);
        }
        
        // Actualizar duración promedio del juego si está disponible
        if (gameStats.duration) {
            const currentGames = currentStats.gamesPlayed || 0;
            const currentAvgDuration = currentStats.avgGameDuration || 0;
            const newAvgDuration = ((currentAvgDuration * currentGames) + gameStats.duration) / (currentGames + 1);
            userStatsUpdate["mentiroso.avgGameDuration"] = newAvgDuration;
        }

        console.log('[saveMentirosoResult] Updating user stats:', userStatsUpdate);
        await updateDoc(userRef, userStatsUpdate);
        console.log('[saveMentirosoResult] User stats updated.');

        console.log("[saveMentirosoResult] COMPLETED successfully for El Mentiroso.");
        return true;
    } catch (error) {
        console.error("[saveMentirosoResult] CRITICAL ERROR saving El Mentiroso data:", error);
        return false;
    }
}

export async function saveCrackRapidoResult(gameStats) {
    console.log('[saveCrackRapidoResult] CALLED with gameStats:', gameStats);
    if (!db) {
        console.error("[saveCrackRapidoResult] DB is not initialized. Cannot save result.");
        return false;
    }
    try {
        const userId = await ensureUserProfile();
        const displayName = getUserDisplayName();
        console.log(`[saveCrackRapidoResult] User ID: ${userId}, Display Name: ${displayName}`);

        // Crear documento de match completo con todas las estadísticas
        const matchData = {
            gameType: "crackrapido",
            playerName: displayName,
            playerUid: userId,
            timestamp: serverTimestamp(),
            result: gameStats.result,
            score: gameStats.score || 0,
            correctAnswers: gameStats.correctAnswers || 0,
            totalQuestions: gameStats.totalQuestions || 20,
            maxStreak: gameStats.maxStreak || 0,
            averageTime: gameStats.averageTime || 0,
            totalTime: gameStats.totalTime || 0,
            accuracy: gameStats.accuracy || 0,
            gameMode: gameStats.gameMode || 'classic',
            category: gameStats.category || 'general',
            difficulty: gameStats.difficulty || 'normal',
            powerUpsUsed: gameStats.powerUpsUsed || {
                timeExtra: 0,
                removeOption: 0,
                scoreMultiplier: 0
            },
            responseTimes: gameStats.responseTimes || [],
            streaks: gameStats.streaks || [],
            completed: gameStats.completed || false,
            players: [{
                displayName: displayName,
                playerId: userId,
                score: gameStats.score || 0,
                correctAnswers: gameStats.correctAnswers || 0,
                maxStreak: gameStats.maxStreak || 0,
                accuracy: gameStats.accuracy || 0
            }]
        };
        
        console.log('[saveCrackRapidoResult] Saving match document:', matchData);
        await addDoc(collection(db, "matches"), matchData);
        console.log('[saveCrackRapidoResult] Match document saved.');

        // Actualizar estadísticas del usuario
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        const currentStats = userDoc.exists() ? userDoc.data()?.stats?.crackrapido || {} : {};

        const userStatsUpdate = {
            "stats.crackrapido.played": increment(1),
            "stats.crackrapido.totalScore": increment(gameStats.score || 0),
            "stats.crackrapido.totalCorrectAnswers": increment(gameStats.correctAnswers || 0),
            "stats.crackrapido.totalQuestions": increment(gameStats.totalQuestions || 20),
            "stats.crackrapido.totalTime": increment(gameStats.totalTime || 0)
        };

        // Actualizar best streak si es mayor
        const currentBestStreak = currentStats.bestStreak || 0;
        if ((gameStats.maxStreak || 0) > currentBestStreak) {
            userStatsUpdate["stats.crackrapido.bestStreak"] = gameStats.maxStreak;
            console.log(`[saveCrackRapidoResult] New best streak: ${gameStats.maxStreak}`);
        }

        // Actualizar mejor accuracy si es mayor
        const currentBestAccuracy = currentStats.bestAccuracy || 0;
        if ((gameStats.accuracy || 0) > currentBestAccuracy) {
            userStatsUpdate["stats.crackrapido.bestAccuracy"] = gameStats.accuracy;
            console.log(`[saveCrackRapidoResult] New best accuracy: ${gameStats.accuracy}%`);
        }

        // Actualizar mejor tiempo promedio (menor es mejor)
        const currentBestAvgTime = currentStats.bestAverageTime || Infinity;
        if ((gameStats.averageTime || Infinity) < currentBestAvgTime && gameStats.averageTime > 0) {
            userStatsUpdate["stats.crackrapido.bestAverageTime"] = gameStats.averageTime;
            console.log(`[saveCrackRapidoResult] New best average time: ${gameStats.averageTime}s`);
        }

        // Actualizar contadores por modo de juego
        if (gameStats.gameMode) {
            userStatsUpdate[`stats.crackrapido.modes.${gameStats.gameMode}`] = increment(1);
        }

        // Actualizar contadores por categoría
        if (gameStats.category && gameStats.category !== 'general') {
            userStatsUpdate[`stats.crackrapido.categories.${gameStats.category}`] = increment(1);
        }

        // Contar power-ups usados
        if (gameStats.powerUpsUsed) {
            const totalPowerUpsUsed = Object.values(gameStats.powerUpsUsed).reduce((sum, count) => sum + count, 0);
            userStatsUpdate["stats.crackrapido.totalPowerUpsUsed"] = increment(totalPowerUpsUsed);
        }

        console.log('[saveCrackRapidoResult] Updating user stats:', userStatsUpdate);
        await updateDoc(userRef, userStatsUpdate);
        console.log('[saveCrackRapidoResult] User stats updated.');

        // Contar como victoria si completó el juego
        if (gameStats.completed || gameStats.result === "completed") {
            console.log('[saveCrackRapidoResult] Incrementing completed games for user.');
            await updateDoc(userRef, { "stats.crackrapido.completedGames": increment(1) });
            console.log('[saveCrackRapidoResult] Completed games incremented.');
        }

        console.log("[saveCrackRapidoResult] COMPLETED successfully for Crack Rápido.");
        return true;
    } catch (error) {
        console.error("[saveCrackRapidoResult] CRITICAL ERROR saving Crack Rápido data:", error);
        return false;
    }
}
