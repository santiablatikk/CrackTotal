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

    rankingBody.innerHTML = '<tr><td colspan="7">Cargando ranking...</td></tr>'; // Ajustado colspan a 7

    try {
        const usersRef = collection(db, "users");
        // Consulta: Ordenar por rendimiento (Victorias DESC, Puntaje DESC, Derrotas ASC, Errores ASC)
        const q = query(usersRef, 
                        orderBy("wins", "desc"), 
                        orderBy("totalScore", "desc"), 
                        orderBy("totalLosses", "asc"), // Añadido totalLosses a la ordenación explícita
                        orderBy("totalErrors", "asc"), // totalErrors ya estaba
                        limit(50)); // Límite a 50 como indica el H2

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log("Ranking data received/updated");
            rankingBody.innerHTML = '';

            if (querySnapshot.empty) {
                rankingBody.innerHTML = '<tr><td colspan="7">Aún no hay datos en el ranking. ¡Juega una partida!</td></tr>'; // Ajustado colspan a 7
                return;
            }

            let position = 1;
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const row = document.createElement('tr');

                const playerName = userData.displayName || 'Jugador Anónimo';
                const totalScore = userData.totalScore || 0;
                const matchesPlayed = userData.matchesPlayed || 0;
                const wins = userData.wins || 0;
                const totalLosses = userData.totalLosses || 0;
                
                const totalCorrectAnswers = userData.totalCorrectAnswers || 0;
                const totalIncorrectAnswers = userData.totalIncorrectAnswers || 0;
                const totalAnswered = totalCorrectAnswers + totalIncorrectAnswers;
                const averageAccuracy = totalAnswered > 0 ? Math.round((totalCorrectAnswers / totalAnswered) * 100) : 0;

                row.innerHTML = `
                    <td class="rank-cell">${position}</td>
                    <td class="player-cell">${playerName}</td>
                    <td class="score-cell">${totalScore}</td>
                    <td class="matches-cell">${matchesPlayed}</td>
                    <td class="wins-cell">${wins}</td>
                    <td class="losses-cell">${totalLosses}</td>
                    <td class="accuracy-cell">${averageAccuracy}%</td>
                `;
                rankingBody.appendChild(row);
                position++;
            });
        }, (error) => {
            console.error("Error al escuchar el ranking: ", error);
            rankingBody.innerHTML = '<tr><td colspan="7">Error al cargar el ranking en tiempo real. Inténtalo de nuevo más tarde.</td></tr>'; // Ajustado colspan a 7
        });

    } catch (error) {
        console.error("Error al configurar la consulta del ranking: ", error);
        rankingBody.innerHTML = '<tr><td colspan="7">Error al configurar la carga del ranking.</td></tr>'; // Ajustado colspan a 7
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
        if (rankingBody) rankingBody.innerHTML = '<tr><td colspan="7">Error de conexión con la base de datos.</td></tr>'; // (asumiendo 7 cols)
        if (historyList) historyList.innerHTML = '<p>Error de conexión con la base de datos.</p>';
    }
}); 

// --- Función auxiliar para formatear tiempo (puede ser null) ---
// function formatFirestoreTime(totalSeconds) {
//     if (totalSeconds === null || typeof totalSeconds === 'undefined' || totalSeconds <= 0) {
//         return '--:--';
//     }
//     const minutes = Math.floor(totalSeconds / 60);
//     const seconds = totalSeconds % 60;
//     return `${minutes}:${seconds.toString().padStart(2, '0')}`;
// } 