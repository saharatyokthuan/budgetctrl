// Service Worker สำหรับ BUDGET//CTRL+ PWA
const CACHE_NAME = 'budgetctrl-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/debts.html',
  '/budget.html',
  '/recurring.html',
  '/goals.html',
  '/settings.html',
  '/css/style.css',
  '/js/utils.js',
  '/js/db.js',
  '/js/nav.js',
  '/js/transactions.js',
  '/js/debts.js',
  '/js/budget.js',
  '/js/recurring.js',
  '/js/goals.js',
  '/js/settings.js',
  '/js/dashboard.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// ===== ติดตั้ง =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] กำลังแคชไฟล์...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ===== เปิดใช้งาน (ลบแคชเก่า) =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys.filter(key => key !== CACHE_NAME)
              .map(key => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// ===== ตอบสนองการขอไฟล์ (ใช้ Cache ก่อน) =====
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // ถ้ามีใน cache ให้ใช้
        if (cachedResponse) {
          return cachedResponse;
        }
        // ถ้าไม่มี ให้ไปโหลดจาก network
        return fetch(event.request)
          .then(response => {
            // ไม่ cache ไฟล์ที่ไม่ใช่ GET หรือมีขนาดใหญ่เกินไป
            if (!event.request.url.startsWith('http') || 
                event.request.method !== 'GET' ||
                event.request.url.includes('chrome-extension')) {
              return response;
            }
            
            // เก็บ cache เฉพาะไฟล์ที่อยู่ในโดเมนเดียวกัน
            const url = new URL(event.request.url);
            if (url.origin === location.origin) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // ถ้า offline และไม่มี cache ให้แสดงหน้า offline
            return caches.match('/index.html');
          });
      })
  );
});