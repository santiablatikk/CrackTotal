/**
 * PASALA CHE - Service Worker
 * Handles caching, offline support, and PWA functionality
 */

// Nombres de las cachés (Incrementar versión para forzar actualización)
const CACHE_VERSION = 'v1.1'; // Incrementa este número cuando cambies archivos precacheados
const CACHE_NAME = `pasala-che-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `pasala-che-dynamic-${CACHE_VERSION}`;

// Archivos a precargar en la caché principal
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/game.html',
  '/profile.html',
  '/ranking.html',
  '/logros.html', // Añadido logros.html si no estaba
  '/about.html',
  '/offline.html',
  '/css/styles.css',
  '/css/combined.css', // Añadido combined.css
  '/css/game-styles.css',
  '/css/footer-styles.css',
  '/css/pages.css',
  '/css/profile-ranking-styles.css', // Añadido profile-ranking-styles.css
  '/css/achievements.css', // Añadido achievements.css
  '/js/utils.js',
  '/js/game.js',
  '/js/profile.js',
  '/js/ranking.js',
  '/img/favicon.ico',
  '/img/icons/icon-192x192.png',
  '/img/icons/icon-512x512.png',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Oswald:wght@500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Archivos de sonido (pueden ser grandes, considerarlos opcionales)
const AUDIO_CACHE_NAME = `audio-cache-${CACHE_VERSION}`;
const AUDIO_ASSETS = [
  '/sounds/correct.mp3',
  '/sounds/incorrect.mp3',
  '/sounds/skip.mp3',
  '/sounds/gameover.mp3',
  '/sounds/click.mp3'
];

// Instalar el Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  
  // Esperar hasta que todas las promesas se completen
  event.waitUntil(
    Promise.all([
      // Caché principal (recursos críticos)
      caches.open(CACHE_NAME).then(cache => {
        console.log('[Service Worker] Precargando recursos principales...');
        return cache.addAll(PRECACHE_ASSETS);
      }),
      
      // Caché de recursos de audio (opcionales)
      caches.open(AUDIO_CACHE_NAME).then(cache => {
        console.log('[Service Worker] Precargando recursos de audio...');
        // Uso de Promise.allSettled para continuar incluso si algunos fallan
        return Promise.allSettled(
          AUDIO_ASSETS.map(url => cache.add(url).catch(error => {
            console.log(`[Service Worker] Error al precargar audio: ${url}`, error);
          }))
        );
      })
    ]).then(() => {
      console.log('[Service Worker] Instalación completada');
      // Forzar que el nuevo service worker tome el control inmediatamente
      return self.skipWaiting();
    })
  );
});

// Activar el Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  
  // Borrar TODAS las cachés antiguas que no coincidan con las actuales
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME && 
              cacheName !== AUDIO_CACHE_NAME) { // Comparar con TODOS los nombres de caché actuales
            console.log('[Service Worker] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] ¡Ahora está activo!');
      // Reclamar clientes para que el service worker tome el control inmediatamente
      return self.clients.claim();
    })
  );
});

// Interceptar solicitudes de red
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar solicitudes que no son GET o a dominios externos (excepto fuentes/CDNs)
  if (request.method !== 'GET' || 
      (url.origin !== self.location.origin && 
       !url.origin.includes('fonts.googleapis.com') && 
       !url.origin.includes('fonts.gstatic.com') && 
       !url.origin.includes('cdnjs.cloudflare.com'))) {
    // Dejar que el navegador maneje estas solicitudes
    return;
  }

  // Estrategia: Network First para HTML y JS (para obtener siempre lo último)
  if (request.headers.get('Accept').includes('text/html') || url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Si la red responde bien, guardar en caché dinámica y devolver
          if (networkResponse.ok) {
            const clonedResponse = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then(cache => {
              cache.put(request, clonedResponse);
            });
          }
          return networkResponse;
        })
        .catch(error => {
          // Si la red falla, intentar obtener de la caché
          console.log(`[Service Worker] Red falló para ${url.pathname}, intentando caché...`);
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            } else if (request.headers.get('Accept').includes('text/html')) {
              // Si es HTML y no está en caché, mostrar offline.html
              return caches.match('/offline.html');
            } else {
              // Para JS u otros, simplemente fallar si no está en caché
              return new Response('Recurso no disponible offline', {
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
              });
            }
          });
        })
    );
  } 
  // Estrategia: Cache First para otros assets (CSS, imágenes, fuentes, audio)
  else {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse; // Servir desde caché si existe
        }
        
        // Si no está en caché, ir a la red
        return fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            // Guardar la respuesta en caché dinámica para futuras solicitudes
            const clonedResponse = networkResponse.clone();
            // Determinar en qué caché guardar (audio u otros dinámicos)
            const targetCache = url.pathname.match(/\.(mp3|wav|ogg)$/) ? AUDIO_CACHE_NAME : DYNAMIC_CACHE_NAME;
            caches.open(targetCache).then(cache => {
              cache.put(request, clonedResponse);
            });
          }
          return networkResponse;
        })
        .catch(error => {
          console.log(`[Service Worker] Error de red para asset ${url.pathname}:`, error);
          // Fallback para recursos no encontrados (opcional)
          // Podríamos devolver un placeholder si tuviéramos uno
          return new Response('Recurso no disponible offline', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
    );
  }
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
      body: data.body || 'Hay nuevas noticias de PASALA CHE.',
      icon: '/img/icons/icon-192x192.png',
      badge: '/img/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'PASALA CHE', 
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
    event.waitUntil(syncData());
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