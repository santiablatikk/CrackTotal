/**
 * ========================================
 * CRACK TOTAL - PERFORMANCE OPTIMIZER
 * ========================================
 * Sistema avanzado de optimización de rendimiento
 */

class CrackTotalPerformanceOptimizer {
    constructor() {
        this.config = {
            enableOptimizations: true,
            preloadAmount: 3, // Cantidad de recursos para precargar
            lazyLoadOffset: 100, // px desde viewport para cargar imágenes
            cacheVersion: '2.1.0'
        };

        this.metrics = {
            loadTime: 0,
            domContentLoaded: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0
        };

        this.optimizations = [];
        this.init();
    }

    init() {
        this.measureInitialMetrics();
        this.optimizeImages();
        this.optimizeFonts();
        this.optimizeCSS();
        this.optimizeJavaScript();
        this.setupIntersectionObserver();
        this.optimizeNetworkRequests();
        this.setupPerformanceMonitoring();
        
        console.log('⚡ CrackTotalPerformanceOptimizer initialized');
    }

    /**
     * Medir métricas iniciales de rendimiento
     */
    measureInitialMetrics() {
        if (!window.performance) return;

        // Timing básico
        const timing = performance.timing;
        this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
        this.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;

        // Core Web Vitals
        this.measureCoreWebVitals();
    }

    measureCoreWebVitals() {
        // First Contentful Paint
        if ('PerformanceObserver' in window) {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.firstContentfulPaint = entry.startTime;
                        this.logOptimization('metrics', `FCP: ${Math.round(entry.startTime)}ms`);
                    }
                }
            }).observe({ entryTypes: ['paint'] });

            // Largest Contentful Paint
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.largestContentfulPaint = lastEntry.startTime;
                this.logOptimization('metrics', `LCP: ${Math.round(lastEntry.startTime)}ms`);
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // Cumulative Layout Shift
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        this.metrics.cumulativeLayoutShift += entry.value;
                    }
                }
                this.logOptimization('metrics', `CLS: ${this.metrics.cumulativeLayoutShift.toFixed(4)}`);
            }).observe({ entryTypes: ['layout-shift'] });
        }
    }

    /**
     * Optimizar imágenes automáticamente
     */
    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach((img, index) => {
            // Lazy loading para imágenes no críticas
            if (index > 2 && !img.loading) {
                img.loading = 'lazy';
                this.logOptimization('images', 'Applied lazy loading');
            }

            // Dimensiones explícitas para prevenir CLS
            if (!img.width && !img.height && !img.style.width && !img.style.height) {
                img.style.aspectRatio = '16/9'; // Ratio por defecto
                this.logOptimization('images', 'Added aspect ratio to prevent CLS');
            }

            // Optimización de formato
            if (img.src && !img.src.includes('data:') && !img.src.includes('.webp')) {
                this.suggestWebPFormat(img);
            }
        });

        // Precargar imágenes críticas
        this.preloadCriticalImages();
    }

    preloadCriticalImages() {
        const criticalImages = [
            '/images/portada.jpg',
            '/images/logo.png'
        ];

        criticalImages.forEach(src => {
            if (!document.querySelector(`link[href="${src}"]`)) {
                const preload = document.createElement('link');
                preload.rel = 'preload';
                preload.href = src;
                preload.as = 'image';
                document.head.appendChild(preload);
                this.logOptimization('images', `Preloaded critical image: ${src}`);
            }
        });
    }

    suggestWebPFormat(img) {
        // Verificar soporte para WebP
        if (this.supportsWebP()) {
            console.log(`💡 Considerar formato WebP para: ${img.src}`);
        }
    }

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    /**
     * Optimizar fuentes
     */
    optimizeFonts() {
        // Preconnect a Google Fonts
        if (!document.querySelector('link[href*="fonts.googleapis.com"][rel="preconnect"]')) {
            const preconnect1 = document.createElement('link');
            preconnect1.rel = 'preconnect';
            preconnect1.href = 'https://fonts.googleapis.com';
            document.head.appendChild(preconnect1);

            const preconnect2 = document.createElement('link');
            preconnect2.rel = 'preconnect';
            preconnect2.href = 'https://fonts.gstatic.com';
            preconnect2.crossOrigin = '';
            document.head.appendChild(preconnect2);

            this.logOptimization('fonts', 'Added preconnect for Google Fonts');
        }

        // Optimizar display de fuentes
        const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        fontLinks.forEach(link => {
            if (!link.href.includes('display=swap')) {
                const url = new URL(link.href);
                url.searchParams.set('display', 'swap');
                link.href = url.toString();
                this.logOptimization('fonts', 'Added font-display: swap');
            }
        });
    }

    /**
     * Optimizar CSS
     */
    optimizeCSS() {
        // Precargar CSS crítico
        const criticalCSS = [
            '/css/base.css',
            '/css/layout.css'
        ];

        criticalCSS.forEach(href => {
            if (!document.querySelector(`link[href*="${href}"][rel="preload"]`)) {
                const preload = document.createElement('link');
                preload.rel = 'preload';
                preload.href = href + '?v=' + this.config.cacheVersion;
                preload.as = 'style';
                preload.onload = function() {
                    this.onload = null;
                    this.rel = 'stylesheet';
                };
                document.head.appendChild(preload);
                this.logOptimization('css', `Preloaded critical CSS: ${href}`);
            }
        });

        // Identificar CSS no utilizado
        this.identifyUnusedCSS();
    }

    identifyUnusedCSS() {
        // Análisis básico de CSS no utilizado
        setTimeout(() => {
            const sheets = document.styleSheets;
            let unusedRules = 0;

            for (let sheet of sheets) {
                try {
                    const rules = sheet.cssRules || sheet.rules;
                    for (let rule of rules) {
                        if (rule.type === 1 && rule.selectorText) { // CSSStyleRule
                            try {
                                if (!document.querySelector(rule.selectorText)) {
                                    unusedRules++;
                                }
                            } catch (e) {
                                // Selector inválido, skip
                            }
                        }
                    }
                } catch (e) {
                    // CORS error, skip
                }
            }

            if (unusedRules > 0) {
                this.logOptimization('css', `Found ${unusedRules} potentially unused CSS rules`);
            }
        }, 2000);
    }

    /**
     * Optimizar JavaScript
     */
    optimizeJavaScript() {
        // Precargar scripts críticos
        const criticalScripts = [
            '/js/main.js',
            '/js/state-manager.js'
        ];

        criticalScripts.forEach(src => {
            if (!document.querySelector(`link[href*="${src}"][rel="preload"]`)) {
                const preload = document.createElement('link');
                preload.rel = 'preload';
                preload.href = src + '?v=' + this.config.cacheVersion;
                preload.as = 'script';
                document.head.appendChild(preload);
                this.logOptimization('js', `Preloaded critical script: ${src}`);
            }
        });

        // Defer scripts no críticos
        const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])');
        scripts.forEach(script => {
            if (!script.src.includes('gtag') && !script.src.includes('analytics')) {
                script.defer = true;
                this.logOptimization('js', 'Applied defer to non-critical script');
            }
        });
    }

    /**
     * Configurar Intersection Observer para lazy loading avanzado
     */
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        
                        // Cargar imágenes lazy
                        if (element.dataset.src) {
                            element.src = element.dataset.src;
                            element.removeAttribute('data-src');
                            observer.unobserve(element);
                            this.logOptimization('lazy', 'Loaded image on scroll');
                        }

                        // Cargar contenido dinámico
                        if (element.dataset.loadContent) {
                            this.loadDynamicContent(element);
                            observer.unobserve(element);
                        }
                    }
                });
            }, {
                rootMargin: `${this.config.lazyLoadOffset}px`
            });

            // Observar elementos con lazy loading
            document.querySelectorAll('[data-src], [data-load-content]').forEach(el => {
                observer.observe(el);
            });
        }
    }

    /**
     * Optimizar peticiones de red
     */
    optimizeNetworkRequests() {
        // DNS prefetch para dominios externos
        const externalDomains = [
            '//www.googletagmanager.com',
            '//pagead2.googlesyndication.com',
            '//cdnjs.cloudflare.com'
        ];

        externalDomains.forEach(domain => {
            if (!document.querySelector(`link[href="${domain}"][rel="dns-prefetch"]`)) {
                const dnsPrefetch = document.createElement('link');
                dnsPrefetch.rel = 'dns-prefetch';
                dnsPrefetch.href = domain;
                document.head.appendChild(dnsPrefetch);
                this.logOptimization('network', `Added DNS prefetch: ${domain}`);
            }
        });

        // Implementar service worker para caching si no existe
        this.implementServiceWorkerOptimizations();
    }

    implementServiceWorkerOptimizations() {
        if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
            // Ya existe registro en index.html, solo optimizar
            this.logOptimization('sw', 'Service Worker optimization ready');
        }
    }

    /**
     * Configurar monitoreo de rendimiento continuo
     */
    setupPerformanceMonitoring() {
        // Monitorear recursos lentos
        if ('PerformanceObserver' in window) {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 1000) { // Recursos que toman más de 1s
                        console.warn(`Slow resource: ${entry.name} (${Math.round(entry.duration)}ms)`);
                        this.logOptimization('monitor', `Slow resource detected: ${entry.name}`);
                    }
                }
            }).observe({ entryTypes: ['resource'] });
        }

        // Monitorear long tasks
        if ('PerformanceObserver' in window) {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    console.warn(`Long task detected: ${Math.round(entry.duration)}ms`);
                    this.logOptimization('monitor', `Long task: ${Math.round(entry.duration)}ms`);
                }
            }).observe({ entryTypes: ['longtask'] });
        }

        // Reporte periódico
        setInterval(() => {
            this.generatePerformanceReport();
        }, 60000); // Cada minuto
    }

    /**
     * Cargar contenido dinámico
     */
    loadDynamicContent(element) {
        const contentType = element.dataset.loadContent;
        
        switch (contentType) {
            case 'ads':
                this.loadAdvertisement(element);
                break;
            case 'comments':
                this.loadComments(element);
                break;
            case 'related':
                this.loadRelatedContent(element);
                break;
        }
    }

    loadAdvertisement(element) {
        // Placeholder para carga de anuncios
        this.logOptimization('dynamic', 'Advertisement loaded on demand');
    }

    loadComments(element) {
        // Placeholder para carga de comentarios
        this.logOptimization('dynamic', 'Comments loaded on demand');
    }

    loadRelatedContent(element) {
        // Placeholder para contenido relacionado
        this.logOptimization('dynamic', 'Related content loaded on demand');
    }

    /**
     * Generar reporte de rendimiento
     */
    generatePerformanceReport() {
        const report = {
            timestamp: new Date(),
            url: window.location.href,
            metrics: this.metrics,
            optimizations: this.optimizations.length,
            suggestions: this.generateSuggestions()
        };

        console.group('⚡ PERFORMANCE REPORT - CRACK TOTAL');
        console.log(`📊 URL: ${report.url}`);
        console.log(`⏱️ Load Time: ${this.metrics.loadTime}ms`);
        console.log(`🎨 FCP: ${Math.round(this.metrics.firstContentfulPaint)}ms`);
        console.log(`📏 LCP: ${Math.round(this.metrics.largestContentfulPaint)}ms`);
        console.log(`📐 CLS: ${this.metrics.cumulativeLayoutShift.toFixed(4)}`);
        console.log(`🔧 Optimizations Applied: ${this.optimizations.length}`);
        
        if (report.suggestions.length > 0) {
            console.group('💡 Performance Suggestions');
            report.suggestions.forEach(suggestion => {
                console.log(`💡 ${suggestion}`);
            });
            console.groupEnd();
        }
        
        console.groupEnd();

        // Guardar en localStorage
        localStorage.setItem('crackTotalPerformanceReport', JSON.stringify(report));

        return report;
    }

    generateSuggestions() {
        const suggestions = [];

        if (this.metrics.firstContentfulPaint > 1800) {
            suggestions.push('Consider optimizing critical CSS and JavaScript');
        }

        if (this.metrics.largestContentfulPaint > 2500) {
            suggestions.push('Optimize largest contentful paint by preloading key resources');
        }

        if (this.metrics.cumulativeLayoutShift > 0.1) {
            suggestions.push('Add explicit dimensions to images and ads to reduce layout shift');
        }

        if (this.metrics.loadTime > 3000) {
            suggestions.push('Consider code splitting and reducing bundle size');
        }

        return suggestions;
    }

    /**
     * Utilities
     */
    logOptimization(category, message) {
        this.optimizations.push({
            category,
            message,
            timestamp: new Date()
        });

        console.log(`⚡ [${category}] ${message}`);

        // Enviar a analytics si está disponible
        if (window.gtag) {
            gtag('event', 'performance_optimization', {
                event_category: 'Performance',
                event_label: category,
                custom_parameter_1: message
            });
        }
    }

    // API pública
    getMetrics() {
        return this.metrics;
    }

    getOptimizations() {
        return this.optimizations;
    }

    runPerformanceAudit() {
        return this.generatePerformanceReport();
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.CrackTotalPerformanceOptimizer = new CrackTotalPerformanceOptimizer();
    
    // Exponer funciones útiles
    window.getPerformanceMetrics = () => window.CrackTotalPerformanceOptimizer.getMetrics();
    window.runPerformanceAudit = () => window.CrackTotalPerformanceOptimizer.runPerformanceAudit();
}

export default CrackTotalPerformanceOptimizer; 