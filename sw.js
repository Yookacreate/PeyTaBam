const CACHE_NAME = 'peytabam-v4';
const ASSETS = [
    'manifest.json',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Vazir:wght@300;400;700;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // index.html رو همیشه از شبکه بگیر (آپدیت فوری)
    if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // کپی توی cache هم بذار برای offline
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request)) // اگه آفلاین بود از cache بده
        );
        return;
    }

    // API لیارا رو هیچوقت cache نکن
    if (url.hostname.includes('liara.run')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // بقیه فایل‌ها: اول cache، بعد شبکه
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
