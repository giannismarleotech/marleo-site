/* Marleo HQ service worker: push-meldingen + offline cache */
var CACHE='marleo-hq-workspace-v9-research';
self.addEventListener('install',function(e){self.skipWaiting()});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(key){return key.startsWith('marleo-hq-')&&key!==CACHE}).map(function(key){return caches.delete(key)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  var request=e.request;
  if(request.method!=='GET'||!request.url.startsWith(self.registration.scope))return;
  e.respondWith(fetch(new Request(request,{cache:'no-cache'})).then(function(response){
    if(response.ok){
      var copy=response.clone();
      e.waitUntil(caches.open(CACHE).then(function(cache){return cache.put(request,copy)}).catch(function(){}));
    }
    return response;
  }).catch(function(){
    return caches.open(CACHE).then(async function(cache){
      var cached=await cache.match(request);
      if(cached)return cached;
      if(request.mode==='navigate'){
        var home=await cache.match(self.registration.scope);
        if(home)return home;
      }
      return Response.error();
    });
  }));
});
self.addEventListener('push',function(e){
  var d={title:'Marleo HQ',body:'Nieuwe melding',url:'./',tag:'marleo'};
  try{if(e.data){var j=e.data.json();d.title=j.title||d.title;d.body=j.body||d.body;d.url=j.url||d.url;d.tag=j.tag||d.tag}}catch(x){try{d.body=e.data.text()}catch(y){}}
  e.waitUntil(self.registration.showNotification(d.title,{body:d.body,tag:d.tag,icon:'./icon-192.png',badge:'./icon-192.png',data:{url:d.url},renotify:true}));
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  var url=(e.notification.data&&e.notification.data.url)||'./';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++){if(cs[i].url.indexOf('/hq/')>=0&&'focus' in cs[i]){cs[i].navigate&&cs[i].navigate(url);return cs[i].focus()}}
    return clients.openWindow(url)}));
});
self.addEventListener('pushsubscriptionchange',function(e){
  e.waitUntil(self.registration.pushManager.subscribe(e.oldSubscription?e.oldSubscription.options:{userVisibleOnly:true}).then(function(sub){
    return clients.matchAll({type:'window'}).then(function(cs){cs.forEach(function(c){c.postMessage({type:'MARLEO_RESUBSCRIBE',sub:sub.toJSON()})})})}));
});
