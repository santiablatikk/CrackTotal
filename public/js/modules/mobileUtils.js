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
        pixelRatio: window.devicePixelRatio || 1
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
        debugMode: false
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
            
            // Detectar orientación
            detectOrientation();
            window.addEventListener('resize', detectOrientation);
        }
        
        debug('MobileUtils inicializado', config);
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('mobileUtilsReady'));
        
        return {
            env, // Exponer información del entorno
            config // Exponer configuración actual
        };
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
        
        debug('Orientación detectada', env.orientation);
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
            const options = {
                rootMargin: `${config.offscreenThreshold}px 0px`
            };
            
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        
                        // Cargar imagen si tiene data-src
                        if (element.tagName === 'IMG' && element.dataset.src) {
                            element.src = element.dataset.src;
                            if (element.dataset.srcset) {
                                element.srcset = element.dataset.srcset;
                            }
                        } 
                        // Cargar fondo si tiene data-bg
                        else if (element.dataset.bg) {
                            element.style.backgroundImage = `url(${element.dataset.bg})`;
                        }
                        
                        // Añadir clase para posibles animaciones
                        element.classList.add('loaded');
                        
                        // Dejar de observar este elemento
                        observer.unobserve(element);
                    }
                });
            }, options);
            
            // Observar elementos con atributos data-src o data-bg
            document.querySelectorAll('[data-src], [data-bg]').forEach(element => {
                observer.observe(element);
            });
            
            debug('Lazy loading configurado con IntersectionObserver');
        } else {
            // Fallback para navegadores que no soportan IntersectionObserver
            function loadVisibleElements() {
                const elements = document.querySelectorAll('[data-src], [data-bg]');
                const viewportBottom = window.scrollY + window.innerHeight + config.offscreenThreshold;
                const viewportTop = window.scrollY - config.offscreenThreshold;
                
                elements.forEach(element => {
                    const rect = element.getBoundingClientRect();
                    const elementTop = window.scrollY + rect.top;
                    const elementBottom = elementTop + rect.height;
                    
                    // Comprobar si el elemento está en el viewport
                    if (elementBottom >= viewportTop && elementTop <= viewportBottom) {
                        if (element.tagName === 'IMG' && element.dataset.src) {
                            element.src = element.dataset.src;
                            if (element.dataset.srcset) {
                                element.srcset = element.dataset.srcset;
                            }
                        } else if (element.dataset.bg) {
                            element.style.backgroundImage = `url(${element.dataset.bg})`;
                        }
                        
                        element.classList.add('loaded');
                        element.removeAttribute('data-src');
                        element.removeAttribute('data-bg');
                    }
                });
            }
            
            // Aplicar throttling al evento de scroll
            let scrollTimeout;
            window.addEventListener('scroll', function() {
                if (scrollTimeout) return;
                scrollTimeout = setTimeout(() => {
                    loadVisibleElements();
                    scrollTimeout = null;
                }, config.scrollThrottleTime);
            }, false);
            
            // Cargar elementos visibles inicialmente
            loadVisibleElements();
            
            debug('Lazy loading configurado con fallback de scroll');
        }
    }
    
    /**
     * Configura navegación por gestos para un contenedor
     * @param {string|Element} container - Selector o elemento contenedor
     * @param {Object} options - Configuración de gestos
     */
    function setupGestureNavigation(container, options = {}) {
        const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
        if (!containerEl || !env.supportsTouch) return;
        
        const defaults = {
            threshold: 100, // px mínimos para detectar un gesto
            velocityThreshold: 0.3, // velocidad mínima para detectar un gesto
            swipeLeft: null, // callback para swipe izquierda
            swipeRight: null, // callback para swipe derecha
            swipeUp: null, // callback para swipe arriba
            swipeDown: null // callback para swipe abajo
        };
        
        const settings = {...defaults, ...options};
        
        let startX, startY, startTime;
        let isTracking = false;
        
        containerEl.addEventListener('touchstart', e => {
            if (e.touches.length !== 1) return;
            
            isTracking = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, {passive: true});
        
        containerEl.addEventListener('touchmove', e => {
            if (!isTracking || e.touches.length !== 1) return;
            
            // Si hay un scroll vertical significativo y es un contenedor con scroll,
            // cancelar el tracking para permitir scroll normal
            const deltaY = Math.abs(e.touches[0].clientY - startY);
            if (deltaY > 30 && containerEl.scrollHeight > containerEl.clientHeight) {
                isTracking = false;
                return;
            }
        }, {passive: true});
        
        containerEl.addEventListener('touchend', e => {
            if (!isTracking) return;
            isTracking = false;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const elapsedTime = Date.now() - startTime;
            
            const velocityX = Math.abs(deltaX) / elapsedTime;
            const velocityY = Math.abs(deltaY) / elapsedTime;
            
            // Determinar dirección del swipe
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Swipe horizontal
                if (Math.abs(deltaX) >= settings.threshold || velocityX > settings.velocityThreshold) {
                    if (deltaX > 0 && settings.swipeRight) {
                        settings.swipeRight(e);
                        debug('Swipe derecha detectado', {deltaX, velocityX});
                    } else if (deltaX < 0 && settings.swipeLeft) {
                        settings.swipeLeft(e);
                        debug('Swipe izquierda detectado', {deltaX, velocityX});
                    }
                }
            } else {
                // Swipe vertical
                if (Math.abs(deltaY) >= settings.threshold || velocityY > settings.velocityThreshold) {
                    if (deltaY > 0 && settings.swipeDown) {
                        settings.swipeDown(e);
                        debug('Swipe abajo detectado', {deltaY, velocityY});
                    } else if (deltaY < 0 && settings.swipeUp) {
                        settings.swipeUp(e);
                        debug('Swipe arriba detectado', {deltaY, velocityY});
                    }
                }
            }
        }, {passive: true});
        
        debug('Navegación por gestos configurada', {container, settings});
    }
    
    /**
     * Función de depuración
     * @param {string} message - Mensaje a mostrar
     * @param {any} data - Datos adicionales
     */
    function debug(message, data) {
        if (!config.debugMode) return;
        
        console.groupCollapsed(`%cMobileUtils: ${message}`, 'color: #9c27b0; font-weight: bold;');
        if (data !== undefined) {
            console.log(data);
        }
        console.groupEnd();
    }
    
    // API pública
    return {
        init,
        env,
        optimizeTouchTarget,
        optimizeFormForTouch,
        setupGestureNavigation
    };
})();

// Exponer globalmente
window.MobileUtils = MobileUtils; 