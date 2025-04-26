// Importar funciones de Firestore y la instancia db inicializada
import { db } from './firebase-init.js';
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    Timestamp, // Importar Timestamp para formatear fechas
    onSnapshot // Añadido para escuchar cambios en tiempo real
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log('Ranking script loaded and Firebase initialized');

// --- Elementos del DOM ---
const rankingBody = document.getElementById('ranking-body');
const historyList = document.getElementById('history-list');

// --- Variables para intervalos y tiempo ---
let autoRefreshInterval = null;
const REFRESH_INTERVAL = 60000; // Actualizar cada 60 segundos (ajustar según necesidades)
let rankingUnsubscribe = null; // Para cancelar la escucha en tiempo real
let historyUnsubscribe = null; // Para cancelar la escucha en tiempo real

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

// --- Cargar Ranking Global en Tiempo Real ---
function setupRankingListener() {
    if (rankingUnsubscribe) {
        rankingUnsubscribe(); // Cancelar escucha anterior si existe
    }

    if (!rankingBody) {
        console.error('Error: Elemento ranking-body no encontrado.');
        return;
    }

    rankingBody.innerHTML = '<tr><td colspan="5">Cargando ranking...</td></tr>'; // Mensaje de carga

    try {
        // Crear la consulta a la colección 'users', ordenando por 'totalScore' descendente, limitando a 100
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("totalScore", "desc"), limit(100));

        // Configurar escucha en tiempo real
        rankingUnsubscribe = onSnapshot(q, (querySnapshot) => {
            if (querySnapshot.empty) {
                rankingBody.innerHTML = '<tr><td colspan="5">Aún no hay datos en el ranking. ¡Juega una partida!</td></tr>';
                return;
            }

            rankingBody.innerHTML = ''; // Limpiar mensaje de carga/datos anteriores
            let position = 1;

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const row = document.createElement('tr');
                
                // Añadir clases para destacar posiciones (1º, 2º, 3º)
                if (position <= 3) {
                    row.classList.add(`rank-position-${position}`);
                }

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
            
            console.log('Ranking actualizado en tiempo real');
        }, (error) => {
            console.error("Error en la escucha del ranking:", error);
            rankingBody.innerHTML = '<tr><td colspan="5">Error al cargar el ranking. Inténtalo de nuevo más tarde.</td></tr>';
        });

    } catch (error) {
        console.error("Error al configurar escucha del ranking:", error);
        rankingBody.innerHTML = '<tr><td colspan="5">Error al cargar el ranking. Inténtalo de nuevo más tarde.</td></tr>';
    }
}

// --- Cargar Historial de Partidas en Tiempo Real ---
function setupHistoryListener() {
    if (historyUnsubscribe) {
        historyUnsubscribe(); // Cancelar escucha anterior si existe
    }

    if (!historyList) {
        console.error('Error: Elemento history-list no encontrado.');
        return;
    }

    historyList.innerHTML = '<p>Cargando historial...</p>'; // Mensaje de carga

    try {
        // Crear la consulta a la colección 'matches', ordenando por 'timestamp' descendente, limitando a 20
        const matchesRef = collection(db, "matches");
        const q = query(matchesRef, orderBy("timestamp", "desc"), limit(20));

        // Configurar escucha en tiempo real
        historyUnsubscribe = onSnapshot(q, (querySnapshot) => {
            if (querySnapshot.empty) {
                historyList.innerHTML = '<p>No hay partidas registradas en el historial.</p>';
                return;
            }

            historyList.innerHTML = ''; // Limpiar mensaje de carga/datos anteriores

            querySnapshot.forEach((doc) => {
                const matchData = doc.data();
                const matchEntry = document.createElement('div');
                matchEntry.classList.add('match-entry');

                // Añadir clase según resultado (victoria, derrota, timeout)
                if (matchData.result) {
                    matchEntry.classList.add(`result-${matchData.result}`);
                }

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
                        <!-- Tipo de partida o modo de juego -->
                        <span class="match-game-type">${matchData.gameType || 'Pasala Che'}</span>
                    </div>
                    ${playersHtml}
                `;
                historyList.appendChild(matchEntry);
            });
            
            console.log('Historial actualizado en tiempo real');
        }, (error) => {
            console.error("Error en la escucha del historial:", error);
            historyList.innerHTML = '<p>Error al cargar el historial. Inténtalo de nuevo más tarde.</p>';
        });

    } catch (error) {
        console.error("Error al configurar escucha del historial:", error);
        historyList.innerHTML = '<p>Error al cargar el historial. Inténtalo de nuevo más tarde.</p>';
    }
}

// --- Función para actualizar manualmente ---
function refreshData() {
    console.log('Actualizando datos manualmente...');
    // Desactivar y volver a activar las escuchas
    if (rankingUnsubscribe) rankingUnsubscribe();
    if (historyUnsubscribe) historyUnsubscribe();
    
    // Configurar nuevas escuchas
    setupRankingListener();
    setupHistoryListener();
    
    // Mostrar feedback al usuario
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        const originalText = refreshButton.innerHTML;
        refreshButton.innerHTML = '<i class="fas fa-check"></i> ¡Actualizado!';
        refreshButton.disabled = true;
        
        // Restaurar estado original después de 2 segundos
        setTimeout(() => {
            refreshButton.innerHTML = originalText;
            refreshButton.disabled = false;
        }, 2000);
    }
}

// --- Detener escuchas cuando se abandona la página ---
function cleanupListeners() {
    console.log('Deteniendo escuchas...');
    if (rankingUnsubscribe) rankingUnsubscribe();
    if (historyUnsubscribe) historyUnsubscribe();
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
}

// --- Añadir botón de actualización manual --- 
function addRefreshButton() {
    // Comprobar si ya existe un botón de actualización
    if (document.getElementById('refreshButton')) return;

    // Crear el botón
    const refreshButton = document.createElement('button');
    refreshButton.id = 'refreshButton';
    refreshButton.className = 'refresh-button';
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar datos';
    refreshButton.addEventListener('click', refreshData);
    
    // Insertar el botón al principio de .content-container
    const contentContainer = document.querySelector('.content-container');
    if (contentContainer) {
        contentContainer.insertBefore(refreshButton, contentContainer.firstChild);
    }
}

// --- Cargar datos al iniciar la página ---
document.addEventListener('DOMContentLoaded', () => {
    // Añadir botón de actualización
    addRefreshButton();
    
    // Iniciar escuchas en tiempo real
    setupRankingListener();
    setupHistoryListener();
    
    // Configurar intervalo para actualización periódica (opcional)
    autoRefreshInterval = setInterval(() => {
        console.log('Actualización automática...');
        refreshData();
    }, REFRESH_INTERVAL);
    
    // Limpiar escuchas al abandonar la página
    window.addEventListener('beforeunload', cleanupListeners);
});

// Exponer función de actualización global
window.refreshRankingData = refreshData; 