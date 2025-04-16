// profile.js - Funcionalidad para la página de perfil moderna
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
      
      // Si venimos de una partida completada, mostrar notificación y redirigir
      if (fromGame) {
        // Mostrar notificación de actualización
        showProfileUpdatedNotification();
        
        // Limpiar el flag
        localStorage.removeItem('gameJustCompleted');
        
        // Después de mostrar el perfil brevemente, redirigir al ranking
        setTimeout(() => {
          window.location.href = 'ranking.html?fromGame=true&t=' + Date.now();
        }, 3500);
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
    <div style="font-size: 0.8rem; margin-top: 5px;">Redirigiendo al ranking en 5 segundos...</div>
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

    const historyKey = `gameHistory_${userIP}`;
    let history = [];
    const storedHistory = localStorage.getItem(historyKey);

    if (storedHistory) {
        try {
            history = JSON.parse(storedHistory);
            if (!Array.isArray(history)) history = [];
        } catch (e) {
            console.error('Error al parsear historial:', e);
            history = [];
        }
    }

    if (history.length === 0) {
    placeholder.innerHTML = '<i class="fas fa-folder-open"></i><p>Aún no has jugado ninguna partida.</p>';
    return; // Mantener placeholder visible si no hay historial
  }

  placeholder.style.display = 'none'; // Ocultar placeholder si hay historial

  // Limitar a las últimas X partidas (ej. 20)
  const recentHistory = history.slice(0, 20);

    recentHistory.forEach(game => {
    const entryElement = document.createElement('div');
    entryElement.classList.add('game-entry');

    const resultIconClass = game.victory ? 'fas fa-check-circle victory' : 'fas fa-times-circle defeat';
    const resultText = game.victory ? 'Victoria' : 'Derrota';
    const gameDate = new Date(game.date).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

// Cargar Perfil (SIN CAMBIOS - ya maneja forceReload y recalcula)
async function loadUserProfile(userIP, forceReload = false) {
  showLoadingIndicator(true);
  hideProfileContent(true);
  document.getElementById('profile-error').style.display = 'none'; // Ocultar errores previos

  const profileKey = `profile_${userIP}`;
                let profile = null;
                
                    try {
    // Forzar recarga desde historial si es necesario
    if (forceReload) {
        console.log("Forzando recarga de perfil desde historial...");
        const storedProfile = localStorage.getItem(profileKey);
        if (storedProfile) {
                        profile = JSON.parse(storedProfile);
        } else {
                           profile = createDefaultProfile(userIP);
        }
        updateProfileStats(profile, userIP); // Recalcular stats
        saveUserProfile(profile, userIP); // Guardar stats actualizadas
    } else {
        const storedProfile = localStorage.getItem(profileKey);
        if (storedProfile) {
            profile = JSON.parse(storedProfile);
             // Validar si las stats básicas parecen faltar (pudo guardarse mal)
            if (profile.gamesPlayed === undefined || profile.totalScore === undefined) {
                console.warn("Perfil incompleto detectado, recalculando stats...");
                updateProfileStats(profile, userIP);
                saveUserProfile(profile, userIP); 
                    }
                } else {
                        profile = createDefaultProfile(userIP);
            updateProfileStats(profile, userIP); // Calcular stats iniciales si es nuevo
            saveUserProfile(profile, userIP);
        }
    }

    // Cargar nombre si no existe en perfil pero sí globalmente
    if (!profile.name) {
        const globalName = localStorage.getItem('playerName') || localStorage.getItem('userName');
        if (globalName) {
            profile.name = globalName;
            saveUserProfile(profile, userIP);
        }
    }

    // Obtener posición en el ranking (asíncrono)
    // Esto puede permanecer como placeholder o actualizarse aquí
    profile.rankingPosition = await fetchPlayerRankingPosition(profile.name || userIP);

    // Actualizar UI principal (esto también ocultará el loader)
    updateProfileUI(profile, userIP); // Usa la función UI revisada

    // Cargar historial y logros (éstos manejan sus propios placeholders)
    updateGameHistory(userIP);
    updateAchievementsDisplay(userIP); // Llama a la función de logros revisada

  } catch (error) {
    console.error('Error al cargar el perfil completo:', error);
    displayProfileError('Error fatal al cargar datos del perfil.');
  }
}

// Guardar Perfil (CORREGIDO - Guarda el objeto COMPLETO)
function saveUserProfile(profile, userIP) {
    if (!profile || !userIP) {
    console.error('Error: Falta perfil o IP de usuario para guardar');
        return false;
    }

  const profileKey = `profile_${userIP}`; // Usar clave consistente
  try {
    // Añadir timestamp de guardado
    profile.lastUpdated = new Date().toISOString();
    
    // Guardar el objeto profile COMPLETO
    localStorage.setItem(profileKey, JSON.stringify(profile)); 
    
    console.log('Perfil completo guardado para IP:', userIP, profile);
        return true;
  } catch (error) {
    console.error(`Error guardando perfil para ${userIP}:`, error);
    // Considerar mostrar un error al usuario si el guardado falla críticamente
        return false;
    }
}

// Cargar Logros (Devuelve ARRAY)
function loadAchievementsFromLocalStorage(userIP) {
    if (!userIP) {
        console.error('Se requiere userIP para cargar los logros');
    return []; // Devolver ARRAY vacío si no hay IP
    }
  const achievementsKey = `achievements_${userIP}`; // Clave consistente
    const storedAchievements = localStorage.getItem(achievementsKey);
    if (storedAchievements) {
        try {
      const parsed = JSON.parse(storedAchievements);
      // Asegurarse de que es un array
      return Array.isArray(parsed) ? parsed : []; 
        } catch (e) {
      console.error('Error al parsear logros desde localStorage:', e);
      localStorage.removeItem(achievementsKey); // Remover datos corruptos
            return [];
        }
    }
  return []; // Devolver ARRAY vacío si no hay nada guardado
}

// Guardar Logros (Espera ARRAY)
function saveAchievementsForIP(achievements, userIP) {
  if (!Array.isArray(achievements) || !userIP) { // Verifica que sea ARRAY
        console.error('Se requieren achievements (array) y userIP para guardar los logros');
        return false;
    }
  const achievementsKey = `achievements_${userIP}`; // Clave consistente
    try {
    localStorage.setItem(achievementsKey, JSON.stringify(achievements));
    console.log(`Logros guardados para IP ${userIP}:`, achievements);
        return true;
    } catch (e) {
        console.error('Error al guardar los logros:', e);
        return false;
    }
}

// Desbloquear Logro (Trabaja con ARRAY)
function unlockAchievement(achievementId, userIP, count = 1) {
  if (!achievementId || !userIP) return false;
  
  try {
    const achievements = loadAchievementsFromLocalStorage(userIP); // Carga el array
    const availableDefinitions = getAvailableAchievements(); // Carga las definiciones
    const definition = availableDefinitions.find(a => a.id === achievementId);

    if (!definition) {
      console.error('Definición de logro no encontrada:', achievementId);
        return false;
    }

    const existingIndex = achievements.findIndex(a => a.id === achievementId);
    let isNewUnlock = false;

    if (existingIndex >= 0) {
      // Ya existe, actualizar contador si es relevante y no está ya al máximo
      const currentAchievement = achievements[existingIndex];
      const neededCount = definition.maxCount || 1;
      if (neededCount > 1 && currentAchievement.count < neededCount) {
          currentAchievement.count = (currentAchievement.count || 0) + count;
          currentAchievement.date = new Date().toISOString(); // Actualizar fecha
          // Comprobar si AHORA se desbloquea
          if (!currentAchievement.unlocked && currentAchievement.count >= neededCount) {
              currentAchievement.unlocked = true;
              isNewUnlock = true;
              console.log(`Logro multi-count completado: ${achievementId}`);
  } else {
               console.log(`Progreso de logro actualizado: ${achievementId}, Count: ${currentAchievement.count}`);
          }
        } else {
          // Si es maxCount=1 o ya estaba desbloqueado/contado, no hacer nada más que quizás actualizar fecha?
          // achievements[existingIndex].date = new Date().toISOString(); // Opcional: actualizar fecha siempre?
          console.log(`Logro ${achievementId} ya estaba desbloqueado o no requiere más conteo.`);
          return false; // No hubo nuevo desbloqueo ni progreso relevante
      }
    } else {
      // Es nuevo, añadirlo al array
       const newAchievement = {
        id: achievementId,
        count: Math.min(count, definition.maxCount || 1), // Asegurar que el conteo inicial no exceda maxCount
        category: definition.category,
        date: new Date().toISOString(),
        unlocked: false // Se marcará como unlocked si cumple condición
      };

      if (newAchievement.count >= (definition.maxCount || 1)) {
          newAchievement.unlocked = true;
          isNewUnlock = true; // Es un nuevo desbloqueo
      }
      achievements.push(newAchievement);
    }
    
    // Guardar el array actualizado
    saveAchievementsForIP(achievements, userIP);

    // Mostrar notificación solo si es un desbloqueo nuevo y completo
    if (isNewUnlock) {
        console.log('Mostrando notificación para logro nuevo/completado:', achievementId);
        showAchievementNotification(definition); // Mostrar notificación con la definición
    }
    return true;

  } catch (error) {
    console.error(`Error desbloqueando logro ${achievementId}:`, error);
    return false;
  }
}

// Actualizar UI de Logros (CORREGIDO - Trabaja con ARRAY)
function updateAchievementsDisplay(userIP) {
    const achievementsContainer = document.getElementById('achievements-list');
    const placeholder = document.getElementById('achievements-placeholder');

    if (!achievementsContainer || !placeholder) {
        console.error('Contenedor de logros o placeholder no encontrado.');
    return;
  }
  
    placeholder.style.display = 'block'; // Mostrar placeholder mientras se carga
    achievementsContainer.innerHTML = ''; // Limpiar contenido previo
    achievementsContainer.appendChild(placeholder); // Re-adjuntar placeholder

    const userAchievementsArray = loadAchievementsFromLocalStorage(userIP); // Carga el ARRAY
    const allPossibleAchievements = getAvailableAchievements(); // Carga ARRAY de definiciones

    if (allPossibleAchievements.length === 0) {
        placeholder.innerHTML = '<i class="fas fa-question-circle"></i><p>No hay logros definidos en el juego.</p>';
    return;
  }
  
    // Crear un mapa de definiciones para fácil acceso
    const definitionsMap = allPossibleAchievements.reduce((map, def) => {
        map[def.id] = def;
        return map;
  }, {});

    // Combinar datos del usuario con definiciones
    const combinedAchievements = allPossibleAchievements.map(def => {
        const userData = userAchievementsArray.find(ua => ua.id === def.id);
        return {
            ...def, // Datos de definición (title, desc, icon, maxCount, category)
            ...(userData || {}), // Datos del usuario (count, date, unlocked)
            unlocked: userData ? (userData.unlocked ?? (userData.count >= (def.maxCount || 1))) : false, // Asegurar que unlocked esté bien definido
            count: userData ? (userData.count || 0) : 0 // Asegurar que count exista
        };
    });

    // Ordenar: Desbloqueados primero, luego por categoría, luego alfabético
    combinedAchievements.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        // Aquí puedes añadir orden por categoría si quieres
        const categoryOrder = ['special', 'expert', 'intermediate', 'beginner', 'otros'];
        const catAIndex = categoryOrder.indexOf(a.category || 'otros');
        const catBIndex = categoryOrder.indexOf(b.category || 'otros');
        if (catAIndex !== catBIndex) return catAIndex - catBIndex;
        // Finalmente por título
        return a.title.localeCompare(b.title);
    });
    
    placeholder.style.display = 'none'; // Ocultar placeholder
    achievementsContainer.innerHTML = ''; // Limpiar de nuevo antes de añadir tarjetas

    if (combinedAchievements.length === 0) { // Seguridad por si algo falla
         placeholder.style.display = 'block';
         placeholder.innerHTML = '<i class="fas fa-folder-open"></i><p>No se pudieron cargar los logros.</p>';
         return;
    }
    
    // Actualizar barra de progreso de logros
    const unlockedCount = combinedAchievements.filter(a => a.unlocked).length;
    const totalCount = combinedAchievements.length;
    const progressPercent = (unlockedCount / totalCount) * 100;
    
    const countElement = document.querySelector('.achievements-count');
    if (countElement) countElement.textContent = unlockedCount;
    
    const progressFill = document.getElementById('achievements-progress-fill');
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }
    
    // Renderizar tarjetas
    combinedAchievements.forEach(ach => {
        const card = createAchievementCard(
            ach.id,
            ach.icon,
            ach.title,
            ach.description,
            ach.count,
            ach.maxCount,
            ach.date,
            ach.category,
            ach.unlocked // Pasar el estado unlocked
        );
        achievementsContainer.appendChild(card);
    });
    
    // Añadir estilos CSS si no existen (como estaba antes, debería funcionar)
    if (!document.getElementById('achievements-styles')) {
      // ... (código para añadir los estilos de logros - sin cambios) ...
    }
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

// Crear Perfil por Defecto (SIN CAMBIOS)
function createDefaultProfile(userIP) {
  console.log(`[createDefaultProfile] Creando perfil por defecto para IP: ${userIP}`);
  return {
    name: localStorage.getItem('username') || 'Jugador Anónimo', // Intentar obtener nombre guardado
    userIP: userIP,
    gamesPlayed: 0,
    totalScore: 0,
    bestScore: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalSkipped: 0,
    totalTime: 0,
    victories: 0,
    defeats: 0,
    achievementsCount: 0,
    rankingPosition: null, // El ranking se determinará por separado
    status: 'Novato', // Un estado inicial lógico
    lastPlayed: null, // Sin fecha de última partida
    createdAt: new Date().toISOString() // Fecha de creación
  };
}

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
        saveUserProfile(profile, userIP);
        
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
    saveUserProfile(newProfile, userIP);
    
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