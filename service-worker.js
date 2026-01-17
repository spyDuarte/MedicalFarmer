
const CACHE_NAME = 'pericia-web-v1';
const ASSETS = [
    './',
    './index.html',
    './static/js/app.js',
    './static/js/storage.js',
    './static/css/toast.css',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.quilljs.com/1.3.6/quill.snow.css',
    'https://cdn.quilljs.com/1.3.6/quill.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
