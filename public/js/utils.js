/**
 * utils.js - Funciones de utilidad optimizadas para PASALA CHE
 * Versión 2.0 - Optimización para móviles y rendimiento
 */

// Creación eficiente del objeto Utils con patrón module
const Utils = (function() {
  'use strict';
  
  // Cache para resultados de funciones costosas (con tamaño máximo)
  const CACHE_MAX_SIZE = 1000;
  const cache = {
    levenshtein: new Map(),
    normalize: new Map(),
    format: new Map()
  };
  
  // Detección de entorno
  const env = {
    isProduction: window.location.hostname !== 'localhost' && 
                  !window.location.hostname !== '127.0.0.1',
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
              window.innerWidth <= 768,
    hasTouchscreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasIdleCallback: typeof window.requestIdleCallback !== 'undefined',
    hasIntersectionObserver: typeof IntersectionObserver !== 'undefined'
  };
  
  // Limpieza de caché cuando alcanza el tamaño máximo
  function cleanCache(cacheMap) {
    if (cacheMap.size > CACHE_MAX_SIZE) {
      // Eliminar el 25% de las entradas más antiguas
      const entriesToDelete = Math.floor(CACHE_MAX_SIZE * 0.25);
      const keys = Array.from(cacheMap.keys()).slice(0, entriesToDelete);
      keys.forEach(key => cacheMap.delete(key));
    }
  }
  
  // Objeto utils con métodos optimizados
  return {
    /**
     * Normaliza un texto para comparación (elimina acentos, mayúsculas, etc.)
     * @param {string} text - Texto a normalizar
     * @returns {string} - Texto normalizado
     */
    normalizeText: function(text) {
      if (!text) return '';
      
      // Usar cache para evitar normalizaciones repetidas
      if (cache.normalize.has(text)) {
        return cache.normalize.get(text);
      }
      
      const normalized = text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
      
      // Guardar en cache
      cache.normalize.set(text, normalized);
      cleanCache(cache.normalize);
      return normalized;
    },

    /**
     * Calcula la distancia de Levenshtein entre dos cadenas
     * (útil para permitir pequeños errores de tipeo)
     * @param {string} str1 - Primera cadena
     * @param {string} str2 - Segunda cadena
     * @returns {number} - Distancia calculada
     */
    levenshteinDistance: function(str1, str2) {
      // Optimización: si son iguales, la distancia es 0
      if (str1 === str2) return 0;
      
      // Optimización: usar versiones normalizadas
      const norm1 = this.normalizeText(str1);
      const norm2 = this.normalizeText(str2);
      
      // Si las versiones normalizadas son iguales, la distancia es 0
      if (norm1 === norm2) return 0;
      
      // Usar cache para evitar cálculos repetidos
      const cacheKey = `${norm1}|${norm2}`;
      if (cache.levenshtein.has(cacheKey)) {
        return cache.levenshtein.get(cacheKey);
      }
      
      // Optimización: calcular solo si las cadenas son diferentes
      const len1 = norm1.length;
      const len2 = norm2.length;
      
      // Optimización: si alguna cadena está vacía, la distancia es la longitud de la otra
      if (len1 === 0) return len2;
      if (len2 === 0) return len1;
      
      // Optimización: usar arrays de una dimensión para reducir memoria
      let prevRow = Array(len1 + 1);
      let currRow = Array(len1 + 1);
      
      // Inicializar primera fila
      for (let i = 0; i <= len1; i++) {
        prevRow[i] = i;
      }
      
      // Calcular distancia
      for (let j = 1; j <= len2; j++) {
        currRow[0] = j;
        
        for (let i = 1; i <= len1; i++) {
          const cost = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
          currRow[i] = Math.min(
            currRow[i - 1] + 1,             // inserción
            prevRow[i] + 1,                 // eliminación
            prevRow[i - 1] + cost           // sustitución
          );
        }
        
        // Intercambiar filas para la siguiente iteración
        [prevRow, currRow] = [currRow, prevRow];
      }
      
      // El resultado está en prevRow debido al intercambio final
      const result = prevRow[len1];
      
      // Guardar en cache
      cache.levenshtein.set(cacheKey, result);
      cleanCache(cache.levenshtein);
      return result;
    },

    /**
     * Comprueba si dos cadenas son similares dentro de una tolerancia
     * @param {string} userAnswer - Respuesta del usuario
     * @param {string} correctAnswer - Respuesta correcta
     * @param {number} tolerance - Tolerancia máxima
     * @returns {boolean} - true si son similares
     */
    checkAnswerSimilarity: function(userAnswer, correctAnswer, tolerance = 1) {
      if (!userAnswer || !correctAnswer) return false;
      
      // Normalizar textos
      const normalizedUser = this.normalizeText(userAnswer);
      const normalizedCorrect = this.normalizeText(correctAnswer);
      
      // Si son exactamente iguales
      if (normalizedUser === normalizedCorrect) {
        return true;
      }
      
      // Para respuestas muy cortas (<3 caracteres), exigir coincidencia exacta
      if (normalizedCorrect.length < 3) {
        return normalizedUser === normalizedCorrect;
      }
      
      // Calcular distancia
      const distance = this.levenshteinDistance(normalizedUser, normalizedCorrect);
      
      // Ajustar tolerancia según la longitud
      let adjustedTolerance = tolerance;
      if (normalizedCorrect.length > 8) {
        adjustedTolerance = Math.min(tolerance + 1, 3);
      }
      
      return distance <= adjustedTolerance;
    },

    /**
     * Formatea el tiempo en segundos a formato MM:SS
     * @param {number} seconds - Tiempo en segundos
     * @returns {string} - Tiempo formateado "MM:SS"
     */
    formatTime: function(seconds) {
      if (isNaN(seconds) || seconds < 0) return '00:00';
      
      // Usar cache para formatos comunes
      const cacheKey = Math.floor(seconds);
      if (cache.format.has(cacheKey)) {
        return cache.format.get(cacheKey);
      }
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      const result = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      
      // Guardar en cache solo si es un valor entero
      if (seconds === cacheKey) {
        cache.format.set(cacheKey, result);
        cleanCache(cache.format);
      }
      
      return result;
    },

    /**
     * Genera un ID único
     * @returns {string} - ID único
     */
    generateUniqueId: function() {
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },

    /**
     * Guarda un objeto en localStorage con manejo de errores y compresión
     * @param {string} key - Clave 
     * @param {any} value - Valor a guardar
     * @returns {boolean} - true si se guardó correctamente
     */
    saveToLocalStorage: function(key, value) {
      if (!key) return false;
      
      try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        return true;
      } catch (error) {
        // En caso de error (ej. cuota excedida), intentar liberar espacio
        if (error.name === 'QuotaExceededError') {
          this.cleanupStorage();
          try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
          } catch (e) {
            console.error('Error al guardar en localStorage después de limpieza:', e);
          }
        } else {
          console.error('Error al guardar en localStorage:', error);
        }
        return false;
      }
    },

    /**
     * Recupera un objeto de localStorage con manejo de errores
     * @param {string} key - Clave a recuperar
     * @param {any} defaultValue - Valor por defecto
     * @returns {any} - Valor recuperado o defaultValue
     */
    getFromLocalStorage: function(key, defaultValue = null) {
      if (!key) return defaultValue;
      
      try {
        const value = localStorage.getItem(key);
        return value !== null ? JSON.parse(value) : defaultValue;
      } catch (error) {
        console.error('Error al recuperar de localStorage:', error);
        return defaultValue;
      }
    },

    /**
     * Limpia localStorage manteniendo solo datos esenciales
     */
    cleanupStorage: function() {
      try {
        // Guardar datos importantes
        const userData = localStorage.getItem('crackTotalUserData');
        const username = localStorage.getItem('username');
        const cookieConsent = localStorage.getItem('cookieConsent');
        const lang = localStorage.getItem('lang');
        
        // Limpiar todo
        localStorage.clear();
        
        // Restaurar datos importantes
        if (userData) localStorage.setItem('crackTotalUserData', userData);
        if (username) localStorage.setItem('username', username);
        if (cookieConsent) localStorage.setItem('cookieConsent', cookieConsent);
        if (lang) localStorage.setItem('lang', lang);
      } catch (error) {
        console.error('Error al limpiar localStorage:', error);
      }
    },

    /**
     * Obtiene un parámetro de la URL
     * @param {string} name - Nombre del parámetro
     * @returns {string|null} - Valor del parámetro
     */
    getUrlParameter: function(name) {
      if (!name) return null;
      
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get(name);
    },

    /**
     * Mezcla eficientemente un array (Fisher-Yates algorithm)
     * @param {Array} array - Array a mezclar
     * @returns {Array} - Nuevo array mezclado
     */
    shuffleArray: function(array) {
      if (!array || !array.length) return [];
      
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },

    /**
     * Limita la frecuencia de llamadas a una función
     * @param {Function} func - Función a limitar
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} - Función limitada
     */
    debounce: function(func, wait = 300) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    },

    /**
     * Throttle: ejecuta la función a lo sumo una vez cada 'wait' ms
     * @param {Function} func - Función a limitar
     * @param {number} wait - Tiempo mínimo entre ejecuciones en ms
     * @returns {Function} - Función con límite de frecuencia
     */
    throttle: function(func, wait = 100) {
      let lastCall = 0;
      return function(...args) {
        const now = Date.now();
        if (now - lastCall >= wait) {
          lastCall = now;
          return func(...args);
        }
      };
    },

    /**
     * Muestra una notificación toast optimizada
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de notificación
     * @param {number} duration - Duración en ms
     */
    showNotification: function(message, type = 'info', duration = 3000) {
      if (!message) return;
      
      // Crear o reutilizar elemento de notificación
      let notification = document.getElementById('notification');
      
      if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'toast';
        document.body.appendChild(notification);
      } else {
        notification.className = 'toast';
        if (notification.timeoutId) {
          clearTimeout(notification.timeoutId);
        }
      }
      
      notification.textContent = message;
      notification.classList.add(type);
      notification.style.display = 'block';
      notification.style.opacity = 1;
      
      // Usar animación nativa para mejor rendimiento
      notification.style.animation = 'none';
      notification.offsetHeight; // Forzar reflow
      notification.style.animation = null;
      
      // En móviles reducir duración para mejorar UX
      const actualDuration = env.isMobile ? Math.min(duration, 2000) : duration;
      
      notification.timeoutId = setTimeout(() => {
        notification.style.opacity = 0;
        setTimeout(() => {
          notification.style.display = 'none';
          notification.timeoutId = null;
        }, 300);
      }, actualDuration);
    },

    /**
     * Recupera los datos del usuario con mejor manejo de errores
     * @returns {object} - Datos del usuario
     */
    getUserData: function() {
      try {
        const data = localStorage.getItem('crackTotalUserData');
        if (!data) return {};
        
        const parsedData = JSON.parse(data);
        return parsedData || {};
      } catch (error) {
        console.error('Error al recuperar datos de usuario:', error);
        return {};
      }
    },

    /**
     * Guarda los datos del usuario con verificación
     * @param {object} userData - Datos a guardar
     * @returns {boolean} - true si se guardó correctamente
     */
    saveUserData: function(userData) {
      if (!userData) return false;
      
      try {
        const dataString = JSON.stringify(userData);
        localStorage.setItem('crackTotalUserData', dataString);
        
        // Disparar evento solo si se guardó correctamente
        if (localStorage.getItem('crackTotalUserData')) {
          document.dispatchEvent(new CustomEvent('userDataUpdated', { 
            detail: { success: true, timestamp: Date.now() } 
          }));
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error al guardar datos de usuario:', error);
        return false;
      }
    },
    
    /**
     * Formatea números grandes con separador de miles
     * @param {number} number - Número a formatear
     * @returns {string} - Número formateado
     */
    numberWithCommas: function(number) {
      if (number === null || number === undefined) return '0';
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    /**
     * Reparación segura de datos de usuario corruptos
     * @returns {boolean} - true si se reparó correctamente
     */
    repairUserData: function() {
      try {
        const rawData = localStorage.getItem('crackTotalUserData');
        if (!rawData) return false;
        
        // Verificar si los datos son JSON válido
        try {
          JSON.parse(rawData);
          return true; // No se necesita reparación
        } catch (e) {
          // Crear estructura básica reparada
          const repairedData = {
            username: localStorage.getItem('username') || 'Jugador',
            stats: { pasalache: {}, quiensabe: {} },
            games: { pasalache: [], quiensabe: [] },
            achievements: []
          };
          
          localStorage.setItem('crackTotalUserData', JSON.stringify(repairedData));
          return true;
        }
      } catch (error) {
        console.error('Error al reparar datos de usuario:', error);
        return false;
      }
    },
    
    /**
     * Optimización de imágenes usando el endpoint del servidor
     * @param {string} src - Ruta de la imagen
     * @param {number} width - Ancho deseado
     * @param {number} quality - Calidad (1-100)
     * @returns {string} - URL optimizada
     */
    getOptimizedImageUrl: function(src, width, quality = 80) {
      if (!src) return src;
      
      // Ignorar URLs externas y data URIs
      if (src.startsWith('http') || src.startsWith('data:')) return src;
      
      // En móviles, reducir calidad para mejorar rendimiento
      const adjustedQuality = env.isMobile ? Math.min(quality, 60) : quality;
      
      const baseUrl = window.location.origin;
      const params = new URLSearchParams();
      params.append('src', src);
      if (width) params.append('width', width);
      params.append('quality', adjustedQuality);
      
      return `${baseUrl}/api/optimize-image?${params.toString()}`;
    },

    /**
     * Optimiza todas las imágenes en la página
     * @param {string} selector - Selector CSS
     * @param {number} quality - Calidad
     */
    optimizeAllImages: function(selector = 'img:not(.no-optimize)', quality = 80) {
      // Usar requestIdleCallback para no bloquear el renderizado
      if (env.hasIdleCallback) {
        requestIdleCallback(() => {
          this._optimizeImages(selector, quality);
        });
      } else {
        // Fallback para navegadores que no soportan requestIdleCallback
        setTimeout(() => {
          this._optimizeImages(selector, quality);
        }, 200);
      }
    },
    
    /**
     * Implementación interna de optimización de imágenes
     */
    _optimizeImages: function(selector, quality) {
      const images = document.querySelectorAll(selector);
      
      if (!images.length) return;
      
      // Reducir el tamaño de lote en móviles para evitar janking
      const batchSize = env.isMobile ? 3 : 5;
      let index = 0;
      
      const processNextBatch = () => {
        const endIndex = Math.min(index + batchSize, images.length);
        
        for (let i = index; i < endIndex; i++) {
          const img = images[i];
          const originalSrc = img.getAttribute('src');
          
          if (!originalSrc || 
              originalSrc.startsWith('data:') || 
              originalSrc.startsWith('http') || 
              img.classList.contains('optimized')) {
            continue;
          }
          
          // Calcular el ancho apropiado basado en el tamaño del dispositivo
          const width = env.isMobile 
            ? (img.getAttribute('width') || img.width || img.offsetWidth || 320) 
            : (img.getAttribute('width') || img.width || img.offsetWidth || null);
          
          // Aplicar calidad reducida en móviles
          const optimizedSrc = this.getOptimizedImageUrl(
            originalSrc, 
            width, 
            env.isMobile ? Math.min(quality, 60) : quality
          );
          
          // Usar patrón de carga diferida
          if (env.hasIntersectionObserver) {
            // Usar IntersectionObserver para carga perezosa
            const observer = new IntersectionObserver(entries => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  const targetImg = entry.target;
                  targetImg.src = optimizedSrc;
                  targetImg.classList.add('optimized');
                  observer.unobserve(targetImg);
                }
              });
            });
            observer.observe(img);
          } else {
            // Fallback: precargar y luego reemplazar
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = optimizedSrc;
            document.head.appendChild(preloadLink);
            
            preloadLink.onload = () => {
              img.src = optimizedSrc;
              img.classList.add('optimized');
            };
          }
        }
        
        index = endIndex;
        
        // Procesar el siguiente lote si hay más imágenes
        if (index < images.length) {
          // Usar un retraso mayor en móviles
          setTimeout(processNextBatch, env.isMobile ? 200 : 100);
        }
      };
      
      processNextBatch();
    },

    /**
     * Logger compatible con producción y desarrollo
     */
    log: env.isProduction ? function(){} : console.log,
    warn: env.isProduction ? function(){} : console.warn,
    error: console.error,
    
    /**
     * Detecta si el navegador está en línea
     * @returns {boolean} - true si está en línea
     */
    isOnline: function() {
      return navigator.onLine !== false;
    },
    
    /**
     * Variables de entorno y detección de capacidades
     */
    env: env
  };
})();

// Exportar globalmente
window.Utils = Utils;

/**
 * Optimizar imágenes mediante la API de optimización
 * @param {string} src - Ruta relativa de la imagen (sin /public)
 * @param {number} width - Ancho deseado en píxeles (opcional)
 * @param {number} quality - Calidad de la imagen (1-100, por defecto 80)
 * @returns {string} URL de la imagen optimizada
 */
function getOptimizedImageUrl(src, width, quality = 80) {
  return Utils.getOptimizedImageUrl(src, width, quality);
}

/**
 * Reemplazar todas las imágenes en la página con versiones optimizadas
 * @param {string} selector - Selector CSS para las imágenes a optimizar
 * @param {number} quality - Calidad de la imagen (1-100, por defecto 80)
 */
function optimizeAllImages(selector = 'img:not(.no-optimize)', quality = 80) {
  Utils.optimizeAllImages(selector, quality);
}

// Exponer las funciones al ámbito global
if (typeof window !== 'undefined') {
  window.Utils = window.Utils || {};
  window.Utils.getOptimizedImageUrl = getOptimizedImageUrl;
  window.Utils.optimizeAllImages = optimizeAllImages;
} 