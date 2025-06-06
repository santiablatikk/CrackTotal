/**
 * Utilidad para arreglar problemas de rankings en Crack Total
 * Este script ayuda a sincronizar y reparar datos entre diferentes colecciones de rankings
 */

// Primero, importamos los módulos Firebase necesarios
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc, 
  updateDoc,
  orderBy,
  limit,
  writeBatch
} = require('firebase/firestore');

// Configuración de Firebase - REEMPLAZAR CON TUS CREDENCIALES
const firebaseConfig = {
  apiKey: "AIzaSyAwdugL_lfSMpDgDCV50dMRf4",
  authDomain: "cracktotal-cd2e7.firebaseapp.com",
  projectId: "cracktotal-cd2e7",
  storageBucket: "cracktotal-cd2e7.appspot.com",
  messagingSenderId: "210391454358",
  appId: "1:210391454358:web:ac3b528aca23a88562fd1f",
  measurementId: "G-5XP3T1RTH7"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Colecciones que vamos a reparar
const COLLECTIONS = {
  USERS: 'users',
  RANKINGS: 'rankings',
  RANKINGS_MENTIROSO: 'rankings_mentiroso',
  RANKINGS_QUIENSABEMAS: 'rankings_quiensabemas',
  RANKINGS_CRACKRAPIDO: 'rankings_crackrapido',
  HISTORY_MENTIROSO: 'history_mentiroso',
  HISTORY_QUIENSABEMAS: 'history_quiensabemas',
  HISTORY_CRACKRAPIDO: 'history_crackrapido',
  HISTORY_PASALACHE: 'history_pasalache',
  MATCHES: 'matches'
};

// Nombres de los juegos
const GAME_TYPES = {
  PASALACHE: 'pasalache',
  QUIENSABEMAS: 'quiensabemas',
  MENTIROSO: 'mentiroso',
  CRACKRAPIDO: 'crackrapido'
};

// Función principal que ejecuta las utilidades
async function fixRankings() {
  try {
    console.log('🔧 Iniciando utilidad de reparación de rankings...');
    
    // 1. Migrar datos desde 'rankings' a colecciones específicas de juego
    await migrateRankings();
    
    // 2. Actualizar estructuras de datos de usuarios
    await updateUserProfiles();
    
    // 3. Sincronizar historiales
    await syncHistories();
    
    console.log('✅ Proceso de reparación completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en el proceso de reparación:', error);
  }
}

// Migrar datos desde la colección general 'rankings' a colecciones específicas por juego
async function migrateRankings() {
  console.log('📊 Migrando rankings a colecciones específicas...');
  
  const rankingsRef = collection(db, COLLECTIONS.RANKINGS);
  const rankingsSnapshot = await getDocs(rankingsRef);
  
  if (rankingsSnapshot.empty) {
    console.log('ℹ️ No hay rankings para migrar');
    return;
  }
  
  // Para controlar las operaciones de escritura por lotes
  const batchSize = 500;
  let batch = writeBatch(db);
  let operationCount = 0;
  
  for (const doc of rankingsSnapshot.docs) {
    const rankingData = doc.data();
    const gameType = rankingData.gameType;
    
    // Verificar a qué colección corresponde este ranking
    let targetCollection;
    switch (gameType) {
      case GAME_TYPES.QUIENSABEMAS:
        targetCollection = COLLECTIONS.RANKINGS_QUIENSABEMAS;
        break;
      case GAME_TYPES.MENTIROSO:
        targetCollection = COLLECTIONS.RANKINGS_MENTIROSO;
        break;
      case GAME_TYPES.CRACKRAPIDO:
        targetCollection = COLLECTIONS.RANKINGS_CRACKRAPIDO;
        break;
      case GAME_TYPES.PASALACHE:
      default:
        // Pasala Che se queda en la colección principal
        continue;
    }
    
    // Crear documento en la colección específica
    const targetDocRef = doc(db, targetCollection, doc.id);
    batch.set(targetDocRef, {
      ...rankingData,
      lastUpdated: new Date(), // Actualizar fecha
      migratedFromMain: true // Marcar como migrado
    });
    
    operationCount++;
    
    // Si alcanzamos el límite de batch, commitear y reiniciar
    if (operationCount >= batchSize) {
      await batch.commit();
      console.log(`✓ Committed batch of ${operationCount} operations`);
      batch = writeBatch(db);
      operationCount = 0;
    }
  }
  
  // Commitear el último batch si hay operaciones pendientes
  if (operationCount > 0) {
    await batch.commit();
    console.log(`✓ Committed final batch of ${operationCount} operations`);
  }
  
  console.log(`✅ Migración de rankings completada. Procesados: ${rankingsSnapshot.size} documentos`);
}

// Actualizar perfiles de usuario con datos consolidados
async function updateUserProfiles() {
  console.log('👤 Actualizando perfiles de usuario con datos consolidados...');
  
  const usersRef = collection(db, COLLECTIONS.USERS);
  const usersSnapshot = await getDocs(usersRef);
  
  if (usersSnapshot.empty) {
    console.log('ℹ️ No hay usuarios para actualizar');
    return;
  }
  
  const batchSize = 500;
  let batch = writeBatch(db);
  let operationCount = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    // Estructura unificada para estadísticas por juego
    if (!userData.stats) {
      userData.stats = {};
    }
    
    // Consolidar datos de Quién Sabe Más
    await consolidateGameStats(userId, GAME_TYPES.QUIENSABEMAS, userData);
    
    // Consolidar datos de Mentiroso
    await consolidateGameStats(userId, GAME_TYPES.MENTIROSO, userData);
    
    // Consolidar datos de Crack Rápido
    await consolidateGameStats(userId, GAME_TYPES.CRACKRAPIDO, userData);
    
    // Consolidar datos de Pasala Che
    await consolidateGameStats(userId, GAME_TYPES.PASALACHE, userData);
    
    // Actualizar el documento de usuario
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    batch.update(userRef, {
      stats: userData.stats,
      lastUpdated: new Date(),
      profileFixed: true
    });
    
    operationCount++;
    
    if (operationCount >= batchSize) {
      await batch.commit();
      console.log(`✓ Committed batch of ${operationCount} user profile updates`);
      batch = writeBatch(db);
      operationCount = 0;
    }
  }
  
  // Commitear el último batch si hay operaciones pendientes
  if (operationCount > 0) {
    await batch.commit();
    console.log(`✓ Committed final batch of ${operationCount} user profile updates`);
  }
  
  console.log(`✅ Actualización de perfiles completada. Usuarios procesados: ${usersSnapshot.size}`);
}

// Consolidar estadísticas de un juego específico para un usuario
async function consolidateGameStats(userId, gameType, userData) {
  // Esta función se encargará de buscar todas las estadísticas relacionadas con un
  // juego específico para un usuario y consolidarlas en la estructura userData.stats
  
  // Verificar si ya existen estadísticas para este juego
  if (!userData.stats[gameType]) {
    userData.stats[gameType] = {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      score: 0,
      lastPlayed: null
    };
  }
  
  // Buscar en la colección específica de rankings
  let targetCollection;
  switch (gameType) {
    case GAME_TYPES.QUIENSABEMAS:
      targetCollection = COLLECTIONS.RANKINGS_QUIENSABEMAS;
      break;
    case GAME_TYPES.MENTIROSO:
      targetCollection = COLLECTIONS.RANKINGS_MENTIROSO;
      break;
    case GAME_TYPES.CRACKRAPIDO:
      targetCollection = COLLECTIONS.RANKINGS_CRACKRAPIDO;
      break;
    case GAME_TYPES.PASALACHE:
      targetCollection = COLLECTIONS.RANKINGS;
      break;
  }
  
  // Consultar rankings del usuario
  const rankingsQuery = query(
    collection(db, targetCollection),
    where('userId', '==', userId),
    where('gameType', '==', gameType)
  );
  
  const rankingsSnapshot = await getDocs(rankingsQuery);
  
  if (!rankingsSnapshot.empty) {
    // Encontramos datos, actualizamos las estadísticas
    const latestRanking = rankingsSnapshot.docs[0].data();
    
    // Actualizar estadísticas básicas
    userData.stats[gameType] = {
      ...userData.stats[gameType],
      score: latestRanking.score || 0,
      wins: latestRanking.wins || userData.stats[gameType].wins,
      losses: latestRanking.losses || userData.stats[gameType].losses,
      gamesPlayed: latestRanking.gamesPlayed || (latestRanking.wins + latestRanking.losses) || userData.stats[gameType].gamesPlayed,
      lastPlayed: latestRanking.lastUpdated || latestRanking.timestamp || userData.stats[gameType].lastPlayed
    };
    
    // Copiar cualquier otra estadística específica del juego
    for (const key in latestRanking) {
      if (!['userId', 'displayName', 'gameType', 'timestamp', 'lastUpdated'].includes(key) && 
          !userData.stats[gameType][key]) {
        userData.stats[gameType][key] = latestRanking[key];
      }
    }
  }
  
  // Buscar en la colección de partidas/matches para estadísticas adicionales
  const matchesQuery = query(
    collection(db, COLLECTIONS.MATCHES),
    where('userId', '==', userId),
    where('gameType', '==', gameType),
    orderBy('timestamp', 'desc'),
    limit(100)
  );
  
  const matchesSnapshot = await getDocs(matchesQuery);
  
  if (!matchesSnapshot.empty) {
    let totalMatches = 0;
    let wins = 0;
    let losses = 0;
    let totalScore = 0;
    let lastPlayed = null;
    
    matchesSnapshot.docs.forEach(matchDoc => {
      const matchData = matchDoc.data();
      totalMatches++;
      
      if (matchData.result === 'victory' || matchData.won === true) {
        wins++;
      } else if (matchData.result === 'defeat' || matchData.won === false) {
        losses++;
      }
      
      if (matchData.score) {
        totalScore += matchData.score;
      }
      
      if (!lastPlayed || (matchData.timestamp && matchData.timestamp.toDate() > lastPlayed.toDate())) {
        lastPlayed = matchData.timestamp;
      }
    });
    
    // Actualizar estadísticas con datos de partidas
    if (totalMatches > userData.stats[gameType].gamesPlayed) {
      userData.stats[gameType].gamesPlayed = totalMatches;
      userData.stats[gameType].wins = Math.max(userData.stats[gameType].wins, wins);
      userData.stats[gameType].losses = Math.max(userData.stats[gameType].losses, losses);
      
      if (totalScore > userData.stats[gameType].score) {
        userData.stats[gameType].score = totalScore;
      }
      
      if (lastPlayed && (!userData.stats[gameType].lastPlayed || 
          lastPlayed.toDate() > userData.stats[gameType].lastPlayed.toDate())) {
        userData.stats[gameType].lastPlayed = lastPlayed;
      }
    }
  }
}

// Sincronizar historiales de partidas
async function syncHistories() {
  console.log('📜 Sincronizando historiales de partidas...');
  
  // Para cada tipo de juego, sincronizar su historial
  for (const gameType of Object.values(GAME_TYPES)) {
    await syncGameHistory(gameType);
  }
  
  console.log('✅ Sincronización de historiales completada');
}

// Sincronizar historial para un tipo de juego específico
async function syncGameHistory(gameType) {
  console.log(`🎮 Sincronizando historial para ${gameType}...`);
  
  // Determinar la colección de historial correspondiente
  let historyCollection;
  switch (gameType) {
    case GAME_TYPES.QUIENSABEMAS:
      historyCollection = COLLECTIONS.HISTORY_QUIENSABEMAS;
      break;
    case GAME_TYPES.MENTIROSO:
      historyCollection = COLLECTIONS.HISTORY_MENTIROSO;
      break;
    case GAME_TYPES.CRACKRAPIDO:
      historyCollection = COLLECTIONS.HISTORY_CRACKRAPIDO;
      break;
    case GAME_TYPES.PASALACHE:
      historyCollection = COLLECTIONS.HISTORY_PASALACHE;
      break;
  }
  
  // Obtener partidas de la colección general
  const matchesQuery = query(
    collection(db, COLLECTIONS.MATCHES),
    where('gameType', '==', gameType),
    orderBy('timestamp', 'desc'),
    limit(1000)
  );
  
  const matchesSnapshot = await getDocs(matchesQuery);
  
  if (matchesSnapshot.empty) {
    console.log(`ℹ️ No hay partidas para ${gameType} para sincronizar`);
    return;
  }
  
  // Para controlar las operaciones de escritura por lotes
  const batchSize = 500;
  let batch = writeBatch(db);
  let operationCount = 0;
  
  for (const matchDoc of matchesSnapshot.docs) {
    const matchData = matchDoc.data();
    
    // Crear entrada en la colección específica de historial
    const historyDocRef = doc(db, historyCollection, matchDoc.id);
    batch.set(historyDocRef, {
      ...matchData,
      syncedFromMatches: true,
      lastUpdated: new Date()
    }, { merge: true });
    
    operationCount++;
    
    if (operationCount >= batchSize) {
      await batch.commit();
      console.log(`✓ Committed batch of ${operationCount} history entries for ${gameType}`);
      batch = writeBatch(db);
      operationCount = 0;
    }
  }
  
  // Commitear el último batch si hay operaciones pendientes
  if (operationCount > 0) {
    await batch.commit();
    console.log(`✓ Committed final batch of ${operationCount} history entries for ${gameType}`);
  }
  
  console.log(`✅ Sincronización de historial para ${gameType} completada. Partidas procesadas: ${matchesSnapshot.size}`);
}

// Ejecutar la función principal
fixRankings()
  .then(() => {
    console.log('🎮 Proceso de reparación de rankings finalizado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal en el proceso de reparación:', error);
    process.exit(1);
  }); 