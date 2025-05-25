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
            mentiroso: { played: 0, wins: 0, score: 0 }
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

        const matchData = {
            gameType: "mentiroso",
            playerName: displayName, playerUid: userId, timestamp: serverTimestamp(),
            result: gameStats.result, score: gameStats.myScore || 0,
            players: [{ displayName: displayName, playerId: userId, score: gameStats.myScore || 0 }]
        };
        if (gameStats.opponents && Array.isArray(gameStats.opponents)) {
            gameStats.opponents.forEach(op => matchData.players.push({ displayName: op.name || "Oponente", playerId: op.id || "unknown_opponent", score: op.score || 0 }));
        }
        console.log('[saveMentirosoResult] Saving match document:', matchData);
        await addDoc(collection(db, "matches"), matchData);
        console.log('[saveMentirosoResult] Match document saved.');

        const userRef = doc(db, "users", userId);
        const userStatsUpdate = {
            "stats.mentiroso.played": increment(1),
            "stats.mentiroso.score": increment(gameStats.myScore || 0)
        };
        console.log('[saveMentirosoResult] Updating user stats:', userStatsUpdate);
        await updateDoc(userRef, userStatsUpdate);
        console.log('[saveMentirosoResult] User stats updated.');

        if (gameStats.result === "victory") {
            console.log('[saveMentirosoResult] Incrementing wins for user.');
            await updateDoc(userRef, { "stats.mentiroso.wins": increment(1) });
            console.log('[saveMentirosoResult] User wins incremented.');
        }
        console.log("[saveMentirosoResult] COMPLETED successfully for El Mentiroso.");
        return true;
    } catch (error) {
        console.error("[saveMentirosoResult] CRITICAL ERROR saving El Mentiroso data:", error);
        return false;
    }
}
