// Hors ligne : changer VERSION à chaque publication pour renouveler le cache.
const VERSION = "materiautheque-2026-10-09b";
const COQUILLE = [
  "./", "index.html", "styles.css",
  "app/parcours.js", "app/moteur.js", "app/donnees.js", "app/illustrations.js", "app/commun.js", "app/cinquieme.js", "app/classer.js",
  "data/familles.json", "data/proprietes.json", "data/materiaux.json",
  "data/procedes.json", "data/composants.json", "data/glossaire.json", "data/essais.json", "data/criteres.json", "data/objets.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Réseau d'abord (contenus à jour en classe connectée), cache en secours ; polices mises en cache au passage.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const local = new URL(e.request.url).origin === location.origin;
  e.respondWith(
    fetch(e.request, local ? { cache: "no-cache" } : {})
      .then((r) => {
        if (r.ok || r.type === "opaque") {
          const copie = r.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copie));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
