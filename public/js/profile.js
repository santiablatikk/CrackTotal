// profile.js - Funcionalidad para la página de perfil
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Inicializando perfil de usuario');
  
  // Detectar IP e inicializar perfil automáticamente
  await initializeUserProfile();
});

// Nueva función para inicializar el perfil de usuario
async function initializeUserProfile() {
  try {
    // Verificar si venimos de finalizar una partida
    const urlParams = new URLSearchParams(window.location.search);
    const fromGame = urlParams.get('fromGame') === 'true';
    
    // Intentar obtener IP guardada en localStorage primero
    let userIP = localStorage.getItem('userIP');
    
    // Si no existe, detectar y guardar la IP
    if (!userIP) {
      userIP = await detectUserIP();
      
      if (userIP) {
        // Guardar la IP para uso futuro
        localStorage.setItem('userIP', userIP);
        console.log('IP detectada y guardada:', userIP);
      }
    } else {
      console.log('Usando IP guardada:', userIP);
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

// Función para actualizar las estadísticas del perfil basado en historial
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

// Función para actualizar la interfaz de usuario con los datos del perfil
function updateProfileUI(profile) {
  if (!profile) {
    console.error('No se proporcionó perfil para actualizar la UI');
    displayProfileError('No se pudieron cargar los datos del perfil.');
    return;
  }

  console.log('[updateProfileUI] Actualizando elementos del DOM con:', profile);

  // Actualizar Nombre de Usuario
  const usernameElement = document.getElementById('profile-username');
  if (usernameElement) {
    usernameElement.textContent = profile.name || 'Jugador Desconocido';
  }

  // Actualizar Estado/Nivel y Badge
  const statusElement = document.getElementById('profile-status');
  const badgeElement = document.getElementById('rank-badge'); // Obtener el span del badge
  if (statusElement && badgeElement) {
    const statusInfo = getPlayerStatus(profile); // Obtener estado e icono
    statusElement.textContent = statusInfo.status; 
    badgeElement.innerHTML = `<i class="fas ${statusInfo.icon}"></i>`; // Actualizar icono del badge
  }

  // Actualizar Estadísticas Principales
  const gamesPlayedElement = document.getElementById('games-played');
  if (gamesPlayedElement) {
    gamesPlayedElement.textContent = profile.gamesPlayed || 0;
  }
  const bestScoreElement = document.getElementById('best-score');
  if (bestScoreElement) {
    bestScoreElement.textContent = profile.bestScore || 0;
  }
  // El ranking se carga asíncronamente, se deja placeholder
  const rankingElement = document.getElementById('ranking-position');
  if (rankingElement) {
     rankingElement.textContent = profile.rankingPosition || '-'; 
  }

  // Actualizar Detalles
  const correctAnswersElement = document.getElementById('correct-answers');
  if (correctAnswersElement) {
    correctAnswersElement.textContent = profile.totalCorrect || 0;
  }
  const wrongAnswersElement = document.getElementById('wrong-answers');
  if (wrongAnswersElement) {
    wrongAnswersElement.textContent = profile.totalWrong || 0;
  }
  // Añadir actualización para respuestas saltadas
  const skippedAnswersElement = document.getElementById('skipped-answers');
  if (skippedAnswersElement) {
      skippedAnswersElement.textContent = profile.totalSkipped || 0;
  }
  const avgTimeElement = document.getElementById('avg-time');
  if (avgTimeElement) {
    const avgTimeSeconds = profile.gamesPlayed > 0 ? Math.round(profile.totalTime / profile.gamesPlayed) : 0;
    const minutes = Math.floor(avgTimeSeconds / 60);
    const seconds = avgTimeSeconds % 60;
    avgTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Actualizar historial y logros (las funciones que hacen esto se llaman en loadUserProfile)
  updateGameHistory(profile.userIP); // Asumiendo que existe esta función
  // updateAchievementsDisplay se llama después en loadUserProfile
  
  // Ocultar cualquier mensaje de error que pudiera estar visible
  const errorContainer = document.getElementById('profile-error'); 
  if (errorContainer) {
      errorContainer.style.display = 'none';
  }
  
  console.log('[updateProfileUI] Actualización del DOM completada.');
}

// Nueva función para determinar el estado y el icono del jugador
function getPlayerStatus(profile) {
    let status = 'Novato';
    let icon = 'fa-user-astronaut'; // Icono inicial
    const games = profile.gamesPlayed || 0;
    const wins = profile.victories || 0;
    const score = profile.bestScore || 0;

    if (games >= 50 || score >= 1000) {
        status = 'Leyenda';
        icon = 'fa-crown';
    } else if (games >= 25 || score >= 500 || wins >= 10) {
        status = 'Veterano';
        icon = 'fa-shield-alt';
    } else if (games >= 10 || score >= 200 || wins >= 5) {
        status = 'Experimentado';
        icon = 'fa-star';
    } else if (games >= 5 || score >= 100) {
        status = 'Habitual';
        icon = 'fa-user-check';
    } else if (games >= 1) {
        status = 'Principiante';
        icon = 'fa-user-graduate';
    }

    return { status, icon };
}

// Función para actualizar el historial de partidas en la UI
function updateGameHistory(userIP) {
    const container = document.querySelector('.game-history-container');
    if (!container) {
        console.error('No se encontró el contenedor del historial de partidas.');
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
            console.error('Error al parsear historial:', e);
            history = [];
        }
    }

    // Limpiar contenedor antes de añadir entradas
    container.innerHTML = ''; 

    if (history.length === 0) {
        container.innerHTML = `
            <div class="placeholder-message">
                <i class="fas fa-history"></i>
                <p>Aún no has jugado ninguna partida.</p>
            </div>
        `;
        return;
    }

    // Mostrar las últimas X partidas (ej. 10)
    const recentHistory = history.slice(0, 10);

    recentHistory.forEach(game => {
        const entry = document.createElement('div');
        entry.className = 'game-entry';
        
        const gameDate = game.date ? new Date(game.date) : null;
        const formattedDate = gameDate ? gameDate.toLocaleDateString() : 'Fecha desconocida';
        const resultIconClass = game.victory ? 'fas fa-trophy victory' : 'fas fa-times-circle defeat';
        const difficulty = game.difficulty ? game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1) : '-';

        entry.innerHTML = `
            <div class="game-entry-main">
                <span class="game-result-icon ${game.victory ? 'victory' : 'defeat'}">
                    <i class="${resultIconClass}"></i>
                </span>
                <div class="game-info">
                    <span>${formattedDate} - ${difficulty}</span>
                    <strong>${game.correct || 0} Correctas / ${game.wrong || 0} Errores</strong>
                </div>
            </div>
            <div class="game-score">${game.score !== undefined ? game.score : '-'}</div>
        `;
        container.appendChild(entry);
    });
}

// Añadir una función básica de displayProfileError si no existe
function displayProfileError(message) {
    console.error('Error de Perfil:', message);
    const errorContainer = document.getElementById('profile-error'); // Necesitas un div con id="profile-error" en tu HTML
    const profileContainer = document.querySelector('.profile-container'); // O el contenedor principal
    
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    } else if (profileContainer) {
        // Si no hay contenedor de error, mostrar en el contenedor principal
        profileContainer.innerHTML = `<div class="error-message" style="color: red; text-align: center; padding: 20px;">${message}</div>`;
    }
    // Podrías querer ocultar el spinner aquí también si no se hizo antes
    const loadingIndicator = document.querySelector('.loading-indicator-class'); // Usa la clase real del indicador
    if (loadingIndicator) loadingIndicator.remove();
}

// Función para cargar el perfil del usuario
function loadUserProfile(userIP, forceReload = false) {
    if (!userIP) {
        console.error('Se requiere userIP para cargar el perfil de usuario');
        return Promise.reject('No user IP provided'); // Devolver promesa rechazada
    }
    
    // Mostrar indicador de carga y guardar referencia al objeto de control
    console.log('[loadUserProfile] Mostrando indicador de carga');
    const loadingControl = showEnhancedLoadingIndicator(); 
    // Verificar si la función devolvió el objeto esperado
    if (!loadingControl || typeof loadingControl.completeLoading !== 'function') {
        console.error('showEnhancedLoadingIndicator no devolvió el objeto esperado.');
        // Intentar ocultar cualquier spinner genérico como fallback
        const genericSpinner = document.querySelector('.loading-indicator-class'); // Usar la clase correcta si existe
        if (genericSpinner) genericSpinner.remove();
        // Continuar sin la animación de carga avanzada
    }
    
    return new Promise(async (resolve, reject) => { // Hacer la función interna async para usar await
            try {
                console.log('[loadUserProfile] Intentando cargar datos...');
                // Cargar datos del perfil
                const profileKey = `userProfile_${userIP}`;
                let profile = null;
                
                const storedProfile = localStorage.getItem(profileKey);
                console.log('[loadUserProfile] Perfil almacenado:', storedProfile ? 'Encontrado' : 'No encontrado');
                if (storedProfile && !forceReload) {
                    try {
                        profile = JSON.parse(storedProfile);
                        console.log('[loadUserProfile] Perfil parseado correctamente.');
                    } catch (e) {
                        console.error('Error al parsear perfil almacenado:', e);
                        // Intentar crear perfil por defecto ANTES de rechazar
                        try {
                           profile = createDefaultProfile(userIP);
                           console.log('[loadUserProfile] Creado perfil por defecto tras error de parseo.');
                        } catch (createError) {
                           console.error('Error también al crear perfil por defecto:', createError);
                           throw e; // Relanzar el error original de parseo si falla la creación
                        }
                    }
                } else {
                    // Crear perfil por defecto
                     try {
                        profile = createDefaultProfile(userIP);
                        console.log('[loadUserProfile] Creado perfil por defecto (forzado o no existente).');
                    } catch (createError) {
                         console.error('Error al crear perfil por defecto:', createError);
                         throw createError; // Lanzar error si falla la creación
                    }
                }
                
                // Si después de todo, profile sigue siendo null, es un error.
                if (!profile) {
                    throw new Error('No se pudo cargar ni crear el perfil de usuario.');
                }
                
                // Cargar y mostrar logros del usuario
                console.log('[loadUserProfile] Cargando logros...');
                const achievements = loadAchievementsFromLocalStorage(userIP);
                console.log(`[loadUserProfile] Logros cargados: ${achievements.length}`);
                
                // Actualizar contador de logros en el perfil
                profile.achievementsCount = achievements.length;
                
                // Actualizar las estadísticas basadas en el historial de juegos
                console.log('[loadUserProfile] Actualizando estadísticas del perfil...');
                updateProfileStats(profile, userIP);
                
                // Guardar perfil actualizado
                console.log('[loadUserProfile] Guardando perfil actualizado...');
                localStorage.setItem(profileKey, JSON.stringify(profile));
                
                // Indicar que la carga lógica está completa ANTES de restaurar UI
                console.log('[loadUserProfile] Carga lógica completa. Completando animación...');
                if (loadingControl && typeof loadingControl.completeLoading === 'function') {
                    // Esperar a que la animación de completar termine (restaura el HTML original)
                    await loadingControl.completeLoading(); 
                    console.log('[loadUserProfile] Contenido original restaurado.');
                } else {
                     console.warn('[loadUserProfile] No se pudo llamar a completeLoading.');
                     // Si no hay control de carga, puede que el HTML no necesite restauración
                }
                
                // AHORA, con el HTML original restaurado, actualizar la UI
                console.log('[loadUserProfile] Actualizando UI del perfil...');
                updateProfileUI(profile); 
                
                console.log('[loadUserProfile] Actualizando UI de logros...');
                updateAchievementsDisplay(achievements); // Ahora debería encontrar el contenedor
                 
                console.log('[loadUserProfile] Proceso completado con éxito.');
                resolve(profile);

  } catch (error) {
                console.error('Error CRÍTICO al cargar perfil de usuario:', error);
                // Asegurarse de ocultar el indicador y restaurar contenido en caso de error
                console.log('[loadUserProfile] Ocultando indicador de carga (Error).');
                if (loadingControl && typeof loadingControl.completeLoading === 'function') {
                    try {
                       await loadingControl.completeLoading(); // Intentar restaurar HTML
                    } catch (completeError) {
                       console.error('Error al intentar completar la carga en el catch:', completeError);
                       // Si falla, intentar limpiar manualmente el contenedor
                       const profileContent = document.querySelector('.profile-content');
                       if(profileContent) profileContent.innerHTML = ''; // Limpiar para evitar mostrar spinner roto
                    }
                }
                // Mostrar mensaje de error al usuario
                displayProfileError('Ocurrió un error al cargar tu perfil.');
                reject(error);
            }
    });
}

// Función para guardar el perfil del usuario
function saveUserProfile(profile, userIP) {
    if (!profile || !userIP) {
        console.error('Se requieren profile y userIP para guardar el perfil');
        return false;
    }

    try {
        localStorage.setItem(`userProfile_${userIP}`, JSON.stringify(profile));
        return true;
    } catch (e) {
        console.error('Error al guardar el perfil:', e);
        return false;
    }
}

// Función para cargar los logros desde localStorage
function loadAchievementsFromLocalStorage(userIP) {
    if (!userIP) {
        console.error('Se requiere userIP para cargar los logros');
        return [];
    }

    // Usar la clave correcta para almacenar los logros
    const achievementsKey = `userAchievements_${userIP}`;
    const storedAchievements = localStorage.getItem(achievementsKey);
    
    if (storedAchievements) {
        try {
            const achievements = JSON.parse(storedAchievements);
            // Verificar que sea un array
            if (Array.isArray(achievements)) {
                return achievements;
            } else {
                console.error('Los logros almacenados no tienen el formato correcto (no es un array)');
                return [];
            }
        } catch (e) {
            console.error('Error al parsear los logros almacenados:', e);
            return [];
        }
    }
    
    return [];
}

// Función para guardar los logros en localStorage
function saveAchievementsForIP(achievements, userIP) {
    if (!Array.isArray(achievements) || !userIP) {
        console.error('Se requieren achievements (array) y userIP para guardar los logros');
        return false;
    }

    try {
        localStorage.setItem(`achievements_${userIP}`, JSON.stringify(achievements));
        return true;
    } catch (e) {
        console.error('Error al guardar los logros:', e);
        return false;
    }
}

// Función para desbloquear un logro específico
function unlockAchievement(achievements, achievementId) {
    if (!Array.isArray(achievements)) {
        achievements = [];
    }

    // Buscar si el logro ya existe
    const existingIndex = achievements.findIndex(a => a.id === achievementId);
    
    // Definiciones de logros
    const achievementDefinitions = {
        'games_5': {
            id: 'games_5',
            title: '5 Partidas',
            description: 'Has jugado 5 partidas',
            icon: '🎮',
            count: 5,
            maxCount: 5,
            category: 'games'
        },
        'games_20': {
            id: 'games_20',
            title: '20 Partidas',
            description: 'Has jugado 20 partidas',
            icon: '🎲',
            count: 20,
            maxCount: 20,
            category: 'games'
        },
        'fast_answer': {
            id: 'fast_answer',
            title: 'Respuesta Rápida',
            description: 'Responde correctamente en menos de 5 segundos.',
            icon: 'fas fa-bolt',
            category: 'intermediate',
            maxCount: 50,
            count: 0
        },
        'streak_5': {
            id: 'streak_5',
            title: 'Racha Caliente',
            description: 'Responde correctamente 5 preguntas seguidas.',
            icon: 'fas fa-fire',
            category: 'beginner',
            maxCount: 20,
            count: 0
        },
        'no_pass': {
            id: 'no_pass',
            title: 'Sin Pasar',
            description: 'Completa un juego sin usar la opción "Pasala Ché".',
            icon: 'fas fa-trophy',
            category: 'expert',
            maxCount: 5,
            count: 0
        },
        'hard_mode': {
            id: 'hard_mode',
            title: 'Modo Difícil',
            description: 'Completa un juego en modo difícil.',
            icon: 'fas fa-skull',
            category: 'expert',
            maxCount: 5,
            count: 0
        },
        'speed_demon': {
            id: 'speed_demon',
            title: 'Demonio de la Velocidad',
            description: 'Completa un juego en menos de 2 minutos.',
            icon: 'fas fa-tachometer-alt',
            category: 'expert',
            maxCount: 3,
            count: 0
        },
        'night_owl': {
            id: 'night_owl',
            title: 'Búho Nocturno',
            description: 'Juega una partida después de medianoche.',
            icon: 'fas fa-moon',
            category: 'special',
            maxCount: 1,
            count: 0
        }
    };
    
    // Buscar el logro en la lista predefinida
    const existingAchievement = achievementDefinitions[achievementId];
    
    if (existingAchievement) {
        // Si ya existe, actualizar el contador
        existingAchievement.count = (existingAchievement.count || 0) + 1;
        existingAchievement.date = new Date().toISOString(); // Actualizar fecha
        return true;
    } else {
        console.error('Logro no encontrado en la lista de logros disponibles:', achievementId);
        return false;
  }
}

// Actualizar la interfaz con los datos del perfil
function updateProfileDisplay(profile) {
  // Actualizar username si está definido en el perfil
  if (profile.name) {
    document.getElementById('profile-username').textContent = profile.name;
  }
  
  // Obtener la tarjeta de perfil
  const profileCard = document.querySelector('.profile-card');
  
  // Remover mensaje de "Juega tu primera partida" si existe y el usuario tiene partidas
  if (profile.gamesPlayed && profile.gamesPlayed > 0) {
    const firstGameMessage = profileCard ? profileCard.querySelector('.first-game-message') : null;
    if (firstGameMessage) {
      firstGameMessage.remove();
    }
  }
  
  // Verificar si necesitamos reconstruir las secciones de estadísticas con el nuevo diseño
  const existingStatCards = profileCard ? profileCard.querySelectorAll('.stat-card') : [];
  
  if (existingStatCards.length === 0) {
    // Necesitamos reconstruir las estadísticas con el nuevo diseño
    const oldStats = profileCard ? profileCard.querySelector('.profile-stats') : null;
    const oldDetails = profileCard ? profileCard.querySelector('.profile-details') : null;
    
    if (oldStats) {
      // Reemplazar con el nuevo diseño de estadísticas
      const newStats = document.createElement('div');
      newStats.className = 'profile-stats';
      newStats.innerHTML = `
        <div class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon"><i class="fas fa-futbol"></i></div>
            <div class="stat-number" id="games-played">${profile.gamesPlayed || 0}</div>
            <div class="stat-label">PARTIDAS</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon"><i class="fas fa-star"></i></div>
            <div class="stat-number" id="best-score">${profile.bestScore || 0}</div>
            <div class="stat-label">MEJOR<br>PUNTUACIÓN</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon"><i class="fas fa-trophy"></i></div>
            <div class="stat-number" id="ranking-position">-</div>
            <div class="stat-label">RANKING</div>
          </div>
        </div>
      `;
      
      oldStats.replaceWith(newStats);
    }
    
    if (oldDetails) {
      // Reemplazar con el nuevo diseño de detalles
      const avgTime = profile.totalTime && profile.gamesPlayed ? 
        Math.round(profile.totalTime / profile.gamesPlayed) : 0;
      
      const newDetails = document.createElement('div');
      newDetails.className = 'profile-details';
      newDetails.innerHTML = `
        <div class="detail-item">
          <div class="detail-icon"><i class="fas fa-check"></i></div>
          <div class="detail-info">
            <div class="detail-label">Respuestas correctas:</div>
            <div class="detail-value" id="correct-answers">${profile.totalCorrect || 0}</div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon"><i class="fas fa-times"></i></div>
          <div class="detail-info">
            <div class="detail-label">Respuestas incorrectas:</div>
            <div class="detail-value" id="wrong-answers">${profile.totalWrong || 0}</div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon"><i class="fas fa-clock"></i></div>
          <div class="detail-info">
            <div class="detail-label">Tiempo promedio:</div>
            <div class="detail-value" id="avg-time">${formatTime(avgTime)}</div>
          </div>
        </div>
      `;
      
      oldDetails.replaceWith(newDetails);
    }
    
    // Agregar los estilos necesarios para el nuevo diseño
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* Nuevo estilo moderno para estadísticas */
      .profile-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.2rem;
        margin: 2rem 0;
      }
      
      .stat-card {
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(9, 14, 26, 0.9));
        border-radius: 16px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.05);
        height: 100%;
      }
      
      .stat-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        border-color: rgba(255, 255, 255, 0.1);
      }
      
      .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(to right, #e11d48, #fb7185);
        z-index: 1;
      }
      
      .stat-card-content {
        padding: 1.5rem 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        position: relative;
        z-index: 2;
      }
      
      .stat-icon {
        width: 45px;
        height: 45px;
        border-radius: 12px;
        background: rgba(225, 29, 72, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
        border: 1px solid rgba(225, 29, 72, 0.2);
      }
      
      .stat-icon i {
        font-size: 1.4rem;
        color: #e11d48;
        transition: all 0.3s ease;
      }
      
      .stat-card:hover .stat-icon {
        transform: scale(1.1);
        background: rgba(225, 29, 72, 0.25);
      }
      
      .stat-number {
        font-size: 2.8rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        background: linear-gradient(90deg, #e11d48, #fb7185);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        line-height: 1;
        text-shadow: 0 2px 10px rgba(225, 29, 72, 0.3);
        transition: all 0.3s ease;
        font-family: 'Oswald', sans-serif;
      }
      
      .stat-card:hover .stat-number {
        transform: scale(1.05);
        text-shadow: 0 4px 15px rgba(225, 29, 72, 0.5);
      }
      
      .stat-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 1px;
        text-align: center;
        line-height: 1.3;
        font-family: 'Oswald', sans-serif;
      }
      
      /* Nuevos estilos para detalles del perfil */
      .profile-details {
        background: linear-gradient(135deg, rgba(17, 24, 39, 0.7), rgba(9, 14, 26, 0.8));
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      }
      
      .detail-item {
        display: flex;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        transition: all 0.3s ease;
      }
      
      .detail-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      
      .detail-item:hover {
        transform: translateX(5px);
      }
      
      .detail-icon {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: rgba(225, 29, 72, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 1rem;
        flex-shrink: 0;
        transition: all 0.3s ease;
        border: 1px solid rgba(225, 29, 72, 0.2);
      }
      
      .detail-icon i {
        font-size: 1.1rem;
        color: #e11d48;
      }
      
      .detail-item:hover .detail-icon {
        transform: scale(1.1);
        background: rgba(225, 29, 72, 0.25);
      }
      
      .detail-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex: 1;
      }
      
      .detail-label {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.85);
        font-weight: 500;
      }
      
      .detail-value {
        font-size: 1.2rem;
        font-weight: 700;
        color: #fff;
        background: linear-gradient(90deg, #e11d48, #fb7185);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        padding: 0.2rem 0.5rem;
        border-radius: 5px;
        min-width: 50px;
        text-align: center;
      }
      
      @media (max-width: 576px) {
        .profile-stats {
          grid-template-columns: repeat(3, 1fr);
          gap: 0.8rem;
        }
        
        .stat-icon {
          width: 35px;
          height: 35px;
          margin-bottom: 0.6rem;
        }
        
        .stat-icon i {
          font-size: 1.1rem;
        }
        
        .stat-number {
          font-size: 2.2rem;
        }
        
        .stat-label {
          font-size: 0.7rem;
        }
        
        .detail-info {
          flex-direction: column;
          align-items: flex-start;
        }
        
        .detail-value {
          margin-top: 0.5rem;
          align-self: flex-start;
        }
      }
    `;
    document.head.appendChild(styleEl);
  } else {
    // Solo actualizar los datos en el diseño existente
  document.getElementById('games-played').textContent = profile.gamesPlayed || 0;
  document.getElementById('correct-answers').textContent = profile.totalCorrect || 0;
  document.getElementById('wrong-answers').textContent = profile.totalWrong || 0;
  document.getElementById('best-score').textContent = profile.bestScore || 0;
  
  // Calcular tiempo promedio
  const avgTime = profile.totalTime && profile.gamesPlayed ? 
    Math.round(profile.totalTime / profile.gamesPlayed) : 0;
  document.getElementById('avg-time').textContent = formatTime(avgTime);
  }
  
  // Actualizar posición en el ranking (debe ser calculado por el servidor)
  fetchPlayerRankingPosition(profile.name);
  
  // Actualizar estado del jugador basado en estadísticas
  updatePlayerStatus(profile);
  
  // Actualizar logros
  updateAchievementsDisplay(profile.achievements);
  
  // Actualizar historial de partidas si existe
  if (profile.history && profile.history.length > 0) {
    updateGameHistory(profile.history);
  }
}

// Función para obtener y mostrar la posición en el ranking
async function fetchPlayerRankingPosition(playerName) {
  try {
    if (!playerName) return;
    
    const response = await fetch('/api/ranking');
    if (!response.ok) {
      throw new Error('No se pudo cargar el ranking');
    }
    
    const ranking = await response.json();
    const playerIndex = ranking.findIndex(entry => entry.name === playerName);
    
    if (playerIndex !== -1) {
      const position = playerIndex + 1;
      document.getElementById('ranking-position').textContent = position;
      
      // Ajustar el estado del jugador basado en su posición
      const rankBadge = document.getElementById('rank-badge');
      if (rankBadge) {
        if (position <= 3) {
          rankBadge.className = 'rank-badge elite';
          rankBadge.innerHTML = '<i class="fas fa-trophy"></i>';
        } else if (position <= 10) {
          rankBadge.className = 'rank-badge advanced';
          rankBadge.innerHTML = '<i class="fas fa-medal"></i>';
        } else {
          rankBadge.className = 'rank-badge beginner';
          rankBadge.innerHTML = '<i class="fas fa-star"></i>';
        }
      }
    } else {
      document.getElementById('ranking-position').textContent = '-';
    }
  } catch (error) {
    console.error('Error al obtener posición en el ranking:', error);
    document.getElementById('ranking-position').textContent = '-';
  }
}

// Mostrar mensaje de error en perfil
function displayProfileError(message = 'No se pudo cargar el perfil') {
  // Ocultar secciones de estadísticas
  const statsContainers = document.querySelectorAll('.stats-container, .game-history-container');
  statsContainers.forEach(container => {
    if (container) container.style.display = 'none';
  });
  
  // Obtener la tarjeta de perfil y ajustar su contenido
  const profileCard = document.querySelector('.profile-card');
  if (profileCard) {
    // Mantener solo el nombre de usuario y eliminar el resto
    const username = document.getElementById('profile-username').textContent;
    const playerStatus = document.getElementById('profile-status').textContent;
    
    // Limpiar la tarjeta para reconstruirla
    profileCard.innerHTML = '';
    
    // Reconstruir con el nombre y un mensaje destacado
    profileCard.innerHTML = `
      <h2 class="profile-name" id="profile-username">${username}</h2>
      <div class="profile-level">
        <span id="rank-badge"><i class="fas fa-user"></i></span>
        <span id="profile-status">${playerStatus}</span>
      </div>
      
      <div class="first-game-message">
        <div class="message-icon">
        <i class="fas fa-gamepad"></i>
        </div>
        <div class="message-content">
          <h3>¡Comienza tu aventura!</h3>
          <p>${message}</p>
          <button class="play-now-btn" id="try-game-btn">
            <i class="fas fa-play-circle"></i>
        Jugar ahora
      </button>
        </div>
      </div>
      
      <div class="profile-stats">
        <div class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon"><i class="fas fa-futbol"></i></div>
            <div class="stat-number" id="games-played">0</div>
            <div class="stat-label">PARTIDAS</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon"><i class="fas fa-star"></i></div>
            <div class="stat-number" id="best-score">0</div>
            <div class="stat-label">MEJOR<br>PUNTUACIÓN</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon"><i class="fas fa-trophy"></i></div>
            <div class="stat-number" id="ranking-position">-</div>
            <div class="stat-label">RANKING</div>
          </div>
        </div>
      </div>
      
      <div class="profile-details">
        <div class="detail-item">
          <div class="detail-icon"><i class="fas fa-check"></i></div>
          <div class="detail-info">
            <div class="detail-label">Respuestas correctas:</div>
            <div class="detail-value" id="correct-answers">0</div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon"><i class="fas fa-times"></i></div>
          <div class="detail-info">
            <div class="detail-label">Respuestas incorrectas:</div>
            <div class="detail-value" id="wrong-answers">0</div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon"><i class="fas fa-clock"></i></div>
          <div class="detail-info">
            <div class="detail-label">Tiempo promedio:</div>
            <div class="detail-value" id="avg-time">0:00</div>
          </div>
        </div>
      </div>
      
      <a href="ranking.html" class="view-ranking-btn" id="view-ranking">
        <i class="fas fa-trophy"></i> Ver Ranking Mundial
      </a>
    `;
    
    // Agregar evento al botón
    document.getElementById('try-game-btn').addEventListener('click', function() {
      window.location.href = 'index.html';
    });
    
    // Agregar estilos personalizados
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .first-game-message {
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
        border-radius: 16px;
        padding: 1.5rem;
        margin: 1.5rem 0;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        position: relative;
        overflow: hidden;
        animation: fadeIn 0.6s ease-out;
      }
      
      .first-game-message::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 5px;
        height: 100%;
        background: linear-gradient(to bottom, #e11d48, #fb7185);
      }
      
      .message-icon {
        width: 60px;
        height: 60px;
        min-width: 60px;
        border-radius: 50%;
        background: rgba(225, 29, 72, 0.15);
        display: flex;
        justify-content: center;
        align-items: center;
        border: 2px solid rgba(225, 29, 72, 0.3);
        animation: pulse 2s infinite;
        flex-shrink: 0;
      }
      
      .message-icon i {
        font-size: 2rem;
        color: #fb7185;
      }
      
      .message-content {
        flex: 1;
      }
      
      .message-content h3 {
        font-size: 1.3rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
        color: #fff;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .message-content p {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.7);
        margin: 0 0 1rem;
        line-height: 1.4;
      }
      
      .play-now-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.6rem 1.2rem;
        background: linear-gradient(135deg, #e11d48, #be123c);
        border-radius: 50px;
        color: #fff;
        font-weight: 600;
        font-size: 0.9rem;
        text-decoration: none;
        transition: all 0.3s ease;
        border: none;
        cursor: pointer;
        box-shadow: 0 5px 15px rgba(190, 18, 60, 0.3);
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .play-now-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(190, 18, 60, 0.4);
      }
      
      .play-now-btn i {
        font-size: 1.1rem;
      }
      
      /* Nuevo estilo moderno para estadísticas */
      .profile-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.2rem;
        margin: 2rem 0;
      }
      
      .stat-card {
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(9, 14, 26, 0.9));
        border-radius: 16px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.05);
        height: 100%;
      }
      
      .stat-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        border-color: rgba(255, 255, 255, 0.1);
      }
      
      .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(to right, #e11d48, #fb7185);
        z-index: 1;
      }
      
      .stat-card-content {
        padding: 1.5rem 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        position: relative;
        z-index: 2;
      }
      
      .stat-icon {
        width: 45px;
        height: 45px;
        border-radius: 12px;
        background: rgba(225, 29, 72, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
        border: 1px solid rgba(225, 29, 72, 0.2);
      }
      
      .stat-icon i {
        font-size: 1.4rem;
        color: #e11d48;
        transition: all 0.3s ease;
      }
      
      .stat-card:hover .stat-icon {
        transform: scale(1.1);
        background: rgba(225, 29, 72, 0.25);
      }
      
      .stat-number {
        font-size: 2.8rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        background: linear-gradient(90deg, #e11d48, #fb7185);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        line-height: 1;
        text-shadow: 0 2px 10px rgba(225, 29, 72, 0.3);
        transition: all 0.3s ease;
        font-family: 'Oswald', sans-serif;
      }
      
      .stat-card:hover .stat-number {
        transform: scale(1.05);
        text-shadow: 0 4px 15px rgba(225, 29, 72, 0.5);
      }
      
      .stat-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 1px;
        text-align: center;
        line-height: 1.3;
        font-family: 'Oswald', sans-serif;
      }
      
      /* Nuevos estilos para detalles del perfil */
      .profile-details {
        background: linear-gradient(135deg, rgba(17, 24, 39, 0.7), rgba(9, 14, 26, 0.8));
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      }
      
      .detail-item {
        display: flex;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        transition: all 0.3s ease;
      }
      
      .detail-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      
      .detail-item:hover {
        transform: translateX(5px);
      }
      
      .detail-icon {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: rgba(225, 29, 72, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 1rem;
        flex-shrink: 0;
        transition: all 0.3s ease;
        border: 1px solid rgba(225, 29, 72, 0.2);
      }
      
      .detail-icon i {
        font-size: 1.1rem;
        color: #e11d48;
      }
      
      .detail-item:hover .detail-icon {
        transform: scale(1.1);
        background: rgba(225, 29, 72, 0.25);
      }
      
      .detail-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex: 1;
      }
      
      .detail-label {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.85);
        font-weight: 500;
      }
      
      .detail-value {
        font-size: 1.2rem;
        font-weight: 700;
        color: #fff;
        background: linear-gradient(90deg, #e11d48, #fb7185);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        padding: 0.2rem 0.5rem;
        border-radius: 5px;
        min-width: 50px;
        text-align: center;
      }
      
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(225, 29, 72, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(225, 29, 72, 0);
        }
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @media (max-width: 576px) {
        .profile-stats {
          grid-template-columns: repeat(3, 1fr);
          gap: 0.8rem;
        }
        
        .stat-icon {
          width: 35px;
          height: 35px;
          margin-bottom: 0.6rem;
        }
        
        .stat-icon i {
          font-size: 1.1rem;
        }
        
        .stat-number {
          font-size: 2.2rem;
        }
        
        .stat-label {
          font-size: 0.7rem;
        }
        
        .detail-info {
          flex-direction: column;
          align-items: flex-start;
        }
        
        .detail-value {
          margin-top: 0.5rem;
          align-self: flex-start;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }
  
  // Mostrar mensaje en la sección de logros también
  const profileContent = document.querySelector('.profile-content');
  if (profileContent) {
    // Eliminar mensaje de error general si existe
    const existingError = document.querySelector('.profile-error-container');
    if (existingError) {
      existingError.remove();
    }
  }
  
  // Ocultar sección de logros o mostrar mensaje
  const achievementsContainer = document.querySelector('.achievements-container');
  if (achievementsContainer) {
    achievementsContainer.innerHTML = `
      <div class="no-achievements">
        <i class="fas fa-trophy"></i>
        <p>Aún no has desbloqueado ningún logro. ¡Juega para conseguirlos!</p>
      </div>
    `;
  }
}

// Actualizar la visualización de logros
function updateAchievementsDisplay(achievements) {
  const container = document.querySelector('.achievements-container');
  if (!container) {
    console.error('No se encontró el contenedor de logros');
    return;
  }
  
  // Limpiar el contenedor y eliminar placeholder si existe
  container.innerHTML = '';
  const placeholder = container.querySelector('.placeholder-message');
  if(placeholder) placeholder.remove();

  // Filtrar solo los logros desbloqueados
  const unlockedAchievements = Array.isArray(achievements) 
    ? achievements.filter(achievement => achievement.unlocked)
    : [];
  
  if (unlockedAchievements.length === 0) {
    // Mostrar mensaje si no hay logros desbloqueados
    container.innerHTML = `
      <div class="no-achievements-message">
        <i class="fas fa-trophy"></i>
        <p>¡Todavía no has desbloqueado ningún logro! Sigue jugando para conseguirlos.</p>
        <a href="index.html" class="play-button">
          <i class="fas fa-gamepad"></i> ¡Jugar ahora!
        </a>
      </div>
    `;
    // Añadir estilos específicos para este mensaje si no existen
    if (!document.getElementById('no-achievements-style')) {
        const styleNoAchievements = document.createElement('style');
        styleNoAchievements.id = 'no-achievements-style';
        styleNoAchievements.textContent = `
          .no-achievements-message {
            text-align: center;
            padding: 3rem 1rem;
            background: rgba(15, 23, 42, 0.7);
            border-radius: var(--border-radius-md);
            border: 1px solid var(--color-border);
            color: var(--color-text-muted);
          }
          .no-achievements-message i {
            font-size: 3rem;
            color: rgba(225, 29, 72, 0.5);
            margin-bottom: 1.5rem;
            display: block;
          }
          .no-achievements-message p {
            font-size: 1.1rem;
            margin-bottom: 2rem;
          }
          .play-button {
            display: inline-flex; align-items: center; gap: 0.5rem;
            padding: 0.8rem 1.5rem;
            background: linear-gradient(135deg, var(--color-primary), #be123c);
            color: white; border-radius: 30px; font-weight: 600;
            text-decoration: none; transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(190, 18, 60, 0.3);
          }
          .play-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(190, 18, 60, 0.4);
          }
        `;
        document.head.appendChild(styleNoAchievements);
    }
    return;
  }
  
  // --- Agrupar logros por categoría --- 
  const groupedAchievements = unlockedAchievements.reduce((groups, achievement) => {
    const category = achievement.category || 'otros'; // Agrupar sin categoría en 'otros'
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(achievement);
    return groups;
  }, {});

  // --- Definir orden de categorías y títulos --- 
  const categoryOrder = ['special', 'expert', 'intermediate', 'beginner', 'otros'];
  const categoryTitles = {
    special: 'Logros Especiales',
    expert: 'Logros de Experto',
    intermediate: 'Logros Intermedios',
    beginner: 'Logros de Principiante',
    otros: 'Otros Logros'
  };

  // --- Renderizar logros agrupados --- 
  categoryOrder.forEach(category => {
    if (groupedAchievements[category] && groupedAchievements[category].length > 0) {
      // 1. Crear título de la categoría
      const categoryTitle = document.createElement('h4');
      categoryTitle.className = 'achievement-category-title';
      categoryTitle.textContent = categoryTitles[category];
      container.appendChild(categoryTitle);

      // 2. Crear grid para esta categoría
      const categoryGrid = document.createElement('div');
      categoryGrid.className = 'achievements-grid'; // Usar la misma clase para el grid
      
      // 3. Ordenar logros dentro de la categoría por fecha (más reciente primero)
      groupedAchievements[category].sort((a, b) => {
          try { return new Date(b.date) - new Date(a.date); } catch (e) { return 0; }
      });

      // 4. Añadir tarjetas al grid de la categoría
      groupedAchievements[category].forEach(achievement => {
        const achievementCard = createAchievementCard(
          achievement.id,
          achievement.icon || 'fas fa-medal',
          achievement.title,
          achievement.description,
          achievement.count || 1,
          achievement.maxCount || 1,
          achievement.date,
          achievement.category || 'beginner' // Pasar categoría para estilos
        );
        categoryGrid.appendChild(achievementCard);
      });

      // 5. Añadir el grid de la categoría al contenedor principal
      container.appendChild(categoryGrid);
    }
  });
  
  // --- Añadir estilos CSS si no existen --- 
  if (!document.getElementById('achievements-styles')) {
      const style = document.createElement('style');
      style.id = 'achievements-styles';
      style.textContent = `
        .achievement-category-title {
          font-family: var(--font-secondary);
          font-size: 1.4rem;
          color: var(--color-secondary);
          margin-top: 2.5rem; /* Más espacio entre categorías */
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(225, 29, 72, 0.2);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .achievements-container > *:first-child {
             margin-top: 0; /* Eliminar margen superior del primer título */
        }
        
        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); /* Un poco más ancho */
          gap: 1.5rem;
          margin-bottom: 1.5rem; /* Espacio después de cada grid */
        }
        
        .achievement-card {
          background: linear-gradient(145deg, var(--color-card-bg), var(--color-card-bg-darker));
          border-radius: var(--border-radius-md);
          padding: 1.5rem;
          border: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-light);
          height: 100%; /* Asegurar altura uniforme en la fila */
          position: relative;
          overflow: hidden;
        }
        
        /* Línea de color superior basada en categoría */
        .achievement-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 4px;
          background: var(--color-text-muted); /* Color por defecto */
        }
        .achievement-card.special::before { background: linear-gradient(to right, #9333ea, #d946ef); /* Morado */ }
        .achievement-card.expert::before { background: linear-gradient(to right, var(--color-primary), var(--color-secondary)); /* Rojo */ }
        .achievement-card.intermediate::before { background: linear-gradient(to right, #f59e0b, #fbbf24); /* Naranja */ }
        .achievement-card.beginner::before { background: linear-gradient(to right, #3b82f6, #60a5fa); /* Azul */ }
        
        .achievement-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-medium);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .achievement-header {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          gap: 1rem;
        }
        
        .achievement-icon-wrapper {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--color-border);
        }
        .achievement-icon-wrapper i {
          font-size: 1.6rem;
          color: var(--color-secondary);
        }
         /* Iconos con color por categoría */
        .achievement-card.special .achievement-icon-wrapper i { color: #d946ef; }
        .achievement-card.expert .achievement-icon-wrapper i { color: var(--color-primary); }
        .achievement-card.intermediate .achievement-icon-wrapper i { color: #f59e0b; }
        .achievement-card.beginner .achievement-icon-wrapper i { color: #3b82f6; }

        .achievement-info {
            flex-grow: 1;
        }
        
        .achievement-title {
          font-family: var(--font-secondary);
          font-size: 1.1rem; /* Ligeramente más pequeño */
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 0.3rem;
          line-height: 1.3;
        }
        
        .achievement-description {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        
        .achievement-footer {
            margin-top: auto; /* Empujar al fondo */
            padding-top: 1rem;
            border-top: 1px solid var(--color-border);
        }
        
        .achievement-progress-bar {
          height: 6px; /* Más delgada */
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }
        
        .achievement-progress-fill {
          height: 100%;
          background: var(--color-primary);
          width: 0%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }
        
        .achievement-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            color: var(--color-text-muted);
        }
        
        .achievement-count { /* Progreso numérico */ }
        .achievement-date { /* Fecha */ }
      `;
      document.head.appendChild(style);
  }
}

// Modificar createAchievementCard para que use la nueva estructura y clases
function createAchievementCard(id, icon, title, description, count, maxCount, date, category) {
    const card = document.createElement('div');
    card.className = `achievement-card ${category || 'beginner'}`; // Añadir clase de categoría
    
    const progressPercent = maxCount > 0 ? Math.min(100, (count / maxCount) * 100) : 100;
    const isMultiCount = maxCount > 1;
    const formattedDate = date ? formatAchievementDate(date) : 'Reciente';

    card.innerHTML = `
        <div class="achievement-header">
            <div class="achievement-icon-wrapper">
                <i class="${icon}"></i>
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
                <span class="achievement-count">${isMultiCount ? `${count} / ${maxCount}` : 'Completado'}</span>
                <span class="achievement-date">${formattedDate}</span>
            </div>
      </div>
    `;
    
    return card;
}

// Función para formatear la fecha
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

// Actualizar estado del jugador
function updatePlayerStatus(profile) {
  const statusElement = document.getElementById('profile-status');
  if (!statusElement) return;
  
  // Determinar estado basado en estadísticas y logros
  let status = 'Jugador Novato';
  let statusIcon = 'fa-user';
  
  const gamesPlayed = profile.gamesPlayed || 0;
  const correctAnswers = profile.totalCorrect || 0;
  const achievements = profile.achievements || {};
  const achievementCount = Object.keys(achievements).length;
  
  // Verificar si tiene logros de dificultad experto
  const expertAchievements = getAvailableAchievements()
    .filter(a => a.category === 'expert' && achievements[a.id]);
  
  if (expertAchievements.length >= 3) {
    status = 'Maestro del Rosco';
    statusIcon = 'fa-crown';
  } else if (gamesPlayed >= 20 || correctAnswers >= 200) {
    status = 'Jugador Veterano';
    statusIcon = 'fa-user-graduate';
  } else if (achievementCount >= 5 || correctAnswers >= 100) {
    status = 'Jugador Experto';
    statusIcon = 'fa-star';
  } else if (gamesPlayed >= 10 || correctAnswers >= 50) {
    status = 'Jugador Regular';
    statusIcon = 'fa-user-check';
  }
  
  statusElement.innerHTML = `<i class="fas ${statusIcon}"></i> ${status}`;
}

// Obtener lista de logros disponibles
function getAvailableAchievements() {
  // Lista completa de logros disponibles en el juego
  return [
    {
      id: 'first_game',
      title: 'Primer Juego',
      description: 'Completa tu primer rosco de PASALA CHÉ',
      icon: 'fas fa-gamepad',
      category: 'beginner',
      maxCount: 1
    },
    {
      id: 'perfect_game',
      title: 'Partida Perfecta',
      description: 'Completa un rosco sin cometer ningún error',
      icon: 'fas fa-award',
      category: 'expert',
      maxCount: 1
    },
    {
      id: 'speed_demon',
      title: 'Velocista',
      description: 'Completa un rosco en menos de 2 minutos',
      icon: 'fas fa-bolt',
      category: 'expert',
      maxCount: 1
    },
    {
      id: 'five_wins',
      title: 'Experto del Rosco',
      description: 'Gana 5 partidas',
      icon: 'fas fa-medal',
      category: 'intermediate',
      maxCount: 5
    },
    {
      id: 'hard_mode',
      title: 'Nivel Experto',
      description: 'Gana una partida en dificultad difícil',
      icon: 'fas fa-fire',
      category: 'expert',
      maxCount: 1
    },
    {
      id: 'no_help',
      title: 'Sin Ayuda',
      description: 'Completa el rosco sin usar ninguna pista',
      icon: 'fas fa-brain',
      category: 'intermediate',
      maxCount: 1
    },
    {
      id: 'no_pass',
      title: 'Directo al Grano',
      description: 'Completa el rosco sin saltar ninguna pregunta',
      icon: 'fas fa-check-double',
      category: 'expert',
      maxCount: 1
    },
    {
      id: 'comeback_king',
      title: 'Rey de la Remontada',
      description: 'Gana después de tener 5 respuestas incorrectas',
      icon: 'fas fa-crown',
      category: 'special',
      maxCount: 1
    },
    {
      id: 'night_owl',
      title: 'Búho Nocturno',
      description: 'Juega una partida después de medianoche',
      icon: 'fas fa-moon',
      category: 'special',
      maxCount: 1
    },
    {
      id: 'challenge_accepted',
      title: 'Desafío Aceptado',
      description: 'Completa un desafío diario',
      icon: 'fas fa-flag',
      category: 'special',
      maxCount: 1
    }
  ];
}

// Función de ayuda para guardar historial de juego basado en IP
// Esta función debe ser llamada desde el archivo principal del juego cuando termina una partida
function saveGameToHistory(gameData, userIP) {
  if (!gameData || !userIP) return;
  
  try {
    // Clave específica para el historial de esta IP
    const historyKey = `gameHistory_${userIP}`;
    
    // Obtener historial existente o crear uno nuevo
    let history = [];
    const existingHistory = localStorage.getItem(historyKey);
    
    if (existingHistory) {
      history = JSON.parse(existingHistory);
    }
    
    // Añadir esta partida al historial
    history.unshift({
      ...gameData,
      date: new Date().toISOString() // Asegurar que tiene timestamp
    });
    
    // Limitar el tamaño del historial (opcional)
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    
    // Guardar historial actualizado
    localStorage.setItem(historyKey, JSON.stringify(history));
    
    console.log('Partida guardada en el historial para IP:', userIP);
    return true;
  } catch (error) {
    console.error('Error guardando partida en historial:', error);
    return false;
  }
}

// Función para guardar un logro desbloqueado, asociado a la IP
function unlockAchievement(achievementId, userIP, count = 1) {
  if (!achievementId || !userIP) return false;
  
  try {
    // Clave de almacenamiento específica para esta IP
    const storageKey = `userAchievements_${userIP}`;
    
    // Cargar logros existentes
    let achievements = [];
    const existingAchievements = localStorage.getItem(storageKey);
    
    if (existingAchievements) {
      achievements = JSON.parse(existingAchievements);
    }
    
    // Buscar si este logro ya existe
    const existingIndex = achievements.findIndex(a => a.id === achievementId);
    
    if (existingIndex >= 0) {
      // Si ya existe, actualizar el contador
      achievements[existingIndex].count = (achievements[existingIndex].count || 1) + count;
      achievements[existingIndex].date = new Date().toISOString(); // Actualizar fecha
    } else {
      // Si es nuevo, añadirlo
      const availableAchievement = getAvailableAchievements().find(a => a.id === achievementId);
      
      if (!availableAchievement) {
        console.error('Logro no encontrado en la lista de logros disponibles:', achievementId);
        return false;
      }
      
      achievements.push({
        id: achievementId,
        unlocked: true,
        count: count,
        category: availableAchievement.category,
        date: new Date().toISOString()
      });
      
      // Mostrar notificación de logro desbloqueado
      showAchievementNotification(availableAchievement);
    }
    
    // Guardar logros actualizados
    localStorage.setItem(storageKey, JSON.stringify(achievements));
    
    console.log('Logro desbloqueado:', achievementId, 'para IP:', userIP);
    return true;
  } catch (error) {
    console.error('Error desbloqueando logro:', error);
    return false;
  }
}

// Mostrar notificación de logro desbloqueado
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

// Función principal para procesar fin de partida y actualizar todos los datos para esta IP
function processGameCompletion(gameData) {
  if (!gameData) return false;
  
  // Obtener IP del usuario
  const userIP = localStorage.getItem('userIP') || 'unknown-ip';
  
  // Guardar datos de la partida en el historial
  saveGameToHistory(gameData, userIP);
  
  // Comprobar y desbloquear logros basados en esta partida
  checkAchievements(gameData, userIP);
  
  return true;
}

// Verificar logros basados en los resultados de una partida
function checkAchievements(gameData, userIP) {
  if (!gameData || !userIP) return;
  
  // Logro: Primer juego
  unlockAchievement('first_game', userIP);
  
  // Logro: Partida perfecta (sin errores)
  if (gameData.wrong === 0 && gameData.correct > 0) {
    unlockAchievement('perfect_game', userIP);
  }
  
  // Logro: Velocista (menos de 2 minutos)
  if (gameData.timeUsed < 120 && gameData.correct > 0) {
    unlockAchievement('speed_demon', userIP);
  }
  
  // Logro: Ganar partidas (contador)
  if (gameData.victory) {
    unlockAchievement('five_wins', userIP);
  }
  
  // Logro: Ganar en dificultad difícil
  if (gameData.victory && gameData.difficulty === 'dificil') {
    unlockAchievement('hard_mode', userIP);
  }
  
  // Logro: Sin usar pistas
  if (gameData.hintsUsed === 0 && gameData.correct > 0) {
    unlockAchievement('no_help', userIP);
  }
  
  // Logro: Sin pasar preguntas
  if (gameData.skipped === 0 && gameData.correct > 0) {
    unlockAchievement('no_pass', userIP);
  }
  
  // Logro: Rey de la remontada
  if (gameData.victory && gameData.wrong >= 5) {
    unlockAchievement('comeback_king', userIP);
  }
  
  // Logro: Búho nocturno (jugar después de medianoche)
  const currentHour = new Date().getHours();
  if (currentHour >= 0 && currentHour < 5) {
    unlockAchievement('night_owl', userIP);
  }
  
  // Otros logros específicos pueden verificarse aquí...
}

// Agregar CSS para notificación de logro
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

function showEnhancedLoadingIndicator() {
  const profileContent = document.querySelector('.profile-content');
  // Asegurarse de que profileContent exista antes de continuar
  if (!profileContent) {
      console.error('No se encontró el elemento .profile-content para el indicador de carga.');
      return null; // Devolver null si no se encuentra el contenedor
  }
  
  // Guardar el contenido original de forma segura
  const originalContentHTML = profileContent.innerHTML;
  
  // ... (resto del código para crear el HTML del indicador y los estilos) ...
  profileContent.innerHTML = `
    <div class="enhanced-loading">
       {/* ... HTML del spinner ... */} 
      <div class="loading-animation">
        <div class="football-spinner">
          <i class="fas fa-futbol"></i>
        </div>
      </div>
      <div class="loading-text">
        <h3>Cargando tu perfil</h3>
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <span class="loading-percentage">0%</span>
        </div>
      </div>
    </div>
  `;
  
  // Añadir estilos si no existen ya
  if (!document.getElementById('enhanced-loading-style')) {
  const style = document.createElement('style');
    style.id = 'enhanced-loading-style'; // Añadir ID para evitar duplicados
  style.textContent = `
      .enhanced-loading { /* ... Estilos ... */ }
      .loading-animation { /* ... Estilos ... */ }
      .football-spinner { /* ... Estilos ... */ }
      .loading-text h3 { /* ... Estilos ... */ }
      .loading-progress { /* ... Estilos ... */ }
      .progress-bar { /* ... Estilos ... */ }
      .progress-fill { /* ... Estilos ... */ }
      .loading-percentage { /* ... Estilos ... */ }
      @keyframes spin-bounce { /* ... Keyframes ... */ }
    `;
    document.head.appendChild(style);
  }

  let progress = 0;
  const progressFill = profileContent.querySelector('.progress-fill');
  const percentageText = profileContent.querySelector('.loading-percentage');
  let interval = null;

  // Asegurarse de que los elementos existan antes de iniciar el intervalo
  if (progressFill && percentageText) {
    interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90; 
      progressFill.style.width = `${progress}%`;
      percentageText.textContent = `${Math.round(progress)}%`;
    }, 300);
  } else {
     console.error('No se encontraron elementos para la barra de progreso.');
  }
  
  return {
    completeLoading: function() {
      return new Promise(resolve => {
        if(interval) clearInterval(interval);
        if (progressFill) progressFill.style.width = '100%';
        if (percentageText) percentageText.textContent = '100%';
        
        // Restaurar contenido original después de un breve retardo
        setTimeout(() => {
          // Verificar si profileContent todavía existe y es válido
          const currentProfileContent = document.querySelector('.profile-content');
          if (currentProfileContent) {
             currentProfileContent.innerHTML = originalContentHTML;
             console.log('[completeLoading] Contenido HTML original restaurado.');
          } else {
             console.error('[completeLoading] .profile-content no encontrado al intentar restaurar.');
          }
          resolve(); // Resolver la promesa después de restaurar
        }, 500); // 500ms para que se vea el 100%
      });
    }
  };
}

// Guardar logros para una IP específica
function saveAchievementsForIP(achievements, userIP) {
  try {
    const storageKey = `userAchievements_${userIP}`;
    
    // Verificar que achievements sea un array
    if (Array.isArray(achievements)) {
      localStorage.setItem(storageKey, JSON.stringify(achievements));
      console.log(`Logros guardados para IP ${userIP}:`, achievements);
    } else {
      console.error('Error: achievements debe ser un array');
    }
  } catch (error) {
    console.error('Error guardando logros para IP:', error);
  }
}

// Función para guardar el perfil de usuario
function saveUserProfile(profile, userIP) {
  if (!profile || !userIP) {
    console.error('Error: Falta perfil o IP de usuario para guardar');
    return false;
  }
  
  try {
    // Guardar perfil básico en localStorage
    localStorage.setItem(`userProfile_${userIP}`, JSON.stringify({
      username: profile.username || 'Jugador',
      gamesPlayed: profile.gamesPlayed || 0,
      wins: profile.wins || 0,
      bestScore: profile.bestScore || 0,
      avgTime: profile.avgTime || 0,
      totalTime: profile.totalTime || 0,
      lastUpdated: new Date().toISOString()
    }));
    
    console.log('Perfil guardado para IP:', userIP);
    return true;
  } catch (error) {
    console.error('Error guardando perfil:', error);
    return false;
  }
}

// Función para fusionar logros de partida con el perfil del usuario
function mergeGameAchievementsWithProfile(gameAchievements, userIP) {
    if (!gameAchievements || !Array.isArray(gameAchievements) || !userIP) {
        console.error('Datos de logros inválidos o falta IP de usuario');
        return;
    }

    // Cargar logros existentes del perfil
    const profileAchievements = loadAchievementsFromLocalStorage(userIP);
    
    // Para cada logro del juego, verificar si debe añadirse al perfil
    gameAchievements.forEach(gameAchievement => {
        // Verificar si este logro ya existe en el perfil
        const existingIndex = profileAchievements.findIndex(a => a.id === gameAchievement.id);
        
        if (existingIndex >= 0) {
            // Si ya existe, incrementar contador si es aplicable
            if (gameAchievement.count && profileAchievements[existingIndex].count) {
                profileAchievements[existingIndex].count += gameAchievement.count;
            }
            // Actualizar fecha a la más reciente
            profileAchievements[existingIndex].date = new Date().toISOString();
        } else {
            // Si es nuevo, añadirlo al perfil
            profileAchievements.push({
                ...gameAchievement,
                date: new Date().toISOString()
            });
        }
    });

    // Guardar logros actualizados en localStorage
    const storageKey = `userAchievements_${userIP}`;
    localStorage.setItem(storageKey, JSON.stringify(profileAchievements));

    // Actualizar la visualización de logros si estamos en la página de perfil
    if (window.location.pathname.includes('profile.html')) {
        updateAchievementsDisplay(profileAchievements);
    }

    return profileAchievements;
}

// Función para crear un perfil por defecto con valores realistas
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

// Función para actualizar las estadísticas del perfil basado en historial
// ... existing code ...