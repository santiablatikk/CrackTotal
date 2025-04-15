// ranking.js
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_3zRD0fwsRCSFqyZ3ach4mhMl9gYr4",
  authDomain: "cracktotal-cd2e7.firebaseapp.com",
  projectId: "cracktotal-cd2e7",
  storageBucket: "cracktotal-cd2e7.firebasestorage.app",
  messagingSenderId: "210391454350",
  appId: "1:210391454350:web:ec36c626aca23e80562fdf",
  measurementId: "G-5X93T1RTH7"
};

// Firebase variables
let db;
let analytics;

document.addEventListener("DOMContentLoaded", async () => {
  console.log('DOM cargado - Inicializando ranking');
  
  // Don't explicitly initialize Firebase - wait for the script loader to do it
  // Check for Firebase availability
  if (window.firebaseAvailable) {
    db = window.db;
    analytics = window.analytics;
    console.log('Firebase encontrado y listo para usar');
  } else {
    console.log('Firebase no está disponible, usando modo offline');
  }
  
  // Obtener el nombre de usuario guardado
  const username = getUsernameFromStorage();
  console.log('Usuario detectado:', username || 'Anónimo');
  
  // Verificar si venimos de finalizar una partida
  const urlParams = new URLSearchParams(window.location.search);
  const fromGame = urlParams.get('fromGame');
  
  // Siempre cargar ranking global, forzar recarga si viene de partida
  await loadRanking(fromGame === 'true'); 
  
  if (fromGame === 'true') {
    showGameCompletionMessage();
  }
  
  // Eliminar configuración de tabs
  // setupRankingTabs(); // <-- REMOVED
  
  // Configurar los botones de navegación
  setupNavigationButtons();
});

// Obtener nombre de usuario desde localStorage
function getUsernameFromStorage() {
  // Intentar obtener del localStorage
  const username = localStorage.getItem('username');
  
  // Si no existe en localStorage, verificar si hay un nombre guardado con la IP
  if (!username) {
    const userIP = localStorage.getItem('userIP');
    if (userIP) {
      try {
        // Intentar obtener perfil guardado para esta IP
        const profileKey = `profile_${userIP}`;
        const profileData = localStorage.getItem(profileKey);
        
        if (profileData) {
          const profile = JSON.parse(profileData);
          if (profile && profile.name) {
            return profile.name;
          }
        }
      } catch (error) {
        console.error('Error al obtener nombre desde perfil:', error);
      }
    }
    return null;
  }
  
  return username;
}

// Configurar botones de navegación
function setupNavigationButtons() {
  const backButton = document.getElementById('back-button');
  if (backButton) {
    backButton.addEventListener('click', function() {
      if (localStorage.getItem('hasPlayed') === 'true') {
        window.location.href = 'game.html';
      } else {
        window.location.href = 'index.html';
      }
    });
  }
  
  const viewProfileButton = document.getElementById('view-profile');
  if (viewProfileButton) {
    viewProfileButton.addEventListener('click', function() {
      window.location.href = 'profile.html';
    });
  }
}

// Eliminar función setupRankingTabs
/* 
function setupRankingTabs() { 
  // ... implementation removed ...
}
*/

// Modificar getRankingDataFromFirebase para que sea siempre global y sin fallback
async function getRankingDataFromFirebase() { // <-- REMOVED period parameter
  console.log(`[Firebase] Iniciando obtención de ranking GLOBAL`); // <-- Updated log
  try {
    // Check if Firebase is available
    if (!window.firebaseAvailable || !db) {
      console.error('[Firebase] Firebase no está disponible. No se puede cargar el ranking.'); // <-- Changed error message
      // Lanzar error para que sea capturado por loadRanking
      throw new Error('Firebase no disponible'); 
    }
    
    // Referencia a la colección de partidas (sin filtro de fecha)
    let query = db.collection('gameHistory');
    
    // Ordenar por puntuación (mayor a menor)
    query = query.orderBy('score', 'desc');
    
    // Obtener los datos
    console.log(`[Firebase] Ejecutando query para ranking GLOBAL...`); // <-- Updated log
    const snapshot = await query.get();
    console.log(`[Firebase] Query completada para ranking GLOBAL. Documentos encontrados: ${snapshot.size}`); // <-- Updated log
    
    if (snapshot.empty) {
      console.log('[Firebase] No se encontraron datos de ranking en Firebase.');
      return [];
    }
    
    // Procesar los datos
    const rankingData = [];
    snapshot.forEach(doc => {
      const gameData = doc.data();
      rankingData.push({
        name: gameData.playerName || 'Anónimo',
        score: gameData.score || 0,
        correct: gameData.correct || 0,
        wrong: gameData.wrong || 0,
        difficulty: gameData.difficulty || 'normal',
        date: gameData.timestamp ? gameData.timestamp.toDate() : new Date(),
        playerId: gameData.playerId || null
      });
    });
    
    console.log(`[Firebase] Datos de ranking GLOBAL procesados: ${rankingData.length} registros`); // <-- Updated log
    return rankingData;
  } catch (error) {
    console.error(`[Firebase] Error al obtener datos del ranking GLOBAL desde Firebase:`, error);
    // Re-lanzar el error para que sea manejado en loadRanking
    throw error; 
  }
}

// Eliminar función getRankingDataFromLocalStorage
/*
async function getRankingDataFromLocalStorage(period = 'global') {
  // ... implementation removed ...
}
*/

// Guardar partida en Firebase para el ranking global
async function saveGameToFirebase(gameData) {
  try {
    // Verify that Firebase is available
    if (!window.firebaseAvailable || !db) {
      console.log('Firebase no está disponible, los datos se guardan solo localmente');
      return false;
    }
    
    // Verificar que tenemos datos válidos
    if (!gameData || !gameData.playerName) {
      console.error('Datos de juego inválidos', gameData);
      return false;
    }
    
    // Preparar datos para guardar
    const gameRecord = {
      playerName: gameData.playerName,
      playerId: gameData.playerId || gameData.userIP || 'anonymous',
      score: gameData.score || 0,
      correct: gameData.correct || 0,
      wrong: gameData.wrong || 0,
      skipped: gameData.skipped || 0,
      difficulty: gameData.difficulty || 'normal',
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      victory: gameData.victory || false,
      timeUsed: gameData.timeUsed || 0,
      deviceType: gameData.deviceType || detectDeviceType()
    };
    
    // Guardar en Firestore
    await db.collection('gameHistory').add(gameRecord);
    
    console.log('Partida guardada en Firebase correctamente');
    return true;
  } catch (error) {
    console.error('Error al guardar partida en Firebase:', error);
    return false;
  }
}

// Detectar tipo de dispositivo
function detectDeviceType() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Detectar si es móvil
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
}

// Actualizar estadísticas globales mostradas en la página
function updateGlobalStats(rankingData) {
  // Actualizar jugadores totales (nombres únicos)
  const uniquePlayers = new Set(rankingData.map(item => item.name)).size;
  const totalGames = rankingData.length;
  
  // Calcular tasa de aciertos total
  let totalCorrect = 0;
  let totalQuestions = 0;
  
  rankingData.forEach(item => {
    totalCorrect += item.correct || 0;
    totalQuestions += (item.correct || 0) + (item.wrong || 0);
  });
  
  const successRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  
  // Actualizar valores en la UI
  document.getElementById('total-players').textContent = uniquePlayers;
  document.getElementById('total-games').textContent = totalGames;
  document.getElementById('success-rate').textContent = `${successRate}%`;
}

// Actualizar visualización de posición del jugador
function updatePlayerPositionDisplay(position, playerName) {
  const playerPositionNote = document.getElementById('player-position-note');
  
  if (playerPositionNote) {
    if (playerName && position > 0) {
      // Si el jugador está en el ranking, mostrar su posición
      playerPositionNote.innerHTML = `
        <i class="fas fa-trophy"></i>
        Tu posición actual: <strong>${position}</strong> de ${document.querySelectorAll('#ranking-body tr').length}
      `;
      playerPositionNote.style.display = 'block';
      playerPositionNote.className = position <= 3 ? 'player-position-note top-position' : 'player-position-note normal-position';
    } else if (playerName) {
      // Si el jugador no está en el ranking visible, mostrar mensaje
      playerPositionNote.innerHTML = `
        <i class="fas fa-info-circle"></i>
        No estás entre los mejores jugadores del ranking. ¡Sigue intentándolo!
      `;
      playerPositionNote.style.display = 'block';
      playerPositionNote.className = 'player-position-note not-in-ranking';
    } else {
      playerPositionNote.style.display = 'none';
    }
  }
}

// Función para poblar la sección de top players
function populateTopPlayers(topData, currentPlayer) {
  const topPlayersContainer = document.querySelector('.top-players');
  if (!topPlayersContainer || topData.length === 0) return;
  
  // Limpiar contenedor
  topPlayersContainer.innerHTML = '';
  
  // Si no hay suficientes datos, no mostrar nada
  if (topData.length < 3) {
    return;
  }
  
  // Orden de visualización: segundo, primero, tercero
  const displayOrder = [
    { position: 2, class: 'second' },
    { position: 1, class: 'first' },
    { position: 3, class: 'third' }
  ];
  
  // Crear divs para cada top player
  displayOrder.forEach(display => {
    const index = display.position - 1;
    if (index >= topData.length) return;
    
    const player = topData[index];
    const isCurrentPlayer = currentPlayer && player.name === currentPlayer;
    
    const playerDiv = document.createElement('div');
    playerDiv.className = `top-player ${display.class}`;
    if (isCurrentPlayer) playerDiv.classList.add('current-player');
    
    playerDiv.innerHTML = `
      <div class="rank-number">${display.position}</div>
      <div class="top-avatar">
        <i class="fas fa-user"></i>
      </div>
      <div class="top-name">${player.name || "Anónimo"}</div>
      <div class="top-score">${player.score || 0}</div>
      <div class="top-details">
        <span><i class="fas fa-check"></i> ${player.correct || 0}</span>
        <span><i class="fas fa-times"></i> ${player.wrong || 0}</span>
      </div>
    `;
    
    topPlayersContainer.appendChild(playerDiv);
  });
  
  // Agregar estilos para el avatar con icono en lugar de imagen
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .top-avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
      border: 3px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 3rem;
    }
    
    .top-player.first .top-avatar {
      width: 120px;
      height: 120px;
      border: 4px solid rgba(255, 215, 0, 0.5);
      box-shadow: 0 0 25px rgba(255, 215, 0, 0.3);
      font-size: 3.5rem;
      color: rgba(255, 215, 0, 0.8);
    }
    
    .top-player.second .top-avatar {
      border-color: rgba(192, 192, 192, 0.5);
      color: rgba(192, 192, 192, 0.8);
    }
    
    .top-player.third .top-avatar {
      border-color: rgba(205, 127, 50, 0.5);
      color: rgba(205, 127, 50, 0.8);
    }
  `;
  document.head.appendChild(styleEl);
}

// Mostrar mensaje si el jugador viene de completar una partida
function showGameCompletionMessage() {
  // Check if we already have a message div
  let messageElement = document.getElementById('game-completion-message');
  
  if (!messageElement) {
    // Create message element if it doesn't exist
    messageElement = document.createElement('div');
    messageElement.id = 'game-completion-message';
    messageElement.className = 'game-completion-message';
    
    // Apply styles
    messageElement.style.backgroundColor = 'rgba(34, 197, 94, 0.9)';
    messageElement.style.borderRadius = '10px';
    messageElement.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.3)';
    messageElement.style.color = 'white';
    messageElement.style.padding = '20px';
    messageElement.style.margin = '20px auto';
    messageElement.style.maxWidth = '90%';
    messageElement.style.position = 'relative';
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(-20px)';
    messageElement.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    // Obtener datos de la última partida
    const playerName = localStorage.getItem('username') || 'Jugador';
    const lastGameStats = JSON.parse(localStorage.getItem('lastGameStats') || '{}');
    const score = lastGameStats.score || 0;
    const correct = lastGameStats.correct || 0;
    const wrong = lastGameStats.wrong || 0;
    const victory = lastGameStats.victory;
    
    const resultIcon = victory ? 
      '<i class="fas fa-trophy" style="color: gold; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);"></i>' : 
      '<i class="fas fa-medal" style="color: #e11d48;"></i>';
    
    messageElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="font-size: 40px; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
          ${resultIcon}
        </div>
        <div>
          <h3 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700;">¡Partida Registrada!</h3>
          <p style="margin: 0; font-size: 16px;">
            <strong>${playerName}</strong>, tu puntuación de <strong>${score} puntos</strong> 
            (${correct} aciertos, ${wrong} errores) ha sido registrada y tu ranking ha sido actualizado.
          </p>
        </div>
        <button onclick="this.parentNode.parentNode.style.display='none';" 
                style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: white; font-size: 18px; cursor: pointer;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // Insertar antes de la tabla pero después del encabezado
    const rankingHeader = document.querySelector('.ranking-header');
    if (rankingHeader && rankingHeader.nextSibling) {
      rankingHeader.parentNode.insertBefore(messageElement, rankingHeader.nextSibling);
    } else {
      // Si no se encuentra el encabezado
      const container = document.querySelector('.ranking-container');
      if (container) {
        container.insertBefore(messageElement, container.firstChild);
      }
    }
    
    // Añadir estilos para la animación de pulso
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    
    // Trigger animation after a small delay
    setTimeout(() => {
      messageElement.style.opacity = '1';
      messageElement.style.transform = 'translateY(0)';
    }, 100);
    
    // Intentar guardar en Firebase si hay datos
    const lastGameData = JSON.parse(localStorage.getItem('lastGameStats') || '{}');
    if (lastGameData && lastGameData.score !== undefined) {
      const userIP = localStorage.getItem('userIP') || 'anonymous';
      
      // Preparar datos para guardar en Firebase
      const gameDataForFirebase = {
        playerName: playerName,
        playerId: userIP,
        userIP: userIP,
        score: lastGameData.score || 0,
        correct: lastGameData.correct || 0,
        wrong: lastGameData.wrong || 0,
        skipped: lastGameData.skipped || 0,
        difficulty: lastGameData.difficulty || 'normal',
        victory: lastGameData.victory || false,
        timeUsed: lastGameData.timeUsed || 0
      };
      
      // Guardar en Firebase solo si está disponible
      if (window.firebaseAvailable) {
        saveGameToFirebase(gameDataForFirebase)
          .then(() => console.log('Partida guardada en Firebase correctamente'))
          .catch(err => console.error('Error al guardar partida en Firebase:', err));
      } else {
        console.log('Firebase no disponible, omitiendo guardado en la nube');
      }
    }
  }
  
  // Auto-ocultar mensaje después de 8 segundos
  setTimeout(() => {
    if (messageElement) {
      messageElement.style.opacity = '0';
      messageElement.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.parentNode.removeChild(messageElement);
        }
      }, 500);
    }
  }, 8000);
}

// Formatear nivel de dificultad
function formatDifficulty(difficulty) {
  switch(difficulty) {
    case 'facil':
      return 'Fácil';
    case 'normal':
      return 'Normal';
    case 'dificil':
      return 'Difícil';
    default:
      return difficulty || '-';
  }
}

// Nueva función para hacer scroll al jugador actual
function scrollToCurrentPlayer() {
  setTimeout(() => {
    const currentPlayerRow = document.querySelector('tr.current-player');
    if (currentPlayerRow) {
      const tableContainer = document.querySelector('.ranking-table-container');
      if (tableContainer) {
        // Posicionar el jugador actual en el centro del contenedor
        const rowPosition = currentPlayerRow.offsetTop;
        const containerHeight = tableContainer.clientHeight;
        const rowHeight = currentPlayerRow.clientHeight;
        
        // Calcular posición para centrar la fila
        const scrollPosition = rowPosition - (containerHeight / 2) + (rowHeight / 2);
        
        // Hacer scroll suave
        tableContainer.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
        
        // Aplicar efecto de destaque
        currentPlayerRow.classList.add('highlight');
        setTimeout(() => {
          currentPlayerRow.classList.remove('highlight');
          setTimeout(() => {
            currentPlayerRow.classList.add('highlight');
          }, 300);
        }, 300);
      }
    }
  }, 500);
}

// Modificar la función loadRanking para usar SIEMPRE Firebase global y sin fallback
async function loadRanking(forceRefresh = false) { // <-- REMOVED period parameter
  const loadingContainer = document.getElementById('loading-container');
  const rankingTable = document.getElementById('ranking-table');
  const rankingTableBody = document.getElementById('ranking-body');
  const noResultsContainer = document.getElementById('no-results');
  const errorContainer = document.getElementById('error-message-container');

  if (!rankingTableBody || !loadingContainer || !rankingTable || !noResultsContainer || !errorContainer) {
    console.error("Error crítico: No se encontraron todos los elementos necesarios para el ranking en el DOM.");
    if (errorContainer) {
        errorContainer.innerHTML = `<p>Error crítico al inicializar la página. Por favor, recarga.</p>`;
        errorContainer.style.display = 'block';
    }
    if (loadingContainer) loadingContainer.style.display = 'none';
    return;
  }
  
  // Reset UI state at the beginning
  loadingContainer.style.display = 'flex';
  rankingTable.style.display = 'none';
  noResultsContainer.style.display = 'none';
  errorContainer.style.display = 'none';
  errorContainer.innerHTML = '';
  rankingTableBody.innerHTML = '';
  // Ensure top players container exists before clearing
  const topPlayersContainer = document.querySelector('.top-players');
  if (topPlayersContainer) {
    topPlayersContainer.innerHTML = '';
  } else {
      console.warn('Elemento .top-players no encontrado al resetear UI.');
  }


  try {
    console.log(`Cargando ranking GLOBAL${forceRefresh ? ' (forzando recarga)' : ''}`); // <-- Updated log
    
    // Small delay for spinner visibility
    await new Promise(resolve => setTimeout(resolve, 150));
    
    let rankingData = [];
    
    // SIEMPRE intentar obtener de Firebase
    rankingData = await getRankingDataFromFirebase(); // <-- Direct call, no period
        
    if (!rankingData || rankingData.length === 0) {
      noResultsContainer.style.display = 'flex';
      rankingTable.style.display = 'none';
      console.log(`No se encontraron datos de ranking GLOBAL.`); // <-- Updated log
      updateGlobalStats([]); 
      updatePlayerPositionDisplay(-1, null);
      // Ocultar spinner si no hay resultados
      if (loadingContainer) loadingContainer.style.display = 'none';
      return; // Importante: salir aquí si no hay datos
    }
    
    // Data found, show table
    rankingTable.style.display = 'table';
    noResultsContainer.style.display = 'none';
    
    // Sorting should not be needed as Firebase query already sorts
    // if (rankingData.length > 0) {
    //   rankingData.sort((a, b) => (b.score || 0) - (a.score || 0));
    // }
    
    const currentPlayer = getUsernameFromStorage();
    let currentPlayerPosition = -1;
    
    // Populate Top 3
    // Ensure container exists before populating
    if (topPlayersContainer) {
        populateTopPlayers(rankingData.slice(0, 3), currentPlayer);
    } else {
        console.warn('Elemento .top-players no encontrado al popular.');
    }
    
    // Populate main table
    const fragment = document.createDocumentFragment();
    rankingData.forEach((item, index) => {
      const position = index + 1;
      const isCurrentPlayer = currentPlayer && item.name && 
                             item.name.toLowerCase() === currentPlayer.toLowerCase();
      if (isCurrentPlayer) {
        currentPlayerPosition = position;
      }
      
      // Skip top 3 if they are already displayed separately
      // Check if top players container actually has children
      const topPlayersDisplayed = topPlayersContainer && topPlayersContainer.children.length > 0;
      if (position <= 3 && topPlayersDisplayed) {
        return;
      }
      
      const tr = document.createElement("tr");
      if (isCurrentPlayer) {
        tr.classList.add('current-player');
      }
      
      let positionClass = '';
      // Use position directly for medal colors
      if (position === 1) positionClass = 'gold';
      else if (position === 2) positionClass = 'silver';
      else if (position === 3) positionClass = 'bronze';
      
      let formattedDate = '-';
      if (item.date) {
         try {
           // Ensure date is a valid Date object before formatting
           const gameDate = item.date instanceof Date ? item.date : new Date(item.date);
           
           if (!isNaN(gameDate.getTime())) {
              formattedDate = `${gameDate.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })} ${gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
           } else {
             console.warn('Fecha inválida encontrada en los datos:', item.date);
           }
         } catch (dateError) {
           console.warn('Error formateando fecha:', item.date, dateError);
         }
      }
      
      tr.innerHTML = `
        <td class="position ${positionClass}">${position}</td>
        <td class="username">${item.name || "Anónimo"}</td>
        <td class="score">${item.score || 0}</td>
        <td class="correct">${item.correct || 0}</td>
        <td class="wrong">${item.wrong || 0}</td>
        <td class="difficulty">${formatDifficulty(item.difficulty)}</td>
        <td class="date">${formattedDate}</td>
      `;
      
      fragment.appendChild(tr);
    });
    rankingTableBody.appendChild(fragment);
    
    updatePlayerPositionDisplay(currentPlayerPosition, currentPlayer);
    
    if (currentPlayerPosition > 0) {
      scrollToCurrentPlayer();
    }
    
    updateGlobalStats(rankingData);
    
    console.log('Ranking GLOBAL cargado correctamente'); // <-- Updated log
    
  } catch (err) {
    console.error("Error general al cargar ranking GLOBAL:", err); // <-- Updated log
    errorContainer.innerHTML = `
      <div class="error-message-content">
        <i class="fas fa-exclamation-triangle"></i>
        <p>¡Ups! Hubo un problema al cargar el ranking desde Firebase.</p> <!-- Updated message -->
        <p class="error-details">Detalle: ${err.message || 'Error desconocido'}</p> 
        <button onclick="loadRanking(true)" class="retry-button"> <!-- Removed period from retry -->
            <i class="fas fa-redo"></i> Reintentar
        </button>
      </div>
    `;
    errorContainer.style.display = 'block';
    rankingTable.style.display = 'none';
    noResultsContainer.style.display = 'none';

  } finally {
     // Always hide the loading spinner
     if (loadingContainer) {
        loadingContainer.style.display = 'none';
     }
  }
}
