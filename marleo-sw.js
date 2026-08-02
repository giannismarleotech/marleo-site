/* Marleo service worker - minimale versie voor PWA-installatie + offline fallback */
var CACHE='marleo-v1';
self.addEventListener('install',function(e){
  self.skipWaiting();
});
self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
    }).then(function(){return self.clients.claim();})
  );
});
self.addEventListener('fetch',function(e){
  // network-first: probeer live, val terug op cache (zodat de app ook offline opent)
  if(e.request.method!=='GET')return;
  e.respondWith(
    fetch(e.request).then(function(resp){
      var copy=resp.clone();
      caches.open(CACHE).then(function(c){c.put(e.request,copy).catch(function(){});});
      return resp;
    }).catch(function(){
      return caches.match(e.request).then(function(m){return m||caches.match('./');});
    })
  );
});
