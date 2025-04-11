/**
 * mobile-override.js - Fuerza la correcta visualización en dispositivos móviles
 * Este script tiene prioridad sobre cualquier otro JavaScript y aplica 
 * estilos directamente a los elementos DOM para garantizar la correcta
 * visualización en dispositivos móviles.
 */

(function() {
  // Ejecutamos el script cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', initMobileOverrides);
  
  /**
   * Inicializa los overrides solo si es un dispositivo móvil
   */
  function initMobileOverrides() {
    // IMPORTANTE: No ejecutar nada si no es un dispositivo móvil
    if (!isMobile()) {
      console.log("[Mobile Override] No se aplican cambios - Dispositivo de escritorio detectado");
      return;
    }
    
    console.log("[Mobile Override] Dispositivo móvil detectado, aplicando optimizaciones");
    
    // Configurar los eventos solo en móviles
    window.addEventListener('load', applyMobileOverrides);
    window.addEventListener('resize', applyMobileOverrides);
    window.addEventListener('orientationchange', function() {
      setTimeout(applyMobileOverrides, 200);
    });
    
    // Aplicar inmediatamente
    applyMobileOverrides();
    
    // Forzar aplicación repetida para evitar que otros scripts interfieran
    setTimeout(applyMobileOverrides, 500);
    setTimeout(applyMobileOverrides, 1000);
    setTimeout(applyMobileOverrides, 2000);
  }
  
  /**
   * Aplica los estilos forzados para móviles
   */
  function applyMobileOverrides() {
    // Verificar nuevamente que sea un dispositivo móvil (por si cambió el tamaño de ventana)
    if (!isMobile()) return;
    
    console.log("[Mobile Override] Aplicando estilos forzados para móvil");
    
    // 1. Primero eliminar restricciones en el body
    document.body.style.setProperty('position', 'relative', 'important');
    document.body.style.setProperty('overflow-y', 'auto', 'important');
    document.body.style.setProperty('overflow-x', 'hidden', 'important');
    document.body.style.setProperty('height', 'auto', 'important');
    document.body.style.setProperty('min-height', '100vh', 'important');
    document.body.style.setProperty('width', '100%', 'important');
    document.body.style.setProperty('max-width', '100%', 'important');
    
    // 2. Luego los contenedores principales
    const container = document.querySelector('.container');
    if (container) {
      container.style.setProperty('height', 'auto', 'important');
      container.style.setProperty('min-height', '100vh', 'important');
      container.style.setProperty('overflow-y', 'auto', 'important');
      container.style.setProperty('overflow-x', 'hidden', 'important');
      container.style.setProperty('position', 'relative', 'important');
      container.style.setProperty('display', 'block', 'important');
    }
    
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
      gameContainer.style.setProperty('transform', 'none', 'important');
      gameContainer.style.setProperty('height', 'auto', 'important');
      gameContainer.style.setProperty('overflow', 'visible', 'important');
      gameContainer.style.setProperty('position', 'relative', 'important');
    }
    
    // 3. El rosco y sus componentes
    const roscoSection = document.querySelector('.rosco-section');
    if (roscoSection) {
      roscoSection.style.setProperty('overflow', 'visible', 'important');
      roscoSection.style.setProperty('position', 'relative', 'important');
      roscoSection.style.setProperty('width', '100%', 'important');
    }
    
    const roscoContainer = document.getElementById('rosco-container');
    if (roscoContainer) {
      roscoContainer.style.setProperty('transform', 'none', 'important');
      roscoContainer.style.setProperty('-webkit-transform', 'none', 'important');
      roscoContainer.style.setProperty('transform-origin', 'center center', 'important');
      roscoContainer.style.setProperty('transform-style', 'flat', 'important');
      roscoContainer.style.setProperty('position', 'relative', 'important');
      roscoContainer.style.setProperty('width', '100%', 'important');
      roscoContainer.style.setProperty('max-width', '100%', 'important');
      roscoContainer.style.setProperty('height', 'auto', 'important');
      roscoContainer.style.setProperty('aspect-ratio', '1/1', 'important');
      roscoContainer.style.setProperty('margin', '0 auto', 'important');
      roscoContainer.style.setProperty('display', 'flex', 'important');
      roscoContainer.style.setProperty('align-items', 'center', 'important');
      roscoContainer.style.setProperty('justify-content', 'center', 'important');
      roscoContainer.style.setProperty('z-index', '5', 'important');
    }
    
    // 4. Tarjeta de pregunta y sus elementos
    const questionCard = document.querySelector('.question-card');
    if (questionCard) {
      questionCard.style.setProperty('position', 'absolute', 'important');
      questionCard.style.setProperty('width', '80%', 'important');
      questionCard.style.setProperty('max-width', 'none', 'important');
      questionCard.style.setProperty('z-index', '20', 'important');
    }
    
    // 5. Panel de estado
    const roscoStatus = document.querySelector('.rosco-status');
    if (roscoStatus) {
      roscoStatus.style.setProperty('flex-wrap', 'wrap', 'important');
      roscoStatus.style.setProperty('justify-content', 'center', 'important');
      roscoStatus.style.setProperty('position', 'relative', 'important');
      roscoStatus.style.setProperty('width', '90%', 'important');
      roscoStatus.style.setProperty('margin-top', '1rem', 'important');
      roscoStatus.style.setProperty('transform', 'none', 'important');
    }
    
    // Aplicamos cambios a todas las letras del rosco
    const roscoLetters = document.querySelectorAll('.rosco-letter');
    roscoLetters.forEach(letter => {
      letter.style.setProperty('transform-origin', 'center center', 'important');
      letter.style.setProperty('font-size', window.innerWidth <= 360 ? '0.7rem' : '0.9rem', 'important');
      letter.style.setProperty('width', window.innerWidth <= 360 ? '25px' : '30px', 'important');
      letter.style.setProperty('height', window.innerWidth <= 360 ? '25px' : '30px', 'important');
    });
    
    // Configuración especial para la letra actual
    const currentLetter = document.querySelector('.rosco-letter.current');
    if (currentLetter) {
      currentLetter.style.setProperty('transform', 'scale(1.2)', 'important');
      currentLetter.style.setProperty('z-index', '10', 'important');
    }
    
    console.log("[Mobile Override] Estilos forzados aplicados correctamente");
  }
  
  /**
   * Detecta si el dispositivo es móvil
   * Utiliza múltiples métodos para una detección más precisa
   */
  function isMobile() {
    // Método 1: Detectar por ancho de pantalla
    const isMobileByWidth = window.innerWidth <= 768;
    
    // Método 2: Detectar por User Agent
    const isMobileByUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Método 3: Detectar por características de pantalla táctil
    const isMobileByTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    // Método 4: Verificar si tiene orientación (característica típica de móviles)
    const hasOrientation = typeof window.orientation !== 'undefined';
    
    // Consola de debug
    console.log("[Mobile Detection] Width: " + isMobileByWidth + 
               ", UserAgent: " + isMobileByUserAgent + 
               ", Touch: " + isMobileByTouch + 
               ", Orientation: " + hasOrientation);
    
    // Un dispositivo es móvil si cumple al menos el criterio de ancho Y uno de los otros
    return isMobileByWidth && (isMobileByUserAgent || isMobileByTouch || hasOrientation);
  }
})(); 