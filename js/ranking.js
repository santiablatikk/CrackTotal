// Importar funciones de Firestore y la instancia db inicializada
import { db } from './firebase-init.js';
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    Timestamp // Importar Timestamp para formatear fechas
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log('Ranking script loaded and Firebase initialized');

// --- Elementos del DOM ---
const rankingBody = document.getElementById('ranking-body');
const historyList = document.getElementById('history-list');

// --- Función para formatear Timestamps de Firebase ---
function formatFirebaseTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp) return 'Fecha desconocida';
    // Convertir a objeto Date de JavaScript
    const date = firebaseTimestamp.toDate();
    // Formatear a un string legible (puedes personalizar el formato)
    return date.toLocaleString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// --- Cargar Ranking Global ---
async function loadRanking() {
    if (!rankingBody) {
        console.error('Error: Elemento ranking-body no encontrado.');
        return;
    }

    rankingBody.innerHTML = '<tr><td colspan="5">Cargando ranking...</td></tr>'; // Mensaje de carga

    try {
        // Crear la consulta a la colección 'users', ordenando por 'totalScore' descendente, limitando a 100
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("totalScore", "desc"), limit(100));

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            rankingBody.innerHTML = '<tr><td colspan="5">Aún no hay datos en el ranking. ¡Juega una partida!</td></tr>';
            return;
        }

        rankingBody.innerHTML = ''; // Limpiar mensaje de carga/datos anteriores
        let position = 1;

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const row = document.createElement('tr');

            // Añadir clases para estilo si es necesario (ej. basado en posición)

            row.innerHTML = `
                <td>${position}</td>
                <td class="player-name-rank">${userData.displayName || 'Jugador Anónimo'}</td>
                <td class="score-rank">${userData.totalScore || 0}</td>
                <td>${userData.matchesPlayed || 0}</td>
                <td>${userData.wins || 0}</td>
            `;
            rankingBody.appendChild(row);
            position++;
        });

    } catch (error) {
        console.error("Error al cargar el ranking: ", error);
        rankingBody.innerHTML = '<tr><td colspan="5">Error al cargar el ranking. Inténtalo de nuevo más tarde.</td></tr>';
    }
}

// --- Cargar Historial de Partidas ---
async function loadHistory() {
    if (!historyList) {
        console.error('Error: Elemento history-list no encontrado.');
        return;
    }

    historyList.innerHTML = '<p>Cargando historial...</p>'; // Mensaje de carga

    try {
        // Crear la consulta a la colección 'matches', ordenando por 'timestamp' descendente, limitando a 20
        const matchesRef = collection(db, "matches");
        const q = query(matchesRef, orderBy("timestamp", "desc"), limit(20));

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            historyList.innerHTML = '<p>No hay partidas registradas en el historial.</p>';
            return;
        }

        historyList.innerHTML = ''; // Limpiar mensaje de carga/datos anteriores

        querySnapshot.forEach((doc) => {
            const matchData = doc.data();
            const matchEntry = document.createElement('div');
            matchEntry.classList.add('match-entry');

            let playersHtml = '<div class="match-players">';
            if (matchData.players && Array.isArray(matchData.players)) {
                matchData.players.forEach(player => {
                    const isWinner = matchData.winnerUserId === player.userId;
                    playersHtml += `
                        <div class="player-match-info ${isWinner ? 'winner' : ''}">
                            <strong>${player.displayName || 'Jugador Anónimo'}</strong>
                            marcó <span class="score">${player.score !== undefined ? player.score : 'N/A'}</span> puntos ${isWinner ? '(Ganador)' : ''}
                        </div>
                    `;
                });
            } else {
                playersHtml += '<p>Datos de jugadores no disponibles.</p>';
            }
            playersHtml += '</div>';

            matchEntry.innerHTML = `
                <div class="match-header">
                    <span class="match-date">
                        <i class="fas fa-calendar-alt"></i>
                        ${formatFirebaseTimestamp(matchData.timestamp)}
                     </span>
                    <!-- Puedes añadir aquí info del ganador si no está en la lista de jugadores -->
                </div>
                ${playersHtml}
            `;
            historyList.appendChild(matchEntry);
        });

    } catch (error) {
        console.error("Error al cargar el historial: ", error);
        historyList.innerHTML = '<p>Error al cargar el historial. Inténtalo de nuevo más tarde.</p>';
    }
}

// --- Cargar datos al iniciar la página ---
document.addEventListener('DOMContentLoaded', () => {
    loadRanking();
    loadHistory();
}); 