/**
 * utils.js - Funciones de utilidad para el juego PASALA CHE
 */

const Utils = {
  /**
   * Normaliza un texto para comparación (elimina acentos, mayúsculas, etc.)
   * @param {string} text - Texto a normalizar
   * @returns {string} - Texto normalizado
   */
  normalizeText: function(text) {
    return text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .replace(/[^a-z0-9]/g, ""); // Solo letras y números
  },

  /**
   * Calcula la distancia de Levenshtein entre dos cadenas
   * (útil para permitir pequeños errores de tipeo)
   * @param {string} str1 - Primera cadena
   * @param {string} str2 - Segunda cadena
   * @returns {number} - Distancia calculada
   */
  levenshteinDistance: function(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));

    for (let i = 0; i <= len1; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // eliminación
          matrix[j - 1][i] + 1, // inserción
          matrix[j - 1][i - 1] + cost // sustitución
        );
      }
    }
    
    return matrix[len2][len1];
  },

  /**
   * Comprueba si dos cadenas son iguales permitiendo una tolerancia
   * @param {string} userAnswer - Respuesta del usuario
   * @param {string} correctAnswer - Respuesta correcta
   * @param {number} tolerance - Tolerancia máxima (n° caracteres diferentes permitidos)
   * @returns {boolean} - true si son similares dentro de la tolerancia
   */
  checkAnswerSimilarity: function(userAnswer, correctAnswer, tolerance = 1) {
    // Normalizar textos
    const normalizedUser = this.normalizeText(userAnswer);
    const normalizedCorrect = this.normalizeText(correctAnswer);
    
    // Si son exactamente iguales
    if (normalizedUser === normalizedCorrect) {
      return true;
    }
    
    // Calcular distancia
    const distance = this.levenshteinDistance(normalizedUser, normalizedCorrect);
    
    // Para palabras largas, permitir mayor tolerancia
    let adjustedTolerance = tolerance;
    if (normalizedCorrect.length > 8) {
      adjustedTolerance = Math.min(tolerance + 1, 3); // Máximo 3 caracteres de diferencia
    }
    
    return distance <= adjustedTolerance;
  },

  /**
   * Formatea el tiempo en segundos a formato MM:SS
   * @param {number} seconds - Tiempo en segundos
   * @returns {string} - Tiempo formateado "MM:SS"
   */
  formatTime: function(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  /**
   * Genera un ID único
   * @returns {string} - ID único
   */
  generateUniqueId: function() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  },

  /**
   * Guarda un objeto en localStorage
   * @param {string} key - Clave para almacenar
   * @param {any} value - Valor a almacenar (se convertirá a JSON)
   */
  saveToLocalStorage: function(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
      return false;
    }
  },

  /**
   * Recupera un objeto de localStorage
   * @param {string} key - Clave a recuperar
   * @param {any} defaultValue - Valor por defecto si la clave no existe
   * @returns {any} - Valor recuperado o defaultValue
   */
  getFromLocalStorage: function(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Error al recuperar de localStorage:', error);
      return defaultValue;
    }
  },

  /**
   * Obtiene un parámetro de la URL
   * @param {string} name - Nombre del parámetro
   * @returns {string|null} - Valor del parámetro o null si no existe
   */
  getUrlParameter: function(name) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  },

  /**
   * Selecciona un elemento aleatorio de un array
   * @param {Array} array - Array del que seleccionar
   * @returns {any} - Elemento seleccionado aleatoriamente
   */
  randomFromArray: function(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  /**
   * Mezcla aleatoriamente los elementos de un array (Fisher-Yates algorithm)
   * @param {Array} array - Array a mezclar
   * @returns {Array} - Array mezclado
   */
  shuffleArray: function(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  /**
   * Limita una llamada a una función (útil para eventos como resize)
   * @param {Function} func - Función a limitar
   * @param {number} wait - Tiempo de espera en ms
   * @returns {Function} - Función limitada
   */
  debounce: function(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Recupera el objeto principal de datos del usuario de localStorage
   * @param {object} defaultValue - Valor por defecto si no se encuentra nada
   * @returns {object} - Objeto de datos del usuario
   */
  getUserData: function(defaultValue = {}) {
    try {
      console.log('[Debug] getUserData - Attempting to get crackTotalUserData from localStorage');
      const data = localStorage.getItem('crackTotalUserData'); // Clave principal
      console.log('[Debug] getUserData - Raw data:', data ? data.substring(0, 50) + '...' : null);
      
      if (!data) {
        console.log('[Debug] getUserData - No data found, returning default value');
        return defaultValue;
      }
      
      // Intenta parsear los datos
      const parsedData = JSON.parse(data);
      console.log('[Debug] getUserData - Successfully parsed data, keys:', Object.keys(parsedData));
      
      return parsedData;
    } catch (error) {
      console.error('[Debug] getUserData - Error getting user data:', error);
      return defaultValue;
    }
  },

  /**
   * Guarda el objeto principal de datos del usuario en localStorage
   * @param {object} userData - Objeto de datos del usuario a guardar
   * @returns {boolean} - true si se guardó correctamente
   */
  saveUserData: function(userData) {
    try {
      console.log('[Debug] saveUserData - Saving user data with keys:', Object.keys(userData));
      
      if (!userData) {
        console.error('[Debug] saveUserData - Attempted to save null/undefined userData');
        return false;
      }
      
      // Convertir a JSON
      const dataString = JSON.stringify(userData);
      
      // Guardar en localStorage
      localStorage.setItem('crackTotalUserData', dataString);
      
      // Verificar que se guardó correctamente
      const savedData = localStorage.getItem('crackTotalUserData');
      const success = !!savedData;
      
      console.log('[Debug] saveUserData - Save operation', success ? 'successful' : 'failed');
      
      // Disparar un evento personalizado para notificar a los listeners que los datos cambiaron
      const event = new CustomEvent('userDataUpdated', { 
        detail: { success, timestamp: Date.now() } 
      });
      document.dispatchEvent(event);
      
      return success;
    } catch (error) {
      console.error('[Debug] saveUserData - Error saving user data:', error);
      return false;
    }
  },

  /**
   * Muestra una notificación toast
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación ('success', 'error', 'info')
   * @param {number} duration - Duración en ms (opcional, por defecto 3000)
   */
  showNotification: function(message, type = 'info', duration = 3000) {
    let notification = document.getElementById('notification');
    if (!notification) {
      console.warn('Elemento #notification no encontrado. Creando uno...');
      notification = document.createElement('div');
      notification.id = 'notification';
      notification.className = 'toast';
      document.body.appendChild(notification);
    } else {
      // Limpiar clases anteriores y timeouts
      notification.className = 'toast'; 
      if (notification.timeoutId) {
        clearTimeout(notification.timeoutId);
      }
    }
    
    // Configurar y mostrar
    notification.textContent = message;
    notification.classList.add(type); // Añadir clase de tipo
    notification.style.display = 'block';
    notification.style.opacity = 1;
    notification.style.bottom = '30px'; // Asegurar posición

    // Ocultar después de la duración
    notification.timeoutId = setTimeout(() => {
      notification.style.opacity = 0;
      // Esperar a que termine la transición antes de ocultar
      setTimeout(() => {
        notification.style.display = 'none';
        notification.timeoutId = null; // Limpiar ID del timeout
      }, 500); // Duración de la animación de fade-out
    }, duration);
  },

  /**
   * Genera HTML para un placeholder de carga
   * @param {string} message - Mensaje de carga
   * @returns {string} - HTML del placeholder
   */
  getLoadingPlaceholderHTML: function(message = 'Cargando...') {
    return `<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> ${message}</div>`;
  },

  /**
   * Genera HTML para un mensaje de error
   * @param {string} title - Título del error
   * @param {string} details - Detalles adicionales (opcional)
   * @returns {string} - HTML del mensaje de error
   */
  getErrorMessageHTML: function(title, details = '') {
    return `<div class="error-message">
              <h4><i class="fas fa-exclamation-triangle"></i> ${title}</h4>
              ${details ? `<p>${details}</p>` : ''}
            </div>`;
  },

  /**
   * Genera HTML para un mensaje informativo
   * @param {string} message - Mensaje a mostrar
   * @returns {string} - HTML del mensaje informativo
   */
  getInfoMessageHTML: function(message) {
    return `<div class="info-message"><h4><i class="fas fa-info-circle"></i> Información</h4><p>${message}</p></div>`;
  },
  
  /**
   * Formatea números grandes con comas como separadores de miles.
   * @param {number} number - El número a formatear.
   * @returns {string} El número formateado como string.
   */
  numberWithCommas: function(number) {
    if (number === null || number === undefined) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },

  /**
   * Función de depuración para mostrar todo el contenido de localStorage
   * @returns {Object} - Un objeto con pares clave-valor de localStorage
   */
  debugLocalStorage: function() {
    try {
      const result = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        let value = localStorage.getItem(key);
        
        // Intentar parsear JSON si el valor parece ser JSON
        if (value && (value.startsWith('{') || value.startsWith('['))) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Si no es JSON válido, dejar como string
          }
        }
        
        result[key] = value;
      }
      console.log('[Debug] LocalStorage contents:', result);
      return result;
    } catch (error) {
      console.error('[Debug] Error debugging localStorage:', error);
      return {};
    }
  },
  
  /**
   * Intenta reparar el formato de crackTotalUserData si está corrupto
   * @returns {boolean} - true si se reparó correctamente o no había error
   */
  repairUserData: function() {
    try {
      console.log('[Debug] Attempting to repair user data...');
      
      // Obtener datos actuales
      const rawData = localStorage.getItem('crackTotalUserData');
      
      // Si no hay datos, no hay nada que reparar
      if (!rawData) {
        console.log('[Debug] No user data found to repair');
        return false;
      }
      
      // Intentar parsear para ver si hay error
      try {
        JSON.parse(rawData);
        console.log('[Debug] User data is valid JSON, no repair needed');
        return true; // Los datos son válidos, no necesita reparación
      } catch (e) {
        console.log('[Debug] User data is corrupted, attempting repair');
        
        // Intentar extraer datos válidos del string corrupto
        let repairedData = {};
        
        // Crear estructura básica si no existe
        repairedData = {
          username: localStorage.getItem('username') || 'Jugador',
          stats: {
            pasalache: {},
            quiensabe: {}
          },
          games: {
            pasalache: [],
            quiensabe: []
          },
          achievements: []
        };
        
        // Guardar los datos reparados
        localStorage.setItem('crackTotalUserData', JSON.stringify(repairedData));
        console.log('[Debug] User data repaired and saved');
        
        return true;
      }
    } catch (error) {
      console.error('[Debug] Error repairing user data:', error);
      return false;
    }
  },
  
  /**
   * Forzar la actualización del perfil estableciendo la bandera gameJustCompleted
   */
  forceProfileUpdate: function() {
    try {
      console.log('[Debug] Forcing profile update...');
      
      // Establecer bandera de juego completado
      localStorage.setItem('gameJustCompleted', 'true');
      localStorage.setItem('lastGameCompletionTimestamp', Date.now().toString());
      
      // Disparar evento para notificar a los listeners
      const event = new CustomEvent('gameDataSaved', { 
        detail: { timestamp: Date.now() } 
      });
      document.dispatchEvent(event);
      
      console.log('[Debug] Profile update forced successfully');
      return true;
    } catch (error) {
      console.error('[Debug] Error forcing profile update:', error);
      return false;
    }
  }
};

// Exportar el objeto Utils para uso global
window.Utils = Utils; 