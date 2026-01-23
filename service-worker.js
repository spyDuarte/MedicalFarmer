
const CACHE_NAME = 'pericia-web-v3';
const ASSETS = [
    './',
    './index.html',
    './static/js/app.js',
    './static/css/styles.css',
    './static/js/modules/storage.js',
    './static/js/modules/db.js',
    './static/js/modules/utils.js',
    './static/js/modules/router.js',
    './static/js/modules/dashboard.js',
    './static/js/modules/form.js',
    './static/js/modules/calendar.js',
    './static/js/modules/print.js',
    './static/js/modules/settings.js',
    './static/js/modules/finance.js',
    './static/js/modules/ui.js',
    './static/js/modules/macros.js',
    './static/js/modules/default_data.js',
    './static/js/cid_data.js',
    './static/css/toast.css',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.quilljs.com/1.3.6/quill.snow.css',
    'https://cdn.quilljs.com/1.3.6/quill.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    // Navigation fallback for SPA (return index.html for non-file routes)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('./index.html').then((response) => {
                return response || fetch(event.request).catch(() => caches.match('./index.html'));
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if(key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
});
