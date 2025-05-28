/**
 * ========================================
 * CRACK TOTAL - SEO MONITORING SYSTEM
 * ========================================
 * Sistema de monitoreo y verificación SEO
 */

class CrackTotalSEOMonitor {
    constructor() {
        this.config = {
            baseUrl: 'https://cracktotal.com',
            checkInterval: 300000, // 5 minutos
            reportInterval: 3600000, // 1 hora
        };

        this.checks = {
            canonical: false,
            metaTags: false,
            openGraph: false,
            structuredData: false,
            images: false,
            performance: false,
            accessibility: false,
            security: false
        };

        this.issues = [];
        this.recommendations = [];
        this.lastCheck = null;

        this.init();
    }

    init() {
        this.runCompleteCheck();
        this.setupPeriodicChecks();
        this.setupPerformanceMonitoring();
        
        console.log('🔍 CrackTotalSEOMonitor initialized');
    }

    /**
     * Ejecutar verificación completa de SEO
     */
    async runCompleteCheck() {
        console.log('🔍 Iniciando verificación completa de SEO...');
        
        this.issues = [];
        this.recommendations = [];
        
        await Promise.all([
            this.checkCanonicalTags(),
            this.checkMetaTags(),
            this.checkOpenGraph(),
            this.checkStructuredData(),
            this.checkImages(),
            this.checkPerformance(),
            this.checkAccessibility(),
            this.checkSecurity(),
            this.checkInternalLinks(),
            this.checkMobileOptimization(),
            this.checkPageSpeed(),
            this.checkContentQuality()
        ]);

        this.lastCheck = new Date();
        this.generateReport();
        this.sendToAnalytics();
    }

    /**
     * Verificar tags canónicas
     */
    async checkCanonicalTags() {
        const canonical = document.querySelector('link[rel="canonical"]');
        
        if (!canonical) {
            this.addIssue('canonical', 'critical', 'No se encontró tag canónico');
            this.checks.canonical = false;
            return;
        }

        const canonicalUrl = canonical.href;
        const currentUrl = window.location.href.split('?')[0].split('#')[0];

        // Verificar que la URL canónica sea correcta
        if (!canonicalUrl.startsWith('https://')) {
            this.addIssue('canonical', 'warning', 'URL canónica no usa HTTPS');
        }

        if (canonicalUrl.includes('index.html')) {
            this.addIssue('canonical', 'warning', 'URL canónica incluye index.html');
        }

        // Verificar duplicados
        const allCanonicals = document.querySelectorAll('link[rel="canonical"]');
        if (allCanonicals.length > 1) {
            this.addIssue('canonical', 'critical', 'Múltiples tags canónicos encontrados');
        }

        this.checks.canonical = this.issues.filter(i => i.category === 'canonical' && i.severity === 'critical').length === 0;
    }

    /**
     * Verificar meta tags
     */
    async checkMetaTags() {
        const requiredMetas = [
            { name: 'description', minLength: 120, maxLength: 160 },
            { name: 'viewport', required: true },
            { property: 'og:title', required: true },
            { property: 'og:description', required: true },
            { property: 'og:image', required: true },
            { name: 'twitter:card', required: true }
        ];

        let allGood = true;

        // Verificar título
        const title = document.title;
        if (!title) {
            this.addIssue('meta', 'critical', 'Falta el título de la página');
            allGood = false;
        } else if (title.length < 30 || title.length > 60) {
            this.addIssue('meta', 'warning', `Título demasiado ${title.length < 30 ? 'corto' : 'largo'} (${title.length} caracteres)`);
        }

        // Verificar meta tags requeridos
        requiredMetas.forEach(meta => {
            const element = meta.name 
                ? document.querySelector(`meta[name="${meta.name}"]`)
                : document.querySelector(`meta[property="${meta.property}"]`);

            if (!element) {
                if (meta.required) {
                    this.addIssue('meta', 'critical', `Meta tag faltante: ${meta.name || meta.property}`);
                    allGood = false;
                }
            } else if (meta.minLength || meta.maxLength) {
                const content = element.content;
                if (meta.minLength && content.length < meta.minLength) {
                    this.addIssue('meta', 'warning', `${meta.name} demasiado corto (${content.length} caracteres)`);
                }
                if (meta.maxLength && content.length > meta.maxLength) {
                    this.addIssue('meta', 'warning', `${meta.name} demasiado largo (${content.length} caracteres)`);
                }
            }
        });

        this.checks.metaTags = allGood;
    }

    /**
     * Verificar Open Graph
     */
    async checkOpenGraph() {
        const requiredOG = ['og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'og:site_name'];
        let allGood = true;

        requiredOG.forEach(property => {
            const element = document.querySelector(`meta[property="${property}"]`);
            if (!element) {
                this.addIssue('og', 'warning', `Open Graph faltante: ${property}`);
                allGood = false;
            } else if (!element.content.trim()) {
                this.addIssue('og', 'warning', `Open Graph vacío: ${property}`);
                allGood = false;
            }
        });

        // Verificar imagen OG
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && ogImage.content) {
            this.verifyImageUrl(ogImage.content, 'og:image');
        }

        this.checks.openGraph = allGood;
    }

    /**
     * Verificar datos estructurados
     */
    async checkStructuredData() {
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        
        if (jsonLdScripts.length === 0) {
            this.addIssue('structured-data', 'warning', 'No se encontraron datos estructurados');
            this.checks.structuredData = false;
            return;
        }

        let validSchemas = 0;
        jsonLdScripts.forEach((script, index) => {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@context'] && data['@type']) {
                    validSchemas++;
                } else {
                    this.addIssue('structured-data', 'warning', `Schema inválido en script ${index + 1}`);
                }
            } catch (e) {
                this.addIssue('structured-data', 'error', `Error parsing JSON-LD en script ${index + 1}: ${e.message}`);
            }
        });

        this.checks.structuredData = validSchemas > 0;
    }

    /**
     * Verificar optimización de imágenes
     */
    async checkImages() {
        const images = document.querySelectorAll('img');
        let issues = 0;

        images.forEach((img, index) => {
            // Verificar alt text
            if (!img.alt) {
                this.addIssue('images', 'warning', `Imagen ${index + 1} sin texto alt`);
                issues++;
            }

            // Verificar lazy loading
            if (!img.loading || img.loading !== 'lazy') {
                if (index > 2) { // Solo después de las primeras 3 imágenes
                    this.addRecommendation('images', `Considerar lazy loading para imagen ${index + 1}`);
                }
            }

            // Verificar formato
            if (img.src && !img.src.includes('.webp') && !img.src.includes('data:')) {
                this.addRecommendation('images', `Considerar formato WebP para imagen ${index + 1}`);
            }
        });

        this.checks.images = issues === 0;
    }

    /**
     * Verificar rendimiento
     */
    async checkPerformance() {
        if (!window.performance || !window.performance.timing) {
            this.addIssue('performance', 'warning', 'API de Performance no disponible');
            this.checks.performance = false;
            return;
        }

        const timing = window.performance.timing;
        const navigationStart = timing.navigationStart;
        
        // Core Web Vitals simulation
        const domContentLoaded = timing.domContentLoadedEventEnd - navigationStart;
        const loadComplete = timing.loadEventEnd - navigationStart;

        if (domContentLoaded > 1800) { // 1.8s FCP target
            this.addIssue('performance', 'warning', `DOMContentLoaded lento: ${Math.round(domContentLoaded)}ms`);
        }

        if (loadComplete > 2500) { // 2.5s LCP target
            this.addIssue('performance', 'warning', `Load completo lento: ${Math.round(loadComplete)}ms`);
        }

        // Verificar recursos
        if (window.performance.getEntriesByType) {
            const resources = window.performance.getEntriesByType('resource');
            const slowResources = resources.filter(r => r.duration > 1000);
            
            if (slowResources.length > 0) {
                this.addRecommendation('performance', `${slowResources.length} recursos lentos detectados`);
            }
        }

        this.checks.performance = domContentLoaded <= 1800 && loadComplete <= 2500;
    }

    /**
     * Verificar accesibilidad básica
     */
    async checkAccessibility() {
        let issues = 0;

        // Verificar elementos sin etiquetas
        const inputs = document.querySelectorAll('input:not([aria-label]):not([id])');
        if (inputs.length > 0) {
            this.addIssue('accessibility', 'warning', `${inputs.length} inputs sin etiquetas`);
            issues++;
        }

        // Verificar contraste básico (simplificado)
        const buttons = document.querySelectorAll('button, .btn');
        buttons.forEach((btn, index) => {
            const style = window.getComputedStyle(btn);
            if (style.backgroundColor === 'transparent' && style.color === style.backgroundColor) {
                this.addIssue('accessibility', 'warning', `Posible problema de contraste en botón ${index + 1}`);
                issues++;
            }
        });

        // Verificar skip links
        const skipLink = document.querySelector('.skip-link, [href="#main-content"]');
        if (!skipLink) {
            this.addRecommendation('accessibility', 'Agregar skip link para navegación por teclado');
        }

        this.checks.accessibility = issues === 0;
    }

    /**
     * Verificar seguridad básica
     */
    async checkSecurity() {
        let secure = true;

        // Verificar HTTPS
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            this.addIssue('security', 'critical', 'Sitio no usa HTTPS');
            secure = false;
        }

        // Verificar CSP
        const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!csp) {
            this.addRecommendation('security', 'Considerar implementar Content Security Policy');
        }

        // Verificar enlaces externos
        const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="cracktotal.com"])');
        const unsafeLinks = Array.from(externalLinks).filter(link => 
            !link.rel || !link.rel.includes('noopener')
        );

        if (unsafeLinks.length > 0) {
            this.addRecommendation('security', `${unsafeLinks.length} enlaces externos sin rel="noopener"`);
        }

        this.checks.security = secure;
    }

    /**
     * Verificar enlaces internos
     */
    async checkInternalLinks() {
        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
        let brokenLinks = 0;

        // Verificar enlaces rotos (simulación básica)
        internalLinks.forEach((link, index) => {
            if (link.href.includes('404') || link.href.includes('error')) {
                this.addIssue('links', 'warning', `Posible enlace roto: ${link.href}`);
                brokenLinks++;
            }

            // Verificar títulos
            if (!link.title && link.textContent.trim()) {
                this.addRecommendation('links', `Agregar título al enlace ${index + 1}`);
            }
        });

        return brokenLinks === 0;
    }

    /**
     * Verificar optimización móvil
     */
    async checkMobileOptimization() {
        const viewport = document.querySelector('meta[name="viewport"]');
        
        if (!viewport) {
            this.addIssue('mobile', 'critical', 'Falta meta viewport');
            return false;
        }

        const content = viewport.content;
        if (!content.includes('width=device-width')) {
            this.addIssue('mobile', 'warning', 'Viewport no incluye width=device-width');
        }

        // Verificar elementos responsive
        const fixedWidthElements = document.querySelectorAll('[width], [style*="width:"]');
        if (fixedWidthElements.length > 5) {
            this.addRecommendation('mobile', 'Revisar elementos con anchos fijos para móviles');
        }

        return true;
    }

    /**
     * Verificar velocidad de página
     */
    async checkPageSpeed() {
        const metrics = {};

        // FCP (First Contentful Paint) simulation
        if (window.performance && window.performance.getEntriesByType) {
            const paintEntries = window.performance.getEntriesByType('paint');
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            
            if (fcp) {
                metrics.fcp = fcp.startTime;
                if (fcp.startTime > 1800) {
                    this.addIssue('speed', 'warning', `FCP lento: ${Math.round(fcp.startTime)}ms`);
                }
            }
        }

        // Verificar recursos críticos
        const criticalResources = document.querySelectorAll('link[rel="stylesheet"], script[src]');
        if (criticalResources.length > 10) {
            this.addRecommendation('speed', 'Considerar reducir recursos críticos');
        }

        return metrics;
    }

    /**
     * Verificar calidad del contenido
     */
    async checkContentQuality() {
        const content = document.body.textContent;
        const wordCount = content.split(/\s+/).length;

        if (wordCount < 300) {
            this.addRecommendation('content', 'Contenido muy corto para SEO (menos de 300 palabras)');
        }

        // Verificar headings
        const h1s = document.querySelectorAll('h1');
        if (h1s.length === 0) {
            this.addIssue('content', 'warning', 'No se encontró H1');
        } else if (h1s.length > 1) {
            this.addIssue('content', 'warning', 'Múltiples H1 encontrados');
        }

        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length < 3) {
            this.addRecommendation('content', 'Agregar más estructura de headings');
        }
    }

    /**
     * Utilidades de verificación
     */
    async verifyImageUrl(url, context) {
        // Simulación de verificación de imagen
        if (!url.startsWith('http')) {
            this.addIssue('images', 'warning', `URL de imagen relativa en ${context}: ${url}`);
        }
    }

    addIssue(category, severity, message) {
        this.issues.push({
            category,
            severity,
            message,
            timestamp: new Date(),
            url: window.location.href
        });
    }

    addRecommendation(category, message) {
        this.recommendations.push({
            category,
            message,
            timestamp: new Date(),
            url: window.location.href
        });
    }

    /**
     * Generar reporte de SEO
     */
    generateReport() {
        const report = {
            timestamp: new Date(),
            url: window.location.href,
            checks: this.checks,
            issues: this.issues,
            recommendations: this.recommendations,
            score: this.calculateSEOScore(),
            summary: this.generateSummary()
        };

        console.group('📊 REPORTE SEO - CRACK TOTAL');
        console.log(`🔍 URL: ${report.url}`);
        console.log(`⭐ Puntuación SEO: ${report.score}/100`);
        console.log(`❌ Problemas encontrados: ${this.issues.length}`);
        console.log(`💡 Recomendaciones: ${this.recommendations.length}`);
        
        if (this.issues.length > 0) {
            console.group('❌ Problemas');
            this.issues.forEach(issue => {
                const emoji = issue.severity === 'critical' ? '🚨' : issue.severity === 'error' ? '❌' : '⚠️';
                console.log(`${emoji} [${issue.category}] ${issue.message}`);
            });
            console.groupEnd();
        }

        if (this.recommendations.length > 0) {
            console.group('💡 Recomendaciones');
            this.recommendations.forEach(rec => {
                console.log(`💡 [${rec.category}] ${rec.message}`);
            });
            console.groupEnd();
        }

        console.groupEnd();

        // Guardar en localStorage para análisis
        localStorage.setItem('crackTotalSEOReport', JSON.stringify(report));

        return report;
    }

    calculateSEOScore() {
        const totalChecks = Object.keys(this.checks).length;
        const passedChecks = Object.values(this.checks).filter(Boolean).length;
        const baseScore = (passedChecks / totalChecks) * 80;

        // Penalizar por problemas críticos
        const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
        const errorIssues = this.issues.filter(i => i.severity === 'error').length;
        const warningIssues = this.issues.filter(i => i.severity === 'warning').length;

        const penalty = (criticalIssues * 10) + (errorIssues * 5) + (warningIssues * 2);
        
        return Math.max(0, Math.min(100, Math.round(baseScore - penalty + 20))); // +20 bonus base
    }

    generateSummary() {
        const critical = this.issues.filter(i => i.severity === 'critical').length;
        const warnings = this.issues.filter(i => i.severity === 'warning').length;
        
        if (critical > 0) {
            return `❌ ${critical} problemas críticos requieren atención inmediata`;
        } else if (warnings > 3) {
            return `⚠️ ${warnings} advertencias a considerar`;
        } else if (warnings > 0) {
            return `✅ Buena optimización, ${warnings} mejoras menores disponibles`;
        } else {
            return '🎉 Excelente optimización SEO!';
        }
    }

    /**
     * Configurar verificaciones periódicas
     */
    setupPeriodicChecks() {
        // Verificación ligera cada 5 minutos
        setInterval(() => {
            this.runLightCheck();
        }, this.config.checkInterval);

        // Reporte completo cada hora
        setInterval(() => {
            this.runCompleteCheck();
        }, this.config.reportInterval);
    }

    async runLightCheck() {
        // Verificaciones rápidas
        await Promise.all([
            this.checkCanonicalTags(),
            this.checkMetaTags(),
            this.checkSecurity()
        ]);
    }

    setupPerformanceMonitoring() {
        // Monitorear Core Web Vitals si está disponible
        if ('web-vitals' in window) {
            // Implementar cuando esté disponible
        }

        // Observer para cambios en el DOM que afecten SEO
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    const element = mutation.target;
                    if (element.tagName === 'TITLE' || 
                        element.name === 'description' || 
                        element.rel === 'canonical') {
                        this.runLightCheck();
                    }
                }
            });
        });

        observer.observe(document.head, { 
            attributes: true, 
            childList: true, 
            subtree: true 
        });
    }

    sendToAnalytics() {
        // Enviar métricas a Google Analytics
        if (window.gtag) {
            gtag('event', 'seo_check', {
                event_category: 'SEO',
                event_label: 'automated_check',
                custom_parameter_1: this.calculateSEOScore(),
                custom_parameter_2: this.issues.length
            });
        }
    }

    // API pública para verificaciones manuales
    async runManualCheck() {
        console.log('🔍 Ejecutando verificación manual de SEO...');
        await this.runCompleteCheck();
        return this.generateReport();
    }

    getLastReport() {
        const stored = localStorage.getItem('crackTotalSEOReport');
        return stored ? JSON.parse(stored) : null;
    }

    exportReport() {
        const report = this.getLastReport();
        if (report) {
            const blob = new Blob([JSON.stringify(report, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cracktotal-seo-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.CrackTotalSEOMonitor = new CrackTotalSEOMonitor();

    // Exponer funciones útiles al console
    window.checkSEO = () => window.CrackTotalSEOMonitor.runManualCheck();
    window.exportSEOReport = () => window.CrackTotalSEOMonitor.exportReport();
}

export default CrackTotalSEOMonitor; 