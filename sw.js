/* AMAZ Production — Service Worker
   নতুন ভার্সন GitHub-এ দিলে CACHE নাম বদলানোর দরকার নেই:
   index.html ও version.json সবসময় আগে নেট থেকে আনে (নেট না থাকলে ক্যাশ থেকে চলে)। */
const CACHE = 'amaz-production-v9';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // ক্লাউড সিঙ্ক (POST) কখনো ক্যাশ হয় না
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // Google Apps Script ইত্যাদি বাইরের লিংক ছেড়ে দাও
  if (url.pathname.endsWith('version.json')) {            // আপডেট চেক — সবসময় নেট
    e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (isPage) {                                           // পেজ: আগে নেট (নতুন ভার্সন), না পেলে ক্যাশ
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(                                          // আইকন ইত্যাদি: আগে ক্যাশ
    caches.match(req).then(r => r || fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); return res; }))
  );
});
