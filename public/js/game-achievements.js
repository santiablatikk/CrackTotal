/**
 * Sistema de Logros para PASALA CHE
 * Este archivo contiene todas las funciones necesarias para gestionar los logros del juego.
 */

// Variables globales para el sistema de logros
let currentAnswerStreak = 0;
let lastAnswerTime = 0;
let achievementsEnabled = true;

// Lista de logros disponibles
const gameAchievements = [
  // Logros de Principiante
  {
    id: 'first_game',
    icon: 'fas fa-gamepad',
    title: 'Primer Juego',
    description: 'Completa tu primer juego de PASALA CHÉ.',
    category: 'beginner',
    maxCount: 1
  },
  {
    id: 'fifth_game',
    icon: 'fas fa-dice-five',
    title: 'Jugador Dedicado',
    description: 'Completa 5 juegos de PASALA CHÉ.',
    category: 'beginner',
    maxCount: 1
  },
  {
    id: 'beginner_score',
    icon: 'fas fa-award',
    title: 'Cazador de Puntos',
    description: 'Consigue 100 puntos o más en una sola partida.',
    category: 'beginner',
    maxCount: 1
  },
  // Logros Intermedios
  {
    id: 'perfect_game',
    icon: 'fas fa-star',
    title: 'Juego Perfecto',
    description: 'Completa un juego sin ningún error.',
    category: 'intermediate',
    maxCount: 10
  },
  {
    id: 'fast_game',
    icon: 'fas fa-bolt',
    title: 'Velocista',
    description: 'Completa el Rosco con al menos 2.5 minutos restantes.',
    category: 'intermediate',
    maxCount: 5
  },
  {
    id: 'comeback',
    icon: 'fas fa-undo',
    title: 'Remontada Épica',
    description: 'Gana un juego después de haber cometido 2 errores.',
    category: 'intermediate',
    maxCount: 3
  },
  {
    id: 'fast_answer',
    icon: 'fas fa-bolt',
    title: 'Respuesta Rápida',
    description: 'Responde correctamente en menos de 5 segundos.',
    category: 'intermediate',
    maxCount: 50
  },
  {
    id: 'streak_5',
    icon: 'fas fa-fire',
    title: 'Racha Caliente',
    description: 'Responde correctamente 5 preguntas seguidas.',
    category: 'beginner',
    maxCount: 20
  },
  {
    id: 'streak_10',
    icon: 'fas fa-fire-alt',
    title: 'Racha Imparable',
    description: 'Responde correctamente 10 preguntas seguidas.',
    category: 'intermediate',
    maxCount: 10
  },
  // Logros Experto
  {
    id: 'hard_victory',
    icon: 'fas fa-crown',
    title: 'Maestro del Rosco',
    description: 'Completa un Rosco en dificultad difícil.',
    category: 'expert',
    maxCount: 5
  },
  {
    id: 'no_skip',
    icon: 'fas fa-check-double',
    title: 'Sin Saltos',
    description: 'Completa el Rosco sin saltar ninguna letra.',
    category: 'expert',
    maxCount: 3
  },
  {
    id: 'perfect_hard',
    icon: 'fas fa-trophy',
    title: 'Perfección Extrema',
    description: 'Completa un Rosco en dificultad difícil sin ningún error.',
    category: 'expert',
    maxCount: 1
  },
  // Logros Especiales
  {
    id: 'three_in_a_row',
    icon: 'fas fa-fire',
    title: 'Racha Ganadora',
    description: 'Gana tres partidas consecutivas.',
    category: 'special',
    maxCount: 1
  },
  {
    id: 'cumulative_score',
    icon: 'fas fa-gem',
    title: 'Coleccionista de Puntos',
    description: 'Acumula 1000 puntos en total.',
    category: 'special',
    maxCount: 1
  },
  {
    id: 'speed_demon',
    icon: 'fas fa-tachometer-alt',
    title: 'Demonio de la Velocidad',
    description: 'Completa un Rosco difícil con 3 minutos o más restantes.',
    category: 'special',
    maxCount: 1
  }
];

/**
 * Inicializa el sistema de logros al cargar la página
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Sistema de logros cargado correctamente');
  // Si estamos en el juego de PASALA CHE, activar los listeners
  if (window.location.pathname.includes('game.html')) {
    setupAchievementListeners();
  }
});

/**
 * Configura listeners para eventos relacionados con logros durante el juego
 */
function setupAchievementListeners() {
  // Iniciar el tracking de tiempo de respuesta
  document.getElementById('answer-input')?.addEventListener('focus', function() {
    lastAnswerTime = Date.now();
  });
  
  // Escuchar eventos personalizados desde game.js
  document.addEventListener('gameStarted', function() {
    currentAnswerStreak = 0;
    lastAnswerTime = Date.now();
  });
  
  document.addEventListener('correctAnswer', function(e) {
    const responseTime = (Date.now() - lastAnswerTime) / 1000;
    currentAnswerStreak++;
    
    // Verificar logros de respuesta rápida
    if (responseTime < 5) {
      unlockAchievement('fast_answer');
    }
    
    // Verificar logros de racha
    if (currentAnswerStreak === 5) {
      unlockAchievement('streak_5');
    }
    
    if (currentAnswerStreak === 10) {
      unlockAchievement('streak_10');
    }
    
    // Actualizar tiempo para próxima respuesta
    lastAnswerTime = Date.now();
  });
  
  document.addEventListener('incorrectAnswer', function() {
    currentAnswerStreak = 0;
    lastAnswerTime = Date.now();
  });
}

/**
 * Verifica los logros al completar una partida
 * @param {Object} gameData Datos del juego completado
 */
function checkGameCompletionAchievements(gameData) {
  try {
    console.log('Verificando logros para la partida completada:', gameData);
    
    if (!achievementsEnabled) {
      console.log('Sistema de logros desactivado');
      return;
    }
    
    // Siempre desbloquear logro de primera partida
    unlockAchievement('first_game');
    
    // Obtener historial de partidas para verificar logros acumulativos
    const userIP = localStorage.getItem('userIP') || 'unknown';
    const historyKey = `gameHistory_${userIP}`;
    let gameHistory = [];
    
    try {
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        gameHistory = JSON.parse(savedHistory);
        if (!Array.isArray(gameHistory)) {
          gameHistory = [];
        }
      }
    } catch (e) {
      console.error('Error al cargar historial para logros:', e);
      gameHistory = [];
    }
    
    // Añadir la partida actual al inicio para incluirla en las verificaciones
    gameHistory.unshift(gameData);
    
    // Verificar cantidad de partidas jugadas
    if (gameHistory.length >= 5) {
      unlockAchievement('fifth_game');
    }
    
    // Verificar puntuación de la partida actual
    if (gameData.score >= 100) {
      unlockAchievement('beginner_score');
    }
    
    // Verificar victorias
    if (gameData.victory) {
      // Verificar juego perfecto (sin errores)
      if (gameData.wrong === 0) {
        unlockAchievement('perfect_game');
      }
      
      // Verificar juego rápido (más de 2.5 min restantes)
      if (gameData.timeRemaining >= 150) {
        unlockAchievement('fast_game');
      }
      
      // Verificar remontada (ganar con 2 errores)
      if (gameData.wrong === 2) {
        unlockAchievement('comeback');
      }
      
      // Verificar victoria en dificultad difícil
      if (gameData.difficulty === 'dificil') {
        unlockAchievement('hard_victory');
        
        // Verificar juego perfecto en dificultad difícil
        if (gameData.wrong === 0) {
          unlockAchievement('perfect_hard');
        }
        
        // Verificar juego extremadamente rápido en dificultad difícil
        if (gameData.timeRemaining >= 180) {
          unlockAchievement('speed_demon');
        }
      }
      
      // Verificar si completó sin saltar letras
      if (gameData.skipped === 0) {
        unlockAchievement('no_skip');
      }
      
      // Verificar 3 victorias consecutivas
      if (gameHistory.length >= 3) {
        if (gameHistory[0].victory && gameHistory[1].victory && gameHistory[2].victory) {
          unlockAchievement('three_in_a_row');
        }
      }
    }
    
    // Verificar puntuación acumulada total
    const totalScore = gameHistory.reduce((sum, game) => sum + (game.score || 0), 0);
    if (totalScore >= 1000) {
      unlockAchievement('cumulative_score');
    }
    
    console.log('Verificación de logros completada');
  } catch (error) {
    console.error('Error en la verificación de logros:', error);
  }
}

/**
 * Desbloquea un logro
 * @param {string} achievementId ID del logro a desbloquear
 * @param {boolean} silent Si es verdadero, no muestra notificación
 */
function unlockAchievement(achievementId, silent = false) {
  try {
    if (!achievementsEnabled) return;
    
    console.log(`Intentando desbloquear logro: ${achievementId}`);
    
    // Obtener detalles del logro
    const achievementData = gameAchievements.find(a => a.id === achievementId);
    if (!achievementData) {
      console.warn(`Logro desconocido: ${achievementId}`);
      return;
    }
    
    // Obtener IP del usuario
    const userIP = localStorage.getItem('userIP') || 'unknown';
    const storageKey = `userAchievements_${userIP}`;
    
    // Cargar logros existentes
    let achievements = [];
    const savedAchievements = localStorage.getItem(storageKey);
    
    if (savedAchievements) {
      try {
        achievements = JSON.parse(savedAchievements);
        if (!Array.isArray(achievements)) {
          achievements = [];
        }
      } catch (e) {
        console.error('Error al parsear logros existentes:', e);
        achievements = [];
      }
    }
    
    // Verificar si el logro ya existe
    const existingIndex = achievements.findIndex(a => a.id === achievementId);
    let isNewUnlock = false;
    
    if (existingIndex >= 0) {
      // Comprobar si ya está desbloqueado
      if (achievements[existingIndex].unlocked) {
        // Si el logro permite múltiples
        if (achievements[existingIndex].count < achievementData.maxCount) {
          achievements[existingIndex].count++;
          achievements[existingIndex].date = new Date().toISOString();
          isNewUnlock = true;
        } else {
          // Ya alcanzó el máximo, no hacer nada
          return;
        }
      } else {
        // Desbloquear por primera vez
        achievements[existingIndex].unlocked = true;
        achievements[existingIndex].count = 1;
        achievements[existingIndex].date = new Date().toISOString();
        isNewUnlock = true;
      }
    } else {
      // Añadir nuevo logro
      achievements.push({
        id: achievementId,
        unlocked: true,
        count: 1,
        date: new Date().toISOString(),
        icon: achievementData.icon,
        title: achievementData.title,
        description: achievementData.description,
        category: achievementData.category
      });
      isNewUnlock = true;
    }
    
    // Guardar logros actualizados
    localStorage.setItem(storageKey, JSON.stringify(achievements));
    
    // Configurar bandera para indicar que se han desbloqueado logros
    localStorage.setItem('gameJustCompleted', 'true');
    
    if (isNewUnlock && !silent) {
      // Mostrar notificación si no está en modo silencioso
      showAchievementNotification(achievementData);
    }
    
    return isNewUnlock;
  } catch (error) {
    console.error('Error al desbloquear logro:', error);
    return false;
  }
}

/**
 * Muestra una notificación de logro desbloqueado
 * @param {Object} achievement El logro desbloqueado
 */
function showAchievementNotification(achievement) {
  try {
    // Verificar si ya existe una notificación
    let notifContainer = document.querySelector('.achievement-notifications');
    
    if (!notifContainer) {
      // Crear contenedor de notificaciones
      notifContainer = document.createElement('div');
      notifContainer.className = 'achievement-notifications';
      document.body.appendChild(notifContainer);
      
      // Añadir estilos si no existen
      if (!document.getElementById('achievement-notification-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'achievement-notification-styles';
        styleEl.textContent = `
          .achievement-notifications {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 320px;
          }
          
          .achievement-notification {
            background: rgba(0, 0, 0, 0.9);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            transform: translateX(120%);
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 215, 0, 0.3);
          }
          
          .achievement-notification.show {
            transform: translateX(0);
          }
          
          .achievement-notification-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ffb300, #ff6f00);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 1.2rem;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
            flex-shrink: 0;
            color: white;
          }
          
          .achievement-notification-content {
            flex-grow: 1;
          }
          
          .achievement-notification-title {
            color: gold;
            font-weight: bold;
            font-size: 0.9rem;
            margin-bottom: 5px;
          }
          
          .achievement-notification-description {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.8rem;
          }
        `;
        document.head.appendChild(styleEl);
      }
    }
    
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-notification-icon">
        <i class="${achievement.icon || 'fas fa-trophy'}"></i>
      </div>
      <div class="achievement-notification-content">
        <div class="achievement-notification-title">¡Logro Desbloqueado!</div>
        <div class="achievement-notification-description">${achievement.title || achievement.id}</div>
      </div>
    `;
    
    // Añadir notificación al contenedor
    notifContainer.appendChild(notification);
    
    // Mostrar notificación con efecto
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Ocultar y eliminar notificación después de un tiempo
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 400);
    }, 5000);
    
    // Reproducir sonido si está disponible
    if (typeof playSound === 'function' && typeof achievementSound !== 'undefined') {
      playSound(achievementSound);
    }
  } catch (error) {
    console.error('Error mostrando notificación:', error);
  }
}

// Exportar funciones para uso global
window.checkGameCompletionAchievements = checkGameCompletionAchievements;
window.unlockAchievement = unlockAchievement;
window.showAchievementNotification = showAchievementNotification; 