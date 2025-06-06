/**
 * Google Indexing API Integration
 * Este script facilita la integración con la API de Indexación de Google
 * para acelerar la indexación de nuevas páginas.
 */

// Configuración - Reemplazar con tus propios valores
const SITE_DOMAIN = 'cracktotal.com';
const LAST_SITEMAP_UPDATE = new Date('2025-06-07T12:00:00+00:00');

// Función para comprobar el estado de indexación
async function checkIndexingStatus() {
    console.log('[Google Indexing] Verificando estado de indexación...');
    
    // Esta función simula la verificación de indexación
    // En una implementación real, necesitarías usar la API de Google Search Console
    const pageUrl = window.location.href;
    
    console.log(`[Google Indexing] URL actual: ${pageUrl}`);
    
    // Mostrar información en consola para depuración
    console.log(`[Google Indexing] Dominio: ${SITE_DOMAIN}`);
    console.log(`[Google Indexing] Última actualización del sitemap: ${LAST_SITEMAP_UPDATE.toISOString()}`);
    
    // Registrar visita para analytics
    if (typeof gtag === 'function') {
        gtag('event', 'page_indexing_check', {
            'event_category': 'indexing',
            'event_label': pageUrl,
            'value': 1
        });
    }
    
    return {
        url: pageUrl,
        isIndexed: true, // Simulado
        lastChecked: new Date().toISOString()
    };
}

// Función para notificar a Google sobre una nueva URL
function notifyGoogleAboutNewUrl(url) {
    console.log(`[Google Indexing] Notificando a Google sobre nueva URL: ${url}`);
    
    // En una implementación real, esto enviaría una solicitud a la API de Indexación de Google
    // Requiere autenticación OAuth2 y permisos adecuados
    
    // Registro de eventos para analytics
    if (typeof gtag === 'function') {
        gtag('event', 'notify_new_url', {
            'event_category': 'indexing',
            'event_label': url,
            'value': 1
        });
    }
    
    return {
        success: true,
        url: url,
        timestamp: new Date().toISOString()
    };
}

// Función para generar un JSON con información detallada de la página para Google
function generateStructuredPageData() {
    // Obtener meta datos de la página
    const title = document.title || '';
    const description = document.querySelector('meta[name="description"]')?.content || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
    const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
    
    // Detectar el tipo de contenido principal
    let contentType = 'webpage';
    if (window.location.pathname.includes('blog')) {
        contentType = 'article';
    } else if (window.location.pathname.includes('game') || 
               window.location.pathname.includes('pasalache') ||
               window.location.pathname.includes('quiensabemas') ||
               window.location.pathname.includes('mentiroso') ||
               window.location.pathname.includes('crack-rapido')) {
        contentType = 'game';
    }
    
    // Construir objeto estructurado
    const structuredData = {
        url: canonical,
        title: title,
        description: description,
        content_type: contentType,
        image: ogImage,
        last_updated: new Date().toISOString(),
        language: document.documentElement.lang || 'es',
        has_video: document.querySelector('video') !== null,
        text_content_length: document.body.innerText.length,
        importance: contentType === 'game' ? 'high' : 'medium'
    };
    
    console.log('[Google Indexing] Datos estructurados generados:', structuredData);
    return structuredData;
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Google Indexing] Script inicializado');
    
    // Solo ejecutar en producción
    if (window.location.hostname === SITE_DOMAIN) {
        setTimeout(() => {
            // Generar datos estructurados para la API
            const pageData = generateStructuredPageData();
            
            // Para páginas nuevas o actualizadas recientemente
            const isNewContent = document.lastModified && 
                                 new Date(document.lastModified) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            if (isNewContent && pageData.importance === 'high') {
                notifyGoogleAboutNewUrl(window.location.href);
            }
        }, 2000);
    }
}); 