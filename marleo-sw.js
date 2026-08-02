/* Marleo service worker - PWA-installatie + offline fallback + rechtstreekse web-push */

var CACHE='marleo-v5';

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
  // ALTIJD eerst een melding tonen, zodat we weten dat het push-event aankomt.
  var title = 'Marleo';
  var body = '';
  var extraUrl = './?app=1';
  try {
    if(e.data){
      var raw = e.data.text();       // eerst als tekst (faalt nooit)
      body = raw;                     // toon desnoods de ruwe tekst
      try {
        var data = JSON.parse(raw);   // dan pas als JSON
        title = data.title || 'Marleo';
        body = (data.body !== undefined) ? data.body : raw;
        if(data.url) extraUrl = data.url;
      } catch(parseErr){ /* geen JSON: we tonen de ruwe tekst */ }
    } else {
      body = '(push zonder inhoud)';
    }
  } catch(readErr){
    body = '(kon push-data niet lezen: '+readErr.message+')';
  }
  var options = {
    body: body,
    tag: 'marleo-'+Date.now(),
    data: { url: extraUrl }
  };
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


/* test: toon een melding op verzoek vanuit de app (om de worker te testen) */
self.addEventListener('message', function(e){
  if(e.data && e.data.type === 'MARLEO_TEST_NOTIF'){
    self.registration.showNotification('Marleo test (lokaal)', {
      body: 'Als je dit ziet, werkt de service worker. Het probleem zit dan in de aflevering.',
      tag: 'marleo-localtest',
      data: { url: './?app=1' }
    });
  }
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
