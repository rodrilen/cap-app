// Service worker mínimo: no cachea nada (no hace falta uso offline para el
// MVP), solo existe para que Chrome/Android ofrezcan instalar el sitio como
// app -- eso requiere un service worker con un handler de "fetch" registrado.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
