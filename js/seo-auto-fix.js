/**
 * ========================================
 * CRACK TOTAL - SEO AUTO-FIX SYSTEM
 * ========================================
 * Sistema que corrige automáticamente problemas de SEO
 */

class CrackTotalSEOAutoFix {
    constructor() {
        this.config = {
            enableAutoFix: true,
            fixInterval: 30000, // 30 segundos
            maxFixes: 10 // Máximo de correcciones por sesión
        };

        this.fixesApplied = 0;
        this.fixHistory = [];

        this.init();
    }

    init() {
        if (this.config.enableAutoFix) {
            this.runInitialFixes();
            this.setupPeriodicFixes();
            this.setupDOMObserver();
        }
        
        console.log('🔧 CrackTotalSEOAutoFix initialized');
    }

    /**
     * Ejecutar correcciones iniciales al cargar la página
     */
    runInitialFixes() {
        this.fixCanonicalIssues();
        this.fixMetaDescriptions();
        this.fixMissingAltTags();
        this.fixExternalLinks();
        this.fixHeadingStructure();
        this.fixDuplicateContent();
        this.fixLanguageAttributes();
        this.fixSchemaMarkup();
    }

    /**
     * Corregir problemas de URLs canónicas
     */
    fixCanonicalIssues() {
        try {
            const canonicals = document.querySelectorAll('link[rel="canonical"]');
            
            // Remover duplicados
            if (canonicals.length > 1) {
                for (let i = 1; i < canonicals.length; i++) {
                    canonicals[i].remove();
                    this.logFix('canonical', 'Removed duplicate canonical tag');
                }
            }

            // Corregir URL canónica
            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) {
                let href = canonical.href;
                let needsUpdate = false;

                // Forzar HTTPS
                if (href.startsWith('http://')) {
                    href = href.replace('http://', 'https://');
                    needsUpdate = true;
                }

                // Remover index.html
                if (href.includes('/index.html')) {
                    href = href.replace('/index.html', '/');
                    needsUpdate = true;
                }

                // Remover parámetros de tracking
                const url = new URL(href);
                const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
                trackingParams.forEach(param => {
                    if (url.searchParams.has(param)) {
                        url.searchParams.delete(param);
                        needsUpdate = true;
                    }
                });

                if (needsUpdate) {
                    canonical.href = url.toString();
                    this.logFix('canonical', `Updated canonical URL to: ${url.toString()}`);
                }
            }
        } catch (error) {
            console.warn('Error fixing canonical issues:', error);
        }
    }

    /**
     * Corregir meta descripciones
     */
    fixMetaDescriptions() {
        try {
            const description = document.querySelector('meta[name="description"]');
            
            if (!description) {
                // Crear meta descripción si no existe
                const newDescription = document.createElement('meta');
                newDescription.name = 'description';
                newDescription.content = this.generateMetaDescription();
                document.head.appendChild(newDescription);
                this.logFix('meta', 'Added missing meta description');
            } else if (!description.content || description.content.length < 120) {
                // Mejorar descripción muy corta
                description.content = this.generateMetaDescription();
                this.logFix('meta', 'Improved meta description length');
            } else if (description.content.length > 160) {
                // Recortar descripción muy larga
                description.content = description.content.substring(0, 157) + '...';
                this.logFix('meta', 'Trimmed meta description to 160 characters');
            }
        } catch (error) {
            console.warn('Error fixing meta descriptions:', error);
        }
    }

    /**
     * Corregir imágenes sin atributo alt
     */
    fixMissingAltTags() {
        try {
            const images = document.querySelectorAll('img:not([alt])');
            
            images.forEach((img, index) => {
                if (this.fixesApplied >= this.config.maxFixes) return;

                // Generar alt text basado en contexto
                let altText = this.generateAltText(img);
                img.alt = altText;
                this.logFix('images', `Added alt text to image: "${altText}"`);
            });
        } catch (error) {
            console.warn('Error fixing alt tags:', error);
        }
    }

    /**
     * Corregir enlaces externos sin rel="noopener"
     */
    fixExternalLinks() {
        try {
            const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="cracktotal.com"])');
            
            externalLinks.forEach(link => {
                if (this.fixesApplied >= this.config.maxFixes) return;

                let needsUpdate = false;
                let newRel = link.rel || '';

                // Agregar noopener si no existe
                if (!newRel.includes('noopener')) {
                    newRel += (newRel ? ' ' : '') + 'noopener';
                    needsUpdate = true;
                }

                // Agregar noreferrer para mayor seguridad
                if (!newRel.includes('noreferrer')) {
                    newRel += ' noreferrer';
                    needsUpdate = true;
                }

                // Agregar target="_blank" si no existe
                if (!link.target) {
                    link.target = '_blank';
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    link.rel = newRel.trim();
                    this.logFix('links', `Fixed external link: ${link.href}`);
                }
            });
        } catch (error) {
            console.warn('Error fixing external links:', error);
        }
    }

    /**
     * Corregir estructura de headings
     */
    fixHeadingStructure() {
        try {
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            const h1s = document.querySelectorAll('h1');

            // Verificar múltiples H1
            if (h1s.length > 1) {
                for (let i = 1; i < h1s.length; i++) {
                    if (this.fixesApplied >= this.config.maxFixes) return;
                    
                    // Convertir H1 adicionales a H2
                    const newH2 = document.createElement('h2');
                    newH2.innerHTML = h1s[i].innerHTML;
                    newH2.className = h1s[i].className;
                    h1s[i].parentNode.replaceChild(newH2, h1s[i]);
                    this.logFix('headings', 'Converted extra H1 to H2');
                }
            }

            // Verificar que existe al menos un H1
            if (h1s.length === 0) {
                const firstHeading = document.querySelector('h2, h3, h4, h5, h6');
                if (firstHeading) {
                    const newH1 = document.createElement('h1');
                    newH1.innerHTML = firstHeading.innerHTML;
                    newH1.className = firstHeading.className;
                    firstHeading.parentNode.replaceChild(newH1, firstHeading);
                    this.logFix('headings', 'Promoted first heading to H1');
                }
            }
        } catch (error) {
            console.warn('Error fixing heading structure:', error);
        }
    }

    /**
     * Corregir contenido duplicado
     */
    fixDuplicateContent() {
        try {
            // Redirigir automáticamente index.html a /
            if (window.location.pathname.endsWith('/index.html')) {
                const newUrl = window.location.href.replace('/index.html', '/');
                window.history.replaceState({}, '', newUrl);
                this.logFix('duplicate', 'Removed index.html from URL');
            }

            // Limpiar parámetros de tracking de la URL
            const url = new URL(window.location);
            const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
            let urlChanged = false;

            trackingParams.forEach(param => {
                if (url.searchParams.has(param)) {
                    url.searchParams.delete(param);
                    urlChanged = true;
                }
            });

            if (urlChanged) {
                window.history.replaceState({}, '', url.toString());
                this.logFix('duplicate', 'Cleaned tracking parameters from URL');
            }
        } catch (error) {
            console.warn('Error fixing duplicate content:', error);
        }
    }

    /**
     * Corregir atributos de idioma
     */
    fixLanguageAttributes() {
        try {
            // Verificar atributo lang en html
            const html = document.documentElement;
            if (!html.lang) {
                html.lang = 'es';
                this.logFix('language', 'Added lang="es" to html element');
            } else if (html.lang !== 'es' && html.lang !== 'es-AR') {
                html.lang = 'es';
                this.logFix('language', 'Updated lang attribute to "es"');
            }

            // Agregar hreflang si no existe
            if (!document.querySelector('link[rel="alternate"][hreflang]')) {
                const alternates = [
                    { hreflang: 'es', href: window.location.href.split('?')[0] },
                    { hreflang: 'es-AR', href: window.location.href.split('?')[0] },
                    { hreflang: 'x-default', href: window.location.href.split('?')[0] }
                ];

                alternates.forEach(alt => {
                    const link = document.createElement('link');
                    link.rel = 'alternate';
                    link.hreflang = alt.hreflang;
                    link.href = alt.href;
                    document.head.appendChild(link);
                });

                this.logFix('language', 'Added hreflang attributes');
            }
        } catch (error) {
            console.warn('Error fixing language attributes:', error);
        }
    }

    /**
     * Corregir Schema markup
     */
    fixSchemaMarkup() {
        try {
            const existingSchemas = document.querySelectorAll('script[type="application/ld+json"]');
            
            // Verificar si existe schema básico
            if (existingSchemas.length === 0) {
                const websiteSchema = {
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "Crack Total",
                    "url": window.location.origin,
                    "description": "Crack Total: Demuestra tu conocimiento de fútbol con juegos y trivias desafiantes.",
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": `${window.location.origin}/search?q={search_term_string}`,
                        "query-input": "required name=search_term_string"
                    }
                };

                const script = document.createElement('script');
                script.type = 'application/ld+json';
                script.textContent = JSON.stringify(websiteSchema);
                document.head.appendChild(script);
                this.logFix('schema', 'Added basic website schema markup');
            }
        } catch (error) {
            console.warn('Error fixing schema markup:', error);
        }
    }

    /**
     * Generar meta descripción automática
     */
    generateMetaDescription() {
        const title = document.title || 'Crack Total';
        const content = document.body.textContent || '';
        const firstParagraph = content.substring(0, 300).replace(/\s+/g, ' ').trim();
        
        if (firstParagraph.length > 120) {
            return firstParagraph.substring(0, 157) + '...';
        } else {
            return `${title} - ${firstParagraph}`.substring(0, 160);
        }
    }

    /**
     * Generar texto alt automático para imágenes
     */
    generateAltText(img) {
        // Intentar obtener contexto de la imagen
        const src = img.src || '';
        const className = img.className || '';
        const parent = img.parentElement;
        const parentText = parent ? parent.textContent.trim() : '';

        // Generar alt basado en el nombre del archivo
        let altText = '';
        
        if (src.includes('portada')) {
            altText = 'Imagen de portada de Crack Total';
        } else if (src.includes('logo')) {
            altText = 'Logo de Crack Total';
        } else if (src.includes('game') || src.includes('juego')) {
            altText = 'Imagen de juego de fútbol';
        } else if (src.includes('blog')) {
            altText = 'Imagen del blog de fútbol';
        } else if (className.includes('avatar') || className.includes('profile')) {
            altText = 'Imagen de perfil de usuario';
        } else if (parentText && parentText.length > 10) {
            altText = parentText.substring(0, 50) + '...';
        } else {
            altText = 'Imagen relacionada con fútbol';
        }

        return altText;
    }

    /**
     * Configurar observador del DOM para cambios dinámicos
     */
    setupDOMObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Corregir nuevas imágenes sin alt
                            const newImages = node.querySelectorAll ? node.querySelectorAll('img:not([alt])') : [];
                            newImages.forEach(img => {
                                if (this.fixesApplied < this.config.maxFixes) {
                                    img.alt = this.generateAltText(img);
                                    this.logFix('images', 'Added alt text to dynamically added image');
                                }
                            });

                            // Corregir nuevos enlaces externos
                            const newLinks = node.querySelectorAll ? node.querySelectorAll('a[href^="http"]:not([href*="cracktotal.com"])') : [];
                            newLinks.forEach(link => {
                                if (this.fixesApplied < this.config.maxFixes && !link.rel.includes('noopener')) {
                                    link.rel = (link.rel + ' noopener noreferrer').trim();
                                    link.target = '_blank';
                                    this.logFix('links', 'Fixed dynamically added external link');
                                }
                            });
                        }
                    });
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Configurar correcciones periódicas
     */
    setupPeriodicFixes() {
        setInterval(() => {
            if (this.fixesApplied < this.config.maxFixes) {
                this.runLightFixes();
            }
        }, this.config.fixInterval);
    }

    /**
     * Ejecutar correcciones ligeras periódicamente
     */
    runLightFixes() {
        this.fixCanonicalIssues();
        this.fixDuplicateContent();
    }

    /**
     * Registrar corrección aplicada
     */
    logFix(category, message) {
        this.fixesApplied++;
        const fix = {
            category,
            message,
            timestamp: new Date(),
            url: window.location.href
        };
        
        this.fixHistory.push(fix);
        console.log(`🔧 [${category}] ${message}`);

        // Notificar al monitor SEO si existe
        if (window.CrackTotalSEOMonitor) {
            window.CrackTotalSEOMonitor.runLightCheck();
        }

        // Enviar a analytics
        if (window.gtag) {
            gtag('event', 'seo_auto_fix', {
                event_category: 'SEO',
                event_label: category,
                custom_parameter_1: message
            });
        }
    }

    /**
     * Obtener reporte de correcciones aplicadas
     */
    getFixReport() {
        return {
            totalFixes: this.fixesApplied,
            maxFixes: this.config.maxFixes,
            history: this.fixHistory,
            timestamp: new Date()
        };
    }

    /**
     * API pública
     */
    getStats() {
        console.group('🔧 SEO Auto-Fix Stats');
        console.log(`Total fixes applied: ${this.fixesApplied}/${this.config.maxFixes}`);
        console.log('Fix history:');
        this.fixHistory.forEach(fix => {
            console.log(`  - [${fix.category}] ${fix.message}`);
        });
        console.groupEnd();
        
        return this.getFixReport();
    }

    // Deshabilitar auto-fix si es necesario
    disable() {
        this.config.enableAutoFix = false;
        console.log('🔧 SEO Auto-Fix disabled');
    }

    enable() {
        this.config.enableAutoFix = true;
        console.log('🔧 SEO Auto-Fix enabled');
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.CrackTotalSEOAutoFix = new CrackTotalSEOAutoFix();
    
    // Exponer funciones útiles
    window.getSEOFixStats = () => window.CrackTotalSEOAutoFix.getStats();
    window.disableSEOAutoFix = () => window.CrackTotalSEOAutoFix.disable();
    window.enableSEOAutoFix = () => window.CrackTotalSEOAutoFix.enable();
}

export default CrackTotalSEOAutoFix; 