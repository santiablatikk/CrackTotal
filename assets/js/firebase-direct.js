// Sistema DIRECTO - Máxima simplicidad
console.log('🔥 Sistema directo iniciando...');

window.loadDirectRanking = async function(gameType) {
    console.log('📊 Cargando ranking directo...');
    
    try {
        // Verificar Firebase
        if (!window.firebase || !window.firebase.firestore) {
            console.log('❌ Firebase no disponible');
            return [];
        }
        
        const db = window.firebase.firestore();
        
        // Obtener TODAS las partidas de forma directa
        console.log('🔍 Obteniendo partidas...');
        const snapshot = await db.collection('matches').get();
        
        console.log(`📋 Partidas encontradas: ${snapshot.size}`);
        
        const playerStats = {};
        
        // Procesar cada partida
        snapshot.forEach(doc => {
            const match = doc.data();
            console.log('Procesando partida:', match);
            
            if (match.players && Array.isArray(match.players)) {
                match.players.forEach(player => {
                    const name = player.displayName || player.playerId || 'Anónimo';
                    
                    if (!playerStats[name]) {
                        playerStats[name] = {
                            name: name,
                            totalScore: 0,
                            played: 0,
                            wins: 0
                        };
                    }
                    
                    playerStats[name].totalScore += (player.score || 0);
                    playerStats[name].played += 1;
                    
                    if (match.result === 'victory') {
                        playerStats[name].wins += 1;
                    }
                });
            }
        });
        
        // Convertir a array y ordenar
        const ranking = Object.values(playerStats)
            .filter(p => p.played > 0)
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 15);
            
        console.log('✅ Ranking procesado:', ranking);
        return ranking;
        
    } catch (error) {
        console.error('❌ Error:', error);
        return [];
    }
};

window.loadDirectHistory = async function(gameType) {
    console.log('📜 Cargando historial directo...');
    
    try {
        if (!window.firebase || !window.firebase.firestore) {
            return [];
        }
        
        const db = window.firebase.firestore();
        const snapshot = await db.collection('matches')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();
        
        const matches = [];
        snapshot.forEach(doc => {
            const match = doc.data();
            const player = match.players && match.players[0] ? match.players[0] : {};
            
            matches.push({
                playerName: player.displayName || 'Jugador',
                score: player.score || 0,
                result: match.result || 'defeat',
                date: match.timestamp ? 
                    new Date(match.timestamp.toDate()).toLocaleDateString() : 
                    'Sin fecha'
            });
        });
        
        console.log('✅ Historial procesado:', matches);
        return matches;
        
    } catch (error) {
        console.error('❌ Error historial:', error);
        return [];
    }
};

console.log('✅ Sistema directo listo'); 