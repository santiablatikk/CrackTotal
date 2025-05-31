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

export async function ensureUserProfile() {
    const userId = await getUserId();
    const displayName = getUserDisplayName();
    console.log(`[ensureUserProfile] START - userId: ${userId}, displayName: ${displayName}`);

    if (!db) {
        console.error("[ensureUserProfile] DB is not initialized. Cannot ensure user profile.");
        return userId; // Devuelve el ID para que la función que llama no falle completamente
    }

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        const defaultStats = {
            pasalache: { played: 0, wins: 0, score: 0, correctAnswers: 0, incorrectAnswers: 0 },
            quiensabemas: { played: 0, wins: 0, score: 0 },
            mentiroso: { played: 0, wins: 0, score: 0 },
            crackrapido: { played: 0, wins: 0, score: 0, correctAnswers: 0, bestStreak: 0 }
        };

        if (!userSnap.exists()) {
            console.log(`[ensureUserProfile] User ${userId} does NOT exist. CREATING...`);
            await setDoc(userRef, {
                uid: userId,
                displayName: displayName,
                createdAt: serverTimestamp(),
                stats: defaultStats
            });
            console.log(`[ensureUserProfile] User ${userId} CREATED successfully.`);
        } else {
            console.log(`[ensureUserProfile] User ${userId} EXISTS. Checking displayName and stats structure.`);
            const userData = userSnap.data();
            let updates = {};
            if (userData.displayName !== displayName) {
                updates.displayName = displayName;
                console.log(`[ensureUserProfile] Queuing update for displayName for ${userId} from "${userData.displayName}" to "${displayName}".`);
            }

            // Asegurar que la estructura de stats existe
            if (!userData.stats) {
                updates.stats = defaultStats;
                console.log(`[ensureUserProfile] Queuing creation of full stats structure for ${userId}.`);
            } else {
                for (const game in defaultStats) {
                    if (!userData.stats[game]) {
                        updates[`stats.${game}`] = defaultStats[game];
                        console.log(`[ensureUserProfile] Queuing creation of stats for game ${game} for user ${userId}.`);
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                console.log(`[ensureUserProfile] Applying updates for user ${userId}:`, updates);
                await updateDoc(userRef, updates);
                console.log(`[ensureUserProfile] User ${userId} UPDATED successfully.`);
            } else {
                console.log(`[ensureUserProfile] No updates needed for user ${userId}.`);
            }
        }
        return userId;
    } catch (error) {
        console.error(`[ensureUserProfile] CRITICAL ERROR for userId ${userId}:`, error);
        return userId;
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

export async function saveQuienSabeMasResult(gameStats) {
    console.log('[saveQuienSabeMasResult] CALLED with gameStats:', gameStats);
    if (!db) {
        console.error("[saveQuienSabeMasResult] DB is not initialized. Cannot save result.");
        return false;
    }
    try {
        const userId = await ensureUserProfile();
        const displayName = getUserDisplayName();
        console.log(`[saveQuienSabeMasResult] User ID: ${userId}, Display Name: ${displayName}`);

        const matchData = {
            gameType: "quiensabemas",
            playerName: displayName, playerUid: userId, timestamp: serverTimestamp(),
            result: gameStats.result, score: gameStats.myScore || 0,
            players: [{ displayName: displayName, playerId: userId, score: gameStats.myScore || 0 }]
        };
        if (gameStats.opponentName) {
            matchData.players.push({ displayName: gameStats.opponentName, playerId: gameStats.opponentId || "unknown_opponent", score: gameStats.opponentScore || 0 });
        }
        console.log('[saveQuienSabeMasResult] Saving match document:', matchData);
        await addDoc(collection(db, "matches"), matchData);
        console.log('[saveQuienSabeMasResult] Match document saved.');

        const userRef = doc(db, "users", userId);
        const userStatsUpdate = {
            "stats.quiensabemas.played": increment(1),
            "stats.quiensabemas.score": increment(gameStats.myScore || 0)
        };
        console.log('[saveQuienSabeMasResult] Updating user stats:', userStatsUpdate);
        await updateDoc(userRef, userStatsUpdate);
        console.log('[saveQuienSabeMasResult] User stats updated.');

        if (gameStats.result === "victory") {
            console.log('[saveQuienSabeMasResult] Incrementing wins for user.');
            await updateDoc(userRef, { "stats.quiensabemas.wins": increment(1) });
            console.log('[saveQuienSabeMasResult] User wins incremented.');
        }
        console.log("[saveQuienSabeMasResult] COMPLETED successfully for Quién Sabe Más.");
        return true;
    } catch (error) {
        console.error("[saveQuienSabeMasResult] CRITICAL ERROR saving Quién Sabe Más data:", error);
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
