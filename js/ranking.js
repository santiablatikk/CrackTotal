// Importar funciones de Firestore y la instancia db inicializada
import { db } from './firebase-init.js';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Verificar que la conexión a Firebase está activa
if (!db) {
    console.error("La base de datos Firebase no está inicializada correctamente");
    document.querySelector('#ranking-body').innerHTML = '<tr><td colspan="5">Error al conectar con la base de datos. Por favor, recarga la página.</td></tr>';
    document.querySelector('#history-list').innerHTML = '<p>Error al conectar con la base de datos. Por favor, recarga la página.</p>';
}

console.log('Ranking script loaded and Firebase initialized');

const rankingBody = document.getElementById('ranking-body');
const historyList = document.getElementById('history-list');

let autoRefreshInterval = null;
const REFRESH_INTERVAL = 60000;
let rankingUnsubscribe = null;
let historyUnsubscribe = null;

function formatFirebaseTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp) return 'Fecha desconocida';
    try {
        const date = firebaseTimestamp.toDate();
        return date.toLocaleString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (error) {
        console.error("Error al formatear timestamp:", error);
        return 'Fecha inválida';
    }
}

function setupRankingListener() {
    if (rankingUnsubscribe) rankingUnsubscribe();
    if (!rankingBody) return;

    rankingBody.innerHTML = '<tr><td colspan="5">Cargando ranking...</td></tr>';

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("totalScore", "desc"), limit(100));

        rankingUnsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                rankingBody.innerHTML = '<tr><td colspan="5">Aún no hay datos en el ranking. ¡Juega una partida!</td></tr>';
                return;
            }
            rankingBody.innerHTML = '';
            let pos = 1;
            snapshot.forEach(doc => {
                const u = doc.data();
                const row = document.createElement('tr');
                if (pos <= 3) row.classList.add(`rank-position-${pos}`);
                row.innerHTML = `
                    <td>${pos}</td>
                    <td class="player-name-rank">${u.displayName || 'Jugador Anónimo'}</td>
                    <td class="score-rank">${u.totalScore || 0}</td>
                    <td>${u.matchesPlayed || 0}</td>
                    <td>${u.wins || 0}</td>
                `;
                rankingBody.appendChild(row);
                pos++;
            });
        }, (err) => {
            console.error("Error en la escucha del ranking:", err);
            rankingBody.innerHTML = '<tr><td colspan="5">Error al cargar el ranking. Inténtalo de nuevo más tarde.</td></tr>';
        });
    } catch (error) {
        console.error("Error al configurar escucha del ranking:", error);
        rankingBody.innerHTML = '<tr><td colspan="5">Error al cargar el ranking. Inténtalo de nuevo más tarde.</td></tr>';
    }
}

function setupHistoryListener() {
    if (historyUnsubscribe) historyUnsubscribe();
    if (!historyList) return;

    historyList.innerHTML = '<p>Cargando historial...</p>';

    try {
        const matchesRef = collection(db, "matches");
        const q = query(matchesRef, orderBy("timestamp", "desc"), limit(20));

        historyUnsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                historyList.innerHTML = '<p>No hay partidas registradas en el historial.</p>';
                return;
            }
            historyList.innerHTML = '';
            snapshot.forEach(doc => {
                const m = doc.data();
                const entry = document.createElement('div');
                entry.classList.add('match-entry');
                if (m.result) entry.classList.add(`result-${m.result}`);

                let playersHtml = '<div class="match-players">';
                if (Array.isArray(m.players)) {
                    m.players.forEach(p => {
                        const win = m.winnerUserId === p.userId;
                        playersHtml += `
                            <div class="player-match-info ${win ? 'winner' : ''}">
                                <strong>${p.displayName || 'Jugador Anónimo'}</strong>
                                marcó <span class="score">${p.score ?? 'N/A'}</span> puntos ${win ? '(Ganador)' : ''}
                            </div>
                        `;
                    });
                } else {
                    playersHtml += '<p>Datos de jugadores no disponibles.</p>';
                }
                playersHtml += '</div>';

                entry.innerHTML = `
                    <div class="match-header">
                        <span class="match-date">
                            <i class="fas fa-calendar-alt"></i>
                            ${formatFirebaseTimestamp(m.timestamp)}
                        </span>
                        <span class="match-game-type">${m.gameType || 'Pasala Che'}</span>
                    </div>
                    ${playersHtml}
                `;
                historyList.appendChild(entry);
            });
        }, (err) => {
            console.error("Error en la escucha del historial:", err);
            historyList.innerHTML = '<p>Error al cargar el historial. Inténtalo de nuevo más tarde.</p>';
        });
    } catch (error) {
        console.error("Error al configurar escucha del historial:", error);
        historyList.innerHTML = '<p>Error al cargar el historial. Inténtalo de nuevo más tarde.</p>';
    }
}

function refreshData() {
    if (rankingUnsubscribe) rankingUnsubscribe();
    if (historyUnsubscribe) historyUnsubscribe();
    setupRankingListener();
    setupHistoryListener();
    const btn = document.getElementById('refreshButton');
    if (btn) {
        const txt = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> ¡Actualizado!';
        btn.disabled = true;
        setTimeout(() => {
            btn.innerHTML = txt;
            btn.disabled = false;
        }, 2000);
    }
}

function cleanupListeners() {
    if (rankingUnsubscribe) rankingUnsubscribe();
    if (historyUnsubscribe) historyUnsubscribe();
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
}

function addRefreshButton() {
    if (document.getElementById('refreshButton')) return;
    const btn = document.createElement('button');
    btn.id = 'refreshButton';
    btn.className = 'refresh-button';
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar datos';
    btn.addEventListener('click', refreshData);
    const container = document.querySelector('.content-container');
    if (container) container.insertBefore(btn, container.firstChild);
}

document.addEventListener('DOMContentLoaded', () => {
    addRefreshButton();
    setupRankingListener();
    setupHistoryListener();
    autoRefreshInterval = setInterval(refreshData, REFRESH_INTERVAL);
    window.addEventListener('beforeunload', cleanupListeners);
});

window.refreshRankingData = refreshData;
