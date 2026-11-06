// sw.js — 아이폰 앱 전용 서비스 워커. 입구(iphone.html)를 열 때마다 서버에서 새로 받는다.
//   GitHub 사이트는 HTML 을 10분 동안 저장해 두게 해서(max-age=600) 새로 올려도 앱에 바로 안 보였다.
//   입구만 새로 받으면 나머지 파일은 ?v= 가 바뀌어 저절로 새로 받는다. 인터넷이 없을 때만 저장해 둔 입구를 쓴다.
const KEEP = "comet-entry";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.mode !== "navigate") return;   // 화면 이동(입구 HTML)만 맡고, 나머지는 브라우저 그대로
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: "no-store" });
      const c = await caches.open(KEEP); c.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await caches.match(req);
      if (hit) return hit;
      throw err;
    }
  })());
});
