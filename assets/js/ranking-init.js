// Inicialización del ranking (usada por ranking.html / ranking-init)
window.initializeRanking = function (gameType, limit = 15) {
    if (!window.rankingHelper) {
        console.error('RankingHelper no disponible');
        return;
    }

    try {
        window.rankingHelper.initializeElements();
        window.rankingHelper.loadGameRanking(gameType, limit);
        window.rankingHelper.loadUserHistory(gameType, 20, 'history-list', true);
    } catch (error) {
        console.error('Error inicializando ranking:', error);
    }
};
