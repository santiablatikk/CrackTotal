// mobile-fix-injector.js - Script de emergencia para corregir visualización móvil

// IIFE para evitar contaminar el scope global
(function() {
  // Ejecutar inmediatamente durante la carga del documento
  const isMobile = window.innerWidth <= 768 || 
                 /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Solo aplicar en dispositivos móviles
  if (!isMobile) return;
  
  // Crear y agregar un estilo de emergencia directamente para forzar scroll y eliminar bloqueos
  const emergencyStyle = document.createElement('style');
  emergencyStyle.id = 'emergency-mobile-fix';
  emergencyStyle.innerHTML = `
    /* CORRECCIÓN DE EMERGENCIA - NO MODIFICAR */
    html, body {
      position: relative !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      height: auto !important;
      min-height: 100% !important;
      width: 100% !important;
      max-width: 100% !important;
      max-height: none !important;
      touch-action: auto !important;
    }
    
    html.fixed-scroll, body.fixed-scroll {
      position: relative !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    }
    
    /* Eliminar cualquier posible bloqueo o overlay */
    .blocker, 
    .overlay:not(.modal-overlay):not(.cookie-banner),
    .loader,
    [style*="position: fixed"][style*="z-index: 999"],
    [style*="position:fixed"][style*="z-index: 999"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    
    .app-container, .screens-container, .content-card, #game-options-screen {
      display: block !important;
      position: relative !important;
      visibility: visible !important;
      opacity: 1 !important;
      height: auto !important;
      overflow: visible !important;
      transform: none !important;
    }
  `;
  
  // Insertar el estilo de emergencia en el head
  document.head.insertBefore(emergencyStyle, document.head.firstChild);
  
  // Función para forzar scroll cada 100ms
  const forceScroll = () => {
    document.body.style.position = 'relative';
    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100%';
    document.documentElement.style.overflowY = 'auto';
    document.documentElement.style.height = 'auto';
    
    // Eliminar clases que puedan bloquear scroll
    document.body.classList.remove('fixed-scroll', 'no-scroll', 'overflow-hidden');
    document.documentElement.classList.remove('fixed-scroll', 'no-scroll', 'overflow-hidden');
    
    // Agregar clase para poder seleccionar con CSS
    document.body.classList.add('mobile-fix-applied');
    document.documentElement.classList.add('mobile-fix-applied');
  };
  
  // Ejecutar inmediatamente
  forceScroll();
  
  // Ejecutar cada 100ms para asegurar que nada sobrescriba
  const scrollInterval = setInterval(forceScroll, 100);
  
  // Después de 5 segundos, reducir la frecuencia a cada 1 segundo
  setTimeout(() => {
    clearInterval(scrollInterval);
    setInterval(forceScroll, 1000);
  }, 5000);
  
  // Preparar la corrección del DOM una vez que esté cargado
  const domReadyFix = () => {
    // Si hay elementos interfiriendo con la visualización, eliminarlos
    document.querySelectorAll('.blocker, .overlay:not(.modal-overlay):not(.cookie-banner), .loader').forEach(el => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    // Asegurar que los contenedores principales sean visibles
    const containers = [
      '.app-container', 
      '.screens-container', 
      '.content-card', 
      '#game-options-screen',
      '.difficulty-section',
      '.difficulty-options',
      '.start-button-container'
    ];
    
    containers.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.display = 'block';
        element.style.visibility = 'visible';
        element.style.opacity = '1';
        element.style.overflow = 'visible';
        element.style.height = 'auto';
        element.style.transform = 'none';
      }
    });
    
    // Verificar si tenemos los elementos clave del juego
    const gameOptionsScreen = document.getElementById('game-options-screen');
    if (!gameOptionsScreen || window.getComputedStyle(gameOptionsScreen).display === 'none') {
      console.error("[MOBILE FIX] El contenedor del juego no está visible, aplicando corrección radical");
      
      // Corrección para asegurar que se muestre el contenido
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        // Forzar que la pantalla principal sea visible
        if (gameOptionsScreen) {
          gameOptionsScreen.style.display = 'block';
          gameOptionsScreen.style.visibility = 'visible';
          gameOptionsScreen.style.opacity = '1';
        } else {
          console.error("[MOBILE FIX] No se encontró el contenedor del juego, reconstruyendo");
          // Si no existe el contenedor, probablemente hay un problema grave - añadir mensaje
          appContainer.innerHTML += `
            <div style="text-align: center; padding: 2rem; color: white;">
              <h2>¡Ups! Parece que hay un problema.</h2>
              <p>Por favor, recarga la página para jugar.</p>
              <button onclick="location.reload()" style="background: #e11d48; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; color: white; margin-top: 1rem; font-weight: bold;">Recargar página</button>
            </div>
          `;
        }
      }
    }
  };
  
  // Aplicar corrección del DOM cuando esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', domReadyFix);
  } else {
    domReadyFix();
  }
  
  // También aplicar cuando la página esté completamente cargada
  window.addEventListener('load', domReadyFix);
  
  // Y después de un retraso para asegurar
  setTimeout(domReadyFix, 1000);
  setTimeout(domReadyFix, 2000);
  
  // Mostrar mensaje de debug en consola
  console.log('[MOBILE FIX INJECTOR] Corrección de emergencia aplicada');
})(); 