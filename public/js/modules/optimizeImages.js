/**
 * optimizeImages.js - Módulo para optimización de imágenes
 * 
 * Este módulo se encarga de:
 * 1. Optimizar imágenes a través del endpoint de API
 * 2. Implementar carga diferida (lazy loading)
 * 3. Adaptar resoluciones según dispositivo
 */

const ImageOptimizer = (function() {
    'use strict';
    
    // Configuración
    const config = {
        apiEndpoint: '/api/optimize-image',
        defaultQuality: 80,
        mobileQuality: 60,
        mobileMaxWidth: 768,
        defaultSelectors: 'img:not(.no-optimize)',
        placeholderColor: '#f0f0f0',
        batchSize: {
            mobile: 3,
            desktop: 5
        },
        batchDelay: {
            mobile: 200,
            desktop: 100
        }
    };
    
    // Detectar entorno
    const env = {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                 window.innerWidth <= config.mobileMaxWidth,
        hasIntersectionObserver: typeof IntersectionObserver !== 'undefined',
        hasIdleCallback: typeof window.requestIdleCallback !== 'undefined'
    };
    
    // Cache para URL de imágenes optimizadas
    const urlCache = new Map();
    
    /**
     * Genera la URL optimizada para una imagen
     * @param {string} src - URL original de la imagen
     * @param {number} width - Ancho deseado (opcional)
     * @param {number} quality - Calidad deseada (1-100)
     * @returns {string} - URL optimizada
     */
    function getOptimizedUrl(src, width, quality) {
        if (!src) return src;
        
        // Ignorar URLs externas y data URIs
        if (src.startsWith('http') || src.startsWith('data:')) {
            return src;
        }
        
        // Ajustar calidad según dispositivo
        const adjustedQuality = env.isMobile 
            ? Math.min(quality || config.defaultQuality, config.mobileQuality)
            : (quality || config.defaultQuality);
        
        // Crear clave de cache
        const cacheKey = `${src}-${width || 'auto'}-${adjustedQuality}`;
        
        // Verificar si ya existe en cache
        if (urlCache.has(cacheKey)) {
            return urlCache.get(cacheKey);
        }
        
        // Construir URL con parámetros
        const baseUrl = window.location.origin;
        const params = new URLSearchParams();
        params.append('src', src);
        if (width) params.append('width', width);
        params.append('quality', adjustedQuality);
        
        const finalUrl = `${baseUrl}${config.apiEndpoint}?${params.toString()}`;
        
        // Guardar en cache
        urlCache.set(cacheKey, finalUrl);
        
        return finalUrl;
    }
    
    /**
     * Optimiza todas las imágenes que coincidan con el selector
     * @param {string} selector - Selector CSS para imágenes
     * @param {number} quality - Calidad deseada (1-100)
     */
    function optimizeAllImages(selector, quality) {
        const actualSelector = selector || config.defaultSelectors;
        
        // Programar optimización cuando el navegador esté inactivo
        if (env.hasIdleCallback) {
            requestIdleCallback(() => {
                processBatchedImages(actualSelector, quality);
            });
        } else {
            // Fallback
            setTimeout(() => {
                processBatchedImages(actualSelector, quality);
            }, 100);
        }
    }
    
    /**
     * Procesa imágenes en lotes para evitar bloqueo del UI
     * @param {string} selector - Selector CSS
     * @param {number} quality - Calidad deseada
     */
    function processBatchedImages(selector, quality) {
        const images = document.querySelectorAll(selector);
        
        if (!images.length) return;
        
        // Determinar tamaño del lote según dispositivo
        const batchSize = env.isMobile ? config.batchSize.mobile : config.batchSize.desktop;
        const batchDelay = env.isMobile ? config.batchDelay.mobile : config.batchDelay.desktop;
        
        let index = 0;
        
        const processNextBatch = () => {
            const endIndex = Math.min(index + batchSize, images.length);
            
            for (let i = index; i < endIndex; i++) {
                optimizeImage(images[i], quality);
            }
            
            index = endIndex;
            
            // Procesar el siguiente lote si hay más imágenes
            if (index < images.length) {
                setTimeout(processNextBatch, batchDelay);
            }
        };
        
        // Iniciar procesamiento
        processNextBatch();
    }
    
    /**
     * Optimiza una imagen individual
     * @param {HTMLImageElement} img - Elemento de imagen
     * @param {number} quality - Calidad deseada
     */
    function optimizeImage(img, quality) {
        // Verificar si la imagen ya está optimizada o debe excluirse
        if (!img || 
            !img.getAttribute('src') || 
            img.classList.contains('optimized') ||
            img.classList.contains('no-optimize')) {
            return;
        }
        
        const originalSrc = img.getAttribute('src');
        
        // Ignorar imágenes ya optimizadas, sin src, data URIs o externas
        if (!originalSrc || 
            originalSrc.startsWith('data:') || 
            originalSrc.startsWith('http') ||
            originalSrc.includes('/api/optimize-image')) {
            return;
        }
        
        // Determinar ancho apropiado
        let targetWidth = img.getAttribute('data-width');
        
        if (!targetWidth) {
            // Si no tiene data-width, usar el ancho actual o el ancho natural
            targetWidth = img.width || img.naturalWidth || (env.isMobile ? 320 : null);
        }
        
        // Generar URL optimizada
        const optimizedSrc = getOptimizedUrl(originalSrc, targetWidth, quality);
        
        // Implementar estrategia de carga según capacidades del navegador
        if (env.hasIntersectionObserver) {
            // Usar lazy loading con IntersectionObserver
            lazyLoadImage(img, optimizedSrc);
        } else {
            // Fallback: precargar y luego reemplazar
            preloadAndReplaceImage(img, optimizedSrc);
        }
    }
    
    /**
     * Implementa lazy loading para una imagen
     * @param {HTMLImageElement} img - Elemento de imagen
     * @param {string} optimizedSrc - URL optimizada
     */
    function lazyLoadImage(img, optimizedSrc) {
        // Crear placeholder mientras se carga
        if (!img.classList.contains('loading')) {
            setPlaceholder(img);
        }
        
        // Crear observer para esta imagen
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const targetImg = entry.target;
                    
                    // Cargar imagen cuando sea visible
                    const newImg = new Image();
                    newImg.onload = () => {
                        targetImg.src = optimizedSrc;
                        targetImg.classList.add('optimized');
                        targetImg.classList.remove('loading');
                        // Transición suave
                        targetImg.style.opacity = '1';
                    };
                    newImg.src = optimizedSrc;
                    
                    // Dejar de observar esta imagen
                    observer.unobserve(targetImg);
                }
            });
        }, {
            rootMargin: '50px' // Cargar cuando esté a 50px de ser visible
        });
        
        // Comenzar a observar
        observer.observe(img);
    }
    
    /**
     * Precargar y reemplazar imagen (fallback)
     * @param {HTMLImageElement} img - Elemento de imagen
     * @param {string} optimizedSrc - URL optimizada
     */
    function preloadAndReplaceImage(img, optimizedSrc) {
        // Crear placeholder mientras se carga
        if (!img.classList.contains('loading')) {
            setPlaceholder(img);
        }
        
        // Precargar la imagen
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        preloadLink.href = optimizedSrc;
        document.head.appendChild(preloadLink);
        
        // Reemplazar cuando se haya cargado
        const newImg = new Image();
        newImg.onload = () => {
            img.src = optimizedSrc;
            img.classList.add('optimized');
            img.classList.remove('loading');
            // Transición suave
            img.style.opacity = '1';
        };
        newImg.src = optimizedSrc;
    }
    
    /**
     * Establece un placeholder mientras se carga la imagen
     * @param {HTMLImageElement} img - Elemento de imagen
     */
    function setPlaceholder(img) {
        // Guardar src original si aún no se ha hecho
        if (!img.getAttribute('data-original-src')) {
            img.setAttribute('data-original-src', img.src);
        }
        
        // Aplicar placeholder y estilo transitorio
        img.style.backgroundColor = config.placeholderColor;
        img.style.transition = 'opacity 0.3s ease-in-out';
        img.style.opacity = '0.6';
        img.classList.add('loading');
    }
    
    /**
     * Inicializa el observador para lazy loading global
     * @param {string} selector - Selector para imágenes
     */
    function initializeLazyLoading(selector = 'img[data-src]') {
        if (!env.hasIntersectionObserver) {
            // Fallback para navegadores sin soporte
            const lazyImages = document.querySelectorAll(selector);
            lazyImages.forEach(img => {
                const dataSrc = img.getAttribute('data-src');
                if (dataSrc) {
                    preloadAndReplaceImage(img, dataSrc);
                }
            });
            return;
        }
        
        // Crear observador para todas las imágenes con data-src
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const dataSrc = img.getAttribute('data-src');
                    
                    if (dataSrc) {
                        // Usar el mismo mecanismo de optimización
                        const width = img.getAttribute('data-width') || img.width || null;
                        const quality = img.getAttribute('data-quality') || config.defaultQuality;
                        const optimizedSrc = getOptimizedUrl(dataSrc, width, quality);
                        
                        // Cargar imagen
                        img.src = optimizedSrc;
                        img.removeAttribute('data-src');
                        img.classList.add('optimized');
                    }
                    
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px' // Cargar cuando esté a 100px de ser visible
        });
        
        // Observar todas las imágenes con data-src
        document.querySelectorAll(selector).forEach(img => {
            if (img.getAttribute('data-src')) {
                setPlaceholder(img);
                observer.observe(img);
            }
        });
    }
    
    // API pública
    return {
        optimize: optimizeAllImages,
        getOptimizedUrl: getOptimizedUrl,
        lazyLoad: initializeLazyLoading,
        optimizeImage: optimizeImage,
        config: config,
        env: env
    };
})();

// Exportar el módulo globalmente
window.ImageOptimizer = ImageOptimizer;

// Auto-inicializar lazy loading cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (typeof ImageOptimizer !== 'undefined') {
        ImageOptimizer.lazyLoad();
    }
}); 