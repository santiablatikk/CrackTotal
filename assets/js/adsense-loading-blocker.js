/**
 * AdSense Loading State Blocker
 * 
 * Este script asegura que los anuncios no se muestren durante:
 * - Estados de carga (loading)
 * - Estados de error
 * - Páginas sin contenido completamente cargado
 * 
 * Esto es crítico para cumplir con las políticas de AdSense.
 */

class AdSenseLoadingBlocker {
    constructor() {
        this.blockedStates = [
            'loading-state',
            'cargando',
            'error-state',
            'spinner',
            'fa-spin',
            'no-data',
            'empty-state'
        ];
        
        this.adContainerSelectors = [
            '.adsense-container',
            '.adsbygoogle',
            'ins[data-ad-client]'
        ];
        
        this.init();
    }
    
    init() {
        // Bloquear inmediatamente si hay estados problemáticos
        this.checkAndBlockAds();
        
        // Observar cambios en el DOM
        this.observeDOM();
        
        // Verificar periódicamente
        setInterval(() => {
            this.checkAndBlockAds();
        }, 1000);
    }
    
    checkAndBlockAds() {
        // Verificar si hay elementos de loading/error visibles
        const hasProblematicStates = this.blockedStates.some(state => {
            const elements = document.querySelectorAll(`.${state}, [class*="${state}"]`);
            return Array.from(elements).some(el => this.isVisible(el));
        });
        
        // Si hay estados problemáticos, ocultar anuncios
        if (hasProblematicStates) {
            this.hideAds();
        } else {
            // Verificar si hay contenido suficiente
            if (this.hasEnoughContent()) {
                this.showAds();
            } else {
                this.hideAds();
            }
        }
    }
    
    hideAds() {
        this.adContainerSelectors.forEach(selector => {
            const ads = document.querySelectorAll(selector);
            ads.forEach(ad => {
                ad.style.display = 'none';
                ad.setAttribute('data-blocked-by-loader', 'true');
            });
        });
    }
    
    showAds() {
        // Solo mostrar si hay consentimiento
        if (localStorage.getItem("adConsent") === "true") {
            this.adContainerSelectors.forEach(selector => {
                const ads = document.querySelectorAll(selector);
                ads.forEach(ad => {
                    if (ad.getAttribute('data-blocked-by-loader') === 'true') {
                        ad.style.display = '';
                        ad.removeAttribute('data-blocked-by-loader');
                    }
                });
            });
        }
    }
    
    hasEnoughContent() {
        const mainContent = document.querySelector('main, article, .content, .page-content');
        if (!mainContent) return false;
        
        const textContent = mainContent.textContent || '';
        const cleanText = textContent.replace(/\s+/g, ' ').trim();
        
        // Verificar que hay suficiente contenido
        return cleanText.length > 200 && 
               mainContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6').length > 2;
    }
    
    isVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetHeight > 0;
    }
    
    observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    this.checkAndBlockAds();
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AdSenseLoadingBlocker();
    });
} else {
    new AdSenseLoadingBlocker();
}

// Exportar para uso global
window.AdSenseLoadingBlocker = AdSenseLoadingBlocker; 