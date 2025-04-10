/**
 * MobileUtils.js - Utilidades para la optimización de experiencia en dispositivos móviles
 * Versión: 1.0.0
 */

const MobileUtils = (function() {
    'use strict';
    
    // Detección del entorno
    const env = {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        supportsTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        supportsVibration: 'vibrate' in navigator,
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
        isAndroid: /Android/i.test(navigator.userAgent),
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        pixelRatio: window.devicePixelRatio || 1,
        isLowMemoryDevice: false,
        hasNotch: checkForNotch()
    };
    
    // Configuración por defecto
    const defaultConfig = {
        minTouchTargetSize: 44, // Recomendado por WCAG
        scrollThrottleTime: 100,
        touchThrottleTime: 150,
        fixVhUnits: true,
        optimizeScrolling: true,
        lazyLoadOffscreen: true,
        offscreenThreshold: 300, // px
        debugMode: false,
        optimizeRosco: true,
        enableFastClick: true,
        optimizeForLowMemory: true,
        preventDoubleTapZoom: true
    };
    
    // Configuración actual
    let config = {...defaultConfig};
    
    /**
     * Inicializa las optimizaciones para móviles
     * @param {Object} options - Opciones de configuración
     */
    function init(options = {}) {
        // Fusionar opciones con la configuración por defecto
        config = {...defaultConfig, ...options};
        
        // Detectar dispositivos de bajos recursos
        detectLowMemoryDevice();
        
        // Aplicar correcciones solo si estamos en móvil
        if (env.isMobile || env.supportsTouch) {
            if (config.fixVhUnits) {
                fixViewportHeightUnits();
            }
            
            if (config.optimizeScrolling) {
                optimizeScrolling();
            }
            
            if (config.lazyLoadOffscreen) {
                setupLazyLoading();
            }
            
            // Evitar doble tap zoom
            if (config.preventDoubleTapZoom) {
                preventDoubleTapZoom();
            }
            
            // Optimización específica para el rosco
            if (config.optimizeRosco) {
                optimizeRoscoForMobile();
            }
            
            // Detectar orientación
            detectOrientation();
            window.addEventListener('resize', detectOrientation);
            
            // Eventos específicos para dispositivos móviles
            window.addEventListener('orientationchange', handleOrientationChange);
        }
        
        debug('MobileUtils inicializado', config);
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('mobileUtilsReady', { detail: { env } }));
        
        return {
            env, // Exponer información del entorno
            config, // Exponer configuración actual
            optimizeTouchTarget // Exponer función útil
        };
    }
    
    /**
     * Detecta dispositivos con memoria limitada
     */
    function detectLowMemoryDevice() {
        // Comprobamos la memoria del dispositivo si está disponible
        if (navigator.deviceMemory) {
            env.isLowMemoryDevice = navigator.deviceMemory < 4;
        } else {
            // Inferencia basada en otros factores
            env.isLowMemoryDevice = env.isMobile && (
                navigator.hardwareConcurrency < 4 || 
                /low|mid|sm-g|a10|j\d/i.test(navigator.userAgent)
            );
        }
        
        debug('Detección de dispositivo de baja memoria:', env.isLowMemoryDevice);
        
        // Aplicar optimizaciones si es un dispositivo de bajos recursos
        if (env.isLowMemoryDevice && config.optimizeForLowMemory) {
            document.documentElement.classList.add('low-memory-device');
        }
    }
    
    /**
     * Detecta si el dispositivo tiene notch
     */
    function checkForNotch() {
        // Para iPhoneX en adelante
        const iPhoneWithNotch = env.isIOS && (
            window.screen.height >= 812 || 
            window.screen.width >= 812
        );
        
        // Detección para Android 
        const androidWithNotch = env.isAndroid && (
            window.matchMedia('(orientation: portrait) and (max-width: 380px) and (min-height: 800px)').matches ||
            window.matchMedia('(orientation: landscape) and (min-width: 780px) and (max-height: 420px)').matches
        );
        
        return iPhoneWithNotch || androidWithNotch;
    }
    
    /**
     * Detecta la orientación del dispositivo y actualiza las clases CSS
     */
    function detectOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        document.documentElement.classList.toggle('landscape', isLandscape);
        document.documentElement.classList.toggle('portrait', !isLandscape);
        
        // Actualizar variables de entorno
        env.viewportHeight = window.innerHeight;
        env.viewportWidth = window.innerWidth;
        env.orientation = isLandscape ? 'landscape' : 'portrait';
        
        // Variable CSS para detectar orientación desde CSS
        document.documentElement.style.setProperty('--is-landscape', isLandscape ? '1' : '0');
        
        debug('Orientación detectada', env.orientation);
    }
    
    /**
     * Maneja el cambio de orientación en dispositivos móviles
     */
    function handleOrientationChange() {
        // Forzar un pequeño retraso para asegurar que la orientación se ha actualizado
        setTimeout(() => {
            detectOrientation();
            
            // Reoptimizar el rosco tras el cambio de orientación
            if (config.optimizeRosco) {
                optimizeRoscoForMobile();
            }
            
            // Anunciar el cambio de orientación para que los componentes puedan responder
            window.dispatchEvent(new CustomEvent('mobileOrientationChanged', {
                detail: { 
                    isLandscape: env.orientation === 'landscape',
                    viewportWidth: env.viewportWidth,
                    viewportHeight: env.viewportHeight
                }
            }));
        }, 300);
    }
    
    /**
     * Soluciona el problema de las unidades vh en móviles
     * especialmente para iOS Safari que incluye/excluye las barras de herramientas
     */
    function fixViewportHeightUnits() {
        function updateVhProperty() {
            // Calcular altura actual del viewport
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // También establecer --viewport-height y --viewport-width para cálculos en CSS
            document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
            document.documentElement.style.setProperty('--viewport-width', `${window.innerWidth}px`);
            
            // Detectar si estamos en pantalla completa o no (iOS)
            if (env.isIOS) {
                const isFullScreen = window.innerHeight === window.screen.height;
                document.documentElement.classList.toggle('ios-fullscreen', isFullScreen);
            }
            
            debug('Unidades vh actualizadas', vh);
        }
        
        // Actualizar al cargar y al cambiar el tamaño
        updateVhProperty();
        
        // Usar throttling para el evento resize
        let resizeTimeout;
        window.addEventListener('resize', function() {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateVhProperty, 100);
        });
        
        // Actualizar al cambiar orientación
        window.addEventListener('orientationchange', function() {
            // Pequeño retraso para asegurar que la orientación ha cambiado completamente
            setTimeout(updateVhProperty, 200);
        });
    }
    
    /**
     * Evita el zoom al hacer doble tap en elementos
     */
    function preventDoubleTapZoom() {
        // Aplicar el enfoque táctil mejorado a botones e inputs
        document.querySelectorAll('button, .btn, input[type="button"], input[type="submit"], .rosco-letter, .skip-btn, .help-btn, .submit-btn')
        .forEach(element => {
            element.addEventListener('touchend', function(e) {
                // Prevenir comportamiento predeterminado sólo si es un tap rápido
                const now = Date.now();
                if (this.lastTouch && (now - this.lastTouch) < 300) {
                    e.preventDefault();
                }
                this.lastTouch = now;
            });
        });
    }
    
    /**
     * Optimiza específicamente el rosco para móviles
     * Ajusta el tamaño y posicionamiento dinámicamente
     */
    function optimizeRoscoForMobile() {
        const roscoContainer = document.getElementById('rosco-container');
        if (!roscoContainer) return;
        
        const roscoLetters = document.querySelectorAll('.rosco-letter');
        if (!roscoLetters.length) return;
        
        // Cálculos para dispositivos móviles
        const isTinyScreen = window.innerWidth < 360;
        const isSmallScreen = window.innerWidth < 480;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // Ajustar el tamaño del rosco basado en la pantalla
        let roscoSize;
        
        if (isLandscape) {
            // En modo horizontal, ajustar a la altura disponible
            roscoSize = Math.min(window.innerHeight * 0.8, window.innerWidth * 0.4);
        } else {
            // En modo vertical, ajustar al ancho de la pantalla
            roscoSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.45);
        }
        
        // Limitar tamaño máximo y mínimo
        roscoSize = Math.max(240, Math.min(roscoSize, 450));
        
        // Aplicar el tamaño al contenedor
        roscoContainer.style.width = `${roscoSize}px`;
        roscoContainer.style.height = `${roscoSize}px`;
        
        // Calcular el tamaño de las letras
        const letterSize = isTinyScreen ? 22 : (isSmallScreen ? 30 : 40);
        const currentLetterSize = letterSize * 1.2;
        
        // Calcular el radio del rosco (ligeramente menor para pantallas pequeñas)
        const radius = (roscoSize / 2) * (isSmallScreen ? 0.85 : 0.8);
        
        // Reposicionar cada letra
        roscoLetters.forEach((letter, index) => {
            // Calcular posición radial
            const angle = (index * (2 * Math.PI / roscoLetters.length)) - Math.PI/2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            
            // Aplicar posición
            letter.style.left = `calc(50% + ${x}px)`;
            letter.style.top = `calc(50% + ${y}px)`;
            
            // Tamaño de letra
            if (letter.classList.contains('current')) {
                letter.style.width = `${currentLetterSize}px`;
                letter.style.height = `${currentLetterSize}px`;
                letter.style.lineHeight = `${currentLetterSize}px`;
            } else {
                letter.style.width = `${letterSize}px`;
                letter.style.height = `${letterSize}px`;
                letter.style.lineHeight = `${letterSize}px`;
            }
            
            // Ajustar tamaño de fuente
            letter.style.fontSize = isTinyScreen ? '10px' : (isSmallScreen ? '14px' : '16px');
        });
        
        // Ajustar la tarjeta de pregunta
        const questionCard = document.querySelector('.question-card');
        if (questionCard) {
            // En landscape, posicionar al lado del rosco
            if (isLandscape && window.innerWidth > 600) {
                questionCard.style.width = '40%';
                questionCard.style.position = 'relative';
                questionCard.style.left = 'auto';
                questionCard.style.top = 'auto';
                questionCard.style.transform = 'none';
            } else {
                // En portrait o pantallas pequeñas, centrar debajo
                questionCard.style.width = isSmallScreen ? '90%' : '80%';
                questionCard.style.maxWidth = '320px';
                questionCard.style.margin = '10px auto';
                questionCard.style.position = 'relative';
            }
        }
    }
    
    /**
     * Optimiza el área táctil de un elemento para móviles
     * @param {Element} element - Elemento DOM a optimizar
     * @param {Object} options - Opciones adicionales
     */
    function optimizeTouchTarget(element, options = {}) {
        if (!element) return;
        
        const opts = {
            minSize: options.minSize || config.minTouchTargetSize,
            usePadding: options.usePadding !== undefined ? options.usePadding : true
        };
        
        const rect = element.getBoundingClientRect();
        
        // Si el elemento es más pequeño que el mínimo recomendado
        if (rect.width < opts.minSize || rect.height < opts.minSize) {
            if (opts.usePadding) {
                // Aplicar padding manteniendo las dimensiones originales
                element.style.boxSizing = 'border-box';
                
                if (rect.width < opts.minSize) {
                    const horizontalPadding = (opts.minSize - rect.width) / 2;
                    element.style.paddingLeft = `${horizontalPadding}px`;
                    element.style.paddingRight = `${horizontalPadding}px`;
                }
                
                if (rect.height < opts.minSize) {
                    const verticalPadding = (opts.minSize - rect.height) / 2;
                    element.style.paddingTop = `${verticalPadding}px`;
                    element.style.paddingBottom = `${verticalPadding}px`;
                }
            } else {
                // Alternativa: usar posicionamiento relativo y pseudo-elemento
                element.style.position = 'relative';
                
                // Crear un pseudo-elemento que amplíe el área táctil
                const styleId = 'mobile-touch-styles';
                if (!document.getElementById(styleId)) {
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.textContent = `
                        .mobile-touch-target::before {
                            content: '';
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: ${opts.minSize}px;
                            height: ${opts.minSize}px;
                            z-index: -1;
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                element.classList.add('mobile-touch-target');
            }
            
            debug('Área táctil optimizada', {element, originalSize: {width: rect.width, height: rect.height}, newMinSize: opts.minSize});
        }
    }
    
    /**
     * Optimiza formularios para dispositivos táctiles
     * @param {Element} form - Elemento de formulario a optimizar
     */
    function optimizeFormForTouch(form) {
        if (!form || !env.supportsTouch) return;
        
        // Encontrar todos los controles interactivos
        const controls = form.querySelectorAll('input, select, textarea, button');
        
        controls.forEach(control => {
            // Aumentar área táctil
            optimizeTouchTarget(control);
            
            // Incrementar el line-height para entradas de texto
            if (control.tagName === 'INPUT' && (control.type === 'text' || control.type === 'email' || control.type === 'password')) {
                control.style.lineHeight = '1.4';
            }
            
            // Ajustar tamaño de fuente para entrada en móviles
            control.style.fontSize = '16px'; // Previene zoom automático en iOS
            
            // Añadir clase para estilos adicionales
            control.classList.add('touch-optimized');
        });
        
        // Incrementar espaciado entre campos
        const formGroups = form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.style.marginBottom = '16px';
        });
        
        debug('Formulario optimizado para dispositivos táctiles', form);
    }
    
    /**
     * Optimiza el scroll para dispositivos móviles
     */
    function optimizeScrolling() {
        // Prevenir rebote en Safari 
        if (env.isIOS) {
            document.documentElement.style.overflow = 'auto';
            document.documentElement.style.webkitOverflowScrolling = 'touch';
        }
        
        // Aplicar efecto de scroll pasivo para mejor rendimiento
        const passiveOption = {passive: true};
        
        try {
            window.addEventListener('test', null, passiveOption);
            
            // Aplicar scroll pasivo a eventos de touch
            document.addEventListener('touchstart', noop, passiveOption);
            document.addEventListener('touchmove', noop, passiveOption);
            
            debug('Scroll pasivo habilitado');
        } catch (e) {
            debug('Scroll pasivo no soportado', e);
        }
        
        function noop() {}
    }
    
    /**
     * Configura carga perezosa para elementos fuera de la pantalla
     */
    function setupLazyLoading() {
        // Comprobar soporte para IntersectionObserver
        if ('IntersectionObserver' in window) {
            const lazyElements = document.querySelectorAll('.lazy-load');
            
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const lazyElement = entry.target;
                        
                        // Imagen
                        if (lazyElement.tagName === 'IMG') {
                            if (lazyElement.dataset.src) {
                                lazyElement.src = lazyElement.dataset.src;
                                lazyElement.removeAttribute('data-src');
                            }
                        } 
                        // Background
                        else if (lazyElement.dataset.background) {
                            lazyElement.style.backgroundImage = `url('${lazyElement.dataset.background}')`;
                            lazyElement.removeAttribute('data-background');
                        }
                        
                        lazyElement.classList.remove('lazy-load');
                        lazyObserver.unobserve(lazyElement);
                    }
                });
            }, {
                rootMargin: `${config.offscreenThreshold}px 0px`
            });
            
            lazyElements.forEach(lazyElement => {
                lazyObserver.observe(lazyElement);
            });
            
            debug('Carga perezosa configurada con IntersectionObserver');
        } else {
            // Fallback para navegadores que no soportan IntersectionObserver
            function loadVisibleElements() {
                const lazyElements = document.querySelectorAll('.lazy-load');
                const viewportBottom = window.innerHeight + window.pageYOffset;
                const offset = config.offscreenThreshold;
                
                lazyElements.forEach(lazyElement => {
                    const elementTop = lazyElement.getBoundingClientRect().top + window.pageYOffset;
                    
                    if (elementTop < viewportBottom + offset) {
                        if (lazyElement.tagName === 'IMG') {
                            if (lazyElement.dataset.src) {
                                lazyElement.src = lazyElement.dataset.src;
                                lazyElement.removeAttribute('data-src');
                            }
                        } else if (lazyElement.dataset.background) {
                            lazyElement.style.backgroundImage = `url('${lazyElement.dataset.background}')`;
                            lazyElement.removeAttribute('data-background');
                        }
                        
                        lazyElement.classList.remove('lazy-load');
                    }
                });
            }
            
            // Cargar elementos visibles inmediatamente
            loadVisibleElements();
            
            // Configurar evento de scroll con throttling
            let scrollTimeout;
            window.addEventListener('scroll', function() {
                if (scrollTimeout) clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(loadVisibleElements, config.scrollThrottleTime);
            });
            
            debug('Carga perezosa configurada con scroll event (fallback)');
        }
    }
    
    /**
     * Aplica optimizaciones específicas para el juego del rosco
     */
    function optimizeGameForMobile() {
        if (!document.getElementById('rosco-container')) return;
        
        // Optimizar la disposición del rosco
        optimizeRoscoForMobile();
        
        // Optimizar áreas táctiles de los botones principales
        document.querySelectorAll('.submit-btn, .skip-btn, .help-btn, .home-link, .back-button').forEach(element => {
            optimizeTouchTarget(element, { minSize: 48 });
        });
        
        // Asegurar que el input de respuesta tenga tamaño adecuado
        const answerInput = document.querySelector('.answer-input');
        if (answerInput) {
            answerInput.style.fontSize = '16px'; // Prevenir zoom en iOS
            answerInput.style.height = 'auto';
            answerInput.style.minHeight = '44px';
        }
        
        // Optimizar el rendimiento desactivando algunas animaciones en dispositivos de bajos recursos
        if (env.isLowMemoryDevice) {
            document.documentElement.classList.add('reduce-animations');
            
            // Limitar algunas animaciones y efectos
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .reduce-animations .rosco-letter,
                .reduce-animations .submit-btn,
                .reduce-animations .skip-btn,
                .reduce-animations .help-btn {
                    transition: all 0.2s linear !important;
                }
                
                .reduce-animations .rosco-letter.current {
                    animation: none !important;
                }
                
                .reduce-animations .question-card::before,
                .reduce-animations .question-card::after {
                    display: none !important;
                }
            `;
            document.head.appendChild(styleElement);
        }
        
        debug('Juego optimizado para móviles');
    }
    
    /**
     * Imprime mensajes de depuración si el modo está activado
     */
    function debug(message, data) {
        if (config.debugMode) {
            console.log(`%c[MobileUtils] ${message}`, 'color: #4338ca', data || '');
        }
    }
    
    // API pública
    return {
        init,
        optimizeTouchTarget,
        optimizeFormForTouch,
        env,
        optimizeRoscoForMobile,
        optimizeGameForMobile
    };
})();

// Exponer globalmente
window.MobileUtils = MobileUtils; 