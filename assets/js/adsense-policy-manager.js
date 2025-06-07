/**
 * AdSense Policy Manager
 * 
 * Este script gestiona la carga y visualización de anuncios de Google AdSense
 * asegurando el cumplimiento de las políticas de Google.
 * 
 * Características principales:
 * - Verifica que la página tenga suficiente contenido original
 * - Evita mostrar anuncios en páginas en construcción o edición
 * - Asegura que los anuncios no se muestren en páginas con alertas o ventanas emergentes
 * - Mantiene un registro de cumplimiento para auditoría
 */

class AdSensePolicyManager {
    constructor(options = {}) {
        // Configuración por defecto
        this.options = Object.assign({
            pubId: 'ca-pub-9579152019412427', // ID de publicador de AdSense
            enableLogging: false,              // Activar logs detallados
            enableAudit: true,                 // Activar auditoría de cumplimiento
            adContainerClass: 'adsbygoogle',   // Clase CSS para contenedores de anuncios
            pagesInConstruction: [             // Páginas conocidas en construcción
                '/adsense-verification.html',
                '/under-construction.html',
                '/coming-soon.html'
            ],
            exemptPages: [                     // Páginas exentas de verificación de contenido
                '/',
                '/index.html',
                '/games.html',
                '/blog.html'
            ],
            minContentScore: 70                // Puntuación mínima para mostrar anuncios
        }, options);

        // Estado inicial
        this.adsEnabled = true;
        this.adsLoaded = false;
        this.policyViolations = [];
        this.adContainers = [];
        this.pageInfo = {
            url: window.location.href,
            path: window.location.pathname,
            isExempt: false,
            isInConstruction: false,
            hasInterstitials: false,
            contentScore: 0
        };

        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Inicializa el gestor de políticas
     */
    init() {
        // Analizar la página actual
        this.analyzeCurrentPage();
        
        // Encontrar todos los contenedores de anuncios
        this.findAdContainers();
        
        // Decidir si se deben mostrar anuncios
        this.enforceAdPolicy();
        
        // Escuchar eventos relevantes
        this.setupEventListeners();
        
        // Registrar información si está habilitado
        if (this.options.enableLogging) {
            this.logPolicyInfo();
        }
    }

    /**
     * Analiza la página actual para determinar su estado
     */
    analyzeCurrentPage() {
        const path = window.location.pathname;
        
        // Verificar si la página está exenta de verificación
        this.pageInfo.isExempt = this.options.exemptPages.includes(path);
        
        // Verificar si la página está en construcción
        this.pageInfo.isInConstruction = this.options.pagesInConstruction.includes(path);
        
        // Verificar si hay interstitials o popups
        this.pageInfo.hasInterstitials = this.detectInterstitials();
        
        // Obtener puntuación de contenido si está disponible
        this.detectContentScore();
    }

    /**
     * Detecta popups o interstitials que podrían violar políticas
     */
    detectInterstitials() {
        // Buscar elementos que puedan ser popups o interstitials
        const possibleInterstitials = document.querySelectorAll(
            '.popup, .modal, .interstitial, [role="dialog"], [aria-modal="true"]'
        );
        
        // Verificar si hay alguno visible
        return Array.from(possibleInterstitials).some(element => {
            const style = window.getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden';
        });
    }

    /**
     * Detecta la puntuación de contenido usando el validador
     */
    detectContentScore() {
        // Escuchar evento del validador de contenido
        document.addEventListener('adsenseContentValidated', (event) => {
            if (event.detail && typeof event.detail.stats.contentScore === 'number') {
                this.pageInfo.contentScore = event.detail.stats.contentScore;
                
                // Re-evaluar política con la nueva información
                this.enforceAdPolicy();
            }
        });
    }

    /**
     * Encuentra todos los contenedores de anuncios en la página
     */
    findAdContainers() {
        // Buscar contenedores por clase
        this.adContainers = Array.from(
            document.querySelectorAll(`.${this.options.adContainerClass}`)
        );
        
        if (this.options.enableLogging) {
            console.log(`AdSense Policy Manager: Encontrados ${this.adContainers.length} contenedores de anuncios`);
        }
    }

    /**
     * Aplica la política de anuncios según el análisis
     */
    enforceAdPolicy() {
        // Por defecto, permitir anuncios
        this.adsEnabled = true;
        this.policyViolations = [];
        
        // Verificar si la página está en construcción
        if (this.pageInfo.isInConstruction) {
            this.adsEnabled = false;
            this.policyViolations.push('page_in_construction');
        }
        
        // Verificar si hay interstitials o popups
        if (this.pageInfo.hasInterstitials) {
            this.adsEnabled = false;
            this.policyViolations.push('has_interstitials');
        }
        
        // Verificar puntuación de contenido (solo si no está exenta)
        if (!this.pageInfo.isExempt && this.pageInfo.contentScore > 0) {
            if (this.pageInfo.contentScore < this.options.minContentScore) {
                this.adsEnabled = false;
                this.policyViolations.push('insufficient_content');
            }
        }
        
        // Aplicar decisión
        if (!this.adsEnabled) {
            this.disableAds();
        } else {
            this.enableAds();
        }
        
        // Registrar violación si corresponde
        if (this.policyViolations.length > 0 && this.options.enableAudit) {
            this.logPolicyViolation();
        }
    }

    /**
     * Desactiva los anuncios en la página
     */
    disableAds() {
        // Ocultar todos los contenedores de anuncios
        this.adContainers.forEach(container => {
            container.style.display = 'none';
            container.dataset.adStatus = 'disabled';
        });
        
        // Evitar que se carguen nuevos anuncios
        window.adsbygoogle = window.adsbygoogle || [];
        if (typeof window.adsbygoogle.pauseAdRequests === 'function') {
            window.adsbygoogle.pauseAdRequests = 1;
        }
        
        if (this.options.enableLogging) {
            console.warn('AdSense Policy Manager: Anuncios desactivados debido a violaciones de política', 
                this.policyViolations);
        }
    }

    /**
     * Habilita los anuncios en la página
     */
    enableAds() {
        // Mostrar todos los contenedores de anuncios
        this.adContainers.forEach(container => {
            container.style.display = 'block';
            container.dataset.adStatus = 'enabled';
        });
        
        if (this.options.enableLogging) {
            console.log('AdSense Policy Manager: Anuncios habilitados, cumple con las políticas');
        }
    }

    /**
     * Configura los listeners de eventos relevantes
     */
    setupEventListeners() {
        // Escuchar cambios en el DOM que puedan afectar a los anuncios
        const observer = new MutationObserver((mutations) => {
            // Verificar si se han añadido nuevos contenedores de anuncios
            let newAdsFound = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList.contains(this.options.adContainerClass)) {
                                this.adContainers.push(node);
                                newAdsFound = true;
                            }
                            
                            // Buscar anuncios dentro del nodo añadido
                            const nestedAds = node.querySelectorAll(`.${this.options.adContainerClass}`);
                            if (nestedAds.length > 0) {
                                this.adContainers = this.adContainers.concat(Array.from(nestedAds));
                                newAdsFound = true;
                            }
                        }
                    });
                }
            });
            
            // Re-aplicar política si se encontraron nuevos anuncios
            if (newAdsFound) {
                this.enforceAdPolicy();
            }
        });
        
        // Observar cambios en todo el documento
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    }

    /**
     * Registra información de políticas para depuración
     */
    logPolicyInfo() {
        console.log('AdSense Policy Manager: Estado de la página', {
            url: this.pageInfo.url,
            path: this.pageInfo.path,
            isExempt: this.pageInfo.isExempt,
            isInConstruction: this.pageInfo.isInConstruction,
            hasInterstitials: this.pageInfo.hasInterstitials,
            contentScore: this.pageInfo.contentScore,
            adsEnabled: this.adsEnabled,
            violations: this.policyViolations,
            adContainers: this.adContainers.length
        });
    }

    /**
     * Registra violaciones de política para auditoría
     */
    logPolicyViolation() {
        // Crear objeto de evento para enviar a analítica si está disponible
        const violationEvent = {
            timestamp: new Date().toISOString(),
            url: this.pageInfo.url,
            path: this.pageInfo.path,
            violations: this.policyViolations,
            contentScore: this.pageInfo.contentScore
        };
        
        // Enviar a Google Analytics si está disponible
        if (typeof gtag === 'function') {
            gtag('event', 'adsense_policy_violation', {
                event_category: 'AdSense',
                event_label: this.policyViolations.join(','),
                non_interaction: true
            });
        }
        
        // También podríamos enviar a un servidor propio para registro
        if (this.options.enableLogging) {
            console.warn('AdSense Policy Violation:', violationEvent);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia del gestor de políticas
    window.adSensePolicyManager = new AdSensePolicyManager({
        enableLogging: true,
        enableAudit: true
    });
});

// Exportar clase para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdSensePolicyManager;
} 