// Función de inicialización del ranking mejorada
window.initializeRanking = function(gameType, limit = 15) {
    console.log(`🎯 Inicializando ranking para ${gameType}...`);
    
    if (!window.rankingHelper) {
        console.error('❌ RankingHelper no disponible');
        return;
    }
    
    try {
        // Inicializar elementos
        window.rankingHelper.initializeElements();
        
        // Cargar ranking global
        window.rankingHelper.loadGameRanking(gameType, limit);
        
        // Cargar historial de TODOS los jugadores por defecto
        // Esto asegura que se vean las partidas de Cami inmediatamente
        window.rankingHelper.loadUserHistory(gameType, 20, 'history-list', true);
        
        console.log('✅ Ranking inicializado exitosamente');
        
    } catch (error) {
        console.error('❌ Error inicializando ranking:', error);
    }
}; 