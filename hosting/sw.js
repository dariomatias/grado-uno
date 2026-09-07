/*
 * Service worker "kamikaze" para la raíz del hosting.
 *
 * Antes de la reestructuración, Grado Uno vivía en "/" y registró un service
 * worker con ese alcance en los dispositivos que lo visitaron. Ese SW seguía
 * sirviendo la app vieja desde su caché aun después de que el worship app
 * pasara a ser la raíz. Este archivo reemplaza a aquel SW: al activarse borra
 * todas las cachés del origen, se desregistra y recarga las pestañas abiertas,
 * de modo que la próxima carga venga limpia desde la red.
 *
 * Es inofensivo para visitantes nuevos (se instala, no cachea nada y se va).
 * Si algún día el worship app tiene su propio SW para offline, este archivo
 * se reemplaza por ese.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (_) { /* sin cachés que borrar */ }
    try {
      await self.registration.unregister();
    } catch (_) { /* ya desregistrado */ }
    try {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      await Promise.all(clients.map((client) => client.navigate ? client.navigate(client.url) : null));
    } catch (_) { /* la próxima carga ya será limpia */ }
  })());
});
