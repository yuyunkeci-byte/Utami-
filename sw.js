const CACHE_NAME = "bk-klasikal-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/icon.svg",
  "/manifest.json"
];

// Installation: Cache initial files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation: Clean up old versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetching: Serve from cache while fetching updates in background
self.addEventListener("fetch", (event) => {
  // Only intercept GET method requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Exclude API requests, cloud configurations, dynamic websockets or HMR modules
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.includes("socket") ||
    url.pathname.includes("hot-update") ||
    url.hostname.includes("firebase") || 
    url.hostname.includes("googleapis")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return resource from cache, but update cache silently in the background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Silently suppress background refresh failures when offline
          });
        return cachedResponse;
      }

      // If not cached, retrieve via network and cache it
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Serve single-page-app index fallback for routing directories when offline
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
    })
  );
});
