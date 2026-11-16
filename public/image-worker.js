self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', event => {
    let req = event.request;

    if(req.method === 'GET' && req.url.includes('/images/')){
        // Not fetch(): the SPA rewrite would answer a missing image with index.html.
        event.respondWith(
            caches.match(req).then(cached => cached ?? new Response(null, { status: 404 }))
        );
    }
});
