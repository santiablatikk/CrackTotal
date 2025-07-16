// ================================
// SERVICIO FIREBASE - CRACKTOTAL
// Manejo de Rankings y Estadísticas
// ================================

class FirebaseService {
  constructor() {
    this.isReady = false;
    this.currentUser = null;
    this.init();
  }

  // Inicialización del servicio
  async init() {
    try {
      // Esperar a que Firebase esté disponible
      await this.waitForFirebase();
      
      // Configurar autenticación anónima
      await this.setupAnonymousAuth();
      
      this.isReady = true;
      console.log('🎯 Firebase Service listo para usar');
      
    } catch (error) {
      console.error('❌ Error inicializando Firebase Service:', error);
    }
  }

  // Esperar a que Firebase esté disponible
  waitForFirebase() {
    return new Promise((resolve, reject) => {
      const checkFirebase = () => {
        if (window.db && window.auth) {
          resolve();
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      checkFirebase();
      
      // Timeout después de 10 segundos
      setTimeout(() => reject(new Error('Firebase no se cargó')), 10000);
    });
  }

  // Configurar autenticación anónima
  async setupAnonymousAuth() {
    return new Promise((resolve, reject) => {
      window.auth.onAuthStateChanged(async (user) => {
        if (user) {
          this.currentUser = user;
          console.log('👤 Usuario autenticado:', user.uid);
          resolve();
        } else {
          // Crear usuario anónimo
          try {
            const result = await window.auth.signInAnonymously();
            this.currentUser = result.user;
            console.log('👤 Usuario anónimo creado:', result.user.uid);
            resolve();
          } catch (error) {
            console.error('❌ Error creando usuario anónimo:', error);
            reject(error);
          }
                    }
                });
            });
  }

  // ================================
  // MÉTODOS PARA GUARDAR PARTIDAS
  // ================================

  // Guardar resultado de partida
  async saveMatch(gameType, matchData) {
    if (!this.isReady || !this.currentUser) {
      console.warn('⚠️ Firebase Service no está listo');
      return false;
    }

    try {
      const matchRecord = {
        // Información básica
        gameType: gameType,
        playerId: this.currentUser.uid,
        playerName: matchData.playerName || 'Anónimo',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        
        // Resultados
        score: matchData.score || 0,
        correctAnswers: matchData.correctAnswers || 0,
        incorrectAnswers: matchData.incorrectAnswers || 0,
        totalQuestions: matchData.totalQuestions || 0,
        accuracy: matchData.accuracy || 0,
        duration: matchData.duration || 0,
        
        // Datos específicos del juego (especialmente importante para Pasalache)
        gameResult: matchData.gameResult || 'unknown', // 'victory', 'defeat', 'timeout'
        difficulty: matchData.difficulty || 'normal',
        resultDescription: matchData.resultDescription || '',
        
        // Datos adicionales si están disponibles
        passedAnswers: matchData.passedAnswers || 0,
        helpUsed: matchData.helpUsed || 0,
        maxErrors: matchData.maxErrors || 0,
        totalErrors: matchData.totalErrors || 0,
        
        // Metadatos
        gameVersion: matchData.gameVersion || '1.0',
        createdAt: new Date().toISOString()
      };

      // Guardar en colección de partidas
      const matchRef = await window.db.collection('matches').add(matchRecord);
      console.log('✅ Partida guardada:', matchRef.id);

      // Actualizar estadísticas del usuario
      await this.updateUserStats(gameType, matchData);

      return true;
    } catch (error) {
      console.error('❌ Error guardando partida:', error);
      return false;
    }
  }

  // Actualizar estadísticas del usuario
  async updateUserStats(gameType, matchData) {
    try {
      const userRef = window.db.collection('user_stats').doc(this.currentUser.uid);
      
      // Obtener estadísticas actuales
      const userDoc = await userRef.get();
      const currentStats = userDoc.exists ? userDoc.data() : {};

      // Inicializar estructura si no existe
      if (!currentStats[gameType]) {
        currentStats[gameType] = {
          totalPlayed: 0,
          totalScore: 0,
          bestScore: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          bestAccuracy: 0,
          lastPlayed: null
        };
      }

      // Actualizar estadísticas
      const gameStats = currentStats[gameType];
      gameStats.totalPlayed += 1;
      gameStats.totalScore += (matchData.score || 0);
      gameStats.bestScore = Math.max(gameStats.bestScore, matchData.score || 0);
      gameStats.totalCorrect += (matchData.correctAnswers || 0);
      gameStats.totalQuestions += (matchData.totalQuestions || 0);
      gameStats.bestAccuracy = Math.max(gameStats.bestAccuracy, matchData.accuracy || 0);
      gameStats.lastPlayed = firebase.firestore.FieldValue.serverTimestamp();

      // Guardar estadísticas actualizadas
      await userRef.set(currentStats, { merge: true });
      console.log('📊 Estadísticas actualizadas para', gameType);

            } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error);
    }
  }

  // ================================
  // MÉTODOS PARA RANKINGS
  // ================================

  // Obtener ranking global de un juego
  async getRanking(gameType, limit = 20) {
    try {
      const snapshot = await window.db.collection('matches')
        .where('gameType', '==', gameType)
        .orderBy('score', 'desc')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const ranking = [];
      snapshot.forEach(doc => {
        ranking.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`🏆 Ranking de ${gameType} obtenido:`, ranking.length, 'entradas');
      return ranking;

    } catch (error) {
      console.error('❌ Error obteniendo ranking:', error);
      return [];
    }
  }

  // Obtener ranking agregado por jugador (nuevo método)
  async getAggregatedRanking(gameType, limit = 20) {
    try {
      console.log(`🏆 Obteniendo ranking agregado de ${gameType}...`);
      
      // Verificar que la base de datos esté disponible
      if (!window.db) {
        throw new Error('Base de datos no disponible');
      }
      
      // Obtener todas las partidas del juego
      console.log(`🔍 Consultando matches con gameType: "${gameType}"`);
      const snapshot = await window.db.collection('matches')
        .where('gameType', '==', gameType)
        .get();

      console.log(`📊 Encontradas ${snapshot.size} partidas de ${gameType}`);
      
      if (snapshot.empty) {
        console.warn(`⚠️ No se encontraron partidas para el juego: ${gameType}`);
        return [];
      }

      const playerStats = {};
      
      // Procesar cada partida
      snapshot.forEach(doc => {
        const match = doc.data();
        const playerName = match.playerName || 'Anónimo';
        const playerId = match.playerId || 'unknown';
        const playerKey = `${playerName}_${playerId}`;
        
        if (!playerStats[playerKey]) {
          playerStats[playerKey] = {
            playerName: playerName,
            playerId: playerId,
            totalGames: 0,
            bestScore: 0,
            totalScore: 0,
            victories: 0,
            defeats: 0,
            timeouts: 0,
            totalCorrectAnswers: 0,
            totalIncorrectAnswers: 0,
            bestAccuracy: 0,
            averageAccuracy: 0,
            lastPlayed: null
          };
        }
        
        const stats = playerStats[playerKey];
        stats.totalGames++;
        stats.totalScore += match.score || 0;
        stats.bestScore = Math.max(stats.bestScore, match.score || 0);
        stats.totalCorrectAnswers += match.correctAnswers || 0;
        stats.totalIncorrectAnswers += match.incorrectAnswers || 0;
        
        // Determinar resultado de la partida
        const result = this.determineMatchResult(match, gameType);
        if (result === 'victory') {
          stats.victories++;
        } else if (result === 'timeout') {
          stats.timeouts++;
        } else {
          stats.defeats++;
        }
        
        // Actualizar mejor precisión
        if (match.accuracy > stats.bestAccuracy) {
          stats.bestAccuracy = match.accuracy;
        }
        
        // Actualizar fecha de última partida
        const matchDate = match.timestamp ? 
          (match.timestamp.seconds ? new Date(match.timestamp.seconds * 1000) : new Date(match.timestamp)) :
          new Date(match.createdAt || 0);
        
        if (!stats.lastPlayed || matchDate > stats.lastPlayed) {
          stats.lastPlayed = matchDate;
        }
      });
      
      // Calcular estadísticas finales y convertir a array
      const aggregatedRanking = Object.values(playerStats).map(stats => {
        stats.averageAccuracy = stats.totalGames > 0 ? 
          Math.round((stats.totalCorrectAnswers / (stats.totalCorrectAnswers + stats.totalIncorrectAnswers)) * 100) : 0;
        stats.winRate = stats.totalGames > 0 ? 
          Math.round((stats.victories / stats.totalGames) * 100) : 0;
        stats.averageScore = stats.totalGames > 0 ? 
          Math.round(stats.totalScore / stats.totalGames) : 0;
        
        return stats;
      });
      
      // Ordenar por mejor puntaje, luego por total de victorias, luego por total de partidas
      aggregatedRanking.sort((a, b) => {
        if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
        if (b.victories !== a.victories) return b.victories - a.victories;
        return b.totalGames - a.totalGames;
      });
      
      // Limitar resultados
      const limitedRanking = aggregatedRanking.slice(0, limit);
      
      console.log(`✅ Ranking agregado de ${gameType} obtenido:`, limitedRanking.length, 'jugadores únicos');
      return limitedRanking;

    } catch (error) {
      console.error('❌ Error obteniendo ranking agregado:', error);
      return [];
    }
  }

  // Función auxiliar para determinar resultado de partida
  determineMatchResult(match, gameType) {
    const correctAnswers = match.correctAnswers || 0;
    const incorrectAnswers = match.incorrectAnswers || 0;
    const difficulty = match.difficulty || 'normal';
    const gameResult = match.gameResult || 'unknown';
    const score = match.score || 0;
    
    console.log(`🎮 [Firebase] Determinando resultado para ${gameType}:`, {
      correctAnswers,
      incorrectAnswers,
      difficulty,
      gameResult,
      score
    });
    
    if (gameType === 'pasalache') {
      // Primero: Si tenemos gameResult explícito de Firebase, usarlo (es más confiable)
      if (gameResult === 'victory') {
        return 'victory';
      } else if (gameResult === 'defeat') {
        return 'defeat';
      } else if (gameResult === 'timeout') {
        return 'timeout';
      }
      
      // Segundo: Lógica de respaldo para partidas viejas sin gameResult
      console.log('⚠️ [Firebase] No hay gameResult explícito, usando lógica de respaldo mejorada');
      
      const maxErrors = {
        'easy': 4,
        'normal': 3,
        'hard': 2,
        'expert': 1
      };
      
      const maxErrorsForDifficulty = maxErrors[difficulty] || 3;
      
      // Caso 1: Victoria clara - Completó el rosco (26 respuestas correctas)
      // Verificar tanto correctAnswers como score por si acaso
      if (correctAnswers === 26 || score === 26) {
        console.log(`🏆 [DEBUG Firebase] ${match.playerName}: Victoria - Completó el rosco (${correctAnswers || score}/26)`);
        return 'victory';
      }
      
      // Caso 2: Derrota clara - Alcanzó o superó el máximo de errores
      if (incorrectAnswers >= maxErrorsForDifficulty) {
        console.log(`💥 [DEBUG Firebase] ${match.playerName}: Derrota - Errores: ${incorrectAnswers} >= ${maxErrorsForDifficulty}`);
        return 'defeat';
      }
      
      // Caso 3: Para partidas viejas, usar el score como indicador
      if (incorrectAnswers === 0 && correctAnswers < 26) {
        console.log(`⚠️ [DEBUG Firebase] ${match.playerName}: Sin datos de errores, probablemente partida vieja`);
        
        if (correctAnswers >= 25) {
          // Santy con 25 puntos podría haber completado el rosco
          console.log(`🏆 [DEBUG Firebase] ${match.playerName}: Victoria - Score muy alto, probablemente completó rosco (${correctAnswers}/26)`);
          return 'victory';
        } else if (correctAnswers >= 20) {
          return 'timeout';
        } else if (correctAnswers <= 10) {
          return 'defeat';
        } else if (correctAnswers <= 15) {
          return 'defeat';
        } else {
          return 'timeout';
        }
      }
    }
    
    // Para otros juegos, usar lógica actual
    if (gameResult === 'victory') {
      return 'victory';
    } else if (gameResult === 'defeat') {
      return 'defeat';
    } else if (gameResult === 'timeout') {
      return 'timeout';
    } else {
      // Lógica de respaldo para otros juegos basada en score
      const thresholds = {
        'mentiroso': 60,
        'crackrapido': 50,
        'quiensabemas': 7,
        '100futboleros': 30
      };
      
      const threshold = thresholds[gameType] || 50;
      return score >= threshold ? 'victory' : 'defeat';
    }
  }

  // Obtener historial de partidas del usuario actual
  async getUserHistory(gameType, limit = 10) {
    if (!this.currentUser) {
      console.warn('⚠️ No hay usuario autenticado');
                    return [];
                }

    try {
      const snapshot = await window.db.collection('matches')
        .where('playerId', '==', this.currentUser.uid)
        .where('gameType', '==', gameType)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const history = [];
      snapshot.forEach(doc => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`📜 Historial de ${gameType} obtenido:`, history.length, 'partidas');
                return history;

            } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
                return [];
            }
        }

  // Obtener estadísticas del usuario actual
  async getUserStats(gameType = null) {
    if (!this.currentUser) {
      console.warn('⚠️ No hay usuario autenticado');
      return null;
    }

    try {
      const userDoc = await window.db.collection('user_stats').doc(this.currentUser.uid).get();
      
      if (!userDoc.exists) {
        console.log('📊 No hay estadísticas para este usuario');
        return null;
      }

      const stats = userDoc.data();
      
      if (gameType) {
        return stats[gameType] || null;
      }
      
      return stats;

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de usuario:', error);
      return null;
    }
  }

  // ================================
  // MÉTODOS DE DIAGNÓSTICO
  // ================================

  // Diagnosticar contenido de la base de datos
  async diagnoseDatabase() {
    try {
      console.log('🔍 DIAGNÓSTICO DE BASE DE DATOS');
      
      if (!window.db) {
        console.error('❌ window.db no está disponible');
        return;
      }
      
      // Obtener todas las partidas para análisis
      const snapshot = await window.db.collection('matches').get();
      
      console.log(`📊 Total de partidas en la base de datos: ${snapshot.size}`);
      
      if (snapshot.empty) {
        console.warn('⚠️ No hay partidas en la base de datos');
        return;
      }
      
      // Agrupar por gameType
      const gameTypes = {};
      const players = new Set();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const gameType = data.gameType || 'unknown';
        const playerName = data.playerName || 'Anónimo';
        
        if (!gameTypes[gameType]) {
          gameTypes[gameType] = 0;
        }
        gameTypes[gameType]++;
        players.add(playerName);
      });
      
      console.log('🎮 Partidas por tipo de juego:', gameTypes);
      console.log(`👥 Total de jugadores únicos: ${players.size}`);
      console.log('👥 Jugadores:', Array.from(players));
      
      return {
        totalMatches: snapshot.size,
        gameTypes,
        uniquePlayers: players.size,
        players: Array.from(players)
      };
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
    }
  }

  // ================================
  // MÉTODOS AUXILIARES
  // ================================

  // Verificar si el servicio está listo para consultas de solo lectura (rankings públicos)
  isReadyForReading() {
    return window.db !== undefined;
  }

  // Verificar si el servicio está listo para operaciones que requieren autenticación
  isServiceReady() {
    return this.isReady && this.currentUser;
  }

  // Obtener ID del usuario actual
  getCurrentUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  // Generar nombre de jugador por defecto
  generatePlayerName() {
    const adjectives = ['Rápido', 'Genial', 'Pro', 'Crack', 'Estrella', 'Maestro'];
    const nouns = ['Futbolero', 'Jugador', 'Crack', 'Futbolista', 'Conocedor'];
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    
    return `${adj}${noun}${number}`;
  }
}

// ================================
// INICIALIZACIÓN GLOBAL
// ================================

// Crear instancia global del servicio
window.firebaseService = new FirebaseService();

// También crear alias más corto
window.fbService = window.firebaseService;

console.log('🔥 Firebase Service cargado - Usa window.firebaseService o window.fbService');

// Esperar a que el DOM esté listo y luego inicializar
    document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM listo - Firebase Service disponible');
    });