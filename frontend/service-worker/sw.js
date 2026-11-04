/* App-shell service worker.
 *
 * Built by the `appShellServiceWorker` plugin in vite.config.ts, which replaces
 * the two placeholders below with a content hash and the list of hashed build
 * files. Chat data is NOT cached here; it lives in IndexedDB (src/lib/chatStore.ts).
 *
 * Strategies:
 *   - Page navigations   -> network-first, fall back to the cached shell (offline)
 *   - Hashed /assets/*   -> cache-first (file names change on every build)
 *   - Google Fonts       -> stale-while-revalidate
 *   - /api, /health      -> not intercepted
 */

const VERSION = '__SW_VERSION__';
const PRECACHE_URLS = '__PRECACHE_MANIFEST__';

const SHELL_CACHE = `app-shell-${VERSION}`;
const RUNTIME_CACHE = 'runtime-fonts-v1';
const SHELL_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll([SHELL_URL, ...PRECACHE_URLS]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  // Drop shell caches from previous builds.
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API traffic always goes to the network; offline reads are handled by IndexedDB.
  if (url.origin === self.location.origin && (url.pathname.startsWith('/api') || url.pathname === '/health')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstShell(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirstShell(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(SHELL_URL, response.clone());
    return response;
  } catch {
    // Offline: every route in this SPA is served by the same index.html.
    const cached = await cache.match(SHELL_URL);
    return cached || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(SHELL_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      // Opaque (cross-origin, no-cors) responses have status 0 but are still usable.
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}
