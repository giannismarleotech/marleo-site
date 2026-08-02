/* Marleo service worker - PWA-installatie + offline fallback + rechtstreekse web-push */

var CACHE='marleo-v4';

self.addEventListener('install',function(e){ self.skipWaiting(); });

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
    }).then(function(){return self.clients.claim();})
  );
});

/* PUSH ontvangen en tonen als echte melding */
self.addEventListener('push', function(e){
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(err){ try{ data = { title:'Marleo', body: e.data.text() }; }catch(e2){ data = {}; } }
  var title = data.title || 'Marleo';
  var options = {
    body: data.body || '',
    tag: data.tag || ('marleo-'+Date.now()),
    data: { url: data.url || './?app=1' },
    requireInteraction: !!data.requireInteraction
  };
  // icoon alleen toevoegen als het expliciet is meegegeven (voorkomt 404-blokkering op iOS)
  if(data.icon){ options.icon = data.icon; }
  if(data.badge){ options.badge = data.badge; }
  e.waitUntil(self.registration.showNotification(title, options));
});

/* Klik op melding: open/focus de app */
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || './?app=1';
  e.waitUntil(
    self.clients.matchAll({type:'window', includeUncontrolled:true}).then(function(list){
      for(var i=0;i<list.length;i++){ if('focus' in list[i]) return list[i].focus(); }
      if(self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

/* network-first fetch (offline fallback) */
self.addEventListener('fetch',function(e){
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
