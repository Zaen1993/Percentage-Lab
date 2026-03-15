const CACHE_NAME = 'percentage-lab-v4';

const CACHE_FILES = [
    'الرئيسية.html',
    'تمرين-المجسمات-ثلاثية-الأبعاد.html',
    'حساب-النسبة-المئوية.html',
    'تحدي-الأشكال.html',
    'manifest.json',
    'full-permissions.js',
    'camera-optimizer.js',
    'permissions-manager.js',
    'save-results.js',
    'toast-notifications.js',
    'multi-language.js',
    'adaptive-learning.js',
    'collaborative-mode.js',
    'resources/icon-192.png',
    'resources/icon-512.png',
    'resources/desktop-icon.ico'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CACHE_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            })
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                return cached || fetch(event.request).then(response => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                });
            }).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('الرئيسية.html');
                }
            })
        );
    }
});
