// Ei välimuistia: kaikki haetaan aina verkosta.
// Service worker on mukana vain, jotta sovelluksen voi asentaa kotinäytölle.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});
