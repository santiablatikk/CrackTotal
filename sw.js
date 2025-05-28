// Service Worker optimizado para Crack Total
const APP_VERSION = '2.1.0'; // Increment this to force cache updates
const CACHE_NAME = `crack-total-v${APP_VERSION}`;
const STATIC_CACHE_NAME = `crack-total-static-v${APP_VERSION}`;
const DYNAMIC_CACHE_NAME = `crack-total-dynamic-v${APP_VERSION}`;
const IMAGE_CACHE_NAME = `crack-total-images-v${APP_VERSION}`;
const API_CACHE_NAME = `crack-total-api-v${APP_VERSION}`;
const CURRENT_CACHES = [CACHE_NAME, STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, IMAGE_CACHE_NAME, API_CACHE_NAME];

// Configuración de cache
const CACHE_CONFIG = {
    maxImageCacheSize: 50, // Máximo 50 imágenes en cache
    maxApiCacheTime: 5 * 60 * 1000, // 5 minutos para API
    maxStaticCacheTime: 24 * 60 * 60 * 1000, // 24 horas para estáticos
    networkTimeoutMs: 3000 // 3 segundos timeout para red
};

// Recursos que se cachearán inmediatamente al instalar el SW
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/games.html',
    '/css/base.css',
    '/css/layout.css',
    '/css/landing.css',
    '/css/modals.css',
    '/js/main.js',
    '/js/firebase-init.js',
    '/js/cookie-consent.js',
    '/images/portada.jpg',
    '/portada.ico',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Oswald:wght@400;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Recursos que se cachearán dinámicamente cuando se soliciten
const DYNAMIC_CACHE_PATTERNS = [
    /\.html$/,
    /\.css$/,
    /\.js$/,
    /\.json$/
];

const IMAGE_PATTERNS = [
    /\.jpg$/,
    /\.jpeg$/,
    /\.png$/,
    /\.gif$/,
    /\.webp$/,
    /\.svg$/,
    /\.ico$/
];

// Instalación del Service Worker
self.addEventListener('install', event => {
    console.log(`[SW] Instalando service worker versión ${APP_VERSION}...`);
    
    event.waitUntil(
        Promise.all([
            // Cache de recursos estáticos
            caches.open(STATIC_CACHE_NAME)
                .then(cache => {
                    console.log('[SW] Cacheando recursos estáticos...');
                    return cache.addAll(STATIC_ASSETS);
                }),
            // Pre-crear otros caches
            caches.open(DYNAMIC_CACHE_NAME),
            caches.open(IMAGE_CACHE_NAME),
            caches.open(API_CACHE_NAME)
        ])
        .then(() => {
            console.log('[SW] Recursos estáticos cacheados exitosamente');
            return self.skipWaiting(); // Force immediate activation
        })
        .catch(error => {
            console.error('[SW] Error cacheando recursos estáticos:', error);
        })
    );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
    console.log(`[SW] Activando service worker versión ${APP_VERSION}...`);
    
    event.waitUntil(
        Promise.all([
            // Limpiar caches antiguos más agresivamente
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (!CURRENT_CACHES.includes(cacheName)) {
                            console.log('[SW] Eliminando cache antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Limpiar cache de imágenes si está muy lleno
            cleanupImageCache(),
            // Tomar control de todas las páginas abiertas
            self.clients.claim()
        ]).then(() => {
            console.log('[SW] Service Worker activado y tomó control de las páginas');
            // Notificar a todas las páginas que hay una nueva versión
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SW_UPDATED',
                        version: APP_VERSION,
                        timestamp: Date.now()
                    });
                });
            });
        })
    );
});

// Interceptar peticiones de red con manejo avanzado
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorar peticiones que no son GET
    if (request.method !== 'GET') {
        return;
    }
    
    // Ignorar peticiones a APIs externas que no queremos cachear
    if (url.origin !== location.origin && 
        !url.hostname.includes('fonts.googleapis.com') &&
        !url.hostname.includes('fonts.gstatic.com') &&
        !url.hostname.includes('cdnjs.cloudflare.com') &&
        !url.hostname.includes('cracktotal.com')) {
        return;
    }
    
    // Estrategias de cache diferentes según el tipo de recurso
    if (isNavigationRequest(request)) {
        // Para navegación: Network first con cache invalidation
        event.respondWith(networkFirstWithInvalidation(request));
    } else if (isImage(request.url)) {
        // Para imágenes: Cache first con limpieza automática
        event.respondWith(cacheFirstImages(request));
    } else if (isStaticAsset(request.url)) {
        // Para recursos estáticos: Cache first con versioning
        event.respondWith(cacheFirstWithVersioning(request));
    } else if (isDynamicAsset(request.url)) {
        // Para recursos dinámicos: Stale while revalidate
        event.respondWith(staleWhileRevalidateStrategy(request));
    } else if (isApiRequest(request.url)) {
        // Para APIs: Network first con timeout
        event.respondWith(networkFirstWithTimeout(request));
    }
});

// Estrategia Network First mejorada con invalidación y timeout
async function networkFirstWithInvalidation(request) {
    try {
        const networkResponse = await fetchWithTimeout(request, CACHE_CONFIG.networkTimeoutMs);
        
        // Si la respuesta es exitosa, cachearla con timestamp
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            const responseToCache = networkResponse.clone();
            
            // Agregar headers con metadata
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-time', Date.now().toString());
            headers.set('sw-version', APP_VERSION);
            headers.set('sw-strategy', 'network-first');
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            cache.put(request, cachedResponse);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Red no disponible o timeout, buscando en cache:', request.url);
        
        // Si falla la red, buscar en cache pero verificar si es muy antiguo
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            const cacheTime = cachedResponse.headers.get('sw-cached-time');
            const cacheVersion = cachedResponse.headers.get('sw-version');
            
            // Verificar si el cache está muy viejo
            if (cacheTime) {
                const age = Date.now() - parseInt(cacheTime);
                if (age > CACHE_CONFIG.maxStaticCacheTime) {
                    console.log('[SW] Cache muy antiguo, pero usando por falta de red');
                }
            }
            
            return cachedResponse;
        }
        
        // Si tampoco está en cache, devolver página offline
        if (isNavigationRequest(request)) {
            return caches.match('/index.html') || createOfflineResponse();
        }
        
        return createOfflineResponse();
    }
}

// Estrategia Cache First mejorada para imágenes
async function cacheFirstImages(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Verificar si la imagen no está muy vieja
        const cacheTime = cachedResponse.headers.get('sw-cached-time');
        if (cacheTime) {
            const age = Date.now() - parseInt(cacheTime);
            if (age < CACHE_CONFIG.maxStaticCacheTime) {
                return cachedResponse;
            }
        } else {
            // Si no tiene timestamp, asumir que es válida
            return cachedResponse;
        }
    }
    
    try {
        const networkResponse = await fetchWithTimeout(request, CACHE_CONFIG.networkTimeoutMs);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(IMAGE_CACHE_NAME);
            
            // Limpiar cache de imágenes si está muy lleno
            await cleanupImageCache();
            
            const responseToCache = networkResponse.clone();
            
            // Agregar headers de metadata
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-time', Date.now().toString());
            headers.set('sw-version', APP_VERSION);
            headers.set('sw-strategy', 'cache-first-images');
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            cache.put(request, cachedResponse);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Error cargando imagen, usando cache si existe:', request.url);
        return cachedResponse || createImagePlaceholder();
    }
}

// Estrategia para APIs con timeout
async function networkFirstWithTimeout(request) {
    try {
        const networkResponse = await fetchWithTimeout(request, CACHE_CONFIG.networkTimeoutMs);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(API_CACHE_NAME);
            const responseToCache = networkResponse.clone();
            
            // Para APIs, usar TTL más corto
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-time', Date.now().toString());
            headers.set('sw-ttl', CACHE_CONFIG.maxApiCacheTime.toString());
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            cache.put(request, cachedResponse);
        }
        
        return networkResponse;
    } catch (error) {
        // Para APIs, verificar TTL antes de devolver cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            const cacheTime = cachedResponse.headers.get('sw-cached-time');
            const ttl = cachedResponse.headers.get('sw-ttl');
            
            if (cacheTime && ttl) {
                const age = Date.now() - parseInt(cacheTime);
                if (age < parseInt(ttl)) {
                    return cachedResponse;
                }
            }
        }
        
        throw error; // Re-throw para que la aplicación maneje el error
    }
}

// Función para fetch con timeout
async function fetchWithTimeout(request, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(request, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Limpiar cache de imágenes cuando está muy lleno
async function cleanupImageCache() {
    try {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const requests = await cache.keys();
        
        if (requests.length > CACHE_CONFIG.maxImageCacheSize) {
            // Ordenar por tiempo de cache y eliminar las más antiguas
            const requestsWithTime = await Promise.all(
                requests.map(async (request) => {
                    const response = await cache.match(request);
                    const cacheTime = response?.headers.get('sw-cached-time');
                    return {
                        request,
                        time: cacheTime ? parseInt(cacheTime) : 0
                    };
                })
            );
            
            requestsWithTime.sort((a, b) => a.time - b.time);
            
            // Eliminar el 25% más antiguo
            const toDelete = requestsWithTime.slice(0, Math.floor(requests.length * 0.25));
            
            await Promise.all(
                toDelete.map(({ request }) => cache.delete(request))
            );
            
            console.log(`[SW] Limpieza de cache de imágenes: eliminadas ${toDelete.length} imágenes`);
        }
    } catch (error) {
        console.error('[SW] Error en limpieza de cache de imágenes:', error);
    }
}

// Crear respuesta offline
function createOfflineResponse() {
    return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
            <title>Crack Total - Offline</title>
            <style>
                body { font-family: 'Montserrat', sans-serif; text-align: center; padding: 50px; background: #121212; color: #e0e0e0; }
                .offline-icon { font-size: 4rem; margin-bottom: 20px; }
                .offline-title { font-size: 2rem; margin-bottom: 10px; }
                .offline-message { font-size: 1.2rem; opacity: 0.8; }
            </style>
        </head>
        <body>
            <div class="offline-icon">⚡</div>
            <h1 class="offline-title">Sin conexión</h1>
            <p class="offline-message">Crack Total está temporalmente fuera de línea. Verifica tu conexión a internet.</p>
        </body>
        </html>`,
        {
            status: 200,
            statusText: 'OK',
            headers: {
                'Content-Type': 'text/html'
            }
        }
    );
}

// Crear placeholder para imágenes
function createImagePlaceholder() {
    // SVG placeholder simple
    const svg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#2a2a2a"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#666" font-family="Arial">
            Imagen no disponible
        </text>
    </svg>`;
    
    return new Response(svg, {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'no-cache'
        }
    });
}

// Estrategia Cache First mejorada con versionado
async function cacheFirstWithVersioning(request) {
    const cachedResponse = await caches.match(request);
    
    // Verificar si el cache es de la versión actual
    if (cachedResponse) {
        const cacheVersion = cachedResponse.headers.get('sw-version');
        if (cacheVersion === APP_VERSION) {
            return cachedResponse;
        } else {
            console.log('[SW] Cache de versión anterior encontrado, actualizando...');
        }
    }
    
    try {
        const networkResponse = await fetchWithTimeout(request, CACHE_CONFIG.networkTimeoutMs);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            const responseToCache = networkResponse.clone();
            
            // Agregar headers de versión
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-time', Date.now().toString());
            headers.set('sw-version', APP_VERSION);
            headers.set('sw-strategy', 'cache-first-versioned');
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            cache.put(request, cachedResponse);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Error de red, usando cache disponible:', request.url);
        return cachedResponse || createOfflineResponse();
    }
}

// Estrategia Stale While Revalidate mejorada
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    // Fetch en background para actualizar cache
    const fetchPromise = fetchWithTimeout(request, CACHE_CONFIG.networkTimeoutMs)
        .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
                const cache = caches.open(DYNAMIC_CACHE_NAME);
                return cache.then(cache => {
                    const responseToCache = networkResponse.clone();
                    
                    const headers = new Headers(responseToCache.headers);
                    headers.set('sw-cached-time', Date.now().toString());
                    headers.set('sw-version', APP_VERSION);
                    headers.set('sw-strategy', 'stale-while-revalidate');
                    
                    const cachedResponse = new Response(responseToCache.body, {
                        status: responseToCache.status,
                        statusText: responseToCache.statusText,
                        headers: headers
                    });
                    
                    cache.put(request, cachedResponse);
                    return networkResponse;
                });
            }
            return networkResponse;
        })
        .catch(error => {
            console.log('[SW] Error actualizando cache en background:', error);
        });
    
    // Devolver cache inmediatamente si existe, sino esperar red
    return cachedResponse || fetchPromise;
}

// Funciones de utilidad
function isNavigationRequest(request) {
    return request.mode === 'navigate' || 
           (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function isStaticAsset(url) {
    return /\.(css|js|woff|woff2|ttf|eot)(\?.*)?$/.test(url);
}

function isDynamicAsset(url) {
    return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

function isImage(url) {
    return IMAGE_PATTERNS.some(pattern => pattern.test(url));
}

function isApiRequest(url) {
    return url.includes('/api/') || url.includes('.json');
}

// Manejo de mensajes desde la aplicación
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: APP_VERSION,
            caches: CURRENT_CACHES
        });
    } else if (event.data && event.data.type === 'CLEAR_CACHES') {
        clearAllCaches().then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

// Función para limpiar todos los caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('[SW] Todos los caches eliminados');
        return true;
    } catch (error) {
        console.error('[SW] Error eliminando caches:', error);
        return false;
    }
}

// Monitoreo de performance
self.addEventListener('fetch', event => {
    const startTime = performance.now();
    
    event.respondWith(
        event.respondWith(handleRequest(event.request))
            .then(response => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // Log performance metrics para debugging
                if (duration > 1000) { // Solo log si toma más de 1 segundo
                    console.log(`[SW] Request slow: ${event.request.url} took ${duration.toFixed(2)}ms`);
                }
                
                return response;
            })
    );
});

// Handler principal de requests
async function handleRequest(request) {
    // Esta función debería ser llamada desde el event listener principal
    // Es un placeholder para mantener la estructura
    return fetch(request);
}

console.log('[SW] Service Worker cargado exitosamente'); 
