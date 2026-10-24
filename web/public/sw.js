// Offline support (issue #100): precache the shell AND the deck (levels +
// per-level item files), cache hashed assets forever (immutable), and keep
// data network-first so a new deploy is picked up without a stale cache.
const VERSION = "stufe-v3";
const SHELL = ["./", "./manifest.webmanifest", "./icon.svg"];

async function precache() {
  const cache = await caches.open(VERSION);
  for (const url of SHELL) {
    await cache.add(url).catch(() => {});
  }
  // The deck: levels.json lists the per-level item files.
  try {
    const res = await fetch("./data/levels.json", { cache: "no-store" });
    if (!res.ok) return;
    await cache.put("./data/levels.json", res.clone());
    const levels = await res.json();
    const urls = levels.map((l) => `./data/items/${l.id}.json`);
    urls.push("./data/reading.json", "./data/attribution.json", "./data/conjugations.json");
    await Promise.all(urls.map((u) => cache.add(u).catch(() => {})));
  } catch {
    /* offline install: keep what we have */
  }
}

self.addEventListener("install", (e) => {
  e.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const ASSET = /\.(?:js|css|woff2?|svg|png|webp|ico)$/;

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Immutable, content-hashed build assets: cache-first.
  if (ASSET.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Navigations, data/*.json and everything else: network-first, cache fallback.
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./"))),
  );
});
