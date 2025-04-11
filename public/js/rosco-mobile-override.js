/**
 * rosco-mobile-override.js - Script específico para corregir visualización en game-rosco.html
 */

(function() {
  // Ejecutamos cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', function() {
    // Solo continuar si es un dispositivo móvil
    if (!isMobile()) {
      console.log("[Rosco Mobile Fix] No aplicado - Dispositivo de escritorio");
      return;
    }
    
    console.log("[Rosco Mobile Fix] Dispositivo móvil detectado");
    
    // Aplicar el fix inmediatamente y en varios momentos para asegurar
    applyMobileFix();
    window.addEventListener('load', applyMobileFix);
    window.addEventListener('resize', applyMobileFix);
    setTimeout(applyMobileFix, 500);
    setTimeout(applyMobileFix, 1500);
  });
  
  /**
   * Aplicar correcciones para la visualización en móviles
   */
  function applyMobileFix() {
    // Verificar nuevamente que sea móvil
    if (!isMobile()) return;
    
    console.log("[Rosco Mobile Fix] Aplicando correcciones");
    
    // 1. Corregir estructuras principales
    document.body.style.overflow = 'auto';
    document.body.style.position = 'relative';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100%';
    
    // 2. Buscar la app-container y asegurar que muestre contenido
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      forceElementVisibility(appContainer);
      
      // 3. Buscar screens-container y contenido de juego
      const screensContainer = appContainer.querySelector('.screens-container');
      if (screensContainer) {
        forceElementVisibility(screensContainer);
        
        // 4. Buscar pantalla de opciones de juego
        const gameOptions = document.getElementById('game-options-screen');
        if (gameOptions) {
          forceElementVisibility(gameOptions);
          
          // 5. Asegurar que la sección de dificultad sea visible
          const difficultySection = gameOptions.querySelector('.difficulty-section');
          if (difficultySection) {
            forceElementVisibility(difficultySection);
            
            // 6. Asegurar que las opciones de dificultad sean visibles
            const difficultyOptions = difficultySection.querySelector('.difficulty-options');
            if (difficultyOptions) {
              forceElementVisibility(difficultyOptions);
              
              // 7. Hacer visibles las opciones individuales
              const options = difficultyOptions.querySelectorAll('.difficulty-option');
              options.forEach(opt => forceElementVisibility(opt));
            }
          }
          
          // 8. Asegurar que el contenedor de botones sea visible
          const btnContainer = gameOptions.querySelector('.start-button-container');
          if (btnContainer) {
            forceElementVisibility(btnContainer);
            
            // 9. Hacer visibles los botones
            const buttons = btnContainer.querySelectorAll('.btn');
            buttons.forEach(btn => forceElementVisibility(btn));
          }
        }
      }
      
      // 10. Asegurar que el footer sea visible
      const footer = appContainer.querySelector('.policy-footer');
      if (footer) {
        forceElementVisibility(footer);
      }
    }
    
    console.log("[Rosco Mobile Fix] Correcciones aplicadas");
  }
  
  /**
   * Función para forzar que un elemento sea visible
   */
  function forceElementVisibility(element) {
    if (!element) return;
    
    element.style.display = 'block';
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    element.style.position = 'relative';
    element.style.overflow = 'visible';
    element.style.height = 'auto';
    element.style.transform = 'none';
    element.style.pointerEvents = 'auto';
    
    // Buscar posibles overlays o bloqueadores y desactivarlos
    const overlays = element.querySelectorAll('.overlay, .blocker, [style*="position: fixed"], [style*="position:fixed"]');
    overlays.forEach(overlay => {
      if (!overlay.classList.contains('modal-overlay') && !overlay.classList.contains('cookie-banner')) {
        overlay.style.display = 'none';
      }
    });
  }
  
  /**
   * Detectar si es dispositivo móvil
   */
  function isMobile() {
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
})(); 