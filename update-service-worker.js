// update-service-worker.js
const CACHE_NAME = 'percentage-lab-v4';
const API_CACHE_NAME = 'percentage-lab-api-v1';

const CACHE_VERSIONS = {
    'percentage-lab-v4': [
        'الرئيسية.html',
        'تمرين-المجسمات-ثلاثية-الأبعاد.html',
        'حساب-النسبة-المئوية.html',
        'تحدي-الأشكال.html',
        'manifest.json',
        'full-permissions.js',
        'firebase-config.js',
        'save-results.js',
        'permissions-manager.js',
        'progress-tracker.js',
        'camera-optimizer.js',
        'update-service-worker.js',
        'system-config.js',
        'data-manager.js',
        'exercise-helper.js',
        'resources/icon-192.png',
        'resources/icon-512.png',
        'resources/desktop-icon.ico'
    ]
};

const API_ENDPOINTS = [
    '/api/',
    '/api/results',
    '/api/progress',
    '/api/sync'
];

const OFFLINE_PAGES = [
    '/الرئيسية.html',
    '/تمرين-المجسمات-ثلاثية-الأبعاد.html',
    '/حساب-النسبة-المئوية.html',
    '/تحدي-الأشكال.html'
];

self.addEventListener('install', (event) => {
    console.log('🔧 Update Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching app shell');
                return cache.addAll(CACHE_VERSIONS[CACHE_NAME]);
            })
            .then(() => {
                console.log('✅ Update Service Worker installed');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Update Service Worker install failed:', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('🚀 Update Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (!CACHE_VERSIONS[cacheName]) {
                            console.log(`🗑️ Deleting old cache: ${cacheName}`);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Update Service Worker activated');
                return self.clients.claim();
            })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    
                    return fetch(event.request)
                        .then((response) => {
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }
                            
                            if (shouldCache(event.request)) {
                                const responseToCache = response.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, responseToCache);
                                    });
                            }
                            
                            return response;
                        })
                        .catch(() => {
                            if (event.request.mode === 'navigate') {
                                return caches.match('/الرئيسية.html')
                                    .then((offlineResponse) => {
                                        return offlineResponse || new Response('لا يوجد اتصال بالإنترنت');
                                    });
                            }
                            
                            return new Response('Network error', {
                                status: 408,
                                statusText: 'Network error'
                            });
                        });
                })
        );
    } else if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
        event.respondWith(handleApiRequest(event.request));
    }
});

self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data.action === 'updateCache') {
        updateCache();
    }
    
    if (event.data.action === 'clearCache') {
        clearCache();
    }
});

self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const title = data.title || 'مختبر النسبة المئوية';
    const options = {
        body: data.body || 'يوجد تحديث جديد',
        icon: data.icon || './resources/icon-192.png',
        badge: './resources/icon-192.png',
        tag: data.tag || 'update',
        data: data.url || '/الرئيسية.html',
        actions: data.actions || []
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action) {
        console.log(`Notification action clicked: ${event.action}`);
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                if (clientList.length > 0) {
                    const client = clientList[0];
                    client.focus();
                    if (event.notification.data) {
                        client.postMessage({
                            action: 'notificationClick',
                            data: event.notification.data
                        });
                    }
                } else {
                    clients.openWindow(event.notification.data || '/الرئيسية.html');
                }
            })
    );
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-results') {
        event.waitUntil(syncResults());
    }
    
    if (event.tag === 'sync-progress') {
        event.waitUntil(syncProgress());
    }
});

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-check') {
        event.waitUntil(checkForUpdates());
    }
});

async function handleApiRequest(request) {
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        updateApiCache(request);
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const clone = networkResponse.clone();
            cache.put(request, clone);
        }
        
        return networkResponse;
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: 'Network error',
                message: 'You are offline',
                timestamp: new Date().toISOString()
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

function shouldCache(request) {
    const url = new URL(request.url);
    
    const cacheableExtensions = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.ico', '.svg', '.woff', '.woff2', '.ttf'];
    const isCacheableExtension = cacheableExtensions.some(ext => url.pathname.endsWith(ext));
    
    const cacheablePaths = [
        '/الرئيسية.html',
        '/تمرين-المجسمات-ثلاثية-الأبعاد.html',
        '/حساب-النسبة-المئوية.html',
        '/تحدي-الأشكال.html',
        '/manifest.json'
    ];
    const isCacheablePath = cacheablePaths.includes(url.pathname);
    
    return isCacheableExtension || isCacheablePath;
}

async function updateCache() {
    console.log('🔄 Updating cache...');
    
    const cache = await caches.open(CACHE_NAME);
    const urlsToCache = CACHE_VERSIONS[CACHE_NAME];
    
    for (const url of urlsToCache) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                console.log(`✅ Updated: ${url}`);
            }
        } catch (error) {
            console.error(`❌ Failed to update ${url}:`, error);
        }
    }
    
    console.log('✅ Cache update complete');
    
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                action: 'cacheUpdated',
                timestamp: new Date().toISOString()
            });
        });
    });
}

async function clearCache() {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
    }
    
    console.log('🧹 All caches cleared');
    
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                action: 'cacheCleared',
                timestamp: new Date().toISOString()
            });
        });
    });
}

async function syncResults() {
    console.log('🔄 Syncing results...');
    
    try {
        const results = JSON.parse(localStorage.getItem('pending_results') || '[]');
        
        if (results.length === 0) {
            console.log('📭 No results to sync');
            return;
        }
        
        const response = await fetch('/api/sync/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: results })
        });
        
        if (response.ok) {
            localStorage.removeItem('pending_results');
            console.log(`✅ Synced ${results.length} results`);
        } else {
            console.error('❌ Sync failed:', response.status);
        }
    } catch (error) {
        console.error('❌ Sync error:', error);
    }
}

async function syncProgress() {
    console.log('🔄 Syncing progress...');
}

async function checkForUpdates() {
    console.log('🔍 Checking for updates...');
    
    try {
        const response = await fetch('/version.json', { cache: 'no-store' });
        const data = await response.json();
        
        const currentVersion = localStorage.getItem('app_version') || '1.0.0';
        
        if (data.version !== currentVersion) {
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        action: 'updateAvailable',
                        version: data.version,
                        changelog: data.changelog,
                        timestamp: new Date().toISOString()
                    });
                });
            });
            
            console.log(`🆕 Update available: ${data.version}`);
        } else {
            console.log('✅ Already up to date');
        }
    } catch (error) {
        console.error('❌ Update check failed:', error);
    }
}

self.shouldCache = shouldCache;
self.handleApiRequest = handleApiRequest;
self.updateCache = updateCache;
self.clearCache = clearCache;
self.syncResults = syncResults;
self.syncProgress = syncProgress;
self.checkForUpdates = checkForUpdates;

console.log('✅ Update Service Worker loaded');