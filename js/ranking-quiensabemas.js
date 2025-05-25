// Importar funciones de Firestore y la instancia db inicializada
import { db } from './firebase-init.js';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    where,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log('Ranking Quién Sabe Más script loaded and Firebase initialized for real-time updates');

// --- Elementos del DOM ---
const rankingBody = document.getElementById('ranking-body');
const historyList = document.getElementById('history-list');

// --- Función para formatear Timestamps de Firebase ---
function formatFirebaseTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp) return 'Fecha desconocida';
    const date = firebaseTimestamp.toDate();
    return date.toLocaleString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// --- Cargar Ranking Global de Quién Sabe Más ---
function loadRanking() {
    if (!rankingBody) {
        console.error('Error: Elemento ranking-body no encontrado.');
        return;
    }

    rankingBody.innerHTML = '<tr><td colspan="6">Cargando ranking...</td></tr>';

    try {
        const usersRef = collection(db, "users");
        // Consulta: Ordenar por Victorias de Quién Sabe Más DESC, luego Partidas Jugadas DESC
        const q = query(usersRef, 
                        orderBy("stats.quiensabemas.wins", "desc"), 
                        orderBy("stats.quiensabemas.played", "desc"), 
                        limit(50)); 

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log("Quién Sabe Más ranking data received/updated");
            rankingBody.innerHTML = '';

            if (querySnapshot.empty) {
                rankingBody.innerHTML = '<tr><td colspan="6">Aún no hay datos en el ranking. ¡Juega una partida!</td></tr>';
                return;
            }

            let position = 1;
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const row = document.createElement('tr');

                const playerName = userData.displayName || 'Jugador Anónimo';
                const totalScore = userData.stats?.quiensabemas?.score || 0;
                const matchesPlayed = userData.stats?.quiensabemas?.played || 0;
                const wins = userData.stats?.quiensabemas?.wins || 0;
                const losses = (matchesPlayed - wins) || 0;

                // Solo mostrar jugadores que han jugado al menos una partida de Quién Sabe Más
                if (matchesPlayed === 0) {
                    return; // Skip this user
                }

                const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

                row.innerHTML = `
                    <td class="rank-cell">${position}</td>
                    <td class="player-cell">${playerName}</td>
                    <td class="score-cell">${totalScore}</td>
                    <td class="matches-cell">${matchesPlayed}</td>
                    <td class="wins-cell">${wins}</td>
                    <td class="winrate-cell">${winRate}%</td>
                `;
                rankingBody.appendChild(row);
                position++;
            });
        }, (error) => {
            console.error("Error al escuchar el ranking de Quién Sabe Más: ", error);
            rankingBody.innerHTML = '<tr><td colspan="6">Error al cargar el ranking en tiempo real. Inténtalo de nuevo más tarde.</td></tr>';
        });

    } catch (error) {
        console.error("Error al configurar la consulta del ranking de Quién Sabe Más: ", error);
        rankingBody.innerHTML = '<tr><td colspan="6">Error al configurar la carga del ranking.</td></tr>';
    }
}

// --- Cargar Historial de Partidas de Quién Sabe Más ---
function loadHistory() {
    if (!historyList) {
        console.error('Error: Elemento history-list no encontrado.');
        return;
    }

    historyList.innerHTML = '<p>Cargando historial...</p>';

    try {
        const matchesRef = collection(db, "matches");
        const q = query(matchesRef, 
                       where("gameType", "==", "quiensabemas"),
                       orderBy("timestamp", "desc"), 
                       limit(20));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log("Quién Sabe Más history data received/updated");
            historyList.innerHTML = '';

            if (querySnapshot.empty) {
                historyList.innerHTML = '<p>No hay partidas de Quién Sabe Más registradas en el historial.</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const matchData = doc.data();
                const matchEntry = document.createElement('div');
                matchEntry.classList.add('match-entry', 'match-card'); 

                // Preparar datos adicionales
                let resultIcon = '';
                let resultText = matchData.result || 'Desconocido';
                let resultClass = '';
                
                switch(matchData.result) {
                    case 'victory':
                        resultIcon = '<i class="fas fa-trophy result-icon"></i>';
                        resultText = 'Victoria';
                        resultClass = 'victory';
                        break;
                    case 'defeat':
                        resultIcon = '<i class="fas fa-times-circle result-icon"></i>';
                        resultText = 'Derrota';
                        resultClass = 'defeat';
                        break;
                    case 'draw':
                        resultIcon = '<i class="fas fa-handshake result-icon"></i>';
                        resultText = 'Empate';
                        resultClass = 'timeout';
                        break;
                    default:
                        resultIcon = '<i class="fas fa-question-circle result-icon"></i>';
                }

                let playerInfoHtml = '';
                if (matchData.players && Array.isArray(matchData.players)) {
                    const player = matchData.players[0]; 
                    if(player) {
                        playerInfoHtml = `
                            <div class="player-name">${player.displayName || 'Jugador Anónimo'}</div>
                            <div class="player-score">
                                <span class="score-value">${player.score !== undefined ? player.score : 'N/A'}</span> Puntos
                            </div>
                        `;
                        
                        // Mostrar información del oponente si está disponible
                        if (matchData.players.length > 1) {
                            const opponent = matchData.players[1];
                            playerInfoHtml += `
                                <div class="opponent-info">
                                    vs ${opponent.displayName || 'Oponente'} (${opponent.score || 0} pts)
                                </div>
                            `;
                        }
                    } else {
                        playerInfoHtml = '<p>Datos de jugador no disponibles.</p>';
                    }
                } else {
                    playerInfoHtml = '<p>Datos de jugadores no disponibles.</p>';
                }

                matchEntry.innerHTML = `
                    <div class="match-card-header">
                        <span class="match-date">
                            <i class="far fa-calendar-alt"></i>
                            ${formatFirebaseTimestamp(matchData.timestamp)}
                        </span>
                        <span class="match-result-badge ${resultClass}">
                            ${resultIcon} ${resultText}
                        </span>
                    </div>
                    <div class="match-card-body">
                        ${playerInfoHtml}
                    </div>
                    <div class="match-card-footer">
                        <span class="detail-item" title="Juego">
                            <i class="fas fa-brain"></i> Quién Sabe Más
                        </span>
                        <span class="detail-item" title="Modo">
                            <i class="fas fa-users"></i> 1v1
                        </span>
                    </div>
                `;

                historyList.appendChild(matchEntry);
            });
        }, (error) => {
            console.error("Error al escuchar el historial de Quién Sabe Más: ", error);
            historyList.innerHTML = '<p>Error al cargar el historial en tiempo real. Inténtalo de nuevo más tarde.</p>';
        });

    } catch (error) {
        console.error("Error al configurar la consulta del historial de Quién Sabe Más: ", error);
        historyList.innerHTML = '<p>Error al configurar la carga del historial.</p>';
    }
}

// --- Cargar datos al iniciar la página ---
document.addEventListener('DOMContentLoaded', () => {
    if (db) {
        loadRanking();
        loadHistory();
    } else {
        console.error("Firestore no está inicializado. No se puede cargar el ranking ni el historial.");
        if (rankingBody) rankingBody.innerHTML = '<tr><td colspan="6">Error de conexión con la base de datos.</td></tr>';
        if (historyList) historyList.innerHTML = '<p>Error de conexión con la base de datos.</p>';
    }
}); 