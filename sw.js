/* Michi-Plan Service Worker — macht die Seite offline nutzbar */
var CACHE = 'michi-plan-v1';
var ASSETS = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      // einzeln cachen, damit ein fehlendes File die Installation nicht abbricht
      return Promise.all(ASSETS.map(function(u){
        return c.add(u).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET'){ return; }
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit){ return hit; }
      return fetch(e.request).then(function(resp){
        var copy = resp.clone();
        caches.open(CACHE).then(function(c){ try{ c.put(e.request, copy); }catch(_){} });
        return resp;
      }).catch(function(){
        // Offline und nicht im Cache -> Startseite liefern (Single-Page)
        return caches.match('./index.html');
      });
    })
  );
});
