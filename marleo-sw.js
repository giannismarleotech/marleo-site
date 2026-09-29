/* Oude service worker van toen de CRM in de hoofdmap stond.
   Deze versie ruimt zichzelf op: caches wissen, uitschrijven en de pagina vers herladen. */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    var keys = await caches.keys();
    await Promise.all(keys.map(function(k){ return caches.delete(k); }));
    await self.registration.unregister();
    var list = await self.clients.matchAll({ type: 'window' });
    list.forEach(function(c){ try{ c.navigate(c.url); }catch(e){} });
  })());
});
self.addEventListener('fetch', function(){ /* niets onderscheppen: alles rechtstreeks van het netwerk */ });
