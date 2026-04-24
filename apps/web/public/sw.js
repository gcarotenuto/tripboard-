// TripBoard Service Worker
// Handles: push notifications, basic offline caching

const CACHE_VERSION = "tb-v1";
const PRECACHE = ["/trips", "/daily", "/offline"];

// ─── Install: precache shell ───────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// ─── Activate: take control immediately ───────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: network-first for API, cache-first for assets ─────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== "GET" || url.origin !== location.origin) return;
  // Skip API calls
  if (url.pathname.startsWith("/api/")) return;

  // For navigation requests: network first, fallback gracefully
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline").then((r) => r ?? new Response("Offline", { status: 503 }))
      )
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
        return cached ?? networkFetch;
      })
    )
  );
});

// ─── Push: show notification ───────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: "TripBoard", body: event.data?.text() ?? "" };
  }

  const title = data.title ?? "TripBoard";
  const options = {
    body: data.body ?? "",
    icon: "/icon-192",
    badge: "/icon-192",
    tag: data.tag ?? "tripboard-notification",
    renotify: true,
    data: { url: data.url ?? "/trips" },
    actions: data.actions ?? [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click: open/focus the app ───────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/trips";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
