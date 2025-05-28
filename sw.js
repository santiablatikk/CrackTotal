// Service Worker para Crack Total
const APP_VERSION = '2.0.1'; // Increment this to force cache updates
const CACHE_NAME = `crack-total-v${APP_VERSION}`;
const STATIC_CACHE_NAME = `crack-total-static-v${APP_VERSION}`;
const DYNAMIC_CACHE_NAME = `crack-total-dynamic-v${APP_VERSION}`;
const CURRENT_CACHES = [CACHE_NAME, STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];

// Recursos que se cachearán inmediatamente al instalar el SW
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/games.html',
    '/css/base.css',
    '/css/layout.css',
    '/css/landing.css',
    '/js/main.js',
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
    /\.jpg$/,
    /\.jpeg$/,
    /\.png$/,
    /\.gif$/,
    /\.webp$/,
    /\.ico$/
];

// Instalación del Service Worker
self.addEventListener('install', event => {
    console.log(`[SW] Instalando service worker versión ${APP_VERSION}...`);
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando recursos estáticos...');
                return cache.addAll(STATIC_ASSETS);
            })
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
            // Tomar control de todas las páginas abiertas
            self.clients.claim()
        ]).then(() => {
            console.log('[SW] Service Worker activado y tomó control de las páginas');
            // Notificar a todas las páginas que hay una nueva versión
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SW_UPDATED',
                        version: APP_VERSION
                    });
                });
            });
        })
    );
});

// Interceptar peticiones de red
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
        !url.hostname.includes('cdnjs.cloudflare.com')) {
        return;
    }
    
    // Estrategias de cache diferentes según el tipo de recurso
    if (isNavigationRequest(request)) {
        // Para navegación: Network first con cache invalidation
        event.respondWith(networkFirstWithInvalidation(request));
    } else if (isStaticAsset(request.url)) {
        // Para recursos estáticos: Cache first con versioning
        event.respondWith(cacheFirstWithVersioning(request));
    } else if (isDynamicAsset(request.url)) {
        // Para recursos dinámicos: Stale while revalidate
        event.respondWith(staleWhileRevalidateStrategy(request));
    }
});

// Estrategia Network First mejorada con invalidación
async function networkFirstWithInvalidation(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Si la respuesta es exitosa, cachearla con timestamp
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            const responseToCache = networkResponse.clone();
            
            // Agregar header con timestamp para control de versiones
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-time', Date.now().toString());
            headers.set('sw-version', APP_VERSION);
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            cache.put(request, cachedResponse);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Red no disponible, buscando en cache:', request.url);
        
        // Si falla la red, buscar en cache pero verificar si es muy antiguo
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            const cacheTime = cachedResponse.headers.get('sw-cached-time');
            const cacheVersion = cachedResponse.headers.get('sw-version');
            
            // Si es de una versión anterior, intentar invalidar
            if (cacheVersion && cacheVersion !== APP_VERSION) {
                console.log('[SW] Cache de versión anterior detectado, intentando actualizar...');
            }
            
            return cachedResponse;
        }
        
        // Si tampoco está en cache, devolver página offline
        if (isNavigationRequest(request)) {
            return caches.match('/index.html');
        }
        
        // Para otros recursos, crear una respuesta de error
        return new Response('Recurso no disponible offline', {
            status: 404,
            statusText: 'Not Found'
        });
    }
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
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            const responseToCache = networkResponse.clone();
            
            // Agregar headers de versión
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-time', Date.now().toString());
            headers.set('sw-version', APP_VERSION);
            
            const versionedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            cache.put(request, versionedResponse);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Error obteniendo recurso estático:', request.url, error);
        // Si hay un cache antiguo, usarlo como fallback
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('Recurso no disponible', { status: 404 });
    }
}

// Estrategia Stale While Revalidate (ideal para CSS/JS dinámico)
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Fetch from network in background
    const networkResponsePromise = fetch(request).then(response => {
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(error => {
        console.log('[SW] Error en network fetch para SWR:', request.url);
        return null;
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // If no cached version, wait for network
    return networkResponsePromise;
}

// Utilidades
function isNavigationRequest(request) {
    return request.mode === 'navigate' || 
           (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.includes(asset)) ||
           url.includes('fonts.googleapis.com') ||
           url.includes('fonts.gstatic.com') ||
           url.includes('cdnjs.cloudflare.com');
}

function isDynamicAsset(url) {
    return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Manejo de mensajes desde la aplicación principal
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_SIZE') {
        getCacheSize().then(size => {
            event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        clearAllCaches().then(() => {
            event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
        });
    }
});

// Obtener tamaño total del cache
async function getCacheSize() {
    let totalSize = 0;
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}

// Limpiar todos los caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
}

// Manejar actualizaciones del SW
self.addEventListener('updatefound', () => {
    console.log('[SW] Nueva versión del service worker encontrada');
});

console.log('[SW] Service Worker cargado exitosamente'); 
