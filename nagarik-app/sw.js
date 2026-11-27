const CACHE = 'nagarik-app-v15';
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './banner1.png',
  './driving-license-cropped.png',
  './license-card.jpg',
  './nid-card.jpg',
  './pan-card.jpg',
  './passport.jpg',
  './citizenship.jpg',
  './voter-id.png',
  './cit.png',
  './ssf.jpg',
  './provident-fund.jpg',
  './qr-thin.png'
];
const REMOTE_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // Add each file separately so one failure never breaks the whole install
      var jobs = LOCAL_ASSETS.map(function (u) { return c.add(u).catch(function () {}); });
      REMOTE_ASSETS.forEach(function (u) {
        jobs.push(fetch(u, { mode: 'no-cors' }).then(function (r) { return c.put(u, r); }).catch(function () {}));
      });
      return Promise.all(jobs);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  // Network-first for pages so updates show immediately; fall back to cache offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Cache-first for everything else (ignoreSearch handles ?v=15 etc.)
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (r) {
      return r || fetch(e.request).then(function (res) {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
