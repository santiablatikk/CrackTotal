/**
 * PASALA CHE - Service Worker
 * Handles caching, offline support, and PWA functionality
 */

// Cache names
const CACHE_NAME = 'crack-total-cache-v2';
const ASSETS_CACHE = 'crack-total-assets-v2';

// Assets to pre-cache
const PRECACHE_ASSETS = [
  '/',
  'index.html',
  'crack-total.html',
  'portal.html',
  'game-rosco.html',
  'logros.html',
  'terms.html',
  'privacy.html',
  'blog.html',
  'cookies.html',
  'contact.html',
  'about.html',
  'css/variables.css',
  'css/styles.css',
  'css/game-styles.css',
  'css/footer-styles.css',
  'css/achievements.css',
  'css/user/dashboard-modern.css',
  'js/login.js',
  'js/game.js',
  'js/game-completion.js',
  'js/game-achievements.js',
  'js/global-footer.js',
  'js/share-buttons.js',
  'js/utils.js',
  'js/particles-config.js',
  'img/logo.png',
  'img/favicon.ico',
  'favicon.ico',
  'manifest.json'
];

// Scripts to preload
const PRELOAD_SCRIPTS = [
  '/js/main.js',
  '/js/utils.js',
  '/js/user-profile.js'
];

// Archivos de sonido (pueden ser grandes, considerarlos opcionales)
const AUDIO_ASSETS = [
  '/sounds/correct.mp3',
  '/sounds/incorrect.mp3',
  '/sounds/skip.mp3',
  '/sounds/gameover.mp3',
  '/sounds/click.mp3'
];

// Instalar el Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando v2...');
  
  // Esperar hasta que todas las promesas se completen
  event.waitUntil(
    Promise.all([
      // Caché principal (recursos críticos)
      caches.open(CACHE_NAME).then(cache => {
        console.log('[Service Worker] Precargando recursos principales...');
        // Use addAll with careful error handling for individual assets
        const promises = PRECACHE_ASSETS.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`[Service Worker] No se pudo precargar: ${asset}`, err);
          });
        });
        return Promise.all(promises);
      }),
      
      // Caché de recursos de audio (opcionales)
      caches.open('audio-cache-v1').then(cache => {
        console.log('[Service Worker] Precargando recursos de audio...');
        // Uso de Promise.allSettled para continuar incluso si algunos fallan
        return Promise.allSettled(
          AUDIO_ASSETS.map(url => cache.add(url).catch(error => {
            console.warn(`[Service Worker] Error al precargar audio: ${url}`, error);
          }))
        );
      })
    ]).then(() => {
      console.log('[Service Worker] Instalación v2 completada');
      // Forzar que el nuevo service worker tome el control inmediatamente
      return self.skipWaiting();
    }).catch(error => {
      console.error('[Service Worker] Falló la instalación:', error);
    })
  );
});

// Activar el Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando v2...');
  
  // Borrar cachés antiguas
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== ASSETS_CACHE && 
              cacheName !== 'audio-cache-v1') {
            console.log('[Service Worker] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] v2 ¡Ahora está activo!');
      // Reclamar clientes para que el service worker tome el control inmediatamente
      return self.clients.claim();
    })
  );
});

// Interceptar solicitudes de red
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorar solicitudes a la API y no-GET
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return; // Let the browser handle it
  }
  
  // Estrategia: Cache first, falling back to network
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // console.log(`[Service Worker] Sirviendo desde caché: ${event.request.url}`);
        return cachedResponse;
      }
      
      // Si no está en caché, buscar en red
      // console.log(`[Service Worker] Buscando en red: ${event.request.url}`);
      return fetch(event.request).then(networkResponse => {
        // Check if we received a valid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
             // Don't cache non-basic responses (like opaque responses from CDNs)
            return networkResponse;
        }
        
        // Clone the response to cache it
        let responseToCache = networkResponse.clone();
        
        caches.open(ASSETS_CACHE).then(cache => {
          // console.log(`[Service Worker] Cacheando nuevo recurso: ${event.request.url}`);
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      }).catch(error => {
        console.warn(`[Service Worker] Error de fetch: ${event.request.url}`, error);
        // Podrías devolver una página offline genérica aquí si es necesario
        // Por ejemplo: return caches.match('/offline.html');
        // O simplemente dejar que el navegador muestre el error
        return new Response("Network error", { status: 408, headers: { 'Content-Type': 'text/plain' } });
      });
    })
  );
});

// Escuchar mensajes de clientes (desde la aplicación)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // Forzar actualización de service worker
    self.skipWaiting();
  }
});

// Escuchar eventos push para notificaciones
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Hay nuevas noticias de CRACK TOTAL.',
      icon: '/img/icons/icon-192x192.png',
      badge: '/img/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'CRACK TOTAL', 
        options
      )
    );
  } catch (error) {
    console.error('[Service Worker] Error al procesar notificación push:', error);
  }
});

// Manejar clics en notificaciones push
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Intentar abrir una ventana existente o crear una nueva
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      // URL a abrir (de la notificación o por defecto)
      const urlToOpen = event.notification.data && event.notification.data.url 
        ? event.notification.data.url 
        : '/';
      
      // Intentar encontrar una ventana abierta para navegar
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay ventanas abiertas, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Gestión de sincronización en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'sync-profile-data') {
    console.log('[Service Worker] Evento Sync recibido:', event.tag);
    // event.waitUntil(syncData());
  }
});

// Función para sincronizar datos pendientes con el servidor
async function syncData() {
  try {
    // Comprobar si hay datos pendientes de sincronizar
    const dbPromise = await idb.openDB('pasala-che-store', 1);
    const tx = dbPromise.transaction('pending-items', 'readonly');
    const store = tx.objectStore('pending-items');
    const items = await store.getAll();
    
    if (items.length > 0) {
      // Intentar sincronizar cada elemento pendiente
      await Promise.all(items.map(async (item) => {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item)
        });
        
        if (response.ok) {
          // Si la sincronización es exitosa, eliminar de pendientes
          const deleteTx = dbPromise.transaction('pending-items', 'readwrite');
          await deleteTx.objectStore('pending-items').delete(item.id);
        }
      }));
    }
  } catch (error) {
    console.error('[Service Worker] Error al sincronizar datos:', error);
    throw error; // Para que el evento de sincronización se pueda reintentar
  }
} 
