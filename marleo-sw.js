/* Marleo service worker - PWA-installatie + offline fallback + OneSignal push */

/* OneSignal push-afhandeling importeren zodat DEZE worker (op scope /) ook push doet.
   Dit lost het conflict op waarbij OneSignal geen eigen worker kon registreren op iOS. */
try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch(e) { /* offline of CDN onbereikbaar: PWA blijft werken */ }

var CACHE='marleo-v2';
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
  // OneSignal-verzoeken niet cachen (laat de push-SDK z'n werk doen)
  if(e.request.url.indexOf('onesignal')>=0 || e.request.url.indexOf('OneSignal')>=0) return;
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
