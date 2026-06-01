/*
 * TaskFlow service worker — minimal, hand-written, auditable.
 *
 * Scope: app shell + static assets only, plus a branded /offline fallback.
 * It NEVER caches API responses (/api/*), auth/cookies, non-GET requests, or
 * cross-origin requests — REST stays the single source of truth, so offline
 * never shows stale board/task data as if current.
 *
 * Update strategy: bump CACHE_VERSION on each release. install() skipWaiting,
 * activate() deletes old caches and claims clients; the page registrar reloads
 * once on controllerchange so users are never stuck on a stale shell.
 */
const CACHE_VERSION = "v1";
const CACHE_NAME = `taskflow-shell-${CACHE_VERSION}`;

// Minimal precache: the offline page + the app entry. Build assets are cached
// on demand (cache-first) as they're requested.
const PRECACHE_URLS = ["/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("taskflow-shell-") && k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|svg|gif|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET. Everything else (POST, /api/*, cross-origin,
  // auth) passes straight through to the network and is never cached.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first, fall back to cache, then the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(request)
          .then((cached) => cached || caches.match("/offline")),
      ),
    );
    return;
  }

  // Static assets: cache-first, then network (and populate the cache).
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
  // Anything else: default network handling (no SW involvement).
});
