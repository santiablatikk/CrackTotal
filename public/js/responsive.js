/**
 * responsive.js - Mejoras de funcionalidad responsiva para CRACK TOTAL
 * Este archivo contiene funciones para mejorar la experiencia en diferentes dispositivos
 */

// Función para detectar si el dispositivo es móvil
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// Función para detectar el tipo de dispositivo más específicamente
function getDeviceType() {
  const width = window.innerWidth;
  if (width < 576) return 'mobile-small';
  if (width < 768) return 'mobile-large';
  if (width < 992) return 'tablet';
  if (width < 1200) return 'desktop-small';
  return 'desktop-large';
}

// Aplicar clases CSS según el tipo de dispositivo
function applyDeviceClasses() {
  const deviceType = getDeviceType();
  document.body.classList.remove('device-mobile-small', 'device-mobile-large', 'device-tablet', 'device-desktop-small', 'device-desktop-large');
  document.body.classList.add(`device-${deviceType}`);
  
  // Actualizar variables CSS según el dispositivo
  if (deviceType.includes('mobile')) {
    document.documentElement.style.setProperty('--card-padding', '1rem');
    document.documentElement.style.setProperty('--container-padding', '0.75rem');
    document.documentElement.style.setProperty('--font-size-base', '0.9rem');
  } else if (deviceType === 'tablet') {
    document.documentElement.style.setProperty('--card-padding', '1.5rem');
    document.documentElement.style.setProperty('--container-padding', '1.5rem');
    document.documentElement.style.setProperty('--font-size-base', '1rem');
  } else {
    document.documentElement.style.setProperty('--card-padding', '2rem');
    document.documentElement.style.setProperty('--container-padding', '2rem');
    document.documentElement.style.setProperty('--font-size-base', '1rem');
  }
}

// Optimizar imágenes según el dispositivo
function optimizeImages() {
  if (!isMobile()) return;
  
  // Reemplazar imágenes pesadas por versiones más ligeras en móvil
  const images = document.querySelectorAll('img[data-src-mobile]');
  images.forEach(img => {
    if (img.dataset.srcMobile) {
      img.src = img.dataset.srcMobile;
    }
  });
  
  // Establecer tamaño correcto para las imágenes sin dimensiones
  const allImages = document.querySelectorAll('img:not([width]):not([height])');
  allImages.forEach(img => {
    img.addEventListener('load', function() {
      // Solo si no tienen ya dimensiones definidas
      if (!this.getAttribute('width') && !this.getAttribute('height')) {
        this.setAttribute('width', this.naturalWidth);
        this.setAttribute('height', this.naturalHeight);
      }
    });
  });
}

// Mejorar comportamiento de elementos fijos
function fixPositioningIssues() {
  const fixedElements = document.querySelectorAll('.fixed-element');
  
  if (isMobile()) {
    // En móvil, algunos elementos fijos pueden causar problemas
    fixedElements.forEach(el => {
      el.classList.add('absolute-mobile');
    });
    
    // Ajustar la altura de la ventana para dispositivos móviles
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    
    // Arreglar problemas de footer en iOS
    const footer = document.querySelector('footer, .site-footer');
    if (footer) {
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        footer.style.position = 'relative';
      }
    }
  } else {
    fixedElements.forEach(el => {
      el.classList.remove('absolute-mobile');
    });
  }
}

// Optimizar interacciones táctiles
function enhanceTouchInteractions() {
  if (!isMobile()) return;
  
  // Prevenir el zoom en doble tap (problema común en iOS)
  document.addEventListener('touchend', function(e) {
    const now = Date.now();
    const lastTouch = window.lastTouch || now + 1;
    const delta = now - lastTouch;
    
    if (delta < 300 && delta > 0) {
      e.preventDefault();
    }
    
    window.lastTouch = now;
  }, { passive: false });
  
  // Mejorar efectos de hover en táctil
  document.querySelectorAll('.hover-effect').forEach(el => {
    el.addEventListener('touchstart', function() {
      this.classList.add('touch-active');
    }, { passive: true });
    
    el.addEventListener('touchend', function() {
      setTimeout(() => {
        this.classList.remove('touch-active');
      }, 300);
    }, { passive: true });
  });
  
  // Mejorar comportamiento de botones táctiles
  document.querySelectorAll('button, .btn, [role="button"]').forEach(el => {
    el.addEventListener('touchstart', function() {
      this.setAttribute('aria-pressed', 'true');
    }, { passive: true });
    
    el.addEventListener('touchend', function() {
      this.removeAttribute('aria-pressed');
    }, { passive: true });
  });
}

/**
 * Ajusta el tamaño y posición de los elementos del juego de rosco para una visualización óptima
 * basado en el tamaño de la pantalla.
 * @returns {ResizeObserver} El observer que ajusta los elementos
 */
function optimizeRoscoGame() {
    const roscoContainer = document.querySelector('#rosco-container');
    if (!roscoContainer) return;

    const questionCard = document.querySelector('.question-card');
    const letters = document.querySelectorAll('.rosco-letter');
    
    // Get the device type for specific optimizations
    const deviceType = getDeviceType();
    
    // Make sure the container is square
    const containerWidth = roscoContainer.offsetWidth;
    roscoContainer.style.height = `${containerWidth}px`;
    
    // Don't modify the question card dimensions - use CSS instead
    // CSS will handle the question card styling
    
    // Only set the position to absolute and center it
    if (questionCard) {
        questionCard.style.position = 'absolute';
        questionCard.style.top = '50%';
        questionCard.style.left = '50%';
        questionCard.style.transform = 'translate(-50%, -50%)';
        // Remove any width/height/padding settings that might conflict with CSS
        questionCard.style.width = '';
        questionCard.style.height = '';
        questionCard.style.maxWidth = '';
    }
    
    // Position letters in a circle around the question card
    // Calculate the radius based on container size
    const radius = containerWidth * 0.42; // Slightly reduced to accommodate larger question card
    
    letters.forEach((letter, index) => {
        const angle = (index * 2 * Math.PI / letters.length) - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        letter.style.position = 'absolute';
        letter.style.left = `calc(50% + ${x}px)`;
        letter.style.top = `calc(50% + ${y}px)`;
        letter.style.transform = 'translate(-50%, -50%)';
        
        // Set letter size based on device
        if (deviceType === 'mobile-small') {
            letter.style.width = '28px';
            letter.style.height = '28px';
            letter.style.fontSize = '14px';
        } else if (deviceType === 'mobile-large') {
            letter.style.width = '32px';
            letter.style.height = '32px';
            letter.style.fontSize = '16px';
        } else if (deviceType === 'tablet') {
            letter.style.width = '40px';
            letter.style.height = '40px';
            letter.style.fontSize = '20px';
        } else if (deviceType === 'desktop-small') {
            letter.style.width = '45px';
            letter.style.height = '45px';
            letter.style.fontSize = '22px';
        } else {
            letter.style.width = '50px';
            letter.style.height = '50px';
            letter.style.fontSize = '24px';
        }
    });
    
    // Use ResizeObserver to adapt to changes in container size
    if (!window.roscoResizeObserver) {
        window.roscoResizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === roscoContainer) {
                    optimizeRoscoGame();
                }
            }
        });
        window.roscoResizeObserver.observe(roscoContainer);
    }
}

// Listen for orientation changes and window resizing
window.addEventListener('orientationchange', optimizeRoscoGame);
window.addEventListener('resize', debounce(optimizeRoscoGame, 250));

// Mejorar la gestión del teclado virtual en móviles
function mobileKeyboardManager() {
  if (!isMobile()) return;
  
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
  if (!inputs.length) return;
  
  // Al mostrar teclado
  const handleFocus = () => {
    // Esconder elementos no esenciales para dar más espacio
    const nonEssentials = document.querySelectorAll('.hide-on-keyboard');
    nonEssentials.forEach(el => {
      el.style.display = 'none';
    });
    
    // En iOS detectar el cambio de altura de la ventana
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const viewportHeight = window.innerHeight;
      document.documentElement.style.setProperty('--keyboard-viewport-height', `${viewportHeight}px`);
    }
  };
  
  // Al ocultar teclado
  const handleBlur = () => {
    setTimeout(() => {
      // Mostrar elementos escondidos
      const nonEssentials = document.querySelectorAll('.hide-on-keyboard');
      nonEssentials.forEach(el => {
        el.style.display = '';
      });
      
      // Restablecer altura
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        document.documentElement.style.setProperty('--keyboard-viewport-height', '100vh');
      }
    }, 300);
  };
  
  // Aplicar a todos los inputs
  inputs.forEach(input => {
    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);
  });
}

// Inicializar todas las mejoras responsivas
function initResponsiveEnhancements() {
  // Aplicar todas las mejoras
  applyDeviceClasses();
  optimizeImages();
  fixPositioningIssues();
  enhanceTouchInteractions();
  optimizeRoscoGame();
  mobileKeyboardManager();
  
  // Log para depuración
  console.log(`[Responsive] Dispositivo detectado: ${getDeviceType()}`);
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  initResponsiveEnhancements();
  
  // Actualizar en cambios de tamaño de ventana
  window.addEventListener('resize', function() {
    applyDeviceClasses();
    fixPositioningIssues();
    
    // Actualizar la altura en dispositivos móviles
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  });
  
  // Actualizar en cambios de orientación
  window.addEventListener('orientationchange', function() {
    setTimeout(initResponsiveEnhancements, 200); // Pequeño retraso para asegurar que los cambios de orientación sean registrados
  });
});

// Exportar funciones útiles
window.ResponsiveUtils = {
  isMobile,
  getDeviceType,
  applyDeviceClasses,
  fixPositioningIssues,
  optimizeRoscoGame
}; 