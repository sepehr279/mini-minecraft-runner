const CACHE = "mmr-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./player.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET") return;

  // Network-first for HTML/manifest so updates appear quickly.
  if(req.mode === "navigate" || req.url.endsWith("index.html") || req.url.endsWith("manifest.webmanifest")){
    event.respondWith(
      fetch(req, {cache:"no-store"})
        .then(res => {
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(req,copy));
          return res;
        })
        .catch(()=>caches.match(req).then(r=>r || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
      return res;
    }))
  );
});
