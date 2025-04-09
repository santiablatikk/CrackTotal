/**
 * Preload.js - Script para precarga de recursos
 * 
 * Este script se carga antes que cualquier otro JS y se encarga de:
 * 1. Precargar recursos críticos (imágenes, fuentes, scripts)
 * 2. Iniciar precarga de recursos no críticos
 * 3. Configurar variables iniciales
 */

// Función autoejecutable para evitar contaminar el scope global
(function() {
    'use strict';
    
    // Detectar entorno
    const config = {
        isProduction: window.location.hostname !== 'localhost' && 
                      !window.location.hostname.includes('127.0.0.1'),
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 window.innerWidth <= 768,
        supportsWebP: false,
        supportsAvif: false,
        hasTouchscreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        criticalImages: [
            '/img/logo.png',
            '/img/bg.jpg'
        ],
        criticalFonts: [
            '1em Roboto',
            'bold 1em Roboto'
        ],
        preconnectDomains: [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://www.googletagmanager.com'
        ],
        nonCriticalScripts: [
            '/js/analytics.js'
        ],
        moduleScripts: [
            '/js/modules/optimizeImages.js',
            '/js/modules/mobileUtils.js'
        ]
    };
    
    // Función para precargar imágenes críticas
    function preloadCriticalImages() {
        config.criticalImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
    
    // Función para precargar fuentes
    function preloadFonts() {
        if ('fonts' in document) {
            // Precargar fuentes críticas
            Promise.all(
                config.criticalFonts.map(font => document.fonts.load(font))
            ).then(() => {
                document.documentElement.classList.add('fonts-loaded');
            });
        }
    }
    
    // Función para precargar scripts no críticos después de la carga inicial
    function preloadNonCriticalScripts() {
        if (window.requestIdleCallback) {
            window.requestIdleCallback(() => {
                config.nonCriticalScripts.forEach(src => {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'script';
                    link.href = src;
                    document.head.appendChild(link);
                });
            });
        }
    }
    
    // Función para agregar preconexiones a dominios externos
    function addPreconnect() {
        config.preconnectDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }
    
    // Función para agregar variables CSS globales
    function addCSSVariables() {
        const root = document.documentElement;
        
        // Colores principales
        root.style.setProperty('--color-primary', '#2c3e50');
        root.style.setProperty('--color-secondary', '#3498db');
        root.style.setProperty('--color-accent', '#e74c3c');
        root.style.setProperty('--color-text', '#333333');
        root.style.setProperty('--color-background', '#f5f5f5');
        
        // Variables de espaciado - ajustadas para móviles si es necesario
        if (config.isMobile) {
            root.style.setProperty('--spacing-small', '6px');
            root.style.setProperty('--spacing-medium', '12px');
            root.style.setProperty('--spacing-large', '18px');
        } else {
            root.style.setProperty('--spacing-small', '8px');
            root.style.setProperty('--spacing-medium', '16px');
            root.style.setProperty('--spacing-large', '24px');
        }
        
        // Animaciones - reducidas en móviles para mejor rendimiento
        root.style.setProperty('--animation-speed', config.isMobile ? '0.2s' : '0.3s');
        
        // Añadir variable para detectar móvil desde CSS
        if (config.isMobile) {
            root.style.setProperty('--is-mobile', '1');
        }
    }
    
    // Función para detectar capacidades del navegador
    function detectBrowserCapabilities() {
        // Detectar soporte WebP
        const webpTest = new Image();
        webpTest.onload = function() { 
            config.supportsWebP = true;
            document.documentElement.classList.add('webp');
        };
        webpTest.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
        
        // Detectar soporte AVIF
        const avifTest = new Image();
        avifTest.onload = function() {
            config.supportsAvif = true;
            document.documentElement.classList.add('avif');
        };
        avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
        
        // Añadir clase si es dispositivo táctil
        if (config.hasTouchscreen) {
            document.documentElement.classList.add('touchscreen');
        }
        
        // Añadir clase si es móvil
        if (config.isMobile) {
            document.documentElement.classList.add('mobile-device');
        }
        
        // Exponer características detectadas globalmente
        window.browserFeatures = {
            webp: config.supportsWebP,
            avif: config.supportsAvif,
            touchscreen: config.hasTouchscreen,
            mobile: config.isMobile
        };
    }
    
    /**
     * Carga módulos JS optimizados
     */
    function loadOptimizationModules() {
        // Cargar módulos de optimización con prioridad adecuada
        config.moduleScripts.forEach((src, index) => {
            const script = document.createElement('script');
            script.src = src;
            
            // Primera carga con mayor prioridad
            if (index === 0) {
                script.setAttribute('fetchpriority', 'high');
            }
            
            script.async = index > 0; // Solo el primero no es async
            document.head.appendChild(script);
        });
    }
    
    // Ejecutar todas las funciones de precarga
    function init() {
        // Primero detectar capacidades para optimizar precarga
        detectBrowserCapabilities();
        
        // Luego establecer conexiones y variables
        addPreconnect();
        addCSSVariables();
        
        // Finalmente cargar recursos
        preloadCriticalImages();
        preloadFonts();
        
        // Cargar módulos de optimización
        if (document.readyState === 'loading') {
            // Si el DOM aún se está cargando, esperar
            document.addEventListener('DOMContentLoaded', loadOptimizationModules);
        } else {
            // Si el DOM ya está listo, cargar inmediatamente
            loadOptimizationModules();
        }
        
        // Precargar scripts no críticos después de la carga inicial
        if (document.readyState === 'complete') {
            preloadNonCriticalScripts();
        } else {
            window.addEventListener('load', preloadNonCriticalScripts);
        }
    }
    
    // Iniciar proceso de precarga
    init();
})(); 