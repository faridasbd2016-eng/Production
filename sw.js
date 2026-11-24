/* AMAZ Production — Service Worker (v3.9.5)
   একবার ইন্টারনেট সহ খোলার পর ইন্টারনেট ছাড়াও সবসময় খোলে।
   - install: প্রতিটা ফাইল আলাদা করে ক্যাশে রাখে (একটা না পেলেও বাকিগুলো থাকে)
   - পেজ: আগে নেট (৩.৫ সেকেন্ড), না পেলে ক্যাশ (পুরনো ভার্সনের ক্যাশ থেকেও), কিছুই না পেলে "ইন্টারনেট নেই" পেজ
   - CDN লাইব্রেরি (PDF ইত্যাদি): আলাদা স্থায়ী ক্যাশ, ভার্সন বদলালেও মোছে না
   - Google Apps Script (ক্লাউড সিঙ্ক) ও অন্য বাইরের লিংক: কখনো ক্যাশ হয় না */
const APP = 'amaz-production';
const CACHE = APP + '-v3.9.5';
const LIBS = APP + '-libs-v1';
const SHELL = ['./index.html', './manifest.webmanifest', './icon-32.png', './icon-180.png', './icon-192.png', './icon-512.png'];
const CDN = /(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(SHELL.map(u =>
      fetch(u, { cache: 'reload' })
        .then(r => { if (r && r.ok) return c.put(u, r); })
        .catch(() => {})
    ));
    // index.html দুই key-তেই — './index.html' আর './'
    try {
      const idx = await c.match('./index.html');
      if (idx) await c.put('./', idx.clone());
    } catch (err) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    try {
      const c = await caches.open(CACHE);
      const ok = await c.match('./index.html');
      if (ok) {  // নতুন ক্যাশে index.html থাকলে তবেই এই অ্যাপের পুরনো ক্যাশ মোছো (অন্য AMAZ অ্যাপেরটা না)
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.startsWith(APP + '-') && k !== CACHE && k !== LIBS).map(k => caches.delete(k)));
      }
    } catch (err) {}
    await self.clients.claim();
  })());
});

const offlinePage = () => new Response(
  '<!DOCTYPE html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AMAZ Production — অফলাইন</title>' +
  '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f1f5f9;font-family:system-ui,"Segoe UI",sans-serif;color:#0f172a}' +
  '.b{background:#fff;padding:32px 28px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.08);text-align:center;max-width:380px;border-top:5px solid #065f46}' +
  'h1{font-size:20px;margin:0 0 10px;color:#065f46}p{margin:0 0 18px;line-height:1.6;color:#475569}' +
  'button{background:#065f46;color:#fff;border:0;border-radius:10px;padding:10px 22px;font-size:15px;font-weight:600;cursor:pointer}</style></head>' +
  '<body><div class="b"><h1>ইন্টারনেট নেই</h1><p>AMAZ Production এখনো এই ডিভাইসে সেভ হয়নি।<br>একবার ইন্টারনেট সহ খুলুন — তারপর ইন্টারনেট ছাড়াও খুলবে।</p>' +
  '<button onclick="location.reload()">আবার চেষ্টা</button></div></body></html>',
  { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
);

async function pageFromCache() {
  for (const k of ['./index.html', './', 'index.html']) {
    const r = await caches.match(k, { ignoreSearch: true });  // সব ক্যাশে খোঁজে (পুরনো ভার্সনেরটাও)
    if (r) return r;
  }
  return null;
}

async function handlePage(req) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 3500);
  try {
    const r = await fetch(req, { cache: 'no-store', signal: ctl.signal });
    clearTimeout(t);
    if (r && r.ok) {
      const c = await caches.open(CACHE);
      await c.put('./index.html', r.clone());
      await c.put('./', r.clone());
      return r;
    }
    return (await pageFromCache()) || r;
  } catch (err) {
    clearTimeout(t);
    return (await pageFromCache()) || offlinePage();
  }
}

async function handleLib(req) {
  const c = await caches.open(LIBS);
  const hit = await c.match(req);
  if (hit) return hit;
  try {
    const r = await fetch(req);
    if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()).catch(() => {});
    return r;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

async function handleAsset(req) {
  const hit = await caches.match(req, { ignoreSearch: true });
  if (hit) return hit;
  try {
    const r = await fetch(req);
    if (r && r.ok) {
      const c = await caches.open(CACHE);
      c.put(req, r.clone()).catch(() => {});
    }
    return r;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                           // ক্লাউড সিঙ্ক (POST) কখনো ক্যাশ হয় না
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    if (CDN.test(url.hostname)) e.respondWith(handleLib(req)); // PDF লাইব্রেরি ইত্যাদি
    return;                                                    // Google Apps Script ইত্যাদি ছেড়ে দাও
  }
  if (url.pathname.endsWith('version.json')) {                 // আপডেট চেক — সবসময় নেট
    e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    e.respondWith(handlePage(req));
    return;
  }
  e.respondWith(handleAsset(req));
});
