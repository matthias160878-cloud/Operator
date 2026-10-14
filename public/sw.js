/*
 * SECRET 58 — kleiner Service Worker.
 * Zweck: verständliche Offline-Seite und installierbare App. Nicht mehr.
 * - Es werden NUR die unten aufgeführten öffentlichen Dateien zwischengespeichert.
 * - Keine Seiten, keine API-Antworten, keine Kundendaten, keine Chatverläufe im Cache.
 * - Seitenaufrufe gehen immer ins Netz; nur wenn das scheitert, erscheint /offline.html.
 * - Beim Aktivieren werden ausschließlich veraltete Caches dieser Anwendung (Präfix „secret58-“) gelöscht.
 */
const PREFIX = "secret58-";
const CACHE = PREFIX + "oeffentlich-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png", "/brand/logo-voll.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      for (const url of PRECACHE) {
        // redirect: "error" — eine Weiterleitung (z. B. auf die Anmeldeseite) darf nie als Offline-Seite gespeichert werden.
        const res = await fetch(url, { cache: "reload", redirect: "error", credentials: "omit" });
        if (!res.ok || res.redirected) {
          if (url === OFFLINE_URL) throw new Error("Offline-Seite nicht erreichbar");
          continue;
        }
        await cache.put(url, res);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Seitenaufrufe: immer live; Offline-Seite nur bei Netzfehler.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || new Response("Offline", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } })),
    );
    return;
  }
  // Nur ausdrücklich ausgewählte öffentliche Dateien aus dem Cache bedienen.
  if (PRECACHE.includes(url.pathname) && url.pathname !== OFFLINE_URL) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
  }
  // Alles andere (API, Daten, Skripte, Seiten): unverändert ans Netz, nichts speichern.
});
