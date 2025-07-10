// Service Worker optimizado para Crack Total
const APP_VERSION = '2.3.0'; // Updated version to force cache refresh
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
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.css'
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
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (e) => {
    self.registration.unregister()
        .then(() => {
            return self.clients.matchAll();
        })
        .then((clients) => {
            clients.forEach(client => client.navigate(client.url));
        });
});

// Interceptar peticiones de red con manejo avanzado
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Estrategia: Network First para archivos HTML y JS
    if (request.mode === 'navigate' || (request.destination === 'script')) {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match(request);
            })
        );
        return;
    }
    
    // Estrategia: Cache First para todo lo demás (CSS, imágenes, etc.)
    event.respondWith(
        caches.match(request).then((response) => {
            return response || fetch(request).then((fetchResponse) => {
                // Ignorar peticiones que no son GET
                if (fetchResponse.method !== 'GET') {
                    return;
                }
                
                // Ignorar específicamente AdSense y otras APIs externas problemáticas
                if (url.hostname.includes('googlesyndication.com') ||
                    url.hostname.includes('googletagmanager.com') ||
                    url.hostname.includes('google-analytics.com') ||
                    url.hostname.includes('doubleclick.net')) {
                    return; // Let these requests go through without SW intervention
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
                    return networkFirstWithInvalidation(request);
                } else if (isImage(request.url)) {
                    // Para imágenes: Cache first con limpieza automática
                    return cacheFirstImages(request);
                } else if (isCssFile(request.url)) {
                    // Para CSS: Network first con cache invalidation
                    return networkFirstWithInvalidation(request);
                } else if (isStaticAsset(request.url)) {
                    // Para recursos estáticos (excluyendo CSS ahora): Cache first con versioning
                    return cacheFirstWithVersioning(request);
                } else if (isDynamicAsset(request.url)) {
                    // Para recursos dinámicos: Stale while revalidate
                    return staleWhileRevalidateStrategy(request);
                } else if (isApiRequest(request.url)) {
                    // Para APIs: Network first con timeout
                    return networkFirstWithTimeout(request);
                }
            });
        })
    );
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
    try {
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
            return networkResponse;
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Error cargando imagen:', request.url);
        const cachedResponse = await caches.match(request);
        return cachedResponse || createImagePlaceholder();
    }
}

// Estrategia Network First con timeout para APIs
async function networkFirstWithTimeout(request) {
    try {
        const networkResponse = await fetchWithTimeout(request, CACHE_CONFIG.networkTimeoutMs);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(API_CACHE_NAME);
            
            // Agregar headers de metadata para APIs
            const responseToCache = networkResponse.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-time', Date.now().toString());
            headers.set('sw-version', APP_VERSION);
            headers.set('sw-strategy', 'network-first-api');
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            cache.put(request, cachedResponse);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Error en API, usando cache si está disponible:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Verificar si el cache de API no está muy viejo
            const cacheTime = cachedResponse.headers.get('sw-cached-time');
            if (cacheTime) {
                const age = Date.now() - parseInt(cacheTime);
                if (age < CACHE_CONFIG.maxApiCacheTime) {
                    return cachedResponse;
                }
            }
        }
        
        // Si no hay cache válido, crear respuesta de error controlada
        return new Response(JSON.stringify({ error: 'API no disponible' }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Función de timeout para fetch
async function fetchWithTimeout(request, timeout) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// Limpiar cache de imágenes cuando esté muy lleno
async function cleanupImageCache() {
    try {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const requests = await cache.keys();
        
        if (requests.length > CACHE_CONFIG.maxImageCacheSize) {
            console.log(`[SW] Limpiando cache de imágenes: ${requests.length} elementos`);
            
            // Ordenar por tiempo de cache y eliminar los más antiguos
            const requestsWithTime = await Promise.all(
                requests.map(async request => {
                    const response = await cache.match(request);
                    const cacheTime = response?.headers.get('sw-cached-time') || '0';
                    return { request, cacheTime: parseInt(cacheTime) };
                })
            );
            
            requestsWithTime.sort((a, b) => a.cacheTime - b.cacheTime);
            
            const toDelete = requestsWithTime.slice(0, requestsWithTime.length - CACHE_CONFIG.maxImageCacheSize);
            await Promise.all(toDelete.map(item => cache.delete(item.request)));
            
            console.log(`[SW] Eliminadas ${toDelete.length} imágenes del cache`);
        }
    } catch (error) {
        console.error('[SW] Error limpiando cache de imágenes:', error);
    }
}

// Crear respuesta offline
function createOfflineResponse() {
    return new Response(
        `<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Crack Total - Sin conexión</title>
            <style>
                body {
                    font-family: 'Montserrat', sans-serif;
                    background: linear-gradient(135deg, #1e3c72, #2a5298);
                    color: white;
                    text-align: center;
                    padding: 2rem;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                .offline-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }
                .offline-title {
                    font-size: 2rem;
                    margin-bottom: 1rem;
                }
                .offline-message {
                    font-size: 1.1rem;
                    opacity: 0.8;
                }
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
    try {
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
        const cachedResponse = await caches.match(request);
        return cachedResponse || createOfflineResponse();
    }
}

// Estrategia Stale While Revalidate mejorada
async function staleWhileRevalidateStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        
        // Fetch en background para actualizar cache
        const fetchPromise = fetchWithTimeout(request, CACHE_CONFIG.networkTimeoutMs)
            .then(async networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const cache = await caches.open(DYNAMIC_CACHE_NAME);
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
                }
                return networkResponse;
            })
            .catch(error => {
                console.log('[SW] Error actualizando cache en background:', error);
                return null;
            });
        
        // Devolver cache inmediatamente si existe, sino esperar red
        return cachedResponse || fetchPromise;
    } catch (error) {
        console.log('[SW] Error en stale while revalidate:', error);
        return fetch(request);
    }
}

// Funciones de utilidad
function isNavigationRequest(request) {
    return request.mode === 'navigate' || 
           (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'));
}

function isStaticAsset(url) {
    const path = new URL(url).pathname;
    return Array.isArray(STATIC_ASSETS) && STATIC_ASSETS.includes(path);
}

function isDynamicAsset(url) {
    const path = new URL(url).pathname;
    return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(path));
}

function isImage(url) {
    const path = new URL(url).pathname;
    return IMAGE_PATTERNS.some(pattern => pattern.test(path));
}

function isCssFile(url) {
    const path = new URL(url).pathname;
    return path.endsWith('.css');
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

console.log('Service Worker de limpieza activado. Se anulará a sí mismo.'); 
