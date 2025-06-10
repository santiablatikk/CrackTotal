/**
 * AdSense Content Validator
 * 
 * Este script evalúa el contenido de la página y determina si tiene suficiente
 * contenido de calidad para mostrar anuncios de AdSense.
 * 
 * Esto ayuda a cumplir con las políticas de Google AdSense que prohíben
 * mostrar anuncios en páginas con contenido insuficiente o de poco valor.
 */

class AdSenseContentValidator {
    constructor(options = {}) {
        // Opciones por defecto
        this.options = Object.assign({
            minTextLength: 300, // Mínimo de caracteres de texto en la página (reducido de 400)
            minParagraphs: 2,    // Mínimo de párrafos en la página (reducido de 3)
            minHeadings: 1,      // Mínimo de encabezados en la página
            ignoreNavigation: true, // Ignorar texto en elementos de navegación
            ignoreFooter: true,     // Ignorar texto en pies de página
            contentSelectors: ['main', 'article', '.content', '.page-content', '.policy-content', '.container'], // Selectores de contenido principal
            enableLogging: false,    // Habilitar registro en consola
            adSlots: [],            // IDs de slots de anuncios para desactivar si es necesario
            autoDisableAds: true    // Desactivar automáticamente los anuncios si no hay suficiente contenido
        }, options);

        // Estado inicial
        this.hasEnoughContent = false;
        this.pageStats = {
            textLength: 0,
            paragraphCount: 0,
            headingCount: 0,
            contentScore: 0
        };
        
        // Iniciar validación cuando el DOM esté cargado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.validateContent());
        } else {
            this.validateContent();
        }
    }
    
    /**
     * Valida el contenido de la página y decide si mostrar anuncios
     */
    validateContent() {
        // Obtener texto y estadísticas de la página
        this.analyzePageContent();
        
        // Determinar si hay suficiente contenido
        this.evaluateContentQuality();
        
        // Registrar resultados si está habilitado
        if (this.options.enableLogging) {
            console.log('AdSense Content Validator:', {
                hasEnoughContent: this.hasEnoughContent,
                stats: this.pageStats
            });
        }
        
        // Aplicar decisión sobre anuncios
        if (this.options.autoDisableAds && !this.hasEnoughContent) {
            this.disableAdsOnPage();
        }
        
        // Disparar evento personalizado
        this.dispatchValidationEvent();
    }
    
    /**
     * Analiza el contenido de la página y recopila estadísticas
     */
    analyzePageContent() {
        // Intentar obtener el contenido principal primero
        let mainContent = null;
        
        for (const selector of this.options.contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                mainContent = element;
                break;
            }
        }
        
        // Si no se encuentra contenido principal, usar todo el body
        const contentToAnalyze = mainContent || document.body;
        
        // Ignorar elementos de navegación y pie de página si está configurado
        let elementsToIgnore = [];
        
        if (this.options.ignoreNavigation) {
            elementsToIgnore = elementsToIgnore.concat(
                Array.from(document.querySelectorAll('nav, header, .navigation, .menu, .navbar'))
            );
        }
        
        if (this.options.ignoreFooter) {
            elementsToIgnore = elementsToIgnore.concat(
                Array.from(document.querySelectorAll('footer, .footer'))
            );
        }
        
        // Clonar el contenido para manipularlo sin afectar la página
        const contentClone = contentToAnalyze.cloneNode(true);
        
        // Eliminar elementos a ignorar del clon
        elementsToIgnore.forEach(el => {
            const matches = contentClone.querySelectorAll(el.tagName);
            matches.forEach(match => {
                if (match.isEqualNode(el)) {
                    match.remove();
                }
            });
        });
        
        // Contar párrafos (elementos p con al menos 20 caracteres)
        const paragraphs = contentClone.querySelectorAll('p');
        this.pageStats.paragraphCount = Array.from(paragraphs).filter(p => 
            p.textContent.trim().length >= 20
        ).length;
        
        // Contar encabezados
        const headings = contentClone.querySelectorAll('h1, h2, h3, h4, h5, h6');
        this.pageStats.headingCount = headings.length;
        
        // Obtener todo el texto visible
        this.pageStats.textLength = this.getVisibleTextLength(contentClone);
    }
    
    /**
     * Calcula la longitud del texto visible en un elemento
     */
    getVisibleTextLength(element) {
        // Obtener todos los nodos de texto
        let text = '';
        const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        
        let node;
        while (node = walk.nextNode()) {
            // Verificar que el nodo no esté en un script, estilo o elemento oculto
            const parent = node.parentElement;
            
            if (!parent) continue;
            
            // Saltar scripts, estilos y elementos ocultos
            if (parent.tagName === 'SCRIPT' || 
                parent.tagName === 'STYLE' || 
                parent.tagName === 'NOSCRIPT' || 
                parent.getAttribute('aria-hidden') === 'true' || 
                getComputedStyle(parent).display === 'none' || 
                getComputedStyle(parent).visibility === 'hidden') {
                continue;
            }
            
            text += node.nodeValue.trim() + ' ';
        }
        
        return text.trim().length;
    }
    
    /**
     * Evalúa la calidad del contenido según las estadísticas recopiladas
     */
    evaluateContentQuality() {
        // Calcular puntuación de contenido (0-100)
        let score = 0;
        
        // Evaluar longitud de texto (hasta 40 puntos)
        const textScore = Math.min(this.pageStats.textLength / this.options.minTextLength, 1) * 40;
        
        // Evaluar cantidad de párrafos (hasta 30 puntos)
        const paragraphScore = Math.min(this.pageStats.paragraphCount / this.options.minParagraphs, 1) * 30;
        
        // Evaluar cantidad de encabezados (hasta 30 puntos)
        const headingScore = Math.min(this.pageStats.headingCount / this.options.minHeadings, 1) * 30;
        
        // Calcular puntuación total
        this.pageStats.contentScore = Math.round(textScore + paragraphScore + headingScore);
        
        // Determinar si hay suficiente contenido (score >= 70)
        this.hasEnoughContent = this.pageStats.contentScore >= 70;
    }
    
    /**
     * Desactiva los anuncios en la página
     */
    disableAdsOnPage() {
        // Marcar la página como no apta para anuncios
        if (window.googletag && googletag.cmd) {
            googletag.cmd.push(() => {
                googletag.pubads().setPrivacySettings({
                    nonPersonalizedAds: true
                });
            });
        }
        
        // Eliminar slots de anuncios específicos si se han configurado
        if (this.options.adSlots.length > 0 && window.googletag && googletag.cmd) {
            googletag.cmd.push(() => {
                this.options.adSlots.forEach(slotId => {
                    const adElement = document.getElementById(slotId);
                    if (adElement) {
                        adElement.style.display = 'none';
                    }
                });
            });
        }
        
        // Ocultar todos los iframes de AdSense
        const adIframes = document.querySelectorAll('iframe[src*="googleads"], iframe[src*="doubleclick"]');
        adIframes.forEach(iframe => {
            iframe.style.display = 'none';
        });
        
        // Ocultar contenedores de anuncios conocidos
        const adContainers = document.querySelectorAll('.adsbygoogle, [id^="google_ads_"], [id^="div-gpt-ad"]');
        adContainers.forEach(container => {
            container.style.display = 'none';
        });
        
        // Evitar que se carguen más anuncios
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.pauseAdRequests = 1;
        
        // También intentar detener futuros anuncios
        if (window.adsbygoogle.push) {
            window.adsbygoogle.push(() => {
                if (window.adsbygoogle && window.adsbygoogle.pauseAdRequests !== undefined) {
                    window.adsbygoogle.pauseAdRequests = 1;
                }
            });
        }
    }
    
    /**
     * Dispara un evento personalizado con el resultado de la validación
     */
    dispatchValidationEvent() {
        const event = new CustomEvent('adsenseContentValidated', { 
            detail: {
                hasEnoughContent: this.hasEnoughContent,
                stats: this.pageStats
            }
        });
        
        document.dispatchEvent(event);
    }
}

// Inicializar validador cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    // Configuración personalizada según la página
    const validator = new AdSenseContentValidator({
        enableLogging: true,
        autoDisableAds: true
    });
    
    // Escuchar evento de validación
    document.addEventListener('adsenseContentValidated', (event) => {
        if (!event.detail.hasEnoughContent) {
            console.warn('Esta página no tiene suficiente contenido para mostrar anuncios según las políticas de AdSense.');
            
            // Podríamos agregar aquí código para reportar esta página para revisión
        }
    });
});

// Exportar clase para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdSenseContentValidator;
} 