/* Crack Total 7.1 — intentionally narrow offline support.
 * No authenticated requests, leaderboards, match events or API responses are cached.
 * Offline play is limited to four editorial SOLO modes; competitive play needs network.
 */
'use strict';
const VERSION='ct79-20261028-offline-7';
const PREFIX='ct7-offline-';
const CACHE=PREFIX+VERSION;
const LEGACY=/^crack-total(?:-static|-dynamic|-images|-api)?-v/i;
const OFFLINE_PAGES=new Set(['/quien-soy.html','/adivina-carrera.html','/ordena-historia.html','/conexiones.html']);
const ASSETS=[
  ...OFFLINE_PAGES,
  '/assets/js/ct7-games.js',
  '/assets/js/ct7-timeline.js',
  '/assets/js/ct71-conexiones.js',
  '/assets/data/career-challenge-verified.json',
  '/assets/data/timeline-verified.json',
  '/assets/data/conexiones-verified.json',
  '/assets/css/ct7-games.css',
  '/assets/css/ct7-timeline.css',
  '/assets/css/ct71-conexiones.css',
  '/assets/css/ct74-unified.css',
  '/assets/css/ct7-pwa.css',
  '/assets/css/design-system/tokens.css',
  '/assets/icons/ct7-app.svg',
  '/portada.ico'
];
const PATHS=new Set(ASSETS);
async function warm(){
  const cache=await caches.open(CACHE);
  await cache.addAll(ASSETS.map(p=>new Request(p,{cache:'reload'})));
}
self.addEventListener('install',event=>{
  // Installing a new version never force-takes over an active match.
  event.waitUntil(warm());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys()){
      if((key.startsWith(PREFIX)||LEGACY.test(key))&&key!==CACHE)
        await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='CT7_ACTIVATE_UPDATE')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const path=url.pathname;
  if(!PATHS.has(path))return; // No caching for home, rankings, account pages or online games.
  if(request.mode==='navigate'&&!OFFLINE_PAGES.has(path))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const fresh=await fetch(request);
      if(fresh.ok&&fresh.type==='basic')await cache.put(path,fresh.clone());
      return fresh;
    }catch(error){
      const stored=await cache.match(path);
      if(stored)return stored;
      // Never misrepresent an uncacheable online page as an offline game.
      return new Response(request.mode==='navigate'?
        '<!doctype html><html lang="es"><meta charset="utf-8"><title>Sin conexión</title><body><h1>Sin conexión</h1><p>Este juego todavía no está disponible sin Internet.</p></body></html>':
        'No disponible sin conexión',{
        status:503,headers:{'Content-Type':request.mode==='navigate'?'text/html; charset=utf-8':'text/plain; charset=utf-8','Cache-Control':'no-store'}
      });
    }
  })());
});
