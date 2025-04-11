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
        allowScrolling: true,
        preserveRoscoSize: true // Nueva opción para preservar el tamaño del rosco
    },

    // Método de inicialización
    init: function(userConfig = {}) {
        // Combinar configuración del usuario con valores predeterminados
        this.config = { ...this.config, ...userConfig };
        
        // Log de depuración si está habilitado
        if (this.config.debugMode) {
            console.log('MobileUtils inicializado con configuración:', this.config);
        }
        
        // Aplicar corrección de desplazamiento inmediatamente
        this.fixScrolling();
        
        // Establecer listeners
        window.addEventListener('load', () => {
            this.fixScrolling();
            if (this.config.preserveRoscoSize) {
                this.preserveRoscoSize();
            }
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.fixScrolling();
                if (this.config.preserveRoscoSize) {
                    this.preserveRoscoSize();
                }
            }, 200);
        });
        
        window.addEventListener('resize', () => {
            this.fixScrolling();
            if (this.config.preserveRoscoSize) {
                this.preserveRoscoSize();
            }
        });
        
        // Ejecutar otras optimizaciones solo si están habilitadas
        if (this.config.fixVhUnits) {
            this.setupViewportHeight();
        }
        
        if (this.config.optimizeTouchElements) {
            this.optimizeTouch();
        }
        
        if (this.config.lazyLoadImages) {
            this.setupLazyLoading();
        }
    },
    
    // Fix para el problema de desplazamiento en móviles
    fixScrolling: function() {
        // Solución mínima para habilitar desplazamiento sin cambiar la apariencia
        document.body.style.position = 'relative';
        document.body.style.overflowY = 'auto';
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowY = 'auto';
        
        // Arreglo específico para iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            document.documentElement.style.webkitOverflowScrolling = 'touch';
            
            // Arreglar modales en iOS
            const modals = document.querySelectorAll('.modal-overlay, .modal');
            modals.forEach(modal => {
                if (modal && window.getComputedStyle(modal).display !== 'none') {
                    modal.style.overflowY = 'auto';
                    modal.style.webkitOverflowScrolling = 'touch';
                }
            });
        }
    },
    
    // Preservar el tamaño del rosco para que se vea como en escritorio
    preserveRoscoSize: function() {
        const roscoContainer = document.getElementById('rosco-container');
        if (!roscoContainer) return;
        
        // Asegurar que el rosco mantenga proporciones adecuadas
        const isMobile = window.innerWidth <= 480;
        const isVeryNarrow = window.innerWidth <= 360;
        
        if (isMobile) {
            // Asegurar que el rosco se vea bien
            roscoContainer.style.transform = 'scale(1)';
            roscoContainer.style.transformOrigin = 'center center';
            roscoContainer.style.width = '100%';
            roscoContainer.style.margin = '0 auto';
            
            // Asegurar que las letras se vean bien
            const letters = roscoContainer.querySelectorAll('.rosco-letter');
            letters.forEach(letter => {
                letter.style.fontSize = isVeryNarrow ? '0.7rem' : '0.8rem';
            });
            
            // Ajustar la tarjeta de pregunta
            const questionCard = document.querySelector('.question-card');
            if (questionCard) {
                questionCard.style.width = isVeryNarrow ? '80%' : '85%';
                questionCard.style.maxWidth = 'none';
            }
        } else {
            // Resetear estilos en desktop
            roscoContainer.style.transform = '';
            roscoContainer.style.transformOrigin = '';
            roscoContainer.style.width = '';
            roscoContainer.style.margin = '';
            
            const letters = roscoContainer.querySelectorAll('.rosco-letter');
            letters.forEach(letter => {
                letter.style.fontSize = '';
            });
            
            const questionCard = document.querySelector('.question-card');
            if (questionCard) {
                questionCard.style.width = '';
                questionCard.style.maxWidth = '';
            }
        }
    },
    
    // Corregir la altura del viewport en dispositivos móviles
    setupViewportHeight: function() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    },
    
    // Optimizar interacciones táctiles
    optimizeTouch: function() {
        const touchTargets = document.querySelectorAll('a, button, .difficulty-option, .rosco-letter, [role="button"]');
        touchTargets.forEach(el => {
            el.style.touchAction = 'manipulation';
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
    }
};

// Exponer el objeto globalmente
window.MobileUtils = MobileUtils; 