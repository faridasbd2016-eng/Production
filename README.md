# AMAZ Production v3.8.3

ফ্যাক্টরির প্রোডাকশন, স্টোর (RM/PM), FG, বিক্রয় ও কস্টিং হিসাবের সফটওয়্যার — **AMAZ ERP Solution**।

## GitHub Pages-এ রাখার নিয়ম (প্রথমবার)
1. GitHub-এ নতুন Repository খুলুন (যেমন `amaz-production`)। Private রাখতে চাইলে GitHub Pro লাগবে; না হলে Public।
2. এই ফোল্ডারের **সব ফাইল** আপলোড করুন: `index.html`, `sw.js`, `manifest.webmanifest`, `version.json`, `icon-32.png`, `icon-180.png`, `icon-192.png`, `icon-512.png`, `.nojekyll`
   (Add file → Upload files → সব ফাইল টেনে দিন → Commit changes)।
3. **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**।
4. ১-২ মিনিট পর লিংক পাবেন: `https://<username>.github.io/amaz-production/`
5. Chrome/Edge-এ লিংক খুলে ঠিকানা-বারের **Install** আইকনে ক্লিক করলে কম্পিউটার/মোবাইলে অ্যাপের মতো বসে যাবে, নেট ছাড়াও চলবে।

## নতুন ভার্সন দেওয়ার নিয়ম
1. নতুন `index.html` আপলোড করুন (পুরনোটার উপর)।
2. `version.json`-এ `"version"` বাড়িয়ে দিন (যেমন `"3.6"`) ও `"notes"`-এ কী নতুন লিখুন।
3. যারা সফটওয়্যার খোলা রেখেছে, তাদের উপরে **"নতুন ভার্সন এসেছে — এখনই আপডেট"** নোটিশ যাবে।

> `version.json`-এর ভার্সন আর `index.html`-এর ভেতরের ভার্সন (APP_VER) একই রাখুন — না হলে নোটিশ বারবার আসবে।

## ডাটা কোথায় থাকে
- প্রতিটি কম্পিউটারের ব্রাউজারে (IndexedDB) — GitHub-এ কোনো ডাটা যায় না, শুধু সফটওয়্যার ফাইল থাকে।
- একাধিক কম্পিউটারে একসাথে কাজ: **সেটিংস → ক্লাউড সিঙ্ক** (আপনার নিজের Google Drive, Apps Script দিয়ে)।
- **সেটিংস → ব্যাকআপ ও ইমপোর্ট → অটো ব্যাকআপ** চালু রাখুন।
