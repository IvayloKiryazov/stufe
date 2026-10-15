/* Offline-first service worker: precache the shell + deck, cache-first for
   same-origin GETs. Bump CACHE when assets change. */
var CACHE = "stufe-v4";
var ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "icon.svg",
  "js/lib/stages.js",
  "js/lib/stats.js",
  "js/lib/projection.js",
  "js/lib/srs-core.js",
  "js/store.js",
  "js/srs.js",
  "js/tts.js",
  "js/app.js",
  "data/levels.json",
  "data/items.json",
  "data/attribution.json",
  "data/reading.json"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for everything: always serve the current deploy when online,
  // fall back to the cache (and the cached shell) when offline. This avoids
  // serving a stale app or deck after an update.
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match("index.html");
      });
    })
  );
});
