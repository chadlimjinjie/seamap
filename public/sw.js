const TILE_CACHE = 'seamap-tiles-v1';
const APP_CACHE = 'seamap-app-v1';

const TILE_HOSTS = [
  'tile.openstreetmap.org',
  'tiles.openseamap.org',
  'demotiles.maplibre.org',
];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== TILE_CACHE && k !== APP_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache map tiles with stale-while-revalidate
  if (TILE_HOSTS.some((h) => url.hostname.includes(h))) {
    event.respondWith(tileStrategy(request));
    return;
  }

  // For everything else: network first, cache fallback
  if (request.method !== 'GET') return;
  event.respondWith(networkFirst(request));
});

async function tileStrategy(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    // Serve cached tile immediately, revalidate in background
    revalidate(cache, request);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('', {
      status: 503,
      headers: { 'Content-Type': 'image/png' },
    });
  }
}

function revalidate(cache, request) {
  fetch(request)
    .then((r) => { if (r.ok) cache.put(request, r); })
    .catch(() => {});
}

async function networkFirst(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? new Response('Offline', { status: 503 });
  }
}
