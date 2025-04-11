/**
 * MobileUtils.js - Utilidades para la optimización de experiencia en dispositivos móviles
 * Versión: 1.0.0
 */

const MobileUtils = {
    // Configuración predeterminada
    config: {
        debugMode: false,
        fixVhUnits: true,
        optimizeTouchElements: true,
        lazyLoadImages: true,
        allowScrolling: true, // Aseguramos que el desplazamiento esté habilitado por defecto
        minTouchTargetSize: 44, // Recomendado por WCAG
        scrollThrottleTime: 100,
        touchThrottleTime: 150,
        optimizeScrolling: true,
        lazyLoadOffscreen: true,
        offscreenThreshold: 300, // px
    },

    // Método de inicialización
    init: function(userConfig = {}) {
        // Combinar configuración del usuario con valores predeterminados
        this.config = { ...this.config, ...userConfig };
        
        // Log de depuración si está habilitado
        if (this.config.debugMode) {
            console.log('MobileUtils inicializado con configuración:', this.config);
        }
        
        // Aplicar optimizaciones
        this.setupViewportHeight();
        this.optimizeTouch();
        if (this.config.lazyLoadImages) {
            this.setupLazyLoading();
        }
        
        // Asegurar que el desplazamiento funciona correctamente en móviles
        this.fixScrolling();
        
        // Escuchar eventos de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.setupViewportHeight();
                this.fixScrolling();
            }, 200);
        });
        
        // Escuchar eventos de redimensionamiento para ajustes
        window.addEventListener('resize', () => {
            this.setupViewportHeight();
            this.fixScrolling();
        });
    },
    
    // Corregir la altura del viewport en dispositivos móviles (especialmente iOS)
    setupViewportHeight: function() {
        if (!this.config.fixVhUnits) return;
        
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        if (this.config.debugMode) {
            console.log('Viewport height ajustado:', vh);
        }
    },
    
    // Optimizar interacciones táctiles
    optimizeTouch: function() {
        if (!this.config.optimizeTouchElements) return;
        
        // Mejorar respuesta táctil en elementos clicables
        const touchTargets = document.querySelectorAll('a, button, .difficulty-option, [role="button"]');
        touchTargets.forEach(el => {
            el.style.touchAction = 'manipulation';
            
            // Añadir feedback táctil
            el.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            }, { passive: true });
            
            el.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            }, { passive: true });
        });
    },
    
    // Configurar carga perezosa de imágenes
    setupLazyLoading: function() {
        if (!('IntersectionObserver' in window)) return;
        
        const lazyImages = document.querySelectorAll('img[data-src], .lazy-bg');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    
                    if (lazyImage.tagName === 'IMG') {
                        if (lazyImage.dataset.src) {
                            lazyImage.src = lazyImage.dataset.src;
                            lazyImage.removeAttribute('data-src');
                        }
                    } else {
                        // Para fondos
                        if (lazyImage.dataset.background) {
                            lazyImage.style.backgroundImage = `url('${lazyImage.dataset.background}')`;
                            lazyImage.removeAttribute('data-background');
                        }
                    }
                    
                    lazyImage.classList.remove('lazy');
                    imageObserver.unobserve(lazyImage);
                }
            });
        });
        
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    },
    
    // Asegurar que el desplazamiento funciona correctamente en dispositivos móviles
    fixScrolling: function() {
        if (!this.config.allowScrolling) return;
        
        // Eliminar restricciones de altura fija que pueden bloquear el desplazamiento
        const scrollContainers = [
            document.body,
            document.querySelector('.app-container'),
            document.querySelector('.screens-container'),
            document.querySelector('.content-card')
        ];
        
        scrollContainers.forEach(container => {
            if (container) {
                // Asegurar que el contenedor permite desplazamiento
                container.style.minHeight = 'auto';
                container.style.height = 'auto';
                container.style.overflowY = 'visible';
                
                // Eliminar cualquier posición fija que pueda bloquear el scroll
                if (container !== document.body) {
                    container.style.position = 'relative';
                }
            }
        });
        
        // Arreglar problemas específicos de iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            document.documentElement.style.height = 'auto';
            document.body.style.height = 'auto';
            document.body.style.position = 'relative';
            document.body.style.overflow = 'auto';
            
            // Permitir scroll cuando hay modales abiertos
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => {
                if (modal && window.getComputedStyle(modal).display !== 'none') {
                    modal.style.overflowY = 'auto';
                    modal.style.webkitOverflowScrolling = 'touch';
                }
            });
        }
        
        if (this.config.debugMode) {
            console.log('Ajustes de scroll aplicados para dispositivos móviles');
        }
    }
};

// Exponer el objeto globalmente
window.MobileUtils = MobileUtils; 