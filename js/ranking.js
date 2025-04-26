// Importar funciones de Firestore y la instancia db inicializada
import { db } from './firebase-init.js';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot, // <--- Para el ranking en tiempo real
    getDocs // <--- AÑADIR ESTA LÍNEA para el historial
    // Timestamp // Timestamp no se usa directamente en el ranking
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log('Ranking script loaded and Firebase initialized');

// --- Elementos del DOM ---
const rankingBody = document.getElementById('ranking-body');
// const historyList = document.getElementById('history-list'); // El historial no necesita ser en tiempo real por ahora

// --- Función para formatear Timestamps de Firebase (Se mantiene por si se usa en historial u otro lado) ---
function formatFirebaseTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp || !firebaseTimestamp.toDate) return 'Fecha desconocida'; // Added check for toDate method
    // Convertir a objeto Date de JavaScript
    const date = firebaseTimestamp.toDate();
    // Formatear a un string legible (puedes personalizar el formato)
    return date.toLocaleString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// --- Cargar Ranking Global (AHORA EN TIEMPO REAL) ---
function listenToRanking() { // Renamed function for clarity
    if (!rankingBody) {
        console.error('Error: Elemento ranking-body no encontrado.');
        return;
    }
    if (!db) { // Verificar si la inicialización de DB falló
        console.error("Error: Firestore DB no está inicializado. Ranking no se puede cargar.");
        rankingBody.innerHTML = '<tr><td colspan="5">Error: No se pudo conectar a la base de datos.</td></tr>';
        return;
    }

    rankingBody.innerHTML = '<tr><td colspan="5">Cargando ranking...</td></tr>'; // Mensaje inicial

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("totalScore", "desc"), limit(100));

        // Usar onSnapshot para escuchar cambios en tiempo real
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            rankingBody.innerHTML = ''; // Limpiar tabla antes de volver a dibujar
            let position = 1;

            if (querySnapshot.empty) {
                rankingBody.innerHTML = '<tr><td colspan="5">Aún no hay datos en el ranking. ¡Juega una partida!</td></tr>';
                return;
            }

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
             // Ajustar colspan del mensaje de carga/error en función de las columnas visibles (para móvil)
            checkColspan();

        }, (error) => {
            // Manejo de errores de onSnapshot
            console.error("Error al escuchar el ranking: ", error);
            rankingBody.innerHTML = '<tr><td colspan="5">Error al cargar el ranking en tiempo real. Inténtalo de nuevo más tarde.</td></tr>';
             checkColspan(); // Ajustar colspan también en caso de error
        });

        // Opcional: guardar la función 'unsubscribe' si necesitas dejar de escuchar más tarde
        // window.unsubscribeRanking = unsubscribe;

    } catch (error) {
        console.error("Error al configurar el listener del ranking: ", error);
        rankingBody.innerHTML = '<tr><td colspan="5">Error al configurar la carga del ranking.</td></tr>';
         checkColspan();
    }
}

// --- Cargar Historial de Partidas (se mantiene con getDocs, no necesita tiempo real) ---
async function loadHistory() {
    const historyList = document.getElementById('history-list'); // Obtener aquí ya que no es global
    if (!historyList) {
        console.error('Error: Elemento history-list no encontrado.');
        return;
    }
    if (!db) { // Verificar si la inicialización de DB falló
        console.error("Error: Firestore DB no está inicializado. Historial no se puede cargar.");
        historyList.innerHTML = '<p>Error: No se pudo conectar a la base de datos.</p>';
        return;
    }

    historyList.innerHTML = '<p>Cargando historial...</p>'; // Mensaje de carga

    try {
        const matchesRef = collection(db, "matches");
        const q = query(matchesRef, orderBy("timestamp", "desc"), limit(20));

        const querySnapshot = await getDocs(q); // Usamos getDocs aquí, es suficiente

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

// Función auxiliar para ajustar colspan en mensajes de error/carga (considerando CSS móvil)
function checkColspan() {
    if (!rankingBody) return;
    const td = rankingBody.querySelector('td[colspan]');
    if (td) {
        // Si la ventana es pequeña (ej. < 768px), asumimos que se ocultan 2 columnas
        const colspanValue = window.innerWidth < 768 ? 3 : 5;
        td.setAttribute('colspan', colspanValue);
    }
}

// --- Cargar datos al iniciar la página ---
document.addEventListener('DOMContentLoaded', () => {
    listenToRanking(); // <--- Llamar a la nueva función con listener
    loadHistory(); // Cargar historial una vez

    // Reajustar colspan si la ventana cambia de tamaño (para mensajes)
    window.addEventListener('resize', checkColspan);
}); 