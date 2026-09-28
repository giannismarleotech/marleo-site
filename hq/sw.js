/* Marleo HQ service worker: push-meldingen + offline cache */
var CACHE='marleo-hq-v3';
self.addEventListener('install',function(e){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var u=e.request.url;
  if(u.indexOf('supabase.co')>=0||u.indexOf('googleapis')>=0)return;
  e.respondWith(fetch(e.request).then(function(r){var c=r.clone();caches.open(CACHE).then(function(ca){ca.put(e.request,c).catch(function(){})});return r}).catch(function(){return caches.match(e.request).then(function(m){return m||caches.match('./')})}));
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
