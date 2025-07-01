// === SISTEMA FIREBASE UNIFICADO - CRACK TOTAL ===
console.log('🚀 Iniciando sistema Firebase unificado...');

// Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAwdop1FPttbvLj_lfdMqpGgDCV5GaUWf4",
    authDomain: "cracktotal-cd2e7.firebaseapp.com",
    projectId: "cracktotal-cd2e7",
    storageBucket: "cracktotal-cd2e7.firebasestorage.app",
    messagingSenderId: "210391454350",
    appId: "1:210391454350:web:ec36c626aca23e80562fdf",
    measurementId: "G-5XP3T1RTH7"
};

// Sistema unificado
window.CrackTotal = {
    db: null,
    auth: null,
    initialized: false,
    
    async init() {
        if (this.initialized) return true;
        
        try {
            if (!window.firebase) {
                console.error('❌ Firebase SDK no disponible');
                return false;
            }
            
            // Inicializar Firebase si no está inicializado
            if (!window.firebase.apps || window.firebase.apps.length === 0) {
                window.firebase.initializeApp(firebaseConfig);
            }
            
            this.db = window.firebase.firestore();
            this.auth = window.firebase.auth();
            
            // Autenticación anónima
            if (!this.auth.currentUser) {
                await this.auth.signInAnonymously();
            }
            
            this.initialized = true;
            console.log('✅ Firebase unificado inicializado');
            
            // Disparar evento
            window.dispatchEvent(new CustomEvent('crackTotalReady'));
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
            return false;
        }
    },
    
    getUserId() {
        let userId = localStorage.getItem('crackTotalUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('crackTotalUserId', userId);
        }
        return userId;
    },
    
    getUserName() {
        return localStorage.getItem('playerName') || 'Jugador Anónimo';
    },
    
    async getRanking(gameType = 'all', limit = 15) {
        if (!this.db) {
            await this.init();
            if (!this.db) return [];
        }
        
        try {
            console.log(`📊 Obteniendo ranking para ${gameType}...`);
            
            // Obtener todas las partidas (evita problemas de índices)
            const matchesSnapshot = await this.db.collection('matches').get();
            
            if (matchesSnapshot.empty) {
                console.log('📭 No hay partidas registradas');
                return [];
            }
            
            const playerStats = {};
            
            // Procesar cada partida
            matchesSnapshot.forEach(doc => {
                const match = doc.data();
                
                // Verificar estructura de datos
                if (match.players && Array.isArray(match.players)) {
                    match.players.forEach(player => {
                        const playerId = player.displayName || player.playerId || 'Anónimo';
                        
                        if (!playerStats[playerId]) {
                            playerStats[playerId] = {
                                id: playerId,
                                displayName: playerId,
                                totalScore: 0,
                                played: 0,
                                wins: 0,
                                losses: 0,
                                totalAnswers: 0,
                                correctAnswers: 0,
                                lastPlayed: null
                            };
                        }
                        
                        const stats = playerStats[playerId];
                        
                        // Acumular estadísticas
                        stats.totalScore += (player.score || 0);
                        stats.played += 1;
                        stats.totalAnswers += (player.totalAnswers || 0);
                        stats.correctAnswers += (player.correctAnswers || 0);
                        
                        // Determinar victoria/derrota
                        if (match.result === 'victory' || match.result === 'win' || player.result === 'victory') {
                            stats.wins += 1;
                        } else {
                            stats.losses += 1;
                        }
                        
                        // Actualizar última partida
                        if (match.timestamp) {
                            const matchDate = match.timestamp.toDate ? match.timestamp.toDate() : new Date(match.timestamp);
                            if (!stats.lastPlayed || matchDate > stats.lastPlayed) {
                                stats.lastPlayed = matchDate;
                            }
                        }
                    });
                }
            });
            
            // Convertir a array y calcular métricas
            const ranking = Object.values(playerStats)
                .filter(player => player.played > 0)
                .map(player => ({
                    ...player,
                    avgScore: Math.round(player.totalScore / player.played),
                    winRate: Math.round((player.wins / player.played) * 100),
                    accuracy: player.totalAnswers > 0 ? 
                        Math.round((player.correctAnswers / player.totalAnswers) * 100) : 0
                }))
                .sort((a, b) => {
                    // Ordenar por: winRate > avgScore > totalScore
                    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
                    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
                    return b.totalScore - a.totalScore;
                })
                .slice(0, limit);
            
            console.log(`✅ Ranking procesado: ${ranking.length} jugadores`);
            return ranking;
            
        } catch (error) {
            console.error('❌ Error obteniendo ranking:', error);
            return [];
        }
    },
    
    async getHistory(gameType = 'all', limit = 20) {
        if (!this.db) {
            await this.init();
            if (!this.db) return [];
        }
        
        try {
            console.log(`📜 Obteniendo historial para ${gameType}...`);
            
            let query = this.db.collection('matches')
                .orderBy('timestamp', 'desc')
                .limit(limit);
            
            // Filtrar por tipo de juego si no es 'all'
            if (gameType && gameType !== 'all') {
                query = query.where('gameType', '==', gameType);
            }
            
            const matchesSnapshot = await query.get();
            
            const matches = [];
            
            matchesSnapshot.forEach(doc => {
                const match = doc.data();
                
                // Formatear la partida
                const formattedMatch = {
                    id: doc.id,
                    gameType: match.gameType || match.gameMode || 'pasalache',
                    result: match.result || 'defeat',
                    timestamp: match.timestamp,
                    players: match.players || [],
                    duration: match.timeSpent || match.duration || 0,
                    date: match.timestamp ? 
                        (match.timestamp.toDate ? 
                            match.timestamp.toDate().toLocaleDateString() : 
                            new Date(match.timestamp).toLocaleDateString()) : 
                        'Sin fecha'
                };
                
                matches.push(formattedMatch);
            });
            
            console.log(`✅ Historial obtenido para ${gameType}: ${matches.length} partidas`);
            return matches;
            
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            return [];
        }
    },
    
    async saveGameResult(gameType, gameData) {
        if (!this.db) {
            await this.init();
            if (!this.db) return false;
        }
        
        try {
            const userId = this.getUserId();
            const userName = this.getUserName();
            
            // Guardar partida
            await this.db.collection('matches').add({
                gameType: gameType,
                playerName: userName,
                playerUid: userId,
                timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
                ...gameData
            });
            
            console.log(`✅ Partida guardada: ${gameType}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error guardando partida:', error);
            return false;
        }
    }
};

// Funciones globales para compatibilidad
window.getRanking = function(gameType, limit) {
    return window.CrackTotal.getRanking(gameType, limit);
};

window.getHistory = function(gameType, limit) {
    return window.CrackTotal.getHistory(gameType, limit);
};

window.getSimpleRanking = function(gameType, limit) {
    return window.CrackTotal.getRanking(gameType, limit);
};

window.getSimpleHistory = function(gameType, limit) {
    return window.CrackTotal.getHistory(gameType, limit);
};

window.saveGameResult = function(gameType, gameData) {
    return window.CrackTotal.saveGameResult(gameType, gameData);
};

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.CrackTotal.init().then(initialized => {
            if (initialized) {
                console.log('🎉 CrackTotal listo para usar');
            } else {
                console.error('💥 Error inicializando CrackTotal');
            }
        });
    }, 1000);
});

console.log('✅ Sistema Firebase unificado cargado'); 