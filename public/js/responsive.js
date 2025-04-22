/**
 * RESPONSIVE.JS
 * Mejoras para la adaptación responsiva de PASALA CHE
 * Versión perfeccionada con optimizaciones específicas para móvil
 */

// Variables para el seguimiento del estado responsivo
let currentDeviceType = null;
let isKeyboardVisible = false;
let windowHeight = window.innerHeight;
let resizeDebounceTimer;
let eventListenersAttached = false;
let isIOS = false;
let isAndroid = false;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    initResponsiveEnhancements();
});

/**
 * Inicializa todas las mejoras responsivas
 */
function initResponsiveEnhancements() {
    detectPlatform();
    applyDeviceClasses();
    optimizeImages();
    fixPositioningIssues();
    enhanceTouchInteractions();
    optimizeRoscoGame();
    mobileKeyboardManager();
    
    // Adjuntar event listeners solo una vez
    if (!eventListenersAttached) {
        window.addEventListener('resize', handleWindowResize);
        window.addEventListener('orientationchange', handleOrientationChange);
        eventListenersAttached = true;
    }
    
    // Inicialización específica por plataforma
    if (isIOS) {
        initIOSSpecificFixes();
    } else if (isAndroid) {
        initAndroidSpecificFixes();
    }
    
    console.log("Mejoras responsivas inicializadas. Tipo de dispositivo: " + currentDeviceType);
}

/**
 * Detecta si el dispositivo es móvil basado en el user agent y ancho de pantalla
 * @returns {boolean} true si es dispositivo móvil
 */
function isMobile() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'iphone', 'ipod', 'ipad', 'windows phone', 'blackberry', 'nokia', 'opera mini', 'mobile'];
    const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const hasSmallScreen = window.innerWidth <= 768;
    
    return isMobileUserAgent || hasSmallScreen;
}

/**
 * Detecta el sistema operativo del dispositivo
 */
function detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    isIOS = /iphone|ipad|ipod/.test(ua);
    isAndroid = /android/.test(ua);
}

/**
 * Determina el tipo de dispositivo basado en el tamaño de la pantalla
 * @returns {string} tipo de dispositivo ('mobile-small', 'mobile', 'tablet', etc.)
 */
function getDeviceType() {
    const width = window.innerWidth;
    
    if (width <= 320) {
        return 'mobile-small';  // iPhone SE, dispositivos muy pequeños
    } else if (width <= 480) {
        return 'mobile-medium'; // iPhone 8/X/11/12/13 en portrait
    } else if (width <= 768) {
        return 'mobile-large';  // Dispositivos móviles grandes o tablets pequeñas
    } else if (width <= 1024) {
        return 'tablet';        // iPads y tablets
    } else if (width <= 1366) {
        return 'desktop-small';
    } else {
        return 'desktop';
    }
}

/**
 * Aplica clases CSS al <html> según el tipo de dispositivo
 */
function applyDeviceClasses() {
    const previousDeviceType = currentDeviceType;
    currentDeviceType = getDeviceType();
    const htmlElement = document.documentElement;
    
    // Eliminar todas las clases de dispositivo anteriores
    htmlElement.classList.remove('mobile-small', 'mobile-medium', 'mobile-large', 'tablet', 'desktop-small', 'desktop');
    
    // Aplicar la clase actual
    htmlElement.classList.add(currentDeviceType);
    
    // Aplicar clases para móvil general
    if (currentDeviceType.includes('mobile')) {
        htmlElement.classList.add('mobile-device');
        
        // Aplicar variables CSS adicionales para móvil
        document.documentElement.style.setProperty('--question-font-size', '1.1rem');
        document.documentElement.style.setProperty('--input-height', '45px');
        document.documentElement.style.setProperty('--button-padding', '10px 15px');
    } else {
        htmlElement.classList.remove('mobile-device');
        
        // Revertir a valores predeterminados
        document.documentElement.style.setProperty('--question-font-size', '1.5rem');
        document.documentElement.style.setProperty('--input-height', '50px');
        document.documentElement.style.setProperty('--button-padding', '12px 20px');
    }
    
    // Aplicar clase de orientación
    if (window.innerHeight > window.innerWidth) {
        htmlElement.classList.add('portrait');
        htmlElement.classList.remove('landscape');
    } else {
        htmlElement.classList.add('landscape');
        htmlElement.classList.remove('portrait');
    }
    
    // Aplicar clase de plataforma
    if (isIOS) {
        htmlElement.classList.add('ios-device');
    } else if (isAndroid) {
        htmlElement.classList.add('android-device');
    }
    
    // Solo registrar cambios cuando realmente cambia el tipo de dispositivo
    if (previousDeviceType !== currentDeviceType) {
        console.log(`Tipo de dispositivo cambiado: ${previousDeviceType} -> ${currentDeviceType}`);
    }
}

/**
 * Optimiza las imágenes para dispositivos móviles
 */
function optimizeImages() {
    if (!isMobile()) return;
    
    // Reemplazar imágenes pesadas con versiones más ligeras para móvil
    const heavyImages = document.querySelectorAll('img[data-mobile-src]');
    heavyImages.forEach(img => {
        const mobileSrc = img.getAttribute('data-mobile-src');
        if (mobileSrc) {
            img.src = mobileSrc;
        }
    });
    
    // Establecer dimensiones para imágenes sin tamaño específico
    const allImages = document.querySelectorAll('img:not([width]):not([height])');
    allImages.forEach(img => {
        // Esperar a que la imagen cargue para establecer dimensiones correctas
        if (img.complete) {
            img.setAttribute('width', img.naturalWidth);
            img.setAttribute('height', img.naturalHeight);
        } else {
            img.onload = function() {
                img.setAttribute('width', img.naturalWidth);
                img.setAttribute('height', img.naturalHeight);
            };
        }
    });
}

/**
 * Arregla problemas de posicionamiento en dispositivos móviles
 */
function fixPositioningIssues() {
    if (!isMobile()) return;
    
    // Corregir posicionamiento fixed en iOS que causa problemas de scroll
    if (isIOS) {
        const fixedElements = document.querySelectorAll('.fixed-element, .modal, .toast');
        fixedElements.forEach(el => {
            el.style.position = 'absolute';
            el.style.transform = 'translateZ(0)'; // Forzar GPU acceleration
        });
        
        // Corregir el footer en iOS (conocido por causar problemas)
        const footer = document.querySelector('footer');
        if (footer) {
            footer.style.position = 'relative';
            footer.style.zIndex = '1';
        }
    }
    
    // Añadir padding extra para evitar que el contenido quede detrás de la barra de navegación
    const safeAreaBottom = Math.max(10, window.innerHeight * 0.02);
    document.body.style.paddingBottom = `${safeAreaBottom}px`;
}

/**
 * Mejora las interacciones táctiles en dispositivos móviles
 */
function enhanceTouchInteractions() {
    if (!isMobile()) return;
    
    // Prevenir zoom de doble tap en todo el sitio
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
    
    // Mejorar hover en dispositivos táctiles
    document.querySelectorAll('a, button, .btn, .nav-btn, .skip-btn, .help-btn').forEach(el => {
        el.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        }, { passive: true });
        
        el.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        }, { passive: true });
    });
    
    // Añadir soporte para fastclick en iOS para reducir retraso
    if (isIOS) {
        document.body.style.cursor = 'pointer';
    }
}

/**
 * Optimiza el juego del rosco para diferentes tamaños de pantalla
 */
function optimizeRoscoGame() {
    const roscoContainer = document.getElementById('rosco-container');
    if (!roscoContainer) return;
    
    // Determinar escala apropiada para el rosco
    let roscoScale = 1;
    const deviceType = getDeviceType();
    
    switch (deviceType) {
        case 'mobile-small':
            roscoScale = 0.75;
            break;
        case 'mobile-medium':
            roscoScale = 0.85;
            break;
        case 'mobile-large':
            roscoScale = 0.9;
            break;
        case 'tablet':
            roscoScale = 0.95;
            break;
    }
    
    // Aplicar transformación solo en dispositivos móviles
    if (deviceType.includes('mobile') || deviceType === 'tablet') {
        // Para landscape en móvil, usamos un enfoque distinto (definido en CSS)
        if (window.innerWidth > window.innerHeight) {
            roscoContainer.style.transform = '';
        } else {
            // Ajustar tamaño basado en viewport para escalar dinámicamente
            const containerSize = Math.min(window.innerWidth * 0.9, 400);
            roscoContainer.style.width = `${containerSize}px`;
            roscoContainer.style.height = `${containerSize}px`;
        }
    }
    
    // Ajustar automáticamente al cambio de tamaño
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const roscoLetters = document.querySelectorAll('.rosco-letter');
            if (!roscoLetters.length) return;
            
            // Calcular y posicionar las letras basado en el tamaño actual del contenedor
            const containerWidth = entry.contentRect.width;
            const radius = containerWidth * 0.40; // Radio para posicionar las letras
            
            roscoLetters.forEach((letter, index) => {
                const totalLetters = roscoLetters.length;
                // Calcular posición en círculo
                const angle = ((index * (360 / totalLetters)) + 270) % 360; // Empezar desde arriba
                const angleInRad = (angle * Math.PI) / 180;
                
                const x = Math.cos(angleInRad) * radius + containerWidth / 2 - letter.offsetWidth / 2;
                const y = Math.sin(angleInRad) * radius + containerWidth / 2 - letter.offsetHeight / 2;
                
                // Aplicar posición
                letter.style.left = `${x}px`;
                letter.style.top = `${y}px`;
            });
        }
    });
    
    // Observar cambios en el tamaño del contenedor
    resizeObserver.observe(roscoContainer);
}

/**
 * Gestiona el teclado virtual en dispositivos móviles
 */
function mobileKeyboardManager() {
    if (!isMobile()) return;
    
    const inputElements = document.querySelectorAll('input[type="text"], input[type="search"], textarea');
    
    inputElements.forEach(input => {
        // Al enfocar cualquier campo de entrada, detectar teclado abierto
        input.addEventListener('focus', function() {
            // Usar setTimeout para permitir que el teclado se abra completamente
            setTimeout(checkKeyboardVisibility, 300);
            
            // Mejorar visibilidad del campo de entrada activo
            this.style.fontSize = '16px'; // Evita que iOS haga zoom en campos de texto
        });
        
        // Al perder el foco, restaurar layout
        input.addEventListener('blur', function() {
            // Usar setTimeout para asegurar que el teclado se haya cerrado
            setTimeout(() => {
                document.documentElement.classList.remove('keyboard-open');
                restoreLayoutAfterKeyboard();
            }, 100);
        });
    });
    
    // Verificar si el teclado está visible basado en cambio de altura
    function checkKeyboardVisibility() {
        const newWindowHeight = window.innerHeight;
        
        // Si la altura de la ventana disminuyó significativamente, el teclado está abierto
        if (newWindowHeight < windowHeight * 0.75) {
            handleKeyboardOpen();
        } else {
            handleKeyboardClose();
        }
    }
    
    function handleKeyboardOpen() {
        if (!isKeyboardVisible) {
            isKeyboardVisible = true;
            document.documentElement.classList.add('keyboard-open');
            
            // Ocultar elementos no esenciales cuando se muestra el teclado
            optimizeLayoutForKeyboard();
            
            // Scroll al elemento activo
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                setTimeout(() => {
                    activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    }
    
    function handleKeyboardClose() {
        if (isKeyboardVisible) {
            isKeyboardVisible = false;
            document.documentElement.classList.remove('keyboard-open');
            restoreLayoutAfterKeyboard();
        }
    }
    
    function optimizeLayoutForKeyboard() {
        // Ocultar elementos no esenciales cuando se muestra el teclado
        const nonEssentialElements = document.querySelectorAll('.rosco-status, .adsense-container, footer');
        nonEssentialElements.forEach(el => {
            if (el) el.classList.add('keyboard-hide');
        });
        
        // Reducir tamaño del rosco
        const roscoContainer = document.getElementById('rosco-container');
        if (roscoContainer) {
            roscoContainer.style.transform = 'scale(0.8)';
            roscoContainer.style.transformOrigin = 'center top';
            roscoContainer.style.marginBottom = '-40px';
        }
        
        // Ajustar la tarjeta de pregunta para que sea visible con el teclado
        const questionCard = document.querySelector('.question-card');
        if (questionCard) {
            questionCard.style.transform = 'translateY(-15%)';
        }
    }
    
    function restoreLayoutAfterKeyboard() {
        // Restaurar elementos ocultos
        const hiddenElements = document.querySelectorAll('.keyboard-hide');
        hiddenElements.forEach(el => {
            el.classList.remove('keyboard-hide');
        });
        
        // Restaurar tamaño del rosco
        const roscoContainer = document.getElementById('rosco-container');
        if (roscoContainer) {
            roscoContainer.style.transform = '';
            roscoContainer.style.marginBottom = '';
        }
        
        // Restaurar posición de la tarjeta de pregunta
        const questionCard = document.querySelector('.question-card');
        if (questionCard) {
            questionCard.style.transform = '';
        }
    }
}

/**
 * Maneja eventos de cambio de tamaño de ventana
 */
function handleWindowResize() {
    // Debounce para evitar múltiples ejecuciones
    clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
        // Actualizar altura de ventana para detección de teclado
        const newHeight = window.innerHeight;
        
        // Solo considerar cambios significativos en altura
        if (Math.abs(windowHeight - newHeight) > 150) {
            // Un cambio grande en altura probablemente es el teclado
            const keyboardVisible = newHeight < windowHeight;
            document.documentElement.classList.toggle('keyboard-open', keyboardVisible);
            
            // Si no es el teclado, actualizar la altura de referencia
            if (!keyboardVisible) {
                windowHeight = newHeight;
            }
        } else {
            // Cambios pequeños son probablemente scroll o ajustes de UI
            windowHeight = newHeight;
            
            // Reaplicar clases de dispositivo
            applyDeviceClasses();
        }
        
        // Optimizar tamaño del rosco después del cambio
        optimizeRoscoGame();
    }, 200); // Esperar 200ms para evitar demasiadas actualizaciones
}

/**
 * Maneja cambios de orientación del dispositivo
 */
function handleOrientationChange() {
    // La orientación está cambiando, esperar a que se complete
    setTimeout(() => {
        // Actualizar altura de referencia
        windowHeight = window.innerHeight;
        
        // Regenerar clases y optimizaciones
        applyDeviceClasses();
        optimizeRoscoGame();
        fixPositioningIssues();
        
        // Verificar si la visibilidad del teclado ha cambiado
        if (document.activeElement && 
            (document.activeElement.tagName === 'INPUT' || 
             document.activeElement.tagName === 'TEXTAREA')) {
            setTimeout(checkKeyboardVisibility, 500);
        }
    }, 300); // Esperar 300ms para que la orientación termine de cambiar
}

/**
 * Inicializa correcciones específicas para iOS
 */
function initIOSSpecificFixes() {
    // Corregir el problema de 100vh en iOS
    const setIOSViewportHeight = () => {
        document.documentElement.style.setProperty('--ios-viewport-height', `${window.innerHeight}px`);
    };
    
    window.addEventListener('resize', setIOSViewportHeight);
    setIOSViewportHeight();
    
    // Corregir problemas de scroll suave en iOS
    document.querySelectorAll('.scroll-container').forEach(container => {
        container.style.webkitOverflowScrolling = 'touch';
    });
    
    // Prevenir doble tap para zoom
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        const DOUBLE_TAP_THRESHOLD = 300;
        const target = event.target;
        
        if (target.__lastTap && (now - target.__lastTap) < DOUBLE_TAP_THRESHOLD) {
            event.preventDefault();
        }
        
        target.__lastTap = now;
    }, { passive: false });
}

/**
 * Inicializa correcciones específicas para Android
 */
function initAndroidSpecificFixes() {
    // Corregir problemas con viewport en algunos dispositivos Android
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, target-densitydpi=device-dpi';
    }
    
    // Mejorar rendimiento de scroll en Android
    document.addEventListener('touchstart', function() {}, { passive: true });
    
    // Corregir problema de foco en campos de texto
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('touchstart', function(e) {
            if (document.activeElement !== this) {
                e.preventDefault();
                this.focus();
            }
        });
    });
}

/**
 * Función auxiliar para verificar visibilidad del teclado
 */
function checkKeyboardVisibility() {
    const newWindowHeight = window.innerHeight;
    
    // Si la altura de la ventana disminuyó significativamente, el teclado está abierto
    if (newWindowHeight < windowHeight * 0.75) {
        document.documentElement.classList.add('keyboard-open');
    } else {
        document.documentElement.classList.remove('keyboard-open');
    }
}

// Inicializar mejoras responsivas cuando se carga la página
window.addEventListener('load', function() {
    // Guardar altura inicial de la ventana
    windowHeight = window.innerHeight;
    
    // Iniciar todas las mejoras responsivas
    initResponsiveEnhancements();
    
    console.log("Optimizaciones móviles cargadas completamente");
}); 