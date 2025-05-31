/**
 * ========================================
 * CRACK TOTAL - SEO OPTIMIZATION MANAGER
 * ========================================
 * Sistema avanzado de optimización SEO
 */

class CrackTotalSEOManager {
    constructor() {
        this.config = {
            baseUrl: 'https://cracktotal.com',
            siteName: 'Crack Total',
            defaultTitle: 'Crack Total - El Juego del Fútbol',
            defaultDescription: 'Crack Total: Demuestra tu conocimiento de fútbol con juegos y trivias desafiantes. Lee artículos originales en nuestro blog y compite con otros hinchas.',
            defaultImage: 'https://cracktotal.com/images/portada.jpg',
            twitterHandle: '@cracktotal_',
            language: 'es',
            region: 'AR'
        };

        this.pageConfigs = new Map();
        this.breadcrumbs = [];
        this.structuredData = [];

        this.init();
    }

    init() {
        this.detectCurrentPage();
        this.fixCanonicalIssues();
        this.setupDynamicMeta();
        this.generateStructuredData();
        this.setupInternalLinking();
        this.preventIndexationIssues();
        this.optimizePageSpeed();
        this.setupAnalyticsTracking();
        
        console.log('🔍 CrackTotalSEOManager initialized');
    }

    /**
     * Detección y configuración de página actual
     */
    detectCurrentPage() {
        const path = window.location.pathname;
        const pageName = this.getPageNameFromPath(path);
        
        // Configuraciones específicas por página
        this.pageConfigs.set('home', {
            title: 'Crack Total - El Juego del Fútbol',
            description: 'Crack Total: Demuestra tu conocimiento de fútbol con juegos y trivias desafiantes. Lee artículos originales en nuestro blog y compite con otros hinchas.',
            keywords: 'juegos de fútbol, trivia fútbol, preguntas fútbol, quiz fútbol, conocimiento deportivo',
            type: 'website',
            priority: 1.0
        });

        this.pageConfigs.set('games', {
            title: 'Juegos de Fútbol - Crack Total',
            description: 'Descubre todos nuestros juegos de fútbol: Pasalache, ¿Quién Sabe Más?, El Mentiroso y Crack Rápido. Pon a prueba tu conocimiento.',
            keywords: 'juegos fútbol online, trivia deportes, pasalache, quien sabe mas',
            type: 'website',
            priority: 0.9
        });

        this.pageConfigs.set('blog', {
            title: 'Blog de Fútbol - Crack Total',
            description: 'Lee los mejores artículos sobre fútbol: análisis, historia, tácticas y más. Contenido original y de calidad sobre el deporte rey.',
            keywords: 'blog fútbol, artículos fútbol, noticias fútbol, análisis deportivo',
            type: 'blog',
            priority: 0.7
        });

        // Configurar página actual
        const currentConfig = this.pageConfigs.get(pageName) || this.getDefaultConfig();
        this.applyPageConfig(currentConfig);
    }

    getPageNameFromPath(path) {
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('games')) return 'games';
        if (path.includes('blog')) return 'blog';
        if (path.includes('ranking')) return 'ranking';
        if (path.includes('profile')) return 'profile';
        if (path.includes('about')) return 'about';
        if (path.includes('contact')) return 'contact';
        if (path.includes('pasalache')) return 'pasalache';
        if (path.includes('quiensabemas')) return 'quiensabemas';
        if (path.includes('mentiroso')) return 'mentiroso';
        if (path.includes('crack-rapido')) return 'crack-rapido';
        
        return 'default';
    }

    /**
     * Corregir problemas de URLs canónicas
     */
    fixCanonicalIssues() {
        // Remover canonical duplicado si existe
        const existingCanonical = document.querySelector('link[rel="canonical"]');
        
        // Crear URL canónica correcta
        let canonicalUrl = window.location.href;
        
        // Remover parámetros de tracking
        canonicalUrl = canonicalUrl.split('?')[0].split('#')[0];
        
        // Remover index.html si existe
        canonicalUrl = canonicalUrl.replace('/index.html', '/');
        
        // Asegurar que termine sin barra diagonal (excepto la raíz)
        if (canonicalUrl !== this.config.baseUrl + '/' && canonicalUrl.endsWith('/')) {
            canonicalUrl = canonicalUrl.slice(0, -1);
        }

        if (existingCanonical) {
            existingCanonical.href = canonicalUrl;
        } else {
            const canonical = document.createElement('link');
            canonical.rel = 'canonical';
            canonical.href = canonicalUrl;
            document.head.appendChild(canonical);
        }

        // Agregar alternate hreflang si no existe
        if (!document.querySelector('link[rel="alternate"][hreflang]')) {
            const alternates = [
                { hreflang: 'es', href: canonicalUrl },
                { hreflang: 'es-AR', href: canonicalUrl },
                { hreflang: 'x-default', href: canonicalUrl }
            ];

            alternates.forEach(alt => {
                const link = document.createElement('link');
                link.rel = 'alternate';
                link.hreflang = alt.hreflang;
                link.href = alt.href;
                document.head.appendChild(link);
            });
        }
    }

    /**
     * Configuración dinámica de meta tags
     */
    setupDynamicMeta() {
        // Optimizar título dinámicamente
        this.optimizeTitle();
        
        // Optimizar descripción
        this.optimizeDescription();
        
        // Configurar Open Graph
        this.setupOpenGraph();
        
        // Configurar Twitter Cards
        this.setupTwitterCards();
        
        // Configurar robots meta
        this.setupRobotsMeta();
    }

    optimizeTitle() {
        const currentTitle = document.title;
        if (!currentTitle || currentTitle.length < 30 || currentTitle.length > 60) {
            const config = this.getCurrentPageConfig();
            document.title = config.title;
        }
    }

    optimizeDescription() {
        let description = document.querySelector('meta[name="description"]');
        if (!description) {
            description = document.createElement('meta');
            description.name = 'description';
            document.head.appendChild(description);
        }

        const config = this.getCurrentPageConfig();
        if (!description.content || description.content.length < 120 || description.content.length > 160) {
            description.content = config.description;
        }
    }

    setupOpenGraph() {
        const config = this.getCurrentPageConfig();
        const ogTags = {
            'og:type': config.type || 'website',
            'og:title': config.title,
            'og:description': config.description,
            'og:url': window.location.href.split('?')[0].split('#')[0],
            'og:image': config.image || this.config.defaultImage,
            'og:site_name': this.config.siteName,
            'og:locale': 'es_AR'
        };

        Object.entries(ogTags).forEach(([property, content]) => {
            this.setMetaProperty(property, content);
        });
    }

    setupTwitterCards() {
        const config = this.getCurrentPageConfig();
        const twitterTags = {
            'twitter:card': 'summary_large_image',
            'twitter:site': this.config.twitterHandle,
            'twitter:title': config.title,
            'twitter:description': config.description,
            'twitter:image': config.image || this.config.defaultImage
        };

        Object.entries(twitterTags).forEach(([name, content]) => {
            this.setMetaName(name, content);
        });
    }

    setupRobotsMeta() {
        const path = window.location.pathname;
        let robotsContent = 'index, follow';

        // No indexar páginas específicas
        if (path.includes('404') || path.includes('error') || 
            path.includes('search?') || path.includes('?utm_')) {
            robotsContent = 'noindex, follow';
        }

        this.setMetaName('robots', robotsContent);
    }

    /**
     * Generación de datos estructurados
     */
    generateStructuredData() {
        this.addWebsiteSchema();
        this.addOrganizationSchema();
        this.addBreadcrumbSchema();
        this.addPageSpecificSchema();
    }

    addWebsiteSchema() {
        const websiteSchema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": this.config.siteName,
            "url": this.config.baseUrl,
            "description": this.config.defaultDescription,
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${this.config.baseUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            },
            "publisher": {
                "@type": "Organization",
                "name": this.config.siteName,
                "logo": {
                    "@type": "ImageObject",
                    "url": this.config.defaultImage
                }
            },
            "inLanguage": "es-AR",
            "audience": {
                "@type": "Audience",
                "audienceType": "football fans, sports enthusiasts"
            }
        };

        this.addStructuredData(websiteSchema);
    }

    addOrganizationSchema() {
        const organizationSchema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": this.config.siteName,
            "url": this.config.baseUrl,
            "logo": this.config.defaultImage,
            "description": this.config.defaultDescription,
            "sameAs": [
                `https://twitter.com/${this.config.twitterHandle.replace('@', '')}`
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "url": `${this.config.baseUrl}/contact.html`
            }
        };

        this.addStructuredData(organizationSchema);
    }

    addBreadcrumbSchema() {
        const breadcrumbs = this.generateBreadcrumbs();
        if (breadcrumbs.length > 1) {
            const breadcrumbSchema = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbs.map((item, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "name": item.name,
                    "item": item.url
                }))
            };

            this.addStructuredData(breadcrumbSchema);
        }
    }

    addPageSpecificSchema() {
        const path = window.location.pathname;
        
        if (path.includes('blog-detail-')) {
            this.addArticleSchema();
        } else if (path.includes('games') || path.includes('pasalache') || 
                   path.includes('quiensabemas') || path.includes('mentiroso') || 
                   path.includes('crack-rapido')) {
            this.addGameSchema();
        }
    }

    addArticleSchema() {
        const title = document.title;
        const description = document.querySelector('meta[name="description"]')?.content;
        
        const articleSchema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description,
            "url": window.location.href.split('?')[0],
            "datePublished": new Date().toISOString(),
            "dateModified": new Date().toISOString(),
            "author": {
                "@type": "Organization",
                "name": this.config.siteName
            },
            "publisher": {
                "@type": "Organization",
                "name": this.config.siteName,
                "logo": {
                    "@type": "ImageObject",
                    "url": this.config.defaultImage
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": window.location.href.split('?')[0]
            },
            "image": this.config.defaultImage,
            "articleSection": "Football",
            "inLanguage": "es-AR"
        };

        this.addStructuredData(articleSchema);
    }

    addGameSchema() {
        const title = document.title;
        const description = document.querySelector('meta[name="description"]')?.content;
        
        const gameSchema = {
            "@context": "https://schema.org",
            "@type": "Game",
            "name": title,
            "description": description,
            "url": window.location.href.split('?')[0],
            "genre": "Sports Trivia",
            "gamePlatform": "Web Browser",
            "applicationCategory": "Game",
            "operatingSystem": "Any",
            "publisher": {
                "@type": "Organization",
                "name": this.config.siteName
            },
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
            }
        };

        this.addStructuredData(gameSchema);
    }

    /**
     * Mejoras de enlaces internos
     */
    setupInternalLinking() {
        this.addRelatedLinksToContent();
        this.optimizeLinkAttributes();
        this.setupSmartLinking();
    }

    addRelatedLinksToContent() {
        // Agregar enlaces relacionados automáticamente
        const content = document.querySelector('.content, .main-content, article');
        if (content) {
            const text = content.textContent.toLowerCase();
            const linkSuggestions = {
                'messi': '/blog-detail-messi.html',
                'mundial': '/blog-detail-worldcups.html',
                'champions': '/blog-detail-champions.html',
                'libertadores': '/blog-detail-libertadores.html',
                'ranking': '/ranking.html',
                'juegos': '/games.html'
            };

            // Usar función auxiliar para manejar la lógica de enlaces
            this.processContentLinks(content, text, linkSuggestions);
        }
    }

    processContentLinks(content, text, linkSuggestions) {
        for (const [keyword, url] of Object.entries(linkSuggestions)) {
            if (text.includes(keyword) && !content.innerHTML.includes(url)) {
                // Agregar enlace contextual si no existe
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const firstMatch = content.innerHTML.match(regex);
                if (firstMatch && !content.innerHTML.includes(`href="${url}"`)) {
                    content.innerHTML = content.innerHTML.replace(
                        regex,
                        `<a href="${url}" class="internal-link" rel="related">${firstMatch[0]}</a>`
                    );
                    return; // Solo uno por página para evitar sobre-optimización
                }
            }
        }
    }

    optimizeLinkAttributes() {
        // Optimizar todos los enlaces internos
        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
        internalLinks.forEach(link => {
            if (!link.getAttribute('title') && link.textContent.trim()) {
                link.setAttribute('title', link.textContent.trim());
            }
        });

        // Optimizar enlaces externos
        const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="cracktotal.com"])');
        externalLinks.forEach(link => {
            link.setAttribute('rel', 'noopener noreferrer');
            link.setAttribute('target', '_blank');
        });
    }

    /**
     * Prevención de problemas de indexación
     */
    preventIndexationIssues() {
        this.fixDuplicateContent();
        this.setupPaginationTags();
        this.preventParameterIndexation();
    }

    fixDuplicateContent() {
        // Redirigir automáticamente index.html a /
        if (window.location.pathname.endsWith('/index.html')) {
            const newUrl = window.location.href.replace('/index.html', '/');
            window.history.replaceState({}, '', newUrl);
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
        }
    }

    setupPaginationTags() {
        // Setup pagination tags if needed
        // This can be extended for paginated content
        console.log('Pagination tags setup completed');
    }

    preventParameterIndexation() {
        // Prevent indexation of URLs with tracking parameters
        const url = new URL(window.location);
        const hasTrackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid']
            .some(param => url.searchParams.has(param));
        
        if (hasTrackingParams) {
            this.setMetaName('robots', 'noindex, follow');
        }
    }

    /**
     * Optimización de velocidad de página
     */
    optimizePageSpeed() {
        this.lazyLoadImages();
        this.optimizeFonts();
        this.preloadCriticalResources();
    }

    lazyLoadImages() {
        if ('loading' in HTMLImageElement.prototype) {
            const images = document.querySelectorAll('img:not([loading])');
            images.forEach(img => {
                img.loading = 'lazy';
            });
        }
    }

    optimizeFonts() {
        const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        fontLinks.forEach(link => {
            link.setAttribute('rel', 'preconnect');
            if (!link.hasAttribute('crossorigin')) {
                link.setAttribute('crossorigin', '');
            }
        });
    }

    preloadCriticalResources() {
        const criticalResources = [
            { href: '/css/critical.css', as: 'style' },
            { href: '/css/base.css', as: 'style' },
            { href: this.config.defaultImage, as: 'image' }
        ];

        criticalResources.forEach(resource => {
            const existing = document.querySelector(`link[href="${resource.href}"]`);
            if (!existing) {
                const preload = document.createElement('link');
                preload.rel = 'preload';
                preload.href = resource.href;
                preload.as = resource.as;
                document.head.appendChild(preload);
            }
        });
    }

    /**
     * Utilidades
     */
    getCurrentPageConfig() {
        const pageName = this.getPageNameFromPath(window.location.pathname);
        return this.pageConfigs.get(pageName) || this.getDefaultConfig();
    }

    getDefaultConfig() {
        return {
            title: this.config.defaultTitle,
            description: this.config.defaultDescription,
            image: this.config.defaultImage,
            type: 'website',
            priority: 0.5
        };
    }

    generateBreadcrumbs() {
        const path = window.location.pathname;
        const breadcrumbs = [{ name: 'Inicio', url: this.config.baseUrl }];

        if (path !== '/') {
            const segments = path.split('/').filter(segment => segment && segment !== 'index.html');
            let currentPath = '';

            segments.forEach(segment => {
                currentPath += '/' + segment;
                const name = this.getBreadcrumbName(segment);
                breadcrumbs.push({
                    name: name,
                    url: this.config.baseUrl + currentPath
                });
            });
        }

        return breadcrumbs;
    }

    getBreadcrumbName(segment) {
        const names = {
            'games': 'Juegos',
            'blog': 'Blog',
            'ranking': 'Rankings',
            'profile': 'Perfil',
            'about': 'Acerca de',
            'contact': 'Contacto',
            'pasalache': 'Pasalache',
            'quiensabemas': '¿Quién Sabe Más?',
            'mentiroso': 'El Mentiroso',
            'crack-rapido': 'Crack Rápido'
        };

        return names[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    setMetaProperty(property, content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

    setMetaName(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', name);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

    addStructuredData(schema) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
    }

    applyPageConfig(config) {
        document.title = config.title;
        this.setMetaName('description', config.description);
        
        if (config.keywords) {
            this.setMetaName('keywords', config.keywords);
        }
    }

    setupAnalyticsTracking() {
        // Mejorar el tracking de SEO para Analytics
        if (window.gtag) {
            gtag('config', 'G-5XP3T1RTH7', {
                custom_map: {
                    custom_parameter_1: 'seo_optimized_page'
                }
            });

            // Track SEO events
            gtag('event', 'seo_optimization', {
                event_category: 'SEO',
                event_label: window.location.pathname,
                custom_parameter_1: 'page_optimized'
            });
        }
    }

    // Método público para forzar re-optimización
    reoptimize() {
        this.detectCurrentPage();
        this.fixCanonicalIssues();
        this.setupDynamicMeta();
        this.generateStructuredData();
    }

    setupSmartLinking() {
        // Smart linking functionality placeholder
        // Add smart linking features here if needed
        console.log('Smart linking setup completed');
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.CrackTotalSEO = new CrackTotalSEOManager();
    
    // Auto-optimizar cuando el contenido cambie
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Re-optimizar enlaces internos cuando se añada nuevo contenido
                window.CrackTotalSEO.setupInternalLinking();
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

export default CrackTotalSEOManager; 