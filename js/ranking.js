// Importar funciones de Firestore y la instancia db inicializada
import { db } from './firebase-init.js';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot, // <--- ADDED: For real-time updates
    Timestamp // Importar Timestamp para formatear fechas
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log('Ranking script loaded and Firebase initialized for real-time updates');

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

// --- Cargar Ranking Global (AHORA CON onSnapshot) ---
function loadRanking() {
    if (!rankingBody) {
        console.error('Error: Elemento ranking-body no encontrado.');
        return;
    }

    rankingBody.innerHTML = '<tr><td colspan="5">Cargando ranking...</td></tr>'; // Mensaje inicial

    try {
        const usersRef = collection(db, "users");
        // NUEVA Consulta: Ordenar por rendimiento (Victorias DESC, Aciertos DESC, Derrotas ASC, Errores ASC)
        const q = query(usersRef, 
                        orderBy("wins", "desc"), 
                        orderBy("totalScore", "desc"), 
                        orderBy("totalLosses", "asc"),
                        orderBy("totalErrors", "asc"),
                        limit(100));

        // Usar onSnapshot en lugar de getDocs
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log("Ranking data received/updated"); // Log para ver actualizaciones
            rankingBody.innerHTML = ''; // Limpiar tabla en cada actualización

        if (querySnapshot.empty) {
            rankingBody.innerHTML = '<tr><td colspan="5">Aún no hay datos en el ranking. ¡Juega una partida!</td></tr>';
            return;
        }

        let position = 1;
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${position}</td>
                <td class="player-name-rank">${userData.displayName || 'Jugador Anónimo'}</td>
                <td>${userData.wins || 0}</td>
                <td>${userData.totalLosses || 0}</td>
                <td>${userData.matchesPlayed || 0}</td>
                <td class="score-rank">${userData.totalScore || 0}</td>
                <td>${userData.totalErrors || 0}</td>
                <td>${userData.totalPasses || 0}</td>
            `;
            rankingBody.appendChild(row);
            position++;
        });
        }, (error) => {
            // Manejo de errores del listener
            console.error("Error al escuchar el ranking: ", error);
            rankingBody.innerHTML = '<tr><td colspan="5">Error al cargar el ranking en tiempo real. Inténtalo de nuevo más tarde.</td></tr>';
        });

        // Podrías guardar 'unsubscribe' si necesitaras detener el listener en algún momento,
        // pero para una página de ranking generalmente quieres que siga escuchando.

    } catch (error) {
        // Error inicial al configurar la consulta (raro)
        console.error("Error al configurar la consulta del ranking: ", error);
        rankingBody.innerHTML = '<tr><td colspan="5">Error al configurar la carga del ranking.</td></tr>';
    }
}

// --- Cargar Historial de Partidas (AHORA CON onSnapshot) ---
function loadHistory() {
    if (!historyList) {
        console.error('Error: Elemento history-list no encontrado.');
        return;
    }

    historyList.innerHTML = '<p>Cargando historial...</p>'; // Mensaje inicial

    try {
        const matchesRef = collection(db, "matches");
        const q = query(matchesRef, orderBy("timestamp", "desc"), limit(20));

        // Usar onSnapshot en lugar de getDocs
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log("History data received/updated"); // Log para ver actualizaciones
            historyList.innerHTML = ''; // Limpiar lista en cada actualización

        if (querySnapshot.empty) {
            historyList.innerHTML = '<p>No hay partidas registradas en el historial.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const matchData = doc.data();
            const matchEntry = document.createElement('div');
            // Añadir clase nueva para el estilo tarjeta
            matchEntry.classList.add('match-entry', 'match-card'); 

            // --- Preparar datos adicionales (sin cambios) ---
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
                case 'timeout':
                    resultIcon = '<i class="fas fa-clock result-icon"></i>';
                    resultText = 'Tiempo Agotado';
                    resultClass = 'timeout';
                    break;
                default:
                     resultIcon = '<i class="fas fa-question-circle result-icon"></i>';
            }

            let difficultyText = (matchData.difficulty || 'normal').charAt(0).toUpperCase() + (matchData.difficulty || 'normal').slice(1);
            
            let timeFormatted = 'N/A';
            if (typeof matchData.timeSpent === 'number') {
                const minutes = Math.floor(matchData.timeSpent / 60);
                const seconds = matchData.timeSpent % 60;
                timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }

            // CORREGIDO: Acceder a los errores dentro del primer jugador
            let errorsValue = 'N/A';
            if (matchData.players && Array.isArray(matchData.players) && matchData.players.length > 0 && matchData.players[0].errors !== undefined) {
                errorsValue = matchData.players[0].errors;
            }
            const errorsText = errorsValue;
            const passesText = matchData.passes !== undefined ? matchData.passes : 'N/A';
            // --- Fin Preparar datos adicionales ---


            let playerInfoHtml = '';
            if (matchData.players && Array.isArray(matchData.players)) {
                // Asumimos un solo jugador para PasalaChe por ahora
                const player = matchData.players[0]; 
                if(player) {
                    playerInfoHtml = `
                        <div class="player-name">${player.displayName || 'Jugador Anónimo'}</div>
                        <div class="player-score">
                            <span class="score-value">${player.score !== undefined ? player.score : 'N/A'}</span> Aciertos
                        </div>
                    `;
                } else {
                     playerInfoHtml = '<p>Datos de jugador no disponibles.</p>';
                }
            } else {
                playerInfoHtml = '<p>Datos de jugadores no disponibles.</p>';
            }

            // --- NUEVA Estructura HTML para matchEntry (Estilo Tarjeta) --- 
            matchEntry.innerHTML = `
                <div class="match-card-header">
                    <span class="match-date">
                        <i class="far fa-calendar-alt"></i> <!-- Icono diferente -->
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
                    <span class="detail-item" title="Dificultad">
                        <i class="fas fa-cogs"></i> ${difficultyText} <!-- Icono diferente -->
                    </span>
                    <span class="detail-item" title="Tiempo Empleado">
                        <i class="far fa-clock"></i> ${timeFormatted} <!-- Icono diferente -->
                    </span>
                     <span class="detail-item error-count" title="Errores">
                        <i class="fas fa-times"></i> ${errorsText} <!-- Cambiado icono a fa-times -->
                     </span>
                     <span class="detail-item" title="Pasadas">
                        <i class="fas fa-forward"></i> ${passesText} <!-- Añadido pases -->
                     </span>
                </div>
            `;
            // --- Fin NUEVA Estructura HTML --- 

            historyList.appendChild(matchEntry);
        });
        }, (error) => {
            // Manejo de errores del listener
            console.error("Error al escuchar el historial: ", error);
            historyList.innerHTML = '<p>Error al cargar el historial en tiempo real. Inténtalo de nuevo más tarde.</p>';
        });

        // Podrías guardar 'unsubscribe' si fuera necesario detener el listener.

    } catch (error) {
        // Error inicial al configurar la consulta (raro)
        console.error("Error al configurar la consulta del historial: ", error);
        historyList.innerHTML = '<p>Error al configurar la carga del historial.</p>';
    }
}

// --- Cargar datos al iniciar la página --- (Sin cambios, llama a las funciones que AHORA configuran listeners)
document.addEventListener('DOMContentLoaded', () => {
    // Verificar que db esté inicializado correctamente
    if (db) {
    loadRanking();
    loadHistory();
    } else {
        console.error("Firestore no está inicializado. No se puede cargar el ranking ni el historial.");
        // Podrías mostrar mensajes de error en la UI aquí también si db es null
        if (rankingBody) rankingBody.innerHTML = '<tr><td colspan="5">Error de conexión con la base de datos.</td></tr>';
        if (historyList) historyList.innerHTML = '<p>Error de conexión con la base de datos.</p>';
    }
}); 