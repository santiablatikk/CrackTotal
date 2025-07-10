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
        totalQuestions: matchData.totalQuestions || 0,
        accuracy: matchData.accuracy || 0,
        duration: matchData.duration || 0,
        
        // Metadatos
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
  // MÉTODOS AUXILIARES
  // ================================

  // Verificar si el servicio está listo
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