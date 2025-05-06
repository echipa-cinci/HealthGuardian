// HealthGuardian Service Worker
const CACHE_NAME = 'healthguardian-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/pwa-192x192.svg',
  '/icons/pwa-512x512.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine if request is for an API route
const isApiRequest = (url) => {
  return url.pathname.startsWith('/api/');
};

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests - network only with fallback
  if (isApiRequest(new URL(event.request.url))) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/offline.html') || 
                 new Response(JSON.stringify({ error: 'You are offline' }), { 
                   headers: { 'Content-Type': 'application/json' },
                   status: 503
                 });
        })
    );
    return;
  }

  // Handle page navigations - network first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(cachedResponse => {
              // Return cached page if we have it, otherwise the offline page
              return cachedResponse || caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // For all other requests - stale-while-revalidate strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Update cache with fresh content if it's a success
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail, return basic offline response
            return new Response('Network error occurred', { status: 503 });
          });

        return cachedResponse || fetchPromise;
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});