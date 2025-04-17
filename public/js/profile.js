// profile.js - Funcionalidad para la página de perfil moderna

// --- Global State ---
let isProfileLoading = false; // Flag to prevent concurrent loads

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Inicializando perfil de usuario moderno');
  
  // Mostrar indicador de carga
  showLoadingIndicator(true);
  hideProfileContent(true);

  // Setup event listeners for profile management
  setupProfileManagement();
  
  // Configurar filtros de historial y logros
  setupFilters();
  
  // Configurar botón de jugar flotante
  setupFloatingActionButton();
  
  // Detectar IP e inicializar perfil automáticamente
  await initializeUserProfile();
});

// --- Data Handling Functions ---

// Load profile data from localStorage
async function loadProfileData(userIP) {
    const profileKey = `profile_${userIP}`;
    const storedProfile = localStorage.getItem(profileKey);
    if (storedProfile) {
        try {
            return JSON.parse(storedProfile);
        } catch (e) {
            console.error(`Error parsing stored profile for ${userIP}:`, e);
            // If parsing fails, maybe return a default profile or null
            localStorage.removeItem(profileKey); // Remove corrupted data
            return null;
        }
    } else {
        return null; // No profile found
    }
}

// Save profile data to localStorage
async function saveProfileData(userIP, profile) { // Renamed from saveUserProfile
    if (!profile || !userIP) {
        console.error('Error: Missing profile or userIP for saving');
        return false;
    }

    const profileKey = `profile_${userIP}`; // Use consistent key
    try {
        profile.lastUpdated = new Date().toISOString(); // Add/update timestamp
        localStorage.setItem(profileKey, JSON.stringify(profile));
        console.log('Profile data saved for IP:', userIP);
        return true;
    } catch (error) {
        console.error(`Error saving profile for ${userIP}:`, error);
        return false;
    }
}

// Load game history from localStorage 
function loadGameHistory(userIP) {
    console.log(`[loadGameHistory] Loading game history for IP: ${userIP}`);
    const historyKey = `gameHistory_${userIP}`;
    const storedHistory = localStorage.getItem(historyKey);
    let history = [];

    if (storedHistory) {
        try {
            history = JSON.parse(storedHistory);
            if (!Array.isArray(history)) {
                console.error(`[loadGameHistory] History is not an array for ${userIP}, returning empty array`);
                return [];
            }
        } catch (e) {
            console.error(`[loadGameHistory] Error parsing game history for ${userIP}:`, e);
            localStorage.removeItem(historyKey); // Remove corrupted data
            return [];
        }
    } else {
        console.log(`[loadGameHistory] No history found for ${userIP}`);
        return []; // No history found
    }

    // --- Aplicar de-duplicación para garantizar que los datos cargados sean correctos ---
    console.log(`[loadGameHistory] Original history length before de-duplication: ${history.length}`);
    
    // Eliminar duplicados en memoria (sin modificar localStorage)
    // Usamos el mismo sistema que saveGameToHistory para mantener consistencia
    const uniqueHistory = [];
    const seenUniqueIds = new Set();
    const seenKeys = new Set();

    for (const entry of history) {
        // Priorizar uniqueId si existe (CRITERIO PRINCIPAL)
        if (entry.uniqueId) {
            if (!seenUniqueIds.has(entry.uniqueId)) {
                seenUniqueIds.add(entry.uniqueId);
                uniqueHistory.push(entry);
            }
        } else {
            // Para entradas sin uniqueId, usar clave compuesta
            let entryTimestamp = 'invalid_date';
            try {
                // Redondear timestamp al minuto más cercano
                entryTimestamp = new Date(entry.date).setSeconds(0, 0);
            } catch (e) {
                entryTimestamp = entry.date || `invalid-${Math.random()}`;
            }
            
            // Clave compuesta con toda la información relevante
            const uniqueKey = `${entryTimestamp}-${entry.score || 0}-${entry.victory}-${entry.difficulty || 'unknown'}-${entry.correct || 0}-${entry.wrong || 0}`;

            if (!seenKeys.has(uniqueKey)) {
                seenKeys.add(uniqueKey);
                uniqueHistory.push(entry);
            }
        }
    }

    console.log(`[loadGameHistory] Final de-duplicated history length: ${uniqueHistory.length}`);

    // Ordenar por fecha, más reciente primero
    return uniqueHistory.sort((a, b) => {
        try {
            return new Date(b.date) - new Date(a.date);
        } catch (e) {
            // En caso de error en la fecha, mantener el orden
            return 0;
        }
    });
}

// Create Default Profile structure
function createDefaultProfile(userIP) {
    console.log(`[createDefaultProfile] Creating default profile for IP: ${userIP}`);
    return {
        name: localStorage.getItem('username') || 'Jugador Anónimo', // Attempt to get saved name
        userIP: userIP,
        memberSince: new Date().toISOString(), // Set creation date
        gamesPlayed: 0,
        totalScore: 0,
        bestScore: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalSkipped: 0,
        totalTime: 0,
        victories: 0,
        defeats: 0,
        lastPlayed: null,
        lastUpdated: new Date().toISOString()
        // Ranking position and achievements count will be added/updated later
    };
}

// --- End Data Handling Functions ---

// Nueva función para inicializar el perfil de usuario
async function initializeUserProfile() {
  try {
    // Verificar si venimos de finalizar una partida
    const urlParams = new URLSearchParams(window.location.search);
    const fromGame = urlParams.get('fromGame') === 'true';
    
    // Mostrar status de detección de IP
    updateIPStatus('Detectando tu IP...');
    
    // Intentar obtener IP guardada en localStorage primero
    let userIP = localStorage.getItem('userIP');
    
    // Si no existe, detectar y guardar la IP
    if (!userIP) {
      userIP = await detectUserIP();
      
      if (userIP) {
        // Guardar la IP para uso futuro
        localStorage.setItem('userIP', userIP);
        console.log('IP detectada y guardada:', userIP);
        updateIPStatus(`Identidad detectada: ${userIP}`);
      }
    } else {
      console.log('Usando IP guardada:', userIP);
      updateIPStatus(`Identidad guardada: ${userIP}`);
    }
    
    // Cargar perfil con la IP (si existe)
    if (userIP) {
      // Forzar recarga si venimos de completar una partida
      await loadUserProfile(userIP, fromGame);
      
      // Si venimos de una partida completada, mostrar notificación
      if (fromGame) {
        // Mostrar notificación de actualización
        showProfileUpdatedNotification();
        
        // Limpiar el flag
        localStorage.removeItem('gameJustCompleted');
      }
    } else {
      console.error('No se pudo detectar la IP del usuario');
      displayProfileError('No se pudo detectar tu dirección IP');
    }
  } catch (error) {
    console.error('Error al inicializar perfil:', error);
    displayProfileError('Error al cargar el perfil');
  }
}

// Actualizar status de IP
function updateIPStatus(message) {
  const statusElement = document.getElementById('ip-address-display');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

// Helper para mostrar/ocultar loader y contenido
function showLoadingIndicator(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function hideProfileContent(hide) {
    const content = document.getElementById('profile-grid-content');
    if (content) content.style.display = hide ? 'none' : 'grid'; // Use 'grid' for display
}

// Modificar la función detectUserIP para ser más robusta
async function detectUserIP() {
  try {
    // Primero intentar usar API externa
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
    
    // Alternativa si la primera falla
    const backupResponse = await fetch('https://ipapi.co/json/');
    if (backupResponse.ok) {
      const backupData = await backupResponse.json();
      return backupData.ip;
    }
    
    // Si ambas fallan, usar una IP genérica con timestamp para identificar al usuario
    const timestamp = new Date().getTime();
    const pseudoIP = `user-${timestamp}`;
    console.warn('No se pudo detectar IP real, usando identificador:', pseudoIP);
    return pseudoIP;
  } catch (error) {
    console.error('Error al detectar IP:', error);
    // Como último recurso, usar una combinación del user agent y timestamp
    const userAgent = navigator.userAgent;
    const timestamp = new Date().getTime();
    const fallbackID = `user-${btoa(userAgent).substring(0, 8)}-${timestamp}`;
    return fallbackID;
  }
}

// Función para mostrar notificación de perfil actualizado
function showProfileUpdatedNotification() {
  // Crear elemento de notificación si no existe
  let notification = document.getElementById('profile-updated-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'profile-updated-notification';
    notification.className = 'profile-notification';
    
    // Estilo de la notificación
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = 'rgba(34, 197, 94, 0.9)';
    notification.style.color = 'white';
    notification.style.padding = '15px 30px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '1000';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    
    // Agregar al DOM
    document.body.appendChild(notification);
  }
  
  // Establecer mensaje
  const lastGameStats = JSON.parse(localStorage.getItem('lastGameStats') || '{}');
  notification.innerHTML = `
    <i class="fas fa-check-circle" style="margin-right: 10px;"></i>
    ¡Perfil actualizado! Puntuación: ${lastGameStats.score || 0} 
    (Aciertos: ${lastGameStats.correct || 0}, Errores: ${lastGameStats.wrong || 0})
    <div style="font-size: 0.8rem; margin-top: 5px;">SE</div>
  `;
  
  // Mostrar notificación
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 300);
  
  // Ocultar después de 4 segundos
  setTimeout(() => {
    notification.style.opacity = '0';
  }, 4000);
}

// Función para actualizar las estadísticas del perfil basado en historial (SIN CAMBIOS - ya recalcula todo)
function updateProfileStats(profile, userIP) {
  if (!profile || !userIP) {
    console.error('Datos inválidos para updateProfileStats');
    return;
  }

  const historyKey = `gameHistory_${userIP}`;
  let history = [];
  const storedHistory = localStorage.getItem(historyKey);

  if (storedHistory) {
    try {
      history = JSON.parse(storedHistory);
      if (!Array.isArray(history)) history = [];
    } catch (e) {
      console.error('Error al parsear historial para estadísticas:', e);
      history = [];
    }
  }

  // Reiniciar contadores antes de recalcular
  profile.gamesPlayed = history.length;
  profile.totalScore = 0;
  profile.bestScore = 0;
  profile.totalCorrect = 0;
  profile.totalWrong = 0;
  profile.totalSkipped = 0;
  profile.totalTime = 0;
  profile.victories = 0;
  profile.defeats = 0;

  // Calcular estadísticas desde el historial
  history.forEach(game => {
    profile.totalScore += game.score || 0;
    profile.bestScore = Math.max(profile.bestScore, game.score || 0);
    profile.totalCorrect += game.correct || 0;
    profile.totalWrong += game.wrong || 0;
    profile.totalSkipped += game.skipped || 0;
    profile.totalTime += game.timeUsed || 0;
    if (game.victory) {
      profile.victories += 1;
    } else {
      profile.defeats += 1;
    }
  });

  // Actualizar fecha de última partida si hay historial
  if (history.length > 0 && history[0].date) {
    profile.lastPlayed = history[0].date;
  } else if (!profile.lastPlayed) {
     profile.lastPlayed = new Date().toISOString(); // O establecer una fecha si no hay historial
  }

  console.log('[updateProfileStats] Estadísticas recalculadas:', profile);
}

// --- Utility Functions for Formatting ---
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0m 0s';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

function formatAverageTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0m 0s';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

// --- Función para actualizar la interfaz de usuario (REVISADA Y FINAL) ---
function updateProfileUI(profile, userIP) {
  if (!profile) {
    console.error('No se proporcionó perfil para actualizar la UI');
    displayProfileError('No se pudieron cargar los datos del perfil.');
    showLoadingIndicator(false);
    hideProfileContent(true);
    return;
  }

  console.log('[updateProfileUI] Actualizando elementos del DOM con:', profile);

  // --- Calcular Estadísticas Derivadas ---
  const gamesPlayed = profile.gamesPlayed || 0;
  const totalCorrect = profile.totalCorrect || 0;
  const totalWrong = profile.totalWrong || 0;
  const totalSkipped = profile.totalSkipped || 0;
  const victories = profile.victories || 0;
  const totalAnswers = totalCorrect + totalWrong + totalSkipped;

  const winRate = gamesPlayed > 0 ? ((victories / gamesPlayed) * 100).toFixed(1) : 0;
  const avgScore = gamesPlayed > 0 ? (profile.totalScore / gamesPlayed).toFixed(0) : 0;
  const accuracy = totalAnswers > 0 ? ((totalCorrect / totalAnswers) * 100).toFixed(1) : 0;
  const avgTimeSeconds = gamesPlayed > 0 ? (profile.totalTime / gamesPlayed) : 0;
  const avgTimeFormatted = formatAverageTime(avgTimeSeconds);
  const totalTimeFormatted = formatTime(profile.totalTime || 0);

  // --- Actualizar Sidebar ---
  const usernameElement = document.getElementById('profile-username');
  if (usernameElement) usernameElement.textContent = profile.name || 'Jugador Anónimo';

  const statusElement = document.getElementById('profile-status');
  const badgeElement = document.getElementById('rank-badge');
  if (statusElement && badgeElement) {
    const statusInfo = getPlayerStatus(profile);
    statusElement.textContent = statusInfo.status; 
    badgeElement.innerHTML = `<i class="fas ${statusInfo.icon}"></i>`;
  }

  // Actualizar última fecha de juego
  const lastPlayedElement = document.getElementById('last-played-date');
  if (lastPlayedElement) {
    if (profile.lastPlayed) {
      const date = new Date(profile.lastPlayed);
      lastPlayedElement.textContent = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      lastPlayedElement.textContent = 'Nunca has jugado';
    }
  }

  // Actualizar tiempo de la última sincronización
  const lastSyncElement = document.getElementById('last-sync-time');
  if (lastSyncElement) {
    if (profile.lastUpdated) {
      const date = new Date(profile.lastUpdated);
      lastSyncElement.textContent = `Última sincronización: ${date.toLocaleTimeString('es-ES')}`;
    } else {
      lastSyncElement.textContent = 'Sincronización inicial';
    }
  }

  const sidebarBestScore = document.getElementById('sidebar-best-score');
  if (sidebarBestScore) sidebarBestScore.textContent = profile.bestScore || 0;

  const sidebarGamesPlayed = document.getElementById('sidebar-games-played');
  if (sidebarGamesPlayed) sidebarGamesPlayed.textContent = gamesPlayed;
  
  const sidebarRanking = document.getElementById('sidebar-ranking-position');
   if (sidebarRanking) sidebarRanking.textContent = profile.rankingPosition || '-';

  // --- Actualizar Estadísticas Destacadas ---
  const highlightWinRate = document.getElementById('highlight-win-rate');
  if (highlightWinRate) highlightWinRate.textContent = `${winRate}%`;
  
  const highlightAccuracy = document.getElementById('highlight-accuracy');
  if (highlightAccuracy) highlightAccuracy.textContent = `${accuracy}%`;
  
  const highlightBestScore = document.getElementById('highlight-best-score');
  if (highlightBestScore) highlightBestScore.textContent = profile.bestScore || 0;
  
  // Actualizar gráficos circulares
  updateCircularProgress('highlight-win-rate', parseInt(winRate));
  updateCircularProgress('highlight-accuracy', parseInt(accuracy));

  // --- Actualizar Grid de Estadísticas Principal ---
  const statElements = {
    'stat-games-played': gamesPlayed,
    'stat-victories': victories,
    'stat-defeats': profile.defeats || 0,
    'stat-win-rate': `${winRate}%`,
    'stat-best-score': profile.bestScore || 0,
    'stat-avg-score': avgScore,
    'stat-correct': totalCorrect,
    'stat-wrong': totalWrong,
    'stat-skipped': totalSkipped,
    'stat-accuracy': `${accuracy}%`,
    'stat-avg-time': avgTimeFormatted,
    'stat-total-time': totalTimeFormatted
  };

  for (const [id, value] of Object.entries(statElements)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    } else {
      console.warn(`Elemento de estadística no encontrado: #${id}`);
    }
  }
  
  // Si hay un campo para cambiar el nombre, prellenarlo con el nombre actual
  const nameInput = document.getElementById('new-name-input');
  if (nameInput && profile.name) {
    nameInput.value = profile.name;
    nameInput.placeholder = `Cambiar "${profile.name}"`;
  }
  
  // Comprobar si hay historial para mostrar estado vacío
  if (userIP) {
    checkForEmptyHistory(userIP);
  }
  
  // Ocultar loader y mostrar contenido una vez actualizado
  showLoadingIndicator(false);
  hideProfileContent(false);
}

// --- Funciones de Carga y Error --- 

// Función para obtener el estado/rango del jugador (SIN CAMBIOS)
function getPlayerStatus(profile) {
  // Ejemplo básico:
    const games = profile.gamesPlayed || 0;
    const wins = profile.victories || 0;
  if (games === 0) return { status: 'Novato', icon: 'fa-seedling' };
  if (wins / games > 0.7 && games >= 50) return { status: 'Leyenda', icon: 'fa-crown' };
  if (wins / games > 0.5 && games >= 20) return { status: 'Experto', icon: 'fa-star' };
  if (games >= 10) return { status: 'Habitual', icon: 'fa-user-check' };
  return { status: 'Principiante', icon: 'fa-user-graduate' };
}

// Actualizar carga de historial para usar nuevos IDs (SIN CAMBIOS)
async function updateGameHistory(userIP) {
  const historyContainer = document.getElementById('game-history-list');
  const placeholder = document.getElementById('history-placeholder');
  
  if (!historyContainer || !placeholder) {
      console.error('Contenedor de historial o placeholder no encontrado.');
        return;
    }

  placeholder.style.display = 'block'; // Mostrar placeholder inicialmente
  historyContainer.innerHTML = ''; // Limpiar historial anterior (excepto placeholder)
  historyContainer.appendChild(placeholder); // Asegurar que el placeholder esté dentro

    // Load the already de-duplicated history
    const history = loadGameHistory(userIP);

    if (history.length === 0) {
    placeholder.innerHTML = '<i class="fas fa-folder-open"></i><p>Aún no has jugado ninguna partida.</p>';
    return; // Mantener placeholder visible si no hay historial
  }

  placeholder.style.display = 'none'; // Ocultar placeholder si hay historial

    // Limitar a las últimas X partidas (la historia ya está de-duplicada)
  const recentHistory = history.slice(0, 20);

    // Iterar sobre el historial
    recentHistory.forEach(game => {
    const entryElement = document.createElement('div');
    entryElement.classList.add('game-entry');

    const resultIconClass = game.victory ? 'fas fa-check-circle victory' : 'fas fa-times-circle defeat';
    const resultText = game.victory ? 'Victoria' : 'Derrota';
        const gameDate = new Date(game.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const difficulty = game.difficulty || 'normal'; // Add difficulty display

    entryElement.innerHTML = `
            <div class="game-entry-main">
        <i class="${resultIconClass} game-result-icon"></i>
                <div class="game-info">
          <strong>${resultText}</strong>
          <span>${gameDate}</span>
                </div>
        <span class="game-difficulty">${difficulty}</span>
            </div>
      <div class="game-score">${game.score || 0}</div>
    `;
    historyContainer.appendChild(entryElement);
  });
}

// Mostrar Error (SIN CAMBIOS)
function displayProfileError(message = 'No se pudo cargar el perfil') {
  const errorElement = document.getElementById('profile-error');
  if (errorElement) {
    errorElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    errorElement.style.display = 'block';
  }
  // Ocultar loader y contenido principal en caso de error
  showLoadingIndicator(false);
  hideProfileContent(true);
  console.error('Error de perfil mostrado:', message);
}

// --- Main Load Function ---

async function loadUserProfile(userIP, forceRecalculateStats = false) {
    // --- Prevent Concurrent Execution --- START
    if (isProfileLoading) {
        console.warn('Carga de perfil ya en progreso. Omitiendo llamada duplicada.');
        return;
    }
    isProfileLoading = true;
    // --- Prevent Concurrent Execution --- END

    console.log(`Cargando perfil para IP: ${userIP}, Forzar recálculo: ${forceRecalculateStats}`);
  showLoadingIndicator(true);
  hideProfileContent(true);
    const errorContainer = document.getElementById('profile-error-container');
    if(errorContainer) errorContainer.style.display = 'none'; // Hide previous errors

    // --- NUEVA FUNCIÓN DE LIMPIEZA DEL HISTORIAL ---
    const historyWasCleaned = cleanupGameHistory(userIP);
    if (historyWasCleaned) {
        console.log('El historial fue limpiado, forzando recálculo de estadísticas.');
        forceRecalculateStats = true;
    }
    // --- FIN DE LA NUEVA FUNCIÓN ---

    try {
        let profile = await loadProfileData(userIP);

        // Ensure basic profile structure if it's the first load
        if (!profile || !profile.memberSince) { // Check memberSince as a proxy for existing profile
             profile = createDefaultProfile(userIP); // Use createDefaultProfile
             console.log('Perfil inicializado para nuevo usuario:', profile);
             // Initial save for new profile
             await saveProfileData(userIP, profile);
        } else {
            console.log('Perfil existente cargado:', profile);
        }

        // Recalculate stats from history if forced or if stats seem missing/stale
        // Use optional chaining for safety
        if (forceRecalculateStats || profile?.gamesPlayed === undefined) {
             console.log('Recalculando estadísticas del perfil desde el historial.');
             updateProfileStats(profile, userIP); // Update stats based on local history
             await saveProfileData(userIP, profile); // Save the recalculated stats
        }

        const history = loadGameHistory(userIP); // Use the new function

        // Display everything
        updateProfileUI(profile, userIP);
        updateGameHistory(userIP); // Use this function instead, passing userIP
        updateAchievementsDisplay(profile); // Display achievements

        // Removing this save call as it might save intermediate states unnecessarily
        // await saveProfileData(userIP, profile);

        hideProfileContent(false); // Show content AFTER data is loaded/calculated

  } catch (error) {
        console.error('Error detallado al cargar el perfil:', error);
        displayProfileError(`No se pudo cargar el perfil. ${error.message}`);
    } finally {
        showLoadingIndicator(false); // Hide loader regardless of outcome
        isProfileLoading = false; // --- Release the lock --- 
    }
}

// Nueva función de limpieza del historial que elimina duplicados de forma permanente
function cleanupGameHistory(userIP) {
    console.log('[cleanupGameHistory] Iniciando limpieza de historial para IP:', userIP);
    const historyKey = `gameHistory_${userIP}`;
    const storedHistory = localStorage.getItem(historyKey);
    
    if (!storedHistory) {
        console.log('[cleanupGameHistory] No se encontró historial para limpiar');
        return false;
    }

    try {
        // Cargar historial actual
        let history = JSON.parse(storedHistory);
        if (!Array.isArray(history)) {
            localStorage.removeItem(historyKey);
            console.log('[cleanupGameHistory] El historial no es un array, se ha eliminado');
        return true;
        }
        
        console.log(`[cleanupGameHistory] Historial original: ${history.length} entradas`);
        
        // --- PRIMERA FASE: De-duplicación por uniqueId (campo más confiable) ---
        const seenUniqueIds = new Set();
        const cleanHistory1 = [];
        
        for (const entry of history) {
            if (entry.uniqueId) {
                if (!seenUniqueIds.has(entry.uniqueId)) {
                    seenUniqueIds.add(entry.uniqueId);
                    cleanHistory1.push(entry);
                } else {
                    console.log(`[cleanupGameHistory] Eliminado duplicado con uniqueId: ${entry.uniqueId}`);
                }
            } else {
                cleanHistory1.push(entry); // Mantener entradas sin uniqueId para fase 2
            }
        }
        
        // --- SEGUNDA FASE: De-duplicación por clave compuesta para entradas sin uniqueId ---
        const seenKeys = new Set();
        const cleanHistory2 = [];
        
        for (const entry of cleanHistory1) {
            if (!entry.uniqueId) {
                let gameTimestamp = 'invalid_date';
                try {
                    // Redondear timestamp al minuto más cercano para agrupar guardados cercanos
                    const date = new Date(entry.date);
                    if (!isNaN(date.getTime())) {
                        date.setSeconds(0, 0);
                        gameTimestamp = date.getTime().toString();
                    } else {
                        gameTimestamp = entry.date || `unknown-${Math.random()}`;
                    }
                } catch (e) {
                    gameTimestamp = entry.date || `invalid-${Math.random()}`;
                }
                
                // Crear clave única compuesta con múltiples campos
                const uniqueKey = `${gameTimestamp}-${entry.score || 0}-${entry.victory}-${entry.difficulty || 'unknown'}-${entry.correct || 0}-${entry.wrong || 0}`;
                
                if (!seenKeys.has(uniqueKey)) {
                    seenKeys.add(uniqueKey);
                    cleanHistory2.push(entry);
  } else {
                    console.log(`[cleanupGameHistory] Eliminado duplicado con clave compuesta: ${uniqueKey}`);
          }
        } else {
                cleanHistory2.push(entry); // Mantener entradas con uniqueId
            }
        }
        
        // --- FASE FINAL: Ordenar por fecha (más reciente primero) y limitar a 50 entradas ---
        const sortedHistory = cleanHistory2.sort((a, b) => {
            try {
                return new Date(b.date) - new Date(a.date);
            } catch (e) {
                return 0; // Mantener orden si hay error en fechas
            }
        });
        
        // Limitar a 50 entradas para mantener el rendimiento
        const limitedHistory = sortedHistory.slice(0, 50);
        
        console.log(`[cleanupGameHistory] Historial después de limpieza: ${limitedHistory.length} entradas (reducción de ${history.length - limitedHistory.length} entradas)`);
        
        // Solo guardar si hubo cambios
        if (limitedHistory.length !== history.length) {
            localStorage.setItem(historyKey, JSON.stringify(limitedHistory));
            return true; // Indocator que se hicieron cambios
        }
        
        return false; // No hubo cambios
  } catch (error) {
        console.error('[cleanupGameHistory] Error limpiando historial:', error);
    return false;
  }
}

// Actualizar UI de Logros (CORREGIDO - Muestra solo desbloqueados, contador Unlocked/Total)
function updateAchievementsDisplay(userIP) {
    const achievementsContainer = document.getElementById('achievements-list');
    const placeholder = document.getElementById('achievements-placeholder');
    const unlockedCountElement = document.getElementById('achievements-unlocked-count');
    const totalCountElement = document.getElementById('achievements-total-count');
    const achievementsCompleted = document.getElementById('achievements-completed');

    if (!achievementsContainer || !placeholder || !unlockedCountElement || !totalCountElement || !achievementsCompleted) {
        console.error('Elementos HTML necesarios para logros no encontrados.');
    return;
  }
  
    // Mostrar placeholder inicialmente
    placeholder.style.display = 'block';
    achievementsContainer.innerHTML = ''; 
    achievementsContainer.appendChild(placeholder);
    unlockedCountElement.textContent = '-'; 
    totalCountElement.textContent = '-';
    achievementsCompleted.style.width = '0%';
    placeholder.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Cargando logros...</p>'; // Mensaje inicial

    // Intentar obtener datos SOLO desde las funciones globales
    if (typeof window.getAllAchievements === 'function' && typeof window.getUnlockedAchievements === 'function') {
        try {
            const allPossibleAchievements = window.getAllAchievements();
            const userUnlockedAchievements = window.getUnlockedAchievements();
            const totalCount = allPossibleAchievements.length;
            const unlockedCount = userUnlockedAchievements.length;

            if (totalCount === 0) {
                console.warn('getAllAchievements() devolvió 0 logros definidos.');
                placeholder.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>No hay logros definidos.</p>';
                 unlockedCountElement.textContent = '0';
                 totalCountElement.textContent = '0';
                 achievementsCompleted.style.width = '0%';
    return;
  }
  
            console.log(`Logros cargados desde logros.js: ${unlockedCount} desbloqueados de ${totalCount}`);

            // Actualizar contador y barra
            unlockedCountElement.textContent = unlockedCount;
            totalCountElement.textContent = totalCount;
            const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
            achievementsCompleted.style.width = `${progressPercent}%`;

            // Ocultar placeholder y limpiar
            placeholder.style.display = 'none';
            achievementsContainer.innerHTML = '';

            // Crear un mapa de todos los logros para obtener detalles
    const definitionsMap = allPossibleAchievements.reduce((map, def) => {
        map[def.id] = def;
        return map;
  }, {});

            // --- LÓGICA REVERTIDA: Iterar sobre SOLO los logros DESBLOQUEADOS --- 
            if (userUnlockedAchievements.length === 0) {
                 achievementsContainer.innerHTML = `
                  <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-trophy"></i></div>
                    <h4>Aún no tienes logros desbloqueados.</h4>
                    <p>¡Sigue jugando para conseguirlos!</p>
                    <a href="logros.html" class="empty-state-action view-all-btn styled-button">Ver todos los logros posibles</a>
                  </div>
                `;
            } else {
                // Ordenar los desbloqueados (p.ej., por fecha)
                userUnlockedAchievements.sort((a, b) => {
                    const dateA = a.date ? new Date(a.date) : 0;
                    const dateB = b.date ? new Date(b.date) : 0;
                    return dateB - dateA; // Más recientes primero
                });
                
                userUnlockedAchievements.forEach(unlockedAch => {
                    // Obtener definición completa usando el mapa
                    const achievementDef = definitionsMap[unlockedAch.id];
                    if (!achievementDef) return; // Saltar si la definición no se encuentra
                    
                    const icon = achievementDef.icon || 'fas fa-award';
                    const category = achievementDef.category || 'common';
                    const title = achievementDef.title || 'Logro Desconocido';
                    const description = achievementDef.description || 'Detalles no disponibles';
                    const maxCount = achievementDef.maxCount || 1;
                    const currentCount = unlockedAch.count || (unlockedAch.unlocked ? 1 : 0); // Usar count del logro desbloqueado
                    const date = unlockedAch.date;

                    const achievementDate = date
                        ? (typeof window.formatDate === 'function' 
                          ? window.formatDate(date) 
                          : new Date(date).toLocaleDateString('es-ES'))
                        : '';
                      
                    const card = document.createElement('div');
                    // Siempre añadir clase 'unlocked' ya que solo iteramos sobre ellos
                    card.className = `achievement-card unlocked`; 
                    card.setAttribute('data-id', unlockedAch.id || '');
                    card.setAttribute('data-category', category);
                    
                    const progressPercent = maxCount > 1 
                        ? Math.min(100, (currentCount / maxCount) * 100) 
                        : 100;
                    
                    let countText = '';
                    if (maxCount > 1) {
                        countText = `${currentCount}/${maxCount}`;
                    } else {
                         countText = '<i class="fas fa-check-circle"></i> Completado';
                    }

                    card.innerHTML = `
                      <div class="achievement-icon"><i class="${icon}"></i></div>
                      <div class="achievement-details">
                        <h4>${title}</h4>
                        <p>${description}</p>
                        <div class="achievement-date">${achievementDate}</div>
                        ${maxCount > 1 ? 
                          `<div class="achievement-progress">
                            <div class="achievement-progress-bar" style="width: ${progressPercent}%"></div>
                          </div>` 
                        : ''}
                         <div class="achievement-count-status">${countText}</div>
                      </div>
                    `;
        achievementsContainer.appendChild(card);
    });
            } // Fin del else (userUnlockedAchievements > 0)

        } catch (e) {
            console.error("Error al procesar logros desde funciones globales:", e);
            placeholder.style.display = 'block'; // Asegurarse que el placeholder sea visible
            placeholder.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>Error al cargar logros.</p>';
             unlockedCountElement.textContent = 'E'; // Marcar error en contador
             totalCountElement.textContent = 'R';
             achievementsCompleted.style.width = '0%';
        } // Fin del catch
    } else {
        // Si las funciones globales AÚN no están listas
        console.warn('Funciones globales de logros no disponibles todavía. Esperando...');
        // El placeholder ya está visible con "Cargando..."
        
        // Reintentar después de un delay por si logros.js carga tarde
        setTimeout(() => {
             // Verificar DE NUEVO si las funciones ya existen
             if (typeof window.getAllAchievements === 'function' && typeof window.getUnlockedAchievements === 'function') {
                 console.log('Funciones de logros ahora disponibles. Reintentando carga...');
                 updateAchievementsDisplay(userIP); // Llamar de nuevo a la función
             } else if (placeholder.innerText.includes('Cargando')) { // Solo mostrar error si aún está cargando
                 placeholder.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>No se pudo conectar con el sistema de logros. Intenta recargar.</p>';
                 console.error("Error definitivo: Funciones de logros no se cargaron.");
                  unlockedCountElement.textContent = 'E'; 
                  totalCountElement.textContent = 'R';
                  achievementsCompleted.style.width = '0%';
             }
        }, 4000); // Esperar 4 segundos
    } // Fin del else (funciones globales no disponibles)
}

// Crear Tarjeta de Logro (CORREGIDO - Trabaja con estado unlocked)
function createAchievementCard(id, icon, title, description, count, maxCount, date, category, unlocked) {
    const card = document.createElement('div');
    card.className = `achievement-card ${category || 'beginner'}`;
    if (unlocked) {
        card.classList.add('unlocked'); // Clase si está desbloqueado
    } else {
         // Opcional: añadir clase si está bloqueado para estilos diferentes
         // card.classList.add('locked'); 
    }
    card.dataset.achievementId = id;
    
    const progressPercent = maxCount > 0 ? Math.min(100, (count / (maxCount || 1)) * 100) : (unlocked ? 100 : 0);
    const isMultiCount = maxCount > 1;
    const formattedDate = unlocked && date ? formatAchievementDate(date) : '';
    const displayCount = isMultiCount ? `${count} / ${maxCount}` : (unlocked ? 'Completado' : 'Bloqueado');

    card.innerHTML = `
        <div class="achievement-header">
            <div class="achievement-icon-wrapper">
                <i class="${icon || 'fas fa-question-circle'}"></i>
      </div>
            <div class="achievement-info">
                <div class="achievement-title">${title}</div>
                <div class="achievement-description">${description}</div>
            </div>
        </div>
        <div class="achievement-footer">
            ${isMultiCount ? `
            <div class="achievement-progress-bar">
                <div class="achievement-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            ` : ''}
            <div class="achievement-meta">
                <span class="achievement-count">${displayCount}</span>
                ${unlocked ? `<span class="achievement-date">${formattedDate}</span>` : ''}
            </div>
      </div>
    `;
    
    return card;
}

// Formatear Fecha Logro (SIN CAMBIOS)
function formatAchievementDate(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Fecha reciente';
    }
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Fecha reciente';
  }
}

// Obtener Logros Disponibles (Devuelve ARRAY de definiciones)
function getAvailableAchievements() {
  // DEVUELVE EL ARRAY DE DEFINICIONES COMO ESTABA ANTES
  return [
    { id: 'first_game', title: 'Primer Juego', description: 'Completa tu primer rosco de PASALA CHÉ', icon: 'fas fa-gamepad', category: 'beginner', maxCount: 1 },
    { id: 'perfect_game', title: 'Partida Perfecta', description: 'Completa un rosco sin cometer ningún error', icon: 'fas fa-award', category: 'expert', maxCount: 1 },
    { id: 'speed_demon', title: 'Velocista', description: 'Completa un rosco en menos de 2 minutos', icon: 'fas fa-bolt', category: 'expert', maxCount: 1 },
    { id: 'five_wins', title: 'Experto del Rosco', description: 'Gana 5 partidas', icon: 'fas fa-medal', category: 'intermediate', maxCount: 5 },
    { id: 'hard_mode', title: 'Nivel Experto', description: 'Gana una partida en dificultad difícil', icon: 'fas fa-fire', category: 'expert', maxCount: 1 },
    { id: 'no_help', title: 'Sin Ayuda', description: 'Completa el rosco sin usar ninguna pista', icon: 'fas fa-brain', category: 'intermediate', maxCount: 1 },
    { id: 'no_pass', title: 'Directo al Grano', description: 'Completa el rosco sin saltar ninguna pregunta', icon: 'fas fa-check-double', category: 'expert', maxCount: 1 },
    { id: 'comeback_king', title: 'Rey de la Remontada', description: 'Gana después de tener 5 respuestas incorrectas', icon: 'fas fa-crown', category: 'special', maxCount: 1 },
    { id: 'night_owl', title: 'Búho Nocturno', description: 'Juega una partida después de medianoche', icon: 'fas fa-moon', category: 'special', maxCount: 1 },
    //{ id: 'challenge_accepted', title: 'Desafío Aceptado', description: 'Completa un desafío diario', icon: 'fas fa-flag', category: 'special', maxCount: 1 } // Descomentar si hay desafíos diarios
  ];
}

// --- Otras Funciones (SIN CAMBIOS - Asegurar que existen y son correctas) ---

// Obtener Ranking (Placeholder - MODIFICADO PARA EVITAR ERROR 404)
async function fetchPlayerRankingPosition(identifier) {
  console.log(`(Placeholder) Obteniendo ranking para: ${identifier} - Se devuelve '-' para evitar error 404.`);
  // Comentar o eliminar la llamada fetch real que falla:
  /* 
  try {
    if (!identifier) return '-'; // Devolver placeholder si no hay identificador
    
    // Esta línea causa el error 404
    const response = await fetch('/api/ranking'); 
    
    if (!response.ok) {
      throw new Error('No se pudo cargar el ranking');
    }
    
    const ranking = await response.json();
    // Asumiendo que el ranking es un array de objetos { name: ..., score: ... }
    const playerIndex = ranking.findIndex(entry => entry.name === identifier);
    
    if (playerIndex !== -1) {
      return playerIndex + 1; // Posición real (1-based)
    } else {
      return '-'; // No encontrado en el ranking
    }
  } catch (error) {
    console.error('Error al obtener posición en el ranking:', error);
    return '-'; // Devolver placeholder en caso de error
  }
  */
  // Devolver directamente un placeholder para evitar el error 404
  return '-'; 
}

// Notificación de Logro (SIN CAMBIOS)
function showAchievementNotification(achievement) {
  if (!achievement) return;
  
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = 'achievement-notification';
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="${achievement.icon}"></i>
    </div>
    <div class="notification-content">
      <h4>¡Logro Desbloqueado!</h4>
      <p>${achievement.title}</p>
      <span>${achievement.description}</span>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Añadir al DOM
  document.body.appendChild(notification);
  
  // Mostrar con animación
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Evento para cerrar
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Auto-cerrar después de 5 segundos
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
}

// Añadir Estilos Notificación (SIN CAMBIOS)
(function addAchievementStyles() {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .achievement-notification {
      position: fixed;
      bottom: -100px;
      right: 20px;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
      border-radius: 12px;
      padding: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      z-index: 9999;
      width: 300px;
      border-left: 4px solid #3b82f6;
      transition: transform 0.3s ease, opacity 0.3s ease;
      transform: translateY(0);
      opacity: 0;
    }
    
    .achievement-notification.show {
      transform: translateY(-120px);
      opacity: 1;
    }
    
    .notification-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #3b82f6;
      flex-shrink: 0;
    }
    
    .notification-content {
      flex: 1;
    }
    
    .notification-content h4 {
      margin: 0 0 5px;
      color: #fff;
      font-size: 16px;
    }
    
    .notification-content p {
      margin: 0 0 3px;
      color: #e11d48;
      font-weight: bold;
      font-size: 14px;
    }
    
    .notification-content span {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      display: block;
    }
    
    .notification-close {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      padding: 5px;
      font-size: 14px;
      transition: color 0.3s ease;
    }
    
    .notification-close:hover {
      color: #fff;
    }
  `;
  document.head.appendChild(styleEl);
})();

// Configurar la gestión del perfil
function setupProfileManagement() {
  // Cambiar nombre de usuario
  const saveNameBtn = document.getElementById('save-name-btn');
  if (saveNameBtn) {
    saveNameBtn.addEventListener('click', changePlayerName);
  }
  
  // Reiniciar perfil
  const resetProfileBtn = document.getElementById('reset-profile-btn');
  if (resetProfileBtn) {
    resetProfileBtn.addEventListener('click', () => {
      showConfirmationModal(
        'Reiniciar Perfil', 
        '¿Estás seguro que deseas borrar todos tus datos de perfil? Esta acción no se puede deshacer.',
        resetPlayerProfile
      );
    });
  }
  
  // Exportar datos
  const exportDataBtn = document.getElementById('export-data-btn');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', exportProfileData);
  }
  
  // NUEVO: Botón para reparar historial
  const repairHistoryBtn = document.getElementById('repair-history-btn');
  if (repairHistoryBtn) {
    repairHistoryBtn.addEventListener('click', repairGameHistory);
  } else {
    // Si el botón no existe en el HTML, agregarlo dinámicamente
    const profileSettings = document.getElementById('profile-settings');
    if (profileSettings) {
      const repairSection = document.createElement('div');
      repairSection.className = 'profile-setting';
      repairSection.innerHTML = `
        <div class="setting-label">
          <i class="fas fa-wrench"></i> Reparar Historial
          <span class="setting-description">Elimina entradas duplicadas del historial de partidas</span>
        </div>
        <button id="repair-history-btn" class="action-button">
          <i class="fas fa-tools"></i> Reparar
        </button>
        <div id="repair-history-result" class="repair-result" style="display: none;">
          <i class="fas fa-check-circle"></i> <span id="repair-history-message"></span>
        </div>
      `;
      
      profileSettings.appendChild(repairSection);
      
      // Agregar event listener al botón recién creado
      document.getElementById('repair-history-btn').addEventListener('click', repairGameHistory);
    }
  }
  
  // Modal
  const modalClose = document.querySelector('.modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  
  if (modalClose) {
    modalClose.addEventListener('click', hideModal);
  }
  
  if (modalCancel) {
    modalCancel.addEventListener('click', hideModal);
  }
}

// Nueva función para reparar el historial de juegos
function repairGameHistory() {
  const userIP = localStorage.getItem('userIP');
  if (!userIP) {
    showNotification('Error', 'No se pudo detectar tu identidad.', 'error');
    return;
  }
  
  const repairBtn = document.getElementById('repair-history-btn');
  if (repairBtn) {
    // Cambiar botón a estado de "procesando"
    repairBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    repairBtn.disabled = true;
  }
  
  try {
    // Obtener historial actual
    const historyKey = `gameHistory_${userIP}`;
    const storedHistory = localStorage.getItem(historyKey);
    
    if (!storedHistory) {
      showNotification('Información', 'No hay historial de partidas para reparar.', 'info');
      resetRepairButton();
      return;
    }
    
    // Parsear historial
    let history = [];
    try {
      history = JSON.parse(storedHistory);
      if (!Array.isArray(history)) {
        localStorage.removeItem(historyKey); // Eliminar datos corruptos
        showNotification('Completado', 'Se eliminaron datos corruptos del historial.', 'success');
        resetRepairButton();
        return;
      }
      
      if (history.length <= 1) {
        showNotification('Información', 'El historial es demasiado pequeño para requerir reparación.', 'info');
        resetRepairButton();
        return;
      }
    } catch (e) {
      localStorage.removeItem(historyKey); // Eliminar datos corruptos
      showNotification('Completado', 'Se eliminaron datos corruptos del historial.', 'success');
      resetRepairButton();
      return;
    }
    
    const originalLength = history.length;
    
    // Proceso de de-duplicación (igual al implementado en cleanupGameHistory)
    // --- FASE 1: De-duplicación por uniqueId ---
    const seenUniqueIds = new Set();
    const cleanHistory1 = [];
    
    for (const entry of history) {
        if (entry.uniqueId) {
            if (!seenUniqueIds.has(entry.uniqueId)) {
                seenUniqueIds.add(entry.uniqueId);
                cleanHistory1.push(entry);
            }
        } else {
            cleanHistory1.push(entry);
        }
    }
    
    // --- FASE 2: De-duplicación por clave compuesta ---
    const seenKeys = new Set();
    const cleanHistory2 = [];
    
    for (const entry of cleanHistory1) {
        if (!entry.uniqueId) {
            let entryTimestamp = 'invalid_date';
            try {
                const date = new Date(entry.date);
                if (!isNaN(date.getTime())) {
                    date.setSeconds(0, 0);
                    entryTimestamp = date.getTime().toString();
                } else {
                    entryTimestamp = entry.date || `unknown-${Math.random()}`;
                }
            } catch (e) {
                entryTimestamp = entry.date || `invalid-${Math.random()}`;
            }
            
            // Crear clave única compuesta
            const uniqueKey = `${entryTimestamp}-${entry.score || 0}-${entry.victory}-${entry.difficulty || 'unknown'}-${entry.correct || 0}-${entry.wrong || 0}`;
            
            if (!seenKeys.has(uniqueKey)) {
                seenKeys.add(uniqueKey);
                cleanHistory2.push(entry);
            }
        } else {
            cleanHistory2.push(entry);
        }
    }
    
    // --- FASE 3: Ordenar y limitar ---
    const sortedHistory = cleanHistory2.sort((a, b) => {
        try {
            return new Date(b.date) - new Date(a.date);
        } catch (e) {
            return 0;
        }
    });
    
    const limitedHistory = sortedHistory.slice(0, 50);
    const removedEntries = originalLength - limitedHistory.length;
    
    if (removedEntries > 0) {
        // Guardar nuevo historial limpio
        localStorage.setItem(historyKey, JSON.stringify(limitedHistory));
        
        // Mostrar mensaje con el resultado
        const resultContainer = document.getElementById('repair-history-result');
        const messageEl = document.getElementById('repair-history-message');
        
        if (resultContainer && messageEl) {
            messageEl.textContent = `Se eliminaron ${removedEntries} entradas duplicadas.`;
            resultContainer.style.display = 'block';
            
            // Ocultar el mensaje después de 10 segundos
            setTimeout(() => {
                resultContainer.style.display = 'none';
            }, 10000);
        }
        
        // Mostrar notificación
        showNotification('Reparación completa', `Se eliminaron ${removedEntries} entradas duplicadas de tu historial.`, 'success');
        
        // Forzar recálculo de estadísticas
        const profile = loadProfileData(userIP);
        profile.then(profileData => {
            if (profileData) {
                updateProfileStats(profileData, userIP);
                saveProfileData(userIP, profileData);
                updateProfileUI(profileData, userIP);
                updateGameHistory(userIP);
            }
        });
    } else {
        // No se encontraron duplicados
        showNotification('Información', 'No se encontraron entradas duplicadas en tu historial.', 'info');
    }
    
    resetRepairButton();
  } catch (error) {
    console.error('[repairGameHistory] Error:', error);
    showNotification('Error', 'Ocurrió un error al intentar reparar el historial.', 'error');
    resetRepairButton();
  }
  
  // Función para restablecer el botón
  function resetRepairButton() {
    const repairBtn = document.getElementById('repair-history-btn');
    if (repairBtn) {
      repairBtn.innerHTML = '<i class="fas fa-tools"></i> Reparar';
      repairBtn.disabled = false;
    }
  }
}

// Cambiar nombre de jugador
function changePlayerName() {
  const nameInput = document.getElementById('new-name-input');
  if (!nameInput || !nameInput.value.trim()) return;
  
  const newName = nameInput.value.trim();
  
  // Validar longitud
  if (newName.length < 3) {
    alert('El nombre debe tener al menos 3 caracteres');
    return;
  }
  
  if (newName.length > 20) {
    alert('El nombre debe tener como máximo 20 caracteres');
    return;
  }
  
  // Guardar el nombre globalmente y en el perfil
  localStorage.setItem('playerName', newName);
  localStorage.setItem('userName', newName);
  
  // Obtener IP para actualizar el perfil específico
  const userIP = localStorage.getItem('userIP');
  if (userIP) {
    const profileKey = `profile_${userIP}`;
    let profile = null;
    
    try {
      const storedProfile = localStorage.getItem(profileKey);
      if (storedProfile) {
        profile = JSON.parse(storedProfile);
        profile.name = newName;
        saveProfileData(userIP, profile);
        
        // Actualizar UI con el nuevo nombre
        const usernameElement = document.getElementById('profile-username');
        if (usernameElement) {
          usernameElement.textContent = newName;
        }
        
        // Mostrar notificación
        alert(`Nombre cambiado a: ${newName}`);
      }
    } catch (error) {
      console.error('Error al actualizar el nombre:', error);
      alert('No se pudo cambiar el nombre. Inténtalo de nuevo.');
    }
  }
}

// Reiniciar perfil de jugador
function resetPlayerProfile() {
  const userIP = localStorage.getItem('userIP');
  if (!userIP) return;
  
  try {
    // Eliminar perfil
    localStorage.removeItem(`profile_${userIP}`);
    
    // Eliminar logros
    localStorage.removeItem(`achievements_${userIP}`);
    
    // Eliminar historial
    localStorage.removeItem(`gameHistory_${userIP}`);
    
    // Mantener el nombre global si existe
    const globalName = localStorage.getItem('playerName') || localStorage.getItem('userName');
    
    // Crear un nuevo perfil vacío
    const newProfile = createDefaultProfile(userIP);
    if (globalName) {
      newProfile.name = globalName;
    }
    saveProfileData(userIP, newProfile);
    
    // Recargar la página
    alert('Tu perfil ha sido reiniciado correctamente.');
    window.location.reload();
  } catch (error) {
    console.error('Error al reiniciar el perfil:', error);
    alert('Ocurrió un error al reiniciar el perfil. Inténtalo de nuevo.');
  }
}

// Mostrar modal de confirmación
function showConfirmationModal(title, message, confirmCallback) {
  const modal = document.getElementById('confirmation-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalConfirm = document.getElementById('modal-confirm');
  
  if (!modal || !modalTitle || !modalMessage || !modalConfirm) return;
  
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  
  // Remover listeners anteriores
  const newModalConfirm = modalConfirm.cloneNode(true);
  modalConfirm.parentNode.replaceChild(newModalConfirm, modalConfirm);
  
  // Añadir nuevo listener
  newModalConfirm.addEventListener('click', () => {
    if (typeof confirmCallback === 'function') {
      confirmCallback();
    }
    hideModal();
  });
  
  modal.style.display = 'flex';
}

// Ocultar modal
function hideModal() {
  const modal = document.getElementById('confirmation-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Función para configurar los filtros
function setupFilters() {
  // Filtro de historial
  const historyFilter = document.getElementById('history-filter');
  if (historyFilter) {
    historyFilter.addEventListener('change', function() {
      filterHistoryEntries(this.value);
    });
  }
  
  // Filtro de logros
  const achievementsFilter = document.getElementById('achievements-filter');
  if (achievementsFilter) {
    achievementsFilter.addEventListener('change', function() {
      filterAchievements(this.value);
    });
  }
}

// Función para filtrar entradas del historial
function filterHistoryEntries(filterType) {
  const historyContainer = document.getElementById('game-history-list');
  const entries = historyContainer.querySelectorAll('.game-entry');
  const emptyState = document.querySelector('.empty-state');
  
  if (!entries.length) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  if (emptyState) emptyState.style.display = 'none';
  
  let visibleCount = 0;
  
  entries.forEach(entry => {
    if (filterType === 'all') {
      entry.style.display = 'flex';
      visibleCount++;
    } else if (filterType === 'victories' && entry.querySelector('.victory')) {
      entry.style.display = 'flex';
      visibleCount++;
    } else if (filterType === 'defeats' && entry.querySelector('.defeat')) {
      entry.style.display = 'flex';
      visibleCount++;
        } else {
      entry.style.display = 'none';
    }
  });
  
  // Mostrar mensaje de vacío si no hay entradas visibles después del filtrado
  if (visibleCount === 0 && emptyState) {
    emptyState.style.display = 'block';
  }
}

// Función para filtrar logros
function filterAchievements(filterType) {
  const achievementsContainer = document.getElementById('achievements-list');
  const achievements = achievementsContainer.querySelectorAll('.achievement-card');
  
  achievements.forEach(card => {
    if (filterType === 'all') {
      card.style.display = 'flex';
    } else if (filterType === 'unlocked' && card.classList.contains('unlocked')) {
      card.style.display = 'flex';
    } else if (filterType === 'locked' && !card.classList.contains('unlocked')) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// Actualizar la función updateProfileUI para actualizar los gráficos circulares
function updateCircularProgress(elementId, percentage) {
  const element = document.querySelector(`#${elementId}`).closest('.highlight-stat').querySelector('.circular-progress');
  if (!element) return;
  
  // Asegurarse de que el porcentaje esté en el rango correcto
  percentage = Math.max(0, Math.min(100, percentage));
  
  // Actualizar atributo de datos
  element.setAttribute('data-value', percentage);
  
  const circle = element.querySelector('.progress-ring-circle');
  if (!circle) return;
  
  const radius = circle.getAttribute('r');
  const circumference = 2 * Math.PI * radius;
  
  // Establecer la longitud total de la circunferencia
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  
  // Calcular la porción llena del círculo
  const offset = circumference - (percentage / 100) * circumference;
  circle.style.strokeDashoffset = offset;
  
  // Actualizar texto de porcentaje (opcional)
  const textElement = element.querySelector('.progress-text');
  if (textElement) {
    textElement.textContent = `${percentage}%`;
  }
  
  // Añadir el gradiente si no existe
  if (!document.getElementById('progress-gradient')) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.width = 0;
    svg.style.height = 0;
    svg.style.position = 'absolute';
    
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradient.setAttribute("id", "gradient");
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "0%");
    
    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#4f46e5");
    
    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#ec4899");
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);
    
    document.body.appendChild(svg);
  }
}

// Comprobar si el historial está vacío para mostrar el estado vacío
function checkForEmptyHistory(userIP) {
  const historyContainer = document.getElementById('game-history-list');
  const emptyState = document.querySelector('.empty-state');
  
  if (!historyContainer || !emptyState) return;
  
  const historyKey = `gameHistory_${userIP}`;
  let history = [];
  const storedHistory = localStorage.getItem(historyKey);
  
  if (storedHistory) {
    try {
      history = JSON.parse(storedHistory);
      if (!Array.isArray(history)) history = [];
    } catch (e) {
      history = [];
    }
  }
  
  const placeholder = document.getElementById('history-placeholder');
  
  if (history.length === 0) {
    if (placeholder) placeholder.style.display = 'none';
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
  }
}

// Configurar botón flotante de jugar
function setupFloatingActionButton() {
  const fab = document.getElementById('play-now-fab');
  if (fab) {
    fab.addEventListener('click', function() {
      window.location.href = 'pasalache.html';
    });
  }
}

// Nueva función para obtener código JSON para exportación de datos
function getProfileDataForExport(userIP) {
  if (!userIP) return null;
  
  // Recopilar todos los datos relacionados con el usuario
  const data = {
    profile: null,
    gameHistory: [],
    achievements: []
  };
  
  // Obtener perfil
  const profileKey = `profile_${userIP}`;
  const profileData = localStorage.getItem(profileKey);
  if (profileData) {
    try {
      data.profile = JSON.parse(profileData);
    } catch (e) {
      console.error('Error parsing profile data for export:', e);
    }
  }
  
  // Obtener historial
  const historyKey = `gameHistory_${userIP}`;
  const historyData = localStorage.getItem(historyKey);
  if (historyData) {
    try {
      data.gameHistory = JSON.parse(historyData);
    } catch (e) {
      console.error('Error parsing history data for export:', e);
    }
  }
  
  // Obtener logros
  const achievementsKey = `achievements_${userIP}`;
  const achievementsData = localStorage.getItem(achievementsKey);
  if (achievementsData) {
    try {
      data.achievements = JSON.parse(achievementsData);
    } catch (e) {
      console.error('Error parsing achievements data for export:', e);
    }
  }
  
  return data;
}

// Exportar datos del perfil
function exportProfileData() {
  const userIP = localStorage.getItem('userIP');
  if (!userIP) {
    showNotification('Error', 'No se pudo identificar tu perfil para exportar.', 'error');
    return;
  }
  
  const data = getProfileDataForExport(userIP);
  if (!data) {
    showNotification('Error', 'No se pudieron obtener los datos para exportar.', 'error');
    return;
  }
  
  // Convertir a JSON formateado
  const jsonData = JSON.stringify(data, null, 2);
  
  // Crear un blob y un link para descargar
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `perfil_pasalache_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  
  // Limpiar
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  showNotification('Exportación Completada', 'Tus datos han sido exportados correctamente.', 'success');
}

// Mostrar notificación
function showNotification(title, message, type = 'success') {
  const notification = document.getElementById('success-notification');
  if (!notification) return;
  
  // Configurar contenido
  const titleElement = notification.querySelector('.notification-title');
  const messageElement = notification.querySelector('.notification-message');
  const iconElement = notification.querySelector('.notification-icon i');
  
  if (titleElement) titleElement.textContent = title;
  if (messageElement) messageElement.textContent = message;
  
  // Configurar tipo
  notification.className = 'notification';
  notification.classList.add(type);
  
  if (iconElement) {
    if (type === 'success') {
      iconElement.className = 'fas fa-check-circle';
      notification.style.borderLeftColor = 'var(--color-success)';
    } else if (type === 'error') {
      iconElement.className = 'fas fa-exclamation-circle';
      notification.style.borderLeftColor = 'var(--color-error)';
    } else if (type === 'warning') {
      iconElement.className = 'fas fa-exclamation-triangle';
      notification.style.borderLeftColor = 'var(--color-warning)';
    }
  }
  
  // Mostrar notificación
  notification.classList.add('show');
  
  // Configurar cierre
  const closeButton = notification.querySelector('.notification-close');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      notification.classList.remove('show');
    });
  }
  
  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    notification.classList.remove('show');
  }, 5000);
}

function getAchievementIcon(id) {
  const icons = {
    'first_game': 'fas fa-gamepad',
    'perfect_game': 'fas fa-star',
    'fast_answer': 'fas fa-bolt',
    'streak_5': 'fas fa-fire',
    'streak_10': 'fas fa-fire-alt',
    'no_pass': 'fas fa-trophy'
    // Añadir más según sea necesario
  };
  return icons[id] || 'fas fa-award';
}

function getTotalAchievementsCount() {
  // If logros.js is loaded and provides the array, use its length
  if (typeof window.getAllAchievements === 'function') { // Check for the function instead of the array
      try {
        // Attempt to get the length dynamically
        return window.getAllAchievements().length;
      } catch (e) {
        console.warn('Error getting achievements length dynamically:', e);
        // Fallback if the function fails for some reason
      }
  } 
  // Fallback to the known total if the script isn't loaded or function isn't ready/fails
  return 81; // Updated fallback total
}

// Mostrar estado vacío de logros (solo para desbloqueados)
function showEmptyAchievements() {
  // ... (contenido actual sin cambios) ...
}

/* Funciones auxiliares obsoletas - eliminadas/comentadas 
   ya que la información ahora viene de logros.js

function getAchievementTitle(id) { ... }
function getAchievementDescription(id) { ... }
function getAchievementIcon(id) { ... }
function getAvailableAchievements() { ... }

*/

// Escuchar eventos de actualización de logros
window.addEventListener('update_profile_achievements', function(event) {
  // ... (contenido actual sin cambios) ...
});

// Definiciones de logros de respaldo (COMPLETA - ASEGURAR QUE ESTÉN LOS 81)
const fallbackAchievementDefinitions = [
    {
        id: "gol_primer_minuto",
        title: "Gol en el Primer Minuto",
        description: "Responde correctamente a la primera pregunta en menos de 3 segundos.",
        category: "intermedio",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-bolt"
    },
    {
        id: "gol_tiempo_descuento",
        title: "Gol en Tiempo de Descuento",
        description: "Responde correctamente a la última pregunta con menos de 5 segundos restantes.",
        category: "especial",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-stopwatch"
    },
    {
        id: "tecnologia_linea_gol",
        title: "Tecnología de Línea de Gol",
        description: "Utiliza la opción de ayuda correctamente 10 veces seguidas.",
        category: "intermedio",
        maxCount: 10,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-life-ring"
    },
    {
        id: "decision_var",
        title: "Decisión del VAR",
        description: "Cambia tu respuesta y acierta después de dudar inicialmente.",
        category: "intermedio",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-video"
    },
    {
        id: "centenario",
        title: "Centenario",
        description: "Juega un total de 100 partidas.",
        category: "épico",
        maxCount: 100,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-trophy"
    },
    {
        id: "porteria_cero",
        title: "Portería a Cero",
        description: "Completa una partida sin errores.",
        category: "intermedio",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-shield-alt"
    },
    {
        id: "first_game",
        title: "Primer Gol",
        description: "Completa tu primera pregunta correctamente en el juego.",
        category: "básico",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-gamepad"
    },
    {
        id: "perfect_game",
        title: "Juego Perfecto",
        description: "Completa un juego respondiendo correctamente todas las preguntas.",
        category: "especial",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-star"
    },
    {
        id: "speed_demon",
        title: "Velocidad Máxima",
        description: "Completa una partida en menos de 2 minutos con respuestas correctas.",
        category: "intermedio",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-bolt"
    },
    {
        id: "five_wins",
        title: "Pentacampeón",
        description: "Gana 5 partidas.",
        category: "intermedio",
        maxCount: 5,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-medal"
    },
    {
        id: "hard_mode",
        title: "Modo Difícil",
        description: "Gana una partida en dificultad difícil.",
        category: "avanzado",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-fire"
    },
    {
        id: "no_help",
        title: "Sin Ayuda",
        description: "Completa una partida sin usar pistas y con respuestas correctas.",
        category: "avanzado",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-user-graduate"
    },
    {
        id: "no_pass",
        title: "Sin Pasar",
        description: "Completa un juego sin usar la opción 'Pasala Ché'.",
        category: "intermedio",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-flag-checkered"
    },
    {
        id: "comeback_king",
        title: "Rey de la Remontada",
        description: "Gana una partida después de haber cometido 5 o más errores.",
        category: "especial",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-crown"
    },
    {
        id: "night_owl",
        title: "Búho Nocturno",
        description: "Juega una partida entre la medianoche y las 5 de la mañana.",
        category: "especial",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-moon"
    },
    {
        id: "fast_answer",
        title: "Respuesta Rápida",
        description: "Responde correctamente en menos de 5 segundos.",
        category: "básico",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-bolt"
    },
    {
        id: "streak_5",
        title: "En Racha",
        description: "Responde correctamente 5 preguntas consecutivas.",
        category: "intermedio",
        maxCount: 5,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-fire"
    },
    {
        id: "streak_10",
        title: "Racha Imparable",
        description: "Responde correctamente 10 preguntas seguidas.",
        category: "avanzado",
        maxCount: 10,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-fire-alt"
    },
    {
        id: "world_cup_expert",
        title: "Experto en Mundiales",
        description: "Acerta todas las preguntas relacionadas con Copas del Mundo.",
        category: "especialista",
        maxCount: 1,
        count: 0,
        unlocked: false,
        date: null,
        icon: "fas fa-globe"
    }
    // SE ASUME QUE FALTAN ~62 LOGROS MÁS AQUÍ
    // SI ESTA LISTA SIGUE INCOMPLETA, EL TOTAL SERÁ INCORRECTO
];

// Listener for achievement updates from other tabs/windows (via logros.js/logros.html)
window.addEventListener('achievement_updated', (event) => {
    // --- Check Loading Flag --- START
    if (isProfileLoading) {
        console.warn('Carga de perfil en progreso. Omitiendo actualización de logros por evento.');
        return;
    }
    // --- Check Loading Flag --- END

    console.log('Evento achievement_updated recibido en profile.js:', event.detail);
    const userIP = localStorage.getItem('userIP');
    if (userIP) {
        // Reload profile data minimally to update achievement display
        loadProfileData(userIP).then(profile => {
            if (profile) {
                updateAchievementsDisplay(profile);
            }
        }).catch(err => {
             console.error('Error recargando datos para actualizar logros:', err);
        });
    }
});

// Listener to potentially trigger profile update from other parts of the app
window.addEventListener('request_profile_update', () => {
    // --- Check Loading Flag --- START
    if (isProfileLoading) {
        console.warn('Carga de perfil en progreso. Omitiendo request_profile_update.');
        return;
    }
    // --- Check Loading Flag --- END

    console.log('Evento request_profile_update recibido.');
    const userIP = localStorage.getItem('userIP');
    if (userIP) {
        // Force recalculation if requested
        loadUserProfile(userIP, true); // This call is now protected by the flag
    }
});

console.log('profile.js cargado y listo.');