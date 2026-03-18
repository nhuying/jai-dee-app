// Service Worker for ใจดี...กับตัวเอง PWA
const CACHE_NAME = 'jai-dee-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('📬 Service Worker: Push notification received');
  
  let data = {
    title: '🌸 ใจดี...กับตัวเอง',
    body: 'อย่าลืมบันทึกอารมณ์วันนี้นะ',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'daily-reminder',
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
    vibrate: data.vibrate,
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'เปิดแอป',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'ปิด',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise, open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync');
  
  if (event.tag === 'sync-mood') {
    event.waitUntil(syncMoodData());
  }
});

async function syncMoodData() {
  // Get pending mood data from IndexedDB or localStorage
  console.log('📤 Syncing mood data...');
  // Implementation depends on your backend
}

// Periodic background sync (for daily notifications)
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Service Worker: Periodic sync');
  
  if (event.tag === 'daily-reminder') {
    event.waitUntil(checkAndSendDailyReminder());
  }
});

async function checkAndSendDailyReminder() {
  // Check if user has logged mood today
  const hasLoggedToday = await checkMoodLogged();
  
  if (!hasLoggedToday) {
    // Send notification
    const title = '🌸 ใจดี...กับตัวเอง';
    const options = {
      body: 'วันนี้ยังไม่ได้บันทึกอารมณ์เลย มาดูแลจิตใจกันนะ 💭',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'daily-reminder',
      vibrate: [200, 100, 200],
      data: {
        url: '/?mode=mood'
      }
    };
    
    await self.registration.showNotification(title, options);
  }
}

async function checkMoodLogged() {
  // This would check localStorage or IndexedDB
  // For now, return false to always show notification
  return false;
}
