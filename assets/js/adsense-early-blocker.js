/**
 * AdSense Early Blocker
 * 
 * Este script debe cargarse ANTES que el script de AdSense para prevenir
 * la carga de anuncios en páginas que no cumplen con las políticas.
 */

(function() {
    'use strict';
    
    // Lista de páginas donde NO se deben mostrar anuncios
    const blockedPages = [
        '/google-site-verification.html',
        '/google-search-console-site-properties.html',
        '/adsense-verification.html',
        '/test-firebase.html',
        '/under-construction.html',
        '/coming-soon.html',
        '/404.html',
        '/500.html'
    ];
    
    // Verificar si la página actual está en la lista bloqueada
    const currentPath = window.location.pathname;
    const shouldBlockAds = blockedPages.some(page => currentPath.endsWith(page));
    
    if (shouldBlockAds) {
        console.log('[AdSense Early Blocker] Bloqueando anuncios en página:', currentPath);
        
        // Prevenir la carga de AdSense completamente
        // No forzar pausa global ni sobrescribir push; solo ocultar contenedores cuando corresponda
        window.__adsense_blocked = true;
        
        // Agregar estilo CSS para ocultar cualquier contenedor de anuncios
        const style = document.createElement('style');
        style.textContent = `
            .adsbygoogle,
            ins.adsbygoogle,
            [id^="google_ads_"],
            [id^="div-gpt-ad"],
            .google-auto-placed,
            .adslot {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
            }
        `;
        document.head.appendChild(style);
        
        // Marcar la página como no apta para anuncios
        window.__adsense_blocked = true;
    }
    
    // También verificar páginas con poco contenido cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkPageContent);
    } else {
        checkPageContent();
    }
    
    function checkPageContent() {
        // Si ya está bloqueado, no hacer nada más
        if (window.__adsense_blocked) return;
        
        // Verificación rápida de contenido mínimo
        const textContent = document.body.innerText || document.body.textContent || '';
        const wordCount = textContent.trim().split(/\s+/).length;
        
        // Si la página tiene menos de 50 palabras, bloquear anuncios
        if (wordCount < 50) {
            console.log('[AdSense Early Blocker] Página con contenido insuficiente, bloqueando anuncios');
            window.__adsense_blocked = true;
            
            // Ocultar cualquier contenedor de anuncios existente
            const adContainers = document.querySelectorAll('.adsbygoogle');
            adContainers.forEach(container => {
                container.style.display = 'none';
            });
        }
    }
})(); 