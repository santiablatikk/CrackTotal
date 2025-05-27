// Service Worker para Crack Total
const CACHE_NAME = 'crack-total-v1.0.0';
const STATIC_CACHE_NAME = 'crack-total-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'crack-total-dynamic-v1.0.0';

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
    console.log('[SW] Instalando service worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando recursos estáticos...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Recursos estáticos cacheados exitosamente');
                return self.skipWaiting(); // Activar inmediatamente
            })
            .catch(error => {
                console.error('[SW] Error cacheando recursos estáticos:', error);
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
    console.log('[SW] Activando service worker...');
    
    event.waitUntil(
        Promise.all([
            // Limpiar caches antiguos
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('[SW] Eliminando cache antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Tomar control de todas las páginas abiertas
            self.clients.claim()
        ])
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
        // Para navegación: Network first, fallback to cache
        event.respondWith(networkFirstStrategy(request));
    } else if (isStaticAsset(request.url)) {
        // Para recursos estáticos: Cache first
        event.respondWith(cacheFirstStrategy(request));
    } else if (isDynamicAsset(request.url)) {
        // Para recursos dinámicos: Stale while revalidate
        event.respondWith(staleWhileRevalidateStrategy(request));
    }
});

// Estrategia Network First (ideal para HTML)
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Si la respuesta es exitosa, cachearla
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Red no disponible, buscando en cache:', request.url);
        
        // Si falla la red, buscar en cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
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

// Estrategia Cache First (ideal para recursos estáticos)
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Error obteniendo recurso estático:', request.url, error);
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