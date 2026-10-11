/* CertAI service worker — dependency-free, native Cache Storage API.
   No `import` statements: files in public/ are served verbatim (never bundled),
   so bare specifiers like 'workbox-core' are unresolvable and throw
   "Cannot use import statement outside a module" at registration. */

const VERSION = 'certai-v1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const IMAGES_CACHE = `${VERSION}-images`;
const MUTATION_QUEUE = `${VERSION}-mutations`;
const OFFLINE_URL = '/offline.html';

// ---------- lifecycle ----------

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Precache only essentials; avoid over-caching during dev.
      await cache.addAll([OFFLINE_URL]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ---------- helpers ----------

const isApiRequest = (url) => url.pathname.startsWith('/api/');
const isMutation = (request) =>
  ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
// Auth, sync and upload endpoints must never be intercepted, queued or cached.
const isAuthRequest = (url) =>
  url.pathname.startsWith('/api/auth') ||
  url.pathname.startsWith('/api/sync') ||
  url.pathname.includes('/documents');
const isNextStatic = (url) =>
  url.pathname.startsWith('/_next/static') ||
  url.pathname.startsWith('/_next/image') ||
  url.pathname.startsWith('/fonts');

async function networkFirst(request, cacheName, { timeoutMs = 8000 } = {}) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetchWithTimeout(request, timeoutMs);
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || (await network) || Response.error();
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && fresh.ok) cache.put(request, fresh.clone());
  return fresh;
}

// ---------- offline mutation queue (IndexedDB) ----------
// Replays failed writes when connectivity returns, replacing the previous
// workbox BackgroundSyncPlugin, which was unreachable dead code.

const DB_NAME = 'certai-sync';
const STORE = 'mutations';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function queueMutation(entry) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(entry);
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
  });
}

async function readMutations() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteMutation(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
  });
}

async function replayQueue() {
  const pending = await readMutations();
  for (const item of pending) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      await deleteMutation(item.id);
    } catch {
      break; // still offline; retry on next sync
    }
  }
}

// ---------- fetch routing ----------

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // Auth, sync and uploads always go straight to the network. Never queue or
  // cache them: a queued login POST surfaces as a generic 401 in the browser.
  if (isAuthRequest(url)) {
    return;
  }

  // Mutations: never cached. Queue them for replay if the write fails offline.
  if (isMutation(request)) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (error) {
          const clone = request.clone();
          await queueMutation({
            url: clone.url,
            method: clone.method,
            headers: Object.fromEntries(clone.headers.entries()),
            body: await clone.text(),
          });
          await registerSync();
          return new Response(
            JSON.stringify({ queued: true, offline: true }),
            { status: 202, headers: { 'Content-Type': 'application/json' } }
          );
        }
      })()
    );
    return;
  }

  // API reads: network-only. Caching these caused the stale-dashboard bug.
  if (isApiRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation requests: network-first, fall back to the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, PAGES_CACHE).catch(async () => {
        const cache = await caches.match(OFFLINE_URL);
        return cache || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGES_CACHE));
    return;
  }

  if (request.destination === 'script' || request.destination === 'style' || isNextStatic(url)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

// ---------- sync & messaging ----------

let registering = false;
async function registerSync() {
  if (registering || !('sync' in self)) return;
  try {
    const reg = await self.registration;
    registering = true;
    await reg.sync.register('certai-mutations');
  } catch {
    // Background Sync unsupported; replay on next 'online' event instead.
  } finally {
    registering = false;
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'certai-mutations') {
    event.waitUntil(replayQueue());
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'REPLAY_QUEUE') replayQueue();
});
